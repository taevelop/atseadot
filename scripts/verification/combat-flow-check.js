/* Run with agent-browser eval --stdin on the local game.
   Fixtures position catches; input, combat, commerce and persistence use the real game. */
(() => {
  const check = (ok, message) => { if (!ok) throw Error(message); };
  const tap = key => {
    document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
    document.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));
  };
  const action = () => {
    if (innerWidth > 1024) { tap(' '); return; }
    syncControls();
    const button=document.querySelector('[data-action="primary"]');
    check(!button.disabled,'mobile action enabled');
    // Accessibility click uses the same action handler without inventing a captured pointer.
    button.click();
  };
  const choose = id => {
    const index=commerceItems().findIndex(i=>i.id===id);
    check(index>=0,'item exists: '+id);
    for(let i=0;i<commerceItems().length+1 && tradeSel!==index;i++) tap('ArrowDown');
    check(tradeSel===index,'selection: '+id);
  };
  const results=[];
  for(const language of ['ko','en']) {
    lang=language; save=emptySave(); startRun('diver'); closeMsg(); beings=[];
    player.x=worldW()/2; player.y=seaTop+100; player.invulnerable=100000;
    for(let i=0;i<8;i++) {
      const b=new Being('fish',{spr:'tuna'}); b.rare=false;
      b.x=player.x+DV_CX+40; b.y=player.y+16-b.h/2; beings=[b];
      action(); spear.x=b.cx(); spear.y=b.cy(); stepSpear(0);
      check(mode==='catch','ordinary capture'); tap('Escape');
      stepSpear(200); stepSpear(12);
    }
    check(save.hold.tuna===8,'catch stock');
    tap('a'); tradeSel=commerceItems().findIndex(i=>i.all); tap('Enter'); tap('Enter');
    check(save.coin===320 && aquariumStock().length===0,'sell collected fish');
    tap('s'); choose('weapon'); tap('Enter'); tap('Escape');
    check(save.coin===320 && upLv('weapon')===0,'cancel weapon purchase');
    tap('Enter'); tap('Enter'); check(save.coin===20 && upLv('weapon')===1,'buy hunting spear');
    tap('Escape'); closeMsg();
    const shark=new Being('shark'); shark.rare=false; shark.aggressive=false; shark.hp=shark.maxHp=30;
    shark.x=player.x+DV_CX+60; shark.y=player.y+16-shark.h/2; beings=[shark];
    for(let i=0;i<3;i++) {
      action(); spear.x=shark.cx(); spear.y=shark.cy(); stepSpear(0);
      if(i<2) { check(shark.hp===20-i*10 && mode==='dive','partial shark damage'); stepSpear(200); stepSpear(12); }
    }
    check(mode==='catch' && save.hold.shark===1 && save.coin===20,'shark reward once');
    tap('Escape'); tap('a'); choose('shark'); tap('Enter'); tap('Enter');
    check(save.coin===170 && !save.hold.shark,'sell shark');
    // Earn the remainder using the existing validated capture/stock path.
    for(let i=0;i<15;i++) markCaught({gid:'tuna',kind:'fish',rare:false});
    tradeSel=commerceItems().findIndex(i=>i.all); tap('Enter'); tap('Enter');
    check(save.coin===770,'earn upgrade funds');
    tap('s'); choose('weapon'); tap('Enter'); tap('Enter');
    check(save.coin===20 && upLv('weapon')===2,'upgrade weapon');
    tap('Escape'); flushSave();
    const restored=normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    check(restored.up.weapon===2 && restored.caught.shark===1 && !restored.hold.shark,'saved upgrade and sold stock');
    shark.dead=false; shark.hp=shark.maxHp=60; shark.hostile=true; shark.state='warn'; shark.stateTime=36;
    shark.x=player.x+DV_CX-25; shark.dir=-1; shark.y=player.y+DV_CY-shark.h/2; beings=[shark];
    spear.on=0; spear.cooldown=0; msg.queue.length=0; msg.lines=[];
    player.invulnerable=0; audioCombatRemaining=120; syncAudioScene();
    check(audio.getState().variation==='combat','real combat music variation');
    paused=true; bare=false; cam=clamp(player.y-SH*.4,0,worldH-SH); camX=clamp(player.x-SW*.4,0,worldW()-SW);
    controlsState=''; syncControls(); render();
    const header=headerLayout();
    check(header.x+header.w<=UW && header.y+header.h<=UH,'weapon HUD fits');
    results.push({language,catches:save.caught.tuna,sharks:save.caught.shark,coin:save.coin,weapon:upLv('weapon'),combatMusic:true});
  }
  return {passed:true,viewport:[innerWidth,innerHeight],touch:innerWidth<=1024,results};
})();
