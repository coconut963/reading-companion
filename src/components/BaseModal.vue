<template>
  <div class="modal-overlay">
    <div class="modal-frame">
      <header class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button class="modal-close" @click="$emit('close')" title="关闭">✕</button>
      </header>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ title: String })
defineEmits(['close'])
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(47, 42, 34, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-frame {
  background: var(--paper);
  width: min(720px, 92vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line-strong);
  outline: 3px double var(--line-strong);
  outline-offset: 3px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 3px double var(--line-strong);
  background: var(--paper-deep);
}
.modal-title {
  font-size: 17px;
  font-weight: normal;
  letter-spacing: 0.3em;
}
.modal-close {
  font-size: 16px;
  color: var(--ink-soft);
  transition: color 0.2s;
}
.modal-close:hover { color: var(--close-hover); }
.modal-body {
  padding: 20px;
  overflow-y: auto;
}
</style>