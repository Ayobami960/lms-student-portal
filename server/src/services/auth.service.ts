import bcrypt from "bcrypt";
import crypto from "crypto";

import { ApiError } from "../utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { env } from "../config/env";
import { prisma } from "../config/db";

const SALT_ROUNDS = 12;

function msFromDuration(duration: string): number {
  const match = duration ? duration.match(/^(\d+)([smhd])$/) : null;
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  
  const [, num, unit] = match;
  const n = parseInt(num ?? "",  10);
  
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
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashed,
        role: input.role ?? "STUDENT",
      },
    });

    return authService.issueTokens(user.id, user.role, user.email);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid email or password");

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
        expiresAt: new Date(Date.now() + msFromDuration(env.refreshTokenExpiresIn)),
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
    // In production this would be emailed, not returned. Returned here for local/dev testing only.
    return { token };
  },

  async resetPassword(token: string, newPassword: string) {
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw ApiError.badRequest("Reset token is invalid or expired");
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
      prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
    ]);
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
