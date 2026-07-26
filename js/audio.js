/**
 * audio.js
 * Procedural sound engine built on the Web Audio API — no audio files needed.
 * Produces: Geiger click, UI button click, alarm tone, ambient background hum.
 */
'use strict';

const LabAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let humOsc = null, humGain = null;
  let enabled = true;
  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(ctx.destination);
      initialized = true;
    } catch (e) {
      console.warn('Web Audio API unavailable', e);
    }
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function setEnabled(v) { enabled = v; if (humGain) humGain.gain.value = (v && ambientOn) ? 0.02 : 0; }

  /** Short, sharp Geiger tube click — a filtered noise burst */
  function geigerClick(intensity = 1) {
    if (!enabled || !ctx) return;
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0.5 * Utils.clamp(intensity, 0.2, 1.6);
    src.connect(filter).connect(gain).connect(masterGain);
    src.start();
  }

  function uiClick() {
    if (!enabled || !ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 740;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(masterGain);
    const t = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.start(t); osc.stop(t + 0.09);
  }

  function alarm() {
    if (!enabled || !ctx) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 880;
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(masterGain);
      const t = t0 + i * 0.35;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.start(t); osc.stop(t + 0.3);
    }
  }

  let ambientOn = false;
  function startAmbient() {
    if (!ctx || humOsc) return;
    ambientOn = true;
    humOsc = ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.value = 60;
    humGain = ctx.createGain();
    humGain.gain.value = enabled ? 0.02 : 0;
    humOsc.connect(humGain).connect(masterGain);
    humOsc.start();
  }
  function stopAmbient() {
    ambientOn = false;
    if (humOsc) { try { humOsc.stop(); } catch (e) {} humOsc.disconnect(); humOsc = null; }
  }

  function setVolume(v) { if (masterGain) masterGain.gain.value = Utils.clamp(v, 0, 1); }

  return { init, resume, geigerClick, uiClick, alarm, startAmbient, stopAmbient, setEnabled, setVolume, get enabled() { return enabled; } };
})();
