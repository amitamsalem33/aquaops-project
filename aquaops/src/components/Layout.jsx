import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

const roleLabels = {
  admin: "מנהל משרד",
  collector: "גובה חובות",
  meter_reader: "קורא מונים",
  technician: "טכנאי",
};

const roleColors = {
  admin: "#1e40af",
  collector: "#065f46",
  meter_reader: "#92400e",
  technician: "#6b21a8",
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { ticketList, readingList, taskList } = useData();

  const today = new Date().toISOString().split("T")[0];

  let notifications = [];

  if (currentUser?.role === "admin") {
    notifications = [
      ...ticketList
        .filter(t => t.priority === "גבוהה" && t.status !== "סגור")
        .map(t => ({ id: `t${t.id}`, icon: "🔧", text: `תקלה דחופה: ${t.title}`, sub: t.address, tab: 4 })),
      ...readingList
        .filter(r => r.flag)
        .map(r => ({ id: `r${r.id}`, icon: "💧", text: `קריאה חריגה: ${r.customerName}`, sub: r.flagReason, tab: 3 })),
      ...taskList
        .filter(t => t.status !== "הושלם" && t.status !== "נדחה" && t.dueDate && t.dueDate < today)
        .map(t => ({ id: `k${t.id}`, icon: "📋", text: `משימה באיחור: ${t.title}`, sub: `יעד: ${t.dueDate}`, tab: 1 })),
    ];
  } else if (currentUser?.role === "collector") {
    const myTasks = taskList.filter(t => t.assignedTo === currentUser.id);
    notifications = [
      // כל משימה חדשה שהוקצתה (פתוח = טרם טופלה)
      ...myTasks
        .filter(t => t.status === "פתוח")
        .map(t => ({ id: `new${t.id}`, icon: "📬", text: `משימה חדשה: ${t.title}`, sub: `יעד: ${t.dueDate || "—"} | ${t.priority}` })),
      // משימות באיחור שכבר בביצוע
      ...myTasks
        .filter(t => t.status === "בביצוע" && t.dueDate && t.dueDate < today)
        .map(t => ({ id: `late${t.id}`, icon: "⏰", text: `משימה באיחור: ${t.title}`, sub: `יעד: ${t.dueDate}` })),
    ];
  } else if (currentUser?.role === "meter_reader") {
    const myReadings = readingList.filter(r => r.assignedReader === currentUser.id);
    const myTasks = taskList.filter(t => t.assignedTo === currentUser.id);
    notifications = [
      // כל משימה חדשה שהוקצתה
      ...myTasks
        .filter(t => t.status === "פתוח")
        .map(t => ({ id: `new${t.id}`, icon: "📬", text: `משימה חדשה: ${t.title}`, sub: `יעד: ${t.dueDate || "—"} | ${t.priority}` })),
      // קריאות חריגות
      ...myReadings
        .filter(r => r.flag)
        .map(r => ({ id: `r${r.id}`, icon: "💧", text: `קריאה חריגה: ${r.customerName}`, sub: r.flagReason })),
      // משימות בביצוע שבאיחור
      ...myTasks
        .filter(t => t.status === "בביצוע" && t.dueDate && t.dueDate < today)
        .map(t => ({ id: `late${t.id}`, icon: "⏰", text: `משימה באיחור: ${t.title}`, sub: `יעד: ${t.dueDate}` })),
    ];
  } else if (currentUser?.role === "technician") {
    const myTickets = ticketList.filter(t => t.assignedTech === currentUser.id);
    const myTasks = taskList.filter(t => t.assignedTo === currentUser.id);
    notifications = [
      // כל משימה חדשה שהוקצתה
      ...myTasks
        .filter(t => t.status === "פתוח")
        .map(t => ({ id: `new${t.id}`, icon: "📬", text: `משימה חדשה: ${t.title}`, sub: `יעד: ${t.dueDate || "—"} | ${t.priority}` })),
      // תקלות דחופות
      ...myTickets
        .filter(t => t.priority === "גבוהה" && t.status !== "סגור")
        .map(t => ({ id: `tick${t.id}`, icon: "🔧", text: `תקלה דחופה: ${t.title}`, sub: t.address })),
      // משימות בביצוע שבאיחור
      ...myTasks
        .filter(t => t.status === "בביצוע" && t.dueDate && t.dueDate < today)
        .map(t => ({ id: `late${t.id}`, icon: "⏰", text: `משימה באיחור: ${t.title}`, sub: `יעד: ${t.dueDate}` })),
    ];
  }

  // Remove duplicates
  const unique = notifications.filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleNotifClick(n) {
    setOpen(false);
    if (currentUser?.role === "admin" && n.tab !== undefined) {
      navigate(`/admin?tab=${n.tab}`);
    }
  }

  return (
    <div className="notif-wrapper" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)}>
        🔔
        {unique.length > 0 && <span className="notif-badge">{unique.length}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">התראות ({unique.length})</div>
          {unique.length === 0
            ? <div className="notif-empty">אין התראות חדשות</div>
            : unique.map(n => (
              <div
                key={n.id}
                className={`notif-item ${currentUser?.role === "admin" ? "notif-item-clickable" : ""}`}
                onClick={() => handleNotifClick(n)}
              >
                <span className="notif-icon">{n.icon}</span>
                <div>
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-sub">{n.sub}</div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function Layout({ children, title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-layout" dir="rtl">
      <header className="app-header" style={{ background: roleColors[currentUser?.role] }}>
        <div className="header-content">
          <div className="header-left">
            <span className="header-logo">💧 AquaOps</span>
            <span className="header-title">{title}</span>
          </div>
          <div className="header-right">
            <NotificationBell />
            <div className="user-info">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-role">{roleLabels[currentUser?.role]}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>יציאה</button>
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
