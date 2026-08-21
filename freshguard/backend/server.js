// server.js
// FreshGuard Backend - Iteration 1 Prototype
// Student: Sujata Bajracharya
// Use Cases implemented: UC2 - Manage Food Inventory, UC5 - View Notifications
// Tools (per Assignment 1, Table 1 - Development Platform):
//   Backend Framework : Node.js + Express  (Sujata Bajracharya's assigned tool)
//   Database          : SQL (schema MySQL-compatible, see db.js)
//   Frontend consumed by: React.js app in ../frontend

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DEMO_USER_ID = 1;
const EXPIRY_WARNING_DAYS = 2; // per acceptance criteria: "expiry date is within 2 days"

// ---------- helpers ----------
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function createNotification({ type, message, related_item_id = null }) {
  db.prepare(
    `INSERT INTO notifications (user_id, type, message, related_item_id) VALUES (?, ?, ?, ?)`
  ).run(DEMO_USER_ID, type, message, related_item_id);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function maybeCreateExpiryAlert(item) {
  const diff = daysUntil(item.expiry_date);
  const today = todayStr();

  // Dedupe: don't create the same alert twice on the same day for the same item.
  if (item.last_expiry_alert_date === today) return;

  if (diff <= EXPIRY_WARNING_DAYS) {
    createNotification({
      type: 'expiry',
      message:
        diff < 0
          ? `"${item.item_name}" has expired. Consider moving it to donation.`
          : `"${item.item_name}" expires in ${diff} day(s). Consider using it or moving it to donation.`,
      related_item_id: item.id,
    });
    db.prepare('UPDATE food_items SET last_expiry_alert_date = ? WHERE id = ?').run(today, item.id);
  }
}

// ---------- Task: "scheduler (cron job) to let you know when items expire
// every day" ----------
// A real cron job would run once a day. For this Iteration 1 prototype we
// re-scan all active items on server startup and then on an interval, so
// items don't need to be re-added/edited to eventually trigger an alert as
// they approach their expiry date. In production this would be replaced
// with a proper daily-scheduled job (e.g. the `node-cron` package running
// at midnight), which needs a long-lived server process either way.
const SCAN_INTERVAL_MS = 60 * 1000; // demo interval: 1 minute (production: once/day)

function scanAllActiveItemsForExpiry() {
  const activeItems = db
    .prepare("SELECT * FROM food_items WHERE status = 'active'")
    .all();
  activeItems.forEach(maybeCreateExpiryAlert);
}

scanAllActiveItemsForExpiry(); // run once on startup
setInterval(scanAllActiveItemsForExpiry, SCAN_INTERVAL_MS);

// =====================================================================
// UC2 - MANAGE FOOD INVENTORY
// =====================================================================

// System displays the food inventory dashboard.
app.get('/api/inventory', (req, res) => {
  const { status } = req.query; // optional filter: active | used | donation
  let rows;
  if (status) {
    rows = db
      .prepare('SELECT * FROM food_items WHERE user_id = ? AND status = ? ORDER BY expiry_date ASC')
      .all(DEMO_USER_ID, status);
  } else {
    rows = db
      .prepare('SELECT * FROM food_items WHERE user_id = ? ORDER BY expiry_date ASC')
      .all(DEMO_USER_ID);
  }
  res.json(rows);
});

// User clicks "Add Food Item" and enters item details.
// Acceptance Criteria: given item name, quantity, expiry date and category are provided,
// when the user submits the form, then the system validates and saves the item;
// otherwise it returns "Please complete all required fields".
app.post('/api/inventory', (req, res) => {
  const { item_name, quantity, unit, expiry_date, category, storage_location, remarks } = req.body;

  // ---- Alternative Course 1a: incomplete form ----
  // Check quantity's presence separately from its value, so quantity=0 is
  // correctly reported as an invalid VALUE, not treated as a MISSING field.
  const quantityMissing = quantity === undefined || quantity === null || quantity === '';
  if (!item_name || quantityMissing || !unit || !expiry_date || !category) {
    return res.status(400).json({ error: 'Please complete all required fields' });
  }
  if (Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  const result = db
    .prepare(
      `INSERT INTO food_items (user_id, item_name, quantity, unit, category, storage_location, expiry_date, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    )
    .run(DEMO_USER_ID, item_name, Number(quantity), unit, category, storage_location || null, expiry_date, remarks || null);

  const item = db.prepare('SELECT * FROM food_items WHERE id = ?').get(result.lastInsertRowid);
  maybeCreateExpiryAlert(item);

  res.status(201).json(item);
});

// User views or edits inventory list -> System displays updated inventory / allows management.
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM food_items WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID);
  if (!existing) return res.status(404).json({ error: 'Food item not found' });

  const { item_name, quantity, unit, expiry_date, category, storage_location, remarks } = req.body;

  const quantityMissing = quantity === undefined || quantity === null || quantity === '';
  if (!item_name || quantityMissing || !unit || !expiry_date || !category) {
    return res.status(400).json({ error: 'Please complete all required fields' });
  }
  if (Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  db.prepare(
    `UPDATE food_items SET item_name=?, quantity=?, unit=?, category=?, storage_location=?, expiry_date=?, remarks=? WHERE id=?`
  ).run(item_name, Number(quantity), unit, category, storage_location || null, expiry_date, remarks || null, id);

  const updated = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);
  maybeCreateExpiryAlert(updated);
  res.json(updated);
});

// Delete an inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM food_items WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID);
  if (!existing) return res.status(404).json({ error: 'Food item not found' });

  db.prepare('DELETE FROM food_items WHERE id = ?').run(id);
  res.json({ success: true });
});

// User selects item and marks it as used.
app.post('/api/inventory/:id/used', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM food_items WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID);
  if (!existing) return res.status(404).json({ error: 'Food item not found' });

  db.prepare(`UPDATE food_items SET status = 'used' WHERE id = ?`).run(id);
  res.json(db.prepare('SELECT * FROM food_items WHERE id = ?').get(id));
});

// User selects item nearing expiry and clicks "Convert to Donation."
// System prompts for confirmation (handled client-side) then converts item,
// then prompts for additional details (pickup location, availability) and
// creates the donation listing + a confirmation notification (links to UC5).
app.post('/api/inventory/:id/donate', (req, res) => {
  const { id } = req.params;
  const { pickup_location, availability } = req.body;

  const existing = db.prepare('SELECT * FROM food_items WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID);
  if (!existing) return res.status(404).json({ error: 'Food item not found' });

  // Alternative course: additional donation details are required to finalize the listing
  if (!pickup_location || !availability) {
    return res.status(400).json({ error: 'Please provide pickup location and availability to create the donation listing' });
  }

  db.prepare(
    `UPDATE food_items SET status = 'donation', donation_pickup_location = ?, donation_availability = ? WHERE id = ?`
  ).run(pickup_location, availability, id);

  const updated = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);

  createNotification({
    type: 'donation',
    message: `"${updated.item_name}" was posted as a donation listing (pickup: ${pickup_location}).`,
    related_item_id: updated.id,
  });

  res.json(updated);
});

// =====================================================================
// UC5 - VIEW NOTIFICATIONS
// =====================================================================

// User opens the "Notifications" section -> System displays a list of recent
// alerts (sorted by most recent) with details and timestamps.
app.get('/api/notifications', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(DEMO_USER_ID);
  res.json(rows); // Alternative course 1a (no notifications) is handled by the frontend showing "No new notifications"
});

// User clicks a notification -> system opens the related screen (returns related item)
app.get('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  let related_item = null;
  if (notif.related_item_id) {
    related_item = db.prepare('SELECT * FROM food_items WHERE id = ?').get(notif.related_item_id);
  }
  res.json({ ...notif, related_item });
});

// User marks notification(s) as read -> System updates notification status.
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json(db.prepare('SELECT * FROM notifications WHERE id = ?').get(id));
});

app.put('/api/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(DEMO_USER_ID);
  res.json({ success: true });
});

// health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', module: 'UC2 + UC5 (Sujata Bajracharya)' }));

app.listen(PORT, () => {
  console.log(`FreshGuard backend (UC2 + UC5) running on http://localhost:${PORT}`);
});
