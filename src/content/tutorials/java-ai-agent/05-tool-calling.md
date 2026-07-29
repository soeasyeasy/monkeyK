---
title: "第五章：工具调用机制"
description: "掌握 Function Calling 机制，让 AI Agent 能够调用外部工具"
---

# 第五章：工具调用机制

## 本章导读

在前面的章节中，我们学习了如何让 AI Agent 进行思考和规划。但是，一个只会"想"不会"做"的 Agent 是无法完成实际任务的。

本章你将学习：
- 为什么 AI 需要工具调用能力？
- Function Calling 的工作原理是什么？
- 如何定义和描述工具？
- 如何在 Java 中实现工具注册和调用？
- 如何处理多工具编排？

通过本章学习，你将掌握让 AI Agent 调用外部工具的核心技术，使其从"纸上谈兵"变成"实干家"。

---

## 1 为什么需要工具调用？

### 1.1 AI 的局限性

大语言模型虽然强大，但存在明显的局限性：

**局限性对比表**：

| 局限类型 | 具体表现 | 例子 |
|---------|---------|------|
| **知识截止** | 训练数据有时间截止点 | 不知道今天的天气 |
| **无法执行** | 只能生成文本，不能执行操作 | 不能帮你发邮件 |
| **计算不准** | 复杂计算容易出错 | 精确的数学计算 |
| **数据访问** | 无法访问私有数据 | 不能查询你的数据库 |
| **实时性差** | 无法获取实时信息 | 股票价格、新闻 |

### 1.2 生活化类比：给 AI 配一个工具箱

想象一下，你雇了一个非常聪明的助手（AI 模型），他博学多才，能言善辩。但是：
- 他不能上网查资料
- 他不能帮你打电话
- 他不能操作电脑
- 他不能访问你的文件

这就像让一个天才待在封闭的房间里，虽然脑子好使，但手脚被绑住了。

**工具调用就是给这个助手配一个工具箱**：
- 给他一部电话（电话 API）
- 给他一台电脑（数据库查询）
- 给他一把计算器（计算工具）
- 给他一把钥匙（文件访问）

现在，他不仅能想，还能做了！

### 1.3 工具调用的应用场景

| 场景 | 需要的工具 | 说明 |
|-----|----------|------|
| 智能客服 | 订单查询 API、退款 API | 查询订单、处理退款 |
| 数据分析助手 | SQL 查询、图表生成 | 查询数据、可视化 |
| 日程管理 | 日历 API、邮件 API | 创建日程、发送通知 |
| 代码助手 | 代码执行器、文件操作 | 运行代码、读写文件 |

---

## 2 Function Calling 原理

### 2.1 什么是 Function Calling？

**Function Calling（函数调用）** 是大语言模型的一种能力，允许模型在对话过程中调用预定义的函数。

**工作流程**：

```
用户输入 → AI 理解意图 → AI 选择工具 → AI 生成调用参数 → 执行工具 → 返回结果 → AI 生成回复
```

### 2.2 Function Calling 的核心组件

| 组件 | 作用 | 说明 |
|-----|------|------|
| **工具定义** | 描述工具的功能和参数 | 告诉 AI 有什么工具可用 |
| **工具选择** | AI 决定使用哪个工具 | 基于用户意图匹配工具 |
| **参数生成** | AI 生成调用参数 | 从对话中提取参数值 |
| **工具执行** | 实际执行工具函数 | 调用真实的 API 或函数 |
| **结果处理** | 将结果返回给 AI | AI 基于结果生成回复 |

### 2.3 OpenAI Function Calling API

OpenAI 的 Function Calling 是最早的实现之一，我们以此为例学习。

**API 调用示例**：

```java
// 创建 OpenAI 客户端
OpenAiClient client = OpenAiClient.builder()
    .apiKey("your-api-key")  // 设置 API 密钥
    .build();

// 定义工具
Tool weatherTool = Tool.builder()
    .type("function")  // 工具类型为函数
    .function(FunctionDefinition.builder()
        .name("get_weather")  // 函数名称
        .description("获取指定城市的天气信息")  // 函数描述
        .parameters(JsonObject.builder()  // 参数定义
            .add("type", "object")
            .add("properties", JsonObject.builder()
                .add("city", JsonObject.builder()
                    .add("type", "string")
                    .add("description", "城市名称")
                    .build())
                .build())
            .add("required", JsonArray.of("city"))  // 必填参数
            .build())
        .build())
    .build();

// 发送请求
ChatCompletionRequest request = ChatCompletionRequest.builder()
    .model("gpt-4")  // 使用 GPT-4 模型
    .messages(List.of(
        Message.user("北京今天天气怎么样？")  // 用户消息
    ))
    .tools(List.of(weatherTool))  // 附加工具定义
    .build();

// 获取响应
ChatCompletionResponse response = client.chatCompletion(request);

// 检查是否需要调用工具
if (response.getChoices().get(0).getFinishReason().equals("tool_calls")) {
    // AI 决定调用工具
    ToolCall toolCall = response.getChoices().get(0).getMessage().getToolCalls().get(0);
    String functionName = toolCall.getFunction().getName();  // 获取函数名
    String arguments = toolCall.getFunction().getArguments();  // 获取参数
    
    System.out.println("AI 决定调用: " + functionName);
    System.out.println("参数: " + arguments);
}
```

### 2.4 工具定义的 JSON Schema

工具定义使用 JSON Schema 来描述参数结构：

```json
{
  "type": "object",
  "properties": {
    "city": {
      "type": "string",
      "description": "城市名称，例如：北京、上海"
    },
    "unit": {
      "type": "string",
      "enum": ["celsius", "fahrenheit"],
      "description": "温度单位"
    }
  },
  "required": ["city"]
}
```

**JSON Schema 常用类型**：

| 类型 | 说明 | 示例 |
|-----|------|------|
| `string` | 字符串 | `"北京"` |
| `number` | 数字 | `25.5` |
| `integer` | 整数 | `100` |
| `boolean` | 布尔值 | `true` |
| `array` | 数组 | `["北京", "上海"]` |
| `object` | 对象 | `{"city": "北京"}` |

---

## 3 Java 实现工具注册与调用

### 3.1 工具接口定义

首先定义工具的统一接口：

```java
// 工具接口
public interface Tool {
    // 获取工具名称
    String getName();
    
    // 获取工具描述
    String getDescription();
    
    // 获取参数定义
    JsonNode getParameterSchema();
    
    // 执行工具
    String execute(String arguments);
}
```

### 3.2 工具注册中心

创建一个工具注册中心来管理所有工具：

```java
// 工具注册中心
public class ToolRegistry {
    // 存储所有注册的工具
    private final Map<String, Tool> tools = new HashMap<>();
    
    // 注册工具
    public void register(Tool tool) {
        // 检查工具名称是否已存在
        if (tools.containsKey(tool.getName())) {
            throw new IllegalArgumentException("工具已存在: " + tool.getName());
        }
        // 将工具添加到注册表
        tools.put(tool.getName(), tool);
        System.out.println("工具注册成功: " + tool.getName());
    }
    
    // 获取工具
    public Tool getTool(String name) {
        Tool tool = tools.get(name);
        // 检查工具是否存在
        if (tool == null) {
            throw new IllegalArgumentException("工具不存在: " + name);
        }
        return tool;
    }
    
    // 获取所有工具列表
    public List<Tool> getAllTools() {
        return new ArrayList<>(tools.values());
    }
    
    // 检查工具是否存在
    public boolean hasTool(String name) {
        return tools.containsKey(name);
    }
}
```

### 3.3 实现具体工具

实现一个天气查询工具：

```java
// 天气查询工具
public class WeatherTool implements Tool {
    
    @Override
    public String getName() {
        return "get_weather";  // 工具名称
    }
    
    @Override
    public String getDescription() {
        return "获取指定城市的天气信息";  // 工具描述
    }
    
    @Override
    public JsonNode getParameterSchema() {
        // 使用 Jackson 创建 JSON Schema
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode schema = mapper.createObjectNode();
        
        // 设置类型
        schema.put("type", "object");
        
        // 创建属性对象
        ObjectNode properties = mapper.createObjectNode();
        
        // 城市参数
        ObjectNode cityParam = mapper.createObjectNode();
        cityParam.put("type", "string");
        cityParam.put("description", "城市名称");
        properties.set("city", cityParam);
        
        // 单位参数
        ObjectNode unitParam = mapper.createObjectNode();
        unitParam.put("type", "string");
        unitParam.put("enum", mapper.createArrayNode().add("celsius").add("fahrenheit"));
        unitParam.put("description", "温度单位");
        properties.set("unit", unitParam);
        
        // 设置属性
        schema.set("properties", properties);
        
        // 设置必填参数
        ArrayNode required = mapper.createArrayNode();
        required.add("city");
        schema.set("required", required);
        
        return schema;
    }
    
    @Override
    public String execute(String arguments) {
        try {
            // 解析参数
            ObjectMapper mapper = new ObjectMapper();
            JsonNode args = mapper.readTree(arguments);
            
            // 获取城市参数
            String city = args.get("city").asText();
            // 获取单位参数（可选）
            String unit = args.has("unit") ? args.get("unit").asText() : "celsius";
            
            // 模拟调用天气 API
            // 实际项目中这里应该调用真实的天气 API
            String weatherData = callWeatherApi(city, unit);
            
            return weatherData;
        } catch (Exception e) {
            // 返回错误信息
            return "{\"error\": \"查询失败: " + e.getMessage() + "\"}";
        }
    }
    
    // 模拟调用天气 API
    private String callWeatherApi(String city, String unit) {
        // 这里模拟返回数据
        // 实际应该使用 HttpClient 调用真实 API
        return String.format(
            "{\"city\": \"%s\", \"temperature\": 25, \"unit\": \"%s\", \"condition\": \"晴\"}",
            city, unit
        );
    }
}
```

### 3.4 工具调用执行器

创建工具调用执行器：

```java
// 工具调用执行器
public class ToolExecutor {
    private final ToolRegistry registry;
    private final ObjectMapper mapper = new ObjectMapper();
    
    public ToolExecutor(ToolRegistry registry) {
        this.registry = registry;
    }
    
    // 执行工具调用
    public String execute(ToolCall toolCall) {
        // 获取函数名
        String functionName = toolCall.getFunction().getName();
        // 获取参数 JSON 字符串
        String arguments = toolCall.getFunction().getArguments();
        
        System.out.println("执行工具: " + functionName);
        System.out.println("参数: " + arguments);
        
        try {
            // 从注册中心获取工具
            Tool tool = registry.getTool(functionName);
            
            // 验证参数
            validateArguments(tool, arguments);
            
            // 执行工具
            String result = tool.execute(arguments);
            
            System.out.println("执行结果: " + result);
            return result;
        } catch (Exception e) {
            // 返回错误结果
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }
    
    // 验证参数
    private void validateArguments(Tool tool, String arguments) throws Exception {
        // 解析参数 JSON
        JsonNode args = mapper.readTree(arguments);
        // 获取参数 Schema
        JsonNode schema = tool.getParameterSchema();
        
        // 检查必填参数
        if (schema.has("required")) {
            for (JsonNode required : schema.get("required")) {
                String paramName = required.asText();
                // 检查必填参数是否存在
                if (!args.has(paramName)) {
                    throw new IllegalArgumentException("缺少必填参数: " + paramName);
                }
            }
        }
    }
}
```

### 3.5 完整的 Agent 工具调用流程

将工具调用集成到 Agent 中：

```java
// 带工具调用能力的 Agent
public class ToolCallingAgent {
    private final OpenAiClient client;
    private final ToolRegistry toolRegistry;
    private final ToolExecutor toolExecutor;
    
    public ToolCallingAgent(String apiKey) {
        // 创建 OpenAI 客户端
        this.client = OpenAiClient.builder()
            .apiKey(apiKey)
            .build();
        // 创建工具注册中心
        this.toolRegistry = new ToolRegistry();
        // 创建工具执行器
        this.toolExecutor = new ToolExecutor(toolRegistry);
    }
    
    // 注册工具
    public void registerTool(Tool tool) {
        toolRegistry.register(tool);
    }
    
    // 处理用户输入
    public String chat(String userInput) {
        // 构建消息列表
        List<Message> messages = new ArrayList<>();
        messages.add(Message.user(userInput));
        
        // 构建工具列表
        List<Tool> tools = toolRegistry.getAllTools().stream()
            .map(this::convertToOpenAiTool)
            .collect(Collectors.toList());
        
        // 发送请求
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4")
            .messages(messages)
            .tools(tools)
            .build();
        
        ChatCompletionResponse response = client.chatCompletion(request);
        
        // 处理响应
        return handleResponse(response, messages, tools);
    }
    
    // 处理响应
    private String handleResponse(ChatCompletionResponse response, 
                                   List<Message> messages, 
                                   List<Tool> tools) {
        Choice choice = response.getChoices().get(0);
        String finishReason = choice.getFinishReason();
        
        // 检查是否需要调用工具
        if ("tool_calls".equals(finishReason)) {
            // 获取工具调用列表
            List<ToolCall> toolCalls = choice.getMessage().getToolCalls();
            
            // 将 AI 的消息添加到历史
            messages.add(choice.getMessage());
            
            // 执行每个工具调用
            for (ToolCall toolCall : toolCalls) {
                // 执行工具
                String result = toolExecutor.execute(toolCall);
                
                // 将工具结果添加到消息
                messages.add(Message.tool(
                    toolCall.getId(),
                    result
                ));
            }
            
            // 再次请求 AI 生成最终回复
            ChatCompletionRequest followUpRequest = ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(messages)
                .tools(tools)
                .build();
            
            ChatCompletionResponse followUpResponse = client.chatCompletion(followUpRequest);
            return followUpResponse.getChoices().get(0).getMessage().getContent();
        }
        
        // 不需要调用工具，直接返回
        return choice.getMessage().getContent();
    }
    
    // 转换为 OpenAI 工具格式
    private Tool convertToOpenAiTool(Tool tool) {
        return Tool.builder()
            .type("function")
            .function(FunctionDefinition.builder()
                .name(tool.getName())
                .description(tool.getDescription())
                .parameters(tool.getParameterSchema())
                .build())
            .build();
    }
}
```

### 3.6 使用示例

```java
// 主程序
public class Main {
    public static void main(String[] args) {
        // 创建 Agent
        ToolCallingAgent agent = new ToolCallingAgent("your-api-key");
        
        // 注册工具
        agent.registerTool(new WeatherTool());
        agent.registerTool(new CalculatorTool());
        agent.registerTool(new DatabaseQueryTool());
        
        // 对话
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.print("你: ");
            String input = scanner.nextLine();
            
            if ("exit".equals(input)) {
                break;
            }
            
            String response = agent.chat(input);
            System.out.println("AI: " + response);
        }
    }
}
```

---

## 4 参数解析与类型映射

### 4.1 JSON 参数解析

AI 返回的参数是 JSON 字符串，需要解析为 Java 对象：

```java
// 参数解析器
public class ArgumentParser {
    private final ObjectMapper mapper = new ObjectMapper();
    
    // 解析为 Map
    public Map<String, Object> parseAsMap(String arguments) throws Exception {
        return mapper.readValue(arguments, new TypeReference<Map<String, Object>>() {});
    }
    
    // 解析为指定类型
    public <T> T parseAs(String arguments, Class<T> clazz) throws Exception {
        return mapper.readValue(arguments, clazz);
    }
    
    // 解析为 JsonNode
    public JsonNode parseAsJson(String arguments) throws Exception {
        return mapper.readTree(arguments);
    }
}

// 使用示例
ArgumentParser parser = new ArgumentParser();

// 方式 1：解析为 Map
Map<String, Object> args = parser.parseAsMap("{\"city\": \"北京\", \"unit\": \"celsius\"}");
String city = (String) args.get("city");

// 方式 2：解析为 POJO
WeatherArgs weatherArgs = parser.parseAs(arguments, WeatherArgs.class);
String city2 = weatherArgs.getCity();

// 方式 3：解析为 JsonNode
JsonNode jsonNode = parser.parseAsJson(arguments);
String city3 = jsonNode.get("city").asText();
```

### 4.2 类型映射表

| JSON 类型 | Java 类型 | 说明 |
|----------|----------|------|
| `string` | `String` | 字符串 |
| `number` | `Double` / `Float` | 浮点数 |
| `integer` | `Integer` / `Long` | 整数 |
| `boolean` | `Boolean` | 布尔值 |
| `array` | `List<T>` | 数组 |
| `object` | `Map<String, Object>` / POJO | 对象 |

### 4.3 参数验证

```java
// 参数验证器
public class ArgumentValidator {
    
    // 验证参数
    public void validate(JsonNode arguments, JsonNode schema) throws ValidationException {
        // 检查必填参数
        if (schema.has("required")) {
            for (JsonNode required : schema.get("required")) {
                String paramName = required.asText();
                if (!arguments.has(paramName)) {
                    throw new ValidationException("缺少必填参数: " + paramName);
                }
            }
        }
        
        // 检查参数类型
        if (schema.has("properties")) {
            JsonNode properties = schema.get("properties");
            Iterator<String> fieldNames = arguments.fieldNames();
            
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                if (properties.has(fieldName)) {
                    JsonNode propSchema = properties.get(fieldName);
                    JsonNode value = arguments.get(fieldName);
                    
                    validateType(fieldName, value, propSchema);
                }
            }
        }
    }
    
    // 验证类型
    private void validateType(String fieldName, JsonNode value, JsonNode schema) 
            throws ValidationException {
        String expectedType = schema.get("type").asText();
        
        switch (expectedType) {
            case "string":
                if (!value.isTextual()) {
                    throw new ValidationException(fieldName + " 应该是字符串类型");
                }
                break;
            case "number":
                if (!value.isNumber()) {
                    throw new ValidationException(fieldName + " 应该是数字类型");
                }
                break;
            case "integer":
                if (!value.isInt() && !value.isLong()) {
                    throw new ValidationException(fieldName + " 应该是整数类型");
                }
                break;
            case "boolean":
                if (!value.isBoolean()) {
                    throw new ValidationException(fieldName + " 应该是布尔类型");
                }
                break;
            case "array":
                if (!value.isArray()) {
                    throw new ValidationException(fieldName + " 应该是数组类型");
                }
                break;
            case "object":
                if (!value.isObject()) {
                    throw new ValidationException(fieldName + " 应该是对象类型");
                }
                break;
        }
        
        // 检查枚举值
        if (schema.has("enum")) {
            boolean valid = false;
            for (JsonNode enumValue : schema.get("enum")) {
                if (enumValue.asText().equals(value.asText())) {
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                throw new ValidationException(fieldName + " 的值不在允许范围内");
            }
        }
    }
}
```

---

## 5 多工具编排

### 5.1 什么是多工具编排？

当任务复杂时，可能需要调用多个工具来完成。多工具编排就是管理多个工具的调用顺序和依赖关系。

**编排模式**：

| 模式 | 说明 | 适用场景 |
|-----|------|---------|
| **顺序执行** | 工具按顺序依次执行 | 有依赖关系的工具 |
| **并行执行** | 多个工具同时执行 | 无依赖关系的工具 |
| **条件执行** | 根据条件选择执行哪些工具 | 分支逻辑 |
| **循环执行** | 重复执行某些工具 | 迭代处理 |

### 5.2 顺序执行示例

```java
// 顺序执行多个工具
public class SequentialExecutor {
    private final ToolExecutor executor;
    
    public SequentialExecutor(ToolExecutor executor) {
        this.executor = executor;
    }
    
    // 执行工具链
    public String executeChain(List<ToolCall> toolCalls) {
        String previousResult = null;
        
        for (ToolCall toolCall : toolCalls) {
            // 执行当前工具
            String result = executor.execute(toolCall);
            
            // 将结果传递给下一个工具（如果需要）
            previousResult = result;
            
            System.out.println("工具 " + toolCall.getFunction().getName() + 
                             " 执行完成，结果: " + result);
        }
        
        return previousResult;
    }
}
```

### 5.3 并行执行示例

```java
// 并行执行多个工具
public class ParallelExecutor {
    private final ToolExecutor executor;
    private final ExecutorService threadPool = Executors.newFixedThreadPool(5);
    
    public ParallelExecutor(ToolExecutor executor) {
        this.executor = executor;
    }
    
    // 并行执行工具
    public List<String> executeParallel(List<ToolCall> toolCalls) {
        // 创建任务列表
        List<Future<String>> futures = new ArrayList<>();
        
        for (ToolCall toolCall : toolCalls) {
            // 提交任务到线程池
            Future<String> future = threadPool.submit(() -> {
                return executor.execute(toolCall);
            });
            futures.add(future);
        }
        
        // 收集结果
        List<String> results = new ArrayList<>();
        for (Future<String> future : futures) {
            try {
                // 等待并获取结果
                results.add(future.get(30, TimeUnit.SECONDS));
            } catch (Exception e) {
                results.add("{\"error\": \"执行超时或失败\"}");
            }
        }
        
        return results;
    }
}
```

### 5.4 AI 驱动的多工具编排

让 AI 自己决定如何编排工具：

```java
// AI 驱动的工具编排器
public class AiToolOrchestrator {
    private final OpenAiClient client;
    private final ToolRegistry registry;
    private final ToolExecutor executor;
    
    public AiToolOrchestrator(String apiKey, ToolRegistry registry) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
        this.registry = registry;
        this.executor = new ToolExecutor(registry);
    }
    
    // 执行任务
    public String executeTask(String task) {
        // 构建系统提示
        String systemPrompt = "你是一个任务执行助手。根据用户任务，选择合适的工具并按顺序执行。" +
                             "如果需要多个工具，请依次调用。";
        
        // 构建消息
        List<Message> messages = new ArrayList<>();
        messages.add(Message.system(systemPrompt));
        messages.add(Message.user(task));
        
        // 构建工具列表
        List<Tool> tools = registry.getAllTools().stream()
            .map(this::convertToOpenAiTool)
            .collect(Collectors.toList());
        
        // 循环执行，直到 AI 不再调用工具
        int maxIterations = 10;
        int iteration = 0;
        
        while (iteration < maxIterations) {
            // 发送请求
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(messages)
                .tools(tools)
                .build();
            
            ChatCompletionResponse response = client.chatCompletion(request);
            Choice choice = response.getChoices().get(0);
            
            // 检查是否完成
            if (!"tool_calls".equals(choice.getFinishReason())) {
                return choice.getMessage().getContent();
            }
            
            // 添加 AI 消息
            messages.add(choice.getMessage());
            
            // 执行工具调用
            for (ToolCall toolCall : choice.getMessage().getToolCalls()) {
                String result = executor.execute(toolCall);
                messages.add(Message.tool(toolCall.getId(), result));
            }
            
            iteration++;
        }
        
        return "任务执行超时";
    }
    
    private Tool convertToOpenAiTool(Tool tool) {
        return Tool.builder()
            .type("function")
            .function(FunctionDefinition.builder()
                .name(tool.getName())
                .description(tool.getDescription())
                .parameters(tool.getParameterSchema())
                .build())
            .build();
    }
}
```

---

## 6 对比表格

### 6.1 不同工具调用方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|-----|------|------|---------|
| **OpenAI Function Calling** | 简单易用，生态成熟 | 依赖 OpenAI API | 快速开发、原型验证 |
| **LangChain Tools** | 工具丰富，集成度高 | 学习成本较高 | 复杂应用、多工具场景 |
| **自定义框架** | 灵活可控，无依赖 | 开发成本高 | 特殊需求、企业级应用 |
| **Semantic Kernel** | 微软生态，企业级 | 相对较重 | 企业应用、微软生态 |

### 6.2 工具定义方式对比

| 方式 | 代码量 | 类型安全 | 灵活性 |
|-----|-------|---------|--------|
| **JSON Schema** | 较多 | 低 | 高 |
| **注解方式** | 较少 | 中 | 中 |
| **代码生成** | 最少 | 高 | 低 |

---

## 7 新手常见误区

### 误区 1：工具描述不重要

**错误想法**：随便写个描述就行，AI 能猜出来。

**正确做法**：工具描述是 AI 理解工具功能的关键，必须清晰准确。

```java
// ❌ 错误的描述
.setDescription("获取天气")

// ✅ 正确的描述
.setDescription("获取指定城市的实时天气信息，包括温度、湿度、天气状况等")
```

### 误区 2：参数描述越简单越好

**错误想法**：参数名能说明一切，不需要描述。

**正确做法**：参数描述应该包含取值范围、格式要求等信息。

```java
// ❌ 缺少细节
.add("description", "日期")

// ✅ 包含格式说明
.add("description", "日期，格式为 YYYY-MM-DD，例如：2024-01-15")
```

### 误区 3：不处理工具执行失败

**错误想法**：工具调用一定会成功。

**正确做法**：必须处理工具执行失败的情况，返回友好的错误信息。

```java
// ❌ 不处理异常
public String execute(String arguments) {
    return callApi(arguments);  // 可能抛出异常
}

// ✅ 处理异常
public String execute(String arguments) {
    try {
        return callApi(arguments);
    } catch (Exception e) {
        return "{\"error\": \"调用失败: " + e.getMessage() + "\"}";
    }
}
```

### 误区 4：无限循环调用工具

**错误想法**：让 AI 一直调用工具直到完成任务。

**正确做法**：设置最大迭代次数，防止无限循环。

```java
// ❌ 没有循环限制
while (true) {
    // 可能导致无限循环
}

// ✅ 设置最大迭代次数
int maxIterations = 10;
int iteration = 0;
while (iteration < maxIterations) {
    // ...
    iteration++;
}
```

### 误区 5：工具之间没有依赖管理

**错误想法**：所有工具都可以随意调用。

**正确做法**：考虑工具之间的依赖关系，确保执行顺序正确。

```java
// ❌ 不考虑依赖
// 先查询订单，再查询用户（但需要用户 ID 才能查订单）

// ✅ 管理依赖
// 1. 先查询用户获取用户 ID
// 2. 再用用户 ID 查询订单
```

---

## 8 动手练习

### 练习 1：实现一个计算器工具

实现一个支持加减乘除的计算器工具，能够解析并计算数学表达式。

<details>
<summary>点击查看答案</summary>

```java
// 计算器工具
public class CalculatorTool implements Tool {
    
    @Override
    public String getName() {
        return "calculator";
    }
    
    @Override
    public String getDescription() {
        return "执行数学计算，支持加减乘除运算";
    }
    
    @Override
    public JsonNode getParameterSchema() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        
        ObjectNode properties = mapper.createObjectNode();
        
        // 表达式参数
        ObjectNode expressionParam = mapper.createObjectNode();
        expressionParam.put("type", "string");
        expressionParam.put("description", "数学表达式，例如：2 + 3 * 4");
        properties.set("expression", expressionParam);
        
        schema.set("properties", properties);
        
        ArrayNode required = mapper.createArrayNode();
        required.add("expression");
        schema.set("required", required);
        
        return schema;
    }
    
    @Override
    public String execute(String arguments) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode args = mapper.readTree(arguments);
            String expression = args.get("expression").asText();
            
            // 计算表达式
            double result = evaluate(expression);
            
            return String.format("{\"expression\": \"%s\", \"result\": %.2f}", 
                                expression, result);
        } catch (Exception e) {
            return "{\"error\": \"计算失败: " + e.getMessage() + "\"}";
        }
    }
    
    // 简单的表达式计算（实际项目建议使用 ScriptEngine）
    private double evaluate(String expression) {
        // 使用 JavaScript 引擎计算
        ScriptEngineManager mgr = new ScriptEngineManager();
        ScriptEngine engine = mgr.getEngineByName("JavaScript");
        try {
            return (Double) engine.eval(expression);
        } catch (Exception e) {
            throw new RuntimeException("表达式计算失败");
        }
    }
}
```

</details>

### 练习 2：实现数据库查询工具

实现一个可以执行 SQL 查询的工具，支持 SELECT 查询并返回结果。

<details>
<summary>点击查看答案</summary>

```java
// 数据库查询工具
public class DatabaseQueryTool implements Tool {
    private final String dbUrl;
    private final String username;
    private final String password;
    
    public DatabaseQueryTool(String dbUrl, String username, String password) {
        this.dbUrl = dbUrl;
        this.username = username;
        this.password = password;
    }
    
    @Override
    public String getName() {
        return "database_query";
    }
    
    @Override
    public String getDescription() {
        return "执行 SQL 查询，只支持 SELECT 语句";
    }
    
    @Override
    public JsonNode getParameterSchema() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        
        ObjectNode properties = mapper.createObjectNode();
        
        ObjectNode sqlParam = mapper.createObjectNode();
        sqlParam.put("type", "string");
        sqlParam.put("description", "SQL 查询语句，只支持 SELECT");
        properties.set("sql", sqlParam);
        
        schema.set("properties", properties);
        
        ArrayNode required = mapper.createArrayNode();
        required.add("sql");
        schema.set("required", required);
        
        return schema;
    }
    
    @Override
    public String execute(String arguments) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode args = mapper.readTree(arguments);
            String sql = args.get("sql").asText().trim();
            
            // 安全检查：只允许 SELECT
            if (!sql.toUpperCase().startsWith("SELECT")) {
                return "{\"error\": \"只支持 SELECT 查询\"}";
            }
            
            // 执行查询
            List<Map<String, Object>> results = executeQuery(sql);
            
            // 转换为 JSON
            ObjectMapper jsonMapper = new ObjectMapper();
            return jsonMapper.writeValueAsString(results);
        } catch (Exception e) {
            return "{\"error\": \"查询失败: " + e.getMessage() + "\"}";
        }
    }
    
    private List<Map<String, Object>> executeQuery(String sql) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();
        
        try (Connection conn = DriverManager.getConnection(dbUrl, username, password);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();
            
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    row.put(metaData.getColumnName(i), rs.getObject(i));
                }
                results.add(row);
            }
        }
        
        return results;
    }
}
```

</details>

### 练习 3：实现多工具组合任务

创建一个"旅行规划助手"，需要组合使用天气查询、航班查询、酒店查询三个工具来完成用户的旅行规划需求。

<details>
<summary>点击查看答案</summary>

```java
// 旅行规划助手
public class TravelPlanner {
    private final ToolCallingAgent agent;
    
    public TravelPlanner(String apiKey) {
        agent = new ToolCallingAgent(apiKey);
        
        // 注册工具
        agent.registerTool(new WeatherTool());
        agent.registerTool(new FlightSearchTool());
        agent.registerTool(new HotelSearchTool());
    }
    
    // 规划旅行
    public String planTrip(String destination, String startDate, String endDate) {
        String task = String.format(
            "帮我规划一次去%s的旅行。出发日期：%s，返回日期：%s。" +
            "请帮我：1. 查询目的地天气 2. 搜索往返航班 3. 推荐酒店",
            destination, startDate, endDate
        );
        
        return agent.chat(task);
    }
    
    // 航班查询工具
    class FlightSearchTool implements Tool {
        @Override
        public String getName() {
            return "search_flights";
        }
        
        @Override
        public String getDescription() {
            return "搜索航班信息";
        }
        
        @Override
        public JsonNode getParameterSchema() {
            // 实现参数定义...
            return new ObjectMapper().createObjectNode();
        }
        
        @Override
        public String execute(String arguments) {
            // 模拟航班查询
            return "{\"flights\": [{\"airline\": \"国航\", \"price\": 1500}]}";
        }
    }
    
    // 酒店查询工具
    class HotelSearchTool implements Tool {
        @Override
        public String getName() {
            return "search_hotels";
        }
        
        @Override
        public String getDescription() {
            return "搜索酒店信息";
        }
        
        @Override
        public JsonNode getParameterSchema() {
            // 实现参数定义...
            return new ObjectMapper().createObjectNode();
        }
        
        @Override
        public String execute(String arguments) {
            // 模拟酒店查询
            return "{\"hotels\": [{\"name\": \"希尔顿\", \"price\": 800}]}";
        }
    }
}
```

</details>

---

## 9 下一章预告

恭喜你完成了工具调用机制的学习！现在你的 AI Agent 已经可以调用外部工具来完成任务了。

但是，你有没有发现一个问题？当对话变长时，AI 会"忘记"之前说过的事情。就像金鱼一样，记忆只有几秒。

在下一章《记忆管理系统》中，我们将学习：
- 如何为 AI Agent 构建记忆系统
- 短期记忆和长期记忆的区别
- 如何使用向量数据库存储长期记忆
- 上下文窗口管理策略

让你的 AI Agent 不再"健忘"，能够记住之前的对话和积累知识！
