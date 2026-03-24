import { useState } from "react";
import Layout from "../components/Layout";
import { tickets } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

const priorityOrder = { "גבוהה": 0, "בינונית": 1, "נמוכה": 2 };

export default function TechnicianPanel() {
  const { currentUser } = useAuth();
  const [ticketList, setTicketList] = useState(
    [...tickets.filter(t => t.assignedTech === currentUser.id)]
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  );
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("הכל");

  const open = ticketList.filter(t => t.status === "פתוח").length;
  const inProgress = ticketList.filter(t => t.status === "בטיפול").length;
  const closed = ticketList.filter(t => t.status === "סגור").length;

  const filtered = filter === "הכל" ? ticketList : ticketList.filter(t => t.status === filter);

  function updateTicket(id, status) {
    const now = new Date().toLocaleString("he-IL");
    setTicketList(ticketList.map(t =>
      t.id === id ? { ...t, status, ...(status === "סגור" ? { closedAt: now } : {}) } : t
    ));
    if (selected?.id === id) {
      setSelected(prev => ({ ...prev, status, ...(status === "סגור" ? { closedAt: now } : {}) }));
    }
  }

  return (
    <Layout title="ממשק טכנאי">
      <div className="panel-container">
        <div className="stats-row">
          <div className="mini-stat red-stat"><span>פתוחות</span><strong>{open}</strong></div>
          <div className="mini-stat"><span>בטיפול</span><strong>{inProgress}</strong></div>
          <div className="mini-stat green-stat"><span>סגורות</span><strong>{closed}</strong></div>
        </div>

        <div className="filter-bar">
          {["הכל", "פתוח", "בטיפול", "סגור"].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="two-col">
          <div className="list-panel">
            <h3>כרטיסי תקלה ({filtered.length})</h3>
            {filtered.map(t => (
              <div
                key={t.id}
                className={`customer-card ${selected?.id === t.id ? "selected" : ""} ${t.priority === "גבוהה" && t.status !== "סגור" ? "high-debt" : ""}`}
                onClick={() => { setSelected(t); setNote(""); }}
              >
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
                      {selected.status === "פתוח" && (
                        <button className="btn-warning" onClick={() => updateTicket(selected.id, "בטיפול")}>
                          🔄 התחל טיפול
                        </button>
                      )}
                      {selected.status === "בטיפול" && (
                        <button className="btn-success" onClick={() => updateTicket(selected.id, "סגור")}>
                          ✓ סגור תקלה
                        </button>
                      )}
                      <button className="btn-secondary" onClick={() => updateTicket(selected.id, "פתוח")}>
                        ↩ החזר לפתוח
                      </button>
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
              <div className="empty-detail">
                <span>🔧</span>
                <p>בחר כרטיס תקלה מהרשימה לצפייה בפרטים</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
