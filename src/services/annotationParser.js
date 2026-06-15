/**
 * 解析批注流式输出的文本
 * 格式: @@段落号\n批注内容\n@@段落号\n批注内容...
 *
 * @param {string} text - 累积的完整文本
 * @returns {Array} [{ paragraphIndex: number, content: string }]
 */
export function parseAnnotations(text) {
  const results = []
  // 按 @@ 切分
  const parts = text.split(/@@(\d+)/)
  // parts: ['前言(忽略)', '段落号', '内容', '段落号', '内容', ...]

  for (let i = 1; i < parts.length; i += 2) {
    const paraIdx = parseInt(parts[i], 10)
    const content = (parts[i + 1] || '').trim()
    if (!isNaN(paraIdx)) {
      results.push({ paragraphIndex: paraIdx, content })
    }
  }

  return results
}