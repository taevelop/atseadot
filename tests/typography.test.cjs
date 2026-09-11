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
  app.run('onPress("enter"); textCanvas(menuLabel(0), C.text)');
  assert.equal(app.run('mode'), 'title');
  assert.ok(app.run('textCache.size') > 0);
  font.resolve([{}]);
  await Promise.resolve();
  assert.equal(app.run('worldReady'), true);
  assert.equal(app.run('textCache.size'), 0);
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
  app.run('startRun("diver"); closeMsg(); player.y=seaTop+(worldH-seaTop)*.3-DV_CY; globalThis.firstBeing=beings[0]; say(T("menu.stats",1492,20)); msg.shown=msgTotal(); textCanvas(menuLabel(0),C.text)');
  assert.equal(app.run('metres()'), 450);
  font.resolve([{}]);
  await Promise.resolve();
  assert.equal(app.frames.length, 1);
  assert.equal(app.run('mode'), 'dive');
  assert.equal(app.run('metres()'), 450);
  assert.equal(app.run('beings[0]===firstBeing'), true);
  assert.equal(app.run('msgDone()'), true);
  assert.equal(app.run('textCache.size'), 0);
});

test('Retina and fractional display densities use equal integer-sized game pixels', () => {
  for (const [width, height, pixelRatio] of [[402,645,3], [393,647,3], [390,642,2.625], [320,411,2], [844,271,1.25]]) {
    const app = game({ width, height, pixelRatio });
    const display = app.data('({w:screenCv.width,h:screenCv.height,sw:SW,sh:SH,scale:PIXEL_SCALE})');
    assert.equal(display.w, Math.round(width * pixelRatio));
    assert.equal(display.h, Math.round(height * pixelRatio));
    assert.ok(Number.isInteger(display.scale));
    assert.ok(display.sw * display.scale >= display.w && display.sw * display.scale - display.w < display.scale);
    assert.ok(display.sh * display.scale >= display.h && display.sh * display.scale - display.h < display.scale);
    app.context.sample = { clientX: 42.5 * display.scale / display.w * width, clientY: 33.5 * display.scale / display.h * height };
    const point = app.data('toLogical(sample)');
    assert.ok(Math.abs(point.x - 42.5) < 1e-9 && Math.abs(point.y - 33.5) < 1e-9);
  }
});

test('changing display density preserves the sea and title click targets', () => {
  const app = game({ width: 402, height: 645, pixelRatio: 3 });
  app.run('startRun("diver"); player.y=seaTop+(worldH-seaTop)*.3-DV_CY; globalThis.firstBeing=beings[0]');
  app.context.devicePixelRatio = 2;
  app.resize(402,645);
  assert.equal(app.run('screenCv.width'), 804);
  assert.equal(app.run('metres()'), 450);
  assert.equal(app.run('beings[0]===firstBeing'), true);
  app.run('mode="title"');
  app.click(app.data('titleLayout().items[1]'));
  assert.equal(app.run('player.role'), 'boat');
});

test('mobile menus and long progress totals fit their panels in both languages', () => {
  for (const [width,height] of [[402,645],[390,633],[360,411],[320,411],[874,273],[568,201]]) {
    const app = game({width,height,pixelRatio:3});
    for (const language of ['ko','en']) {
      app.context.testLanguage = language;
      app.run('setLang(testLanguage); save.deepest=1492; save.caught[GUIDE[0].id]=123456');
      const layout = app.data('titleLayout()');
      assert.ok(layout.x >= 0 && layout.x + layout.w <= app.run('UW'));
      assert.ok(layout.footer.y + layout.footer.h <= app.run('UH'), language + ' ' + width + 'x' + height);
      assert.equal(app.run('MENU_KEYS.every((_,i)=>textWidth(menuLabel(i))<=titleLayout().w-32)'), true);
      assert.equal(app.run('titleLayout().footer.lines.every(t=>textWidth(t)<=titleLayout().footer.w-16)'), true);
      assert.equal(app.run('titleLayout().rowH >= lineH()'), true);
    }
  }
});

test('compact UI keeps integer pixel steps and accurate menu and dialog hit targets', () => {
  for (const [width,height,pixelRatio] of [[402,661,3],[390,633,2.625],[568,201,2],[1280,800,1]]) {
    const app=game({width,height,pixelRatio});
    const display=app.data('({w:screenCv.width,h:screenCv.height,uw:UW,uh:UH,ui:UI_PIXEL_SCALE,world:PIXEL_SCALE})');
    assert.ok(Number.isInteger(display.ui) && display.ui<=display.world);
    assert.ok(display.uw*display.ui>=display.w && display.uw*display.ui-display.w<display.ui);
    assert.ok(display.uh*display.ui>=display.h && display.uh*display.ui-display.h<display.ui);
    app.click(app.data('titleLayout().items[1]'));
    assert.equal(app.run('player.role'),'boat');
    app.run('onPress("h")');
    app.click(app.data('helpLayout().next'));
    assert.equal(app.run('helpPage'),1);
    app.run('onPress("escape"); onPress("g"); onPress("enter")');
    app.click(app.data('infoLayout().close'));
    assert.equal(app.run('mode'), 'guide');
    assert.equal(app.run('guideDetail'),false);
  }
});

test('keycaps remain whole when mixed instructions wrap or are shortened', () => {
  const app=game();
  for (const language of ['ko','en']) {
    app.context.language=language;
    app.run('setLang(language)');
    for (const width of [48,64,96,150]) {
      app.context.room=width;
      const strings=app.data('[...wrapLines(T("m.start.boat2"),room),fit(T("menu.pick"),room)]');
      app.context.strings=strings;
      assert.equal(app.run('strings.every(text=>textWidth(text)<=room)'),true);
      assert.ok(strings.every(text=>!text.replace(/\[[^\[\]]+\]/g,'').match(/[\[\]]/)));
    }
    assert.equal(app.run('T("m.got","FISH",405).includes("405M")'),true,'metres must remain a unit, not an M key');
  }
});

test('resizing reflows completed dialogue to the UI width without restarting its progress', () => {
  const app=game({width:1280,height:800,pixelRatio:3});
  app.run('startRun("diver"); closeMsg(); say(T("m.start.boat2")); msg.shown=msgTotal(); globalThis.firstBeing=beings[0]');
  app.resize(360,420);
  assert.equal(app.run('msg.lines.every(text=>textWidth(text)<=UW-GAUGE_W-26)'),true);
  assert.equal(app.run('msgDone() && beings[0]===firstBeing'),true);
  assert.doesNotThrow(()=>app.run('render()'));
  assert.equal(app.run('g===worldContext'),true);
});

test('pause label stays clear of long collection totals at intermediate viewport widths', () => {
  for (const width of [360,402,500,768,1280]) {
    const app=game({width,height:660,pixelRatio:3});
    for (const language of ['ko','en']) {
      app.context.language=language;
      app.run('setLang(language); save.caught[GUIDE[0].id]=123456');
      const {header,pause}=app.data('({header:headerLayout(),pause:pauseLayout()})');
      assert.ok(pause.x>=header.x+header.w || pause.y>=header.y+header.h);
    }
  }
});

test('switching language preserves shared UI sizing and title hit areas', () => {
  for (const [width,height,pixelRatio] of [[360,420,3],[402,640,3],[568,190,2],[1280,800,1]]) {
    const app=game({width,height,pixelRatio});
    const layouts=[];
    for (const language of ['ko','en']) {
      app.context.language=language;
      layouts.push(app.data(`(() => {
        setLang(language); save.deepest=1492; save.caught[GUIDE[0].id]=123456;
        const {x,y,w,h,rowH,items,footer}=titleLayout();
        const box=({x,y,w,h})=>({x,y,w,h});
        return {title:{x,y,w,h,rowH,items,footer:box(footer)},
          help:box(helpLayout()),guide:guideLayout(),header:box(headerLayout()),pause:pauseLayout(),
          line:lineH(),keyLine:lineH(T('menu.pick')),gauge:GAUGE_W,font:UI_FONT};
      })()`));
    }
    assert.deepEqual(layouts[0],layouts[1],width+'px language switch');
  }
});
