const express = require("express");
const router = express.Router();
const { getSummary } = require("../controllers/analyticsController");

router.get("/summary", getSummary);

module.exports = router;
