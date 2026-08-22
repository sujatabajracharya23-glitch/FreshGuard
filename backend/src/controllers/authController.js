// UC1 - Register Users & Privacy Settings
// Implements the typical course of events and both alternative courses
// from the case study:
//   3a. Email already registered -> prompt message
//   Line 6. Invalid/expired verification code -> prompt to request new code

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { generateCode, getExpiryDate, isExpired } = require("../services/twoFactorService");
const { sendVerificationEmail, sendTwoFactorCode } = require("../services/emailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- POST /api/auth/register ----
async function register(req, res) {
  try {
    const { fullName, email, password, householdSize } = req.body;

    // 1a (from case study's general validation pattern): incomplete form
    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: "Please complete all required fields",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // 3a: username/email already registered by another user
    const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        error: "This email is already registered. Please log in or use a different email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, household_size)
       VALUES (?, ?, ?, ?)`,
      [fullName, email, passwordHash, householdSize || null]
    );

    const userId = result.insertId;

    // Generate + store the 6-digit verification code, email it out
    const code = generateCode();
    const expiresAt = getExpiryDate();
    await pool.query(
      `INSERT INTO verification_codes (user_id, code, purpose, expires_at)
       VALUES (?, ?, 'email_verification', ?)`,
      [userId, code, expiresAt]
    );

    await sendVerificationEmail(email, fullName, code);

    return res.status(201).json({
      message: "Registration successful. A verification code has been sent to your email.",
      userId,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Something went wrong while registering. Please try again." });
  }
}

// ---- POST /api/auth/verify-email ----
// "Upon clicking the link, the user enters the verification code and sets a new password"
async function verifyEmail(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Please complete all required fields" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "No account found for this email." });
    }
    const user = users[0];

    const [codes] = await pool.query(
      `SELECT * FROM verification_codes
       WHERE user_id = ? AND purpose = 'email_verification' AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [user.user_id]
    );

    if (codes.length === 0) {
      return res.status(400).json({
        error: "No pending verification code found. Please request a new code.",
      });
    }

    const record = codes[0];

    // Line 6: invalid or expired verification code
    if (record.code !== code) {
      return res.status(400).json({
        error: "The verification code you entered is invalid. Please check and try again, or request a new code.",
      });
    }

    if (isExpired(record.expires_at)) {
      return res.status(400).json({
        error: "This verification code has expired. Please request a new code.",
        expired: true,
      });
    }

    await pool.query("UPDATE verification_codes SET used = 1 WHERE code_id = ?", [record.code_id]);

    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [passwordHash, user.user_id]);
    }

    await pool.query("UPDATE users SET is_verified = 1 WHERE user_id = ?", [user.user_id]);

    return res.status(200).json({ message: "Account activated successfully. You may now log in." });
  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.status(500).json({ error: "Something went wrong while verifying your account." });
  }
}

// ---- POST /api/auth/resend-code ----
// Support path for Line 6 alt course: "system prompts the user to request a new code"
async function resendCode(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Please complete all required fields" });

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "No account found for this email." });
    }
    const user = users[0];

    const code = generateCode();
    const expiresAt = getExpiryDate();
    await pool.query(
      `INSERT INTO verification_codes (user_id, code, purpose, expires_at)
       VALUES (?, ?, 'email_verification', ?)`,
      [user.user_id, code, expiresAt]
    );
    await sendVerificationEmail(email, user.full_name, code);

    return res.status(200).json({ message: "A new verification code has been sent to your email." });
  } catch (err) {
    console.error("resendCode error:", err);
    return res.status(500).json({ error: "Something went wrong while sending a new code." });
  }
}

// ---- POST /api/auth/login ----
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please complete all required fields" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const user = users[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
        needsVerification: true,
      });
    }

    // If the user enabled 2FA, require a second code before issuing the JWT
    if (user.two_fa_enabled) {
      const code = generateCode();
      const expiresAt = getExpiryDate();
      await pool.query(
        `INSERT INTO verification_codes (user_id, code, purpose, expires_at)
         VALUES (?, ?, 'two_factor_login', ?)`,
        [user.user_id, code, expiresAt]
      );
      await sendTwoFactorCode(user.email, code);
      return res.status(200).json({
        message: "A 2FA code has been sent to your email. Please enter it to complete login.",
        requires2FA: true,
        userId: user.user_id,
      });
    }

    const token = issueToken(user);
    return res.status(200).json({ message: "Login successful.", token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Something went wrong while logging in." });
  }
}

// ---- POST /api/auth/verify-2fa ----
async function verifyTwoFactor(req, res) {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ error: "Please complete all required fields" });
    }

    const [codes] = await pool.query(
      `SELECT * FROM verification_codes
       WHERE user_id = ? AND purpose = 'two_factor_login' AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (codes.length === 0) {
      return res.status(400).json({ error: "No pending 2FA code found. Please log in again." });
    }
    const record = codes[0];

    if (record.code !== code) {
      return res.status(400).json({ error: "The 2FA code you entered is invalid." });
    }
    if (isExpired(record.expires_at)) {
      return res.status(400).json({ error: "This 2FA code has expired. Please request a new one.", expired: true });
    }

    await pool.query("UPDATE verification_codes SET used = 1 WHERE code_id = ?", [record.code_id]);

    const [users] = await pool.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    const user = users[0];
    const token = issueToken(user);

    return res.status(200).json({ message: "Login successful.", token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("verifyTwoFactor error:", err);
    return res.status(500).json({ error: "Something went wrong while verifying your 2FA code." });
  }
}

// ---- PATCH /api/auth/privacy-settings/:userId ----
// "These settings can be updated anytime from the account dashboard."
async function updatePrivacySettings(req, res) {
  try {
    const { userId } = req.params;
    const { twoFaEnabled, listingVisibility } = req.body;

    const validVisibility = ["public", "household_only", "private"];
    if (listingVisibility && !validVisibility.includes(listingVisibility)) {
      return res.status(400).json({ error: "Invalid listing visibility option." });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    await pool.query(
      `UPDATE users SET
         two_fa_enabled = COALESCE(?, two_fa_enabled),
         listing_visibility = COALESCE(?, listing_visibility)
       WHERE user_id = ?`,
      [
        typeof twoFaEnabled === "boolean" ? (twoFaEnabled ? 1 : 0) : null,
        listingVisibility || null,
        userId,
      ]
    );

    const [updated] = await pool.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    return res.status(200).json({
      message: "Privacy settings updated.",
      user: sanitizeUser(updated[0]),
    });
  } catch (err) {
    console.error("updatePrivacySettings error:", err);
    return res.status(500).json({ error: "Something went wrong while updating privacy settings." });
  }
}

function issueToken(user) {
  return jwt.sign(
    { userId: user.user_id, email: user.email },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  verifyTwoFactor,
  updatePrivacySettings,
};
