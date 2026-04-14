import { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { openPrintReport, statusBadge, makeTable, statsRow } from "../utils/printReport";

export default function CollectorPanel() {
  const { currentUser } = useAuth();
  const { taskList, setTaskList, customerList, setCustomerList } = useData();

  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("הכל");
  const [activeTab, setActiveTab] = useState("customers");
  const [rejectingTaskId, setRejectingTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const myCustomers = customerList.filter(c => c.assignedCollector === currentUser.id);
  const myTasks = taskList.filter(t => t.assignedTo === currentUser.id);
  const activeTasks = myTasks.filter(t => t.status !== "הושלם" && t.status !== "נדחה");
  const totalDebt = myCustomers.reduce((s, c) => s + c.debt, 0);
  const collected = myCustomers.filter(c => c.status === "שולם").length;
  const filtered = filter === "הכל" ? myCustomers : myCustomers.filter(c => c.status === filter);

  function updateStatus(id, status) {
    setCustomerList(prev => prev.map(c =>
      c.id === id ? { ...c, status, debt: status === "שולם" ? 0 : c.debt } : c
    ));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status, debt: status === "שולם" ? 0 : prev.debt }));
  }

  function updateTaskStatus(taskId, status) {
    setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }

  function rejectTask(taskId) {
    if (!rejectReason.trim()) return;
    setTaskList(prev => prev.map(t => t.id === taskId ? {
      ...t, status: "נדחה",
      rejectionReason: rejectReason,
      rejectedBy: currentUser.id,
      rejectedAt: new Date().toISOString().split("T")[0],
    } : t));
    setRejectingTaskId(null);
    setRejectReason("");
  }

  function exportPersonalReport() {
    const content = `
      ${statsRow([
        { value: `₪${totalDebt.toLocaleString()}`, label: "סה\"כ חוב לגביה", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
        { value: myCustomers.length, label: "לקוחות" },
        { value: myCustomers.filter(c => c.status === "פתוח").length, label: "חובות פתוחים", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        { value: myCustomers.filter(c => c.status === "בטיפול").length, label: "בטיפול", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
        { value: collected, label: "שולמו", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
      ])}
      <h2>👥 פרטי לקוחות</h2>
      ${makeTable(
        ["שם לקוח", "מספר חשבון", "כתובת", "חוב (₪)", "סטטוס"],
        myCustomers.map(c => [
          c.name, c.accountNumber, c.address,
          c.debt > 0 ? `<strong style="color:#dc2626">₪${c.debt.toLocaleString()}</strong>` : `<span style="color:#16a34a">✓ שולם</span>`,
          statusBadge(c.status)
        ]),
        "#065f46"
      )}
      <h2>✅ משימות מוקצות</h2>
      ${makeTable(
        ["כותרת", "תיאור", "תאריך יעד", "סטטוס"],
        myTasks.map(t => [t.title, t.description || "—", t.dueDate, statusBadge(t.status)]),
        "#065f46"
      )}
    `;
    openPrintReport({
      title: `דוח אישי — ${currentUser.name}`,
      subtitle: `גובה חובות | אזור: ${currentUser.zone || "—"}`,
      accentColor: "#065f46",
      content,
    });
  }

  return (
    <Layout title="ממשק גובה חובות">
      <div className="panel-container">
        <div className="stats-row">
          <div className="mini-stat red-stat"><span>חוב כולל לגביה</span><strong>₪{totalDebt.toLocaleString()}</strong></div>
          <div className="mini-stat"><span>לקוחות שלי</span><strong>{myCustomers.length}</strong></div>
          <div className="mini-stat green-stat"><span>טופלו</span><strong>{collected}</strong></div>
          <div className="mini-stat"><span>משימות פעילות</span><strong>{activeTasks.length}</strong></div>
        </div>

        <div className="panel-top-bar">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${activeTab === "customers" ? "tab-active" : ""}`} onClick={() => setActiveTab("customers")}>לקוחות שלי</button>
            <button className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
              משימות שלי {activeTasks.length > 0 && <span className="tab-badge">{activeTasks.length}</span>}
            </button>
          </div>
          <button className="btn-export" onClick={exportPersonalReport}>⬇ דוח אישי PDF</button>
        </div>

        {activeTab === "customers" && (
          <>
            <div className="filter-bar">
              {["הכל", "פתוח", "בטיפול", "שולם"].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="two-col">
              <div className="list-panel">
                <h3>רשימת לקוחות ({filtered.length})</h3>
                {filtered.map(c => (
                  <div key={c.id} className={`customer-card ${selected?.id === c.id ? "selected" : ""} ${c.debt > 1000 ? "high-debt" : ""}`} onClick={() => setSelected(c)}>
                    <div className="customer-card-header">
                      <strong>{c.name}</strong>
                      <span className={`badge ${c.status === "שולם" ? "badge-green" : c.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{c.status}</span>
                    </div>
                    <div className="customer-card-body">
                      <span>📍 {c.address}</span>
                      <span className={c.debt > 0 ? "debt-amount" : "paid-amount"}>{c.debt > 0 ? `חוב: ₪${c.debt.toLocaleString()}` : "✓ שולם"}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="detail-panel">
                {selected ? (
                  <div>
                    <h3>פרטי לקוח</h3>
                    <div className="detail-card">
                      <div className="detail-row"><label>שם</label><span>{selected.name}</span></div>
                      <div className="detail-row"><label>מס׳ חשבון</label><span><code>{selected.accountNumber}</code></span></div>
                      <div className="detail-row"><label>כתובת</label><span>{selected.address}</span></div>
                      <div className="detail-row"><label>טלפון</label><span>{selected.phone}</span></div>
                      <div className="detail-row"><label>יתרת חוב</label><span className={selected.debt > 0 ? "debt-amount" : "paid-amount"}>{selected.debt > 0 ? `₪${selected.debt.toLocaleString()}` : "שולם"}</span></div>
                      <div className="detail-row"><label>תשלום אחרון</label><span>{selected.lastPayment}</span></div>
                      <div className="detail-row"><label>סטטוס</label><span className={`badge ${selected.status === "שולם" ? "badge-green" : selected.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{selected.status}</span></div>
                    </div>
                    <div className="action-section">
                      <h4>עדכון סטטוס טיפול</h4>
                      <div className="action-buttons">
                        <button className="btn-success" onClick={() => updateStatus(selected.id, "שולם")} disabled={selected.status === "שולם"}>✓ סמן כשולם</button>
                        <button className="btn-warning" onClick={() => updateStatus(selected.id, "בטיפול")} disabled={selected.status === "בטיפול"}>🔄 בטיפול</button>
                        <button className="btn-secondary" onClick={() => updateStatus(selected.id, "פתוח")} disabled={selected.status === "פתוח"}>↩ החזר לפתוח</button>
                      </div>
                    </div>
                    <div className="contact-section">
                      <h4>פנייה ללקוח</h4>
                      <div className="contact-buttons">
                        <a href={`tel:${selected.phone}`} className="btn-contact">📞 {selected.phone}</a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-detail"><span>👆</span><p>בחר לקוח מהרשימה לצפייה בפרטים</p></div>
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
                  <span>תאריך יעד: {t.dueDate}</span>
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
