import nodemailer from "nodemailer";

let testAccount = null;
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, "") : "";

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Auto Ethereal test account if real SMTP env vars are not set yet
    try {
      testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log("ℹ️ Created Ethereal Test Email Transporter:", testAccount.user);
    } catch (e) {
      console.warn("Could not create Ethereal test transport:", e.message);
    }
  }

  return transporter;
}

export async function sendOtpEmail({ toEmail, otp, userName = "Learner" }) {
  try {
    const mailTransporter = await getTransporter();
    if (!mailTransporter) return { success: false, message: "No email transporter available" };

    const senderEmail = process.env.SMTP_USER || testAccount?.user || "noreply@tcm.com";
    const mailOptions = {
      from: `"TCM Academy" <${senderEmail}>`,
      to: toEmail,
      subject: "🔒 Your Password Reset Verification OTP Code - TCM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
          <h2 style="color: #5B3CF5; text-align: center; margin-bottom: 8px;">TCM Academy</h2>
          <p style="color: #334155; font-size: 14px;">Hi <b>${userName}</b>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 20px;">You requested a password reset for your TCM account. Please use the verification OTP code below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #5B3CF5; letter-spacing: 6px; padding: 12px 24px; background-color: #F0EDFF; border-radius: 8px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #64748B; font-size: 12px; text-align: center;">This OTP is valid for <b>10 minutes</b>. If you did not request this password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
          <p style="color: #94A3B8; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} Talent & Career Mission (TCM). All rights reserved.</p>
        </div>
      `
    };

    const info = await mailTransporter.sendMail(mailOptions);
    let previewUrl = null;
    if (testAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("✉️ Sent OTP Email via Ethereal Test Inbox. Preview URL:", previewUrl);
    } else {
      console.log("✉️ Sent OTP Email to:", toEmail);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error("Failed to send OTP email:", err.message);
    return { success: false, error: err.message };
  }
}
