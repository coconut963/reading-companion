<template>
  <div class="theme-panel">
    <!-- 主题选择 -->
    <section class="setting-section">
      <h3 class="section-title">配色主题</h3>
      <hr class="rule-thin" />
      <div class="theme-grid">
        <button
          v-for="t in themes"
          :key="t.id"
          class="theme-card"
          :class="{ active: form.theme === t.id }"
          @click="form.theme = t.id"
        >
          <div class="theme-preview" :style="t.preview"></div>
          <span class="theme-name">{{ t.name }}</span>
        </button>
      </div>
    </section>

    <!-- 字号 & 行距 -->
    <section class="setting-section">
      <h3 class="section-title">排版</h3>
      <hr class="rule-thin" />
      <div class="field-row">
        <label class="field half">
          <span class="field-label">正文字号 (px)</span>
          <input class="field-input" v-model.number="form.fontSize" type="number" min="12" max="28" step="1" />
        </label>
        <label class="field half">
          <span class="field-label">行距 (倍)</span>
          <input class="field-input" v-model.number="form.lineHeight" type="number" min="1.2" max="3" step="0.1" />
        </label>
      </div>
      <div class="field-row">
        <label class="field half">
          <span class="field-label">批注字号 (px)</span>
          <input class="field-input" v-model.number="form.annFontSize" type="number" min="11" max="24" step="1" />
        </label>
        <label class="field half">
          <span class="field-label">批注颜色</span>
          <input class="field-input color-input" v-model="form.annColor" type="color" />
        </label>
      </div>
    </section>

    <!-- 字体管理 -->
    <section class="setting-section">
      <h3 class="section-title">字体管理</h3>
      <hr class="rule-thin" />
      <div class="font-upload">
        <label class="upload-label">
          <input type="file" accept=".ttf,.woff2,.woff,.otf" multiple @change="handleFontUpload" hidden />
          <span class="upload-btn">+ 导入字体文件</span>
        </label>
        <span class="upload-hint">支持 .ttf / .woff2 / .otf</span>
      </div>
      <div class="font-list" v-if="fonts.length">
        <div class="font-item" v-for="f in fonts" :key="f.id">
          <span class="font-preview" :style="{ fontFamily: f.familyName }">Aa 你好世界</span>
          <span class="font-name">{{ f.name }}</span>
          <button class="act-btn del" @click="deleteFont(f)" title="删除">✕</button>
        </div>
      </div>
      <div class="field-row" style="margin-top: 12px;">
        <label class="field half">
          <span class="field-label">正文字体</span>
          <select class="field-input" v-model="form.bodyFont">
            <option value="">默认</option>
            <option v-for="f in fonts" :key="f.id" :value="f.familyName">{{ f.name }}</option>
          </select>
        </label>
        <label class="field half">
          <span class="field-label">批注字体</span>
          <select class="field-input" v-model="form.annFont">
            <option value="">默认</option>
            <option v-for="f in fonts" :key="f.id" :value="f.familyName">{{ f.name }}</option>
          </select>
        </label>
      </div>
    </section>

    <div class="save-row">
      <button class="action-btn primary" @click="save">应用设置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db, getSetting, setSetting } from '../db/database.js'
import { applyTheme } from '../services/themeService.js'

const emit = defineEmits(['saved'])

const themes = [
  { id: 'vintage', name: '复古纸', preview: { background: '#f4f1eb', border: '2px solid #8b7355', color: '#2f2a22' } },
  { id: 'light', name: '素白', preview: { background: '#fafafa', border: '2px solid #1a1a1a', color: '#1a1a1a' } },
  { id: 'dark', name: '夜间', preview: { background: '#181818', border: '2px solid #c9a96e', color: '#e8e0d4' } },
  { id: 'sepia', name: '暖黄', preview: { background: '#f5e6c8', border: '2px solid #a0845c', color: '#3a2e1e' } },
  { id: 'green-light', name: '浅绿', preview: { background: '#f2ede5', border: '2px solid #4a5c3f', color: '#2a3322' } },
  { id: 'green-dark', name: '墨绿', preview: { background: '#1f2a1e', border: '2px solid #7a9a6a', color: '#e0ddd4' } }
]

const form = ref({
  theme: 'vintage',
  fontSize: 15,
  lineHeight: 2,
  annFontSize: 14,
  annColor: '#8b7355',
  bodyFont: '',
  annFont: ''
})

const fonts = ref([])

onMounted(async () => {
  const saved = await getSetting('themeSettings')
  if (saved) Object.assign(form.value, saved)
  await loadFonts()
})

async function loadFonts() {
  const allFonts = await db.fonts.toArray()
  fonts.value = allFonts
  for (const f of allFonts) registerFontFace(f)
}

function registerFontFace(f) {
  try {
    const existing = document.querySelector(`style[data-font-id="${f.id}"]`)
    if (existing) return
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
  } catch (e) {
    console.warn('字体注册失败:', e)
  }
}

async function handleFontUpload(e) {
  const files = e.target.files
  if (!files.length) return
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase()
    const formatMap = { ttf: 'truetype', woff2: 'woff2', woff: 'woff', otf: 'opentype' }
    const format = formatMap[ext]
    if (!format) { alert(`不支持的格式: .${ext}`); continue }
    const dataUrl = await fileToDataUrl(file)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const familyName = `custom-${baseName}-${Date.now()}`
    const id = await db.fonts.add({ name: baseName, familyName, format, dataUrl, createdAt: Date.now() })
    const fontRecord = { id, name: baseName, familyName, format, dataUrl }
    fonts.value.push(fontRecord)
    registerFontFace(fontRecord)
  }
  e.target.value = ''
}

async function deleteFont(f) {
  if (!confirm(`确定删除字体「${f.name}」？`)) return
  await db.fonts.delete(f.id)
  fonts.value = fonts.value.filter(x => x.id !== f.id)
  const style = document.querySelector(`style[data-font-id="${f.id}"]`)
  if (style) style.remove()
  if (form.value.bodyFont === f.familyName) form.value.bodyFont = ''
  if (form.value.annFont === f.familyName) form.value.annFont = ''
}

async function save() {
  await setSetting('themeSettings', { ...form.value })
  applyTheme(form.value)
  emit('saved')
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.theme-panel { display: flex; flex-direction: column; gap: 24px; }
.setting-section {}
.section-title { font-size: 14px; font-weight: normal; letter-spacing: 0.2em; margin-bottom: 8px; }
.theme-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.theme-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 8px; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s;
}
.theme-card:hover { border-color: var(--line); }
.theme-card.active { border-color: var(--accent); }
.theme-preview { width: 56px; height: 40px; border-radius: 2px; }
.theme-name { font-size: 11px; color: var(--ink-soft); }
.field { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.field-label { font-size: 12px; color: var(--ink-soft); }
.field-input {
  font-family: inherit; font-size: 13px; padding: 6px 8px;
  border: 1px solid var(--line); background: var(--paper); color: var(--ink);
}
.field-input:focus { outline: none; border-color: var(--accent); }
.field-row { display: flex; gap: 12px; }
.field.half { flex: 1; }
.color-input { padding: 2px; height: 32px; cursor: pointer; }
.font-upload { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.upload-btn {
  font-size: 12px; padding: 4px 12px;
  border: 1px dashed var(--line); color: var(--ink-soft); cursor: pointer;
}
.upload-btn:hover { border-color: var(--accent); color: var(--accent); }
.upload-hint { font-size: 11px; color: var(--ink-soft); }
.font-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; max-height: 150px; overflow-y: auto; }
.font-item { display: flex; align-items: center; gap: 10px; padding: 4px 8px; border: 1px solid var(--line); }
.font-preview { font-size: 14px; flex: 1; }
.font-name { font-size: 11px; color: var(--ink-soft); }
.act-btn { font-size: 12px; color: var(--ink-soft); padding: 2px 5px; opacity: 0.4; transition: opacity 0.2s; }
.act-btn:hover { opacity: 1; color: var(--accent); }
.act-btn.del:hover { color: var(--close-hover); }
.save-row { display: flex; justify-content: flex-end; }
.action-btn {
  font-size: 13px; padding: 6px 18px; border: 1px solid var(--line-strong); letter-spacing: 0.1em;
}
.action-btn:hover { background: var(--paper-deep); }
.action-btn.primary { background: var(--line-strong); color: var(--paper); }
.action-btn.primary:hover { background: var(--ink); }
</style>