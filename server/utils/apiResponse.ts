import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message = "Request successful", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: { page: number; limit: number; total: number },
  message = "Request successful"
) {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit) || 1,
    },
  });
}
