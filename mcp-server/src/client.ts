/**
 * HTTP client for the ShipSignal API.
 * All requests are authenticated via Bearer API key.
 */

function resolveApiKey(): string {
  const primary = process.env.SHIPSIGNAL_API_KEY
  if (primary) return primary

  // Deprecated: BULLHORN_API_KEY is supported as a fallback until the next major release
  const legacy = process.env.BULLHORN_API_KEY
  if (legacy) {
    console.warn(
      '[shipsignal-mcp] BULLHORN_API_KEY is deprecated — rename it to SHIPSIGNAL_API_KEY. ' +
        'The old name will be removed in a future release.'
    )
    return legacy
  }

  throw new Error(
    'SHIPSIGNAL_API_KEY is required. Create one at https://shipsignal.app/settings → API Keys.'
  )
}

function resolveApiUrl(): string {
  const primary = process.env.SHIPSIGNAL_API_URL
  if (primary) return primary.replace(/\/$/, '')

  // Deprecated: BULLHORN_API_URL is supported as a fallback until the next major release
  const legacy = process.env.BULLHORN_API_URL
  if (legacy) {
    console.warn(
      '[shipsignal-mcp] BULLHORN_API_URL is deprecated — rename it to SHIPSIGNAL_API_URL. ' +
        'The old name will be removed in a future release.'
    )
    return legacy.replace(/\/$/, '')
  }

  return 'https://shipsignal.app'
}

export class ShipSignalClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.apiKey = resolveApiKey()
    this.baseUrl = resolveApiUrl()
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}/api${path}`
    if (params) {
      const search = new URLSearchParams(params)
      url += `?${search.toString()}`
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message: string
      try {
        const json = JSON.parse(text)
        message = json.error || `HTTP ${res.status}`
      } catch {
        message = `HTTP ${res.status}: ${text.slice(0, 200)}`
      }
      throw new Error(message)
    }

    return res.json() as Promise<T>
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params)
  }

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}/api${path}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message: string
      try {
        const json = JSON.parse(text)
        message = json.error || `HTTP ${res.status}`
      } catch {
        message = `HTTP ${res.status}: ${text.slice(0, 200)}`
      }
      throw new Error(message)
    }

    return res.json() as Promise<T>
  }
}

/** @deprecated Use ShipSignalClient */
export const BullhornClient = ShipSignalClient
