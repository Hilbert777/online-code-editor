import type { EditorSnapshot } from '../types/editor'
import { isEditorSnapshot } from './compress'

export type LocalCodeFileKind = 'html' | 'css' | 'js' | 'json' | 'unknown'

export interface ImportedCode {
  html?: string
  css?: string
  js?: string
  snapshot?: EditorSnapshot
  fileNames: string[]
}

export function getLocalCodeFileKind(fileName: string): LocalCodeFileKind {
  // 根据扩展名判断导入策略，避免只依赖 MIME 类型导致兼容性问题。
  const normalized = fileName.toLowerCase()

  if (normalized.endsWith('.html') || normalized.endsWith('.htm')) {
    return 'html'
  }
  if (normalized.endsWith('.css')) {
    return 'css'
  }
  if (normalized.endsWith('.js') || normalized.endsWith('.mjs')) {
    return 'js'
  }
  if (normalized.endsWith('.json')) {
    return 'json'
  }

  return 'unknown'
}

function unescapeClosingTags(value: string): string {
  // 还原本项目导出 HTML 时为了安全写入的转义闭合标签。
  return value.replace(/<\\\/(script|style)>/gi, '</$1>')
}

function parseHtmlWithDomParser(content: string): Pick<ImportedCode, 'html' | 'css' | 'js'> | null {
  // 浏览器环境优先使用 DOMParser，能更可靠地处理完整 HTML 文档。
  if (typeof DOMParser === 'undefined') {
    return null
  }

  const document = new DOMParser().parseFromString(content, 'text/html')
  const css = Array.from(document.querySelectorAll('style'))
    .map((style) => unescapeClosingTags(style.textContent ?? ''))
    .join('\n\n')
    .trim()
  const js = Array.from(document.querySelectorAll('script:not([src])'))
    .map((script) => unescapeClosingTags(script.textContent ?? ''))
    .join('\n\n')
    .trim()
  const body = document.body.cloneNode(true) as HTMLElement

  // 上传完整 HTML 文件时，把内联 style/script 拆到对应编辑区，避免 HTML 面板重复运行代码。
  body.querySelectorAll('style, script').forEach((element) => element.remove())

  return {
    html: body.innerHTML.trim(),
    css,
    js,
  }
}

function collectTagContent(content: string, tagName: 'style' | 'script'): string {
  const scriptSourceGuard = tagName === 'script' ? '(?![^>]*\\bsrc\\s*=)' : ''
  const pattern = new RegExp(`<${tagName}${scriptSourceGuard}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi')
  const values: string[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content))) {
    values.push(unescapeClosingTags(match[1] ?? '').trim())
  }

  return values.filter(Boolean).join('\n\n')
}

function parseHtmlWithFallback(content: string): Pick<ImportedCode, 'html' | 'css' | 'js'> {
  // 单元测试或极端环境没有 DOMParser 时，使用正则作为降级解析。
  const css = collectTagContent(content, 'style')
  const js = collectTagContent(content, 'script')
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(content)
  const htmlSource = bodyMatch?.[1] ?? content
  const html = htmlSource
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .trim()

  return {
    html,
    css,
    js,
  }
}

export function parseLocalCodeFile(fileName: string, content: string): ImportedCode {
  // 单文件导入：HTML 会拆分三栏，CSS/JS 只覆盖对应编辑区。
  const kind = getLocalCodeFileKind(fileName)
  const base: ImportedCode = { fileNames: [fileName] }

  if (kind === 'html') {
    return {
      ...base,
      ...(parseHtmlWithDomParser(content) ?? parseHtmlWithFallback(content)),
    }
  }

  if (kind === 'css') {
    return { ...base, css: content }
  }

  if (kind === 'js') {
    return { ...base, js: content }
  }

  if (kind === 'json') {
    try {
      const parsed: unknown = JSON.parse(content)
      return isEditorSnapshot(parsed) ? { ...base, snapshot: parsed } : base
    } catch {
      return base
    }
  }

  return base
}

export function mergeImportedCode(items: ImportedCode[]): ImportedCode {
  // 多文件上传时按解析顺序合并，后出现的同类文件覆盖前面的同类内容。
  return items.reduce<ImportedCode>(
    (merged, item) => ({
      html: item.html ?? merged.html,
      css: item.css ?? merged.css,
      js: item.js ?? merged.js,
      snapshot: item.snapshot ?? merged.snapshot,
      fileNames: [...merged.fileNames, ...item.fileNames],
    }),
    { fileNames: [] },
  )
}

export async function readLocalCodeFiles(files: FileList | File[]): Promise<ImportedCode> {
  // File API 在浏览器端读取文本，不需要服务器参与上传过程。
  const parsedFiles = await Promise.all(
    Array.from(files).map(async (file) => parseLocalCodeFile(file.name, await file.text())),
  )

  return mergeImportedCode(parsedFiles)
}
