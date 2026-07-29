---
title: "第十一章：自定义工具开发"
description: "开发自定义工具扩展 AI Agent 的能力边界"
---

# 第十一章：自定义工具开发

## 本章导读

在前面几章中，我们学会了如何使用 Spring AI 和 LangChain4j 构建 AI 应用，也了解了工具集成的基本概念。但你可能发现，框架提供的内置工具有限，实际项目中我们需要开发自己的工具来满足特定需求。

在学这一章之前，你可能会有这些疑问：

- 如何设计一个好用的工具？
- 工具的描述应该怎么写才能让大模型正确调用？
- 参数校验怎么做？类型不安全怎么办？
- 工具出错了怎么处理？会不会影响整个对话？
- 怎么测试工具是否工作正常？

这一章就是为了解答这些问题。我们会从 **工具设计原则** 入手，学习 **工具注解、参数校验、异常处理、注册发现** 等核心知识，最后实现常用的工具（数据库查询、API 调用、文件操作、搜索引擎）。

---

## 1 为什么需要自定义工具？

### 痛点分析

框架提供的内置工具虽然方便，但无法满足所有场景：

```java
// 场景1：需要查询公司内部数据库
// 内置工具没有"查询员工信息"的功能

// 场景2：需要调用第三方 API
// 内置工具没有"发送短信验证码"的功能

// 场景3：需要操作文件系统
// 内置工具没有"读取配置文件"的功能

// 场景4：需要执行业务逻辑
// 内置工具没有"计算订单折扣"的功能
```

### 解决方案

**自定义工具** 让你能够扩展 AI Agent 的能力边界，让它能够：

- 查询数据库
- 调用外部 API
- 操作文件系统
- 执行业务逻辑
- 等等

打个比方：

> **内置工具** 就像瑞士军刀自带的小刀、剪刀、开瓶器。
>
> **自定义工具** 就像你可以往瑞士军刀上加装新的工具模块，比如放大镜、手电筒、USB 接口。

---

## 2 工具设计原则

### 2.1 单一职责原则

一个工具只做一件事，不要让它承担多个职责。

```java
// 不好的设计：一个工具做太多事情
@Tool(description = "处理用户相关的所有操作")
public String handleUser(String action, String userId, String data) {
    if ("query".equals(action)) {
        // 查询用户
    } else if ("update".equals(action)) {
        // 更新用户
    } else if ("delete".equals(action)) {
        // 删除用户
    }
    // 问题：职责不清晰，大模型不知道该传什么参数
}

// 好的设计：每个工具只做一件事
@Tool(description = "根据用户ID查询用户信息")
public UserInfo queryUser(String userId) {
    // 只负责查询
}

@Tool(description = "更新用户信息")
public void updateUser(String userId, UserInfo userInfo) {
    // 只负责更新
}

@Tool(description = "删除用户")
public void deleteUser(String userId) {
    // 只负责删除
}
```

### 2.2 清晰描述原则

工具的描述是大模型判断是否调用的重要依据，必须清晰准确。

```java
// 不好的描述
@Tool(description = "处理数据")
// 问题：太模糊，大模型不知道什么时候该调用

// 好的描述
@Tool(description = "根据订单号查询订单详情，返回订单状态、金额、商品信息")
// 优点：明确了功能、输入、输出
```

### 2.3 工具设计原则总结

| 原则 | 说明 | 反例 | 正例 |
| --- | --- | --- | --- |
| **单一职责** | 一个工具只做一件事 | `handleUser(action, ...)` | `queryUser(id)` / `updateUser(id, info)` |
| **清晰描述** | 描述要明确、具体 | "处理数据" | "根据订单号查询订单详情" |
| **参数简洁** | 参数越少越好 | `query(a, b, c, d, e)` | `query(orderId)` |
| **返回明确** | 返回值要有意义 | 返回 `void` | 返回 `OrderInfo` 对象 |

---

## 3 工具注解与元数据

### 3.1 @Tool 注解详解

`@Tool` 注解用于标记工具方法，它有以下属性：

```java
@Tool(
    name = "query_order", // 工具名称（可选，默认使用方法名）
    description = "根据订单号查询订单详情" // 工具描述（必填）
)
public OrderInfo queryOrder(String orderId) {
    // 工具实现
}
```

### 3.2 @P 参数注解

`@P` 注解用于描述参数，帮助大模型理解参数含义：

```java
@Tool(description = "根据城市名称和日期查询天气")
public WeatherInfo queryWeather(
        @P("城市名称，如：北京、上海") String city, // 参数描述
        @P("日期，格式：yyyy-MM-dd") String date // 参数描述
) {
    // 工具实现
}
```

### 3.3 完整的工具示例

```java
// 订单查询工具类
public class OrderTools {

    // 查询订单工具
    @Tool(name = "query_order", description = "根据订单号查询订单详情，返回订单状态、金额、商品信息")
    public OrderInfo queryOrder(
            @P("订单号，如：ORD-001") String orderId // 订单号参数
    ) {
        // 模拟数据库查询
        OrderInfo order = new OrderInfo(); // 创建订单对象
        order.setOrderId(orderId); // 设置订单号
        order.setStatus("已发货"); // 设置状态
        order.setAmount(299.99); // 设置金额
        order.setProductName("Java编程思想"); // 设置商品名
        return order; // 返回订单信息
    }

    // 取消订单工具
    @Tool(name = "cancel_order", description = "根据订单号取消订单，只有未发货的订单才能取消")
    public String cancelOrder(
            @P("订单号，如：ORD-001") String orderId // 订单号参数
    ) {
        // 模拟取消订单
        return "订单 " + orderId + " 已成功取消"; // 返回取消结果
    }
}
```

---

## 4 参数校验与类型安全

### 4.1 为什么需要参数校验？

大模型传递的参数可能不符合预期，需要校验：

```java
// 不校验参数，可能出问题
@Tool(description = "根据用户ID查询用户信息")
public UserInfo queryUser(String userId) {
    // 如果 userId 为 null 或空字符串，查询会报错
    return userRepository.findById(userId);
}
```

### 4.2 参数校验示例

```java
// 带参数校验的工具
@Tool(description = "根据用户ID查询用户信息")
public UserInfo queryUser(
        @P("用户ID，不能为空") String userId // 用户ID参数
) {
    // 参数校验
    if (userId == null || userId.trim().isEmpty()) {
        throw new IllegalArgumentException("用户ID不能为空"); // 抛出异常
    }

    if (!userId.matches("^U\\d{6}$")) {
        throw new IllegalArgumentException("用户ID格式错误，应为 U + 6位数字"); // 格式校验
    }

    // 查询数据库
    return userRepository.findById(userId); // 返回用户信息
}
```

### 4.3 类型安全

使用强类型参数，避免类型转换错误：

```java
// 不好的设计：使用 String 表示日期
@Tool(description = "查询指定日期的订单")
public List<OrderInfo> queryOrdersByDate(String date) {
    // 需要手动解析日期字符串，容易出错
    LocalDate localDate = LocalDate.parse(date); // 可能抛出 DateTimeParseException
    return orderRepository.findByDate(localDate);
}

// 好的设计：使用 LocalDate 类型
@Tool(description = "查询指定日期的订单")
public List<OrderInfo> queryOrdersByDate(
        @P("日期，格式：yyyy-MM-dd") LocalDate date // 使用 LocalDate 类型
) {
    // 框架会自动转换类型，更安全
    return orderRepository.findByDate(date); // 直接查询
}
```

---

## 5 异常处理策略

### 5.1 为什么需要异常处理？

工具执行过程中可能出错（数据库连接失败、API 超时等），需要妥善处理：

```java
// 不处理异常，可能导致整个对话崩溃
@Tool(description = "查询订单")
public OrderInfo queryOrder(String orderId) {
    // 如果数据库连接失败，会抛出异常
    return orderRepository.findById(orderId); // 异常会向上传播
}
```

### 5.2 异常处理示例

```java
// 带异常处理的工具
@Tool(description = "根据订单号查询订单详情")
public String queryOrder(String orderId) {
    try {
        // 尝试查询数据库
        OrderInfo order = orderRepository.findById(orderId); // 查询订单
        if (order == null) {
            return "未找到订单：" + orderId; // 订单不存在
        }
        return String.format("订单 %s 状态：%s，金额：%.2f 元",
                order.getOrderId(), // 订单号
                order.getStatus(), // 状态
                order.getAmount()); // 金额
    } catch (DataAccessException e) {
        // 数据库访问异常
        return "查询订单失败：数据库连接异常，请稍后重试"; // 友好提示
    } catch (Exception e) {
        // 其他异常
        return "查询订单失败：" + e.getMessage(); // 返回错误信息
    }
}
```

### 5.3 异常处理策略对比

| 策略 | 说明 | 适用场景 |
| --- | --- | --- |
| **返回错误信息** | 把异常转成友好的文本返回 | 大部分场景 |
| **抛出异常** | 让上层处理异常 | 严重错误，需要中断流程 |
| **返回默认值** | 异常时返回默认结果 | 非关键功能 |
| **重试机制** | 失败后自动重试 | 网络请求、API 调用 |

---

## 6 工具注册与发现机制

### 6.1 Spring AI 中的工具注册

```java
// 定义工具类
@Component
public class WeatherTools {

    @Description("根据城市名称查询天气信息")
    public WeatherInfo queryWeather(String city) {
        // 查询天气
        return weatherService.query(city); // 调用天气服务
    }
}

// 在 ChatClient 中注册工具
@Service
public class ChatService {

    private final ChatClient chatClient; // ChatClient 实例

    public ChatService(ChatClient.Builder builder, WeatherTools weatherTools) {
        this.chatClient = builder
                .defaultFunctions(weatherTools) // 注册工具
                .build(); // 构建 ChatClient
    }
}
```

### 6.2 LangChain4j 中的工具注册

```java
// 定义工具类
public class WeatherTools {

    @Tool(description = "根据城市名称查询天气信息")
    public String queryWeather(String city) {
        // 查询天气
        return weatherService.query(city); // 调用天气服务
    }
}

// 在 AiService 中注册工具
public class AssistantFactory {

    public static Assistant createAssistant() {
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        WeatherTools weatherTools = new WeatherTools(); // 创建工具实例

        return AiServices.builder(Assistant.class)
                .chatLanguageModel(model) // 设置模型
                .tools(weatherTools) // 注册工具
                .build(); // 构建 Assistant
    }
}
```

### 6.3 动态工具注册

```java
// 动态注册工具（运行时决定注册哪些工具）
@Service
public class DynamicToolService {

    private final ChatClient chatClient; // ChatClient 实例

    public DynamicToolService(ChatClient.Builder builder) {
        this.chatClient = builder.build(); // 构建 ChatClient
    }

    // 根据用户角色动态注册工具
    public String chat(String userRole, String message) {
        List<Object> tools = new ArrayList<>(); // 工具列表

        // 管理员角色可以使用所有工具
        if ("admin".equals(userRole)) {
            tools.add(new UserTools()); // 用户管理工具
            tools.add(new OrderTools()); // 订单管理工具
            tools.add(new SystemTools()); // 系统管理工具
        }
        // 普通用户只能使用查询工具
        else if ("user".equals(userRole)) {
            tools.add(new QueryTools()); // 查询工具
        }

        // 使用动态工具发起对话
        return chatClient.prompt()
                .user(message) // 用户消息
                .functions(tools.toArray()) // 动态注册工具
                .call() // 发起调用
                .content(); // 获取回复
    }
}
```

---

## 7 常用工具示例

### 7.1 数据库查询工具

```java
// 数据库查询工具类
public class DatabaseTools {

    private final JdbcTemplate jdbcTemplate; // Spring JDBC 模板

    public DatabaseTools(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate; // 保存引用
    }

    // 执行 SQL 查询
    @Tool(description = "执行 SQL 查询语句，返回查询结果。只支持 SELECT 语句，不支持修改操作。")
    public String executeQuery(
            @P("SQL 查询语句，如：SELECT * FROM users WHERE id = 'U001'") String sql // SQL 参数
    ) {
        // 安全检查：只允许 SELECT 语句
        if (!sql.trim().toUpperCase().startsWith("SELECT")) {
            return "错误：只支持 SELECT 查询语句"; // 拒绝非查询语句
        }

        try {
            // 执行查询
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql); // 查询数据库
            if (results.isEmpty()) {
                return "查询结果为空"; // 无结果
            }
            // 格式化结果
            StringBuilder sb = new StringBuilder(); // 字符串构建器
            sb.append("查询结果（共 ").append(results.size()).append(" 条）：\n");
            for (Map<String, Object> row : results) {
                sb.append(row).append("\n"); // 追加每一行
            }
            return sb.toString(); // 返回结果
        } catch (Exception e) {
            return "查询失败：" + e.getMessage(); // 返回错误信息
        }
    }
}
```

### 7.2 API 调用工具

```java
// HTTP API 调用工具
public class ApiTools {

    private final RestTemplate restTemplate; // Spring REST 模板

    public ApiTools(RestTemplate restTemplate) {
        this.restTemplate = restTemplate; // 保存引用
    }

    // 调用外部 API
    @Tool(description = "调用外部 HTTP API，支持 GET 和 POST 请求")
    public String callApi(
            @P("请求方法：GET 或 POST") String method, // 请求方法
            @P("API 地址，如：https://api.example.com/data") String url, // API 地址
            @P("请求体（JSON 格式），GET 请求可为空") String body // 请求体
    ) {
        try {
            if ("GET".equalsIgnoreCase(method)) {
                // GET 请求
                String response = restTemplate.getForObject(url, String.class); // 发送 GET
                return response; // 返回响应
            } else if ("POST".equalsIgnoreCase(method)) {
                // POST 请求
                HttpHeaders headers = new HttpHeaders(); // 请求头
                headers.setContentType(MediaType.APPLICATION_JSON); // 设置 Content-Type
                HttpEntity<String> entity = new HttpEntity<>(body, headers); // 请求实体
                String response = restTemplate.postForObject(url, entity, String.class); // 发送 POST
                return response; // 返回响应
            } else {
                return "错误：不支持的请求方法 " + method; // 不支持的方法
            }
        } catch (Exception e) {
            return "API 调用失败：" + e.getMessage(); // 返回错误信息
        }
    }
}
```

### 7.3 文件操作工具

```java
// 文件操作工具类
public class FileTools {

    // 读取文件内容
    @Tool(description = "读取指定路径的文本文件内容")
    public String readFile(
            @P("文件路径，如：/data/config.txt") String filePath // 文件路径
    ) {
        try {
            // 检查文件是否存在
            File file = new File(filePath); // 创建文件对象
            if (!file.exists()) {
                return "错误：文件不存在 " + filePath; // 文件不存在
            }
            if (!file.isFile()) {
                return "错误：不是文件 " + filePath; // 不是文件
            }

            // 读取文件内容
            String content = new String(Files.readAllBytes(file.toPath())); // 读取所有字节
            return content; // 返回文件内容
        } catch (Exception e) {
            return "读取文件失败：" + e.getMessage(); // 返回错误信息
        }
    }

    // 写入文件
    @Tool(description = "将内容写入指定路径的文件")
    public String writeFile(
            @P("文件路径，如：/data/output.txt") String filePath, // 文件路径
            @P("要写入的内容") String content // 文件内容
    ) {
        try {
            // 写入文件
            Files.write(Paths.get(filePath), content.getBytes()); // 写入字节
            return "文件写入成功：" + filePath; // 返回成功信息
        } catch (Exception e) {
            return "写入文件失败：" + e.getMessage(); // 返回错误信息
        }
    }
}
```

### 7.4 搜索引擎工具

```java
// 搜索引擎工具类
public class SearchTools {

    private final RestTemplate restTemplate; // REST 模板

    public SearchTools(RestTemplate restTemplate) {
        this.restTemplate = restTemplate; // 保存引用
    }

    // 网络搜索
    @Tool(description = "使用搜索引擎搜索关键词，返回相关结果")
    public String webSearch(
            @P("搜索关键词，如：Java AI Agent") String keyword // 搜索关键词
    ) {
        try {
            // 调用搜索 API（这里以 Bing Search API 为例）
            String apiKey = System.getenv("BING_API_KEY"); // 获取 API Key
            String url = "https://api.bing.microsoft.com/v7.0/search?q=" +
                    URLEncoder.encode(keyword, "UTF-8"); // 构建 URL

            HttpHeaders headers = new HttpHeaders(); // 请求头
            headers.set("Ocp-Apim-Subscription-Key", apiKey); // 设置 API Key

            HttpEntity<String> entity = new HttpEntity<>(headers); // 请求实体
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class); // 发送请求

            // 解析搜索结果（简化处理）
            return response.getBody(); // 返回搜索结果
        } catch (Exception e) {
            return "搜索失败：" + e.getMessage(); // 返回错误信息
        }
    }
}
```

---

## 8 工具测试方法

### 8.1 单元测试

```java
// 工具单元测试
class OrderToolsTest {

    private OrderTools orderTools; // 工具实例

    @BeforeEach
    void setUp() {
        orderTools = new OrderTools(); // 初始化工具
    }

    // 测试正常查询
    @Test
    void testQueryOrder_Success() {
        // 调用工具
        OrderInfo result = orderTools.queryOrder("ORD-001"); // 查询订单

        // 验证结果
        assertNotNull(result); // 不为空
        assertEquals("ORD-001", result.getOrderId()); // 订单号正确
        assertEquals("已发货", result.getStatus()); // 状态正确
    }

    // 测试参数校验
    @Test
    void testQueryOrder_InvalidParam() {
        // 测试空参数
        assertThrows(IllegalArgumentException.class, () -> {
            orderTools.queryOrder(null); // 应该抛出异常
        });

        // 测试格式错误
        assertThrows(IllegalArgumentException.class, () -> {
            orderTools.queryOrder("INVALID"); // 应该抛出异常
        });
    }
}
```

### 8.2 集成测试

```java
// 工具集成测试（测试工具与 AI 的交互）
@SpringBootTest
class OrderToolsIntegrationTest {

    private Assistant assistant; // AI 助手

    @BeforeEach
    void setUp() {
        // 创建带工具的 AI 助手
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        OrderTools orderTools = new OrderTools(); // 创建工具

        assistant = AiServices.builder(Assistant.class)
                .chatLanguageModel(model) // 设置模型
                .tools(orderTools) // 注册工具
                .build(); // 构建助手
    }

    // 测试工具调用
    @Test
    void testToolInvocation() {
        // 提问，触发工具调用
        String response = assistant.chat("帮我查一下订单 ORD-001 的状态");

        // 验证回复
        assertNotNull(response); // 不为空
        assertTrue(response.contains("已发货")); // 包含订单状态
    }
}
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **单一职责原则** | 一个工具只做一件事 |
| **清晰描述原则** | 工具描述要明确、具体 |
| **@Tool 注解** | 标记工具方法，设置名称和描述 |
| **@P 注解** | 描述参数含义 |
| **参数校验** | 校验参数合法性，防止错误 |
| **异常处理** | 捕获异常，返回友好信息 |
| **工具注册** | Spring AI 用 `defaultFunctions`，LangChain4j 用 `tools()` |
| **工具测试** | 单元测试 + 集成测试 |

---

## 10 新手常见误区

### 误区 1："工具描述随便写写就行"

错。工具描述是大模型判断是否调用的关键依据。描述不清晰，大模型可能：

- 不该调用时调用了
- 该调用时没调用
- 传错参数

建议：描述要包含 **功能、输入、输出** 三要素。

### 误区 2："工具参数越多越好"

不是。参数越多，大模型越容易传错。建议：

- 只保留必要的参数
- 参数描述要清晰
- 使用强类型，避免歧义

### 误区 3："工具不需要异常处理"

错。工具执行过程中可能出错（数据库连接失败、API 超时等），不处理异常会导致整个对话崩溃。建议：

- 捕获所有异常
- 返回友好的错误信息
- 不要让异常向上传播

### 误区 4："一个工具可以做多件事"

不是。违反单一职责原则会让工具难以理解和维护。建议：

- 一个工具只做一件事
- 功能不要重叠
- 职责要清晰

### 误区 5："工具不需要测试"

错。工具是 AI 与外部系统交互的桥梁，必须保证可靠性。建议：

- 写单元测试，验证工具逻辑
- 写集成测试，验证工具与 AI 的交互
- 覆盖正常场景和异常场景

---

## 11 动手练习

### 练习 1：实现一个用户管理工具

开发一个用户管理工具，包含以下功能：

- 查询用户信息
- 更新用户信息
- 删除用户

要求：

- 遵循单一职责原则
- 参数校验（用户 ID 格式）
- 异常处理

<details>
<summary>参考答案</summary>

```java
// 用户管理工具类
public class UserTools {

    // 查询用户
    @Tool(description = "根据用户ID查询用户信息，返回用户名、邮箱、手机号")
    public UserInfo queryUser(
            @P("用户ID，格式：U + 6位数字，如：U001") String userId // 用户ID
    ) {
        // 参数校验
        if (userId == null || !userId.matches("^U\\d{6}$")) {
            throw new IllegalArgumentException("用户ID格式错误"); // 格式错误
        }

        try {
            // 模拟数据库查询
            UserInfo user = new UserInfo(); // 创建用户对象
            user.setId(userId); // 设置ID
            user.setName("张三"); // 设置姓名
            user.setEmail("zhangsan@example.com"); // 设置邮箱
            user.setPhone("13800138000"); // 设置手机号
            return user; // 返回用户信息
        } catch (Exception e) {
            throw new RuntimeException("查询用户失败：" + e.getMessage()); // 抛出异常
        }
    }

    // 更新用户
    @Tool(description = "更新用户信息，包括用户名、邮箱、手机号")
    public String updateUser(
            @P("用户ID") String userId, // 用户ID
            @P("新用户名") String name, // 用户名
            @P("新邮箱") String email, // 邮箱
            @P("新手机号") String phone // 手机号
    ) {
        // 参数校验
        if (userId == null || !userId.matches("^U\\d{6}$")) {
            throw new IllegalArgumentException("用户ID格式错误"); // 格式错误
        }

        try {
            // 模拟数据库更新
            return "用户 " + userId + " 信息更新成功"; // 返回成功信息
        } catch (Exception e) {
            return "更新用户失败：" + e.getMessage(); // 返回错误信息
        }
    }

    // 删除用户
    @Tool(description = "根据用户ID删除用户")
    public String deleteUser(
            @P("用户ID") String userId // 用户ID
    ) {
        // 参数校验
        if (userId == null || !userId.matches("^U\\d{6}$")) {
            throw new IllegalArgumentException("用户ID格式错误"); // 格式错误
        }

        try {
            // 模拟数据库删除
            return "用户 " + userId + " 已删除"; // 返回成功信息
        } catch (Exception e) {
            return "删除用户失败：" + e.getMessage(); // 返回错误信息
        }
    }
}
```

</details>

### 练习 2：实现一个发送邮件的工具

开发一个发送邮件的工具，要求：

- 支持指定收件人、主题、正文
- 参数校验（邮箱格式）
- 异常处理

<details>
<summary>参考答案</summary>

```java
// 邮件发送工具类
public class EmailTools {

    private final JavaMailSender mailSender; // Spring 邮件发送器

    public EmailTools(JavaMailSender mailSender) {
        this.mailSender = mailSender; // 保存引用
    }

    // 发送邮件
    @Tool(description = "发送邮件给指定收件人")
    public String sendEmail(
            @P("收件人邮箱，如：test@example.com") String to, // 收件人
            @P("邮件主题") String subject, // 主题
            @P("邮件正文") String body // 正文
    ) {
        // 参数校验
        if (to == null || !to.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,}$")) {
            return "错误：邮箱格式不正确"; // 格式错误
        }
        if (subject == null || subject.trim().isEmpty()) {
            return "错误：邮件主题不能为空"; // 主题为空
        }

        try {
            // 构建邮件
            SimpleMailMessage message = new SimpleMailMessage(); // 创建邮件对象
            message.setTo(to); // 设置收件人
            message.setSubject(subject); // 设置主题
            message.setText(body); // 设置正文

            // 发送邮件
            mailSender.send(message); // 发送
            return "邮件发送成功"; // 返回成功信息
        } catch (Exception e) {
            return "邮件发送失败：" + e.getMessage(); // 返回错误信息
        }
    }
}
```

</details>

### 练习 3：实现一个计算工具

开发一个数学计算工具，支持以下功能：

- 计算表达式的值（如：2 + 3 * 4）
- 计算平方根
- 计算幂运算

要求：

- 参数校验
- 异常处理
- 返回精确结果

<details>
<summary>参考答案</summary>

```java
// 数学计算工具类
public class MathTools {

    // 计算表达式
    @Tool(description = "计算数学表达式的值，支持加减乘除、括号")
    public String calculate(
            @P("数学表达式，如：2 + 3 * 4") String expression // 表达式
    ) {
        try {
            // 使用 JavaScript 引擎计算表达式
            ScriptEngine engine = new ScriptEngineManager().getEngineByName("JavaScript"); // 获取引擎
            Object result = engine.eval(expression); // 计算表达式
            return "计算结果：" + result; // 返回结果
        } catch (Exception e) {
            return "计算失败：" + e.getMessage(); // 返回错误信息
        }
    }

    // 计算平方根
    @Tool(description = "计算一个数的平方根")
    public String sqrt(
            @P("要计算平方根的数，必须为非负数") double number // 数字
    ) {
        if (number < 0) {
            return "错误：不能对负数开平方"; // 负数检查
        }
        double result = Math.sqrt(number); // 计算平方根
        return String.format("%.4f 的平方根是 %.4f", number, result); // 返回结果
    }

    // 计算幂运算
    @Tool(description = "计算 base 的 exponent 次幂")
    public String power(
            @P("底数") double base, // 底数
            @P("指数") double exponent // 指数
    ) {
        double result = Math.pow(base, exponent); // 计算幂
        return String.format("%.2f 的 %.2f 次幂是 %.4f", base, exponent, result); // 返回结果
    }
}
```

</details>

---

## 下一章预告

下一章我们将学习 **对话管理与状态机**。我们会深入学习 **意图识别、槽位填充、对话状态机设计、对话流程编排、上下文管理** 等核心知识，并用 Java 实现一个完整的对话管理器。
