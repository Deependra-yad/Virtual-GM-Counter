/**
 * manual.js
 * Static, exam-oriented lab manual content (Aim, Theory, Formulae, Procedure,
 * Observation format, Calculation method, Result, Precautions, Viva Questions)
 * for each of the five implemented experiments.
 */
'use strict';

const Manual = (() => {

  const CONTENT = {
    'plateau': {
      title: 'GM Tube Plateau Characteristics',
      html: `
        <h3>Aim</h3>
        <p>To study the variation of counting rate with applied voltage across a Geiger–Müller (GM) tube and determine the plateau region, operating voltage and plateau slope.</p>
        <h3>Theory</h3>
        <p>A GM tube consists of a cylindrical cathode and a fine central anode wire enclosed in a low-pressure gas (usually argon with a halogen quenching vapour). When ionising radiation enters the tube, it ionises the gas; the resulting electrons are accelerated toward the anode, producing a Townsend avalanche. At low voltage, ion recombination dominates and few pulses are counted (recombination region). As voltage increases, the count rate rises steeply, then enters a broad region — the <b>plateau</b> — where the count rate increases only slowly with voltage because every ionising event produces a full avalanche of essentially fixed size, regardless of the primary ionisation. Beyond the plateau, continuous discharge sets in and the tube can be damaged.</p>
        <h3>Formulae</h3>
        <p>$$\\text{Plateau slope} = \\frac{N_2 - N_1}{N_1}\\times\\frac{100}{V_2-V_1}\\ \\%\\ \\text{per volt}$$</p>
        <p>Operating voltage is usually chosen at roughly one-third of the plateau length from its starting (threshold) voltage.</p>
        <h3>Procedure</h3>
        <ol>
          <li>Place the source at a fixed distance from the GM window.</li>
          <li>Starting from 0 V, increase HV in steps of 25–50 V.</li>
          <li>At each voltage, count for a fixed time interval and record counts.</li>
          <li>Continue until the discharge region is reached (count rate rises sharply); stop immediately to protect the tube.</li>
          <li>Plot counting rate (CPM) versus applied voltage (V).</li>
        </ol>
        <h3>Observation Table Format</h3>
        <p>Voltage (V) · Counts (N) · Time (s) · Count rate (CPM) · Percentage error (±√N/N × 100)</p>
        <h3>Calculation</h3>
        <p>Identify the threshold voltage $V_1$ (start of plateau) and the voltage $V_2$ where discharge begins. Compute the plateau slope using the formula above between two points well inside the plateau.</p>
        <h3>Result</h3>
        <p>The plateau region, threshold voltage, operating voltage and slope (%/V) are determined from the graph.</p>
        <h3>Precautions</h3>
        <ul>
          <li>Never operate the tube in the discharge region for long — it shortens tube life.</li>
          <li>Keep the source–detector distance fixed throughout this experiment.</li>
          <li>Allow sufficient counting time at each voltage to reduce statistical error.</li>
        </ul>
        <h3>Viva Questions</h3>
        <ul>
          <li>Why does the GM tube have a plateau region?</li>
          <li>What is the role of the quenching gas?</li>
          <li>Why should the tube not be operated in the continuous discharge region?</li>
          <li>What is dead time and how does it affect the plateau?</li>
        </ul>`
    },
    'inverse-square': {
      title: 'Inverse Square Law',
      html: `
        <h3>Aim</h3>
        <p>To verify that the intensity of radiation from a point source varies inversely as the square of the distance from the source.</p>
        <h3>Theory</h3>
        <p>Radiation emitted isotropically from a point source spreads over the surface of an expanding sphere of area $4\\pi d^2$. Since the total emission rate is constant, the intensity reaching a detector of fixed area decreases as $1/d^2$:</p>
        <p>$$I = \\frac{I_0}{d^2}$$</p>
        <p>where $I_0$ is a source-dependent constant and $d$ is the source-to-detector distance. A plot of $I$ vs $1/d^2$ should therefore be a straight line through the origin, and a plot of $\\log I$ vs $\\log d$ should have slope $-2$.</p>
        <h3>Formulae</h3>
        <p>$$I \\cdot d^2 = \\text{constant} \\qquad \\log I = \\log I_0 - 2\\log d$$</p>
        <h3>Procedure</h3>
        <ol>
          <li>Fix HV at the operating voltage found from the plateau experiment.</li>
          <li>Record background count rate with the source removed.</li>
          <li>Place the source at successive distances (e.g. 2, 4, 6, 8, 10, 15, 20 cm) from the detector window.</li>
          <li>At each distance, count for a fixed interval and subtract background.</li>
          <li>Tabulate $I$, $d$, $1/d^2$ and plot the graph.</li>
        </ol>
        <h3>Observation Table Format</h3>
        <p>Distance d (cm) · Counts · Time (s) · Net count rate I (CPS) · 1/d² (cm⁻²) · log I · log d</p>
        <h3>Calculation</h3>
        <p>Perform a linear regression of $I$ against $1/d^2$; the near-zero intercept and good linear fit ($R^2$ close to 1) confirm the inverse square relationship. Alternatively fit $\\log I$ vs $\\log d$ and check the slope is close to $-2$.</p>
        <h3>Result</h3>
        <p>The count rate is found to vary as $1/d^2$, verifying the inverse square law within experimental (Poisson) error.</p>
        <h3>Precautions</h3>
        <ul>
          <li>Always subtract background counts before analysis.</li>
          <li>Keep the source on-axis with the detector window at every distance.</li>
          <li>Do not change voltage or absorber during this experiment.</li>
        </ul>
        <h3>Viva Questions</h3>
        <ul>
          <li>Why must background be subtracted?</li>
          <li>What assumptions does the inverse square law make about the source?</li>
          <li>How would self-absorption in the source affect the graph?</li>
        </ul>`
    },
    'beta-absorption': {
      title: 'Beta Absorption',
      html: `
        <h3>Aim</h3>
        <p>To study the absorption of beta particles in matter and determine the absorption coefficient and range of the beta particles.</p>
        <h3>Theory</h3>
        <p>Unlike alpha particles, beta particles are emitted with a continuous energy spectrum, so their absorption in matter is approximately exponential over a useful range (rather than showing a sharp Bragg-like cutoff):</p>
        <p>$$I = I_0\\, e^{-\\mu x}$$</p>
        <p>where $x$ is the absorber thickness and $\\mu$ is the linear absorption coefficient (units cm$^{-1}$). Taking logarithms gives a straight line whose slope is $-\\mu$:</p>
        <p>$$\\ln I = \\ln I_0 - \\mu x$$</p>
        <h3>Formulae</h3>
        <p>$$\\mu = -\\text{slope of } \\ln I \\text{ vs } x \\qquad \\text{Half-value thickness } x_{1/2} = \\frac{\\ln 2}{\\mu}$$</p>
        <h3>Procedure</h3>
        <ol>
          <li>Select a beta source and set the operating HV.</li>
          <li>Record counts with zero absorber (I₀), correcting for background.</li>
          <li>Insert absorber foils of increasing thickness between source and detector.</li>
          <li>Record the count rate at each thickness.</li>
          <li>Plot $\\ln I$ versus thickness $x$.</li>
        </ol>
        <h3>Observation Table Format</h3>
        <p>Thickness x (mm) · Counts · Time (s) · Net rate I (CPS) · ln I</p>
        <h3>Calculation</h3>
        <p>Fit a straight line to $\\ln I$ vs $x$; the magnitude of the slope gives $\\mu$. The range is estimated where the count rate falls to background level.</p>
        <h3>Result</h3>
        <p>The absorption coefficient $\\mu$ and half-value thickness of the chosen absorber for beta particles are determined.</p>
        <h3>Precautions</h3>
        <ul>
          <li>Handle absorber foils with forceps to avoid contamination/fingerprints.</li>
          <li>Keep source-absorber-detector geometry fixed while varying only thickness.</li>
          <li>Correct every reading for background before taking logarithms.</li>
        </ul>
        <h3>Viva Questions</h3>
        <ul>
          <li>Why is beta absorption approximately exponential despite a continuous energy spectrum?</li>
          <li>Distinguish between range and absorption coefficient.</li>
          <li>What is backscattering and how can it affect readings?</li>
        </ul>`
    },
    'mass-absorption': {
      title: 'Mass Absorption Coefficient',
      html: `
        <h3>Aim</h3>
        <p>To determine the mass absorption coefficient of a given material for beta/gamma radiation.</p>
        <h3>Theory</h3>
        <p>The mass absorption coefficient normalises the linear absorption coefficient by material density, making it a property that is comparable across different materials:</p>
        <p>$$\\mu_m = \\frac{\\mu}{\\rho}\\ \\ (\\text{cm}^2\\text{g}^{-1}), \\qquad I = I_0\\, e^{-\\mu_m (\\rho x)}$$</p>
        <p>where $\\rho x$ is the <b>mass thickness</b> in g/cm², a more fundamental variable than geometric thickness because it accounts for the actual mass of material the radiation traverses.</p>
        <h3>Formulae</h3>
        <p>$$\\mu_m = -\\text{slope of } \\ln I \\text{ vs mass thickness } (\\rho x)$$</p>
        <h3>Procedure</h3>
        <ol>
          <li>Select the absorber material and record its density $\\rho$.</li>
          <li>Vary absorber thickness $x$ and compute mass thickness $\\rho x$ for each.</li>
          <li>Record the count rate at each mass thickness (background-corrected).</li>
          <li>Plot $\\ln I$ versus $\\rho x$; the slope magnitude gives $\\mu_m$.</li>
        </ol>
        <h3>Observation Table Format</h3>
        <p>Thickness x (mm) · Density ρ (g/cm³) · Mass thickness ρx (g/cm²) · Net rate I (CPS) · ln I</p>
        <h3>Calculation</h3>
        <p>Linear regression of $\\ln I$ against $\\rho x$ gives slope $= -\\mu_m$. Compare the extracted $\\mu_m$ with the tabulated reference value for the chosen material and radiation energy.</p>
        <h3>Result</h3>
        <p>The mass absorption coefficient of the chosen material is determined and compared with the standard value.</p>
        <h3>Precautions</h3>
        <ul>
          <li>Use uniform, void-free absorber foils of accurately known thickness.</li>
          <li>Keep detector solid angle constant across the run.</li>
          <li>Ensure adequate counting time so statistical error stays small at high thickness (low count rate).</li>
        </ul>
        <h3>Viva Questions</h3>
        <ul>
          <li>Why is mass absorption coefficient preferred over linear absorption coefficient for comparing materials?</li>
          <li>How does $\\mu_m$ vary with atomic number and photon energy for gamma rays?</li>
        </ul>`
    },
    'half-life': {
      title: 'Radioactive Half-Life',
      html: `
        <h3>Aim</h3>
        <p>To determine the half-life of a radioactive source by measuring the decay of its count rate with time.</p>
        <h3>Theory</h3>
        <p>Radioactive decay is a random process where the number of undecayed nuclei $N$ decreases exponentially with time:</p>
        <p>$$N = N_0\\, e^{-\\lambda t}, \\qquad \\lambda = \\frac{\\ln 2}{T_{1/2}}$$</p>
        <p>Since the observed count rate is proportional to the number of decaying nuclei, $I \\propto N$, so $\\ln I$ plotted against $t$ gives a straight line of slope $-\\lambda$, from which the half-life $T_{1/2} = \\ln2/\\lambda$ is obtained.</p>
        <h3>Formulae</h3>
        <p>$$T_{1/2} = \\frac{\\ln 2}{\\lambda} = \\frac{0.693}{\\lambda}$$</p>
        <h3>Procedure</h3>
        <ol>
          <li>Select a source with a conveniently short half-life for laboratory timescales (the simulated Na-22 demo source is provided for this purpose).</li>
          <li>Record the count rate at regular time intervals from $t=0$.</li>
          <li>Continue recording for several half-lives if possible.</li>
          <li>Plot $\\ln I$ versus $t$ and fit a straight line.</li>
        </ol>
        <h3>Observation Table Format</h3>
        <p>Time t (s) · Counts · Net rate I (CPS) · ln I</p>
        <h3>Calculation</h3>
        <p>From the regression slope $m = -\\lambda$, compute $T_{1/2} = 0.693/\\lambda$ and compare with the accepted value for the source.</p>
        <h3>Result</h3>
        <p>The half-life of the source, determined from the slope of $\\ln I$ vs $t$, is reported with its statistical uncertainty.</p>
        <h3>Precautions</h3>
        <ul>
          <li>Keep geometry (distance, absorber, voltage) fixed throughout the run.</li>
          <li>Take readings at regular, well-recorded time intervals.</li>
          <li>Subtract background before taking logarithms.</li>
        </ul>
        <h3>Viva Questions</h3>
        <ul>
          <li>Why is radioactive decay described as a statistical/random process?</li>
          <li>What is the relationship between half-life and mean lifetime $\\tau$?</li>
          <li>Why might a real half-life experiment require a source of conveniently short half-life?</li>
        </ul>`
    }
  };

  function render(expKey, container) {
    const data = CONTENT[expKey] || CONTENT['plateau'];
    container.innerHTML = data.html;
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
  }

  function getTitle(expKey) { return (CONTENT[expKey] || CONTENT['plateau']).title; }
  function getPlainText(expKey) {
    const el = document.createElement('div');
    el.innerHTML = (CONTENT[expKey] || CONTENT['plateau']).html;
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  return { render, getTitle, getPlainText, CONTENT };
})();
