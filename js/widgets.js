/**
 * widgets.js
 * Generic floating-widget system: open/close, dragging, and the Settings panel content.
 */
'use strict';

const Widgets = (() => {

  function open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    el.style.zIndex = String(++zTop);
  }
  function close(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  function toggle(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.hidden) open(id); else close(id);
  }

  let zTop = 60;

  function initDragging() {
    document.querySelectorAll('[data-drag-for]').forEach(bar => {
      const targetId = bar.getAttribute('data-drag-for');
      const target = document.getElementById(targetId);
      if (!target) return;
      let dragging = false, offX = 0, offY = 0;

      const start = (clientX, clientY) => {
        dragging = true;
        const rect = target.getBoundingClientRect();
        offX = clientX - rect.left;
        offY = clientY - rect.top;
        target.style.zIndex = String(++zTop);
      };
      const move = (clientX, clientY) => {
        if (!dragging) return;
        const w = target.offsetWidth, h = target.offsetHeight;
        let x = Utils.clamp(clientX - offX, 4, window.innerWidth - w - 4);
        let y = Utils.clamp(clientY - offY, 4, window.innerHeight - h - 4);
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        target.style.right = 'auto';
      };
      const end = () => { dragging = false; };

      bar.addEventListener('mousedown', e => start(e.clientX, e.clientY));
      window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
      window.addEventListener('mouseup', end);

      bar.addEventListener('touchstart', e => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
      window.addEventListener('touchmove', e => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
      window.addEventListener('touchend', end);
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => close(btn.getAttribute('data-close')));
    });
  }

  function buildSettings(container, state, callbacks) {
    container.innerHTML = `
      <div class="settings-group">
        <h4>Theme</h4>
        <div class="settings-row">
          <span>Console colour</span>
          <div class="theme-swatches">
            <div class="swatch theme-swatch active" data-theme="theme-phosphor" style="background:#4dffb0"></div>
            <div class="swatch theme-swatch" data-theme="theme-amber" style="background:#ffb020"></div>
            <div class="swatch theme-swatch" data-theme="theme-mission" style="background:#52b6ff"></div>
          </div>
        </div>
        <div class="settings-row">
          <span>CRT Mode</span>
          <label class="switch"><input type="checkbox" id="set-crt" /><span class="slider-toggle"></span></label>
        </div>
      </div>

      <div class="settings-group">
        <h4>Audio &amp; Voice</h4>
        <div class="settings-row"><span>Sound effects</span><label class="switch"><input type="checkbox" id="set-audio" checked/><span class="slider-toggle"></span></label></div>
        <div class="settings-row"><span>Ambient hum</span><label class="switch"><input type="checkbox" id="set-ambient" /><span class="slider-toggle"></span></label></div>
        <div class="settings-row"><span>Voice narration</span><label class="switch"><input type="checkbox" id="set-voice" /><span class="slider-toggle"></span></label></div>
      </div>

      <div class="settings-group">
        <h4>Simulation</h4>
        <div class="settings-row"><span>Background radiation</span><label class="switch"><input type="checkbox" id="set-bg-radiation" checked/><span class="slider-toggle"></span></label></div>
        <div class="settings-row"><span>Particle colour</span>
          <input type="color" id="set-particle-color" value="#4dffb0" style="width:40px;height:26px;border:none;background:none;cursor:pointer;" />
        </div>
        <div class="settings-row"><span>Animation quality</span>
          <select id="set-anim-quality" style="width:120px;">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Performance</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <h4>Reports</h4>
        <button class="btn-mini" id="set-open-report" style="width:100%;justify-content:center;padding:10px;"><i class="fa-solid fa-file-lines"></i> Generate Academic Report</button>
      </div>

      <div class="settings-group">
        <button class="btn-mini" id="set-reset-all" style="width:100%;justify-content:center;padding:10px;color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Reset All Settings</button>
      </div>
    `;

    container.querySelectorAll('.theme-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        container.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        callbacks.onThemeChange(sw.getAttribute('data-theme'));
      });
    });
    container.querySelector('#set-crt').addEventListener('change', e => callbacks.onCrtChange(e.target.checked));
    container.querySelector('#set-audio').addEventListener('change', e => callbacks.onAudioChange(e.target.checked));
    container.querySelector('#set-ambient').addEventListener('change', e => callbacks.onAmbientChange(e.target.checked));
    container.querySelector('#set-voice').addEventListener('change', e => callbacks.onVoiceChange(e.target.checked));
    container.querySelector('#set-bg-radiation').addEventListener('change', e => callbacks.onBgRadiationChange(e.target.checked));
    container.querySelector('#set-particle-color').addEventListener('input', e => callbacks.onParticleColor(e.target.value));
    container.querySelector('#set-anim-quality').addEventListener('change', e => callbacks.onAnimQuality(e.target.value));
    container.querySelector('#set-open-report').addEventListener('click', callbacks.onOpenReport);
    container.querySelector('#set-reset-all').addEventListener('click', callbacks.onResetAll);
  }

  return { open, close, toggle, initDragging, buildSettings };
})();
