const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

test('old and pre-economy stocked saves recover catches once, preserving sightings and progress', () => {
  for (const stocked of [0, 1]) {
    const app = game({raw:JSON.stringify({caught:{fish3:5},rare:{fish3:2,shark:3},
      hold:{fish3:0},stocked,coin:100,up:{fins:1},at:{fish3:0}})});
    assert.deepEqual(app.data('({hold:save.hold,holdR:save.holdR,version:save.economyVersion})'),
      {hold:{fish3:3},holdR:{fish3:2},version:1});
    assert.equal(app.run('save.rare.shark'),3);
    assert.equal(app.run('save.coin'),100);
    assert.equal(app.run('save.up.fins'),1);
    assert.equal(app.run('save.at.fish3'),0);
    assert.equal(app.run('sellFish("fish3",false,2)'),true);
    app.emit('pagehide');
    const again=game({raw:app.storage.get('atseadot.v4')});
    assert.equal(again.run('save.hold.fish3'),1);
    assert.equal(again.run('save.holdR.fish3'),2);
    assert.equal(again.run('save.coin'),116);
    assert.equal(again.run('stockAquarium()'),false);
  }
});

test('plain and rare catches stock separately and persist through closing the page', () => {
  const app=game();
  app.run('markCaught({gid:"fish3",rare:false},0); markCaught({gid:"fish3",rare:true},100)');
  assert.deepEqual(app.data('({n:save.caught.fish3,r:save.rare.fish3,p:save.hold.fish3,h:save.holdR.fish3,at:save.at.fish3})'),
    {n:2,r:1,p:1,h:1,at:0});
  app.hide();
  const again=game({raw:app.storage.get('atseadot.v4')});
  assert.equal(again.run('save.hold.fish3+save.holdR.fish3'),2);
});

test('partial and all sales use rare prices and never erase collection progress', () => {
  const app=game();
  app.run('markCaught({gid:"fish3"},10); markCaught({gid:"fish3",rare:true},20); checkTitles()');
  const record=app.data('({caught:save.caught,rare:save.rare,seen:save.seen,at:save.at,titles:save.titles})');
  assert.equal(app.run('sellFish("fish3",true,1)'),true);
  assert.equal(app.run('save.coin'),24);
  for (const qty of [0,-1,0.5,2,Infinity])
    assert.equal(app.run('sellFish("fish3",false,'+qty+')'),false);
  assert.equal(app.run('sellFish("shark",true,1)'),false);
  assert.equal(app.run('sellAllFish()'),true);
  assert.equal(app.run('save.coin'),32);
  assert.equal(app.run('sellAllFish()'),false);
  assert.deepEqual(app.data('({caught:save.caught,rare:save.rare,seen:save.seen,at:save.at,titles:save.titles})'),record);
  app.run('markCaught({gid:"fish3"},10); save.coin=Number.MAX_SAFE_INTEGER');
  const before=app.data('save');
  assert.equal(app.run('sellFish("fish3",false,1)'),false);
  assert.equal(app.run('sellAllFish()'),false);
  assert.deepEqual(app.data('save'),before);
});

test('inventory normalization excludes sightings and bounds rare stock by catches', () => {
  const app=game();
  app.context.bad={economyVersion:1,caught:{fish3:1,shark:2},rare:{fish3:9,shark:3},
    hold:{fish3:20,shark:2},holdR:{fish3:20,shark:20}};
  assert.deepEqual(app.data('normalizeSave(bad).hold'),{});
  assert.deepEqual(app.data('normalizeSave(bad).holdR'),{fish3:1});
});

test('purchases charge the correct tier once and reject poor or maxed purchases', () => {
  const app=game();
  assert.equal(app.run('buyUpgrade("fins")'),false);
  app.run('save.coin=3000; player.hp=7');
  assert.equal(app.run('buyUpgrade("tank")'),true);
  assert.deepEqual(app.data('({coin:save.coin,hp:player.hp,max:heartMax()})'),{coin:2740,hp:9,max:12});
  assert.equal(app.run('buyUpgrade("tank")'),true);
  assert.deepEqual(app.data('({coin:save.coin,hp:player.hp,max:heartMax()})'),{coin:2120,hp:11,max:14});
  assert.equal(app.run('buyUpgrade("tank")'),false);
  assert.equal(app.run('buyUpgrade("bogus")'),false);
  app.hide();
  assert.equal(game({raw:app.storage.get('atseadot.v4')}).run('heartMax()'),14);
});

test('fins improve normal and fast swimming; bait changes newly spawned rarity', () => {
  function speed(level,fast) {
    const app=game();
    return app.run('startRun("diver"); player.x=worldW()/2; player.y=seaTop+100; save.up.fins='+level+
      '; keys.arrowright=true; stepDiver(1,'+fast+'); player.vx');
  }
  for (const fast of [false,true]) assert.ok(speed(2,fast)>speed(0,fast));
  const app=game();
  app.run('Math.random=()=>0.01');
  assert.equal(app.run('new Being("fish",{spr:"fish3"}).rare'),false);
  app.run('save.up.bait=1');
  assert.equal(app.run('new Being("fish",{spr:"fish3"}).rare'),true);
});

test('damage has a cooldown, chest heals once, and health stays within its limits', () => {
  const app=game();
  app.run('startRun("diver"); closeMsg()');
  assert.equal(app.run('hurtPlayer(1)'),true);
  assert.equal(app.run('hurtPlayer(2)'),false);
  assert.equal(app.run('player.hp'),9);
  app.run('stepDiver(60,false)');
  assert.equal(app.run('hurtPlayer(2)'),true);
  assert.equal(app.run('player.hp'),7);
  app.run('openChest(); openChest()');
  assert.equal(app.run('player.hp'),9);
  app.run('healPlayer(2)');
  assert.equal(app.run('player.hp'),10);
  app.run('paused=true; player.invulnerable=0');
  assert.equal(app.run('hurtPlayer(1)'),false);
  app.run('paused=false; mode="guide"');
  assert.equal(app.run('hurtPlayer(1)'),false);
});

test('role changes, resizing and a new sea preserve health, while a new run restores it', () => {
  const app=game();
  app.run('startRun("diver"); hurtPlayer(2); swapRole(); swapRole()');
  app.resize(390,633);
  app.run('onPress("n")');
  assert.equal(app.run('player.hp'),8);
  app.run('startRun("diver")');
  assert.equal(app.run('player.hp'),10);
});

test('death stops the world and preserves inventory, upgrades and collection records', () => {
  const app=game();
  app.run('startRun("diver"); markCaught({gid:"fish3"},100); save.up.fins=1; player.hp=1; spear.on=1; keys.arrowright=true; hurtPlayer(2)');
  assert.deepEqual(app.data('({mode,hp:player.hp,spear:spear.on,rod:rod.state,key:keys.arrowright})'),
    {mode:'over',hp:0,spear:0,rod:'idle',key:false});
  const before=app.data('({x:player.x,y:player.y,save})');
  app.run('update(1,16.67); action()');
  assert.deepEqual(app.data('({x:player.x,y:player.y,save})'),before);
  app.run('startRun("diver")');
  assert.equal(app.run('save.hold.fish3'),1);
  assert.equal(app.run('save.up.fins'),1);
});

test('a purchased spear line reaches a distant fish and the lamp illuminates more of the deep', () => {
  function reach(level) {
    const app=game();
    app.run('startRun("diver"); closeMsg(); save.up.line='+level+
      '; chest=null; player.x=worldW()/2-150; globalThis.fish=beings.find(b=>b.K.catchable); fish.rare=false; beings=[fish]; fish.x=player.x+DV_CX+140-fish.w/2; fish.y=player.y+16-fish.h/2; fireSpear(); for(let i=0;i<60 && mode!=="catch";i++)stepSpear(1)');
    return app.run('mode');
  }
  assert.equal(reach(0),'dive'); assert.equal(reach(2),'catch');
  const app=game();
  app.run('startRun("diver"); player.y=seaBed-120; cam=player.y-SH/2; globalThis.dark=0; g.fillRect=()=>{dark+=g.globalAlpha}; drawDarkness()');
  const before=app.run('dark');
  app.run('save.up.lamp=2; dark=0; drawDarkness()');
  assert.ok(app.run('dark')<before);
});

test('overlapping predators do not stack damage during protection', () => {
  const app=game();
  app.run('startRun("diver"); closeMsg(); globalThis.sharks=[new Being("shark"),new Being("mega")]; for(const b of sharks){b.step=()=>{};b.gone=()=>false;b.x=player.x+DV_CX-b.w/2;b.y=player.y+DV_CY-b.h/2;} beings=sharks; stepBeings(1)');
  assert.equal(app.run('player.hp'),8);
  app.run('stepBeings(1)');
  assert.equal(app.run('player.hp'),8);
});
