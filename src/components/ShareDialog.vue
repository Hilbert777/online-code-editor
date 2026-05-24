<script setup lang="ts">
import { Copy, Link2, X } from 'lucide-vue-next'

defineProps<{
  shareUrl: string
}>()

const emit = defineEmits<{
  close: []
  copy: []
}>()

function selectShareUrl(event: FocusEvent) {
  const textarea = event.target as HTMLTextAreaElement
  textarea.select()
}
</script>

<template>
  <div class="dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section class="share-dialog" role="dialog" aria-modal="true" aria-labelledby="shareTitle">
      <header>
        <div>
          <Link2 :size="18" />
          <h2 id="shareTitle">分享代码</h2>
        </div>

        <button type="button" class="icon-button" aria-label="关闭分享弹窗" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <p>复制下面的链接，别人打开后会恢复当前代码内容。</p>

      <textarea class="share-url" :value="shareUrl" readonly rows="4" @focus="selectShareUrl" />

      <footer>
        <button type="button" class="copy-button" @click="emit('copy')">
          <Copy :size="16" />
          复制链接
        </button>
        <button type="button" class="secondary-button" @click="emit('close')">关闭</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(8px);
}

.share-dialog {
  width: min(560px, 100%);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px;
  color: var(--text);
  background: var(--panel);
  box-shadow: var(--shadow-md);
}

.share-dialog header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.share-dialog header div {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-strong);
}

.share-dialog h2 {
  margin: 0;
  font-size: 17px;
}

.share-dialog p {
  margin: 12px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-strong);
  background: var(--surface);
  cursor: pointer;
}

.share-url {
  width: 100%;
  min-height: 96px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  color: var(--text-strong);
  background: var(--surface);
  font: 12px/1.5 var(--font-mono);
}

.share-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.copy-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.copy-button {
  border-color: var(--accent);
  color: white;
  background: var(--accent);
}

.copy-button:hover {
  background: var(--accent-strong);
}

.secondary-button {
  color: var(--text-strong);
  background: var(--surface);
}

@media (max-width: 520px) {
  .share-dialog footer {
    flex-direction: column;
  }

  .copy-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
