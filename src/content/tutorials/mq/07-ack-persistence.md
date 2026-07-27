---
title: "第7章:消息确认与持久化"
description: "学习消息确认机制和持久化策略,保证消息不丢失"
---

# 第7章:消息确认与持久化

## 本章导读

在学这一章之前,你可能会有这些疑问:

- 消费者处理消息失败了,消息会不会丢失?
- RabbitMQ 重启后,队列里的消息还在吗?
- 怎么保证消息从生产者到消费者都不丢失?
- 自动确认和手动确认有什么区别?

这一章会解答这些问题。我们会学习消息确认机制和持久化策略,掌握如何保证消息的可靠传递。

---

## 1 为什么需要消息确认和持久化?

### 痛点分析

前面的章节中,我们发送消息后都是"发出去就不管了"。但实际生产环境中,这样做会有很多问题:

场景 1:消费者处理失败

```java
// ❌ 问题代码:自动确认模式
DeliverCallback deliverCallback = (consumerTag, delivery) -> {
    String message = new String(delivery.getBody(), "UTF-8");
    // 假设这里处理消息时发生异常
    int result = 10 / 0; // 除零异常
    System.out.println("处理完成: " + message);
};
channel.basicConsume(queueName, true, deliverCallback, consumerTag -> {}); // autoAck=true
```

问题:

- **消息丢失**:消息一到达消费者就被确认,即使处理失败也会从队列中删除
- **无法重试**:处理失败的消息无法重新投递
- **数据不一致**:业务逻辑没有执行完成,但消息已经没了

场景 2:RabbitMQ 重启

```java
// ❌ 问题代码:非持久化队列
channel.queueDeclare("temp_queue", false, false, false, null);
// durable=false,队列不持久化
```

问题:

- **消息丢失**:RabbitMQ 重启后,非持久化队列和消息都会丢失
- **数据不可恢复**:重要的业务消息无法恢复

打个比方:

> 消息确认就像快递签收。如果快递员(消费者)把快递(消息)送到就走了,不管你签没签收(自动确认),快递丢了就找不回来了。手动确认就像必须你签字确认,快递员才能离开,这样如果快递有问题,还可以追责。

> 持久化就像把重要文件复印一份保存在保险箱。即使办公室着火(RabbitMQ 重启),保险箱里的文件还在。

### 解决方案

使用消息确认机制和持久化:

```java
// ✅ 正确做法 1:手动确认模式
DeliverCallback deliverCallback = (consumerTag, delivery) -> {
    try {
        String message = new String(delivery.getBody(), "UTF-8");
        // 处理业务逻辑
        processMessage(message);
        // 处理成功,手动确认
        channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        System.out.println("处理完成: " + message);
    } catch (Exception e) {
        // 处理失败,拒绝消息,可以重新入队
        channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, true);
        System.out.println("处理失败,消息重新入队");
    }
};
channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {}); // autoAck=false

// ✅ 正确做法 2:持久化队列和消息
channel.queueDeclare("important_queue", true, false, false, null); // durable=true
channel.basicPublish(exchange, routingKey, 
    MessageProperties.PERSISTENT_TEXT_PLAIN, // 消息持久化
    message.getBytes());
```

> **一句话总结**:消息确认保证消费者正确处理消息,持久化保证 RabbitMQ 重启后消息不丢失。

---

## 2 核心原理讲解

### 消息确认机制

RabbitMQ 提供了两种消息确认模式:

**1. 自动确认(autoAck=true)**

消费者收到消息后,立即自动确认,消息从队列中删除。

```
队列 --> [消息] --> 消费者 --> 自动确认 --> 消息删除
```

优点:

- 简单,不需要额外代码
- 性能好(不需要等待确认)

缺点:

- 消息可能丢失(处理失败也会删除)
- 无法重试

适用场景:

- 消息不重要,可以丢失
- 对性能要求高,可以容忍少量丢失

**2. 手动确认(autoAck=false)**

消费者收到消息后,需要手动发送确认(ack)或拒绝(nack/reject)。

```
队列 --> [消息] --> 消费者 --> 手动确认 --> 消息删除
                    |
                    --> 手动拒绝 --> 消息重新入队或丢弃
```

优点:

- 消息不会丢失(处理失败可以重试)
- 可靠性高

缺点:

- 需要额外代码
- 性能稍差(需要等待确认)

适用场景:

- 消息重要,不能丢失
- 需要保证业务逻辑正确执行

### 消息持久化机制

持久化分为两部分:

**1. 队列持久化**

```java
channel.queueDeclare("queue_name", true, false, false, null);
//                             ↑ durable=true,队列持久化
```

队列持久化后,RabbitMQ 重启时队列还会存在。

**2. 消息持久化**

```java
channel.basicPublish(exchange, routingKey, 
    MessageProperties.PERSISTENT_TEXT_PLAIN, // 消息持久化
    message.getBytes());
```

消息持久化后,RabbitMQ 重启时消息还会存在。

打个比方:

> 队列持久化就像把仓库建在坚固的房子里,即使地震(RabbitMQ 重启)仓库还在。
> 消息持久化就像把重要文件锁在保险箱里,即使办公室着火消息还在。

### 消息丢失的三种场景

| 场景 | 原因 | 解决方案 |
| --- | --- | --- |
| **生产者到交换机** | 交换机不存在或路由错误 | 生产者确认机制(publisher confirm) |
| **交换机到队列** | 没有匹配的队列 | 备份交换机或死信队列 |
| **队列到消费者** | 消费者处理失败 | 手动确认 + 重试机制 |

### 自动确认 vs 手动确认对比

| 特性 | 自动确认 | 手动确认 |
| --- | --- | --- |
| **确认时机** | 收到消息立即确认 | 处理完成后手动确认 |
| **消息丢失风险** | 高(处理失败也会删除) | 低(处理失败可以重试) |
| **性能** | 高 | 较低 |
| **代码复杂度** | 简单 | 较复杂 |
| **适用场景** | 消息不重要,可丢失 | 消息重要,不能丢失 |
| **可靠性** | 低 | 高 |

---

## 3 基础用法:手动确认模式

### 完整示例:可靠的消息消费

**生产者:发送持久化消息**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.MessageProperties;

public class ReliableProducer {
    private static final String EXCHANGE_NAME = "reliable_exchange";
    private static final String QUEUE_NAME = "reliable_queue";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");

        // 2. 创建连接和通道
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. 声明持久化交换机
            channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

            // 4. 声明持久化队列
            channel.queueDeclare(QUEUE_NAME, true, false, false, null);
            //                          ↑ durable=true,队列持久化

            // 5. 绑定队列到交换机
            channel.queueBind(QUEUE_NAME, EXCHANGE_NAME, "reliable.key");

            // 6. 发送持久化消息
            String message = "重要订单消息:订单号 ORD001";
            channel.basicPublish(
                EXCHANGE_NAME,
                "reliable.key",
                MessageProperties.PERSISTENT_TEXT_PLAIN, // 消息持久化
                message.getBytes("UTF-8")
            );

            System.out.println("消息已发送: " + message);
        }
    }
}
```

**消费者:手动确认模式**

```java
import com.rabbitmq.client.*;

public class ReliableConsumer {
    private static final String QUEUE_NAME = "reliable_queue";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setUsername("guest");
        factory.setPassword("guest");

        // 2. 创建连接和通道
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 3. 声明队列(消费者也要声明,确保队列存在)
        channel.queueDeclare(QUEUE_NAME, true, false, false, null);

        System.out.println("消费者已就绪,等待接收消息...");

        // 4. 创建消息回调
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            // 获取消息内容
            String message = new String(delivery.getBody(), "UTF-8");
            // 获取消息标签(用于确认)
            long deliveryTag = delivery.getEnvelope().getDeliveryTag();

            try {
                System.out.println("收到消息: " + message);
                System.out.println("消息标签: " + deliveryTag);

                // 模拟处理过程
                processMessage(message);

                // 处理成功,发送确认
                // 参数 1:消息标签
                // 参数 2:false 表示只确认当前消息,true 表示确认所有未确认消息
                channel.basicAck(deliveryTag, false);
                System.out.println("消息已确认,从队列中删除");

            } catch (Exception e) {
                System.err.println("处理失败: " + e.getMessage());

                // 处理失败,拒绝消息
                // 参数 1:消息标签
                // 参数 2:false 表示只拒绝当前消息
                // 参数 3:true 表示重新入队,false 表示丢弃
                channel.basicNack(deliveryTag, false, true);
                System.out.println("消息已拒绝,重新入队等待重试");
            }
        };

        // 5. 开始消费(autoAck=false,手动确认)
        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});
    }

    // 模拟消息处理
    private static void processMessage(String message) throws Exception {
        // 模拟处理时间
        Thread.sleep(1000);

        // 模拟随机失败(30% 概率)
        if (Math.random() < 0.3) {
            throw new Exception("处理异常:数据库连接失败");
        }

        System.out.println("处理成功: " + message);
    }
}
```

### 运行结果

```
// 成功的场景
收到消息: 重要订单消息:订单号 ORD001
消息标签: 1
处理成功: 重要订单消息:订单号 ORD001
消息已确认,从队列中删除

// 失败的场景
收到消息: 重要订单消息:订单号 ORD001
消息标签: 1
处理失败: 处理异常:数据库连接失败
消息已拒绝,重新入队等待重试

// 重新消费
收到消息: 重要订单消息:订单号 ORD001
消息标签: 2
处理成功: 重要订单消息:订单号 ORD001
消息已确认,从队列中删除
```

---

## 4 生产者确认机制

### 为什么需要生产者确认?

生产者发送消息后,怎么知道消息是否成功到达交换机?

```java
// ❌ 问题代码:不知道消息是否到达交换机
channel.basicPublish("my_exchange", "my_key", null, message.getBytes());
System.out.println("消息已发送"); // 真的发送成功了吗?
```

问题:

- **交换机不存在**:消息会被丢弃,但生产者不知道
- **路由错误**:消息没有匹配的队列,被丢弃
- **网络问题**:消息可能没有到达 RabbitMQ

### 解决方案:Publisher Confirm 模式

RabbitMQ 提供了生产者确认机制,当消息到达交换机后,会发送一个确认给生产者。

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.ConfirmListener;

public class PublisherConfirmProducer {
    private static final String EXCHANGE_NAME = "confirm_exchange";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        // 2. 创建连接和通道
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. 声明交换机
            channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

            // 4. 开启生产者确认模式
            channel.confirmSelect();

            // 5. 添加确认监听器
            channel.addConfirmListener(new ConfirmListener() {
                // 消息成功到达交换机
                @Override
                public void handleAck(long deliveryTag, boolean multiple) {
                    System.out.println("消息确认成功,标签: " + deliveryTag);
                }

                // 消息到达交换机失败
                @Override
                public void handleNack(long deliveryTag, boolean multiple) {
                    System.err.println("消息确认失败,标签: " + deliveryTag);
                    // 可以重试发送
                }
            });

            // 6. 发送消息
            String message = "测试消息";
            channel.basicPublish(EXCHANGE_NAME, "my_key", null, message.getBytes());
            System.out.println("消息已发送: " + message);

            // 7. 等待确认(同步方式)
            if (channel.waitForConfirms()) {
                System.out.println("所有消息确认成功");
            } else {
                System.err.println("有消息确认失败");
            }
        }
    }
}
```

### 同步确认 vs 异步确认

| 特性 | 同步确认 | 异步确认 |
| --- | --- | --- |
| **实现方式** | `channel.waitForConfirms()` | `channel.addConfirmListener()` |
| **性能** | 较低(阻塞等待) | 高(非阻塞) |
| **代码复杂度** | 简单 | 较复杂 |
| **适用场景** | 少量消息,要求简单 | 大量消息,要求高性能 |

---

## 5 对比表格

### 消息确认方式对比

| 确认方式 | 方法 | 说明 |
| --- | --- | --- |
| **自动确认** | `basicConsume(queue, true, ...)` | 收到消息立即确认,可能丢失 |
| **手动确认** | `basicConsume(queue, false, ...)` | 需要手动调用 `basicAck`,可靠 |
| **手动拒绝** | `basicNack(tag, multiple, requeue)` | 拒绝消息,可以选择重新入队 |
| **单个拒绝** | `basicReject(tag, requeue)` | 拒绝单个消息 |

### 持久化配置对比

| 配置项 | 非持久化 | 持久化 |
| --- | --- | --- |
| **队列** | `queueDeclare(name, false, ...)` | `queueDeclare(name, true, ...)` |
| **消息** | `basicPublish(..., null, ...)` | `basicPublish(..., PERSISTENT_TEXT_PLAIN, ...)` |
| **RabbitMQ 重启** | 队列和消息丢失 | 队列和消息保留 |
| **性能** | 高 | 较低 |
| **适用场景** | 临时数据,可丢失 | 重要数据,不能丢失 |

### 消息丢失场景与解决方案

| 场景 | 原因 | 解决方案 |
| --- | --- | --- |
| **生产者到交换机** | 交换机不存在或路由错误 | 生产者确认(publisher confirm) |
| **交换机到队列** | 没有匹配的队列 | 备份交换机(alternate-exchange)或死信队列 |
| **队列到消费者** | 消费者处理失败 | 手动确认 + 重试机制 |
| **RabbitMQ 重启** | 队列或消息未持久化 | 队列持久化 + 消息持久化 |

---

## 6 新手常见误区

### 误区 1:"设置了队列持久化,消息就永远不会丢失"

**错!** 队列持久化只保证队列本身不丢失,不保证消息不丢失。要同时设置队列持久化和消息持久化:

```java
// ❌ 错误:只持久化队列,消息不持久化
channel.queueDeclare("my_queue", true, false, false, null);
channel.basicPublish("", "my_queue", null, message.getBytes()); // 消息不持久化

// ✅ 正确:队列和消息都持久化
channel.queueDeclare("my_queue", true, false, false, null);
channel.basicPublish("", "my_queue", 
    MessageProperties.PERSISTENT_TEXT_PLAIN, // 消息持久化
    message.getBytes());
```

### 误区 2:"自动确认性能更好,应该总是使用自动确认"

不完全是。自动确认确实性能更好,但会导致消息丢失。对于重要的业务消息,必须使用手动确认,保证消息正确处理。

选择确认模式要看业务需求:

- **自动确认**:消息不重要,可以丢失(如日志收集)
- **手动确认**:消息重要,不能丢失(如订单处理)

### 误区 3:"消息重新入队会导致无限循环"

不一定。如果消费者一直处理失败,消息会一直重新入队,形成无限循环。解决方法:

1. **设置重试次数**:记录重试次数,超过限制后丢弃
2. **使用死信队列**:处理失败的消息发到死信队列,后续人工处理
3. **延迟重试**:使用延迟队列,间隔一段时间再重试

```java
// ✅ 正确做法:限制重试次数
Map<Long, Integer> retryCount = new HashMap<>();

DeliverCallback deliverCallback = (consumerTag, delivery) -> {
    long deliveryTag = delivery.getEnvelope().getDeliveryTag();
    int count = retryCount.getOrDefault(deliveryTag, 0);

    try {
        processMessage(message);
        channel.basicAck(deliveryTag, false);
        retryCount.remove(deliveryTag); // 成功后清除计数
    } catch (Exception e) {
        if (count < 3) { // 最多重试 3 次
            retryCount.put(deliveryTag, count + 1);
            channel.basicNack(deliveryTag, false, true); // 重新入队
        } else {
            // 超过重试次数,发送到死信队列
            channel.basicReject(deliveryTag, false);
            System.err.println("消息处理失败,已发送到死信队列");
        }
    }
};
```

### 误区 4:"生产者确认可以替代消费者确认"

**错!** 生产者确认只保证消息到达交换机,不保证消息被正确处理。消费者确认保证消息被正确处理。两者是互补的,不能替代。

```
生产者 --[生产者确认]--> 交换机 --[路由]--> 队列 --[消费者确认]--> 消费者
     (保证到达交换机)                              (保证正确处理)
```

### 误区 5:"持久化会影响性能,应该避免使用"

持久化确实会影响性能,但对于重要消息,这是必要的牺牲。可以通过以下方式优化:

1. **批量确认**:不要每条消息都确认,批量确认可以提高性能
2. **异步确认**:使用异步确认,不阻塞生产者
3. **合理配置**:只对重要消息使用持久化

---

## 7 动手练习

### 练习 1:基础概念

用自己的话解释以下概念:

1. 自动确认和手动确认有什么区别?
2. 队列持久化和消息持久化有什么区别?
3. 消息可能在哪些场景下丢失?如何避免?

<details>
<summary>点击查看答案</summary>

1. **自动确认 vs 手动确认**:
   - 自动确认:收到消息立即确认,消息从队列删除,处理失败会丢失
   - 手动确认:需要手动调用 `basicAck` 确认,处理失败可以拒绝并重新入队
   - 自动确认性能好但不可靠,手动确认性能差但可靠

2. **队列持久化 vs 消息持久化**:
   - 队列持久化:保证 RabbitMQ 重启后队列还在
   - 消息持久化:保证 RabbitMQ 重启后消息还在
   - 两者都要设置才能保证消息不丢失

3. **消息丢失场景**:
   - 生产者到交换机:交换机不存在或路由错误 → 使用生产者确认
   - 交换机到队列:没有匹配的队列 → 使用备份交换机或死信队列
   - 队列到消费者:消费者处理失败 → 使用手动确认 + 重试
   - RabbitMQ 重启:队列或消息未持久化 → 使用持久化

</details>

### 练习 2:代码实现

实现一个可靠的订单处理系统:

- 生产者:发送持久化订单消息,使用生产者确认
- 消费者:使用手动确认模式,处理失败时重试(最多 3 次)
- 超过重试次数的消息发送到死信队列

<details>
<summary>点击查看答案</summary>

```java
// 生产者:使用生产者确认
public class OrderProducer {
    private static final String EXCHANGE_NAME = "order_exchange";
    private static final String QUEUE_NAME = "order_queue";

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 声明交换机和队列(持久化)
            channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);
            channel.queueDeclare(QUEUE_NAME, true, false, false, null);
            channel.queueBind(QUEUE_NAME, EXCHANGE_NAME, "order.create");

            // 开启生产者确认
            channel.confirmSelect();

            // 发送订单消息
            String orderMessage = "订单号:ORD001,金额:100";
            channel.basicPublish(
                EXCHANGE_NAME,
                "order.create",
                MessageProperties.PERSISTENT_TEXT_PLAIN,
                orderMessage.getBytes("UTF-8")
            );

            // 等待确认
            if (channel.waitForConfirms()) {
                System.out.println("订单消息发送成功: " + orderMessage);
            } else {
                System.err.println("订单消息发送失败");
            }
        }
    }
}

// 消费者:手动确认 + 重试机制
public class OrderConsumer {
    private static final String QUEUE_NAME = "order_queue";
    private static final String DLX_EXCHANGE = "dlx_exchange"; // 死信交换机
    private static Map<Long, Integer> retryCount = new HashMap<>();

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 声明死信交换机和队列
        channel.exchangeDeclare(DLX_EXCHANGE, "direct", true);
        channel.queueDeclare("dlx_queue", true, false, false, null);
        channel.queueBind("dlx_queue", DLX_EXCHANGE, "dlx.key");

        // 声明主队列,设置死信交换机
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", DLX_EXCHANGE);
        args.put("x-dead-letter-routing-key", "dlx.key");
        channel.queueDeclare(QUEUE_NAME, true, false, false, args);

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            long deliveryTag = delivery.getEnvelope().getDeliveryTag();
            String message = new String(delivery.getBody(), "UTF-8");
            int count = retryCount.getOrDefault(deliveryTag, 0);

            try {
                System.out.println("处理订单: " + message);
                processOrder(message);

                // 处理成功,确认消息
                channel.basicAck(deliveryTag, false);
                retryCount.remove(deliveryTag);
                System.out.println("订单处理成功");

            } catch (Exception e) {
                System.err.println("订单处理失败: " + e.getMessage());

                if (count < 3) {
                    // 重试次数未超过限制,重新入队
                    retryCount.put(deliveryTag, count + 1);
                    channel.basicNack(deliveryTag, false, true);
                    System.out.println("消息重新入队,第 " + (count + 1) + " 次重试");
                } else {
                    // 超过重试次数,拒绝消息(发送到死信队列)
                    channel.basicReject(deliveryTag, false);
                    retryCount.remove(deliveryTag);
                    System.err.println("超过重试次数,消息发送到死信队列");
                }
            }
        };

        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});
    }

    private static void processOrder(String message) throws Exception {
        // 模拟处理时间
        Thread.sleep(1000);

        // 模拟随机失败(50% 概率)
        if (Math.random() < 0.5) {
            throw new Exception("数据库连接失败");
        }
    }
}
```

</details>

### 练习 3(挑战):系统设计

设计一个可靠的消息系统,满足以下要求:

1. 生产者发送消息后,需要知道消息是否成功到达交换机
2. 消费者处理消息失败时,需要重试(最多 3 次)
3. 超过重试次数的消息需要保存到死信队列,后续人工处理
4. RabbitMQ 重启后,消息不能丢失
5. 需要记录每条消息的处理日志

要求:

1. 画出架构图
2. 设计队列和交换机
3. 写出关键代码

<details>
<summary>点击查看答案</summary>

**架构图:**

```
生产者 --[生产者确认]--> Direct 交换机 --> 主队列 --[手动确认]--> 消费者
                              |                    |
                              |                    --> 处理失败 --> 重试(最多3次)
                              |                              |
                              |                              --> 超过重试 --> 死信交换机 --> 死信队列
                              |
                              --> 确认失败 --> 重试发送
```

**队列和交换机设计:**

- 主交换机:`main_exchange` (Direct, 持久化)
- 主队列:`main_queue` (持久化, 设置死信交换机)
- 死信交换机:`dlx_exchange` (Direct, 持久化)
- 死信队列:`dlx_queue` (持久化)

**关键代码:**

```java
// 生产者:使用生产者确认
public class ReliableProducer {
    private static final String EXCHANGE_NAME = "main_exchange";

    public static void sendMessage(String message) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 声明交换机(持久化)
            channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

            // 开启生产者确认
            channel.confirmSelect();

            // 发送持久化消息
            channel.basicPublish(
                EXCHANGE_NAME,
                "main.key",
                MessageProperties.PERSISTENT_TEXT_PLAIN,
                message.getBytes("UTF-8")
            );

            // 等待确认
            if (channel.waitForConfirms()) {
                log("消息发送成功: " + message);
            } else {
                log("消息发送失败,重试...");
                // 重试逻辑
            }
        }
    }
}

// 消费者:手动确认 + 重试 + 死信队列
public class ReliableConsumer {
    private static final String QUEUE_NAME = "main_queue";
    private static final String DLX_EXCHANGE = "dlx_exchange";
    private static Map<Long, Integer> retryCount = new ConcurrentHashMap<>();

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 声明死信交换机和队列
        channel.exchangeDeclare(DLX_EXCHANGE, "direct", true);
        channel.queueDeclare("dlx_queue", true, false, false, null);
        channel.queueBind("dlx_queue", DLX_EXCHANGE, "dlx.key");

        // 声明主队列,设置死信交换机
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", DLX_EXCHANGE);
        args.put("x-dead-letter-routing-key", "dlx.key");
        channel.queueDeclare(QUEUE_NAME, true, false, false, args);

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            long deliveryTag = delivery.getEnvelope().getDeliveryTag();
            String message = new String(delivery.getBody(), "UTF-8");
            int count = retryCount.getOrDefault(deliveryTag, 0);

            try {
                log("开始处理消息: " + message);
                processMessage(message);

                // 处理成功
                channel.basicAck(deliveryTag, false);
                retryCount.remove(deliveryTag);
                log("消息处理成功: " + message);

            } catch (Exception e) {
                log("消息处理失败: " + e.getMessage());

                if (count < 3) {
                    retryCount.put(deliveryTag, count + 1);
                    channel.basicNack(deliveryTag, false, true);
                    log("消息重新入队,第 " + (count + 1) + " 次重试");
                } else {
                    channel.basicReject(deliveryTag, false);
                    retryCount.remove(deliveryTag);
                    log("超过重试次数,消息发送到死信队列: " + message);
                }
            }
        };

        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});
    }

    private static void log(String message) {
        System.out.println("[日志] " + message);
    }
}

// 死信队列消费者:处理失败的消息
public class DeadLetterConsumer {
    private static final String DLX_QUEUE = "dlx_queue";

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.err.println("[死信队列] 收到失败消息: " + message);
            System.err.println("[死信队列] 保存到数据库,等待人工处理");
            // 保存到数据库
            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        };

        channel.basicConsume(DLX_QUEUE, false, deliverCallback, consumerTag -> {});
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot 集成 RabbitMQ**。前面的章节我们都是用原生 Java API 操作 RabbitMQ,代码比较繁琐。Spring Boot 提供了更简洁的封装,通过 `@RabbitListener` 注解和 `RabbitTemplate` 类,可以更方便地发送和接收消息。我们会学习如何配置 Spring AMQP,实现一个完整的 Spring Boot + RabbitMQ 应用。
