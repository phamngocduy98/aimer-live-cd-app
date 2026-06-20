import { describe, expect, it } from "vitest";
import { isMobileNavItemActive } from "./mobileNavigationRoutes";

describe("isMobileNavItemActive", () => {
  it("matches collection routes and their detail routes", () => {
    expect(isMobileNavItemActive("/albums", "/albums")).toBe(true);
    expect(isMobileNavItemActive("/album/album-id", "/albums")).toBe(true);
    expect(isMobileNavItemActive("/playlists", "/playlists")).toBe(true);
    expect(isMobileNavItemActive("/playlist/playlist-id", "/playlists")).toBe(true);
    expect(isMobileNavItemActive("/videos", "/videos")).toBe(true);
    expect(isMobileNavItemActive("/video/video-id", "/videos")).toBe(true);
  });

  it("does not match unrelated routes or partial route names", () => {
    expect(isMobileNavItemActive("/songs", "/")).toBe(false);
    expect(isMobileNavItemActive("/songwriter", "/videos")).toBe(false);
    expect(isMobileNavItemActive("/search", "/videos")).toBe(false);
  });
});
