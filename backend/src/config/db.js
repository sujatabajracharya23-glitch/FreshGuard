// MySQL connection pool.
// Kept as a thin wrapper so controllers/services depend on this module's
// exported `pool`, which tests can jest.mock() without needing a live
// MySQL server (see tests/auth.test.js and tests/analytics.test.js).

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "freshguard",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

module.exports = { pool };
