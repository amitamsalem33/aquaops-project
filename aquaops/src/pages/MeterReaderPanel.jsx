import { useState } from "react";
import Layout from "../components/Layout";
import { meterReadings } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

export default function MeterReaderPanel() {
  const { currentUser } = useAuth();
  const [readings, setReadings] = useState(
    meterReadings.filter(r => r.assignedReader === currentUser.id)
  );
  const [selected, setSelected] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [alert, setAlert] = useState(null);

  const pending = readings.filter(r => r.status === "ממתין").length;
  const done = readings.filter(r => r.status !== "ממתין").length;

  function submitReading() {
    const val = parseInt(inputValue);
    if (!val || val < selected.previousReading) {
      setAlert({ type: "error", msg: "קריאה לא תקינה - חייבת להיות גדולה מהקריאה הקודמת" });
      return;
    }
    const diff = val - selected.previousReading;
    const isFlag = diff > selected.avgMonthly * 2;
    const flagReason = isFlag ? `צריכה של ${diff} יח׳ - פי ${(diff / selected.avgMonthly).toFixed(1)} מהממוצע הרגיל (${selected.avgMonthly} יח׳). חשד לדליפה!` : null;

    const updated = {
      ...selected,
      currentReading: val,
      readingDate: new Date().toISOString().split("T")[0],
      status: isFlag ? "חריגה" : "הוזן",
      flag: isFlag,
      flagReason,
    };

    setReadings(readings.map(r => r.id === selected.id ? updated : r));
    setSelected(updated);
    setInputValue("");

    if (isFlag) {
      setAlert({ type: "warning", msg: `⚠️ התראה! ${flagReason}` });
    } else {
      setAlert({ type: "success", msg: `✓ קריאה הוזנה בהצלחה - צריכה: ${diff} יח׳` });
    }
    setTimeout(() => setAlert(null), 5000);
  }

  return (
    <Layout title="ממשק קורא מונים">
      <div className="panel-container">
        <div className="stats-row">
          <div className="mini-stat"><span>נותרו לקריאה</span><strong>{pending}</strong></div>
          <div className="mini-stat green-stat"><span>הושלמו היום</span><strong>{done}</strong></div>
          <div className="mini-stat red-stat"><span>חריגות</span><strong>{readings.filter(r=>r.flag).length}</strong></div>
        </div>

        {alert && (
          <div className={`alert-banner ${alert.type}`}>
            {alert.msg}
          </div>
        )}

        <div className="two-col">
          <div className="list-panel">
            <h3>רשימת מונים ({readings.length})</h3>
            {readings.map(r => (
              <div
                key={r.id}
                className={`customer-card ${selected?.id === r.id ? "selected" : ""} ${r.flag ? "high-debt" : ""}`}
                onClick={() => { setSelected(r); setInputValue(""); setAlert(null); }}
              >
                <div className="customer-card-header">
                  <strong>{r.customerName}</strong>
                  <span className={`badge ${r.flag ? "badge-red" : r.status === "הוזן" ? "badge-green" : "badge-gray"}`}>
                    {r.flag ? "⚠️ חריגה" : r.status}
                  </span>
                </div>
                <div className="customer-card-body">
                  <span>📍 {r.address}</span>
                  <span>🔢 מונה: {r.meterNumber}</span>
                </div>
              </div>
            ))}
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
                      <input
                        type="number"
                        className="reading-input"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder={`מינימום ${selected.previousReading + 1}`}
                        min={selected.previousReading + 1}
                      />
                      <button className="btn-primary" onClick={submitReading}>שלח קריאה</button>
                    </div>
                    <p className="hint">הזנה גבוהה פי 2 מהממוצע תייצר התראה אוטומטית</p>
                  </div>
                ) : (
                  <div className={`status-block ${selected.flag ? "status-warning" : "status-ok"}`}>
                    {selected.flag ? (
                      <>
                        <h4>⚠️ קריאה חריגה - נשלחה התראה למנהל</h4>
                        <p>{selected.flagReason}</p>
                      </>
                    ) : (
                      <h4>✓ קריאה הוזנה בתאריך {selected.readingDate}</h4>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-detail">
                <span>📊</span>
                <p>בחר מונה מהרשימה להזנת קריאה</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
