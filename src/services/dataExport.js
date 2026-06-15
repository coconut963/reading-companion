import { db } from '../db/database.js'

/**
 * 导出单本书的所有数据
 */
export async function exportBook(bookId) {
  const book = await db.books.get(bookId)
  if (!book) throw new Error('书籍不存在')

  const chapters = await db.chapters.where('bookId').equals(bookId).toArray()
  const annotations = await db.annotations.where('bookId').equals(bookId).toArray()
  const comments = await db.comments.where('bookId').equals(bookId).toArray()
  const memories = await db.memories.where('bookId').equals(bookId).toArray()

  const data = {
    version: 1,
    type: 'single-book',
    exportedAt: new Date().toISOString(),
    book: {
      title: book.title,
      cover: book.cover,
      currentChapter: book.currentChapter,
      createdAt: book.createdAt
    },
    chapters: chapters.map(ch => ({
      title: ch.title,
      order: ch.order,
      paragraphs: ch.paragraphs
    })),
    annotations: annotations.map(a => ({
      chapterOrder: chapters.find(c => c.id === a.chapterId)?.order ?? -1,
      paragraphIndex: a.paragraphIndex,
      content: a.content,
      discussion: a.discussion || []
    })),
    comments: comments.map(c => ({
      chapterOrder: chapters.find(ch => ch.id === c.chapterId)?.order ?? -1,
      role: c.role,
      content: c.content,
      createdAt: c.createdAt
    })),
    memories: memories.map(m => ({
      chapterOrder: chapters.find(ch => ch.id === m.chapterId)?.order ?? -1,
      content: m.content,
      type: m.type || 'neutral',
      createdAt: m.createdAt
    }))
  }

  return data
}

/**
 * 导入单本书数据
 */
export async function importBook(data) {
  if (!data?.book || !data?.chapters?.length) {
    throw new Error('无效的导入文件')
  }

  // 创建书籍
  const bookId = await db.books.add({
    title: data.book.title,
    cover: data.book.cover || null,
    currentChapter: data.book.currentChapter || 0,
    createdAt: data.book.createdAt || Date.now()
  })

  // 创建章节，建立 order → chapterId 映射
  const orderToChapterId = {}
  for (const ch of data.chapters) {
    const chId = await db.chapters.add({
      bookId,
      title: ch.title,
      order: ch.order,
      paragraphs: ch.paragraphs
    })
    orderToChapterId[ch.order] = chId
  }

  // 导入批注
  if (data.annotations?.length) {
    const annRecords = data.annotations
      .filter(a => orderToChapterId[a.chapterOrder] !== undefined)
      .map(a => ({
        bookId,
        chapterId: orderToChapterId[a.chapterOrder],
        paragraphIndex: a.paragraphIndex,
        content: a.content,
        discussion: a.discussion || []
      }))
    if (annRecords.length) await db.annotations.bulkAdd(annRecords)
  }

  // 导入评论
  if (data.comments?.length) {
    const comRecords = data.comments
      .filter(c => orderToChapterId[c.chapterOrder] !== undefined)
      .map(c => ({
        bookId,
        chapterId: orderToChapterId[c.chapterOrder],
        role: c.role,
        content: c.content,
        createdAt: c.createdAt || Date.now()
      }))
    if (comRecords.length) await db.comments.bulkAdd(comRecords)
  }

  // 导入摘要
  if (data.memories?.length) {
    const memRecords = data.memories
      .filter(m => orderToChapterId[m.chapterOrder] !== undefined)
      .map(m => ({
        bookId,
        chapterId: orderToChapterId[m.chapterOrder],
        content: m.content,
        type: m.type || 'neutral',
        createdAt: m.createdAt || Date.now()
      }))
    if (memRecords.length) await db.memories.bulkAdd(memRecords)
  }

  return bookId
}

/**
 * 全量导出（所有书籍 + 设置 + 字体元数据）
 */
export async function exportAll() {
  const books = await db.books.toArray()
  const allData = {
    version: 1,
    type: 'full-backup',
    exportedAt: new Date().toISOString(),
    books: [],
    settings: [],
    fonts: []
  }

  // 导出每本书
  for (const book of books) {
    const bookData = await exportBook(book.id)
    allData.books.push(bookData)
  }

  // 导出设置
  const settings = await db.settings.toArray()
  allData.settings = settings.map(s => ({ key: s.key, value: s.value }))

  // 导出字体（含 dataUrl，文件可能很大）
  const fonts = await db.fonts.toArray()
  allData.fonts = fonts.map(f => ({
    name: f.name,
    familyName: f.familyName,
    format: f.format,
    dataUrl: f.dataUrl,
    createdAt: f.createdAt
  }))

  return allData
}

/**
 * 全量导入
 */
export async function importAll(data) {
  if (data.type !== 'full-backup') {
    throw new Error('不是全量备份文件')
  }

  const results = { books: 0, settings: 0, fonts: 0 }

  // 导入书籍
  if (data.books?.length) {
    for (const bookData of data.books) {
      await importBook(bookData)
      results.books++
    }
  }

  // 导入设置（覆盖）
  if (data.settings?.length) {
    for (const s of data.settings) {
      await db.settings.put({ key: s.key, value: s.value })
      results.settings++
    }
  }

  // 导入字体
  if (data.fonts?.length) {
    for (const f of data.fonts) {
      // 检查同名是否已存在
      const existing = await db.fonts.where('familyName').equals(f.familyName).first()
      if (!existing) {
        await db.fonts.add({
          name: f.name,
          familyName: f.familyName,
          format: f.format,
          dataUrl: f.dataUrl,
          createdAt: f.createdAt || Date.now()
        })
        results.fonts++
      }
    }
  }

  return results
}

/**
 * 触发浏览器下载 JSON 文件
 */
export function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 读取用户选择的 JSON 文件
 */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result))
      } catch (e) {
        reject(new Error('JSON 解析失败'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}