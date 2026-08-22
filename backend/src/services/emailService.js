// Mock email service for the Iteration 1 demo.
// In production this would call a real provider (e.g. Nodemailer + SMTP,
// SendGrid, etc). For the prototype/demo it simply logs what would be
// sent, so the flow can be demonstrated without real mailbox credentials.
//
// UC1 typical course: "The system sends an automated email ... containing:
// a welcome message, a confirmation link with the 6 digit verification code"

async function sendVerificationEmail(toEmail, fullName, code) {
  console.log(
    `[EMAIL -> ${toEmail}] Welcome to FreshGuard, ${fullName}! ` +
      `Your verification code is: ${code} (expires shortly). ` +
      `Confirm at: /verify-email?email=${encodeURIComponent(toEmail)}`
  );
  return true;
}

async function sendTwoFactorCode(toEmail, code) {
  console.log(`[EMAIL -> ${toEmail}] Your FreshGuard login code is: ${code}`);
  return true;
}

module.exports = { sendVerificationEmail, sendTwoFactorCode };
