const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '../site');

test('the game viewport cannot be enlarged by double-tapping on iOS', () => {
  const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]+)"/i);

  assert.ok(viewport, 'the viewport meta tag must be present');
  assert.match(viewport[1], /(?:^|,\s*)initial-scale=1(?:,|$)/);
  assert.match(viewport[1], /(?:^|,\s*)maximum-scale=1(?:,|$)/);
  assert.match(viewport[1], /(?:^|,\s*)user-scalable=no(?:,|$)/);
});

test('the full-screen game surface disables browser touch gestures', () => {
  const css = fs.readFileSync(path.join(site, 'assets/css/style.css'), 'utf8');

  assert.match(css, /html, body\s*\{[^}]*touch-action:\s*none;/s);
  assert.match(css, /canvas#screen\s*\{[^}]*touch-action:\s*none;/s);
});
