/* Evaluate with agent-browser at each desired viewport. Uses isolated fixtures. */
(() => {
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const bounds=(b,label)=>{assert(b.x>=0&&b.y>=0&&b.x+b.w<=UW+1&&b.y+b.h<=UH+1,label+" outside UI: "+JSON.stringify({b,UW,UH}));};
 const original=save, originalLang=lang; let cases=0;
 try {
  save=emptySave();save.coin=100000;save.consumables={targetBait:3,oxygenCapsule:3};
  for(const id of CATCH_IDS.slice(0,10))save.caught[id]=1;
  save.rare[CATCH_IDS[0]]=1;
  startRun("diver");paused=true;player.hp=7;closeMsg();
  for(const language of ["ko","en"]) {
   setLang(language);
   for(const tab of SHOP_TABS) {
    openOverlay("shop");shopTab=SHOP_TABS.indexOf(tab);
    const items=commerceItems();
    for(const [index,item] of items.entries()){
     trade=null;tradeSel=index;const list=commerceLayout();
     bounds(list,language+"/"+item.id+" list");
     list.rows.forEach(r=>bounds(r,"row"));list.tabs.forEach(r=>bounds(r,"tab"));
     beginTrade();
     if(trade) {
      const F=confirmLayout();bounds(F,"confirm");bounds(F.yes,"yes");bounds(F.no,"no");bounds(F.body,"body");
      assert(F.body.y+F.body.h<=F.qtyY+1,"description overlaps footer");
      scrollTrade(999);assert(tradeScroll===F.maxScroll,"scroll bottom");
      scrollTrade(-999);assert(tradeScroll===0,"scroll top");
     }
     render();cases++;
    }
    trade=null;mode="dive";
   }
   openOverlay("bag");bounds(commerceLayout(),"bag");tradeSel=1;beginTrade();
   bounds(confirmLayout(),"use");render();cases++;trade=null;mode="dive";
  }
  const controls=[...document.querySelectorAll("#touch-controls button,#touch-controls summary")].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().width>0);
  for(const e of controls){const r=e.getBoundingClientRect();assert(r.width>=44&&r.height>=44,"DOM touch area: "+e.textContent)}
  return {viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,ui:[UW,UH],cases,visibleButtons:controls.length,passed:true};
 }finally{save=original;trade=null;mode="dive";paused=true;setLang(originalLang);controlsState="";}
})();