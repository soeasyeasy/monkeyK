---
title: '第3章：Docker 网络与调试命令'
description: '掌握 Docker 网络管理、端口映射、容器调试的核心命令'
---

# 第3章：Docker 网络与调试命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Docker 网络有哪些模式？
- 如何创建自定义网络？
- 容器之间如何通信？
- 如何调试容器问题？

这一章会系统讲解 Docker 网络管理和调试相关的所有命令，让你能够灵活配置容器网络并快速定位问题。

---

## 1 Docker 网络模式

### 1.1 四种网络模式

Docker 支持四种网络模式：

| 模式 | 说明 | 使用场景 |
| --- | --- | --- |
| `bridge` | 默认模式，容器拥有独立网络命名空间，通过 docker0 网桥通信 | 单主机容器间通信 |
| `host` | 容器直接使用宿主机网络栈，不分配独立 IP | 需要高性能网络 |
| `none` | 容器没有网络接口（只有 loopback） | 完全隔离网络 |
| `container` | 与指定容器共享网络命名空间 | 特殊场景，如 sidecar |

### 1.2 查看网络 - docker network ls

```bash
# 查看所有网络
docker network ls

# 只显示网络 ID
docker network ls -q

# 过滤：只显示 bridge 网络
docker network ls -f driver=bridge

# 过滤：只显示自定义网络
docker network ls --filter type=custom
```

**输出示例**：

```
NETWORK ID     NAME      DRIVER    SCOPE
a1b2c3d4e5f6   bridge    bridge    local
b2c3d4e5f6a7   host      host      local
c3d4e5f6a7b8   none      null      local
d4e5f6a7b8c9   my-net    bridge    local
```

### 1.3 查看网络详情 - docker network inspect

```bash
# 查看网络详情
docker network inspect bridge

# 查看多个网络
docker network inspect bridge host

# 使用格式化输出
docker network inspect -f '{{range .Containers}}{{.Name}} {{end}}' bridge
```

---

## 2 网络管理命令

### 2.1 docker network create - 创建网络

**命令格式**：

```bash
docker network create [选项] <网络名>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-d` | 指定网络驱动（bridge/overlay/macvlan 等） |
| `--subnet` | 指定子网 CIDR |
| `--gateway` | 指定网关 |
| `--ip-range` | 指定 IP 分配范围 |
| `--aux-address` | 排除特定 IP |
| `-o` | 指定驱动选项 |
| `--attachable` | 允许手动附加容器（用于 swarm） |
| `--internal` | 创建内部网络（无外部访问） |
| `--ipv6` | 启用 IPv6 |
| `--label` | 添加标签 |

**实战示例**：

```bash
# 创建最简单的 bridge 网络
docker network create my-network

# 创建指定子网的网络
docker network create --subnet 192.168.1.0/24 my-network

# 创建指定子网和网关
docker network create \
  --subnet 192.168.1.0/24 \
  --gateway 192.168.1.1 \
  my-network

# 创建指定 IP 范围
docker network create \
  --subnet 192.168.1.0/24 \
  --ip-range 192.168.1.128/25 \
  my-network

# 创建内部网络（不能访问外网）
docker network create --internal my-internal-net

# 创建 overlay 网络（用于 swarm）
docker network create -d overlay my-overlay-net

# 创建带标签的网络
docker network create --label env=production my-network
```

### 2.2 docker network connect - 连接容器到网络

**命令格式**：

```bash
docker network connect [选项] <网络名> <容器名或ID>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `--ip` | 指定容器 IP |
| `--ip6` | 指定容器 IPv6 |
| `--alias` | 添加网络别名 |

**实战示例**：

```bash
# 连接容器到网络
docker network connect my-network my-container

# 连接并指定 IP
docker network connect --ip 192.168.1.100 my-network my-container

# 连接并添加别名
docker network connect --alias my-app my-network my-container

# 连接多个网络
docker network connect my-network-1 my-container
docker network connect my-network-2 my-container
```

### 2.3 docker network disconnect - 断开容器网络

```bash
# 断开容器与网络的连接
docker network disconnect my-network my-container

# 强制断开
docker network disconnect -f my-network my-container
```

### 2.4 docker network rm - 删除网络

```bash
# 删除网络
docker network rm my-network

# 删除多个网络
docker network rm my-network-1 my-network-2

# 删除所有未使用的网络
docker network prune

# 强制删除
docker network rm -f my-network
```

### 2.5 docker network prune - 清理未使用网络

```bash
# 删除所有未使用的网络
docker network prune

# 不提示确认
docker network prune -f
```

---

## 3 端口映射

### 3.1 使用 -p 参数映射端口

**命令格式**：

```bash
docker run -p <宿主机端口>:<容器端口> <镜像>
```

**实战示例**：

```bash
# 映射单个端口
docker run -p 8080:80 nginx

# 映射多个端口
docker run -p 8080:80 -p 8443:443 nginx

# 映射端口范围
docker run -p 8000-8010:8000-8010 my-app

# 指定绑定 IP（只允许特定网卡访问）
docker run -p 127.0.0.1:8080:80 nginx

# 指定协议
docker run -p 8080:80/tcp -p 8080:80/udp nginx

# 随机映射宿主机端口
docker run -P nginx
```

### 3.2 查看端口映射 - docker port

```bash
# 查看容器的端口映射
docker port my-nginx

# 输出示例：
# 80/tcp -> 0.0.0.0:8080
```

### 3.3 使用 --publish-all 随机映射

```bash
# 随机映射所有 EXPOSE 的端口
docker run -P nginx

# 查看映射结果
docker port <容器名>
```

---

## 4 容器间通信

### 4.1 使用自定义网络通信

**创建网络并运行容器**：

```bash
# 1. 创建自定义网络
docker network create my-network

# 2. 运行 MySQL 容器
docker run -d \
  --name mysql \
  --network my-network \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# 3. 运行应用容器，连接到同一网络
docker run -d \
  --name my-app \
  --network my-network \
  -e DB_HOST=mysql \
  my-app
```

**说明**：在同一自定义网络中的容器，可以通过容器名直接通信（DNS 解析）。

### 4.2 使用 --link（已废弃，不推荐）

```bash
# 旧方式（不推荐）
docker run -d --name mysql mysql:8.0
docker run -d --name my-app --link mysql:mysql my-app
```

**说明**：`--link` 是旧版方式，已被自定义网络取代。

### 4.3 使用 host 网络模式

```bash
# 使用宿主机网络（容器直接使用宿主机 IP 和端口）
docker run -d --network host nginx
```

**说明**：

- 容器不会获得独立 IP，直接使用宿主机 IP
- 不需要端口映射，容器端口直接暴露
- 性能更好，但隔离性差
- 仅支持 Linux，Windows/macOS 的 Docker Desktop 不支持

### 4.4 使用 container 网络模式

```bash
# 容器 1
docker run -d --name container1 -p 8080:80 nginx

# 容器 2 与容器 1 共享网络
docker run -d --name container2 --network container:container1 busybox sleep 3600
```

**说明**：容器 2 和容器 1 共享网络命名空间，localhost 互通。

---

## 5 容器调试命令

### 5.1 docker logs - 查看日志

**命令格式**：

```bash
docker logs [选项] <容器ID或容器名>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f` | 实时跟踪日志 |
| `--tail N` | 显示最后 N 行 |
| `-t` | 显示时间戳 |
| `--since` | 显示某个时间点之后的日志 |
| `--until` | 显示某个时间点之前的日志 |

**实战示例**：

```bash
# 查看所有日志
docker logs my-app

# 实时跟踪
docker logs -f my-app

# 查看最后 50 行
docker logs --tail 50 my-app

# 显示时间戳
docker logs -t my-app

# 查看最近 1 小时
docker logs --since 1h my-app

# 组合使用
docker logs -f --tail 100 -t my-app
```

### 5.2 docker exec - 进入容器

**命令格式**：

```bash
docker exec [选项] <容器ID或容器名> <命令>
```

**实战示例**：

```bash
# 进入交互式 shell
docker exec -it my-app /bin/bash

# 执行单个命令
docker exec my-app ls /app

# 查看进程
docker exec my-app ps aux

# 查看环境变量
docker exec my-app env

# 查看网络配置
docker exec my-app ip addr

# 测试网络连通性
docker exec my-app ping -c 3 google.com

# 查看磁盘使用
docker exec my-app df -h
```

### 5.3 docker inspect - 查看详细信息

**命令格式**：

```bash
docker inspect [选项] <容器ID或容器名>
```

**实战示例**：

```bash
# 查看所有信息（JSON 格式）
docker inspect my-app

# 查看容器状态
docker inspect -f '{{.State.Status}}' my-app

# 查看 IP 地址
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-app

# 查看端口映射
docker inspect -f '{{json .NetworkSettings.Ports}}' my-app

# 查看挂载信息
docker inspect -f '{{json .Mounts}}' my-app

# 查看环境变量
docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' my-app

# 查看重启策略
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' my-app
```

### 5.4 docker top - 查看容器进程

```bash
# 查看容器内运行的进程
docker top my-app

# 输出示例：
# UID     PID     PPID    C   STIME   TTY   TIME      CMD
# root    12345   12300   0   10:00   ?     00:00:00  nginx: master process
```

### 5.5 docker stats - 查看资源占用

```bash
# 实时查看所有容器资源占用
docker stats

# 查看指定容器
docker stats my-app

# 只显示一次（不持续刷新）
docker stats --no-stream

# 格式化输出
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**输出示例**：

```
CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O
a1b2c3d4e5f6   my-app    0.05%     15.2MiB / 7.7GiB      0.20%     1.2kB / 650B      0B / 0B
```

### 5.6 docker events - 查看系统事件

```bash
# 实时查看 Docker 系统事件
docker events

# 过滤：只显示容器事件
docker events --filter type=container

# 过滤：只显示某个容器的事件
docker events --filter container=my-app

# 过滤：只显示最近 1 小时
docker events --since 1h

# 输出示例：
# 2024-01-01T10:00:00.000000000+08:00 container start a1b2c3d4e5f6 (image=nginx, name=my-app)
```

### 5.7 docker wait - 等待容器停止

```bash
# 等待容器停止，返回退出码
docker wait my-app
```

---

## 6 网络调试实战

### 6.1 测试容器间连通性

```bash
# 1. 创建网络
docker network create test-net

# 2. 运行两个容器
docker run -d --name container1 --network test-net busybox sleep 3600
docker run -d --name container2 --network test-net busybox sleep 3600

# 3. 从 container1 ping container2
docker exec container1 ping -c 3 container2

# 4. 查看 DNS 解析
docker exec container1 nslookup container2
```

### 6.2 排查网络问题

```bash
# 1. 检查容器是否运行
docker ps | grep my-app

# 2. 查看容器网络配置
docker inspect my-app | grep -A 20 "NetworkSettings"

# 3. 查看容器日志
docker logs my-app

# 4. 进入容器测试网络
docker exec -it my-app /bin/bash
# 在容器内执行：
ip addr
ip route
cat /etc/resolv.conf
ping -c 3 8.8.8.8
nslookup google.com
curl -v http://example.com
```

### 6.3 使用 nsenter 进入容器网络命名空间

```bash
# 获取容器 PID
PID=$(docker inspect -f '{{.State.Pid}}' my-app)

# 进入容器网络命名空间
nsenter -n -t $PID

# 现在可以执行网络命令
ip addr
ping 8.8.8.8
```

### 6.4 使用 netshoot 调试网络

```bash
# 运行 netshoot 容器（包含各种网络工具）
docker run -it --network container:my-app nicolaka/netshoot

# 在 netshoot 容器中执行：
ip addr
netstat -tuln
tcpdump -i eth0
curl http://localhost:80
```

---

## 7 常用命令组合

### 7.1 完整网络配置流程

```bash
# 1. 创建网络
docker network create --subnet 192.168.1.0/24 my-network

# 2. 运行数据库容器
docker run -d \
  --name mysql \
  --network my-network \
  --ip 192.168.1.10 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# 3. 运行应用容器
docker run -d \
  --name my-app \
  --network my-network \
  --ip 192.168.1.20 \
  -e DB_HOST=mysql \
  -p 8080:80 \
  my-app

# 4. 验证连通性
docker exec my-app ping -c 3 mysql

# 5. 查看网络详情
docker network inspect my-network
```

### 7.2 排查容器无法启动

```bash
# 1. 查看容器状态
docker ps -a | grep my-app

# 2. 查看日志
docker logs my-app

# 3. 查看详细错误
docker inspect -f '{{.State.Error}}' my-app

# 4. 查看退出码
docker inspect -f '{{.State.ExitCode}}' my-app

# 5. 以交互模式运行调试
docker run -it my-app /bin/bash
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `docker network ls` | 列出网络 | `docker network ls` |
| `docker network create` | 创建网络 | `docker network create my-net` |
| `docker network connect` | 连接容器 | `docker network connect my-net my-app` |
| `docker network disconnect` | 断开连接 | `docker network disconnect my-net my-app` |
| `docker network rm` | 删除网络 | `docker network rm my-net` |
| `docker network prune` | 清理网络 | `docker network prune` |
| `docker network inspect` | 查看网络详情 | `docker network inspect my-net` |
| `docker logs` | 查看日志 | `docker logs -f my-app` |
| `docker exec` | 执行命令 | `docker exec -it my-app bash` |
| `docker inspect` | 查看详情 | `docker inspect my-app` |
| `docker stats` | 资源占用 | `docker stats --no-stream` |
| `docker events` | 系统事件 | `docker events --filter type=container` |

---

## 9 本章小结

本章系统讲解了 Docker 网络和调试相关的命令，包括：

**网络管理**：

- 四种网络模式（bridge/host/none/container）
- `docker network` 命令管理网络
- 端口映射（`-p` / `-P`）
- 容器间通信

**调试命令**：

- `docker logs` 查看日志
- `docker exec` 进入容器
- `docker inspect` 查看详情
- `docker stats` 查看资源占用
- `docker events` 查看系统事件

**网络调试**：

- 测试容器间连通性
- 排查网络问题
- 使用 netshoot 调试工具

掌握这些命令，你就能够灵活配置容器网络，并快速定位和解决容器问题。下一章会讲解 Docker Compose 相关命令。

---

## 10 练习题

1. 创建一个自定义 bridge 网络，指定子网和网关
2. 运行两个容器连接到同一网络，验证容器间通信
3. 映射容器端口到宿主机，测试外部访问
4. 查看容器日志，实时跟踪输出
5. 进入容器，测试网络连通性和 DNS 解析
6. 使用 `docker inspect` 查看容器 IP 和端口映射
7. 使用 netshoot 容器