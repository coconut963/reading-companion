<template>
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-brand" title="共读">共<br />读</div>
      <hr class="rule-thin" />
      <button class="side-btn" @click="activeModal = 'bookshelf'">书<br />架</button>
      <button class="side-btn" @click="activeModal = 'persona'">角<br />色</button>
      <button class="side-btn" @click="activeModal = 'memory'">记<br />忆</button>
      <button class="side-btn" @click="activeModal = 'theme'">主<br />题</button>
      <button class="side-btn" @click="activeModal = 'settings'">设<br />置</button>
    </nav>
    <div class="main-area">
      <header class="top-bar">
        <span class="book-title">{{ currentBook ? currentBook.title : '尚未打开书籍' }}</span>
        <span class="chapter-title" v-if="currentChapterTitle">{{ currentChapterTitle }}</span>
      </header>
      <ReaderView
        v-if="currentBook"
        :book="currentBook"
        @chapterChange="ch => currentChapterTitle = ch?.title || ''"
      />
      <div class="empty-zone" v-else>
        <div class="empty-state">
          <div class="mobius-container">
          <svg class="mobius-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path class="mobius-path" d="M100 40 C140 40, 170 70, 170 100 C170 130, 140 160, 100 160 C60 160, 30 130, 30 100 C30 70, 60 40, 100 40" fill="none" stroke="currentColor" stroke-width="1"/>
            <path class="mobius-path-inner" d="M100 55 C130 55, 155 75, 155 100 C155 125, 130 145, 100 145 C70 145, 45 125, 45 100 C45 75, 70 55, 100 55" fill="none" stroke="currentColor" stroke-width="1"/>
            <path class="mobius-twist" d="M85 40 Q100 20, 115 40 M85 160 Q100 180, 115 160" fill="none" stroke="currentColor" stroke-width="1"/>
            <path class="mobius-cross" d="M30 100 Q65 85, 100 100 Q135 115, 170 100" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
          </svg>
          </div>
          <p class="empty-text">打开「书架」导入一本 EPUB，开始共读</p>
        </div>
      </div>
    </div>
    <BaseModal v-if="activeModal === 'bookshelf'" title="书 架" @close="activeModal = null">
      <Bookshelf @bookOpened="handleBookOpen" @close="activeModal = null" />
    </BaseModal>
    <BaseModal v-if="activeModal === 'persona'" title="角 色" @close="activeModal = null">
      <PersonaEditor />
    </BaseModal>
    <BaseModal v-if="activeModal === 'memory'" title="记 忆" @close="activeModal = null">
      <MemoryPanel :book="currentBook" />
    </BaseModal>
    <BaseModal v-if="activeModal === 'theme'" title="主 题" @close="activeModal = null">
      <ThemePanel />
    </BaseModal>
    <BaseModal v-if="activeModal === 'settings'" title="设 置" @close="activeModal = null">
      <SettingsPanel />
    </BaseModal>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import BaseModal from './components/BaseModal.vue'
import Bookshelf from './components/Bookshelf.vue'
import ReaderView from './components/ReaderView.vue'
import PersonaEditor from './components/PersonaEditor.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import MemoryPanel from './components/MemoryPanel.vue'
import ThemePanel from './components/ThemePanel.vue'
import { getSetting, db } from './db/database.js'
const activeModal = ref(null)
const currentBook = ref(null)
const currentChapterTitle = ref('')
function handleBookOpen(book) {
  currentBook.value = book
  currentChapterTitle.value = ''
}
onMounted(async () => {
  const allFonts = await db.fonts.toArray()
  for (const f of allFonts) {
    const existing = document.querySelector(`style[data-font-id="${f.id}"]`)
    if (existing) continue
    const style = document.createElement('style')
    style.dataset.fontId = f.id
    style.textContent = `
      @font-face {
        font-family: '${f.familyName}';
        src: url(${f.dataUrl}) format('${f.format}');
        font-display: swap;
      }
    `
    document.head.appendChild(style)
  }
  const saved = await getSetting('themeSettings')
  if (saved) {
    const root = document.documentElement
    const themeVars = {
      vintage: {
        '--paper': '#f4f1eb', '--paper-deep': '#ece7dd', '--ink': '#2f2a22',
        '--ink-soft': '#8b8579', '--line': '#d5cfc4', '--line-strong': '#8b7355',
        '--accent': '#8b7355', '--close-hover': '#8c3b2e'
      },
      light: {
        '--paper': '#fafafa', '--paper-deep': '#f0f0f0', '--ink': '#1a1a1a',
        '--ink-soft': '#666666', '--line': '#e0e0e0', '--line-strong': '#333333',
        '--accent': '#1a1a1a', '--close-hover': '#333333'
      },
      dark: {
        '--paper': '#181818', '--paper-deep': '#222222', '--ink': '#e8e0d4',
        '--ink-soft': '#8a8078', '--line': '#333333', '--line-strong': '#555555',
        '--accent': '#c9a96e', '--close-hover': '#b44'
      },
      sepia: {
        '--paper': '#f5e6c8', '--paper-deep': '#eedcb3', '--ink': '#3a2e1e',
        '--ink-soft': '#8a7a60', '--line': '#d4c4a0', '--line-strong': '#a0845c',
        '--accent': '#a0845c', '--close-hover': '#8c3b2e'
      },
      'green-light': {
        '--paper': '#f2ede5', '--paper-deep': '#e8e2d8', '--ink': '#2a3322',
        '--ink-soft': '#6b7a5e', '--line': '#d4cfc4', '--line-strong': '#4a5c3f',
        '--accent': '#4a5c3f', '--close-hover': '#6b4c3a'
      },
      'green-dark': {
        '--paper': '#1f2a1e', '--paper-deep': '#263225', '--ink': '#e0ddd4',
        '--ink-soft': '#8a9a7e', '--line': '#3a4a35', '--line-strong': '#5a7a50',
        '--accent': '#7a9a6a', '--close-hover': '#b44'
      }
    }
    const vars = themeVars[saved.theme] || themeVars.vintage
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    root.style.setProperty('--font-size-body', (saved.fontSize || 15) + 'px')
    root.style.setProperty('--line-height-body', saved.lineHeight || 2)
    root.style.setProperty('--font-size-annotation', (saved.annFontSize || 14) + 'px')
    root.style.setProperty('--color-annotation', saved.annColor || '#8b7355')
    root.style.setProperty('--font-body', saved.bodyFont || "'Noto Serif SC', 'Source Han Serif CN', Georgia, serif")
    root.style.setProperty('--font-annotation', saved.annFont || "'Noto Serif SC', 'Source Han Serif CN', Georgia, serif")
  }
})
</script>
<style scoped>
.app-shell { height: 100%; display: flex; }
.sidebar {
  width: 52px; border-right: 2px solid var(--line-strong);
  display: flex; flex-direction: column; align-items: center;
  padding: 18px 0; gap: 14px; background: var(--paper-deep);
}
.sidebar-brand { font-size: 15px; letter-spacing: 0.1em; line-height: 1.6; color: var(--accent); user-select: none; }
.sidebar .rule-thin { width: 60%; }
.side-btn {
  font-size: 14px; line-height: 1.7; color: var(--ink-soft);
  padding: 6px 4px; border: 1px solid transparent;
}
.side-btn:hover { color: var(--ink); border: 1px solid var(--line); }
.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.top-bar {
  display: flex; align-items: baseline; gap: 16px;
  padding: 14px 28px; border-bottom: 3px double var(--line-strong);
}
.book-title { font-size: 16px; letter-spacing: 0.15em; }
.chapter-title { font-size: 13px; color: var(--ink-soft); }
.empty-zone { flex: 1; display: flex; align-items: center; justify-content: center; }
.empty-state { text-align: center; color: var(--ink-soft); }
.empty-text { font-size: 13px; letter-spacing: 0.15em; margin-top: 24px; }
/* 莫比乌斯环 */
.mobius-container {
  display: flex; justify-content: center; align-items: center;
  animation: float 4s ease-in-out infinite;
}
.mobius-svg {
  width: 180px; height: 180px; color: var(--ink-soft);
}
.mobius-path {
  stroke-dasharray: 500;
  animation: draw 6s linear infinite;
}
.mobius-path-inner {
  stroke-dasharray: 400;
  animation: draw 8s linear infinite reverse;
  opacity: 0.5;
}
.mobius-twist {
  animation: pulse 3s ease-in-out infinite;
}
.mobius-cross {
  stroke-dasharray: 200;
  animation: draw 5s linear infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes draw {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 500; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>