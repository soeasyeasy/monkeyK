---
title: "第十五章：生产环境部署"
description: "将 AI Agent 系统部署到生产环境，确保稳定运行"
---

# 第十五章：生产环境部署

## 本章导读

在前面的章节中，我们实现了各种功能的 AI Agent。但在实际生产环境中，你可能会遇到这些问题：

- 如何把 AI Agent 部署到服务器上？
- API Key 等敏感信息如何安全存储？
- 如何监控系统运行状态？
- 出现错误如何快速定位和恢复？
- 如何做到不停机更新？

这一章将带你深入了解 **AI Agent 的生产环境部署**。我们会学习 **架构设计、容器化部署、配置管理、监控告警、日志管理、故障排查、灰度发布** 等关键技术，用 Java 实现完整的生产级部署方案。

---

## 1 为什么需要生产环境部署？

### 开发环境 vs 生产环境

> **开发环境** 就像自家厨房，想怎么改就怎么改。
>
> **生产环境** 就像餐厅厨房，需要标准化、稳定、可维护。

### 生产环境的挑战

| 挑战 | 说明 | 影响 | 生活化类比 |
| --- | --- | --- | --- |
| **稳定性** | 系统必须 24/7 运行 | 宕机导致业务中断 | 医院不能停电 |
| **安全性** | 保护敏感数据 | 数据泄露造成损失 | 银行金库要防盗 |
| **可扩展性** | 应对流量增长 | 用户增多系统崩溃 | 道路要能扩容 |
| **可维护性** | 快速定位和修复问题 | 故障排查困难 | 汽车要有诊断接口 |
| **成本控制** | 合理使用资源 | 资源浪费成本高 | 空调要能调温 |

### 真实场景对比

```
场景：电商 AI 客服系统

开发环境：
- 单台服务器
- 直接运行 Java 程序
- API Key 写在代码里
- 没有监控
- 手动部署

生产环境：
- 多台服务器集群
- Docker 容器化运行
- API Key 加密存储
- 完整的监控告警
- 自动化部署
- 故障自动恢复
```

> **一句话总结**：生产环境部署是 AI Agent 从"能用"到"好用"的关键一步。

---

## 2 架构设计

### 微服务 vs 单体架构

#### 单体架构

```java
// 单体架构：所有功能在一个应用中
@SpringBootApplication
public class MonolithicAgentApp {
    public static void main(String[] args) {
        SpringApplication.run(MonolithicAgentApp.class, args);
    }
}

@RestController
@RequestMapping("/api/agent")
public class AgentController {
    @Autowired
    private ChatService chatService; // 对话服务
    @Autowired
    private ToolService toolService; // 工具服务
    @Autowired
    private MemoryService memoryService; // 记忆服务
    
    @PostMapping("/chat")
    public String chat(@RequestBody String message) {
        // 所有逻辑在一个应用中处理
        String intent = chatService.identifyIntent(message);
        String result = toolService.executeTool(intent);
        memoryService.saveMemory(message, result);
        return result;
    }
}
```

**优点**：
- 开发简单
- 部署方便
- 调试容易

**缺点**：
- 扩展困难
- 故障影响范围大
- 技术栈受限

#### 微服务架构

```java
// 微服务架构：拆分为多个独立服务

// 1. 网关服务
@SpringBootApplication
@EnableDiscoveryClient
public class GatewayService {
    public static void main(String[] args) {
        SpringApplication.run(GatewayService.class, args);
    }
}

// 2. 对话服务
@Service
public class ChatService {
    @Autowired
    private ChatLanguageModel model;
    
    public String chat(String message) {
        return model.generate(message);
    }
}

// 3. 工具服务
@Service
public class ToolService {
    @Autowired
    private List<Tool> tools;
    
    public String executeTool(String toolName, String params) {
        Tool tool = tools.stream()
            .filter(t -> t.getName().equals(toolName))
            .findFirst()
            .orElseThrow();
        return tool.execute(params);
    }
}

// 4. 记忆服务
@Service
public class MemoryService {
    @Autowired
    private MemoryStore memoryStore;
    
    public void saveMemory(String sessionId, String memory) {
        memoryStore.save(sessionId, memory);
    }
}
```

**优点**：
- 独立扩展
- 故障隔离
- 技术栈灵活

**缺点**：
- 开发复杂
- 部署麻烦
- 调试困难

### 架构选择建议

| 场景 | 推荐架构 | 原因 |
| --- | --- | --- |
| **小型项目** | 单体 | 开发快，部署简单 |
| **中型项目** | 模块化单体 | 兼顾开发和扩展 |
| **大型项目** | 微服务 | 独立扩展，故障隔离 |
| **超大型项目** | 微服务 + 服务网格 | 复杂流量管理 |

---

## 3 容器化部署

### Docker 基础

#### Dockerfile 编写

```dockerfile
# 使用官方 Java 运行时作为基础镜像
FROM eclipse-temurin:17-jre-alpine

# 设置工作目录
WORKDIR /app

# 复制 jar 文件
COPY target/ai-agent-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8080

# 设置 JVM 参数
ENV JAVA_OPTS="-Xms512m -Xmx1024m"

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### 构建镜像

```bash
# 构建 Docker 镜像
docker build -t ai-agent:1.0.0 .

# 查看镜像
docker images

# 运行容器
docker run -d \
  -p 8080:8080 \
  -e OPENAI_API_KEY=your-api-key \
  -e DB_URL=jdbc:mysql://db:3306/agent \
  --name ai-agent \
  ai-agent:1.0.0
```

### Docker Compose 多容器编排

```yaml
# docker-compose.yml
version: '3.8'

services:
  # AI Agent 服务
  ai-agent:
    build: .
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DB_URL=jdbc:mysql://mysql:3306/agent
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
    restart: always
    
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=agent
      - MYSQL_USER=agent
      - MYSQL_PASSWORD=agent123
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"
      
  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      
  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - ai-agent

volumes:
  mysql-data:
  redis-data:
```

### Kubernetes 部署

#### Deployment 配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent
  labels:
    app: ai-agent
spec:
  replicas: 3  # 3 个副本
  selector:
    matchLabels:
      app: ai-agent
  template:
    metadata:
      labels:
        app: ai-agent
    spec:
      containers:
      - name: ai-agent
        image: ai-agent:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-agent-secrets
              key: openai-api-key
        - name: DB_URL
          valueFrom:
            configMapKeyRef:
              name: ai-agent-config
              key: db-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1024Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### Service 配置

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-agent-service
spec:
  selector:
    app: ai-agent
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

#### ConfigMap 和 Secret

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-agent-config
data:
  db-url: "jdbc:mysql://mysql:3306/agent"
  redis-url: "redis://redis:6379"
  model-name: "gpt-3.5-turbo"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-agent-secrets
type: Opaque
data:
  openai-api-key: <base64-encoded-api-key>
  db-password: <base64-encoded-password>
```

---

## 4 配置管理

### API Key 安全存储

#### 使用环境变量

```java
// 不推荐：硬编码 API Key
public class BadConfig {
    private static final String API_KEY = "sk-xxx"; // 危险！
}

// 推荐：从环境变量读取
public class GoodConfig {
    private static final String API_KEY = System.getenv("OPENAI_API_KEY");
    
    public static void validate() {
        if (API_KEY == null || API_KEY.isEmpty()) {
            throw new IllegalStateException("OPENAI_API_KEY 环境变量未设置");
        }
    }
}
```

#### 使用 Spring Cloud Config

```yaml
# application.yml
spring:
  cloud:
    config:
      uri: http://config-server:8888
      fail-fast: true
```

```java
// 配置客户端
@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "ai.agent")
public class AgentConfig {
    private String apiKey;
    private String modelName;
    private int maxTokens;
    
    // getters and setters
}
```

### 模型参数热更新

```java
@Service
public class DynamicModelService {
    private volatile ChatLanguageModel currentModel;
    private final AtomicReference<ModelConfig> configRef = new AtomicReference<>();
    
    @Autowired
    private ConfigService configService;
    
    @PostConstruct
    public void init() {
        // 初始化模型
        updateModel();
        
        // 定时检查配置变化
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(this::checkAndUpdate, 0, 30, TimeUnit.SECONDS);
    }
    
    private void checkAndUpdate() {
        ModelConfig newConfig = configService.getModelConfig();
        ModelConfig currentConfig = configRef.get();
        
        if (!newConfig.equals(currentConfig)) {
            System.out.println("检测到配置变化，更新模型...");
            updateModel();
        }
    }
    
    private void updateModel() {
        ModelConfig config = configService.getModelConfig();
        configRef.set(config);
        
        currentModel = OpenAiChatModel.builder()
            .apiKey(config.getApiKey())
            .modelName(config.getModelName())
            .maxTokens(config.getMaxTokens())
            .temperature(config.getTemperature())
            .build();
            
        System.out.println("模型已更新：" + config.getModelName());
    }
    
    public String generate(String message) {
        return currentModel.generate(message);
    }
}
```

---

## 5 监控告警

### Micrometer + Prometheus 监控

#### 添加依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

#### 配置 Actuator

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

#### 自定义指标

```java
@Service
public class MonitoredAgentService {
    private final MeterRegistry meterRegistry;
    private final Counter requestCounter;
    private final Timer requestTimer;
    private final Gauge activeSessionsGauge;
    
    public MonitoredAgentService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        // 请求计数器
        this.requestCounter = Counter.builder("ai.agent.requests")
            .description("AI Agent 请求总数")
            .tag("type", "chat")
            .register(meterRegistry);
        
        // 请求计时器
        this.requestTimer = Timer.builder("ai.agent.request.duration")
            .description("AI Agent 请求耗时")
            .register(meterRegistry);
        
        // 活跃会话数
        this.activeSessionsGauge = Gauge.builder("ai.agent.active.sessions", 
            () -> SessionManager.getActiveCount())
            .description("当前活跃会话数")
            .register(meterRegistry);
    }
    
    public String chat(String sessionId, String message) {
        return requestTimer.record(() -> {
            requestCounter.increment(); // 增加请求计数
            
            // 业务逻辑
            String response = processMessage(message);
            
            return response;
        });
    }
    
    private String processMessage(String message) {
        // 实际的 AI 处理逻辑
        return "回复：" + message;
    }
}
```

### Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ai-agent'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['ai-agent:8080']
```

### Grafana 仪表板

```json
{
  "dashboard": {
    "title": "AI Agent 监控",
    "panels": [
      {
        "title": "请求速率",
        "targets": [
          {
            "expr": "rate(ai_agent_requests_total[5m])"
          }
        ]
      },
      {
        "title": "请求延迟",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ai_agent_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "活跃会话数",
        "targets": [
          {
            "expr": "ai_agent_active_sessions"
          }
        ]
      }
    ]
  }
}
```

---

## 6 日志管理

### 结构化日志

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class LoggingAgentService {
    private static final Logger log = LoggerFactory.getLogger(LoggingAgentService.class);
    
    public String chat(String sessionId, String userId, String message) {
        // 结构化日志：包含上下文信息
        log.info("收到用户请求: sessionId={}, userId={}, messageLength={}", 
            sessionId, userId, message.length());
        
        try {
            long startTime = System.currentTimeMillis();
            
            // 业务逻辑
            String response = processMessage(message);
            
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("请求处理完成: sessionId={}, duration={}ms, responseLength={}", 
                sessionId, duration, response.length());
            
            return response;
            
        } catch (Exception e) {
            log.error("请求处理失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
            throw e;
        }
    }
}
```

### 对话日志记录

```java
@Entity
@Table(name = "conversation_logs")
public class ConversationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "user_message", columnDefinition = "TEXT")
    private String userMessage;
    
    @Column(name = "agent_response", columnDefinition = "TEXT")
    private String agentResponse;
    
    @Column(name = "tokens_used")
    private Integer tokensUsed;
    
    @Column(name = "duration_ms")
    private Long durationMs;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // getters and setters
}

@Service
public class ConversationLogService {
    @Autowired
    private ConversationLogRepository repository;
    
    public void logConversation(String sessionId, String userId, 
                                String userMessage, String agentResponse, 
                                int tokensUsed, long durationMs) {
        ConversationLog log = new ConversationLog();
        log.setSessionId(sessionId);
        log.setUserId(userId);
        log.setUserMessage(userMessage);
        log.setAgentResponse(agentResponse);
        log.setTokensUsed(tokensUsed);
        log.setDurationMs(durationMs);
        log.setCreatedAt(LocalDateTime.now());
        
        repository.save(log);
    }
    
    // 查询历史对话
    public List<ConversationLog> getHistory(String sessionId) {
        return repository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }
}
```

---

## 7 故障排查与降级策略

### 熔断器模式

```java
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;

@Service
public class ResilientAgentService {
    private final ChatLanguageModel model;
    private final CircuitBreaker circuitBreaker;
    
    public ResilientAgentService(ChatLanguageModel model) {
        this.model = model;
        
        // 配置熔断器
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50) // 失败率阈值 50%
            .waitDurationInOpenState(Duration.ofSeconds(30)) // 熔断后等待 30 秒
            .slidingWindowSize(10) // 滑动窗口大小
            .build();
            
        this.circuitBreaker = CircuitBreaker.of("ai-agent", config);
    }
    
    public String chat(String message) {
        return circuitBreaker.executeSupplier(() -> {
            // 正常调用 LLM
            return model.generate(message);
        });
    }
    
    // 降级方法
    public String chatWithFallback(String message) {
        try {
            return circuitBreaker.executeSupplier(() -> model.generate(message));
        } catch (Exception e) {
            // 熔断或调用失败时，返回降级响应
            return getFallbackResponse(message);
        }
    }
    
    private String getFallbackResponse(String message) {
        // 基于规则的简单回复
        if (message.contains("你好")) {
            return "你好！我是智能客服，很高兴为您服务。";
        }
        return "抱歉，系统暂时繁忙，请稍后再试。";
    }
}
```

### 重试机制

```java
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;

@Service
public class RetryableAgentService {
    private final ChatLanguageModel model;
    private final Retry retry;
    
    public RetryableAgentService(ChatLanguageModel model) {
        this.model = model;
        
        // 配置重试策略
        RetryConfig config = RetryConfig.custom()
            .maxAttempts(3) // 最多重试 3 次
            .waitDuration(Duration.ofSeconds(2)) // 每次间隔 2 秒
            .retryExceptions(Exception.class) // 对所有异常重试
            .build();
            
        this.retry = Retry.of("ai-agent-retry", config);
    }
    
    public String chat(String message) {
        return retry.executeSupplier(() -> model.generate(message));
    }
}
```

### 超时控制

```java
import io.github.resilience4j.timelimiter.TimeLimiter;

@Service
public class TimeoutAgentService {
    private final ChatLanguageModel model;
    private final TimeLimiter timeLimiter;
    private final ExecutorService executorService;
    
    public TimeoutAgentService(ChatLanguageModel model) {
        this.model = model;
        this.executorService = Executors.newCachedThreadPool();
        
        // 配置超时限制
        this.timeLimiter = TimeLimiter.of(TimeLimiterConfig.custom()
            .timeoutDuration(Duration.ofSeconds(10)) // 10 秒超时
            .build());
    }
    
    public String chat(String message) throws Exception {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(
            () -> model.generate(message), 
            executorService
        );
        
        return timeLimiter.executeFutureSupplier(() -> future);
    }
}
```

---

## 8 灰度发布与 A/B 测试

### 灰度发布实现

```java
@Service
public class GrayReleaseService {
    @Autowired
    private ChatLanguageModel stableModel; // 稳定版本
    
    @Autowired
    private ChatLanguageModel canaryModel; // 金丝雀版本
    
    // 灰度比例（0-100）
    @Value("${gray.release.percentage:10}")
    private int grayPercentage;
    
    public String chat(String userId, String message) {
        // 根据用户 ID 哈希决定是否使用新版本
        int hash = Math.abs(userId.hashCode() % 100);
        
        if (hash < grayPercentage) {
            // 使用新版本（金丝雀）
            System.out.println("用户 " + userId + " 使用新版本");
            return canaryModel.generate(message);
        } else {
            // 使用稳定版本
            System.out.println("用户 " + userId + " 使用稳定版本");
            return stableModel.generate(message);
        }
    }
    
    // 动态调整灰度比例
    @Scheduled(fixedRate = 60000) // 每分钟检查一次
    public void adjustGrayPercentage() {
        // 根据监控数据自动调整
        double errorRate = getCanaryErrorRate();
        
        if (errorRate > 0.05) { // 错误率超过 5%
            grayPercentage = Math.max(0, grayPercentage - 10); // 减少 10%
            System.out.println("错误率过高，灰度比例调整为：" + grayPercentage + "%");
        } else if (errorRate < 0.01 && grayPercentage < 100) { // 错误率低于 1%
            grayPercentage = Math.min(100, grayPercentage + 10); // 增加 10%
            System.out.println("运行良好，灰度比例调整为：" + grayPercentage + "%");
        }
    }
    
    private double getCanaryErrorRate() {
        // 从监控系统获取金丝雀版本的错误率
        return 0.02; // 示例
    }
}
```

### A/B 测试

```java
@Service
public class ABTestService {
    @Autowired
    private ChatLanguageModel modelA;
    
    @Autowired
    private ChatLanguageModel modelB;
    
    @Autowired
    private MetricsService metricsService;
    
    public String chat(String userId, String message) {
        // 随机分配到 A 组或 B 组
        boolean isGroupA = Math.abs(userId.hashCode() % 2) == 0;
        
        String response;
        if (isGroupA) {
            response = modelA.generate(message);
            metricsService.recordGroupA(message, response);
        } else {
            response = modelB.generate(message);
            metricsService.recordGroupB(message, response);
        }
        
        return response;
    }
    
    // 分析 A/B 测试结果
    public ABTestResult analyzeResults() {
        double satisfactionA = metricsService.getSatisfactionRate("A");
        double satisfactionB = metricsService.getSatisfactionRate("B");
        
        ABTestResult result = new ABTestResult();
        result.setGroupASatisfaction(satisfactionA);
        result.setGroupBSatisfaction(satisfactionB);
        result.setWinner(satisfactionA > satisfactionB ? "A" : "B");
        
        return result;
    }
}
```

---

## 9 新手常见误区

### 误区 1：直接在生产环境测试

**错误做法**：在生产环境直接测试新功能。

**正确做法**：使用预发布环境（Staging）测试，确认无误后再部署到生产环境。

### 误区 2：忽略监控告警

**错误做法**：系统上线后不设置监控，等问题暴露才发现。

**正确做法**：从一开始就建立完整的监控体系，设置合理的告警阈值。

### 误区 3：没有降级方案

**错误做法**：LLM API 挂了，整个系统就瘫痪。

**正确做法**：实现熔断器和降级策略，保证核心功能可用。

### 误区 4：日志信息不足或过多

**错误做法**：要么不记录日志，要么记录太多无用信息。

**正确做法**：记录关键的业务日志，包含必要的上下文信息，便于问题排查。

### 误区 5：配置硬编码

**错误做法**：API Key、数据库密码等敏感信息写在代码里。

**正确做法**：使用环境变量、配置中心或密钥管理服务存储敏感信息。

---

## 10 动手练习

### 练习 1：编写 Dockerfile

**任务**：为一个 Spring Boot AI Agent 应用编写 Dockerfile。

::: details 点击查看答案
```dockerfile
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/ai-agent.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms512m -Xmx1024m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```
:::

### 练习 2：实现熔断器

**任务**：使用 Resilience4j 为 AI Agent 实现熔断器，当失败率超过 50% 时触发熔断。

::: details 点击查看答案
```java
@Service
public class CircuitBreakerAgent {
    private final ChatLanguageModel model;
    private final CircuitBreaker circuitBreaker;
    
    public CircuitBreakerAgent(ChatLanguageModel model) {
        this.model = model;
        
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .slidingWindowSize(10)
            .build();
            
        this.circuitBreaker = CircuitBreaker.of("agent-circuit", config);
    }
    
    public String chat(String message) {
        return circuitBreaker.executeSupplier(() -> model.generate(message));
    }
    
    public String chatWithFallback(String message) {
        try {
            return circuitBreaker.executeSupplier(() -> model.generate(message));
        } catch (Exception e) {
            return "系统繁忙，请稍后再试";
        }
    }
}
```
:::

### 练习 3：实现灰度发布

**任务**：实现一个简单的灰度发布服务，10% 的用户使用新版本。

::: details 点击查看答案
```java
@Service
public class SimpleGrayRelease {
    @Autowired
    private ChatLanguageModel stableModel;
    
    @Autowired
    private ChatLanguageModel newModel;
    
    public String chat(String userId, String message) {
        // 根据用户 ID 哈希取模
        int hash = Math.abs(userId.hashCode() % 100);
        
        if (hash < 10) {
            // 10% 用户使用新版本
            return newModel.generate(message);
        } else {
            // 90% 用户使用稳定版本
            return stableModel.generate(message);
        }
    }
}
```
:::

---

## 11 下一章预告

恭喜你完成了生产环境部署的学习！现在你已经掌握了：

- 架构设计（微服务 vs 单体）
- 容器化部署（Docker + K8s）
- 配置管理与安全存储
- 监控告警系统
- 日志管理
- 故障排查与降级策略
- 灰度发布与 A/B 测试

在下一章中，我们将进入 **智能客服系统实战**，从零构建一个企业级智能客服系统，综合运用全部所学知识，包括：

- 需求分析与架构设计
- 知识库构建（RAG 流程）
- 意图识别与路由
- 多轮对话管理
- 工具集成（订单查询、退款处理等）
- 人工接管机制
- 完整代码实现
- 测试与上线

让我们一起完成这个综合实战项目！
