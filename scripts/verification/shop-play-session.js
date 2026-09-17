/* Run in a fresh local Chrome session with agent-browser eval --stdin.
 * Set window.__playRole to "diver" or "boat" first. This controller sends
 * keyboard events only; it never grants coins, catches, items or invulnerability.
 * It reads world coordinates to aim, so this is an automated smoke run, not a
 * human balance/playability study. Export window.__playtest.report() afterward.
 */
(() => {
  if (window.__playtest) throw new Error("Play session already running");
  const role=window.__playRole||"diver", started=Date.now(), events=[];
  let seconds=0, earned=0, deaths=0, target=null, nextSale=20, nextUse=0, purchase=0, done=false;
  const order=role==="boat"?["reel","hook","targetBait","sonar","reel","hook"]:
    ["fins","targetBait","oxygenCapsule","line","sonar","fins"];
  const tap=k=>{window.dispatchEvent(new KeyboardEvent("keydown",{key:k}));window.dispatchEvent(new KeyboardEvent("keyup",{key:k}));};
  const hold=(k,on)=>window.dispatchEvent(new KeyboardEvent(on?"keydown":"keyup",{key:k}));
  const release=()=>["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Shift"].forEach(k=>hold(k,false));
  const log=(type,data={})=>events.push({seconds:+seconds.toFixed(2),type,...data});
  const choose=id=>{const i=commerceItems().findIndex(x=>x.id===id);if(i<0)return false;
    while(tradeSel>i)tap("ArrowUp");while(tradeSel<i)tap("ArrowDown");return true;};
  const buy=id=>{
    const item=SHOP_ITEMS.find(x=>x.id===id), cost=item.kind==="upgrade"?item.cost[upLv(id)]:item.cost;
    if(!cost||save.coin<cost)return false;
    tap("s");
    while(SHOP_TABS[shopTab]!==shopCategory(item))tap("ArrowRight");
    choose(id);tap("Enter");
    const before=save.coin;
    if(trade)tap("Enter");
    tap("Escape");
    if(save.coin<before){log("buy",{id,cost:before-save.coin,coin:save.coin,level:upLv(id)});return true;}
    return false;
  };
  const use=(id,species)=>{
    if(consumableUseStatus(id,species))return false;
    release();tap("i");choose(id);tap("Enter");
    if(id==="targetBait"){choose(species);tap("Enter");}
    if(!trade){if(mode==="bag")tap("i");return false;}
    tap("Enter");log("use",{id,species:species||null,hp:player.hp/2,stock:save.consumables[id]});return true;
  };
  const report=()=>({role,complete:done,activeSeconds:+seconds.toFixed(3),wallSeconds:(Date.now()-started)/1000,
    startingCoin:0,earnedCoin:earned,endingCoin:save.coin,caught:Object.fromEntries(CATCH_IDS.filter(id=>save.caught[id]).map(id=>[id,save.caught[id]])),
    totalCaught:CATCH_IDS.reduce((n,id)=>n+(save.caught[id]||0),0),rareCaught:CATCH_IDS.reduce((n,id)=>n+(save.rare[id]||0),0),
    deaths,hp:player.hp/2,up:save.up,consumables:save.consumables,events});
  window.__playtest={report};
  const priorUpdate=update;
  update=function(u,dt){
    const active=mode==="dive"&&!paused&&document.visibilityState!=="hidden";
    priorUpdate(u,dt);
    if(active&&!done)seconds+=u/60;
  };
  if(mode!=="title")throw new Error("Start from a fresh title");
  if(role==="boat")tap("ArrowDown");
  tap("Enter");
  const interval=setInterval(()=>{
    try {
      if(seconds>=600){release();if(mode==="catch")tap("Escape");if(mode==="dive"&&!paused)tap("p");
        done=true;log("complete");clearInterval(interval);return;}
      if(mode==="over"){deaths++;log("death");tap("Enter");target=null;return;}
      if(mode==="catch"){release();tap("Escape");target=null;return;}
      if(mode!=="dive")return;
      if(msg.lines.length||msg.queue.length)tap("Escape");
      if(seconds>=nextSale){
        release();tap("a");const before=save.coin;
        const all=commerceItems().findIndex(x=>x.all);
        if(all>=0){while(tradeSel<all)tap("ArrowDown");tap("Enter");tap("Enter");}
        tap("Escape");const gain=save.coin-before;earned+=gain;log("sell",{gain,coin:save.coin});
        while(purchase<order.length&&buy(order[purchase]))purchase++;
        nextSale=seconds+20;
      }
      if(seconds>=nextUse){
        nextUse=seconds+1;
        if(save.consumables.oxygenCapsule&&player.role==="diver"&&player.hp<heartMax()&&capsulesUsed<3)use("oxygenCapsule");
        if(save.consumables.targetBait&&!activeBait&&(role==="diver"||rod.state==="out")){
          const f=focusPoint(), b=beings.find(b=>b.K.catchable&&save.caught[b.gid]>0&&Math.hypot(b.cx()-f.x,b.cy()-f.y)<140);
          if(b)use("targetBait",b.gid);
        }
      }
      if(mode!=="dive")return;
      const f=focusPoint();
      if(!target||!beings.includes(target)||target.pause>0||Math.hypot(target.cx()-f.x,target.cy()-f.y)>400){
        const danger=beings.filter(b=>b.kind==="shark"||b.kind==="mega");
        target=beings.filter(b=>b.K.catchable&&!b.pause&&b.cx()>15&&b.cx()<worldW()-15&&
          !danger.some(p=>Math.hypot(p.cx()-b.cx(),p.cy()-b.cy())<90))
          .sort((a,b)=>Math.hypot(a.cx()-f.x,(a.cy()-f.y)*1.2)-Math.hypot(b.cx()-f.x,(b.cy()-f.y)*1.2))[0];
      }
      release();hold("Shift",true);
      if(role==="boat"){
        if(rod.state==="idle"||rod.state==="bite"){tap(" ");return;}
        if(rod.state!=="out"||!target)return;
        const dx=target.cx()-(player.x+ROD_TIP.x),dy=target.cy()-rod.y;
        if(Math.abs(dx)>7)hold(dx>0?"ArrowRight":"ArrowLeft",true);
        if(Math.abs(dy)>5)hold(dy>0?"ArrowDown":"ArrowUp",true);
      }else if(target){
        const dx=target.cx()-(player.x+DV_CX),dy=target.cy()-(player.y+16);
        if(Math.abs(dy)>3)hold(dy>0?"ArrowDown":"ArrowUp",true);
        if(Math.abs(dx)>55)hold(dx>0?"ArrowRight":"ArrowLeft",true);
        else if(Math.sign(dx)!==player.dir)hold(dx>0?"ArrowRight":"ArrowLeft",true);
        if(Math.abs(dy)<8&&Math.abs(dx)<SPEAR_RANGE+rangeAdd()-8&&Math.sign(dx)===player.dir&&!spear.on)tap(" ");
      }
    }catch(error){release();log("error",{message:error.stack});done=true;clearInterval(interval);throw error;}
  },75);
  log("start",{order,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio});
  return report();
})();