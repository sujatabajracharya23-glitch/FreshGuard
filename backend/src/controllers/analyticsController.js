// UC4 - Food Analytics
// Typical course: retrieves logged activities, shows summary charts/progress
// indicators (total food saved, number of donations), and updates the view
// based on a filter (date range / category).
// Alt course 3a: no food-saving data found -> encouraging message instead
// of an error.

const { pool } = require("../config/db");

const VALID_RANGES = ["weekly", "monthly", "all"];

function rangeToStartDate(range) {
  const now = new Date();
  if (range === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }
  if (range === "monthly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  }
  return null; // 'all' -> no lower bound
}

// ---- GET /api/analytics/summary?userId=&range=&category= ----
async function getSummary(req, res) {
  try {
    const { userId, range = "all", category } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    if (!VALID_RANGES.includes(range)) {
      return res.status(400).json({
        error: `Invalid range. Expected one of: ${VALID_RANGES.join(", ")}`,
      });
    }

    const [users] = await pool.query("SELECT user_id FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const startDate = rangeToStartDate(range);

    // --- items saved from waste (used, not thrown away) ---
    const usedParams = [userId];
    let usedQuery = `
      SELECT COUNT(*) AS itemsSaved, COALESCE(SUM(quantity), 0) AS quantitySaved
      FROM food_items
      WHERE user_id = ? AND status IN ('used', 'donated')`;
    if (startDate) {
      usedQuery += " AND created_at >= ?";
      usedParams.push(startDate);
    }
    if (category) {
      usedQuery += " AND category = ?";
      usedParams.push(category);
    }
    const [usedRows] = await pool.query(usedQuery, usedParams);

    // --- donations made ---
    const donationParams = [userId];
    let donationQuery = `
      SELECT COUNT(*) AS donationsMade, COALESCE(SUM(quantity), 0) AS donatedQuantity
      FROM donations
      WHERE user_id = ? AND status = 'completed'`;
    if (startDate) {
      donationQuery += " AND completed_at >= ?";
      donationParams.push(startDate);
    }
    const [donationRows] = await pool.query(donationQuery, donationParams);

    // --- category breakdown, for the chart ---
    const categoryParams = [userId];
    let categoryQuery = `
      SELECT category, COUNT(*) AS count
      FROM food_items
      WHERE user_id = ? AND status IN ('used', 'donated')`;
    if (startDate) {
      categoryQuery += " AND created_at >= ?";
      categoryParams.push(startDate);
    }
    categoryQuery += " GROUP BY category ORDER BY count DESC";
    const [categoryRows] = await pool.query(categoryQuery, categoryParams);

    const itemsSaved = Number(usedRows[0].itemsSaved) || 0;
    const donationsMade = Number(donationRows[0].donationsMade) || 0;
    const hasData = itemsSaved > 0 || donationsMade > 0;

    // Alt course 3a: no food-saving data found
    if (!hasData) {
      return res.status(200).json({
        hasData: false,
        message: "You haven't logged any food-saving activity yet. Start tracking items and donations to see your impact here!",
        itemsSaved: 0,
        quantitySaved: 0,
        donationsMade: 0,
        donatedQuantity: 0,
        categoryBreakdown: [],
        range,
      });
    }

    return res.status(200).json({
      hasData: true,
      itemsSaved,
      quantitySaved: Number(usedRows[0].quantitySaved) || 0,
      donationsMade,
      donatedQuantity: Number(donationRows[0].donatedQuantity) || 0,
      categoryBreakdown: categoryRows,
      range,
    });
  } catch (err) {
    console.error("getSummary error:", err);
    return res.status(500).json({ error: "Something went wrong while loading your analytics." });
  }
}

module.exports = { getSummary, VALID_RANGES };
