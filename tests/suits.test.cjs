const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

function tap(app, key, extra = {}) {
  app.emit('keydown', { key, preventDefault() {}, ...extra });
  app.emit('keyup', { key });
}
function openBlackSuit(app) {
  tap(app, 's');
  while(app.run('SHOP_TABS[shopTab]') !== 'look') tap(app, 'ArrowRight');
  const index=app.run('commerceItems().findIndex(item=>item.id==="black")');
  for (let i=0;i<index;i++) tap(app,'ArrowDown');
}

test('old and malformed suit saves default safely without restoring sold stock', () => {
  const progress = { coin: 730, up: { fins: 1 }, caught: { fish3: 5 },
    hold: { fish3: 1 }, stocked: 1, economyVersion: 1 };
  const cases = [
    [{}, false, 'yellow'],
    [{ suits: null, suit: 'black' }, false, 'yellow'],
    [{ suits: [], suit: 'black' }, false, 'yellow'],
    [{ suits: { black: 'true' }, suit: 'black' }, false, 'yellow'],
    [{ suits: { black: 1 }, suit: 'black' }, false, 'yellow'],
    [{ suits: { black: false }, suit: 'black' }, false, 'yellow'],
    [{ suits: { black: true }, suit: 'black' }, true, 'black'],
    [{ suits: { black: true }, suit: 'yellow' }, true, 'yellow'],
    [{ suits: { black: true, red: true }, suit: 'red' }, true, 'yellow'],
  ];
  for (const [fields, black, suit] of cases) {
    const app = game({ raw: JSON.stringify({ ...progress, ...fields }) });
    assert.deepEqual(app.data('({suits:save.suits,suit:save.suit})'), { suits: { black, blue:false, pearl:false }, suit });
    assert.deepEqual(app.data('({coin:save.coin,up:save.up,hold:save.hold,economyVersion:save.economyVersion})'),
      { coin: 730, up: { fins: 1 }, hold: { fish3: 1 }, economyVersion: 1 });
    assert.equal(app.run('ownsSuit("yellow")'), true);
  }
});

test('a black suit costs 300 once and never sells the default or an unknown suit', () => {
  for (const coin of [299, 300, 1000]) {
    const app = game();
    app.run('save.coin=' + coin);
    const bought = coin >= 300;
    assert.equal(app.run('buySuit("black")'), bought);
    assert.deepEqual(app.data('({coin:save.coin,suits:save.suits,suit:save.suit,up:save.up})'),
      { coin: coin - (bought ? 300 : 0), suits: { black: bought, blue:false, pearl:false }, suit: bought ? 'black' : 'yellow', up: {} });
    const after = app.data('save');
    for (const id of ['black', 'yellow', 'unknown']) {
      assert.equal(app.run('buySuit(' + JSON.stringify(id) + ')'), false);
      assert.deepEqual(app.data('save'), after);
    }
  }
  const app = game();
  assert.equal(app.run('equipSuit("black")'), false);
  assert.equal(app.run('equipSuit("unknown")'), false);
  assert.equal(app.run('save.suit'), 'yellow');
});

test('keyboard purchase handles poor funds, cancellation, repeat and free switching', () => {
  const app = game();
  app.run('save.coin=299');
  openBlackSuit(app);
  assert.equal(app.run('commerceItems()[tradeSel].id'), 'black');
  tap(app, 'Enter');
  assert.equal(app.run('trade'), null);
  assert.equal(app.run('tradeNotice'), app.run('T("s.poor")'));
  app.run('save.coin=300');
  tap(app, 'Enter');
  assert.equal(app.run('trade.type'), 'buySuit');
  assert.equal(app.run('tradeQuote()'), 300);
  tap(app, 'Escape');
  assert.equal(app.run('save.coin'), 300);
  assert.equal(app.run('save.suit'), 'yellow');
  tap(app, 'Enter');
  for (const key of ['a', 'g', 'l', 'ArrowRight']) tap(app, key);
  assert.equal(app.run('trade.type'), 'buySuit');
  app.emit('keydown', { key: 'Enter', preventDefault() {} });
  app.emit('keydown', { key: 'Enter', repeat: true, preventDefault() {} });
  app.emit('keyup', { key: 'Enter' });
  assert.equal(app.run('save.coin'), 0);
  assert.equal(app.run('save.suit'), 'black');
  assert.equal(app.run('shopItemView(SHOP_ITEMS.find(item=>item.id==="black")).action'), 'equipped');
  const after = app.data('save');
  tap(app, 'Enter');
  assert.deepEqual(app.data('save'), after);
  tap(app, 'ArrowUp');
  assert.equal(app.run('shopItemView(commerceItems()[tradeSel]).action'), 'equip');
  tap(app, 'Enter');
  assert.equal(app.run('save.suit'), 'yellow');
  assert.equal(app.run('trade'), null);
  tap(app, 'ArrowDown'); tap(app, 'Enter');
  assert.equal(app.run('save.suit'), 'black');
  assert.equal(app.run('save.coin'), 0);
});

test('canvas paging, cancel, buy and equip reach both suits', () => {
  const app = game({ width: 568, height: 201 });
  app.run('save.coin=500; openOverlay("shop")');
  app.click(app.data('commerceLayout().tabs.find(tab=>tab.id==="look")'));
  function row(id) {
    const index = app.run('commerceItems().findIndex(item=>item.id===' + JSON.stringify(id) + ')');
    while (app.run('commerceLayout().page') !== app.run('Math.floor(' + index + '/commerceLayout().per)')) {
      const before = app.run('tradeSel');
      app.click(app.data('commerceLayout().' + (before < index ? 'next' : 'prev')));
      assert.notEqual(app.run('tradeSel'), before);
    }
    return app.data('commerceLayout().rows.find(row=>row.item.id===' + JSON.stringify(id) + ')');
  }
  app.click(row('black'));
  app.click(app.data('confirmLayout().no'));
  assert.equal(app.run('save.coin'), 500);
  app.click(row('black'));
  app.click(app.data('confirmLayout().yes'));
  assert.equal(app.run('save.coin'), 200);
  assert.equal(app.run('save.suit'), 'black');
  app.click(row('yellow'));
  assert.equal(app.run('save.suit'), 'yellow');
  app.click(row('black'));
  assert.equal(app.run('save.suit'), 'black');
  assert.equal(app.run('save.coin'), 200);
});

test('ownership and equipment survive reload, new runs, role changes and game-over', () => {
  const app = game();
  app.run('save.coin=1000; markCaught({gid:"fish3"},20); save.up.fins=1; buySuit("black")');
  app.emit('pagehide');
  const again = game({ raw: app.storage.get('atseadot.v4') });
  assert.deepEqual(again.data('({coin:save.coin,suits:save.suits,suit:save.suit,hold:save.hold,up:save.up})'),
    { coin: 700, suits: { black: true, blue:false, pearl:false }, suit: 'black', hold: { fish3: 1 }, up: { fins: 1 } });
  const progress = again.data('save');
  again.run('startRun("diver"); swapRole(); swapRole(); player.hp=1; hurtPlayer(1)');
  assert.equal(again.run('mode'), 'over');
  tap(again, 'Enter');
  assert.deepEqual(again.data('save'), progress);
  again.run('equipSuit("yellow")');
  again.hide();
  const yellow = game({ raw: again.storage.get('atseadot.v4') });
  assert.equal(yellow.run('save.suit'), 'yellow');
  assert.equal(yellow.run('ownsSuit("black")'), true);
  assert.equal(yellow.run('equipSuit("black")'), true);
  assert.equal(yellow.run('save.coin'), 700);
});

test('both poses and directions draw the equipped palette and reuse the right cache entry', () => {
  const app = game();
  app.run('startRun("diver"); save.coin=300; buySuit("black"); g.drawImage=cv=>{globalThis.painted=cv}');
  for (const [phase, frame] of [[1, 'diver'], [4, 'diver2']]) {
    for (const dir of [-1, 1]) {
      app.run('player.phase=' + phase + '; player.dir=' + dir + '; equipSuit("yellow"); drawPlayer(); globalThis.yellowImage=painted');
      assert.equal(app.run('painted===bake(SPR.' + frame + ',diverPalettes.yellow,player.dir===-1)'), true);
      app.run('equipSuit("black"); drawPlayer()');
      assert.equal(app.run('painted===bake(SPR.' + frame + ',diverPalettes.black,player.dir===-1)'), true);
      assert.equal(app.run('painted===yellowImage'), false);
      app.run('equipSuit("yellow"); drawPlayer()');
      assert.equal(app.run('painted===yellowImage'), true);
    }
  }
  const yellow = app.data('diverPalettes.yellow'), black = app.data('diverPalettes.black');
  assert.equal(yellow.m, '#e8b02a');
  assert.equal(black.m, '#2b3038');
  assert.equal(black.d, '#181d24');
  for (const part of ['o', 'h', 'l', 'r', 'w', 'k', 'y']) assert.equal(black[part], yellow[part]);
});

test('a suit changes no movement, collision, health or upgrade effects', () => {
  for (const fast of [false, true]) {
    const states = ['yellow', 'black'].map(suit => {
      const app = game({ raw: JSON.stringify({ suits: { black: true }, suit, up: { fins: 1, tank: 1 } }) });
      return app.data('(() => {startRun("diver"); closeMsg(); player.x=worldW()/2; player.y=seaTop+100; keys.arrowright=true; stepDiver(1,' + fast + '); const shark=new Being("shark"); shark.step=()=>{}; shark.gone=()=>false; shark.x=player.x+DV_CX-shark.w/2; shark.y=player.y+DV_CY-shark.h/2; beings=[shark]; stepBeings(1); return {player,max:heartMax(),swim:swimMul(),lamp:lampAdd(),range:rangeAdd(),rare:rareMul(),size:[DV_W,DV_H,DV_CX,DV_CY]};})()');
    });
    assert.deepEqual(states[0], states[1]);
    assert.equal(states[0].player.hp, 11);
  }
});

test('localized suit states and purchase confirmation fit portrait and short landscape pages', () => {
  for (const [width, height, pixelRatio] of [[320,411,1], [390,633,3], [568,201,2], [1280,800,1]]) {
    const app = game({ width, height, pixelRatio });
    app.run('save.coin=300; openOverlay("shop"); shopTab=SHOP_TABS.indexOf("look"); tradeSel=commerceItems().findIndex(item=>item.id==="black")');
    for (const lang of ['ko', 'en']) {
      app.run('setLang(' + JSON.stringify(lang) + '); trade=null');
      const view = app.data('shopItemView(SHOP_ITEMS.find(item=>item.id==="black"))');
      assert.equal(view.title, lang === 'ko' ? '검은 잠수복' : 'BLACK SUIT');
      assert.equal(view.price, app.run('T("ui.coin",300)'));
      assert.equal(view.action, 'buy');
      assert.equal(app.run('commerceLayout().rows.some(row=>row.item.id==="black")'), true);
      app.run('beginTrade(); render()');
      const panel = app.data('confirmLayout()');
      assert.ok(panel.x >= 0 && panel.y >= 0 && panel.x + panel.w <= app.run('UW') && panel.y + panel.h <= app.run('UH'));
      assert.equal(app.run('confirmLayout().lines.every(line=>textWidth(line)<=confirmLayout().w-16)'), true);
    }
    app.run('finishTrade()');
    assert.equal(app.run('shopItemView(SHOP_ITEMS.find(item=>item.id==="black")).disabled'), true);
    assert.equal(app.run('shopItemView(SHOP_ITEMS.find(item=>item.id==="black")).price'), app.run('T("controls.equipped")'));
    assert.equal(app.run('shopItemView(SHOP_ITEMS.find(item=>item.id==="yellow")).price'), app.run('T("s.owned")'));
  }
});

test('changing language clears stale trade notices while preserving purchases and equipment', () => {
  const app = game();
  app.run('save.coin=300');
  openBlackSuit(app);
  tap(app, 'Enter'); tap(app, 'Enter');
  assert.equal(app.run('tradeNotice'), app.run('T("s.suitBought",T("s.suit.black"))'));
  const after = app.data('save');
  tap(app, 'l');
  assert.equal(app.run('lang'), 'en');
  assert.equal(app.run('tradeNotice'), '');
  assert.deepEqual(app.data('save'), after);
  tap(app, 'ArrowUp'); tap(app, 'Enter');
  assert.equal(app.run('tradeNotice'), 'YELLOW SUIT EQUIPPED.');
  app.run('controlAction("lang")');
  assert.equal(app.run('lang'), 'ko');
  assert.equal(app.run('tradeNotice'), '');
  assert.equal(app.run('save.suit'), 'yellow');
  assert.equal(app.run('save.coin'), 0);
});
