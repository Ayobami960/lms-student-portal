import { renderEmailLayout } from "./layout.js";


// Each function returns { subject, html } for one transactional email.
// Keeping every template in one place makes it trivial to audit what the
// platform sends and keeps the visual style consistent (see layout.ts).

export const emailTemplates = {
  welcome(name: string) {
    return {
      subject: "Welcome to LMS Platform 🎉",
      html: renderEmailLayout({
        title: `Welcome, ${name}!`,
        bodyHtml: `<p>Your account has been created successfully. You can now browse courses, track your progress, and start learning right away.</p>`,
        ctaLabel: "Go to my dashboard",
        ctaUrl: `${process.env.studentAppUrl}/dashboard`,
      }),
    };
  },

  forgotPassword(name: string, resetUrl: string) {
    return {
      subject: "Reset your password",
      html: renderEmailLayout({
        title: `Hi ${name}, reset your password`,
        bodyHtml: `<p>We received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't be changed.</p>`,
        ctaLabel: "Reset password",
        ctaUrl: resetUrl,
      }),
    };
  },

  passwordResetConfirmation(name: string) {
    return {
      subject: "Your password was changed",
      html: renderEmailLayout({
        title: `Hi ${name}, your password was updated`,
        bodyHtml: `<p>This is a confirmation that your password was just changed. If you didn't make this change, please contact support immediately.</p>`,
      }),
    };
  },

  enrollmentConfirmation(name: string, courseTitle: string, courseId: string) {
    return {
      subject: `You're enrolled in ${courseTitle}`,
      html: renderEmailLayout({
        title: `You're in, ${name}!`,
        bodyHtml: `<p>You've successfully enrolled in <strong>${courseTitle}</strong>. Jump in whenever you're ready — your progress is tracked automatically as you go.</p>`,
        ctaLabel: "Start learning",
        ctaUrl: `${process.env.studentAppUrl}/courses/${courseId}`,
      }),
    };
  },

  newCoursePublished(studentName: string, courseTitle: string, instructorName: string, courseId: string) {
    return {
      subject: `New course published: ${courseTitle}`,
      html: renderEmailLayout({
        title: `${courseTitle} is now live`,
        bodyHtml: `<p>Hi ${studentName}, a new course from ${instructorName} is now available:</p><p style="font-weight:600;font-size:16px;">${courseTitle}</p>`,
        ctaLabel: "View course",
        ctaUrl: `${process.env.studentAppUrl}/courses/${courseId}`,
      }),
    };
  },

  courseCompletionStudent(name: string, courseTitle: string) {
    return {
      subject: `Congratulations — you completed ${courseTitle}! 🎓`,
      html: renderEmailLayout({
        title: `Well done, ${name}!`,
        bodyHtml: `<p>You've completed <strong>${courseTitle}</strong>. Once your remaining assignments are approved by your instructor, your certificate will be ready to download.</p>`,
        ctaLabel: "View my progress",
        ctaUrl: `${process.env.studentAppUrl}/dashboard`,
      }),
    };
  },

  courseCompletionInstructor(instructorName: string, studentName: string, courseTitle: string) {
    return {
      subject: `${studentName} completed ${courseTitle}`,
      html: renderEmailLayout({
        title: `Hi ${instructorName}`,
        bodyHtml: `<p><strong>${studentName}</strong> just completed all lessons in <strong>${courseTitle}</strong>.</p>`,
      }),
    };
  },

  assignmentApproved(name: string, assignmentTitle: string, score: number, maxScore: number, feedback?: string) {
    return {
      subject: `Assignment approved: ${assignmentTitle}`,
      html: renderEmailLayout({
        title: `Your assignment was approved ✅`,
        bodyHtml: `<p>Hi ${name}, <strong>${assignmentTitle}</strong> has been approved with a score of <strong>${score}/${maxScore}</strong>.</p>${
          feedback ? `<p style="background:#f9fafb;border-radius:8px;padding:12px;">Instructor feedback: ${feedback}</p>` : ""
        }`,
        ctaLabel: "View assignments",
        ctaUrl: `${process.env.studentAppUrl}/assignments`,
      }),
    };
  },

  assignmentRejected(name: string, assignmentTitle: string, feedback: string) {
    return {
      subject: `Revision needed: ${assignmentTitle}`,
      html: renderEmailLayout({
        title: `Your assignment needs a revision`,
        bodyHtml: `<p>Hi ${name}, your instructor has asked you to revise <strong>${assignmentTitle}</strong> before it can be approved.</p><p style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;">Feedback: ${feedback}</p>`,
        ctaLabel: "Resubmit assignment",
        ctaUrl: `${process.env.studentAppUrl}/assignments`,
      }),
    };
  },

  certificateApproved(name: string, courseTitle: string) {
    return {
      subject: `Your certificate for ${courseTitle} is ready 🏆`,
      html: renderEmailLayout({
        title: `Certificate unlocked!`,
        bodyHtml: `<p>Congratulations ${name} — your certificate for <strong>${courseTitle}</strong> is ready to view and download.</p>`,
        ctaLabel: "View certificate",
        ctaUrl: `${process.env.studentAppUrl}/certificates`,
      }),
    };
  },

  adminInvitation(inviterName: string, inviteUrl: string) {
    return {
      subject: `You've been invited to join LMS Platform as an Admin`,
      html: renderEmailLayout({
        title: `Admin invitation`,
        bodyHtml: `<p>${inviterName} has invited you to join LMS Platform as an administrator. This link expires in 48 hours.</p>`,
        ctaLabel: "Accept invitation",
        ctaUrl: inviteUrl,
      }),
    };
  },

  instructorApproved(name: string) {
    return {
      subject: `Your instructor account has been approved`,
      html: renderEmailLayout({
        title: `You're approved, ${name}!`,
        bodyHtml: `<p>An administrator has approved your instructor account. You now have full access to create and manage courses.</p>`,
        ctaLabel: "Go to dashboard",
        ctaUrl: `${process.env.studentAppUrl}/dashboard`,
      }),
    };
  },

  accountActivated(name: string) {
    return {
      subject: `Your account has been reactivated`,
      html: renderEmailLayout({
        title: `Welcome back, ${name}`,
        bodyHtml: `<p>Your account has been reactivated and you can log in again.</p>`,
        ctaLabel: "Log in",
        ctaUrl: `${process.env.studentAppUrl}/login`,
      }),
    };
  },

  accountDeactivated(name: string) {
    return {
      subject: `Your account has been deactivated`,
      html: renderEmailLayout({
        title: `Hi ${name}`,
        bodyHtml: `<p>Your account has been deactivated by an administrator and you will not be able to log in. If you believe this is a mistake, please contact support.</p>`,
      }),
    };
  },

  maintenanceStarting(message?: string) {
    return {
      subject: `Scheduled maintenance — LMS Platform will be briefly unavailable`,
      html: renderEmailLayout({
        title: `We're performing maintenance`,
        bodyHtml: `<p>LMS Platform is temporarily undergoing maintenance and may be unavailable.</p>${message ? `<p>${message}</p>` : ""}`,
      }),
    };
  },

  maintenanceOver() {
    return {
      subject: `LMS Platform is back online`,
      html: renderEmailLayout({
        title: `We're back!`,
        bodyHtml: `<p>Maintenance is complete and LMS Platform is fully available again. Thanks for your patience.</p>`,
        ctaLabel: "Go to dashboard",
        ctaUrl: `${process.env.studentAppUrl}/dashboard`,
      }),
    };
  },

  announcement(title: string, message: string) {
    return {
      subject: title,
      html: renderEmailLayout({ title, bodyHtml: `<p>${message}</p>` }),
    };
  },
};
