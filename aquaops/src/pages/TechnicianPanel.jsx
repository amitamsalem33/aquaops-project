import { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { openPrintReport, statusBadge, priorityBadge, makeTable, statsRow } from "../utils/printReport";

const priorityOrder = { "גבוהה": 0, "בינונית": 1, "נמוכה": 2 };

export default function TechnicianPanel() {
  const { currentUser } = useAuth();
  const { taskList, setTaskList, ticketList, setTicketList } = useData();

  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("הכל");
  const [activeTab, setActiveTab] = useState("tickets");
  const [rejectingTaskId, setRejectingTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const myTickets = [...ticketList.filter(t => t.assignedTech === currentUser.id)]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const myTasks = taskList.filter(t => t.assignedTo === currentUser.id);
  const activeTasks = myTasks.filter(t => t.status !== "הושלם" && t.status !== "נדחה");

  const open = myTickets.filter(t => t.status === "פתוח").length;
  const inProgress = myTickets.filter(t => t.status === "בטיפול").length;
  const closed = myTickets.filter(t => t.status === "סגור").length;
  const filtered = filter === "הכל" ? myTickets : myTickets.filter(t => t.status === filter);

  function updateTicket(id, status) {
    const now = new Date().toLocaleString("he-IL");
    setTicketList(prev => prev.map(t =>
      t.id === id ? { ...t, status, ...(status === "סגור" ? { closedAt: now } : {}) } : t
    ));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status, ...(status === "סגור" ? { closedAt: now } : {}) }));
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
        { value: myTickets.length, label: 'סה"כ תקלות' },
        { value: open, label: "פתוחות", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
        { value: inProgress, label: "בטיפול", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
        { value: closed, label: "סגורות", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
        { value: myTickets.filter(t => t.priority === "גבוהה").length, label: "עדיפות גבוהה", color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff" },
      ])}
      <h2>📋 פרטי תקלות</h2>
      ${makeTable(
        ["כותרת", "כתובת", "עדיפות", "סטטוס"],
        myTickets.map(t => [t.title, t.address, priorityBadge(t.priority), statusBadge(t.status)]),
        "#6d28d9"
      )}
      <h2>✅ משימות מוקצות</h2>
      ${makeTable(
        ["כותרת", "תיאור", "עדיפות", "תאריך יעד", "סטטוס"],
        myTasks.map(t => [t.title, t.description || "—", priorityBadge(t.priority), t.dueDate, statusBadge(t.status)]),
        "#6d28d9"
      )}
    `;
    openPrintReport({
      title: `דוח אישי — ${currentUser.name}`,
      subtitle: `טכנאי | התמחות: ${currentUser.specialty || "—"}`,
      accentColor: "#6d28d9",
      content,
    });
  }

  return (
    <Layout title="ממשק טכנאי">
      <div className="panel-container">
        <div className="stats-row">
          <div className="mini-stat red-stat"><span>פתוחות</span><strong>{open}</strong></div>
          <div className="mini-stat"><span>בטיפול</span><strong>{inProgress}</strong></div>
          <div className="mini-stat green-stat"><span>סגורות</span><strong>{closed}</strong></div>
          <div className="mini-stat"><span>משימות פעילות</span><strong>{activeTasks.length}</strong></div>
        </div>

        <div className="panel-top-bar">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${activeTab === "tickets" ? "tab-active" : ""}`} onClick={() => setActiveTab("tickets")}>תקלות שלי</button>
            <button className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
              משימות שלי {activeTasks.length > 0 && <span className="tab-badge">{activeTasks.length}</span>}
            </button>
          </div>
          <button className="btn-export" onClick={exportPersonalReport}>⬇ דוח אישי PDF</button>
        </div>

        {activeTab === "tickets" && (
          <>
            <div className="filter-bar">
              {["הכל", "פתוח", "בטיפול", "סגור"].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="two-col">
              <div className="list-panel">
                <h3>כרטיסי תקלה ({filtered.length})</h3>
                {filtered.map(t => (
                  <div key={t.id} className={`customer-card ${selected?.id === t.id ? "selected" : ""} ${t.priority === "גבוהה" && t.status !== "סגור" ? "high-debt" : ""}`} onClick={() => setSelected(t)}>
                    <div className="customer-card-header">
                      <strong>{t.title}</strong>
                      <span className={`badge ${t.priority === "גבוהה" ? "badge-red" : t.priority === "בינונית" ? "badge-orange" : "badge-gray"}`}>{t.priority}</span>
                    </div>
                    <div className="customer-card-body">
                      <span>📍 {t.address}</span>
                      <span className={`badge ${t.status === "סגור" ? "badge-green" : t.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{t.status}</span>
                    </div>
                    <div className="card-date">{t.createdAt}</div>
                  </div>
                ))}
              </div>
              <div className="detail-panel">
                {selected ? (
                  <div>
                    <h3>פרטי תקלה #{selected.id}</h3>
                    <div className="detail-card">
                      <div className="detail-row"><label>כותרת</label><span><strong>{selected.title}</strong></span></div>
                      <div className="detail-row"><label>תיאור</label><span>{selected.description}</span></div>
                      <div className="detail-row"><label>כתובת</label><span>📍 {selected.address}</span></div>
                      <div className="detail-row"><label>עדיפות</label>
                        <span className={`badge ${selected.priority === "גבוהה" ? "badge-red" : selected.priority === "בינונית" ? "badge-orange" : "badge-gray"}`}>{selected.priority}</span>
                      </div>
                      <div className="detail-row"><label>דווח ע״י</label><span>{selected.reportedBy}</span></div>
                      <div className="detail-row"><label>נפתח</label><span>{selected.createdAt}</span></div>
                      {selected.closedAt && <div className="detail-row"><label>נסגר</label><span>{selected.closedAt}</span></div>}
                      <div className="detail-row"><label>סטטוס</label>
                        <span className={`badge ${selected.status === "סגור" ? "badge-green" : selected.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{selected.status}</span>
                      </div>
                    </div>
                    {selected.status !== "סגור" && (
                      <div className="action-section">
                        <h4>עדכון סטטוס</h4>
                        <div className="action-buttons">
                          {selected.status === "פתוח" && <button className="btn-warning" onClick={() => updateTicket(selected.id, "בטיפול")}>🔄 התחל טיפול</button>}
                          {selected.status === "בטיפול" && <button className="btn-success" onClick={() => updateTicket(selected.id, "סגור")}>✓ סגור תקלה</button>}
                          <button className="btn-secondary" onClick={() => updateTicket(selected.id, "פתוח")}>↩ החזר לפתוח</button>
                        </div>
                      </div>
                    )}
                    {selected.status === "סגור" && (
                      <div className="status-block status-ok">
                        <h4>✓ תקלה טופלה ונסגרה</h4>
                        {selected.closedAt && <p>תאריך סגירה: {selected.closedAt}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-detail"><span>🔧</span><p>בחר כרטיס תקלה מהרשימה לצפייה בפרטים</p></div>
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
