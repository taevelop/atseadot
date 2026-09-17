const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./helpers/game.cjs');

function select(app,id){
  app.run('openOverlay("shop"); shopTab=SHOP_TABS.indexOf("gear"); tradeSel=commerceItems().findIndex(item=>item.id==='+JSON.stringify(id)+')');
}
function movement(level,control,fast=false){
  const app=game();
  app.run('startRun("boat"); closeMsg(); beings=[]; save.up.reel='+level+'; rod.state="out"; rod.y=seaTop+150; globalThis.before=rod.y');
  if(control==='reel') app.run('rod.state="reel"');
  else if(control==='drag') app.run('pointer.down=true; pointer.moved=10; pointer.y=rod.y-cam+80');
  else app.run('keys['+JSON.stringify(control)+']=true');
  app.run('stepBoat(1,'+fast+')');
  return app.run('Math.abs(rod.y-before)');
}
test('reel changes manual, boosted, dragged and automatic line movement by the purchased factor',()=>{
  for(const control of ['arrowup','arrowdown','drag','reel']){
    for(const fast of [false,true]){
      const base=movement(0,control,fast);
      for(const level of [1,2]) assert.ok(Math.abs(movement(level,control,fast)/base-(1+level*.2))<1e-10);
    }
  }
  const app=game();
  app.run('startRun("boat"); closeMsg(); save.up.reel=2; rod.state="up"; rod.y=seaTop+150; globalThis.before=rod.y; stepBoat(1,false)');
  assert.ok(Math.abs(app.run('before-rod.y')-2.4*1.4*1.4)<1e-10);
});

test('hook purchase success boundaries are 85, 90 and 95 percent and do not extend the bite window',()=>{
  for(const [level,chance] of [[0,.85],[1,.90],[2,.95]]){
    for(const [random,expected] of [[chance-.000001,'up'],[chance,'reel'],[chance+.000001,'reel']]){
      const app=game();
      app.run('startRun("boat"); save.up.hook='+level+'; rod.state="bite"; rod.timer=BITE_TIME; rod.target=beings.find(b=>b.K.catchable); Math.random=()=>'+random+'; rodAction()');
      assert.equal(app.run('rod.state'),expected);
      assert.equal(app.run('BITE_TIME'),115);
    }
  }
});

test('new fishing gear purchases reject poor, cancelled, repeated and maxed transactions and survive reload',()=>{
  for(const [id,first,second] of [['reel',180,430],['hook',220,520]]){
    const app=game();select(app,id);
    app.run('beginTrade()'); assert.equal(app.run('trade'),null);
    app.run('save.coin=1000; beginTrade(); commercePress("escape",false,true)');
    assert.equal(app.run('save.coin'),1000);
    app.run('beginTrade(); finishTrade(); finishTrade()');
    assert.equal(app.run('save.coin'),1000-first);
    app.run('beginTrade(); finishTrade(); beginTrade()');
    assert.equal(app.run('trade'),null);
    assert.equal(app.run('save.coin'),1000-first-second);
    app.emit('pagehide');
    assert.equal(game({raw:app.storage.get('atseadot.v4')}).run('upLv('+JSON.stringify(id)+')'),2);
  }
});

test('shop tabs separate equipment and outfits and a confirmation freezes tab changes',()=>{
  const app=game();
  app.run('openOverlay("shop"); save.coin=2000');
  assert.ok(app.data('commerceItems().every(item=>item.kind==="upgrade")'));
  app.run('onPress("arrowleft")');
  assert.equal(app.run('SHOP_TABS[shopTab]'),'look');
  assert.ok(app.data('commerceItems().some(item=>item.id==="black")'));
  app.run('onPress("arrowright")');
  assert.equal(app.run('SHOP_TABS[shopTab]'),'gear');
  app.run('beginTrade(); onPress("arrowright")');
  assert.equal(app.run('SHOP_TABS[shopTab]'),'gear');
  assert.equal(app.run('upLv("tank")'),0);
});

test('localized purchase details expose current and next values and scroll within short viewports',()=>{
  for(const language of ['ko','en']){
    const app=game({width:320,height:160,pixelRatio:1});
    app.run('setLang('+JSON.stringify(language)+'); save.coin=2000');
    select(app,'bait'); app.run('beginTrade()');
    assert.ok(app.run('confirmLayout().lines.join(" ").includes("0.6")'));
    assert.ok(app.run('confirmLayout().lines.join(" ").includes("1.14")'));
    assert.ok(app.run('confirmLayout().maxScroll')>0);
    app.run('onPress("arrowdown")');
    assert.equal(app.run('tradeScroll'),1);
    app.run('scrollTrade(1000); render()');
    assert.equal(app.run('tradeScroll'),app.run('confirmLayout().maxScroll'));
    const panel=app.data('confirmLayout()');
    assert.ok(panel.y>=0&&panel.y+panel.h<=app.run('UH'));
    app.run('trade=null; save.up.bait=1; beginTrade()');
    assert.ok(app.run('confirmLayout().lines.join(" ").includes("2.166")'));
    assert.ok(!app.run('T("m.gotrare","TEST").includes("HUNDRED")'));
  }
});
