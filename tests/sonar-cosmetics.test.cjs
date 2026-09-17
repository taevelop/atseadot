const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./helpers/game.cjs');

function ocean(){
 const app=game();
 app.run('startRun("diver"); closeMsg(); player.x=worldW()/2; player.y=seaTop+200; beings=[]; globalThis.place=(id,d)=>{const e=GUIDE_BY_ID[id];const b=new Being(e.kind,{spr:e.spr});b.x=focusPoint().x+d-b.w/2;b.y=focusPoint().y-b.h/2;beings.push(b);return b}');
 return app;
}
test('sonar obeys inclusive range and tier two prefers uncaught species',()=>{
 const app=ocean();
 app.run('save.up.sonar=1; globalThis.edge=place("fish3",180); stepSonar(1)');
 assert.equal(app.run('sonar.target===edge'),true);
 app.run('edge.x+=.01; stepSonar(1)');
 assert.equal(app.run('sonar.target'),null);
 app.run('save.up.sonar=2; edge.x=focusPoint().x+300-edge.w/2; stepSonar(30)');
 assert.equal(app.run('sonar.target===edge'),true);
 app.run('edge.x+=.01; stepSonar(1)');
 assert.equal(app.run('sonar.target'),null);
 app.run('beings=[]; globalThis.near=place("fish3",20); globalThis.far=place("jelly",100); save.caught.fish3=1; resetSonar(); stepSonar(1)');
 assert.equal(app.run('sonar.target===far'),true);
 app.run('save.caught.jelly=1; stepSonar(30)');
 assert.equal(app.run('sonar.target===near'),true);
});
test('sonar refreshes every half second, excludes sightings and never adds records',()=>{
 const app=ocean();
 app.run('save.up.sonar=1; globalThis.a=place("fish3",80); place("shark",1); place("sub",2); place("mega",3); stepSonar(1)');
 const before=app.data('save');
 app.run('globalThis.b=place("jelly",20); stepSonar(29)');
 assert.equal(app.run('sonar.target===a'),true);
 app.run('stepSonar(1)');
 assert.equal(app.run('sonar.target===b'),true);
 assert.deepEqual(app.data('save'),before);
 app.run('bare=true');
 assert.equal(app.run('sonarMarker()'),null);
 app.run('bare=false; caught(b)');
 assert.equal(app.run('sonar.target'),null);
 app.run('mode="dive"; stepSonar(1)');
 assert.equal(app.run('sonar.target===a'),true);
});
test('sonar follows diver, hook and idle boat and freezes with overlays and hidden pages',()=>{
 const app=ocean();app.run('save.up.sonar=2; place("fish3",40); stepSonar(1); paused=true; update(20,333)');
 assert.equal(app.run('sonar.timer'),30);
 app.run('paused=false; openOverlay("shop"); update(20,333)');
 assert.equal(app.run('sonar.timer'),30);
 app.run('mode="dive"');app.hide();app.run('update(20,333)');
 assert.equal(app.run('sonar.timer'),30);
 app.run('swapRole()');
 assert.equal(app.run('focusPoint().x'),app.run('player.x+SPR.boat.w/2'));
 app.run('rod.state="out"; rod.x=100; rod.y=seaTop+400');
 assert.deepEqual(app.data('focusPoint()'),app.data('({x:100,y:seaTop+400})'));
 app.resize(390,633);
 assert.equal(app.run('sonar.timer'),0);
});
test('pearl and gold require actual catches and selling keeps the unlocks',()=>{
 const app=game();app.run('save.coin=10000; save.rare.shark=1; save.seen.shark=1; save.seen.mega=1');
 assert.equal(app.run('buySuit("pearl")'),false);
 assert.equal(app.run('buyCosmetic("boat","gold")'),false);
 app.run('markCaught({gid:"fish3",rare:true},10)');
 assert.equal(app.run('buySuit("pearl")'),true);
 app.run('for(const id of CATCH_IDS.slice(1,9))markCaught({gid:id},10)');
 assert.equal(app.run('buyCosmetic("boat","gold")'),false);
 app.run('markCaught({gid:CATCH_IDS[9]},10); sellAllFish()');
 assert.equal(app.run('buyCosmetic("boat","gold")'),true);
 const coin=app.run('save.coin');
 assert.equal(app.run('buyCosmetic("boat","gold")'),false);
 assert.equal(app.run('equipCosmetic("boat","default")'),true);
 assert.equal(app.run('equipCosmetic("boat","gold")'),true);
 assert.equal(app.run('save.coin'),coin);
});
test('locked cosmetics reveal their requirement and cannot be bought from confirmation',()=>{
 const app=game();
 app.run('save.coin=3000; openOverlay("shop"); shopTab=SHOP_TABS.indexOf("look"); tradeSel=commerceItems().findIndex(i=>i.id==="pearl"); beginTrade()');
 assert.equal(app.run('tradeProblem()'),'s.unlock.rare');
 assert.ok(app.run('confirmLayout().lines.join(" ").includes("1")'));
 app.run('finishTrade()');
 assert.equal(app.run('save.coin'),3000);
 assert.equal(app.run('ownsSuit("pearl")'),false);
});
test('new appearance ownership survives reload without rechecking completed goals or restocking fish',()=>{
 const app=game({raw:JSON.stringify({economyVersion:1,caught:{fish3:5},hold:{fish3:1},suits:{black:true,pearl:true},suit:'pearl',boats:{gold:true},boat:'gold',up:{sonar:9,reel:1,hook:'2'}})});
 assert.equal(app.run('save.suit'),'pearl');
 assert.equal(app.run('save.boat'),'gold');
 assert.equal(app.run('upLv("sonar")'),2);
 assert.equal(app.run('upLv("hook")'),0);
 assert.equal(app.run('save.hold.fish3'),1);
 app.run('equipSuit("black"); equipCosmetic("boat","default"); persist()');app.emit('pagehide');
 const again=game({raw:app.storage.get('atseadot.v4')});
 assert.equal(again.run('ownsSuit("pearl") && ownsCosmetic("boat","gold")'),true);
 assert.equal(again.run('save.suit'),'black');
 assert.equal(again.run('save.boat'),'default');
});
test('new suit palettes render both poses and directions and change only cloth colors',()=>{
 const app=game();app.run('startRun("diver"); save.coin=5000; markCaught({gid:"fish3",rare:true},0); buySuit("blue"); buySuit("pearl"); g.drawImage=cv=>globalThis.painted=cv');
 for(const id of ['blue','pearl']){
  for(const [phase,frame] of [[1,'diver'],[4,'diver2']]) for(const dir of [-1,1]){
   app.run('equipSuit("'+id+'");player.phase='+phase+';player.dir='+dir+';drawPlayer()');
   assert.equal(app.run('painted===bake(SPR.'+frame+',diverPalettes.'+id+',player.dir===-1)'),true);
  }
  for(const part of ['o','h','l','r','w','k','y'])assert.equal(app.run('diverPalettes.'+id+'.'+part),app.run('diverColors.'+part));
 }
});
test('boat paint renders on both the occupied and moored boat without changing the fisherman',()=>{
 const app=game();app.run('startRun("boat");save.coin=5000;buyCosmetic("boat","mint");globalThis.images=[];g.drawImage=cv=>images.push(cv);drawBoatAndLine()');
 assert.ok(app.run('images.includes(equippedBoatImage())'));
 app.run('swapRole();images=[];drawMooredBoat()');
 assert.ok(app.run('images.includes(equippedBoatImage())'));
 for(const part of ['o','h','r','w','k','y'])assert.equal(app.run('boatPalettes.mint.'+part),app.run('boatColors.'+part));
});

test('sonar uses a marker for visible targets and an edge arrow only outside the screen',()=>{
 const app=ocean();
 app.run('save.up.sonar=2; globalThis.b=place("fish3",20); stepSonar(1); camX=b.cx()-5; cam=b.cy()-30');
 assert.equal(app.run('sonarMarker().inside'),true);
 assert.equal(app.run('sonarMarker().x'),5);
 assert.equal(app.run('sonarMarker().y'),30);
 app.run('camX=b.cx()+1');
 assert.equal(app.run('sonarMarker().inside'),false);
 assert.ok(app.run('sonarMarker().dx')<0);
 app.run('camX=b.cx()-SW-1');
 assert.equal(app.run('sonarMarker().inside'),false);
 assert.ok(app.run('sonarMarker().dx')>0);
 app.run('camX=b.cx()-30; cam=b.cy()-SH-1');
 assert.equal(app.run('sonarMarker().inside'),false);
 assert.ok(app.run('sonarMarker().dy')>0);
});
