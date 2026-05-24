<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { AlertTriangle, Eye } from 'lucide-vue-next'

const props = defineProps<{
  srcdoc: string
  version: number
  errorMessage: string | null
}>()

const emit = defineEmits<{
  frameChange: [frameWindow: Window | null]
  loaded: []
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)

function emitFrameWindow() {
  emit('frameChange', iframeRef.value?.contentWindow ?? null)
}

function handleLoad() {
  loading.value = false
  emitFrameWindow()
  emit('loaded')
}

watch(
  () => props.version,
  () => {
    loading.value = true
  },
)

onMounted(() => {
  emitFrameWindow()
})
</script>

<template>
  <section class="preview-panel" aria-label="实时预览">
    <header class="preview-header">
      <div>
        <Eye :size="18" />
        <strong>实时预览</strong>
      </div>
      <span>Sandbox iframe</span>
    </header>

    <div class="preview-surface">
      <div v-if="errorMessage" class="error-bar" role="alert">
        <AlertTriangle :size="16" />
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="loading" class="preview-loading">正在运行代码...</div>

      <iframe
        :key="version"
        ref="iframeRef"
        title="代码运行结果"
        sandbox="allow-scripts allow-forms allow-modals"
        :srcdoc="srcdoc"
        @load="handleLoad"
      />
    </div>
  </section>
</template>

<style scoped>
.preview-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--panel);
  box-shadow: var(--shadow-sm);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-muted);
}

.preview-header div {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-strong);
}

.preview-header span {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
}

.preview-surface {
  position: relative;
  min-height: 0;
  background: #fff;
}

.preview-surface iframe {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  border: 0;
  background: white;
}

.preview-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.78);
  font-weight: 800;
  backdrop-filter: blur(4px);
}

.error-bar {
  position: absolute;
  z-index: 3;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 8px;
  padding: 8px 10px;
  color: #991b1b;
  background: rgba(254, 242, 242, 0.94);
  box-shadow: 0 12px 30px rgba(127, 29, 29, 0.13);
}

.error-bar span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

