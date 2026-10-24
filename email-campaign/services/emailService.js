const nodemailer = require("nodemailer");
const config = require("../config/email");

const transporter = nodemailer.createTransport(config.smtp);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

async function sendEmail({ to, subject, html, attachments }) {
  if (!isValidEmail(to)) throw new Error(`Invalid email address: ${to}`);

  if (config.dryRun) {
    console.log(`  🛡️  [DRY-RUN / PREVIEW] Simulated email dispatch to ${to}`);
    console.log(`      Subject: ${subject}`);
    return {
      messageId: `dry-run-${Date.now()}`,
      response: "250 Simulated delivery (DRY_RUN mode)",
      simulated: true,
      to,
      subject
    };
  }

  return transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    attachments,
  });
}


module.exports = { sendEmail, isValidEmail };
