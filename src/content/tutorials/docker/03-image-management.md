---
title: "第3章：镜像管理基础"
description: "镜像搜索、拉取、查看、删除、标签管理"
---

# 第3章：镜像管理基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么找到我需要的镜像？
- 镜像的标签（Tag）是什么意思？
- 如何清理不用的镜像？
- 怎么把自己的镜像分享给别人？

这一章会教你管理 Docker 镜像的所有基础操作。学会这些，你就能自如地使用各种镜像了。

---

## 3.1 为什么需要管理镜像？

### 痛点分析

随着你使用 Docker 越来越多，本地会积累大量镜像：

- 下载了很多镜像，不知道哪些有用
- 磁盘空间被占满，不知道如何清理
- 镜像版本混乱，不知道用哪个版本好

### 解决方案

掌握镜像管理技能，你可以：

- 快速找到需要的镜像
- 合理管理镜像版本
- 清理无用镜像，释放磁盘空间

---

## 3.2 搜索镜像

### 使用 Docker Hub 网站

最直观的方式是访问 [Docker Hub](https://hub.docker.com/)，在搜索框中输入关键词。

例如搜索 `nginx`，你会看到：

- 官方镜像（Official Image）：由 Docker 官方或软件厂商维护
- 社区镜像：由社区用户贡献

### 使用命令行搜索

```bash
# ❶ 搜索 nginx 相关镜像
docker search nginx

# 输出示例：
# NAME                             DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
# nginx                            Official build of Nginx.                        18000+    [OK]
# jwilder/nginx-proxy              A reverse proxy that runs docker containers...  2000+                [OK]

# ❷ 只显示星级以上的镜像
docker search --filter stars=100 nginx

# ❸ 限制输出数量
docker search --limit 5 nginx
```

### 搜索结果说明

| 字段 | 说明 |
| --- | --- |
| NAME | 镜像名称 |
| DESCRIPTION | 镜像描述 |
| STARS | 星标数，越高越受欢迎 |
| OFFICIAL | 是否官方镜像，[OK] 表示是 |
| AUTOMATED | 是否自动构建 |

> 建议优先选择 **官方镜像** 或 **星标数高** 的镜像，质量更有保障。

---

## 3.3 拉取镜像

### 基础拉取

```bash
# ❶ 拉取最新版本的 nginx 镜像
docker pull nginx

# ❷ 拉取指定版本的镜像
docker pull nginx:1.25.0

# ❸ 拉取指定平台的镜像
docker pull --platform linux/amd64 nginx

# ❹ 拉取所有标签的镜像（不推荐，会下载很多）
docker pull --all-tags nginx
```

### 镜像下载位置

Docker 镜像存储在本地：

- **Linux**：`/var/lib/docker/`
- **Windows/macOS**：Docker Desktop 的虚拟磁盘内

### 查看下载进度

```bash
# 拉取时会显示进度
docker pull nginx

# 输出示例：
# Using default tag: latest
# latest: Pulling from library/nginx
# a2abf6c4d296: Pull complete 
# a7edb044d13e: Pull complete 
# ...
# Digest: sha256:xxxxx
# Status: Downloaded newer image for nginx:latest
# docker.io/library/nginx:latest
```

---

## 3.4 查看镜像

### 列出本地镜像

```bash
# ❶ 查看所有镜像
docker images

# ❷ 只显示镜像 ID
docker images -q

# ❸ 显示更多信息（包括 digest）
docker images --digests

# ❹ 过滤镜像
# 只显示 nginx 镜像
docker images nginx

# 只显示某个镜像的特定标签
docker images nginx:latest

# ❺ 按条件过滤
# 只显示 dangling 镜像（没有标签的镜像）
docker images -f dangling=true

# 只显示某个镜像之后的镜像
docker images -f since=nginx:latest
```

### 查看镜像详细信息

```bash
# ❶ 查看镜像的元数据
docker inspect nginx:latest

# ❷ 只查看特定字段
docker inspect -f '{{.Size}}' nginx:latest
# 输出镜像大小（字节）

docker inspect -f '{{.Config.Cmd}}' nginx:latest
# 输出默认启动命令

# ❸ 格式化输出
docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' nginx:latest
# 输出所有环境变量
```

### 查看镜像构建历史

```bash
# ❶ 查看镜像的每一层
docker history nginx:latest

# 输出示例：
# IMAGE          CREATED       CREATED BY                                      SIZE      COMMENT
# 605c77e624dd   2 weeks ago   /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B        
# <missing>      2 weeks ago   /bin/sh -c #(nop)  EXPOSE 80                    0B        
# <missing>      2 weeks ago   /bin/sh -c set -x     && addgroup --system -…   63.8MB    
# ...

# ❷ 只显示镜像 ID 和大小
docker history --no-trunc -H nginx:latest

# ❸ 只显示摘要
docker history --format "table {{.ID}}\t{{.Size}}" nginx:latest
```

---

## 3.5 镜像标签管理

### 标签的作用

标签（Tag）用来区分同一个镜像的不同版本。

```bash
# ❶ 给镜像打新标签
docker tag nginx:latest my-nginx:new

# ❷ 查看打标签后的结果
docker images | grep nginx
# 你会发现 nginx:latest 和 my-nginx:new 的 IMAGE ID 是一样的
# 说明它们是同一个镜像，只是标签不同
```

### 标签命名规范

```bash
# 常见标签格式
nginx:latest          # 最新版本
nginx:1.25            # 主版本.次版本
nginx:1.25.0          # 完整版本号
nginx:alpine          # 基于 Alpine 的精简版
nginx:1.25-alpine     # 指定版本的精简版
nginx:bullseye        # 基于 Debian Bullseye
```

### 删除标签

```bash
# ❶ 删除标签（不会删除镜像本身）
docker rmi my-nginx:new

# ❷ 如果镜像只有一个标签，删除标签会同时删除镜像
docker rmi nginx:latest
```

> 注意：删除标签只是删除了一个"引用"，如果镜像还有其他标签，镜像本身不会被删除。

---

## 3.6 删除镜像

### 删除单个镜像

```bash
# ❶ 用镜像名称删除
docker rmi nginx:latest

# ❷ 用镜像 ID 删除
docker rmi 605c77e624dd

# ❸ 强制删除（即使有容器在使用）
docker rmi -f nginx:latest
```

### 批量删除镜像

```bash
# ❶ 删除所有镜像（危险操作！）
docker rmi $(docker images -q)

# ❷ 删除所有 dangling 镜像（没有标签的镜像）
docker image prune

# ❸ 删除所有未被容器使用的镜像
docker image prune -a

# ❹ 删除所有镜像（包括正在使用的）
docker image prune -a -f
```

### 清理磁盘空间

```bash
# ❶ 查看 Docker 占用的磁盘空间
docker system df

# 输出示例：
# TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
# Images          15        2         5.2GB     4.8GB (92%)
# Containers      2         0         120MB     120MB (100%)
# Local Volumes   3         1         2.1GB     1.8GB (85%)
# Build Cache     0         0         0B        0B

# ❷ 查看详细占用情况
docker system df -v

# ❸ 清理所有未使用的资源（镜像、容器、网络、构建缓存）
docker system prune

# ❹ 清理所有未使用的资源（包括未被使用的镜像）
docker system prune -a

# ❺ 清理所有未使用的资源（包括卷）
docker system prune -a --volumes
```

> 建议：定期运行 `docker system prune` 清理无用资源，释放磁盘空间。

---

## 3.7 镜像的导入与导出

### 导出镜像

```bash
# ❶ 导出镜像为 tar 文件
docker save -o nginx.tar nginx:latest

# ❷ 导出多个镜像
docker save -o images.tar nginx:latest ubuntu:22.04

# ❸ 导出到标准输出（可配合 gzip 压缩）
docker save nginx:latest | gzip > nginx.tar.gz
```

### 导入镜像

```bash
# ❶ 从 tar 文件导入
docker load -i nginx.tar

# ❷ 从标准输入导入
docker load < nginx.tar

# ❸ 导入压缩的镜像
gunzip -c nginx.tar.gz | docker load
```

### 导入与导出的用途

| 场景 | 说明 |
| --- | --- |
| 离线环境部署 | 在有网环境导出镜像，拷贝到无网环境导入 |
| 备份镜像 | 把重要镜像导出备份 |
| 分享镜像 | 不通过仓库，直接分享镜像文件 |
| 迁移镜像 | 从一台机器迁移到另一台 |

---

## 3.8 构建镜像基础

### 使用 docker commit

你可以把一个运行中的容器保存为新镜像：

```bash
# ❶ 运行一个容器并修改它
docker run -it --name my-ubuntu ubuntu:22.04 bash

# 在容器内安装软件
apt-get update
apt-get install -y nginx

# 退出容器
exit

# ❷ 把容器保存为新镜像
docker commit my-ubuntu my-ubuntu-with-nginx:v1

# ❸ 查看新镜像
docker images | grep my-ubuntu

# ❹ 用新镜像运行容器，验证 nginx 是否已安装
docker run -it my-ubuntu-with-nginx:v1 nginx -v
```

> 注意：`docker commit` 适合快速创建镜像，但不推荐用于生产。生产环境应该用 Dockerfile（下一章会学），因为 Dockerfile 可重复构建、可版本控制。

---

## 3.9 核心知识点总结

| 操作 | 命令 | 说明 |
| --- | --- | --- |
| 搜索镜像 | `docker search` | 在 Docker Hub 搜索镜像 |
| 拉取镜像 | `docker pull` | 下载镜像到本地 |
| 查看镜像 | `docker images` | 列出本地镜像 |
| 查看详情 | `docker inspect` | 查看镜像元数据 |
| 查看历史 | `docker history` | 查看镜像构建历史 |
| 打标签 | `docker tag` | 给镜像添加新标签 |
| 删除镜像 | `docker rmi` | 删除本地镜像 |
| 导出镜像 | `docker save` | 导出镜像为 tar 文件 |
| 导入镜像 | `docker load` | 从 tar 文件导入镜像 |
| 提交镜像 | `docker commit` | 把容器保存为镜像 |
| 清理资源 | `docker system prune` | 清理未使用的资源 |

---

## 3.10 新手常见误区

### 误区 1："删除标签就是删除镜像"

**错！** 标签只是镜像的一个"别名"。删除标签只是删除了这个别名，如果镜像还有其他标签，镜像本身不会被删除。只有当镜像的所有标签都被删除，镜像才会被真正删除。

### 误区 2："docker pull 总是下载最新版本"

不是的。`docker pull nginx` 默认下载 `latest` 标签，但 `latest` 不一定是最新的。建议指定具体版本号，如 `nginx:1.25.0`。

### 误区 3："镜像越大越好"

不是的。大的镜像意味着下载慢、占用磁盘多。好的实践是使用精简镜像（如 `alpine`），只安装必要的依赖。

### 误区 4："docker commit 是创建镜像的最佳方式"

不是的。`docker commit` 适合快速测试，但不可重复、不可版本控制。生产环境应该用 Dockerfile，它可重复构建、可追踪变更。

---

## 3.11 动手练习

### 练习 1：镜像搜索与拉取

搜索 `python` 镜像，拉取官方镜像的 3.11 版本和 alpine 版本。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 搜索 python 镜像
docker search python

# ❷ 拉取 python:3.11
docker pull python:3.11

# ❸ 拉取 python:3.11-alpine
docker pull python:3.11-alpine

# ❹ 查看拉取的镜像
docker images | grep python

# 你会发现 alpine 版本比标准版本小很多
```

</details>

### 练习 2：镜像标签管理

给 `nginx:latest` 打一个新标签 `my-nginx:v1`，然后删除这个标签。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 确保有 nginx 镜像
docker pull nginx:latest

# ❷ 打标签
docker tag nginx:latest my-nginx:v1

# ❸ 查看镜像
docker images | grep -E "nginx|my-nginx"
# 你会发现两个镜像的 IMAGE ID 相同

# ❹ 删除标签
docker rmi my-nginx:v1

# ❺ 验证 nginx 镜像还在
docker images | grep nginx
```

</details>

### 练习 3（挑战）：镜像导出与导入

导出 `nginx` 镜像，删除它，然后重新导入。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 导出镜像
docker save -o nginx-backup.tar nginx:latest

# ❷ 删除镜像
docker rmi nginx:latest

# ❸ 验证镜像已删除
docker images | grep nginx
# 应该没有输出

# ❹ 重新导入
docker load -i nginx-backup.tar

# ❺ 验证镜像已恢复
docker images | grep nginx

# ❻ 清理备份文件
rm nginx-backup.tar
```

</details>

---

## 下一章预告

下一章我们会学习 **容器操作基础**——如何创建、启动、停止、删除容器，以及如何查看容器日志、进入容器内部。这些是日常使用 Docker 最频繁的操作。
