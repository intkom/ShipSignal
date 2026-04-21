'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONE_OPTIONS = [
  'Authentic',
  'Professional',
  'Bold',
  'Sarcastic',
  'Minimalist',
  'Enthusiastic',
  'Technical',
]

interface AiPersona {
  founderBio: string | null
  toneOfVoice: string | null
  defaultHashtags: string | null
}

export function AIPersonaSection() {
  const [persona, setPersona] = useState<AiPersona>({
    founderBio: '',
    toneOfVoice: 'Authentic',
    defaultHashtags: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile/ai-settings')
      .then((r) => r.json())
      .then((data: AiPersona) => {
        setPersona({
          founderBio: data.founderBio ?? '',
          toneOfVoice: data.toneOfVoice ?? 'Authentic',
          defaultHashtags: data.defaultHashtags ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/profile/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      /* handled by UI state */
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-md border-[3px] border-border bg-card shadow-sticker mb-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-md border-[3px] border-border bg-card shadow-sticker mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-sticker-purple" />
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
          AI Persona
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Tell the AI Ghostwriter who you are — it uses this to write posts that sound like you.
      </p>

      <div className="space-y-4">
        {/* Founder Bio */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Founder Bio
          </label>
          <textarea
            value={persona.founderBio ?? ''}
            onChange={(e) => setPersona((p) => ({ ...p, founderBio: e.target.value }))}
            rows={3}
            placeholder="I'm a solo founder building dev tools. I care about simplicity, shipping fast, and being honest about the process."
            className={cn(
              'w-full text-sm rounded-md px-3 py-2 resize-y',
              'bg-background border-[2px] border-border',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/40',
              'placeholder:text-muted-foreground/50'
            )}
          />
        </div>

        {/* Tone of Voice */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Tone of Voice
          </label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setPersona((p) => ({ ...p, toneOfVoice: tone }))}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-bold border-[2px] transition-all',
                  persona.toneOfVoice === tone
                    ? 'bg-sticker-purple/15 text-sticker-purple border-sticker-purple/40 shadow-sticker-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-sticker-purple/30 hover:text-foreground'
                )}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Default Hashtags */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Default Hashtags
          </label>
          <input
            type="text"
            value={persona.defaultHashtags ?? ''}
            onChange={(e) => setPersona((p) => ({ ...p, defaultHashtags: e.target.value }))}
            placeholder="#buildinpublic #indiehacker #ai #shipping"
            className={cn(
              'w-full text-sm rounded-md px-3 py-2',
              'bg-background border-[2px] border-border',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/40',
              'placeholder:text-muted-foreground/50'
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Appended to the end of generated posts automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold',
            'border-[3px] border-border shadow-sticker-sm',
            'bg-primary text-primary-foreground',
            'hover:translate-y-[-1px] hover:shadow-sticker transition-all',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0'
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            '✓'
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Persona'}
        </button>
      </div>
    </div>
  )
}
