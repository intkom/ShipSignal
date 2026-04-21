import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, parseJsonBody } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  founderBio: z.string().max(1000).optional().nullable(),
  toneOfVoice: z.string().max(100).optional().nullable(),
  defaultHashtags: z.string().max(500).optional().nullable(),
})

export async function GET() {
  try {
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('founder_bio, tone_of_voice, default_hashtags')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      founderBio: data?.founder_bio ?? null,
      toneOfVoice: data?.tone_of_voice ?? 'Authentic',
      defaultHashtags: data?.default_hashtags ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const parsed = updateSchema.safeParse(jsonResult.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('user_profiles').upsert(
      {
        id: userId,
        founder_bio: parsed.data.founderBio ?? null,
        tone_of_voice: parsed.data.toneOfVoice ?? 'Authentic',
        default_hashtags: parsed.data.defaultHashtags ?? null,
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('Profile upsert error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
