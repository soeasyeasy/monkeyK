/**
 * Polyfill 文件
 * 为浏览器环境提供 Node.js API 支持
 */
import { Buffer as BufferPolyfill } from 'buffer'

// 将 Buffer 挂载到全局，供 gray-matter 等 Node.js 依赖使用
// 这样在浏览器中可以使用 Buffer API
if (typeof window !== 'undefined') {
  ;(window as any).Buffer = BufferPolyfill
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).Buffer = BufferPolyfill
}
