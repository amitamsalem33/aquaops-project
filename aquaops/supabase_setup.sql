-- ============================================================
-- AquaOps - Supabase Database Setup
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS meter_readings;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

-- ============================================================
-- Create tables (JSONB approach - stores full JS objects)
-- ============================================================

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE meter_readings (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE tickets (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);

-- ============================================================
-- Enable real-time for all tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE meter_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================================
-- Allow public access (the app uses its own auth system)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON meter_readings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tickets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: Users
-- ============================================================

INSERT INTO users (id, data) VALUES
(1,  '{"id":1,"username":"manager1","password":"AquaAdmin1","name":"יוסי לוי","role":"admin","email":"yossi@aquaops.co.il"}'),
(2,  '{"id":2,"username":"collector1","password":"David2026","name":"דוד כהן","role":"collector","email":"david@aquaops.co.il","zone":"צפון תל אביב"}'),
(3,  '{"id":3,"username":"collector2","password":"Mira2026","name":"מירה אברהם","role":"collector","email":"mira@aquaops.co.il","zone":"דרום תל אביב"}'),
(8,  '{"id":8,"username":"collector3","password":"Noa2026","name":"נועה בן-דוד","role":"collector","email":"noa@aquaops.co.il","zone":"מרכז תל אביב"}'),
(4,  '{"id":4,"username":"meter1","password":"Ron2026","name":"רון שפירא","role":"meter_reader","email":"ron@aquaops.co.il","zone":"רמת גן"}'),
(5,  '{"id":5,"username":"meter2","password":"Anat2026","name":"ענת ביטון","role":"meter_reader","email":"anat@aquaops.co.il","zone":"בני ברק"}'),
(9,  '{"id":9,"username":"meter3","password":"Yosi2026","name":"יוסי אלמוג","role":"meter_reader","email":"yosi@aquaops.co.il","zone":"פתח תקווה"}'),
(6,  '{"id":6,"username":"tech1","password":"Avi2026","name":"אבי נחום","role":"technician","email":"avi@aquaops.co.il","specialty":"צינורות"}'),
(7,  '{"id":7,"username":"tech2","password":"Shira2026","name":"שירה גרין","role":"technician","email":"shira@aquaops.co.il","specialty":"מונים"}'),
(10, '{"id":10,"username":"tech3","password":"Riki2026","name":"ריקי שלום","role":"technician","email":"riki@aquaops.co.il","specialty":"תשתיות"}');

-- ============================================================
-- Seed: Customers
-- ============================================================

INSERT INTO customers (id, data) VALUES
(101, '{"id":101,"name":"אחמד חסן","address":"רחוב הרצל 12, תל אביב","phone":"054-1234567","accountNumber":"TLV-10234","debt":1250,"lastPayment":"2026-01-10","status":"פתוח","assignedCollector":2}'),
(102, '{"id":102,"name":"רחל ישראלי","address":"שדרות בן גוריון 45, תל אביב","phone":"052-9876543","accountNumber":"TLV-10235","debt":340,"lastPayment":"2026-02-05","status":"פתוח","assignedCollector":2}'),
(103, '{"id":103,"name":"מוחמד עלי","address":"רחוב יפו 8, תל אביב","phone":"050-5556677","accountNumber":"TLV-10236","debt":890,"lastPayment":"2025-12-20","status":"בטיפול","assignedCollector":2}'),
(104, '{"id":104,"name":"שרה לבנון","address":"רחוב דיזנגוף 100, תל אביב","phone":"053-1112233","accountNumber":"TLV-10237","debt":0,"lastPayment":"2026-03-01","status":"שולם","assignedCollector":2}'),
(105, '{"id":105,"name":"גיא הרמון","address":"רחוב אלנבי 22, תל אביב","phone":"054-7778899","accountNumber":"TLV-10238","debt":2100,"lastPayment":"2025-11-15","status":"פתוח","assignedCollector":3}'),
(106, '{"id":106,"name":"דינה פרץ","address":"רחוב שינקין 5, תל אביב","phone":"052-3334455","accountNumber":"TLV-10239","debt":450,"lastPayment":"2026-01-28","status":"פתוח","assignedCollector":3}'),
(107, '{"id":107,"name":"ניר שלום","address":"רחוב ויצמן 30, תל אביב","phone":"050-6667788","accountNumber":"TLV-10240","debt":780,"lastPayment":"2026-02-10","status":"בטיפול","assignedCollector":3}'),
(108, '{"id":108,"name":"ליאת גולד","address":"רחוב פינסקר 15, תל אביב","phone":"053-9990011","accountNumber":"TLV-10241","debt":1800,"lastPayment":"2025-10-05","status":"פתוח","assignedCollector":3}'),
(109, '{"id":109,"name":"אורן מזרחי","address":"רחוב ארלוזורוב 7, תל אביב","phone":"054-2223344","accountNumber":"TLV-10242","debt":560,"lastPayment":"2026-01-15","status":"פתוח","assignedCollector":2}'),
(110, '{"id":110,"name":"תמר אלון","address":"רחוב קינג גורג 18, תל אביב","phone":"052-8889900","accountNumber":"TLV-10243","debt":0,"lastPayment":"2026-03-10","status":"שולם","assignedCollector":2}'),
(111, '{"id":111,"name":"יעקב סטון","address":"רחוב נחלת בנימין 3, תל אביב","phone":"050-4445566","accountNumber":"TLV-10244","debt":320,"lastPayment":"2026-02-20","status":"פתוח","assignedCollector":3}'),
(112, '{"id":112,"name":"נועה כץ","address":"רחוב רוטשילד 55, תל אביב","phone":"053-5556677","accountNumber":"TLV-10245","debt":1450,"lastPayment":"2025-12-01","status":"פתוח","assignedCollector":3}'),
(113, '{"id":113,"name":"איתי לוינסון","address":"רחוב דיזנגוף 200, תל אביב","phone":"054-6661122","accountNumber":"TLV-10246","debt":670,"lastPayment":"2026-02-01","status":"פתוח","assignedCollector":8}'),
(114, '{"id":114,"name":"מיכל ברק","address":"שדרות רוטשילד 80, תל אביב","phone":"052-7773344","accountNumber":"TLV-10247","debt":1100,"lastPayment":"2025-11-20","status":"פתוח","assignedCollector":8}'),
(115, '{"id":115,"name":"אלי שמיר","address":"רחוב בן יהודה 30, תל אביב","phone":"050-9990011","accountNumber":"TLV-10248","debt":0,"lastPayment":"2026-03-15","status":"שולם","assignedCollector":8}'),
(116, '{"id":116,"name":"רינה גבאי","address":"רחוב הירקון 45, תל אביב","phone":"053-2223344","accountNumber":"TLV-10249","debt":2300,"lastPayment":"2025-10-10","status":"בטיפול","assignedCollector":8}');

-- ============================================================
-- Seed: Meter Readings
-- ============================================================

INSERT INTO meter_readings (id, data) VALUES
(201, '{"id":201,"customerId":101,"customerName":"אחמד חסן","address":"רחוב הרצל 12, תל אביב","meterNumber":"M-55123","previousReading":1240,"currentReading":null,"readingDate":null,"status":"ממתין","assignedReader":4,"avgMonthly":12}'),
(202, '{"id":202,"customerId":102,"customerName":"רחל ישראלי","address":"שדרות בן גוריון 45, תל אביב","meterNumber":"M-55124","previousReading":890,"currentReading":905,"readingDate":"2026-03-20","status":"הוזן","assignedReader":4,"avgMonthly":14,"flag":false}'),
(203, '{"id":203,"customerId":103,"customerName":"מוחמד עלי","address":"רחוב יפו 8, תל אביב","meterNumber":"M-55125","previousReading":2100,"currentReading":2198,"readingDate":"2026-03-20","status":"הוזן","assignedReader":4,"avgMonthly":15,"flag":false}'),
(204, '{"id":204,"customerId":104,"customerName":"שרה לבנון","address":"רחוב דיזנגוף 100, תל אביב","meterNumber":"M-55126","previousReading":450,"currentReading":null,"readingDate":null,"status":"ממתין","assignedReader":4,"avgMonthly":10}'),
(205, '{"id":205,"customerId":105,"customerName":"גיא הרמון","address":"רחוב אלנבי 22, תל אביב","meterNumber":"M-55127","previousReading":780,"currentReading":null,"readingDate":null,"status":"ממתין","assignedReader":5,"avgMonthly":11}'),
(206, '{"id":206,"customerId":106,"customerName":"דינה פרץ","address":"רחוב שינקין 5, תל אביב","meterNumber":"M-55128","previousReading":1560,"currentReading":1620,"readingDate":"2026-03-21","status":"הוזן","assignedReader":5,"avgMonthly":12,"flag":false}'),
(207, '{"id":207,"customerId":107,"customerName":"ניר שלום","address":"רחוב ויצמן 30, תל אביב","meterNumber":"M-55129","previousReading":3200,"currentReading":3285,"readingDate":"2026-03-21","status":"הוזן","assignedReader":5,"avgMonthly":13,"flag":false}'),
(208, '{"id":208,"customerId":108,"customerName":"ליאת גולד","address":"רחוב פינסקר 15, תל אביב","meterNumber":"M-55130","previousReading":670,"currentReading":780,"readingDate":"2026-03-22","status":"חריגה","assignedReader":5,"avgMonthly":11,"flag":true,"flagReason":"צריכה גבוהה פי 5 מהרגיל - חשד לדליפה"}'),
(209, '{"id":209,"customerId":109,"customerName":"אורן מזרחי","address":"רחוב ארלוזורוב 7, תל אביב","meterNumber":"M-55131","previousReading":2890,"currentReading":null,"readingDate":null,"status":"ממתין","assignedReader":4,"avgMonthly":14}'),
(210, '{"id":210,"customerId":110,"customerName":"תמר אלון","address":"רחוב קינג גורג 18, תל אביב","meterNumber":"M-55132","previousReading":1120,"currentReading":1133,"readingDate":"2026-03-22","status":"הוזן","assignedReader":4,"avgMonthly":12,"flag":false}'),
(211, '{"id":211,"customerId":113,"customerName":"איתי לוינסון","address":"רחוב דיזנגוף 200, תל אביב","meterNumber":"M-55133","previousReading":540,"currentReading":null,"readingDate":null,"status":"ממתין","assignedReader":9,"avgMonthly":13}'),
(212, '{"id":212,"customerId":114,"customerName":"מיכל ברק","address":"שדרות רוטשילד 80, תל אביב","meterNumber":"M-55134","previousReading":1800,"currentReading":1815,"readingDate":"2026-03-23","status":"הוזן","assignedReader":9,"avgMonthly":14,"flag":false}'),
(213, '{"id":213,"customerId":115,"customerName":"אלי שמיר","address":"רחוב בן יהודה 30, תל אביב","meterNumber":"M-55135","previousReading":920,"currentReading":null,"readingDate":null,"status":"ממתין","assignedReader":9,"avgMonthly":11}'),
(214, '{"id":214,"customerId":116,"customerName":"רינה גבאי","address":"רחוב הירקון 45, תל אביב","meterNumber":"M-55136","previousReading":330,"currentReading":410,"readingDate":"2026-03-23","status":"חריגה","assignedReader":9,"avgMonthly":12,"flag":true,"flagReason":"צריכה של 80 יחידות - פי 3.3 מהממוצע. חשד לנזילה"}');

-- ============================================================
-- Seed: Tickets
-- ============================================================

INSERT INTO tickets (id, data) VALUES
(301, '{"id":301,"title":"נזילה בצינור ראשי","description":"דיירים מדווחים על מים בכביש ליד שוחת בדיקה","address":"רחוב הרצל 45, תל אביב","priority":"גבוהה","status":"פתוח","createdAt":"2026-03-22 08:30","assignedTech":6,"reportedBy":"אזרח"}'),
(302, '{"id":302,"title":"מונה פגום","description":"מונה המים לא מציג קריאה, ייתכן נזק מכני","address":"שדרות בן גוריון 12, תל אביב","priority":"בינונית","status":"בטיפול","createdAt":"2026-03-21 14:00","assignedTech":7,"reportedBy":"קורא מונים"}'),
(303, '{"id":303,"title":"חסימה בצינור","description":"לחץ מים נמוך בכל הבניין","address":"רחוב דיזנגוף 77, תל אביב","priority":"גבוהה","status":"בטיפול","createdAt":"2026-03-21 10:15","assignedTech":6,"reportedBy":"דיירים"}'),
(304, '{"id":304,"title":"בדיקת חיבור חדש","description":"חיבור מונה מים לדירה חדשה","address":"רחוב יפו 90, תל אביב","priority":"נמוכה","status":"פתוח","createdAt":"2026-03-20 16:00","assignedTech":7,"reportedBy":"קבלן"}'),
(305, '{"id":305,"title":"שוחת בדיקה פגועה","description":"מכסה שוחת בדיקה שבור, מסוכן להולכי רגל","address":"רחוב אלנבי 33, תל אביב","priority":"גבוהה","status":"סגור","createdAt":"2026-03-19 09:00","assignedTech":6,"reportedBy":"עיריה","closedAt":"2026-03-20 15:30"}'),
(306, '{"id":306,"title":"כשל בלחץ מים","description":"תלונות על לחץ מים נמוך בשכונה","address":"רחוב שינקין 20, תל אביב","priority":"בינונית","status":"פתוח","createdAt":"2026-03-23 11:00","assignedTech":6,"reportedBy":"דיירים"}'),
(307, '{"id":307,"title":"החלפת מונה ישן","description":"מונה בן 15 שנה זקוק להחלפה","address":"רחוב ויצמן 55, תל אביב","priority":"נמוכה","status":"בטיפול","createdAt":"2026-03-22 13:00","assignedTech":7,"reportedBy":"מנהל"}'),
(308, '{"id":308,"title":"נזילה בברז ציבורי","description":"ברז ציבורי פתוח ונוזל - בזבוז מים","address":"רחוב פינסקר 1, תל אביב","priority":"בינונית","status":"סגור","createdAt":"2026-03-18 07:00","assignedTech":6,"reportedBy":"אזרח","closedAt":"2026-03-18 14:00"}'),
(309, '{"id":309,"title":"בדיקת מערכת השקיה","description":"תקלה במערכת השקיה בגינה ציבורית","address":"כיכר רבין, תל אביב","priority":"נמוכה","status":"פתוח","createdAt":"2026-03-23 09:30","assignedTech":7,"reportedBy":"עיריה"}'),
(310, '{"id":310,"title":"פיצוץ תשתית ישנה","description":"תשתית מים ישנה התפוצצה ברחוב","address":"רחוב נחלת בנימין 20, תל אביב","priority":"גבוהה","status":"פתוח","createdAt":"2026-03-24 07:00","assignedTech":10,"reportedBy":"עיריה"}'),
(311, '{"id":311,"title":"בדיקת לחץ רשת","description":"בדיקת לחץ מים בסניף חדש","address":"רחוב רוטשילד 90, תל אביב","priority":"נמוכה","status":"בטיפול","createdAt":"2026-03-23 12:00","assignedTech":10,"reportedBy":"קבלן"}'),
(312, '{"id":312,"title":"חיזוק תשתית מים","description":"חיזוק צינורות ישנים לפני חורף","address":"רחוב הירקון 10, תל אביב","priority":"בינונית","status":"סגור","createdAt":"2026-03-20 08:00","assignedTech":10,"reportedBy":"מנהל","closedAt":"2026-03-22 17:00"}');

-- ============================================================
-- Seed: Tasks
-- ============================================================

INSERT INTO tasks (id, data) VALUES
(401, '{"id":401,"title":"גביית חוב - לקוח TLV-10234","description":"ביקור אצל אחמד חסן, חוב של 1,250 שקל","assignedTo":2,"assignedRole":"collector","status":"פתוח","priority":"גבוהה","createdAt":"2026-03-22","dueDate":"2026-03-25","createdBy":1}'),
(402, '{"id":402,"title":"קריאת מונים - אזור הרצל","description":"קריאת 15 מונים ברחוב הרצל","assignedTo":4,"assignedRole":"meter_reader","status":"בביצוע","priority":"רגילה","createdAt":"2026-03-23","dueDate":"2026-03-24","createdBy":1}'),
(403, '{"id":403,"title":"תיקון נזילה דחוף","description":"נזילה בצינור ראשי - דחוף!","assignedTo":6,"assignedRole":"technician","status":"בביצוע","priority":"גבוהה","createdAt":"2026-03-22","dueDate":"2026-03-22","createdBy":1}'),
(404, '{"id":404,"title":"סיבוב גביה שבועי - דרום","description":"גביה מלקוחות אזור דרום תל אביב","assignedTo":3,"assignedRole":"collector","status":"הושלם","priority":"רגילה","createdAt":"2026-03-18","dueDate":"2026-03-20","createdBy":1}'),
(405, '{"id":405,"title":"בדיקת מונים חריגים","description":"בדיקת 3 מונים עם קריאות חריגות","assignedTo":5,"assignedRole":"meter_reader","status":"פתוח","priority":"גבוהה","createdAt":"2026-03-23","dueDate":"2026-03-24","createdBy":1}'),
(406, '{"id":406,"title":"גביה - מרכז תל אביב","description":"סיבוב גביה באזור המרכז","assignedTo":8,"assignedRole":"collector","status":"פתוח","priority":"רגילה","createdAt":"2026-03-24","dueDate":"2026-03-26","createdBy":1}'),
(407, '{"id":407,"title":"קריאת מונים - פתח תקווה","description":"קריאת 10 מונים בפתח תקווה","assignedTo":9,"assignedRole":"meter_reader","status":"בביצוע","priority":"רגילה","createdAt":"2026-03-24","dueDate":"2026-03-25","createdBy":1}'),
(408, '{"id":408,"title":"בדיקת תשתיות - נחלת בנימין","description":"סריקת תשתיות ישנות ברחוב נחלת בנימין","assignedTo":10,"assignedRole":"technician","status":"פתוח","priority":"גבוהה","createdAt":"2026-03-24","dueDate":"2026-03-25","createdBy":1}'),
(409, '{"id":409,"title":"גביית חוב דחוף - TLV-10249","description":"חוב של 2,300 שקל אצל רינה גבאי - דחוף","assignedTo":8,"assignedRole":"collector","status":"פתוח","priority":"גבוהה","createdAt":"2026-03-24","dueDate":"2026-03-25","createdBy":1}');

-- ============================================================
-- Done! Your AquaOps database is ready.
-- ============================================================
