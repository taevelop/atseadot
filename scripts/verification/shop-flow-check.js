/* Browser flow check in an isolated, funded verification session. Uses real key handlers. */
(() => {
 const check=(ok,label)=>{if(!ok)throw Error(label)};
 const tap=k=>{window.dispatchEvent(new KeyboardEvent("keydown",{key:k}));window.dispatchEvent(new KeyboardEvent("keyup",{key:k}));};
 const choose=id=>{const i=commerceItems().findIndex(x=>x.id===id);check(i>=0,"missing item "+id);while(tradeSel<i)tap("ArrowDown");while(tradeSel>i)tap("ArrowUp");};
 const results=[];
 for(const language of ["ko","en"]) {
  setLang(language);startRun("diver");paused=true;player.hp=7;closeMsg();
  const before=save.coin;
  tap("s");while(SHOP_TABS[shopTab]!=="supply")tap("ArrowRight");
  for(const id of ["targetBait","oxygenCapsule"]) {
   check(save.consumables[id]===0,"fixture stock");choose(id);tap("Enter");
   check(trade?.id===id,"purchase confirmation");render();tap("Enter");
   window.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",repeat:true}));
   check(save.consumables[id]===1,"single purchase "+id);
  }
  check(save.coin===before-120,"purchase prices");tap("Escape");
  tap("i");choose("oxygenCapsule");tap("Enter");tap("Escape");
  check(player.hp===7&&save.consumables.oxygenCapsule===1,"cancel use");
  tap("Enter");render();tap("Enter");
  check(mode==="dive"&&paused&&player.hp===9&&capsulesUsed===1&&save.consumables.oxygenCapsule===0,"capsule");
  const b=beings.find(b=>b.gid==="fish3");check(b&&save.caught.fish3>0,"bait fixture");
  b.x=focusPoint().x+60-b.w/2;b.y=focusPoint().y-b.h/2;
  tap("i");choose("targetBait");tap("Enter");choose("fish3");tap("Enter");render();tap("Enter");
  check(mode==="dive"&&paused&&activeBait?.id==="fish3"&&save.consumables.targetBait===0,"bait");
  results.push({language,purchase:120,capsule:true,bait:true,cancel:true,pauseRestored:true});
 }
 return {viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,passed:true,results};
})();