import { db, getSetting } from '../db/database.js'
import { streamChat } from './llmApi.js'

/**
 * 为指定章节生成中性摘要并存入数据库
 * @param {Object} book - { id, title }
 * @param {Object} chapter - { id, title, paragraphs }
 * @returns {Promise<string>} 生成的摘要文本
 */
export async function generateChapterMemory(book, chapter) {
  const settings = await getSetting('appSettings')
  if (!settings?.apiKey) return ''

  const text = chapter.paragraphs.join('\n\n')

  const messages = [
    {
      role: 'system',
      content: `你是一个精准的文本摘要助手。请为以下章节内容生成一段中性、客观的内容梗概（200-400字），包含主要情节、出场人物、关键事件。不要加入个人评价，不要使用"本章"等元叙述用语，直接陈述发生了什么。`
    },
    {
      role: 'user',
      content: `《${book.title}》章节「${chapter.title}」的内容：\n\n${text}`
    }
  ]

  const config = {
    baseURL: settings.baseURL,
    apiKey: settings.apiKey,
    model: settings.model,
    temperature: 0.3,
    maxTokens: 1024
  }

  let result = ''
  await streamChat(config, messages, chunk => { result += chunk })

  // 存入数据库（覆盖已有）
  const existing = await db.memories
    .where('chapterId')
    .equals(chapter.id)
    .first()

  if (existing) {
    await db.memories.update(existing.id, { content: result, createdAt: Date.now() })
  } else {
    await db.memories.add({
      bookId: book.id,
      chapterId: chapter.id,
      content: result,
      createdAt: Date.now()
    })
  }

  return result
}

/**
 * 获取指定书籍中，当前章节之前所有章节的摘要拼接文本
 * @param {number} bookId
 * @param {number} currentChapterOrder - 当前章节的 order 值
 * @returns {Promise<string>} 前情提要文本
 */
export async function getPreviousMemories(bookId, currentChapterOrder) {
  // 取当前章节之前的所有章节
  const prevChapters = await db.chapters
    .where('bookId')
    .equals(bookId)
    .filter(ch => ch.order < currentChapterOrder)
    .sortBy('order')

  if (prevChapters.length === 0) return ''

  // 取这些章节的摘要
  const chapterIds = prevChapters.map(ch => ch.id)
  const memories = await db.memories
    .where('chapterId')
    .anyOf(chapterIds)
    .toArray()

  // 建立映射
  const memMap = {}
  for (const m of memories) {
    memMap[m.chapterId] = m.content
  }

  // 按章节顺序拼接
  const parts = []
  for (const ch of prevChapters) {
    if (memMap[ch.id]) {
      parts.push(`【${ch.title}】\n${memMap[ch.id]}`)
    }
  }

  if (parts.length === 0) return ''

  return `[前情提要]\n${parts.join('\n\n')}`
}