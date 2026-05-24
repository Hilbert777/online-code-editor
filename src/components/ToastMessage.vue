<script setup lang="ts">
defineProps<{
  message: string
  type: 'success' | 'error' | 'info'
}>()
</script>

<template>
  <div class="toast" :class="type" role="status">
    {{ message }}
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  z-index: 20;
  right: 18px;
  bottom: 44px;
  max-width: min(420px, calc(100vw - 36px));
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 11px 13px;
  color: var(--text-strong);
  background: var(--panel);
  box-shadow: var(--shadow-md);
  animation: toast-in 180ms ease-out;
}

.toast.success {
  border-color: var(--success-border);
  color: var(--success);
  background: var(--success-soft);
}

.toast.error {
  border-color: var(--danger-border);
  color: var(--danger);
  background: var(--danger-soft);
}

.toast.info {
  border-color: var(--accent-border);
  color: var(--accent-strong);
  background: var(--accent-soft);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>

