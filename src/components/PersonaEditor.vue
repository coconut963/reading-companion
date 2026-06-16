<template>
  <div class="persona-editor">
    <!-- 角色设定 -->
    <section class="setting-section">
      <h3 class="section-title">角色设定</h3>
      <hr class="rule-thin" />
      <label class="field">
        <span class="field-label">角色名称</span>
        <input class="field-input" v-model="form.personaName" placeholder="角色名称" />
      </label>
      <textarea
        class="big-input"
        v-model="form.persona"
        placeholder="角色设定"
        rows="6"
      ></textarea>
    </section>

    <!-- 用户面具 -->
    <section class="setting-section">
      <h3 class="section-title">用户面具</h3>
      <hr class="rule-thin" />
      <label class="field">
        <span class="field-label">用户称呼</span>
        <input class="field-input" v-model="form.userName" placeholder="用户称呼" />
      </label>
      <textarea
        class="big-input"
        v-model="form.userMask"
        placeholder="用户身份描述"
        rows="3"
      ></textarea>
    </section>

    <!-- 世界书 -->
    <section class="setting-section">
      <h3 class="section-title">世界书</h3>
      <hr class="rule-thin" />
      <div v-for="(entry, idx) in form.worldBook" :key="idx" class="wb-entry">
        <div class="wb-header">
          <input class="wb-name" v-model="entry.name" placeholder="条目名称" />
          <label class="wb-toggle">
            <input type="checkbox" v-model="entry.enabled" />
            <span>启用</span>
          </label>
          <button class="chapter-del" @click="removeWbEntry(idx)">✕</button>
        </div>
        <textarea class="wb-content" v-model="entry.content" placeholder="条目内容" rows="3"></textarea>
      </div>
      <button class="add-btn" @click="addWbEntry">+ 新增条目</button>
    </section>

    <div class="save-row">
      <button class="action-btn primary" @click="save">保存</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, toRaw } from 'vue'
import { getSetting, setSetting } from '../db/database.js'

const emit = defineEmits(['saved'])

const form = ref({
  personaName: '',
  persona: '',
  userName: '',
  userMask: '',
  worldBook: []
})

onMounted(async () => {
  const saved = await getSetting('personaSettings')
  if (saved) Object.assign(form.value, saved)
})

function addWbEntry() {
  form.value.worldBook.push({ name: '', content: '', enabled: true })
}

function removeWbEntry(idx) {
  form.value.worldBook.splice(idx, 1)
}

async function save() {
  const raw = JSON.parse(JSON.stringify(toRaw(form.value)))
  await setSetting('personaSettings', raw)
  emit('saved')
}
</script>

<style scoped>
.persona-editor { display: flex; flex-direction: column; gap: 24px; }
.setting-section {}
.section-title { font-size: 14px; font-weight: normal; letter-spacing: 0.2em; margin-bottom: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; margin-bottom: 6px; }
.field-label { font-size: 12px; color: var(--ink-soft); }
.field-input {
  font-family: inherit; font-size: 13px; padding: 6px 8px;
  border: 1px solid var(--line); background: var(--paper); color: var(--ink);
}
.field-input:focus { outline: none; border-color: var(--accent); }
.big-input {
  width: 100%; font-family: inherit; font-size: 13px; line-height: 1.8;
  padding: 10px 12px; border: 1px solid var(--line);
  background: var(--paper); color: var(--ink); resize: vertical; margin-top: 6px;
}
.big-input:focus { outline: none; border-color: var(--accent); }
.wb-entry { border: 1px solid var(--line); padding: 10px; margin-top: 8px; }
.wb-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.wb-name {
  flex: 1; font-family: inherit; font-size: 13px;
  border: none; border-bottom: 1px solid var(--line);
  background: transparent; color: var(--ink); padding: 2px 4px;
}
.wb-name:focus { outline: none; border-color: var(--accent); }
.wb-toggle { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-soft); }
.wb-toggle input { accent-color: var(--accent); }
.wb-content {
  width: 100%; font-family: inherit; font-size: 12px; line-height: 1.7;
  padding: 6px 8px; border: 1px solid var(--line);
  background: var(--paper); color: var(--ink); resize: vertical;
}
.wb-content:focus { outline: none; border-color: var(--accent); }
.add-btn {
  font-size: 12px; margin-top: 8px; padding: 4px 12px;
  border: 1px dashed var(--line); color: var(--ink-soft);
}
.add-btn:hover { border-color: var(--accent); color: var(--accent); }
.chapter-del { font-size: 13px; color: var(--ink-soft); padding: 2px 6px; transition: color 0.2s; }
.chapter-del:hover { color: var(--close-hover); }
.save-row { display: flex; justify-content: flex-end; }
.action-btn {
  font-size: 13px; padding: 6px 18px; border: 1px solid var(--line-strong); letter-spacing: 0.1em;
}
.action-btn:hover { background: var(--paper-deep); }
.action-btn.primary { background: var(--line-strong); color: var(--paper); }
.action-btn.primary:hover { background: var(--ink); }
</style>