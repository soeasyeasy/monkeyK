---
title: "第十一章：网络优化"
description: "掌握 HTTP/2、CDN、DNS 预解析、数据压缩等网络优化技术"
---

# 第十一章：网络优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- HTTP/2 和 HTTP/1.1 到底有什么区别？为什么快？
- CDN 是怎么加速的？该怎么选？
- DNS 预解析和预连接有什么区别？什么时候用？
- Gzip 和 Brotli 压缩效果差多少？怎么配置？

这一章就是为了解答这些问题。网络优化是缓存之外最重要的性能提升手段——即使缓存命中不了，也能让用户更快拿到资源。

---

## 11.1 为什么需要网络优化？

### 痛点分析

你可能遇到过这些问题：

- 页面加载要发 50 多个请求，浏览器排队等
- 用户在国外，访问国内服务器要 2 秒才能开始加载
- 请求头比请求体还大，浪费大量带宽
- 移动网络信号差，请求经常超时

打个比方：

> 网络优化就像修高速公路：
> - HTTP/2 多路复用 = 一条路上跑多辆车，不用每条路只跑一辆
> - CDN = 在你家旁边建仓库，不用每次都从远方发货
> - DNS 预解析 = 提前查好地址，不用到了路口再问路
> - 数据压缩 = 把货物真空压缩，一辆车能装更多

### 优化维度

| 维度 | 优化目标 | 对应技术 |
| --- | --- | --- |
| 延迟 | 减少请求往返时间 | HTTP/2、CDN、DNS 预解析 |
| 带宽 | 提高数据传输效率 | Gzip/Brotli、图片压缩 |
| 连接 | 优化连接建立和复用 | HTTP/2 多路复用、预连接 |
| 路由 | 选择最优传输路径 | CDN、Anycast |

---

## 11.2 HTTP/2 优化

### 核心原理

HTTP/2 在 HTTP/1.1 的基础上做了大幅优化，核心改进有三个：多路复用、头部压缩、服务器推送。

```
HTTP/1.1 的问题：
├── 每个请求需要独立连接（或排队等 Keep-Alive）
├── 浏览器限制同域名最多 6 个并发连接
├── 请求头冗余大（Cookie 每次都要带）
└── 队头阻塞：一个请求慢，后面的都等

HTTP/2 的解决：
├── 单连接多路复用：一个连接上并行多个请求
├── 头部压缩：HPACK 算法减少 80-90% 头部体积
└── 服务器推送：主动推送客户端可能需要的资源
```

打个比方：

> HTTP/1.1 像单车道公路：
> - 每辆车（请求）要走独立的路
> - 路口（连接）有限，最多开 6 条
> - 前面车慢了，后面全堵（队头阻塞）
>
> HTTP/2 像多车道高速公路：
> - 一条路上有多个车道（流），车可以并行跑
> - 前面车慢了，其他车道不受影响
> - 收费站（头部）用电子收费，不用停车（压缩）

### 多路复用

```
HTTP/1.1：
请求1 → 连接1 → 响应1
请求2 → 连接2 → 响应2
请求3 → 连接3 → 响应3
（3 个请求需要 3 个连接）

HTTP/2：
请求1 ┐
请求2 ├→ 连接1 → 响应1、响应2、响应3
请求3 ┘
（3 个请求只需 1 个连接，并行传输）
```

**效果**：

- 消除队头阻塞（应用层）
- 减少连接数（节省资源）
- 降低延迟（不用多次 TCP 握手）

### 头部压缩

```
HTTP/2 使用 HPACK 算法压缩头部：
├── 静态字典：常见头部（如 Content-Type）预定义编号
├── 动态字典：记录本次连接中出现过的头部
└── 霍夫曼编码：对头部值进行编码压缩

效果：头部体积减少 80-90%
```

打个比方：

> 头部压缩像快递单缩写：
> - 第一次写："北京市朝阳区某某路某某号张三收"
> - 后续只写："地址 #1，收件人 #2"
> - 收发双方都记住之前的地址，不用每次全写

### 服务器推送

```nginx
# Nginx 配置服务器推送
# 客户端请求 index.html 时，主动推送 CSS 和 JS
location / {
    http2_push /styles.css;
    http2_push /main.js;
}
```

```html
<!-- 更推荐的方式：用资源提示代替服务器推送 -->
<link rel="preload" href="/styles.css" as="style">
<link rel="preload" href="/main.js" as="script">
```

**说明**：服务器推送在现代浏览器中使用率不高，更推荐使用 `preload` 资源提示，效果类似且更可控。

---

## 11.3 HTTP/3 (QUIC)

### 核心原理

HTTP/3 基于 UDP 协议（之前的 HTTP 都基于 TCP），解决了 TCP 本身的局限性。

```
HTTP/2 的问题（基于 TCP）：
├── TCP 队头阻塞：一个包丢了，所有流都等它重传
├── 连接建立慢：TCP 握手 + TLS 握手 = 2-3 个 RTT
└── 连接迁移差：IP 变了要重新建连（WiFi 切 4G）

HTTP/3 的解决（基于 QUIC/UDP）：
├── 无队头阻塞：每个流独立，一个流丢包不影响其他流
├── 0-RTT：首次连接 1 个 RTT，后续连接 0 个 RTT
└── 连接迁移：用 Connection ID 标识连接，IP 变了也能继续
```

打个比方：

> HTTP/2（TCP）像一列火车：
> - 一节车厢出问题（丢包），整列火车都停下来等
> - 出发前要办很多手续（握手）
> - 换轨道（切网络）要重新买票
>
> HTTP/3（QUIC）像一群无人机：
> - 每架无人机独立飞行，一架出问题不影响其他
> - 老顾客一句话就起飞（0-RTT）
> - 换路线也不用重新登记（连接迁移）

### 对比表格

| 特性 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 底层协议 | TCP | TCP | UDP (QUIC) |
| 多路复用 | 不支持 | 支持 | 支持 |
| 队头阻塞 | 有（应用层） | 有（TCP 层） | 无 |
| 连接建立 | 2-3 RTT | 2-3 RTT | 1 RTT（0-RTT 复用） |
| 头部压缩 | 无 | HPACK | QPACK |
| 连接迁移 | 不支持 | 不支持 | 支持 |

### 启用 HTTP/3

```nginx
# Nginx 配置 HTTP/3
server {
    # 监听 QUIC 协议
    listen 443 quic reuseport;
    # 同时支持 HTTP/2（降级用）
    listen 443 ssl http2;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 告诉浏览器这个服务器支持 HTTP/3
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

**说明**：

- `reuseport` 提升多核 CPU 的利用率
- `Alt-Svc` 头告诉浏览器"下次可以用 HTTP/3 连我"
- 需要同时保留 HTTP/2 作为降级方案

---

## 11.4 CDN 优化

### 核心原理

CDN（内容分发网络）把资源缓存到离用户最近的边缘节点。

```
没有 CDN：
用户（北京）→ 请求 → 源站（广州）→ 响应 → 用户
延迟：50ms+（跨越大半个中国）

有 CDN：
用户（北京）→ 请求 → 边缘节点（北京）→ 响应 → 用户
延迟：5ms（就在本地）
```

打个比方：

> CDN 就像快递柜：
> - 没有 CDN = 每次都从厂家发货，等 3 天
> - 有 CDN = 厂家提前把热门商品放到小区快递柜，下单 10 分钟就到

### CDN 工作流程

```
用户请求资源：
├── 1. DNS 解析到最近的边缘节点
├── 2. 边缘节点检查缓存
│   ├── 缓存命中 → 直接返回（快）
│   └── 缓存未命中 → 回源站获取，缓存后返回
└── 3. 后续请求直接从边缘节点返回
```

### CDN 配置

```html
<!-- 使用 CDN 加载第三方库 -->
<script src="https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.min.js"></script>

<!-- 多 CDN 容灾：第一个挂了自动用第二个 -->
<script src="https://cdn1.example.com/lib.js"
        onerror="this.src='https://cdn2.example.com/lib.js'"></script>
```

### CDN 选择策略

| 考虑因素 | 说明 |
| --- | --- |
| 节点覆盖 | 是否覆盖目标用户所在区域 |
| 缓存命中率 | 热门资源缓存效果如何 |
| 回源策略 | 回源带宽和延迟 |
| HTTPS 支持 | 是否免费支持 HTTPS |
| 价格 | 流量计费模式，是否有免费额度 |
| 额外功能 | 是否支持 HTTP/2、HTTP/3、WAF 等 |

---

## 11.5 DNS 优化

### 核心原理

DNS 解析是请求的第一步，通常需要 20-120ms。优化 DNS 可以减少这个延迟。

```
DNS 解析过程：
├── 1. 浏览器缓存 → 有就直接用（0ms）
├── 2. 操作系统缓存 → 有就直接用（0ms）
├── 3. 路由器缓存 → 有就直接用（0ms）
├── 4. ISP DNS 服务器 → 通常几毫秒到几十毫秒
└── 5. 根域名服务器 → 最慢，要递归查询
```

### DNS 预解析

```html
<!-- 提前解析第三方域名，不用等到真正请求时才解析 -->
<link rel="dns-prefetch" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
```

**说明**：`dns-prefetch` 只做 DNS 解析（拿到 IP），不建立连接。适合第三方域名。

### 预连接

```html
<!-- 不仅解析 DNS，还建立 TCP 连接 + TLS 握手 -->
<link rel="preconnect" href="https://api.example.com">
<!-- 跨域请求需要加 crossorigin -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
```

**对比**：

| 技术 | 做了什么 | 耗时 | 适用场景 |
| --- | --- | --- | --- |
| dns-prefetch | 只解析 DNS | 快 | 第三方域名、不太重要的域名 |
| preconnect | DNS + TCP + TLS | 稍慢 | 确定会用到的重要域名 |
| preload | 下载资源 | 最快（请求时） | 当前页面确定需要的资源 |

**说明**：`preconnect` 比 `dns-prefetch` 做得更多（完整连接建立），但也更耗资源。不要对太多域名使用，一般 3-5 个关键域名即可。

### DNS 优化策略

```
1. 减少域名数量
   ├── 合并资源到同一域名
   └── 减少 DNS 查询次数

2. 利用 DNS 缓存
   ├── 浏览器缓存 DNS 结果
   ├── 操作系统缓存 DNS 结果
   └── 设置合理的 TTL

3. 选择优质 DNS 服务商
   ├── 低延迟（解析速度快）
   ├── 高可用（不容易挂）
   └── 智能解析（就近分配节点）
```

---

## 11.6 数据压缩

### 核心原理

服务器在发送响应前进行压缩，浏览器收到后解压。文本类资源（JS、CSS、HTML、JSON）压缩效果最好。

```
压缩效果对比：
├── 原始 JS 文件：500KB
├── Gzip 压缩后：150KB（减少 70%）
└── Brotli 压缩后：120KB（减少 76%）
```

打个比方：

> 数据压缩像真空包装：
> - 不压缩 = 衣服直接塞行李箱，占很多空间
> - Gzip = 普通真空袋，抽掉空气，体积减少 70%
> - Brotli = 高级真空袋，压得更紧，体积减少 76%

### Gzip 配置

```nginx
# Nginx 启用 Gzip
gzip on;                              # 开启 Gzip
gzip_types text/plain text/css application/json application/javascript;  # 压缩类型
gzip_min_length 1024;                 # 小于 1KB 不压缩（压缩收益不大）
gzip_vary on;                         # 添加 Vary: Accept-Encoding 头
gzip_comp_level 6;                    # 压缩级别（1-9，6 是平衡点）
gzip_proxied any;                     # 对所有代理请求也压缩
```

### Brotli 配置

```nginx
# Nginx 启用 Brotli（需要安装 ngx_brotli 模块）
brotli on;
brotli_types text/plain text/css application/json application/javascript;
brotli_comp_level 6;                  # 压缩级别（0-11）
brotli_min_length 1024;
```

### 对比表格

| 特性 | Gzip | Brotli |
| --- | --- | --- |
| 压缩率 | 好（减少 60-70%） | 更好（减少 70-80%） |
| 压缩速度 | 快 | 较慢 |
| 解压速度 | 快 | 快（和 Gzip 接近） |
| 浏览器支持 | 100% | 95%+（主流都支持） |
| 适用场景 | 通用 | 优先使用，Gzip 做兜底 |

**推荐**：同时开启 Gzip 和 Brotli，现代浏览器优先用 Brotli，老浏览器降级到 Gzip。

---

## 11.7 请求优化

### 减少请求数

```
HTTP/1.1 时代（请求数很宝贵）：
├── CSS 雪碧图：多张小图合成一张大图
├── JS/CSS 合并：多个文件合并成一个
└── 内联小资源：小图片转 Data URI

HTTP/2 时代（请求数不那么重要）：
├── 保持文件独立：利于单独缓存
├── 按需加载：只加载需要的
└── 多路复用：多个请求并行，不怕多
```

### 减少请求体积

```
策略：
├── 代码压缩 → 移除空白、注释（构建工具自动完成）
├── 图片压缩 → 使用 WebP/AVIF，降低质量
├── 字体子集化 → 只保留用到的字符
├── Tree Shaking → 移除未使用的代码
└── Gzip/Brotli → 传输层压缩
```

### 减少请求延迟

```
策略：
├── CDN 加速 → 物理距离更近
├── DNS 预解析 → 提前解析域名
├── 预连接 → 提前建立连接
├── HTTP/2 多路复用 → 减少连接建立开销
└── 0-RTT → HTTP/3 快速连接
```

---

## 11.8 移动端网络优化

### 网络感知

```javascript
// 检测当前网络状态
if ('connection' in navigator) {
  const connection = navigator.connection;

  // 网络类型：'slow-2g' | '2g' | '3g' | '4g'
  console.log('网络类型:', connection.effectiveType);
  // 下行速度（Mbps）
  console.log('下行速度:', connection.downlink);
  // 往返延迟（ms）
  console.log('RTT:', connection.rtt);

  // 根据网络类型调整策略
  if (connection.effectiveType === '2g') {
    // 2G 网络：加载精简版本
    loadLiteVersion();
  } else if (connection.effectiveType === '3g') {
    // 3G 网络：延迟加载非关键资源
    deferNonCritical();
  }
  // 4G/WiFi：正常加载
}

// 监听网络变化（网络切换时触发）
navigator.connection.addEventListener('change', () => {
  const newType = navigator.connection.effectiveType;
  console.log('网络切换为:', newType);
  // 根据新网络类型调整策略
});
```

### 弱网优化策略

```
弱网环境优化：
├── 离线支持 → Service Worker 缓存核心资源
├── 请求重试 → 失败后自动重试（指数退避）
├── 降级策略 → 弱网时加载精简版
├── 骨架屏 → 等待时展示骨架，减少焦虑
└── 预加载 → 预测用户行为，提前加载
```

---

## 11.9 新手常见误区

### 误区 1："HTTP/2 了就不需要合并文件了"

**不完全对！** HTTP/2 多路复用确实减少了合并的必要性，但也不是完全不需要。

**正确做法**：

1. HTTP/2 下可以保持文件独立，利于缓存
2. 但也不要太细碎（比如几百个 1KB 的小文件）
3. 合理粒度：按模块/组件拆分，每个文件 50-200KB

### 误区 2："CDN 只是加速静态资源"

**错！** CDN 还可以加速 API 请求（动态加速）。

**正确做法**：

1. 静态资源：CDN 边缘缓存（标准 CDN）
2. API 请求：CDN 智能路由（动态加速，选择最优路径回源）
3. 两者可以配合使用

### 误区 3："预连接越多越好"

**错！** 每个预连接都要消耗资源（TCP + TLS 握手），太多反而影响性能。

**正确做法**：

1. 只对确定会用到的重要域名预连接
2. 数量控制在 3-5 个以内
3. 不确定的域名用 `dns-prefetch`（更轻量）

### 误区 4："Brotli 全面优于 Gzip，只用 Brotli 就行"

**错！** Brotli 压缩率更高，但不是所有浏览器都支持。

**正确做法**：

1. 同时开启 Gzip 和 Brotli
2. 支持 Brotli 的浏览器自动用 Brotli
3. 不支持的降级到 Gzip
4. 预压缩时生成 `.gz` 和 `.br` 两种文件

---

## 11.10 动手练习

### 练习 1：基础练习 - 资源提示

**题目**：为以下页面添加合适的资源提示：

1. 页面会使用 `https://fonts.googleapis.com` 的字体
2. 页面会使用 `https://api.example.com` 的接口
3. 当前页面需要一张关键大图 `/hero.webp`

<details>
<summary>点击查看答案</summary>

```html
<head>
  <!-- 字体域名：预连接（确定会用，且跨域） -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

  <!-- API 域名：预连接（确定会用） -->
  <link rel="preconnect" href="https://api.example.com">

  <!-- 关键大图：预加载（当前页面必须用到） -->
  <link rel="preload" href="/hero.webp" as="image" type="image/webp">
</head>
```

**要点**：

1. `preconnect` 用于确定会用到的第三方域名
2. `preload` 用于当前页面确定需要的关键资源
3. 跨域资源要加 `crossorigin`

</details>

### 练习 2：进阶练习 - Nginx 压缩配置

**题目**：为 Nginx 配置同时支持 Gzip 和 Brotli 压缩。

<details>
<summary>点击查看答案</summary>

```nginx
# Gzip 配置
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 1024;
gzip_vary on;
gzip_comp_level 6;

# Brotli 配置
brotli on;
brotli_types text/plain text/css application/json application/javascript text/xml;
brotli_comp_level 6;
brotli_min_length 1024;

# 使用预压缩文件（性能更好）
gzip_static on;
brotli_static on;
```

**要点**：

1. 同时开启两种压缩
2. `*_static on` 使用预压缩文件，避免实时压缩
3. `gzip_vary on` 确保 CDN 正确缓存不同压缩格式

</details>

### 练习 3（挑战）：综合练习 - 网络感知加载

**题目**：实现一个根据网络状态动态调整加载策略的函数。

<details>
<summary>点击查看答案</summary>

```javascript
function adaptiveLoading() {
  // 默认策略
  const config = {
    loadImages: true,
    loadVideos: true,
    imageQuality: 'high',
    preloadCritical: true,
    enableAnimations: true
  };

  if ('connection' in navigator) {
    const conn = navigator.connection;

    if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
      // 弱网：极简模式
      config.loadImages = false;
      config.loadVideos = false;
      config.imageQuality = 'low';
      config.enableAnimations = false;
    } else if (conn.effectiveType === '3g') {
      // 3G：精简模式
      config.loadVideos = false;
      config.imageQuality = 'medium';
    }

    // 开启省流量模式时
    if (conn.saveData) {
      config.loadVideos = false;
      config.imageQuality = 'low';
      config.enableAnimations = false;
    }
  }

  return config;
}

// 使用
const loadingConfig = adaptiveLoading();
if (!loadingConfig.loadImages) {
  // 用占位图替代真实图片
  document.querySelectorAll('img').forEach(img => {
    img.src = '/placeholder.svg';
  });
}
```

**要点**：

1. 根据 `effectiveType` 判断网络速度
2. 根据 `saveData` 判断用户是否开启省流量
3. 不同网络条件使用不同的加载策略

</details>

---

## 下一章预告

下一章我们会学习 **框架性能优化**——也就是 Vue 和 React 框架层面的优化技巧。

你会学到：

- Vue 的 shallowRef/shallowReactive、v-memo、异步组件
- React 的 memo、useMemo、useCallback
- 虚拟列表在框架中的实现
- 状态管理最佳实践

框架优化是更贴近日常开发的优化手段，直接提升页面运行性能。
