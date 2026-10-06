const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const viewports = [[1258, 622], [402, 844], [844, 390]];
const url = process.env.SHARK_TEST_URL || 'http://127.0.0.1:8788';

async function primary(page, desktop) {
  if (desktop) await page.keyboard.press('Space');
  else await page.locator('[data-action="primary"]').tap();
}

async function screenshot(page, phase, width, height) {
  if (width === 402) {
    await page.screenshot({path: `docs/screenshots/shark-${phase}-${width}x${height}.png`});
  }
}

async function statusBounds(page) {
  return page.evaluate(() => {
    // Changed: inspect the restored PR #14 renderer instead of PR #15's marker helper.
    const records = [], originalRect = rect;
    const footerTop = () => (UH - (msg.lines.length
      ? msg.lines.length * lineH(msg.text) + 10
      : lineH(hintText(UW - GAUGE_W - 9)) + 6) - 3) * UI_PIXEL_SCALE / PIXEL_SCALE;
    const sample = (position, sx, sy) => {
      const rectangles = [];
      rect = (x, y, w, h) => rectangles.push({x, y, w, h});
      try { drawSharkStatus(enemy, sx, sy); } finally { rect = originalRect; }
      const top = (headerLayout().y + headerLayout().h) * UI_PIXEL_SCALE / PIXEL_SCALE;
      const right = (UW - GAUGE_W) * UI_PIXEL_SCALE / PIXEL_SCALE;
      records.push({position, top, right, bottom: footerTop(), rectangles});
    };
    sample('center', enemy.x - camX, enemy.y - cam);
    sample('top-right', SW - 20, 0);
    sample('bottom-right-hints', SW - 20, SH - 2);
    say('상어가 돌진합니다! 공격을 피하고 다시 작살을 발사하세요.');
    sample('bottom-right-message', SW - 20, SH - 2);
    closeMsg();
    return records;
  });
}

async function verifyViewport(browser, width, height) {
  const desktop = width === 1258;
  const context = await browser.newContext({viewport: {width, height}, hasTouch: !desktop, isMobile: !desktop});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  try {
    await page.goto(url, {waitUntil: 'networkidle'});
    await page.waitForFunction(() => worldReady);
    assert.equal(await page.title(), 'At Sea :: DOT');
    await page.evaluate(() => {
      save = emptySave(); startRun('diver'); closeMsg(); chest = null;
      save.up.line = 15; save.up.weapon = 1;
      player.x = worldW() / 2; player.y = seaTop + 150;
      camX = player.x - SW / 2; cam = player.y - SH / 2;
      window.enemy = new Being('shark');
      enemy.rare = false; enemy.aggressive = true; enemy.hp = enemy.maxHp = 30;
      enemy.x = player.x + DV_CX + 80 - enemy.w / 2;
      enemy.y = player.y + DV_CY - enemy.h / 2;
      beings = [enemy]; enemy.step(1); enemy.step(6); render(); syncControls();
    });
    assert.equal(await page.evaluate(() => enemy.state), 'warn');
    const status = await statusBounds(page);
    await page.evaluate(() => render());
    await screenshot(page, 'warning', width, height);
    const damage = [], cooldowns = [];
    await page.evaluate(() => {
      enemy.x = player.x + DV_CX + 60 - enemy.w / 2;
      enemy.y = player.y + 16 - enemy.h / 2;
    });
    for (let hit = 0; hit < 3; hit++) {
      await primary(page, desktop);
      assert.equal(await page.evaluate(() => spear.on), 1, 'primary input launches spear');
      const shot = await page.evaluate(() => {
        let ticks = 0;
        while (spear.on && ticks < 200) { stepSpear(1); ticks++; }
        render(); syncControls();
        return {hp: enemy.hp, ticks, returned: !spear.on, cooldown: spear.cooldown};
      });
      assert.ok(shot.returned && shot.ticks < 200, 'spear completes its round trip');
      assert.equal(shot.hp, 20 - hit * 10);
      assert.equal(shot.cooldown, 12);
      damage.push(shot.hp);
      if (hit < 2) {
        // Changed: verify cooldown blocking and expire it with real simulation ticks.
        await primary(page, desktop);
        assert.equal(await page.evaluate(() => spear.on), 0);
        cooldowns.push(await page.evaluate(() => {
          for (let tick = 0; tick < 12; tick++) stepSpear(1);
          return spear.cooldown;
        }));
        assert.equal(cooldowns.at(-1), 0);
      }
    }
    assert.equal(await page.evaluate(() => mode), 'catch');
    assert.deepEqual(await page.evaluate(() => [save.hold.shark, save.caught.shark]), [1, 1]);
    await screenshot(page, 'catch', width, height);
    await page.evaluate(() => flushSave());
    await page.reload({waitUntil: 'networkidle'});
    assert.deepEqual(await page.evaluate(() => [save.hold.shark, save.caught.shark, save.up.weapon, save.combatVersion]), [1, 1, 1, 1]);
    const flow = await page.evaluate(fs.readFileSync('scripts/verification/combat-flow-check.js', 'utf8'));
    const audio = desktop ? await page.evaluate(fs.readFileSync('scripts/verify-audio-browser.js', 'utf8')) : undefined;
    assert.deepEqual(errors, []);
    return {width, height, warning: true, damage, cooldowns, threeRoundTrips: true, reward: 1, reload: true, status, flow, audio, errors};
  } finally { await context.close(); }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
    headless: true, args: ['--no-sandbox']
  });
  try {
    const results = [];
    for (const [width, height] of viewports) results.push(await verifyViewport(browser, width, height));
    for (const result of results) for (const sample of result.status) for (const rect of sample.rectangles) {
      assert.ok(rect.x >= 0 && rect.x + rect.w <= sample.right, `${result.width}: gauge overlap (${sample.position})`);
      assert.ok(rect.y >= sample.top, `${result.width}: HUD overlap (${sample.position})`);
      assert.ok(rect.y + rect.h <= sample.bottom, `${result.width}: footer overlap (${sample.position})`);
    }
    fs.writeFileSync('docs/screenshots/shark-reintegration-browser-results.json', JSON.stringify({
      status: 'passed', verifiedCurrentRecoveryInBrowser: true, results
    }, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
