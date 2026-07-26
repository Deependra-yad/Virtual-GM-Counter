/**
 * export.js
 * CSV export of observation tables and generation of a printable
 * academic lab report (HTML, styled for print / PDF-via-print-dialog).
 */
'use strict';

const ExportModule = (() => {

  function toCSV(headers, rows) {
    const esc = v => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.map(esc).join(',')];
    rows.forEach(r => lines.push(r.map(esc).join(',')));
    return lines.join('\n');
  }

  function exportCSV(expKey, headers, rows) {
    const csv = toCSV(headers, rows);
    Utils.downloadBlob(csv, `${expKey}-observations.csv`, 'text/csv');
    Utils.toast('CSV exported', { icon: 'fa-file-csv' });
  }

  function buildReportHTML(opts) {
    const { studentName, rollNumber, expTitle, theoryText, headers, rows, conclusion } = opts;
    return `
      <div class="report-field"><label>Student Name</label><input type="text" id="rep-name" value="${Utils.esc(studentName || '')}" placeholder="Enter name" /></div>
      <div class="report-field"><label>Roll Number</label><input type="text" id="rep-roll" value="${Utils.esc(rollNumber || '')}" placeholder="Enter roll number" /></div>
      <div id="report-preview" class="report-page">
        <h2>${Utils.esc(expTitle)}</h2>
        <div class="sub">Virtual GM Counter Laboratory — Academic Report</div>
        <p><b>Name:</b> <span id="prev-name">${Utils.esc(studentName || '____________')}</span> &nbsp;&nbsp; <b>Roll No.:</b> <span id="prev-roll">${Utils.esc(rollNumber || '____________')}</span></p>
        <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
        <p><b>Theory (summary):</b><br/>${Utils.esc(theoryText).slice(0, 500)}...</p>
        <p><b>Observations:</b></p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <p style="margin-top:14px;"><b>Conclusion:</b><br/>${conclusion || 'See AI Solver tab for the full calculated conclusion.'}</p>
        <p style="margin-top:24px;">Instructor Signature: ______________________</p>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="btn-mini" id="rep-print" style="flex:1;justify-content:center;padding:10px;"><i class="fa-solid fa-print"></i> Print / Save as PDF</button>
        <button class="btn-mini" id="rep-html" style="flex:1;justify-content:center;padding:10px;"><i class="fa-solid fa-file-code"></i> Export HTML</button>
      </div>
    `;
  }

  function wireReport(container, expKey) {
    const nameInput = container.querySelector('#rep-name');
    const rollInput = container.querySelector('#rep-roll');
    const prevName = container.querySelector('#prev-name');
    const prevRoll = container.querySelector('#prev-roll');
    nameInput?.addEventListener('input', () => prevName.textContent = nameInput.value || '____________');
    rollInput?.addEventListener('input', () => prevRoll.textContent = rollInput.value || '____________');

    container.querySelector('#rep-print')?.addEventListener('click', () => {
      const win = window.open('', '_blank');
      win.document.write(`<html><head><title>Report</title><style>body{font-family:Georgia,serif;padding:24px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #999;padding:5px 8px;font-size:12px;}</style></head><body>${container.querySelector('#report-preview').outerHTML}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    });

    container.querySelector('#rep-html')?.addEventListener('click', () => {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report — ${Utils.esc(expKey)}</title><style>body{font-family:Georgia,serif;padding:24px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #999;padding:5px 8px;font-size:12px;}</style></head><body>${container.querySelector('#report-preview').outerHTML}</body></html>`;
      Utils.downloadBlob(html, `${expKey}-report.html`, 'text/html');
      Utils.toast('Report HTML exported', { icon: 'fa-file-code' });
    });
  }

  return { exportCSV, toCSV, buildReportHTML, wireReport };
})();
