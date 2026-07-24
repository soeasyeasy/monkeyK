---
title: "第八章：HTTPS 与加密"
description: "SSL/TLS、证书验证、对称与非对称加密"
---

# 第八章：HTTPS 与加密

## HTTPS 概述

HTTPS（HyperText Transfer Protocol Secure）是 HTTP 的安全版本，通过 SSL/TLS 加密数据传输。

### HTTPS 特点

| 特性 | 说明 |
| --- | --- |
| 加密传输 | 数据加密，防止窃听 |
| 身份验证 | 验证服务器身份 |
| 数据完整性 | 防止数据篡改 |

### HTTP vs HTTPS

| 对比项 | HTTP | HTTPS |
| --- | --- | --- |
| 端口 | 80 | 443 |
| 加密 | 无 | SSL/TLS |
| 证书 | 不需要 | 需要 |
| 性能 | 较快 | 稍慢（加密开销） |
| SEO | 一般 | 优先 |

## 加密算法

### 对称加密
加密和解密使用相同的密钥：

| 算法 | 密钥长度 | 特点 |
| --- | --- | --- |
| AES | 128/192/256 位 | 目前最安全、最常用 |
| DES | 56 位 | 已不安全 |
| 3DES | 168 位 | DES 的改进版 |

**优点**：速度快  
**缺点**：密钥分发困难

### 非对称加密
使用公钥加密，私钥解密：

| 算法 | 密钥长度 | 特点 |
| --- | --- | --- |
| RSA | 2048/4096 位 | 最常用 |
| ECC | 256 位 | 密钥短，速度快 |
| DSA | 1024 位 | 仅用于签名 |

**优点**：密钥分发安全  
**缺点**：速度慢

### 哈希算法
将任意长度数据映射为固定长度：

| 算法 | 输出长度 | 特点 |
| --- | --- | --- |
| MD5 | 128 位 | 已不安全 |
| SHA-1 | 160 位 | 已不安全 |
| SHA-256 | 256 位 | 目前安全 |
| SHA-3 | 可变 | 最新标准 |

## SSL/TLS 协议

### SSL 与 TLS 关系

| 版本 | 年份 | 说明 |
| --- | --- | --- |
| SSL 1.0 | 1994 | 未发布 |
| SSL 2.0 | 1995 | 已废弃 |
| SSL 3.0 | 1996 | 已废弃 |
| TLS 1.0 | 1999 | 已废弃 |
| TLS 1.1 | 2006 | 已废弃 |
| TLS 1.2 | 2008 | 目前常用 |
| TLS 1.3 | 2018 | 最新，更安全 |

### TLS 握手过程

```
客户端                    服务器
  |                         |
  |--- ClientHello -------->|  支持的加密套件、随机数
  |                         |
  |<-- ServerHello ---------|  选择的加密套件、随机数
  |                         |
  |<-- Certificate ---------|  服务器证书
  |                         |
  |<-- ServerKeyExchange ---|  密钥交换参数（可选）
  |                         |
  |<-- ServerHelloDone -----|  服务器完成
  |                         |
  |--- ClientKeyExchange -->|  客户端密钥参数
  |                         |
  |--- ChangeCipherSpec --->|  切换加密模式
  |                         |
  |--- Finished ----------->|  握手完成
  |                         |
  |<-- ChangeCipherSpec ----|  服务器切换加密模式
  |                         |
  |<-- Finished ------------|  服务器握手完成
  |                         |
  |===== 加密通信 ==========|
```

## 数字证书

### 证书内容
- 域名
- 公钥
- 颁发机构
- 有效期
- 数字签名

### 证书链
```
根证书（Root CA）
    ↓
中间证书（Intermediate CA）
    ↓
服务器证书（Server Certificate）
```

### 证书验证流程
1. 浏览器收到服务器证书
2. 检查证书是否过期
3. 检查证书是否被吊销
4. 验证证书链是否可信
5. 验证域名是否匹配

## 证书类型

| 类型 | 验证级别 | 适用场景 |
| --- | --- | --- |
| DV | 域名验证 | 个人网站 |
| OV | 组织验证 | 企业网站 |
| EV | 扩展验证 | 银行、电商 |

## HTTPS 配置

### Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

## 本章小结

HTTPS 通过 SSL/TLS 加密数据传输，结合对称加密的速度和非对称加密的安全性。数字证书验证服务器身份，防止中间人攻击。配置 HTTPS 是现代 Web 应用的必备要求。
