import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'
import type { EditorSnapshot } from '../types/editor'

const HASH_KEY = 'code='

function isRecord(value: unknown): value is Record<string, unknown> {
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
  return compressToEncodedURIComponent(JSON.stringify(snapshot))
}

export function decodeSnapshot(payload: string): EditorSnapshot | null {
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
  return `#${HASH_KEY}${encodeSnapshot(snapshot)}`
}

export function readSnapshotFromHash(hash: string): EditorSnapshot | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash

  if (!normalized.startsWith(HASH_KEY)) {
    return null
  }

  return decodeSnapshot(normalized.slice(HASH_KEY.length))
}

