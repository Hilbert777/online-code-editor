import { computed, ref } from 'vue'
import type { useEditorStore } from '../stores/editor'
import { buildShareHash } from '../utils/compress'

const MAX_SHARE_URL_LENGTH = 6000

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export function useShare(store: ReturnType<typeof useEditorStore>) {
  const isSharing = ref(false)
  const shareHash = computed(() => buildShareHash(store.snapshot))

  function createShareLink(): string {
    isSharing.value = true

    try {
      const url = new URL(window.location.href)
      url.hash = shareHash.value
      const shareUrl = url.toString()

      if (shareUrl.length > MAX_SHARE_URL_LENGTH) {
        throw new Error('链接过长，建议减少代码量后再分享。')
      }

      window.history.replaceState(null, '', url)
      return shareUrl
    } finally {
      isSharing.value = false
    }
  }

  return {
    isSharing,
    createShareLink,
    copyText: copyToClipboard,
  }
}
