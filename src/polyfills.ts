import { Buffer as BufferPolyfill } from 'buffer'

// 将 Buffer 挂载到全局，供 gray-matter 等 Node.js 依赖使用
if (typeof window !== 'undefined') {
  ;(window as any).Buffer = BufferPolyfill
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).Buffer = BufferPolyfill
}
