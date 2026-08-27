export function getMatchHref(matchId: string) {
  return `/discover?match=${encodeURIComponent(matchId)}`;
}

export function isTabActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
