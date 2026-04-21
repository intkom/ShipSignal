'use client'
/* eslint-disable max-lines -- large page component with extracted sub-components */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePostsStore } from '@/lib/storage'
import { Post, Platform, PostStatus, PLATFORM_INFO, CHAR_LIMITS } from '@/lib/posts'
import { copyToClipboard } from '@/lib/nativeClipboard'
import { trackMilestone } from '@/lib/appReview'

interface SaveContext {
  isNew: boolean
  clearDraft: () => void
}

export function useEditorSave(ctx: SaveContext) {
  const router = useRouter()
  const { addPost, updatePost } = usePostsStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const handleSave = async (postToSave: Post) => {
    setIsSaving(true)
    setIsDirty(false)
    try {
      if (ctx.isNew) {
        await addPost(postToSave)
      } else {
        await updatePost(postToSave.id, postToSave)
      }
      trackMilestone()
      ctx.clearDraft()
      router.push('/')
    } catch {
      toast.error('Failed to save post')
      setIsDirty(true)
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, isDirty, setIsDirty, handleSave }
}

// eslint-disable-next-line max-lines-per-function -- near-borderline, extraction would hurt readability
export function useEditorActions(
  post: Post,
  content: string,
  handleSave: (p: Post) => Promise<void>
) {
  const isOverLimit = content.length > CHAR_LIMITS[post.platform]
  const canSchedule = !!post.scheduledAt

  const handleSaveDraft = () => {
    handleSave({ ...post, status: 'draft' as const })
    toast.success('Draft saved')
  }

  const handleSchedule = () => {
    if (isOverLimit) {
      toast.error(
        `Content exceeds the ${CHAR_LIMITS[post.platform]}-character limit for ${PLATFORM_INFO[post.platform].name}`
      )
      return
    }
    if (!post.scheduledAt) {
      toast.error('Please select a date and time')
      return
    }
    handleSave({ ...post, status: 'scheduled' as const })
    toast.success('Post scheduled')
  }

  const handleMarkAsPosted = () => {
    handleSave({
      ...post,
      status: 'published' as const,
      publishResult: { success: true, publishedAt: new Date().toISOString() },
    })
    toast.success('Marked as posted')
  }

  return {
    isOverLimit,
    canSchedule,
    hasMultipleSubreddits: false,
    handleSaveDraft,
    handleSchedule,
    handleMarkAsPosted,
  }
}

// eslint-disable-next-line max-lines-per-function -- near-borderline, extraction would hurt readability
export function usePublishNow(
  post: Post,
  content: string,
  isNew: boolean,
  hasConnectedAccount: boolean,
  isOverLimit: boolean
) {
  const [isPublishing, setIsPublishing] = useState(false)
  const { addPost, fetchPosts } = usePostsStore()

  const handlePublishNow = async (clearDraft?: () => void) => {
    if (isOverLimit) {
      toast.error(
        `Content exceeds the ${CHAR_LIMITS[post.platform]}-character limit for ${PLATFORM_INFO[post.platform].name}`
      )
      return
    }
    if (!content.trim()) {
      toast.error('Please add some content')
      return
    }
    if (!hasConnectedAccount) {
      toast.error(`Connect your ${PLATFORM_INFO[post.platform].name} account in Settings`)
      return
    }
    let postId = post.id
    if (isNew) {
      try {
        const created = await addPost({ ...post, status: 'draft' as PostStatus })
        postId = created.id
      } catch {
        toast.error('Failed to save post before publishing')
        return
      }
    }
    setIsPublishing(true)
    try {
      const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Post published!')
        fetchPosts()
        clearDraft?.()
      } else {
        toast.error(data.error || 'Failed to publish')
      }
    } catch (err) {
      toast.error('Failed to publish post')
      console.error('Publish error:', err)
    } finally {
      setIsPublishing(false)
    }
  }

  return { isPublishing, handlePublishNow }
}

export function useCopyContent(content: string) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    const success = await copyToClipboard(content)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    }
  }
  return { copied, handleCopy }
}

// eslint-disable-next-line max-lines-per-function -- borderline, extraction would hurt readability
export function usePlatformSwitch(
  post: Post,
  content: string,
  mediaUrls: string[],
  linkedInMediaUrl: string,
  setPost: React.Dispatch<React.SetStateAction<Post>>
) {
  const [showPlatformSwitchConfirm, setShowPlatformSwitchConfirm] = useState(false)
  const [pendingPlatform, setPendingPlatform] = useState<Platform | null>(null)

  const executePlatformSwitch = (platform: Platform) => {
    setPost((prev) => ({ ...prev, platform, socialAccountId: undefined }))
    setPendingPlatform(null)
  }

  const setPlatform = (platform: Platform) => {
    const hasContent = content.trim().length > 0 || mediaUrls.length > 0 || !!linkedInMediaUrl
    if (hasContent && platform !== post.platform) {
      setPendingPlatform(platform)
      setShowPlatformSwitchConfirm(true)
      return
    }
    executePlatformSwitch(platform)
  }

  const confirmPlatformSwitch = () => {
    if (pendingPlatform) executePlatformSwitch(pendingPlatform)
    setShowPlatformSwitchConfirm(false)
  }

  return {
    showPlatformSwitchConfirm,
    setShowPlatformSwitchConfirm,
    pendingPlatform,
    setPendingPlatform,
    setPlatform,
    confirmPlatformSwitch,
  }
}

// eslint-disable-next-line max-lines-per-function -- borderline, extraction would hurt readability
export function usePostLifecycle(id: string | undefined) {
  const router = useRouter()
  const { deletePost, archivePost, restorePost } = usePostsStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const handleDelete = () => setShowDeleteConfirm(true)
  const handleArchive = () => setShowArchiveConfirm(true)

  const confirmDelete = async () => {
    if (id) {
      try {
        await deletePost(id)
        toast.success('Post deleted')
        router.push('/')
      } catch {
        toast.error('Failed to delete post')
      }
    }
  }

  const confirmArchive = async () => {
    if (id) {
      try {
        await archivePost(id)
        toast.success('Post archived')
        router.push('/')
      } catch {
        toast.error('Failed to archive post')
      }
    }
  }

  const handleRestore = async () => {
    if (id) {
      try {
        await restorePost(id)
        toast.success('Post restored to drafts')
        router.push('/')
      } catch {
        toast.error('Failed to restore post')
      }
    }
  }

  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    showArchiveConfirm,
    setShowArchiveConfirm,
    handleDelete,
    handleArchive,
    handleRestore,
    confirmDelete,
    confirmArchive,
  }
}
