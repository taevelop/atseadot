const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

// Changed: frozen outputs from PR #15's actual game.js at
// 0e4ef9a74eba2b0610d3998d3ad36e32ccdd0b5b, executed with the VM game harness.
// Starting with 1,234 coins: markCaught recorded 4 plain + 2 rare fish3 and
// 3 plain + 2 rare sharks; sellFish sold one of each, then flushSave persisted
// LEGACY_PARTIAL. A subsequent sellAllFish + flushSave produced LEGACY_SOLD.
// Fixtures keep this regression usable in source archives without Git history.
const LEGACY_PARTIAL = {
  seen: { fish3: 1, shark: 1 }, caught: { fish3: 6, shark: 5 },
  rare: { fish3: 2, shark: 2 }, at: { fish3: 250, shark: 250 }, titles: {},
  stat: { snap: 0, seabed: 0 }, chest: 0, deepest: 0, coin: 1866,
  up: { tank: 2, fins: 1, lamp: 2, line: 15, bait: 2, reel: 1, hook: 2, sonar: 1, ship: 2 },
  hold: { fish3: 3, shark: 2 }, holdR: { fish3: 1, shark: 1 }, stocked: 1, economyVersion: 1,
  suits: { black: true, blue: true, pearl: false }, suit: 'blue',
  consumables: { targetBait: 3, oxygenCapsule: 2 },
  boats: { mint: true, gold: false }, boat: 'mint'
};
const LEGACY_SOLD = { ...LEGACY_PARTIAL, coin: 2664, hold: {}, holdR: {} };
const SAVE_KEY = 'atseadot.v4';

// Changed: cover actual previously released saves, including already sold stock.
test('PR #15 saves preserve purchases and sale balances through combat migration and reload', () => {
  for (const legacy of [LEGACY_PARTIAL, LEGACY_SOLD]) {
    const app = game({ raw: JSON.stringify(legacy) });
    const migrated = JSON.parse(app.storage.get(SAVE_KEY));
    for (const field of Object.keys(legacy).filter(field => field !== 'up')) {
      assert.deepEqual(migrated[field], legacy[field], field);
    }
    assert.deepEqual(migrated.up, { ...legacy.up, weapon: 1 });
    assert.equal(migrated.combatVersion, 1);
    assert.equal(migrated.sharkRareCaught, legacy.holdR.shark || 0);

    // Spend the migrated ownership through the real purchase path. Reloading
    // must preserve the new tier, never repeat the free grant or restore sales.
    assert.equal(app.run('buyUpgrade("weapon")'), true);
    app.run('flushSave()');
    const reloaded = game({ raw: app.storage.get(SAVE_KEY) });
    assert.equal(reloaded.run('combatMigrated'), false);
    assert.deepEqual(reloaded.data('save.up'), { ...legacy.up, weapon: 2 });
    assert.equal(reloaded.run('save.coin'), legacy.coin - 750);
    assert.deepEqual(reloaded.data('save.hold'), legacy.hold);
    assert.deepEqual(reloaded.data('save.holdR'), legacy.holdR);

    if (legacy === LEGACY_PARTIAL) {
      assert.equal(reloaded.run('sellAllFish()'), true);
      reloaded.run('flushSave()');
      const sold = game({ raw: reloaded.storage.get(SAVE_KEY) });
      assert.deepEqual(sold.data('aquariumStock()'), []);
      assert.equal(sold.run('save.coin'), LEGACY_SOLD.coin - 750);
      assert.equal(sold.run('sellFish("shark",true,1)'), false);
    } else {
      assert.deepEqual(reloaded.data('aquariumStock()'), []);
      assert.equal(reloaded.run('sellAllFish()'), false);
    }
  }
});

// Changed: isolate collisions while retaining real input dispatch and spear motion.
function encounter(options) {
  const app = game(options);
  app.run(`startRun("diver"); closeMsg(); chest=null;
    player.x=worldW()/2; player.y=seaTop+150; player.dir=1;
    globalThis.enemy=new Being("shark"); enemy.aggressive=false;
    enemy.hp=enemy.maxHp=30;
    enemy.x=player.x+DV_CX+60-enemy.w/2;
    enemy.y=player.y+16-enemy.h/2;
    beings=[enemy]; camX=player.x-SW/2; cam=player.y-SH/2;`);
  return app;
}

function primaryTrip(app, expectedHealth) {
  app.run('stepSpear(spear.cooldown); controlAction("primary")');
  assert.equal(app.run('spear.on'), 1, 'primary control launches the spear');
  app.run('for(let n=0;n<200 && spear.on && !spear.back;n++) stepSpear(1)');
  assert.equal(app.run('spear.back'), 1, 'collision starts the return trip');
  assert.equal(app.run('enemy.hp'), expectedHealth);
  // Keep the shark overlapping the returning tip, so a mistaken return-hit
  // path would register more than one hit before the next button press.
  for (let n = 0; n < 200 && app.run('spear.on'); n++) {
    app.run('enemy.x=spear.x-enemy.w/2; stepSpear(1)');
    assert.equal(app.run('enemy.hp'), expectedHealth, 'return trip cannot hit again');
  }
  assert.equal(app.run('spear.on'), 0, 'spear returns to the diver');
  app.run('enemy.x=player.x+DV_CX+60-enemy.w/2');
}

test('primary control requires three complete tier-1 spear trips in portrait and landscape', () => {
  for (const [width, height] of [[402, 844], [844, 390]]) {
    const app = encounter({ width, height });
    app.run('save.up.weapon=1');
    for (const hp of [20, 10, 0]) {
      primaryTrip(app, hp);
      assert.equal(app.run('save.hold.shark || 0'), hp ? 0 : 1);
      assert.equal(app.run('mode'), hp ? 'dive' : 'catch');
    }
    assert.equal(app.run('save.caught.shark'), 1);
    assert.equal(app.run('catchCard.id'), 'shark');
    assert.equal(app.run('beings.includes(enemy)'), false);
  }
});

// Changed: preserve #15's crowd-damage and fatal-input cancellation guarantees.
test('overlapping sharks share player protection and fatal contact cancels an active spear', () => {
  const app = encounter();
  app.run(`enemy.step=()=>{}; enemy.x=player.x+DV_CX-enemy.w/2;
    enemy.y=player.y+DV_CY-enemy.h/2;
    const other=new Being("shark"); other.step=()=>{};
    other.x=enemy.x; other.y=enemy.y; beings.push(other);
    stepBeings(1);`);
  assert.equal(app.run('player.hp'), 9, 'one contact, even with two overlapping sharks');
  assert.equal(app.run('save.stat.snap'), 1);
  app.run('stepBeings(1)');
  assert.equal(app.run('player.hp'), 9);
  app.run('player.hp=1; player.invulnerable=0; controlAction("primary")');
  assert.equal(app.run('spear.on'), 1);
  app.run('stepBeings(1)');
  assert.equal(app.run('mode'), 'over');
  assert.equal(app.run('player.hp'), 0);
  assert.equal(app.run('spear.on'), 0);
  assert.equal(app.run('save.stat.snap'), 2, 'fatal overlap is processed only once');
});

// Changed: higher-tier weapons must not alter boat hazards or unlock megalodon.
test('boat bait still snaps and a maximum-tier spear cannot catch a megalodon', () => {
  const app = encounter();
  app.run(`save.up.line=15; save.up.weapon=3; player.role="boat";
    rod.state="out"; rod.x=player.x+rodTipX();
    enemy.x=rod.x-enemy.w/2; rod.y=enemy.cy(); stepBoat(1,false);`);
  assert.equal(app.run('rod.state'), 'reel');
  assert.equal(app.run('save.stat.snap'), 1);
  assert.equal(app.run('enemy.hp'), 30);
  assert.equal(app.run('save.caught.shark || 0'), 0);

  app.run(`player.role="diver"; player.y=seaTop+150; closeMsg();
    const mega=new Being("mega");
    mega.x=player.x+DV_CX+100-mega.w/2; mega.y=player.y+16-mega.h/2;
    beings=[mega]; controlAction("primary");
    for(let n=0;n<200 && spear.on;n++) stepSpear(1);`);
  assert.equal(app.run('save.seen.mega'), 1, 'the real spear collision reaches the megalodon');
  assert.equal(app.run('save.caught.mega || 0'), 0);
  assert.equal(app.run('save.hold.mega || 0'), 0);
  assert.equal(app.run('mode'), 'dive');
});

// Changed: preserve PR #15's marker placement and visibility over deep-water shading.
test('shark warnings clear the HUD, gauge and message and render after darkness at mobile scales', () => {
  for (const [width, height] of [[320, 568], [402, 844], [844, 390]]) {
    for (const pixelRatio of [1, 3]) {
      const app = encounter({ width, height, pixelRatio });
      app.run(`enemy.hp=20; enemy.hostile=true; enemy.state="warn"; enemy.stateTime=36;
        say(T("m.sharkpush"),C.danger);
        globalThis.markerRects=[];
        const originalRect=rect;
        rect=(...args)=>{markerRects.push(args); return originalRect(...args)};`);
      const bounds = app.data(`({ratio:PIXEL_SCALE/UI_PIXEL_SCALE,
        headerBottom:headerLayout().y+headerLayout().h,
        gaugeLeft:UW-GAUGE_W-3,
        messageTop:UH-(msg.lines.length*lineH(msg.text)+10)-3})`);
      // Clamp markers even when the shark's center is outside a screen edge.
      for (const [x, y] of [[-100, -100], [width, -100], [-100, height], [width, height]]) {
        app.run(`markerRects.length=0; drawSharkStatus(enemy,${x},${y})`);
        const rectangles = app.data('markerRects');
        assert.equal(rectangles.length, 4, 'health bar and both warning strokes are painted');
        for (const [rx, ry, rw, rh] of rectangles) {
          const label = `${width}x${height} DPR ${pixelRatio}: ${rx},${ry},${rw},${rh}`;
          assert.ok(rx >= 0, label);
          assert.ok((rx + rw) * bounds.ratio < bounds.gaugeLeft, label);
          assert.ok(ry * bounds.ratio > bounds.headerBottom, label);
          assert.ok((ry + rh) * bounds.ratio < bounds.messageTop, label);
        }
      }

      app.run(`rect=originalRect; markerRects.length=0;
        player.y=seaTop+(seaBed-seaTop)*.9; cam=player.y-SH/2;
        enemy.x=camX+SW/2-enemy.w/2; enemy.y=cam+SH/2-enemy.h/2;
        globalThis.layers=[]; globalThis.darkBlocks=0;
        const originalDarkness=drawDarkness, originalGlow=drawGlowPass;
        const originalStatus=drawSharkStatus, originalFill=worldContext.fillRect;
        let drawingDarkness=false, drawingStatus=false;
        worldContext.fillRect=function(...args){
          if(drawingDarkness && this.fillStyle==="#01030a") darkBlocks++;
          if(drawingStatus) markerRects.push(args);
          return originalFill.apply(this,args);
        };
        drawDarkness=()=>{layers.push("darkness"); drawingDarkness=true;
          originalDarkness(); drawingDarkness=false;};
        drawGlowPass=()=>{layers.push("glow"); originalGlow();};
        drawSharkStatus=(...args)=>{layers.push("warning"); drawingStatus=true;
          originalStatus(...args); drawingStatus=false;};
        render();`);
      assert.ok(app.run('darkBlocks') > 0, 'actual deep-water darkness was painted');
      assert.deepEqual(app.data('layers'), ['darkness', 'glow', 'warning']);
      assert.equal(app.run('markerRects.length'), 4, 'warning survives the real render path');
    }
  }
});
