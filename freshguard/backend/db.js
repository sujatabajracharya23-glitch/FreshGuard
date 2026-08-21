// db.js
// FreshGuard - Database layer
// Uses Node.js built-in `node:sqlite` (Node 22+) so the prototype runs with
// zero external services for demo purposes. Schema is written in
// MySQL-compatible SQL so it can be pointed at the team's MySQL 8.x instance
// (Shraddha's responsibility per Table 1, Assignment 1) by swapping this file
// for a `mysql2` connection - the query shapes below map 1:1 onto MySQL.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'freshguard.db');
const db = new DatabaseSync(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  category TEXT NOT NULL,
  storage_location TEXT,
  expiry_date TEXT NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | used | donation
  donation_pickup_location TEXT,
  donation_availability TEXT,
  last_expiry_alert_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL, -- expiry | donation | meal | account
  message TEXT NOT NULL,
  related_item_id INTEGER,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Migration: add columns that didn't exist in earlier versions of this
// schema, so re-running against an existing freshguard.db (with real data
// already in it) doesn't fail or wipe anything out.
const existingColumns = db.prepare("PRAGMA table_info(food_items)").all().map((c) => c.name);
if (!existingColumns.includes('unit')) {
  db.exec("ALTER TABLE food_items ADD COLUMN unit TEXT NOT NULL DEFAULT 'pcs'");
}
if (!existingColumns.includes('last_expiry_alert_date')) {
  db.exec("ALTER TABLE food_items ADD COLUMN last_expiry_alert_date TEXT");
}

// Seed a demo household user (UC1 registration is out of scope for this module)
const existing = db.prepare('SELECT COUNT(*) AS c FROM users').get();
if (existing.c === 0) {
  db.prepare('INSERT INTO users (id, full_name, email) VALUES (1, ?, ?)')
    .run('Demo Household User', 'demo@freshguard.app');
}

module.exports = db;
