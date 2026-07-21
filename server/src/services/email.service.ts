import { transporter, isEmailConfigured } from "../config/email.js";

import { logger } from "../utils/logger.js";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
 
  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    if (!isEmailConfigured || !transporter) {
      logger.info({ to, subject }, "[email:skipped — SMTP not configured] would have sent");
      return;
    }
    try {
      await transporter.sendMail({ from: process.env.emailFrom, to, subject, html });
      logger.info({ to, subject }, "Email sent");
    } catch (err) {
      logger.error({ err, to, subject }, "Failed to send email");
    }
  },

  /**
   * Fans an email out to many recipients (course-published notices,
   * maintenance-mode broadcasts, announcements). Sends are best-effort and
   * run with limited concurrency so a broadcast to thousands of users
   * doesn't open thousands of SMTP connections at once.
   */
  async sendBulk(recipients: string[], subject: string, html: string, concurrency = 10): Promise<void> {
    let index = 0;
    async function worker() {
      while (index < recipients.length) {
        const to = recipients[index++];
        if (!to) continue;
        await emailService.send({ to, subject, html });
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, recipients.length) }, worker));
  },
};