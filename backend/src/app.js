const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ status: "ok", service: "FreshGuard API" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/analytics", analyticsRoutes);

  // 404 handler
  app.use((req, res) => res.status(404).json({ error: "Route not found." }));

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Unexpected server error." });
  });

  return app;
}

module.exports = { createApp };
