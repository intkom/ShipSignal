import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, validateScopes, parseJsonBody } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { transformGithubProjectFromDb, type DbGithubProject } from '@/lib/utils'
import { parseGithubRepoUrl, parseOptionalHttpUrl } from '@/lib/githubProjectUrls'

export const dynamic = 'force-dynamic'

const createGithubProjectSchema = z.object({
  githubRepoUrl: z.string().min(1).max(2048),
  changelogUrl: z.string().max(2048).optional().nullable(),
  documentationUrl: z.string().max(2048).optional().nullable(),
})

export async function GET() {
  try {
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
      if (auth.scopes) {
        validateScopes(auth.scopes, ['projects:read'])
      }
    } catch (authError) {
      const msg = (authError as Error).message
      if (msg === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('github_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const githubProjects = (data || []).map((row) =>
      transformGithubProjectFromDb(row as DbGithubProject)
    )
    return NextResponse.json({ githubProjects })
  } catch (error) {
    console.error('Error fetching github projects:', error)
    return NextResponse.json({ error: 'Failed to fetch GitHub projects' }, { status: 500 })
  }
}

// eslint-disable-next-line max-lines-per-function -- auth + validation + insert in one handler
export async function POST(request: NextRequest) {
  try {
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
      if (auth.scopes) {
        validateScopes(auth.scopes, ['projects:write'])
      }
    } catch (authError) {
      const msg = (authError as Error).message
      if (msg === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jsonResult = await parseJsonBody(request)
    if ('error' in jsonResult) return jsonResult.error

    const parsed = createGithubProjectSchema.safeParse(jsonResult.data)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const repo = parseGithubRepoUrl(parsed.data.githubRepoUrl)
    if (!repo.ok) {
      return NextResponse.json({ error: repo.error }, { status: 400 })
    }

    const changelog = parseOptionalHttpUrl(parsed.data.changelogUrl ?? null)
    if (!changelog.ok) {
      return NextResponse.json({ error: changelog.error }, { status: 400 })
    }

    const docs = parseOptionalHttpUrl(parsed.data.documentationUrl ?? null)
    if (!docs.ok) {
      return NextResponse.json({ error: docs.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('github_projects')
      .insert({
        user_id: userId,
        github_repo_url: repo.normalized,
        changelog_url: changelog.value,
        documentation_url: docs.value,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This repository is already connected to your account.' },
          { status: 409 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const githubProject = transformGithubProjectFromDb(data as DbGithubProject)
    return NextResponse.json({ githubProject }, { status: 201 })
  } catch (error) {
    console.error('Error creating github project:', error)
    return NextResponse.json({ error: 'Failed to save GitHub project' }, { status: 500 })
  }
}
