import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logger } from "../utils/logger.js";

const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SECURE, SENDER_EMAIL } = process.env;

export const isEmailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

export const transporter: Transporter | null =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: SMTP_SECURE === "true", // true for port 465, false for 587/others (STARTTLS)
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

if (!isEmailConfigured) {
  logger.warn("SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — emails will be logged, not sent.");
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
  async send({ to, subject, html }: SendEmailInput) {
    if (!transporter) {
      logger.info(`[email skipped — SMTP not configured] to=${to} subject="${subject}"`);
      return null;
    }

    try {
      return await transporter.sendMail({
        from: SENDER_EMAIL,
        to,
        subject,
        html,
      });
    } catch (err) {
      logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      return null;
    }
  },
};