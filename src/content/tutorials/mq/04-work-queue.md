---
title: "第4章：工作队列模式"
description: "任务分发、轮询消费、公平调度、多消费者场景与消息确认机制"
---

# 第4章：工作队列模式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 一个队列可以有多个消费者吗？消息怎么分配？
- 什么是轮询消费？公平吗？
- 消费者处理不过来怎么办？
- 消息确认机制是什么？为什么需要它？

这一章会带你搞懂工作队列模式。这是消息队列中最实用的模式之一，搞懂了这个，你就能构建高并发的消息处理系统。

---

## 4.1 为什么需要工作队列模式？

### 痛点分析

上一章我们学了简单队列模式：一个生产者、一个队列、一个消费者。但在实际场景中，消息量可能很大，一个消费者处理不过来。

打个比方：

> 想象一个快递分拣中心，如果只有一个分拣员，快递多了就堆成山，分拣员累死也干不完。怎么办？多招几个分拣员！但是怎么分配任务才合理？是平均分给每个人，还是谁干得快就给谁多分点？这就是工作队列要解决的问题。

### 解决方案

工作队列模式（Work Queue）允许一个队列有多个消费者，共同分担处理任务：

```
生产者 --> [队列] --> 消费者1
                  --> 消费者2
                  --> 消费者3
```

特点：
- 一个生产者
- 一个队列
- **多个消费者**（共同分担任务）
- 消息只会被一个消费者处理（不会重复）

> **一句话总结**：工作队列模式就是"人多力量大"——多个消费者一起干活，提高处理效率。

---

## 4.2 核心原理讲解

### 轮询消费（Round-Robin）

RabbitMQ 默认使用**轮询分发**策略：把消息依次分发给每个消费者，一人一条，循环往复。

打个比方：

> 就像发扑克牌，庄家从左边开始，一人发一张，发完一圈再继续。这样每个人拿到的牌数量基本相同。

### 轮询分发的特点

| 特点 | 说明 |
| --- | --- |
| 平均分配 | 每个消费者拿到的消息数量大致相同 |
| 不考虑处理能力 | 不管消费者处理得快还是慢，都平均分 |
| 简单高效 | 不需要复杂的调度算法 |

### 问题：轮询真的公平吗？

假设消费者 A 处理一条消息要 1 秒，消费者 B 处理一条消息要 5 秒。如果轮询分发：

```
消息1 --> A（1秒完成）
消息2 --> B（5秒完成）
消息3 --> A（1秒完成）
消息4 --> B（5秒完成）
...
```

结果：A 早就处理完了在闲着，B 还在苦哈哈地干活。这显然不公平！

### 公平调度（Fair Dispatch）

为了解决这个问题，RabbitMQ 提供了**公平调度**机制：通过设置 `prefetchCount`，告诉 RabbitMQ 每个消费者最多同时处理几条消息。

```java
// 设置每个消费者同时只处理 1 条消息
channel.basicQos(1);
```

这样，RabbitMQ 就不会给正在忙的消费者发新消息，只有当消费者处理完当前消息并确认后，才会发下一条。

打个比方：

> 就像餐厅的服务员，如果设置 prefetchCount=1，服务员手里只能端一盘菜。必须把菜送到客人桌上，才能去厨房端下一盘。这样就不会出现一个服务员手里堆满菜，另一个服务员闲着没事的情况。

---

## 4.3 基础用法：生产者代码

### 完整代码（Java）

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class WorkProducer {
    // 定义队列名称
    private final static String QUEUE_NAME = "work_queue";

    public static void main(String[] args) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");         // RabbitMQ 服务器地址
        factory.setPort(5672);                // AMQP 端口
        factory.setUsername("guest");         // 用户名
        factory.setPassword("guest");         // 密码

        // 2. 创建连接和通道（try-with-resources 自动关闭）
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. 声明队列（durable=true 表示持久化）
            // 持久化队列：RabbitMQ 重启后队列还在
            channel.queueDeclare(QUEUE_NAME, true, false, false, null);

            // 4. 发送 20 个任务
            for (int i = 1; i <= 20; i++) {
                // 模拟任务内容（数字越大，处理时间越长）
                String task = "任务 #" + i;

                // 5. 发送消息
                channel.basicPublish("", QUEUE_NAME, null, task.getBytes("UTF-8"));
                System.out.println("已发送: " + task);
            }

            System.out.println("所有任务已发送完毕");
        }
    }
}
```

### 代码逐行解释

| 行号 | 代码 | 说明 |
| --- | --- | --- |
| 7 | QUEUE_NAME | 定义队列名称 |
| 11-15 | 创建连接工厂 | 配置连接参数 |
| 19-20 | try-with-resources | 自动关闭连接和通道 |
| 24 | queueDeclare() | 声明持久化队列（durable=true） |
| 27-33 | for 循环 | 发送 20 个任务 |
| 30 | task 变量 | 任务内容（字符串） |
| 33 | basicPublish() | 发送消息到默认交换机 |

> **注意**：队列声明时 durable=true 表示持久化，RabbitMQ 重启后队列还在。但消息本身也要设置持久化才会保存到磁盘。

---

## 4.4 基础用法：消费者代码（轮询模式）

### 完整代码（Java）

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

public class WorkConsumer {
    private final static String QUEUE_NAME = "work_queue";

    public static void main(String[] args) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        // 2. 创建连接
        Connection connection = factory.newConnection();

        // 3. 创建通道
        Channel channel = connection.createChannel();

        // 4. 声明队列（和生产者一致）
        channel.queueDeclare(QUEUE_NAME, true, false, false, null);

        // 5. 创建消息回调
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            // 6. 获取消息内容
            String task = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到任务: " + task);

            // 7. 模拟处理时间（根据任务内容中的数字决定）
            // 比如"任务 #5"就处理 5 秒
            int sleepTime = extractNumber(task) * 1000;
            try {
                Thread.sleep(sleepTime);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.println("处理完成: " + task + "（耗时 " + sleepTime / 1000 + " 秒）");

            // 8. 手动确认消息
            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        };

        // 9. 开始消费（autoAck=false 表示手动确认）
        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});

        System.out.println("消费者已启动，等待任务...");
    }

    // 辅助方法：从任务字符串中提取数字
    private static int extractNumber(String task) {
        // "任务 #5" -> 5
        String numStr = task.replaceAll("[^0-9]", "");
        return numStr.isEmpty() ? 1 : Integer.parseInt(numStr);
    }
}
```

### 代码逐行解释

| 行号 | 代码 | 说明 |
| --- | --- | --- |
| 7 | QUEUE_NAME | 队列名称（和生产者一致） |
| 12-14 | 创建连接工厂 | 配置连接参数 |
| 17 | factory.newConnection() | 创建 TCP 连接 |
| 20 | connection.createChannel() | 创建通道 |
| 23 | queueDeclare() | 声明持久化队列 |
| 26-42 | DeliverCallback | 定义消息处理逻辑 |
| 29 | delivery.getBody() | 获取消息内容 |
| 33-38 | Thread.sleep() | 模拟处理时间 |
| 41 | basicAck() | 手动确认消息 |
| 45 | basicConsume(autoAck=false) | 手动确认模式 |

> **注意**：autoAck=false 时必须手动调用 basicAck()，否则消息会一直停留在"未确认"状态。

---

## 4.5 进阶用法：公平调度

### 问题：轮询不公平

启动两个消费者（WorkConsumer1 和 WorkConsumer2），然后运行生产者发送 20 个任务。

你会发现：
- 消费者 1 和消费者 2 各收到 10 个任务
- 但消费者 1 可能早就处理完了，消费者 2 还在苦哈哈地干活

### 解决方案：设置 prefetchCount

修改消费者代码，添加公平调度配置：

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

public class FairWorkConsumer {
    private final static String QUEUE_NAME = "work_queue";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.queueDeclare(QUEUE_NAME, true, false, false, null);

        // 【关键】设置公平调度：每个消费者同时只处理 1 条消息
        // prefetchCount=1 表示：RabbitMQ 给这个消费者发 1 条消息后，
        // 必须等消费者确认（basicAck）后，才会发下一条
        channel.basicQos(1);

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String task = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到任务: " + task);

            int sleepTime = extractNumber(task) * 1000;
            try {
                Thread.sleep(sleepTime);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.println("处理完成: " + task);

            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        };

        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});

        System.out.println("公平调度消费者已启动...");
    }

    private static int extractNumber(String task) {
        String numStr = task.replaceAll("[^0-9]", "");
        return numStr.isEmpty() ? 1 : Integer.parseInt(numStr);
    }
}
```

### 公平调度的效果

设置 prefetchCount=1 后：
- 消费者 A 处理完一条消息后，才会收到下一条
- 消费者 B 处理得快，就会收到更多消息
- 消费者 A 处理得慢，收到的消息就少

这样就能根据消费者的实际处理能力来分配任务，真正实现"能者多劳"。

---

## 4.6 消息确认机制详解

### 什么是消息确认？

消息确认（ACK）是消费者告诉 RabbitMQ "我已经收到并处理完这条消息了"。

### 两种确认模式

| 确认模式 | 说明 | 优缺点 |
| --- | --- | --- |
| 自动确认（autoAck=true） | 收到消息后立即确认 | 简单，但消息可能丢失 |
| 手动确认（autoAck=false） | 处理完后手动调用 basicAck() | 可靠，但代码复杂 |

### 自动确认的风险

```java
// ❌ 自动确认：收到消息就确认
channel.basicConsume(QUEUE_NAME, true, deliverCallback, consumerTag -> {});
```

如果消费者收到消息后，还没处理完就崩溃了，这条消息就丢了。因为 RabbitMQ 以为消费者已经处理完了。

### 手动确认的正确做法

```java
// ✅ 手动确认：处理完才确认
channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});

DeliverCallback deliverCallback = (consumerTag, delivery) -> {
    String task = new String(delivery.getBody(), "UTF-8");
    
    // 处理消息
    processTask(task);
    
    // 处理完成后，手动确认
    channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
};
```

如果消费者处理消息时崩溃了，RabbitMQ 会认为这条消息没处理完，会重新发给其他消费者。

### 消息确认的生命周期

```
生产者发送消息 --> 队列存储 --> 推送给消费者 --> 消费者处理 --> 消费者确认（basicAck）--> 从队列删除
```

如果消费者崩溃（没来得及确认）：

```
生产者发送消息 --> 队列存储 --> 推送给消费者 --> 消费者崩溃 --> RabbitMQ 等待确认超时 --> 重新入队 --> 推送给其他消费者
```

---

## 4.7 对比表格

### 轮询分发 vs 公平调度对比

| 对比项 | 轮询分发（默认） | 公平调度（prefetchCount=1） |
| --- | --- | --- |
| 分配策略 | 平均分配，一人一条 | 能者多劳，忙的不发 |
| 公平性 | 不公平（不考虑处理能力） | 公平（根据实际处理能力） |
| 代码复杂度 | 简单（不需要额外配置） | 需要设置 basicQos() |
| 适用场景 | 消费者处理能力相近 | 消费者处理能力差异大 |
| 推荐度 | 一般 | 推荐（生产环境） |

### 自动确认 vs 手动确认对比

| 对比项 | 自动确认（autoAck=true） | 手动确认（autoAck=false） |
| --- | --- | --- |
| 确认时机 | 收到消息后立即确认 | 处理完后手动确认 |
| 消息丢失风险 | 高（崩溃就丢） | 低（崩溃会重发） |
| 代码复杂度 | 简单 | 需要调用 basicAck() |
| 性能 | 略高（不需要等待确认） | 略低（需要等待确认） |
| 推荐度 | 不推荐（生产环境） | 推荐（生产环境） |

---

## 4.8 新手常见误区

### 误区 1："轮询分发最公平"

**错！** 轮询分发只是"数量公平"，不是"时间公平"。如果消费者处理能力不同，轮询反而会导致忙的忙死、闲的闲死。生产环境建议用公平调度（prefetchCount=1）。

### 误区 2："autoAck=true 最安全"

不是的。autoAck=true 表示收到消息就确认，如果处理过程中崩溃，消息就丢了。生产环境建议用 autoAck=false，处理完手动确认。

### 误区 3："prefetchCount 越大越好"

不是的。prefetchCount 太大会导致消费者积压太多消息，内存占用高。prefetchCount=1 是最保守的设置，适合处理时间差异大的场景。如果消费者处理能力相近，可以适当调大。

### 误区 4："消费者崩溃后消息就丢了"

不是的。如果使用手动确认（autoAck=false），消费者崩溃后消息会重新入队，发给其他消费者。只有 autoAck=true 时，消息才会丢失。

### 误区 5："一个队列只能有一个消费者"

不是的。一个队列可以有多个消费者，消息会被分发给不同的消费者处理。这就是工作队列模式。

---

## 4.9 动手练习

### 练习 1：基础练习

启动两个消费者（WorkConsumer1 和 WorkConsumer2），然后运行生产者发送 10 个任务。观察两个消费者分别收到了多少任务。

<details>
<summary>点击查看答案</summary>

**步骤：**

1. 先启动 WorkConsumer1（保持运行）
2. 再启动 WorkConsumer2（保持运行）
3. 运行 WorkProducer 发送 10 个任务

**观察结果：**

默认情况下（轮询分发），两个消费者各收到 5 个任务：

```
WorkConsumer1 输出：
收到任务: 任务 #1
收到任务: 任务 #3
收到任务: 任务 #5
收到任务: 任务 #7
收到任务: 任务 #9

WorkConsumer2 输出：
收到任务: 任务 #2
收到任务: 任务 #4
收到任务: 任务 #6
收到任务: 任务 #8
收到任务: 任务 #10
```

</details>

### 练习 2：进阶练习

修改消费者代码，添加公平调度配置（prefetchCount=1），然后重新运行练习 1。观察消息分配是否更合理。

<details>
<summary>点击查看答案</summary>

**修改消费者代码：**

```java
// 在 basicConsume 之前添加
channel.basicQos(1);  // 每次只处理 1 条消息
```

**运行结果：**

设置 prefetchCount=1 后，处理得快的消费者会收到更多消息。

假设消费者 1 处理得快（每个任务 1 秒），消费者 2 处理得慢（每个任务 3 秒）：

```
消费者 1 输出：
收到任务: 任务 #1
处理完成: 任务 #1
收到任务: 任务 #2
处理完成: 任务 #2
收到任务: 任务 #4
处理完成: 任务 #4
收到任务: 任务 #6
...

消费者 2 输出：
收到任务: 任务 #3
处理完成: 任务 #3（耗时 3 秒）
收到任务: 任务 #5
处理完成: 任务 #5（耗时 3 秒）
...
```

可以看到，消费者 1 处理了更多任务，因为它处理得快。

</details>

### 练习 3（挑战）：综合练习

实现一个"图片处理系统"：
- 生产者发送 20 个图片处理任务（每个任务包含图片名称和处理时间）
- 启动 3 个消费者，分别处理图片（模拟不同的处理速度）
- 使用公平调度，确保消息分配合理
- 使用手动确认，确保消息不丢失

<details>
<summary>点击查看答案</summary>

**生产者代码：**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class ImageProducer {
    private final static String QUEUE_NAME = "image_queue";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.queueDeclare(QUEUE_NAME, true, false, false, null);

            // 发送 20 个图片处理任务
            String[] images = {"photo1.jpg", "photo2.png", "photo3.gif", "photo4.bmp", "photo5.tiff"};
            int[] times = {2, 5, 1, 3, 4};  // 处理时间（秒）

            for (int i = 0; i < 20; i++) {
                String image = images[i % images.length];
                int time = times[i % times.length];
                String task = image + "|" + time;

                channel.basicPublish("", QUEUE_NAME, null, task.getBytes("UTF-8"));
                System.out.println("已发送: " + task);
            }

            System.out.println("所有图片任务已发送");
        }
    }
}
```

**消费者代码：**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

public class ImageConsumer {
    private final static String QUEUE_NAME = "image_queue";
    private final static String CONSUMER_NAME;

    static {
        // 给每个消费者起个名字
        CONSUMER_NAME = "Consumer-" + (int) (Math.random() * 1000);
    }

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.queueDeclare(QUEUE_NAME, true, false, false, null);

        // 公平调度：每次只处理 1 条
        channel.basicQos(1);

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String task = new String(delivery.getBody(), "UTF-8");
            String[] parts = task.split("\\|");
            String image = parts[0];
            int time = Integer.parseInt(parts[1]);

            System.out.println("[" + CONSUMER_NAME + "] 开始处理: " + image);

            try {
                Thread.sleep(time * 1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.println("[" + CONSUMER_NAME + "] 处理完成: " + image + "（耗时 " + time + " 秒）");

            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        };

        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});

        System.out.println("[" + CONSUMER_NAME + "] 已启动，等待图片任务...");
    }
}
```

**运行步骤：**

1. 启动 3 个 ImageConsumer（保持运行）
2. 运行 ImageProducer 发送 20 个任务
3. 观察 3 个消费者的处理情况

**预期结果：**

3 个消费者会根据各自的处理速度分担任务，处理得快的消费者会处理更多任务。

</details>

---

## 下一章预告

下一章我们会学习 **发布订阅模式**——使用 Fanout 交换机实现消息广播。一个生产者发送消息，多个消费者都能收到。这在工作队列模式的基础上，实现了"一对多"的消息分发。
