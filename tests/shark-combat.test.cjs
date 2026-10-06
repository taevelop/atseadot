const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');
const { audioHarness } = require('./helpers/audio.cjs');

function encounter(options) {
  const app = game(options);
  app.run(`startRun("diver"); closeMsg(); chest=null; player.x=worldW()/2; player.y=seaTop+150;
    globalThis.enemy=new Being("shark");
    enemy.x=player.x+DV_CX+150-enemy.w/2; enemy.y=player.y+DV_CY-enemy.h/2;
    beings=[enemy]; camX=player.x-SW/2; cam=player.y-SH/2;`);
  return app;
}
function shoot(app) {
  app.run(`enemy.step=()=>{}; enemy.x=player.x+DV_CX+60-enemy.w/2;
    enemy.y=player.y+16-enemy.h/2; controlAction("primary");
    for(let n=0;n<100 && spear.on;n++) stepSpear(1);`);
}

test('shark chases, warns, commits to a dodgeable dash and recovers', () => {
  const app=encounter();
  app.run('enemy.step(1)');
  assert.equal(app.run('enemy.combat.state'),'chase');
  app.run('enemy.x=player.x+DV_CX+80-enemy.w/2;enemy.step(1)');
  assert.equal(app.run('enemy.combat.state'),'warn');
  const position=app.data('({x:enemy.x,y:enemy.y})');
  app.run('enemy.step(41)');
  assert.deepEqual(app.data('({x:enemy.x,y:enemy.y})'),position);
  app.run('enemy.step(1)');
  assert.equal(app.run('enemy.combat.state'),'dash');
  app.run('player.y+=100;enemy.step(30)');
  assert.equal(app.run('enemy.y'),position.y,'dash never homes after launch');
  assert.equal(app.run('enemy.combat.state'),'recover');
  app.run('enemy.step(90)');
  assert.equal(app.run('enemy.combat.state'),'roam');
});

test('distant divers and fishing boats do not initiate combat', () => {
  const app=encounter();
  app.run('enemy.x+=400;enemy.step(1)');
  assert.equal(app.run('enemy.combat.state'),'roam');
  app.run('enemy.x=player.x+DV_CX-enemy.w/2;player.role="boat";enemy.step(1)');
  assert.equal(app.run('enemy.combat.state'),'roam');
});

test('pause, menus, audio settings and hidden tabs freeze combat and health', () => {
  const app=encounter();app.run('enemy.step(1)');
  for(const setup of ['paused=true','audioPanel=true','mode="guide"','document.visibilityState="hidden"']) {
    app.run('paused=false;audioPanel=false;mode="dive";document.visibilityState="visible";'+setup);
    const before=app.data('({c:enemy.combat,x:enemy.x,y:enemy.y,hp:player.hp})');
    app.run('update(60,1000)');
    assert.deepEqual(app.data('({c:enemy.combat,x:enemy.x,y:enemy.y,hp:player.hp})'),before);
  }
});

test('line level 14 cannot damage sharks; level 15 needs three real spear trips', () => {
  const app=encounter();app.run('save.up.line=14');shoot(app);
  assert.equal(app.run('enemy.combat.hp'),3);
  assert.equal(app.run('save.hold.shark || 0'),0);
  app.run('save.up.line=15');shoot(app);
  assert.equal(app.run('enemy.combat.hp'),2);
  assert.equal(app.run('save.hold.shark || 0'),0);
  shoot(app);assert.equal(app.run('enemy.combat.hp'),1);
  shoot(app);assert.equal(app.run('mode'),'catch');
  assert.equal(app.run('save.hold.shark'),1);
  assert.equal(app.run('save.caught.shark'),1);
  assert.equal(app.run('beings.includes(enemy)'),false);
  assert.equal(app.run('beings[0].combat.hp'),3);
  app.run('flushSave()');
  const raw=app.storage.get('atseadot.v4');
  assert.ok(!raw.includes('combat'),'temporary enemy state is never persisted');
  const loaded=game({raw});assert.equal(loaded.run('save.hold.shark'),1);
  assert.equal(loaded.run('huntUnlocked()'),true);
  assert.equal(loaded.run('sellFish("shark",false,1)'),true);
  assert.equal(loaded.run('save.hold.shark || 0'),0);
});

test('rare shark rewards retain rarity after three hits', () => {
  const app=encounter();app.run('save.up.line=15;enemy.rare=true');
  shoot(app);shoot(app);shoot(app);
  assert.equal(app.run('save.holdR.shark'),1);
  assert.equal(app.run('save.rare.shark'),1);
  assert.equal(app.run('catchCard.rare'),true);
});

test('returning spears cannot inflict repeated damage', () => {
  const app=encounter();app.run('save.up.line=15');shoot(app);
  assert.equal(app.run('enemy.combat.hp'),2);
  app.run('spear.on=1;spear.back=1;spear.x=enemy.cx();spear.y=enemy.cy();stepSpear(1)');
  assert.equal(app.run('enemy.combat.hp'),2);
});

test('overlapping sharks respect protection and fatal damage cancels the spear', () => {
  const app=encounter();app.run(`enemy.step=()=>{};enemy.x=player.x+DV_CX-enemy.w/2;
    const other=new Being("shark");other.step=()=>{};other.x=enemy.x;other.y=enemy.y;
    beings.push(other);stepBeings(1)`);
  assert.equal(app.run('player.hp'),9);
  app.run('stepBeings(1)');assert.equal(app.run('player.hp'),9);
  app.run('player.hp=1;player.invulnerable=0;fireSpear();stepBeings(1)');
  assert.equal(app.run('mode'),'over');assert.equal(app.run('spear.on'),0);
});

test('wounded sharks reset on world reentry and a new run', () => {
  const app=encounter();app.run('enemy.combat.hp=1;enemy.combat.state="dash";enemy.reenter()');
  assert.equal(app.run('enemy.combat.hp'),3);assert.equal(app.run('enemy.combat.state'),'roam');
  app.run('startRun("diver")');assert.equal(app.run('beings.filter(b=>b.combat).every(b=>b.combat.hp===3)'),true);
});

test('combat emits one warning per attack, hit effects and one defeat', () => {
  const effects=[], scenes=[];
  const audio={setScene:s=>scenes.push(s),playEffect:s=>effects.push(s),unlock(){},suspend(){},
    getSettings:()=>({muted:false,music:30,effects:50}),setSettings(){}};
  const app=encounter({audio});
  app.run('enemy.x=player.x+DV_CX+80-enemy.w/2;enemy.step(1);enemy.step(1);syncAudioScene()');
  assert.equal(effects.filter(x=>x==='sharkWarn').length,1);
  assert.equal(scenes.at(-1).encounter,'shark');
  app.run('save.up.line=15');shoot(app);shoot(app);shoot(app);
  assert.equal(effects.filter(x=>x==='sharkHit').length,2);
  assert.equal(effects.filter(x=>x==='sharkDefeat').length,1);
  app.run('syncAudioScene()');assert.equal(scenes.at(-1).encounter,'normal');
});

test('shark music preserves beat, respects damage priority and works with muted effects', async () => {
  const h=audioHarness();await h.audio.unlock();h.audio.setSettings({effects:0});
  const before=h.audio.getState().step;
  h.audio.setScene({encounter:'shark'});
  assert.equal(h.audio.getState().variation,'shark');assert.equal(h.audio.getState().step,before);
  h.audio.setScene({encounter:'shark',damaged:true});assert.equal(h.audio.getState().variation,'damage');
  h.audio.setScene({});assert.equal(h.audio.getState().variation,'normal');
  h.audio.setSettings({effects:50});
  for(const name of ['sharkWarn','sharkHit','sharkDefeat']) {
    h.advance(1);assert.equal(h.audio.playEffect(name),true);assert.equal(h.audio.playEffect(name),false);
  }
  h.audio.suspend();assert.equal(h.audio.getState().voices,0);
});

test('portrait and landscape primary actions use the same three-hit combat', () => {
  for(const [width,height] of [[402,844],[844,390]]) {
    const app=encounter({width,height});app.run('save.up.line=15');
    shoot(app);shoot(app);shoot(app);
    assert.equal(app.run('catchCard.id'),'shark');
    assert.doesNotThrow(()=>app.run('render()'));
  }
});

test('combat markers stay clear of the gauge and header even when the shark center is offscreen', () => {
  for(const [width,height] of [[402,844],[844,390],[1258,622]]) {
    const app=encounter({width,height});app.run('enemy.x=camX+SW-80;enemy.combat.state="warn"');
    const m=app.data('sharkCombatMarker(enemy)');assert.ok(m);
    assert.ok(m.x+13<app.run('UW-GAUGE_W'));
    assert.ok(m.y-14>app.run('headerLayout().y+headerLayout().h'));
    assert.doesNotThrow(()=>app.run('render()'));
  }
});

test('boat bait still snaps near a shark and mega remains uncatchable at max level', () => {
  const app=encounter();app.run(`save.up.line=15;player.role="boat";
    rod.state="out";rod.x=player.x+rodTipX();enemy.x=rod.x-enemy.w/2;rod.y=enemy.cy();stepBoat(1,false);`);
  assert.equal(app.run('rod.state'),'reel');assert.equal(app.run('save.stat.snap'),1);
  app.run('player.role="diver";const mega=new Being("mega");beings=[mega];spear.x=mega.cx();spear.y=mega.cy();spearHit()');
  assert.equal(app.run('save.caught.mega || 0'),0);
});
