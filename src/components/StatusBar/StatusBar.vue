<script setup lang="ts">
import { computed } from 'vue'
import type { EditorTab } from '../../types/editor'
import type { RestoreSource } from '../../composables/useAutoSave'

const props = defineProps<{
  activeTab: EditorTab
  lastSavedAt: string
  lastRunAt: string
  storageAvailable: boolean
  restoreSource: RestoreSource
}>()

const restoreLabel = computed(() => {
  if (props.restoreSource === 'hash') {
    return '分享链接'
  }
  if (props.restoreSource === 'localStorage') {
    return '本地恢复'
  }
  return '默认模板'
})
</script>

<template>
  <footer class="status-bar">
    <span>当前：{{ activeTab.toUpperCase() }}</span>
    <span>最近运行：{{ lastRunAt }}</span>
    <span>保存：{{ storageAvailable ? lastSavedAt : '不可用' }}</span>
    <span>来源：{{ restoreLabel }}</span>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 28px;
  padding: 0 14px;
  overflow-x: auto;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  background: var(--panel);
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: nowrap;
}

.status-bar span {
  display: inline-flex;
  align-items: center;
}
</style>
