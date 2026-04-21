'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Loader2, Save, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TONE_OPTIONS = ['Professional', 'Bold', 'Minimalist', 'Sarcastic'] as const

type ToneOption = (typeof TONE_OPTIONS)[number]

type SettingsForm = {
  founderBio: string
  voiceTone: ToneOption
  defaultHashtags: string
}

const DEFAULT_FORM: SettingsForm = {
  founderBio: '',
  voiceTone: 'Professional',
  defaultHashtags: '',
}

export default function AIFounderVoiceSettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadSettings() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (ignore) return

      if (userError || !user) {
        setError('Please sign in to manage your AI Founder Voice settings.')
        setLoading(false)
        return
      }

      setUserId(user.id)

      const aiSettingsResult = await supabase
        .from('ai_settings')
        .select('founder_bio, voice_tone, tone_of_voice, default_hashtags')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!ignore && !aiSettingsResult.error && aiSettingsResult.data) {
        setForm({
          founderBio: aiSettingsResult.data.founder_bio ?? '',
          voiceTone:
            normalizeTone(aiSettingsResult.data.voice_tone ?? aiSettingsResult.data.tone_of_voice) ??
            DEFAULT_FORM.voiceTone,
          defaultHashtags: aiSettingsResult.data.default_hashtags ?? '',
        })
        setLoading(false)
        return
      }

      const profileResult = await supabase
        .from('user_profiles')
        .select('founder_bio, tone_of_voice, default_hashtags')
        .eq('id', user.id)
        .maybeSingle()

      if (ignore) return

      if (profileResult.error) {
        setError('We could not load your saved settings yet.')
      } else if (profileResult.data) {
        setForm({
          founderBio: profileResult.data.founder_bio ?? '',
          voiceTone: normalizeTone(profileResult.data.tone_of_voice) ?? DEFAULT_FORM.voiceTone,
          defaultHashtags: profileResult.data.default_hashtags ?? '',
        })
      }

      setLoading(false)
    }

    void loadSettings()

    return () => {
      ignore = true
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) {
      setError('Please sign in to save your settings.')
      return
    }

    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = {
      user_id: userId,
      founder_bio: form.founderBio || null,
      voice_tone: form.voiceTone,
      tone_of_voice: form.voiceTone,
      default_hashtags: form.defaultHashtags || null,
    }

    const aiSettingsSave = await supabase.from('ai_settings').upsert(payload, {
      onConflict: 'user_id',
    })

    if (!aiSettingsSave.error) {
      setMessage('Settings saved.')
      setSaving(false)
      return
    }

    const profileSave = await supabase.from('user_profiles').upsert(
      {
        id: userId,
        founder_bio: form.founderBio || null,
        tone_of_voice: form.voiceTone,
        default_hashtags: form.defaultHashtags || null,
      },
      { onConflict: 'id' }
    )

    if (profileSave.error) {
      setError('We could not save your settings. Please try again.')
    } else {
      setMessage('Settings saved.')
    }

    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="card-clean mx-auto max-w-3xl p-8 sm:p-10">
          <div className="mb-10 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                <Settings2 className="h-3.5 w-3.5 text-foreground" />
                AI Founder Voice
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Shape the voice behind your content
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                  Keep your prompts grounded in your founder story, preferred tone, and default
                  posting style.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-xl border border-border bg-neutral-50" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-12 animate-pulse rounded-lg border border-border bg-neutral-50" />
                <div className="h-12 animate-pulse rounded-lg border border-border bg-neutral-50" />
              </div>
              <div className="h-11 w-36 animate-pulse rounded-md bg-neutral-900/10" />
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="founder-bio"
                  className="text-sm font-semibold text-foreground"
                >
                  Founder Bio
                </label>
                <textarea
                  id="founder-bio"
                  value={form.founderBio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, founderBio: event.target.value }))
                  }
                  rows={6}
                  placeholder="I am building an AI marketing agency..."
                  className="min-h-[152px] w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-black"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="voice-tone" className="text-sm font-semibold text-foreground">
                    Voice Tone
                  </label>
                  <select
                    id="voice-tone"
                    value={form.voiceTone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        voiceTone: event.target.value as ToneOption,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition focus:border-black"
                  >
                    {TONE_OPTIONS.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="default-hashtags"
                    className="text-sm font-semibold text-foreground"
                  >
                    Default Hashtags
                  </label>
                  <input
                    id="default-hashtags"
                    type="text"
                    value={form.defaultHashtags}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        defaultHashtags: event.target.value,
                      }))
                    }
                    placeholder="#buildinpublic #ai"
                    className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition focus:border-black"
                  />
                </div>
              </div>

              {(error || message) && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    error
                      ? 'border-[#ffd2bf] bg-[#fff6f2] text-[#b34000]'
                      : 'border-border bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {error ?? message}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary min-w-[150px]" disabled={saving}>
                  <span className="inline-flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </span>
                </button>
                <p className="text-xs text-neutral-500">
                  Your preferences are used to personalize future content generation.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

function normalizeTone(value: string | null | undefined): ToneOption | null {
  if (!value) return null

  return TONE_OPTIONS.find((tone) => tone === value) ?? null
}
