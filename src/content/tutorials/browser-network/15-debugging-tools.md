---
title: "第十五章：网络调试工具"
description: "DevTools Network 面板、性能分析、抓包工具"
---

# 第十五章：网络调试工具

## 浏览器开发者工具

浏览器内置的开发者工具（DevTools）是网络调试的首选。

### 打开方式

| 浏览器 | 快捷键 |
| --- | --- |
| Chrome | F12 或 Ctrl+Shift+I |
| Firefox | F12 或 Ctrl+Shift+I |
| Safari | Cmd+Option+I |
| Edge | F12 或 Ctrl+Shift+I |

## Network 面板

Network 面板用于监控网络请求。

### 主要功能

| 功能 | 说明 |
| --- | --- |
| 请求列表 | 查看所有网络请求 |
| 请求详情 | 查看请求头、响应头、预览 |
| 时间线 | 分析请求时序 |
| 过滤器 | 筛选特定类型请求 |
| 节流 | 模拟慢速网络 |

### 请求信息

| 标签 | 内容 |
| --- | --- |
| Headers | 请求和响应头部 |
| Preview | 响应内容预览 |
| Response | 原始响应内容 |
| Timing | 请求时间分解 |
| Cookies | 相关 Cookie |

### 时间分解

| 阶段 | 说明 |
| --- | --- |
| Queueing | 排队等待 |
| Stalled | 等待可用连接 |
| DNS Lookup | DNS 解析 |
| Initial Connection | 建立连接 |
| SSL | SSL 握手 |
| TTFB | 等待服务器响应 |
| Content Download | 下载内容 |

### 过滤器使用

```
# 按类型过滤
filter:doc        # 文档
filter:xhr        # AJAX 请求
filter:ws         # WebSocket
filter:css        # 样式表
filter:js         # JavaScript
filter:img        # 图片
filter:font       # 字体

# 按状态码过滤
status-code:200
status-code:404
status-code:500

# 按大小过滤
larger-than:1M
size:100-500

# 按域名过滤
domain:example.com
```

## Performance 面板

Performance 面板用于分析页面性能。

### 录制步骤

1. 打开 Performance 面板
2. 点击录制按钮
3. 执行要分析的操作
4. 停止录制
5. 分析结果

### 关键指标

| 指标 | 说明 | 目标 |
| --- | --- | --- |
| FCP | 首次内容绘制 | < 1.8s |
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累积布局偏移 | < 0.1 |
| TTFB | 首字节时间 | < 800ms |

### 性能优化建议

| 问题 | 建议 |
| --- | --- |
| 长任务 | 拆分任务，使用 requestIdleCallback |
| 布局抖动 | 避免强制同步布局 |
| 内存泄漏 | 清理事件监听器、定时器 |
| 脚本执行慢 | 使用 Web Worker |

## Application 面板

Application 面板用于查看和管理存储。

### 功能

| 功能 | 说明 |
| --- | --- |
| Storage | 查看 Cookie、LocalStorage、SessionStorage |
| Cache | 查看 Cache Storage |
| IndexedDB | 查看 IndexedDB 数据 |
| Service Workers | 管理 Service Worker |
| Background Services | 查看后台服务 |

## 抓包工具

### Charles

Charles 是跨平台抓包工具。

**功能**：
- HTTP/HTTPS 抓包
- 请求重放
- 断点调试
- 速度限制
- Map Local/Remote

**配置 HTTPS**：
1. 安装 Charles 证书
2. 配置代理
3. 信任证书

### Fiddler

Fiddler 是 Windows 平台的抓包工具。

**功能**：
- HTTP/HTTPS 抓包
- 请求构造
- 自动响应
- 性能分析

### Wireshark

Wireshark 是网络协议分析工具。

**功能**：
- 深度包分析
- 协议解码
- 流量统计
- 过滤规则

**常用过滤器**：
```
# IP 过滤
ip.addr == 192.168.1.1

# 端口过滤
tcp.port == 80

# 协议过滤
http
dns
tls

# HTTP 过滤
http.request.method == "GET"
http.response.code == 404
```

## 移动端调试

### Chrome Remote Debugging

1. 手机开启 USB 调试
2. 连接电脑
3. Chrome 打开 `chrome://inspect`
4. 选择设备调试

### Safari Web Inspector

1. iPhone 开启 Web 检查器
2. 连接 Mac
3. Safari 开发菜单中选择设备

### 代理调试

使用 Charles/Fiddler 作为代理：

```
手机 Wi-Fi 设置代理：
- 服务器：电脑 IP
- 端口：8888（Charles 默认）
```

## 调试技巧

### 断点调试

```javascript
// 代码断点
debugger;

// 条件断点
// 右键行号 -> Add conditional breakpoint

// DOM 断点
// Elements 面板 -> Break on -> subtree modifications
```

### 网络模拟

```javascript
// 模拟慢速网络
// Network 面板 -> Throttling -> Slow 3G

// 离线模式
// Network 面板 -> Throttling -> Offline
```

### 请求拦截

```javascript
// Service Worker 拦截
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 本章小结

浏览器开发者工具提供了强大的网络调试功能，Network 面板用于分析请求，Performance 面板用于性能优化。配合 Charles、Fiddler 等抓包工具，可以全面排查网络问题。
