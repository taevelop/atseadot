const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

function controlElement(width = 136, height = 136) {
  const listeners = new Map(), captured = new Set(), classes = new Set(), properties = new Map();
  const element = {
    dataset: {}, disabled: false, captured, classes, properties,
    classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
    style: { setProperty: (key, value) => properties.set(key, value) },
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    querySelectorAll: () => [], setAttribute() {},
    setPointerCapture: id => captured.add(id), hasPointerCapture: id => captured.has(id),
    releasePointerCapture(id) { captured.delete(id); this.emit('lostpointercapture', { pointerId: id }); },
    addEventListener: (name, callback) => listeners.set(name, [...(listeners.get(name) || []), callback]),
    emit(name, input = {}) {
      const event = { button: 0, pointerId: 1, pointerType: 'touch', clientX: 68, clientY: 68, detail: 1, preventDefault() {}, ...input };
      for (const listener of listeners.get(name) || []) listener(event);
    }
  };
  return element;
}

test('dial has a neutral center, eight movement directions, and a clamped outer dash zone', () => {
  const app = game();
  const samples = [[30,0,'arrowright'], [30,30,'arrowright,arrowdown'], [0,30,'arrowdown'],
    [-30,30,'arrowleft,arrowdown'], [-30,0,'arrowleft'], [-30,-30,'arrowleft,arrowup'],
    [0,-30,'arrowup'], [30,-30,'arrowright,arrowup']];
  for (const [x,y,expected] of samples)
    assert.equal(app.run(`dialInput(${x},${y},60,true).keys.join(',')`), expected);
  assert.deepEqual(app.data('dialInput(5,5,60,true).keys'), []);
  assert.equal(app.run('dialInput(80,0,60,true).keys.includes("shift")'), true);
  assert.ok(Math.abs(app.run('Math.hypot(dialInput(80,80,60,true).x,dialInput(80,80,60,true).y)') - 60) < 1e-9);
});

test('dial movement selects a single menu direction and does not repeat while held still', () => {
  const app = game();
  app.run('mode="help"; helpPage=0; setDialInput(dialInput(25,35,60))');
  assert.equal(app.run('helpPage'), 1);
  app.run('setDialInput(dialInput(25,35,60))');
  assert.equal(app.run('helpPage'), 1);
  assert.equal(app.run('pressed("shift")'), false);
  app.run('releaseDial(); setDialInput(dialInput(-40,-20,60))');
  assert.equal(app.run('helpPage'), 0);
});

test('dial, boost button, and physical keyboard keep independent held states', () => {
  const app = game();
  app.run('startRun("diver"); keys.arrowup=true; touchKeys.shift=true; setDialInput(dialInput(30,0,60))');
  assert.equal(app.run('pressed("arrowright") && pressed("arrowup") && pressed("shift")'), true);
  app.run('releaseDial()');
  assert.equal(app.run('!pressed("arrowright") && pressed("arrowup") && pressed("shift")'), true);
  app.run('setDialInput(dialInput(60,0,60)); touchKeys.shift=false');
  assert.equal(app.run('pressed("shift")'), true);
  app.run('releaseTouchKeys()');
  assert.equal(app.run('!pressed("shift") && !pressed("arrowright") && pressed("arrowup")'), true);
});

test('one finger can slide between directions and unrelated pointers cannot release the dial', () => {
  const app = game(), pad = controlElement();
  app.context.testPad = pad;
  app.run('startRun("diver"); closeMsg(); initDial(testPad)');
  pad.emit('pointerdown', { pointerId: 7, clientX: 92, clientY: 92 });
  assert.equal(app.run('pressed("arrowright") && pressed("arrowdown")'), true);
  pad.emit('pointerdown', { pointerId: 8, clientX: 10 });
  pad.emit('pointerup', { pointerId: 8 });
  assert.equal(app.run('dial.pointerId'), 7);
  pad.emit('pointermove', { pointerId: 7, clientX: 10, clientY: 68 });
  assert.equal(app.run('pressed("arrowleft") && !pressed("arrowright") && !pressed("arrowdown")'), true);
  pad.emit('pointercancel', { pointerId: 7 });
  assert.equal(app.run('dial.pointerId'), null);
  assert.equal(app.run('DIRECTIONS.some(pressed) || pressed("shift")'), false);
  assert.equal(pad.captured.size, 0);
  assert.equal(pad.properties.get('--stick-x'), '0px');
});

test('rotation and page hiding release captured touch input and recenter the dial', () => {
  const app = game(), pad = controlElement();
  app.context.testPad = pad;
  app.run('startRun("diver"); initDial(testPad)');
  pad.emit('pointerdown', { clientX: 120 });
  app.resize(390, 630);
  assert.equal(app.run('DIRECTIONS.some(pressed) || pressed("shift")'), false);
  assert.equal(pad.captured.size, 0);
  pad.emit('pointerdown', { clientY: 120 });
  app.hide();
  assert.equal(app.run('DIRECTIONS.some(pressed) || pressed("shift")'), false);
  assert.equal(app.run('dial.pointerId'), null);
});

test('action fires on the second finger down without waiting for release or double-firing on click', () => {
  const app = game(), pad = controlElement(), button = controlElement();
  app.context.testPad = pad; app.context.testButton = button;
  app.run(`startRun("diver"); closeMsg(); initDial(testPad); bindPrimaryAction(testButton);
    globalThis.fish=beings.find(b=>b.K.catchable); beings=[fish];
    fish.x=player.x+DV_CX+40-fish.w/2; fish.y=player.y+16-fish.h/2;`);
  pad.emit('pointerdown', { pointerId: 1, clientX: 98 });
  button.emit('pointerdown', { pointerId: 2, isPrimary: false });
  // 작살은 쏜 자리에서 잡지 않는다. 물고기에 닿을 때까지 나아간다.
  app.run('for (let i = 0; i < 12 && mode !== "catch"; i++) stepSpear(1);');
  assert.equal(app.run('mode'), 'catch');
  assert.equal(app.run('save.caught[fish.gid]'), 1);
  button.emit('pointerdown', { pointerId: 3, isPrimary: false });
  assert.equal(app.run('mode'), 'catch', 'another finger on the held action button must not close the result');
  button.emit('pointerup', { pointerId: 2 });
  button.emit('click', { pointerId: 2 });
  assert.equal(app.run('mode'), 'catch', 'the follow-up click must not fire a second action');
  assert.equal(button.classes.has('is-pressed'), false);
  button.emit('click', { detail: 0, pointerType: '' });
  assert.equal(app.run('mode'), 'dive', 'keyboard / assistive activation still works');
});

test('disabled action cannot cast and an action pointer cancel clears its feedback', () => {
  const app = game(), button = controlElement();
  app.context.testButton = button;
  app.run('startRun("boat"); closeMsg(); bindPrimaryAction(testButton)');
  button.disabled = true;
  button.emit('pointerdown');
  assert.equal(app.run('rod.state'), 'idle');
  button.disabled = false;
  button.emit('pointerdown');
  assert.equal(app.run('rod.state'), 'out');
  button.emit('pointercancel');
  assert.equal(button.classes.has('is-pressed'), false);
});

test('focus loss releases a held action button so the next press can act again', () => {
  const app = game(), button = controlElement();
  app.context.testButton = button;
  app.run('startRun("diver"); closeMsg(); beings=[]; bindPrimaryAction(testButton)');
  button.emit('pointerdown');
  assert.ok(app.run('spear.on') > 0);
  app.emit('blur');
  assert.equal(button.classes.has('is-pressed'), false);
  assert.equal(button.captured.size, 0);
  app.run('spear.on=0');
  button.emit('pointerdown', { pointerId: 2 });
  assert.ok(app.run('spear.on') > 0);
});

test('dial and primary button finish one sale per press and release when closing a confirmation', () => {
  const app=game();
  const pad=controlElement(), button=controlElement(74,74);
  app.context.testPad=pad; app.context.testButton=button;
  app.run('startRun("diver"); closeMsg(); for(let i=0;i<3;i++)markCaught({gid:"fish3"},10); initDial(testPad); bindPrimaryAction(testButton); controlAction("aqua")');
  const press=()=>{button.emit('pointerdown',{pointerId:2});button.emit('pointerup',{pointerId:2});button.emit('click');};
  press();
  assert.equal(app.run('trade.type'),'sell');
  pad.emit('pointerdown',{pointerId:1,clientX:112});
  assert.equal(app.run('trade.quantity'),2);
  press();
  assert.equal(app.run('save.coin'),16);
  assert.equal(app.run('trade'),null);
  assert.equal(app.run('dial.pointerId'),null);
  assert.equal(pad.captured.size,0);
  press();
  app.run('controlAction("back")');
  assert.equal(app.run('trade'),null);
  assert.equal(app.run('mode'),'aqua');
  assert.equal(app.run('save.coin'),16);
});

test('touch purchase confirmation charges once and survives rotation without input sticking', () => {
  const app=game();
  const button=controlElement(74,74), pad=controlElement();
  app.context.testButton=button; app.context.testPad=pad;
  app.run('save.coin=1000; initDial(testPad); bindPrimaryAction(testButton); controlAction("shop")');
  button.emit('pointerdown'); button.emit('pointerup'); button.emit('click');
  assert.equal(app.run('trade.type'),'buy');
  pad.emit('pointerdown',{pointerId:2,clientY:20});
  app.resize(844,260);
  assert.equal(app.run('dial.pointerId'),null);
  assert.equal(app.run('trade.type'),'buy');
  button.emit('pointerdown'); button.emit('pointerdown',{pointerId:3});
  button.emit('pointerup'); button.emit('click');
  assert.equal(app.run('save.coin'),740);
  assert.equal(app.run('upLv("tank")'),1);
});
