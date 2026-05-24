import { describe, expect, it } from 'vitest'
import {
  createCustomTemplate,
  normalizeCustomTemplates,
  sanitizeTemplateName,
} from '../utils/customTemplates'

describe('customTemplates', () => {
  it('sanitizes user template names', () => {
    expect(sanitizeTemplateName('  我的   模板  ')).toBe('我的 模板')
    expect(sanitizeTemplateName('a'.repeat(60))).toHaveLength(40)
  })

  it('creates a custom template from current snapshot', () => {
    const template = createCustomTemplate('课程演示', {
      html: '<main>demo</main>',
      css: 'main { color: red; }',
      js: 'console.log("demo")',
      theme: 'dark',
      templateId: 'blank',
    })

    expect(template.name).toBe('课程演示')
    expect(template.html).toBe('<main>demo</main>')
    expect(template.isCustom).toBe(true)
    expect(template.id.startsWith('custom-')).toBe(true)
  })

  it('normalizes persisted custom templates', () => {
    expect(
      normalizeCustomTemplates([
        {
          id: 'custom-1',
          name: '模板',
          description: '用户自定义模板',
          html: '',
          css: '',
          js: '',
        },
        { id: 'broken' },
      ]),
    ).toEqual([
      {
        id: 'custom-1',
        name: '模板',
        description: '用户自定义模板',
        html: '',
        css: '',
        js: '',
        isCustom: true,
      },
    ])
  })

  it('rejects empty template names', () => {
    expect(() =>
      createCustomTemplate('   ', {
        html: '',
        css: '',
        js: '',
        theme: 'light',
        templateId: 'blank',
      }),
    ).toThrow('模板名称不能为空。')
  })
})

