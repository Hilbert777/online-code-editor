import type { EditorSnapshot } from '../types/editor'

function escapeClosingTag(value: string, tagName: 'script' | 'style'): string {
  return value.replace(new RegExp(`</${tagName}`, 'gi'), `<\\/${tagName}`)
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function createExportFileName(date = new Date()): string {
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const timePart = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `online-code-editor-${datePart}-${timePart}.html`
}

export function buildStandaloneHtml(snapshot: EditorSnapshot): string {
  const safeCss = escapeClosingTag(snapshot.css, 'style')
  const safeJs = escapeClosingTag(snapshot.js, 'script')

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>在线代码编辑器导出页面</title>
    <style>
${safeCss}
    </style>
  </head>
  <body>
${snapshot.html}
    <script>
      // 导出的文件直接在浏览器中运行当前 JavaScript。
${safeJs}
    <\/script>
  </body>
</html>`
}

export function downloadTextFile(content: string, fileName: string, mimeType = 'text/html;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadStandaloneHtml(snapshot: EditorSnapshot): string {
  const fileName = createExportFileName()
  downloadTextFile(buildStandaloneHtml(snapshot), fileName)
  return fileName
}

