---
title: "第6章:路由模式与主题模式"
description: "学习 Direct 交换机和 Topic 交换机的使用,掌握路由键设计和通配符订阅"
---

# 第6章:路由模式与主题模式

## 本章导读

在学这一章之前,你可能会有这些疑问:

- Direct 交换机和 Topic 交换机有什么区别?
- 路由键应该怎么设计才合理?
- Topic 交换机的通配符 `*` 和 `#` 怎么用?
- 什么场景用 Direct,什么场景用 Topic?

这一章会解答这些问题。我们会学习两种交换机的路由规则,通过实际代码实现订单处理和日志分级系统。

---

## 6.1 为什么需要路由模式?

### 痛点分析

上一章我们学了 Fanout 交换机,它能广播消息到所有队列。但实际业务中,我们往往需要更精细的控制:

场景:电商系统的订单处理

- 普通订单:发给普通处理队列
- VIP 订单:发给优先处理队列
- 海外订单:发给国际物流队列

如果用 Fanout 交换机:

```java
// ❌ 错误做法:所有订单都广播给所有消费者
channel.exchangeDeclare("order_fanout", "fanout");
channel.basicPublish("order_fanout", "", null, message.getBytes());
// 结果:普通处理队列也收到了海外订单,国际物流队列也收到了普通订单
```

问题很明显:

- **无法精确投递**:所有消费者都收到所有消息
- **资源浪费**:消费者要过滤不属于自己的消息
- **逻辑混乱**:不同类型的订单混在一起处理

打个比方:

> Fanout 交换机就像在小区广播,所有住户都能听到。但快递送货时,需要根据门牌号(路由键)精确投递到对应的住户。Direct 交换机就是这样的"快递员"。

### 解决方案

使用 Direct 交换机实现精确路由:

```java
// ✅ 正确做法:根据订单类型路由到不同队列
channel.exchangeDeclare("order_direct", "direct");
channel.basicPublish("order_direct", "order.normal", null, normalOrder.getBytes());
channel.basicPublish("order_direct", "order.vip", null, vipOrder.getBytes());
channel.basicPublish("order_direct", "order.overseas", null, overseasOrder.getBytes());
```

> **一句话总结**:Direct 交换机根据路由键精确匹配,消息只去该去的队列。

---

## 6.2 Direct 交换机:精确路由

### 工作原理

Direct 交换机的路由规则:**路由键完全匹配**。

如果队列绑定的路由键是 `order.vip`,那么只有路由键为 `order.vip` 的消息才会进入这个队列。

打个比方:

> Direct 交换机就像快递分拣柜。每个格子(队列)都有一个编号(路由键),快递员(交换机)看到包裹上的编号,直接放到对应的格子里。

### 代码示例:订单处理系统

**生产者:根据订单类型发送**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class OrderProducer {
    // 定义 Direct 交换机名称
    private static final String EXCHANGE_NAME = "order_direct";

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

            // 3. 声明 Direct 交换机
            channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

            // 4. 发送普通订单
            String normalOrder = "订单号:ORD001,类型:普通,金额:100";
            channel.basicPublish(
                EXCHANGE_NAME,
                "order.normal",  // 路由键:普通订单
                null,
                normalOrder.getBytes("UTF-8")
            );
            System.out.println("发送普通订单: " + normalOrder);

            // 5. 发送 VIP 订单
            String vipOrder = "订单号:ORD002,类型:VIP,金额:1000";
            channel.basicPublish(
                EXCHANGE_NAME,
                "order.vip",  // 路由键:VIP 订单
                null,
                vipOrder.getBytes("UTF-8")
            );
            System.out.println("发送 VIP 订单: " + vipOrder);

            // 6. 发送海外订单
            String overseasOrder = "订单号:ORD003,类型:海外,金额:500";
            channel.basicPublish(
                EXCHANGE_NAME,
                "order.overseas",  // 路由键:海外订单
                null,
                overseasOrder.getBytes("UTF-8")
            );
            System.out.println("发送海外订单: " + overseasOrder);
        }
    }
}
```

**消费者 1:普通订单处理**

```java
import com.rabbitmq.client.*;

public class NormalOrderConsumer {
    private static final String EXCHANGE_NAME = "order_direct";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 2. 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

        // 3. 声明队列
        String queueName = "normal_order_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 4. 绑定队列到交换机,指定路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "order.normal");

        System.out.println("普通订单处理器已就绪...");

        // 5. 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("[普通订单处理] 收到: " + message);
            System.out.println("[普通订单处理] 使用标准流程处理");
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

**消费者 2:VIP 订单处理**

```java
import com.rabbitmq.client.*;

public class VipOrderConsumer {
    private static final String EXCHANGE_NAME = "order_direct";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 2. 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

        // 3. 声明队列
        String queueName = "vip_order_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 4. 绑定队列到交换机,指定路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "order.vip");

        System.out.println("VIP 订单处理器已就绪...");

        // 5. 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("[VIP 订单处理] 收到: " + message);
            System.out.println("[VIP 订单处理] 使用优先流程处理,专人跟进");
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

**消费者 3:海外订单处理**

```java
import com.rabbitmq.client.*;

public class OverseasOrderConsumer {
    private static final String EXCHANGE_NAME = "order_direct";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 2. 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, "direct", true);

        // 3. 声明队列
        String queueName = "overseas_order_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 4. 绑定队列到交换机,指定路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "order.overseas");

        System.out.println("海外订单处理器已就绪...");

        // 5. 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("[海外订单处理] 收到: " + message);
            System.out.println("[海外订单处理] 转交国际物流处理");
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

### 运行结果

```
// NormalOrderConsumer 控制台
[普通订单处理] 收到: 订单号:ORD001,类型:普通,金额:100
[普通订单处理] 使用标准流程处理

// VipOrderConsumer 控制台
[VIP 订单处理] 收到: 订单号:ORD002,类型:VIP,金额:1000
[VIP 订单处理] 使用优先流程处理,专人跟进

// OverseasOrderConsumer 控制台
[海外订单处理] 收到: 订单号:ORD003,类型:海外,金额:500
[海外订单处理] 转交国际物流处理
```

每个消费者只收到自己关心的订单类型!

---

## 6.3 Topic 交换机:灵活订阅

### 为什么需要 Topic 交换机?

Direct 交换机虽然能精确匹配,但不够灵活。

场景:日志系统

- 日志路由键格式:`日志级别.模块.子模块`
- 例如:`error.order.payment`、`info.user.login`

需求:

- 告警服务:只关心所有 error 级别的日志
- 订单服务:关心所有订单相关的日志(不管级别)
- 监控服务:关心所有日志

如果用 Direct 交换机:

```java
// ❌ 错误做法:需要绑定所有可能的路由键
channel.queueBind(queue, "log_direct", "error.order.payment");
channel.queueBind(queue, "log_direct", "error.order.refund");
channel.queueBind(queue, "log_direct", "error.user.login");
// ... 还有无数种组合,根本绑不完!
```

问题:

- **绑定太多**:需要为每种可能的路由键创建绑定
- **不灵活**:新增模块时,要修改所有消费者的绑定
- **维护困难**:路由键设计不合理时,系统难以扩展

打个比方:

> Direct 交换机就像精确的 GPS 导航,必须输入完整地址。Topic 交换机就像模糊搜索,输入"北京餐厅"就能找到所有北京的餐厅,不用输入完整地址。

### Topic 交换机工作原理

Topic 交换机支持**模式匹配**。路由键必须是用点号 `.` 分隔的多个单词,例如:`order.create.success`。

绑定键也支持通配符:

- `*`(星号):匹配**一个**单词
- `#`(井号):匹配**零个或多个**单词

示例:

| 路由键 | 绑定键 | 是否匹配 | 说明 |
| --- | --- | --- | --- |
| `order.create.success` | `order.*.*` | ✅ 匹配 | `*` 匹配一个单词 |
| `order.create.success` | `order.#` | ✅ 匹配 | `#` 匹配多个单词 |
| `order.create.success` | `*.create.*` | ✅ 匹配 | 第一个 `*` 匹配 order,第二个匹配 success |
| `order.create.success` | `order.create` | ❌ 不匹配 | 必须完全匹配 |
| `order.create.success` | `#` | ✅ 匹配 | `#` 匹配所有 |
| `error.order` | `error.*` | ✅ 匹配 | `*` 匹配 order |
| `error.order.payment` | `error.*` | ❌ 不匹配 | `*` 只能匹配一个单词 |
| `error.order.payment` | `error.#` | ✅ 匹配 | `#` 匹配多个单词 |

### 代码示例:日志分级系统

**生产者:发送不同级别的日志**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class LogProducer {
    // 定义 Topic 交换机名称
    private static final String EXCHANGE_NAME = "log_topic";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        // 2. 创建连接和通道
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. 声明 Topic 交换机
            channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);

            // 4. 发送不同模块、不同级别的日志
            String[] logMessages = {
                "error.order.payment",      // 订单支付错误
                "error.user.login",         // 用户登录错误
                "warn.order.stock",         // 库存警告
                "info.order.create",        // 订单创建信息
                "info.user.register",       // 用户注册信息
                "debug.system.startup"      // 系统启动调试
            };

            for (String logKey : logMessages) {
                String message = "日志消息: " + logKey;
                channel.basicPublish(
                    EXCHANGE_NAME,
                    logKey,  // 路由键:日志级别.模块.子模块
                    null,
                    message.getBytes("UTF-8")
                );
                System.out.println("发送日志: " + logKey);
            }
        }
    }
}
```

**消费者 1:告警服务(只关心 error 级别)**

```java
import com.rabbitmq.client.*;

public class AlertConsumer {
    private static final String EXCHANGE_NAME = "log_topic";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 2. 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);

        // 3. 声明队列
        String queueName = "alert_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 4. 绑定队列,使用通配符匹配所有 error 级别的日志
        // error.# 表示匹配所有以 error. 开头的路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "error.#");

        System.out.println("告警服务已就绪,只接收 error 级别日志...");

        // 5. 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            String routingKey = delivery.getEnvelope().getRoutingKey();
            System.out.println("[告警服务] 收到错误日志: " + routingKey);
            System.out.println("[告警服务] 内容: " + message);
            System.out.println("[告警服务] 发送告警通知!");
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

**消费者 2:订单服务(关心所有订单相关日志)**

```java
import com.rabbitmq.client.*;

public class OrderLogConsumer {
    private static final String EXCHANGE_NAME = "log_topic";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 2. 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);

        // 3. 声明队列
        String queueName = "order_log_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 4. 绑定队列,匹配所有订单相关的日志
        // *.order.* 表示匹配第二个单词是 order 的路由键
        // 例如:error.order.payment、info.order.create 都会匹配
        channel.queueBind(queueName, EXCHANGE_NAME, "*.order.*");

        System.out.println("订单日志服务已就绪,接收所有订单相关日志...");

        // 5. 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            String routingKey = delivery.getEnvelope().getRoutingKey();
            System.out.println("[订单日志] 收到: " + routingKey);
            System.out.println("[订单日志] 内容: " + message);
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

**消费者 3:监控服务(关心所有日志)**

```java
import com.rabbitmq.client.*;

public class MonitorConsumer {
    private static final String EXCHANGE_NAME = "log_topic";

    public static void main(String[] argv) throws Exception {
        // 1. 创建连接
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // 2. 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);

        // 3. 声明队列
        String queueName = "monitor_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 4. 绑定队列,# 匹配所有路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "#");

        System.out.println("监控服务已就绪,接收所有日志...");

        // 5. 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            String routingKey = delivery.getEnvelope().getRoutingKey();
            System.out.println("[监控服务] 收到: " + routingKey);
            System.out.println("[监控服务] 内容: " + message);
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

### 运行结果

```
// AlertConsumer 控制台(只收到 error 级别)
[告警服务] 收到错误日志: error.order.payment
[告警服务] 内容: 日志消息: error.order.payment
[告警服务] 发送告警通知!
[告警服务] 收到错误日志: error.user.login
[告警服务] 内容: 日志消息: error.user.login
[告警服务] 发送告警通知!

// OrderLogConsumer 控制台(收到所有订单相关)
[订单日志] 收到: error.order.payment
[订单日志] 内容: 日志消息: error.order.payment
[订单日志] 收到: warn.order.stock
[订单日志] 内容: 日志消息: warn.order.stock
[订单日志] 收到: info.order.create
[订单日志] 内容: 日志消息: info.order.create

// MonitorConsumer 控制台(收到所有日志)
[监控服务] 收到: error.order.payment
[监控服务] 收到: error.user.login
[监控服务] 收到: warn.order.stock
[监控服务] 收到: info.order.create
[监控服务] 收到: info.user.register
[监控服务] 收到: debug.system.startup
```

---

## 6.4 对比表格

### Direct vs Topic 交换机对比

| 特性 | Direct 交换机 | Topic 交换机 |
| --- | --- | --- |
| **路由规则** | 路由键完全匹配 | 路由键模式匹配(通配符) |
| **灵活性** | 低(必须精确匹配) | 高(支持模糊匹配) |
| **性能** | 高(简单匹配) | 较低(需要模式匹配) |
| **适用场景** | 精确路由,如订单类型分发 | 灵活订阅,如日志分级 |
| **路由键格式** | 任意字符串 | 用 `.` 分隔的多个单词 |
| **绑定键** | 精确字符串 | 支持 `*` 和 `#` 通配符 |
| **复杂度** | 简单 | 较复杂 |

### 通配符对比

| 通配符 | 含义 | 示例 |
| --- | --- | --- |
| `*` | 匹配**一个**单词 | `*.order.*` 匹配 `info.order.create` |
| `#` | 匹配**零个或多个**单词 | `error.#` 匹配 `error.order.payment` |
| `#` | 匹配所有 | `#` 匹配任何路由键 |

### 交换机类型选择指南

| 场景 | 推荐交换机 | 原因 |
| --- | --- | --- |
| 点对点精确投递 | Direct | 路由键精确匹配,性能好 |
| 广播通知 | Fanout | 忽略路由键,广播到所有队列 |
| 灵活订阅 | Topic | 支持通配符,灵活匹配 |
| 复杂条件路由 | Headers | 根据消息头属性路由(少用) |

---

## 6.5 路由键设计最佳实践

### 设计原则

1. **语义清晰**:路由键要有明确的含义,见名知意
2. **层次分明**:用 `.` 分隔不同层级,如 `级别.模块.操作`
3. **长度适中**:不要太长,也不要太短
4. **统一规范**:整个项目保持一致的命名规范

### 常见设计模式

**模式 1:级别.模块.操作**

```
error.order.payment    // 订单支付错误
info.user.login        // 用户登录信息
warn.stock.low         // 库存警告
```

适用场景:日志系统

**模式 2:业务.实体.事件**

```
order.create.success   // 订单创建成功
order.cancel.failed    // 订单取消失败
user.register.success  // 用户注册成功
```

适用场景:事件驱动系统

**模式 3:地区.业务.类型**

```
cn.order.normal        // 中国普通订单
us.order.vip           // 美国 VIP 订单
uk.order.overseas      // 英国海外订单
```

适用场景:多地区业务系统

### 设计示例

```java
// ✅ 好的设计:层次清晰,语义明确
channel.basicPublish("log_topic", "error.order.payment", null, message.getBytes());
channel.basicPublish("log_topic", "info.user.login", null, message.getBytes());

// ❌ 不好的设计:语义不清
channel.basicPublish("log_topic", "err", null, message.getBytes());
channel.basicPublish("log_topic", "a.b.c.d.e.f", null, message.getBytes());

// ❌ 不好的设计:没有统一规范
channel.basicPublish("log_topic", "orderError", null, message.getBytes());
channel.basicPublish("log_topic", "user_login_info", null, message.getBytes());
```

---

## 6.6 新手常见误区

### 误区 1:"Topic 交换机的 `*` 可以匹配多个单词"

**错!** `*` 只能匹配**一个**单词。如果要匹配多个单词,必须用 `#`。

```java
// ❌ 错误理解:以为 * 可以匹配多个单词
// 绑定键: error.*
// 路由键: error.order.payment
// 结果:不匹配!因为 * 只能匹配一个单词

// ✅ 正确做法:使用 # 匹配多个单词
// 绑定键: error.#
// 路由键: error.order.payment
// 结果:匹配!# 可以匹配零个或多个单词
```

### 误区 2:"路由键可以包含特殊字符"

**不建议!** 路由键应该只包含字母、数字和下划线,用 `.` 分隔。不要使用特殊字符,如 `@`、`#`、`$` 等,这些字符在通配符模式中有特殊含义。

```java
// ❌ 不好的设计:包含特殊字符
channel.basicPublish("log_topic", "error@order#payment", null, message.getBytes());

// ✅ 好的设计:只用字母和点号
channel.basicPublish("log_topic", "error.order.payment", null, message.getBytes());
```

### 误区 3:"Topic 交换机可以替代 Direct 交换机"

虽然 Topic 交换机更灵活,但不意味着可以完全替代 Direct 交换机。

- Direct 交换机性能更好(简单匹配)
- Direct 交换机逻辑更清晰(精确匹配)
- Topic 交换机适合需要灵活订阅的场景

选择交换机要看具体需求,不要为了灵活而牺牲性能。

### 误区 4:"一个队列只能绑定一个路由键"

**错!** 一个队列可以绑定多个路由键,这样队列可以接收多种类型的消息。

```java
// ✅ 一个队列绑定多个路由键
channel.queueBind("order_queue", "order_direct", "order.normal");
channel.queueBind("order_queue", "order_direct", "order.vip");
// 这样 order_queue 可以接收普通订单和 VIP 订单
```

### 误区 5:"路由键越长越好"

不是的。路由键太长会增加匹配开销,降低性能。路由键应该简洁明了,既能表达含义,又不要过长。

```java
// ❌ 路由键过长
channel.basicPublish("log_topic", "error.order.payment.creditcard.timeout.retry", null, message.getBytes());

// ✅ 路由键简洁明了
channel.basicPublish("log_topic", "error.order.payment", null, message.getBytes());
```

---

## 6.7 动手练习

### 练习 1:基础概念

用自己的话解释以下概念:

1. Direct 交换机和 Topic 交换机的主要区别是什么?
2. Topic 交换机的通配符 `*` 和 `#` 分别表示什么?
3. 路由键设计应该遵循什么原则?

<details>
<summary>点击查看答案</summary>

1. 主要区别:
   - Direct 交换机:路由键必须完全匹配,精确路由
   - Topic 交换机:路由键支持模式匹配(通配符),灵活订阅
   - Direct 性能更好,Topic 更灵活

2. 通配符含义:
   - `*`:匹配一个单词
   - `#`:匹配零个或多个单词
   - 例如:`*.order.*` 匹配 `info.order.create`,`error.#` 匹配 `error.order.payment`

3. 路由键设计原则:
   - 语义清晰:见名知意
   - 层次分明:用 `.` 分隔不同层级
   - 长度适中:不要太长也不要太短
   - 统一规范:整个项目保持一致

</details>

### 练习 2:代码实现

实现一个多租户通知系统:

- 路由键格式:`租户ID.模块.事件`
- 例如:`tenant1.order.create`、`tenant2.user.login`
- 租户 1 的通知服务:只接收 tenant1 的所有通知
- 租户 2 的通知服务:只接收 tenant2 的所有通知
- 全局监控服务:接收所有租户的通知

要求使用 Topic 交换机实现。

<details>
<summary>点击查看答案</summary>

```java
// 生产者:发送不同租户的通知
public class TenantNotificationProducer {
    private static final String EXCHANGE_NAME = "tenant_topic";

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);

            // 发送租户 1 的通知
            String msg1 = "租户1订单创建";
            channel.basicPublish(EXCHANGE_NAME, "tenant1.order.create", null, msg1.getBytes());

            // 发送租户 2 的通知
            String msg2 = "租户2用户登录";
            channel.basicPublish(EXCHANGE_NAME, "tenant2.user.login", null, msg2.getBytes());

            System.out.println("通知已发送");
        }
    }
}

// 消费者 1:租户 1 的通知服务
public class Tenant1Consumer {
    private static final String EXCHANGE_NAME = "tenant_topic";

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);
        String queueName = "tenant1_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 绑定键:tenant1.# 匹配所有 tenant1 开头的路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "tenant1.#");

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            String routingKey = delivery.getEnvelope().getRoutingKey();
            System.out.println("[租户1] 收到: " + routingKey + " - " + message);
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}

// 消费者 2:租户 2 的通知服务
public class Tenant2Consumer {
    private static final String EXCHANGE_NAME = "tenant_topic";

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);
        String queueName = "tenant2_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 绑定键:tenant2.# 匹配所有 tenant2 开头的路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "tenant2.#");

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            String routingKey = delivery.getEnvelope().getRoutingKey();
            System.out.println("[租户2] 收到: " + routingKey + " - " + message);
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}

// 消费者 3:全局监控服务
public class GlobalMonitorConsumer {
    private static final String EXCHANGE_NAME = "tenant_topic";

    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "topic", true);
        String queueName = "monitor_queue";
        channel.queueDeclare(queueName, true, false, false, null);

        // 绑定键:# 匹配所有路由键
        channel.queueBind(queueName, EXCHANGE_NAME, "#");

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            String routingKey = delivery.getEnvelope().getRoutingKey();
            System.out.println("[全局监控] 收到: " + routingKey + " - " + message);
        };

        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
}
```

</details>

### 练习 3(挑战):系统设计

设计一个电商系统的消息路由架构:

需求:

- 订单消息:`order.create`、`order.cancel`、`order.pay`
- 用户消息:`user.register`、`user.login`、`user.logout`
- 库存消息:`stock.low`、`stock.out`

消费者:

- 订单服务:只关心订单消息
- 用户服务:只关心用户消息
- 库存服务:只关心库存消息
- 日志服务:关心所有消息
- 告警服务:只关心错误和警告消息(如 `stock.out`、`order.cancel`)

要求:

1. 画出架构图
2. 选择合适的交换机类型
3. 设计路由键
4. 写出关键代码

<details>
<summary>点击查看答案</summary>

**架构图:**

```
订单消息 --> Topic 交换机(ecommerce_topic) --> order.create --> 订单服务队列
                                              order.cancel --> 订单服务队列 + 告警服务队列
                                              order.pay --> 订单服务队列

用户消息 --> Topic 交换机(ecommerce_topic) --> user.register --> 用户服务队列
                                              user.login --> 用户服务队列
                                              user.logout --> 用户服务队列

库存消息 --> Topic 交换机(ecommerce_topic) --> stock.low --> 库存服务队列 + 告警服务队列
                                              stock.out --> 库存服务队列 + 告警服务队列

所有消息 --> 日志服务队列(绑定键:#)
```

**交换机类型:** Topic 交换机(需要灵活订阅)

**路由键设计:**

- 订单:`order.create`、`order.cancel`、`order.pay`
- 用户:`user.register`、`user.login`、`user.logout`
- 库存:`stock.low`、`stock.out`

**关键代码:**

```java
// 订单服务:只关心订单消息
channel.queueBind("order_service_queue", "ecommerce_topic", "order.*");

// 用户服务:只关心用户消息
channel.queueBind("user_service_queue", "ecommerce_topic", "user.*");

// 库存服务:只关心库存消息
channel.queueBind("stock_service_queue", "ecommerce_topic", "stock.*");

// 日志服务:关心所有消息
channel.queueBind("log_service_queue", "ecommerce_topic", "#");

// 告警服务:关心取消订单和库存不足
channel.queueBind("alert_service_queue", "ecommerce_topic", "order.cancel");
channel.queueBind("alert_service_queue", "ecommerce_topic", "stock.out");
channel.queueBind("alert_service_queue", "ecommerce_topic", "stock.low");
```

</details>

---

## 下一章预告

下一章我们会学习 **消息确认与持久化**。目前我们发送的消息都是"发出去就不管了",如果消费者处理失败怎么办?如果 RabbitMQ 重启,消息会不会丢失?我们会学习如何通过消息确认机制和持久化机制,保证消息不丢失。
