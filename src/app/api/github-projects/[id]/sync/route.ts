import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { fetchGithubActivity } from '@/lib/githubImporter'
import { transformGithubActivityFromDb, type DbGithubActivity } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verify the project belongs to this user
    const { data: project, error: projectError } = await supabase
      .from('github_projects')
      .select('id, github_repo_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch activity from GitHub
    let activity: Awaited<ReturnType<typeof fetchGithubActivity>>
    try {
      activity = await fetchGithubActivity(project.github_repo_url)
    } catch (err) {
      console.error('GitHub fetch error:', err)
      return NextResponse.json(
        { error: 'Failed to fetch activity from GitHub. The repository may be private or empty.' },
        { status: 422 }
      )
    }

    // Upsert — one row per project, replaced on each sync
    const { data, error } = await supabase
      .from('github_activity')
      .upsert(
        {
          user_id: userId,
          github_project_id: id,
          source_type: activity.sourceType,
          raw_text: activity.rawText,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'github_project_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      githubActivity: transformGithubActivityFromDb(data as DbGithubActivity),
    })
  } catch (error) {
    console.error('Error syncing github project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
