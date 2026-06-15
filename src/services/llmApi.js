/**
 * 流式调用 OpenAI 兼容 API
 * @param {Object} config - { baseURL, apiKey, model, temperature, maxTokens }
 * @param {Array} messages - [{ role, content }]
 * @param {Function} onChunk - 每收到一段文本回调 onChunk(text)
 * @param {AbortSignal} signal - 用于中断请求
 * @returns {Promise<string>} 完整响应文本
 */
export async function streamChat(config, messages, onChunk, signal) {
  const url = `${config.baseURL.replace(/\/+$/, '')}/v1/chat/completions`
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 4096,
    stream: true
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body),
    signal
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`API 请求失败 (${res.status}): ${errText}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''
  let charQueue = []
  let flushing = false

  // 逐字符慢速输出，模拟手写节奏
  function flushQueue() {
    if (flushing) return
    flushing = true
    const tick = () => {
      if (charQueue.length === 0) {
        flushing = false
        return
      }
      // 每次吐出 1-3 个字符，间隔 30-80ms
      const batchSize = Math.min(charQueue.length, Math.ceil(Math.random() * 3))
      const batch = charQueue.splice(0, batchSize).join('')
      onChunk(batch)
      const delay = 30 + Math.random() * 50
      setTimeout(tick, delay)
    }
    tick()
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          full += delta
          // 把字符推入队列
          for (const ch of delta) {
            charQueue.push(ch)
          }
          flushQueue()
        }
      } catch (e) {
        // 忽略解析失败的行
      }
    }
  }

  // 等待队列完全输出
  await new Promise(resolve => {
    const wait = () => {
      if (charQueue.length === 0 && !flushing) resolve()
      else setTimeout(wait, 50)
    }
    wait()
  })

  return full
}