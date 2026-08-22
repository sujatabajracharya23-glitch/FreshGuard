// Automated tests for UC1 - Register Users & Privacy Settings.
// Uses Jest + Supertest. The MySQL pool is mocked so these tests run
// without a live database connection (standard practice for unit/API
// testing of controllers).

jest.mock("../src/config/db", () => ({
  pool: { query: jest.fn() },
}));
jest.mock("../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendTwoFactorCode: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");
const { createApp } = require("../src/app");
const { pool } = require("../src/config/db");

const app = createApp();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("POST /api/auth/register", () => {
  // TC1 - Positive: valid registration data
  test("TC1 - registers a new user with valid data (Happy Path)", async () => {
    pool.query
      .mockResolvedValueOnce([[]]) // SELECT existing user -> none found
      .mockResolvedValueOnce([{ insertId: 1 }]) // INSERT user
      .mockResolvedValueOnce([{}]); // INSERT verification code

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Simran Gopali",
      email: "simran@example.com",
      password: "StrongPass123",
      householdSize: 4,
    });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(1);
    expect(res.body.message).toMatch(/verification code has been sent/i);
  });

  // TC2 - Negative: incomplete form (1a alt course)
  test("TC2 - rejects registration with missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Simran Gopali",
      // email and password missing
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/complete all required fields/i);
    expect(pool.query).not.toHaveBeenCalled();
  });

  // TC3 - Negative: invalid email format
  test("TC3 - rejects registration with an invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Simran Gopali",
      email: "not-an-email",
      password: "StrongPass123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/i);
  });

  // TC4 - Negative: password too short
  test("TC4 - rejects registration with a password under 8 characters", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Simran Gopali",
      email: "simran2@example.com",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/i);
  });

  // TC5 - Negative: duplicate email (case study alt course 3a)
  test("TC5 - rejects registration when email is already registered", async () => {
    pool.query.mockResolvedValueOnce([[{ user_id: 99 }]]); // existing user found

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Simran Gopali",
      email: "already@example.com",
      password: "StrongPass123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });
});

describe("POST /api/auth/verify-email", () => {
  // TC6 - Positive: correct, unexpired code
  test("TC6 - activates the account with a valid, unexpired code", async () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    pool.query
      .mockResolvedValueOnce([[{ user_id: 1, email: "simran@example.com" }]]) // find user
      .mockResolvedValueOnce([[{ code_id: 5, code: "123456", expires_at: future }]]) // find code
      .mockResolvedValueOnce([{}]) // mark code used
      .mockResolvedValueOnce([{}]) // update password (skipped if not provided, but harmless)
      .mockResolvedValueOnce([{}]); // mark user verified

    const res = await request(app).post("/api/auth/verify-email").send({
      email: "simran@example.com",
      code: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/activated successfully/i);
  });

  // TC7 - Negative: wrong code (case study alt course Line 6)
  test("TC7 - rejects an invalid verification code", async () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    pool.query
      .mockResolvedValueOnce([[{ user_id: 1, email: "simran@example.com" }]])
      .mockResolvedValueOnce([[{ code_id: 5, code: "123456", expires_at: future }]]);

    const res = await request(app).post("/api/auth/verify-email").send({
      email: "simran@example.com",
      code: "000000",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  // TC8 - Negative: expired code (case study alt course Line 6)
  test("TC8 - rejects an expired verification code and flags it as expired", async () => {
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    pool.query
      .mockResolvedValueOnce([[{ user_id: 1, email: "simran@example.com" }]])
      .mockResolvedValueOnce([[{ code_id: 5, code: "123456", expires_at: past }]]);

    const res = await request(app).post("/api/auth/verify-email").send({
      email: "simran@example.com",
      code: "123456",
    });

    expect(res.status).toBe(400);
    expect(res.body.expired).toBe(true);
    expect(res.body.error).toMatch(/expired/i);
  });
});

describe("POST /api/auth/login", () => {
  // TC9 - Positive: valid credentials, verified, no 2FA
  test("TC9 - logs in successfully with valid credentials", async () => {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("StrongPass123", 10);

    pool.query.mockResolvedValueOnce([
      [
        {
          user_id: 1,
          email: "simran@example.com",
          password_hash: hash,
          is_verified: 1,
          two_fa_enabled: 0,
        },
      ],
    ]);

    const res = await request(app).post("/api/auth/login").send({
      email: "simran@example.com",
      password: "StrongPass123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  // TC10 - Negative: wrong password
  test("TC10 - rejects login with an incorrect password", async () => {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("StrongPass123", 10);

    pool.query.mockResolvedValueOnce([
      [{ user_id: 1, email: "simran@example.com", password_hash: hash, is_verified: 1, two_fa_enabled: 0 }],
    ]);

    const res = await request(app).post("/api/auth/login").send({
      email: "simran@example.com",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  // TC11 - Negative: unverified account
  test("TC11 - blocks login for an unverified account", async () => {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("StrongPass123", 10);

    pool.query.mockResolvedValueOnce([
      [{ user_id: 1, email: "new@example.com", password_hash: hash, is_verified: 0, two_fa_enabled: 0 }],
    ]);

    const res = await request(app).post("/api/auth/login").send({
      email: "new@example.com",
      password: "StrongPass123",
    });

    expect(res.status).toBe(403);
    expect(res.body.needsVerification).toBe(true);
  });
});

describe("PATCH /api/auth/privacy-settings/:userId", () => {
  // TC12 - Positive: enabling 2FA and changing visibility
  test("TC12 - updates privacy settings successfully", async () => {
    pool.query
      .mockResolvedValueOnce([[{ user_id: 1 }]]) // user exists
      .mockResolvedValueOnce([{}]) // update
      .mockResolvedValueOnce([[{ user_id: 1, two_fa_enabled: 1, listing_visibility: "private" }]]); // re-fetch

    const res = await request(app).patch("/api/auth/privacy-settings/1").send({
      twoFaEnabled: true,
      listingVisibility: "private",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.two_fa_enabled).toBe(1);
  });

  // TC13 - Negative: invalid visibility value
  test("TC13 - rejects an invalid listing visibility value", async () => {
    const res = await request(app).patch("/api/auth/privacy-settings/1").send({
      listingVisibility: "everyone",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid listing visibility/i);
  });
});
