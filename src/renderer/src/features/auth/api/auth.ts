import { apiClient } from "@lib/axios";
import { guestSession, type SessionState } from "../types";

export const refreshSession = async (): Promise<SessionState> =>
  (await apiClient.post<SessionState>("/auth/refresh")).data;

export const getSession = async (): Promise<SessionState> => {
  const session = (await apiClient.get<SessionState>("/auth/me")).data;
  if (session.user) return session;
  try {
    return await refreshSession();
  } catch {
    return guestSession;
  }
};

export const login = async (username: string, password: string): Promise<SessionState> =>
  (await apiClient.post<SessionState>("/auth/login", { username, password })).data;

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};
