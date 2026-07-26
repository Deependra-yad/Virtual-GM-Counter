/**
 * ui.js
 * Canvas-drawn apparatus: GM tube, source holder, absorber, distance scale,
 * animated radiation rays/particles and detector flash. Also drives the
 * ambient full-page background particle field.
 */
'use strict';

const Apparatus = (() => {
  let canvas, ctx, raf;
  let particles = [];
  let flashAlpha = 0;
  let pulseRings = [];
  let lastFrame = 0;
  let particleColor = '#4dffb0';
  let quality = 'high';

  let state = {
    running: false,
    voltage: 400,
    distanceCm: 5,
    thicknessMm: 0,
    materialKey: 'aluminium',
    sourceKey: 'cs137',
    bgRadiationEnabled: true
  };

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 150));
    loop(0);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setState(patch) { Object.assign(state, patch); }
  function setParticleColor(c) { particleColor = c; }
  function setQuality(q) { quality = q; }

  function triggerDetection(intensity = 1) {
    flashAlpha = Math.min(1, flashAlpha + 0.9 * intensity);
    pulseRings.push({ r: 0, alpha: 0.9, t: performance.now() });
    if (pulseRings.length > 12) pulseRings.shift();
  }

  function spawnParticle() {
    const maxParticles = quality === 'low' ? 10 : quality === 'medium' ? 22 : 36;
    if (particles.length >= maxParticles) return;
    particles.push({
      x: 0.30, y: 0.5 + (Math.random() - 0.5) * 0.18,
      speed: 0.006 + Math.random() * 0.01,
      wobble: Math.random() * Math.PI * 2,
      r: 1.6 + Math.random() * 1.6
    });
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(48, ts - lastFrame);
    lastFrame = ts;
    if (!ctx) return;
    render(dt);
  }

  function render(dt) {
    const cssW = canvas.width / (window.devicePixelRatio || 1);
    const cssH = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, cssW, cssH);

    // background gradient
    const bgGrad = ctx.createRadialGradient(cssW * 0.5, cssH * 0.42, 10, cssW * 0.5, cssH * 0.5, cssW * 0.7);
    bgGrad.addColorStop(0, 'rgba(20,40,35,0.5)');
    bgGrad.addColorStop(1, 'rgba(4,8,7,0.9)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cssW, cssH);

    // geometry
    const sourceX = cssW * 0.30;
    const tubeX = cssW * 0.72;
    const midY = cssH * 0.5;
    const tubeW = cssW * 0.10;
    const tubeH = cssH * 0.5;

    // distance scale
    ctx.strokeStyle = 'rgba(147,168,160,0.35)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(sourceX, midY + tubeH * 0.62); ctx.lineTo(tubeX - tubeW / 2, midY + tubeH * 0.62); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(147,168,160,0.7)';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`d = ${state.distanceCm.toFixed(1)} cm`, (sourceX + tubeX - tubeW / 2) / 2, midY + tubeH * 0.62 + 16);

    // source holder
    drawSource(sourceX, midY);

    // absorber (if any)
    if (state.thicknessMm > 0) {
      const absorberX = (sourceX + (tubeX - tubeW / 2)) / 2;
      drawAbsorber(absorberX, midY, tubeH);
    }

    // radiation rays / particles travelling from source to tube
    drawRays(sourceX, tubeX - tubeW / 2, midY, dt);

    // GM tube + window + HV glow
    drawTube(tubeX, midY, tubeW, tubeH);

    // detector flash + pulse rings
    drawFlash(tubeX, midY, tubeW, tubeH, dt);

    // labels
    ctx.fillStyle = 'rgba(232,244,238,0.8)';
    ctx.font = '600 11px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SOURCE', sourceX, midY - tubeH * 0.62);
    ctx.fillText('GM TUBE', tubeX, midY - tubeH * 0.62);

    flashAlpha = Math.max(0, flashAlpha - dt * 0.006);
  }

  function drawSource(x, y) {
    // holder stand
    ctx.strokeStyle = 'rgba(147,168,160,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x, y + 60); ctx.stroke();

    const grad = ctx.createRadialGradient(x, y, 2, x, y, 22);
    grad.addColorStop(0, 'rgba(255,176,32,0.95)');
    grad.addColorStop(1, 'rgba(255,176,32,0.05)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffb020';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();

    // radiation trefoil hint
    ctx.strokeStyle = 'rgba(4,20,12,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke();
  }

  function drawAbsorber(x, y, tubeH) {
    const w = Utils.mapRange(state.thicknessMm, 0, 10, 4, 22);
    const h = tubeH * 0.7;
    ctx.fillStyle = 'rgba(147,168,160,0.28)';
    ctx.strokeStyle = 'rgba(147,168,160,0.6)';
    ctx.lineWidth = 1;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = 'rgba(232,244,238,0.7)';
    ctx.font = '9.5px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.materialKey, x, y + h / 2 + 14);
  }

  function drawTube(x, y, w, h) {
    // outer glass envelope
    const grad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    grad.addColorStop(0, 'rgba(120,200,180,0.10)');
    grad.addColorStop(0.5, 'rgba(120,200,180,0.22)');
    grad.addColorStop(1, 'rgba(120,200,180,0.10)');
    ctx.fillStyle = grad;
    roundRect(x - w / 2, y - h / 2, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(147,168,160,0.55)';
    ctx.lineWidth = 1.6;
    roundRect(x - w / 2, y - h / 2, w, h, 14);
    ctx.stroke();

    // anode wire
    ctx.strokeStyle = state.running ? '#ffb020' : 'rgba(255,176,32,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y - h / 2 + 10); ctx.lineTo(x, y + h / 2 - 10); ctx.stroke();

    // window facing source
    ctx.fillStyle = 'rgba(77,255,176,0.15)';
    ctx.fillRect(x - w / 2 - 4, y - h * 0.28, 4, h * 0.56);

    // HV indicator glow scaling with voltage
    const eff = Physics.voltageEfficiency(state.voltage);
    const glowAlpha = Utils.clamp(eff / 1.3, 0, 0.9);
    ctx.save();
    ctx.globalAlpha = glowAlpha * 0.5;
    ctx.shadowColor = Physics.isDischarge(state.voltage) ? '#ff4d5e' : '#4dffb0';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = ctx.shadowColor;
    ctx.lineWidth = 2;
    roundRect(x - w / 2, y - h / 2, w, h, 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlash(x, y, w, h, dt) {
    if (flashAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, w * 1.4);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.4, 'rgba(77,255,176,0.5)');
      grad.addColorStop(1, 'rgba(77,255,176,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, w * 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const now = performance.now();
    pulseRings.forEach(ring => {
      const age = (now - ring.t) / 500;
      if (age > 1) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.7 * (1 - age));
      ctx.strokeStyle = '#4dffb0';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(x, y, w * 0.5 + age * w * 1.1, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    pulseRings = pulseRings.filter(r => (now - r.t) < 520);
  }

  function drawRays(x0, x1, y, dt) {
    if (state.running && Math.random() < 0.35) spawnParticle();
    ctx.save();
    particles.forEach(p => { p.x += p.speed * (dt / 16); });
    particles = particles.filter(p => p.x < 1.02);
    particles.forEach(p => {
      const px = Utils.lerp(x0, x1, p.x);
      const py = y + Math.sin(p.wobble + p.x * 10) * 8;
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = particleColor;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return { init, setState, triggerDetection, setParticleColor, setQuality };
})();

/* ============================================================
   Ambient full-page background radiation particle field
   ============================================================ */
const BGParticles = (() => {
  let canvas, ctx, raf, particles = [];
  let enabled = true;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 150));
    for (let i = 0; i < 46; i++) particles.push(makeParticle());
    loop();
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * (canvas?.width || window.innerWidth),
      y: Math.random() * (canvas?.height || window.innerHeight),
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.4 + 0.1
    };
  }

  function setEnabled(v) { enabled = v; }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!ctx || !enabled) { if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.fillStyle = `rgba(77,255,176,${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return { init, setEnabled };
})();
