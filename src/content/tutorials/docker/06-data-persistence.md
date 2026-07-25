---
title: "第6章：数据持久化"
description: "数据卷、挂载目录、容器数据管理"
---

# 第6章：数据持久化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 容器删除后，数据会丢失吗？
- 如何让多个容器共享同一份数据？
- 数据卷和挂载目录有什么区别？
- 如何备份和恢复容器数据？

这一章会教你如何让容器的数据持久化存储。学会这些，你的数据就不会因为容器删除而丢失了。

---

## 6.1 为什么需要数据持久化？

### 痛点分析

容器的设计哲学是"短暂"的，容器的可写层是临时的：

- 容器删除后，可写层的数据会丢失
- 容器重启后，某些临时数据可能丢失
- 多个容器之间无法共享数据

### 解决方案

Docker 提供了两种数据持久化方式：

1. **数据卷（Volumes）**：由 Docker 管理，存储在 Docker 专用目录
2. **绑定挂载（Bind Mounts）**：直接映射宿主机的目录或文件

打个比方：

> 容器就像酒店房间，客人（进程）退房后，房间会被清空。
>
> 数据卷就像酒店的保险箱，客人退房后，贵重物品还在保险箱里。
>
> 绑定挂载就像你把家里的东西带到酒店，用完后带回家。

---

## 6.2 数据卷（Volumes）

### 创建数据卷

```bash
# ❶ 创建数据卷
docker volume create my-data

# ❷ 查看所有数据卷
docker volume ls

# ❸ 查看数据卷详情
docker volume inspect my-data
```

### 使用数据卷

```bash
# ❶ 运行容器并挂载数据卷
docker run -d -v my-data:/app/data nginx

# ❷ 挂载多个数据卷
docker run -d \
  -v my-data:/app/data \
  -v logs:/app/logs \
  nginx

# ❸ 指定只读模式
docker run -d -v my-data:/app/data:ro nginx
```

### 数据卷的特点

| 特性 | 说明 |
| --- | --- |
| 生命周期 | 独立于容器，容器删除后数据卷还在 |
| 共享性 | 可以被多个容器同时挂载 |
| 性能 | 比绑定挂载更好（特别是在 Mac/Windows 上） |
| 管理 | 由 Docker 管理，更安全可靠 |
| 位置 | 存储在 `/var/lib/docker/volumes/`（Linux） |

### 数据卷操作

```bash
# ❶ 查看数据卷占用空间
docker system df -v

# ❷ 删除未使用的数据卷
docker volume prune

# ❸ 删除指定数据卷
docker volume rm my-data

# ❹ 强制删除（即使有容器在使用）
docker volume rm -f my-data
```

---

## 6.3 绑定挂载（Bind Mounts）

### 基础使用

```bash
# ❶ 挂载目录
docker run -d -v /host/path:/container/path nginx

# ❷ 挂载单个文件
docker run -d -v /host/nginx.conf:/etc/nginx/nginx.conf nginx

# ❸ 使用绝对路径（推荐）
docker run -d -v $(pwd)/data:/app/data nginx

# ❹ 使用相对路径（不推荐）
docker run -d -v ./data:/app/data nginx
```

### 绑定挂载 vs 数据卷

| 特性 | 数据卷 | 绑定挂载 |
| --- | --- | --- |
| 管理方式 | Docker 管理 | 用户管理 |
| 位置 | Docker 专用目录 | 任意宿主机路径 |
| 性能 | 更好 | 稍差（跨平台时） |
| 可移植性 | 好 | 差（依赖宿主机路径） |
| 适用场景 | 数据库、缓存等 | 开发环境、配置文件 |

### 使用场景

```bash
# ❶ 开发环境（代码热更新）
docker run -d -v $(pwd):/app -p 3000:3000 node:18

# ❷ 共享配置文件
docker run -d -v /host/config/app.conf:/app/config.conf myapp

# ❸ 日志收集
docker run -d -v /var/log/myapp:/app/logs myapp
```

---

## 6.4 在 Dockerfile 中使用 VOLUME

```dockerfile
# 声明匿名卷
VOLUME ["/data", "/logs"]

# 容器运行时，Docker 会自动创建匿名卷
```

### 匿名卷 vs 命名卷

```bash
# ❶ 匿名卷（不推荐，难以管理）
docker run -d -v /data nginx

# ❷ 命名卷（推荐）
docker run -d -v my-data:/data nginx
```

---

## 6.5 数据备份与恢复

### 备份数据卷

```bash
# ❶ 运行临时容器，挂载数据卷和当前目录
docker run --rm \
  -v my-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/backup.tar.gz -C /data .

# ❷ 查看备份文件
ls -lh backup.tar.gz
```

### 恢复数据卷

```bash
# ❶ 运行临时容器，挂载数据卷和备份文件
docker run --rm \
  -v my-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/backup.tar.gz -C /data

# ❷ 验证恢复
docker run --rm -v my-data:/data alpine ls -la /data
```

### 备份绑定挂载

```bash
# 绑定挂载直接备份宿主机目录即可
tar czf backup.tar.gz /host/path
```

---

## 6.6 数据共享

### 多个容器共享数据卷

```bash
# ❶ 创建数据卷
docker volume create shared-data

# ❷ 容器 A 写入数据
docker run -d --name container-a -v shared-data:/data alpine sleep 3600
docker exec container-a sh -c "echo 'Hello from A' > /data/message.txt"

# ❸ 容器 B 读取数据
docker run -d --name container-b -v shared-data:/data alpine sleep 3600
docker exec container-b cat /data/message.txt
# 输出：Hello from A
```

### 读写模式

```bash
# ❶ 读写模式（默认）
docker run -d -v my-data:/data:rw nginx

# ❷ 只读模式
docker run -d -v my-data:/data:ro nginx
```

---

## 6.7 数据管理最佳实践

### 1. 优先使用数据卷

```bash
# 推荐
docker run -d -v my-data:/data nginx

# 不推荐（除非开发环境）
docker run -d -v /host/path:/data nginx
```

### 2. 使用命名卷

```bash
# 推荐：命名卷
docker run -d -v my-data:/data nginx

# 不推荐：匿名卷
docker run -d -v /data nginx
```

### 3. 定期清理

```bash
# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源（包括数据卷）
docker system prune --volumes
```

### 4. 备份重要数据

```bash
# 定期备份数据库等关键数据
docker run --rm \
  -v db-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/db-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 6.8 核心知识点总结

| 概念 | 说明 |
| --- | --- |
| 数据卷 | Docker 管理的持久化存储 |
| 绑定挂载 | 映射宿主机目录到容器 |
| 匿名卷 | 未命名的数据卷，难以管理 |
| 命名卷 | 有名字的数据卷，推荐使用 |
| 读写模式 | `:rw`（默认）或 `:ro`（只读） |
| 备份 | 用临时容器打包数据卷 |
| 恢复 | 用临时容器解压备份到数据卷 |

---

## 6.9 新手常见误区

### 误区 1："容器删除后数据就没了"

**错！** 如果使用了数据卷，数据会保留。只有删除数据卷，数据才会丢失。

### 误区 2："绑定挂载和数据卷是一样的"

不是的。数据卷由 Docker 管理，更安全可靠；绑定挂载直接映射宿主机路径，可移植性差。

### 误区 3："数据卷会自动备份"

不是的。数据卷不会自动备份，需要手动或使用脚本定期备份。

### 误区 4："匿名卷和命名卷没区别"

不是的。匿名卷难以管理，删除容器后很难找到对应的数据卷；命名卷有明确的名字，易于管理和备份。

---

## 6.10 动手练习

### 练习 1：使用数据卷

创建一个数据卷，运行 MySQL 容器并挂载数据卷，验证数据持久化。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建数据卷
docker volume create mysql-data

# ❷ 运行 MySQL 容器
docker run -d \
  --name my-mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# ❸ 等待 MySQL 启动（约 10-30 秒）
docker logs -f my-mysql
# 看到 "ready for connections" 后按 Ctrl+C

# ❹ 创建测试数据
docker exec -it my-mysql mysql -uroot -p123456 -e "CREATE DATABASE test; USE test; CREATE TABLE users (id INT, name VARCHAR(50)); INSERT INTO users VALUES (1, 'Alice');"

# ❺ 删除容器
docker stop my-mysql
docker rm my-mysql

# ❻ 重新运行容器，使用相同的数据卷
docker run -d \
  --name my-mysql-new \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# ❼ 验证数据还在
docker exec -it my-mysql-new mysql -uroot -p123456 -e "USE test; SELECT * FROM users;"
# 输出：1 | Alice

# ❽ 清理
docker stop my-mysql-new
docker rm my-mysql-new
```

</details>

### 练习 2：绑定挂载开发环境

创建一个 Node.js 开发环境，代码挂载到容器内，修改代码后自动生效。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建项目目录
mkdir my-node-app && cd my-node-app

# ❷ 创建简单的 app.js
cat > app.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello Docker!');
});
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
EOF

# ❸ 运行容器，挂载当前目录
docker run -d \
  --name node-dev \
  -v $(pwd):/app \
  -w /app \
  -p 3000:3000 \
  node:18 \
  node app.js

# ❹ 访问 http://localhost:3000
# 输出：Hello Docker!

# ❺ 修改 app.js
sed -i 's/Hello Docker!/Hello World!/' app.js

# ❻ 重启容器
docker restart node-dev

# ❼ 再次访问 http://localhost:3000
# 输出：Hello World!

# ❽ 清理
docker stop node-dev
docker rm node-dev
```

</details>

### 练习 3（挑战）：数据备份与恢复

备份 MySQL 数据卷，删除容器和数据卷，然后恢复数据。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建数据卷并运行 MySQL
docker volume create mysql-backup-test
docker run -d \
  --name mysql-backup \
  -v mysql-backup-test:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# ❷ 等待启动并创建测试数据
docker exec -it mysql-backup mysql -uroot -p123456 -e "CREATE DATABASE backup_test; USE backup_test; CREATE TABLE test (id INT); INSERT INTO test VALUES (1), (2), (3);"

# ❸ 备份数据卷
docker run --rm \
  -v mysql-backup-test:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/mysql-backup.tar.gz -C /data .

# ❹ 删除容器和数据卷
docker stop mysql-backup
docker rm mysql-backup
docker volume rm mysql-backup-test

# ❺ 验证数据卷已删除
docker volume ls | grep mysql-backup-test
# 应该没有输出

# ❻ 重新创建数据卷
docker volume create mysql-backup-test

# ❼ 恢复数据
docker run --rm \
  -v mysql-backup-test:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/mysql-backup.tar.gz -C /data

# ❽ 运行 MySQL 验证数据
docker run -d \
  --name mysql-restored \
  -v mysql-backup-test:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# ❾ 验证数据恢复成功
docker exec -it mysql-restored mysql -uroot -p123456 -e "USE backup_test; SELECT * FROM test;"
# 输出：1, 2, 3

# ❿ 清理
docker stop mysql-restored
docker rm mysql-restored
docker volume rm mysql-backup-test
rm mysql-backup.tar.gz
```

</details>

---

## 下一章预告

下一章我们会学习 **Docker 网络**——容器之间如何通信，如何访问外部网络。你会学到不同的网络模式，以及如何创建自定义网络。
