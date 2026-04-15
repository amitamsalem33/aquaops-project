import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useData } from "../context/DataContext";
import { openPrintReport, statusBadge, priorityBadge, makeTable, statsRow } from "../utils/printReport";
import { usePagination, Paginator } from "../hooks/usePagination";
import { formatDate } from "../utils/formatDate";
import * as XLSX from "xlsx";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";

const tabs = ["לוח בקרה", "משימות", "גביה", "קריאות מונים", "תקלות", "דוח מחלקתי", "ניהול עובדים"];

const roleLabel = r => r === "collector" ? "גובה" : r === "meter_reader" ? "קורא מונים" : "טכנאי";
const roleTeamLabel = r => r === "collector" ? "גובים" : r === "meter_reader" ? "קוראי מונים" : "טכנאים";

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

function Dashboard({ customers, tickets, meterReadings, tasks, userList }) {
  // ── live stats ──────────────────────────────────────────────────────────────
  const totalDebt      = customers.reduce((s, c) => s + c.debt, 0);
  const openTickets    = tickets.filter(t => t.status !== "סגור").length;
  const pendingReadings = meterReadings.filter(r => r.status === "ממתין").length;
  const flaggedReadings = meterReadings.filter(r => r.flag).length;
  const openTasks      = tasks.filter(t => t.status !== "הושלם" && t.status !== "נדחה").length;

  // ── chart data (all derived live from props) ─────────────────────────────
  const debtPieData = [
    { name: "חוב פתוח", value: customers.filter(c => c.debt > 0).length },
    { name: "שולם",     value: customers.filter(c => c.debt === 0).length },
  ];

  const ticketsBarData = [
    { name: "פתוח",   value: tickets.filter(t => t.status === "פתוח").length,   fill: "#f59e0b" },
    { name: "בטיפול", value: tickets.filter(t => t.status === "בטיפול").length, fill: "#3b82f6" },
    { name: "סגור",   value: tickets.filter(t => t.status === "סגור").length,   fill: "#22c55e" },
  ];

  const tasksBarData = [
    { name: "פתוח",    value: tasks.filter(t => t.status === "פתוח").length,    fill: "#f59e0b" },
    { name: "בביצוע",  value: tasks.filter(t => t.status === "בביצוע").length,  fill: "#3b82f6" },
    { name: "הושלם",   value: tasks.filter(t => t.status === "הושלם").length,   fill: "#22c55e" },
    { name: "נדחה",    value: tasks.filter(t => t.status === "נדחה").length,    fill: "#ef4444" },
  ];

  const readingsPieData = [
    { name: "ממתין",   value: meterReadings.filter(r => r.status === "ממתין").length },
    { name: "הוזן",    value: meterReadings.filter(r => r.status === "הוזן" && !r.flag).length },
    { name: "⚠️ חריגה", value: flaggedReadings },
  ];
  const READINGS_COLORS = ["#94a3b8", "#22c55e", "#ef4444"];
  const PIE_COLORS = ["#ef4444", "#22c55e"];

  function exportReport() {
    const urgentTickets = tickets.filter(t => t.priority === "גבוהה" && t.status !== "סגור");
    const content = `
      ${statsRow([
        { value: `₪${totalDebt.toLocaleString()}`, label: 'סה"כ חובות פתוחים', color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
        { value: openTickets, label: "תקלות פתוחות", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        { value: pendingReadings, label: "קריאות ממתינות", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
        { value: flaggedReadings, label: "קריאות חריגות", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
        { value: openTasks, label: "משימות פתוחות", color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
      ])}
      <h2>⚠️ תקלות דחופות</h2>
      ${makeTable(
        ["כותרת", "כתובת", "עדיפות", "סטטוס"],
        urgentTickets.map(t => [t.title, t.address, priorityBadge(t.priority), statusBadge(t.status)]),
        "#ef4444"
      )}
      <h2>💧 קריאות חריגות</h2>
      ${makeTable(
        ["לקוח", "מספר מונה", "סיבת חריגה"],
        meterReadings.filter(r => r.flag).map(r => [r.customerName, r.meterNumber, r.flagReason || "—"]),
        "#3b82f6"
      )}
    `;
    openPrintReport({ title: "דוח לוח בקרה — AquaOps", subtitle: "סקירה כללית", accentColor: "#1e3a8a", content });
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">לוח בקרה ראשי</h2>
        <button className="btn-export" onClick={exportReport}>⬇ ייצוא PDF</button>
      </div>

      {/* ── KPI cards ── */}
      <div className="stats-grid">
        <StatCard icon="💰" label='סה"כ חובות פתוחים' value={`₪${totalDebt.toLocaleString()}`} color="#ef4444" sub={`${customers.filter(c => c.debt > 0).length} לקוחות`} />
        <StatCard icon="🔧" label="תקלות פתוחות"    value={openTickets}     color="#f59e0b" sub={`${tickets.filter(t => t.priority === "גבוהה" && t.status !== "סגור").length} בעדיפות גבוהה`} />
        <StatCard icon="📊" label="קריאות ממתינות"  value={pendingReadings} color="#3b82f6" sub={`${flaggedReadings} חריגות`} />
        <StatCard icon="📋" label="משימות פעילות"   value={openTasks}       color="#8b5cf6" sub={`${tasks.filter(t => t.status === "בביצוע").length} בביצוע`} />
      </div>

      {/* ── row 1: debt pie + tickets bar ── */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>💰 סטטוס גביה</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={debtPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ cx, cy, midAngle, outerRadius, value }) => {
                  if (value === 0) return null;
                  const R = Math.PI / 180;
                  const x = cx + (outerRadius + 24) * Math.cos(-midAngle * R);
                  const y = cy + (outerRadius + 24) * Math.sin(-midAngle * R);
                  return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold" fill="#1a202c">{value}</text>;
                }}>
                {debtPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3>🔧 תקלות לפי סטטוס</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ticketsBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" /><YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="תקלות" radius={[4, 4, 0, 0]}>
                {ticketsBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── row 2: tasks bar + readings pie ── */}
      <div className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <div className="dashboard-card">
          <h3>📋 משימות לפי סטטוס</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tasksBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" /><YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="משימות" radius={[4, 4, 0, 0]}>
                {tasksBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3>💧 קריאות מונים</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={readingsPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ cx, cy, midAngle, outerRadius, value }) => {
                  if (value === 0) return null;
                  const R = Math.PI / 180;
                  const x = cx + (outerRadius + 24) * Math.cos(-midAngle * R);
                  const y = cy + (outerRadius + 24) * Math.sin(-midAngle * R);
                  return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold" fill="#1a202c">{value}</text>;
                }}>
                {readingsPieData.map((_, i) => <Cell key={i} fill={READINGS_COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── row 3: urgent tickets + flagged readings ── */}
      <div className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <div className="dashboard-card">
          <h3>⚠️ תקלות דחופות</h3>
          <table className="data-table">
            <thead><tr><th>כותרת</th><th>כתובת</th><th>עדיפות</th><th>סטטוס</th></tr></thead>
            <tbody>
              {tickets.filter(t => t.priority === "גבוהה" && t.status !== "סגור").map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td><td>{t.address}</td>
                  <td><span className="badge badge-red">גבוהה</span></td>
                  <td><span className={`badge ${t.status === "פתוח" ? "badge-orange" : "badge-blue"}`}>{t.status}</span></td>
                </tr>
              ))}
              {tickets.filter(t => t.priority === "גבוהה" && t.status !== "סגור").length === 0 &&
                <tr><td colSpan="4" className="empty">אין תקלות דחופות</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="dashboard-card">
          <h3>💧 קריאות חריגות</h3>
          <table className="data-table">
            <thead><tr><th>לקוח</th><th>מונה</th><th>סיבה</th></tr></thead>
            <tbody>
              {meterReadings.filter(r => r.flag).map(r => (
                <tr key={r.id}><td>{r.customerName}</td><td>{r.meterNumber}</td><td className="flag-reason">{r.flagReason}</td></tr>
              ))}
              {meterReadings.filter(r => r.flag).length === 0 && <tr><td colSpan="3" className="empty">אין חריגות</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkloadBar({ taskList, userList }) {
  const [workerModal, setWorkerModal] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const fieldWorkers = userList.filter(u => u.role !== "admin");

  function openWorkerModal(u) {
    const tasks = taskList.filter(t => t.assignedTo === u.id);
    setWorkerModal({ user: u, tasks });
  }

  return (
    <div className="workload-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: collapsed ? 0 : "12px" }}>
        <h3 style={{ margin: 0 }}>
          עומס עבודה לפי עובד
          {!collapsed && <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 400, marginRight: "8px" }}>לחץ על שם לצפייה במשימות</span>}
        </h3>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontSize: "13px", color: "#64748b", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}
        >
          {collapsed ? "▼ הצג" : "▲ מזער"}
        </button>
      </div>
      {!collapsed && <div className="workload-grid">
        {["collector", "meter_reader", "technician"].map(role => {
          const workers = fieldWorkers.filter(u => u.role === role);
          return (
            <div key={role} className="workload-team">
              <div className="workload-team-title">{roleTeamLabel(role)} ({workers.length})</div>
              <div className="workload-table-wrap">
                <table className="workload-compact-table">
                  <tbody>
                    {workers.map(u => {
                      const active = taskList.filter(t => t.assignedTo === u.id && t.status !== "הושלם" && t.status !== "נדחה").length;
                      const done = taskList.filter(t => t.assignedTo === u.id && t.status === "הושלם").length;
                      const level = active <= 2 ? "low" : active <= 4 ? "mid" : "high";
                      const badgeClass = level === "low" ? "badge-green" : level === "mid" ? "badge-orange" : "badge-red";
                      return (
                        <tr key={u.id} className="workload-compact-row" onClick={() => openWorkerModal(u)}>
                          <td className="wc-name">{u.name}</td>
                          <td className="wc-badge"><span className={`badge ${badgeClass}`}>{active} פעילות</span></td>
                          <td className="wc-done" style={{ color: "#94a3b8", fontSize: "12px" }}>{done} הושלמו</td>
                        </tr>
                      );
                    })}
                    {workers.length === 0 && <tr><td colSpan="3" style={{ color: "#94a3b8", fontSize: "13px", padding: "8px" }}>אין עובדים בצוות</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>}

      {workerModal && (
        <div className="modal-overlay" onClick={() => setWorkerModal(null)}>
          <div className="modal-box" style={{ maxWidth: "620px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>משימות — {workerModal.user.name}</h3>
              <button className="btn-secondary" style={{ padding: "4px 12px", fontSize: "13px" }} onClick={() => setWorkerModal(null)}>✕ סגור</button>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              {roleLabel(workerModal.user.role)} | {workerModal.user.zone || workerModal.user.specialty || "—"}
            </div>
            {workerModal.tasks.length === 0
              ? <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>אין משימות מוקצות לעובד זה</p>
              : <table className="data-table">
                  <thead>
                    <tr><th>כותרת</th><th>עדיפות</th><th>יעד</th><th>סטטוס</th></tr>
                  </thead>
                  <tbody>
                    {workerModal.tasks.map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.title}</strong>{t.description && <><br /><small style={{ color: "#6b7280" }}>{t.description}</small></>}</td>
                        <td><span className={`badge ${t.priority === "גבוהה" ? "badge-red" : t.priority === "נמוכה" ? "badge-gray" : "badge-blue"}`}>{t.priority}</span></td>
                        <td style={{ fontSize: "13px" }}>{formatDate(t.dueDate)}</td>
                        <td><span className={`badge ${t.status === "הושלם" ? "badge-green" : t.status === "נדחה" ? "badge-gray" : t.status === "בביצוע" ? "badge-blue" : "badge-orange"}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>
      )}
    </div>
  );
}

function TasksManager({ taskList, setTaskList, userList }) {
  const [showForm, setShowForm] = useState(false);
  const [reassigningTaskId, setReassigningTaskId] = useState(null);
  const [newAssignee, setNewAssignee] = useState("");
  const [reassignSearch, setReassignSearch] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "", priority: "רגילה", dueDate: "" });
  const [workerSearch, setWorkerSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [taskSearch, setTaskSearch] = useState("");

  const fieldWorkers = userList.filter(u => u.role !== "admin");
  const roleFilteredWorkers = roleFilter ? fieldWorkers.filter(u => u.role === roleFilter) : fieldWorkers;
  const filteredWorkers = workerSearch.trim()
    ? roleFilteredWorkers.filter(u => u.name.includes(workerSearch.trim()))
    : roleFilteredWorkers;
  const rejectedTasks = taskList.filter(t => t.status === "נדחה");
  const activeTasks = taskList.filter(t => t.status !== "נדחה");
  const displayedTasks = taskSearch.trim()
    ? activeTasks.filter(t => {
        const worker = userList.find(u => u.id === Number(t.assignedTo));
        const q = taskSearch.trim();
        return String(t.title || "").includes(q) || String(worker?.name || "").includes(q);
      })
    : activeTasks;

  const { paged: pagedTasks, page: taskPage, setPage: setTaskPage, totalPages: taskTotalPages } = usePagination(displayedTasks, 10);

  useEffect(() => {
    if (filteredWorkers.length === 1) {
      setNewTask(prev => ({ ...prev, assignedTo: String(filteredWorkers[0].id) }));
    } else {
      setNewTask(prev => ({ ...prev, assignedTo: "" }));
    }
  }, [workerSearch, roleFilter]);

  function getWorkload(userId) {
    return taskList.filter(t => t.assignedTo === userId && t.status !== "הושלם" && t.status !== "נדחה").length;
  }

  function addTask() {
    if (!newTask.title || !newTask.assignedTo) return;
    const worker = fieldWorkers.find(u => u.id === parseInt(newTask.assignedTo));
    setTaskList(prev => [...prev, {
      id: Date.now(), ...newTask, assignedTo: parseInt(newTask.assignedTo),
      assignedRole: worker?.role, status: "פתוח", createdAt: new Date().toISOString().split("T")[0], createdBy: 1
    }]);
    setNewTask({ title: "", description: "", assignedTo: "", priority: "רגילה", dueDate: "" });
    setWorkerSearch("");
    setRoleFilter("");
    setShowForm(false);
  }

  function updateStatus(id, status) {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  function reassignTask(taskId) {
    if (!newAssignee) return;
    const worker = fieldWorkers.find(u => u.id === parseInt(newAssignee));
    setTaskList(prev => prev.map(t => t.id === taskId ? {
      ...t, assignedTo: parseInt(newAssignee), assignedRole: worker?.role,
      status: "פתוח", rejectionReason: undefined, rejectedBy: undefined, rejectedAt: undefined,
    } : t));
    setReassigningTaskId(null);
    setNewAssignee("");
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">ניהול משימות</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ משימה חדשה</button>
      </div>

      <WorkloadBar taskList={taskList} userList={userList} />

      {rejectedTasks.length > 0 && (
        <div className="rejected-section">
          <h3>⚠️ משימות שנדחו — ממתינות להקצאה מחדש ({rejectedTasks.length})</h3>
          {rejectedTasks.map(t => {
            const rejectedByUser = userList.find(u => u.id === t.rejectedBy);
            return (
              <div key={t.id} className="rejected-task-card">
                <div className="rejected-task-header">
                  <div>
                    <strong>{t.title}</strong>
                    <p>{t.description}</p>
                    <span className="reject-reason-display">סיבה: {t.rejectionReason} — נדחה ע״י {rejectedByUser?.name} ב-{t.rejectedAt}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-primary" onClick={() => { setReassigningTaskId(t.id); setNewAssignee(""); setReassignSearch(""); }}>הקצה מחדש</button>
                    <button className="btn-reject" style={{ padding: "10px 16px" }} onClick={() => setTaskList(prev => prev.filter(x => x.id !== t.id))}>מחק</button>
                  </div>
                </div>
                {reassigningTaskId === t.id && (() => {
                  const candidates = fieldWorkers.filter(u => u.id !== t.rejectedBy && u.role === t.assignedRole);
                  const suggestions = reassignSearch.trim()
                    ? candidates.filter(u => u.name.includes(reassignSearch.trim()))
                    : [];
                  const selectedWorker = newAssignee ? fieldWorkers.find(u => String(u.id) === String(newAssignee)) : null;
                  return (
                    <div className="reassign-form">
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                        ניתן להקצות רק לעובדי צוות <strong>{roleTeamLabel(t.assignedRole)}</strong>
                      </p>
                      <div style={{ position: "relative", marginBottom: "10px" }}>
                        <input
                          type="text"
                          placeholder="🔍 הקלד שם עובד..."
                          value={reassignSearch}
                          onChange={e => { setReassignSearch(e.target.value); setNewAssignee(""); }}
                          style={{
                            width: "100%", padding: "9px 14px", border: "1.5px solid #d1d5db",
                            borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", direction: "rtl",
                            background: selectedWorker ? "#f0fdf4" : "white",
                            borderColor: selectedWorker ? "#22c55e" : "#d1d5db",
                          }}
                        />
                        {selectedWorker && (
                          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                            ✓ נבחר
                          </span>
                        )}
                        {suggestions.length > 0 && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0,
                            background: "white", border: "1.5px solid #d1d5db", borderRadius: "10px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden",
                          }}>
                            {suggestions.map(u => {
                              const load = getWorkload(u.id);
                              const color = load <= 2 ? "#16a34a" : load <= 4 ? "#d97706" : "#dc2626";
                              const bg = load <= 2 ? "#f0fdf4" : load <= 4 ? "#fffbeb" : "#fff1f2";
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => { setNewAssignee(String(u.id)); setReassignSearch(u.name); }}
                                  style={{
                                    padding: "10px 14px", cursor: "pointer", display: "flex",
                                    justifyContent: "space-between", alignItems: "center",
                                    borderBottom: "1px solid #f3f4f6", direction: "rtl",
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                                >
                                  <span style={{ fontWeight: 600 }}>{u.name}</span>
                                  <span style={{ fontSize: "12px", background: bg, color, padding: "3px 8px", borderRadius: "12px", fontWeight: 600 }}>
                                    {load} משימות פעילות
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {reassignSearch.trim() && suggestions.length === 0 && !selectedWorker && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0,
                            background: "white", border: "1.5px solid #e5e7eb", borderRadius: "10px",
                            padding: "12px 14px", fontSize: "13px", color: "#9ca3af", zIndex: 200,
                          }}>
                            לא נמצאו עובדים תואמים
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-success" onClick={() => reassignTask(t.id)} disabled={!newAssignee}>אשר הקצאה</button>
                        <button className="btn-secondary" onClick={() => { setReassigningTaskId(null); setReassignSearch(""); setNewAssignee(""); }}>ביטול</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h3>יצירת משימה חדשה</h3>
          <div className="form-row">
            <div className="form-group">
              <label>כותרת</label>
              <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="כותרת המשימה" />
            </div>
            <div className="form-group">
              <label>מחלקה</label>
              <select value={roleFilter} onChange={e => {
                setRoleFilter(e.target.value);
                setWorkerSearch("");
                setNewTask(prev => ({ ...prev, assignedTo: "" }));
              }}>
                <option value="">כל המחלקות</option>
                <option value="collector">גובים</option>
                <option value="meter_reader">קוראי מונים</option>
                <option value="technician">טכנאים</option>
              </select>
            </div>
            <div className="form-group">
              <label>עובד מוקצה</label>
              <input
                className="worker-search-input"
                placeholder="🔍 הקלד שם עובד לחיפוש..."
                value={workerSearch}
                onChange={e => setWorkerSearch(e.target.value)}
              />
              <select value={newTask.assignedTo} onChange={e => {
                const selected = fieldWorkers.find(u => String(u.id) === e.target.value);
                setNewTask({ ...newTask, assignedTo: e.target.value });
                if (selected) setWorkerSearch(selected.name);
              }}>
                <option value="">בחר עובד</option>
                {filteredWorkers.map(u => {
                  const load = getWorkload(u.id);
                  const loadLabel = load <= 2 ? "✅" : load <= 4 ? "⚠️" : "🔴";
                  return <option key={u.id} value={u.id}>{loadLabel} {u.name} ({roleLabel(u.role)}) — {load} משימות פעילות</option>;
                })}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>תיאור</label>
              <input value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="תיאור המשימה" />
            </div>
            <div className="form-group">
              <label>עדיפות</label>
              <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                <option>רגילה</option><option>גבוהה</option><option>נמוכה</option>
              </select>
            </div>
            <div className="form-group">
              <label>תאריך יעד</label>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={addTask}>צור משימה</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setWorkerSearch(""); setRoleFilter(""); }}>ביטול</button>
          </div>
        </div>
      )}

      <div className="search-bar" style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="🔍 חיפוש משימה לפי שם או עובד מוקצה..."
          value={taskSearch}
          onChange={e => setTaskSearch(e.target.value)}
        />
      </div>

      <table className="data-table">
        <thead>
          <tr><th>כותרת</th><th>מוקצה ל</th><th>עדיפות</th><th>תאריך יעד</th><th>סטטוס</th><th>פעולות</th></tr>
        </thead>
        <tbody>
          {pagedTasks.length === 0 && <tr><td colSpan="6" className="empty">לא נמצאו תוצאות</td></tr>}
          {pagedTasks.map(t => {
            const worker = userList.find(u => u.id === t.assignedTo);
            return (
              <tr key={t.id}>
                <td><strong>{t.title}</strong><br /><small>{t.description}</small></td>
                <td>{worker?.name || "—"}</td>
                <td><span className={`badge ${t.priority === "גבוהה" ? "badge-red" : t.priority === "נמוכה" ? "badge-gray" : "badge-blue"}`}>{t.priority}</span></td>
                <td>{formatDate(t.dueDate)}</td>
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
      <Paginator page={taskPage} totalPages={taskTotalPages} setPage={setTaskPage} total={displayedTasks.length} pageSize={10} />
    </div>
  );
}

function DebtOverview({ customers, userList }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("הכל");

  const filtered = customers.filter(c => {
    const matchSearch = c.name.includes(search) || c.accountNumber.includes(search);
    const matchStatus = statusFilter === "הכל" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { paged, page, setPage, totalPages } = usePagination(filtered, 10);

  function exportExcel() {
    const rows = filtered.map(c => {
      const collector = userList.find(u => u.id === c.assignedCollector);
      return { "שם לקוח": c.name, "מספר חשבון": c.accountNumber, "כתובת": c.address, "חוב (₪)": c.debt, "גובה": collector?.name || "", "סטטוס": c.status };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "גביה");
    XLSX.writeFile(wb, "דוח_גביה.xlsx");
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">סקירת גביה</h2>
        <button className="btn-export" onClick={exportExcel}>⬇ ייצוא Excel</button>
      </div>
      <div className="stats-row">
        <div className="mini-stat"><span>סה״כ חוב</span><strong>₪{customers.reduce((s, c) => s + c.debt, 0).toLocaleString()}</strong></div>
        <div className="mini-stat"><span>לקוחות בחוב</span><strong>{customers.filter(c => c.debt > 0).length}</strong></div>
        <div className="mini-stat"><span>שולמו החודש</span><strong>{customers.filter(c => c.status === "שולם").length}</strong></div>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="🔍 חיפוש לפי שם או מספר חשבון..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>הכל</option><option>פתוח</option><option>בטיפול</option><option>שולם</option>
        </select>
      </div>
      <table className="data-table">
        <thead><tr><th>שם לקוח</th><th>מספר חשבון</th><th>כתובת</th><th>חוב</th><th>גובה מוקצה</th><th>סטטוס</th></tr></thead>
        <tbody>
          {paged.length === 0 && <tr><td colSpan="6" className="empty">לא נמצאו תוצאות</td></tr>}
          {paged.map(c => {
            const collector = userList.find(u => u.id === c.assignedCollector);
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
      <Paginator page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} pageSize={10} />
    </div>
  );
}

function MeterReadingsOverview({ meterReadings }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("הכל");

  const filtered = meterReadings.filter(r => {
    const matchStatus = statusFilter === "הכל" || (statusFilter === "חריגה" ? r.flag : r.status === statusFilter);
    const q = search.trim();
    const matchSearch = !q || r.customerName.includes(q) || r.meterNumber.includes(q);
    return matchStatus && matchSearch;
  });

  const { paged, page, setPage, totalPages } = usePagination(filtered, 10);

  return (
    <div>
      <h2 className="section-title">סקירת קריאות מונים</h2>
      <div className="stats-row">
        <div className="mini-stat"><span>הוזנו</span><strong>{meterReadings.filter(r => r.status === "הוזן").length}</strong></div>
        <div className="mini-stat"><span>ממתינות</span><strong>{meterReadings.filter(r => r.status === "ממתין").length}</strong></div>
        <div className="mini-stat red-stat"><span>חריגות</span><strong>{meterReadings.filter(r => r.flag).length}</strong></div>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="🔍 חיפוש לפי שם לקוח או מספר מונה..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>הכל</option><option>ממתין</option><option>הוזן</option><option>חריגה</option>
        </select>
      </div>
      <table className="data-table">
        <thead><tr><th>לקוח</th><th>מס׳ מונה</th><th>קריאה קודמת</th><th>קריאה נוכחית</th><th>צריכה</th><th>תאריך קריאה</th><th>סטטוס</th></tr></thead>
        <tbody>
          {paged.length === 0 && <tr><td colSpan="7" className="empty">לא נמצאו תוצאות</td></tr>}
          {paged.map(r => (
            <tr key={r.id} className={r.flag ? "row-flagged" : ""}>
              <td>{r.customerName}</td>
              <td><code>{r.meterNumber}</code></td>
              <td>{r.previousReading}</td>
              <td>{r.currentReading ?? "—"}</td>
              <td>{r.currentReading ? r.currentReading - r.previousReading : "—"}</td>
              <td>{formatDate(r.readingDate)}</td>
              <td><span className={`badge ${r.flag ? "badge-red" : r.status === "הוזן" ? "badge-green" : "badge-gray"}`}>{r.flag ? "⚠️ חריגה" : r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paginator page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} pageSize={10} />
    </div>
  );
}

function TicketsOverview({ tickets, userList }) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("הכל");
  const [statusFilter, setStatusFilter] = useState("הכל");

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.includes(search) || t.address.includes(search);
    const matchPriority = priorityFilter === "הכל" || t.priority === priorityFilter;
    const matchStatus = statusFilter === "הכל" || t.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  const { paged, page, setPage, totalPages } = usePagination(filtered, 10);

  function exportExcel() {
    const rows = filtered.map(t => {
      const tech = userList.find(u => u.id === t.assignedTech);
      return { "כותרת": t.title, "תיאור": t.description, "כתובת": t.address, "עדיפות": t.priority, "טכנאי": tech?.name || "", "נפתח": t.createdAt, "סטטוס": t.status };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "תקלות");
    XLSX.writeFile(wb, "דוח_תקלות.xlsx");
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">סקירת תקלות</h2>
        <button className="btn-export" onClick={exportExcel}>⬇ ייצוא Excel</button>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="🔍 חיפוש לפי כותרת או כתובת..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option>הכל</option><option>גבוהה</option><option>בינונית</option><option>נמוכה</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>הכל</option><option>פתוח</option><option>בטיפול</option><option>סגור</option>
        </select>
      </div>
      <table className="data-table">
        <thead><tr><th>כותרת</th><th>כתובת</th><th>עדיפות</th><th>טכנאי</th><th>נפתח</th><th>סטטוס</th></tr></thead>
        <tbody>
          {paged.length === 0 && <tr><td colSpan="6" className="empty">לא נמצאו תוצאות</td></tr>}
          {paged.map(t => {
            const tech = userList.find(u => u.id === t.assignedTech);
            return (
              <tr key={t.id}>
                <td><strong>{t.title}</strong><br /><small>{t.description}</small></td>
                <td>{t.address}</td>
                <td><span className={`badge ${t.priority === "גבוהה" ? "badge-red" : t.priority === "בינונית" ? "badge-orange" : "badge-gray"}`}>{t.priority}</span></td>
                <td>{tech?.name}</td>
                <td>{formatDate(t.createdAt)}</td>
                <td><span className={`badge ${t.status === "סגור" ? "badge-green" : t.status === "בטיפול" ? "badge-blue" : "badge-orange"}`}>{t.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Paginator page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} pageSize={10} />
    </div>
  );
}

const WINDOW_OPTIONS = [
  { key: "week",     label: "שבוע קרוב",     days: 7,   thresholds: [1, 3] },
  { key: "2weeks",   label: "שבועיים קרובים", days: 14,  thresholds: [2, 5] },
  { key: "month",    label: "חודש קרוב",      days: 30,  thresholds: [4, 9] },
  { key: "halfyear", label: "חצי שנה קרובה",  days: 180, thresholds: [8, 20] },
];

function workloadBadge(count, thresholds) {
  const [low, mid] = thresholds;
  if (count <= low)  return <span className="badge badge-green">נמוך</span>;
  if (count <= mid)  return <span className="badge badge-orange">בינוני</span>;
  return <span className="badge badge-red">גבוה</span>;
}

function DepartmentReport({ taskList, customers, tickets, meterReadings, userList }) {
  const [windowKey, setWindowKey] = useState("month");
  const [search, setSearch] = useState("");
  const fieldWorkers = userList.filter(u => u.role !== "admin");

  const windowOpt = WINDOW_OPTIONS.find(w => w.key === windowKey);

  // ── per-worker stats helpers ─────────────────────────────────────────────
  function workerTaskStats(uid) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + windowOpt.days);
    const mine = taskList.filter(t => t.assignedTo === uid);
    const inWindow = mine.filter(t => {
      if (t.status === "הושלם" || t.status === "נדחה") return false;
      if (!t.dueDate) return true; // no due date → always counts
      const due = new Date(t.dueDate + "T00:00:00");
      return due >= today && due <= cutoff;
    });
    return {
      active:   inWindow.length,
      done:     mine.filter(t => t.status === "הושלם").length,
      rejected: mine.filter(t => t.status === "נדחה").length,
    };
  }

  const matchesSearch = (name) => {
    const q = search.trim();
    return !q || name.includes(q);
  };

  function exportReport() {
    const collectorRows = fieldWorkers.filter(u => u.role === "collector").map(u => {
      const myCustomers = customers.filter(c => c.assignedCollector === u.id);
      const debt = myCustomers.reduce((s, c) => s + c.debt, 0);
      const paid = myCustomers.filter(c => c.status === "שולם").length;
      const { active, done, rejected } = workerTaskStats(u.id);
      return [u.name, u.zone || "—", myCustomers.length,
        `₪${debt.toLocaleString()}`, paid, active, done, rejected,
        workloadBadge(active, windowOpt.thresholds)
      ];
    });
    const meterRows = fieldWorkers.filter(u => u.role === "meter_reader").map(u => {
      const myReadings = meterReadings.filter(r => r.assignedReader === u.id);
      const doneCnt  = myReadings.filter(r => r.status !== "ממתין").length;
      const flagCnt  = myReadings.filter(r => r.flag).length;
      const { active, done, rejected } = workerTaskStats(u.id);
      return [u.name, u.zone || "—", myReadings.length, doneCnt,
        myReadings.length - doneCnt, flagCnt, active, done, rejected
      ];
    });
    const techRows = fieldWorkers.filter(u => u.role === "technician").map(u => {
      const myTickets = tickets.filter(t => t.assignedTech === u.id);
      const { active, done, rejected } = workerTaskStats(u.id);
      return [u.name, u.specialty || "—",
        myTickets.filter(t => t.status === "פתוח").length,
        myTickets.filter(t => t.status === "בטיפול").length,
        myTickets.filter(t => t.status === "סגור").length,
        active, done, rejected
      ];
    });

    const overview = `
      ${statsRow([
        { value: fieldWorkers.length, label: "עובדים" },
        { value: customers.length, label: "לקוחות" },
        { value: `₪${customers.reduce((s, c) => s + c.debt, 0).toLocaleString()}`, label: "חוב כולל", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
        { value: tickets.filter(t => t.status !== "סגור").length, label: "תקלות פתוחות", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        { value: taskList.filter(t => t.status === "הושלם").length, label: "משימות הושלמו", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
      ])}
      <h2>💰 גובים</h2>
      ${makeTable(["שם","אזור","לקוחות","חוב","שולמו","משימות פעילות","הושלמו","נדחו"], collectorRows, "#065f46")}
      <h2>💧 קוראי מונים</h2>
      ${makeTable(["שם","אזור","סה״כ מונים","קראו","ממתינים","חריגות","משימות פעילות","הושלמו","נדחו"], meterRows, "#92400e")}
      <h2>🔧 טכנאים</h2>
      ${makeTable(["שם","התמחות","תקלות פתוחות","בטיפול","סגרו","משימות פעילות","הושלמו","נדחו"], techRows, "#6d28d9")}
    `;
    openPrintReport({ title: "דוח מחלקתי — AquaOps", subtitle: "סקירה כוללת לכל הצוותים", accentColor: "#1e3a8a", content: overview });
  }

  // ── collector section ────────────────────────────────────────────────────
  const collectors = fieldWorkers.filter(u => u.role === "collector");
  const meterReaders = fieldWorkers.filter(u => u.role === "meter_reader");
  const technicians = fieldWorkers.filter(u => u.role === "technician");

  const visibleCollectors   = collectors.filter(u => matchesSearch(u.name));
  const visibleMeterReaders = meterReaders.filter(u => matchesSearch(u.name));
  const visibleTechnicians  = technicians.filter(u => matchesSearch(u.name));
  const totalVisible = visibleCollectors.length + visibleMeterReaders.length + visibleTechnicians.length;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">דוח מחלקתי כללי</h2>
        <button className="btn-export" onClick={exportReport}>⬇ ייצוא PDF מלא</button>
      </div>

      {/* ── Controls bar ── */}
      <div className="dept-controls">
        <div className="dept-search-wrap">
          <input
            type="text"
            placeholder="🔍 חיפוש עובד לפי שם..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="dept-search-input"
          />
          {search && (
            <span className="dept-search-count">
              {totalVisible === 0 ? "לא נמצאו תוצאות" : `${totalVisible} עובדים`}
            </span>
          )}
        </div>
        <div className="dept-window-selector">
          <span className="dept-window-label">חישוב עומס לפי:</span>
          {WINDOW_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`filter-btn ${windowKey === opt.key ? "active" : ""}`}
              onClick={() => setWindowKey(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="dept-threshold-hint">
        סף עומס — נמוך: עד {windowOpt.thresholds[0]} משימות &nbsp;|&nbsp;
        בינוני: {windowOpt.thresholds[0]+1}–{windowOpt.thresholds[1]} משימות &nbsp;|&nbsp;
        גבוה: {windowOpt.thresholds[1]+1}+ משימות
        &nbsp;(בטווח הזמן שנבחר: {windowOpt.label})
      </div>

      {/* ── Collectors ── */}
      <div className="dept-section">
        <h3>💰 גובים <span className="dept-count">({visibleCollectors.length})</span></h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th><th>אזור</th>
              <th>לקוחות</th><th>חוב כולל</th><th>שולמו</th>
              <th>משימות בטווח</th><th>הושלמו</th><th>נדחו</th><th>עומס</th>
            </tr>
          </thead>
          <tbody>
            {visibleCollectors.length === 0 && <tr><td colSpan="9" className="empty">{search ? "לא נמצאו תוצאות" : "אין גובים"}</td></tr>}
            {visibleCollectors.map(u => {
              const myCustomers = customers.filter(c => c.assignedCollector === u.id);
              const debt = myCustomers.reduce((s, c) => s + c.debt, 0);
              const paid = myCustomers.filter(c => c.status === "שולם").length;
              const { active, done, rejected } = workerTaskStats(u.id);
              return (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.zone || "—"}</td>
                  <td>{myCustomers.length}</td>
                  <td className={debt > 0 ? "debt-amount" : "paid-amount"}>
                    {debt > 0 ? `₪${debt.toLocaleString()}` : "✓ נקי"}
                  </td>
                  <td><span className="badge badge-green">{paid}</span></td>
                  <td>{active}</td><td>{done}</td><td>{rejected}</td>
                  <td>{workloadBadge(active, windowOpt.thresholds)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Meter readers ── */}
      <div className="dept-section">
        <h3>💧 קוראי מונים <span className="dept-count">({visibleMeterReaders.length})</span></h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th><th>אזור</th>
              <th>סה״כ מונים</th><th>קראו</th><th>ממתינים</th><th>חריגות</th>
              <th>משימות בטווח</th><th>הושלמו</th><th>נדחו</th><th>עומס</th>
            </tr>
          </thead>
          <tbody>
            {visibleMeterReaders.length === 0 && <tr><td colSpan="10" className="empty">{search ? "לא נמצאו תוצאות" : "אין קוראי מונים"}</td></tr>}
            {visibleMeterReaders.map(u => {
              const myReadings = meterReadings.filter(r => r.assignedReader === u.id);
              const doneCnt  = myReadings.filter(r => r.status !== "ממתין").length;
              const pendCnt  = myReadings.filter(r => r.status === "ממתין").length;
              const flagCnt  = myReadings.filter(r => r.flag).length;
              const { active, done, rejected } = workerTaskStats(u.id);
              const pct = myReadings.length > 0 ? Math.round((doneCnt / myReadings.length) * 100) : 0;
              return (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.zone || "—"}</td>
                  <td>{myReadings.length}</td>
                  <td><span className="badge badge-green">{doneCnt} ({pct}%)</span></td>
                  <td><span className={pendCnt > 0 ? "badge badge-orange" : "badge badge-gray"}>{pendCnt}</span></td>
                  <td><span className={flagCnt > 0 ? "badge badge-red" : "badge badge-gray"}>{flagCnt}</span></td>
                  <td>{active}</td><td>{done}</td><td>{rejected}</td>
                  <td>{workloadBadge(active, windowOpt.thresholds)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Technicians ── */}
      <div className="dept-section">
        <h3>🔧 טכנאים <span className="dept-count">({visibleTechnicians.length})</span></h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th><th>התמחות</th>
              <th>תקלות פתוחות</th><th>בטיפול</th><th>סגרו</th>
              <th>משימות בטווח</th><th>הושלמו</th><th>נדחו</th><th>עומס</th>
            </tr>
          </thead>
          <tbody>
            {visibleTechnicians.length === 0 && <tr><td colSpan="9" className="empty">{search ? "לא נמצאו תוצאות" : "אין טכנאים"}</td></tr>}
            {visibleTechnicians.map(u => {
              const myTickets = tickets.filter(t => t.assignedTech === u.id);
              const tOpen = myTickets.filter(t => t.status === "פתוח").length;
              const tInProgress = myTickets.filter(t => t.status === "בטיפול").length;
              const tClosed = myTickets.filter(t => t.status === "סגור").length;
              const { active, done, rejected } = workerTaskStats(u.id);
              return (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.specialty || "—"}</td>
                  <td><span className={tOpen > 0 ? "badge badge-orange" : "badge badge-gray"}>{tOpen}</span></td>
                  <td><span className={tInProgress > 0 ? "badge badge-blue" : "badge badge-gray"}>{tInProgress}</span></td>
                  <td><span className="badge badge-green">{tClosed}</span></td>
                  <td>{active}</td><td>{done}</td><td>{rejected}</td>
                  <td>{workloadBadge(active, windowOpt.thresholds)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeesManager({ userList, setUserList }) {
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "collector", zone: "", specialty: "" });
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fieldWorkers = userList.filter(u => u.role !== "admin");

  function addUser() {
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      setError("יש למלא שם מלא, שם משתמש וסיסמה");
      return;
    }
    if (userList.some(u => u.username === newUser.username.trim())) {
      setError("שם המשתמש כבר קיים במערכת");
      return;
    }
    const maxId = Math.max(...userList.map(u => u.id));
    const created = {
      id: maxId + 1,
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      name: newUser.name.trim(),
      role: newUser.role,
      email: `${newUser.username.trim()}@aquaops.co.il`,
      ...(newUser.role !== "technician" ? { zone: newUser.zone.trim() || "—" } : {}),
      ...(newUser.role === "technician" ? { specialty: newUser.specialty.trim() || "—" } : {}),
    };
    setUserList(prev => [...prev, created]);
    setNewUser({ name: "", username: "", password: "", role: "collector", zone: "", specialty: "" });
    setError("");
    setShowForm(false);
  }

  function deleteUser(id) {
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    setUserList(prev => prev.filter(u => u.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">ניהול עובדים</h2>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError(""); }}>+ עובד חדש</button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>הוספת עובד חדש</h3>
          {error && <div className="alert-banner error" style={{ marginBottom: "12px" }}>{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>שם מלא</label>
              <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="שם ושם משפחה" />
            </div>
            <div className="form-group">
              <label>שם משתמש</label>
              <input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="לדוגמה: collector4" dir="ltr" />
            </div>
            <div className="form-group">
              <label>סיסמה</label>
              <input value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="סיסמה" dir="ltr" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>תפקיד / צוות</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value, zone: "", specialty: "" })}>
                <option value="collector">גובה חובות</option>
                <option value="meter_reader">קורא מונים</option>
                <option value="technician">טכנאי</option>
              </select>
            </div>
            {newUser.role !== "technician" && (
              <div className="form-group">
                <label>אזור פעילות</label>
                <input value={newUser.zone} onChange={e => setNewUser({ ...newUser, zone: e.target.value })} placeholder="לדוגמה: צפון תל אביב" />
              </div>
            )}
            {newUser.role === "technician" && (
              <div className="form-group">
                <label>תחום התמחות</label>
                <input value={newUser.specialty} onChange={e => setNewUser({ ...newUser, specialty: e.target.value })} placeholder="לדוגמה: צינורות" />
              </div>
            )}
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={addUser}>הוסף עובד</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setError(""); }}>ביטול</button>
          </div>
        </div>
      )}

      {["collector", "meter_reader", "technician"].map(role => {
        const workers = fieldWorkers.filter(u => u.role === role);
        return (
          <div key={role} className="dept-section">
            <h3>{roleTeamLabel(role)} <span style={{ fontWeight: 400, fontSize: "14px", color: "#6b7280" }}>({workers.length} עובדים)</span></h3>
            <table className="data-table">
              <thead><tr><th>שם מלא</th><th>שם משתמש</th><th>סיסמה</th><th>אזור / התמחות</th><th>אימייל</th><th>פעולות</th></tr></thead>
              <tbody>
                {workers.length === 0 && <tr><td colSpan="6" className="empty">אין עובדים בצוות זה</td></tr>}
                {workers.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td><code>{u.username}</code></td>
                    <td><code>{u.password}</code></td>
                    <td>{u.zone || u.specialty || "—"}</td>
                    <td style={{ fontSize: "12px", color: "#6b7280" }}>{u.email || "—"}</td>
                    <td>
                      <button
                        className="btn-reject"
                        style={{ padding: "4px 12px", fontSize: "12px" }}
                        onClick={() => deleteUser(u.id)}
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>אישור מחיקת עובד</h3>
            <p>
              האם למחוק את <strong>{userList.find(u => u.id === confirmDeleteId)?.name}</strong>?<br />
              פעולה זו תסיר את העובד מהמערכת לצמיתות.
            </p>
            <div className="modal-actions">
              <button className="btn-reject" onClick={confirmDelete}>כן, מחק</button>
              <button className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = parseInt(searchParams.get("tab"));
    return isNaN(tab) ? 0 : tab;
  });
  const { taskList, setTaskList, ticketList, customerList, readingList, userList, setUserList } = useData();

  useEffect(() => {
    const tab = parseInt(searchParams.get("tab"));
    if (!isNaN(tab)) {
      setActiveTab(tab);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const tabContent = [
    <Dashboard customers={customerList} tickets={ticketList} meterReadings={readingList} tasks={taskList} userList={userList} />,
    <TasksManager taskList={taskList} setTaskList={setTaskList} userList={userList} />,
    <DebtOverview customers={customerList} userList={userList} />,
    <MeterReadingsOverview meterReadings={readingList} />,
    <TicketsOverview tickets={ticketList} userList={userList} />,
    <DepartmentReport taskList={taskList} customers={customerList} tickets={ticketList} meterReadings={readingList} userList={userList} />,
    <EmployeesManager userList={userList} setUserList={setUserList} />,
  ];

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
