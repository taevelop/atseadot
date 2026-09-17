const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./helpers/game.cjs');
function tap(app,key,extra={}){
 app.emit('keydown',{key,preventDefault(){},...extra});app.emit('keyup',{key});
}
function setup(){
 const app=game();
 app.run('startRun("diver");closeMsg();beings=[];player.x=worldW()/2;player.y=seaTop+100;save.coin=1000;markCaught({gid:"fish3"},20);save.consumables.targetBait=5;save.consumables.oxygenCapsule=3;globalThis.fish=new Being("fish",{spr:"fish3"});fish.x=focusPoint().x+100-fish.w/2;fish.y=focusPoint().y-fish.h/2;fish.top=seaTop;fish.bottom=seaBed-fish.h;beings=[fish]');
 return app;
}
test('supplies buy one at a time, enforce capacity and revalidate the confirmation',()=>{
 for(const [id,cap] of [['targetBait',5],['oxygenCapsule',3]]){
  const app=game();
  assert.equal(app.run('buyConsumable("'+id+'")'),false);
  app.run('save.coin=1000;openOverlay("shop");shopTab=SHOP_TABS.indexOf("supply");tradeSel=commerceItems().findIndex(i=>i.id==="'+id+'");beginTrade()');
  tap(app,'Escape');assert.equal(app.run('save.coin'),1000);
  app.run('beginTrade();finishTrade();finishTrade()');
  assert.equal(app.run('save.consumables.'+id),1);assert.equal(app.run('save.coin'),940);
  app.run('beginTrade();save.consumables.'+id+'='+cap+';finishTrade()');
  assert.equal(app.run('save.coin'),940);
  assert.equal(app.run('buyConsumable("'+id+'")'),false);
 }
});
test('I opens a frozen bag from play, preserves pause, and is guarded in title, death and modifier shortcuts',()=>{
 const app=setup();app.run('player.hp=6');
 tap(app,'i',{ctrlKey:true});assert.equal(app.run('mode'),'dive');
 tap(app,'i',{isComposing:true});assert.equal(app.run('mode'),'dive');
 tap(app,'i');assert.equal(app.run('mode'),'bag');
 const before=app.data('({player,save})');app.run('update(60,1000)');
 assert.deepEqual(app.data('({player,save})'),before);
 tap(app,'Escape');app.run('paused=true');tap(app,'i');tap(app,'ArrowDown');tap(app,'Enter');tap(app,'Enter');
 assert.equal(app.run('mode'),'dive');assert.equal(app.run('paused'),true);assert.equal(app.run('player.hp'),8);
 app.run('mode="title";openOverlay("bag");tradeSel=1;beginTrade()');
 assert.equal(app.run('trade'),null);assert.equal(app.run('save.consumables.oxygenCapsule'),2);
 app.run('startRun("diver");player.hp=1;hurtPlayer(1)');tap(app,'i');app.run('controlAction("bag")');
 assert.equal(app.run('mode'),'over');
});
test('target selection lists only caught species, cancels without consumption and uses once',()=>{
 const app=setup();app.run('save.seen.jelly=1;openOverlay("bag");beginTrade()');
 assert.equal(app.run('bagPicking'),true);
 assert.deepEqual(app.data('commerceItems().map(i=>i.id)'),['fish3']);
 app.run('beginTrade()');tap(app,'Escape');
 assert.equal(app.run('bagPicking'),true);assert.equal(app.run('save.consumables.targetBait'),5);
 tap(app,'Escape');assert.equal(app.run('bagPicking'),false);
 app.run('beginTrade();beginTrade();finishTrade();finishTrade()');
 assert.equal(app.run('mode'),'dive');
 assert.equal(app.run('save.consumables.targetBait'),4);
 assert.equal(app.run('activeBait.id'),'fish3');
 assert.equal(app.run('activeBait.remaining'),3600);
 assert.equal(app.run('useConsumable("targetBait","fish3")'),false);
 assert.equal(app.run('save.consumables.targetBait'),4);
});
test('bait requires a nearby known target and an idle lowered fishing line at the final confirmation',()=>{
 const app=setup();
 assert.equal(app.run('useConsumable("targetBait","jelly")'),false);
 app.run('fish.x=focusPoint().x+160-fish.w/2');
 assert.equal(app.run('consumableUseStatus("targetBait","fish3")'),'');
 app.run('fish.x+=.01');
 assert.equal(app.run('useConsumable("targetBait","fish3")'),false);
 app.run('fish.x-=.01;openOverlay("bag");beginTrade();beginTrade();beings=[];finishTrade()');
 assert.equal(app.run('save.consumables.targetBait'),5);
 assert.equal(app.run('activeBait'),null);
 app.run('mode="dive";swapRole()');
 for(const state of ['idle','bite','up','reel']){
  app.run('rod.state="'+state+'"');
  assert.equal(app.run('consumableUseStatus("targetBait")'),'bag.lowerLine');
 }
 app.run('rod.state="out";rod.x=200;rod.y=seaTop+80;fish.x=200-fish.w/2;fish.y=rod.y-fish.h/2;beings=[fish]');
 assert.equal(app.run('useConsumable("targetBait","fish3")'),true);
 assert.deepEqual(app.data('({x:activeBait.x,y:activeBait.y})'),app.data('({x:rod.x,y:rod.y})'));
});
test('luring uses 1.25 speed inside the habitat and never overrides fleeing, hooked or paused fish',()=>{
 const app=setup();
 app.run('useConsumable("targetBait","fish3");fish.speed=.4;globalThis.before=fish.x;fish.step(1)');
 assert.ok(Math.abs(app.run('before-fish.x')-.5)<1e-10);
 const rare=app.run('fish.rare'),count=app.run('beings.length');
 app.run('fish.pause=5;globalThis.before=fish.x;fish.step(1)');
 assert.equal(app.run('fish.x'),app.run('before'));
 app.run('fish.pause=0;fish.flee=1;fish.dir=1;fish.step(1)');
 assert.ok(app.run('fish.x>before'));
 app.run('fish.flee=0;fish.dir=1;rod.target=fish;globalThis.before=fish.x;fish.step(1)');
 assert.ok(app.run('fish.x>before'));
 assert.equal(app.run('fish.rare'),rare);assert.equal(app.run('beings.length'),count);
 app.run('rod.target=null;fish.pause=0;fish.x=activeBait.x-fish.w/2;fish.top=fish.y;fish.bottom=fish.y;activeBait.y=fish.cy()+50;globalThis.floor=fish.y;fish.step(100)');
 assert.equal(app.run('fish.y'),app.run('floor'));
});
test('bait time freezes outside play and survives role changes and resizing with its world position',()=>{
 const app=setup();app.run('useConsumable("targetBait","fish3");update(60,1000)');
 assert.equal(app.run('activeBait.remaining'),3540);
 app.run('paused=true;update(60,1000);paused=false;openOverlay("bag");update(60,1000)');
 assert.equal(app.run('activeBait.remaining'),3540);
 tap(app,'Escape');app.hide();app.run('update(60,1000)');
 assert.equal(app.run('activeBait.remaining'),3540);app.show();
 app.run('swapRole();globalThis.old={w:worldW(),h:worldH,top:seaTop,x:activeBait.x,y:activeBait.y}');
 app.resize(390,633);
 assert.ok(app.run('Math.abs(activeBait.x/worldW()-old.x/old.w)<1e-10'));
 assert.ok(app.run('Math.abs((activeBait.y-seaTop)/(worldH-seaTop)-(old.y-old.top)/(old.h-old.top))<1e-10'));
 assert.equal(app.run('activeBait.remaining'),3540);
 app.run('beings=[];for(let i=0;i<59;i++)update(60,1000)');
 assert.equal(app.run('activeBait'),null);
});
test('capsules show and clamp partial healing, enforce three uses even after repurchase or a new sea',()=>{
 const app=setup();app.run('player.hp=9;openOverlay("bag");tradeSel=1;beginTrade()');
 assert.ok(app.run('confirmLayout().lines.join(" ").includes("4.5")'));
 app.run('finishTrade()');assert.equal(app.run('player.hp'),10);
 assert.equal(app.run('capsulesUsed'),1);
 assert.equal(app.run('useConsumable("oxygenCapsule")'),false);
 app.run('player.hp=1;useConsumable("oxygenCapsule");useConsumable("oxygenCapsule");buyConsumable("oxygenCapsule")');
 assert.equal(app.run('capsulesUsed'),3);
 assert.equal(app.run('useConsumable("oxygenCapsule")'),false);
 app.run('onPress("n");swapRole();swapRole()');app.resize(844,260);
 assert.equal(app.run('capsulesUsed'),3);
 assert.equal(app.run('save.consumables.oxygenCapsule'),1);
 app.run('startRun("diver");player.hp=8');
 assert.equal(app.run('capsulesUsed'),0);
 assert.equal(app.run('useConsumable("oxygenCapsule")'),true);
});
test('fresh seas, death and reload clear active bait but never refund spent stock',()=>{
 const app=setup();app.run('useConsumable("targetBait","fish3");onPress("n")');
 assert.equal(app.run('activeBait'),null);assert.equal(app.run('save.consumables.targetBait'),4);
 app.run('globalThis.b=beings.find(b=>b.gid==="fish3");b.x=focusPoint().x-b.w/2;b.y=focusPoint().y-b.h/2;useConsumable("targetBait","fish3");player.hp=1;hurtPlayer(1)');
 assert.equal(app.run('activeBait'),null);assert.equal(app.run('save.consumables.targetBait'),3);
 app.emit('pagehide');const again=game({raw:app.storage.get('atseadot.v4')});
 assert.equal(again.run('save.consumables.targetBait'),3);assert.equal(again.run('activeBait'),null);
 assert.equal(again.run('capsulesUsed'),0);
});
test('supply save recovery rejects invalid counts while retaining existing progress',()=>{
 const app=game({raw:JSON.stringify({economyVersion:1,coin:900,caught:{fish3:5},hold:{fish3:1},suits:{black:true},suit:'black',consumables:{targetBait:900,oxygenCapsule:-1,unknown:4}})});
 assert.deepEqual(app.data('save.consumables'),{targetBait:5,oxygenCapsule:0});
 assert.equal(app.run('save.coin'),900);assert.equal(app.run('save.hold.fish3'),1);assert.equal(app.run('save.suit'),'black');
 for(const bad of [null,[],{targetBait:'3',oxygenCapsule:1.5}]) {
  app.context.input={consumables:bad};assert.deepEqual(app.data('normalizeSave(input).consumables'),{targetBait:0,oxygenCapsule:0});
 }
});
test('bag and supply confirmations remain reachable in Korean and English on compact screens',()=>{
 for(const [width,height,pixelRatio] of [[320,160,1],[320,411,1],[390,633,3],[568,201,2],[1280,800,1]]){
  const app=game({width,height,pixelRatio});
  app.run('startRun("diver");closeMsg();player.hp=5;save.consumables.oxygenCapsule=2');
  for(const language of ['ko','en']){
   app.run('trade=null;mode="dive";setLang("'+language+'");openOverlay("bag");tradeSel=1;beginTrade();render()');
   const layout=app.data('commerceLayout()'),panel=app.data('confirmLayout()');
   assert.ok(layout.y+layout.h<=app.run('UH'));
   assert.ok(panel.y+panel.h<=app.run('UH'));
   app.run('scrollTrade(1000);render()');
   app.click(app.data('confirmLayout().no'));assert.equal(app.run('save.consumables.oxygenCapsule'),2);
  }
 }
});
