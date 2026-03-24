import { useState } from "react";
import Layout from "../components/Layout";
import { customers, meterReadings, tickets, tasks, users } from "../data/mockData";

const tabs = ["לוח בקרה", "משימות", "גביה", "קריאות מונים", "תקלות"];

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Dashboard() {
  const totalDebt = customers.reduce((s, c) => s + c.debt, 0);
  const openTickets = tickets.filter(t => t.status !== "סגור").length;
  const pendingReadings = meterReadings.filter(r => r.status === "ממתין").length;
  const flaggedReadings = meterReadings.filter(r => r.flag).length;
  const openTasks = tasks.filter(t => t.status !== "הושלם").length;

  return (
    <div>
      <h2 className="section-title">לוח בקרה ראשי</h2>
      <div className="stats-grid">
        <StatCard icon="💰" label="סה״כ חובות פתוחים" value={`₪${totalDebt.toLocaleString()}`} color="#ef4444" sub={`${customers.filter(c => c.debt > 0).length} לקוחות`} />
        <StatCard icon="🔧" label="תקלות פתוחות" value={openTickets} color="#f59e0b" sub={`${tickets.filter(t => t.priority === "גבוהה" && t.status !== "סגור").length} בעדיפות גבוהה`} />
        <StatCard icon="📊" label="קריאות ממתינות" value={pendingReadings} color="#3b82f6" sub={`${flaggedReadings} חריגות`} />
        <StatCard icon="📋" label="משימות פתוחות" value={openTasks} color="#8b5cf6" sub={`${tasks.filter(t => t.status === "בביצוע").length} בביצוע`} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>⚠️ תקלות דחופות</h3>
          <table className="data-table">
            <thead><tr><th>כותרת</th><th>כתובת</th><th>עדיפות</th><th>סטטוס</th></tr></thead>
            <tbody>
              {tickets.filter(t => t.priority === "גבוהה" && t.status !== "סגור").map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.address}</td>
                  <td><span className="badge badge-red">גבוהה</span></td>
                  <td><span className={`badge ${t.status === "פתוח" ? "badge-orange" : "badge-blue"}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-card">
          <h3>💧 קריאות חריגות</h3>
          <table className="data-table">
            <thead><tr><th>לקוח</th><th>מונה</th><th>סיבה</th></tr></thead>
            <tbody>
              {meterReadings.filter(r => r.flag).map(r => (
                <tr key={r.id}>
                  <td>{r.customerName}</td>
                  <td>{r.meterNumber}</td>
                  <td className="flag-reason">{r.flagReason}</td>
                </tr>
              ))}
              {meterReadings.filter(r => r.flag).length === 0 && <tr><td colSpan="3" className="empty">אין חריגות</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TasksManager() {
  const [taskList, setTaskList] = useState(tasks);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "", assignedRole: "collector", priority: "רגילה", dueDate: "" });

  const fieldWorkers = users.filter(u => u.role !== "admin");

  function addTask() {
    if (!newTask.title || !newTask.assignedTo) return;
    const worker = fieldWorkers.find(u => u.id === parseInt(newTask.assignedTo));
    setTaskList([...taskList, {
      id: Date.now(), ...newTask, assignedTo: parseInt(newTask.assignedTo),
      assignedRole: worker?.role, status: "פתוח", createdAt: new Date().toISOString().split("T")[0], createdBy: 1
    }]);
    setNewTask({ title: "", description: "", assignedTo: "", assignedRole: "collector", priority: "רגילה", dueDate: "" });
    setShowForm(false);
  }

  function updateStatus(id, status) {
    setTaskList(taskList.map(t => t.id === id ? { ...t, status } : t));
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">ניהול משימות</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ משימה חדשה</button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>יצירת משימה חדשה</h3>
          <div className="form-row">
            <div className="form-group">
              <label>כותרת</label>
              <input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="כותרת המשימה" />
            </div>
            <div className="form-group">
              <label>עובד מוקצה</label>
              <select value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                <option value="">בחר עובד</option>
                {fieldWorkers.map(u => <option key={u.id} value={u.id}>{u.name} - {u.role === "collector" ? "גובה" : u.role === "meter_reader" ? "קורא מונים" : "טכנאי"}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>תיאור</label>
              <input value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="תיאור המשימה" />
            </div>
            <div className="form-group">
              <label>עדיפות</label>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option>רגילה</option><option>גבוהה</option><option>נמוכה</option>
              </select>
            </div>
            <div className="form-group">
              <label>תאריך יעד</label>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={addTask}>צור משימה</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ביטול</button>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr><th>כותרת</th><th>מוקצה ל</th><th>עדיפות</th><th>תאריך יעד</th><th>סטטוס</th><th>פעולות</th></tr>
        </thead>
        <tbody>
          {taskList.map(t => {
            const worker = users.find(u => u.id === t.assignedTo);
            return (
              <tr key={t.id}>
                <td><strong>{t.title}</strong><br/><small>{t.description}</small></td>
                <td>{worker?.name || "—"}</td>
                <td><span className={`badge ${t.priority === "גבוהה" ? "badge-red" : t.priority === "נמוכה" ? "badge-gray" : "badge-blue"}`}>{t.priority}</span></td>
                <td>{t.dueDate}</td>
                <td><span className={`badge ${t.status === "הושלם" ? "badge-green" : t.status === "בביצוע" ? "badge-blue" : "badge-orange"}`}>{t.status}</span></td>
                <td>
                  <select className="status-select" value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
                    <option>פתוח</option><option>בביצוע</option><option>הושלם</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DebtOverview() {
  return (
    <div>
      <h2 className="section-title">סקירת גביה</h2>
      <div className="stats-row">
        <div className="mini-stat">
          <span>סה״כ חוב</span>
          <strong>₪{customers.reduce((s,c)=>s+c.debt,0).toLocaleString()}</strong>
        </div>
        <div className="mini-stat">
          <span>לקוחות בחוב</span>
          <strong>{customers.filter(c=>c.debt>0).length}</strong>
        </div>
        <div className="mini-stat">
          <span>שולמו החודש</span>
          <strong>{customers.filter(c=>c.status==="שולם").length}</strong>
        </div>
      </div>
      <table className="data-table">
        <thead><tr><th>שם לקוח</th><th>מספר חשבון</th><th>כתובת</th><th>חוב</th><th>גובה מוקצה</th><th>סטטוס</th></tr></thead>
        <tbody>
          {customers.map(c => {
            const collector = users.find(u => u.id === c.assignedCollector);
            return (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><code>{c.accountNumber}</code></td>
                <td>{c.address}</td>
                <td className={c.debt > 0 ? "debt-amount" : "paid-amount"}>{c.debt > 0 ? `₪${c.debt.toLocaleString()}` : "✓ שולם"}</td>
                <td>{collector?.name}</td>
                <td><span className={`badge ${c.status === "שולם" ? "badge-green" : c.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{c.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MeterReadingsOverview() {
  return (
    <div>
      <h2 className="section-title">סקירת קריאות מונים</h2>
      <div className="stats-row">
        <div className="mini-stat"><span>הוזנו</span><strong>{meterReadings.filter(r=>r.status==="הוזן").length}</strong></div>
        <div className="mini-stat"><span>ממתינות</span><strong>{meterReadings.filter(r=>r.status==="ממתין").length}</strong></div>
        <div className="mini-stat red-stat"><span>חריגות</span><strong>{meterReadings.filter(r=>r.flag).length}</strong></div>
      </div>
      <table className="data-table">
        <thead><tr><th>לקוח</th><th>מס׳ מונה</th><th>קריאה קודמת</th><th>קריאה נוכחית</th><th>צריכה</th><th>סטטוס</th></tr></thead>
        <tbody>
          {meterReadings.map(r => (
            <tr key={r.id} className={r.flag ? "row-flagged" : ""}>
              <td>{r.customerName}</td>
              <td><code>{r.meterNumber}</code></td>
              <td>{r.previousReading}</td>
              <td>{r.currentReading ?? "—"}</td>
              <td>{r.currentReading ? r.currentReading - r.previousReading : "—"}</td>
              <td>
                <span className={`badge ${r.flag ? "badge-red" : r.status === "הוזן" ? "badge-green" : "badge-gray"}`}>
                  {r.flag ? "⚠️ חריגה" : r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketsOverview() {
  return (
    <div>
      <h2 className="section-title">סקירת תקלות</h2>
      <table className="data-table">
        <thead><tr><th>כותרת</th><th>כתובת</th><th>עדיפות</th><th>טכנאי</th><th>נפתח</th><th>סטטוס</th></tr></thead>
        <tbody>
          {tickets.map(t => {
            const tech = users.find(u => u.id === t.assignedTech);
            return (
              <tr key={t.id}>
                <td><strong>{t.title}</strong><br/><small>{t.description}</small></td>
                <td>{t.address}</td>
                <td><span className={`badge ${t.priority === "גבוהה" ? "badge-red" : t.priority === "בינונית" ? "badge-orange" : "badge-gray"}`}>{t.priority}</span></td>
                <td>{tech?.name}</td>
                <td>{t.createdAt}</td>
                <td><span className={`badge ${t.status === "סגור" ? "badge-green" : t.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{t.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [<Dashboard />, <TasksManager />, <DebtOverview />, <MeterReadingsOverview />, <TicketsOverview />];

  return (
    <Layout title="פאנל מנהל">
      <div className="panel-container">
        <div className="tabs">
          {tabs.map((tab, i) => (
            <button key={i} className={`tab ${activeTab === i ? "tab-active" : ""}`} onClick={() => setActiveTab(i)}>
              {tab}
            </button>
          ))}
        </div>
        <div className="tab-content">{tabContent[activeTab]}</div>
      </div>
    </Layout>
  );
}
