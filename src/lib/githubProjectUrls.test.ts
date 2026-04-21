import { describe, it, expect } from 'vitest'
import { parseGithubRepoUrl, parseOptionalHttpUrl } from './githubProjectUrls'

describe('parseGithubRepoUrl', () => {
  it('normalizes https github.com owner/repo', () => {
    const r = parseGithubRepoUrl('https://github.com/acme/widget')
    expect(r).toEqual({ ok: true, normalized: 'https://github.com/acme/widget' })
  })

  it('adds https when scheme omitted', () => {
    const r = parseGithubRepoUrl('github.com/acme/widget')
    expect(r).toEqual({ ok: true, normalized: 'https://github.com/acme/widget' })
  })

  it('strips .git suffix', () => {
    const r = parseGithubRepoUrl('https://github.com/acme/widget.git')
    expect(r).toEqual({ ok: true, normalized: 'https://github.com/acme/widget' })
  })

  it('accepts www.github.com', () => {
    const r = parseGithubRepoUrl('https://www.github.com/acme/widget/')
    expect(r).toEqual({ ok: true, normalized: 'https://github.com/acme/widget' })
  })

  it('rejects empty', () => {
    const r = parseGithubRepoUrl('   ')
    expect(r.ok).toBe(false)
  })

  it('rejects non-github host', () => {
    const r = parseGithubRepoUrl('https://gitlab.com/acme/widget')
    expect(r.ok).toBe(false)
  })

  it('rejects missing repo segment', () => {
    const r = parseGithubRepoUrl('https://github.com/acme')
    expect(r.ok).toBe(false)
  })
})

describe('parseOptionalHttpUrl', () => {
  it('returns null for empty', () => {
    expect(parseOptionalHttpUrl('')).toEqual({ ok: true, value: null })
    expect(parseOptionalHttpUrl(null)).toEqual({ ok: true, value: null })
  })

  it('normalizes optional https', () => {
    const r = parseOptionalHttpUrl('example.com/changelog')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toMatch(/^https:\/\/example\.com\/changelog/)
  })

  it('rejects invalid', () => {
    const r = parseOptionalHttpUrl('not a url')
    expect(r.ok).toBe(false)
  })
})
