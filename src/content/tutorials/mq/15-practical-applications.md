---
title: "第15章：消息队列实战应用"
description: "掌握消息队列在异步解耦、削峰填谷、数据同步等真实场景中的应用"
---

# 第15章：消息队列实战应用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 消息队列在实际项目中到底怎么用？
- 异步解耦、削峰填谷这些概念怎么落地？
- 数据同步场景下，消息队列能做什么？
- 有没有完整的代码示例可以参考？

这一章会通过三个真实场景——**订单系统（异步解耦）**、**秒杀系统（削峰填谷）**、**数据库同步（数据同步）**——带你看到消息队列在实际项目中是怎么发挥作用的。每个场景都有完整的代码示例，你可以直接参考。

---

## 15.1 为什么需要学习实战应用？

### 痛点分析

前面我们学了消息队列的基础知识和核心原理，但到了实际项目中，很多人还是不知道怎么落地：

- 知道要"异步解耦"，但不知道哪些流程该异步
- 知道要"削峰填谷"，但不知道怎么设计
- 知道要"数据同步"，但不知道用什么方案

打个比方：

> 你学会了开车，但不知道在实际路况中怎么应用。高速公路怎么开？堵车怎么办？山路怎么走？这些都需要实战经验。

### 解决方案

这一章会通过三个典型场景，带你看到消息队列在实际项目中的应用。每个场景都有：
- 问题分析：为什么需要消息队列
- 架构设计：怎么用消息队列
- 完整代码：可以直接参考的实现

---

## 15.2 场景一：订单系统（异步解耦）

### 问题分析

用户下单后，系统需要做很多事：

1. 扣减库存
2. 生成订单记录
3. 发送短信通知
4. 推送 App 消息
5. 积分系统加分
6. 物流系统准备

如果所有步骤都同步执行，用户要等很久。而且这些系统之间高度耦合，任何一个系统挂了，整个下单流程就失败了。

### 架构设计

```
用户下单 → 订单服务 → 扣库存 + 生成订单（同步）
                    ↓
              发送消息到 MQ
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
    短信服务    推送服务    积分服务
   （异步）    （异步）    （异步）
```

### 完整代码示例

**订单服务（生产者）**

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate; // RabbitMQ 模板

    @Autowired
    private InventoryService inventoryService; // 库存服务

    @Autowired
    private OrderRepository orderRepository; // 订单数据仓库

    /**
     * 创建订单
     * @param order 订单信息
     */
    public void createOrder(Order order) {
        // 1. 同步执行核心流程：扣减库存
        inventoryService.deduct(order.getProductId(), order.getQuantity());

        // 2. 同步执行核心流程：生成订单记录
        orderRepository.save(order);

        // 3. 异步执行非核心流程：发送消息到 MQ
        // 交换机：order.exchange，路由键：order.created
        rabbitTemplate.convertAndSend("order.exchange", "order.created", order);

        // 4. 立即返回，用户看到"下单成功"
        // 短信、推送、积分等服务会异步消费这条消息
    }
}
```

**短信服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    /**
     * 监听订单创建消息，发送短信通知
     * @param order 订单信息
     */
    @RabbitListener(queues = "sms.queue") // 监听的队列
    public void sendSms(Order order) {
        // 1. 获取用户手机号
        String phone = order.getUserPhone();

        // 2. 构造短信内容
        String content = String.format("您的订单 %s 已创建成功，预计 %s 送达",
            order.getOrderNo(), order.getEstimatedDeliveryTime());

        // 3. 调用短信平台 API 发送短信
        smsApi.send(phone, content);

        // 4. 记录日志
        System.out.println("短信已发送: " + phone);
    }
}
```

**推送服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class PushService {

    /**
     * 监听订单创建消息，推送 App 消息
     * @param order 订单信息
     */
    @RabbitListener(queues = "push.queue") // 监听的队列
    public void sendPush(Order order) {
        // 1. 获取用户设备 Token
        String deviceToken = order.getUserDeviceToken();

        // 2. 构造推送内容
        String title = "订单创建成功";
        String content = "您的订单 " + order.getOrderNo() + " 已创建成功";

        // 3. 调用推送平台 API 发送消息
        pushApi.send(deviceToken, title, content);

        // 4. 记录日志
        System.out.println("推送已发送: " + deviceToken);
    }
}
```

**积分服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class PointService {

    /**
     * 监听订单创建消息，增加用户积分
     * @param order 订单信息
     */
    @RabbitListener(queues = "point.queue") // 监听的队列
    public void addPoints(Order order) {
        // 1. 计算积分（订单金额的 1%）
        int points = (int) (order.getAmount() * 0.01);

        // 2. 增加用户积分
        userRepository.addPoints(order.getUserId(), points);

        // 3. 记录积分日志
        pointLogRepository.save(new PointLog(order.getUserId(), points, "订单奖励"));

        // 4. 记录日志
        System.out.println("积分已增加: 用户=" + order.getUserId() + ", 积分=" + points);
    }
}
```

### 效果对比

| 指标 | 改造前（同步） | 改造后（异步） |
| --- | --- | --- |
| 响应时间 | 880ms | 35ms |
| 系统耦合度 | 高（订单系统依赖所有服务） | 低（通过 MQ 解耦） |
| 容错能力 | 差（任一服务挂了就失败） | 好（MQ 会重试） |
| 扩展性 | 差（加新服务要改订单系统） | 好（加新服务只需监听 MQ） |

---

## 15.3 场景二：秒杀系统（削峰填谷）

### 问题分析

秒杀场景下，短时间内会有大量请求涌入：

- 10 万人同时抢购 1000 件商品
- 如果直接处理数据库，数据库会被打爆
- 用户等待时间长，体验差

### 架构设计

```
用户请求 → 秒杀服务 → 写入 MQ（快速返回）
                      ↓
                库存扣减服务（慢慢消费）
                      ↓
                  数据库
```

### 完整代码示例

**秒杀服务（生产者）**

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class SeckillService {

    @Autowired
    private RabbitTemplate rabbitTemplate; // RabbitMQ 模板

    @Autowired
    private StringRedisTemplate redisTemplate; // Redis 模板

    /**
     * 秒杀接口
     * @param userId 用户 ID
     * @param productId 商品 ID
     */
    public String seckill(String userId, String productId) {
        // 1. 前置校验：检查商品是否存在
        String productKey = "seckill:product:" + productId;
        if (!redisTemplate.hasKey(productKey)) {
            return "商品不存在";
        }

        // 2. 前置校验：检查库存（Redis 中预扣减）
        Long stock = redisTemplate.opsForValue().decrement(productKey);
        if (stock < 0) {
            // 库存不足，恢复 Redis 库存
            redisTemplate.opsForValue().increment(productKey);
            return "库存不足";
        }

        // 3. 前置校验：检查是否重复购买
        String userKey = "seckill:user:" + productId + ":" + userId;
        if (redisTemplate.hasKey(userKey)) {
            // 恢复 Redis 库存
            redisTemplate.opsForValue().increment(productKey);
            return "不能重复购买";
        }

        // 4. 写入 MQ，快速返回
        SeckillOrder order = new SeckillOrder(userId, productId, System.currentTimeMillis());
        rabbitTemplate.convertAndSend("seckill.exchange", "seckill.order", order);

        // 5. 记录用户已购买（防止重复）
        redisTemplate.opsForValue().set(userKey, "1");

        // 6. 立即返回"排队中"
        return "排队中";
    }
}
```

**库存扣减服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SeckillConsumer {

    @Autowired
    private OrderRepository orderRepository; // 订单数据仓库

    @Autowired
    private ProductRepository productRepository; // 商品数据仓库

    /**
     * 监听秒杀订单消息，扣减库存
     * @param order 秒杀订单
     */
    @RabbitListener(queues = "seckill.queue") // 监听的队列
    public void handleSeckillOrder(SeckillOrder order) {
        try {
            // 1. 开启事务
            Transaction transaction = database.beginTransaction();

            // 2. 扣减数据库库存（悲观锁）
            int affected = productRepository.deductStock(order.getProductId(), transaction);
            if (affected == 0) {
                // 库存不足，回滚事务
                transaction.rollback();
                return;
            }

            // 3. 生成订单记录
            Order dbOrder = new Order();
            dbOrder.setOrderNo(generateOrderNo());
            dbOrder.setUserId(order.getUserId());
            dbOrder.setProductId(order.getProductId());
            dbOrder.setStatus("PENDING_PAYMENT");
            dbOrder.setCreateTime(new Date());
            orderRepository.save(dbOrder, transaction);

            // 4. 提交事务
            transaction.commit();

            // 5. 通知用户秒杀成功（发送短信或推送）
            notifyUser(order.getUserId(), "秒杀成功，请在 15 分钟内支付");

        } catch (Exception e) {
            // 6. 异常处理：记录日志，重试或人工处理
            System.err.println("秒杀订单处理失败: " + order.getOrderNo());
            e.printStackTrace();
        }
    }

    /**
     * 生成订单号
     */
    private String generateOrderNo() {
        return "SK" + System.currentTimeMillis() + RandomStringUtils.randomNumeric(6);
    }

    /**
     * 通知用户
     */
    private void notifyUser(String userId, String message) {
        // 调用短信或推送服务
        System.out.println("通知用户 " + userId + ": " + message);
    }
}
```

### 效果对比

| 指标 | 改造前（直接处理） | 改造后（MQ 削峰） |
| --- | --- | --- |
| 数据库压力 | 极高（10 万 QPS） | 低（1000 QPS） |
| 响应时间 | 很慢（数据库被打爆） | 快（毫秒级返回） |
| 系统稳定性 | 差（容易崩溃） | 好（MQ 缓冲） |
| 用户体验 | 差（等待时间长） | 好（快速返回"排队中"） |

---

## 15.4 场景三：数据库同步（数据同步）

### 问题分析

很多场景需要同步数据库：

- 主从复制：读写分离
- 数据迁移：老系统迁移到新系统
- 数据备份：实时备份到另一个数据库
- 搜索引擎：MySQL 数据同步到 Elasticsearch

### 架构设计

```
MySQL 数据库 → Binlog → 监听服务 → MQ → 同步服务 → 目标数据库
```

### 完整代码示例

**Binlog 监听服务（生产者）**

```java
import com.github.shyiko.mysql.binlog.BinaryLogClient;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class BinlogListenerService {

    @Autowired
    private RabbitTemplate rabbitTemplate; // RabbitMQ 模板

    /**
     * 启动时监听 MySQL Binlog
     */
    @PostConstruct
    public void start() {
        // 1. 创建 Binlog 客户端
        BinaryLogClient client = new BinaryLogClient("localhost", 3306, "root", "password");

        // 2. 设置 Binlog 位置
        client.setBinlogFilename("mysql-bin.000001");
        client.setBinlogPosition(0);

        // 3. 注册事件监听器
        client.registerEventListener(event -> {
            // 4. 处理事件类型
            if (event.getHeader().getEventType() == EventType.WRITE_ROWS) {
                // 5. 解析插入事件
                EventData data = event.getData();
                if (data instanceof InsertRowsEventData) {
                    InsertRowsEventData insertData = (InsertRowsEventData) data;

                    // 6. 遍历每一行数据
                    for (Serializable[] row : insertData.getRows()) {
                        // 7. 构造消息
                        BinlogMessage message = new BinlogMessage();
                        message.setTable(insertData.getTableId());
                        message.setRow(row);
                        message.setTimestamp(event.getHeader().getTimestamp());

                        // 8. 发送到 MQ
                        rabbitTemplate.convertAndSend("binlog.exchange", "binlog.insert", message);
                    }
                }
            } else if (event.getHeader().getEventType() == EventType.UPDATE_ROWS) {
                // 9. 处理更新事件
                EventData data = event.getData();
                if (data instanceof UpdateRowsEventData) {
                    UpdateRowsEventData updateData = (UpdateRowsEventData) data;

                    for (Map.Entry<Serializable[], Serializable[]> row : updateData.getRows()) {
                        BinlogMessage message = new BinlogMessage();
                        message.setTable(updateData.getTableId());
                        message.setBefore(row.getKey()); // 更新前的数据
                        message.setAfter(row.getValue()); // 更新后的数据
                        message.setTimestamp(event.getHeader().getTimestamp());

                        rabbitTemplate.convertAndSend("binlog.exchange", "binlog.update", message);
                    }
                }
            } else if (event.getHeader().getEventType() == EventType.DELETE_ROWS) {
                // 10. 处理删除事件
                EventData data = event.getData();
                if (data instanceof DeleteRowsEventData) {
                    DeleteRowsEventData deleteData = (DeleteRowsEventData) data;

                    for (Serializable[] row : deleteData.getRows()) {
                        BinlogMessage message = new BinlogMessage();
                        message.setTable(deleteData.getTableId());
                        message.setRow(row);
                        message.setTimestamp(event.getHeader().getTimestamp());

                        rabbitTemplate.convertAndSend("binlog.exchange", "binlog.delete", message);
                    }
                }
            }
        });

        // 11. 连接 Binlog
        try {
            client.connect();
            System.out.println("Binlog 监听已启动");
        } catch (Exception e) {
            System.err.println("Binlog 监听启动失败: " + e.getMessage());
        }
    }
}
```

**Elasticsearch 同步服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ElasticsearchSyncService {

    @Autowired
    private ElasticsearchRestTemplate elasticsearchTemplate; // ES 模板

    /**
     * 监听 Binlog 插入事件，同步到 ES
     * @param message Binlog 消息
     */
    @RabbitListener(queues = "es.sync.queue") // 监听的队列
    public void syncToElasticsearch(BinlogMessage message) {
        try {
            // 1. 判断表名（只同步用户表）
            if ("user_table".equals(message.getTable())) {
                // 2. 构造 ES 文档
                UserDocument doc = new UserDocument();
                doc.setId((Long) message.getRow()[0]); // 主键 ID
                doc.setUsername((String) message.getRow()[1]); // 用户名
                doc.setEmail((String) message.getRow()[2]); // 邮箱
                doc.setCreateTime(new Date(message.getTimestamp())); // 创建时间

                // 3. 保存到 ES
                elasticsearchTemplate.save(doc);

                // 4. 记录日志
                System.out.println("数据已同步到 ES: " + doc.getId());
            }
        } catch (Exception e) {
            // 5. 异常处理：记录日志，重试
            System.err.println("ES 同步失败: " + message);
            e.printStackTrace();
        }
    }
}
```

### 效果对比

| 指标 | 改造前（定时任务） | 改造后（Binlog + MQ） |
| --- | --- | --- |
| 实时性 | 差（分钟级延迟） | 好（秒级延迟） |
| 数据一致性 | 差（可能漏数据） | 好（Binlog 保证不丢） |
| 对源库影响 | 大（定时查询） | 小（监听 Binlog） |
| 扩展性 | 差（加新目标要改代码） | 好（加新消费者即可） |

---

## 15.5 事件驱动架构

### 什么是事件驱动架构？

事件驱动架构（Event-Driven Architecture，简称 EDA）是一种软件架构模式，系统的各个组件通过**事件**进行通信。

打个比方：

> 事件驱动架构像一个**新闻编辑部**。记者（事件源）发现新闻（事件）后，把新闻发给编辑部（事件总线）。编辑（事件处理器）根据新闻类型决定是否处理。多个编辑可以同时处理同一条新闻，互不干扰。

### 事件驱动架构的优势

| 优势 | 说明 |
| --- | --- |
| **松耦合** | 事件源和事件处理器互不依赖 |
| **可扩展** | 加新处理器不需要改事件源 |
| **异步处理** | 事件可以异步处理，提高响应速度 |
| **可追溯** | 事件可以保存，用于审计和回溯 |

### 事件驱动架构示例

```java
// 定义事件
public class OrderCreatedEvent {
    private String orderId; // 订单 ID
    private String userId; // 用户 ID
    private BigDecimal amount; // 订单金额
    private Date createTime; // 创建时间
}

// 事件源：订单服务
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher eventPublisher; // Spring 事件发布器

    public void createOrder(Order order) {
        // 1. 创建订单
        orderRepository.save(order);

        // 2. 发布事件
        OrderCreatedEvent event = new OrderCreatedEvent();
        event.setOrderId(order.getId());
        event.setUserId(order.getUserId());
        event.setAmount(order.getAmount());
        event.setCreateTime(new Date());
        eventPublisher.publishEvent(event);

        // 3. 立即返回
    }
}

// 事件处理器 1：短信服务
@Component
public class SmsEventHandler {
    @EventListener // Spring 事件监听器
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 发送短信通知
        smsService.send(event.getUserId(), "您的订单已创建");
    }
}

// 事件处理器 2：积分服务
@Component
public class PointEventHandler {
    @EventListener
    @Async // 异步处理
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 增加积分
        pointService.add(event.getUserId(), event.getAmount().multiply(new BigDecimal("0.01")));
    }
}
```

---

## 15.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 异步解耦 | 核心流程同步，非核心流程异步 |
| 削峰填谷 | 高峰期消息暂存 MQ，低谷期慢慢消费 |
| 数据同步 | 监听 Binlog，通过 MQ 同步到目标数据库 |
| 事件驱动 | 系统组件通过事件通信，松耦合 |
| 幂等性 | 消费者要处理重复消息，保证幂等性 |
| 消息丢失 | 生产者确认、MQ 持久化、消费者确认 |

---

## 15.7 新手常见误区

### 误区 1："所有流程都要异步"

**错！** 只有非核心流程才应该异步。核心流程（如扣库存、生成订单）必须同步执行，保证数据一致性。如果把核心流程也异步了，可能会出现"订单创建了但库存没扣"的问题。

正确做法：核心流程同步，非核心流程异步。

### 误区 2："MQ 可以保证消息一定被消费"

不是的。MQ 只能保证消息"至少被投递一次"，但不能保证"一定被消费成功"。如果消费者处理消息时抛异常，消息可能会丢失或重复消费。需要在消费者端做幂等性处理。

### 误区 3："削峰填谷就是无限堆积消息"

不是的。MQ 的堆积能力是有限的，如果堆积太多消息，MQ 也会扛不住。正确做法是：根据消费者的处理能力，限制 MQ 中的消息数量。超过阈值时，直接拒绝请求或返回"排队中"。

### 误区 4："数据同步只能用定时任务"

不是的。定时任务有延迟，而且对源库压力大。更好的方案是监听 Binlog，通过 MQ 实时同步。这样既实时，又对源库影响小。

### 误区 5："事件驱动架构可以替代所有同步调用"

不是的。事件驱动架构适合松耦合的场景，但如果需要强一致性（如转账），还是需要同步调用。事件驱动和同步调用是互补的，不是替代的。

---

## 15.8 动手练习

### 练习 1：基础练习

设计一个用户注册系统，要求：
- 用户注册后，发送欢迎邮件
- 用户注册后，发送短信验证码
- 用户注册后，初始化用户积分

请用消息队列实现异步解耦。

<details>
<summary>点击查看答案</summary>

```java
// 用户服务（生产者）
@Service
public class UserService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private UserRepository userRepository;

    public void register(User user) {
        // 1. 同步：保存用户
        userRepository.save(user);

        // 2. 异步：发送消息到 MQ
        UserRegisteredEvent event = new UserRegisteredEvent();
        event.setUserId(user.getId());
        event.setEmail(user.getEmail());
        event.setPhone(user.getPhone());
        rabbitTemplate.convertAndSend("user.exchange", "user.registered", event);
    }
}

// 邮件服务（消费者）
@Service
public class EmailService {
    @RabbitListener(queues = "email.queue")
    public void sendWelcomeEmail(UserRegisteredEvent event) {
        emailApi.send(event.getEmail(), "欢迎注册", "欢迎使用我们的服务！");
    }
}

// 短信服务（消费者）
@Service
public class SmsService {
    @RabbitListener(queues = "sms.queue")
    public void sendVerificationCode(UserRegisteredEvent event) {
        String code = generateCode();
        smsApi.send(event.getPhone(), "验证码：" + code);
    }
}

// 积分服务（消费者）
@Service
public class PointService {
    @RabbitListener(queues = "point.queue")
    public void initPoints(UserRegisteredEvent event) {
        pointRepository.save(event.getUserId(), 100); // 新用户送 100 积分
    }
}
```

</details>

### 练习 2：进阶练习

设计一个秒杀系统，要求：
- 10 万人同时抢购 1000 件商品
- 数据库不能被打爆
- 用户快速返回"排队中"
- 最终通知用户秒杀结果

请用消息队列实现削峰填谷。

<details>
<summary>点击查看答案</summary>

```java
// 秒杀服务（生产者）
@Service
public class SeckillService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private StringRedisTemplate redisTemplate;

    public String seckill(String userId, String productId) {
        // 1. Redis 预扣减库存
        Long stock = redisTemplate.opsForValue().decrement("seckill:stock:" + productId);
        if (stock < 0) {
            redisTemplate.opsForValue().increment("seckill:stock:" + productId);
            return "库存不足";
        }

        // 2. 写入 MQ
        SeckillOrder order = new SeckillOrder(userId, productId);
        rabbitTemplate.convertAndSend("seckill.exchange", "seckill.order", order);

        // 3. 快速返回
        return "排队中";
    }
}

// 秒杀消费者
@Service
public class SeckillConsumer {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @RabbitListener(queues = "seckill.queue")
    public void handleOrder(SeckillOrder order) {
        try {
            // 1. 数据库扣减库存
            int affected = productRepository.deductStock(order.getProductId());
            if (affected == 0) {
                notifyUser(order.getUserId(), "秒杀失败，库存不足");
                return;
            }

            // 2. 生成订单
            Order dbOrder = new Order(order.getUserId(), order.getProductId());
            orderRepository.save(dbOrder);

            // 3. 通知用户
            notifyUser(order.getUserId(), "秒杀成功，订单号：" + dbOrder.getOrderNo());

        } catch (Exception e) {
            notifyUser(order.getUserId(), "秒杀失败，系统异常");
        }
    }

    private void notifyUser(String userId, String message) {
        // 发送短信或推送
        System.out.println("通知用户 " + userId + ": " + message);
    }
}
```

</details>

### 练习 3（挑战）：综合练习

设计一个数据同步系统，要求：
- 监听 MySQL 的 Binlog
- 将用户表的变更实时同步到 Elasticsearch
- 将订单表的变更实时同步到 Redis
- 保证数据不丢失

请用 Binlog + MQ 实现。

<details>
<summary>点击查看答案</summary>

```java
// Binlog 监听服务
@Service
public class BinlogListenerService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @PostConstruct
    public void start() {
        BinaryLogClient client = new BinaryLogClient("localhost", 3306, "root", "password");
        client.registerEventListener(event -> {
            if (event.getData() instanceof InsertRowsEventData) {
                InsertRowsEventData data = (InsertRowsEventData) event.getData();
                for (Serializable[] row : data.getRows()) {
                    BinlogMessage msg = new BinlogMessage();
                    msg.setTable(data.getTableId());
                    msg.setRow(row);
                    msg.setOperation("INSERT");

                    // 根据表名路由到不同的 MQ
                    if ("user_table".equals(data.getTableId())) {
                        rabbitTemplate.convertAndSend("binlog.exchange", "user.insert", msg);
                    } else if ("order_table".equals(data.getTableId())) {
                        rabbitTemplate.convertAndSend("binlog.exchange", "order.insert", msg);
                    }
                }
            }
        });
        client.connect();
    }
}

// ES 同步消费者
@Service
public class ElasticsearchSyncService {
    @Autowired
    private ElasticsearchRestTemplate esTemplate;

    @RabbitListener(queues = "es.sync.queue")
    public void syncToES(BinlogMessage msg) {
        UserDocument doc = new UserDocument();
        doc.setId((Long) msg.getRow()[0]);
        doc.setUsername((String) msg.getRow()[1]);
        esTemplate.save(doc);
    }
}

// Redis 同步消费者
@Service
public class RedisSyncService {
    @Autowired
    private StringRedisTemplate redisTemplate;

    @RabbitListener(queues = "redis.sync.queue")
    public void syncToRedis(BinlogMessage msg) {
        String orderId = (String) msg.getRow()[0];
        String orderData = JSON.toJSONString(msg.getRow());
        redisTemplate.opsForValue().set("order:" + orderId, orderData);
    }
}
```

</details>

---

## 下一章预告

下一章我们会做一个**综合项目实战**——订单系统消息化改造、监控告警系统、消息队列选型建议、生产环境最佳实践。这是整个教程的最后一章，会把前面学的知识串起来，帮你打造一个完整的消息队列应用。
