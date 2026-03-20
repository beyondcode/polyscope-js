/**
 * URL matching utilities for comparing preview URLs.
 *
 * Preview URLs use templates with dynamic worktree folder names, e.g.:
 *   http://localhost:5173?workspace=sleek-koala
 *   http://localhost:3000/sleek-koala
 *
 * Workspace lookup (`findWorkspacesByPreviewUrl`) normalizes the tab URL to the
 * site base (origin + `/`, query preserved) so `/dashboard` matches a preview
 * configured as `https://example.com`.
 *
 * Matching compares URL origins and paths, with flexible query parameter
 * matching — the candidate URL may have additional query params beyond what
 * the workspace preview URL contains, and that's OK.
 */

/**
 * Parse a URL string into its components. Returns null if the URL is invalid.
 */
function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Normalize a pathname by removing trailing slashes (except for root "/").
 */
function normalizePath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

/**
 * Strip path and hash for workspace lookup: same origin and query as `url`,
 * pathname `/`. Matches previews saved as the site root (typical).
 */
export function toPreviewLookupUrl(url: string): string | null {
  const u = tryParseUrl(url);
  if (!u) return null;
  u.pathname = "/";
  u.hash = "";
  return u.toString();
}

/**
 * Check if a workspace's preview URL matches a given target URL.
 *
 * Matching rules:
 * 1. Origins (protocol + host + port) must match exactly
 * 2. Pathnames must match (normalized, trailing slashes ignored)
 * 3. All query parameters in the preview URL must be present in the target URL
 *    with the same values. The target URL may have additional query params.
 */
export function previewUrlMatches(
  previewUrl: string,
  targetUrl: string,
): boolean {
  const preview = tryParseUrl(previewUrl);
  const target = tryParseUrl(targetUrl);

  if (!preview || !target) return false;

  // Origins must match (protocol + hostname + port)
  if (preview.origin !== target.origin) return false;

  if (normalizePath(preview.pathname) !== normalizePath(target.pathname)) {
    return false;
  }

  // All query params from the preview URL must exist in the target URL
  for (const [key, value] of preview.searchParams) {
    if (target.searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}
