/**
 * graph.js
 * Canvas-based scientific graph: axes, gridlines, auto-scaling, best-fit
 * regression line, zoom and PNG export. No charting library dependency.
 */
'use strict';

const Graph = (() => {
  let canvas, ctx;
  let zoom = 1;
  let currentDef = null; // { points, xLabel, yLabel, title, fit, color, logY }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resizeForDPR();
    window.addEventListener('resize', Utils.debounce(() => { resizeForDPR(); render(); }, 150));
  }

  function resizeForDPR() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.width;
    const h = w * (canvas.height / canvas.width) || canvas.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round((canvas.getAttribute('height') / canvas.getAttribute('width')) * w * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setZoom(z) { zoom = Utils.clamp(z, 0.4, 4); render(); }
  function zoomIn() { setZoom(zoom * 1.25); }
  function zoomOut() { setZoom(zoom / 1.25); }

  function plot(def) {
    currentDef = def;
    render();
  }

  function render() {
    if (!ctx || !canvas) return;
    const cssW = canvas.width / (window.devicePixelRatio || 1);
    const cssH = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, cssW, cssH);

    // background
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.fillRect(0, 0, cssW, cssH);

    if (!currentDef || !currentDef.points || currentDef.points.length === 0) {
      ctx.fillStyle = 'rgba(147,168,160,0.6)';
      ctx.font = '13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet — record observations to see the graph', cssW / 2, cssH / 2);
      return;
    }

    const pad = { l: 62, r: 26, t: 30, b: 48 };
    const plotW = (cssW - pad.l - pad.r) * zoom;
    const plotH = (cssH - pad.t - pad.b) * zoom;

    const pts = currentDef.points;
    let xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    let xMin = Math.min(...xs), xMax = Math.max(...xs);
    let yMin = Math.min(0, Math.min(...ys)), yMax = Math.max(...ys);
    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    if (yMin === yMax) { yMax += 1; }
    const xPad = (xMax - xMin) * 0.08 || 1;
    const yPad = (yMax - yMin) * 0.12 || 1;
    xMin -= xPad; xMax += xPad; yMax += yPad;

    const X = x => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;
    const Y = y => pad.t + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    // grid
    ctx.strokeStyle = 'rgba(120,200,180,0.12)';
    ctx.lineWidth = 1;
    const gridN = 8;
    for (let i = 0; i <= gridN; i++) {
      const gx = pad.l + (plotW / gridN) * i;
      const gy = pad.t + (plotH / gridN) * i;
      ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + plotW, gy); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = 'rgba(232,244,238,0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + plotH); ctx.lineTo(pad.l + plotW, pad.t + plotH); ctx.stroke();

    // axis ticks & labels
    ctx.fillStyle = 'rgba(147,168,160,0.85)';
    ctx.font = '10.5px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= gridN; i++) {
      const xv = xMin + ((xMax - xMin) / gridN) * i;
      ctx.fillText(Utils.fmt(xv, xv < 10 ? 2 : 0), pad.l + (plotW / gridN) * i, pad.t + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridN; i++) {
      const yv = yMax - ((yMax - yMin) / gridN) * i;
      ctx.fillText(Utils.fmt(yv, yv < 10 ? 2 : 0), pad.l - 8, pad.t + (plotH / gridN) * i + 4);
    }

    // axis titles
    ctx.fillStyle = 'rgba(77,255,176,0.9)';
    ctx.font = '600 11.5px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentDef.xLabel || 'x', pad.l + plotW / 2, cssH - 10);
    ctx.save();
    ctx.translate(14, pad.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(currentDef.yLabel || 'y', 0, 0);
    ctx.restore();

    if (currentDef.title) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(232,244,238,0.9)';
      ctx.font = '600 12.5px Space Grotesk, sans-serif';
      ctx.fillText(currentDef.title, pad.l, 16);
    }

    // regression line
    if (currentDef.fit) {
      const reg = Utils.linearRegression(pts);
      ctx.strokeStyle = 'rgba(255,176,32,0.85)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(X(xMin), Y(reg.m * xMin + reg.c));
      ctx.lineTo(X(xMax), Y(reg.m * xMax + reg.c));
      ctx.stroke();
      ctx.setLineDash([]);
      currentDef.lastFit = reg;
    }

    // data points + connecting line
    ctx.strokeStyle = currentDef.color || 'rgba(77,255,176,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach((p, i) => { const px = X(p.x), py = Y(p.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();

    pts.forEach(p => {
      const px = X(p.x), py = Y(p.y);
      // error bar if provided
      if (p.err) {
        const yTop = Y(p.y + p.err), yBot = Y(p.y - p.err);
        ctx.strokeStyle = 'rgba(232,244,238,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, yTop); ctx.lineTo(px, yBot); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 3, yTop); ctx.lineTo(px + 3, yTop); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 3, yBot); ctx.lineTo(px + 3, yBot); ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = currentDef.color || '#4dffb0';
      ctx.shadowColor = currentDef.color || '#4dffb0';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function exportPNG(filename = 'graph.png') {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function getFit() { return currentDef ? Utils.linearRegression(currentDef.points) : null; }

  return { init, plot, zoomIn, zoomOut, exportPNG, getFit, render };
})();
