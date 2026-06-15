import Dexie from 'dexie'

export const db = new Dexie('ReadingCompanionDB')

// 注意:stores 里只声明"需要索引(查询)的字段",
// 其他字段(如段落数组、批注正文)可以直接存,不用声明。
db.version(1).stores({
  books: '++id, title, createdAt',
  // 章节:按书查、按 (书+顺序) 排序
  chapters: '++id, bookId, [bookId+order]',
  // 批注:按章节查;非索引字段含 paragraphIndex / content / discussion(讨论历史)
  annotations: '++id, bookId, chapterId',
  // 章末评论区消息:按章节查;含 role('user'|'character')、content、createdAt
  comments: '++id, bookId, chapterId',
  // 记忆摘要:一书一套,按章节存;含 summary(中性梗概,可编辑)
  memories: '++id, bookId, chapterId',
  // 字体文件:含 name、data(二进制)
  fonts: '++id, name',
  // 杂项设置:API配置、角色设定、用户面具、世界书、主题、上下文开关等
  settings: 'key'
})

/* ===== settings 读写辅助函数 ===== */
export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row !== undefined ? row.value : fallback
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}