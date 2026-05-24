import { describe, expect, it } from 'vitest'
import { buildStandaloneHtml } from '../utils/exportCode'
import {
  getLocalCodeFileKind,
  mergeImportedCode,
  parseLocalCodeFile,
} from '../utils/importCode'

describe('importCode', () => {
  it('detects supported local code file kinds', () => {
    expect(getLocalCodeFileKind('index.html')).toBe('html')
    expect(getLocalCodeFileKind('style.css')).toBe('css')
    expect(getLocalCodeFileKind('script.mjs')).toBe('js')
    expect(getLocalCodeFileKind('snapshot.json')).toBe('json')
    expect(getLocalCodeFileKind('README.md')).toBe('unknown')
  })

  it('extracts html css and js from standalone html', () => {
    const exported = buildStandaloneHtml({
      html: '<main><h1>Uploaded</h1></main>',
      css: 'h1 { color: red; }',
      js: "console.log('uploaded')",
      theme: 'dark',
      templateId: 'blank',
    })
    const imported = parseLocalCodeFile('demo.html', exported)

    expect(imported.html).toContain('<main><h1>Uploaded</h1></main>')
    expect(imported.css).toContain('h1 { color: red; }')
    expect(imported.js).toContain("console.log('uploaded')")
  })

  it('merges multiple local code files', () => {
    const merged = mergeImportedCode([
      parseLocalCodeFile('index.html', '<main>Local</main>'),
      parseLocalCodeFile('style.css', 'main { display: grid; }'),
      parseLocalCodeFile('script.js', 'console.log("local")'),
    ])

    expect(merged.html).toContain('<main>Local</main>')
    expect(merged.css).toBe('main { display: grid; }')
    expect(merged.js).toBe('console.log("local")')
    expect(merged.fileNames).toEqual(['index.html', 'style.css', 'script.js'])
  })
})

