const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../site/assets/js/audio.js'), 'utf8');

function audioHarness({ raw = null, storageBlocked = false, unsupported = false, fail = '', deferred = false } = {}) {
  const nodes = [], contexts = [], timers = new Map(), storage = new Map([['atseadot.audio.v1', raw]]);
  const resumes = [];
  let timerId = 0;
  class Param {
    constructor() { this.value = 0; this.events = []; }
    setValueAtTime(value, time) { this.value = value; this.events.push({value, time}); }
    setTargetAtTime(value, time, constant) { this.value = value; this.events.push({value, time, constant}); }
    linearRampToValueAtTime(value, time) { this.events.push({value, time}); }
    exponentialRampToValueAtTime(value, time) { this.events.push({value, time}); }
  }
  class Node {
    constructor(kind) {
      this.kind = kind; this.gain = new Param(); this.frequency = new Param(); this.Q = new Param();
      for (const p of ['threshold','knee','ratio','attack','release']) this[p] = new Param();
      this.connections = []; nodes.push(this);
    }
    connect(node) { this.connections.push(node); }
    disconnect() { this.disconnected = true; }
    start(time = 0, offset) { this.started = time; this.offset = offset; }
    stop(time = 0) { this.ends = time; if (time === 0) this.finish(); }
    finish() { if (!this.ended) { this.ended = true; this.onended?.(); } }
  }
  class Context {
    constructor() {
      if (fail === 'constructor') throw Error('Unavailable');
      this.currentTime = 0; this.sampleRate = 8000; this.state = 'suspended'; this.destination = {};
      this.resumeCount = 0; this.suspendCount = 0; contexts.push(this);
    }
    createGain() { if (fail === 'gain') throw Error('Unavailable'); return new Node('gain'); }
    createBiquadFilter() { return new Node('filter'); }
    createDynamicsCompressor() { return new Node('limiter'); }
    createOscillator() { return new Node('oscillator'); }
    createBufferSource() { return new Node('source'); }
    createBuffer(_, length) { return {getChannelData: () => new Float32Array(length)}; }
    resume() {
      this.resumeCount++;
      if (fail === 'resume') return Promise.reject(Error('Blocked'));
      if (deferred) return new Promise(resolve => resumes.push(() => { this.state = 'running'; resolve(); }));
      this.state = 'running'; return Promise.resolve();
    }
    suspend() { this.suspendCount++; this.state = 'suspended'; return Promise.resolve(); }
  }
  const context = vm.createContext({
    AudioContext: unsupported ? undefined : Context,
    Math: Object.assign(Object.create(Math), {random() { throw Error('Game randomness must not be used'); }}),
    localStorage: {
      getItem(key) { if (storageBlocked) throw Error('Blocked'); return storage.get(key); },
      setItem(key, value) { if (storageBlocked) throw Error('Blocked'); storage.set(key, value); }
    },
    setInterval(fn) { timers.set(++timerId, fn); return timerId; },
    clearInterval(id) { timers.delete(id); }
  });
  vm.runInContext(source, context);
  const audio = context.createAtSeaAudio();
  return { audio, nodes, contexts, timers, storage, resumes,
    advance(time) {
      contexts[0].currentTime = time;
      for (const node of nodes) if (node.ends <= time) node.finish();
      for (const fn of timers.values()) fn();
    },
    data: value => JSON.parse(JSON.stringify(value))
  };
}
module.exports = { audioHarness };
