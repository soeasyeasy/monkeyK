---
title: "第4章：容器操作基础"
description: "容器创建、启动、停止、删除、查看日志"
---

# 第4章：容器操作基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何创建和运行一个容器？
- 容器运行后如何查看它的状态？
- 如何进入容器内部执行命令？
- 如何查看容器的日志？

这一章会教你容器的所有基础操作。学会这些，你就能自如地管理容器了。

---

## 1 为什么需要掌握容器操作？

### 痛点分析

很多新手学完镜像管理后，面对容器操作还是懵的：

- 不知道 `docker run` 的各种参数
- 容器启动后不知道怎么进去
- 出问题了不知道怎么排查

### 解决方案

掌握容器操作，你可以：

- 灵活创建和运行容器
- 快速排查容器问题
- 高效管理容器生命周期

---

## 2 创建与运行容器

### 基础运行

```bash
# ❶ 最简单的运行方式
docker run nginx

# 这条命令做了什么？
# 1. 检查本地是否有 nginx 镜像 → 没有则下载
# 2. 用镜像创建一个容器
# 3. 启动容器，运行默认命令（nginx）
# 4. 容器在前台运行，阻塞当前终端
```

### 后台运行

```bash
# ❶ 使用 -d 参数后台运行
docker run -d nginx

# ❷ 给容器起个名字
docker run -d --name my-nginx nginx

# ❸ 运行并进入容器（交互模式）
docker run -it ubuntu bash
# -i：保持标准输入打开
# -t：分配伪终端
```

### 端口映射

```bash
# ❶ 把容器的 80 端口映射到宿主机的 8080 端口
docker run -d -p 8080:80 nginx

# ❷ 映射多个端口
docker run -d -p 8080:80 -p 8443:443 nginx

# ❸ 映射端口范围
docker run -d -p 8000-8010:80-90 nginx

# ❹ 指定绑定的 IP（默认 0.0.0.0）
docker run -d -p 127.0.0.1:8080:80 nginx
```

### 环境变量

```bash
# ❶ 设置环境变量
docker run -d -e MYSQL_ROOT_PASSWORD=123456 mysql

# ❷ 设置多个环境变量
docker run -d \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=mydb \
  mysql

# ❸ 从文件读取环境变量
docker run -d --env-file .env mysql
```

### 挂载数据卷

```bash
# ❶ 挂载命名卷
docker run -d -v my-data:/var/lib/mysql mysql

# ❷ 挂载主机目录（绑定挂载）
docker run -d -v /host/path:/container/path nginx

# ❸ 挂载单个文件
docker run -d -v /host/nginx.conf:/etc/nginx/nginx.conf nginx
```

### 资源限制

```bash
# ❶ 限制 CPU 使用
docker run -d --cpus="1.5" nginx

# ❷ 限制内存使用
docker run -d --memory="512m" nginx

# ❸ 同时限制 CPU 和内存
docker run -d --cpus="1.5" --memory="512m" nginx
```

### 完整示例

```bash
# 运行一个完整的 MySQL 容器
docker run -d \
  --name my-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  --restart unless-stopped \
  mysql:8.0
```

---

## 3 查看容器状态

### 列出容器

```bash
# ❶ 查看正在运行的容器
docker ps

# ❷ 查看所有容器（包括已停止的）
docker ps -a

# ❸ 显示最近创建的 5 个容器
docker ps -n 5

# ❹ 只显示容器 ID
docker ps -q

# ❺ 显示文件大小
docker ps -s
```

### 查看容器详情

```bash
# ❶ 查看容器的详细信息
docker inspect my-nginx

# ❷ 查看容器的 IP 地址
docker inspect -f '{{.NetworkSettings.IPAddress}}' my-nginx

# ❸ 查看容器的挂载信息
docker inspect -f '{{json .Mounts}}' my-nginx | jq

# ❹ 查看容器的端口映射
docker inspect -f '{{json .NetworkSettings.Ports}}' my-nginx | jq
```

### 查看容器资源占用

```bash
# ❶ 实时查看容器资源占用
docker stats

# ❷ 查看指定容器的资源占用
docker stats my-nginx

# ❸ 非实时模式（只显示一次）
docker stats --no-stream
```

---

## 4 停止与启动容器

### 停止容器

```bash
# ❶ 优雅停止（发送 SIGTERM，等待 10 秒后 SIGKILL）
docker stop my-nginx

# ❷ 指定等待时间（秒）
docker stop -t 30 my-nginx

# ❸ 强制停止（立即发送 SIGKILL）
docker kill my-nginx
```

### 启动已停止的容器

```bash
# ❶ 启动容器
docker start my-nginx

# ❷ 启动并进入容器
docker start -i my-nginx

# ❸ 重启容器
docker restart my-nginx
```

### 暂停容器

```bash
# ❶ 暂停容器（冻结所有进程）
docker pause my-nginx

# ❷ 恢复容器
docker unpause my-nginx
```

> 暂停 vs 停止：暂停只是冻结进程，容器还在内存中；停止是真正关闭容器。

---

## 5 进入容器

### 使用 docker exec

```bash
# ❶ 进入运行中的容器（推荐）
docker exec -it my-nginx bash

# ❷ 执行单个命令
docker exec my-nginx ls /etc/nginx

# ❸ 以 root 用户进入
docker exec -u root -it my-nginx bash

# ❹ 在 alpine 镜像中进入（没有 bash）
docker exec -it my-alpine sh
```

### 使用 docker attach

```bash
# ❶ 附加到容器的主进程
docker attach my-nginx

# ❷ 退出时不停止容器
# 按 Ctrl+P 然后 Ctrl+Q
```

> 区别：`exec` 会创建新的进程，退出不会影响容器；`attach` 是连接到主进程，退出可能导致容器停止。

---

## 6 查看容器日志

### 查看日志

```bash
# ❶ 查看容器日志
docker logs my-nginx

# ❷ 实时跟踪日志
docker logs -f my-nginx

# ❸ 查看最近 100 行
docker logs --tail 100 my-nginx

# ❹ 查看指定时间之后的日志
docker logs --since 2024-01-01 my-nginx

# ❺ 查看指定时间之前的日志
docker logs --until 2024-01-01 my-nginx

# ❻ 显示时间戳
docker logs -t my-nginx
```

### 日志驱动

Docker 支持多种日志驱动：

```bash
# ❶ 查看当前日志驱动
docker info | grep "Logging Driver"

# ❷ 指定日志驱动
docker run -d --log-driver=json-file --log-opt max-size=10m nginx

# ❸ 常用日志驱动
# - json-file：默认，JSON 格式
# - syslog：发送到 syslog
# - journald：发送到 systemd journal
# - fluentd：发送到 fluentd
# - none：不记录日志
```

---

## 7 删除容器

### 删除单个容器

```bash
# ❶ 删除已停止的容器
docker rm my-nginx

# ❷ 强制删除运行中的容器
docker rm -f my-nginx

# ❸ 删除容器时同时删除数据卷
docker rm -v my-nginx
```

### 批量删除容器

```bash
# ❶ 删除所有已停止的容器
docker container prune

# ❷ 删除所有容器（危险！）
docker rm $(docker ps -aq)

# ❸ 删除所有已停止的容器（强制，不提示）
docker container prune -f
```

---

## 8 容器文件操作

### 复制文件

```bash
# ❶ 从宿主机复制到容器
docker copy /host/file.txt my-nginx:/container/

# ❷ 从容器复制到宿主机
docker copy my-nginx:/container/file.txt /host/

# ❸ 复制目录
docker copy /host/dir my-nginx:/container/
```

### 查看容器进程

```bash
# ❶ 查看容器内运行的进程
docker top my-nginx

# ❷ 查看容器内所有进程
docker top -aux my-nginx
```

---

## 9 核心知识点总结

| 操作 | 命令 | 说明 |
| --- | --- | --- |
| 运行容器 | `docker run` | 创建并启动容器 |
| 查看容器 | `docker ps` | 列出容器 |
| 查看详情 | `docker inspect` | 查看容器元数据 |
| 停止容器 | `docker stop` | 优雅停止 |
| 启动容器 | `docker start` | 启动已停止的容器 |
| 重启容器 | `docker restart` | 重启容器 |
| 进入容器 | `docker exec` | 在容器内执行命令 |
| 查看日志 | `docker logs` | 查看容器日志 |
| 删除容器 | `docker rm` | 删除容器 |
| 复制文件 | `docker cp` | 在容器和宿主机间复制 |

---

## 10 新手常见误区

### 误区 1："docker run 每次都会创建新容器"

**错！** `docker run` 实际上是 `docker create` + `docker start`。如果容器已存在，它会启动已有容器；如果不存在，才会创建新容器。

### 误区 2："容器停止后数据就丢失了"

不是的。容器停止后，可写层还在。只有删除容器，数据才会丢失。如果要持久化数据，应该使用数据卷（后面会学）。

### 误区 3："进入容器只能用 docker exec"

不是的。还可以用 `docker attach`，但 `exec` 更推荐，因为它创建新进程，退出不会影响容器。

### 误区 4："容器可以像虚拟机一样长期使用"

容器的设计哲学是"短暂"的。容器适合运行无状态服务，对于需要长期运行且需要持久化数据的场景，应该使用数据卷或数据库。

---

## 11 动手练习

### 练习 1：运行 Web 服务器

运行一个 Nginx 容器，映射端口到 8080，在浏览器中访问。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 运行 Nginx 容器
docker run -d --name my-web -p 8080:80 nginx

# ❷ 查看容器状态
docker ps

# ❸ 打开浏览器访问 http://localhost:8080

# ❹ 查看日志
docker logs my-web

# ❺ 停止并删除
docker stop my-web
docker rm my-web
```

</details>

### 练习 2：进入容器操作

运行一个 Ubuntu 容器，进入容器内部，创建文件，退出后重新进入验证。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 运行 Ubuntu 容器
docker run -d --name my-ubuntu ubuntu:22.04 sleep 3600

# ❷ 进入容器
docker exec -it my-ubuntu bash

# ❸ 在容器内创建文件
echo "Hello Docker" > /test.txt
cat /test.txt
exit

# ❹ 重新进入容器
docker exec -it my-ubuntu bash

# ❺ 验证文件还在
cat /test.txt
exit

# ❻ 清理
docker stop my-ubuntu
docker rm my-ubuntu
```

</details>

### 练习 3（挑战）：运行 MySQL 并连接

运行 MySQL 容器，设置密码，然后用另一个容器连接它。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 运行 MySQL 容器
docker run -d \
  --name my-mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  mysql:8.0

# ❷ 等待 MySQL 启动（约 10-30 秒）
docker logs -f my-mysql
# 看到 "ready for connections" 后按 Ctrl+C

# ❸ 用 MySQL 客户端连接
docker run -it --rm \
  --link my-mysql:mysql \
  mysql:8.0 \
  mysql -hmysql -uroot -p123456

# ❹ 在 MySQL 中执行命令
SHOW DATABASES;
exit

# ❺ 清理
docker stop my-mysql
docker rm my-mysql
```

</details>

---

## 下一章预告

下一章我们会学习 **Dockerfile**——如何用代码定义镜像。这是 Docker 最核心的概念之一，学会它，你就能把任何应用打包成镜像了。
