import { ref, watch } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import type { useEditorStore } from '../stores/editor'
import { isEditorSnapshot, readSnapshotFromHash } from '../utils/compress'

const STORAGE_KEY = 'online-code-editor:state:v2'

export type RestoreSource = 'hash' | 'localStorage' | 'default'

function canUseLocalStorage(): boolean {
  // 部分隐私模式或受限环境会禁用 localStorage，先探测再使用。
  try {
    const key = 'online-code-editor:storage-test'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function useAutoSave(store: ReturnType<typeof useEditorStore>) {
  const lastSavedAt = ref('尚未保存')
  const restoreSource = ref<RestoreSource>('default')
  const storageAvailable = ref(canUseLocalStorage())

  function restore(): RestoreSource {
    // 恢复优先级：分享链接 Hash > 本地缓存 > 默认模板。
    const snapshotFromHash = readSnapshotFromHash(window.location.hash)
    if (snapshotFromHash) {
      store.hydrate(snapshotFromHash)
      restoreSource.value = 'hash'
      return restoreSource.value
    }

    if (!storageAvailable.value) {
      restoreSource.value = 'default'
      return restoreSource.value
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isEditorSnapshot(parsed)) {
          store.hydrate(parsed)
          restoreSource.value = 'localStorage'
          return restoreSource.value
        }
      }
    } catch {
      storageAvailable.value = false
    }

    restoreSource.value = 'default'
    return restoreSource.value
  }

  const saveNow = useThrottleFn(() => {
    // 自动保存使用节流，避免编辑时每次按键都写 localStorage。
    if (!storageAvailable.value) {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.snapshot))
      lastSavedAt.value = new Date().toLocaleTimeString()
    } catch {
      storageAvailable.value = false
      lastSavedAt.value = '保存失败'
    }
  }, 500)

  watch(
    () => [store.html, store.css, store.js, store.theme, store.templateId],
    () => {
      saveNow()
    },
  )

  return {
    lastSavedAt,
    restoreSource,
    storageAvailable,
    restore,
  }
}
