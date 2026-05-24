import type { CodeTemplate, EditorSnapshot } from '../types/editor'

export const CUSTOM_TEMPLATE_STORAGE_KEY = 'online-code-editor:custom-templates:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function sanitizeTemplateName(name: string): string {
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
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY)
    return raw ? normalizeCustomTemplates(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function persistCustomTemplates(templates: CodeTemplate[]) {
  localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(normalizeCustomTemplates(templates)))
}

