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
  /* 잠수함은 어떤 장비로도 잡히지 않는다 - 재고에 들어올 자리가 없다. */
  app.context.bad={economyVersion:1,caught:{fish3:1,sub:2},rare:{fish3:9,sub:3},
    hold:{fish3:20,sub:2},holdR:{fish3:20,sub:20}};
  assert.deepEqual(app.data('normalizeSave(bad).hold'),{});
  assert.deepEqual(app.data('normalizeSave(bad).holdR'),{fish3:1});
  /* 상어는 작살줄을 끝까지 올린 사람이 잡아 온 것이다. 재고는 남기되
     파는 것은 해금을 다시 본다. */
  app.context.hunted={economyVersion:1,caught:{shark:3},rare:{shark:1},
    hold:{shark:9},holdR:{shark:9}};
  assert.deepEqual(app.data('normalizeSave(hunted).hold'),{shark:2});
  assert.deepEqual(app.data('normalizeSave(hunted).holdR'),{shark:1});
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

test('gear levels are capped per item and every step costs more than the one before', () => {
  const app = game();
  assert.equal(app.run('upMax("line")'), 15, 'the spear line goes all the way');
  assert.equal(app.run('upMax("tank")'), app.run('UP_MAX'), 'the rest keep the old cap');
  assert.equal(app.run('upMax("ship")'), 2, 'three boats');
  const costs = app.data(`(() => { const item = UPGRADES.find(i => i.id === "line");
    return Array.from({length: upMax("line")}, (_, level) => upCost(item, level)); })()`);
  assert.equal(costs.length, 15);
  /* 정해 둔 두 단계는 그대로 두고 그 위로만 새로 매긴다. */
  assert.deepEqual(costs.slice(0, 2), app.data('UPGRADES.find(i=>i.id==="line").cost'));
  for (let i = 1; i < costs.length; i++)
    assert.ok(costs[i] > costs[i - 1], `step ${i} costs ${costs[i]}, not more than ${costs[i - 1]}`);
  /* 사거리도 단계마다 늘되 화면을 가로지르지는 않는다. */
  const range = app.data('Array.from({length:16},(_,l)=>upgradeValue("line",l))');
  for (let i = 1; i < range.length; i++) assert.ok(range[i] > range[i - 1], 'range step ' + i);
  assert.ok(range[15] < app.run('SW'), 'the spear stays inside the screen');
});

test('the spear line can be bought to its last step and stops there', () => {
  const app = game();
  app.run('save.coin = 1e9');
  for (let i = 0; i < 15; i++) assert.equal(app.run('buyUpgrade("line")'), true, 'step ' + i);
  assert.equal(app.run('upLv("line")'), 15);
  assert.equal(app.run('buyUpgrade("line")'), false, 'there is no sixteenth step');
  assert.equal(app.run('upgradeStatus("line")'), 's.maxed');
  /* 값을 치를 수 없으면 사지 못한다. */
  const app2 = game();
  app2.run('save.coin = 0');
  assert.equal(app2.run('upgradeStatus("line")'), 's.poor');
});

test('sharks are for watching until the spear line is maxed, then they can be caught and sold', () => {
  const app = game();
  app.run('startRun("diver"); closeMsg()');
  assert.equal(app.run('huntUnlocked()'), false);
  assert.equal(app.run('canCatch(KIND.shark)'), false, 'the spear bounces off first');
  assert.equal(app.run('sellableId("shark")'), false);
  app.run('save.coin = 1e9; for (let i = 0; i < upMax("line"); i++) buyUpgrade("line")');
  assert.equal(app.run('huntUnlocked()'), true);
  assert.equal(app.run('canCatch(KIND.shark)'), true);
  assert.equal(app.run('sellableId("shark")'), true);
  /* 메갈로돈과 잠수함은 끝까지 구경만 한다. */
  for (const id of ['mega', 'sub']) {
    app.context.id = id;
    assert.equal(app.run('canCatch(KIND[id])'), false, id);
    assert.equal(app.run('sellableId(id)'), false, id);
  }
  /* 끝판 사냥감이니 지금까지 중 가장 비싸다. */
  assert.ok(app.run('priceOf("shark", false)') > app.run('priceOf("angler", false)'));
  /* 칭호 조건은 그대로다 - 상어를 잡아야 도감을 다 채우는 것은 아니다. */
  assert.equal(app.run('CATCH_IDS.includes("shark")'), false);
});

