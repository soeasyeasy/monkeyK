---
title: "第八章：多 Agent 协作"
description: "构建多 Agent 系统，实现复杂任务的分工协作"
---

# 第八章：多 Agent 协作

## 本章导读

在前面的章节中，我们学习了如何构建单个 AI Agent，让它能够思考、使用工具、记忆和利用知识库。但是，面对复杂的任务，单个 Agent 往往力不从心。

本章你将学习：
- 为什么需要多个 Agent 协作？
- 如何定义 Agent 的角色和职责？
- Agent 之间如何通信？
- 有哪些协作模式？
- 如何实现任务分发和结果汇总？
- 如何处理 Agent 之间的冲突？
- 如何在 Java 中实现多 Agent 系统？

通过本章学习，你将让你的 AI 从"单兵作战"升级为"团队协作"。

---

## 1 为什么需要多 Agent？

### 1.1 单个 Agent 的局限性

单个 Agent 虽然强大，但存在明显的局限：

| 局限 | 说明 | 例子 |
|-----|------|------|
| **能力有限** | 难以精通所有领域 | 既要写代码又要做设计 |
| **上下文限制** | 难以处理超长任务 | 复杂的项目开发 |
| **单点故障** | 一个环节出错全部失败 | 一个错误导致整个任务失败 |
| **效率低下** | 串行处理速度慢 | 多个子任务无法并行 |
| **难以扩展** | 增加功能需要修改整体 | 系统越来越复杂 |

### 1.2 生活化类比：团队 vs 全能选手

想象一下两个场景：

**场景一：全能选手**
一个人要完成所有工作：
- 写代码
- 做设计
- 写文档
- 测试
- 部署

结果：质量差、效率低、容易出错

**场景二：专业团队**
一个团队分工合作：
- 程序员：写代码
- 设计师：做设计
- 文档工程师：写文档
- 测试工程师：测试
- 运维工程师：部署

结果：质量高、效率高、各司其职

**多 Agent 系统就是组建一个 AI 团队**：
- 每个 Agent 有自己的专长
- Agent 之间可以协作
- 复杂任务分解给不同的 Agent
- 就像真实团队一样工作

### 1.3 多 Agent 的应用场景

| 场景 | Agent 角色 | 协作方式 |
|-----|----------|---------|
| **软件开发** | 需求分析、架构设计、编码、测试 | 串行协作 |
| **内容创作** | 策划、写作、编辑、审核 | 流水线 |
| **数据分析** | 数据收集、清洗、分析、可视化 | 并行+汇总 |
| **客服系统** | 问题分类、专业解答、质量检查 | 层级协作 |
| **研究助手** | 文献检索、摘要生成、报告撰写 | 混合协作 |

---

## 2 Agent 角色定义与职责划分

### 2.1 角色定义原则

定义 Agent 角色时遵循以下原则：

| 原则 | 说明 | 例子 |
|-----|------|------|
| **单一职责** | 每个 Agent 只做一件事 | 只负责写代码，不负责测试 |
| **能力匹配** | 角色与能力相匹配 | 代码 Agent 不需要会设计 |
| **明确边界** | 职责边界清晰 | 避免职责重叠 |
| **可组合** | 角色可以灵活组合 | 可以动态组建团队 |

### 2.2 Agent 角色接口

```java
// Agent 角色接口
public interface AgentRole {
    // 获取角色名称
    String getName();
    
    // 获取角色描述
    String getDescription();
    
    // 获取角色能力
    List<String> getCapabilities();
    
    // 获取系统提示
    String getSystemPrompt();
    
    // 处理任务
    AgentResponse handleTask(AgentTask task);
}

// Agent 任务
public class AgentTask {
    private final String id;           // 任务 ID
    private final String type;         // 任务类型
    private final String description;  // 任务描述
    private final Map<String, Object> data;  // 任务数据
    private final String assignee;     // 分配的 Agent
    
    public AgentTask(String id, String type, String description, 
                     Map<String, Object> data, String assignee) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.data = data != null ? data : new HashMap<>();
        this.assignee = assignee;
    }
    
    // getter 方法
    public String getId() { return id; }
    public String getType() { return type; }
    public String getDescription() { return description; }
    public Map<String, Object> getData() { return data; }
    public String getAssignee() { return assignee; }
}

// Agent 响应
public class AgentResponse {
    private final String taskId;       // 任务 ID
    private final boolean success;     // 是否成功
    private final String result;       // 结果
    private final String error;        // 错误信息
    private final Map<String, Object> metadata;  // 元数据
    
    public AgentResponse(String taskId, boolean success, String result, 
                         String error, Map<String, Object> metadata) {
        this.taskId = taskId;
        this.success = success;
        this.result = result;
        this.error = error;
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }
    
    // 创建成功响应
    public static AgentResponse success(String taskId, String result) {
        return new AgentResponse(taskId, true, result, null, null);
    }
    
    // 创建失败响应
    public static AgentResponse failure(String taskId, String error) {
        return new AgentResponse(taskId, false, null, error, null);
    }
    
    // getter 方法
    public String getTaskId() { return taskId; }
    public boolean isSuccess() { return success; }
    public String getResult() { return result; }
    public String getError() { return error; }
    public Map<String, Object> getMetadata() { return metadata; }
}
```

### 2.3 实现具体角色

```java
// 代码编写 Agent
public class CoderAgent implements AgentRole {
    private final OpenAiClient client;
    
    public CoderAgent(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    @Override
    public String getName() {
        return "Coder";
    }
    
    @Override
    public String getDescription() {
        return "负责编写代码的 Agent";
    }
    
    @Override
    public List<String> getCapabilities() {
        return Arrays.asList("编写代码", "代码重构", "Bug 修复");
    }
    
    @Override
    public String getSystemPrompt() {
        return "你是一个专业的程序员。你的任务是根据需求编写高质量的代码。\n" +
               "要求：\n" +
               "1. 代码简洁清晰\n" +
               "2. 遵循最佳实践\n" +
               "3. 包含必要的注释\n" +
               "4. 考虑边界情况";
    }
    
    @Override
    public AgentResponse handleTask(AgentTask task) {
        try {
            // 构建请求
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(
                    Message.system(getSystemPrompt()),
                    Message.user(task.getDescription())
                ))
                .build();
            
            // 调用 AI
            ChatCompletionResponse response = client.chatCompletion(request);
            String code = response.getChoices().get(0).getMessage().getContent();
            
            return AgentResponse.success(task.getId(), code);
        } catch (Exception e) {
            return AgentResponse.failure(task.getId(), e.getMessage());
        }
    }
}

// 代码审查 Agent
public class ReviewerAgent implements AgentRole {
    private final OpenAiClient client;
    
    public ReviewerAgent(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    @Override
    public String getName() {
        return "Reviewer";
    }
    
    @Override
    public String getDescription() {
        return "负责审查代码质量的 Agent";
    }
    
    @Override
    public List<String> getCapabilities() {
        return Arrays.asList("代码审查", "质量评估", "改进建议");
    }
    
    @Override
    public String getSystemPrompt() {
        return "你是一个资深的代码审查专家。你的任务是审查代码质量并提供改进建议。\n" +
               "审查要点：\n" +
               "1. 代码是否简洁清晰\n" +
               "2. 是否遵循最佳实践\n" +
               "3. 是否有潜在 Bug\n" +
               "4. 性能是否优化\n" +
               "5. 安全性是否考虑";
    }
    
    @Override
    public AgentResponse handleTask(AgentTask task) {
        try {
            String code = (String) task.getData().get("code");
            
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(
                    Message.system(getSystemPrompt()),
                    Message.user("请审查以下代码：\n\n" + code)
                ))
                .build();
            
            ChatCompletionResponse response = client.chatCompletion(request);
            String review = response.getChoices().get(0).getMessage().getContent();
            
            return AgentResponse.success(task.getId(), review);
        } catch (Exception e) {
            return AgentResponse.failure(task.getId(), e.getMessage());
        }
    }
}

// 测试 Agent
public class TesterAgent implements AgentRole {
    private final OpenAiClient client;
    
    public TesterAgent(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    @Override
    public String getName() {
        return "Tester";
    }
    
    @Override
    public String getDescription() {
        return "负责编写测试用例的 Agent";
    }
    
    @Override
    public List<String> getCapabilities() {
        return Arrays.asList("编写测试", "测试覆盖", "Bug 发现");
    }
    
    @Override
    public String getSystemPrompt() {
        return "你是一个专业的测试工程师。你的任务是为代码编写全面的测试用例。\n" +
               "要求：\n" +
               "1. 覆盖正常情况\n" +
               "2. 覆盖边界情况\n" +
               "3. 覆盖异常情况\n" +
               "4. 测试用例清晰易懂";
    }
    
    @Override
    public AgentResponse handleTask(AgentTask task) {
        try {
            String code = (String) task.getData().get("code");
            
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(
                    Message.system(getSystemPrompt()),
                    Message.user("请为以下代码编写测试用例：\n\n" + code)
                ))
                .build();
            
            ChatCompletionResponse response = client.chatCompletion(request);
            String tests = response.getChoices().get(0).getMessage().getContent();
            
            return AgentResponse.success(task.getId(), tests);
        } catch (Exception e) {
            return AgentResponse.failure(task.getId(), e.getMessage());
        }
    }
}
```

---

## 3 通信机制

### 3.1 通信方式对比

| 方式 | 说明 | 优点 | 缺点 |
|-----|------|------|------|
| **直接消息** | Agent 之间直接发送消息 | 简单直接 | 耦合度高 |
| **消息队列** | 通过队列传递消息 | 解耦、异步 | 实现复杂 |
| **事件驱动** | 通过事件触发 | 松耦合 | 调试困难 |
| **共享状态** | 通过共享数据通信 | 简单 | 并发问题 |

### 3.2 消息类定义

```java
// Agent 消息
public class AgentMessage {
    private final String id;           // 消息 ID
    private final String from;         // 发送者
    private final String to;           // 接收者
    private final String type;         // 消息类型
    private final Object content;      // 消息内容
    private final long timestamp;      // 时间戳
    private final Map<String, Object> metadata;  // 元数据
    
    public AgentMessage(String from, String to, String type, Object content) {
        this.id = UUID.randomUUID().toString();
        this.from = from;
        this.to = to;
        this.type = type;
        this.content = content;
        this.timestamp = System.currentTimeMillis();
        this.metadata = new HashMap<>();
    }
    
    // getter 方法
    public String getId() { return id; }
    public String getFrom() { return from; }
    public String getTo() { return to; }
    public String getType() { return type; }
    public Object getContent() { return content; }
    public long getTimestamp() { return timestamp; }
    public Map<String, Object> getMetadata() { return metadata; }
    
    // 消息类型常量
    public static final String TYPE_TASK = "task";           // 任务
    public static final String TYPE_RESULT = "result";       // 结果
    public static final String TYPE_REQUEST = "request";     // 请求
    public static final String TYPE_RESPONSE = "response";   // 响应
    public static final String TYPE_EVENT = "event";         // 事件
}
```

### 3.3 消息总线

```java
// 消息总线
public class MessageBus {
    // 消息队列
    private final BlockingQueue<AgentMessage> queue = new LinkedBlockingQueue<>();
    // 订阅者
    private final Map<String, List<MessageHandler>> subscribers = new ConcurrentHashMap<>();
    // 运行状态
    private volatile boolean running = true;
    
    // 发送消息
    public void send(AgentMessage message) {
        try {
            queue.put(message);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
    
    // 订阅消息
    public void subscribe(String messageType, MessageHandler handler) {
        subscribers.computeIfAbsent(messageType, k -> new CopyOnWriteArrayList<>())
                   .add(handler);
    }
    
    // 取消订阅
    public void unsubscribe(String messageType, MessageHandler handler) {
        List<MessageHandler> handlers = subscribers.get(messageType);
        if (handlers != null) {
            handlers.remove(handler);
        }
    }
    
    // 启动消息处理
    public void start() {
        Thread thread = new Thread(() -> {
            while (running) {
                try {
                    // 获取消息
                    AgentMessage message = queue.poll(100, TimeUnit.MILLISECONDS);
                    if (message != null) {
                        // 分发消息
                        dispatch(message);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        thread.setDaemon(true);
        thread.start();
    }
    
    // 停止
    public void stop() {
        running = false;
    }
    
    // 分发消息
    private void dispatch(AgentMessage message) {
        // 按类型分发
        List<MessageHandler> handlers = subscribers.get(message.getType());
        if (handlers != null) {
            for (MessageHandler handler : handlers) {
                try {
                    handler.handle(message);
                } catch (Exception e) {
                    System.err.println("处理消息失败: " + e.getMessage());
                }
            }
        }
        
        // 按接收者分发
        List<MessageHandler> receiverHandlers = subscribers.get("to:" + message.getTo());
        if (receiverHandlers != null) {
            for (MessageHandler handler : receiverHandlers) {
                try {
                    handler.handle(message);
                } catch (Exception e) {
                    System.err.println("处理消息失败: " + e.getMessage());
                }
            }
        }
    }
}

// 消息处理器接口
public interface MessageHandler {
    void handle(AgentMessage message);
}
```

### 3.4 事件驱动通信

```java
// 事件类
public class AgentEvent {
    private final String type;         // 事件类型
    private final String source;       // 事件源
    private final Object data;         // 事件数据
    private final long timestamp;      // 时间戳
    
    public AgentEvent(String type, String source, Object data) {
        this.type = type;
        this.source = source;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }
    
    // getter 方法
    public String getType() { return type; }
    public String getSource() { return source; }
    public Object getData() { return data; }
    public long getTimestamp() { return timestamp; }
}

// 事件总线
public class EventBus {
    // 事件监听器
    private final Map<String, List<EventListener>> listeners = new ConcurrentHashMap<>();
    
    // 发布事件
    public void publish(AgentEvent event) {
        List<EventListener> eventListeners = listeners.get(event.getType());
        if (eventListeners != null) {
            for (EventListener listener : eventListeners) {
                try {
                    listener.onEvent(event);
                } catch (Exception e) {
                    System.err.println("处理事件失败: " + e.getMessage());
                }
            }
        }
    }
    
    // 订阅事件
    public void subscribe(String eventType, EventListener listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
                 .add(listener);
    }
    
    // 取消订阅
    public void unsubscribe(String eventType, EventListener listener) {
        List<EventListener> eventListeners = listeners.get(eventType);
        if (eventListeners != null) {
            eventListeners.remove(listener);
        }
    }
}

// 事件监听器接口
public interface EventListener {
    void onEvent(AgentEvent event);
}
```

---

## 4 协作模式

### 4.1 协作模式对比

| 模式 | 说明 | 优点 | 缺点 | 适用场景 |
|-----|------|------|------|---------|
| **串行** | 任务按顺序执行 | 简单、可控 | 速度慢 | 有依赖关系 |
| **并行** | 任务同时执行 | 速度快 | 需要汇总 | 无依赖关系 |
| **层级** | 主 Agent 分配任务 | 结构清晰 | 主 Agent 是瓶颈 | 复杂任务 |
| **流水线** | 像工厂流水线 | 高效 | 需要平衡 | 重复任务 |
| **协商** | Agent 之间协商 | 灵活 | 复杂 | 冲突解决 |

### 4.2 串行协作

```java
// 串行协作管理器
public class SequentialCollaboration {
    private final Map<String, AgentRole> agents = new HashMap<>();
    
    // 注册 Agent
    public void registerAgent(AgentRole agent) {
        agents.put(agent.getName(), agent);
    }
    
    // 执行任务链
    public String executeChain(String initialInput, List<String> agentNames) {
        String currentInput = initialInput;
        String currentTaskId = UUID.randomUUID().toString();
        
        for (String agentName : agentNames) {
            AgentRole agent = agents.get(agentName);
            if (agent == null) {
                throw new IllegalArgumentException("Agent 不存在: " + agentName);
            }
            
            // 创建任务
            Map<String, Object> data = new HashMap<>();
            data.put("input", currentInput);
            AgentTask task = new AgentTask(currentTaskId, "process", 
                                          agent.getDescription(), data, agentName);
            
            // 执行任务
            AgentResponse response = agent.handleTask(task);
            if (!response.isSuccess()) {
                throw new RuntimeException("任务失败: " + response.getError());
            }
            
            // 更新输入为当前输出
            currentInput = response.getResult();
            System.out.println(agentName + " 完成任务");
        }
        
        return currentInput;
    }
}

// 使用示例
SequentialCollaboration collaboration = new SequentialCollaboration();
collaboration.registerAgent(new CoderAgent("api-key"));
collaboration.registerAgent(new ReviewerAgent("api-key"));
collaboration.registerAgent(new TesterAgent("api-key"));

// 串行执行：编码 -> 审查 -> 测试
String result = collaboration.executeChain(
    "编写一个计算斐波那契数列的函数",
    Arrays.asList("Coder", "Reviewer", "Tester")
);
```

### 4.3 并行协作

```java
// 并行协作管理器
public class ParallelCollaboration {
    private final Map<String, AgentRole> agents = new HashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(10);
    
    // 注册 Agent
    public void registerAgent(AgentRole agent) {
        agents.put(agent.getName(), agent);
    }
    
    // 并行执行任务
    public Map<String, String> executeParallel(String taskDescription, 
                                                List<String> agentNames) {
        // 创建任务列表
        List<Future<AgentResponse>> futures = new ArrayList<>();
        Map<Future<AgentResponse>, String> futureToAgent = new HashMap<>();
        
        for (String agentName : agentNames) {
            AgentRole agent = agents.get(agentName);
            if (agent == null) {
                throw new IllegalArgumentException("Agent 不存在: " + agentName);
            }
            
            // 创建任务
            String taskId = UUID.randomUUID().toString();
            AgentTask task = new AgentTask(taskId, "process", taskDescription, 
                                          new HashMap<>(), agentName);
            
            // 提交到线程池
            Future<AgentResponse> future = executor.submit(() -> agent.handleTask(task));
            futures.add(future);
            futureToAgent.put(future, agentName);
        }
        
        // 收集结果
        Map<String, String> results = new HashMap<>();
        for (Future<AgentResponse> future : futures) {
            try {
                AgentResponse response = future.get(60, TimeUnit.SECONDS);
                String agentName = futureToAgent.get(future);
                
                if (response.isSuccess()) {
                    results.put(agentName, response.getResult());
                    System.out.println(agentName + " 完成任务");
                } else {
                    results.put(agentName, "失败: " + response.getError());
                    System.err.println(agentName + " 任务失败: " + response.getError());
                }
            } catch (Exception e) {
                String agentName = futureToAgent.get(future);
                results.put(agentName, "异常: " + e.getMessage());
                System.err.println(agentName + " 任务异常: " + e.getMessage());
            }
        }
        
        return results;
    }
    
    // 关闭线程池
    public void shutdown() {
        executor.shutdown();
    }
}

// 使用示例
ParallelCollaboration collaboration = new ParallelCollaboration();
collaboration.registerAgent(new ResearcherAgent("api-key"));
collaboration.registerAgent(new AnalystAgent("api-key"));
collaboration.registerAgent(new WriterAgent("api-key"));

// 并行执行：研究、分析、写作同时进行
Map<String, String> results = collaboration.executeParallel(
    "关于人工智能的发展",
    Arrays.asList("Researcher", "Analyst", "Writer")
);
```

### 4.4 层级协作

```java
// 层级协作管理器
public class HierarchicalCollaboration {
    private final AgentRole manager;  // 管理者 Agent
    private final Map<String, AgentRole> workers = new HashMap<>();  // 工作者 Agent
    private final OpenAiClient client;
    
    public HierarchicalCollaboration(AgentRole manager, String apiKey) {
        this.manager = manager;
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    // 注册工作者
    public void registerWorker(AgentRole worker) {
        workers.put(worker.getName(), worker);
    }
    
    // 执行任务
    public String execute(String taskDescription) {
        // 1. 管理者分解任务
        List<SubTask> subTasks = decomposeTask(taskDescription);
        System.out.println("分解为 " + subTasks.size() + " 个子任务");
        
        // 2. 分配并执行子任务
        Map<String, String> subResults = new HashMap<>();
        for (SubTask subTask : subTasks) {
            AgentRole worker = workers.get(subTask.getAssignee());
            if (worker == null) {
                System.err.println("工作者不存在: " + subTask.getAssignee());
                continue;
            }
            
            AgentTask task = new AgentTask(
                UUID.randomUUID().toString(),
                subTask.getType(),
                subTask.getDescription(),
                subTask.getData(),
                subTask.getAssignee()
            );
            
            AgentResponse response = worker.handleTask(task);
            if (response.isSuccess()) {
                subResults.put(subTask.getAssignee(), response.getResult());
                System.out.println(subTask.getAssignee() + " 完成子任务");
            } else {
                System.err.println(subTask.getAssignee() + " 子任务失败: " + response.getError());
            }
        }
        
        // 3. 管理者汇总结果
        String finalResult = synthesizeResults(taskDescription, subResults);
        return finalResult;
    }
    
    // 分解任务
    private List<SubTask> decomposeTask(String taskDescription) {
        // 构建工作者列表
        StringBuilder workerList = new StringBuilder();
        for (AgentRole worker : workers.values()) {
            workerList.append("- ").append(worker.getName())
                      .append(": ").append(worker.getDescription())
                      .append("\n");
        }
        
        // 调用管理者 Agent 分解任务
        String prompt = "请将以下任务分解为子任务，并分配给合适的工作者。\n\n" +
                       "任务: " + taskDescription + "\n\n" +
                       "可用工作者:\n" + workerList.toString() + "\n" +
                       "请以 JSON 格式返回，每个子任务包含 assignee、type、description 字段。";
        
        ChatCompletionResponse response = client.chatCompletion(
            ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(Message.user(prompt)))
                .build()
        );
        
        String result = response.getChoices().get(0).getMessage().getContent();
        
        // 解析 JSON（简化版）
        return parseSubTasks(result);
    }
    
    // 解析子任务
    private List<SubTask> parseSubTasks(String json) {
        // 实际项目中使用 Jackson 解析
        List<SubTask> subTasks = new ArrayList<>();
        // 这里简化处理
        return subTasks;
    }
    
    // 汇总结果
    private String synthesizeResults(String originalTask, Map<String, String> results) {
        StringBuilder resultSummary = new StringBuilder();
        for (Map.Entry<String, String> entry : results.entrySet()) {
            resultSummary.append("【").append(entry.getKey()).append("的结果】\n");
            resultSummary.append(entry.getValue()).append("\n\n");
        }
        
        String prompt = "请汇总以下子任务的结果，生成最终答案。\n\n" +
                       "原始任务: " + originalTask + "\n\n" +
                       "子任务结果:\n" + resultSummary.toString();
        
        ChatCompletionResponse response = client.chatCompletion(
            ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(Message.user(prompt)))
                .build()
        );
        
        return response.getChoices().get(0).getMessage().getContent();
    }
    
    // 子任务类
    private static class SubTask {
        private final String assignee;
        private final String type;
        private final String description;
        private final Map<String, Object> data;
        
        public SubTask(String assignee, String type, String description, 
                      Map<String, Object> data) {
            this.assignee = assignee;
            this.type = type;
            this.description = description;
            this.data = data;
        }
        
        public String getAssignee() { return assignee; }
        public String getType() { return type; }
        public String getDescription() { return description; }
        public Map<String, Object> getData() { return data; }
    }
}
```

---

## 5 任务分发与结果汇总

### 5.1 任务分发策略

```java
// 任务分发器
public class TaskDispatcher {
    private final Map<String, AgentRole> agents = new HashMap<>();
    private final Map<String, List<String>> capabilityToAgents = new HashMap<>();
    
    // 注册 Agent
    public void registerAgent(AgentRole agent) {
        agents.put(agent.getName(), agent);
        // 建立能力索引
        for (String capability : agent.getCapabilities()) {
            capabilityToAgents.computeIfAbsent(capability, k -> new ArrayList<>())
                              .add(agent.getName());
        }
    }
    
    // 根据能力分发任务
    public AgentResponse dispatchByCapability(String capability, AgentTask task) {
        List<String> candidateAgents = capabilityToAgents.get(capability);
        if (candidateAgents == null || candidateAgents.isEmpty()) {
            return AgentResponse.failure(task.getId(), "没有具备该能力的 Agent");
        }
        
        // 选择第一个可用的 Agent（可以扩展为负载均衡）
        String agentName = candidateAgents.get(0);
        AgentRole agent = agents.get(agentName);
        
        return agent.handleTask(task);
    }
    
    // 根据名称分发任务
    public AgentResponse dispatchByName(String agentName, AgentTask task) {
        AgentRole agent = agents.get(agentName);
        if (agent == null) {
            return AgentResponse.failure(task.getId(), "Agent 不存在");
        }
        return agent.handleTask(task);
    }
    
    // 智能分发（根据任务描述自动选择）
    public AgentResponse dispatchIntelligently(AgentTask task) {
        // 调用 LLM 选择合适的 Agent
        // 这里简化实现
        return dispatchByName(task.getAssignee(), task);
    }
}
```

### 5.2 结果汇总器

```java
// 结果汇总器
public class ResultAggregator {
    private final OpenAiClient client;
    
    public ResultAggregator(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    // 简单汇总（合并结果）
    public String simpleAggregate(Map<String, String> results) {
        StringBuilder aggregated = new StringBuilder();
        for (Map.Entry<String, String> entry : results.entrySet()) {
            aggregated.append("【").append(entry.getKey()).append("】\n");
            aggregated.append(entry.getValue()).append("\n\n");
        }
        return aggregated.toString();
    }
    
    // 智能汇总（使用 LLM）
    public String intelligentAggregate(String originalTask, Map<String, String> results) {
        StringBuilder resultSummary = new StringBuilder();
        for (Map.Entry<String, String> entry : results.entrySet()) {
            resultSummary.append("【").append(entry.getKey()).append("的结果】\n");
            resultSummary.append(entry.getValue()).append("\n\n");
        }
        
        String prompt = "请汇总以下多个 Agent 的结果，生成一个完整、连贯的最终答案。\n\n" +
                       "原始任务: " + originalTask + "\n\n" +
                       "各 Agent 的结果:\n" + resultSummary.toString() + "\n" +
                       "要求：\n" +
                       "1. 整合所有结果\n" +
                       "2. 去除重复内容\n" +
                       "3. 保持逻辑连贯\n" +
                       "4. 语言简洁明了";
        
        ChatCompletionResponse response = client.chatCompletion(
            ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(Message.user(prompt)))
                .build()
        );
        
        return response.getChoices().get(0).getMessage().getContent();
    }
    
    // 投票汇总（多个 Agent 给出相同类型的答案）
    public String votingAggregate(List<String> results) {
        // 统计出现次数
        Map<String, Integer> votes = new HashMap<>();
        for (String result : results) {
            votes.put(result, votes.getOrDefault(result, 0) + 1);
        }
        
        // 返回票数最高的
        return votes.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("");
    }
}
```

---

## 6 冲突解决策略

### 6.1 冲突类型

| 冲突类型 | 说明 | 例子 |
|---------|------|------|
| **结果冲突** | 不同 Agent 给出不同结果 | 两个 Agent 给出不同答案 |
| **资源冲突** | 多个 Agent 竞争同一资源 | 同时访问同一数据 |
| **任务冲突** | 任务分配不明确 | 多个 Agent 都想做同一任务 |
| **优先级冲突** | 任务优先级不一致 | 紧急任务与普通任务冲突 |

### 6.2 冲突解决策略

```java
// 冲突解决器
public class ConflictResolver {
    private final OpenAiClient client;
    
    public ConflictResolver(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    // 策略 1：投票法
    public String resolveByVoting(List<String> results) {
        // 统计每个结果的出现次数
        Map<String, Integer> votes = new HashMap<>();
        for (String result : results) {
            votes.put(result, votes.getOrDefault(result, 0) + 1);
        }
        
        // 返回票数最高的
        return votes.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(results.get(0));
    }
    
    // 策略 2：加权平均法
    public String resolveByWeightedAverage(Map<String, String> results, 
                                           Map<String, Double> weights) {
        // 根据权重选择
        return results.entrySet().stream()
            .max(Comparator.comparingDouble(e -> weights.getOrDefault(e.getKey(), 1.0)))
            .map(Map.Entry::getValue)
            .orElse("");
    }
    
    // 策略 3：仲裁法（使用 LLM 仲裁）
    public String resolveByArbitration(String task, Map<String, String> results) {
        StringBuilder resultSummary = new StringBuilder();
        for (Map.Entry<String, String> entry : results.entrySet()) {
            resultSummary.append("【").append(entry.getKey()).append("的观点】\n");
            resultSummary.append(entry.getValue()).append("\n\n");
        }
        
        String prompt = "以下多个专家对同一个问题给出了不同的答案。\n" +
                       "请作为仲裁者，分析各个答案的优缺点，给出最终答案。\n\n" +
                       "问题: " + task + "\n\n" +
                       "各专家的答案:\n" + resultSummary.toString() + "\n" +
                       "请给出你的最终答案，并说明理由。";
        
        ChatCompletionResponse response = client.chatCompletion(
            ChatCompletionRequest.builder()
                .model("gpt-4")
                .messages(List.of(Message.user(prompt)))
                .build()
        );
        
        return response.getChoices().get(0).getMessage().getContent();
    }
    
    // 策略 4：多数服从少数
    public String resolveByMajority(List<String> results) {
        // 统计
        Map<String, Integer> counts = new HashMap<>();
        for (String result : results) {
            counts.put(result, counts.getOrDefault(result, 0) + 1);
        }
        
        // 找出最多的
        int maxCount = counts.values().stream().max(Integer::compareTo).orElse(0);
        return counts.entrySet().stream()
            .filter(e -> e.getValue() == maxCount)
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse(results.get(0));
    }
}
```

---

## 7 Java 实现多 Agent 协作框架

### 7.1 Agent 系统主类

```java
// 多 Agent 系统
public class MultiAgentSystem {
    private final Map<String, AgentRole> agents = new HashMap<>();
    private final MessageBus messageBus;
    private final EventBus eventBus;
    private final TaskDispatcher dispatcher;
    private final ResultAggregator aggregator;
    private final ConflictResolver conflictResolver;
    
    public MultiAgentSystem(String apiKey) {
        this.messageBus = new MessageBus();
        this.eventBus = new EventBus();
        this.dispatcher = new TaskDispatcher();
        this.aggregator = new ResultAggregator(apiKey);
        this.conflictResolver = new ConflictResolver(apiKey);
        
        // 启动消息总线
        messageBus.start();
    }
    
    // 注册 Agent
    public void registerAgent(AgentRole agent) {
        agents.put(agent.getName(), agent);
        dispatcher.registerAgent(agent);
        
        // 订阅消息
        messageBus.subscribe("to:" + agent.getName(), message -> {
            if (message.getType().equals(AgentMessage.TYPE_TASK)) {
                AgentTask task = (AgentTask) message.getContent();
                AgentResponse response = agent.handleTask(task);
                
                // 发送响应
                AgentMessage responseMessage = new AgentMessage(
                    agent.getName(),
                    message.getFrom(),
                    AgentMessage.TYPE_RESULT,
                    response
                );
                messageBus.send(responseMessage);
            }
        });
        
        System.out.println("Agent 注册成功: " + agent.getName());
    }
    
    // 串行执行
    public String executeSequential(String input, List<String> agentNames) {
        String current = input;
        for (String agentName : agentNames) {
            AgentRole agent = agents.get(agentName);
            if (agent == null) {
                throw new IllegalArgumentException("Agent 不存在: " + agentName);
            }
            
            AgentTask task = new AgentTask(
                UUID.randomUUID().toString(),
                "process",
                current,
                new HashMap<>(),
                agentName
            );
            
            AgentResponse response = agent.handleTask(task);
            if (!response.isSuccess()) {
                throw new RuntimeException("任务失败: " + response.getError());
            }
            current = response.getResult();
        }
        return current;
    }
    
    // 并行执行
    public Map<String, String> executeParallel(String task, List<String> agentNames) {
        ExecutorService executor = Executors.newFixedThreadPool(agentNames.size());
        List<Future<AgentResponse>> futures = new ArrayList<>();
        Map<Future<AgentResponse>, String> futureMap = new HashMap<>();
        
        for (String agentName : agentNames) {
            AgentRole agent = agents.get(agentName);
            AgentTask agentTask = new AgentTask(
                UUID.randomUUID().toString(),
                "process",
                task,
                new HashMap<>(),
                agentName
            );
            
            Future<AgentResponse> future = executor.submit(() -> agent.handleTask(agentTask));
            futures.add(future);
            futureMap.put(future, agentName);
        }
        
        Map<String, String> results = new HashMap<>();
        for (Future<AgentResponse> future : futures) {
            try {
                AgentResponse response = future.get(60, TimeUnit.SECONDS);
                String agentName = futureMap.get(future);
                results.put(agentName, response.isSuccess() ? 
                    response.getResult() : "失败: " + response.getError());
            } catch (Exception e) {
                String agentName = futureMap.get(future);
                results.put(agentName, "异常: " + e.getMessage());
            }
        }
        
        executor.shutdown();
        return results;
    }
    
    // 层级执行
    public String executeHierarchical(String task, String managerName, 
                                     List<String> workerNames) {
        AgentRole manager = agents.get(managerName);
        if (manager == null) {
            throw new IllegalArgumentException("管理者不存在: " + managerName);
        }
        
        // 管理者分解任务
        // 这里简化实现
        Map<String, String> results = new HashMap<>();
        for (String workerName : workerNames) {
            AgentRole worker = agents.get(workerName);
            AgentTask workerTask = new AgentTask(
                UUID.randomUUID().toString(),
                "subtask",
                task,
                new HashMap<>(),
                workerName
            );
            
            AgentResponse response = worker.handleTask(workerTask);
            if (response.isSuccess()) {
                results.put(workerName, response.getResult());
            }
        }
        
        // 汇总结果
        return aggregator.intelligentAggregate(task, results);
    }
    
    // 关闭系统
    public void shutdown() {
        messageBus.stop();
        System.out.println("多 Agent 系统已关闭");
    }
}
```

### 7.2 使用示例

```java
// 主程序
public class Main {
    public static void main(String[] args) {
        // 创建多 Agent 系统
        MultiAgentSystem system = new MultiAgentSystem("api-key");
        
        // 注册 Agent
        system.registerAgent(new CoderAgent("api-key"));
        system.registerAgent(new ReviewerAgent("api-key"));
        system.registerAgent(new TesterAgent("api-key"));
        
        // 串行执行：编码 -> 审查 -> 测试
        System.out.println("=== 串行执行 ===");
        String result = system.executeSequential(
            "编写一个计算斐波那契数列的函数",
            Arrays.asList("Coder", "Reviewer", "Tester")
        );
        System.out.println("最终结果: " + result);
        
        // 并行执行
        System.out.println("\n=== 并行执行 ===");
        Map<String, String> parallelResults = system.executeParallel(
            "分析人工智能的发展趋势",
            Arrays.asList("Researcher", "Analyst", "Writer")
        );
        parallelResults.forEach((k, v) -> System.out.println(k + ": " + v));
        
        // 关闭系统
        system.shutdown();
    }
}
```

---

## 8 对比表格

### 8.1 协作模式对比

| 模式 | 实现复杂度 | 执行效率 | 灵活性 | 适用场景 |
|-----|----------|---------|--------|---------|
| **串行** | 低 | 慢 | 低 | 有依赖关系 |
| **并行** | 中 | 快 | 中 | 无依赖关系 |
| **层级** | 高 | 中 | 高 | 复杂任务 |
| **流水线** | 中 | 快 | 中 | 重复任务 |
| **协商** | 高 | 慢 | 最高 | 冲突解决 |

### 8.2 通信方式对比

| 方式 | 耦合度 | 实时性 | 可靠性 | 适用场景 |
|-----|-------|--------|--------|---------|
| **直接消息** | 高 | 高 | 中 | 简单场景 |
| **消息队列** | 低 | 中 | 高 | 异步处理 |
| **事件驱动** | 最低 | 高 | 中 | 松耦合 |
| **共享状态** | 中 | 最高 | 低 | 简单共享 |

---

## 9 新手常见误区

### 误区 1：Agent 越多越好

**错误想法**：创建很多 Agent，每个 Agent 做一点点事。

**正确做法**：Agent 数量要合理，避免过度拆分。

```java
// ❌ 过度拆分
registerAgent(new AddAgent());      // 只做加法
registerAgent(new SubtractAgent()); // 只做减法
registerAgent(new MultiplyAgent()); // 只做乘法

// ✅ 合理拆分
registerAgent(new CalculatorAgent()); // 负责所有计算
registerAgent(new DisplayAgent());    // 负责显示结果
```

### 误区 2：忽略通信开销

**错误想法**：Agent 之间频繁通信。

**正确做法**：减少不必要的通信，批量传递数据。

```java
// ❌ 频繁通信
for (String item : items) {
    sendMessage(agent, item);  // 每条消息都有开销
}

// ✅ 批量传递
sendMessage(agent, items);  // 一次性传递所有数据
```

### 误区 3：没有错误处理

**错误想法**：Agent 不会失败。

**正确做法**：必须处理 Agent 失败的情况。

```java
// ❌ 不处理失败
AgentResponse response = agent.handleTask(task);
String result = response.getResult();  // 可能为空

// ✅ 处理失败
AgentResponse response = agent.handleTask(task);
if (!response.isSuccess()) {
    // 重试或降级
    return handleFailure(task, response.getError());
}
```

### 误区 4：Agent 职责不清

**错误想法**：一个 Agent 可以做很多事情。

**正确做法**：遵循单一职责原则。

```java
// ❌ 职责不清
public class SuperAgent implements AgentRole {
    // 既能写代码，又能测试，还能做设计
}

// ✅ 单一职责
public class CoderAgent implements AgentRole {
    // 只负责写代码
}
public class TesterAgent implements AgentRole {
    // 只负责测试
}
```

### 误区 5：忽略结果一致性

**错误想法**：多个 Agent 的结果直接合并就行。

**正确做法**：需要考虑结果冲突和一致性。

```java
// ❌ 直接合并
String result = result1 + result2 + result3;

// ✅ 智能汇总
String result = aggregator.intelligentAggregate(task, results);
```

---

## 10 动手练习

### 练习 1：实现一个简单的 Agent 角色

实现一个"翻译 Agent"，能够将文本翻译成指定语言。

<details>
<summary>点击查看答案</summary>

```java
// 翻译 Agent
public class TranslatorAgent implements AgentRole {
    private final OpenAiClient client;
    
    public TranslatorAgent(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    @Override
    public String getName() {
        return "Translator";
    }
    
    @Override
    public String getDescription() {
        return "负责翻译文本的 Agent";
    }
    
    @Override
    public List<String> getCapabilities() {
        return Arrays.asList("中英翻译", "中日翻译", "多语言翻译");
    }
    
    @Override
    public String getSystemPrompt() {
        return "你是一个专业的翻译专家。请将用户提供的文本翻译成目标语言。\n" +
               "要求：\n" +
               "1. 翻译准确\n" +
               "2. 语言流畅\n" +
               "3. 保持原文风格";
    }
    
    @Override
    public AgentResponse handleTask(AgentTask task) {
        try {
            String text = (String) task.getData().get("text");
            String targetLang = (String) task.getData().get("targetLanguage");
            
            String prompt = "请将以下文本翻译成" + targetLang + "：\n\n" + text;
            
            ChatCompletionResponse response = client.chatCompletion(
                ChatCompletionRequest.builder()
                    .model("gpt-4")
                    .messages(List.of(
                        Message.system(getSystemPrompt()),
                        Message.user(prompt)
                    ))
                    .build()
            );
            
            String translation = response.getChoices().get(0).getMessage().getContent();
            return AgentResponse.success(task.getId(), translation);
        } catch (Exception e) {
            return AgentResponse.failure(task.getId(), e.getMessage());
        }
    }
}
```

</details>

### 练习 2：实现串行协作

实现一个"文章创作"的串行协作流程：策划 -> 写作 -> 编辑。

<details>
<summary>点击查看答案</summary>

```java
// 文章创作串行协作
public class ArticleCreationPipeline {
    private final MultiAgentSystem system;
    
    public ArticleCreationPipeline(MultiAgentSystem system) {
        this.system = system;
    }
    
    // 创建文章
    public String createArticle(String topic) {
        // 串行执行：策划 -> 写作 -> 编辑
        return system.executeSequential(
            topic,
            Arrays.asList("Planner", "Writer", "Editor")
        );
    }
}

// 策划 Agent
public class PlannerAgent implements AgentRole {
    private final OpenAiClient client;
    
    public PlannerAgent(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    @Override
    public String getName() { return "Planner"; }
    
    @Override
    public String getDescription() { return "负责文章策划的 Agent"; }
    
    @Override
    public List<String> getCapabilities() {
        return Arrays.asList("选题策划", "大纲编写", "结构规划");
    }
    
    @Override
    public String getSystemPrompt() {
        return "你是一个资深的文章策划专家。请根据主题制定文章大纲。\n" +
               "输出格式：\n" +
               "1. 文章标题\n" +
               "2. 文章结构（包含各部分要点）\n" +
               "3. 写作建议";
    }
    
    @Override
    public AgentResponse handleTask(AgentTask task) {
        // 实现略
        return AgentResponse.success(task.getId(), "大纲内容...");
    }
}

// 写作 Agent
public class WriterAgent implements AgentRole {
    // 实现类似，根据大纲写文章
}

// 编辑 Agent
public class EditorAgent implements AgentRole {
    // 实现类似，负责润色和校对
}
```

</details>

### 练习 3：实现层级协作

实现一个"项目管理"的层级协作系统，由项目经理分配任务给团队成员。

<details>
<summary>点击查看答案</summary>

```java
// 项目管理系统
public class ProjectManagementSystem {
    private final MultiAgentSystem system;
    
    public ProjectManagementSystem(String apiKey) {
        this.system = new MultiAgentSystem(apiKey);
        
        // 注册项目经理
        system.registerAgent(new ProjectManagerAgent(apiKey));
        
        // 注册团队成员
        system.registerAgent(new DeveloperAgent(apiKey));
        system.registerAgent(new DesignerAgent(apiKey));
        system.registerAgent(new TesterAgent(apiKey));
    }
    
    // 执行项目
    public String executeProject(String projectRequirement) {
        // 层级执行：项目经理分解任务，分配给团队成员
        return system.executeHierarchical(
            projectRequirement,
            "ProjectManager",
            Arrays.asList("Developer", "Designer", "Tester")
        );
    }
}

// 项目经理 Agent
public class ProjectManagerAgent implements AgentRole {
    private final OpenAiClient client;
    
    public ProjectManagerAgent(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    @Override
    public String getName() { return "ProjectManager"; }
    
    @Override
    public String getDescription() { return "负责项目管理的 Agent"; }
    
    @Override
    public List<String> getCapabilities() {
        return Arrays.asList("任务分解", "资源分配", "进度管理");
    }
    
    @Override
    public String getSystemPrompt() {
        return "你是一个经验丰富的项目经理。请将项目需求分解为具体任务，" +
               "并分配给合适的团队成员。\n" +
               "团队成员：\n" +
               "- Developer: 负责开发\n" +
               "- Designer: 负责设计\n" +
               "- Tester: 负责测试";
    }
    
    @Override
    public AgentResponse handleTask(AgentTask task) {
        // 实现任务分解逻辑
        return AgentResponse.success(task.getId(), "任务分解结果...");
    }
}
```

</details>

---

## 11 下一章预告

太棒了！恭喜你完成了多 Agent 协作的学习。现在你已经掌握了如何构建多 Agent 系统，让它们分工协作完成复杂任务。

回顾一下，在这个 Java AI Agent 教程中，我们学习了：
- 第五章：工具调用机制 - 让 AI 能够使用工具
- 第六章：记忆管理系统 - 让 AI 能够记住事情
- 第七章：RAG 检索增强生成 - 让 AI 能够查阅资料
- 第八章：多 Agent 协作 - 让多个 AI 团队合作

通过这些技术，你可以构建出强大的 AI Agent 系统，解决各种实际问题。

接下来，你可以：
- 实践本项目中的代码
- 尝试构建自己的 AI Agent 应用
- 探索更多高级主题，如 Agent 自我学习、Agent 与人类协作等

祝你在 AI Agent 的学习道路上一帆风顺！
