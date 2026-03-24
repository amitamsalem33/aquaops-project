import { useState } from "react";
import Layout from "../components/Layout";
import { customers } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

export default function CollectorPanel() {
  const { currentUser } = useAuth();
  const [customerList, setCustomerList] = useState(
    customers.filter(c => c.assignedCollector === currentUser.id)
  );
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("הכל");

  const totalDebt = customerList.reduce((s, c) => s + c.debt, 0);
  const collected = customerList.filter(c => c.status === "שולם").length;

  const filtered = filter === "הכל" ? customerList : customerList.filter(c => c.status === filter);

  function updateStatus(id, status) {
    setCustomerList(customerList.map(c =>
      c.id === id ? { ...c, status, debt: status === "שולם" ? 0 : c.debt } : c
    ));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status, debt: status === "שולם" ? 0 : prev.debt }));
  }

  return (
    <Layout title="ממשק גובה חובות">
      <div className="panel-container">
        <div className="stats-row">
          <div className="mini-stat red-stat"><span>חוב כולל לגביה</span><strong>₪{totalDebt.toLocaleString()}</strong></div>
          <div className="mini-stat"><span>לקוחות שלי</span><strong>{customerList.length}</strong></div>
          <div className="mini-stat green-stat"><span>טופלו היום</span><strong>{collected}</strong></div>
        </div>

        <div className="filter-bar">
          {["הכל", "פתוח", "בטיפול", "שולם"].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="two-col">
          <div className="list-panel">
            <h3>רשימת לקוחות ({filtered.length})</h3>
            {filtered.map(c => (
              <div
                key={c.id}
                className={`customer-card ${selected?.id === c.id ? "selected" : ""} ${c.debt > 1000 ? "high-debt" : ""}`}
                onClick={() => setSelected(c)}
              >
                <div className="customer-card-header">
                  <strong>{c.name}</strong>
                  <span className={`badge ${c.status === "שולם" ? "badge-green" : c.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{c.status}</span>
                </div>
                <div className="customer-card-body">
                  <span>📍 {c.address}</span>
                  <span className={c.debt > 0 ? "debt-amount" : "paid-amount"}>
                    {c.debt > 0 ? `חוב: ₪${c.debt.toLocaleString()}` : "✓ שולם"}
                  </span>
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
                    <button
                      className="btn-success"
                      onClick={() => updateStatus(selected.id, "שולם")}
                      disabled={selected.status === "שולם"}
                    >
                      ✓ סמן כשולם
                    </button>
                    <button
                      className="btn-warning"
                      onClick={() => updateStatus(selected.id, "בטיפול")}
                      disabled={selected.status === "בטיפול"}
                    >
                      🔄 בטיפול
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => updateStatus(selected.id, "פתוח")}
                      disabled={selected.status === "פתוח"}
                    >
                      ↩ החזר לפתוח
                    </button>
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
              <div className="empty-detail">
                <span>👆</span>
                <p>בחר לקוח מהרשימה לצפייה בפרטים</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
