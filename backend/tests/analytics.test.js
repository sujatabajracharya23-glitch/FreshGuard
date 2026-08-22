// Automated tests for UC4 - Food Analytics.

jest.mock("../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

const request = require("supertest");
const { createApp } = require("../src/app");
const { pool } = require("../src/config/db");

const app = createApp();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/analytics/summary", () => {
  // TC1 - Positive: user with data returns saved/donated totals
  test("TC1 - returns a populated summary when the user has activity", async () => {
    pool.query
      .mockResolvedValueOnce([[{ user_id: 1 }]]) // user exists
      .mockResolvedValueOnce([[{ itemsSaved: 4, quantitySaved: 6 }]]) // used items
      .mockResolvedValueOnce([[{ donationsMade: 2, donatedQuantity: 3 }]]) // donations
      .mockResolvedValueOnce([[{ category: "dairy", count: 3 }, { category: "bakery", count: 1 }]]); // breakdown

    const res = await request(app).get("/api/analytics/summary?userId=1&range=all");

    expect(res.status).toBe(200);
    expect(res.body.hasData).toBe(true);
    expect(res.body.itemsSaved).toBe(4);
    expect(res.body.donationsMade).toBe(2);
    expect(res.body.categoryBreakdown).toHaveLength(2);
  });

  // TC2 - Negative/edge case (case study alt course 3a): no data found
  test("TC2 - returns an encouraging message when no food-saving data exists", async () => {
    pool.query
      .mockResolvedValueOnce([[{ user_id: 2 }]]) // user exists
      .mockResolvedValueOnce([[{ itemsSaved: 0, quantitySaved: 0 }]])
      .mockResolvedValueOnce([[{ donationsMade: 0, donatedQuantity: 0 }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/analytics/summary?userId=2&range=all");

    expect(res.status).toBe(200);
    expect(res.body.hasData).toBe(false);
    expect(res.body.message).toMatch(/haven't logged any food-saving activity/i);
  });

  // TC3 - Negative: missing required userId param
  test("TC3 - rejects the request when userId is missing", async () => {
    const res = await request(app).get("/api/analytics/summary?range=all");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId is required/i);
    expect(pool.query).not.toHaveBeenCalled();
  });

  // TC4 - Negative: invalid range filter value
  test("TC4 - rejects an invalid range filter", async () => {
    const res = await request(app).get("/api/analytics/summary?userId=1&range=yearly");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid range/i);
  });

  // TC5 - Negative: userId that doesn't exist
  test("TC5 - returns 404 for a userId that does not exist", async () => {
    pool.query.mockResolvedValueOnce([[]]); // no user found

    const res = await request(app).get("/api/analytics/summary?userId=999&range=all");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  // TC6 - Positive: category filter applied correctly (weekly range)
  test("TC6 - applies the weekly range and category filter", async () => {
    pool.query
      .mockResolvedValueOnce([[{ user_id: 1 }]])
      .mockResolvedValueOnce([[{ itemsSaved: 1, quantitySaved: 2 }]])
      .mockResolvedValueOnce([[{ donationsMade: 0, donatedQuantity: 0 }]])
      .mockResolvedValueOnce([[{ category: "dairy", count: 1 }]]);

    const res = await request(app).get("/api/analytics/summary?userId=1&range=weekly&category=dairy");

    expect(res.status).toBe(200);
    expect(res.body.hasData).toBe(true);
    expect(res.body.range).toBe("weekly");
  });
});
