import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppDispatch } from "@app/hooks";
import { queryClient } from "@lib/queryClient";
import { getSession, login, logout } from "../api/auth";
import { setSession } from "../store/authSlice";
import { setPlaybackAccess } from "@features/player/store/playerSlice";
import { guestSession } from "../types";

export const authKeys = {
  session: ["auth", "session"] as const
};

export function useSession() {
  const dispatch = useAppDispatch();
  const query = useQuery({
    queryKey: authKeys.session,
    queryFn: getSession,
    staleTime: 30_000
  });
  const session = query.data ?? guestSession;

  useEffect(() => {
    dispatch(setSession(session));
    dispatch(setPlaybackAccess({ canAccessPaidMedia: session.canAccessPaidMedia }));
  }, [dispatch, session]);

  return { ...query, session };
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: async (session) => {
      queryClient.setQueryData(authKeys.session, session);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(authKeys.session, guestSession);
      await queryClient.invalidateQueries();
    }
  });
}
