const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../site/assets/js/game.js'), 'utf8');

// Execute the actual browser script with deterministic time/randomness. Canvas
// painting is mocked here; real font metrics and controls are checked in Chrome.
function game({ raw = null, width = 1258, height = 622, storageBlocked = false, fonts } = {}) {
  const viewport = { width, height, left: 0, top: 0 };
  const events = new Map(), canvasEvents = new Map(), documentEvents = new Map();
  const storage = new Map([['atseadot.v4', raw]]), timers = new Map(), frames = [];
  let timerId = 0;
  const listen = map => (name, fn) => map.set(name, [...(map.get(name) || []), fn]);
  const context2d = () => new Proxy({
    measureText: text => ({ width: [...String(text)].reduce((n, c) => n + (c.charCodeAt(0) > 127 ? 11 : 6), 0) }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  }, { get: (target, key) => key in target ? target[key] : () => {} });
  const canvas = () => ({ width: 0, height: 0, getContext: () => context2d() });
  const screen = { ...canvas(), getBoundingClientRect: () => viewport,
    addEventListener: listen(canvasEvents), setPointerCapture() {} };
  const document = { documentElement: { lang: '' }, visibilityState: 'visible',
    fonts, getElementById: id => id === 'screen' ? screen : null,
    createElement: canvas, querySelectorAll: () => [], addEventListener: listen(documentEvents) };
  const random = Object.create(Math);
  random.random = () => 0.5;
  const context = vm.createContext({ document, Math: random, console,
    innerWidth: width, innerHeight: height, performance: { now: () => 0 },
    addEventListener: listen(events), requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
    localStorage: {
      getItem(key) { if (storageBlocked) throw Error('Storage unavailable'); return storage.get(key) ?? null; },
      setItem(key, value) { if (storageBlocked) throw Error('Storage unavailable'); storage.set(key, value); }
    }
  });
  vm.runInContext(source, context, { filename: 'game.js' });
  const run = code => vm.runInContext(code, context);
  const data = code => JSON.parse(JSON.stringify(run(code)));
  return { run, data, storage, timers, frames, context,
    resize(w, h) { viewport.width = w; viewport.height = h; run('resize()'); },
    emit(name) { for (const fn of events.get(name) || []) fn(); },
    hide() { document.visibilityState = 'hidden'; for (const fn of documentEvents.get('visibilitychange') || []) fn(); },
    click(box) {
      const size = data('({w:SW,h:SH})');
      const e = { pointerId: 1, button: 0,
        clientX: (box.x + box.w / 2) / size.w * viewport.width,
        clientY: (box.y + box.h / 2) / size.h * viewport.height };
      for (const fn of canvasEvents.get('pointerdown')) fn(e);
      for (const fn of canvasEvents.get('pointerup')) fn(e);
    }
  };
}

module.exports = { game };
