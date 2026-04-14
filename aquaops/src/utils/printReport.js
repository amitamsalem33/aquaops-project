// Hebrew-safe PDF via browser print window

function badge(text, type) {
  const styles = {
    red:    "background:#fee2e2;color:#991b1b",
    green:  "background:#dcfce7;color:#166534",
    blue:   "background:#dbeafe;color:#1e40af",
    orange: "background:#fff7ed;color:#9a3412",
    gray:   "background:#f3f4f6;color:#374151",
    purple: "background:#ede9fe;color:#5b21b6",
  };
  const s = styles[type] || styles.gray;
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;${s}">${text}</span>`;
}

export function statusBadge(status) {
  const map = {
    "פתוח": "orange", "בטיפול": "blue", "סגור": "green",
    "הושלם": "green", "בביצוע": "blue", "נדחה": "gray",
    "ממתין": "gray", "הוזן": "green", "חריגה": "red", "שולם": "green",
  };
  return badge(status, map[status] || "gray");
}

export function priorityBadge(priority) {
  const map = { "גבוהה": "red", "בינונית": "orange", "נמוכה": "gray", "רגילה": "blue" };
  return badge(priority, map[priority] || "gray");
}

export function makeTable(headers, rows, thColor = "#1e3a8a") {
  const ths = headers.map(h => `<th style="background:${thColor};color:#fff;padding:10px 14px;text-align:right;font-weight:600;font-size:13px">${h}</th>`).join("");
  const trs = rows.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">${r.map(cell => `<td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px">${cell ?? "—"}</td>`).join("")}</tr>`
  ).join("");
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:24px">${ths.length ? `<thead><tr>${ths}</tr></thead>` : ""}<tbody>${trs}</tbody></table>`;
}

export function statsRow(items) {
  const boxes = items.map(({ value, label, color = "#0369a1", bg = "#f0f9ff", border = "#bae6fd" }) =>
    `<div style="background:${bg};border:2px solid ${border};border-radius:12px;padding:16px 10px;text-align:center;flex:1;min-width:100px">
      <div style="font-size:28px;font-weight:700;color:${color}">${value}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">${label}</div>
    </div>`
  ).join("");
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">${boxes}</div>`;
}

export function openPrintReport({ title, subtitle, accentColor = "#1e3a8a", content }) {
  const win = window.open("", "_blank");
  if (!win) { alert("אנא אפשר חלונות קופצים לייצוא דוחות"); return; }
  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', 'Arial Hebrew', Arial, sans-serif;
    direction: rtl;
    padding: 32px 44px;
    color: #1a202c;
    font-size: 14px;
    line-height: 1.6;
    background: #fff;
  }
  .header {
    text-align: center;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 4px solid ${accentColor};
  }
  .header-title {
    font-size: 26px;
    font-weight: 700;
    color: ${accentColor};
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }
  .header-sub { font-size: 13px; color: #6b7280; }
  h2 {
    font-size: 16px;
    font-weight: 700;
    color: ${accentColor};
    margin: 28px 0 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #9ca3af;
  }
  .print-btn {
    position: fixed;
    top: 16px;
    left: 16px;
    background: ${accentColor};
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 999;
  }
  .print-btn:hover { opacity: 0.9; }
  @media print {
    .print-btn { display: none; }
    body { padding: 10px 16px; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ שמור כ-PDF</button>
<div class="header">
  <div class="header-title">${title}</div>
  <div class="header-sub">${subtitle} &nbsp;|&nbsp; ${new Date().toLocaleDateString("he-IL")}</div>
</div>
${content}
<div class="footer">AquaOps &mdash; מערכת ניהול מים &nbsp;&bull;&nbsp; נוצר ב-${new Date().toLocaleString("he-IL")}</div>
</body>
</html>`);
  win.document.close();
}
