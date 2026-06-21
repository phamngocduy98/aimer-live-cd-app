import crypto from "node:crypto";
import { promisify } from "node:util";
import { User, type IUser, type SubscriptionStatus, type UserRole } from "../models/User.js";

const scryptAsync = promisify(crypto.scrypt);
const SESSION_COOKIE = "music_session";
const REFRESH_COOKIE = "music_refresh";
const SESSION_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface PublicUser {
  _id: string;
  username: string;
  displayName: string;
  role: UserRole;
  enabled: boolean;
  subscription: {
    plan: string;
    status: SubscriptionStatus;
    currentPeriodEnd?: string;
  };
}

export interface SessionState {
  user: PublicUser | null;
  role: UserRole | "guest";
  canAccessAdmin: boolean;
  canAccessPaidMedia: boolean;
}

interface SessionPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export const authCookieName = SESSION_COOKIE;
export const refreshCookieName = REFRESH_COOKIE;

function cookieAttributes(maxAgeSeconds: number): string {
  const isE2e = process.env.E2E_TEST_MODE === "true";
  const sameSite =
    isE2e ? "None" :
    process.env.AUTH_COOKIE_SAMESITE ?? (process.env.NODE_ENV === "production" ? "None" : "Lax");
  const secure =
    isE2e ? true :
    process.env.AUTH_COOKIE_SECURE === "true" ||
    (process.env.AUTH_COOKIE_SECURE !== "false" && sameSite.toLowerCase() === "none");
  return [
    "HttpOnly",
    "Path=/",
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET ?? process.env.DB_STORE_PW;
  if (!secret) throw new Error("Missing AUTH_SESSION_SECRET or DB_STORE_PW");
  return secret;
}

function base64Url(input: Buffer | string): string {
  return typeof input === "string" ? Buffer.from(input).toString("base64url") : input.toString("base64url");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return { hash: key.toString("hex"), salt };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(key.toString("hex"), hash);
}

export function isPaidUser(user: Pick<IUser, "role" | "subscription" | "enabled">): boolean {
  if (!user.enabled) return false;
  if (user.role === "admin") return true;
  if (!["active", "trialing"].includes(user.subscription?.status)) return false;
  const end = user.subscription?.currentPeriodEnd;
  return !end || end.getTime() > Date.now();
}

export function toPublicUser(user: IUser & { _id: unknown }): PublicUser {
  return {
    _id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    enabled: user.enabled,
    subscription: {
      plan: user.subscription?.plan ?? "free",
      status: user.subscription?.status ?? "none",
      ...(user.subscription?.currentPeriodEnd
        ? { currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString() }
        : {})
    }
  };
}

export function sessionForUser(user: (IUser & { _id: unknown }) | null): SessionState {
  if (!user || !user.enabled) {
    return {
      user: null,
      role: "guest",
      canAccessAdmin: false,
      canAccessPaidMedia: false
    };
  }

  return {
    user: toPublicUser(user),
    role: user.role,
    canAccessAdmin: user.role === "admin",
    canAccessPaidMedia: isPaidUser(user)
  };
}

export function createSessionToken(userId: string): string {
  const issuedAt = Date.now();
  const payload = base64Url(
    JSON.stringify({
      userId,
      issuedAt,
      expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS * 1000
    } satisfies SessionPayload)
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !timingSafeEqual(sign(payload), signature)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [name, ...rest] = item.split("=");
        return [decodeURIComponent(name), decodeURIComponent(rest.join("="))];
      })
  );
}

export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieAttributes(
    SESSION_MAX_AGE_SECONDS
  )}`;
}

export function buildExpiredSessionCookie(): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes(0)}`;
}

function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function buildRefreshCookie(token: string): string {
  return `${REFRESH_COOKIE}=${encodeURIComponent(token)}; ${cookieAttributes(
    REFRESH_MAX_AGE_SECONDS
  )}`;
}

export function buildExpiredRefreshCookie(): string {
  return `${REFRESH_COOKIE}=; ${cookieAttributes(0)}`;
}

export function buildAuthCookies(sessionToken: string, refreshToken: string): string[] {
  return [buildSessionCookie(sessionToken), buildRefreshCookie(refreshToken)];
}

export function buildExpiredAuthCookies(): string[] {
  return [buildExpiredSessionCookie(), buildExpiredRefreshCookie()];
}

export async function issueRefreshToken(user: IUser & { _id: unknown }): Promise<string> {
  const refreshToken = createRefreshToken();
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_MAX_AGE_SECONDS * 1000);
  await (user as any).save();
  return refreshToken;
}

export async function rotateRefreshToken(cookieHeader: string | undefined): Promise<{
  user: (IUser & { _id: unknown }) | null;
  sessionToken?: string;
  refreshToken?: string;
}> {
  const refreshToken = parseCookies(cookieHeader)[REFRESH_COOKIE];
  if (!refreshToken) return { user: null };

  const user = await User.findOne({
    refreshTokenHash: hashRefreshToken(refreshToken),
    refreshTokenExpiresAt: { $gt: new Date() }
  }).exec();
  if (!user || !user.enabled) return { user: null };

  const nextRefreshToken = await issueRefreshToken(user);
  return {
    user,
    sessionToken: createSessionToken(String(user._id)),
    refreshToken: nextRefreshToken
  };
}

export async function revokeRefreshToken(cookieHeader: string | undefined): Promise<void> {
  const refreshToken = parseCookies(cookieHeader)[REFRESH_COOKIE];
  if (!refreshToken) return;
  await User.updateOne(
    { refreshTokenHash: hashRefreshToken(refreshToken) },
    { $unset: { refreshTokenHash: "", refreshTokenExpiresAt: "" } }
  ).exec();
}

export async function loadSessionFromCookie(cookieHeader: string | undefined): Promise<SessionState> {
  const payload = verifySessionToken(parseCookies(cookieHeader)[SESSION_COOKIE]);
  if (!payload) return sessionForUser(null);
  const user = await User.findById(payload.userId).exec();
  return sessionForUser(user);
}

export async function seedFirstAdmin(): Promise<void> {
  const existingAdmin = await User.exists({ role: "admin" });
  if (existingAdmin) return;

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const { hash, salt } = await hashPassword(password);
  await User.updateOne(
    { username },
    {
      $set: {
        username,
        displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || username,
        passwordHash: hash,
        passwordSalt: salt,
        role: "admin",
        enabled: true,
        subscription: { plan: "admin", status: "active" }
      }
    },
    { upsert: true }
  );
}
