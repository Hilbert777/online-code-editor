import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CodeTemplate,
  ConsoleLogItem,
  ConsoleLogType,
  EditorSnapshot,
  EditorTab,
  ThemeMode,
} from '../types/editor'
import {
  createCustomTemplate,
  loadCustomTemplates,
  persistCustomTemplates,
  sanitizeTemplateName,
} from '../utils/customTemplates'
import { defaultTemplate, templates } from '../utils/templates'

const MAX_LOG_COUNT = 200

function createLogId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useEditorStore = defineStore('editor', () => {
  const html = ref(defaultTemplate.html)
  const css = ref(defaultTemplate.css)
  const js = ref(defaultTemplate.js)
  const theme = ref<ThemeMode>('dark')
  const activeTab = ref<EditorTab>('html')
  const templateId = ref(defaultTemplate.id)
  const isRunning = ref(false)
  const logs = ref<ConsoleLogItem[]>([])
  const latestError = ref<string | null>(null)
  const lastRunAt = ref('尚未运行')
  const customTemplates = ref<CodeTemplate[]>([])

  const snapshot = computed<EditorSnapshot>(() => ({
    html: html.value,
    css: css.value,
    js: js.value,
    theme: theme.value,
    templateId: templateId.value,
  }))

  const allTemplates = computed<CodeTemplate[]>(() => [...templates, ...customTemplates.value])

  function findTemplateById(nextTemplateId: string): CodeTemplate {
    return allTemplates.value.find((template) => template.id === nextTemplateId) ?? defaultTemplate
  }

  function setCode(tab: EditorTab, value: string) {
    if (tab === 'html') {
      html.value = value
    } else if (tab === 'css') {
      css.value = value
    } else {
      js.value = value
    }
  }

  function setActiveTab(tab: EditorTab) {
    activeTab.value = tab
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  function hydrate(nextSnapshot: EditorSnapshot) {
    html.value = nextSnapshot.html
    css.value = nextSnapshot.css
    js.value = nextSnapshot.js
    theme.value = nextSnapshot.theme
    templateId.value = findTemplateById(nextSnapshot.templateId).id
  }

  function importCode(code: Partial<Pick<EditorSnapshot, 'html' | 'css' | 'js'>>) {
    if (typeof code.html === 'string') {
      html.value = code.html
    }
    if (typeof code.css === 'string') {
      css.value = code.css
    }
    if (typeof code.js === 'string') {
      js.value = code.js
    }
    templateId.value = defaultTemplate.id
  }

  function applyTemplate(nextTemplateId: string) {
    const template = findTemplateById(nextTemplateId)
    html.value = template.html
    css.value = template.css
    js.value = template.js
    templateId.value = template.id
  }

  function resetToDefault() {
    applyTemplate(defaultTemplate.id)
  }

  function hydrateCustomTemplates() {
    customTemplates.value = loadCustomTemplates()
  }

  function saveAsCustomTemplate(name: string): CodeTemplate {
    const safeName = sanitizeTemplateName(name)
    const existingTemplate = customTemplates.value.find((template) => template.name === safeName)
    const template = createCustomTemplate(name, snapshot.value, existingTemplate?.id)

    customTemplates.value = existingTemplate
      ? customTemplates.value.map((item) => (item.id === existingTemplate.id ? template : item))
      : [...customTemplates.value, template]

    persistCustomTemplates(customTemplates.value)
    templateId.value = template.id
    return template
  }

  function beginRun() {
    isRunning.value = true
    latestError.value = null
    lastRunAt.value = new Date().toLocaleTimeString()
  }

  function finishRun() {
    isRunning.value = false
  }

  function addLog(type: ConsoleLogType, message: string) {
    const item: ConsoleLogItem = {
      id: createLogId(),
      type,
      message,
      time: new Date().toLocaleTimeString(),
    }

    logs.value = [...logs.value.slice(-MAX_LOG_COUNT + 1), item]

    if (type === 'error') {
      latestError.value = message
    }
  }

  function clearLogs() {
    logs.value = []
    latestError.value = null
  }

  return {
    html,
    css,
    js,
    theme,
    activeTab,
    templateId,
    isRunning,
    logs,
    latestError,
    lastRunAt,
    customTemplates,
    allTemplates,
    snapshot,
    findTemplateById,
    setCode,
    setActiveTab,
    setTheme,
    hydrate,
    hydrateCustomTemplates,
    saveAsCustomTemplate,
    importCode,
    applyTemplate,
    resetToDefault,
    beginRun,
    finishRun,
    addLog,
    clearLogs,
  }
})
