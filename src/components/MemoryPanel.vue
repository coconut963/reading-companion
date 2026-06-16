<template>
  <div class="memory-panel" v-if="book">
    <p class="memory-hint">每章的中性内容摘要，作为后续章节的前情提要注入上下文。可编辑修正。</p>
    <div class="memory-list">
      <div
        class="memory-item"
        v-for="ch in chaptersWithMemory"
        :key="ch.id"
      >
        <div class="memory-header">
          <span class="memory-ch-title">{{ ch.order + 1 }}. {{ ch.title }}</span>
          <div class="memory-actions">
            <button
              class="act-btn"
              @click="generateMemory(ch)"
              :disabled="generatingId === ch.id"
              :title="ch.memory ? '重新生成' : '生成摘要'"
            >
              {{ generatingId === ch.id ? '生成中…' : (ch.memory ? '↻ 重新生成' : '✎ 生成摘要') }}
            </button>
            <button
              v-if="ch.memory"
              class="act-btn del"
              @click="deleteMemory(ch)"
              title="删除摘要"
            >✕</button>
          </div>
        </div>
        <div v-if="editingId === ch.id" class="memory-edit">
          <textarea class="memory-textarea" v-model="editText" rows="4"></textarea>
          <div class="memory-edit-actions">
            <button class="action-btn" @click="cancelEdit">取消</button>
            <button class="action-btn primary" @click="confirmEdit(ch)">保存</button>
          </div>
        </div>
        <div v-else-if="ch.memory" class="memory-content" @dblclick="startEdit(ch)">
          <p class="memory-text">{{ ch.memory }}</p>
          <span class="memory-edit-hint">双击编辑</span>
        </div>
        <div v-else class="memory-empty">
          <span>暂无摘要</span>
        </div>
      </div>
    </div>
    <div class="memory-footer">
      <button
        class="action-btn"
        @click="generateAll"
        :disabled="generatingAll"
      >
        {{ generatingAll ? '批量生成中…' : '为所有无摘要章节生成' }}
      </button>
    </div>
  </div>
  <div v-else class="memory-panel">
    <p class="memory-hint">请先打开一本书。</p>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { db, getSetting } from '../db/database.js'
import { streamChat } from '../services/llmApi.js'
const props = defineProps({ book: Object })
const chaptersWithMemory = ref([])
const generatingId = ref(null)
const generatingAll = ref(false)
const editingId = ref(null)
const editText = ref('')
onMounted(() => loadData())
watch(() => props.book, () => loadData())
async function loadData() {
  if (!props.book) { chaptersWithMemory.value = []; return }
  const chapters = await db.chapters
    .where('bookId')
    .equals(props.book.id)
    .sortBy('order')
  const memories = await db.memories
    .where('bookId')
    .equals(props.book.id)
    .toArray()
  const memMap = {}
  for (const m of memories) {
    memMap[m.chapterId] = m
  }
  chaptersWithMemory.value = chapters.map(ch => ({
    id: ch.id,
    order: ch.order,
    title: ch.title,
    paragraphs: ch.paragraphs,
    memory: memMap[ch.id]?.content || '',
    memoryDbId: memMap[ch.id]?.id || null
  }))
}
function startEdit(ch) {
  editingId.value = ch.id
  editText.value = ch.memory
}
function cancelEdit() {
  editingId.value = null
  editText.value = ''
}
async function confirmEdit(ch) {
  const newText = editText.value.trim()
  if (!newText) return
  if (ch.memoryDbId) {
    await db.memories.update(ch.memoryDbId, { content: newText })
  } else {
    const id = await db.memories.add({
      bookId: props.book.id,
      chapterId: ch.id,
      content: newText,
      createdAt: Date.now()
    })
    ch.memoryDbId = id
  }
  ch.memory = newText
  cancelEdit()
}
async function deleteMemory(ch) {
  if (!confirm('确定删除这章的摘要？')) return
  if (ch.memoryDbId) {
    await db.memories.delete(ch.memoryDbId)
    ch.memoryDbId = null
  }
  ch.memory = ''
}
async function generateMemory(ch) {
  const settings = await getSetting('appSettings')
  if (!settings?.apiKey) { alert('请先配置 API'); return }
  generatingId.value = ch.id
  try {
    const text = ch.paragraphs.join('\n\n')
    const messages = [
      {
        role: 'system',
        content: `你是一个精准的文本摘要助手。请为以下章节内容生成一段中性、客观的内容梗概（200-400字），包含主要情节、出场人物、关键事件。不要加入个人评价，不要使用"本章"等元叙述用语，直接陈述发生了什么。`
      },
      {
        role: 'user',
        content: `《${props.book.title}》章节「${ch.title}」的内容：\n\n${text}`
      }
    ]
    const config = {
      baseURL: settings.baseURL, apiKey: settings.apiKey,
      model: settings.model, temperature: 0.3, maxTokens: 1024,
      streamSpeed: settings.streamSpeed || 'normal'
    }
    let result = ''
    await streamChat(config, messages, chunk => { result += chunk })
    if (ch.memoryDbId) {
      await db.memories.update(ch.memoryDbId, { content: result, createdAt: Date.now() })
    } else {
      const id = await db.memories.add({
        bookId: props.book.id,
        chapterId: ch.id,
        content: result,
        createdAt: Date.now()
      })
      ch.memoryDbId = id
    }
    ch.memory = result
  } catch (e) {
    alert('生成失败: ' + e.message)
  } finally {
    generatingId.value = null
  }
}
async function generateAll() {
  const settings = await getSetting('appSettings')
  if (!settings?.apiKey) { alert('请先配置 API'); return }
  generatingAll.value = true
  for (const ch of chaptersWithMemory.value) {
    if (ch.memory) continue
    await generateMemory(ch)
  }
  generatingAll.value = false
}
</script>
<style scoped>
.memory-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.memory-hint {
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.7;
}
.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 55vh;
  overflow-y: auto;
}
.memory-item {
  border: 1px solid var(--line);
  padding: 10px 14px;
}
.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.memory-ch-title {
  font-size: 13px;
  letter-spacing: 0.1em;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.memory-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.act-btn {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  color: var(--ink-soft);
  white-space: nowrap;
}
.act-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.act-btn:disabled { opacity: 0.4; }
.act-btn.del:hover { color: var(--close-hover); border-color: var(--close-hover); }
.memory-content {
  position: relative;
  cursor: pointer;
}
.memory-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink);
}
.memory-edit-hint {
  position: absolute;
  bottom: -2px;
  right: 0;
  font-size: 10px;
  color: var(--ink-soft);
  opacity: 0;
  transition: opacity 0.2s;
}
.memory-content:hover .memory-edit-hint { opacity: 1; }
.memory-empty {
  font-size: 12px;
  color: var(--ink-soft);
  font-style: italic;
}
.memory-edit { margin-top: 4px; }
.memory-textarea {
  width: 100%;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.7;
  padding: 8px 10px;
  border: 1px solid var(--accent);
  background: var(--paper);
  color: var(--ink);
  resize: vertical;
}
.memory-textarea:focus { outline: none; }
.memory-edit-actions {
  display: flex; gap: 8px; margin-top: 6px; justify-content: flex-end;
}
.action-btn {
  font-size: 12px; padding: 4px 14px;
  border: 1px solid var(--line-strong); letter-spacing: 0.05em;
}
.action-btn:hover { background: var(--paper-deep); }
.action-btn.primary { background: var(--line-strong); color: var(--paper); }
.action-btn.primary:hover { background: var(--ink); }
.memory-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}
</style>