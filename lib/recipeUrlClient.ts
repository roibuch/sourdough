import { getBasePath } from "@/lib/basePath";

/** Pathname relative to Next basePath (trailing slash). */
export function getClientPathname(): string {
  if (typeof window === "undefined") return "/";
  const base = getBasePath();
  let path = window.location.pathname;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  if (!path.endsWith("/")) path = `${path}/`;
  return path;
}

export function getClientSearchKey(): string {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

/** Full browser URL path + query for `history.replaceState`. */
export function buildRecipeHref(pathname: string, query: string): string {
  const base = getBasePath();
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const path = base ? `${base}${normalized === "/" ? "/" : normalized}` : normalized;
  return query ? `${path}?${query}` : path;
}

export function replaceRecipeUrl(pathname: string, query: string): void {
  if (typeof window === "undefined") return;
  const href = buildRecipeHref(pathname, query);
  window.history.replaceState(null, "", href);
}
