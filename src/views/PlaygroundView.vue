<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import ConsolePanel from '../components/ConsolePanel/ConsolePanel.vue'
import CodeEditor from '../components/EditorPanel/CodeEditor.vue'
import PreviewPanel from '../components/PreviewPanel/PreviewPanel.vue'
import ShareDialog from '../components/ShareDialog.vue'
import StatusBar from '../components/StatusBar/StatusBar.vue'
import ToastMessage from '../components/ToastMessage.vue'
import AppToolbar from '../components/Toolbar/AppToolbar.vue'
import { useAutoSave } from '../composables/useAutoSave'
import { useConsoleCapture } from '../composables/useConsoleCapture'
import { usePreview } from '../composables/usePreview'
import { useShare } from '../composables/useShare'
import { useEditorStore } from '../stores/editor'
import { downloadStandaloneHtml } from '../utils/exportCode'
import { readLocalCodeFiles } from '../utils/importCode'

type ToastType = 'success' | 'error' | 'info'
type ResizeTarget = 'editorPreview' | 'console'

const MIN_EDITOR_PANE = 320
const MIN_STACK_PANE = 260
const MIN_CONSOLE_HEIGHT = 130
const RESIZER_SIZE = 10

const store = useEditorStore()
store.hydrateCustomTemplates()
const autoSave = useAutoSave(store)
const restoredFrom = autoSave.restore()
const preview = usePreview(store)
const share = useShare(store)
const iframeWindow = ref<Window | null>(null)
const mobilePane = ref<'editor' | 'preview'>('editor')
const toast = ref<{ message: string; type: ToastType } | null>(null)
const shareUrl = ref('')
const isShareDialogOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const workspaceRef = ref<HTMLElement | null>(null)
const editorPaneSize = ref('52%')
const editorStackSize = ref('52%')
const consoleHeight = ref(240)
const resizeTarget = ref<ResizeTarget | null>(null)
let toastTimer = 0

useConsoleCapture(() => iframeWindow.value, store)

const layoutStyle = computed<CSSProperties>(() => ({
  '--editor-pane-size': editorPaneSize.value,
  '--editor-stack-size': editorStackSize.value,
  '--console-height': `${consoleHeight.value}px`,
}))

watch(
  () => store.theme,
  (theme) => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  },
  { immediate: true },
)

function showToast(message: string, type: ToastType = 'info') {
  window.clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = window.setTimeout(() => {
    toast.value = null
  }, 1500)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isStackedWorkspace() {
  return window.matchMedia('(max-width: 900px)').matches
}

function handleResizeMove(event: PointerEvent) {
  if (!resizeTarget.value) {
    return
  }

  if (resizeTarget.value === 'editorPreview' && workspaceRef.value) {
    const rect = workspaceRef.value.getBoundingClientRect()

    if (isStackedWorkspace()) {
      const maxHeight = Math.max(MIN_STACK_PANE, rect.height - MIN_STACK_PANE - RESIZER_SIZE)
      const nextHeight = clamp(event.clientY - rect.top, MIN_STACK_PANE, maxHeight)
      editorStackSize.value = `${Math.round(nextHeight)}px`
      return
    }

    const maxWidth = Math.max(MIN_EDITOR_PANE, rect.width - MIN_EDITOR_PANE - RESIZER_SIZE)
    const nextWidth = clamp(event.clientX - rect.left, MIN_EDITOR_PANE, maxWidth)
    editorPaneSize.value = `${Math.round(nextWidth)}px`
    return
  }

  if (resizeTarget.value === 'console' && shellRef.value) {
    const rect = shellRef.value.getBoundingClientRect()
    const maxHeight = Math.max(MIN_CONSOLE_HEIGHT, rect.height * 0.55)
    const statusBarHeight = 28
    const nextHeight = clamp(rect.bottom - event.clientY - statusBarHeight, MIN_CONSOLE_HEIGHT, maxHeight)
    consoleHeight.value = Math.round(nextHeight)
  }
}

function stopResize() {
  resizeTarget.value = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', handleResizeMove)
  window.removeEventListener('pointerup', stopResize)
}

function startResize(event: PointerEvent, target: ResizeTarget) {
  if (target === 'editorPreview' && window.matchMedia('(max-width: 760px)').matches) {
    return
  }

  event.preventDefault()
  resizeTarget.value = target
  document.body.style.cursor =
    target === 'console' || isStackedWorkspace() ? 'row-resize' : 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', handleResizeMove)
  window.addEventListener('pointerup', stopResize)
}

function handleRun() {
  preview.refreshPreview('manual')
  showToast('已重新运行当前代码', 'success')
}

function handleReset() {
  if (!window.confirm('确定要恢复默认模板吗？当前代码会被覆盖。')) {
    return
  }

  store.resetToDefault()
  store.clearLogs()
  preview.refreshPreview('template')
  showToast('已恢复默认模板', 'success')
}

function handleTemplateChange(templateId: string) {
  if (templateId === store.templateId) {
    return
  }

  const template = store.findTemplateById(templateId)
  if (!window.confirm(`确定切换到「${template.name}」吗？当前代码会被覆盖。`)) {
    return
  }

  store.applyTemplate(templateId)
  store.clearLogs()
  preview.refreshPreview('template')
  showToast(`已切换到${template.name}`, 'success')
}

function handleShare() {
  try {
    shareUrl.value = share.createShareLink()
    isShareDialogOpen.value = true
    showToast('分享链接已生成', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成分享链接失败'
    showToast(message, 'error')
  }
}

async function copyShareUrl() {
  try {
    await share.copyText(shareUrl.value)
    showToast('分享链接已复制', 'success')
  } catch {
    showToast('复制失败，请手动选择链接复制', 'error')
  }
}

function handleSaveLocal() {
  try {
    const fileName = downloadStandaloneHtml(store.snapshot)
    showToast(`已保存：${fileName}`, 'success')
  } catch {
    showToast('保存失败，请检查浏览器下载权限', 'error')
  }
}

function handleUploadLocal() {
  fileInputRef.value?.click()
}

function handleSaveTemplate() {
  const name = window.prompt('请输入模板名称', '')

  if (name === null) {
    return
  }

  try {
    const template = store.saveAsCustomTemplate(name)
    showToast(`已保存为模板：${template.name}`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存模板失败'
    showToast(message, 'error')
  }
}

function getImportedActiveTab(code: { html?: string; css?: string; js?: string }) {
  if (typeof code.html === 'string') {
    return 'html'
  }
  if (typeof code.css === 'string') {
    return 'css'
  }
  return 'js'
}

async function handleLocalCodeSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) {
    return
  }

  if (!window.confirm('上传本地代码会覆盖对应编辑区内容，是否继续？')) {
    input.value = ''
    return
  }

  try {
    const imported = await readLocalCodeFiles(files)

    if (imported.snapshot) {
      store.hydrate(imported.snapshot)
    } else if (
      typeof imported.html === 'string' ||
      typeof imported.css === 'string' ||
      typeof imported.js === 'string'
    ) {
      store.importCode(imported)
      store.setActiveTab(getImportedActiveTab(imported))
    } else {
      showToast('未识别文件内容，请上传 HTML、CSS、JS 或 JSON 文件', 'error')
      return
    }

    store.clearLogs()
    preview.refreshPreview('manual')
    showToast(`已上传：${imported.fileNames.join('、')}`, 'success')
  } catch {
    showToast('上传失败，请确认文件内容和编码格式', 'error')
  } finally {
    input.value = ''
  }
}

function toggleTheme() {
  store.setTheme(store.theme === 'dark' ? 'light' : 'dark')
}

function handleFrameChange(frameWindow: Window | null) {
  iframeWindow.value = frameWindow
}

function handlePreviewLoaded() {
  store.finishRun()
}

onMounted(() => {
  if (restoredFrom === 'hash') {
    showToast('已从分享链接恢复代码', 'success')
  } else if (restoredFrom === 'localStorage') {
    showToast('已恢复上次编辑内容', 'info')
  } else if (!autoSave.storageAvailable.value) {
    showToast('本地存储不可用，将仅保留当前会话内容', 'error')
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
  stopResize()
})
</script>

<template>
  <div ref="shellRef" class="app-shell" :class="{ resizing: resizeTarget }" :style="layoutStyle">
    <AppToolbar
      :is-running="store.isRunning"
      :is-sharing="share.isSharing.value"
      :theme="store.theme"
      :templates="store.allTemplates"
      :selected-template-id="store.templateId"
      :mobile-pane="mobilePane"
      @run="handleRun"
      @reset="handleReset"
      @save-local="handleSaveLocal"
      @upload-local="handleUploadLocal"
      @save-template="handleSaveTemplate"
      @share="handleShare"
      @toggle-theme="toggleTheme"
      @change-template="handleTemplateChange"
      @switch-mobile-pane="mobilePane = $event"
    />

    <input
      ref="fileInputRef"
      class="local-file-input"
      type="file"
      accept=".html,.htm,.css,.js,.mjs,.json,text/html,text/css,text/javascript,application/javascript,application/json"
      multiple
      @change="handleLocalCodeSelected"
    />

    <main ref="workspaceRef" class="workspace" :class="`show-${mobilePane}`">
      <section class="editor-pane" aria-label="编辑器区域">
        <CodeEditor />
      </section>

      <button
        type="button"
        class="pane-resizer editor-preview-resizer"
        aria-label="拖动调整代码编辑区和实时预览区大小"
        title="拖动调整代码编辑区和实时预览区大小"
        @pointerdown="startResize($event, 'editorPreview')"
      />

      <section class="preview-pane" aria-label="预览区域">
        <PreviewPanel
          :srcdoc="preview.previewSrcDoc.value"
          :version="preview.previewVersion.value"
          :error-message="store.latestError"
          @frame-change="handleFrameChange"
          @loaded="handlePreviewLoaded"
        />
      </section>
    </main>

    <button
      type="button"
      class="pane-resizer console-resizer"
      aria-label="拖动调整工作区和控制台大小"
      title="拖动调整工作区和控制台大小"
      @pointerdown="startResize($event, 'console')"
    />

    <ConsolePanel :logs="store.logs" @clear="store.clearLogs" />

    <StatusBar
      :active-tab="store.activeTab"
      :last-saved-at="autoSave.lastSavedAt.value"
      :last-run-at="store.lastRunAt"
      :storage-available="autoSave.storageAvailable.value"
      :restore-source="autoSave.restoreSource.value"
    />

    <ToastMessage v-if="toast" :message="toast.message" :type="toast.type" />

    <ShareDialog
      v-if="isShareDialogOpen"
      :share-url="shareUrl"
      @copy="copyShareUrl"
      @close="isShareDialogOpen = false"
    />
  </div>
</template>

<style scoped>
.app-shell {
  --editor-pane-size: 52%;
  --editor-stack-size: 52%;
  --console-height: 240px;

  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 10px minmax(130px, var(--console-height)) auto;
  min-height: 100vh;
  color: var(--text);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 50%, transparent), transparent 32%),
    var(--app-bg);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(320px, var(--editor-pane-size)) 10px minmax(320px, 1fr);
  gap: 0;
  min-height: 0;
  padding: 12px;
}

.local-file-input {
  display: none;
}

.editor-pane,
.preview-pane {
  min-width: 0;
  min-height: 0;
}

.editor-pane,
.preview-pane {
  display: grid;
}

.editor-pane {
  padding-right: 6px;
}

.preview-pane {
  padding-left: 6px;
}

.pane-resizer {
  position: relative;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: col-resize;
}

.pane-resizer::before {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-muted) 28%, transparent);
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.pane-resizer:hover::before,
.app-shell.resizing .pane-resizer::before {
  background: var(--accent);
}

.editor-preview-resizer {
  width: 10px;
  min-height: 0;
}

.editor-preview-resizer::before {
  width: 3px;
  height: min(72px, 35%);
}

.console-resizer {
  height: 10px;
  cursor: row-resize;
}

.console-resizer::before {
  width: min(96px, 30%);
  height: 3px;
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: minmax(300px, var(--editor-pane-size)) 10px minmax(300px, 1fr);
  }
}

@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(260px, var(--editor-stack-size)) 10px minmax(260px, 1fr);
  }

  .editor-pane,
  .preview-pane {
    padding: 0;
  }

  .editor-preview-resizer {
    width: auto;
    height: 10px;
    cursor: row-resize;
  }

  .editor-preview-resizer::before {
    width: min(96px, 30%);
    height: 3px;
  }
}

@media (max-width: 760px) {
  .app-shell {
    grid-template-rows: auto minmax(0, 1fr) 10px minmax(130px, var(--console-height)) auto;
  }

  .workspace {
    grid-template-rows: minmax(0, 1fr);
    padding: 10px;
  }

  .workspace.show-editor .preview-pane,
  .workspace.show-preview .editor-pane {
    display: none;
  }

  .editor-preview-resizer {
    display: none;
  }
}
</style>
