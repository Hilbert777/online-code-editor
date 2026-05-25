import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { useEditorStore } from '../stores/editor'
import { buildSrcDoc } from '../utils/buildSrcDoc'

export type PreviewRefreshReason = 'initial' | 'auto' | 'manual' | 'template'

export function usePreview(store: ReturnType<typeof useEditorStore>) {
  const previewSrcDoc = ref('')
  const previewVersion = ref(0)
  const lastRefreshReason = ref<PreviewRefreshReason>('initial')

  function refreshPreview(reason: PreviewRefreshReason = 'auto') {
    // 每次刷新递增 version，iframe 使用 key 强制重建，确保用户 JS 重新执行。
    lastRefreshReason.value = reason
    previewVersion.value += 1
    store.beginRun()
    previewSrcDoc.value = buildSrcDoc({
      html: store.html,
      css: store.css,
      js: store.js,
      runId: previewVersion.value,
    })
  }

  const refreshPreviewDebounced = useDebounceFn(() => {
    // 编辑输入时延迟刷新，降低 iframe 频繁重绘带来的卡顿。
    refreshPreview('auto')
  }, 300)

  watch(
    () => [store.html, store.css, store.js],
    () => {
      refreshPreviewDebounced()
    },
  )

  refreshPreview('initial')

  return {
    previewSrcDoc,
    previewVersion,
    lastRefreshReason,
    refreshPreview,
  }
}
