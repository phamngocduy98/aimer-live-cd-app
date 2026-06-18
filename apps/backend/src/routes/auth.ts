import { User, type SubscriptionStatus, type UserRole } from "../models/User.js";
import {
  buildAuthCookies,
  buildExpiredAuthCookies,
  createSessionToken,
  hashPassword,
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  sessionForUser,
  toPublicUser,
  verifyPassword
} from "../services/authService.js";
import { fail, ok } from "../utils/reqUtils.js";

const subscriptionStatuses: SubscriptionStatus[] = [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled"
];

function compactString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "member";
}

function parseSubscription(body: any) {
  const status = subscriptionStatuses.includes(body?.subscription?.status)
    ? body.subscription.status
    : "none";
  const currentPeriodEnd = compactString(body?.subscription?.currentPeriodEnd);
  return {
    plan: compactString(body?.subscription?.plan) ?? "free",
    status,
    ...(currentPeriodEnd ? { currentPeriodEnd: new Date(currentPeriodEnd) } : {})
  };
}

export async function handleLogin(req, res) {
  const username = compactString(req.body?.username)?.toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) return fail(res, "Username and password are required", 400);

  const user = await User.findOne({ username }).exec();
  if (!user || !user.enabled) return fail(res, "Invalid username or password", 401);
  if (!(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
    return fail(res, "Invalid username or password", 401);
  }

  const refreshToken = await issueRefreshToken(user);
  res.setHeader("Set-Cookie", buildAuthCookies(createSessionToken(user.id), refreshToken));
  res.json(sessionForUser(user));
}

export async function handleRefresh(req, res) {
  const result = await rotateRefreshToken(req.headers.cookie);
  if (!result.user || !result.sessionToken || !result.refreshToken) {
    res.setHeader("Set-Cookie", buildExpiredAuthCookies());
    return fail(res, "Refresh token is invalid or expired", 401);
  }

  res.setHeader("Set-Cookie", buildAuthCookies(result.sessionToken, result.refreshToken));
  res.json(sessionForUser(result.user));
}

export async function handleLogout(req, res) {
  await revokeRefreshToken(req.headers.cookie);
  res.setHeader("Set-Cookie", buildExpiredAuthCookies());
  ok(res);
}

export function handleMe(req, res) {
  res.json(req.auth ?? sessionForUser(null));
}

export async function handleAdminListUsers(_req, res) {
  const users = await User.find({}).sort({ username: 1 }).exec();
  res.json(users.map(toPublicUser));
}

export async function handleAdminCreateUser(req, res) {
  const username = compactString(req.body?.username)?.toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) return fail(res, "Username and password are required", 400);

  const { hash, salt } = await hashPassword(password);
  try {
    const user = await new User({
      username,
      displayName: compactString(req.body?.displayName) ?? username,
      passwordHash: hash,
      passwordSalt: salt,
      role: parseRole(req.body?.role),
      enabled: req.body?.enabled !== false,
      subscription: parseSubscription(req.body)
    }).save();
    res.json(toPublicUser(user));
  } catch (error: any) {
    if (error?.code === 11000) return fail(res, "Username already exists", 409);
    throw error;
  }
}

export async function handleAdminUpdateUser(req, res) {
  const user = await User.findById(req.params.id).exec();
  if (!user) return fail(res, "User not found", 404);

  const displayName = compactString(req.body?.displayName);
  if (displayName) user.displayName = displayName;
  user.role = parseRole(req.body?.role ?? user.role);
  if (typeof req.body?.enabled === "boolean") user.enabled = req.body.enabled;
  if (req.body?.subscription) user.subscription = parseSubscription(req.body) as any;
  if (typeof req.body?.password === "string" && req.body.password.length > 0) {
    const { hash, salt } = await hashPassword(req.body.password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
  }

  await user.save();
  res.json(toPublicUser(user));
}
