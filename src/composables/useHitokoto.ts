/**
 * 一言（Hitokoto）Composable
 * 从 hitokoto.cn API 获取随机一言句子，支持定时自动刷新
 * 提供进度条数据用于显示下次刷新的倒计时
 */
import { ref, onMounted, onUnmounted } from 'vue'

// 一言数据结构
interface HitokotoData {
  hitokoto: string
  from: string
}

/**
 * 一言 Composable
 * @param interval 自动刷新间隔（秒），默认 30 秒
 */
export function useHitokoto(interval = 30) {
  const hitokoto = ref<HitokotoData | null>(null)
  const loading = ref(true)
  const error = ref(false)
  const progress = ref(0)
  let timer: number | null = null
  let progressTimer: number | null = null

  async function fetchHitokoto() {
    loading.value = true
    try {
      const res = await fetch('https://v1.hitokoto.cn/?encode=text')
      if (res.ok) {
        const text = await res.text()
        hitokoto.value = { hitokoto: text, from: '' }
      }
    } catch {
      try {
        const res = await fetch('https://v1.hitokoto.cn/')
        if (res.ok) {
          const data = await res.json()
          hitokoto.value = { hitokoto: data.hitokoto, from: data.from || '' }
        }
      } catch {
        error.value = true
      }
    } finally {
      loading.value = false
      resetProgress()
    }
  }

  function resetProgress() {
    progress.value = 0
    if (progressTimer) clearInterval(progressTimer)
    const step = 100 / ((interval * 1000) / 50)
    progressTimer = setInterval(() => {
      progress.value = Math.min(100, progress.value + step)
    }, 50)
  }

  function startAutoRefresh() {
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      fetchHitokoto()
    }, interval * 1000)
  }

  onMounted(() => {
    fetchHitokoto()
    startAutoRefresh()
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    if (progressTimer) clearInterval(progressTimer)
  })

  return { hitokoto, loading, error, progress, refresh: fetchHitokoto }
}
