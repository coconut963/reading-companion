import Dexie from 'dexie'

export const db = new Dexie('ReadingCompanionDB')

db.version(1).stores({
  books: '++id, title, createdAt',
  chapters: '++id, bookId, [bookId+order]',
  annotations: '++id, bookId, chapterId',
  comments: '++id, bookId, chapterId',
  memories: '++id, bookId, chapterId',
  fonts: '++id, name',
  settings: 'key'
})

db.version(2).stores({
  books: '++id, title, createdAt',
  chapters: '++id, bookId, [bookId+order]',
  annotations: '++id, bookId, chapterId',
  comments: '++id, bookId, chapterId',
  memories: '++id, bookId, chapterId',
  fonts: '++id, name, familyName',
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