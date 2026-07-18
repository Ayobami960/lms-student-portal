import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { authService } from "../services/auth.service";
import { env } from "../config/env";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { accessToken, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { accessToken }, "Registration successful", 201);
  }),

  login: asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.login(req.body.email, req.body.password);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    }, "Login successful");
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body.refreshToken;
    const { accessToken, refreshToken } = await authService.refresh(token);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { accessToken }, "Token refreshed");
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
    sendSuccess(res, null, "Logged out successfully");
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    // token only returned here for local/dev convenience; production would email it
    sendSuccess(res, env.isProduction ? null : result, "If that account exists, a reset link has been sent");
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, "Password reset successful");
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.sub);
    sendSuccess(res, user, "Current user retrieved");
  }),
};
