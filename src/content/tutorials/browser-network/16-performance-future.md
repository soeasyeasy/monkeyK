---
title: "第十六章：性能优化与未来"
description: "加载优化、渲染优化、Service Worker、PWA、HTTP/3、Web 未来趋势"
---

# 第十六章：性能优化与未来

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 我的页面能打开就行了，为什么还要做性能优化？
- 性能优化到底从哪入手？感觉要优化的东西太多了
- Service Worker 和 PWA 是什么？和普通的网页有什么区别？
- 听说 HTTP/3 和 WebAssembly 是未来的趋势，我需要现在学吗？

这一章就是为了解答这些问题。我们会从最实用的性能优化技巧讲起，然后介绍 Service Worker 和 PWA，最后展望一下 Web 的未来发展方向。作为浏览器与网络基础教程的最后一章，我们还会做一个整体的学习总结。

---

## 16.1 为什么需要性能优化？

### 痛点分析：慢的代价

想象一下这个场景：你打开了一个电商网站，等了 5 秒还没加载完。你会怎么办？

大部分人会选择直接关掉，去竞争对手的网站。

这不是假设，是真实的数据：

- 页面加载时间从 1 秒增加到 3 秒，跳出率增加 32%
- 页面加载时间从 1 秒增加到 5 秒，跳出率增加 90%
- Google 发现，页面加载速度每慢 0.5 秒，搜索量下降 25%

打个比方：

> 性能优化就像开餐厅。菜好吃很重要（功能），但上菜速度也很重要（性能）。如果你点个菜等半小时，菜再好吃你下次也不来了。

### 性能优化的价值

性能优化不仅仅是"让页面快一点"，它直接影响：

1. **用户体验**：页面快，用户用着爽，愿意留下来
2. **转化率**：电商网站每快 100ms，销售额增加 1%
3. **SEO 排名**：Google 把页面速度作为排名因素
4. **用户留存**：第一次体验好，用户才会再来

> **一句话总结**：性能就是功能。用户不在乎你的技术多牛，只在乎你的页面快不快。

---

## 16.2 核心原理

### 16.2.1 性能指标：怎么衡量"快不快"

在优化之前，你得先知道怎么衡量性能。Google 提出了 **Core Web Vitals**（核心网页指标），是目前最权威的性能标准。

| 指标 | 全称 | 含义 | 目标值 | 生活类比 |
| --- | --- | --- | --- | --- |
| FCP | First Contentful Paint | 首次内容绘制（页面上第一个元素出现） | < 1.8s | 餐厅给你端上第一道菜的时间 |
| LCP | Largest Contentful Paint | 最大内容绘制（最大的元素出现） | < 2.5s | 主菜上桌的时间 |
| FID | First Input Delay | 首次输入延迟（用户第一次操作到页面响应） | < 100ms | 你喊服务员，他多久回应你 |
| CLS | Cumulative Layout Shift | 累积布局偏移（页面元素跳动程度） | < 0.1 | 你吃饭时桌子晃不晃 |
| TTFB | Time to First Byte | 首字节时间（从请求到收到第一个字节） | < 800ms | 你点完菜到厨房开始做菜的时间 |
| INP | Interaction to Next Paint | 交互到下一绘制（所有交互的延迟） | < 200ms | 你每次喊服务员，他的平均响应时间 |

### 16.2.2 页面加载的完整流程

要优化性能，得先知道页面加载的完整流程，才知道哪里可以优化：

```
用户输入 URL
    |
    v
DNS 解析（域名 -> IP 地址）
    |
    v
TCP 连接（三次握手）
    |
    v
TLS 握手（如果是 HTTPS）
    |
    v
发送 HTTP 请求
    |
    v
服务器处理请求
    |
    v
返回 HTML 文档
    |
    v
解析 HTML，发现需要加载 CSS、JS、图片等资源
    |
    v
加载并解析 CSS（构建 CSSOM）
    |
    v
加载并执行 JS（构建 DOM + 执行脚本）
    |
    v
渲染页面（布局 + 绘制）
    |
    v
用户看到页面
```

每个环节都有可能慢，每个环节都可以优化。

---

## 16.3 加载优化

### 16.3.1 资源压缩

减少文件体积是最直接的优化方式。文件越小，下载越快。

| 资源类型 | 压缩方式 | 效果 |
| --- | --- | --- |
| HTML | 移除空白、注释 | 减少 20-30% |
| CSS | 压缩、移除未使用的样式 | 减少 30-50% |
| JavaScript | 压缩、Tree Shaking（移除未使用的代码） | 减少 40-60% |
| 图片 | 使用 WebP/AVIF 格式替代 JPEG/PNG | 减少 30-50% |
| 字体 | 使用 woff2 格式、子集化 | 减少 50-80% |

### 16.3.2 代码分割

不要把所有 JS 打包成一个大文件，而是按路由或功能拆分成多个小文件，用到时再加载。

打个比方：

> 代码分割就像搬家。你不用把所有东西都装在一辆大卡车上（一个大文件），而是分成几个小箱子（多个小文件），需要哪个搬哪个。

```javascript
// ✅ 路由级别代码分割（Vue 示例）
// 使用动态 import()，只有访问这个路由时才会加载对应的 JS
const Home = () => import('./views/Home.vue')    // 访问首页时才加载
const About = () => import('./views/About.vue')  // 访问关于页时才加载
const User = () => import('./views/User.vue')    // 访问用户页时才加载

// 配置路由
const routes = [
  { path: '/', component: Home },       // 首页
  { path: '/about', component: About }, // 关于页
  { path: '/user', component: User }    // 用户页
]

// ✅ 动态导入（按需加载）
// 只有条件满足时才加载模块，不满足时不加载
if (needChart) {
  // 只有需要图表时才加载 echarts（通常很大）
  import('echarts').then((echarts) => {
    // 使用 echarts 渲染图表
    echarts.init(document.getElementById('chart'))
  })
}
```

### 16.3.3 预加载和预获取

```html
<!-- preload：告诉浏览器"这个资源马上要用，赶紧下载" -->
<!-- 优先级很高，会在浏览器开始解析页面时就开始下载 -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="main.js" as="script">
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- prefetch：告诉浏览器"这个资源以后可能要用，空闲时下载" -->
<!-- 优先级很低，只在浏览器空闲时才下载 -->
<link rel="prefetch" href="next-page.js">

<!-- dns-prefetch：提前解析域名，减少后续请求的 DNS 解析时间 -->
<link rel="dns-prefetch" href="//api.example.com">

<!-- preconnect：提前建立连接（包括 DNS + TCP + TLS） -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

| 方式 | 用途 | 优先级 | 适用场景 |
| --- | --- | --- | --- |
| preload | 当前页面马上要用的资源 | 高 | 关键 CSS、首屏 JS、字体文件 |
| prefetch | 下一个页面可能用到的资源 | 低 | 用户可能点击的链接对应的页面 |
| dns-prefetch | 提前解析域名 | 中 | 第三方域名（API、CDN） |
| preconnect | 提前建立完整连接 | 高 | 重要的第三方域名 |

### 16.3.4 图片优化

图片通常是页面中最大的资源，优化图片效果最明显。

```html
<!-- ✅ 响应式图片：根据屏幕大小加载不同尺寸的图片 -->
<!-- 手机加载小图，电脑加载大图，节省带宽 -->
<img srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 480px, 800px"
     src="medium.jpg"
     alt="响应式图片示例">

<!-- ✅ 懒加载：只有图片进入视口（用户滚动到可见区域）时才开始加载 -->
<!-- 首屏以下的图片用 lazy，首屏的图片不要用 lazy -->
<img loading="lazy" src="below-fold.jpg" alt="懒加载图片">

<!-- ✅ 使用现代图片格式 -->
<!-- picture 元素可以根据浏览器支持情况自动选择最优格式 -->
<picture>
  <!-- 优先使用 AVIF（压缩率最高） -->
  <source srcset="image.avif" type="image/avif">
  <!-- 其次使用 WebP（压缩率比 JPEG 高） -->
  <source srcset="image.webp" type="image/webp">
  <!-- 最后使用 JPEG（兼容性最好） -->
  <img src="image.jpg" alt="现代图片格式示例">
</picture>
```

| 优化方式 | 说明 | 效果 |
| --- | --- | --- |
| 响应式图片 | 根据屏幕尺寸加载不同大小 | 避免手机加载电脑尺寸的大图 |
| 懒加载 | 视口外的图片延迟加载 | 减少首屏加载时间 |
| 现代格式 | WebP/AVIF 替代 JPEG/PNG | 体积减少 30-50% |
| 图片 CDN | 自动压缩、裁剪、格式转换 | 省去手动优化的麻烦 |

---

## 16.4 渲染优化

### 16.4.1 关键渲染路径

关键渲染路径是指从接收 HTML 到首次渲染页面之间的一系列步骤。优化关键渲染路径可以减少首次渲染时间。

打个比方：

> 关键渲染路径就像做菜。你需要：洗菜 -> 切菜 -> 炒菜 -> 装盘。每一步都可以优化：用洗菜机洗菜、用切菜机切菜、用大火快炒、用漂亮的盘子装。

优化关键渲染路径的三个方向：

1. **减少关键资源数量**：减少必须下载的资源数量
2. **最小化关键路径长度**：减少串行的步骤
3. **减少关键字节数**：让每个资源尽可能小

### 16.4.2 避免重排重绘

浏览器的渲染过程有三个阶段：

1. **布局（Layout/Reflow）**：计算每个元素的位置和大小
2. **绘制（Paint）**：绘制元素的视觉效果（颜色、边框等）
3. **合成（Composite）**：把各层合在一起显示在屏幕上

修改某些 CSS 属性会触发重排（最慢）、重绘（中等）、或只触发合成（最快）。

```javascript
// ❌ 错误写法：在循环中读取布局属性，会触发强制同步布局
const box = document.getElementById('box')
for (let i = 0; i < 100; i++) {
  // 读取 offsetHeight 会触发重排
  const height = box.offsetHeight
  // 修改样式又会触发重排
  box.style.height = height + 10 + 'px'
}

// ✅ 正确写法 1：批量修改样式（减少重排次数）
const el = document.getElementById('box')
// 一次性修改多个样式，浏览器会合并成一次重排
el.style.cssText += '; width: 100px; height: 100px; padding: 10px;'

// ✅ 正确写法 2：用 transform 代替位置变化
// transform 只触发合成，不触发重排重绘，性能最好
el.style.transform = 'translateX(100px)'

// ✅ 正确写法 3：用 requestAnimationFrame 做动画
let x = 0
function animate() {
  x += 1 // 每次移动 1 像素
  // requestAnimationFrame 会在浏览器下次重绘前执行
  // 保证动画流畅，不会掉帧
  el.style.transform = 'translateX(' + x + 'px)'
  requestAnimationFrame(animate) // 递归调用，持续动画
}
// 启动动画
requestAnimationFrame(animate)
```

| 操作 | 触发的阶段 | 性能 |
| --- | --- | --- |
| 修改 width/height/top/left | 布局 + 绘制 + 合成 | 最慢 |
| 修改 color/background | 绘制 + 合成 | 中等 |
| 修改 transform/opacity | 只触发合成 | 最快 |

### 16.4.3 虚拟列表

当列表数据量很大时（比如 10000 条），不要一次性渲染所有 DOM，只渲染可见区域内的几条。

打个比方：

> 虚拟列表就像看Excel表格。虽然表格里有 10000 行数据，但你的屏幕只能看到其中 20 行。滚动的时候，只是替换显示的内容，而不是真的渲染 10000 行。

```vue
<!-- Vue 虚拟列表示意代码 -->
<template>
  <!-- 外层容器：固定高度，监听滚动事件 -->
  <div class="virtual-list" @scroll="onScroll">
    <!-- 占位元素：撑开滚动区域，高度 = 总数据量 * 每项高度 -->
    <div :style="{ height: totalHeight + 'px' }">
      <!-- 可见区域容器：通过 transform 定位到正确位置 -->
      <div :style="{ transform: 'translateY(' + offset + 'px)' }">
        <!-- 只渲染可见区域内的数据项 -->
        <div v-for="item in visibleItems" :key="item.id" class="list-item">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 假设 props 传入了所有数据
const props = defineProps(['items'])

// 每项的高度（固定值，方便计算）
const ITEM_HEIGHT = 40
// 容器可视区域高度
const CONTAINER_HEIGHT = 400
// 可见区域内能显示多少项
const VISIBLE_COUNT = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT)

// 滚动偏移量
const scrollTop = ref(0)

// 总高度 = 数据总量 * 每项高度
const totalHeight = props.items.length * ITEM_HEIGHT

// 起始索引 = 当前滚动位置 / 每项高度
const startIndex = computed(() => Math.floor(scrollTop.value / ITEM_HEIGHT))
// 结束索引 = 起始索引 + 可见数量 + 缓冲区（多渲染几个防止白屏）
const endIndex = computed(() => startIndex.value + VISIBLE_COUNT + 3)

// 可见数据项（只渲染这些）
const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value)
)

// 偏移量（让可见区域定位到正确位置）
const offset = computed(() => startIndex.value * ITEM_HEIGHT)

// 滚动事件处理
function onScroll(event) {
  scrollTop.value = event.target.scrollTop
}
</script>
```

---

## 16.5 Service Worker

Service Worker 是运行在浏览器后台的脚本，它可以拦截网络请求、管理缓存、推送通知。它是 PWA（渐进式 Web 应用）的核心技术。

打个比方：

> Service Worker 就像你家门口的快递柜。快递员（服务器）把包裹放到快递柜（缓存）里，你（浏览器）随时可以取。即使快递站关门了（断网），你也能从快递柜里取到之前放的包裹。

### 16.5.1 生命周期

```
注册 -> 下载 -> 安装（install） -> 等待 -> 激活（activate） -> 控制页面
```

| 阶段 | 说明 |
| --- | --- |
| 注册 | 告诉浏览器去下载 Service Worker 脚本 |
| 安装 | 第一次安装或检测到更新时触发，通常在这里缓存资源 |
| 激活 | 安装完成后激活，旧版本的 Service Worker 会被替换 |
| 控制页面 | 激活后开始拦截页面的网络请求 |

### 16.5.2 注册 Service Worker

```javascript
// ✅ 在主页面 JS 中注册 Service Worker
// 首先检查浏览器是否支持 Service Worker
if ('serviceWorker' in navigator) {
  // navigator.serviceWorker.register 方法用来注册
  // 参数是 Service Worker 脚本的路径
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      // 注册成功，registration 包含注册信息
      console.log('Service Worker 注册成功:', registration.scope)
    })
    .catch((error) => {
      // 注册失败，可能是路径错误或浏览器不支持
      console.log('Service Worker 注册失败:', error)
    })
}
```

### 16.5.3 缓存策略

```javascript
// sw.js（Service Worker 脚本文件）

// ===== 安装阶段：缓存核心资源 =====
self.addEventListener('install', (event) => {
  // waitUntil 告诉浏览器：这个 Promise 完成之前不要结束安装
  event.waitUntil(
    // 打开一个名为 'v1' 的缓存
    caches.open('v1').then((cache) => {
      // 把核心资源添加到缓存中
      // 这些资源在离线时也能访问
      return cache.addAll([
        '/',               // 首页
        '/index.html',     // HTML 文件
        '/style.css',      // 样式文件
        '/main.js'         // JS 文件
      ])
    })
  )
})

// ===== 拦截请求：缓存优先策略 =====
self.addEventListener('fetch', (event) => {
  // respondWith 拦截请求，返回自定义的响应
  event.respondWith(
    // 先尝试从缓存中匹配这个请求
    caches.match(event.request).then((cachedResponse) => {
      // 如果缓存中有，直接返回缓存（速度快，省流量）
      if (cachedResponse) {
        return cachedResponse
      }
      // 如果缓存中没有，发起网络请求
      return fetch(event.request).then((networkResponse) => {
        // 只缓存成功的响应（状态码 200）
        if (networkResponse.status === 200) {
          // clone 一份响应（因为 Response 只能读取一次）
          const responseClone = networkResponse.clone()
          // 把响应存入缓存
          caches.open('v1').then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        // 返回网络响应
        return networkResponse
      })
    })
  )
})

// ===== 激活阶段：清理旧缓存 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // 获取所有缓存的名称
    caches.keys().then((cacheNames) => {
      return Promise.all(
        // 遍历所有缓存
        cacheNames.map((cacheName) => {
          // 如果不是当前版本的缓存，就删除
          if (cacheName !== 'v1') {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
```

### 16.5.4 离线支持

```javascript
// sw.js 中添加离线页面支持
self.addEventListener('fetch', (event) => {
  // 只处理页面导航请求
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // 先尝试网络请求
      fetch(event.request).catch(() => {
        // 如果网络失败（断网），返回离线页面
        return caches.match('/offline.html')
      })
    )
  }
})
```

---

## 16.6 PWA（渐进式 Web 应用）

PWA 不是某一项具体技术，而是一种理念：用 Web 技术做出接近原生 App 的体验。

打个比方：

> PWA 就像一辆改装车。它本质上还是一辆汽车（网页），但加装了各种配件（Service Worker、Manifest 文件），让它能像摩托车一样灵活（离线可用、可安装到桌面）。

### 16.6.1 PWA 的核心特性

| 特性 | 说明 |
| --- | --- |
| 可靠性 | 离线也能访问（靠 Service Worker 缓存） |
| 快速 | 流畅的动画和响应（靠性能优化） |
| 可安装 | 可以添加到手机桌面，像 App 一样打开 |
| 推送通知 | 可以接收服务器推送的通知 |
| 后台同步 | 可以在后台处理任务（比如等网络恢复后再发送） |

### 16.6.2 Manifest 文件

Manifest 是一个 JSON 文件，告诉浏览器你的应用信息（名称、图标、主题色等），让它可以被"安装"到桌面。

```json
{
  "name": "我的应用",
  "short_name": "应用",
  "description": "这是一个 PWA 应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

```html
<!-- 在 HTML 中引入 Manifest 文件 -->
<link rel="manifest" href="/manifest.json">
```

| 字段 | 说明 |
| --- | --- |
| name | 应用全称 |
| short_name | 应用简称（桌面图标下方显示） |
| start_url | 启动时打开的页面 |
| display | 显示模式：standalone（独立窗口）、fullscreen（全屏）、browser（浏览器） |
| background_color | 启动画面的背景色 |
| theme_color | 浏览器工具栏的颜色 |
| icons | 应用图标（至少需要 192x192 和 512x512 两个尺寸） |

---

## 16.7 HTTP/3 与 QUIC

HTTP/3 是下一代 HTTP 协议，基于 QUIC 协议（由 Google 开发）。它解决了 HTTP/2 的一些痛点。

打个比方：

> 如果说 HTTP/2 是一条多车道高速公路，那 HTTP/3 就是磁悬浮列车。不仅更快，而且一辆车出了问题不会影响其他车。

### 16.7.1 QUIC 的核心优势

| 特性 | HTTP/2（TCP） | HTTP/3（QUIC/UDP） |
| --- | --- | --- |
| 连接建立 | 需要 TCP 三次握手 + TLS 握手（2-3 RTT） | 0-RTT 或 1-RTT（首次连接即可发数据） |
| 队头阻塞 | 一个包丢了，所有请求都等着 | 每个流独立，一个流丢包不影响其他流 |
| 连接迁移 | WiFi 切 4G 要重新连接 | 网络切换不中断连接 |
| 传输协议 | 基于 TCP（内核实现，更新慢） | 基于 UDP（用户空间实现，更新快） |

### 16.7.2 部署 HTTP/3

```nginx
# Nginx 配置 HTTP/3
server {
    # 监听 443 端口，启用 QUIC
    listen 443 quic reuseport;
    # 同时保持 HTTP/2 兼容
    listen 443 ssl http2;

    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 告诉浏览器这个服务器支持 HTTP/3
    # ma=86400 表示建议浏览器在 24 小时内都使用 HTTP/3
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

---

## 16.8 Web 未来趋势

### 16.8.1 WebAssembly（Wasm）

WebAssembly 是一种低级字节码格式，可以在浏览器中以接近原生的速度运行。它让 C/C++/Rust/Go 等语言写的代码也能在浏览器中运行。

打个比方：

> 如果说 JavaScript 是自动挡汽车（简单好开但不够快），那 WebAssembly 就是手动挡赛车（需要更多操作但速度极快）。

```javascript
// ✅ 加载并运行 WebAssembly 模块
async function loadWasm() {
  // 从服务器获取 .wasm 文件
  const response = await fetch('module.wasm')
  // 把响应转成 ArrayBuffer（二进制数据）
  const buffer = await response.arrayBuffer()
  // 编译并实例化 Wasm 模块
  const { instance } = await WebAssembly.instantiate(buffer)
  // 调用 Wasm 模块导出的函数
  instance.exports.main()
}
```

适用场景：视频编辑、3D 游戏、加密算法、科学计算等需要高性能的场景。

### 16.8.2 Web Components

Web Components 是浏览器原生的组件化方案，不依赖任何框架。

```javascript
// ✅ 定义一个自定义组件
class MyButton extends HTMLElement {
  // 构造函数
  constructor() {
    super() // 必须先调用 super()
    // 创建 Shadow DOM（样式隔离，不会受外部 CSS 影响）
    this.attachShadow({ mode: 'open' })
    // 设置组件的内部 HTML
    this.shadowRoot.innerHTML = `
      <style>
        /* 样式只在这个组件内生效，不会影响外部 */
        button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #45a049;
        }
      </style>
      <button>
        <!-- slot 是插槽，外部传入的内容会放在这里 -->
        <slot>默认按钮</slot>
      </button>
    `
  }
}

// 注册自定义元素，标签名为 my-button
customElements.define('my-button', MyButton)
```

```html
<!-- 使用自定义组件 -->
<my-button>点击我</my-button>
```

### 16.8.3 边缘计算

边缘计算把计算逻辑从中心服务器推向离用户更近的 CDN 节点。

打个比方：

> 边缘计算就像把总仓库的货分散到各个社区便利店。你买东西不用跑去总仓库了，在楼下的便利店就能买到。

优势：降低延迟（用户离计算节点更近）、减轻中心服务器压力。

### 16.8.4 浏览器内置 AI

浏览器正在集成 AI 能力，让网页可以在本地运行机器学习模型：

- **Web Neural Network API**：在浏览器中运行神经网络
- **本地模型推理**：不需要发送到服务器，保护隐私
- **WebGPU**：利用 GPU 加速计算

---

## 16.9 性能监控

### 16.9.1 Performance API

```javascript
// ✅ 使用 PerformanceObserver 监听性能指标
// 创建一个观察者，当有新的性能条目时触发回调
const observer = new PerformanceObserver((list) => {
  // 遍历所有性能条目
  for (const entry of list.getEntries()) {
    // entry.name：指标名称
    // entry.startTime：开始时间
    // entry.duration：持续时间
    console.log(entry.name, entry.startTime, entry.duration)
  }
})

// 观察 navigation 和 measure 类型的条目
observer.observe({ entryTypes: ['measure', 'navigation'] })

// ✅ 手动测量代码执行时间
// 打一个"开始"标记
performance.mark('start')

// ... 要测量的代码 ...

// 打一个"结束"标记
performance.mark('end')

// 测量两个标记之间的时间
performance.measure('执行时间', 'start', 'end')

// 获取测量结果
const measure = performance.getEntriesByName('执行时间')[0]
console.log('代码执行耗时：', measure.duration, 'ms')
```

### 16.9.2 真实用户监控（RUM）

```javascript
// ✅ 收集真实用户的性能数据，发送到服务器
// 获取各项性能指标
const metrics = {
  // FCP：首次内容绘制时间
  fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  // LCP：最大内容绘制时间
  lcp: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime,
  // 导航类型（完整加载/刷新/后退前进）
  nav: performance.getEntriesByType('navigation')[0]?.type
}

// 使用 sendBeacon 发送数据
// sendBeacon 的特点：即使页面关闭了，数据也能发送成功
// 比普通 fetch 更适合发送性能数据
navigator.sendBeacon('/analytics', JSON.stringify(metrics))
```

---

## 16.10 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 性能指标 | FCP / LCP / FID / CLS / TTFB / INP |
| 资源压缩 | 压缩 HTML/CSS/JS，使用 WebP/AVIF 图片 |
| 代码分割 | 按路由或功能拆分 JS，按需加载 |
| 预加载 | preload（当前页用）、prefetch（以后用） |
| 图片优化 | 响应式图片、懒加载、现代格式 |
| 渲染优化 | 避免重排重绘、用 transform、虚拟列表 |
| Service Worker | 拦截请求、管理缓存、离线支持 |
| PWA | 可靠（离线）、快速、可安装、推送通知 |
| HTTP/3 | 基于 QUIC，0-RTT、无队头阻塞、连接迁移 |
| WebAssembly | 在浏览器中运行高性能代码 |
| 性能监控 | Performance API、RUM 真实用户监控 |

---

## 16.11 新手常见误区

### 误区 1："代码分割越细越好，拆成几百个小文件"

**错！** 代码分割需要平衡。拆得太细，每个文件都有网络请求的开销（建立连接、HTTP 头部等），反而更慢。推荐的做法是：按路由拆分，或者按"首屏需要的"和"首屏不需要的"来拆分。一般一个页面的 JS 控制在 200KB 以内（压缩后）。

### 误区 2："Service Worker 缓存了资源，用户就永远能看到最新内容"

**错！** Service Worker 的缓存不会自动更新。你需要在 Service Worker 脚本中实现更新逻辑：当 sw.js 文件内容发生变化时，浏览器会安装新的 Service Worker，然后在 activate 阶段清理旧缓存。另外，用户可能需要刷新两次才能看到最新内容（第一次激活新 SW，第二次才由新 SW 控制）。

### 误区 3："图片越小越好，压缩到最低质量"

**不对。** 图片需要在质量和大小之间平衡。过度压缩会导致图片模糊、出现马赛克，用户体验很差。推荐做法是：使用 WebP 格式（比 JPEG 小 30% 但质量相当），质量设置在 75-85% 之间。

### 误区 4："用了 CDN 就不需要优化了"

**错！** CDN 只是让资源离用户更近（减少网络延迟），但如果你的 JS 文件有 5MB，即使用了 CDN 下载也要很久。CDN 和性能优化是互补的关系，不是替代关系。

### 误区 5："性能优化是一次性的工作"

**错！** 性能优化是一个持续的过程。随着功能增加、代码增长，性能可能会逐渐变差。建议：
1. 设置性能预算（比如首屏 JS 不超过 200KB）
2. 在 CI/CD 中加入性能检测（比如用 Lighthouse）
3. 定期监控线上性能数据（RUM）

---

## 16.12 动手练习

### 练习 1（基础）：优化一个页面的加载性能

假设你有一个页面，加载了以下资源：
- 一个 2MB 的 JS 文件
- 一个 500KB 的 CSS 文件
- 5 张平均 1MB 的 JPEG 图片
- 一个 200KB 的自定义字体

请列出至少 5 个优化方案，说明每个方案能减少多少体积。

<details>
<summary>点击查看答案</summary>

```
优化方案：

1. JS 代码分割 + Tree Shaking
   - 把 2MB 的 JS 按路由拆分成多个小文件
   - 移除未使用的代码（Tree Shaking）
   - 预计减少 40-60%，首屏 JS 可以控制在 400-800KB

2. CSS 压缩 + 移除未使用的样式
   - 使用 PurgeCSS 移除未使用的样式
   - 压缩 CSS 文件
   - 预计减少 30-50%，CSS 可以减小到 250-350KB

3. 图片优化
   - 把 JPEG 转成 WebP 格式（减少 30%）
   - 使用响应式图片（手机加载小图）
   - 使用懒加载（首屏以下的图片延迟加载）
   - 预计减少 30-50%，图片总体积从 5MB 减到 2.5-3.5MB

4. 字体优化
   - 使用 woff2 格式（比 ttf 小 50%+）
   - 字体子集化（只包含用到的字符）
   - 预计减少 50-80%，字体可以减小到 40-100KB

5. 启用 Gzip/Brotli 压缩
   - 服务端开启 Gzip 或 Brotli 压缩
   - 文本资源（HTML/CSS/JS）可以压缩 60-80%

6. 使用 CDN
   - 把静态资源放到 CDN 上
   - 减少网络延迟（虽然不减体积，但加载更快）

总计优化后，页面总体积可以从约 8.7MB 减小到约 3-4MB，首屏加载时间大幅缩短。
```

</details>

### 练习 2（进阶）：实现一个简单的 Service Worker 缓存策略

编写一个 Service Worker，实现"网络优先"策略：
1. 优先从网络获取资源
2. 如果网络失败，从缓存获取
3. 网络成功时，更新缓存

<details>
<summary>点击查看答案</summary>

```javascript
// sw.js - 网络优先缓存策略

// 安装阶段：创建缓存
self.addEventListener('install', (event) => {
  // 跳过等待，直接激活（新版本立即生效）
  self.skipWaiting()
  // 预缓存核心资源
  event.waitUntil(
    caches.open('core-v1').then((cache) => {
      return cache.addAll([
        '/index.html',     // 首页 HTML
        '/offline.html'    // 离线页面
      ])
    })
  )
})

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  // 立即接管所有页面
  event.waitUntil(self.clients.claim())
  // 清理旧版本缓存
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name !== 'core-v1') {
        caches.delete(name)
      }
    })
  })
})

// 拦截请求：网络优先策略
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return

  event.respondWith(
    // 先尝试网络请求
    fetch(event.request)
      .then((networkResponse) => {
        // 网络成功时，更新缓存
        // 只缓存成功的响应
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open('dynamic-v1').then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        // 返回网络响应
        return networkResponse
      })
      .catch(() => {
        // 网络失败时，尝试从缓存获取
        return caches.match(event.request).then((cachedResponse) => {
          // 如果缓存中有，返回缓存
          if (cachedResponse) {
            return cachedResponse
          }
          // 如果是页面导航请求，返回离线页面
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
          // 都没有，返回空响应
          return new Response('离线了', { status: 503 })
        })
      })
  )
})
```

</details>

### 练习 3（挑战）：使用 Performance API 实现性能监控

编写一个性能监控脚本，实现以下功能：
1. 自动收集 FCP、LCP、CLS 指标
2. 在页面卸载时把数据发送到服务器
3. 封装成一个可复用的函数

<details>
<summary>点击查看答案</summary>

```javascript
// 性能监控工具函数
function initPerformanceMonitor(reportUrl) {
  // 存储各项性能指标
  const metrics = {}

  // ===== 收集 FCP（首次内容绘制） =====
  // PerformanceObserver 监听性能条目
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // FCP 的 name 是 'first-contentful-paint'
      if (entry.name === 'first-contentful-paint') {
        metrics.fcp = Math.round(entry.startTime) // 取整，单位 ms
        console.log('FCP:', metrics.fcp + 'ms')
      }
    }
  })
  // 开始观察 paint 类型的条目
  fcpObserver.observe({ type: 'paint', buffered: true })

  // ===== 收集 LCP（最大内容绘制） =====
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    // 取最后一个（最大的那个）
    const lastEntry = entries[entries.length - 1]
    metrics.lcp = Math.round(lastEntry.startTime)
    console.log('LCP:', metrics.lcp + 'ms')
  })
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

  // ===== 收集 CLS（累积布局偏移） =====
  let clsValue = 0 // 累积偏移值
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // 只计算没有最近用户输入的偏移（排除用户主动操作的偏移）
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    }
    metrics.cls = Math.round(clsValue * 1000) / 1000 // 保留 3 位小数
    console.log('CLS:', metrics.cls)
  })
  clsObserver.observe({ type: 'layout-shift', buffered: true })

  // ===== 页面卸载时发送数据 =====
  // 使用 visibilitychange 事件（比 beforeunload 更可靠）
  document.addEventListener('visibilitychange', () => {
    // 当页面变为隐藏时（用户切换标签页或关闭页面）
    if (document.visibilityState === 'hidden') {
      // 使用 sendBeacon 发送数据
      // 即使页面关闭了，数据也能发送成功
      const data = JSON.stringify({
        url: window.location.href,   // 当前页面 URL
        fcp: metrics.fcp || null,    // FCP 值
        lcp: metrics.lcp || null,    // LCP 值
        cls: metrics.cls || null,    // CLS 值
        timestamp: Date.now()        // 时间戳
      })
      // sendBeacon 比 fetch 更适合发送分析数据
      navigator.sendBeacon(reportUrl, data)
    }
  })
}

// 使用示例
// 传入上报接口地址
initPerformanceMonitor('/api/performance')
```

</details>

---

## 总结与学习建议

恭喜你学完了浏览器与网络基础教程的全部内容！让我们来做一个整体的回顾。

### 知识体系回顾

| 章节 | 核心内容 | 关键词 |
| --- | --- | --- |
| 第1-4章 | HTTP 协议基础 | 请求方法、状态码、头部、HTTPS |
| 第5-8章 | 浏览器原理 | 渲染流程、事件循环、DOM/BOM |
| 第9-12章 | 网络进阶 | Cookie/Session、缓存、跨域、Fetch/XHR |
| 第13章 | WebSocket | 全双工通信、心跳、重连 |
| 第14章 | 浏览器安全 | XSS、CSRF、CSP、安全头部 |
| 第15章 | 调试工具 | DevTools、Network、Performance、抓包 |
| 第16章 | 性能优化 | 加载优化、渲染优化、Service Worker、PWA |

### 学习建议

1. **打好基础**：HTTP 协议和浏览器原理是所有 Web 开发的基础，一定要搞懂
2. **多动手实践**：光看不练等于没学。每个知识点都要自己写代码试一遍
3. **学会使用调试工具**：遇到问题先打开 DevTools 看看，养成调试的习惯
4. **关注安全**：不管做前端还是后端，安全知识都是必备的
5. **持续学习**：Web 技术发展很快，HTTP/3、WebAssembly、边缘计算等新技术值得关注
6. **看官方文档**：MDN（Mozilla Developer Network）是最好的 Web 技术参考文档

> 学完这个教程，你已经具备了 Web 开发的核心基础知识。接下来可以深入学习前端框架（Vue/React）、后端开发、或者全栈开发。祝你学习顺利！
