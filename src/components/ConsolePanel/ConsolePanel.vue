<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Terminal, Trash2 } from 'lucide-vue-next'
import type { ConsoleLogItem } from '../../types/editor'

const props = defineProps<{
  logs: ConsoleLogItem[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const listRef = ref<HTMLElement | null>(null)

watch(
  () => props.logs.length,
  async () => {
    // 新日志进入后自动滚动到底部，模拟浏览器开发者工具控制台体验。
    await nextTick()
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  },
)
</script>

<template>
  <section class="console-panel" aria-label="控制台输出">
    <header class="console-header">
      <div>
        <Terminal :size="17" />
        <strong>控制台</strong>
      </div>

      <button type="button" :disabled="logs.length === 0" @click="emit('clear')">
        <Trash2 :size="15" />
        清空
      </button>
    </header>

    <div ref="listRef" class="console-list">
      <p v-if="logs.length === 0" class="empty-console">暂无输出。console.log / warn / error 会显示在这里。</p>

      <article v-for="log in logs" :key="log.id" class="console-line" :class="log.type">
        <time>{{ log.time }}</time>
        <span class="log-type">{{ log.type }}</span>
        <pre>{{ log.message }}</pre>
      </article>
    </div>
  </section>
</template>

<style scoped>
.console-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  border-top: 1px solid var(--console-border);
  color: var(--console-text);
  background: var(--console-bg);
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 0 14px;
  border-bottom: 1px solid var(--console-border);
  background: var(--console-header-bg);
}

.console-header div,
.console-header button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.console-header strong {
  color: var(--console-strong);
}

.console-header button {
  height: 28px;
  border: 1px solid var(--console-border);
  border-radius: 7px;
  padding: 0 9px;
  color: var(--console-button-text);
  background: var(--console-button-bg);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.console-header button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.console-list {
  min-height: 0;
  overflow: auto;
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.empty-console {
  margin: 24px 0;
  color: var(--console-muted);
  text-align: center;
}

.console-line {
  display: grid;
  grid-template-columns: 78px 54px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 7px 0;
  border-bottom: 1px solid var(--console-line-border);
}

.console-line time {
  color: var(--console-muted);
}

.log-type {
  width: fit-content;
  border-radius: 6px;
  padding: 2px 6px;
  color: var(--console-log-type);
  background: var(--console-log-bg);
  text-transform: uppercase;
}

.console-line.warn .log-type {
  color: var(--console-warn);
  background: var(--console-warn-bg);
}

.console-line.error .log-type {
  color: var(--console-error);
  background: var(--console-error-bg);
}

.console-line pre {
  min-width: 0;
  margin: 0;
  overflow: auto;
  color: var(--console-pre);
  white-space: pre-wrap;
  word-break: break-word;
}

.console-line.warn pre {
  color: var(--console-warn);
}

.console-line.error pre {
  color: var(--console-error);
}

@media (max-width: 640px) {
  .console-line {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
