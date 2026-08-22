const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  resendCode,
  login,
  verifyTwoFactor,
  updatePrivacySettings,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendCode);
router.post("/login", login);
router.post("/verify-2fa", verifyTwoFactor);
router.patch("/privacy-settings/:userId", updatePrivacySettings);

module.exports = router;
