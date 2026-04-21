/**
 * Validate and normalize GitHub public repository URLs and optional doc links.
 */

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com'])

function stripGitSuffix(segment: string): string {
  return segment.endsWith('.git') ? segment.slice(0, -4) : segment
}

/**
 * Parses a user-supplied GitHub repo URL into a canonical https://github.com/owner/repo form.
 * Accepts optional scheme; rejects non-repo paths beyond owner/repo (extra segments are ignored
 * if the URL is a deep link — we still normalize to the repository root).
 */
export function parseGithubRepoUrl(
  input: string
): { ok: true; normalized: string } | { ok: false; error: string } {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: 'GitHub repository URL is required' }
  }

  let urlStr = trimmed
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`
  }

  let u: URL
  try {
    u = new URL(urlStr)
  } catch {
    return { ok: false, error: 'Enter a valid URL' }
  }

  const host = u.hostname.toLowerCase()
  if (!GITHUB_HOSTS.has(host)) {
    return {
      ok: false,
      error: 'Use a public GitHub repository URL (github.com/owner/repo)',
    }
  }

  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length < 2) {
    return { ok: false, error: 'Path must look like github.com/owner/repo' }
  }

  const owner = parts[0]
  let repo = stripGitSuffix(parts[1])
  if (!owner || !repo) {
    return { ok: false, error: 'Invalid owner or repository name' }
  }

  // GitHub username/org rules (simplified): alphanumeric + hyphens, no consecutive dots edge cases
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(owner)) {
    return { ok: false, error: 'Invalid GitHub owner or organization name' }
  }

  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(repo)) {
    return { ok: false, error: 'Invalid repository name' }
  }

  const normalized = `https://github.com/${owner}/${repo}`
  return { ok: true, normalized }
}

/**
 * Optional http(s) URL for changelog or documentation fields.
 */
export function parseOptionalHttpUrl(
  raw: string | undefined | null
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = raw?.trim()
  if (!s) return { ok: true, value: null }

  let withScheme = s
  if (!/^https?:\/\//i.test(withScheme)) {
    withScheme = `https://${withScheme}`
  }

  try {
    const u = new URL(withScheme)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, error: 'Only http and https links are allowed' }
    }
    return { ok: true, value: u.href }
  } catch {
    return { ok: false, error: 'Enter a valid URL' }
  }
}
