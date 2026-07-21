import bcrypt from "bcrypt";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { prisma } from "../config/db.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";
const STUDENT_APP_URL = process.env.STUDENT_APP_URL ?? "http://localhost:3000";

function msFromDuration(duration: string): number {
  const match = duration ? duration.match(/^(\d+)([smhd])$/) : null;
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const [, num, unit] = match;
  const n = parseInt(num ?? "", 10);

  // Explicitly typing the keys prevents the TypeScript index error
  const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };

  return n * multipliers[unit as keyof typeof multipliers];
}


export const authService = {
  async register(input: { name: string; email: string; password: string; role?: "STUDENT" | "INSTRUCTOR" }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict("An account with this email already exists");

    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    const role = input.role ?? "STUDENT";

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashed,
        role,
        isApproved: role !== "INSTRUCTOR", // instructors need admin approval before dashboard access
      },
    });

    const { subject, html } = emailTemplates.welcome(user.name);
    void emailService.send({ to: user.email, subject, html });
    void notificationService.create(user.id, "GENERAL", "Welcome to LMS Platform", "Your account has been created successfully.");

    return authService.issueTokens(user.id, user.role, user.email);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid email or password");

    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated. Please contact support.");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    const tokens = await authService.issueTokens(user.id, user.role, user.email);
    return { ...tokens, user };
  },

  async issueTokens(userId: string, role: "STUDENT" | "INSTRUCTOR" | "ADMIN", email: string) {
    const accessToken = signAccessToken({ sub: userId, role, email });
    const refreshToken = signRefreshToken(userId);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + msFromDuration(REFRESH_TOKEN_EXPIRES_IN)),
      },
    });

    return { accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized("Refresh token is no longer valid");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw ApiError.unauthorized("User no longer exists");

    // Rotate: remove old token, issue new
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return authService.issueTokens(user.id, user.role, user.email);
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always behave the same way whether or not the user exists (avoid email enumeration)
    if (!user) return { token: null };

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const resetUrl = `${STUDENT_APP_URL}/reset-password?token=${token}`;
    const { subject, html } = emailTemplates.forgotPassword(user.name, resetUrl);
    void emailService.send({ to: user.email, subject, html });

    // In production this would only be emailed, not returned. Returned here for local/dev testing only.
    return { token };
  },

  async resetPassword(token: string, newPassword: string) {
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw ApiError.badRequest("Reset token is invalid or expired");
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
      prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
    ]);

    const { subject, html } = emailTemplates.passwordResetConfirmation(updatedUser.name);
    void emailService.send({ to: updatedUser.email, subject, html });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, isVerified: true, createdAt: true },
    });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },
};