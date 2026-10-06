/* Run in the local game via: agent-browser eval --stdin < this file.
   OfflineAudioContext verifies actual browser synthesis without speakers. */
(async () => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const duration = 78, rate = 22050;
  const offline = new OfflineAudioContext(1, duration * rate, rate);
  const callbacks = new Set();
  function Context() {
    return new Proxy(offline, {get(target, key) {
      if (key === "resume" || key === "suspend") return () => Promise.resolve();
      if (key === "state") return "running";
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    }});
  }
  const sound = createAtSeaAudio({AudioContext:Context,
    storage:{getItem:()=>null,setItem(){}},
    setInterval(fn){callbacks.add(fn); return fn;}, clearInterval(fn){callbacks.delete(fn);}});
  await sound.unlock();
  let suspension = offline.suspend(.1);
  const rendering = offline.startRendering();
  for (let i = 1; i < duration * 10; i++) {
    await suspension;
    if (i % 10 === 0 && i < 180) sound.playEffect(["bite","catch","rare","chest","spear","cast","reel","hurt","heal","trade","error","over"][i / 10 % 12]);
    if (i === 200) sound.setScene({depth:900});
    if (i === 300) sound.setScene({depth:900,overlay:true});
    if (i === 400) sound.setScene({depth:0});
    if (i === 500) sound.setSettings({music:100,effects:100});
    for (const callback of callbacks) callback();
    if (i < duration * 10 - 1) suspension = offline.suspend((i + 1) / 10);
    await offline.resume();
  }
  const data = (await rendering).getChannelData(0);
  let peak = 0, squares = 0, nonfinite = 0;
  for (const sample of data) { peak = Math.max(peak, Math.abs(sample)); squares += sample * sample; if (!Number.isFinite(sample)) nonfinite++; }
  const rms = (start, end) => {
    let sum = 0;
    for (let i=Math.floor(start*rate);i<Math.floor(end*rate);i++) sum+=data[i]*data[i];
    return Math.sqrt(sum / Math.floor((end-start)*rate));
  };
  const report = {seconds:duration, sampleRate:rate, peak, rms:Math.sqrt(squares/data.length),
    loopBoundaryRms:rms(76.6,77.2), nonfinite, voicesAfterRender:sound.getState().voices};
  assert(nonfinite===0 && peak>0 && peak<1, "Invalid or clipped audio output");
  assert(report.loopBoundaryRms>.001, "Silent loop boundary");
  sound.suspend();
  assert(callbacks.size===0 && sound.getState().voices===0, "Audio resources not released");
  return report;
})();
