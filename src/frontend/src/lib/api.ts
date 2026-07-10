/**
 * REST API base URL.
 * In dev, Vite proxies /api to localhost:3001 — leave empty to use relative paths.
 */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";
