import nodemailer from "nodemailer";
import { escapeHtml } from "../utils/helpers";

const smtpConfigured = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const sendMail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!smtpConfigured()) {
    // No SMTP set up: just log, so the app still works in development.
    console.log(`[email skipped - SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

// Tells a student whether their application was accepted or rejected.
// Never throws: a failed email must not break the status update itself.
export const sendApplicationStatusEmail = async (params: {
  to: string;
  studentName: string;
  jobTitle: string;
  status: "ACCEPTED" | "REJECTED";
}): Promise<void> => {
  const accepted = params.status === "ACCEPTED";
  const subject = accepted
    ? `Good news! Your application for "${params.jobTitle}" was accepted`
    : `Update on your application for "${params.jobTitle}"`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px;">
      <h2 style="color: ${accepted ? "#15803d" : "#b91c1c"};">
        Application ${accepted ? "accepted" : "not selected"}
      </h2>
      <p>Hi ${escapeHtml(params.studentName)},</p>
      <p>Your application for <strong>${escapeHtml(params.jobTitle)}</strong> has been
      <strong>${accepted ? "accepted" : "rejected"}</strong>.</p>
      <p>${
        accepted
          ? "The client will contact you soon. Congratulations!"
          : "Don't be discouraged - there are many more jobs waiting for you."
      }</p>
      <p style="color:#6b7280;">- Student Freelance Job Board</p>
    </div>`;

  try {
    await sendMail(params.to, subject, html);
  } catch (error) {
    console.error("Failed to send status email:", error);
  }
};