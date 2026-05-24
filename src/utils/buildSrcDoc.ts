export interface BuildSrcDocInput {
  html: string
  css: string
  js: string
  runId: number
}

function escapeClosingTag(value: string, tagName: 'script' | 'style'): string {
  return value.replace(new RegExp(`</${tagName}`, 'gi'), `<\\/${tagName}`)
}

const consoleBridgeScript = `
(function () {
  var SOURCE = 'online-code-editor-preview';

  function serialize(value) {
    try {
      if (value instanceof Error) {
        return value.stack || value.message;
      }
      if (typeof value === 'string') {
        return value;
      }
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  function send(level, args) {
    parent.postMessage({
      source: SOURCE,
      event: 'console',
      level: level,
      message: Array.prototype.slice.call(args).map(serialize).join(' ')
    }, '*');
  }

  ['log', 'warn', 'error'].forEach(function (level) {
    var nativeConsole = console[level];
    console[level] = function () {
      send(level, arguments);
      nativeConsole.apply(console, arguments);
    };
  });

  window.addEventListener('error', function (event) {
    send('error', [event.message + ' (' + event.lineno + ':' + event.colno + ')']);
  });

  window.addEventListener('unhandledrejection', function (event) {
    send('error', ['Unhandled promise rejection:', event.reason]);
  });
})();`

export function buildSrcDoc({ html, css, js, runId }: BuildSrcDocInput): string {
  const safeCss = escapeClosingTag(css, 'style')
  const safeJs = escapeClosingTag(js, 'script')

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-online-editor-run" content="${runId}" />
    <style>
      ${safeCss}
    </style>
    <script>
      // 在沙箱 iframe 内重写 console，把日志安全转发给宿主页面。
      ${consoleBridgeScript}
    <\/script>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${safeJs}
      } catch (error) {
        console.error(error);
      }
    <\/script>
  </body>
</html>`
}

