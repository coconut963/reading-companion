/**
 * 统一主题管理：应用 CSS 变量 + 派发事件通知各组件
 */

export const themeVars = {
  vintage: {
    '--paper': '#f4f1eb', '--paper-deep': '#ece7dd', '--ink': '#2f2a22',
    '--ink-soft': '#8b8579', '--line': '#d5cfc4', '--line-strong': '#8b7355',
    '--accent': '#8b7355', '--close-hover': '#8c3b2e'
  },
  light: {
    '--paper': '#fafafa', '--paper-deep': '#f0f0f0', '--ink': '#1a1a1a',
    '--ink-soft': '#666666', '--line': '#e0e0e0', '--line-strong': '#333333',
    '--accent': '#1a1a1a', '--close-hover': '#333333'
  },
  dark: {
    '--paper': '#181818', '--paper-deep': '#222222', '--ink': '#e8e0d4',
    '--ink-soft': '#8a8078', '--line': '#333333', '--line-strong': '#555555',
    '--accent': '#c9a96e', '--close-hover': '#b44'
  },
  sepia: {
    '--paper': '#f5e6c8', '--paper-deep': '#eedcb3', '--ink': '#3a2e1e',
    '--ink-soft': '#8a7a60', '--line': '#d4c4a0', '--line-strong': '#a0845c',
    '--accent': '#a0845c', '--close-hover': '#8c3b2e'
  },
  'green-light': {
    '--paper': '#f2ede5', '--paper-deep': '#e8e2d8', '--ink': '#2a3322',
    '--ink-soft': '#6b7a5e', '--line': '#d4cfc4', '--line-strong': '#4a5c3f',
    '--accent': '#4a5c3f', '--close-hover': '#6b4c3a'
  },
  'green-dark': {
    '--paper': '#1f2a1e', '--paper-deep': '#263225', '--ink': '#e0ddd4',
    '--ink-soft': '#8a9a7e', '--line': '#3a4a35', '--line-strong': '#5a7a50',
    '--accent': '#7a9a6a', '--close-hover': '#b44'
  }
}

/**
 * 将主题配置写入 CSS 变量并派发 theme-changed 事件
 * @param {Object} cfg - { theme, fontSize, lineHeight, annFontSize, annColor, bodyFont, annFont }
 */
export function applyTheme(cfg) {
  const root = document.documentElement
  const vars = themeVars[cfg.theme] || themeVars.vintage
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
  root.style.setProperty('--font-size-body', (cfg.fontSize || 15) + 'px')
  root.style.setProperty('--line-height-body', cfg.lineHeight || 2)
  root.style.setProperty('--font-size-annotation', (cfg.annFontSize || 14) + 'px')
  root.style.setProperty('--color-annotation', cfg.annColor || '#8b7355')
  root.style.setProperty('--font-body', cfg.bodyFont || "'Noto Serif SC', 'Source Han Serif CN', Georgia, serif")
  root.style.setProperty('--font-annotation', cfg.annFont || "'Noto Serif SC', 'Source Han Serif CN', Georgia, serif")

  // 通知其他组件（ReaderView 等）
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: cfg }))
}