import { describe, expect, it } from 'vitest'
import { buildStandaloneHtml, createExportFileName } from '../utils/exportCode'

describe('exportCode', () => {
  it('builds a standalone html document with current code', () => {
    const html = buildStandaloneHtml({
      html: '<main>Hello</main>',
      css: 'main { color: red; }',
      js: "console.log('saved')",
      theme: 'dark',
      templateId: 'blank',
    })

    expect(html).toContain('<main>Hello</main>')
    expect(html).toContain('main { color: red; }')
    expect(html).toContain("console.log('saved')")
    expect(html).toContain('<!doctype html>')
  })

  it('escapes closing tags and creates stable file names', () => {
    const html = buildStandaloneHtml({
      html: '',
      css: 'body::before { content: "</style>"; }',
      js: 'console.log("</script>")',
      theme: 'light',
      templateId: 'blank',
    })

    expect(html).toContain('<\\/style>')
    expect(html).toContain('<\\/script>')
    expect(createExportFileName(new Date('2026-05-15T08:09:10'))).toBe(
      'online-code-editor-20260515-080910.html',
    )
  })
})

