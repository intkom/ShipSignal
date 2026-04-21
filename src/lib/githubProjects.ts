import { create } from 'zustand'
import type { GithubProject, GithubActivity } from './posts'
import { dedup } from './requestDedup'

const API_BASE = '/api'

interface GithubProjectsState {
  githubProjects: GithubProject[]
  activity: Record<string, GithubActivity> // keyed by github_project_id
  syncing: Record<string, boolean> // keyed by project id
  loading: boolean
  error: string | null
  initialized: boolean
}

interface GithubProjectsActions {
  fetchGithubProjects: () => Promise<void>
  connectGithubProject: (input: {
    githubRepoUrl: string
    changelogUrl?: string
    documentationUrl?: string
  }) => Promise<GithubProject>
  syncGithubProject: (id: string) => Promise<GithubActivity>
  reset: () => void
}

const initialState: GithubProjectsState = {
  githubProjects: [],
  activity: {},
  syncing: {},
  loading: false,
  error: null,
  initialized: false,
}

async function postGithubProject(input: {
  githubRepoUrl: string
  changelogUrl?: string
  documentationUrl?: string
}): Promise<GithubProject> {
  const res = await fetch(`${API_BASE}/github-projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      githubRepoUrl: input.githubRepoUrl,
      changelogUrl: input.changelogUrl || null,
      documentationUrl: input.documentationUrl || null,
    }),
  })
  let data: { error?: string; githubProject?: GithubProject } = {}
  try {
    data = await res.json()
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    throw new Error(data.error || 'Failed to connect repository')
  }
  return data.githubProject as GithubProject
}

export const useGithubProjectsStore = create<GithubProjectsState & GithubProjectsActions>()(
  (set, get) => ({
    ...initialState,

    fetchGithubProjects: async () => {
      return dedup('githubProjects', async () => {
        set({ loading: true, error: null })
        try {
          const res = await fetch(`${API_BASE}/github-projects`)
          if (!res.ok) throw new Error('Failed to fetch GitHub projects')
          const data = await res.json()
          const githubProjects = data.githubProjects || []
          set({ githubProjects, loading: false, initialized: true })
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
        }
      })
    },

    connectGithubProject: async (input) => {
      const previous = get().githubProjects
      set({ loading: true, error: null })
      try {
        const githubProject = await postGithubProject(input)
        set({
          githubProjects: [githubProject, ...previous],
          loading: false,
          initialized: true,
        })
        return githubProject
      } catch (error) {
        set({ loading: false, error: (error as Error).message })
        throw error
      }
    },

    syncGithubProject: async (id: string) => {
      set((s) => ({ syncing: { ...s.syncing, [id]: true } }))
      try {
        const res = await fetch(`${API_BASE}/github-projects/${id}/sync`, { method: 'POST' })
        let data: { error?: string; githubActivity?: GithubActivity } = {}
        try {
          data = await res.json()
        } catch {
          /* non-JSON error body */
        }
        if (!res.ok) throw new Error(data.error || 'Failed to sync')
        const githubActivity = data.githubActivity as GithubActivity
        set((s) => ({
          syncing: { ...s.syncing, [id]: false },
          activity: { ...s.activity, [id]: githubActivity },
        }))
        return githubActivity
      } catch (error) {
        set((s) => ({ syncing: { ...s.syncing, [id]: false } }))
        throw error
      }
    },

    reset: () => set(initialState),
  })
)
