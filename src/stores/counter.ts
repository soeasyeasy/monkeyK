/**
 * Pinia 状态管理 - 计数器 Store
 * 示例 Store，演示 Pinia 的基本用法
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 定义计数器 Store，使用组合式 API 风格
export const useCounterStore = defineStore('counter', () => {
  // 响应式状态：计数器值
  const count = ref(0)
  // 计算属性：双倍计数值
  const doubleCount = computed(() => count.value * 2)
  // 动作：增加计数
  function increment() {
    count.value++
  }

  // 返回暴露的状态和方法
  return { count, doubleCount, increment }
})
