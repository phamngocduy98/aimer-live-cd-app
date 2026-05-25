import { createContext, useContext, ReactNode } from "react";

export interface PlaylistRefreshContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
}

const PlaylistRefreshContext = createContext<PlaylistRefreshContextValue | null>(null);

export const PlaylistRefreshProvider = ({
  children,
  value
}: {
  children: ReactNode;
  value: PlaylistRefreshContextValue;
}) => {
  return (
    <PlaylistRefreshContext.Provider value={value}>{children}</PlaylistRefreshContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlaylistRefresh = () => {
  const ctx = useContext(PlaylistRefreshContext);
  if (!ctx) throw new Error("usePlaylistRefresh must be used within PlaylistRefreshProvider");
  return ctx;
};
