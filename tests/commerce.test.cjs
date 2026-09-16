const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

function tap(app,key,extra={}) {
  app.emit('keydown',{key,preventDefault(){},...extra});
  app.emit('keyup',{key});
}
function stock(app) {
  app.run('for(let i=0;i<4;i++) markCaught({gid:"fish3"},20); markCaught({gid:"fish3",rare:true},40)');
}

test('A/S open the new screens from title and play, preserving the original return state', () => {
  for (const playing of [false,true]) {
    const app=game();
    if(playing) app.run('startRun("boat"); closeMsg(); paused=true');
    const before=app.data('({role:player.role,x:player.x,y:player.y,paused})');
    tap(app,'a'); assert.equal(app.run('mode'),'aqua');
    tap(app,'s'); assert.equal(app.run('mode'),'shop');
    tap(app,'g'); assert.equal(app.run('mode'),'guide');
    tap(app,'Escape');
    assert.equal(app.run('mode'),playing?'dive':'title');
    assert.deepEqual(app.data('({role:player.role,x:player.x,y:player.y,paused})'),before);
  }
});

test('quantity confirmation can cancel, sells once and blocks unrelated shortcuts', () => {
  const app=game(); stock(app); tap(app,'a'); tap(app,'Enter'); tap(app,'ArrowRight');
  assert.equal(app.run('trade.quantity'),2);
  for(const key of ['s','g','n',' ','Tab','l']) tap(app,key);
  assert.equal(app.run('mode'),'aqua'); assert.equal(app.run('trade.quantity'),2);
  app.run('controlAction("shop"); controlAction("guide")');
  assert.equal(app.run('mode'),'aqua');
  tap(app,'Escape');
  assert.equal(app.run('save.coin'),0);
  tap(app,'Enter'); tap(app,'ArrowRight');
  app.emit('keydown',{key:'Enter',preventDefault(){}});
  app.emit('keydown',{key:'Enter',repeat:true,preventDefault(){}});
  assert.equal(app.run('save.coin'),16);
  assert.equal(app.run('save.hold.fish3'),2);
  assert.equal(app.run('trade'),null);
  app.emit('keyup',{key:'Enter'});
  tap(app,'ArrowDown'); tap(app,'Enter'); tap(app,'Enter');
  assert.equal(app.run('save.coin'),40);
  app.run('tradeSel=commerceItems().length-1');
  tap(app,'Enter'); tap(app,'Escape'); assert.equal(app.run('save.coin'),40);
  tap(app,'Enter'); tap(app,'Enter');
  assert.equal(app.run('save.coin'),56);
  assert.equal(app.run('aquariumStock().length'),0);
  tap(app,'Enter'); assert.equal(app.run('trade'),null);
});

test('purchasing from the shop supports cancel, insufficient funds and the tier cap', () => {
  const app=game(); tap(app,'s'); tap(app,'Enter');
  assert.equal(app.run('trade'),null);
  assert.equal(app.run('tradeNotice'),app.run('T("s.poor")'));
  app.run('save.coin=1000');
  tap(app,'Enter'); tap(app,'Escape');
  assert.equal(app.run('save.coin'),1000);
  tap(app,'Enter'); tap(app,'Enter');
  assert.equal(app.run('save.up.tank'),1);
  tap(app,'Enter'); tap(app,'Enter');
  assert.equal(app.run('save.up.tank'),2);
  assert.equal(app.run('save.coin'),120);
  tap(app,'Enter'); assert.equal(app.run('trade'),null);
});

test('new overlays freeze damage, movement, spear and catches until returning', () => {
  const app=game(); app.run('startRun("diver"); closeMsg(); keys.arrowright=true; fireSpear()');
  tap(app,'a');
  const before=app.data('({x:player.x,y:player.y,hp:player.hp,spear:{...spear},save})');
  app.run('update(60,1000); action(); hurtPlayer(2)');
  assert.deepEqual(app.data('({x:player.x,y:player.y,hp:player.hp,spear:{...spear},save})'),before);
});

test('game-over blocks all play and overlay routes, with keyboard, touch and canvas exits', () => {
  for(const exit of ['keyboard','touch','canvas','back']) {
    const app=game(); stock(app);
    app.run('startRun("diver"); bare=true; player.hp=1; hurtPlayer(2)');
    for(const key of ['a','s','g','h','n','Tab',' ','p']) tap(app,key);
    for(const name of ['aqua','shop','guide','help','new','swap','pause']) app.run('controlAction('+JSON.stringify(name)+')');
    assert.equal(app.run('mode'),'over'); assert.equal(app.run('bare'),false);
    if(exit==='keyboard') tap(app,'Enter');
    else if(exit==='touch') app.run('controlAction("primary")');
    else if(exit==='canvas') app.click(app.data('overLayout().again'));
    else app.click(app.data('overLayout().back'));
    assert.equal(app.run('mode'),exit==='back'?'title':'dive');
    assert.equal(app.run('save.hold.fish3'),4);
    if(exit!=='back') assert.equal(app.run('player.hp'),app.run('heartMax()'));
  }
});

test('commerce, confirmation and game-over fit small and Retina screens in both languages', () => {
  for(const [width,height,pixelRatio] of [[320,411,1],[390,633,2.625],[402,661,3],[568,201,3],[844,260,1],[1280,800,1]]) {
    const app=game({width,height,pixelRatio});
    app.run('for(const id of CATCH_IDS){markCaught({gid:id},10);markCaught({gid:id,rare:true},20)} save.coin=2000');
    for(const lang of ['ko','en']) {
      app.run('setLang('+JSON.stringify(lang)+')');
      for(const mode of ['aqua','shop']) {
        app.run('trade=null; mode="title"; openOverlay('+JSON.stringify(mode)+')');
        const L=app.data('commerceLayout()');
        assert.ok(L.x>=0 && L.x+L.w<=app.run('UW') && L.y>=0 && L.y+L.h<=app.run('UH'),lang+' '+width+' '+mode);
        for(let i=0;i<app.run('commerceItems().length');i++){
          app.run('tradeSel='+i);
          assert.equal(app.run('commerceLayout().rows.some(row=>row.index===tradeSel)'),true);
        }
        app.run('tradeSel=0');
        app.click(app.data('commerceLayout().rows[0]'));
        const F=app.data('confirmLayout()');
        assert.ok(F.y>=0 && F.y+F.h<=app.run('UH'));
        assert.equal(app.run('confirmLayout().lines.every(line=>textWidth(line)<=confirmLayout().w-16)'),true);
        app.run('render()');
        app.click(F.no);
        assert.equal(app.run('trade'),null);
      }
      app.run('startRun("diver"); player.hp=1; hurtPlayer(1); render()');
      const O=app.data('overLayout()');
      assert.ok(O.y>=0 && O.y+O.h<=app.run('UH'),lang+' '+width+' game-over');
    }
  }
});

test('holding Enter across death cannot automatically restart the next run', () => {
  const app=game();
  app.run('startRun("diver"); player.hp=1');
  app.emit('keydown',{key:'Enter',preventDefault(){}});
  app.run('hurtPlayer(1)');
  app.emit('keydown',{key:'Enter',repeat:true,preventDefault(){}});
  assert.equal(app.run('mode'),'over');
  app.emit('keyup',{key:'Enter'});
  tap(app,'Enter');
  assert.equal(app.run('mode'),'dive');
});
