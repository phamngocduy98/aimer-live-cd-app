import { model, Schema } from "mongoose";

export type UserRole = "admin" | "member";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

export interface IUser {
  username: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  enabled: boolean;
  subscription: {
    plan: string;
    status: SubscriptionStatus;
    currentPeriodEnd?: Date;
  };
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    passwordSalt: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      required: true,
      default: "member"
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true
    },
    subscription: {
      plan: {
        type: String,
        required: true,
        default: "free"
      },
      status: {
        type: String,
        enum: ["none", "trialing", "active", "past_due", "canceled"],
        required: true,
        default: "none"
      },
      currentPeriodEnd: {
        type: Date
      }
    },
    refreshTokenHash: {
      type: String
    },
    refreshTokenExpiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema, "users");
