<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/language/html/monaco.contribution'
import 'monaco-editor/esm/vs/language/css/monaco.contribution'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'
import { Code2 } from 'lucide-vue-next'
import { useEditorStore } from '../../stores/editor'
import type { EditorTab } from '../../types/editor'

const workerHost = self as unknown as {
  MonacoEnvironment?: {
    getWorker: (_moduleId: string, label: string) => Worker
  }
}

workerHost.MonacoEnvironment = {
  getWorker: (_moduleId: string, label: string) => {
    if (label === 'html') {
      return new HtmlWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker()
    }
    return new EditorWorker()
  },
}

const tabs: Array<{ id: EditorTab; label: string; language: string; fileName: string }> = [
  { id: 'html', label: 'HTML', language: 'html', fileName: 'index.html' },
  { id: 'css', label: 'CSS', language: 'css', fileName: 'style.css' },
  { id: 'js', label: 'JS', language: 'javascript', fileName: 'script.js' },
]

const store = useEditorStore()
const containerRef = ref<HTMLElement | null>(null)
const fallbackMode = ref(false)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
const models = new Map<EditorTab, monaco.editor.ITextModel>()
const disposables: monaco.IDisposable[] = []

const activeTabMeta = computed(() => tabs.find((tab) => tab.id === store.activeTab) ?? tabs[0])
const activeCode = computed(() => getCode(store.activeTab))

function getCode(tab: EditorTab): string {
  if (tab === 'html') {
    return store.html
  }
  if (tab === 'css') {
    return store.css
  }
  return store.js
}

function createModel(tab: (typeof tabs)[number]) {
  const model = monaco.editor.createModel(
    getCode(tab.id),
    tab.language,
    monaco.Uri.parse(`file:///playground/${tab.fileName}`),
  )

  // Monaco 内容变化后同步回 Pinia，预览更新由 store watcher 统一防抖处理。
  disposables.push(
    model.onDidChangeContent(() => {
      const value = model.getValue()
      if (value !== getCode(tab.id)) {
        store.setCode(tab.id, value)
      }
    }),
  )

  models.set(tab.id, model)
}

function syncModel(tab: EditorTab, value: string) {
  const model = models.get(tab)
  if (model && model.getValue() !== value) {
    model.setValue(value)
  }
}

function setupEditor() {
  if (!containerRef.value) {
    return
  }

  tabs.forEach(createModel)

  editor = monaco.editor.create(containerRef.value, {
    model: models.get(store.activeTab) ?? null,
    theme: store.theme === 'dark' ? 'vs-dark' : 'vs',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, "SFMono-Regular", monospace',
    lineNumbers: 'on',
    minimap: { enabled: false },
    padding: { top: 14, bottom: 14 },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    tabSize: 2,
    wordWrap: 'on',
    renderLineHighlight: 'all',
  })
}

function handleTextareaInput(event: Event) {
  store.setCode(store.activeTab, (event.target as HTMLTextAreaElement).value)
}

onMounted(async () => {
  await nextTick()

  try {
    setupEditor()
  } catch (error) {
    console.error(error)
    fallbackMode.value = true
  }
})

watch(
  () => store.activeTab,
  (tab) => {
    editor?.setModel(models.get(tab) ?? null)
    editor?.focus()
  },
)

watch(
  () => store.theme,
  (theme) => {
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs')
  },
)

watch(
  () => store.html,
  (value) => syncModel('html', value),
)

watch(
  () => store.css,
  (value) => syncModel('css', value),
)

watch(
  () => store.js,
  (value) => syncModel('js', value),
)

onBeforeUnmount(() => {
  disposables.forEach((disposable) => disposable.dispose())
  models.forEach((model) => model.dispose())
  editor?.dispose()
})
</script>

<template>
  <section class="code-editor" aria-label="代码编辑器">
    <header class="editor-header">
      <div class="editor-title">
        <Code2 :size="18" />
        <span>代码编辑区</span>
      </div>

      <nav class="editor-tabs" aria-label="代码类型">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="tab-button"
          :class="{ active: store.activeTab === tab.id }"
          @click="store.setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <span class="file-name">{{ activeTabMeta.fileName }}</span>
    </header>

    <div class="editor-body">
      <div v-show="!fallbackMode" ref="containerRef" class="monaco-host" />
      <textarea
        v-if="fallbackMode"
        class="fallback-editor"
        :value="activeCode"
        spellcheck="false"
        @input="handleTextareaInput"
      />
    </div>
  </section>
</template>

<style scoped>
.code-editor {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--panel);
  box-shadow: var(--shadow-sm);
}

.editor-header {
  display: grid;
  grid-template-columns: minmax(120px, auto) 1fr auto;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-muted);
}

.editor-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-strong);
  font-weight: 700;
  white-space: nowrap;
}

.editor-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-self: center;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.tab-button {
  min-width: 64px;
  height: 32px;
  border: 0;
  border-radius: 6px;
  color: var(--text-muted);
  background: transparent;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.tab-button:hover {
  color: var(--text-strong);
  background: var(--hover);
}

.tab-button.active {
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.file-name {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: nowrap;
}

.editor-body,
.monaco-host,
.fallback-editor {
  min-height: 0;
  height: 100%;
}

.fallback-editor {
  width: 100%;
  resize: none;
  border: 0;
  padding: 16px;
  color: var(--editor-text);
  background: var(--editor-bg);
  font: 14px/1.6 var(--font-mono);
  outline: none;
}

@media (max-width: 720px) {
  .editor-header {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: 8px;
    padding: 10px;
  }

  .editor-tabs {
    justify-self: stretch;
  }

  .tab-button {
    flex: 1;
  }

  .file-name {
    display: none;
  }
}
</style>
