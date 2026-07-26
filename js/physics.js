/**
 * physics.js
 * The physics engine for the Geiger-Müller counter simulation.
 *
 * Implemented physical models:
 *   - Inverse square law:            I = I0 / d^2
 *   - Exponential absorption:        I = I0 * e^(-mu * x)     (mu = mass absorption coeff, x = mass thickness g/cm^2)
 *   - Radioactive decay / half-life: N = N0 * e^(-lambda t),  lambda = ln2 / T_half
 *   - Poisson counting statistics:   sigma_N = sqrt(N)
 *   - GM plateau region + recombination + discharge regions vs. HV
 *   - Dead-time correction:          n_true = n_observed / (1 - n_observed * tau)
 *   - Background + cosmic-ray contribution
 */
'use strict';

const Physics = (() => {

  // ---- Source library: activity is a *relative* base count rate at 5 cm, 400V, no absorber ----
  const SOURCES = {
    cs137:  { name: 'Cs-137',  type: 'beta-gamma', baseRate: 340, halfLifeSeconds: 30.1 * 365.25 * 24 * 3600, energyFactor: 1.0 },
    co60:   { name: 'Co-60',   type: 'gamma',       baseRate: 260, halfLifeSeconds: 5.27 * 365.25 * 24 * 3600, energyFactor: 1.15 },
    sr90:   { name: 'Sr-90',   type: 'beta',        baseRate: 420, halfLifeSeconds: 28.8 * 365.25 * 24 * 3600, energyFactor: 0.85 },
    am241:  { name: 'Am-241',  type: 'alpha-gamma', baseRate: 180, halfLifeSeconds: 432.2 * 365.25 * 24 * 3600, energyFactor: 0.6 },
    'na22-sim': { name: 'Na-22 (simulated fast decay)', type: 'beta-gamma', baseRate: 500, halfLifeSeconds: 12, energyFactor: 1.0 }
  };

  const BACKGROUND_CPS = 0.35;      // ambient + cosmic ray background
  const DEAD_TIME_SECONDS = 250e-6; // 250 microseconds, typical non-paralyzable GM dead time

  /** GM tube efficiency curve vs applied voltage (models recombination / plateau / discharge regions) */
  function voltageEfficiency(V) {
    // Recombination region: rises steeply 0-350V
    // Plateau region: ~350-750V, slow rise (~0.1%/V), efficiency ~0.92-1.0
    // Discharge region: beyond 750V, runaway increase then instability
    if (V <= 0) return 0;
    if (V < 350) {
      return 0.92 * Math.pow(V / 350, 3); // steep recombination rise
    }
    if (V <= 750) {
      const t = (V - 350) / (750 - 350);
      return 0.92 + 0.08 * t; // gentle plateau slope
    }
    // discharge / continuous-discharge region: efficiency spikes non-physically
    const over = (V - 750) / 150;
    return 1.0 + Math.pow(over, 2.2) * 1.8;
  }

  function isDischarge(V) { return V > 750; }
  function isRecombination(V) { return V < 350; }
  function isPlateau(V) { return V >= 350 && V <= 750; }

  /** Inverse square law geometric attenuation, normalised to 5 cm reference distance */
  function inverseSquareFactor(distanceCm) {
    const d = Math.max(0.5, distanceCm);
    return (5 * 5) / (d * d);
  }

  /** Mass absorption: I = I0 * e^(-mu * x), x in g/cm^2 from thickness(mm) * density */
  const MATERIAL_DENSITY = { aluminium: 2.70, lead: 11.34, paper: 0.80, perspex: 1.19 };

  function absorptionFactor(thicknessMm, materialKey, muOverride) {
    const density = MATERIAL_DENSITY[materialKey] ?? 2.70;
    const xCm = thicknessMm / 10; // mm -> cm
    const massThickness = xCm * density; // g/cm^2
    const mu = muOverride ?? 1.62; // cm^2/g
    return Math.exp(-mu * massThickness);
  }

  /** Decay factor N/N0 = e^(-lambda t) */
  function decayFactor(elapsedSeconds, halfLifeSeconds) {
    const lambda = Math.LN2 / halfLifeSeconds;
    return Math.exp(-lambda * elapsedSeconds);
  }

  /**
   * Compute the instantaneous "true" mean count rate (before dead-time loss),
   * given the current apparatus configuration.
   */
  function computeTrueRateCPS(state) {
    const src = SOURCES[state.sourceKey] || SOURCES.cs137;
    let rate = src.baseRate / 60; // baseRate given as CPM-equivalent at reference -> convert to CPS-ish base
    rate *= src.energyFactor;
    rate *= voltageEfficiency(state.voltage);
    rate *= inverseSquareFactor(state.distanceCm);
    rate *= absorptionFactor(state.thicknessMm, state.materialKey, state.mu);
    rate *= decayFactor(state.elapsedRunSeconds || 0, src.halfLifeSeconds);
    rate += BACKGROUND_CPS;
    return Math.max(0, rate);
  }

  /** Apply non-paralyzable dead-time correction to an observed rate */
  function applyDeadTime(trueRateCPS, tau = DEAD_TIME_SECONDS) {
    // observed = true / (1 + true*tau)  (non-paralyzable model, inverted for forward sim)
    return trueRateCPS / (1 + trueRateCPS * tau);
  }

  function deadTimeCorrectedRate(observedCPS, tau = DEAD_TIME_SECONDS) {
    const denom = 1 - observedCPS * tau;
    if (denom <= 0) return Infinity;
    return observedCPS / denom;
  }

  /** Sample a realistic number of counts for a 1-second tick, given current state */
  function sampleOneSecond(state) {
    const trueRate = computeTrueRateCPS(state);
    const observedRate = applyDeadTime(trueRate);
    const counts = Utils.samplePoisson(observedRate);
    return { counts, trueRate, observedRate };
  }

  return {
    SOURCES, BACKGROUND_CPS, DEAD_TIME_SECONDS, MATERIAL_DENSITY,
    voltageEfficiency, isDischarge, isRecombination, isPlateau,
    inverseSquareFactor, absorptionFactor, decayFactor,
    computeTrueRateCPS, applyDeadTime, deadTimeCorrectedRate, sampleOneSecond
  };
})();
