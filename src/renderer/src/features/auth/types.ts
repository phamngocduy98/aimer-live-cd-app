export type UserRole = "admin" | "member";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

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

export const guestSession: SessionState = {
  user: null,
  role: "guest",
  canAccessAdmin: false,
  canAccessPaidMedia: false
};

export const canPlayPaidMedia = (session: SessionState): boolean => session.canAccessPaidMedia;
