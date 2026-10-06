/* At Sea original synthesis. No recordings, samples or existing songs. */
"use strict";
(function (root) {
  const KEY = "atseadot.audio.v1";
  const DEFAULTS = { muted: false, music: 30, effects: 50 };
  const STEP = 60 / 100 / 2; // eighth notes, 100 BPM; 256 steps = 32 bars
  // Original eight-note motifs over a four-chord, eight-phrase progression.
  const MOTIFS = [
    [12, 16, 19, 16, 21, 19, 16, null],
    [19, null, 16, 14, 12, 14, 16, 19],
    [12, 19, 24, 21, 19, null, 16, 14],
    [16, 14, 12, null, 7, 14, 12, null]
  ];
  const ROOTS = [48, 53, 57, 55, 48, 57, 53, 55];
  const VARIATIONS = {
    damage: [12, null, 11, null, 7, null, 6, null],
    mega: [12, null, 15, 19, 12, null, 10, 7],
    shark: [12, 10, null, 7, 12, null, 10, 7],
    sub: [12, 19, 24, 19, 16, 19, 26, 24]
  };
  const normalize = value => {
    if (!value || typeof value !== "object" || typeof value.muted !== "boolean" ||
        ![value.music, value.effects].every(n => Number.isInteger(n) && n >= 0 && n <= 100 && n % 10 === 0))
      return { ...DEFAULTS };
    return { muted: value.muted, music: value.music, effects: value.effects };
  };

  function createAtSeaAudio(options = {}) {
    const Context = options.AudioContext || root.AudioContext || root.webkitAudioContext;
    let storage;
    try { storage = options.storage || root.localStorage; } catch (_) {}
    const every = options.setInterval || root.setInterval.bind(root);
    const cancel = options.clearInterval || root.clearInterval.bind(root);
    let settings = { ...DEFAULTS };
    try { settings = normalize(JSON.parse(storage.getItem(KEY))); } catch (_) {}
    let ctx, master, music, effects, ambient, filter, noise;
    let scene = { depth: 0, overlay: false, paused: false, damaged: false, encounter: "normal" };
    const variation = () => scene.damaged ? "damage" : scene.encounter;
    let running = false, available = !!Context, timer = null, pending = null, revision = 0;
    let step = 0, next = 0, seed = 0x51ea2026;
    const voices = new Set(), cooldowns = new Map();
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
    const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
    function gains() {
      if (!ctx || !master || !music || !effects || !filter) return;
      const now = ctx.currentTime;
      master.gain.setTargetAtTime(settings.muted ? 0 : .65, now, .025);
      music.gain.setTargetAtTime(settings.music / 100 * (scene.overlay ? .4 : 1) * (scene.damaged ? .55 : 1), now, .08);
      effects.gain.setTargetAtTime(settings.effects / 100, now, .025);
      filter.frequency.setTargetAtTime(4800 * Math.pow(.18, Math.min(1, scene.depth / 900)), now, .18);
    }
    function init() {
      if (ctx) return;
      ctx = new Context();
      master = ctx.createGain(); music = ctx.createGain(); effects = ctx.createGain();
      ambient = ctx.createGain(); filter = ctx.createBiquadFilter();
      master.gain.value = 0; music.gain.value = 0; effects.gain.value = 0;
      filter.type = "lowpass"; filter.Q.value = .5;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10; limiter.knee.value = 12; limiter.ratio.value = 6;
      limiter.attack.value = .003; limiter.release.value = .08;
      music.connect(filter); filter.connect(master); effects.connect(master); master.connect(limiter); limiter.connect(ctx.destination);
      ambient.gain.value = .015; ambient.connect(effects);
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noise.getChannelData(0);
      let smooth = 0;
      for (let i = 0; i < data.length; i++) { smooth = smooth * .95 + (random() * 2 - 1) * .05; data[i] = smooth * 3; }
      gains();
    }
    function track(source, gain, extra = [], effect = false) {
      const voice = { source, gain, extra, effect };
      voices.add(voice);
      source.onended = () => {
        voices.delete(voice);
        source.disconnect(); gain.disconnect(); extra.forEach(node => node.disconnect());
      };
      return voice;
    }
    function tone(midi, time, length, volume, type = "triangle", bus = music, endMidi) {
      if (voices.size >= 64 || (bus === effects && [...voices].filter(v => v.effect).length >= 16)) return;
      const source = ctx.createOscillator(), gain = ctx.createGain();
      source.type = type; source.frequency.setValueAtTime(hz(midi), time);
      if (endMidi !== undefined) source.frequency.exponentialRampToValueAtTime(hz(endMidi), time + length);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, time + length);
      source.connect(gain); gain.connect(bus); track(source, gain, [], bus === effects);
      source.start(time); source.stop(time + length + .02);
    }
    function hiss(time, length, volume, bus = music, frequency = 1700) {
      if (voices.size >= 64 || (bus === effects && [...voices].filter(v => v.effect).length >= 16)) return;
      const source = ctx.createBufferSource(), gain = ctx.createGain(), low = ctx.createBiquadFilter();
      source.buffer = noise; low.type = "lowpass"; low.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, time + length);
      source.connect(low); low.connect(gain); gain.connect(bus); track(source, gain, [low], bus === effects);
      source.start(time, random()); source.stop(time + length + .02);
    }
    function startAmbient() {
      const source = ctx.createBufferSource(), gain = ctx.createGain(), low = ctx.createBiquadFilter();
      source.buffer = noise; source.loop = true;
      low.type = "lowpass"; low.frequency.value = 400;
      gain.gain.value = 1;
      source.connect(low); low.connect(gain); gain.connect(ambient); track(source, gain, [low], true);
      source.start();
    }
    function schedule() {
      if (!running || settings.muted) return;
      // Drop missed wall time instead of emitting a burst after a stalled frame.
      if (next < ctx.currentTime) next = ctx.currentTime + .025;
      while (next < ctx.currentTime + .18) {
        const bar = Math.floor(step / 8), beat = step % 8;
        const base = ROOTS[Math.floor(bar / 4)];
        const variant = variation();
        const melody = (VARIATIONS[variant] || MOTIFS[(bar + Math.floor(bar / 8)) % 4])[beat];
        if (settings.music > 0) {
          if (melody !== null) tone(base + melody, next, variant === "sub" ? .4 : .23, .065, variant === "sub" ? "sine" : variant === "damage" ? "triangle" : "square");
          if (beat % 2 === 0) tone(base - (["mega", "shark", "damage"].includes(variant) ? 17 : 12) + (beat === 4 ? 7 : 0), next, .4, .12);
          if (beat === 0 || beat === 4) tone(34, next, .11, .12, "sine", music, 20);
          if (variant === "mega" && (beat === 2 || beat === 6)) tone(29, next, .16, .1, "sine", music, 18);
          if (beat === 2 || beat === 6) hiss(next, .08, .055);
          if (beat % 2 === 1) hiss(next, .045, .025, music, 3600);
        }
        if (settings.effects > 0 && step % 16 === 12) {
          hiss(next, .12, .035, effects, 600);
          tone(74, next, .12, .012, "sine", effects, 86);
        }
        step = (step + 1) % 256; next += STEP;
      }
    }
    function stop() {
      running = false; revision++; pending = null;
      if (timer !== null) cancel(timer);
      timer = null;
      for (const voice of [...voices]) {
        try { voice.source.stop(); } catch (_) {}
        voice.source.disconnect(); voice.gain.disconnect(); voice.extra.forEach(node => node.disconnect());
      }
      voices.clear(); cooldowns.clear();
      if (ctx) { try { Promise.resolve(ctx.suspend()).catch(() => {}); } catch (_) {} }
    }
    async function unlock() {
      if (running && ctx.state !== "running") stop();
      if (!available || scene.paused || settings.muted || running) return;
      if (pending) return pending;
      const token = ++revision;
      pending = (async () => {
        try {
          init();
          await ctx.resume();
          if (token !== revision || scene.paused || settings.muted) return;
          running = true; gains(); next = ctx.currentTime + .025;
          startAmbient(); schedule(); timer = every(schedule, 100);
        } catch (_) { available = false; stop(); }
        finally { if (token === revision) pending = null; }
      })();
      return pending;
    }
    const PATTERNS = {
      move: [72], confirm: [72, 79], cancel: [67, 60],
      spear: [55, 43], cast: [60, 72], reel: [72, 67, 60], bite: [84, 79, 84],
      catch: [72, 76, 79], rare: [72, 76, 79, 84, 88, 91], chest: [60, 67, 72, 76, 79],
      trade: [76, 79, 84], error: [43, 42], hurt: [48, 36], heal: [67, 72, 79],
      over: [67, 63, 60, 48], mega: [36, 43, 39, 36], sub: [79, 91, 79],
      sharkWarn: [43, 49, 43], sharkHit: [55, 38], sharkDefeat: [48, 55, 60, 67]
    };
    function playEffect(name) {
      const notes = PATTERNS[name];
      if (!running || scene.paused || settings.muted || !settings.effects || !notes) return false;
      const now = ctx.currentTime, delay = name === "move" ? .08 : .14;
      if (now - (cooldowns.get(name) ?? -Infinity) < delay) return false;
      const splash = ["cast", "spear", "reel", "hurt", "sharkHit"].includes(name);
      if ([...voices].filter(v => v.effect).length + notes.length + (splash ? 1 : 0) > 16) return false;
      cooldowns.set(name, now);
      const length = ["rare", "chest", "over", "mega", "sub"].includes(name) ? .18 : .09;
      notes.forEach((note, i) => tone(note, now + i * length, length * 1.3, .11,
        ["hurt", "error", "spear", "mega", "sharkWarn", "sharkHit"].includes(name) ? "triangle" : "sine", effects));
      if (splash) hiss(now, name === "hurt" ? .12 : .16, name === "hurt" ? .09 : .055, effects, name === "hurt" ? 1300 : 900);
      return true;
    }
    return {
      unlock, playEffect, suspend: stop,
      setScene(value) {
        const wasPaused = scene.paused;
        const nextScene = { depth: Math.max(0, Number(value.depth) || 0), overlay: !!value.overlay, paused: !!value.paused,
          damaged: !!value.damaged, encounter: ["mega", "shark", "sub"].includes(value.encounter) ? value.encounter : "normal" };
        const changed = Object.keys(nextScene).some(key => scene[key] !== nextScene[key]);
        scene = nextScene;
        if (scene.paused && !wasPaused) stop();
        if (changed) gains(); // Resuming requires unlock from a fresh user gesture.
      },
      setSettings(value) {
        settings = normalize({ ...settings, ...value });
        try { storage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
        if (settings.muted) stop();
        gains();
        return { ...settings };
      },
      getSettings: () => ({ ...settings }),
      getState: () => ({ available, running, voices: voices.size, step, variation: variation(), settings: { ...settings } })
    };
  }
  root.createAtSeaAudio = createAtSeaAudio;
})(globalThis);
