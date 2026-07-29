---
title: '第1章：Docker 基础命令 - 镜像与容器'
description: '系统掌握 Docker 镜像管理、容器生命周期管理的所有核心命令'
---

# 第1章：Docker 基础命令 - 镜像与容器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Docker 命令那么多，从哪里开始学？
- 镜像和容器的关系是什么？
- 如何快速查找、下载、删除镜像？
- 如何创建、启动、停止、删除容器？

这一章会系统讲解 Docker 最基础的命令，让你能够熟练管理镜像和容器。

---

## 1 Docker 命令基本格式

### 命令结构

Docker 命令遵循统一的格式：

```bash
docker [选项] <命令> [参数]
```

**常见选项**：

| 选项 | 说明 |
| --- | --- |
| `--help` | 查看命令帮助 |
| `--version` | 查看 Docker 版本 |
| `-H` | 指定远程 Docker 守护进程地址 |

**查看帮助**：

```bash
# 查看 Docker 所有命令
docker --help

# 查看具体命令帮助
docker run --help
docker image --help
```

### 命令分类

Docker 命令按功能分为以下几类：

```bash
# 镜像相关
docker image     # 镜像管理
docker pull      # 拉取镜像
docker build     # 构建镜像
docker push      # 推送镜像

# 容器相关
docker container # 容器管理
docker run       # 创建并启动容器
docker exec      # 在容器中执行命令
docker logs      # 查看容器日志

# 系统相关
docker system    # 系统管理
docker info      # 查看系统信息
docker version   # 查看版本信息
```

---

## 2 镜像管理命令

### 2.1 搜索镜像 - docker search

**命令格式**：

```bash
docker search [选项] <关键词>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `--filter stars=N` | 只显示收藏数 >= N 的镜像 |
| `--limit N` | 限制显示结果数量 |
| `--no-trunc` | 不截断输出内容 |

**实战示例**：

```bash
# 搜索 nginx 镜像
docker search nginx

# 只显示收藏数 >= 100 的镜像
docker search --filter stars=100 nginx

# 限制显示前 10 个结果
docker search --limit 10 nginx
```

**输出示例**：

```
NAME         DESCRIPTION                            STARS   OFFICIAL
nginx        Official build of Nginx.               18000   [OK]
jwilder/nginx-proxy  Automated Nginx reverse proxy  2100
bitnami/nginx        Bitnami nginx Docker Image     150
```

### 2.2 拉取镜像 - docker pull

**命令格式**：

```bash
docker pull [选项] <镜像名>[:<标签>]
```

**镜像名格式**：

```
[registry/]repository[:tag]
```

**实战示例**：

```bash
# 拉取最新版本的 nginx
docker pull nginx

# 拉取指定版本
docker pull nginx:1.25.3

# 拉取指定版本（alpine 版本，更小）
docker pull nginx:1.25.3-alpine

# 从其他仓库拉取（如阿里云）
docker pull registry.cn-hangzhou.aliyuncs.com/library/nginx:latest
```

**输出示例**：

```
1.25.3: Pulling from library/nginx
a2abf6c4d296: Pull complete
a7edb0686f3a: Pull complete
...
Digest: sha256:644a70516a26...
Status: Downloaded newer image for nginx:1.25.3
docker.io/library/nginx:1.25.3
```

### 2.3 查看镜像 - docker images

**命令格式**：

```bash
docker images [选项] [镜像名]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-a` | 显示所有镜像（包括中间层） |
| `-q` | 只显示镜像 ID |
| `--digests` | 显示镜像摘要 |
| `--no-trunc` | 不截断输出内容 |
| `-f` | 过滤条件 |

**实战示例**：

```bash
# 查看所有镜像
docker images

# 只显示镜像 ID（常用于批量操作）
docker images -q

# 查看指定镜像
docker images nginx

# 过滤：只显示 nginx 镜像
docker images -f reference=nginx

# 过滤：只显示 dangling 镜像（无标签的镜像）
docker images -f dangling=true
```

**输出示例**：

```
REPOSITORY   TAG          IMAGE ID       CREATED        SIZE
nginx        1.25.3       6efc10a0510f   2 days ago     142MB
nginx        latest       6efc10a0510f   2 days ago     142MB
redis        alpine       e4a1b8f3e2a1   3 days ago     32.5MB
```

### 2.4 删除镜像 - docker rmi

**命令格式**：

```bash
docker rmi [选项] <镜像ID或镜像名>[:<标签>]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f` | 强制删除镜像 |
| `--no-prune` | 不删除未标记的父镜像 |

**实战示例**：

```bash
# 删除指定镜像
docker rmi nginx:1.25.3

# 通过镜像 ID 删除
docker rmi 6efc10a0510f

# 强制删除（即使有容器在使用）
docker rmi -f nginx:latest

# 批量删除所有 dangling 镜像
docker rmi $(docker images -f dangling=true -q)

# 批量删除所有镜像（慎用）
docker rmi $(docker images -q)
```

### 2.5 给镜像打标签 - docker tag

**命令格式**：

```bash
docker tag <源镜像>[:<标签>] <目标镜像>[:<标签>]
```

**实战示例**：

```bash
# 给镜像打新标签
docker tag nginx:1.25.3 my-nginx:latest

# 打标签用于推送到私有仓库
docker tag nginx:1.25.3 registry.example.com/nginx:1.25.3

# 查看打标签后的结果
docker images
```

**说明**：打标签不会创建新的镜像，只是给同一个镜像 ID 添加了新的引用。

### 2.6 查看镜像历史 - docker history

**命令格式**：

```bash
docker history [选项] <镜像>
```

**实战示例**：

```bash
# 查看镜像构建历史
docker history nginx:1.25.3

# 不截断输出
docker history --no-trunc nginx:1.25.3
```

**输出示例**：

```
IMAGE          CREATED       CREATED BY                                      SIZE      COMMENT
6efc10a0510f   2 days ago    /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B
<missing>      2 days ago    /bin/sh -c #(nop)  EXPOSE 80                    0B
<missing>      2 days ago    /bin/sh -c #(nop)  COPY file:... /etc/nginx/…   1.1kB
...
```

### 2.7 保存和加载镜像

**保存镜像到文件**：

```bash
# 保存单个镜像
docker save -o nginx.tar nginx:1.25.3

# 保存多个镜像
docker save -o images.tar nginx:1.25.3 redis:alpine

# 压缩保存
docker save nginx:1.25.3 | gzip > nginx.tar.gz
```

**从文件加载镜像**：

```bash
# 从 tar 文件加载
docker load -i nginx.tar

# 从压缩文件加载
docker load < nginx.tar.gz
```

**使用场景**：

- 离线环境部署镜像
- 备份重要镜像
- 在不同环境间迁移镜像

---

## 3 容器管理命令

### 3.1 创建并启动容器 - docker run

**命令格式**：

```bash
docker run [选项] <镜像> [命令] [参数...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-d` | 后台运行容器（detached mode） |
| `-i` | 保持标准输入打开（interactive） |
| `-t` | 分配伪终端（tty） |
| `--name` | 指定容器名称 |
| `-p` | 端口映射（宿主机端口:容器端口） |
| `-P` | 随机映射所有暴露端口 |
| `-v` | 挂载数据卷（宿主机路径:容器路径） |
| `-e` | 设置环境变量 |
| `--network` | 指定网络模式 |
| `--restart` | 重启策略（no/on-failure/always/unless-stopped） |
| `--rm` | 容器停止后自动删除 |
| `-w` | 设置工作目录 |
| `--entrypoint` | 覆盖默认入口点 |

**实战示例**：

```bash
# 最简单的运行
docker run nginx

# 后台运行并指定名称
docker run -d --name my-nginx nginx:1.25.3

# 后台运行并映射端口
docker run -d --name my-nginx -p 8080:80 nginx:1.25.3

# 映射多个端口
docker run -d --name my-nginx -p 8080:80 -p 8443:443 nginx:1.25.3

# 设置环境变量
docker run -d --name my-mysql -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0

# 挂载数据卷
docker run -d --name my-nginx -v /data/html:/usr/share/nginx/html nginx:1.25.3

# 交互式运行（进入容器）
docker run -it ubuntu /bin/bash

# 运行完自动删除
docker run --rm nginx echo "Hello Docker"

# 指定重启策略
docker run -d --name my-nginx --restart always nginx:1.25.3

# 指定网络
docker run -d --name my-nginx --network my-network nginx:1.25.3

# 限制资源
docker run -d --name my-nginx --memory=512m --cpus=1.0 nginx:1.25.3
```

### 3.2 查看容器 - docker ps

**命令格式**：

```bash
docker ps [选项]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-a` | 显示所有容器（包括已停止的） |
| `-q` | 只显示容器 ID |
| `-l` | 显示最近创建的容器 |
| `-n N` | 显示最近 N 个创建的容器 |
| `-f` | 过滤条件 |
| `-s` | 显示容器大小 |
| `--no-trunc` | 不截断输出内容 |

**实战示例**：

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 只显示容器 ID
docker ps -q

# 查看最近创建的 5 个容器
docker ps -n 5

# 过滤：只显示运行中的容器
docker ps -f status=running

# 过滤：只显示已退出的容器
docker ps -f status=exited

# 过滤：按名称过滤
docker ps -f name=nginx

# 组合过滤
docker ps -f status=running -f name=nginx
```

**输出示例**：

```
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                NAMES
a1b2c3d4e5f6   nginx:1.25.3   "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes   0.0.0.0:8080->80/tcp   my-nginx
```

### 3.3 停止容器 - docker stop

**命令格式**：

```bash
docker stop [选项] <容器ID或容器名>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-t` | 停止前等待的时间（秒），默认 10 秒 |

**实战示例**：

```bash
# 停止单个容器
docker stop my-nginx

# 通过容器 ID 停止
docker stop a1b2c3d4e5f6

# 停止多个容器
docker stop my-nginx my-redis my-mysql

# 批量停止所有运行中的容器
docker stop $(docker ps -q)

# 设置等待时间（10 秒后强制停止）
docker stop -t 10 my-nginx
```

**说明**：`docker stop` 会先发送 SIGTERM 信号，等待容器优雅退出；超时后发送 SIGKILL 强制终止。

### 3.4 启动已停止的容器 - docker start

**命令格式**：

```bash
docker start [选项] <容器ID或容器名>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-i` | 以交互模式启动 |
| `-a` | 附加标准输入/输出 |

**实战示例**：

```bash
# 启动已停止的容器
docker start my-nginx

# 以交互模式启动
docker start -i my-nginx

# 批量启动所有已停止的容器
docker start $(docker ps -a -q -f status=exited)
```

### 3.5 重启容器 - docker restart

**命令格式**：

```bash
docker restart [选项] <容器ID或容器名>
```

**实战示例**：

```bash
# 重启容器
docker restart my-nginx

# 设置等待时间
docker restart -t 10 my-nginx

# 批量重启
docker restart my-nginx my-redis
```

### 3.6 删除容器 - docker rm

**命令格式**：

```bash
docker rm [选项] <容器ID或容器名>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f` | 强制删除运行中的容器 |
| `-v` | 同时删除关联的数据卷 |
| `-l` | 删除网络链接而非容器 |

**实战示例**：

```bash
# 删除已停止的容器
docker rm my-nginx

# 强制删除运行中的容器
docker rm -f my-nginx

# 删除容器及其数据卷
docker rm -v my-nginx

# 批量删除所有已停止的容器
docker rm $(docker ps -a -q -f status=exited)

# 批量删除所有容器（慎用）
docker rm -f $(docker ps -a -q)
```

### 3.7 查看容器日志 - docker logs

**命令格式**：

```bash
docker logs [选项] <容器ID或容器名>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f` | 实时跟踪日志（follow） |
| `--tail N` | 显示最后 N 行 |
| `-t` | 显示时间戳 |
| `--since` | 显示某个时间点之后的日志 |
| `--until` | 显示某个时间点之前的日志 |

**实战示例**：

```bash
# 查看所有日志
docker logs my-nginx

# 实时跟踪日志
docker logs -f my-nginx

# 查看最后 50 行
docker logs --tail 50 my-nginx

# 显示时间戳
docker logs -t my-nginx

# 查看最近 1 小时的日志
docker logs --since 1h my-nginx

# 查看某个时间点之后的日志
docker logs --since "2024-01-01T00:00:00" my-nginx

# 组合使用
docker logs -f --tail 100 -t my-nginx
```

### 3.8 在容器中执行命令 - docker exec

**命令格式**：

```bash
docker exec [选项] <容器ID或容器名> <命令> [参数...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-d` | 后台执行 |
| `-i` | 保持标准输入打开 |
| `-t` | 分配伪终端 |
| `-u` | 指定用户 |
| `-w` | 设置工作目录 |
| `-e` | 设置环境变量 |

**实战示例**：

```bash
# 进入容器的交互式 shell
docker exec -it my-nginx /bin/bash

# 在容器中执行单个命令
docker exec my-nginx ls /usr/share/nginx/html

# 查看容器中的进程
docker exec my-nginx ps aux

# 查看容器中的环境变量
docker exec my-nginx env

# 以指定用户执行
docker exec -u root my-nginx whoami

# 后台执行
docker exec -d my-nginx touch /tmp/test.txt

# 设置工作目录
docker exec -w /tmp my-nginx pwd
```

---

## 4 容器生命周期管理

### 4.1 暂停和恢复容器

**暂停容器**：

```bash
# 暂停容器（冻结容器内所有进程）
docker pause my-nginx
```

**恢复容器**：

```bash
# 恢复暂停的容器
docker unpause my-nginx
```

**说明**：暂停使用 cgroups 的 freezer 功能，不会释放容器资源。

### 4.2 等待容器停止 - docker wait

```bash
# 等待容器停止，返回退出码
docker wait my-nginx
```

### 4.3 查看容器详细信息 - docker inspect

```bash
# 查看容器详细信息（JSON 格式）
docker inspect my-nginx

# 查看特定字段
docker inspect -f '{{.State.Status}}' my-nginx
docker inspect -f '{{.NetworkSettings.IPAddress}}' my-nginx

# 查看容器 IP 地址
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-nginx
```

### 4.4 查看容器资源占用 - docker stats

```bash
# 实时查看容器资源占用
docker stats

# 查看指定容器
docker stats my-nginx

# 不持续刷新，只显示一次
docker stats --no-stream
```

**输出示例**：

```
CONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O
a1b2c3d4e5f6   my-nginx    0.05%     15.2MiB / 7.7GiB      0.20%     1.2kB / 650B      0B / 0B
```

### 4.5 查看容器进程 - docker top

```bash
# 查看容器内运行的进程
docker top my-nginx
```

### 4.6 容器导出和导入

**导出容器**：

```bash
# 导出容器文件系统到 tar 文件
docker export my-nginx > nginx-container.tar
```

**导入容器**：

```bash
# 从 tar 文件导入为镜像
docker import nginx-container.tar my-nginx:latest
```

**区别**：

- `docker save/load`：保存镜像，包含所有层和历史
- `docker export/import`：导出容器，只保存当前状态，不包含历史

---

## 5 常用命令组合

### 5.1 清理无用资源

```bash
# 删除所有已停止的容器
docker rm $(docker ps -a -q -f status=exited)

# 删除所有 dangling 镜像
docker rmi $(docker images -f dangling=true -q)

# 一键清理（容器 + 镜像 + 网络 + 卷）
docker system prune -a --volumes
```

### 5.2 批量操作

```bash
# 批量停止所有容器
docker stop $(docker ps -q)

# 批量删除所有容器
docker rm -f $(docker ps -a -q)

# 批量删除所有镜像
docker rmi $(docker images -q)
```

### 5.3 查看容器端口映射

```bash
# 查看容器的端口映射
docker port my-nginx
```

---

## 6 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `docker pull` | 拉取镜像 | `docker pull nginx:latest` |
| `docker images` | 查看镜像 | `docker images -a` |
| `docker rmi` | 删除镜像 | `docker rmi nginx:latest` |
| `docker run` | 创建并启动容器 | `docker run -d -p 80:80 nginx` |
| `docker ps` | 查看容器 | `docker ps -a` |
| `docker stop` | 停止容器 | `docker stop my-nginx` |
| `docker start` | 启动容器 | `docker start my-nginx` |
| `docker restart` | 重启容器 | `docker restart my-nginx` |
| `docker rm` | 删除容器 | `docker rm my-nginx` |
| `docker logs` | 查看日志 | `docker logs -f my-nginx` |
| `docker exec` | 执行命令 | `docker exec -it my-nginx bash` |
| `docker inspect` | 查看详情 | `docker inspect my-nginx` |

---

## 7 本章小结

本章系统讲解了 Docker 最基础的命令，包括：

**镜像管理**：

- 搜索、拉取、查看、删除镜像
- 给镜像打标签
- 保存和加载镜像

**容器管理**：

- 创建、启动、停止、重启、删除容器
- 查看容器状态和日志
- 进入容器执行命令
- 查看容器资源占用

**生命周期管理**：

- 暂停和恢复容器
- 容器导出和导入
- 批量操作技巧

掌握这些命令，你就能够独立完成 Docker 的日常操作。下一章会讲解 Docker 高级命令，包括构建、存储和网络相关内容。

---

## 8 练习题

1. 搜索并拉取 `nginx:alpine` 镜像
2. 后台运行一个 nginx 容器，映射端口 8080:80
3. 查看容器日志，实时跟踪输出
4. 进入容器，修改默认首页内容
5. 停止并删除容器，清理所有无用镜像
