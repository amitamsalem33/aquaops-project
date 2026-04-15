import { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { openPrintReport, statusBadge, makeTable, statsRow } from "../utils/printReport";
import { useTaskActions } from "../hooks/useTaskActions";
import { usePagination, Paginator } from "../hooks/usePagination";
import { formatDate } from "../utils/formatDate";

const PAGE_SIZE = 8;

export default function MeterReaderPanel() {
  const { currentUser } = useAuth();
  const { taskList, setTaskList, readingList, setReadingList } = useData();

  const [selected, setSelected] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState("readings");
  const [search, setSearch] = useState("");

  const { rejectingTaskId, setRejectingTaskId, rejectReason, setRejectReason, updateTaskStatus, rejectTask } =
    useTaskActions(setTaskList, currentUser.id);

  const allReadings = readingList.filter(r => r.assignedReader === currentUser.id);
  const readings = allReadings.filter(r => {
    const q = search.trim();
    return !q || r.customerName.includes(q) || r.meterNumber.includes(q) || r.address.includes(q);
  });
  const myTasks = taskList.filter(t => t.assignedTo === currentUser.id);
  const activeTasks = myTasks.filter(t => t.status !== "הושלם" && t.status !== "נדחה");
  const pending = allReadings.filter(r => r.status === "ממתין").length;
  const done = allReadings.filter(r => r.status !== "ממתין").length;

  const { paged: pagedReadings, page, setPage, totalPages } = usePagination(readings, PAGE_SIZE);

  function submitReading() {
    const val = parseInt(inputValue);
    if (!val || val < selected.previousReading) {
      setAlert({ type: "error", msg: "קריאה לא תקינה - חייבת להיות גדולה מהקריאה הקודמת" });
      return;
    }
    const diff = val - selected.previousReading;
    const isFlag = diff > selected.avgMonthly * 2;
    const flagReason = isFlag
      ? `צריכה של ${diff} יח׳ - פי ${(diff / selected.avgMonthly).toFixed(1)} מהממוצע הרגיל (${selected.avgMonthly} יח׳). חשד לדליפה!`
      : null;
    const updated = {
      ...selected,
      currentReading: val,
      readingDate: new Date().toISOString().split("T")[0],
      status: isFlag ? "חריגה" : "הוזן",
      flag: isFlag,
      flagReason,
    };
    setReadingList(prev => prev.map(r => r.id === selected.id ? updated : r));
    setSelected(updated);
    setInputValue("");
    setAlert(isFlag
      ? { type: "warning", msg: `⚠️ התראה! ${flagReason}` }
      : { type: "success", msg: `✓ קריאה הוזנה בהצלחה - צריכה: ${diff} יח׳` }
    );
    setTimeout(() => setAlert(null), 5000);
  }

  function exportPersonalReport() {
    const flagged = allReadings.filter(r => r.flag).length;
    const content = `
      ${statsRow([
        { value: readings.length, label: 'סה"כ מונים' },
        { value: pending, label: "ממתינים לקריאה", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        { value: done, label: "הושלמו", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
        { value: flagged, label: "חריגות", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
      ])}
      <h2>💧 פרטי קריאות מונים</h2>
      ${makeTable(
        ["לקוח", "מספר מונה", "קריאה קודמת", "קריאה נוכחית", "צריכה", "סטטוס"],
        readings.map(r => [
          r.customerName, r.meterNumber, r.previousReading,
          r.currentReading ?? "—",
          r.currentReading ? r.currentReading - r.previousReading : "—",
          r.flag
            ? `<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">⚠️ חריגה</span>`
            : statusBadge(r.status)
        ]),
        "#92400e"
      )}
      <h2>✅ משימות מוקצות</h2>
      ${makeTable(
        ["כותרת", "תיאור", "תאריך יעד", "סטטוס"],
        myTasks.map(t => [t.title, t.description || "—", formatDate(t.dueDate), statusBadge(t.status)]),
        "#92400e"
      )}
    `;
    openPrintReport({
      title: `דוח אישי — ${currentUser.name}`,
      subtitle: `קורא מונים | אזור: ${currentUser.zone || "—"}`,
      accentColor: "#92400e",
      content,
    });
  }

  return (
    <Layout title="ממשק קורא מונים">
      <div className="panel-container">
        <div className="stats-row">
          <div className="mini-stat"><span>נותרו לקריאה</span><strong>{pending}</strong></div>
          <div className="mini-stat green-stat"><span>הושלמו</span><strong>{done}</strong></div>
          <div className="mini-stat red-stat"><span>חריגות</span><strong>{allReadings.filter(r => r.flag).length}</strong></div>
          <div className="mini-stat"><span>משימות פעילות</span><strong>{activeTasks.length}</strong></div>
        </div>

        <div className="panel-top-bar">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${activeTab === "readings" ? "tab-active" : ""}`} onClick={() => setActiveTab("readings")}>קריאות מונים</button>
            <button className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
              משימות שלי {activeTasks.length > 0 && <span className="tab-badge">{activeTasks.length}</span>}
            </button>
          </div>
          <button className="btn-export" onClick={exportPersonalReport}>⬇ דוח אישי PDF</button>
        </div>

        {activeTab === "readings" && (
          <>
            {alert && <div className={`alert-banner ${alert.type}`}>{alert.msg}</div>}
            <div className="two-col">
              <div className="list-panel">
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="🔍 חיפוש לפי שם לקוח, מונה או כתובת..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "7px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit" }}
                  />
                </div>
                <h3>רשימת מונים ({readings.length})</h3>
                {pagedReadings.map(r => (
                  <div key={r.id} className={`customer-card ${selected?.id === r.id ? "selected" : ""} ${r.flag ? "high-debt" : ""}`}
                    onClick={() => { setSelected(r); setInputValue(""); setAlert(null); }}>
                    <div className="customer-card-header">
                      <strong>{r.customerName}</strong>
                      <span className={`badge ${r.flag ? "badge-red" : r.status === "הוזן" ? "badge-green" : "badge-gray"}`}>{r.flag ? "⚠️ חריגה" : r.status}</span>
                    </div>
                    <div className="customer-card-body">
                      <span>📍 {r.address}</span>
                      <span>🔢 מונה: {r.meterNumber}</span>
                    </div>
                  </div>
                ))}
                <Paginator page={page} totalPages={totalPages} setPage={setPage} total={readings.length} pageSize={PAGE_SIZE} />
              </div>
              <div className="detail-panel">
                {selected ? (
                  <div>
                    <h3>הזנת קריאת מונה</h3>
                    <div className="detail-card">
                      <div className="detail-row"><label>לקוח</label><span>{selected.customerName}</span></div>
                      <div className="detail-row"><label>כתובת</label><span>{selected.address}</span></div>
                      <div className="detail-row"><label>מספר מונה</label><span><code>{selected.meterNumber}</code></span></div>
                      <div className="detail-row"><label>קריאה קודמת</label><span className="reading-value">{selected.previousReading}</span></div>
                      <div className="detail-row"><label>ממוצע חודשי</label><span>{selected.avgMonthly} יח׳</span></div>
                      {selected.currentReading && (
                        <>
                          <div className="detail-row"><label>קריאה נוכחית</label><span className="reading-value">{selected.currentReading}</span></div>
                          <div className="detail-row"><label>צריכה</label><span>{selected.currentReading - selected.previousReading} יח׳</span></div>
                        </>
                      )}
                    </div>
                    {selected.status === "ממתין" ? (
                      <div className="reading-input-section">
                        <label>הזן קריאה נוכחית</label>
                        <div className="reading-input-row">
                          <input type="number" className="reading-input" value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder={`מינימום ${selected.previousReading + 1}`}
                            min={selected.previousReading + 1} />
                          <button className="btn-primary" onClick={submitReading}>שלח קריאה</button>
                        </div>
                        <p className="hint">הזנה גבוהה פי 2 מהממוצע תייצר התראה אוטומטית</p>
                      </div>
                    ) : (
                      <div className={`status-block ${selected.flag ? "status-warning" : "status-ok"}`}>
                        {selected.flag
                          ? <><h4>⚠️ קריאה חריגה - נשלחה התראה למנהל</h4><p>{selected.flagReason}</p></>
                          : <h4>✓ קריאה הוזנה בתאריך {selected.readingDate}</h4>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-detail"><span>📊</span><p>בחר מונה מהרשימה להזנת קריאה</p></div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "tasks" && (
          <div className="tasks-list">
            {myTasks.length === 0 && <div className="empty-detail"><span>📋</span><p>אין משימות מוקצות אליך</p></div>}
            {myTasks.map(t => (
              <div key={t.id} className={`task-card ${t.status === "נדחה" ? "task-rejected" : t.status === "הושלם" ? "task-done" : ""}`}>
                <div className="task-card-header">
                  <div><strong>{t.title}</strong><p>{t.description}</p></div>
                  <div className="task-badges">
                    <span className={`badge ${t.priority === "גבוהה" ? "badge-red" : "badge-blue"}`}>{t.priority}</span>
                    <span className={`badge ${t.status === "הושלם" ? "badge-green" : t.status === "נדחה" ? "badge-gray" : t.status === "בביצוע" ? "badge-blue" : "badge-orange"}`}>{t.status}</span>
                  </div>
                </div>
                <div className="task-card-footer">
                  <span>תאריך יעד: {formatDate(t.dueDate)}</span>
                  {t.status !== "הושלם" && t.status !== "נדחה" && (
                    <div className="task-actions">
                      {t.status === "פתוח" && <button className="btn-warning" onClick={() => updateTaskStatus(t.id, "בביצוע")}>התחל עבודה</button>}
                      {t.status === "בביצוע" && <button className="btn-success" onClick={() => updateTaskStatus(t.id, "הושלם")}>סיים</button>}
                      <button className="btn-reject" onClick={() => { setRejectingTaskId(t.id); setRejectReason(""); }}>דחה משימה</button>
                    </div>
                  )}
                  {t.status === "נדחה" && <span className="reject-reason-display">סיבת דחייה: {t.rejectionReason}</span>}
                </div>
                {rejectingTaskId === t.id && (
                  <div className="reject-form">
                    <textarea placeholder="סיבת הדחייה..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} />
                    <div className="reject-form-actions">
                      <button className="btn-reject" onClick={() => rejectTask(t.id)} disabled={!rejectReason.trim()}>אשר דחייה</button>
                      <button className="btn-secondary" onClick={() => setRejectingTaskId(null)}>ביטול</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
