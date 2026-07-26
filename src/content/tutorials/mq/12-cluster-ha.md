---
title: "第12章：RabbitMQ 集群与高可用"
description: "掌握 RabbitMQ 集群搭建、镜像队列、Quorum 队列"
---

# 第12章：RabbitMQ 集群与高可用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- RabbitMQ 单点故障怎么办？
- 怎么搭建 RabbitMQ 集群？
- 普通集群和镜像集群有什么区别？
- 什么是 Quorum 队列？

这一章会解答这些问题。集群和高可用是生产环境的必备配置，保证消息队列的稳定运行。

---

## 12.1 为什么需要集群？

### 单点故障问题

单节点 RabbitMQ 的问题：

```
生产者 --> [RabbitMQ 单节点] --> 消费者
                |
            节点宕机
                |
            系统瘫痪
```

问题：
- 节点宕机，整个消息系统不可用
- 单机性能有上限（CPU、内存、网络）
- 无法水平扩展

### 解决方案：集群

```
                --> [节点1] -->
生产者 --> 负载均衡 --> [节点2] --> 消费者
                --> [节点3] -->
```

优点：
- 高可用：某个节点宕机，其他节点继续服务
- 高性能：多节点并行处理
- 可扩展：随时增加节点

---

## 12.2 RabbitMQ 集群模式

### 普通集群

**特点**：
- 所有节点共享元数据（队列、交换机、绑定关系）
- 消息内容只存储在创建队列的节点
- 其他节点只存储元数据索引

**问题**：
- 访问其他节点的消息需要转发，性能差
- 创建队列的节点宕机，该队列的消息无法访问

```
节点1: 队列A的消息
节点2: 队列B的消息
节点3: 队列C的消息

消费者连接节点2访问队列A --> 节点2转发到节点1 --> 性能差
```

### 镜像集群

**特点**：
- 消息内容在所有节点都有副本
- 某个节点宕机，其他节点可以继续服务
- 真正的"高可用"

**问题**：
- 消息同步占用网络带宽
- 节点越多，同步开销越大

```
节点1: 队列A的消息（主）
节点2: 队列A的消息（镜像）
节点3: 队列A的消息（镜像）
```

### Quorum 队列（推荐）

**特点**：
- 基于 Raft 共识算法
- 消息写入多数节点后才确认
- 自动故障转移

**优点**：
- 强一致性
- 自动选主
- 比镜像队列更可靠

---

## 12.3 搭建普通集群

### 环境准备

准备3台服务器（或虚拟机）：
- node1: 192.168.1.101
- node2: 192.168.1.102
- node3: 192.168.1.103

### 步骤1：配置 hosts

```bash
# 所有节点都配置
sudo vim /etc/hosts

192.168.1.101 rabbitmq1
192.168.1.102 rabbitmq2
192.168.1.103 rabbitmq3
```

### 步骤2：配置 Erlang Cookie

所有节点必须使用相同的 Erlang Cookie：

```bash
# 找到 cookie 文件
# Linux: /var/lib/rabbitmq/.erlang.cookie
# Windows: C:\Users\用户名\.erlang.cookie

# 复制 node1 的 cookie 到其他节点
# 确保权限正确（400）
chmod 400 /var/lib/rabbitmq/.erlang.cookie
```

### 步骤3：启动所有节点

```bash
# 所有节点启动 RabbitMQ
rabbitmq-server -detached
```

### 步骤4：加入集群

```bash
# 在 node2 和 node3 上执行
# 停止应用（不停止服务）
rabbitmqctl stop_app

# 重置节点
rabbitmqctl reset

# 加入集群（以 node2 为例）
rabbitmqctl join_cluster rabbit@rabbitmq1

# 启动应用
rabbitmqctl start_app

# 查看集群状态
rabbitmqctl cluster_status
```

### 步骤5：配置镜像队列（可选）

```bash
# 设置镜像队列策略
rabbitmqctl set_policy ha-all "^" '{"ha-mode":"all"}'

# 或者指定镜像到特定节点
rabbitmqctl set_policy ha-two "^" '{"ha-mode":"exactly","ha-params":2}'
```

---

## 12.4 Quorum 队列

### 什么是 Quorum 队列？

Quorum 队列是 RabbitMQ 3.8+ 引入的新特性，基于 Raft 共识算法。

**特点**：
- 消息写入多数节点（quorum）后才确认
- 自动故障转移
- 强一致性保证

### 声明 Quorum 队列

```java
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuorumConfig {

    @Bean
    public Queue quorumQueue() {
        return QueueBuilder.durable("quorum_queue")
                .quorum()  // 声明为 Quorum 队列
                .build();
    }
}
```

### 配置参数

```java
@Bean
public Queue quorumQueue() {
    return QueueBuilder.durable("quorum_queue")
            .quorum()
            .withArgument("x-quorum-initial-group-size", 3) // 初始节点数
            .withArgument("x-delivery-limit", 5)            // 最大投递次数
            .build();
}
```

---

## 12.5 负载均衡

### 使用 Nginx 负载均衡

```nginx
upstream rabbitmq {
    server 192.168.1.101:5672;
    server 192.168.1.102:5672;
    server 192.168.1.103:5672;
}

server {
    listen 5672;
    proxy_pass rabbitmq;
}
```

### 使用 HAProxy

```haproxy
frontend rabbitmq_frontend
    bind *:5672
    default_backend rabbitmq_backend

backend rabbitmq_backend
    balance roundrobin
    server node1 192.168.1.101:5672 check
    server node2 192.168.1.102:5672 check
    server node3 192.168.1.103:5672 check
```

---

## 12.6 监控与维护

### 集群监控

```bash
# 查看集群状态
rabbitmqctl cluster_status

# 查看队列信息
rabbitmqctl list_queues name messages consumers

# 查看连接信息
rabbitmqctl list_connections

# 查看通道信息
rabbitmqctl list_channels
```

### Web 管理界面

集群模式下，管理界面会显示所有节点的状态：

```
http://192.168.1.101:15672
```

### 常见维护操作

```bash
# 停止节点
rabbitmqctl stop

# 启动节点
rabbitmq-server -detached

# 从集群中移除节点
rabbitmqctl forget_cluster_node rabbit@node2

# 重置节点
rabbitmqctl reset
```

---

## 12.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 普通集群 | 共享元数据，消息不复制 |
| 镜像集群 | 消息复制到所有节点 |
| Quorum 队列 | 基于 Raft，强一致性 |
| Erlang Cookie | 集群节点间通信的密钥 |
| 负载均衡 | Nginx 或 HAProxy 分发请求 |
| 监控 | rabbitmqctl 命令和 Web 界面 |

---

## 12.8 新手常见误区

### 误区 1："普通集群就是高可用"

**错！** 普通集群的消息只存储在创建队列的节点，该节点宕机消息就不可用了。要实现高可用必须用镜像队列或 Quorum 队列。

### 误区 2："节点越多越好"

不是的。节点越多，同步开销越大，性能可能反而下降。一般3-5个节点就够了。

### 误区 3："Quorum 队列和普通队列用法一样"

基本一样，但 Quorum 队列有一些限制：
- 不支持 transient 队列
- 不支持 priority
- 不支持 global QoS

---

## 12.9 动手练习

### 练习 1：基础练习

在本地搭建一个3节点的 RabbitMQ 集群。

<details>
<summary>点击查看答案</summary>

```bash
# 使用 Docker 快速搭建

# 创建网络
docker network create rabbitmq-net

# 启动3个节点
docker run -d --name rabbitmq1 --network rabbitmq-net \
  -e RABBITMQ_ERLANG_COOKIE='secret_cookie' \
  -e RABBITMQ_NODENAME='rabbit@rabbitmq1' \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management

docker run -d --name rabbitmq2 --network rabbitmq-net \
  -e RABBITMQ_ERLANG_COOKIE='secret_cookie' \
  -e RABBITMQ_NODENAME='rabbit@rabbitmq2' \
  rabbitmq:3-management

docker run -d --name rabbitmq3 --network rabbitmq-net \
  -e RABBITMQ_ERLANG_COOKIE='secret_cookie' \
  -e RABBITMQ_NODENAME='rabbit@rabbitmq3' \
  rabbitmq:3-management

# 加入集群
docker exec -it rabbitmq2 bash
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster rabbit@rabbitmq1
rabbitmqctl start_app

# node3 同理

# 查看集群状态
docker exec -it rabbitmq1 rabbitmqctl cluster_status
```

</details>

### 练习 2：进阶练习

配置 Quorum 队列，测试故障转移。

<details>
<summary>点击查看答案</summary>

```java
// 配置类
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuorumConfig {

    @Bean
    public Queue quorumQueue() {
        return QueueBuilder.durable("quorum_queue")
                .quorum()
                .withArgument("x-quorum-initial-group-size", 3)
                .build();
    }
}

// 测试类
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@SpringBootTest
public class QuorumTest {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Test
    public void testQuorumQueue() {
        // 发送消息
        rabbitTemplate.convertAndSend("quorum_queue", "test message");
        
        // 停止一个节点
        // docker stop rabbitmq2
        
        // 继续发送消息，应该成功
        rabbitTemplate.convertAndSend("quorum_queue", "test message 2");
        
        // 启动节点
        // docker start rabbitmq2
    }
}
```

</details>

### 练习 3（挑战）：综合练习

搭建一个高可用集群，配置负载均衡和监控。

<details>
<summary>点击查看答案</summary>

```bash
# Docker Compose 配置
version: '3'
services:
  rabbitmq1:
    image: rabbitmq:3-management
    hostname: rabbitmq1
    environment:
      - RABBITMQ_ERLANG_COOKIE=secret_cookie
      - RABBITMQ_NODENAME=rabbit@rabbitmq1
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - rabbitmq-net

  rabbitmq2:
    image: rabbitmq:3-management
    hostname: rabbitmq2
    environment:
      - RABBITMQ_ERLANG_COOKIE=secret_cookie
      - RABBITMQ_NODENAME=rabbit@rabbitmq2
    depends_on:
      - rabbitmq1
    networks:
      - rabbitmq-net
    command: >
      sh -c "rabbitmq-server -detached;
             sleep 10;
             rabbitmqctl stop_app;
             rabbitmqctl reset;
             rabbitmqctl join_cluster rabbit@rabbitmq1;
             rabbitmqctl start_app;
             tail -f /var/log/rabbitmq/rabbit@rabbitmq2.log"

  rabbitmq3:
    image: rabbitmq:3-management
    hostname: rabbitmq3
    environment:
      - RABBITMQ_ERLANG_COOKIE=secret_cookie
      - RABBITMQ_NODENAME=rabbit@rabbitmq3
    depends_on:
      - rabbitmq1
    networks:
      - rabbitmq-net
    command: >
      sh -c "rabbitmq-server -detached;
             sleep 10;
             rabbitmqctl stop_app;
             rabbitmqctl reset;
             rabbitmqctl join_cluster rabbit@rabbitmq1;
             rabbitmqctl start_app;
             tail -f /var/log/rabbitmq/rabbit@rabbitmq3.log"

  haproxy:
    image: haproxy:latest
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    ports:
      - "5673:5672"
    networks:
      - rabbitmq-net

networks:
  rabbitmq-net:
```

```haproxy
# haproxy.cfg
global
    log 127.0.0.1 local0

defaults
    log     global
    mode    tcp
    timeout connect 5s
    timeout client 50s
    timeout server 50s

frontend rabbitmq_frontend
    bind *:5672
    default_backend rabbitmq_backend

backend rabbitmq_backend
    balance roundrobin
    server rabbitmq1 rabbitmq1:5672 check
    server rabbitmq2 rabbitmq2:5672 check
    server rabbitmq3 rabbitmq3:5672 check
```

</details>

---

## 下一章预告

下一章我们会学习 **Kafka 消息队列入门**——另一个流行的消息队列系统。你会学到 Kafka 的核心概念、与 RabbitMQ 的对比、以及适用场景。