# FreshGuard — Iteration 1 Prototype (Sujata Bajracharya)

BIT216 Assignment 2 — Iteration 1 (Individual Coding & Testing)
Use cases implemented: **UC2 — Manage Food Inventory** and **UC5 — View Notifications**

## Tools used (matches Assignment 1, Table 1 — Development Platform)

| Layer            | Tool                              | Notes |
|-------------------|------------------------------------|-------|
| Frontend          | React.js 18/19 (Vite)             | Team frontend framework |
| Backend           | Node.js + Express                 | Sujata's assigned tool |
| Database          | SQL (Node's built-in `node:sqlite`) | MySQL-compatible schema — swap `backend/db.js` for `mysql2` to point at the team's MySQL 8.x server without changing any query shapes |
| Version Control   | Git / GitHub                      | `git init` already run in this folder |

## Project structure

```
freshguard/
  backend/          Express REST API (UC2 + UC5)
    server.js
    db.js
    package.json
  frontend/         React (Vite) client
    src/
      App.jsx
      InventoryPage.jsx      UC2 screen
      NotificationsPage.jsx  UC5 screen
      api.js                 fetch wrapper
      index.css
```

## Running the prototype

**1. Backend** (port 5000)
```bash
cd backend
npm install
npm start
```

**2. Frontend** (port 5173) — in a second terminal
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. The app talks to the API at `http://localhost:5000/api`.

## What's implemented (Iteration 1)

**UC2 — Manage Food Inventory**
- Add a food item (name, quantity, category, expiry date required; storage location & remarks optional)
- Validation: incomplete form → "Please complete all required fields"
- Edit / delete inventory items
- Mark an item as used
- Convert an item to a donation listing (confirmation + pickup location/availability details)
- Filter inventory by status (active / donation / used)

**UC5 — View Notifications**
- Notifications list, sorted most-recent first
- Auto-generated **expiry alerts** when an item is added/edited with an expiry date within 3 days
- Auto-generated **donation update** when an item is converted to a donation
- Click a notification to view details and mark it as read
- "Mark all as read"
- "No new notifications" empty state

## Note on Iteration scope

Per the team's Work Breakdown Structure (Assignment 1), UC2 and UC5 full implementation was scheduled under Iteration 2 (WBS 5.1/5.2), while Iteration 1 (WBS 4.2–4.4) covered UC1, UC3 and UC4. However, Assignment 2's brief states Iteration 1 coding/testing is **individual** work per student on the use cases assigned to them in Assignment 1. This prototype gives Sujata's UC2/UC5 module a working, testable Iteration 1 build ahead of the group's Iteration 2 milestone, so there is demonstrable individual progress, Git history, and test evidence for the Iteration 1 submission.
 
