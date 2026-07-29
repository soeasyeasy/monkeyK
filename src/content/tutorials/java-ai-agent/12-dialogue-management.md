---
title: "第十二章：对话管理与状态机"
description: "构建结构化的对话系统，实现复杂的对话流程控制"
---

# 第十二章：对话管理与状态机

## 本章导读

在前面几章中，我们学会了如何让 AI Agent 调用工具、管理记忆、构建完整的应用。但你可能发现，这些对话都是"自由发挥"的，用户想说什么就说什么，AI 被动响应。但在实际业务场景中，我们往往需要**结构化的对话流程**。

在学这一章之前，你可能会有这些疑问：

- 什么是意图识别？怎么知道用户想干什么？
- 什么是槽位填充？怎么从用户的话中提取关键信息？
- 什么是状态机？为什么需要它？
- 怎么控制对话流程，避免 AI 跑偏？
- 上下文管理怎么做？怎么记住之前的对话内容？

这一章就是为了解答这些问题。我们会从 **对话管理的核心挑战** 入手，学习 **意图识别、槽位填充、状态机设计、流程编排、上下文管理** 等核心知识，最后用 Java 实现一个完整的对话管理器。

---

## 1 为什么需要对话管理？

### 痛点分析

前面的 AI 助手都是"自由对话"模式，用户想说什么就说什么：

```
用户：我想订一张机票
AI：好的，请问您要去哪里？
用户：今天天气怎么样？
AI：今天北京天气晴朗，气温 25°C。
用户：帮我查一下订单 ORD-001
AI：订单 ORD-001 已发货，金额 299.99 元。
用户：我想订机票
AI：（AI 已经忘了你之前说要订机票）
```

这种模式的问题：

1. **容易跑偏**：用户一句话就把话题带跑了
2. **流程不可控**：无法保证完成业务目标（如订机票）
3. **信息收集困难**：无法系统性地收集必要信息
4. **上下文丢失**：对话历史太长，AI 容易忘记之前的内容

### 解决方案

**对话管理** 就是为了解决这些问题，它让对话变得**结构化、可控、有目标**。

打个比方：

> **自由对话** 就像和朋友聊天，想说什么就说什么。
>
> **对话管理** 就像客服接待你，有固定的流程：先问你要办什么业务，然后收集必要信息，最后帮你办理。

### 对话管理的核心任务

| 任务 | 说明 | 生活化类比 |
| --- | --- | --- |
| **意图识别** | 判断用户想干什么 | 客服问"您要办什么业务？" |
| **槽位填充** | 提取关键信息 | 客服问"您要订哪天的机票？" |
| **状态管理** | 记住当前对话进展 | 客服记住"已经收集了出发地，还差目的地" |
| **流程控制** | 引导对话按流程进行 | 客服按流程一步步询问 |
| **上下文管理** | 记住对话历史 | 客服记住你之前说过的话 |

---

## 2 意图识别

### 2.1 什么是意图识别？

意图识别就是判断用户想干什么。

打个比方：

> 用户说"我想订一张去北京的机票"
>
> 意图识别的结果：`intent = "book_flight"`

### 2.2 意图识别方法

#### 方法1：基于规则

```java
// 基于规则的意图识别
public class RuleBasedIntentRecognizer {

    // 识别意图
    public String recognize(String userInput) {
        // 包含"订机票"、"买机票"等关键词
        if (userInput.contains("订机票") || userInput.contains("买机票")) {
            return "book_flight"; // 订机票意图
        }
        // 包含"查订单"、"订单状态"等关键词
        else if (userInput.contains("查订单") || userInput.contains("订单状态")) {
            return "query_order"; // 查询订单意图
        }
        // 包含"退款"、"退货"等关键词
        else if (userInput.contains("退款") || userInput.contains("退货")) {
            return "refund"; // 退款意图
        }
        // 无法识别
        else {
            return "unknown"; // 未知意图
        }
    }
}
```

#### 方法2：基于大模型

```java
// 基于大模型的意图识别
public class LLMIntentRecognizer {

    private final ChatLanguageModel model; // 大模型

    public LLMIntentRecognizer(ChatLanguageModel model) {
        this.model = model; // 保存模型引用
    }

    // 识别意图
    public String recognize(String userInput) {
        // 构建 Prompt
        String prompt = String.format("""
                请判断以下用户输入的意图，只能返回以下选项之一：
                - book_flight：订机票
                - query_order：查询订单
                - refund：退款
                - unknown：未知
                
                用户输入：%s
                
                意图：
                """, userInput);

        // 调用大模型
        String intent = model.generate(prompt).trim(); // 获取意图
        return intent; // 返回意图
    }
}
```

### 2.3 方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **基于规则** | 速度快、成本低 | 覆盖率低、维护困难 | 意图简单、场景固定 |
| **基于大模型** | 准确率高、泛化能力强 | 速度慢、成本高 | 意图复杂、场景多变 |

---

## 3 槽位填充

### 3.1 什么是槽位填充？

槽位填充就是从用户输入中提取关键信息。

打个比方：

> 用户说"我想订一张明天去北京的机票"
>
> 槽位填充的结果：
> - `destination = "北京"`
> - `date = "明天"`

### 3.2 槽位填充方法

#### 方法1：基于正则表达式

```java
// 基于正则的槽位填充
public class RegexSlotFiller {

    // 填充槽位
    public Map<String, String> fillSlots(String userInput) {
        Map<String, String> slots = new HashMap<>(); // 槽位映射

        // 提取城市（简单示例，实际项目中用更复杂的正则）
        Pattern cityPattern = Pattern.compile("(北京|上海|广州|深圳)"); // 城市正则
        Matcher cityMatcher = cityPattern.matcher(userInput); // 匹配
        if (cityMatcher.find()) {
            slots.put("destination", cityMatcher.group(1)); // 提取城市
        }

        // 提取日期
        Pattern datePattern = Pattern.compile("(明天|后天|今天|\\d{4}-\\d{2}-\\d{2})"); // 日期正则
        Matcher dateMatcher = datePattern.matcher(userInput); // 匹配
        if (dateMatcher.find()) {
            slots.put("date", dateMatcher.group(1)); // 提取日期
        }

        return slots; // 返回槽位
    }
}
```

#### 方法2：基于大模型

```java
// 基于大模型的槽位填充
public class LLMSlotFiller {

    private final ChatLanguageModel model; // 大模型

    public LLMSlotFiller(ChatLanguageModel model) {
        this.model = model; // 保存模型引用
    }

    // 填充槽位
    public Map<String, String> fillSlots(String userInput, List<String> slotNames) {
        // 构建 Prompt
        String prompt = String.format("""
                请从以下用户输入中提取关键信息，返回 JSON 格式。
                
                需要提取的字段：%s
                
                用户输入：%s
                
                请以 JSON 格式返回，只返回 JSON，不要其他内容。
                """, slotNames, userInput);

        // 调用大模型
        String response = model.generate(prompt); // 获取响应

        // 解析 JSON
        try {
            ObjectMapper mapper = new ObjectMapper(); // JSON 解析器
            Map<String, String> slots = mapper.readValue(response, Map.class); // 解析
            return slots; // 返回槽位
        } catch (Exception e) {
            return new HashMap<>(); // 解析失败，返回空映射
        }
    }
}
```

### 3.3 方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **基于正则** | 速度快、成本低 | 覆盖率低、维护困难 | 格式固定的信息（如日期、电话） |
| **基于大模型** | 准确率高、泛化能力强 | 速度慢、成本高 | 复杂信息提取 |

---

## 4 对话状态机设计

### 4.1 什么是状态机？

状态机是一种数学模型，用于描述系统在不同状态之间的转换。

打个比方：

> **状态机** 就像游戏里的关卡。你从"第一关"开始，通关后进入"第二关"，再通关进入"第三关"。每个关卡都有明确的目标和进入条件。

### 4.2 对话状态机的组成

```
状态机 = 状态 + 事件 + 转换规则

状态（State）：对话的当前阶段
事件（Event）：用户的输入或系统触发
转换规则（Transition）：从当前状态到新状态的映射
```

### 4.3 订机票场景的状态机

```
┌─────────┐
│  初始   │ ← 用户说"我想订机票"
└────┬────┘
     │
     ▼
┌─────────────┐
│ 收集出发地  │ ← 用户说"从北京出发"
└────┬────────┘
     │
     ▼
┌─────────────┐
│ 收集目的地  │ ← 用户说"去上海"
└────┬────────┘
     │
     ▼
┌─────────────┐
│ 收集日期    │ ← 用户说"明天"
└────┬────────┘
     │
     ▼
┌─────────────┐
│ 确认订单    │ ← 用户说"确认"
└────┬────────┘
     │
     ▼
┌─────────┐
│  完成   │
└─────────┘
```

### 4.4 Java 实现状态机

```java
// 对话状态枚举
public enum DialogState {
    INITIAL, // 初始状态
    COLLECTING_DEPARTURE, // 收集出发地
    COLLECTING_DESTINATION, // 收集目的地
    COLLECTING_DATE, // 收集日期
    CONFIRMING, // 确认订单
    COMPLETED // 完成
}

// 对话状态机
public class DialogStateMachine {

    private DialogState currentState; // 当前状态
    private Map<String, String> slots; // 槽位信息

    public DialogStateMachine() {
        this.currentState = DialogState.INITIAL; // 初始状态
        this.slots = new HashMap<>(); // 初始化槽位
    }

    // 处理用户输入
    public String process(String userInput) {
        // 根据当前状态处理输入
        switch (currentState) {
            case INITIAL:
                // 检查是否是订机票意图
                if (userInput.contains("订机票") || userInput.contains("买机票")) {
                    currentState = DialogState.COLLECTING_DEPARTURE; // 转换状态
                    return "请问您从哪里出发？"; // 返回提示
                }
                return "抱歉，我不太理解您的意思。"; // 无法识别

            case COLLECTING_DEPARTURE:
                // 提取出发地
                slots.put("departure", userInput); // 保存槽位
                currentState = DialogState.COLLECTING_DESTINATION; // 转换状态
                return "请问您要去哪里？"; // 返回提示

            case COLLECTING_DESTINATION:
                // 提取目的地
                slots.put("destination", userInput); // 保存槽位
                currentState = DialogState.COLLECTING_DATE; // 转换状态
                return "请问您什么时候出发？"; // 返回提示

            case COLLECTING_DATE:
                // 提取日期
                slots.put("date", userInput); // 保存槽位
                currentState = DialogState.CONFIRMING; // 转换状态
                return String.format("确认订单：从%s到%s，出发时间%s。确认吗？（是/否）",
                        slots.get("departure"), // 出发地
                        slots.get("destination"), // 目的地
                        slots.get("date")); // 日期

            case CONFIRMING:
                // 确认订单
                if ("是".equals(userInput) || "确认".equals(userInput)) {
                    currentState = DialogState.COMPLETED; // 转换状态
                    return "订单已提交，祝您旅途愉快！"; // 返回成功信息
                } else {
                    currentState = DialogState.INITIAL; // 重新开始
                    return "订单已取消。请问还需要订机票吗？"; // 返回提示
                }

            case COMPLETED:
                return "订单已完成。请问还有其他需要吗？"; // 已完成

            default:
                return "抱歉，系统出错。"; // 异常
        }
    }

    // 获取当前状态
    public DialogState getCurrentState() {
        return currentState; // 返回当前状态
    }

    // 获取槽位信息
    public Map<String, String> getSlots() {
        return slots; // 返回槽位
    }
}
```

---

## 5 对话流程编排

### 5.1 什么是流程编排？

流程编排就是定义对话的流程，控制对话的走向。

打个比方：

> **流程编排** 就像剧本。演员（AI）按照剧本（流程）一步步表演，不会跑偏。

### 5.2 流程编排示例

```java
// 对话流程定义
public class DialogFlow {

    private final List<DialogNode> nodes; // 节点列表
    private DialogNode currentNode; // 当前节点

    public DialogFlow() {
        this.nodes = new ArrayList<>(); // 初始化节点列表
        initFlow(); // 初始化流程
    }

    // 初始化流程
    private void initFlow() {
        // 创建节点
        DialogNode startNode = new DialogNode("start", "请问您要办什么业务？"); // 开始节点
        DialogNode flightNode = new DialogNode("book_flight", "请问您要去哪里？"); // 订机票节点
        DialogNode orderNode = new DialogNode("query_order", "请问您的订单号是多少？"); // 查询订单节点
        DialogNode endNode = new DialogNode("end", "感谢您的使用，再见！"); // 结束节点

        // 设置转换规则
        startNode.addTransition("book_flight", flightNode); // 订机票
        startNode.addTransition("query_order", orderNode); // 查询订单
        flightNode.addTransition("end", endNode); // 结束
        orderNode.addTransition("end", endNode); // 结束

        // 添加节点
        nodes.add(startNode); // 添加开始节点
        nodes.add(flightNode); // 添加订机票节点
        nodes.add(orderNode); // 添加查询订单节点
        nodes.add(endNode); // 添加结束节点

        // 设置当前节点
        currentNode = startNode; // 从开始节点开始
    }

    // 处理用户输入
    public String process(String userInput, String intent) {
        // 根据意图转换状态
        DialogNode nextNode = currentNode.getTransition(intent); // 获取下一个节点
        if (nextNode != null) {
            currentNode = nextNode; // 转换状态
            return currentNode.getResponse(); // 返回响应
        }
        return "抱歉，我不太理解您的意思。"; // 无法识别
    }
}

// 对话节点
class DialogNode {
    private final String id; // 节点ID
    private final String response; // 响应内容
    private final Map<String, DialogNode> transitions; // 转换规则

    public DialogNode(String id, String response) {
        this.id = id; // 设置ID
        this.response = response; // 设置响应
        this.transitions = new HashMap<>(); // 初始化转换规则
    }

    // 添加转换规则
    public void addTransition(String intent, DialogNode nextNode) {
        transitions.put(intent, nextNode); // 添加转换
    }

    // 获取转换节点
    public DialogNode getTransition(String intent) {
        return transitions.get(intent); // 返回下一个节点
    }

    // 获取响应
    public String getResponse() {
        return response; // 返回响应
    }
}
```

---

## 6 上下文管理策略

### 6.1 为什么需要上下文管理？

对话过程中，需要记住之前的信息：

```
用户：我想订一张去北京的机票
AI：好的，请问您什么时候出发？
用户：明天
AI：（需要记住"去北京"和"明天"）
```

### 6.2 上下文管理方法

#### 方法1：使用槽位

```java
// 使用槽位管理上下文
public class SlotBasedContextManager {

    private Map<String, String> slots; // 槽位映射

    public SlotBasedContextManager() {
        this.slots = new HashMap<>(); // 初始化槽位
    }

    // 更新槽位
    public void updateSlot(String key, String value) {
        slots.put(key, value); // 保存槽位
    }

    // 获取槽位
    public String getSlot(String key) {
        return slots.get(key); // 返回槽位值
    }

    // 检查槽位是否已填充
    public boolean hasSlot(String key) {
        return slots.containsKey(key); // 检查是否存在
    }

    // 清空槽位
    public void clearSlots() {
        slots.clear(); // 清空所有槽位
    }
}
```

#### 方法2：使用对话历史

```java
// 使用对话历史管理上下文
public class HistoryBasedContextManager {

    private List<ChatMessage> history; // 对话历史
    private int maxHistorySize; // 最大历史大小

    public HistoryBasedContextManager(int maxHistorySize) {
        this.history = new ArrayList<>(); // 初始化历史
        this.maxHistorySize = maxHistorySize; // 设置最大大小
    }

    // 添加消息
    public void addMessage(ChatMessage message) {
        history.add(message); // 添加消息
        // 如果超过最大大小，删除最早的消息
        if (history.size() > maxHistorySize) {
            history.remove(0); // 删除第一条
        }
    }

    // 获取对话历史
    public List<ChatMessage> getHistory() {
        return history; // 返回历史
    }

    // 清空历史
    public void clearHistory() {
        history.clear(); // 清空历史
    }
}
```

### 6.3 方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **槽位管理** | 结构化、易查询 | 只能存储键值对 | 任务型对话（如订机票） |
| **历史管理** | 灵活、保留完整上下文 | 占用空间大 | 自由对话、闲聊 |

---

## 7 Java 实现对话管理器

下面我们把前面学到的知识综合起来，用 Java 实现一个完整的对话管理器。

### 7.1 完整代码

```java
// 对话管理器
public class DialogManager {

    private final ChatLanguageModel model; // 大模型
    private DialogState currentState; // 当前状态
    private Map<String, String> slots; // 槽位信息
    private List<ChatMessage> history; // 对话历史

    // 对话状态枚举
    public enum DialogState {
        INITIAL, // 初始状态
        BOOKING_FLIGHT, // 订机票
        QUERY_ORDER, // 查询订单
        COMPLETED // 完成
    }

    // 构造器
    public DialogManager(ChatLanguageModel model) {
        this.model = model; // 保存模型引用
        this.currentState = DialogState.INITIAL; // 初始状态
        this.slots = new HashMap<>(); // 初始化槽位
        this.history = new ArrayList<>(); // 初始化历史
    }

    // 处理用户输入
    public String process(String userInput) {
        // 添加用户消息到历史
        history.add(new UserMessage(userInput)); // 记录用户消息

        // 根据当前状态处理
        String response;
        switch (currentState) {
            case INITIAL:
                response = handleInitial(userInput); // 处理初始状态
                break;
            case BOOKING_FLIGHT:
                response = handleBookingFlight(userInput); // 处理订机票
                break;
            case QUERY_ORDER:
                response = handleQueryOrder(userInput); // 处理查询订单
                break;
            case COMPLETED:
                response = "对话已结束。请问还有其他需要吗？"; // 已完成
                break;
            default:
                response = "抱歉，系统出错。"; // 异常
        }

        // 添加 AI 回复到历史
        history.add(new AiMessage(response)); // 记录 AI 回复
        return response; // 返回响应
    }

    // 处理初始状态
    private String handleInitial(String userInput) {
        // 意图识别
        String intent = recognizeIntent(userInput); // 识别意图

        switch (intent) {
            case "book_flight":
                currentState = DialogState.BOOKING_FLIGHT; // 转换状态
                return "好的，请问您从哪里出发？"; // 返回提示
            case "query_order":
                currentState = DialogState.QUERY_ORDER; // 转换状态
                return "好的，请问您的订单号是多少？"; // 返回提示
            default:
                return "抱歉，我不太理解您的意思。请问您要订机票还是查询订单？"; // 无法识别
        }
    }

    // 处理订机票
    private String handleBookingFlight(String userInput) {
        // 槽位填充
        Map<String, String> newSlots = fillSlots(userInput,
                List.of("departure", "destination", "date")); // 填充槽位
        slots.putAll(newSlots); // 合并槽位

        // 检查是否收集完所有信息
        if (!slots.containsKey("departure")) {
            return "请问您从哪里出发？"; // 缺少出发地
        }
        if (!slots.containsKey("destination")) {
            return "请问您要去哪里？"; // 缺少目的地
        }
        if (!slots.containsKey("date")) {
            return "请问您什么时候出发？"; // 缺少日期
        }

        // 所有信息已收集，确认订单
        String confirmPrompt = String.format(
                "确认订单：从%s到%s，出发时间%s。确认吗？（是/否）",
                slots.get("departure"), // 出发地
                slots.get("destination"), // 目的地
                slots.get("date") // 日期
        );
        currentState = DialogState.COMPLETED; // 转换状态
        return confirmPrompt; // 返回确认提示
    }

    // 处理查询订单
    private String handleQueryOrder(String userInput) {
        // 提取订单号
        Map<String, String> newSlots = fillSlots(userInput, List.of("orderId")); // 填充槽位
        String orderId = newSlots.get("orderId"); // 获取订单号

        if (orderId == null) {
            return "请问您的订单号是多少？"; // 缺少订单号
        }

        // 模拟查询订单
        currentState = DialogState.COMPLETED; // 转换状态
        return "订单 " + orderId + " 已发货，金额 299.99 元。"; // 返回订单信息
    }

    // 意图识别（使用大模型）
    private String recognizeIntent(String userInput) {
        String prompt = String.format("""
                请判断以下用户输入的意图，只能返回以下选项之一：
                - book_flight：订机票
                - query_order：查询订单
                - unknown：未知
                
                用户输入：%s
                
                意图：
                """, userInput);

        return model.generate(prompt).trim(); // 返回意图
    }

    // 槽位填充（使用大模型）
    private Map<String, String> fillSlots(String userInput, List<String> slotNames) {
        String prompt = String.format("""
                请从以下用户输入中提取关键信息，返回 JSON 格式。
                
                需要提取的字段：%s
                
                用户输入：%s
                
                请以 JSON 格式返回，只返回 JSON，不要其他内容。
                """, slotNames, userInput);

        String response = model.generate(prompt); // 获取响应

        try {
            ObjectMapper mapper = new ObjectMapper(); // JSON 解析器
            return mapper.readValue(response, Map.class); // 解析 JSON
        } catch (Exception e) {
            return new HashMap<>(); // 解析失败
        }
    }

    // 获取当前状态
    public DialogState getCurrentState() {
        return currentState; // 返回当前状态
    }

    // 获取槽位信息
    public Map<String, String> getSlots() {
        return slots; // 返回槽位
    }

    // 获取对话历史
    public List<ChatMessage> getHistory() {
        return history; // 返回历史
    }
}
```

### 7.2 使用示例

```java
// 使用示例
public class Main {
    public static void main(String[] args) {
        // 创建大模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        // 创建对话管理器
        DialogManager manager = new DialogManager(model);

        // 模拟对话
        System.out.println("用户：我想订一张机票");
        System.out.println("AI：" + manager.process("我想订一张机票"));
        // 输出：好的，请问您从哪里出发？

        System.out.println("\n用户：从北京出发");
        System.out.println("AI：" + manager.process("从北京出发"));
        // 输出：请问您要去哪里？

        System.out.println("\n用户：去上海");
        System.out.println("AI：" + manager.process("去上海"));
        // 输出：请问您什么时候出发？

        System.out.println("\n用户：明天");
        System.out.println("AI：" + manager.process("明天"));
        // 输出：确认订单：从北京到上海，出发时间明天。确认吗？（是/否）

        System.out.println("\n用户：确认");
        System.out.println("AI：" + manager.process("确认"));
        // 输出：订单已提交，祝您旅途愉快！
    }
}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **意图识别** | 判断用户想干什么 |
| **槽位填充** | 从用户输入中提取关键信息 |
| **状态机** | 管理对话状态，控制对话流程 |
| **流程编排** | 定义对话流程，引导对话走向 |
| **上下文管理** | 记住对话历史，保持上下文连贯 |
| **对话管理器** | 综合应用以上技术，实现结构化对话 |

---

## 9 新手常见误区

### 误区 1："意图识别必须用大模型"

不是的。意图识别有多种方法：

- **基于规则**：速度快、成本低，适合简单场景
- **基于大模型**：准确率高、泛化能力强，适合复杂场景

建议：简单场景用规则，复杂场景用大模型。

### 误区 2："状态机太复杂，不需要用"

错。状态机是对话管理的核心，它让对话变得**可控、可预测**。没有状态机，对话就像脱缰的野马，随时可能跑偏。

### 误区 3："槽位填充只能用正则"

不是的。槽位填充也有多种方法：

- **基于正则**：适合格式固定的信息（如日期、电话）
- **基于大模型**：适合复杂信息提取

建议：根据场景选择合适的方法。

### 误区 4："上下文管理就是保存对话历史"

不完全对。上下文管理有两种方法：

- **槽位管理**：结构化存储关键信息
- **历史管理**：保存完整对话历史

建议：任务型对话用槽位管理，自由对话用历史管理。

### 误区 5："对话管理器必须自己从头写"

不是的。有很多开源框架可以用：

- **Rasa**：Python 的对话管理框架
- **Dialogflow**：Google 的对话管理平台
- **LangChain**：也提供了对话管理功能

建议：先用框架，理解原理后再自己实现。

---

## 10 动手练习

### 练习 1：实现一个简单的意图识别器

实现一个基于规则的意图识别器，支持以下意图：

- `greeting`：打招呼（如"你好"、"嗨"）
- `goodbye`：告别（如"再见"、"拜拜"）
- `ask_time`：询问时间（如"几点了"、"现在时间"）
- `unknown`：未知

<details>
<summary>参考答案</summary>

```java
// 基于规则的意图识别器
public class SimpleIntentRecognizer {

    // 识别意图
    public String recognize(String userInput) {
        // 打招呼
        if (userInput.contains("你好") || userInput.contains("嗨") || userInput.contains("hello")) {
            return "greeting"; // 打招呼意图
        }
        // 告别
        else if (userInput.contains("再见") || userInput.contains("拜拜") || userInput.contains("bye")) {
            return "goodbye"; // 告别意图
        }
        // 询问时间
        else if (userInput.contains("几点") || userInput.contains("时间") || userInput.contains("what time")) {
            return "ask_time"; // 询问时间意图
        }
        // 未知
        else {
            return "unknown"; // 未知意图
        }
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        SimpleIntentRecognizer recognizer = new SimpleIntentRecognizer(); // 创建识别器

        System.out.println(recognizer.recognize("你好")); // 输出：greeting
        System.out.println(recognizer.recognize("再见")); // 输出：goodbye
        System.out.println(recognizer.recognize("现在几点了")); // 输出：ask_time
        System.out.println(recognizer.recognize("今天天气怎么样")); // 输出：unknown
    }
}
```

</details>

### 练习 2：实现一个槽位填充器

实现一个基于正则的槽位填充器，从用户输入中提取以下信息：

- `city`：城市（北京、上海、广州、深圳）
- `date`：日期（今天、明天、后天、yyyy-MM-dd）
- `phone`：手机号（11位数字）

<details>
<summary>参考答案</summary>

```java
// 基于正则的槽位填充器
public class RegexSlotFiller {

    // 填充槽位
    public Map<String, String> fillSlots(String userInput) {
        Map<String, String> slots = new HashMap<>(); // 槽位映射

        // 提取城市
        Pattern cityPattern = Pattern.compile("(北京|上海|广州|深圳)"); // 城市正则
        Matcher cityMatcher = cityPattern.matcher(userInput); // 匹配
        if (cityMatcher.find()) {
            slots.put("city", cityMatcher.group(1)); // 提取城市
        }

        // 提取日期
        Pattern datePattern = Pattern.compile("(今天|明天|后天|\\d{4}-\\d{2}-\\d{2})"); // 日期正则
        Matcher dateMatcher = datePattern.matcher(userInput); // 匹配
        if (dateMatcher.find()) {
            slots.put("date", dateMatcher.group(1)); // 提取日期
        }

        // 提取手机号
        Pattern phonePattern = Pattern.compile("1\\d{10}"); // 手机号正则
        Matcher phoneMatcher = phonePattern.matcher(userInput); // 匹配
        if (phoneMatcher.find()) {
            slots.put("phone", phoneMatcher.group()); // 提取手机号
        }

        return slots; // 返回槽位
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        RegexSlotFiller filler = new RegexSlotFiller(); // 创建填充器

        Map<String, String> slots = filler.fillSlots("我明天想去北京，手机号是13800138000"); // 填充槽位
        System.out.println(slots); // 输出：{date=明天, city=北京, phone=13800138000}
    }
}
```

</details>

### 练习 3：实现一个简单的对话状态机

实现一个订餐场景的对话状态机，包含以下状态：

- `INITIAL`：初始状态
- `SELECTING_FOOD`：选择食物
- `CONFIRMING_ORDER`：确认订单
- `COMPLETED`：完成

<details>
<summary>参考答案</summary>

```java
// 订餐对话状态机
public class OrderFoodStateMachine {

    private DialogState currentState; // 当前状态
    private Map<String, String> slots; // 槽位信息

    // 对话状态枚举
    public enum DialogState {
        INITIAL, // 初始状态
        SELECTING_FOOD, // 选择食物
        CONFIRMING_ORDER, // 确认订单
        COMPLETED // 完成
    }

    // 构造器
    public OrderFoodStateMachine() {
        this.currentState = DialogState.INITIAL; // 初始状态
        this.slots = new HashMap<>(); // 初始化槽位
    }

    // 处理用户输入
    public String process(String userInput) {
        switch (currentState) {
            case INITIAL:
                if (userInput.contains("订餐") || userInput.contains("点餐")) {
                    currentState = DialogState.SELECTING_FOOD; // 转换状态
                    return "请问您想吃什么？"; // 返回提示
                }
                return "抱歉，我不太理解您的意思。"; // 无法识别

            case SELECTING_FOOD:
                slots.put("food", userInput); // 保存食物
                currentState = DialogState.CONFIRMING_ORDER; // 转换状态
                return String.format("您点了%s，确认吗？（是/否）", userInput); // 返回确认提示

            case CONFIRMING_ORDER:
                if ("是".equals(userInput) || "确认".equals(userInput)) {
                    currentState = DialogState.COMPLETED; // 转换状态
                    return "订单已提交，请稍等！"; // 返回成功信息
                } else {
                    currentState = DialogState.INITIAL; // 重新开始
                    return "订单已取消。请问还需要订餐吗？"; // 返回提示
                }

            case COMPLETED:
                return "订单已完成。请问还有其他需要吗？"; // 已完成

            default:
                return "抱歉，系统出错。"; // 异常
        }
    }

    // 获取当前状态
    public DialogState getCurrentState() {
        return currentState; // 返回当前状态
    }

    // 获取槽位信息
    public Map<String, String> getSlots() {
        return slots; // 返回槽位
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        OrderFoodStateMachine machine = new OrderFoodStateMachine(); // 创建状态机

        System.out.println(machine.process("我想订餐")); // 输出：请问您想吃什么？
        System.out.println(machine.process("披萨")); // 输出：您点了披萨，确认吗？（是/否）
        System.out.println(machine.process("确认")); // 输出：订单已提交，请稍等！
    }
}
```

</details>

---

## 结语

恭喜你完成了本教程的学习！通过这12章的内容，我们从零开始，逐步掌握了 Java AI Agent 开发的核心知识。

让我们回顾一下学习的内容：

1. **基础篇**：大模型调用、Prompt 工程、输出解析
2. **进阶篇**：工具集成、记忆管理、Agent 智能体
3. **框架篇**：Spring AI、LangChain4j
4. **实战篇**：自定义工具开发、对话管理

希望这个教程能帮助你入门 Java AI Agent 开发，在未来的项目中构建出智能、实用的 AI 应用！
