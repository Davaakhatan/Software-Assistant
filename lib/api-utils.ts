// lib/api-utils.ts

import { createApiUrl } from "./url-utils";

/**
 * A drop-in replacement for fetch() that always turns "/api/…"
 * into "https://<your-domain>/api/…", preventing accidental HTML pages.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : createApiUrl(path);

  return fetch(url, options);
}
