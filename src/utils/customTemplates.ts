import type { CodeTemplate, EditorSnapshot } from '../types/editor'

export const CUSTOM_TEMPLATE_STORAGE_KEY = 'online-code-editor:custom-templates:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  // localStorage 中的数据不可信，恢复前必须先判断基础结构。
  return typeof value === 'object' && value !== null
}

export function sanitizeTemplateName(name: string): string {
  // 模板名去掉首尾空白并压缩连续空格，限制长度避免下拉框显示异常。
  return name.trim().replace(/\s+/g, ' ').slice(0, 40)
}

export function isCodeTemplate(value: unknown): value is CodeTemplate {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.html === 'string' &&
    typeof value.css === 'string' &&
    typeof value.js === 'string'
  )
}

export function normalizeCustomTemplates(value: unknown): CodeTemplate[] {
  // 只保留结构完整的模板，损坏的数据会被自动丢弃。
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isCodeTemplate)
    .map((template) => ({
      ...template,
      isCustom: true,
    }))
}

export function createCustomTemplate(
  name: string,
  snapshot: EditorSnapshot,
  existingId?: string,
): CodeTemplate {
  const safeName = sanitizeTemplateName(name)

  if (!safeName) {
    throw new Error('模板名称不能为空。')
  }

  return {
    // 自定义模板 id 使用时间戳和随机后缀，避免和内置模板 id 冲突。
    id: existingId ?? `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: safeName,
    description: '用户自定义模板',
    html: snapshot.html,
    css: snapshot.css,
    js: snapshot.js,
    isCustom: true,
  }
}

export function loadCustomTemplates(): CodeTemplate[] {
  // 自定义模板只保存在当前浏览器本地，不依赖后端或数据库。
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY)
    return raw ? normalizeCustomTemplates(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function persistCustomTemplates(templates: CodeTemplate[]) {
  // 写入前再次规范化，保证 localStorage 中保存的是可恢复的数据。
  localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(normalizeCustomTemplates(templates)))
}
