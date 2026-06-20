export function isMobileNavItemActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  if (path === "/playlists") return pathname.startsWith("/playlist");
  if (path === "/albums") return pathname.startsWith("/album");
  if (path === "/videos") return pathname.startsWith("/video");
  return pathname === path || pathname.startsWith(`${path}/`);
}
