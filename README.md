# 共读 / Reading Companion

AI 共读批注系统 —— 让 AI 角色为你的书写下批注，与你一起阅读。

## ✨ 功能

- **EPUB 导入** — 导入 EPUB 书籍，自动解析章节
- **AI 批注** — 自定义角色设定，让角色以自己的风格为每段落写批注
- **批注讨论** — 点击任意批注，展开弹窗与角色就该批注深入交流
- **章末评论区** — 每章读完后与角色自由聊天
- **章节摘要** — AI 中性摘要或角色风格总结，作为后续章节的前情提要
- **记忆系统** — 前情摘要自动注入上下文，角色能"记住"之前的内容
- **自定义主题** — 6 种配色主题，可调字号、行距、批注颜色
- **自定义字体** — 导入 .ttf / .woff2 / .otf 字体文件，正文和批注可分别设置
- **世界书** — 额外的设定条目注入，丰富角色的知识背景
- **数据管理** — 单本导出 / 全量备份 / 导入恢复，数据完全本地化

## 🖥️ 使用方式

### 浏览器直接使用

访问在线版：[GitHub Pages 地址]（部署后填入）

> 所有数据保存在浏览器本地（IndexedDB），不上传任何内容到服务器。

### Windows

从 [Releases](https://github.com/coconut963/reading-companion/releases) 下载：
- `共读-x.x.x-setup.exe` — 安装版
- `共读-x.x.x-portable.exe` — 免安装便携版

### macOS

从 [Releases](https://github.com/coconut963/reading-companion/releases) 下载 `.dmg` 文件。

> ⚠️ macOS 构建需要在 Mac 上进行，如果你在 Windows 上开发，可以使用 GitHub Actions 自动构建。

### Linux

从 [Releases](https://github.com/coconut963/reading-companion/releases) 下载：
- `.AppImage` — 双击运行
- `.tar.gz` — 解压后运行

## 🔧 开发

```bash
# 安装依赖
npm install

# 浏览器开发模式
npm run dev

# Electron 开发模式
npm run electron:dev

# 构建 Web 版
npm run build

# 构建 Windows 安装包
npm run electron:build:win

# 构建 Windows 便携版
npm run electron:build:portable

# 构建 macOS
npm run electron:build:mac

# 构建 Linux
npm run electron:build:linux