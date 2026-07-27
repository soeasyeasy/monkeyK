---
title: "第8章：Redis 哨兵模式"
description: "Sentinel 原理、自动故障转移、监控配置、生产部署"
---

# 第8章：Redis 哨兵模式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 主节点挂了，从节点能自动接管吗？
- 什么是哨兵模式？
- 哨兵是怎么判断主节点下线的？
- 如何配置哨兵实现自动故障转移？
- 生产环境怎么部署哨兵？

这一章会详细讲解 Redis 哨兵（Sentinel）的原理和配置，帮你掌握如何实现高可用的 Redis 架构。

---

## 1 为什么需要哨兵模式？

### 痛点分析

主从复制解决了读写分离和数据备份的问题，但有一个致命缺陷：**主节点挂了，需要人工干预才能切换**。

想象一下这个场景：凌晨 3 点，主节点突然宕机，所有写操作失败，运维人员被电话叫醒，手动将从节点提升为主节点。

### 解决方案

哨兵模式（Sentinel）可以自动监控主从节点，当主节点不可用时，自动将从节点提升为主节点，实现**自动故障转移**。

打个比方：

> 哨兵就像公司的保安团队：24 小时监控办公室（Redis 节点），如果发现经理（主节点）不在，立刻从副经理（从节点）中选一个顶上，同时通知所有员工（客户端）新经理的地址。

---

## 2 哨兵原理

### 核心功能

| 功能 | 说明 |
| --- | --- |
| **监控** | 持续检查主从节点是否正常工作 |
| **通知** | 节点出问题时通知管理员或应用程序 |
| **自动故障转移** | 主节点不可用时，自动提升从节点 |
| **配置中心** | 客户端通过哨兵获取主节点地址 |

### 故障判断机制

```
1. 主观下线（SDOWN）
   - 单个哨兵认为节点不可达
   - 超过 down-after-milliseconds 时间未响应

2. 客观下线（ODOWN）
   - 多个哨兵（quorum 个）都认为主节点不可达
   - 通过哨兵间通信达成共识

3. 故障转移
   - 选举一个领头哨兵
   - 选择最优从节点提升为主节点
   - 通知其他从节点跟随新主节点
```

### 从节点选择策略

```
优先级规则：
1. 排除断线的从节点
2. 优先级最高的（replica-priority）
3. 复制偏移量最大的（数据最新）
4. runid 最小的
```

---

## 3 配置哨兵

### 哨兵配置文件

```conf
# sentinel.conf

# 哨兵端口
port 26379

# 监控主节点，quorum 为 2
# 格式：sentinel monitor <主节点名> <IP> <端口> <quorum>
sentinel monitor mymaster 192.168.1.100 6379 2

# 主节点密码
sentinel auth-pass mymaster yourpassword

# 主观下线时间（毫秒）
sentinel down-after-milliseconds mymaster 5000

# 故障转移超时时间
sentinel failover-timeout mymaster 60000

# 同步的从节点数量
sentinel parallel-syncs mymaster 1

# 哨兵间通信端口
sentinel announce-ip <当前哨兵IP>
sentinel announce-port 26379
```

### 启动哨兵

```bash
# 启动哨兵
redis-sentinel /etc/redis/sentinel.conf

# 或者
redis-server /etc/redis/sentinel.conf --sentinel
```

### 查看哨兵状态

```bash
# 连接哨兵
redis-cli -p 26379

# 查看主节点信息
> SENTINEL master mymaster
 1) "name"
 2) "mymaster"
 3) "ip"
 4) "192.168.1.100"
 5) "port"
 6) "6379"
 7) "flags"
 8) "master"
 9) "num-slaves"
10) "2"
11) "num-other-sentinels"
12) "2"

# 查看从节点
> SENTINEL slaves mymaster

# 查看其他哨兵
> SENTINEL sentinels mymaster

# 获取当前主节点地址
> SENTINEL get-master-addr-by-name mymaster
1) "192.168.1.100"
2) "6379"
```

---

## 4 故障转移流程

```
1. 哨兵检测到主节点不可达
2. 等待 down-after-milliseconds 时间
3. 标记为主观下线（SDOWN）
4. 询问其他哨兵，达到 quorum 个同意
5. 标记为客观下线（ODOWN）
6. 哨兵间选举领头哨兵
7. 领头哨兵选择最优从节点
8. 发送 SLAVEOF NO ONE 提升从节点
9. 通知其他从节点跟随新主节点
10. 更新配置，通知客户端
```

### 验证故障转移

```bash
# 1. 查看当前主节点
> SENTINEL get-master-addr-by-name mymaster
1) "192.168.1.100"
2) "6379"

# 2. 停止主节点
$ redis-cli -p 6379 shutdown

# 3. 等待几秒后查看新主节点
> SENTINEL get-master-addr-by-name mymaster
1) "192.168.1.101"  # 从节点被提升为主节点
2) "6380"
```

---

## 5 客户端连接哨兵

### Java 客户端示例

```java
// 使用 Lettuce 连接哨兵
Set<String> sentinels = new HashSet<>();
sentinels.add("192.168.1.100:26379");
sentinels.add("192.168.1.101:26379");
sentinels.add("192.168.1.102:26379");

RedisClient client = RedisClient.create(
    RedisURI.builder()
        .withSentinel("192.168.1.100", 26379, "mymaster")
        .withSentinel("192.168.1.101", 26379, "mymaster")
        .withSentinel("192.168.1.102", 26379, "mymaster")
        .withPassword("yourpassword")
        .build()
);

// 自动获取主节点地址，故障转移后自动切换
RedisCommands<String, String> commands = client.connect().sync();
commands.set("key", "value");
```

### Spring Boot 配置

```yaml
spring:
  redis:
    sentinel:
      master: mymaster
      nodes: 192.168.1.100:26379,192.168.1.101:26379,192.168.1.102:26379
    password: yourpassword
    timeout: 5000ms
```

---

## 6 生产环境部署

### 推荐架构

```
3 个哨兵 + 1 主 2 从

哨兵部署在不同机器上：
- 哨兵1: 192.168.1.100:26379
- 哨兵2: 192.168.1.101:26379
- 哨兵3: 192.168.1.102:26379

Redis 节点：
- 主节点: 192.168.1.100:6379
- 从节点1: 192.168.1.101:6380
- 从节点2: 192.168.1.102:6380
```

### 部署建议

| 建议 | 说明 |
| --- | --- |
| **哨兵数量** | 至少 3 个，奇数个 |
| **quorum** | 哨兵数量 / 2 + 1 |
| **分布部署** | 哨兵分布在不同机器 |
| **网络隔离** | 哨兵和 Redis 在同一网络 |
| **监控告警** | 配置哨兵通知脚本 |

### 通知脚本

```conf
# sentinel.conf

# 故障转移时执行脚本
sentinel notification-script mymaster /etc/redis/notify.sh
sentinel client-reconfig-script mymaster /etc/redis/reconfig.sh
```

```bash
#!/bin/bash
# /etc/redis/notify.sh
# 发送告警通知
echo "Redis 故障转移事件: $@" | mail -s "Redis Alert" admin@example.com
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **哨兵功能** | 监控、通知、自动故障转移、配置中心 |
| **故障判断** | 主观下线（SDOWN）+ 客观下线（ODOWN） |
| **quorum** | 判定客观下线所需的最小哨兵数 |
| **部署建议** | 3 个哨兵，奇数个，分布在不同机器 |
| **客户端连接** | 通过哨兵获取主节点地址，自动故障转移 |

---

## 8 新手常见误区

### 误区 1："1 个哨兵就够了"

**错！** 哨兵需要多个实例才能做出客观判断。1 个哨兵无法区分是主节点真的挂了还是哨兵自己网络出了问题。推荐至少 3 个哨兵。

### 误区 2："哨兵数量越多越好"

**不对！** 哨兵太多会增加通信开销。一般 3-5 个就够了，奇数个可以避免脑裂问题。

### 误区 3："哨兵可以存储数据"

**不是的！** 哨兵只是一个监控和故障转移系统，不存储任何业务数据。它通过特殊的 Redis 实例运行，只处理哨兵相关命令。

### 误区 4："故障转移后，旧主节点恢复会自动接管"

**不会！** 旧主节点恢复后会变成从节点，跟随新主节点。如果需要它重新成为主节点，需要手动操作。

---

## 9 动手练习

### 练习 1：搭建哨兵环境

搭建 1 主 2 从 + 3 哨兵的完整环境：
1. 启动 3 个 Redis 实例（主从复制）
2. 启动 3 个哨兵实例
3. 验证故障转移

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启动 Redis 实例
redis-server --port 6379 --daemonize yes
redis-server --port 6380 --daemonize yes --replicaof 127.0.0.1 6379
redis-server --port 6381 --daemonize yes --replicaof 127.0.0.1 6379

# 2. 配置哨兵文件（3个文件，端口分别为 26379、26380、26381）
cat > sentinel1.conf << 'EOF'
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
EOF

cp sentinel1.conf sentinel2.conf
cp sentinel1.conf sentinel3.conf
sed -i 's/26379/26380/' sentinel2.conf
sed -i 's/26379/26381/' sentinel3.conf

# 3. 启动哨兵
redis-sentinel sentinel1.conf --daemonize yes
redis-sentinel sentinel2.conf --daemonize yes
redis-sentinel sentinel3.conf --daemonize yes

# 4. 验证
redis-cli -p 26379
> SENTINEL master mymaster

# 5. 模拟故障转移
redis-cli -p 6379 shutdown
sleep 10
redis-cli -p 26379
> SENTINEL get-master-addr-by-name mymaster
# 查看新主节点
```

</details>

### 练习 2：客户端连接哨兵

使用 Spring Boot 连接哨兵集群：
1. 配置 sentinel 连接信息
2. 测试读写操作
3. 模拟故障转移，验证自动切换

<details>
<summary>点击查看答案</summary>

```yaml
# application.yml
spring:
  redis:
    sentinel:
      master: mymaster
      nodes: 127.0.0.1:26379,127.0.0.1:26380,127.0.0.1:26381
    password: ""
    timeout: 5000ms
```

```java
@RestController
public class RedisController {
    @Autowired
    private StringRedisTemplate redisTemplate;

    @GetMapping("/test")
    public String test() {
        // 写操作
        redisTemplate.opsForValue().set("test", "hello");
        // 读操作
        return redisTemplate.opsForValue().get("test");
    }
}
```

</details>

### 练习 3（挑战）：故障转移通知

配置哨兵通知脚本，在故障转移时发送告警：
1. 编写通知脚本
2. 配置哨兵执行脚本
3. 触发故障转移，验证通知

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# /etc/redis/notify.sh
# 参数：event-type subject notification

EVENT_TYPE=$1
SUBJECT=$2
NOTIFICATION=$3

echo "$(date '+%Y-%m-%d %H:%M:%S') [Redis Sentinel] Event: $EVENT_TYPE, Subject: $SUBJECT, Detail: $NOTIFICATION" >> /var/log/redis-sentinel-notify.log

# 可以添加邮件、钉钉、微信等通知
# curl -X POST "https://oapi.dingtalk.com/robot/send?access_token=xxx" \
#   -H 'Content-Type: application/json' \
#   -d "{\"msgtype\": \"text\", \"text\": {\"content\": \"Redis告警: $SUBJECT - $NOTIFICATION\"}}"
```

```conf
# sentinel.conf
sentinel notification-script mymaster /etc/redis/notify.sh
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis Cluster 集群**——也就是如何实现数据的水平扩展。你会学到集群架构、数据分片、节点通信、扩容缩容等核心概念，掌握如何构建大规模 Redis 集群。
