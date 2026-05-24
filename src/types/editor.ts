export type EditorTab = 'html' | 'css' | 'js'

export type ThemeMode = 'light' | 'dark'

export type ConsoleLogType = 'log' | 'warn' | 'error'

export interface ConsoleLogItem {
  id: string
  type: ConsoleLogType
  message: string
  time: string
}

export interface EditorSnapshot {
  html: string
  css: string
  js: string
  theme: ThemeMode
  templateId: string
}

export interface CodeTemplate {
  id: string
  name: string
  description: string
  html: string
  css: string
  js: string
  isCustom?: boolean
}

export interface PreviewConsoleMessage {
  source: 'online-code-editor-preview'
  event: 'console'
  level: ConsoleLogType
  message: string
}
