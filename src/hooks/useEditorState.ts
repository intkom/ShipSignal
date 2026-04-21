'use client'
/* eslint-disable max-lines -- large page component with extracted sub-components */

import { useState, useEffect, useRef } from 'react'
import { usePostsStore } from '@/lib/storage'
import { useCampaignsStore } from '@/lib/campaigns'
import { useSocialAccountsStore } from '@/lib/socialAccounts'
import { Post, Platform, createPost, isTwitterContent, isLinkedInContent } from '@/lib/posts'

export interface PostDraftData {
  content: string
  platform: string
  notes: string
  mediaUrls: string[]
  linkedInMediaUrl: string
  campaignId?: string
  scheduledAt?: string
}

interface UseEditorStateOptions {
  id?: string
  dateParam?: string | null
  campaignParam?: string | null
  initialContent?: string
}

// eslint-disable-next-line max-lines-per-function -- API handler requires auth+db in single try/catch
export function useEditorFormState(options: UseEditorStateOptions) {
  const { id, dateParam, campaignParam, initialContent = '' } = options
  const { getPost, fetchPosts, initialized: postsInitialized } = usePostsStore()
  const { campaigns, fetchCampaigns, initialized: campaignsInitialized } = useCampaignsStore()
  const {
    getAccountsByProvider,
    fetchAccounts,
    getActiveAccount,
    initialized: accountsInitialized,
  } = useSocialAccountsStore()

  const isNew = !id
  const existingPost = id ? getPost(id) : undefined

  useEffect(() => {
    if (!postsInitialized) fetchPosts()
    if (!campaignsInitialized) fetchCampaigns()
    if (!accountsInitialized) fetchAccounts()
  }, [
    postsInitialized,
    fetchPosts,
    campaignsInitialized,
    fetchCampaigns,
    accountsInitialized,
    fetchAccounts,
  ])

  const [post, setPost] = useState<Post>(() => {
    if (existingPost) return existingPost
    const newPost = createPost()
    if (dateParam) newPost.scheduledAt = `${dateParam}T12:00:00.000Z`
    if (campaignParam) newPost.campaignId = campaignParam
    return newPost
  })

  const [content, setContent] = useState(initialContent)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [linkedInMediaUrl, setLinkedInMediaUrl] = useState('')
  const [showMediaInput, setShowMediaInput] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showPublishedLinks, setShowPublishedLinks] = useState(false)

  return {
    isNew,
    existingPost,
    postsInitialized,
    campaigns,
    post,
    setPost,
    content,
    setContent,
    mediaUrls,
    setMediaUrls,
    linkedInMediaUrl,
    setLinkedInMediaUrl,
    showMediaInput,
    setShowMediaInput,
    showNotes,
    setShowNotes,
    showPublishedLinks,
    setShowPublishedLinks,
    getAccountsByProvider,
    getActiveAccount,
    fetchPosts,
  }
}

export function useDirtyTracking(deps: {
  content: string
  mediaUrls: string[]
  linkedInMediaUrl: string
  platform: Platform
  notes: string | undefined
}) {
  const initialContentRef = useRef('')
  const [isDirty, setIsDirty] = useState(false)
  useEffect(() => {
    const currentContent = JSON.stringify({
      content: deps.content,
      mediaUrls: deps.mediaUrls,
      linkedInMediaUrl: deps.linkedInMediaUrl,
      platform: deps.platform,
      notes: deps.notes,
    })
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initialContentRef.current && currentContent !== initialContentRef.current) {
      setIsDirty(true)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [deps.content, deps.mediaUrls, deps.linkedInMediaUrl, deps.platform, deps.notes])
  return { isDirty, setIsDirty, initialContentRef }
}

export function useLoadExistingPost(
  existingPost: Post | undefined,
  setters: {
    setPost: React.Dispatch<React.SetStateAction<Post>>
    setContent: React.Dispatch<React.SetStateAction<string>>
    setMediaUrls: React.Dispatch<React.SetStateAction<string[]>>
    setLinkedInMediaUrl: React.Dispatch<React.SetStateAction<string>>
    setShowNotes: React.Dispatch<React.SetStateAction<boolean>>
    setShowPublishedLinks: React.Dispatch<React.SetStateAction<boolean>>
    initialContentRef: React.MutableRefObject<string>
  }
) {
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    if (existingPost) {
      loadExistingPostData(existingPost, setters)
    } else {
      setters.initialContentRef.current = JSON.stringify({
        content: '',
        mediaUrls: [],
        linkedInMediaUrl: '',
        platform: 'twitter',
        notes: '',
      })
    }
  }, [existingPost]) // eslint-disable-line react-hooks/exhaustive-deps
}

function loadExistingPostData(
  existingPost: Post,
  setters: {
    setPost: React.Dispatch<React.SetStateAction<Post>>
    setContent: React.Dispatch<React.SetStateAction<string>>
    setMediaUrls: React.Dispatch<React.SetStateAction<string[]>>
    setLinkedInMediaUrl: React.Dispatch<React.SetStateAction<string>>
    setShowNotes: React.Dispatch<React.SetStateAction<boolean>>
    setShowPublishedLinks: React.Dispatch<React.SetStateAction<boolean>>
    initialContentRef: React.MutableRefObject<string>
  }
) {
  setters.setPost(existingPost)
  const { text, loadedMediaUrls, loadedLinkedInMedia } = extractContentFields(existingPost, setters)
  setters.setContent(text)
  setters.initialContentRef.current = JSON.stringify({
    content: text,
    mediaUrls: loadedMediaUrls,
    linkedInMediaUrl: loadedLinkedInMedia,
    platform: existingPost.platform,
    notes: existingPost.notes || '',
  })
  if (existingPost.notes) setters.setShowNotes(true)
  const hasLaunchedUrls =
    (isTwitterContent(existingPost.content) && existingPost.content.launchedUrl) ||
    (isLinkedInContent(existingPost.content) && existingPost.content.launchedUrl)
  if (hasLaunchedUrls) setters.setShowPublishedLinks(true)
}

function extractContentFields(
  existingPost: Post,
  setters: {
    setMediaUrls: React.Dispatch<React.SetStateAction<string[]>>
    setLinkedInMediaUrl: React.Dispatch<React.SetStateAction<string>>
  }
) {
  let text = ''
  if (isTwitterContent(existingPost.content)) {
    text = existingPost.content.text
    setters.setMediaUrls(existingPost.content.mediaUrls || [])
  } else if (isLinkedInContent(existingPost.content)) {
    text = existingPost.content.text
    setters.setLinkedInMediaUrl(existingPost.content.mediaUrl || '')
  }
  const loadedMediaUrls = isTwitterContent(existingPost.content)
    ? existingPost.content.mediaUrls || []
    : []
  const loadedLinkedInMedia = isLinkedInContent(existingPost.content)
    ? existingPost.content.mediaUrl || ''
    : ''
  return { text, loadedMediaUrls, loadedLinkedInMedia }
}

export function usePlatformContentSync(
  content: string,
  mediaUrls: string[],
  linkedInMediaUrl: string,
  setPost: React.Dispatch<React.SetStateAction<Post>>
) {
  useEffect(() => {
    setPost((prev) => {
      const newContent = buildPlatformContent(prev, content, mediaUrls, linkedInMediaUrl)
      return { ...prev, content: newContent }
    })
  }, [content, mediaUrls, linkedInMediaUrl, setPost])
}

function buildPlatformContent(
  prev: Post,
  content: string,
  mediaUrls: string[],
  linkedInMediaUrl: string
) {
  const platform = prev.platform
  if (platform === 'twitter') {
    const existing = prev.content as { launchedUrl?: string }
    return {
      text: content,
      ...(mediaUrls.length > 0 && { mediaUrls }),
      ...(existing?.launchedUrl && { launchedUrl: existing.launchedUrl }),
    }
  }
  if (platform === 'linkedin') {
    const existing = prev.content as {
      visibility?: 'public' | 'connections'
      launchedUrl?: string
    }
    return {
      text: content,
      visibility: existing?.visibility || 'public',
      ...(linkedInMediaUrl && { mediaUrl: linkedInMediaUrl }),
      ...(existing?.launchedUrl && { launchedUrl: existing.launchedUrl }),
    }
  }
  return prev.content
}
