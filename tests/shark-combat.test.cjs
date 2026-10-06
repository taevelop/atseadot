const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');
const { audioHarness } = require('./helpers/audio.cjs');

function combat(options = {}) {
  const effects = [], scenes = [];
  const audio = { unlock() {}, suspend() {}, playEffect(name) { effects.push(name); },
    setScene(scene) { scenes.push(scene); }, getSettings() { return {muted:false,music:30,effects:50}; },
    setSettings() {} };
  const app = game({ ...options, audio });
  app.run(`startRun("diver"); closeMsg(); beings=[]; player.x=worldW()/2; player.y=seaTop+200;
    globalThis.target=new Being("shark"); target.aggressive=false; target.hp=target.maxHp=30;
    target.x=player.x+DV_CX+60; target.y=player.y+DV_CY-target.h/2; beings=[target];`);
  effects.length = 0;
  return { ...app, effects, scenes };
}

test('depth controls shark health independently of aggression and rarity; starts are safe', () => {
  const app = combat();
  assert.deepEqual(app.data(`[.05,.45,.85].map(depth=>new Being("shark",{y:seaTop+(seaBed-seaTop)*depth}).maxHp)`), [30,60,90]);
  app.run('Math.random=()=>0; startRun("diver"); closeMsg()');
  assert.equal(app.run('beings.filter(b=>b.kind==="shark"&&sharkDistance(b)<140).every(b=>!b.aggressive)'),true);
  assert.equal(app.run('beings.filter(b=>b.kind==="shark").every(b=>b.rare&&b.aggressive=== (sharkDistance(b)>=140))'),true);
});

test('weapon purchases enforce prices, tiers, funds and only line upgrades change range', () => {
  const app = combat();
  app.run('save.coin=2550');
  for (const damage of [10,20,30]) {
    assert.equal(app.run('buyUpgrade("weapon")'),true);
    assert.equal(app.run('weaponStats().damage'),damage);
  }
  assert.equal(app.run('save.coin'),0);
  assert.equal(app.run('buyUpgrade("weapon")'),false);
  assert.equal(app.run('SPEAR_RANGE+rangeAdd()'),92);
  app.run('save.up.line=15');
  assert.equal(app.run('SPEAR_RANGE+rangeAdd()'),app.run('upgradeValue("line",15)'));
  const poor = combat();
  assert.equal(poor.run('buyUpgrade("weapon")'),false);
});

test('base spear blocks damage but triggers retaliation; passive sharks otherwise patrol', () => {
  const app = combat();
  app.run('target.step(1)');
  assert.equal(app.run('target.state'),'patrol');
  app.run('hitShark(target,0)');
  assert.equal(app.run('target.hp'),30);
  assert.equal(app.run('target.hostile'),true);
  assert.deepEqual(app.effects,['sharkAlert','sharkBlock']);
  app.run('target.step(1)');
  assert.equal(app.run('target.state'),'warn');
});

test('all weapons require the specified hit counts; fatal hits reward once without a hit sound', () => {
  for (const [level, hp, hits] of [[1,30,3],[1,60,6],[1,90,9],[2,30,2],[2,60,3],[2,90,5],[3,30,1],[3,60,2],[3,90,3]]) {
    const app = combat();
    app.run(`save.up.weapon=${level}; target.hp=target.maxHp=${hp}`);
    for(let i=1;i<=hits;i++) {
      app.run('hitShark(target,weaponStats().damage)');
      assert.equal(app.run('mode'), i===hits?'catch':'dive');
    }
    assert.equal(app.run('save.caught.shark'),1);
    assert.equal(app.run('save.hold.shark'),1);
    assert.equal(app.run('save.coin'),0);
    assert.equal(app.run('beings.includes(target)'),false);
    assert.equal(app.effects.filter(n=>n==='sharkHit').length,hits-1);
    assert.equal(app.effects.filter(n=>n==='sharkKill').length,1);
    assert.equal(app.effects.includes('catch'),false);
    app.run('caught(target); hitShark(target,30)');
    assert.equal(app.run('save.caught.shark'),1);
    assert.equal(app.run('sellFish("shark",false,1)'),true);
    assert.equal(app.run('save.coin'),150);
  }
});

test('spear snapshots stats, returns after hitting and enforces cooldown without duplicate sound', () => {
  const app = combat();
  app.run('save.up.weapon=1; fireSpear(); save.up.weapon=3; fireSpear(); spear.x=target.cx(); spear.y=target.cy(); spearHit()');
  assert.equal(app.run('target.hp'),20);
  assert.equal(app.run('spear.weapon.speed'),4.4);
  assert.equal(app.effects.filter(n=>n==='spear1').length,1);
  app.run('spear.back=1; spear.x=player.x+DV_CX+spear.dir*10; spear.y=player.y+16; stepSpear(1); fireSpear()');
  assert.equal(app.run('spear.on'),0);
  assert.equal(app.run('spear.cooldown'),12);
  app.run('stepSpear(12); fireSpear()');
  assert.equal(app.run('spear.weapon.damage'),30);
  assert.equal(app.effects.at(-1),'spear3');
});

test('aggression transitions once through warning, fixed-direction dash and recovery', () => {
  const app = combat();
  app.run('target.aggressive=true; target.step(1)');
  assert.equal(app.run('target.state'),'warn');
  assert.deepEqual(app.effects,['sharkAlert','sharkWarn']);
  app.run('target.step(41)');
  assert.equal(app.run('target.state'),'warn');
  app.run('target.step(1)');
  assert.equal(app.run('target.state'),'dash');
  const direction = app.data('[target.dashX,target.dashY]');
  app.run('player.x+=300; target.step(10)');
  assert.deepEqual(app.data('[target.dashX,target.dashY]'),direction);
  app.run('target.step(26)');
  assert.equal(app.run('target.state'),'recover');
  app.run('target.step(71)');
  assert.equal(app.run('target.state'),'recover');
  app.run('target.step(1)');
  assert.equal(app.run('target.state'),'chase');
  assert.equal(app.effects.filter(n=>n==='sharkDash').length,1);
});

test('two attack slots bound a crowd and waiting retaliators take a released slot', () => {
  const app = combat();
  app.run(`beings=Array.from({length:3},()=>{const b=new Being("shark");b.aggressive=false;b.x=target.x;b.y=target.y;return b;});
    for(const b of beings)hitShark(b,0);`);
  assert.equal(app.run('beings.filter(b=>b.state!=="patrol").length'),2);
  assert.equal(app.run('beings[2].hostile'),true);
  app.run('releaseShark(beings[0]); beings[2].step(1)');
  assert.notEqual(app.run('beings[2].state'),'patrol');
  assert.equal(app.run('beings.filter(b=>b.state!=="patrol").length'),2);
});

test('distance disengages after three seconds, boat immediately disengages, and healing waits eight seconds', () => {
  const app = combat();
  app.run('hitShark(target,10); target.x=player.x+DV_CX+1000; target.step(179)');
  assert.equal(app.run('target.hostile'),true);
  app.run('target.step(1)');
  assert.equal(app.run('target.state'),'patrol');
  app.run('target.step(478)');
  assert.equal(app.run('target.hp'),20);
  app.run('target.step(61)');
  assert.equal(app.run('target.hp'),30);
  app.run('hitShark(target,10); swapRole()');
  assert.equal(app.run('target.hostile'),false);
  assert.equal(app.run('target.hp'),20);
  app.run('target.reenter()');
  assert.equal(app.run('target.hp'),20);
});

test('contact costs half a heart, dash costs one, and a dash cannot damage again after protection expires', () => {
  for(const state of ['patrol','dash']) {
    const app = combat();
    app.run(`target.state="${state}"; target.step=()=>{}; target.x=player.x+DV_CX-target.w/2; target.y=player.y+DV_CY-target.h/2;
      player.invulnerable=0; stepBeings(0);`);
    assert.equal(app.run('player.hp'),state==='dash'?8:9);
    app.run('stepBeings(1)');
    assert.equal(app.run('player.hp'),state==='dash'?8:9);
    if(state==='dash') {
      app.run('player.invulnerable=0; stepBeings(1); target.state="recover"; stepBeings(1)');
      assert.equal(app.run('player.hp'),8);
    }
  }
});

test('overlays, pauses and page hiding freeze combat, regeneration, spear and music-release time', () => {
  const app = combat();
  app.run('hitShark(target,10); target.step(1); fireSpear(); audioCombatRemaining=90');
  const snapshot = () => app.data('[target.hp,target.stateTime,target.x,spear.x,spear.cooldown,audioCombatRemaining]');
  const before = snapshot();
  for(const mode of ['shop','guide','catch','bag','reward']) {
    app.run(`mode="${mode}"; update(60,1000)`);
    assert.deepEqual(snapshot(),before);
  }
  app.run('mode="dive"; paused=true; update(60,1000); paused=false; audioPanel=true; update(60,1000); audioPanel=false');
  app.hide(); app.run('update(60,1000)'); app.show();
  assert.deepEqual(snapshot(),before);
  app.run('mode="over"; update(60,1000)');
  assert.deepEqual(snapshot(),before);
});

test('rare observations never create stock; rare hunts survive sale and reload separately', () => {
  const app = combat();
  app.run('target.rare=true; target.x=camX+SW/2-target.w/2; target.y=cam+SH/2-target.h/2; stepBeings(0)');
  assert.equal(app.run('save.rare.shark'),1);
  assert.equal(app.run('save.sharkRareCaught'),0);
  assert.equal(app.run('sellFish("shark",true,1)'),false);
  app.run('hitShark(target,30); flushSave()');
  assert.equal(app.run('save.rare.shark'),1);
  assert.equal(app.run('save.sharkRareCaught'),1);
  assert.equal(app.effects.filter(n=>n==='sharkRareKill').length,1);
  const loaded = game({raw:app.storage.get('atseadot.v4')});
  assert.equal(loaded.run('save.holdR.shark'),1);
  loaded.run('sellFish("shark",true,1); flushSave()');
  const sold = game({raw:loaded.storage.get('atseadot.v4')});
  assert.equal(sold.run('save.holdR.shark||0'),0);
  assert.equal(sold.run('save.coin'),450);
  assert.equal(sold.run('save.sharkRareCaught'),1);
});

test('legacy max-line ownership grants one weapon once and preserves mixed observation stock', () => {
  const app = game({raw:JSON.stringify({economyVersion:1,up:{line:15},coin:321,caught:{shark:4},rare:{shark:20},hold:{shark:2},holdR:{shark:1}})});
  assert.deepEqual(app.data('[save.up.weapon,save.up.line,save.coin,save.hold.shark,save.holdR.shark,save.sharkRareCaught]'),[1,15,321,2,1,1]);
  app.run('save.up.weapon=0; flushSave()');
  const again = game({raw:app.storage.get('atseadot.v4')});
  assert.equal(again.run('save.up.weapon||0'),0);
  assert.equal(again.run('save.rare.shark'),20);
  const invalid = game({raw:JSON.stringify({combatVersion:1,up:{weapon:99},caught:{shark:2},sharkRareCaught:99,holdR:{shark:99}})});
  assert.equal(invalid.run('upLv("weapon")'),3);
  assert.equal(invalid.run('save.sharkRareCaught'),2);
});

test('real shop confirmation emits only a weapon-upgrade effect and cancels without mutation', () => {
  const app = combat();
  app.run('save.coin=300; openOverlay("shop"); tradeSel=commerceItems().findIndex(i=>i.id==="weapon"); onPress("enter"); onPress("escape")');
  assert.equal(app.run('save.coin'),300);
  app.effects.length=0;
  app.run('onPress("enter"); onPress("enter")');
  assert.equal(app.run('upLv("weapon")'),1);
  assert.equal(app.run('save.coin'),0);
  assert.deepEqual(app.effects.filter(n=>n==='trade'||n==='weaponUpgrade'),['weaponUpgrade']);
});

test('combat music follows engagement, holds for two seconds and gives precedence to existing scenes', async () => {
  const app = combat();
  app.run('syncAudioScene()');
  assert.equal(app.scenes.at(-1).combat,false);
  app.run('hitShark(target,10); syncAudioScene()');
  assert.equal(app.scenes.at(-1).combat,true);
  app.run('beings=[]; update(119,1983); syncAudioScene()');
  assert.equal(app.scenes.at(-1).combat,true);
  app.run('update(1,17); syncAudioScene()');
  assert.equal(app.scenes.at(-1).combat,false);
  const h = audioHarness(); await h.audio.unlock();
  h.audio.setSettings({effects:0});
  const beat = h.audio.getState().step;
  for(const [scene,expected] of [[{combat:true,encounter:'sub'},'combat'],[{combat:true,encounter:'mega'},'mega'],[{combat:true,encounter:'mega',damaged:true},'damage'],[{},'normal']]) {
    h.audio.setScene(scene);
    assert.equal(h.audio.getState().variation,expected);
    assert.equal(h.audio.getState().step,beat);
  }
  h.audio.setScene({combat:true});
  assert.ok(Math.abs(h.nodes.filter(n=>n.kind==='gain')[1].gain.value-.24)<.00001);
});

test('new synthesized effects obey warning cooldown, voice limits, mute and suspension', async () => {
  const h = audioHarness(); await h.audio.unlock();
  assert.equal(h.audio.playEffect('sharkWarn'),true);
  h.advance(.2);
  assert.equal(h.audio.playEffect('sharkWarn'),false);
  h.advance(.26);
  assert.equal(h.audio.playEffect('sharkWarn'),true);
  for(const name of ['spear1','spear2','spear3','sharkHit','sharkBlock','sharkAlert','sharkDash','sharkKill','sharkRareKill','weaponUpgrade']) {
    h.advance(h.contexts[0].currentTime+2);
    assert.equal(h.audio.playEffect(name),true,name);
  }
  for(let i=0;i<100;i++)h.audio.playEffect('sharkHit');
  assert.ok(h.audio.getState().voices<=64);
  h.audio.setSettings({muted:true});
  assert.equal(h.audio.getState().voices,0);
  assert.equal(h.audio.playEffect('sharkAlert'),false);
  h.audio.setSettings({muted:false}); await h.audio.unlock(); h.audio.suspend();
  assert.equal(h.audio.playEffect('sharkWarn'),false);
  assert.equal(h.timers.size,0);
});
