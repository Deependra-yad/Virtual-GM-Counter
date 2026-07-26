/**
 * app.js
 * Application entry point: boot sequence, global state, event wiring,
 * the per-second measurement loop, observation table management and
 * experiment switching.
 */
'use strict';

(function () {

  const state = {
    expKey: 'plateau',
    sourceKey: 'cs137',
    voltage: 400,
    distanceCm: 5,
    thicknessMm: 0,
    materialKey: 'aluminium',
    mu: 1.62,
    timerSeconds: 10,
    running: false,
    elapsedRunSeconds: 0,
    totalCounts: 0,
    intervalCounts: 0,
    lastTickTime: 0,
    tickHandle: null,
    obs: { plateau: [], 'inverse-square': [], 'beta-absorption': [], 'mass-absorption': [], 'half-life': [] },
    settings: { audio: true, ambient: false, voice: false, bgRadiation: true, crt: false, animQuality: 'high' },
    runStartTimestamp: 0
  };

  const el = (id) => document.getElementById(id);

  // ---------------- BOOT SEQUENCE ----------------
  const BOOT_STEPS = [
    'Loading nuclear physics constants...',
    'Calibrating GM tube response model...',
    'Initialising Poisson statistics engine...',
    'Mounting apparatus canvas renderer...',
    'Building observation database...',
    'Linking AI data solver...',
    'Preparing lab manual & viva database...',
    'Starting audio subsystem...',
    'All systems nominal.'
  ];

  function runBootSequence() {
    const log = el('boot-log');
    const fill = el('boot-progress-fill');
    const pct = el('boot-progress-pct');
    const text = el('boot-progress-text');
    let i = 0;
    const interval = setInterval(() => {
      if (i >= BOOT_STEPS.length) {
        clearInterval(interval);
        el('init-lab-btn').disabled = false;
        text.textContent = 'Ready';
        return;
      }
      const line = document.createElement('div');
      line.className = i === BOOT_STEPS.length - 1 ? 'ok' : '';
      line.innerHTML = `<i class="fa-solid ${i === BOOT_STEPS.length - 1 ? 'fa-check' : 'fa-circle-notch'}"></i> ${BOOT_STEPS[i]}`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
      i++;
      const p = Math.round((i / BOOT_STEPS.length) * 100);
      fill.style.width = p + '%';
      pct.textContent = p;
      text.textContent = BOOT_STEPS[i - 1];
    }, 260);
  }

  function enterLab() {
    LabAudio.init();
    LabAudio.resume();
    LabAudio.uiClick();
    el('boot-screen').style.transition = 'opacity .5s ease';
    el('boot-screen').style.opacity = '0';
    setTimeout(() => {
      el('boot-screen').classList.add('hidden');
      el('app').classList.remove('hidden');
      startApp();
    }, 500);
  }

  // ---------------- APP INITIALISATION ----------------
  function startApp() {
    Apparatus.init(el('apparatus-canvas'));
    BGParticles.init(el('bg-particles'));
    Graph.init(el('graph-canvas'));
    Calculator.init(el('calculator-body'));
    Widgets.initDragging();

    wireHeader();
    wireExperimentTabs();
    wireRightTabs();
    wireControls();
    wireAI();
    wireSettings();
    wireTableActions();
    wireGraphActions();
    wireSolver();

    switchExperiment('plateau');
    updateClock();
    setInterval(updateClock, 1000);
    updateStatusStrip();

    Utils.toast('Laboratory initialised — good luck with your experiment!', { icon: 'fa-solid fa-flask-vial' });
  }

  function updateClock() {
    el('header-clock').textContent = new Date().toLocaleTimeString();
  }

  // ---------------- HEADER ----------------
  function wireHeader() {
    el('btn-audio').addEventListener('click', () => {
      state.settings.audio = !state.settings.audio;
      LabAudio.setEnabled(state.settings.audio);
      el('btn-audio').classList.toggle('active', state.settings.audio);
      el('btn-audio').querySelector('i').className = state.settings.audio ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    });
    el('btn-audio').classList.add('active');

    el('btn-voice').addEventListener('click', () => {
      state.settings.voice = !state.settings.voice;
      el('btn-voice').classList.toggle('active', state.settings.voice);
      Utils.toast(state.settings.voice ? 'Voice narration enabled' : 'Voice narration disabled');
    });

    el('btn-calculator').addEventListener('click', () => Widgets.toggle('widget-calculator'));
    el('btn-ai').addEventListener('click', () => Widgets.toggle('widget-ai'));
    el('btn-settings').addEventListener('click', () => Widgets.toggle('widget-settings'));

    el('btn-reset').addEventListener('click', () => {
      if (!confirm('Reset the entire laboratory? This clears all recorded observations.')) return;
      Object.keys(state.obs).forEach(k => state.obs[k] = []);
      stopRun();
      state.totalCounts = 0;
      switchExperiment(state.expKey);
      Utils.toast('Laboratory reset', { icon: 'fa-solid fa-rotate-left' });
    });
  }

  function updateStatusStrip() {
    el('status-hv-val').textContent = state.voltage;
    el('status-exp-val').textContent = Manual.getTitle(state.expKey);
  }

  // ---------------- EXPERIMENT TABS ----------------
  function wireExperimentTabs() {
    document.querySelectorAll('.exp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        LabAudio.uiClick();
        switchExperiment(tab.getAttribute('data-exp'));
      });
    });
  }

  const EXP_DEFAULTS = {
    'plateau': { note: 'Sweep HV to trace the plateau region. Distance and absorber are locked for this experiment.' },
    'inverse-square': { note: 'Vary source distance and record counts to verify I = I0/d².' },
    'beta-absorption': { note: 'Insert absorber foils of increasing thickness and observe exponential attenuation.' },
    'mass-absorption': { note: 'As above, but analysis uses mass thickness (ρx) to extract μm.' },
    'half-life': { note: 'Use the fast-decay demo source and record count rate at successive times.' }
  };

  function switchExperiment(key) {
    stopRun();
    state.expKey = key;
    document.querySelectorAll('.exp-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-exp') === key));
    el('apparatus-note').textContent = EXP_DEFAULTS[key].note;
    el('data-exp-title').textContent = Manual.getTitle(key);

    // sensible control visibility/defaults per experiment
    const distanceRow = el('ctrl-distance').closest('.control-row');
    const thicknessRow = el('ctrl-thickness').closest('.control-row');
    const materialRow = el('ctrl-material').closest('.control-row');
    const voltageRow = el('ctrl-voltage').closest('.control-row');

    distanceRow.style.opacity = 1; thicknessRow.style.opacity = 1; materialRow.style.opacity = 1; voltageRow.style.opacity = 1;

    if (key === 'plateau') {
      // fixed distance/thickness — vary voltage
    } else if (key === 'inverse-square') {
      if (state.sourceKey === 'na22-sim') setSource('cs137');
    } else if (key === 'beta-absorption' || key === 'mass-absorption') {
      // vary thickness
    } else if (key === 'half-life') {
      setSource('na22-sim');
      el('ctrl-source').value = 'na22-sim';
    }

    el('disp-decay-wrap').style.display = key === 'half-life' ? 'flex' : 'none';

    rebuildTableHeaders();
    renderTable();
    Manual.render(key, el('manual-content'));
    Graph.plot(buildGraphDef());
    el('solver-output').innerHTML = '<p class="solver-placeholder">Record at least 3 observations, then click <b>Analyse Data</b> to generate theory, calculations and a conclusion for this experiment.</p>';
    updateStatusStrip();
  }

  function setSource(key) { state.sourceKey = key; }

  // ---------------- RIGHT PANEL TABS ----------------
  function wireRightTabs() {
    document.querySelectorAll('.right-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        LabAudio.uiClick();
        document.querySelectorAll('.right-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.right-view').forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        el('view-' + tab.getAttribute('data-tab')).classList.add('active');
        if (tab.getAttribute('data-tab') === 'graph') Graph.render();
      });
    });
  }

  // ---------------- CONTROLS ----------------
  function wireControls() {
    el('ctrl-source').addEventListener('change', e => { setSource(e.target.value); });

    el('ctrl-voltage').addEventListener('input', e => {
      state.voltage = Number(e.target.value);
      el('val-voltage').textContent = state.voltage + ' V';
      el('disp-hv').textContent = state.voltage;
      Apparatus.setState({ voltage: state.voltage });
      updateStatusStrip();
    });

    el('ctrl-distance').addEventListener('input', e => {
      state.distanceCm = Number(e.target.value);
      el('val-distance').textContent = state.distanceCm.toFixed(1) + ' cm';
      Apparatus.setState({ distanceCm: state.distanceCm });
    });

    el('ctrl-thickness').addEventListener('input', e => {
      state.thicknessMm = Number(e.target.value);
      el('val-thickness').textContent = state.thicknessMm.toFixed(1) + ' mm';
      Apparatus.setState({ thicknessMm: state.thicknessMm });
    });

    el('ctrl-material').addEventListener('change', e => {
      state.materialKey = e.target.value;
      state.mu = Number(e.target.selectedOptions[0].getAttribute('data-mu'));
      Apparatus.setState({ materialKey: state.materialKey });
    });

    el('ctrl-timer').addEventListener('input', e => {
      state.timerSeconds = Number(e.target.value);
      el('val-timer').textContent = state.timerSeconds + ' s';
    });

    el('btn-start').addEventListener('click', startRun);
    el('btn-stop').addEventListener('click', stopRun);
    el('btn-record').addEventListener('click', recordReading);
    el('btn-clear-run').addEventListener('click', () => {
      stopRun();
      state.totalCounts = 0; state.intervalCounts = 0; state.elapsedRunSeconds = 0;
      updateScalerDisplay(0, 0);
      Utils.toast('Run counters reset');
    });
  }

  // ---------------- MEASUREMENT LOOP ----------------
  function startRun() {
    if (state.running) return;
    state.running = true;
    state.runStartTimestamp = performance.now();
    el('btn-start').disabled = true;
    el('btn-stop').disabled = false;
    Apparatus.setState({ running: true });
    if (state.settings.ambient) LabAudio.startAmbient();

    state.tickHandle = setInterval(tick, 1000);
  }

  function stopRun() {
    if (state.tickHandle) clearInterval(state.tickHandle);
    state.tickHandle = null;
    state.running = false;
    el('btn-start').disabled = false;
    el('btn-stop').disabled = true;
    Apparatus.setState({ running: false });
    LabAudio.stopAmbient();
  }

  function tick() {
    state.elapsedRunSeconds += 1;
    const sample = Physics.sampleOneSecond({
      sourceKey: state.sourceKey, voltage: state.voltage, distanceCm: state.distanceCm,
      thicknessMm: state.thicknessMm, materialKey: state.materialKey, mu: state.mu,
      elapsedRunSeconds: state.elapsedRunSeconds
    });

    state.totalCounts += sample.counts;
    state.intervalCounts += sample.counts;

    for (let i = 0; i < Math.min(sample.counts, 6); i++) {
      setTimeout(() => { Apparatus.triggerDetection(1); LabAudio.geigerClick(1); }, Math.random() * 900);
    }

    const cps = sample.observedRate;
    const cpm = cps * 60;
    updateScalerDisplay(cps, cpm);

    el('disp-timer').textContent = Utils.fmtTime(state.elapsedRunSeconds);
    if (state.expKey === 'half-life') el('disp-decay-t').textContent = state.elapsedRunSeconds;

    if (Physics.isDischarge(state.voltage) && Math.random() < 0.15) {
      LabAudio.alarm();
      Utils.toast('Voltage in discharge region — tube damage risk!', { warn: true, icon: 'fa-triangle-exclamation' });
    }

    if (state.elapsedRunSeconds % state.timerSeconds === 0) {
      // auto pulse indicator that an interval has completed — user can press RECORD
    }
  }

  function updateScalerDisplay(cps, cpm) {
    el('disp-counts').textContent = Utils.padDigits(state.totalCounts, 6);
    el('disp-cps').textContent = Utils.padDigits(cps, 4);
    el('disp-cpm').textContent = Utils.padDigits(cpm, 6);
  }

  function recordReading() {
    if (state.intervalCounts === 0 && state.elapsedRunSeconds === 0) {
      Utils.toast('Start the run before recording a reading', { warn: true, icon: 'fa-triangle-exclamation' });
      return;
    }
    const t = state.timerSeconds;
    const counts = state.intervalCounts;
    const rate = counts / t;
    const err = Utils.poissonError(counts);
    const pctErr = counts > 0 ? (err / counts) * 100 : 0;

    const row = {
      id: Utils.uid(),
      voltage: state.voltage,
      distance: state.distanceCm,
      thickness: state.thicknessMm,
      massThickness: (state.thicknessMm / 10) * (Physics.MATERIAL_DENSITY[state.materialKey] || 2.7),
      material: state.materialKey,
      counts, time: t, rate, cpm: rate * 60, err, pctErr,
      time_s: state.elapsedRunSeconds
    };
    state.obs[state.expKey].push(row);
    state.intervalCounts = 0;

    renderTable();
    Graph.plot(buildGraphDef());
    LabAudio.uiClick();
    Utils.toast('Reading recorded', { icon: 'fa-circle-check' });
  }

  // ---------------- OBSERVATION TABLE ----------------
  const TABLE_HEADERS = {
    'plateau': ['#', 'Voltage (V)', 'Counts', 'Time (s)', 'CPM', '% Error', ''],
    'inverse-square': ['#', 'Distance (cm)', 'Counts', 'Time (s)', 'I (CPS)', '1/d² (cm⁻²)', '% Error', ''],
    'beta-absorption': ['#', 'Thickness (mm)', 'Counts', 'Time (s)', 'I (CPS)', 'ln I', '% Error', ''],
    'mass-absorption': ['#', 'ρx (g/cm²)', 'Counts', 'Time (s)', 'I (CPS)', 'ln I', '% Error', ''],
    'half-life': ['#', 'Time (s)', 'Counts', 'Interval (s)', 'I (CPS)', 'ln I', '% Error', '']
  };

  function rebuildTableHeaders() {
    const thead = el('obs-thead');
    thead.innerHTML = `<tr>${TABLE_HEADERS[state.expKey].map(h => `<th>${h}</th>`).join('')}</tr>`;
  }

  function renderTable() {
    const rows = state.obs[state.expKey];
    const tbody = el('obs-tbody');
    tbody.innerHTML = '';
    el('table-empty').classList.toggle('show', rows.length === 0);

    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      let cells = [];
      switch (state.expKey) {
        case 'plateau':
          cells = [i + 1, r.voltage, r.counts, r.time, Utils.fmt(r.cpm, 0), Utils.fmt(r.pctErr, 1) + '%'];
          break;
        case 'inverse-square':
          cells = [i + 1, r.distance.toFixed(1), r.counts, r.time, Utils.fmt(r.rate, 3), Utils.fmt(1 / (r.distance * r.distance), 4), Utils.fmt(r.pctErr, 1) + '%'];
          break;
        case 'beta-absorption':
          cells = [i + 1, r.thickness.toFixed(1), r.counts, r.time, Utils.fmt(r.rate, 3), Utils.fmt(Math.log(Math.max(1e-6, r.rate)), 3), Utils.fmt(r.pctErr, 1) + '%'];
          break;
        case 'mass-absorption':
          cells = [i + 1, Utils.fmt(r.massThickness, 3), r.counts, r.time, Utils.fmt(r.rate, 3), Utils.fmt(Math.log(Math.max(1e-6, r.rate)), 3), Utils.fmt(r.pctErr, 1) + '%'];
          break;
        case 'half-life':
          cells = [i + 1, r.time_s, r.counts, r.time, Utils.fmt(r.rate, 3), Utils.fmt(Math.log(Math.max(1e-6, r.rate)), 3), Utils.fmt(r.pctErr, 1) + '%'];
          break;
      }
      tr.innerHTML = cells.map(c => `<td>${c}</td>`).join('') + `<td><i class="fa-solid fa-trash row-delete" data-id="${r.id}"></i></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.row-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        state.obs[state.expKey] = state.obs[state.expKey].filter(r => r.id !== btn.getAttribute('data-id'));
        renderTable();
        Graph.plot(buildGraphDef());
      });
    });
  }

  function wireTableActions() {
    el('btn-clear-table').addEventListener('click', () => {
      if (!confirm('Clear all observations for this experiment?')) return;
      state.obs[state.expKey] = [];
      renderTable();
      Graph.plot(buildGraphDef());
    });

    el('btn-export-csv').addEventListener('click', () => {
      const rows = state.obs[state.expKey];
      if (!rows.length) { Utils.toast('No data to export', { warn: true, icon: 'fa-triangle-exclamation' }); return; }
      const headers = TABLE_HEADERS[state.expKey].slice(0, -1);
      const csvRows = rows.map((r, i) => {
        switch (state.expKey) {
          case 'plateau': return [i + 1, r.voltage, r.counts, r.time, r.cpm.toFixed(1), r.pctErr.toFixed(1)];
          case 'inverse-square': return [i + 1, r.distance, r.counts, r.time, r.rate.toFixed(3), (1 / (r.distance * r.distance)).toFixed(4), r.pctErr.toFixed(1)];
          case 'beta-absorption': return [i + 1, r.thickness, r.counts, r.time, r.rate.toFixed(3), Math.log(Math.max(1e-6, r.rate)).toFixed(3), r.pctErr.toFixed(1)];
          case 'mass-absorption': return [i + 1, r.massThickness.toFixed(3), r.counts, r.time, r.rate.toFixed(3), Math.log(Math.max(1e-6, r.rate)).toFixed(3), r.pctErr.toFixed(1)];
          case 'half-life': return [i + 1, r.time_s, r.counts, r.time, r.rate.toFixed(3), Math.log(Math.max(1e-6, r.rate)).toFixed(3), r.pctErr.toFixed(1)];
        }
      });
      ExportModule.exportCSV(state.expKey, headers, csvRows);
    });
  }

  // ---------------- GRAPH ----------------
  function buildGraphDef() {
    const rows = state.obs[state.expKey];
    let points = [], xLabel = '', yLabel = '', title = '', fit = false;
    switch (state.expKey) {
      case 'plateau':
        points = rows.map(r => ({ x: r.voltage, y: r.cpm })); xLabel = 'Voltage (V)'; yLabel = 'CPM'; title = 'Plateau Curve'; fit = false; break;
      case 'inverse-square':
        points = rows.map(r => ({ x: 1 / (r.distance * r.distance), y: r.rate, err: r.err / r.time })); xLabel = '1/d² (cm⁻²)'; yLabel = 'I (CPS)'; title = 'Inverse Square Law'; fit = true; break;
      case 'beta-absorption':
        points = rows.map(r => ({ x: r.thickness, y: Math.log(Math.max(1e-6, r.rate)) })); xLabel = 'Thickness (mm)'; yLabel = 'ln I'; title = 'Beta Absorption'; fit = true; break;
      case 'mass-absorption':
        points = rows.map(r => ({ x: r.massThickness, y: Math.log(Math.max(1e-6, r.rate)) })); xLabel = 'ρx (g/cm²)'; yLabel = 'ln I'; title = 'Mass Absorption'; fit = true; break;
      case 'half-life':
        points = rows.map(r => ({ x: r.time_s, y: Math.log(Math.max(1e-6, r.rate)) })); xLabel = 'Time (s)'; yLabel = 'ln I'; title = 'Radioactive Decay'; fit = true; break;
    }
    points.sort((a, b) => a.x - b.x);
    return { points, xLabel, yLabel, title, fit, color: '#4dffb0' };
  }

  function wireGraphActions() {
    el('btn-graph-fit').addEventListener('click', () => {
      const fit = Graph.getFit();
      if (!fit) { Utils.toast('No data to fit', { warn: true, icon: 'fa-triangle-exclamation' }); return; }
      Utils.toast(`Fit: slope = ${Utils.fmt(fit.m, 4)}, R² = ${Utils.fmt(fit.r2, 3)}`);
    });
    el('btn-graph-zoom-in').addEventListener('click', () => Graph.zoomIn());
    el('btn-graph-zoom-out').addEventListener('click', () => Graph.zoomOut());
    el('btn-graph-png').addEventListener('click', () => Graph.exportPNG(`${state.expKey}-graph.png`));
  }

  // ---------------- AI SOLVER ----------------
  function wireSolver() {
    el('btn-run-solver').addEventListener('click', () => {
      const rows = state.obs[state.expKey];
      const html = AI.analyse(state.expKey, rows);
      el('solver-output').innerHTML = html;
      if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([el('solver-output')]).catch(() => {});
      Utils.toast('Analysis complete', { icon: 'fa-wand-magic-sparkles' });
    });
  }

  // ---------------- AI ASSISTANT CHAT ----------------
  function wireAI() {
    const chat = el('ai-chat');
    addChatMsg('bot', 'Hello — I\'m your offline AI Lab Assistant. Ask me about theory, formulae, or procedure for any experiment.');

    el('ai-form').addEventListener('submit', e => {
      e.preventDefault();
      const input = el('ai-input');
      const q = input.value.trim();
      if (!q) return;
      addChatMsg('user', q);
      input.value = '';
      const typingEl = addTyping();
      setTimeout(() => {
        typingEl.remove();
        const ans = AI.chatReply(q, state.expKey);
        addChatMsg('bot', ans);
        if (state.settings.voice && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(ans);
          speechSynthesis.speak(utter);
        }
      }, 500 + Math.random() * 500);
    });

    function addChatMsg(role, text) {
      const div = document.createElement('div');
      div.className = 'ai-msg ' + role;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    }
    function addTyping() {
      const div = document.createElement('div');
      div.className = 'ai-msg bot typing-dots';
      div.innerHTML = '<span></span><span></span><span></span>';
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    }
  }

  // ---------------- SETTINGS ----------------
  function wireSettings() {
    Widgets.buildSettings(el('settings-body'), state, {
      onThemeChange: (cls) => { document.body.className = document.body.className.replace(/theme-\S+/g, '').trim(); document.body.classList.add(cls); if (state.settings.crt) document.body.classList.add('crt-on'); },
      onCrtChange: (v) => { state.settings.crt = v; document.body.classList.toggle('crt-on', v); },
      onAudioChange: (v) => { state.settings.audio = v; LabAudio.setEnabled(v); },
      onAmbientChange: (v) => { state.settings.ambient = v; if (v && state.running) LabAudio.startAmbient(); else LabAudio.stopAmbient(); },
      onVoiceChange: (v) => { state.settings.voice = v; },
      onBgRadiationChange: (v) => { state.settings.bgRadiation = v; BGParticles.setEnabled(v); },
      onParticleColor: (c) => { Apparatus.setParticleColor(c); },
      onAnimQuality: (q) => { state.settings.animQuality = q; Apparatus.setQuality(q); },
      onOpenReport: () => { openReport(); },
      onResetAll: () => {
        if (!confirm('Reset all settings to defaults?')) return;
        document.body.className = 'theme-phosphor';
        state.settings = { audio: true, ambient: false, voice: false, bgRadiation: true, crt: false, animQuality: 'high' };
        LabAudio.setEnabled(true); LabAudio.stopAmbient(); BGParticles.setEnabled(true);
        wireSettings();
        Utils.toast('Settings reset');
      }
    });
  }

  function openReport() {
    Widgets.close('widget-settings');
    const rows = state.obs[state.expKey];
    const headers = TABLE_HEADERS[state.expKey].slice(0, -1);
    const csvRows = rows.map((r, i) => {
      switch (state.expKey) {
        case 'plateau': return [i + 1, r.voltage, r.counts, r.time, r.cpm.toFixed(1), r.pctErr.toFixed(1) + '%'];
        case 'inverse-square': return [i + 1, r.distance, r.counts, r.time, r.rate.toFixed(3), (1 / (r.distance * r.distance)).toFixed(4), r.pctErr.toFixed(1) + '%'];
        case 'beta-absorption': return [i + 1, r.thickness, r.counts, r.time, r.rate.toFixed(3), Math.log(Math.max(1e-6, r.rate)).toFixed(3), r.pctErr.toFixed(1) + '%'];
        case 'mass-absorption': return [i + 1, r.massThickness.toFixed(3), r.counts, r.time, r.rate.toFixed(3), Math.log(Math.max(1e-6, r.rate)).toFixed(3), r.pctErr.toFixed(1) + '%'];
        case 'half-life': return [i + 1, r.time_s, r.counts, r.time, r.rate.toFixed(3), Math.log(Math.max(1e-6, r.rate)).toFixed(3), r.pctErr.toFixed(1) + '%'];
      }
    });
    const fit = rows.length >= 2 ? Utils.linearRegression(buildGraphDef().points) : null;
    const conclusion = fit ? `Linear regression slope = ${Utils.fmt(fit.m, 4)}, R² = ${Utils.fmt(fit.r2, 3)}.` : 'Insufficient data for regression.';

    el('report-body').innerHTML = ExportModule.buildReportHTML({
      expTitle: Manual.getTitle(state.expKey),
      theoryText: Manual.getPlainText(state.expKey),
      headers, rows: csvRows, conclusion
    });
    ExportModule.wireReport(el('report-body'), state.expKey);
    Widgets.open('widget-report');
  }

  // ---------------- LAB MANUAL SPEAK ----------------
  document.addEventListener('DOMContentLoaded', () => {
    runBootSequence();
    el('init-lab-btn').addEventListener('click', enterLab);

    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-manual-speak' || e.target.closest('#btn-manual-speak')) {
        if (!('speechSynthesis' in window)) { Utils.toast('Speech synthesis not supported in this browser', { warn: true }); return; }
        speechSynthesis.cancel();
        const text = Manual.getPlainText(state.expKey);
        const utter = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utter);
      }
    });
  });

})();
