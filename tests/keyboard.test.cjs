const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

function keyDown(app, key, options = {}) {
  const event = { key, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false,
    defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...options };
  app.emit('keydown', event);
  return event;
}
function tap(app, key, options = {}) {
  const event = keyDown(app, key, options);
  app.emit('keyup', { key });
  return event;
}
function move(key, role, fast = false) {
  const app = game();
  app.context.testRole = role;
  app.run('startRun(testRole); closeMsg(); beings=[]; chest=null; player.x=worldW()/2; player.y=seaTop+160; rod.state="out"; rod.y=seaTop+160');
  if (fast) keyDown(app, 'Shift', { shiftKey: true });
  keyDown(app, key, { shiftKey: fast });
  app.run('update(1,16.67)');
  app.emit('keyup', { key });
  return app.data('({mode,x:player.x,y:player.y,vx:player.vx,vy:player.vy,line:rod.y})');
}

test('WASD matches all arrow movements for the diver, boat, and fishing line', () => {
  for (const role of ['diver', 'boat']) {
    for (const [letter, arrow] of [['w','ArrowUp'],['a','ArrowLeft'],['s','ArrowDown'],['d','ArrowRight']])
      assert.deepEqual(move(letter, role), move(arrow, role), role + ' ' + letter);
  }
  assert.ok(move('d', 'diver').vx > 0);
  assert.ok(move('d', 'boat').vx > 0);
});

test('G toggles the guide from the title and play, while D never opens or closes it', () => {
  const app = game();
  tap(app, 'g');
  assert.equal(app.run('mode'), 'guide');
  tap(app, 'Enter');
  assert.equal(app.run('guideDetail'), true);
  tap(app, 'g');
  assert.deepEqual(app.data('({mode,guideDetail})'), {mode:'title',guideDetail:false});
  tap(app, 'Enter');
  tap(app, 'd');
  assert.equal(app.run('mode'), 'dive');
  tap(app, 'g');
  tap(app, 'z');
  tap(app, 'd');
  assert.deepEqual(app.data('({mode,guideDetail})'), {mode:'guide',guideDetail:true});
  tap(app, 'g');
  assert.deepEqual(app.data('({mode,guideDetail})'), {mode:'dive',guideDetail:false});
});

test('Space acts through dialogue for nets, casting, reeling, and strikes', () => {
  const diver = game();
  diver.run('startRun("diver"); beings=[]; chest=null');
  const dialogue = diver.data('({text:msg.text,shown:msg.shown,queue:msg.queue})');
  assert.equal(tap(diver, ' ').defaultPrevented, true);
  assert.ok(diver.run('player.net') > 0);
  assert.deepEqual(diver.data('({text:msg.text,shown:msg.shown,queue:msg.queue})'), dialogue);
  diver.run('paused=true; player.net=0');
  tap(diver, ' ');
  assert.equal(diver.run('player.net'), 0);

  const boat = game();
  boat.run('startRun("boat")');
  tap(boat, ' ');
  assert.equal(boat.run('rod.state'), 'out');
  assert.equal(boat.run('msg.shown'), 0);
  tap(boat, ' ');
  assert.equal(boat.run('rod.state'), 'idle');
  boat.run('rod.state="bite"; rod.target=beings.find(b=>b.K.catchable); rod.timer=BITE_TIME');
  tap(boat, ' ');
  assert.equal(boat.run('rod.state'), 'up');
});

test('Q and E only turn guide and help pages and never act or dismiss a catch', () => {
  const app = game({width:390,height:633});
  app.run('startRun("diver")');
  const dialogue = app.data('({text:msg.text,shown:msg.shown,queue:msg.queue})');
  tap(app, 'q'); tap(app, 'e');
  assert.equal(app.run('player.net'), 0);
  assert.deepEqual(app.data('({text:msg.text,shown:msg.shown,queue:msg.queue})'), dialogue);
  app.run('mode="catch"; catchCard={id:GUIDE[0].id}');
  tap(app, 'q'); tap(app, 'e');
  assert.equal(app.run('mode'), 'catch');
  tap(app, 'Escape');
  tap(app, 'g');
  tap(app, 'e');
  assert.ok(app.run('guideSel') > 0);
  tap(app, 'q');
  assert.equal(app.run('guideSel'), 0);
  tap(app, 'Escape');
  tap(app, 'h');
  tap(app, 'e');
  assert.equal(app.run('helpPage'), 1);
  tap(app, 'q');
  assert.equal(app.run('helpPage'), 0);
});

test('Z and Enter reveal and advance one dialogue at a time without skipping the queue', () => {
  for (const key of ['z', 'Enter']) {
    const app = game();
    app.run('startRun("diver")');
    const first = app.run('msg.text'), queued = app.run('msg.queue.length');
    tap(app, key);
    assert.equal(app.run('msgDone()'), true);
    assert.equal(app.run('msg.text'), first);
    assert.equal(app.run('msg.queue.length'), queued);
    tap(app, key);
    assert.notEqual(app.run('msg.text'), first);
    assert.equal(app.run('msg.queue.length'), queued - 1);
    assert.equal(app.run('mode'), 'dive');
    assert.equal(app.run('player.net'), 0);
  }
});

test('X and Escape close the current panel and dialogue before returning to the title', () => {
  for (const key of ['x', 'Escape']) {
    const app = game();
    app.run('startRun("diver")');
    tap(app, 'g'); tap(app, 'Enter');
    tap(app, key);
    assert.deepEqual(app.data('({mode,guideDetail})'), {mode:'guide',guideDetail:false});
    tap(app, key);
    assert.equal(app.run('mode'), 'dive');
    assert.ok(app.run('msg.lines.length') > 0);
    tap(app, key);
    assert.deepEqual(app.data('({mode,lines:msg.lines.length,queued:msg.queue.length})'), {mode:'dive',lines:0,queued:0});
    tap(app, key);
    assert.equal(app.run('mode'), 'title');

    app.run('startRun("diver")');
    tap(app, 'f'); tap(app, key);
    assert.deepEqual(app.data('({mode,bare})'), {mode:'dive',bare:false});
    assert.ok(app.run('msg.lines.length') > 0);
  }
});

test('confirmation and old aliases do not close panels; the touch close button still does', () => {
  for (const setup of ['onPress("h")', 'mode="catch"; catchCard={id:GUIDE[0].id}', 'onPress("g"); onPress("enter")']) {
    const app = game();
    app.run('startRun("diver"); ' + setup);
    const before = app.data('({mode,guideDetail,catchCard})');
    for (const key of ['d', 'z', 'Enter', ' ']) {
      tap(app, key);
      assert.deepEqual(app.data('({mode,guideDetail,catchCard})'), before, setup + ' ' + key);
    }
    app.run('controlAction("primary")');
    assert.equal(app.run('mode'), before.mode === 'guide' ? 'guide' : 'dive');
    assert.equal(app.run('guideDetail'), false);
  }
});

test('Ctrl, Alt, Meta, and composing events preserve browser shortcuts and game state', () => {
  const app = game();
  app.run('startRun("diver"); closeMsg(); globalThis.originalPopulation=beings');
  const before = app.data('({mode,paused,bare,lang,role:player.role,rod:rod.state,net:player.net,save,count:beings.length})');
  for (const modifier of ['ctrlKey','altKey','metaKey','isComposing']) {
    for (const key of ['n','p','f','g','l','d','w','ArrowUp',' ','Tab','t','b','m']) {
      const event = tap(app, key, {[modifier]:true});
      assert.equal(event.defaultPrevented, false, modifier + ' ' + key);
      assert.deepEqual(app.data('({mode,paused,bare,lang,role:player.role,rod:rod.state,net:player.net,save,count:beings.length})'), before);
      assert.equal(app.run('beings===originalPopulation'), true);
    }
  }
  app.run('update(1,16.67)');
  assert.equal(app.run('player.vx'), 0);
  assert.ok(app.run('player.vy') >= 0, 'ignored upward input must not move the diver up');
  tap(app, 'n');
  assert.equal(app.run('beings===originalPopulation'), false, 'a later plain N still works');
});

test('Shift acceleration and key release still work, and a held G toggles only once', () => {
  for (const role of ['diver','boat'])
    assert.ok(move('d',role,true).vx > move('d',role).vx);
  assert.ok(move('s','boat',true).line > move('s','boat').line);
  const app = game();
  app.run('startRun("diver"); closeMsg()');
  keyDown(app, 'g');
  keyDown(app, 'g', {repeat:true});
  assert.equal(app.run('mode'), 'guide');
  app.emit('keyup', {key:'g'});
  tap(app, 'g');
  assert.equal(app.run('mode'), 'dive');
  keyDown(app, 'd');
  app.emit('keyup', {key:'d',ctrlKey:true});
  app.run('update(1,16.67)');
  assert.equal(app.run('player.vx'), 0);
});
