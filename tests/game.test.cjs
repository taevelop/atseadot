const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

test('malformed saves never prevent the title, guide, or game from rendering', () => {
  for (const raw of ['{', 'null', '[]', '42', '"bad"', '{"caught":null}',
    '{"seen":[],"caught":"bad","rare":null,"at":false,"titles":null,"stat":null}']) {
    const app = game({ raw });
    assert.doesNotThrow(() => app.run('render(); mode="guide"; render(); startRun("diver"); render()'), raw);
    assert.equal(app.run('caughtTotal()'), 0);
  }
});

test('save recovery retains valid fields, zero first-depth, titles, and progress', () => {
  const app = game();
  const [id, other] = app.data('GUIDE.slice(0,2).map(e=>e.id)');
  const title = app.run('Object.keys(TITLE_TEXT.en)[0]');
  app.context.inputSave = {
    caught: { [id]: 3, [other]: -1, unknown: 9 }, seen: null,
    rare: { [id]: 1, [other]: '4' }, at: { [id]: 0, [other]: 1600 },
    titles: { [title]: true, 'trophy.plain.1': 1, unknown: 1 },
    stat: { snap: 2, seabed: true }, chest: true, deepest: 750,
    // An aquarium cannot hold more than was caught, and no upgrade goes past UP_MAX.
    coin: 120, up: { fins: 5, lamp: 1, bogus: 2 },
    hold: { [id]: 99 }, holdR: { [id]: 3 }, stocked: true, economyVersion: 1
  };
  const normalized = app.data('normalizeSave(inputSave)');
  assert.deepEqual(normalized, {
    caught: { [id]: 3 }, rare: { [id]: 1 }, seen: { [id]: 1 }, at: { [id]: 0 },
    titles: { [title]: 1, 'trophy.plain.1': 1 }, stat: { snap: 2, seabed: 1 }, chest: 1, deepest: 750,
    coin: 120, up: { fins: 2, lamp: 1 },
    hold: { [id]: 2 }, holdR: { [id]: 1 }, stocked: 1, economyVersion: 1,
    suits: { black: false, blue:false, pearl:false }, suit: "yellow", boats:{mint:false,gold:false},boat:"default",consumables:{targetBait:0,oxygenCapsule:0}
  });
  app.run('save=normalizeSave(inputSave); markCaught({gid:GUIDE[0].id},800)');
  assert.equal(app.run('save.at[GUIDE[0].id]'), 0);
});

test('pending catches are flushed on page exit and when the page is hidden', () => {
  const app = game();
  app.run('markCaught({gid:GUIDE[0].id},750)');
  assert.equal(app.storage.get('atseadot.v4'), null);
  app.emit('pagehide');
  assert.equal(JSON.parse(app.storage.get('atseadot.v4')).at[app.run('GUIDE[0].id')], 750);
  app.run('save.deepest=900; persist()');
  app.hide();
  assert.equal(JSON.parse(app.storage.get('atseadot.v4')).deepest, 900);
  assert.equal(app.timers.size, 0);
  const blocked = game({ storageBlocked: true });
  assert.doesNotThrow(() => blocked.run('render(); markCaught({gid:GUIDE[0].id},5); flushSave()'));
});

function hookAt750(app) {
  app.run(`startRun("boat"); closeMsg();
    globalThis.fish = beings.find(b => b.K.catchable);
    rod.state="bite"; rod.target=fish; rod.y=seaTop+(worldH-seaTop)*.5;
    rod.timer=BITE_TIME; fish.pause=BITE_TIME;
    say(T("m.bite")); controlAction("primary");`);
  assert.equal(app.run('rod.state'), 'up', 'one action must strike despite the bite notification');
}

test('reeling records the hooking depth, including a resize during the catch', () => {
  const app = game();
  hookAt750(app);
  assert.equal(app.run('rod.catchDepth'), 750);
  app.resize(390, 686);
  assert.equal(app.run('metres()'), 750);
  assert.equal(app.run('rod.target===fish && fish.pause===1e9'), true);
  app.run('for(let n=0;n<5000 && rod.state!=="idle";n++) stepBoat(1,false)');
  assert.deepEqual(app.data('({state:rod.state,mode,card:catchCard.at,first:save.at[fish.gid],count:save.caught[fish.gid]})'),
    { state: 'idle', mode: 'catch', card: 750, first: 750, count: 1 });
});

test('switching roles or resetting releases biting and hooked fish', () => {
  for (const state of ['bite', 'up']) {
    for (const action of ['swapRole()', 'resetPlayer()']) {
      const app = game();
      app.context.testState = state;
      app.run(`startRun("boat"); globalThis.fish=beings.find(b=>b.K.catchable);
        rod.target=fish; rod.state=testState; fish.pause=1e9; ${action}`);
      assert.equal(app.run('fish.pause'), 0, `${state} ${action}`);
      assert.equal(app.run('rod.target'), null);
      assert.equal(app.run('beings.includes(fish)'), true);
      assert.equal(app.run('rod.state'), 'idle');
    }
  }
});

test('resizing preserves depth, population identity, rare fish, and opened chest', () => {
  for (const role of ['boat', 'diver']) {
    const app = game();
    app.context.testRole = role;
    app.run(`startRun(testRole); closeMsg(); paused=true;
      if(player.role==="boat"){rod.state="out";rod.y=seaTop+(worldH-seaTop)*.3;}
      else player.y=seaTop+(worldH-seaTop)*.3-DV_CY;
      globalThis.originalPopulation=beings.slice(); globalThis.originalChest=chest;
      chest.open=1; beings[0].rare=true;`);
    for (const [w, h] of [[390, 686], [844, 284], [1258, 622]]) {
      app.resize(w, h);
      assert.equal(app.run('metres()'), 450, `${role} ${w}x${h}`);
      assert.equal(app.run('beings.length===originalPopulation.length && beings.every((b,i)=>b===originalPopulation[i])'), true);
      assert.equal(app.run('chest===originalChest && chest.open===1 && beings[0].rare'), true);
    }
  }
});

test('paused game does not move, collide, catch, or increment progress', () => {
  const app = game();
  app.run('startRun("diver"); closeMsg(); paused=true; keys.arrowdown=true');
  const before = app.data('({x:player.x,y:player.y,spear:spear.on,save})');
  app.run('update(1,16.67); action()');
  assert.deepEqual(app.data('({x:player.x,y:player.y,spear:spear.on,save})'), before);
  app.run('controlAction("primary")');
  assert.equal(app.run('paused'), false);
});

test('each title item activates the clicked option; background clicks do nothing', () => {
  for (let index = 0; index < 7; index++) {
    const app = game();
    app.click(app.data(`titleLayout().items[${index}]`));
    assert.equal(app.run('menuIndex'), index);
    assert.equal(app.run('mode'), ['dive', 'dive', 'guide', 'help', 'aqua', 'shop', 'title'][index]);
    if (index < 2) assert.equal(app.run('player.role'), index === 0 ? 'diver' : 'boat');
    if (index === 6) assert.equal(app.run('lang'), 'en');
  }
  const app = game();
  app.click({ x: 1, y: 1, w: 1, h: 1 });
  assert.equal(app.run('mode'), 'title');
});

test('every help entry is reachable and fits all pages in both languages', () => {
  const app = game();
  for (const [w, h] of [[1258,622], [390,686], [360,482], [844,284], [320,322]]) {
    app.resize(w, h);
    for (const language of ['ko', 'en']) {
      app.context.testLang = language;
      app.run('setLang(testLang); mode="help"; helpPage=0');
      const layout = app.data('helpLayout()');
      const entries = [...new Set(layout.pages.flat().map(line => line.index))].sort((a,b)=>a-b);
      assert.deepEqual(entries, Array.from({ length: app.run('HELP_ROWS.length') }, (_,i)=>i));
      assert.ok(layout.pages.every(page => page.length <= layout.maxLines));
      assert.equal(app.run('helpLayout().pages.flat().every(l=>textWidth(l.text)<=helpLayout().w-16-(l.indent||0))'), true);
      app.click(layout.next);
      assert.equal(app.run('helpPage'), 1);
      app.run('onPress("pageup")');
      assert.equal(app.run('helpPage'), 0);
      app.run('for(let i=0;i<100;i++) onPress("pagedown"); render()');
      assert.equal(app.run('helpPage'), layout.pages.length - 1);
    }
  }
});

test('species cards wrap metadata within the panel and expose clipped content by scrolling', () => {
  const app = game();
  app.resize(390, 482);
  for (const language of ['ko', 'en']) {
    app.context.testLang = language;
    const failures = app.data(`(() => {
      setLang(testLang); mode="guide"; guideTab=0; guideDetail=true; GUIDE.forEach(e=>save.seen[e.id]=1);
      const failures=[];
      for(guideSel=0;guideSel<GUIDE.length;guideSel++) {
        const info=currentInfo(), L=infoLayout(info);
        if(!L.rows.every(r=>r.keys.every(t=>textWidth(t)<=L.kw-6) && r.values.every(t=>textWidth(t)<=L.metaW-L.kw))) failures.push(info.e.id);
        if(!L.notes.every(t=>textWidth(t)<=L.w-16)) failures.push(info.e.id+":notes");
      }
      guideSel=0; scrollInfo(10000); render();
      return failures;
    })()`);
    assert.deepEqual(failures, []); app.resize(390, 240); app.run('scrollInfo(10000)');
    assert.ok(app.run('infoLayout().maxScroll') > 0);
    assert.equal(app.run('infoScroll'), app.run('infoLayout().maxScroll'));
    app.run('onPress("arrowright")');
    assert.equal(app.run('infoScroll'), 0);
  }
});

test('touch actions cover capture, role switching, overlays, language, and input release', () => {
  const app = game();
  app.run(`controlAction("primary"); closeMsg();
    globalThis.fish=beings.find(b=>b.K.catchable); beings=[fish];
    fish.x=player.x+DV_CX+40-fish.w/2; fish.y=player.y+16-fish.h/2;
    controlAction("primary");
    for (let i = 0; i < 12 && mode !== "catch"; i++) stepSpear(1);`);
  assert.equal(app.run('mode'), 'catch');
  assert.equal(app.run('save.caught[fish.gid]'), 1);
  app.run('controlAction("primary"); controlAction("swap")');
  assert.equal(app.run('player.role'), 'boat');
  app.run('controlAction("guide"); controlAction("help"); controlAction("back")');
  assert.equal(app.run('mode'), 'dive');
  app.run('controlAction("lang")');
  assert.equal(app.run('lang'), 'en');
  assert.equal(app.context.document.documentElement.lang, 'en');
  app.run('touchKeys.arrowdown=true; keys.arrowright=true; pointer.down=true');
  app.emit('blur');
  assert.equal(app.run('pressed("arrowdown") || pressed("arrowright") || pointer.down'), false);
});

test('the chest lays out what it gave and any dismissal key closes the card', () => {
  for (const key of ['x', 'enter', 'space']) {
    const app = game();
    app.run('startRun("diver"); closeMsg(); player.hp = 2; openChest()');
    assert.equal(app.run('mode'), 'reward');
    assert.equal(app.run('save.chest'), 1, 'the bait is unlocked');
    assert.equal(app.run('player.hp'), 4, 'the air tank gives a heart back');
    /* 준 것만 적는다 - 미끼 한 줄, 숨 한 줄. */
    assert.deepEqual(app.data('rewardRows().map(r=>r[0])'), [app.run('T("r.bait")'), app.run('T("r.heal")')]);
    assert.ok(app.run('rewardLayout().rows.every(r=>r.values.length>0)'), 'no reward row is left blank');
    app.run(`onPress(${JSON.stringify(key)})`);
    assert.equal(app.run('mode'), 'dive', `${key} closes the card`);
    assert.equal(app.run('rewardCard'), null);
  }
  /* 숨이 가득하면 산소통 줄은 적지 않는다. */
  const full = game();
  full.run('startRun("diver"); closeMsg(); openChest()');
  assert.deepEqual(full.data('rewardRows().map(r=>r[0])'), [full.run('T("r.bait")')]);
  /* 말을 바꾸면 창 안의 글도 따라 바뀐다. */
  full.run('setLang("en")');
  assert.deepEqual(full.data('rewardRows().map(r=>r[0])'), ['SPECIAL BAIT']);
});

test('the moored boat is drawn once, with the player, and never over the title', () => {
  const app = game();
  app.run('startRun("boat"); swapRole(); globalThis.images=[]; g.drawImage=cv=>images.push(cv)');
  const boat = 'images.filter(cv=>cv===equippedBoatImage(moored.dir===-1)).length';
  /* 잠수 중에는 잠수부와 같은 차례에 딱 한 번 올라온다. 물을 칠하기 전에
     한 번 더 그리면 앞을 지나는 물고기가 배를 뚫고 보인다. */
  app.run('images=[]; render()');
  assert.equal(app.run(boat), 1);
  /* 시작 화면은 물과 빛만 남긴다 - 세워 둔 배가 제목을 가리면 안 된다. */
  app.run('mode="title"; images=[]; render()');
  assert.equal(app.run(boat), 0);
});

test('the boat turns the way it moves and its rod tip follows the bow', () => {
  const app = game();
  app.run('startRun("boat"); closeMsg(); beings=[]');
  assert.equal(app.run('player.dir'), 1);
  assert.equal(app.run('rodTipX()'), app.run('boatTier().rodTip.x'));
  app.run('keys.arrowleft=true; for(let i=0;i<60;i++) update(1,16.67); keys.arrowleft=false');
  assert.equal(app.run('player.dir'), -1);
  /* 낚싯대는 뱃고물에 달려 있다 - 뱃머리가 돌면 줄도 반대쪽 끝에서 떨어진다. */
  assert.equal(app.run('rodTipX()'), app.run('boatSpr().w - 1 - boatTier().rodTip.x'));
  app.run('globalThis.images=[]; g.drawImage=cv=>images.push(cv); drawBoatAndLine()');
  assert.equal(app.run('images.includes(equippedBoatImage(true))'), true, 'flipped sprite is drawn');
  assert.equal(app.run('images.includes(equippedBoatImage(false))'), false, 'upright sprite is not');
  app.run('action(); for(let i=0;i<200;i++) update(1,16.67)');
  assert.equal(Math.round(app.run('rod.x - player.x')), app.run('rodTipX()'));
  /* 도색한 배는 선체만 덧칠한 별도 그림이다 - 좌우를 따로 구워 두지 않으면
     한쪽을 칠하고 다른 쪽은 기본색으로 남는다. */
  app.run('save.coin=5000; buyCosmetic("boat","mint"); images=[]; drawBoatAndLine()');
  assert.equal(app.run('images.includes(equippedBoatImage(true))'), true, 'painted boat mirrors');
  assert.equal(app.run('equippedBoatImage(true) === equippedBoatImage(false)'), false, 'sides differ');
});

test('a boat left behind keeps the way it faced, and boarding it resumes that way', () => {
  const app = game();
  app.run('startRun("boat"); closeMsg(); beings=[]');
  app.run('keys.arrowleft=true; for(let i=0;i<60;i++) update(1,16.67); keys.arrowleft=false');
  app.run('swapRole()');
  assert.deepEqual(app.data('({role:player.role,dir:moored.dir})'), {role:'diver', dir:-1});
  /* 잠수부는 자기 방향을 새로 쓴다 - 세워 둔 배의 방향과 섞이지 않는다. */
  assert.equal(app.run('player.dir'), 1);
  /* 화면이 바뀌어도 세워 둔 자리는 바다와 함께 따라간다. 자리만 담던
     시절의 계산을 그대로 두면 여기서 숫자가 아닌 것이 나온다. */
  app.resize(390, 686);
  assert.equal(typeof app.run('moored.x'), 'number');
  assert.equal(app.run('moored.x > 0 && moored.x < worldW()'), true, 'moored x stays in the sea');
  assert.equal(app.run('moored.dir'), -1);
  app.run('swapRole()');
  assert.deepEqual(app.data('({role:player.role,dir:player.dir,moored})'), {role:'boat', dir:-1, moored:null});
  assert.equal(Math.round(app.run('rod.x - player.x')), app.run('rodTipX()'));
  /* 새 플레이는 세워 둔 배를 물려받지 않는다. */
  app.run('swapRole(); startRun("diver")');
  assert.equal(app.run('moored'), null);
});

test('every boat tier has a sprite, a rod tip inside it, and a hull row to paint', () => {
  const app = game();
  const tiers = app.data('BOAT_TIERS.map(t=>t.spr)');
  assert.ok(tiers.length > 0);
  tiers.forEach((name, level) => {
    app.context.level = level;
    const at = `tier ${level} (${name})`;
    const info = app.data(`(() => { save.up.boat = level;
      const def = boatSpr();
      return { spr: def.name, w: def.w, h: def.h, hull: boatHullY(),
               tipX: boatTier().rodTip.x, tipY: boatTier().rodTip.y, float: boatFloat() }; })()`);
    assert.equal(info.spr, name, at);
    assert.ok(info.tipX >= 0 && info.tipX < info.w, at + ' rod tip x sits inside the sprite');
    assert.ok(info.tipY >= 0 && info.tipY < info.h, at + ' rod tip y sits inside the sprite');
    /* 도색은 선체 줄부터 아래만 덧칠한다 - 그 줄을 못 찾으면 배가 통째로 칠해진다. */
    assert.ok(info.hull > 0 && info.hull < info.h, at + ' has a hull row to paint from');
    /* 배는 수면에 걸쳐 앉는다 - 공중에 뜨거나 통째로 잠기면 안 된다. */
    assert.ok(info.float > 0 && info.float < info.h, at + ' rests across the waterline');
  });
  /* 없는 단계를 가리켜도 마지막 배로 떨어진다 - 저장이 앞서가도 깨지지 않는다. */
  app.run(`save.up.boat = BOAT_TIERS.length + 5`);
  assert.equal(app.run('boatTier().spr'), tiers[tiers.length - 1]);
});

