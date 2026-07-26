/**
 * ai.js
 * Fully offline "AI" subsystem — no network calls. Two features:
 *   1. AI Lab Assistant: a rule-based Q&A chat over the lab manual content.
 *   2. AI Data Solver: analyses recorded observations for the active
 *      experiment and produces theory + calculations + regression-based
 *      conclusion, formatted as HTML with MathJax markup.
 */
'use strict';

const AI = (() => {

  // ---------- Chat assistant ----------
  const KB = [
    { keys: ['plateau', 'threshold'], ans: 'The GM plateau is the voltage range where count rate rises only slowly (~0.1%/V) because every ionising event triggers a full, fixed-size avalanche. Operate the tube about one-third of the way into the plateau from its threshold voltage for stable readings.' },
    { keys: ['inverse square', '1/d', 'distance law'], ans: 'The inverse square law, I = I0/d², follows from radiation spreading isotropically over an expanding sphere of area 4πd². Plotting I against 1/d² should give a straight line through the origin.' },
    { keys: ['absorption', 'mu', 'absorption coefficient'], ans: 'Absorption of beta or gamma radiation is approximately exponential: I = I0·e^(−μx). Plot ln I against thickness x — the magnitude of the slope is the absorption coefficient μ.' },
    { keys: ['mass absorption'], ans: 'Mass absorption coefficient μm = μ/ρ normalises absorption by density, using mass thickness (ρx, in g/cm²) instead of geometric thickness. It lets you compare different materials on the same footing.' },
    { keys: ['half life', 'half-life', 'decay'], ans: 'Radioactive decay follows N = N0·e^(−λt) with λ = ln2/T½. Plot ln(count rate) vs time; the slope is −λ, and T½ = 0.693/λ.' },
    { keys: ['dead time'], ans: 'Dead time is the brief interval after each detected pulse during which the GM tube cannot register another event. For a non-paralyzable detector, the true rate relates to the observed rate by n_true = n_obs/(1 − n_obs·τ).' },
    { keys: ['poisson', 'error', 'statistics', 'uncertainty'], ans: 'Radioactive counting follows Poisson statistics: for N counts, the standard statistical error is √N, so the percentage error is (√N/N)×100%. Longer counting times reduce the relative error.' },
    { keys: ['background'], ans: 'Background counts come from cosmic rays and ambient radioactivity. Always measure the background count rate (source removed) and subtract it from every source reading before analysis.' },
    { keys: ['quench', 'quenching'], ans: 'A quenching gas (often a halogen or organic vapour) absorbs UV photons and captures ions inside the GM tube to stop spurious secondary avalanches, giving the tube a clean, single pulse per ionising event.' },
    { keys: ['range', 'foil', 'beta particle'], ans: 'The range of beta particles is the thickness of absorber at which the count rate falls to background level. Beta particles have a continuous energy spectrum, so their absorption curve is approximately exponential rather than sharply cut off.' },
    { keys: ['hv', 'voltage', 'high voltage'], ans: 'Applied voltage controls the electric field in the GM tube. Below the plateau, ion recombination reduces the count rate; within the plateau, count rate is stable; above it, continuous discharge occurs and can damage the tube.' },
    { keys: ['csv', 'export'], ans: 'Use the CSV button above the observation table to export your recorded data, or the PNG button on the Graph tab to save the plotted graph as an image.' },
    { keys: ['report'], ans: 'Open Settings → Generate Academic Report to produce a printable lab report with your name, roll number, theory, observation table and conclusion pre-filled from your data.' }
  ];

  function chatReply(question, expKey) {
    const q = question.toLowerCase();
    for (const entry of KB) {
      if (entry.keys.some(k => q.includes(k))) return entry.ans;
    }
    if (/hi|hello|hey/.test(q)) return `Hello! I can help explain theory, formulae or procedure for the ${Manual.getTitle(expKey)} experiment, or any general GM counter concept. What would you like to know?`;
    if (/help|what can you/.test(q)) return 'Ask me about: plateau region, inverse square law, absorption coefficient, mass absorption, half-life, dead time, Poisson statistics, background radiation, or quenching gas.';
    return `I don't have a specific answer for that yet, but here's a summary of the current experiment's theory: ${Manual.getPlainText(expKey).slice(0, 260)}...`;
  }

  // ---------- Data solver ----------
  function analyse(expKey, rows) {
    if (!rows || rows.length < 2) {
      return `<p class="solver-placeholder">Need at least 2–3 recorded observations to run analysis. Record more readings first.</p>`;
    }
    switch (expKey) {
      case 'plateau': return analysePlateau(rows);
      case 'inverse-square': return analyseInverseSquare(rows);
      case 'beta-absorption': return analyseAbsorption(rows, false);
      case 'mass-absorption': return analyseAbsorption(rows, true);
      case 'half-life': return analyseHalfLife(rows);
      default: return `<p>Unknown experiment.</p>`;
    }
  }

  function tableHTML(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function analysePlateau(rows) {
    const pts = rows.map(r => ({ x: r.voltage, y: r.cpm }));
    const sorted = [...pts].sort((a, b) => a.x - b.x);
    // crude plateau-region detection: middle 50% of points by voltage
    const n = sorted.length;
    const plateauPts = sorted.slice(Math.floor(n * 0.25), Math.ceil(n * 0.75) + 1);
    const reg = Utils.linearRegression(plateauPts.length >= 2 ? plateauPts : sorted);
    const v1 = sorted[0].x, v2 = sorted[n - 1].x;
    const n1 = sorted[0].y, n2 = sorted[n - 1].y;
    const slopePct = n1 !== 0 ? ((n2 - n1) / n1) * (100 / (v2 - v1)) : 0;
    return `
      <h3>Theory</h3>
      <p>The plateau region is where count rate $N$ rises slowly and near-linearly with voltage $V$. Slope is estimated as $\\%\\Delta N$ per volt across the recorded range.</p>
      <h3>Observed Data Summary</h3>
      ${tableHTML(['V (V)', 'CPM'], sorted.map(p => [Utils.fmt(p.x, 0), Utils.fmt(p.y, 0)]))}
      <h3>Calculation</h3>
      <p>Linear fit within the estimated plateau region: slope $m = ${Utils.fmt(reg.m, 3)}$ CPM/V, intercept $c = ${Utils.fmt(reg.c, 1)}$, $R^2 = ${Utils.fmt(reg.r2, 3)}$.</p>
      <p>Overall slope estimate (endpoint method) $= ${Utils.fmt(slopePct, 4)}\\%$ per volt between $V=${v1}$ V and $V=${v2}$ V.</p>
      <div class="result-box"><b>Conclusion:</b> The plateau slope is approximately ${Utils.fmt(Math.abs(slopePct), 3)}% per volt. ${Math.abs(slopePct) < 0.5 ? 'This is a healthy, flat plateau — a good sign of a well-functioning GM tube.' : 'A slope this steep suggests the recorded range extends into recombination or early discharge — consider re-examining points near the extremes.'}</div>
      <h3>Precautions</h3>
      <p>Avoid extended operation near or beyond the discharge onset voltage.</p>`;
  }

  function analyseInverseSquare(rows) {
    const pts = rows.map(r => ({ x: 1 / (r.distance * r.distance), y: r.rate, err: Utils.poissonError(r.counts) / (r.time || 1) }));
    const reg = Utils.linearRegression(pts);
    const logPts = rows.map(r => ({ x: Math.log(r.distance), y: Math.log(Math.max(1e-6, r.rate)) }));
    const logReg = Utils.linearRegression(logPts);
    return `
      <h3>Theory</h3>
      <p>$I = I_0/d^2$, so a plot of $I$ vs $1/d^2$ should be linear through the origin; equivalently $\\log I$ vs $\\log d$ should have slope $\\approx -2$.</p>
      <h3>Observed Data Summary</h3>
      ${tableHTML(['d (cm)', 'I (CPS)', '1/d² (cm⁻²)'], rows.map(r => [Utils.fmt(r.distance, 1), Utils.fmt(r.rate, 3), Utils.fmt(1 / (r.distance * r.distance), 4)]))}
      <h3>Calculation</h3>
      <p>Linear fit $I$ vs $1/d^2$: slope $= ${Utils.fmt(reg.m, 2)}$, intercept $= ${Utils.fmt(reg.c, 3)}$, $R^2 = ${Utils.fmt(reg.r2, 3)}$.</p>
      <p>Log–log fit slope (expected $\\approx -2$): $${Utils.fmt(logReg.m, 3)}$$</p>
      <div class="result-box"><b>Conclusion:</b> With $R^2 = ${Utils.fmt(reg.r2, 3)}$ and log–log slope ${Utils.fmt(logReg.m, 2)} (theory: −2), the data ${reg.r2 > 0.9 ? 'strongly supports' : 'is broadly consistent with'} the inverse square law.</div>`;
  }

  function analyseAbsorption(rows, isMass) {
    const xKey = isMass ? 'massThickness' : 'thickness';
    const pts = rows.map(r => ({ x: r[xKey], y: Math.log(Math.max(1e-6, r.rate)) }));
    const reg = Utils.linearRegression(pts);
    const mu = -reg.m;
    const halfVal = Math.LN2 / Math.max(1e-9, mu);
    return `
      <h3>Theory</h3>
      <p>$I = I_0 e^{-\\mu x}$ &rArr; $\\ln I = \\ln I_0 - \\mu x$. The magnitude of the slope of $\\ln I$ vs ${isMass ? 'mass thickness $\\rho x$' : 'thickness $x$'} gives ${isMass ? '$\\mu_m$' : '$\\mu$'}.</p>
      <h3>Observed Data Summary</h3>
      ${tableHTML([isMass ? 'ρx (g/cm²)' : 'x (mm)', 'I (CPS)', 'ln I'], rows.map(r => [Utils.fmt(r[xKey], 3), Utils.fmt(r.rate, 3), Utils.fmt(Math.log(Math.max(1e-6, r.rate)), 3)]))}
      <h3>Calculation</h3>
      <p>Regression slope $m = ${Utils.fmt(reg.m, 4)}$, $R^2 = ${Utils.fmt(reg.r2, 3)}$.</p>
      <p>$${isMass ? '\\mu_m' : '\\mu'} = ${Utils.fmt(mu, 4)}\\ ${isMass ? 'cm^2g^{-1}' : 'cm^{-1}'}$$</p>
      <p>Half-value thickness $= \\dfrac{\\ln 2}{${isMass ? '\\mu_m' : '\\mu'}} = ${Utils.fmt(halfVal, 3)}\\ ${isMass ? 'g/cm^2' : 'mm'}$</p>
      <div class="result-box"><b>Conclusion:</b> ${isMass ? 'Mass absorption coefficient' : 'Absorption coefficient'} ≈ ${Utils.fmt(mu, 3)} ${isMass ? 'cm²/g' : 'cm⁻¹'} with fit quality $R^2=${Utils.fmt(reg.r2, 3)}$, consistent with exponential attenuation theory.</div>`;
  }

  function analyseHalfLife(rows) {
    const pts = rows.map(r => ({ x: r.time, y: Math.log(Math.max(1e-6, r.rate)) }));
    const reg = Utils.linearRegression(pts);
    const lambda = -reg.m;
    const halfLife = Math.LN2 / Math.max(1e-9, lambda);
    return `
      <h3>Theory</h3>
      <p>$N=N_0e^{-\\lambda t}$ &rArr; $\\ln I = \\ln I_0 - \\lambda t$. Slope of $\\ln I$ vs $t$ gives $-\\lambda$, and $T_{1/2} = \\ln2/\\lambda$.</p>
      <h3>Observed Data Summary</h3>
      ${tableHTML(['t (s)', 'I (CPS)', 'ln I'], rows.map(r => [Utils.fmt(r.time, 1), Utils.fmt(r.rate, 3), Utils.fmt(Math.log(Math.max(1e-6, r.rate)), 3)]))}
      <h3>Calculation</h3>
      <p>Regression slope $m = ${Utils.fmt(reg.m, 5)}$ s⁻¹, $R^2 = ${Utils.fmt(reg.r2, 3)}$.</p>
      <p>$$\\lambda = ${Utils.fmt(lambda, 5)}\\ \\text{s}^{-1}, \\qquad T_{1/2} = \\frac{0.693}{\\lambda} = ${Utils.fmt(halfLife, 2)}\\ \\text{s}$$</p>
      <div class="result-box"><b>Conclusion:</b> Measured half-life ≈ ${Utils.fmt(halfLife, 2)} s (fit quality $R^2=${Utils.fmt(reg.r2, 3)}$).</div>`;
  }

  return { chatReply, analyse };
})();
