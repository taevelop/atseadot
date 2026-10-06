const { test } = require('node:test');
const assert = require('node:assert/strict');
const { audioHarness } = require('./helpers/audio.cjs');
const { game } = require('./helpers/game.cjs');

test('no context or sound before a gesture; concurrent unlocks share one context and scheduler', async () => {
  const h = audioHarness();
  assert.equal(h.contexts.length, 0);
  assert.equal(h.audio.playEffect('bite'), false);
  h.audio.setScene({depth: 0});
  assert.equal(h.contexts.length, 0);
  await Promise.all([h.audio.unlock(), h.audio.unlock(), h.audio.unlock()]);
  assert.equal(h.contexts.length, 1);
  assert.equal(h.contexts[0].resumeCount, 1);
  assert.equal(h.timers.size, 1);
  assert.equal(h.audio.getState().running, true);
  await h.audio.unlock();
  assert.equal(h.timers.size, 1);
});

test('settings persist separately, validate bounds and recover from corrupt or blocked storage', async () => {
  const defaults = {muted:false, music:30, effects:50};
  for (const raw of ['{', 'null', '[]', '{"muted":false,"music":31,"effects":50}', '{"muted":"yes","music":30,"effects":50}', '{"muted":true,"music":110,"effects":50}']) {
    const h = audioHarness({raw});
    assert.deepEqual(h.data(h.audio.getSettings()), defaults);
  }
  const h = audioHarness();
  h.audio.setSettings({music:70, effects:0, muted:true});
  assert.deepEqual(JSON.parse(h.storage.get('atseadot.audio.v1')), {muted:true,music:70,effects:0});
  const reloaded = audioHarness({raw:h.storage.get('atseadot.audio.v1')});
  assert.equal(reloaded.audio.getSettings().music, 70);
  await reloaded.audio.unlock();
  assert.equal(reloaded.contexts.length, 0);
  const blocked = audioHarness({storageBlocked:true});
  assert.doesNotThrow(() => blocked.audio.setSettings({music:10}));
  await blocked.audio.unlock();
  assert.equal(blocked.audio.getState().running, true);
});

test('music and effects have independent gain buses; depth filters music and overlays duck it', async () => {
  const h = audioHarness();
  await h.audio.unlock();
  const gains = h.nodes.filter(n => n.kind === 'gain');
  const filter = h.nodes.find(n => n.kind === 'filter');
  h.audio.setScene({depth:900, overlay:true});
  assert.ok(Math.abs(gains[1].gain.value - .12) < .000001);
  assert.equal(gains[2].gain.value, .5);
  assert.ok(filter.frequency.value < 1000);
  h.audio.setSettings({music:0});
  assert.equal(gains[1].gain.value, 0);
  assert.equal(h.audio.playEffect('bite'), true);
  h.audio.setSettings({effects:0});
  assert.equal(gains[2].gain.value, 0);
  assert.equal(h.audio.playEffect('hurt'), false);
});

test('pause, mute and suspension cancel all pending voices; restoring a scene alone stays silent', async () => {
  const h = audioHarness();
  await h.audio.unlock();
  h.audio.playEffect('rare');
  h.audio.setScene({paused:true});
  assert.equal(h.timers.size, 0);
  assert.equal(h.audio.getState().voices, 0);
  assert.ok(h.nodes.filter(n => n.started !== undefined).every(n => n.ended && n.disconnected));
  await h.audio.unlock();
  assert.equal(h.audio.getState().running, false);
  h.audio.setScene({paused:false});
  assert.equal(h.audio.getState().running, false);
  await h.audio.unlock();
  assert.equal(h.timers.size, 1);
  h.audio.setSettings({muted:true});
  assert.equal(h.audio.getState().voices, 0);
  h.audio.setSettings({muted:false});
  assert.equal(h.audio.getState().running, false);
  await h.audio.unlock();
  h.audio.suspend();
  h.audio.setScene({});
  assert.equal(h.audio.getState().running, false);
  assert.equal(h.timers.size, 0);
});

test('suspending an in-flight resume cannot resurrect the scheduler or queued notes', async () => {
  const h = audioHarness({deferred:true});
  const pending = h.audio.unlock();
  h.audio.suspend();
  h.resumes.shift()();
  await pending;
  assert.equal(h.timers.size, 0);
  assert.equal(h.audio.getState().running, false);
  assert.equal(h.audio.getState().voices, 0);
  const next = h.audio.unlock();
  h.resumes.shift()();
  await next;
  assert.equal(h.timers.size, 1);
});

test('unsupported APIs, partial initialization and rejected resume remain harmless', async () => {
  for (const options of [{unsupported:true}, {fail:'constructor'}, {fail:'gain'}, {fail:'resume'}]) {
    const h = audioHarness(options);
    await h.audio.unlock();
    assert.equal(h.audio.getState().available, false);
    assert.equal(h.audio.getState().running, false);
    assert.doesNotThrow(() => {h.audio.setScene({depth:500}); h.audio.setSettings({music:50}); h.audio.suspend();});
    assert.equal(h.audio.playEffect('catch'), false);
    assert.equal(h.timers.size, 0);
  }
});

test('effects enforce cooldown and polyphony; completed nodes disconnect and browser interruptions can resume', async () => {
  const h = audioHarness();
  await h.audio.unlock();
  assert.equal(h.audio.playEffect('bite'), true);
  assert.equal(h.audio.playEffect('bite'), false);
  h.advance(.15);
  assert.equal(h.audio.playEffect('bite'), true);
  for (const name of ['rare','chest','over','catch','hurt','heal','trade','cast','spear']) h.audio.playEffect(name);
  assert.ok(h.audio.getState().voices <= 64);
  assert.ok(h.nodes.filter(n => !n.disconnected && n.connections.some(c => c === h.nodes.filter(n => n.kind === 'gain')[2])).length <= 16);
  h.advance(2);
  assert.ok(h.nodes.filter(n => n.ends !== undefined && n.ends <= 2).every(n => n.disconnected));
  h.contexts[0].state = 'interrupted';
  await h.audio.unlock();
  assert.equal(h.contexts[0].resumeCount, 2);
  assert.equal(h.timers.size, 1);
  const bubbleMix = audioHarness();
  await bubbleMix.audio.unlock();
  for(let i=1;i<=34;i++) bubbleMix.advance(i/10);
  for(const name of ['rare','chest','catch']) bubbleMix.audio.playEffect(name);
  bubbleMix.advance(3.5); // scheduled environment bubble must also respect the SFX cap
  const effectBus = bubbleMix.nodes.filter(n=>n.kind==='gain')[2];
  assert.ok(bubbleMix.nodes.filter(n=>!n.disconnected && n.connections.includes(effectBus)).length <= 16);
});

test('32 bars at 100 BPM wrap without a burst, use separate randomness, and leave bounded live voices', async () => {
  const h = audioHarness();
  await h.audio.unlock();
  for (let i = 1; i <= 768; i++) h.advance(i / 10);
  assert.equal(h.audio.getState().step, 1); // first note of the next 76.8-second loop is scheduled
  assert.ok(h.audio.getState().voices < 15);
  const tones = h.nodes.filter(n => n.kind === 'oscillator');
  const melody = tones.filter(n => n.type === 'square');
  assert.ok(melody.length > 180);
  assert.ok(Math.abs(melody.at(-1).started - melody[0].started - 76.8) < .00001);
  h.advance(120);
  assert.ok(h.audio.getState().voices < 15);
});

function spyAudio() {
  const calls = [], settings = {muted:false,music:30,effects:50};
  const audio = {getSettings:()=>({...settings}), getState:()=>({available:true}),
    setSettings(value){Object.assign(settings,value);}, setScene(value){calls.push(['scene',value]);},
    unlock(){calls.push(['unlock']);}, suspend(){calls.push(['suspend']);}, playEffect(name){calls.push(['effect',name]);}};
  return {audio, calls, effects:()=>calls.filter(c=>c[0]==='effect').map(c=>c[1])};
}

test('settings preserve an active transaction, catch, death, pause and held-input state', () => {
  const app = game();
  app.run('startRun("diver"); save.coin=1000; onPress("s"); beginTrade(); globalThis.originalTrade=trade; keys.arrowdown=true; onPress("o")');
  assert.equal(app.run('audioPanel'), true);
  assert.equal(app.run('trade===originalTrade'), true);
  assert.equal(app.run('pressed("arrowdown")'), false);
  app.run('onPress("arrowdown"); onPress("arrowright"); onPress("escape")');
  assert.equal(app.run('trade===originalTrade'), true);
  assert.equal(app.run('audio.getSettings().music'), 40);
  assert.equal(app.run('mode'), 'shop');
  for (const mode of ['catch','over','dive']) {
    app.context.testMode = mode;
    app.run('mode=testMode; paused=true; controlAction("audio"); controlAction("back")');
    assert.equal(app.run('mode'), mode);
    assert.equal(app.run('paused'), true);
  }
  app.run('mode="dive"; paused=false; onPress("o"); globalThis.startX=player.x; keys.arrowright=true; update(10,166.7)');
  assert.equal(app.run('player.x===startX'), true);
});

test('mute shortcut works during trade and death but ignores modifiers, composing and repeated keydown', () => {
  const app = game();
  app.run('mode="over"');
  const event = {key:'u', preventDefault(){}};
  app.emit('keydown', {...event, ctrlKey:true});
  app.emit('keydown', {...event, isComposing:true});
  assert.equal(app.run('audio.getSettings().muted'), false);
  app.emit('keydown', event);
  app.emit('keydown', {...event, repeat:true});
  assert.equal(app.run('audio.getSettings().muted'), true);
  app.emit('keyup', {key:'u'});
  app.emit('keydown', event);
  assert.equal(app.run('audio.getSettings().muted'), false);
  app.emit('keyup', {key:'u'});
  app.emit('keydown', {...event, target:{closest:()=>true}});
  assert.equal(app.run('audio.getSettings().muted'), true);
  app.emit('keydown', {key:'o', target:{closest:()=>true}, preventDefault(){}});
  assert.equal(app.run('audioPanel'), true);
});

test('real actions emit effects once; rejected spears, healing and damage remain quiet', () => {
  const spy = spyAudio(), app = game({audio:spy.audio});
  app.run('startRun("diver"); fireSpear(); fireSpear(); player.hp=heartMax(); healPlayer(2); player.invulnerable=0; hurtPlayer(1); hurtPlayer(1)');
  assert.deepEqual(spy.effects(), ['spear','hurt']);
  app.run('player.invulnerable=0; player.hp=1; hurtPlayer(1)');
  assert.equal(spy.effects().at(-1), 'over');
  app.run('startRun("boat"); rodAction(); rodAction(); rod.state="reel"; rodAction()');
  assert.deepEqual(spy.effects().slice(-2), ['cast','reel']);
  app.run('startRun("diver"); player.hp=heartMax()-2; healPlayer(2); openChest(); openChest(); caught(beings.find(b=>b.K.catchable)); mode="dive"; const rareFish=beings.find(b=>b.K.catchable); rareFish.rare=true; caught(rareFish)');
  assert.deepEqual(spy.effects().slice(-4), ['heal','chest','catch','rare']);
});

test('fishing emits bite only at the transition and transactions distinguish success and failure', () => {
  const spy = spyAudio(), app = game({audio:spy.audio});
  app.run('startRun("boat"); closeMsg(); rod.state="out"; rod.x=player.x+ROD_TIP.x; rod.y=seaTop+100; const fish=beings.find(b=>b.K.catchable); beings=[fish]; fish.x=rod.x-fish.w/2; fish.y=rod.y-fish.h/2; fish.pause=0; stepBoat(1,false); stepBoat(1,false)');
  assert.deepEqual(spy.effects(), ['bite']);
  app.run('onPress("s"); beginTrade(); save.coin=1000; beginTrade(); finishTrade(); beginTrade(); save.coin=0; finishTrade()');
  assert.ok(spy.effects().includes('trade'));
  assert.equal(spy.effects().at(-1), 'error');
  const count = spy.effects().length;
  app.run('finishTrade()');
  assert.equal(spy.effects().length, count);
});

test('navigation sounds require an actual change; hide and blur suspend until another input', () => {
  const spy = spyAudio(), app = game({audio:spy.audio});
  app.run('onPress("unused"); onPress("arrowdown"); onPress("enter"); onPress("g"); onPress("escape")');
  assert.deepEqual(spy.effects(), ['move','confirm','confirm','cancel']);
  app.hide(); app.show(); app.emit('blur',{});
  assert.equal(spy.calls.filter(c=>c[0]==='suspend').length, 2);
  const before = spy.calls.filter(c=>c[0]==='unlock').length;
  app.run('loop(100)');
  assert.equal(spy.calls.filter(c=>c[0]==='unlock').length, before);
  app.emit('keydown',{key:'ArrowRight',preventDefault(){}});
  assert.ok(spy.calls.filter(c=>c[0]==='unlock').length > before);
  app.run('mode="title"; paused=true; returnMode="dive"; syncAudioScene()');
  assert.equal(spy.calls.filter(c=>c[0]==='scene').at(-1)[1].paused, false);
});

test('localized settings fit portrait, landscape and Retina; pointer plus/minus clamp at 0 and 100', () => {
  for (const [width,height,ratio] of [[320,411,2],[402,645,3],[844,271,1],[844,155,1],[1258,622,1]]) {
    const app = game({width,height,pixelRatio:ratio});
    for (const language of ['ko','en']) {
      app.context.language = language;
      app.run('setLang(language); audioPanel=true; render()');
      const L = app.data('audioLayout()'), screen = app.data('({w:UW,h:UH,scale:UI_PIXEL_SCALE})');
      assert.ok(L.x>=0 && L.y>=0 && L.x+L.w<=screen.w && L.y+L.h<=screen.h);
      assert.ok(L.rows.every(row => row.h * screen.scale / ratio >= 44));
      assert.ok(L.rows.every(row => row.plus.w * screen.scale / ratio >= 44));
      assert.ok(app.run('audioLayout().rows.slice(0,3).every((row,i)=>wrapLines(T("audio."+["mute","music","effects"][i]),row.w-(i===0?88:row.controlsW+8)).length*lineH()<=row.h)'));
      for (let i=0;i<12;i++) app.click(L.rows[1].plus);
      assert.equal(app.run('audio.getSettings().music'),100);
      for (let i=0;i<12;i++) app.click(L.rows[1].minus);
      assert.equal(app.run('audio.getSettings().music'),0);
      app.click(L.rows[3]);
      assert.equal(app.run('audioPanel'),false);
    }
  }
});
