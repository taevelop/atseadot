const { test } = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game.cjs');

function pendingFont() {
  let resolve, reject;
  const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { fonts: { load: () => pending }, resolve, reject };
}

test('font loading finishes before the first game frame and input is ignored until ready', async () => {
  const font = pendingFont(), app = game({ fonts: font.fonts });
  assert.equal(app.run('worldReady'), false);
  assert.equal(app.frames.length, 0);
  app.run('onPress("enter"); koCanvas(menuLabel(0), C.text)');
  assert.equal(app.run('mode'), 'title');
  assert.ok(app.run('koCache.size') > 0);
  font.resolve([{}]);
  await Promise.resolve();
  assert.equal(app.run('worldReady'), true);
  assert.equal(app.run('koCache.size'), 0);
  assert.equal(app.frames.length, 1);
  assert.equal(app.timers.size, 0);
});

test('failed font downloads still start a playable game', async () => {
  const font = pendingFont(), app = game({ fonts: font.fonts });
  font.reject(new Error('Font unavailable'));
  await Promise.resolve();
  assert.equal(app.run('worldReady'), true);
  assert.equal(app.frames.length, 1);
  assert.equal(app.timers.size, 0);
  assert.doesNotThrow(() => app.run('startRun("diver"); render()'));
});

test('a font arriving after the startup deadline refreshes text without restarting the sea', async () => {
  const font = pendingFont(), app = game({ fonts: font.fonts });
  app.timers.values().next().value();
  app.run('startRun("diver"); closeMsg(); player.y=seaTop+(worldH-seaTop)*.3-DV_CY; globalThis.firstBeing=beings[0]; say(T("menu.stats",1492,20)); msg.shown=msgTotal(); koCanvas(menuLabel(0),C.text)');
  assert.equal(app.run('metres()'), 450);
  font.resolve([{}]);
  await Promise.resolve();
  assert.equal(app.frames.length, 1);
  assert.equal(app.run('mode'), 'dive');
  assert.equal(app.run('metres()'), 450);
  assert.equal(app.run('beings[0]===firstBeing'), true);
  assert.equal(app.run('msgDone()'), true);
  assert.equal(app.run('koCache.size'), 0);
});
