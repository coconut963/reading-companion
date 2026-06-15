<template>
  <div class="settings-panel">
    <!-- API 配置 -->
    <section class="setting-section">
      <h3 class="section-title">API 配置</h3>
      <hr class="rule-thin" />
      <label class="field">
        <span class="field-label">Base URL</span>
        <input class="field-input" v-model="form.baseURL" placeholder="https://api.openai.com" />
      </label>
      <label class="field">
        <span class="field-label">API Key</span>
        <input class="field-input" v-model="form.apiKey" type="password" placeholder="sk-..." />
      </label>
      <label class="field">
        <span class="field-label">模型名称</span>
        <div class="model-row">
          <input class="field-input model-input" v-model="form.model" placeholder="gpt-4o-mini" />
          <button class="fetch-btn" @click="fetchModels" :disabled="fetchingModels">
            {{ fetchingModels ? '拉取中…' : '拉取列表' }}
          </button>
        </div>
        <select
          v-if="modelList.length"
          class="field-input model-select"
          v-model="form.model"
        >
          <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
        </select>
        <p v-if="fetchError" class="fetch-error">{{ fetchError }}</p>
      </label>
      <div class="test-row">
        <button class="test-btn" @click="testApi" :disabled="testing">
          {{ testing ? '测试中…' : '测试连接' }}
        </button>
        <p class="test-result" v-if="testResult" :class="{ error: testError }">{{ testResult }}</p>
      </div>
    </section>
    <!-- 上下文开关 -->
    <section class="setting-section">
      <h3 class="section-title">上下文设置</h3>
      <hr class="rule-thin" />
      <label class="field">
        <span class="field-label">批注对话 · 原文范围</span>
        <select class="field-input" v-model="form.contextRange">
          <option value="nearby">仅前后段落（省 token）</option>
          <option value="chapter">整章原文</option>
          <option value="chapter+memory">整章 + 前情摘要</option>
        </select>
      </label>
      <label class="check-field">
        <input type="checkbox" v-model="form.discussionInComment" />
        <span>评论区带入本章批注讨论</span>
      </label>
      <label class="check-field">
        <input type="checkbox" v-model="form.annotationsInComment" />
        <span>评论区带入本章批注内容</span>
      </label>
    </section>
    <!-- 阅读设置 -->
    <section class="setting-section">
      <h3 class="section-title">阅读设置</h3>
      <hr class="rule-thin" />
      <label class="field">
        <span class="field-label">章节分片字数（0 = 不分片，按段落边界切割）</span>
        <input class="field-input" v-model.number="form.fragmentSize" type="number" step="500" min="0" placeholder="0" />
      </label>
    </section>
    <div class="save-row">
      <button class="action-btn primary" @click="save">保存设置</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getSetting, setSetting } from '../db/database.js'
import { streamChat } from '../services/llmApi.js'
const form = ref({
  baseURL: 'https://api.openai.com',
  apiKey: '',
  model: 'gpt-4o-mini',
  contextRange: 'nearby',
  discussionInComment: false,
  annotationsInComment: true,
  fragmentSize: 0
})
const testing = ref(false)
const testResult = ref('')
const testError = ref(false)
const modelList = ref([])
const fetchingModels = ref(false)
const fetchError = ref('')
onMounted(async () => {
  const saved = await getSetting('appSettings')
  if (saved) Object.assign(form.value, saved)
})
async function save() {
  await setSetting('appSettings', { ...form.value })
  await setSetting('fragmentSize', form.value.fragmentSize || 0)
  alert('设置已保存')
}
async function fetchModels() {
  fetchingModels.value = true
  fetchError.value = ''
  modelList.value = []
  try {
    const url = `${form.value.baseURL.replace(/\/+$/, '')}/v1/models`
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${form.value.apiKey}` }
    })
    if (!res.ok) throw new Error(`请求失败 (${res.status})`)
    const json = await res.json()
    const ids = (json.data || []).map(m => m.id).sort()
    if (ids.length === 0) throw new Error('返回的模型列表为空')
    modelList.value = ids
    if (!ids.includes(form.value.model)) {
      form.value.model = ids[0]
    }
  } catch (e) {
    fetchError.value = '拉取失败: ' + e.message
  } finally {
    fetchingModels.value = false
  }
}
async function testApi() {
  testing.value = true
  testResult.value = ''
  testError.value = false
  try {
    const config = {
      baseURL: form.value.baseURL,
      apiKey: form.value.apiKey,
      model: form.value.model,
      temperature: 0.7,
      maxTokens: 32
    }
    let reply = ''
    await streamChat(
      config,
      [{ role: 'user', content: '请回复"连接成功"四个字。' }],
      chunk => { reply += chunk }
    )
    testResult.value = '✓ 连接成功: ' + reply.slice(0, 50)
  } catch (e) {
    testError.value = true
    testResult.value = '✗ ' + e.message
  } finally {
    testing.value = false
  }
}
</script>
<style scoped>
.settings-panel { display: flex; flex-direction: column; gap: 24px; }
.setting-section {}
.section-title { font-size: 14px; font-weight: normal; letter-spacing: 0.2em; margin-bottom: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.field-label { font-size: 12px; color: var(--ink-soft); }
.field-input {
  font-family: inherit; font-size: 13px; padding: 6px 8px;
  border: 1px solid var(--line); background: var(--paper); color: var(--ink);
}
.field-input:focus { outline: none; border-color: var(--accent); }
.model-row { display: flex; gap: 8px; }
.model-input { flex: 1; }
.fetch-btn {
  font-size: 12px; padding: 5px 12px; border: 1px solid var(--line-strong);
  letter-spacing: 0.05em; white-space: nowrap;
}
.fetch-btn:hover:not(:disabled) { background: var(--paper-deep); }
.fetch-btn:disabled { opacity: 0.5; }
.model-select { margin-top: 6px; cursor: pointer; }
.fetch-error { font-size: 11px; color: var(--close-hover); margin-top: 4px; }
.check-field {
  display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px;
}
.check-field input[type="checkbox"] { accent-color: var(--accent); }
.test-row { margin-top: 12px; }
.test-btn {
  font-size: 13px; padding: 5px 16px; border: 1px solid var(--line-strong); letter-spacing: 0.1em;
}
.test-btn:hover:not(:disabled) { background: var(--paper-deep); }
.test-btn:disabled { opacity: 0.5; }
.test-result { font-size: 12px; margin-top: 6px; color: var(--accent); }
.test-result.error { color: var(--close-hover); }
.save-row { display: flex; justify-content: flex-end; }
.action-btn {
  font-size: 13px; padding: 6px 18px; border: 1px solid var(--line-strong); letter-spacing: 0.1em;
}
.action-btn:hover { background: var(--paper-deep); }
.action-btn.primary { background: var(--line-strong); color: var(--paper); }
.action-btn.primary:hover { background: var(--ink); }
</style>