import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    // Vue SFC 使用 xml 高亮（支持 HTML 标签高亮）
    const resolvedLang = lang === 'vue' ? 'xml' : lang
    if (resolvedLang && hljs.getLanguage(resolvedLang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, { language: resolvedLang, ignoreIllegals: true }).value
        }</code></pre>`
      } catch {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

// 自定义容器渲染 ::: tip / ::: warning / ::: info
function applyContainerPlugin(markdown: MarkdownIt) {
  // ::: tip 内容 :::
  const containers = [
    { type: 'tip', class: 'tip-container', title: '提示' },
    { type: 'warning', class: 'warning-container', title: '警告' },
    { type: 'info', class: 'info-container', title: '信息' },
    { type: 'danger', class: 'danger-container', title: '危险' },
  ]

  containers.forEach(({ type, class: className, title }) => {
    markdown.use((md) => {
      md.block.ruler.before('fence', `container_${type}`, (state, startLine, endLine, silent) => {
        const startPos = state.bMarks[startLine]! + state.tShift[startLine]!
        const maxPos = state.eMarks[startLine]!

        // 检查 ::: type
        if (state.src.slice(startPos, maxPos).trim() !== `::: ${type}`) {
          return false
        }

        if (silent) return true

        // 查找 :::
        let nextLine = startLine + 1
        while (nextLine < endLine) {
          const pos = state.bMarks[nextLine]! + state.tShift[nextLine]!
          const max = state.eMarks[nextLine]!
          if (state.src.slice(pos, max).trim() === ':::') {
            break
          }
          nextLine++
        }

        // 获取内容
        const contentStart = state.bMarks[startLine + 1]
        const contentEnd = state.bMarks[nextLine]
        const content = state.src.slice(contentStart, contentEnd)

        // 生成 token
        const token = state.push('html_block', '', 0)
        token.map = [startLine, nextLine + 1]
        token.content = `<div class="${className}"><div class="container-title">${title}</div><div class="container-content">${md.render(content)}</div></div>`

        state.line = nextLine + 1
        return true
      })
    })
  })
}

applyContainerPlugin(md)

export interface ParsedMarkdown {
  frontmatter: Record<string, any>
  content: string
  html: string
}

/**
 * 简单的 frontmatter 解析器（替代 gray-matter）
 * 格式：---\nkey: value\n---
 */
function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw }
  }

  const frontmatterStr = match[1]
  const content = match[2]
  const data: Record<string, any> = {}

  // 简单的 YAML 解析（支持字符串和数字）
  frontmatterStr.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value: any = line.slice(colonIndex + 1).trim()
      // 移除引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      // 尝试转换为数字
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value)
      }
      data[key] = value
    }
  })

  return { data, content }
}

/**
 * 解析带 frontmatter 的 markdown 文件
 */
export function parseMarkdown(raw: string): ParsedMarkdown {
  const { data: frontmatter, content } = parseFrontmatter(raw)
  const html = md.render(content)
  return { frontmatter, content, html }
}

/**
 * 仅渲染 markdown 为 HTML
 */
export function renderMarkdown(content: string): string {
  return md.render(content)
}

export default md
