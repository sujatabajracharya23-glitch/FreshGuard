// Handles generation and validation of the 6-digit verification codes
// used for UC1's email verification step and optional 2FA login step.

const TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15);

function generateCode() {
  // 6-digit numeric code, zero-padded (e.g. "004821")
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

function getExpiryDate(fromDate = new Date()) {
  return new Date(fromDate.getTime() + TTL_MINUTES * 60 * 1000);
}

function isExpired(expiresAt, now = new Date()) {
  return new Date(expiresAt).getTime() < now.getTime();
}

module.exports = { generateCode, getExpiryDate, isExpired, TTL_MINUTES };
