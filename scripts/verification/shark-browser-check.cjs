const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const results=[];
 try {
  for(const [width,height] of [[1258,622],[402,844],[844,390]]) {
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:width!==1258,isMobile:width!==1258});
   const page=await ctx.newPage(), errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
   await page.goto(process.env.SHARK_TEST_URL || 'http://127.0.0.1:8788',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>worldReady);
   assert.equal(await page.title(),'At Sea :: DOT');
   await page.evaluate(()=>{
    window.requestAnimationFrame=()=>0;
    startRun('diver');closeMsg();chest=null;save.up.line=15;
    player.x=worldW()/2;player.y=seaTop+150;camX=player.x-SW/2;cam=player.y-SH/2;
    window.enemy=new Being('shark');enemy.x=player.x+DV_CX+80-enemy.w/2;
    enemy.y=player.y+DV_CY-enemy.h/2;beings=[enemy];enemy.step(1);render();syncControls();
   });
   await page.screenshot({path:`docs/screenshots/shark-warning-${width}x${height}.png`});
   assert.equal(await page.evaluate(()=>enemy.combat.state),'warn');
   const marker=await page.evaluate(()=>({point:sharkCombatMarker(enemy),right:UW-GAUGE_W,bottom:UH}));
   assert.ok(marker.point && marker.point.x+13<marker.right && marker.point.y<marker.bottom);
   await page.evaluate(()=>{enemy.step=()=>{};enemy.x=player.x+DV_CX+60-enemy.w/2;enemy.y=player.y+16-enemy.h/2;});
   for(let i=0;i<3;i++) {
    if(width===1258) await page.keyboard.press('Space');
    else await page.locator('[data-action="primary"]').tap();
    await page.evaluate(()=>{for(let n=0;n<100 && spear.on;n++)stepSpear(1);render();syncControls();});
    assert.equal(await page.evaluate(()=>enemy.combat.hp),2-i);
   }
   assert.equal(await page.evaluate(()=>mode),'catch');
   assert.equal(await page.evaluate(()=>save.hold.shark),1);
   await page.screenshot({path:`docs/screenshots/shark-catch-${width}x${height}.png`});
   await page.evaluate(()=>flushSave());await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.evaluate(()=>save.hold.shark),1);
   assert.deepEqual(errors,[]);
   results.push({width,height,warning:true,threeHits:true,reward:1,reload:true,errors});
   await ctx.close();
  }
  require('node:fs').writeFileSync('docs/screenshots/shark-browser-results.json',JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
