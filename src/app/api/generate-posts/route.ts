import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, parseJsonBody } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generatePostsFromActivity, type AiPersona } from '@/lib/aiTransformer'
import { transformPostFromDb, type DbPost } from '@/lib/utils'
import type { Post } from '@/lib/posts'

export const dynamic = 'force-dynamic'

const schema = z.object({
  githubProjectId: z.string().uuid(),
})

// eslint-disable-next-line max-lines-per-function -- auth + fetch + AI + multi-insert in one handler
export async function POST(request: NextRequest) {
  try {
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jsonResult = await parseJsonBody(request)
    if ('error' in jsonResult) return jsonResult.error

    const parsed = schema.safeParse(jsonResult.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { githubProjectId } = parsed.data
    const supabase = await createClient()

    // Fetch the project (ownership check)
    const { data: project, error: projectError } = await supabase
      .from('github_projects')
      .select('id, github_repo_url')
      .eq('id', githubProjectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch latest synced activity
    const { data: activity, error: activityError } = await supabase
      .from('github_activity')
      .select('id, raw_text')
      .eq('github_project_id', githubProjectId)
      .eq('user_id', userId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'No activity found. Please sync the project first.' },
        { status: 422 }
      )
    }

    // Fetch user's AI persona (best-effort — fall back to defaults if missing)
    let persona: AiPersona = {}
    const profileRes = await supabase
      .from('user_profiles')
      .select('founder_bio, tone_of_voice, default_hashtags')
      .eq('id', userId)
      .single()
    if (!profileRes.error && profileRes.data) {
      persona = {
        founderBio: profileRes.data.founder_bio,
        toneOfVoice: profileRes.data.tone_of_voice,
        defaultHashtags: profileRes.data.default_hashtags,
      }
    }

    // Generate content via AI
    let generated: Awaited<ReturnType<typeof generatePostsFromActivity>>
    try {
      generated = await generatePostsFromActivity(
        activity.raw_text,
        project.github_repo_url,
        persona
      )
    } catch (err) {
      console.error('AI generation error:', err)
      return NextResponse.json(
        { error: (err as Error).message || 'Failed to generate posts.' },
        { status: 422 }
      )
    }

    const threadGroupId = crypto.randomUUID()
    const sourceNote = `[shipsignal] ${project.github_repo_url}`

    // Build all post inserts
    const twitterPosts = generated.thread.map((text) => ({
      user_id: userId,
      platform: 'twitter' as const,
      status: 'draft' as const,
      content: { text },
      group_id: threadGroupId,
      group_type: 'twitter-thread' as const,
      notes: sourceNote,
      github_activity_id: activity.id,
    }))

    const linkedinPost = {
      user_id: userId,
      platform: 'linkedin' as const,
      status: 'draft' as const,
      content: { text: generated.linkedin, visibility: 'public' as const },
      notes: sourceNote,
      github_activity_id: activity.id,
    }

    const newsletterPost = {
      user_id: userId,
      platform: 'linkedin' as const,
      status: 'draft' as const,
      content: { text: generated.newsletter, visibility: 'public' as const },
      notes: `[shipsignal][newsletter] ${project.github_repo_url}`,
      github_activity_id: activity.id,
    }

    const { data: rows, error: insertError } = await supabase
      .from('posts')
      .insert([...twitterPosts, linkedinPost, newsletterPost])
      .select()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json({ error: 'Failed to save generated posts.' }, { status: 500 })
    }

    const posts: Post[] = (rows as DbPost[]).map(transformPostFromDb)
    return NextResponse.json({ posts }, { status: 201 })
  } catch (error) {
    console.error('Error generating posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
