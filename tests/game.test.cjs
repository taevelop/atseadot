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
    assert.equal(app.run('mode'), ['dive', 'dive', 'guide', 'help', 'title', 'aqua', 'shop'][index]);
    if (index < 2) assert.equal(app.run('player.role'), index === 0 ? 'diver' : 'boat');
    if (index === 4) assert.equal(app.run('lang'), 'en');
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
