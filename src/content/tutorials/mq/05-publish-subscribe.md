---
title: "第5章：发布订阅模式"
description: "使用 Fanout 交换机实现消息广播，多个消费者同时接收"
---

# 第5章：发布订阅模式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 一条消息能被多个消费者同时接收吗？
- 什么是 Fanout 交换机？
- 发布订阅模式适合什么场景？
- 和工作队列模式有什么区别？

这一章会解答这些问题。发布订阅模式让一条消息广播给所有订阅者，就像微信群发消息一样。

---

## 5.1 为什么需要发布订阅？

### 痛点分析

假设你是一个电商平台的开发者，用户下单后需要通知多个系统：

```
订单系统 --> 库存系统（扣库存）
         --> 短信系统（发短信）
         --> 积分系统（加积分）
         --> 物流系统（准备发货）
```

如果用工作队列模式：

```
订单系统 --> [订单队列] --> 只有一个消费者能收到消息
```

问题：只有一个系统能处理，其他系统收不到。

### 解决方案

使用发布订阅模式，每个系统有自己的队列：

```
                    --> [库存队列] --> 库存系统
订单系统 --> [Fanout] --> [短信队列] --> 短信系统
                    --> [积分队列] --> 积分系统
                    --> [物流队列] --> 物流系统
```

每个系统都能收到完整的订单消息，独立处理。

> 类比：微信群发消息，所有人都能收到，每个人看到的内容一样，但各自处理（有人回复，有人收藏，有人忽略）。

---

## 5.2 Fanout 交换机原理

Fanout 交换机的路由规则非常简单：**把消息广播到所有绑定到它的队列**。

```java
// 声明 Fanout 交换机
channel.exchangeDeclare("order_fanout", "fanout");
// fanout 类型忽略路由键，直接广播到所有绑定的队列
```

特点：
- 忽略路由键（routing key）
- 消息会发送到所有绑定的队列
- 每个队列的消费者都能收到消息

---

## 5.3 示例代码

### 生产者：发送订单消息

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class OrderProducer {
    // 定义 Fanout 交换机名称
    private static final String EXCHANGE_NAME = "order_fanout";

    public static void main(String[] args) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        // 2. 创建连接和通道
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. 声明 Fanout 交换机
            // 参数：交换机名称、类型（fanout）
            channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

            // 4. 准备订单消息
            String orderMessage = "订单号: 20240101001, 商品: iPhone 15, 金额: 5999";

            // 5. 发送消息到 Fanout 交换机
            // 注意：fanout 类型会忽略路由键，所以这里传空字符串也可以
            channel.basicPublish(EXCHANGE_NAME, "", null, orderMessage.getBytes("UTF-8"));
            System.out.println("生产者发送订单: " + orderMessage);
        }
    }
}
```

### 消费者A：库存系统

```java
import com.rabbitmq.client.*;

public class InventoryConsumer {
    private static final String EXCHANGE_NAME = "order_fanout";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 1. 声明 Fanout 交换机（确保交换机存在）
        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

        // 2. 创建临时队列（exclusive=true, autoDelete=true）
        // 临时队列：队列名随机生成，连接断开时自动删除
        String queueName = channel.queueDeclare().getQueue();
        System.out.println("库存系统队列: " + queueName);

        // 3. 将队列绑定到交换机
        // 参数：队列名、交换机名、路由键（fanout 忽略路由键）
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        // 4. 开始消费
        DeliverCallback callback = (consumerTag, delivery) -> {
            String order = new String(delivery.getBody(), "UTF-8");
            System.out.println("[库存系统] 收到订单，准备扣减库存: " + order);
            // 模拟处理时间
            Thread.sleep(1000);
            System.out.println("[库存系统] 库存扣减完成");
        };

        channel.basicConsume(queueName, true, callback, consumerTag -> {});
        System.out.println("[库存系统] 已启动，等待订单...");
    }
}
```

### 消费者B：短信系统

```java
import com.rabbitmq.client.*;

public class SmsConsumer {
    private static final String EXCHANGE_NAME = "order_fanout";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

        // 创建临时队列
        String queueName = channel.queueDeclare().getQueue();
        System.out.println("短信系统队列: " + queueName);

        // 绑定到交换机
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        DeliverCallback callback = (consumerTag, delivery) -> {
            String order = new String(delivery.getBody(), "UTF-8");
            System.out.println("[短信系统] 收到订单，准备发送短信: " + order);
            Thread.sleep(500);
            System.out.println("[短信系统] 短信发送完成");
        };

        channel.basicConsume(queueName, true, callback, consumerTag -> {});
        System.out.println("[短信系统] 已启动，等待订单...");
    }
}
```

### 消费者C：积分系统

```java
import com.rabbitmq.client.*;

public class PointConsumer {
    private static final String EXCHANGE_NAME = "order_fanout";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

        String queueName = channel.queueDeclare().getQueue();
        System.out.println("积分系统队列: " + queueName);

        channel.queueBind(queueName, EXCHANGE_NAME, "");

        DeliverCallback callback = (consumerTag, delivery) -> {
            String order = new String(delivery.getBody(), "UTF-8");
            System.out.println("[积分系统] 收到订单，准备增加积分: " + order);
            Thread.sleep(300);
            System.out.println("[积分系统] 积分增加完成");
        };

        channel.basicConsume(queueName, true, callback, consumerTag -> {});
        System.out.println("[积分系统] 已启动，等待订单...");
    }
}
```

### 运行测试

1. 先启动三个消费者：InventoryConsumer、SmsConsumer、PointConsumer
2. 再启动生产者：OrderProducer
3. 观察三个消费者都收到了同一条订单消息

输出示例：

```
[库存系统] 收到订单，准备扣减库存: 订单号: 20240101001, 商品: iPhone 15, 金额: 5999
[短信系统] 收到订单，准备发送短信: 订单号: 20240101001, 商品: iPhone 15, 金额: 5999
[积分系统] 收到订单，准备增加积分: 订单号: 20240101001, 商品: iPhone 15, 金额: 5999
```

---

## 5.4 临时队列 vs 持久队列

| 特性 | 临时队列 | 持久队列 |
| --- | --- | --- |
| 队列名 | 随机生成 | 手动指定 |
| 生命周期 | 连接断开自动删除 | 需要手动删除 |
| 适用场景 | 消费者临时在线 | 需要长期保存消息 |
| 声明方式 | `queueDeclare()` 无参 | `queueDeclare(name, ...)` |

```java
// 临时队列（推荐用于发布订阅）
String queueName = channel.queueDeclare().getQueue();

// 持久队列（需要指定名称和参数）
channel.queueDeclare("order_queue", true, false, false, null);
```

> 发布订阅模式通常使用临时队列，因为消费者只需要在线时接收消息，离线时的消息不需要保留。

---

## 5.5 绑定与解绑

```java
// 绑定队列到交换机
channel.queueBind(queueName, exchangeName, routingKey);

// 解绑队列
channel.queueUnbind(queueName, exchangeName, routingKey);
```

> 注意：解绑后，队列就不再收到该交换机的消息了。

---

## 5.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 发布订阅模式 | 一条消息广播给所有订阅者 |
| Fanout 交换机 | 忽略路由键，广播到所有绑定的队列 |
| 临时队列 | 随机名称，连接断开自动删除 |
| 绑定 | 队列和交换机之间的关联关系 |
| 适用场景 | 日志收集、广播通知、多系统同步 |

---

## 5.7 新手常见误区

### 误区 1："Fanout 交换机需要指定路由键"

**错！** Fanout 交换机会忽略路由键，消息会广播到所有绑定的队列。路由键参数可以传空字符串。

### 误区 2："发布订阅模式适合任务分发"

不是的。发布订阅是"广播"，所有消费者都收到相同的消息。如果是任务分发（一个任务只需要一个消费者处理），应该用工作队列模式。

### 误区 3："临时队列的消息会永久保存"

不是的。临时队列在消费者断开连接后会自动删除，队列中的消息也会丢失。如果需要持久化消息，应该使用持久队列。

---

## 5.8 动手练习

### 练习 1：基础练习

实现一个日志系统：生产者发送日志，三个消费者分别将日志写入文件、发送到邮箱、显示在控制台。

<details>
<summary>点击查看答案</summary>

```java
// 生产者
import com.rabbitmq.client.*;

public class LogProducer {
    private static final String EXCHANGE_NAME = "log_fanout";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection conn = factory.newConnection();
             Channel channel = conn.createChannel()) {

            channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

            String log = "2024-01-01 10:00:00 [INFO] 系统启动成功";
            channel.basicPublish(EXCHANGE_NAME, "", null, log.getBytes("UTF-8"));
            System.out.println("发送日志: " + log);
        }
    }
}

// 消费者A：写入文件
public class FileLogConsumer {
    private static final String EXCHANGE_NAME = "log_fanout";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection conn = factory.newConnection();
        Channel channel = conn.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

        String queueName = channel.queueDeclare().getQueue();
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        DeliverCallback callback = (consumerTag, delivery) -> {
            String log = new String(delivery.getBody(), "UTF-8");
            // 模拟写入文件
            System.out.println("[文件] 写入日志: " + log);
        };

        channel.basicConsume(queueName, true, callback, consumerTag -> {});
    }
}

// 消费者B：发送邮件
public class EmailLogConsumer {
    // 类似 FileLogConsumer，改为发送邮件逻辑
}

// 消费者C：显示在控制台
public class ConsoleLogConsumer {
    // 类似 FileLogConsumer，改为打印到控制台
}
```

</details>

### 练习 2：进阶练习

实现一个"订单通知系统"：订单创建后，通知短信、邮件、App推送三个渠道。

<details>
<summary>点击查看答案</summary>

```java
// 生产者：发送订单创建事件
import com.rabbitmq.client.*;

public class OrderEventProducer {
    private static final String EXCHANGE_NAME = "order_events";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection conn = factory.newConnection();
             Channel channel = conn.createChannel()) {

            channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

            // 发送订单创建事件
            String event = "{\"orderId\": \"20240101001\", \"event\": \"created\", \"amount\": 5999}";
            channel.basicPublish(EXCHANGE_NAME, "", null, event.getBytes("UTF-8"));
            System.out.println("发送订单事件: " + event);
        }
    }
}

// 消费者：短信通知
public class SmsNotifier {
    private static final String EXCHANGE_NAME = "order_events";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection conn = factory.newConnection();
        Channel channel = conn.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

        String queueName = channel.queueDeclare().getQueue();
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        DeliverCallback callback = (consumerTag, delivery) -> {
            String event = new String(delivery.getBody(), "UTF-8");
            System.out.println("[短信] 发送订单通知: " + event);
        };

        channel.basicConsume(queueName, true, callback, consumerTag -> {});
    }
}

// 消费者：邮件通知
public class EmailNotifier {
    // 类似 SmsNotifier
}

// 消费者：App推送
public class PushNotifier {
    // 类似 SmsNotifier
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个"动态订阅"功能：消费者可以在运行时动态绑定和解绑队列。

<details>
<summary>点击查看答案</summary>

```java
import com.rabbitmq.client.*;
import java.util.Scanner;

public class DynamicSubscriber {
    private static final String EXCHANGE_NAME = "news_fanout";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection conn = factory.newConnection();
        Channel channel = conn.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

        String queueName = channel.queueDeclare().getQueue();
        System.out.println("我的队列: " + queueName);

        // 默认绑定
        channel.queueBind(queueName, EXCHANGE_NAME, "");
        System.out.println("已订阅新闻");

        DeliverCallback callback = (consumerTag, delivery) -> {
            String news = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到新闻: " + news);
        };

        channel.basicConsume(queueName, true, callback, consumerTag -> {});

        // 命令行交互
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("输入命令 (subscribe/unsubscribe/quit):");
            String cmd = scanner.nextLine();

            if ("subscribe".equals(cmd)) {
                channel.queueBind(queueName, EXCHANGE_NAME, "");
                System.out.println("已重新订阅");
            } else if ("unsubscribe".equals(cmd)) {
                channel.queueUnbind(queueName, EXCHANGE_NAME, "");
                System.out.println("已取消订阅");
            } else if ("quit".equals(cmd)) {
                break;
            }
        }

        conn.close();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **路由模式（Direct）和主题模式（Topic）**——更灵活的消息路由方式。你可以根据消息类型精确匹配或模糊匹配，只接收你关心的消息。
