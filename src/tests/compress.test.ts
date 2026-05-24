import { describe, expect, it } from 'vitest'
import type { EditorSnapshot } from '../types/editor'
import { buildShareHash, decodeSnapshot, encodeSnapshot, readSnapshotFromHash } from '../utils/compress'

const snapshot: EditorSnapshot = {
  html: '<h1>Hi</h1>',
  css: 'h1 { color: blue; }',
  js: 'console.log("hi")',
  theme: 'dark',
  templateId: 'blank',
}

describe('compress utils', () => {
  it('encodes and decodes editor snapshot', () => {
    const encoded = encodeSnapshot(snapshot)

    expect(encoded.length).toBeGreaterThan(0)
    expect(decodeSnapshot(encoded)).toEqual(snapshot)
  })

  it('reads snapshot from url hash', () => {
    const hash = buildShareHash(snapshot)

    expect(hash.startsWith('#code=')).toBe(true)
    expect(readSnapshotFromHash(hash)).toEqual(snapshot)
  })

  it('returns null for invalid payload', () => {
    expect(readSnapshotFromHash('#code=not-a-valid-payload')).toBeNull()
  })
})

