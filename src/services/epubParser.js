import JSZip from 'jszip'

export async function parseEpub(file) {
  const zip = await JSZip.loadAsync(file)

  const containerXml = await zip.file('META-INF/container.xml')?.async('text')
  if (!containerXml) throw new Error('无效的 EPUB 文件')

  const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml')
  const rootfilePath = containerDoc.querySelector('rootfile')?.getAttribute('full-path')
  if (!rootfilePath) throw new Error('找不到 OPF 文件')

  const opfXml = await zip.file(rootfilePath)?.async('text')
  if (!opfXml) throw new Error('无法读取 OPF')

  const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml')
  const opfDir = rootfilePath.includes('/') ? rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1) : ''

  // 书名
  const titleEl = opfDoc.querySelector('metadata > *|title, metadata title')
  const title = titleEl?.textContent?.trim() || file.name.replace(/\.epub$/i, '')

  // 封面
  let coverData = null
  const metaCover = opfDoc.querySelector('meta[name="cover"]')
  const coverId = metaCover?.getAttribute('content')
  if (coverId) {
    const coverItem = opfDoc.querySelector(`item[id="${coverId}"]`)
    const coverHref = coverItem?.getAttribute('href')
    if (coverHref) {
      const coverPath = opfDir + coverHref
      const coverFile = zip.file(coverPath)
      if (coverFile) {
        const blob = await coverFile.async('blob')
        coverData = await blobToBase64(blob)
      }
    }
  }

  // spine 顺序
  const spineItems = [...opfDoc.querySelectorAll('spine itemref')]
  const manifest = {}
  opfDoc.querySelectorAll('manifest item').forEach(item => {
    manifest[item.getAttribute('id')] = item.getAttribute('href')
  })

  const chapters = []

  for (let i = 0; i < spineItems.length; i++) {
    const idref = spineItems[i].getAttribute('idref')
    const href = manifest[idref]
    if (!href) continue

    const filePath = opfDir + href
    const htmlContent = await zip.file(filePath)?.async('text')
    if (!htmlContent) continue

    const doc = new DOMParser().parseFromString(htmlContent, 'application/xhtml+xml')
    const body = doc.querySelector('body')
    if (!body) continue

    // 提取标题
    const heading = body.querySelector('h1, h2, h3, h4')
    let chTitle = heading?.textContent?.trim() || ''

    // 提取段落
    const paragraphs = []
    const elements = body.querySelectorAll('p, div')

    elements.forEach(el => {
      const text = el.textContent?.trim()
      if (text && text.length > 0) {
        // 跳过纯标题重复
        if (text === chTitle && paragraphs.length === 0) return
        paragraphs.push(text)
      }
    })

    if (paragraphs.length === 0) continue

    if (!chTitle) chTitle = `第 ${chapters.length + 1} 章`

    chapters.push({
      title: chTitle,
      paragraphs,
      order: chapters.length
    })
  }

  if (chapters.length === 0) throw new Error('未能解析出任何章节内容')

  return { title, cover: coverData, chapters }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}