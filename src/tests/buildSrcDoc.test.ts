import { describe, expect, it } from 'vitest'
import { buildSrcDoc } from '../utils/buildSrcDoc'

describe('buildSrcDoc', () => {
  it('combines html css and js into a runnable document', () => {
    const srcdoc = buildSrcDoc({
      html: '<main id="app">Hello</main>',
      css: 'main { color: red; }',
      js: "console.log('ready')",
      runId: 7,
    })

    expect(srcdoc).toContain('<main id="app">Hello</main>')
    expect(srcdoc).toContain('main { color: red; }')
    expect(srcdoc).toContain("console.log('ready')")
    expect(srcdoc).toContain('online-code-editor-preview')
    expect(srcdoc).toContain('content="7"')
  })

  it('escapes closing script and style tags inside user code', () => {
    const srcdoc = buildSrcDoc({
      html: '',
      css: 'body::before { content: "</style>"; }',
      js: 'console.log("</script>")',
      runId: 1,
    })

    expect(srcdoc).toContain('<\\/style>')
    expect(srcdoc).toContain('<\\/script>')
  })
})

