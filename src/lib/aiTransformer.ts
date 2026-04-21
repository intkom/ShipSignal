import Anthropic from '@anthropic-ai/sdk'
import { logger } from './logger'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const BASE_RULES = `Rules:
- Be specific: name the actual features, fixes, or improvements from the raw text.
- Use first person ("we shipped", "I fixed", "just merged").
- Twitter thread: hook on tweet 1, each subsequent tweet expands one point, end with CTA or reflection.
- LinkedIn: one cohesive narrative post; can be longer and more reflective.
- Newsletter summary: 2-3 punchy paragraphs suitable for a "what shipped this week" section.
- Never invent features not present in the raw text.
- Keep Twitter tweets under 280 characters each.
- Append the default hashtags (if any) to the end of the twitter thread's last tweet and the linkedin post.

Respond ONLY with valid JSON matching this exact schema (no markdown fences, no extra keys):
{
  "thread": ["tweet1", "tweet2", "tweet3"],
  "linkedin": "full linkedin post text",
  "newsletter": "full newsletter/blog summary text"
}
The "thread" array must have 1–5 strings.`

export interface AiPersona {
  founderBio?: string | null
  toneOfVoice?: string | null
  defaultHashtags?: string | null
}

export interface GeneratedContent {
  thread: string[]
  linkedin: string
  newsletter: string
}

function buildSystemPrompt(persona: AiPersona): string {
  const bio = persona.founderBio?.trim()
  const tone = persona.toneOfVoice?.trim() || 'Authentic'
  const hashtags = persona.defaultHashtags?.trim()

  const personaBlock = [
    bio ? `About the founder: ${bio}` : null,
    `Tone of voice: ${tone} — every post should reflect this tone consistently.`,
    hashtags ? `Default hashtags to append: ${hashtags}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return `You are a Founder Ghostwriter specializing in "Building in Public" content.
Your job is to transform raw GitHub activity (release notes, merged PRs, or recent commits) into
compelling social content that is authentic, slightly technical but accessible, and focused on
value and progress — never hype or fluff.

${personaBlock}

${BASE_RULES}`
}

export async function generatePostsFromActivity(
  rawText: string,
  repoUrl: string,
  persona: AiPersona = {}
): Promise<GeneratedContent> {
  if (rawText.trim().length < 20) {
    throw new Error('Not enough activity text to generate posts.')
  }

  const repoName = repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '')
  const systemPrompt = buildSystemPrompt(persona)

  logger.log(
    '[aiTransformer] calling API | model=claude-haiku-4-5-20251001 | tone:',
    persona.toneOfVoice ?? 'Authentic',
    '| rawText snippet:',
    rawText.slice(0, 100)
  )

  let message: Anthropic.Message
  try {
    message = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Repository: ${repoName}\n\nLatest activity:\n${rawText}`,
          },
        ],
      },
      { timeout: 15_000 }
    )
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.toLowerCase().includes('timeout')
    if (isTimeout) {
      throw new Error('AI request timed out — please retry.')
    }
    logger.error('[aiTransformer] Anthropic API call FAILED:', err)
    throw err
  }

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  logger.log('[aiTransformer] raw response (first 300):', raw.slice(0, 300))

  // Strip markdown code fences if the model wrapped the JSON
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  let parsed: GeneratedContent
  try {
    parsed = JSON.parse(stripped) as GeneratedContent
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) {
      logger.error('[aiTransformer] unparseable response:', raw)
      throw new Error('AI returned malformed JSON — please retry.')
    }
    try {
      parsed = JSON.parse(match[0]) as GeneratedContent
    } catch (e2) {
      logger.error('[aiTransformer] JSON.parse failed on extracted block:', match[0].slice(0, 300))
      throw e2
    }
  }

  if (
    !Array.isArray(parsed.thread) ||
    parsed.thread.length === 0 ||
    typeof parsed.linkedin !== 'string' ||
    typeof parsed.newsletter !== 'string'
  ) {
    throw new Error('AI response missing required fields — please retry.')
  }

  parsed.thread = parsed.thread.slice(0, 5)

  return parsed
}
