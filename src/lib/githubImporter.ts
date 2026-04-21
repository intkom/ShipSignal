/**
 * Fetches public activity from a GitHub repository using the REST API (no auth required).
 * Falls back: latest release → last 5 merged PRs → last 5 commits.
 * Returns structured source material ready to pass to an LLM.
 */

const GH_API = 'https://api.github.com'

const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

export type GithubActivitySourceType = 'release' | 'prs' | 'commits'

export interface GithubActivityResult {
  sourceType: GithubActivitySourceType
  rawText: string
}

function ownerRepo(repoUrl: string): { owner: string; repo: string } {
  const parts = repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '').split('/')
  return { owner: parts[0], repo: parts[1] }
}

async function fetchLatestRelease(
  owner: string,
  repo: string
): Promise<GithubActivityResult | null> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/releases/latest`, {
    headers: GH_HEADERS,
    next: { revalidate: 0 },
  })
  if (!res.ok) return null

  const release = (await res.json()) as {
    tag_name: string
    name: string | null
    body: string | null
    published_at: string
  }

  const title = release.name || release.tag_name
  const body = release.body?.trim() || '(no release notes)'
  const rawText = `Release: ${title} (${release.published_at.slice(0, 10)})\n\n${body}`
  return { sourceType: 'release', rawText }
}

async function fetchMergedPRs(owner: string, repo: string): Promise<GithubActivityResult | null> {
  const res = await fetch(
    `${GH_API}/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=5`,
    { headers: GH_HEADERS, next: { revalidate: 0 } }
  )
  if (!res.ok) return null

  const prs = (await res.json()) as Array<{
    number: number
    title: string
    merged_at: string | null
    body: string | null
  }>

  const merged = prs.filter((pr) => pr.merged_at)
  if (merged.length === 0) return null

  const lines = merged.map(
    (pr) => `- #${pr.number}: ${pr.title} (merged ${pr.merged_at!.slice(0, 10)})`
  )
  return { sourceType: 'prs', rawText: `Recent merged pull requests:\n\n${lines.join('\n')}` }
}

async function fetchCommits(owner: string, repo: string): Promise<GithubActivityResult> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/commits?per_page=5`, {
    headers: GH_HEADERS,
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${res.statusText}`)
  }

  const commits = (await res.json()) as Array<{
    sha: string
    commit: { message: string; author: { date: string } }
  }>

  if (commits.length === 0) throw new Error('No commits found in repository')

  const lines = commits.map((c) => {
    const msg = c.commit.message.split('\n')[0]
    const date = c.commit.author.date.slice(0, 10)
    return `- ${msg} (${date})`
  })

  return { sourceType: 'commits', rawText: `Recent commits:\n\n${lines.join('\n')}` }
}

export async function fetchGithubActivity(repoUrl: string): Promise<GithubActivityResult> {
  const { owner, repo } = ownerRepo(repoUrl)

  const release = await fetchLatestRelease(owner, repo)
  if (release) return release

  const prs = await fetchMergedPRs(owner, repo)
  if (prs) return prs

  return fetchCommits(owner, repo)
}
