import nodemailer from "nodemailer";
import { logger } from "./logger";

const FROM_EMAIL = process.env.FROM_EMAIL ?? "verify@shiprion.com";
const FROM = `Shiprion <${FROM_EMAIL}>`;

function createTransporter() {
  const host = process.env.SMTP_HOST ?? "mail.privateemail.com";
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function verifyTransporter(): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn("SMTP not configured — email sending disabled");
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info(
      {
        host: process.env.SMTP_HOST ?? "mail.privateemail.com",
        port: process.env.SMTP_PORT ?? "587",
      },
      "SMTP transporter verified successfully",
    );
  } catch (err) {
    logger.error({ err }, "SMTP transporter verification failed");
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendVerificationEmail(
  email: string,
  code: string,
): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn("SMTP not configured — verification email skipped");
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0f1a;border-radius:16px;color:#e5e7eb">
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-block;background:linear-gradient(135deg,#6d7c2b,#8fa33b);border-radius:10px;padding:10px 20px">
          <span style="color:#fff;font-weight:800;font-size:18px;letter-spacing:0.04em">Shiprion</span>
        </div>
      </div>
      <h2 style="color:#fff;font-size:22px;font-weight:700;margin-bottom:10px;text-align:center">Verify your email address</h2>
      <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin-bottom:28px;text-align:center">
        Enter the 6-digit code below to activate your Shiprion account. The code expires in <strong style="color:#e5e7eb">10 minutes</strong>.
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(143,163,59,0.35);border-radius:14px;padding:28px;text-align:center;margin-bottom:28px">
        <span style="font-size:40px;font-weight:800;letter-spacing:0.22em;color:#8fa33b;font-variant-numeric:tabular-nums">${escapeHtml(code)}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.7;text-align:center;margin-bottom:8px">
        This code expires in <strong style="color:#e5e7eb">10 minutes</strong>. Do not share it with anyone.
      </p>
      <p style="color:#6b7280;font-size:12px;line-height:1.7;text-align:center">
        If you didn't create a Shiprion account, you can safely ignore this email — no action is needed.
      </p>
    </div>
  `;

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Shiprion — Verify your email",
      html,
    });
    logger.info({ email }, "Verification email sent via SMTP");
  } catch (err) {
    logger.error({ email, err }, "Failed to send verification email via SMTP");
    throw new Error(
      `SMTP error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function sendShipmentCreatedEmail(
  email: string,
  recipientName: string,
  trackingNumber: string,
  origin: string,
  destination: string,
): Promise<void> {
  if (!isEmailConfigured()) {
    logger.info(
      { email, trackingNumber },
      "SMTP not configured — shipment email skipped",
    );
    return;
  }

  const appOrigin = process.env.APP_ORIGIN ?? "https://shiprion.com";
  const trackUrl = `${appOrigin.replace(/\/$/, "")}/track/${encodeURIComponent(trackingNumber)}`;

  const safeRecipientName = escapeHtml(recipientName);
  const safeTrackingNumber = escapeHtml(trackingNumber);
  const safeOrigin = escapeHtml(origin);
  const safeDestination = escapeHtml(destination);

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0f1a;border-radius:16px;color:#e5e7eb">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#6d7c2b,#8fa33b);border-radius:10px;padding:10px 18px">
          <span style="color:#fff;font-weight:700;font-size:20px;letter-spacing:0.04em">Shiprion</span>
        </div>
      </div>
      <h2 style="color:#fff;font-size:22px;font-weight:700;margin-bottom:8px;text-align:center">Your Shipment Has Been Created</h2>
      <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin-bottom:20px;text-align:center">
        Hi ${safeRecipientName}, a shipment has been created for you. Here are your details:
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0">Tracking Number</td>
            <td style="color:#8fa33b;font-size:15px;font-weight:700;text-align:right;padding:6px 0;letter-spacing:0.05em">${safeTrackingNumber}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0">From</td>
            <td style="color:#e5e7eb;font-size:13px;text-align:right;padding:6px 0">${safeOrigin}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0">To</td>
            <td style="color:#e5e7eb;font-size:13px;text-align:right;padding:6px 0">${safeDestination}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0">Status</td>
            <td style="color:#fbbf24;font-size:13px;text-align:right;padding:6px 0;font-weight:600">Pending</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:20px">
        <a href="${trackUrl}" style="display:inline-block;background:linear-gradient(135deg,#6d7c2b,#8fa33b);color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">Track Your Shipment</a>
      </div>
      <p style="color:#6b7280;font-size:11px;line-height:1.6;text-align:center">
        You will receive updates as your shipment progresses. If you have questions, visit our website or contact support.
      </p>
    </div>
  `;

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Shiprion — Shipment ${safeTrackingNumber} Created`,
      html,
    });
    logger.info(
      { email, trackingNumber },
      "Shipment created email sent via SMTP",
    );
  } catch (err) {
    logger.error(
      { email, trackingNumber, err },
      "Failed to send shipment created email via SMTP",
    );
  }
}

export async function sendContactConfirmationEmail(
  email: string,
  name: string,
): Promise<void> {
  if (!isEmailConfigured()) return;

  const safeName = escapeHtml(name);

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0f1a;border-radius:16px;color:#e5e7eb">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#6d7c2b,#8fa33b);border-radius:10px;padding:10px 18px">
          <span style="color:#fff;font-weight:700;font-size:20px;letter-spacing:0.04em">Shiprion</span>
        </div>
      </div>
      <h2 style="color:#fff;font-size:22px;font-weight:700;margin-bottom:8px;text-align:center">We received your message</h2>
      <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin-bottom:20px;text-align:center">
        Hi ${safeName}, thank you for reaching out to Shiprion Support. We have received your message and a member of our team will get back to you within <strong style="color:#e5e7eb">24 hours</strong>.
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(143,163,59,0.25);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="color:#9ca3af;font-size:13px;margin:0 0 6px 0">Need urgent help?</p>
        <a href="mailto:support@shiprion.com" style="color:#8fa33b;font-size:14px;font-weight:600;text-decoration:none">support@shiprion.com</a>
      </div>
      <p style="color:#6b7280;font-size:11px;line-height:1.6;text-align:center">
        Please do not reply to this email. This is an automated confirmation.
      </p>
    </div>
  `;

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Shiprion — We received your message",
      html,
    });
    logger.info({ email }, "Contact confirmation email sent via SMTP");
  } catch (err) {
    logger.error(
      { email, err },
      "Failed to send contact confirmation email via SMTP",
    );
  }
}

export async function sendContactNotificationEmail(
  name: string,
  email: string,
  message: string,
): Promise<void> {
  if (!isEmailConfigured()) return;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0a0f1a;border-radius:16px;color:#e5e7eb">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#6d7c2b,#8fa33b);border-radius:10px;padding:10px 18px">
          <span style="color:#fff;font-weight:700;font-size:20px;letter-spacing:0.04em">Shiprion</span>
        </div>
      </div>
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin-bottom:4px;text-align:center">New Contact Form Submission</h2>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-bottom:24px">Someone submitted the contact form on shiprion.com</p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);width:80px">Name</td>
            <td style="color:#e5e7eb;font-size:13px;font-weight:600;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">${safeName}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:8px 0">Email</td>
            <td style="padding:8px 0"><a href="mailto:${safeEmail}" style="color:#8fa33b;font-size:13px;font-weight:600;text-decoration:none">${safeEmail}</a></td>
          </tr>
        </table>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em">Message</p>
        <p style="color:#e5e7eb;font-size:14px;line-height:1.7;margin:0">${safeMessage}</p>
      </div>
      <div style="text-align:center">
        <a href="mailto:${safeEmail}" style="display:inline-block;background:linear-gradient(135deg,#6d7c2b,#8fa33b);color:#fff;font-weight:600;font-size:14px;padding:11px 26px;border-radius:10px;text-decoration:none">Reply to ${safeName}</a>
      </div>
    </div>
  `;

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: FROM,
      to: "support@shiprion.com",
      subject: `Shiprion — New message from ${safeName}`,
      html,
    });
    logger.info({ name, email }, "Contact notification email sent via SMTP");
  } catch (err) {
    logger.error(
      { name, email, err },
      "Failed to send contact notification email via SMTP",
    );
  }
}

export async function sendRawEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (!isEmailConfigured()) throw new Error("SMTP is not configured");
  await createTransporter().sendMail({ from: FROM, to, subject, html });
}
