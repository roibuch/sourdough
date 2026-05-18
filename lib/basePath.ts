/** Base path for GitHub Pages (`/sourdough`) or empty for local dev */
export function getBasePath(): string {
  const raw = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim();
  return raw.replace(/\/$/, "");
}
