import type { Request, Response, NextFunction } from "express";
import { fail } from "../utils/reqUtils.js";
import { loadSessionFromCookie, type SessionState } from "../services/authService.js";

export interface AuthenticatedRequest extends Request {
  auth: SessionState;
}

export async function attachSession(req: Request, _res: Response, next: NextFunction) {
  try {
    (req as AuthenticatedRequest).auth = await loadSessionFromCookie(req.headers.cookie);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = (req as AuthenticatedRequest).auth;
  if (!session?.user) {
    return fail(res, "Authentication required", 401);
  }
  if (!session.canAccessAdmin) {
    return fail(res, "Admin access required", 403);
  }
  next();
}

export function requirePaidMedia(req: Request, res: Response, next: NextFunction) {
  const session = (req as AuthenticatedRequest).auth;
  if (!session?.user) {
    return fail(res, "Authentication required", 401);
  }
  if (!session.canAccessPaidMedia) {
    return fail(res, "Subscription required", 403);
  }
  next();
}
