// 编辑器标签类型：三个面板分别对应 HTML、CSS、JavaScript。
export type EditorTab = 'html' | 'css' | 'js'

// 页面主题模式，和 Monaco Editor 主题保持同步。
export type ThemeMode = 'light' | 'dark'

// iframe 内 console 输出统一映射为这三种类型。
export type ConsoleLogType = 'log' | 'warn' | 'error'

// 控制台列表的数据结构，所有日志都通过该结构进入 Pinia。
export interface ConsoleLogItem {
  id: string
  type: ConsoleLogType
  message: string
  time: string
}

// 可被保存、分享、上传恢复的完整编辑器快照。
export interface EditorSnapshot {
  html: string
  css: string
  js: string
  theme: ThemeMode
  templateId: string
}

// 模板数据结构，内置模板和用户自定义模板共用这一套字段。
export interface CodeTemplate {
  id: string
  name: string
  description: string
  html: string
  css: string
  js: string
  isCustom?: boolean
}

// iframe 通过 postMessage 发回主页面的控制台消息。
export interface PreviewConsoleMessage {
  source: 'online-code-editor-preview'
  event: 'console'
  level: ConsoleLogType
  message: string
  runId: number
}
