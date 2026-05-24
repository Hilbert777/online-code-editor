import { onBeforeUnmount, onMounted } from 'vue'
import type { useEditorStore } from '../stores/editor'
import type { ConsoleLogType, PreviewConsoleMessage } from '../types/editor'

function isPreviewMessage(value: unknown): value is PreviewConsoleMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as Partial<PreviewConsoleMessage>
  return (
    payload.source === 'online-code-editor-preview' &&
    payload.event === 'console' &&
    (payload.level === 'log' || payload.level === 'warn' || payload.level === 'error') &&
    typeof payload.message === 'string'
  )
}

export function useConsoleCapture(
  getFrameWindow: () => Window | null,
  store: ReturnType<typeof useEditorStore>,
) {
  function handleMessage(event: MessageEvent<unknown>) {
    const frameWindow = getFrameWindow()

    // srcdoc iframe 的 origin 通常是 "null"，因此这里用 sourceWindow 做消息来源校验。
    if (!frameWindow || event.source !== frameWindow || !isPreviewMessage(event.data)) {
      return
    }

    const logType: ConsoleLogType = event.data.level
    store.addLog(logType, event.data.message)
  }

  onMounted(() => {
    window.addEventListener('message', handleMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
  })
}

