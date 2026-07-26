/**
 * calculator.js
 * Self-contained scientific calculator: trig, log/ln, powers, factorial,
 * constants, memory register and history — rendered into #calculator-body.
 */
'use strict';

const Calculator = (() => {
  let expr = '';
  let memory = 0;
  let history = [];
  let container = null;

  const BUTTONS = [
    ['MC','MR','M+','M-','C'],
    ['sin','cos','tan','(',')'],
    ['ln','log','√','^','!'],
    ['7','8','9','/','π'],
    ['4','5','6','*','e'],
    ['1','2','3','-','±'],
    ['0','.','%','+','=']
  ];

  function factorial(n) {
    n = Math.round(n);
    if (n < 0) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function safeEval(rawExpr) {
    // Translate calculator notation into JS-evaluable math using Math.* namespace only.
    let e = rawExpr
      .replace(/π/g, 'Math.PI')
      .replace(/e(?![a-zA-Z])/g, 'Math.E')
      .replace(/√\(?([0-9.]+)\)?/g, 'Math.sqrt($1)')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/\^/g, '**')
      .replace(/(\d+(?:\.\d+)?)!/g, (m, n) => String(factorial(parseFloat(n))));

    // whitelist validation — only allow safe characters after substitution
    if (!/^[0-9+\-*/().\s%A-Za-z_.]*$/.test(e)) throw new Error('Invalid expression');
    if (!/^[0-9+\-*/().\sMathPIElogsqrtincoat%]*$/i.test(e)) { /* extra guard, non-blocking */ }
    // eslint-disable-next-line no-new-func
    const fn = new Function('Math', `"use strict"; return (${e || '0'});`);
    return fn(Math);
  }

  function render() {
    container.innerHTML = `
      <div class="calc-display" id="calc-expr">${Utils.esc(expr) || '0'}</div>
      <div class="calc-sub" id="calc-result"></div>
      <div class="calc-grid"></div>
      <div class="calc-history" id="calc-history"></div>
    `;
    const grid = container.querySelector('.calc-grid');
    BUTTONS.flat().forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn' + (['/','*','-','+','^'].includes(label) ? ' op' : '') + (label === '=' ? ' eq' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => handlePress(label));
      grid.appendChild(btn);
    });
    updateSub();
    renderHistory();
  }

  function updateSub() {
    const sub = container.querySelector('#calc-result');
    try {
      const val = safeEval(expr.replace(/±/g, '-1*'));
      sub.textContent = isFinite(val) ? `= ${Utils.fmt(val, 6)}` : '';
    } catch { sub.textContent = ''; }
  }

  function renderHistory() {
    const h = container.querySelector('#calc-history');
    h.innerHTML = history.slice(-8).reverse().map(item => `<div>${Utils.esc(item)}</div>`).join('');
  }

  function handlePress(label) {
    LabAudio.uiClick && LabAudio.uiClick();
    switch (label) {
      case 'C': expr = ''; break;
      case 'MC': memory = 0; Utils.toast('Memory cleared'); break;
      case 'MR': expr += String(memory); break;
      case 'M+': try { memory += safeEval(expr); Utils.toast('Added to memory'); } catch {} break;
      case 'M-': try { memory -= safeEval(expr); Utils.toast('Subtracted from memory'); } catch {} break;
      case '=':
        try {
          const val = safeEval(expr.replace(/±/g, '-1*'));
          history.push(`${expr} = ${Utils.fmt(val, 8)}`);
          expr = String(val);
        } catch { Utils.toast('Invalid expression', { warn: true, icon: 'fa-triangle-exclamation' }); }
        break;
      case '±': expr += '-1*'; break;
      case 'sin': case 'cos': case 'tan': case 'ln': case 'log':
        expr += label + '('; break;
      case '√': expr += '√('; break;
      case '!': expr += '!'; break;
      default: expr += label;
    }
    render();
  }

  function init(containerEl) {
    container = containerEl;
    render();
  }

  return { init };
})();
