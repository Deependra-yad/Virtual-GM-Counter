/**
 * utils.js
 * Shared, dependency-free helper functions used throughout the laboratory.
 */
'use strict';

const Utils = (() => {

  /** Clamp a number between min and max */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /** Linear interpolation */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /** Map a value from one range to another */
  function mapRange(v, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return outMin;
    return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
  }

  /** Format a number of seconds as mm:ss */
  function fmtTime(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Zero-pad an integer to a fixed width for segment-style displays */
  function padDigits(n, width) {
    n = Math.round(n);
    const neg = n < 0;
    let s = Math.abs(n).toString().padStart(width, '0');
    if (s.length > width) s = s.slice(-width);
    return (neg ? '-' : '') + s;
  }

  /**
   * Sample a Poisson-distributed random integer with mean `lambda`.
   * Uses Knuth's algorithm for small lambda and a normal approximation
   * (with continuity correction) for large lambda, which is standard
   * practice for real-time detector-count simulation.
   */
  function samplePoisson(lambda) {
    if (lambda <= 0) return 0;
    if (lambda < 30) {
      const L = Math.exp(-lambda);
      let k = 0, p = 1;
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      return k - 1;
    }
    // Normal approximation N(lambda, lambda) for large lambda
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.round(lambda + z * Math.sqrt(lambda)));
  }

  /** Standard Poisson counting error: sigma = sqrt(N) */
  function poissonError(N) { return Math.sqrt(Math.max(0, N)); }

  /** Simple linear least-squares regression: y = mx + c */
  function linearRegression(points) {
    const n = points.length;
    if (n < 2) return { m: 0, c: n === 1 ? points[0].y : 0, r2: 0 };
    let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (const p of points) {
      sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; syy += p.y * p.y;
    }
    const denom = (n * sxx - sx * sx);
    const m = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
    const c = (sy - m * sx) / n;
    const num = (n * sxy - sx * sy);
    const denomR = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    const r = denomR === 0 ? 0 : num / denomR;
    return { m, c, r2: r * r };
  }

  /** Format number in scientific-ish fixed notation */
  function fmt(v, digits = 2) {
    if (!isFinite(v)) return '—';
    if (Math.abs(v) !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e6)) {
      return v.toExponential(digits);
    }
    return v.toFixed(digits);
  }

  function uid() { return Math.random().toString(36).slice(2, 10); }

  /** Debounce helper */
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /** Download a text blob as a file */
  function downloadBlob(content, filename, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /** Escape HTML for safe interpolation */
  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function toast(message, opts = {}) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (opts.warn ? ' warn' : '');
    el.innerHTML = `<i class="fa-solid ${opts.icon || 'fa-circle-check'}"></i><span>${esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, opts.duration || 3200);
  }

  return {
    clamp, lerp, mapRange, fmtTime, padDigits, samplePoisson, poissonError,
    linearRegression, fmt, uid, debounce, downloadBlob, esc, toast
  };
})();
