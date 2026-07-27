---
title: "第3章：简单消息收发"
description: "Hello World 示例，简单队列模式实现，生产者与消费者代码详解"
---

# 第3章：简单消息收发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么用代码实现一个简单的消息收发？
- 生产者和消费者代码怎么写？
- 消息是怎么从生产者发到消费者的？
- 默认交换机是什么？怎么用？

这一章会带你动手写出第一个完整的 RabbitMQ 程序。我们会实现最简单的"Hello World"示例，搞懂消息发送与接收的完整流程。

---

## 1 为什么需要简单队列模式？

### 痛点分析

上一章我们学了核心概念，但光有概念不够，得动手写代码。很多人学完概念后还是不知道怎么写第一个程序。

打个比方：

> 学游泳不能光看视频，得下水扑腾。简单队列模式就是消息队列的"蛙泳"——最基础、最实用的姿势。掌握了这个，后面学复杂模式就轻松了。

### 解决方案

简单队列模式（也叫"Hello World"模式）是最基础的消息模式：

```
生产者 --> [队列] --> 消费者
```

特点：
- 一个生产者
- 一个队列
- 一个消费者
- 使用默认交换机（不需要显式声明交换机）

> **一句话总结**：简单队列模式是消息队列的"入门必修课"，搞懂了这个，后面学发布订阅、路由模式就水到渠成了。

---

## 2 核心原理讲解

### 简单队列模式的工作原理

简单队列模式使用 RabbitMQ 的**默认交换机**。当你不指定交换机时，RabbitMQ 会自动使用一个名为""（空字符串）的默认交换机。

默认交换机的规则很简单：**路由键等于队列名，消息就直接发到那个队列**。

打个比方：

> 默认交换机就像一个"傻瓜快递柜"。你只需要在快递柜上写"3号柜"（队列名），快递柜就会自动把包裹放到3号柜里。不需要复杂的分拣规则，简单粗暴。

### 消息流转流程

```
生产者 --[消息, routing_key="队列名"]--> 默认交换机 --> 队列 --> 消费者
```

具体步骤：

1. **生产者** 创建消息，指定路由键为队列名
2. 消息到达 **默认交换机**（exchange=""）
3. 默认交换机根据路由键（等于队列名），把消息发到对应的 **队列**
4. **消费者** 监听队列，有消息就取出来处理

### 关键概念对比

| 概念 | 说明 | 在简单队列中的作用 |
| --- | --- | --- |
| 默认交换机 | exchange=""，RabbitMQ 内置 | 根据路由键直接转发到队列 |
| 路由键 | 生产者指定的"地址标签" | 等于队列名，消息直达队列 |
| 队列声明 | queueDeclare() | 创建队列（如果不存在） |
| 消息发送 | basicPublish() | 把消息发到默认交换机 |
| 消息消费 | basicConsume() | 监听队列，自动接收消息 |

---

## 3 基础用法：生产者代码（Java）

### 完整代码示例

```java
import com.rabbitmq.client.Channel;          // 导入 Channel 类，用于和 RabbitMQ 通信
import com.rabbitmq.client.Connection;        // 导入 Connection 类，表示与 RabbitMQ 的连接
import com.rabbitmq.client.ConnectionFactory; // 导入连接工厂，用于创建连接

public class SimpleProducer {
    // 定义队列名称常量（这个队列名就是路由键）
    private final static String QUEUE_NAME = "hello_queue";

    public static void main(String[] args) {
        // 1. 创建连接工厂（相当于"电话总机"）
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");         // 设置 RabbitMQ 服务器地址
        factory.setPort(5672);                // 设置 AMQP 协议端口（默认 5672）
        factory.setUsername("guest");         // 设置用户名
        factory.setPassword("guest");         // 设置密码

        // 2. 通过工厂创建连接（相当于"打电话"）
        // 使用 try-with-resources 语法，结束时自动关闭连接
        try (Connection connection = factory.newConnection()) {
            // 3. 通过连接创建通道（相当于"电话里的对话通道"）
            Channel channel = connection.createChannel();

            // 4. 声明队列（如果队列不存在就创建，已存在则跳过）
            // 参数说明：
            //   - queue: 队列名称
            //   - durable: 是否持久化（false = 不持久化，RabbitMQ 重启后队列消失）
            //   - exclusive: 是否独占（false = 不独占，其他连接也可以访问）
            //   - autoDelete: 是否自动删除（false = 不自动删除）
            //   - arguments: 其他参数（null 表示使用默认值）
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);

            // 5. 准备要发送的消息
            String message = "Hello, RabbitMQ!";

            // 6. 发送消息
            // 参数说明：
            //   - exchange: 交换机名称（空字符串表示使用默认交换机）
            //   - routingKey: 路由键（这里等于队列名，消息直达队列）
            //   - props: 消息属性（null 表示使用默认属性）
            //   - body: 消息内容（字节数组）
            channel.basicPublish("", QUEUE_NAME, null, message.getBytes("UTF-8"));

            // 7. 打印日志
            System.out.println("消息已发送: " + message);
        } catch (Exception e) {
            // 8. 异常处理
            e.printStackTrace();
        }
        // 程序结束后，channel 和 connection 会自动关闭（try-with-resources 的功劳）
    }
}
```

### 代码逐行解释

| 行号 | 代码 | 说明 |
| --- | --- | --- |
| 1-3 | import 语句 | 导入 RabbitMQ 客户端类 |
| 7 | QUEUE_NAME 常量 | 定义队列名称，也是路由键 |
| 11-15 | 创建连接工厂 | 配置 RabbitMQ 连接参数 |
| 19 | factory.newConnection() | 创建与 RabbitMQ 的 TCP 连接 |
| 22 | connection.createChannel() | 在连接上创建通道 |
| 30 | queueDeclare() | 声明队列（幂等操作，已存在则跳过） |
| 34 | message.getBytes("UTF-8") | 把字符串转为字节数组（RabbitMQ 只接受字节数组） |
| 40 | basicPublish() | 发送消息到默认交换机 |

> **注意**：使用默认交换机时，routingKey 必须等于队列名，否则消息会被丢弃。

---

## 4 基础用法：消费者代码（Java）

### 完整代码示例

```java
import com.rabbitmq.client.Channel;              // 导入 Channel 类
import com.rabbitmq.client.Connection;            // 导入 Connection 类
import com.rabbitmq.client.ConnectionFactory;     // 导入连接工厂
import com.rabbitmq.client.DeliverCallback;       // 导入消息回调接口

public class SimpleConsumer {
    // 定义队列名称常量（必须和生产者一致）
    private final static String QUEUE_NAME = "hello_queue";

    public static void main(String[] args) {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");             // RabbitMQ 服务器地址
        factory.setPort(5672);                    // AMQP 端口
        factory.setUsername("guest");             // 用户名
        factory.setPassword("guest");             // 密码

        try {
            // 2. 创建连接
            Connection connection = factory.newConnection();

            // 3. 创建通道
            Channel channel = connection.createChannel();

            // 4. 声明队列（消费者也要声明队列，确保队列存在）
            // 参数和生产者一样，保证队列属性一致
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);

            // 5. 创建消息回调（收到消息时执行什么逻辑）
            // DeliverCallback 是一个函数式接口，收到消息时会自动调用
            DeliverCallback deliverCallback = (consumerTag, delivery) -> {
                // consumerTag: 消费者标签（RabbitMQ 自动生成的唯一标识）
                // delivery: 消息投递对象，包含消息内容和元数据

                // 6. 从 delivery 中获取消息内容（字节数组）
                byte[] body = delivery.getBody();

                // 7. 把字节数组转为字符串（UTF-8 编码）
                String message = new String(body, "UTF-8");

                // 8. 打印收到的消息
                System.out.println("收到消息: " + message);
            };

            // 9. 开始消费消息
            // 参数说明：
            //   - queue: 要监听的队列名称
            //   - autoAck: 是否自动确认（true = 收到消息后自动告诉 RabbitMQ "我收到了"）
            //   - deliverCallback: 收到消息时的回调函数
            //   - cancelCallback: 消费被取消时的回调函数
            channel.basicConsume(QUEUE_NAME, true, deliverCallback, consumerTag -> {
                // 消费被取消时执行（比如队列被删除）
                System.out.println("消费被取消");
            });

            // 10. 打印启动日志
            System.out.println("消费者已启动，等待消息...");

            // 注意：消费者程序不会自动退出，会一直监听队列
            // 如果要退出，可以按 Ctrl+C 或关闭程序

        } catch (Exception e) {
            // 11. 异常处理
            e.printStackTrace();
        }
    }
}
```

### 代码逐行解释

| 行号 | 代码 | 说明 |
| --- | --- | --- |
| 1-4 | import 语句 | 导入 RabbitMQ 客户端类 |
| 8 | QUEUE_NAME 常量 | 队列名必须和生产者一致 |
| 12-15 | 创建连接工厂 | 配置连接参数 |
| 20 | factory.newConnection() | 创建 TCP 连接 |
| 23 | connection.createChannel() | 创建通道 |
| 27 | queueDeclare() | 声明队列（确保队列存在） |
| 32-42 | DeliverCallback 回调 | 定义收到消息时的处理逻辑 |
| 37 | delivery.getBody() | 获取消息内容（字节数组） |
| 40 | new String(body, "UTF-8") | 字节数组转字符串 |
| 51 | basicConsume() | 开始监听队列，自动接收消息 |
| 51 | autoAck=true | 自动确认模式（收到消息后自动 ACK） |

> **注意**：消费者程序会一直运行，不会自动退出。它会持续监听队列，有消息就处理。

---

## 5 基础用法：Python 版本

### 生产者代码（Python）

```python
import pika  # 导入 pika 库，这是 Python 操作 RabbitMQ 的客户端

# 1. 创建连接（连接到本地的 RabbitMQ 服务）
connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')  # 指定 RabbitMQ 地址
)

# 2. 创建通道（在连接上打开通信通道）
channel = connection.channel()

# 3. 声明队列（如果队列不存在就创建，已存在则跳过）
channel.queue_declare(queue='hello_queue')

# 4. 发送消息
# exchange='' 表示使用默认交换机
# routing_key='hello_queue' 表示消息要发到哪个队列（等于队列名）
# body 是消息内容
channel.basic_publish(
    exchange='',                # 使用默认交换机（空字符串）
    routing_key='hello_queue',  # 路由键等于队列名
    body='Hello, RabbitMQ!'     # 消息内容
)

print("消息已发送: Hello, RabbitMQ!")

# 5. 关闭连接
connection.close()
```

### 消费者代码（Python）

```python
import pika  # 导入 pika 库

# 1. 创建连接
connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')
)

# 2. 创建通道
channel = connection.channel()

# 3. 声明队列（确保队列存在）
channel.queue_declare(queue='hello_queue')

# 4. 定义消息回调函数（收到消息时执行）
def callback(ch, method, properties, body):
    """
    收到消息时的回调函数
    :param ch: 通道对象
    :param method: 方法信息（包含 delivery_tag 等）
    :param properties: 消息属性
    :param body: 消息内容（字节数组）
    """
    # 5. 把字节数组转为字符串
    message = body.decode('utf-8')

    # 6. 打印收到的消息
    print(f"收到消息: {message}")

# 7. 开始消费消息
# queue: 要监听的队列
# auto_ack=True: 自动确认模式
# on_message_callback: 收到消息时的回调函数
channel.basic_consume(
    queue='hello_queue',
    auto_ack=True,
    on_message_callback=callback
)

print("消费者已启动，等待消息...")

# 8. 开始循环监听（程序会一直运行，直到手动停止）
channel.start_consuming()
```

---

## 6 进阶用法：运行与测试

### 运行步骤

1. **先启动消费者**（保持运行）：

```bash
# 如果是 Java 项目，在 IDE 中运行 SimpleConsumer 的 main 方法
# 如果是 Python 项目，运行：
python simple_consumer.py
```

你会看到控制台输出：
```
消费者已启动，等待消息...
```

2. **再启动生产者**（发送消息）：

```bash
# 如果是 Java 项目，在 IDE 中运行 SimpleProducer 的 main 方法
# 如果是 Python 项目，运行：
python simple_producer.py
```

生产者控制台输出：
```
消息已发送: Hello, RabbitMQ!
```

消费者控制台输出：
```
收到消息: Hello, RabbitMQ!
```

### 测试多条消息

修改生产者代码，发送多条消息：

```java
// 发送 10 条消息
for (int i = 1; i <= 10; i++) {
    String message = "消息 #" + i;
    channel.basicPublish("", QUEUE_NAME, null, message.getBytes("UTF-8"));
    System.out.println("已发送: " + message);
}
```

消费者会依次收到这 10 条消息，按照先进先出（FIFO）的顺序。

---

## 7 对比表格

### 自动确认 vs 手动确认对比

| 对比项 | 自动确认（autoAck=true） | 手动确认（autoAck=false） |
| --- | --- | --- |
| 确认时机 | 收到消息后立即确认 | 处理完消息后手动调用 basicAck() |
| 消息丢失风险 | 高（处理过程中崩溃，消息就丢了） | 低（处理完才确认，崩溃会重发） |
| 代码复杂度 | 简单 | 复杂（需要手动 ACK） |
| 适用场景 | 对消息可靠性要求不高 | 对消息可靠性要求高 |
| 推荐度 | 不推荐（生产环境） | 推荐（生产环境） |

### Java vs Python 客户端对比

| 对比项 | Java 客户端 | Python 客户端 |
| --- | --- | --- |
| 库名称 | rabbitmq-java-client | pika |
| 连接方式 | ConnectionFactory + Connection | BlockingConnection |
| 通道创建 | connection.createChannel() | connection.channel() |
| 消息发送 | basicPublish() | basic_publish() |
| 消息消费 | basicConsume() + DeliverCallback | basic_consume() + callback 函数 |
| 学习难度 | 中等（面向对象风格） | 简单（函数式风格） |
| 推荐场景 | 企业级应用、Spring Boot 集成 | 脚本、快速原型、数据分析 |

---

## 8 新手常见误区

### 误区 1："消费者不需要声明队列"

**错！** 消费者也要声明队列。虽然生产者已经创建了队列，但消费者先启动时队列可能还不存在。声明队列是幂等操作（已存在则跳过），两边都声明可以保证无论谁先启动，队列都存在。

### 误区 2："routingKey 可以随便写"

不是的。使用默认交换机时，routingKey **必须等于队列名**，否则消息会被丢弃。因为默认交换机的规则就是"路由键等于队列名才转发"。

### 误区 3："autoAck=true 最安全"

不是的。autoAck=true 表示收到消息就确认，如果消费者处理消息时崩溃了，这条消息就丢了。生产环境建议用 autoAck=false，处理完手动确认。

### 误区 4："消费者程序会自动退出"

不是的。消费者程序会一直运行，不会自动退出。它会持续监听队列，有消息就处理。如果要退出，需要手动停止程序（Ctrl+C）。

### 误区 5："消息内容是字符串"

不是的。RabbitMQ 消息内容是**字节数组**（byte[]）。发送前要把字符串转为字节数组（getBytes()），接收后要把字节数组转为字符串（new String(bytes, "UTF-8")）。

---

## 9 动手练习

### 练习 1：基础练习

修改生产者代码，发送 5 条不同的消息（比如"消息 1"到"消息 5"），然后启动消费者接收这些消息。

<details>
<summary>点击查看答案</summary>

```java
// 生产者代码
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class MultiMessageProducer {
    private final static String QUEUE_NAME = "hello_queue";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.queueDeclare(QUEUE_NAME, false, false, false, null);

            // 发送 5 条消息
            for (int i = 1; i <= 5; i++) {
                String message = "消息 " + i;
                channel.basicPublish("", QUEUE_NAME, null, message.getBytes("UTF-8"));
                System.out.println("已发送: " + message);
            }
        }
    }
}
```

消费者代码不变，运行后会依次收到：
```
收到消息: 消息 1
收到消息: 消息 2
收到消息: 消息 3
收到消息: 消息 4
收到消息: 消息 5
```

</details>

### 练习 2：进阶练习

修改消费者代码，使用手动确认模式（autoAck=false），处理完消息后手动调用 basicAck() 确认。

<details>
<summary>点击查看答案</summary>

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

public class ManualAckConsumer {
    private final static String QUEUE_NAME = "hello_queue";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.queueDeclare(QUEUE_NAME, false, false, false, null);

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到消息: " + message);

            // 模拟处理时间
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            // 手动确认消息
            // deliveryTag: 消息的投递标签（每个消息都有唯一的 tag）
            // multiple: 是否批量确认（false = 只确认当前这条）
            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
            System.out.println("已确认消息");
        };

        // autoAck=false 表示手动确认模式
        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});

        System.out.println("消费者已启动（手动确认模式）...");
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个简单的"任务队列"：生产者发送 10 个任务（每个任务是一个数字），消费者接收任务并计算该数字的阶乘，然后打印结果。

<details>
<summary>点击查看答案</summary>

**生产者代码：**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class TaskProducer {
    private final static String QUEUE_NAME = "task_queue";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.queueDeclare(QUEUE_NAME, true, false, false, null);

            // 发送 10 个任务（数字 1-10）
            for (int i = 1; i <= 10; i++) {
                String task = String.valueOf(i);
                channel.basicPublish("", QUEUE_NAME, null, task.getBytes("UTF-8"));
                System.out.println("已发送任务: " + i);
            }
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

public class TaskConsumer {
    private final static String QUEUE_NAME = "task_queue";

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.queueDeclare(QUEUE_NAME, true, false, false, null);

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String task = new String(delivery.getBody(), "UTF-8");
            int number = Integer.parseInt(task);

            // 计算阶乘
            long factorial = 1;
            for (int i = 1; i <= number; i++) {
                factorial *= i;
            }

            System.out.println("任务 " + number + " 的阶乘是: " + factorial);

            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        };

        channel.basicConsume(QUEUE_NAME, false, deliverCallback, consumerTag -> {});

        System.out.println("任务消费者已启动...");
    }
}
```

运行结果：
```
任务 1 的阶乘是: 1
任务 2 的阶乘是: 2
任务 3 的阶乘是: 6
任务 4 的阶乘是: 24
任务 5 的阶乘是: 120
...
```

</details>

---

## 下一章预告

下一章我们会学习 **工作队列模式**——当一个队列有多个消费者时，消息怎么分配？什么是轮询消费？什么是公平调度？这些内容会帮你理解如何构建高并发的消息处理系统。
