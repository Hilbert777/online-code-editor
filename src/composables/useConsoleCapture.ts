import { onBeforeUnmount, onMounted } from 'vue'
import type { useEditorStore } from '../stores/editor'
import type { ConsoleLogType, PreviewConsoleMessage } from '../types/editor'

function isPreviewMessage(value: unknown): value is PreviewConsoleMessage {
  // postMessage 可能收到其他来源消息，必须先验证自定义协议字段。
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as Partial<PreviewConsoleMessage>
  return (
    payload.source === 'online-code-editor-preview' &&
    payload.event === 'console' &&
    (payload.level === 'log' || payload.level === 'warn' || payload.level === 'error') &&
    typeof payload.message === 'string' &&
    typeof payload.runId === 'number'
  )
}

export function useConsoleCapture(
  getFrameWindow: () => Window | null,
  getRunId: () => number,
  store: ReturnType<typeof useEditorStore>,
) {
  function handleMessage(event: MessageEvent<unknown>) {
    // 只处理 iframe console bridge 发出的消息，其余 message 事件全部忽略。
    if (!isPreviewMessage(event.data)) {
      return
    }

    const frameWindow = getFrameWindow()
    const isCurrentFrame = Boolean(frameWindow && event.source === frameWindow)
    const isCurrentRun = event.data.runId === getRunId()

    // srcdoc iframe 的 origin 通常是 "null"。优先校验 frameWindow；
    // 同步脚本可能早于 iframe load 触发，因此用 runId 兜底避免日志丢失。
    if (!isCurrentFrame && !isCurrentRun) {
      return
    }

    const logType: ConsoleLogType = event.data.level
    store.addLog(logType, event.data.message)
  }

  onMounted(() => {
    // 组件挂载后开始监听 iframe 的 postMessage 控制台输出。
    window.addEventListener('message', handleMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
  })
}
