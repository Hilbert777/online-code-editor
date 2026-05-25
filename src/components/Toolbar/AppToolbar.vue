<script setup lang="ts">
import {
  CheckCircle2,
  BookmarkPlus,
  Eye,
  Link2,
  MonitorCog,
  Moon,
  Play,
  RotateCcw,
  Save,
  Sun,
  Upload,
} from 'lucide-vue-next'
import type { CodeTemplate, ThemeMode } from '../../types/editor'

// 工具栏只负责展示和抛出事件，具体业务由 PlaygroundView 统一处理。
defineProps<{
  isRunning: boolean
  isSharing: boolean
  theme: ThemeMode
  templates: CodeTemplate[]
  selectedTemplateId: string
  mobilePane: 'editor' | 'preview'
}>()

const emit = defineEmits<{
  run: []
  reset: []
  saveLocal: []
  uploadLocal: []
  saveTemplate: []
  share: []
  toggleTheme: []
  changeTemplate: [templateId: string]
  switchMobilePane: [pane: 'editor' | 'preview']
}>()

function handleTemplateChange(event: Event) {
  // select 的值是模板 id，父组件收到后再决定是否二次确认并切换模板。
  emit('changeTemplate', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <header class="app-toolbar">
    <div class="brand">
      <span class="brand-mark"><MonitorCog :size="19" /></span>
      <div>
        <strong>在线代码编辑器</strong>
        <small>HTML / CSS / JavaScript</small>
      </div>
    </div>

    <div class="run-state" :class="{ running: isRunning }" aria-live="polite">
      <CheckCircle2 v-if="!isRunning" :size="16" />
      <span v-else class="loader" />
      <span>{{ isRunning ? '运行中' : '预览就绪' }}</span>
    </div>

    <div class="toolbar-actions">
      <div class="template-select">
        <label for="templateSelect">模板</label>
        <select id="templateSelect" :value="selectedTemplateId" @change="handleTemplateChange">
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.isCustom ? `自定义：${template.name}` : template.name }}
          </option>
        </select>
      </div>

      <div class="mobile-switch" aria-label="移动端视图切换">
        <button
          type="button"
          :class="{ active: mobilePane === 'editor' }"
          @click="emit('switchMobilePane', 'editor')"
        >
          编辑器
        </button>
        <button
          type="button"
          :class="{ active: mobilePane === 'preview' }"
          @click="emit('switchMobilePane', 'preview')"
        >
          <Eye :size="15" />
          预览
        </button>
      </div>

      <button type="button" class="tool-button primary" :disabled="isRunning" @click="emit('run')">
        <Play :size="16" />
        运行
      </button>

      <button type="button" class="tool-button" @click="emit('reset')">
        <RotateCcw :size="16" />
        重置
      </button>

      <button type="button" class="tool-button" @click="emit('saveLocal')">
        <Save :size="16" />
        保存
      </button>

      <button type="button" class="tool-button" @click="emit('uploadLocal')">
        <Upload :size="16" />
        上传
      </button>

      <button type="button" class="tool-button" @click="emit('saveTemplate')">
        <BookmarkPlus :size="16" />
        保存为模板
      </button>

      <button type="button" class="tool-button" :disabled="isSharing" @click="emit('share')">
        <Link2 :size="16" />
        {{ isSharing ? '生成中' : '分享' }}
      </button>

      <button type="button" class="tool-button" @click="emit('toggleTheme')">
        <Sun v-if="theme === 'dark'" :size="16" />
        <Moon v-else :size="16" />
        {{ theme === 'dark' ? '浅色' : '深色' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-toolbar {
  display: grid;
  grid-template-columns: minmax(210px, auto) auto 1fr;
  align-items: center;
  gap: 16px;
  min-height: 64px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  backdrop-filter: blur(16px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #f8fafc;
  background: linear-gradient(135deg, #2563eb, #0f766e);
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  color: var(--text-strong);
  font-size: 15px;
}

.brand small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.run-state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  justify-self: start;
  min-height: 30px;
  border: 1px solid var(--success-border);
  border-radius: 8px;
  padding: 0 10px;
  color: var(--success);
  background: var(--success-soft);
  font-size: 13px;
  font-weight: 700;
}

.run-state.running {
  border-color: var(--accent-border);
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 760ms linear infinite;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.template-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.template-select select {
  width: 136px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 0 8px;
  color: var(--text-strong);
  background: var(--surface);
  font: inherit;
}

.tool-button,
.mobile-switch button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 0 11px;
  color: var(--text-strong);
  background: var(--surface);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    transform 120ms ease;
}

.tool-button:hover,
.mobile-switch button:hover {
  border-color: var(--accent-border);
  background: var(--hover);
}

.tool-button:active,
.mobile-switch button:active {
  transform: translateY(1px);
}

.tool-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.tool-button.primary {
  border-color: var(--accent);
  color: white;
  background: var(--accent);
}

.tool-button.primary:hover {
  border-color: var(--accent-strong);
  background: var(--accent-strong);
}

.mobile-switch {
  display: none;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.mobile-switch button {
  border: 0;
  background: transparent;
}

.mobile-switch button.active {
  color: var(--accent-strong);
  background: var(--accent-soft);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1120px) {
  .app-toolbar {
    grid-template-columns: 1fr auto;
  }

  .run-state {
    display: none;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .app-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 10px;
  }

  .toolbar-actions {
    justify-content: stretch;
  }

  .template-select {
    width: 100%;
  }

  .template-select select {
    flex: 1;
    width: auto;
  }

  .tool-button {
    flex: 1 1 calc(50% - 8px);
  }

  .mobile-switch {
    display: flex;
    width: 100%;
  }

  .mobile-switch button {
    flex: 1;
  }
}
</style>
