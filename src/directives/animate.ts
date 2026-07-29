/**
 * 自定义指令：滚动触发动画（v-animate）
 * 基于 IntersectionObserver 实现元素进入视口时的动画效果
 * 支持多种动画类型和延迟配置
 */
import type { Directive, DirectiveBinding } from 'vue'

/**
 * 滚动触发动画指令
 * 用法：
 *   v-animate              - 默认淡入
 *   v-animate.fade         - 淡入
 *   v-animate.slide-up     - 上移
 *   v-animate.slide-left   - 左滑入
 *   v-animate.slide-right  - 右滑入
 *   v-animate.scale        - 缩放
 *   v-animate.delay-100    - 延迟 100ms
 *   v-animate.delay-200    - 延迟 200ms
 */

interface AnimateElement extends HTMLElement {
  _animateObserver?: IntersectionObserver
  _animateOriginalStyles?: string
}

const animateDirective: Directive = {
  mounted(el: AnimateElement, binding: DirectiveBinding) {
    // 解析修饰符
    const modifiers = Object.keys(binding.modifiers)
    const animationType = modifiers.find(m => ['fade', 'slide-up', 'slide-left', 'slide-right', 'scale'].includes(m)) || 'fade'
    const delayModifier = modifiers.find(m => m.startsWith('delay-'))
    const delay = delayModifier ? parseInt(delayModifier.split('-')[1] ?? '0') : 0

    // 保存原始样式
    el._animateOriginalStyles = el.style.cssText

    // 初始状态：隐藏
    el.style.opacity = '0'
    el.style.transition = `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`

    // 根据动画类型设置初始 transform
    switch (animationType) {
      case 'fade':
        // 只淡入，无位移
        break
      case 'slide-up':
        el.style.transform = 'translateY(30px)'
        break
      case 'slide-left':
        el.style.transform = 'translateX(-30px)'
        break
      case 'slide-right':
        el.style.transform = 'translateX(30px)'
        break
      case 'scale':
        el.style.transform = 'scale(0.9)'
        break
    }

    // 创建 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 进入视口，显示元素
            el.style.opacity = '1'
            el.style.transform = 'translate(0) scale(1)'

            // 动画完成后停止观察
            setTimeout(() => {
              observer.unobserve(el)
            }, 600 + delay)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    observer.observe(el)
    el._animateObserver = observer
  },

  unmounted(el: AnimateElement) {
    // 清理 observer
    if (el._animateObserver) {
      el._animateObserver.disconnect()
    }
  }
}

export default animateDirective
