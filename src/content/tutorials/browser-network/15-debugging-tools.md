---
title: "第十五章：网络调试工具"
description: "DevTools Network 面板、性能分析、抓包工具、移动端调试"
---

# 第十五章：网络调试工具

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 接口报错了，我怎么知道是前端的问题还是后端的问题？
- 页面加载很慢，我怎么找出是哪个资源拖了后腿？
- 听说有 Charles、Fiddler 这些抓包工具，到底怎么用？
- 手机上的网页出了问题，怎么在电脑上调试？

这一章就是为了解答这些问题。我们会从浏览器自带的开发者工具（DevTools）讲起，重点讲 Network 面板和 Performance 面板，然后介绍 Charles、Fiddler 等第三方抓包工具，最后教你怎么调试手机上的网页。

---

## 1 为什么需要网络调试工具？

### 痛点分析：没有调试工具时的痛苦

想象一下这个场景：你写了一个页面，页面上有个按钮，点了之后应该显示用户信息。结果点了没反应。

你该怎么办？

- 打开控制台看看有没有报错？——可能没报错
- 看看接口有没有调？——不知道怎么查看
- 看看接口返回的数据对不对？——不知道在哪看
- 看看请求参数有没有传对？——完全懵了

没有调试工具，排查问题就像**盲人摸象**——只能靠猜。

### 调试工具的价值

浏览器的开发者工具（DevTools）就像医生的**X光机**——能让你看到网页"内部"发生了什么。

打个比方：

> DevTools 就像汽车的仪表盘。开车的时候你不需要一直盯着仪表盘，但车出了问题（接口报错、页面卡顿），仪表盘能告诉你哪里有问题。

```javascript
// ✅ 有了 DevTools，你可以：
// 1. 在 Network 面板看到所有网络请求
// 2. 点击某个请求，查看它的请求参数、响应数据、状态码
// 3. 在 Performance 面板看到页面加载的时间线
// 4. 在 Console 面板执行 JS 代码、查看日志
```

---

## 2 核心原理

### 15.2.1 DevTools 的整体结构

浏览器开发者工具由多个面板组成，每个面板负责不同的调试任务：

| 面板 | 功能 | 使用场景 |
| --- | --- | --- |
| Elements | 查看和修改 DOM/CSS | 调试样式、查看 DOM 结构 |
| Console | 执行 JS、查看日志 | 调试代码、测试表达式 |
| Network | 查看网络请求 | 调试接口、分析加载性能 |
| Sources | 查看源码、断点调试 | 调试 JS 代码 |
| Performance | 性能分析 | 分析页面加载和运行时性能 |
| Application | 查看存储、Service Worker | 调试 Cookie、LocalStorage |
| Security | 安全信息 | 查看证书、混合内容问题 |

### 15.2.2 打开 DevTools 的方式

| 浏览器 | 快捷键 |
| --- | --- |
| Chrome | F12 或 Ctrl+Shift+I（Mac：Cmd+Option+I） |
| Firefox | F12 或 Ctrl+Shift+I（Mac：Cmd+Option+I） |
| Safari | Cmd+Option+I（需要先在偏好设置中开启开发菜单） |
| Edge | F12 或 Ctrl+Shift+I（Mac：Cmd+Option+I） |

---

## 3 Network 面板详解

Network（网络）面板是调试网络请求的核心工具。它能让你看到页面上所有的网络请求，包括每个请求的详细信息。

### 15.3.1 Network 面板的主要功能

| 功能 | 说明 |
| --- | --- |
| 请求列表 | 按时间顺序列出所有请求 |
| 请求详情 | 查看某个请求的头部、响应、时间等 |
| 时间线 | 可视化展示请求的时序 |
| 过滤器 | 按类型、状态码、大小等筛选请求 |
| 节流 | 模拟慢速网络（3G、慢速 3G） |
| 离线模式 | 模拟断网环境 |

### 15.3.2 请求列表中的关键信息

打开 Network 面板，刷新页面，你会看到一堆请求。每个请求都有这些信息：

| 列名 | 含义 | 说明 |
| --- | --- | --- |
| Name | 请求名称 | 通常是文件名或接口路径 |
| Status | 状态码 | 200 成功，404 未找到，500 服务器错误 |
| Type | 请求类型 | document、xhr、fetch、script、stylesheet、img |
| Initiator | 发起者 | 是谁发起的这个请求（哪个 JS 文件哪一行） |
| Size | 大小 | 响应体的大小 |
| Time | 耗时 | 从发起到收到响应的时间 |
| Waterfall | 瀑布图 | 可视化展示请求的各个阶段 |

### 15.3.3 请求详情

点击某个请求，可以看到它的详细信息：

| 标签页 | 内容 | 说明 |
| --- | --- | --- |
| Headers | 请求头和响应头 | 查看 Content-Type、Cookie、Authorization 等 |
| Payload | 请求参数 | POST 请求的 body 参数 |
| Preview | 响应预览 | 格式化的响应内容（JSON 会自动展开） |
| Response | 原始响应 | 服务器返回的原始文本 |
| Timing | 时间分解 | 请求各个阶段的耗时 |
| Cookies | Cookie | 这个请求相关的 Cookie |
| Initiator | 调用栈 | 是谁发起了这个请求 |

### 15.3.4 时间分解（Timing）

Timing 标签页会把一个请求的耗时拆分成多个阶段，帮你找出瓶颈在哪：

| 阶段 | 含义 | 说明 |
| --- | --- | --- |
| Queueing | 排队 | 浏览器有连接数限制，请求在排队等 |
| Stalled | 停滞 | 等待可用的 TCP 连接 |
| DNS Lookup | DNS 解析 | 把域名转成 IP 地址 |
| Initial Connection | 建立连接 | TCP 三次握手 |
| SSL | SSL 握手 | HTTPS 的 TLS 握手（如果是 HTTPS） |
| TTFB | 等待首字节 | 从发出请求到收到第一个字节（服务器处理时间） |
| Content Download | 下载内容 | 下载响应体的时间 |

```javascript
// ✅ 排查接口慢的思路：
// 1. 如果 Queueing/Stalled 时间长：可能是请求太多，浏览器在排队
// 2. 如果 DNS Lookup 时间长：可能是 DNS 服务器慢
// 3. 如果 TTFB 时间长：说明服务器处理慢，需要优化后端
// 4. 如果 Content Download 时间长：说明响应体太大，需要压缩或分页
```

### 15.3.5 过滤器使用

Network 面板的过滤器能帮你快速找到需要的请求：

```
# 按请求类型过滤
filter:doc        # 只显示文档（HTML）
filter:xhr        # 只显示 AJAX 请求（XMLHttpRequest）
filter:fetch      # 只显示 fetch 请求
filter:ws         # 只显示 WebSocket
filter:css        # 只显示样式表
filter:js         # 只显示 JavaScript
filter:img        # 只显示图片
filter:font       # 只显示字体

# 按状态码过滤
status-code:200   # 只显示 200 成功的
status-code:404   # 只显示 404 未找到的
status-code:500   # 只显示 500 服务器错误的

# 按大小过滤
larger-than:1M    # 只显示大于 1MB 的
size:100-500      # 只显示 100KB 到 500KB 之间的

# 按域名过滤
domain:example.com # 只显示 example.com 的请求

# 按关键词过滤
api               # 只显示 URL 中包含 api 的请求
```

---

## 4 Performance 面板

Performance（性能）面板用来分析页面的运行时性能，帮你找出卡顿的原因。

### 15.4.1 录制步骤

1. 打开 Performance 面板
2. 点击左上角的"录制"按钮（圆圈图标）
3. 在页面上执行你要分析的操作（比如点击按钮、滚动页面）
4. 点击"停止"按钮
5. 分析录制结果

### 15.4.2 关键性能指标

| 指标 | 全称 | 含义 | 目标值 |
| --- | --- | --- | --- |
| FCP | First Contentful Paint | 首次内容绘制（第一个元素出现） | < 1.8s |
| LCP | Largest Contentful Paint | 最大内容绘制（最大的元素出现） | < 2.5s |
| FID | First Input Delay | 首次输入延迟（用户第一次操作到响应的时间） | < 100ms |
| CLS | Cumulative Layout Shift | 累积布局偏移（页面元素跳动程度） | < 0.1 |
| TTFB | Time to First Byte | 首字节时间（从请求到收到第一个字节） | < 800ms |
| INP | Interaction to Next Paint | 交互到下一绘制（所有交互的延迟） | < 200ms |

### 15.4.3 常见性能问题和优化建议

| 问题 | 表现 | 优化建议 |
| --- | --- | --- |
| 长任务 | 主线程被阻塞超过 50ms | 拆分任务，使用 requestIdleCallback |
| 布局抖动 | 页面元素频繁重排 | 避免强制同步布局，用 transform 代替位置变化 |
| 内存泄漏 | 内存持续增长不释放 | 清理事件监听器、定时器、闭包引用 |
| 脚本执行慢 | JS 执行时间过长 | 使用 Web Worker 把计算放到后台线程 |
| 资源加载慢 | 图片、字体加载慢 | 压缩资源、使用 CDN、懒加载 |

---

## 5 Application 面板

Application（应用）面板用来查看和管理浏览器的存储。

### 15.5.1 主要功能

| 功能 | 说明 |
| --- | --- |
| Storage | 查看 Cookie、LocalStorage、SessionStorage |
| Cache | 查看 Cache Storage（Service Worker 的缓存） |
| IndexedDB | 查看 IndexedDB 数据 |
| Service Workers | 管理 Service Worker（注册、更新、注销） |
| Background Services | 查看后台服务（后台同步、推送通知等） |

---

## 6 抓包工具

除了浏览器自带的 DevTools，还有很多第三方抓包工具，功能更强大。

### 15.6.1 Charles

Charles 是一款跨平台的 HTTP 抓包工具，功能强大，界面友好。

**核心功能**：

| 功能 | 说明 |
| --- | --- |
| HTTP/HTTPS 抓包 | 查看所有请求和响应 |
| 请求重放 | 重新发送某个请求（调试接口时很有用） |
| 断点调试 | 在请求发送前或响应返回后暂停，修改数据 |
| 速度限制 | 模拟慢速网络 |
| Map Local | 把线上请求映射到本地文件（前端调试时很有用） |
| Map Remote | 把一个请求映射到另一个地址 |

**配置 HTTPS 抓包**：

1. 在 Charles 中：Help -> SSL Proxying -> Install Charles Root Certificate
2. 安装并信任证书
3. 在 Charles 中：Proxy -> SSL Proxying Settings -> 添加要抓包的域名和端口（443）
4. 配置系统代理或浏览器代理

### 15.6.2 Fiddler

Fiddler 是 Windows 平台上最流行的抓包工具，功能比 Charles 更丰富。

**核心功能**：

| 功能 | 说明 |
| --- | --- |
| HTTP/HTTPS 抓包 | 查看所有请求和响应 |
| 请求构造 | 手动构造请求（类似 Postman） |
| 自动响应 | 根据规则自动返回响应 |
| 性能分析 | 分析页面加载性能 |
| FiddlerScript | 用脚本自定义行为 |

### 15.6.3 Wireshark

Wireshark 是一款网络协议分析工具，比 Charles/Fiddler 更底层，能看到 TCP/UDP 等协议层面的数据。

**常用过滤器**：

```
# 按 IP 过滤
ip.addr == 192.168.1.1           # 只显示和这个 IP 相关的包

# 按端口过滤
tcp.port == 80                   # 只显示 80 端口的包

# 按协议过滤
http                             # 只显示 HTTP 协议
dns                              # 只显示 DNS 协议
tls                              # 只显示 TLS/SSL 协议

# 按 HTTP 方法过滤
http.request.method == "GET"     # 只显示 GET 请求
http.request.method == "POST"    # 只显示 POST 请求

# 按 HTTP 状态码过滤
http.response.code == 404        # 只显示 404 响应
http.response.code >= 400        # 只显示 4xx 和 5xx 错误
```

### 15.6.4 抓包工具对比

| 工具 | 平台 | 特点 | 适用场景 |
| --- | --- | --- | --- |
| Charles | 跨平台 | 界面友好，Map Local 好用 | 前端开发、接口调试 |
| Fiddler | Windows | 功能丰富，FiddlerScript 强大 | 复杂场景、自动化测试 |
| Wireshark | 跨平台 | 底层协议分析，功能最全面 | 网络协议研究、底层问题排查 |
| DevTools | 浏览器内置 | 方便快捷，无需安装 | 日常开发、快速调试 |

---

## 7 移动端调试

手机上的网页出了问题，怎么调试？这里有几种方法。

### 15.7.1 Chrome Remote Debugging（Android）

1. 手机开启"开发者选项" -> 打开"USB 调试"
2. 用 USB 线连接手机和电脑
3. 电脑 Chrome 浏览器地址栏输入 `chrome://inspect`
4. 在手机上打开要调试的网页
5. 在 `chrome://inspect` 页面点击对应的设备，开始调试

### 15.7.2 Safari Web Inspector（iOS）

1. iPhone：设置 -> Safari -> 高级 -> 打开"Web 检查器"
2. Mac：Safari -> 偏好设置 -> 高级 -> 勾选"在菜单栏中显示开发菜单"
3. 用 USB 线连接 iPhone 和 Mac
4. 在 iPhone 上打开要调试的网页
5. 在 Mac Safari 的"开发"菜单中选择对应的设备和页面

### 15.7.3 代理调试（Charles/Fiddler）

如果需要在手机上抓包，可以把 Charles/Fiddler 设置为代理：

1. 电脑和手机连同一个 Wi-Fi
2. 查看电脑的 IP 地址（比如 192.168.1.100）
3. 在手机 Wi-Fi 设置中，配置代理：
   - 服务器：192.168.1.100（电脑 IP）
   - 端口：8888（Charles 默认端口）
4. 手机上安装并信任 Charles 的根证书（抓 HTTPS 需要）

---

## 8 调试技巧

### 15.8.1 断点调试

```javascript
// 方式 1：代码断点
// 在代码中写 debugger，浏览器执行到这一行会自动暂停
debugger

// 方式 2：条件断点
// 在 Sources 面板，右键行号 -> Add conditional breakpoint
// 输入条件表达式，只有条件为 true 时才会暂停
// 比如：i === 100（循环到第 100 次时才暂停）

// 方式 3：DOM 断点
// 在 Elements 面板，右键某个 DOM 元素
// -> Break on -> subtree modifications（子节点变化时暂停）
// -> Break on -> attributes modifications（属性变化时暂停）
// -> Break on -> node removal（节点被删除时暂停）
```

### 15.8.2 网络模拟

```javascript
// 在 Network 面板，可以模拟不同的网络环境：

// 方式 1：模拟慢速网络
// Network 面板 -> Throttling 下拉框 -> 选择 "Slow 3G" 或 "Fast 3G"
// 这样可以看到页面在慢速网络下的加载情况

// 方式 2：离线模式
// Network 面板 -> Throttling 下拉框 -> 选择 "Offline"
// 这样可以测试页面在断网时的表现（配合 Service Worker 使用）

// 方式 3：自定义网络条件
// Network 面板 -> Throttling -> Add...
// 可以自定义延迟、下载速度、上传速度
```

### 15.8.3 请求拦截（Service Worker）

```javascript
// Service Worker 可以拦截网络请求，返回缓存的数据或修改响应

// sw.js（Service Worker 脚本）
// 监听 fetch 事件，拦截所有网络请求
self.addEventListener('fetch', (event) => {
  // respondWith 方法用来返回自定义的响应
  event.respondWith(
    // 先尝试从缓存中匹配这个请求
    caches.match(event.request).then((response) => {
      // 如果缓存中有，直接返回缓存的响应
      if (response) {
        return response
      }
      // 如果缓存中没有，发起网络请求
      return fetch(event.request).then((networkResponse) => {
        // 把网络响应缓存起来，下次就可以直接从缓存取
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open('v1').then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return networkResponse
      })
    })
  )
})
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| DevTools 打开方式 | F12 或 Ctrl+Shift+I |
| Network 面板 | 查看所有网络请求、响应、耗时 |
| Timing 阶段 | Queueing / Stalled / DNS / Connection / SSL / TTFB / Download |
| Performance 面板 | 录制并分析页面运行时性能 |
| 关键指标 | FCP / LCP / FID / CLS / TTFB / INP |
| Application 面板 | 查看 Cookie、LocalStorage、Service Worker |
| Charles/Fiddler | 第三方抓包工具，功能更强大 |
| 移动端调试 | Chrome Remote Debugging / Safari Web Inspector |

---

## 10 新手常见误区

### 误区 1："Network 面板里没看到请求，说明没发请求"

**错！** Network 面板只显示从打开面板那一刻开始的请求。如果你在打开面板之前就已经发了请求，那是看不到的。正确做法是：先打开 Network 面板，再执行操作。另外，如果勾选了"Disable cache"，每次刷新都会重新请求，方便调试。

### 误区 2："状态码 200 就代表请求成功了"

**不完全对。** 200 只表示服务器正常响应了，但不代表业务逻辑成功了。比如删除一个用户，服务器返回 200，但响应体里可能是 `{ "error": "用户不存在" }`。所以要看 Preview 或 Response 标签页里的具体数据。

### 误区 3："Performance 面板太复杂，看不懂"

**不是的。** Performance 面板确实信息很多，但新手只需要关注几个关键点：
1. 有没有红色的"长任务"（Long Task）——说明主线程被阻塞了
2. FPS 图表有没有掉到 0——说明页面卡顿了
3. 网络请求的时间线——看有没有请求特别慢

不需要看懂每一个细节，先抓大放小。

### 误区 4："手机调试太麻烦，直接在电脑浏览器里看就行"

**错！** 手机浏览器和电脑浏览器的内核、性能、屏幕尺寸都不一样。很多在电脑上正常的页面，在手机上可能会出问题（比如触摸事件、性能问题、样式适配）。所以一定要在真机上测试。

### 误区 5："抓包工具只能抓 HTTP，HTTPS 抓不了"

**错！** Charles 和 Fiddler 都支持 HTTPS 抓包，但需要安装并信任它们的根证书。原理是"中间人攻击"——抓包工具充当中间人，解密 HTTPS 流量。所以抓包工具能看到 HTTPS 的明文内容。

---

## 11 动手练习

### 练习 1（基础）：使用 Network 面板分析页面请求

打开任意一个网站（比如百度），使用 Network 面板完成以下任务：
1. 查看所有请求，找出加载最慢的 3 个资源
2. 查看某个请求的 Headers，找出它的 Content-Type
3. 使用过滤器，只显示图片类型的请求
4. 查看某个请求的 Timing，分析耗时最长的阶段

<details>
<summary>点击查看答案</summary>

```
操作步骤：

1. 打开百度首页（https://www.baidu.com）
2. 按 F12 打开 DevTools，切换到 Network 面板
3. 刷新页面，等待加载完成

4. 找出加载最慢的资源：
   - 点击 "Time" 列的表头，按耗时排序
   - 前 3 个就是加载最慢的资源

5. 查看某个请求的 Headers：
   - 点击某个请求
   - 在右侧找到 "Headers" 标签
   - 在 "Response Headers" 中找到 "Content-Type"

6. 使用过滤器显示图片：
   - 在过滤器输入框输入：filter:img
   - 或者点击上方的 "Img" 按钮

7. 查看 Timing：
   - 点击某个请求
   - 切换到 "Timing" 标签
   - 看哪个阶段耗时最长（通常是 TTFB 或 Content Download）
```

</details>

### 练习 2（进阶）：使用 Performance 面板分析页面性能

打开一个比较复杂的网站（比如淘宝首页），使用 Performance 面板完成以下任务：
1. 录制页面加载过程（大约 5 秒）
2. 找出 FCP 和 LCP 的时间
3. 找出有没有长任务（Long Task，超过 50ms 的任务）
4. 查看 Main 线程，找出执行时间最长的脚本

<details>
<summary>点击查看答案</summary>

```
操作步骤：

1. 打开淘宝首页（https://www.taobao.com）
2. 按 F12 打开 DevTools，切换到 Performance 面板
3. 点击左上角的"录制"按钮（圆圈图标）
4. 刷新页面，等待加载完成（大约 5 秒）
5. 点击"停止"按钮

6. 找出 FCP 和 LCP：
   - 在时间线上找到 "Timings" 部分
   - FCP 标记为 "First Contentful Paint"
   - LCP 标记为 "Largest Contentful Paint"
   - 鼠标悬停可以看到具体时间

7. 找出长任务：
   - 在 "Main" 线程中，红色的块就是长任务
   - 长任务会有红色的小三角标记
   - 点击长任务，可以在下方看到详细信息

8. 查看执行时间最长的脚本：
   - 在 "Main" 线程中，找到最宽的紫色块（脚本执行）
   - 点击它，在 "Bottom-Up" 或 "Call Tree" 中可以看到调用栈
   - 找出耗时最长的函数
```

</details>

### 练习 3（挑战）：使用 Charles 进行 Map Local 调试

假设你有一个线上页面，想修改某个 JS 文件来调试，但不想改线上的代码。使用 Charles 的 Map Local 功能，把线上的 JS 文件映射到本地文件。

<details>
<summary>点击查看答案</summary>

```
操作步骤：

1. 打开 Charles，配置代理（让浏览器走 Charles 代理）
   - Chrome 可以安装 SwitchyOmega 插件
   - 代理地址：127.0.0.1，端口：8888

2. 配置 HTTPS 抓包（如果需要）
   - Help -> SSL Proxying -> Install Charles Root Certificate
   - Proxy -> SSL Proxying Settings -> Add: * 443

3. 打开要调试的网页，在 Charles 中找到对应的 JS 文件

4. 右键该请求 -> Map Local...

5. 在弹出的对话框中：
   - Host：填线上域名（比如 cdn.example.com）
   - Path：填 JS 文件路径（比如 /js/main.js）
   - Local Path：选择本地文件路径（你修改后的 JS 文件）

6. 点击 OK，刷新页面

7. 现在浏览器加载的 JS 文件就是你本地的版本了
   - 你可以在本地文件中加 console.log 调试
   - 修改代码后刷新页面就能看到效果
   - 不需要改线上的代码

8. 调试完成后，记得取消 Map Local
   - Tools -> Map Local -> 取消勾选或移除规则
```

</details>

---

## 下一章预告

下一章我们会学习 **性能优化与未来**——也就是怎么让你的网页加载更快、运行更流畅。你会学到资源压缩、代码分割、图片优化、Service Worker、PWA 等实用技术，还会了解 HTTP/3、WebAssembly 等前沿技术。学完这章，你就能把网页的性能提升到一个新的水平。
