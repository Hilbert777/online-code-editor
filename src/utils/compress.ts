import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'
import type { EditorSnapshot } from '../types/editor'

const HASH_KEY = 'code='

function isRecord(value: unknown): value is Record<string, unknown> {
  // 分享链接来自 URL，需要先做运行时结构校验，避免非法内容进入 store。
  return typeof value === 'object' && value !== null
}

export function isEditorSnapshot(value: unknown): value is EditorSnapshot {
  return (
    isRecord(value) &&
    typeof value.html === 'string' &&
    typeof value.css === 'string' &&
    typeof value.js === 'string' &&
    (value.theme === 'light' || value.theme === 'dark') &&
    typeof value.templateId === 'string'
  )
}

export function encodeSnapshot(snapshot: EditorSnapshot): string {
  // 使用 LZ-String 压缩后放入 URL Hash，减少分享链接长度。
  return compressToEncodedURIComponent(JSON.stringify(snapshot))
}

export function decodeSnapshot(payload: string): EditorSnapshot | null {
  // 解码失败或结构不合法时返回 null，页面会回退到本地缓存或默认模板。
  try {
    const json = decompressFromEncodedURIComponent(payload)
    if (!json) {
      return null
    }

    const parsed = JSON.parse(json)
    return isEditorSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function buildShareHash(snapshot: EditorSnapshot): string {
  // Hash 不会发送到服务器，适合纯前端静态部署下恢复代码状态。
  return `#${HASH_KEY}${encodeSnapshot(snapshot)}`
}

export function readSnapshotFromHash(hash: string): EditorSnapshot | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash

  if (!normalized.startsWith(HASH_KEY)) {
    return null
  }

  return decodeSnapshot(normalized.slice(HASH_KEY.length))
}
