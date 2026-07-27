---
title: "第5章：依赖注入底层实现"
description: "深入理解 Spring 依赖注入的完整流程、注解区别与底层源码解析"
---

# 第5章：依赖注入底层实现

## 本章导读

在学这一章之前，你可能会有这些疑问：

- @Autowired 和 @Resource 到底有什么区别？用哪个更好？
- Spring 是怎么知道该注入哪个 Bean 的？如果有多个候选怎么办？
- 构造器注入、Setter 注入、字段注入，底层流程有什么不同？
- 为什么有时候注入会失败，报 NoSuchBeanDefinitionException？

这一章我们会彻底搞懂 **依赖注入的底层实现原理**，从源码层面理解 Spring 是如何完成依赖解析和注入的。搞懂了这些，你就能真正理解 Spring 容器的核心机制，遇到注入问题也能自己排查。

---

## 1 为什么需要深入理解依赖注入？

### 痛点分析

很多开发者用了好几年 Spring，但对依赖注入的理解还停留在"加个 @Autowired 就完事了"。直到遇到这些问题才懵：

1. **多个实现类不知道注入哪个**：接口有两个实现类，启动直接报错
2. **循环依赖报错不知道为什么**：A 依赖 B，B 依赖 A，程序崩了不知道怎么解决
3. **注入的值为 null**：明明加了注解，运行时却报 NullPointerException
4. **分不清注解的区别**：@Autowired、@Resource、@Inject 到底该用哪个

### 生活化类比

把依赖注入想象成**餐厅的配菜系统**：

- 厨师（Bean）需要做菜，但食材（依赖）不是自己去买的
- 配菜师（Spring 容器）会根据厨师的需求，自动把食材送过来
- @Autowired 就像是说"给我来点肉"，配菜师看仓库里有啥肉就给啥
- @Resource 就像是说"给我来编号 A01 的冰柜里的肉"，指定了具体位置
- @Qualifier 就像是说"我只要五花肉"，进一步缩小范围

如果没有配菜师，厨师就得自己去市场买食材，既浪费时间又容易买错。这就是为什么我们需要依赖注入——**把依赖关系的管理交给专业的容器处理**。

---

## 2 核心原理讲解

### 5.2.1 依赖注入的完整流程

依赖注入并不是简单的"找到 Bean 塞进去"那么简单，它有一整套完整的流程。

**底层流程（源码级别）：**

```
1. 实例化 Bean（调用构造函数）
   ↓
2. 属性注入（populateBean 方法）
   ↓
3. 解析 @Autowired/@Resource 等注解
   ↓
4. 查找候选 Bean（resolveDependency）
   ↓
5. 类型匹配 + 泛型解析
   ↓
6. 如果有多个候选，使用 @Qualifier/@Primary 筛选
   ↓
7. 注入依赖（反射设置字段值或调用方法）
```

**源码入口：**

Spring 的依赖注入核心代码在 `AbstractAutowireCapableBeanFactory` 类中：

```java
// Spring 源码简化版
protected void populateBean(String beanName, RootBeanDefinition mbd, BeanWrapper bw) {
    // 1. 获取所有的 InstantiationAwareBeanPostProcessor
    InstantiationAwareBeanPostProcessor[] ipps = getBeanPostProcessorCache()
        .getInstantiationAwareBeanPostProcessors();
    
    // 2. 执行前置处理
    for (InstantiationAwareBeanPostProcessor ipp : ipps) {
        ipp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName);
    }
    
    // 3. 处理 @Autowired 注解的字段
    if (mbd.getPropertyValues().isEmpty() && !hasAutowiredFields(bw)) {
        return;
    }
    
    // 4. 核心：解析依赖并注入
    // 找到所有标注了 @Autowired 的字段和方法
    InjectionMetadata metadata = findAutowiringMetadata(beanName, mbd, null);
    
    // 5. 逐个注入依赖
    metadata.inject(bw, null, null);
}
```

**通俗类比：**

这个过程就像快递分拣：
1. 包裹到了仓库（Bean 实例化完成）
2. 查看包裹上的标签（扫描 @Autowired 注解）
3. 根据标签查找对应的货物（在容器中查找候选 Bean）
4. 如果有多个同类货物，看有没有备注要哪个（@Qualifier 筛选）
5. 把货物放进包裹（反射注入依赖）

### 5.2.2 @Autowired 的底层解析

`@Autowired` 是 Spring 自己的注解，它的注入逻辑在 `AutowiredAnnotationBeanPostProcessor` 中。

**源码核心流程：**

```java
// Spring 源码简化版 - AutowiredAnnotationBeanPostProcessor
public PropertyValues postProcessProperties(
        PropertyValues pvs, Object bean, String beanName) {
    
    // 1. 查找 Bean 中所有标注了 @Autowired 的元数据
    InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);
    
    // 2. 执行注入
    metadata.inject(bean, beanName, pvs);
    return pvs;
}

// 查找需要注入的元数据
private InjectionMetadata findAutowiringMetadata(...) {
    // 扫描字段、方法、构造函数上的 @Autowired 注解
    // 构建 InjectionMetadata 对象
    ReflectionUtils.doWithFields(clazz.getDeclaredFields(), field -> {
        if (field.isAnnotationPresent(Autowired.class)) {
            // 记录需要注入的字段
            metadata.addInjectedField(field);
        }
    });
}
```

**依赖解析的核心方法 `resolveDependency`：**

```java
// DefaultListableBeanFactory 中的核心方法
public Object resolveDependency(
        DependencyDescriptor descriptor, 
        String beanName,
        Set<String> autowiredBeanNames,
        TypeConverter typeConverter) {
    
    // 1. 先尝试从缓存中获取
    Object result = getIfAvailable(descriptor, ...);
    
    // 2. 如果缓存没有，根据类型查找
    // 先按类型匹配，找到所有候选 Bean
    Map<String, Object> matchingBeans = findAutowireCandidates(beanName, type, descriptor);
    
    // 3. 如果找到多个候选
    if (matchingBeans.size() > 1) {
        // 使用 @Primary 或 @Qualifier 来确定最终选择
        result = determineAutowireCandidate(matchingBeans, descriptor);
    }
    
    // 4. 如果没找到且 required=true，抛异常
    if (result == null && descriptor.isRequired()) {
        throw new NoSuchBeanDefinitionException(type);
    }
    
    return result;
}
```

**通俗类比：**

@Autowired 的工作方式就像自动售货机：
1. 你按下按钮（标注 @Autowired）
2. 机器检查库存（容器中查找 Bean）
3. 如果有多种饮料（多个候选 Bean），机器会看你有没有投特定硬币（@Qualifier）
4. 如果没有指定且库存充足，默认给你第一种（@Primary 或按名称排序第一个）
5. 如果缺货且你要求必须有（required=true），机器报错

### 5.2.3 @Resource 的底层解析

`@Resource` 是 JSR-250 规范中的注解，由 `CommonAnnotationBeanPostProcessor` 处理。

**与 @Autowired 的关键区别：**

```java
// CommonAnnotationBeanPostProcessor 处理逻辑
// @Resource 默认按名称查找
protected Object getResourceToInject(Object target, String requestingBeanName) {
    // 1. 先按名称查找
    String name = this.name;  // @Resource(name="xxx") 指定的名称
    if (name == null) {
        // 如果没有指定名称，使用字段名作为默认名称
        name = this.field.getName();
    }
    
    // 2. 从容器中按名称获取 Bean
    Object resource = getBeanFactory().getBean(name, this.lookupType);
    
    // 3. 如果按名称找不到，才退化为按类型查找
    if (resource == null && this.lookupType == null) {
        resource = getBeanFactory().getBean(this.lookupType);
    }
    
    return resource;
}
```

**通俗类比：**

@Resource 就像外卖取餐：
1. 先看订单号（name 属性）去取餐
2. 如果没有写订单号，就用你的名字（字段名）去找
3. 实在找不到，才看餐的类型（按类型匹配）

### 5.2.4 @Inject 的底层解析

`@Inject` 是 JSR-330 规范中的注解，需要引入 `javax.inject` 依赖。

```java
// @Inject 的处理逻辑和 @Autowired 几乎一样
// 也是由 AutowiredAnnotationBeanPostProcessor 处理
// 区别是 @Inject 没有 required 属性，默认就是 required=true
```

---

## 3 基础用法与逐行注释

### 5.3.1 @Autowired 基础用法

```java
// 定义接口
public interface MessageService {
    void send(String message);
}

// 实现类 1
@Service("emailService")  // 指定 Bean 名称
public class EmailService implements MessageService {
    @Override
    public void send(String message) {
        System.out.println("发送邮件: " + message);
    }
}

// 实现类 2
@Service("smsService")  // 指定 Bean 名称
public class SmsService implements MessageService {
    @Override
    public void send(String message) {
        System.out.println("发送短信: " + message);
    }
}

// 使用 @Autowired 注入
@Service
public class NotificationService {
    
    // 字段注入（不推荐，难以测试）
    @Autowired
    private MessageService messageService;  // 有多个实现类时会报错
    
    // ✅ 正确写法 1：使用 @Qualifier 指定具体 Bean
    @Autowired
    @Qualifier("emailService")  // 明确指定要 emailService
    private MessageService emailService;
    
    // ✅ 正确写法 2：使用 @Primary 标记首选 Bean
    @Autowired
    private MessageService primaryService;  // 会注入标记了 @Primary 的 Bean
    
    // ✅ 正确写法 3：构造器注入（最推荐）
    private final MessageService constructorService;
    
    @Autowired
    public NotificationService(
            @Qualifier("smsService") MessageService constructorService) {
        this.constructorService = constructorService;  // 通过构造器注入
    }
}
```

### 5.3.2 @Resource 基础用法

```java
@Service
public class OrderService {
    
    // ✅ 写法 1：按字段名匹配（最常用）
    @Resource
    private MessageService messageService;  
    // 等价于 @Resource(name="messageService")
    // 先找名为 messageService 的 Bean
    
    // ✅ 写法 2：显式指定名称
    @Resource(name = "emailService")
    private MessageService myService;  
    // 直接找名为 emailService 的 Bean
    
    // ✅ 写法 3：指定类型
    @Resource(type = SmsService.class)
    private MessageService smsOnly;  
    // 按类型查找，找到 SmsService 类型的 Bean
    
    // ❌ 错误写法：名称和类型都不匹配
    @Resource(name = "nonExistentBean")
    private MessageService wrongService;  
    // 启动报错：NoSuchBeanDefinitionException
}
```

### 5.3.3 @Primary 和 @Qualifier 配合使用

```java
// 标记首选 Bean
@Service
@Primary  // 当有多个候选时，优先选择这个
public class DefaultMessageService implements MessageService {
    @Override
    public void send(String message) {
        System.out.println("默认发送: " + message);
    }
}

@Service("vipService")
public class VipMessageService implements MessageService {
    @Override
    public void send(String message) {
        System.out.println("VIP 发送: " + message);
    }
}

@Service
public class UserService {
    
    // 会注入 DefaultMessageService（因为 @Primary）
    @Autowired
    private MessageService defaultService;
    
    // 会注入 VipMessageService（@Qualifier 优先级高于 @Primary）
    @Autowired
    @Qualifier("vipService")
    private MessageService vipService;
}
```

### 5.3.4 构造器注入详解

```java
@Service
public class PaymentService {
    
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;
    
    // ✅ 推荐：构造器注入
    // Spring 4.3+ 如果只有一个构造函数，可以省略 @Autowired
    public PaymentService(
            OrderRepository orderRepository,           // 第一个依赖
            PaymentGateway paymentGateway,             // 第二个依赖
            NotificationService notificationService) { // 第三个依赖
        this.orderRepository = orderRepository;
        this.paymentGateway = paymentGateway;
        this.notificationService = notificationService;
    }
    
    // ✅ 如果有多个构造函数，需要标注 @Autowired 指定用哪个
    public PaymentService() {
        // 默认构造函数
    }
    
    @Autowired  // 明确告诉 Spring 用这个构造函数注入
    public PaymentService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
        this.paymentGateway = null;
        this.notificationService = null;
    }
}
```

### 5.3.5 Setter 注入

```java
@Service
public class ReportService {
    
    private DataSource dataSource;
    private TemplateEngine templateEngine;
    
    // Setter 注入：适合可选依赖
    @Autowired(required = false)  // required=false 表示这个依赖不是必须的
    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    @Autowired
    public void setTemplateEngine(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }
    
    // ✅ 多个参数的 Setter 也可以
    @Autowired
    public void configure(DataSource ds, TemplateEngine te) {
        this.dataSource = ds;
        this.templateEngine = te;
    }
}
```

---

## 4 限定符与候选 Bean 解析

### 5.4.1 候选 Bean 的查找过程

当 Spring 需要注入一个依赖时，查找过程如下：

```java
// 源码简化版 - 查找候选 Bean 的过程
private Map<String, Object> findAutowireCandidates(
        String beanName, Class<?> type, DependencyDescriptor descriptor) {
    
    // 1. 先获取容器中所有匹配的 Bean 名称
    String[] candidateNames = getBeanNamesForType(type);
    
    // 2. 遍历每个候选名称
    Map<String, Object> result = new LinkedHashMap<>();
    for (String candidateName : candidateNames) {
        // 3. 检查是否是合格的候选者
        if (isAutowireCandidate(candidateName, descriptor)) {
            // 4. 获取 Bean 实例
            Object bean = getBean(candidateName);
            result.put(candidateName, bean);
        }
    }
    
    return result;
}
```

**通俗类比：**

就像招聘面试：
1. 先根据职位要求（类型匹配）筛选简历
2. 再看候选人是否符合额外条件（@Qualifier 等限定符）
3. 如果有多人符合，看谁有优先标记（@Primary）
4. 如果还是无法决定，看谁的名字和岗位最匹配（参数名匹配）

### 5.4.2 @Qualifier 的高级用法

```java
// 1. 基本用法：指定 Bean 名称
@Autowired
@Qualifier("emailService")
private MessageService service1;

// 2. 自定义 @Qualifier（更优雅的方式）
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Qualifier  // 元注解：标记这是一个自定义限定符
public @interface Email {}

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Qualifier
public @interface Sms {}

// 使用自定义限定符
@Service
@Email  // 标记这个 Bean 是邮件服务
public class EmailServiceImpl implements MessageService {
    public void send(String msg) { System.out.println("Email: " + msg); }
}

@Service
@Sms  // 标记这个 Bean 是短信服务
public class SmsServiceImpl implements MessageService {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}

@Service
public class Client {
    @Autowired
    @Email  // 使用自定义限定符注入
    private MessageService emailService;
    
    @Autowired
    @Sms  // 使用自定义限定符注入
    private MessageService smsService;
}
```

### 5.4.3 集合类型注入

```java
@Service
public class AllServicesCollector {
    
    // ✅ 注入所有 MessageService 实现
    @Autowired
    private List<MessageService> allServices;
    // Spring 会自动收集容器中所有 MessageService 类型的 Bean
    
    // ✅ 注入为 Map，key 是 Bean 名称
    @Autowired
    private Map<String, MessageService> serviceMap;
    // {"emailService": EmailServiceImpl, "smsService": SmsServiceImpl}
    
    // ✅ 注入为 Set
    @Autowired
    private Set<MessageService> serviceSet;
    
    // ✅ 使用 @Qualifier 限定范围
    @Autowired
    @Qualifier("emailService")
    private List<MessageService> emailOnlyList;
}
```

---

## 5 对比表格

### 5.5.1 三种注入注解对比

| 对比项 | @Autowired | @Resource | @Inject |
|--------|-----------|-----------|---------|
| 来源 | Spring 框架 | JSR-250 规范 | JSR-330 规范 |
| 默认策略 | 按类型匹配 | 按名称匹配 | 按类型匹配 |
| 指定名称 | @Qualifier("name") | name="name" | @Named("name") |
| required 属性 | 有（默认 true） | 无 | 无（默认 required） |
| 可用位置 | 字段、Setter、构造器、方法参数 | 字段、Setter、方法 | 字段、Setter、构造器、方法参数 |
| 需要额外依赖 | 不需要 | 不需要（JDK 自带） | 需要 javax.inject |
| 处理类 | AutowiredAnnotationBeanPostProcessor | CommonAnnotationBeanPostProcessor | AutowiredAnnotationBeanPostProcessor |
| 推荐程度 | 推荐（配合构造器注入） | 推荐（Java EE 项目） | 一般 |

### 5.5.2 三种注入方式对比

| 对比项 | 字段注入 | Setter 注入 | 构造器注入 |
|--------|---------|-------------|-----------|
| 代码简洁度 | 最简洁 | 中等 | 较冗长 |
| 不可变性 | 不支持 final | 不支持 final | 支持 final |
| 可测试性 | 差（需要反射） | 一般 | 好（直接 new） |
| 循环依赖 | 无法检测 | 可以检测 | 启动时报错 |
| 依赖必须性 | 可选 | 可选（required=false） | 必须 |
| Spring 推荐 | 不推荐 | 可选依赖时使用 | 强烈推荐 |
| 注入时机 | Bean 实例化后 | 实例化后调用 | 实例化时 |
| 多依赖场景 | 字段多，代码乱 | 方法多，代码乱 | 参数列表长，但清晰 |

### 5.5.3 依赖解析优先级

| 优先级 | 解析策略 | 说明 |
|--------|---------|------|
| 1 | @Qualifier 精确指定 | 最高优先级，明确指定 Bean 名称 |
| 2 | @Primary 标记 | 当有多个候选时，优先选择 @Primary 标记的 |
| 3 | 参数名/字段名匹配 | 名称与 Bean 名称一致时优先 |
| 4 | 类型匹配 | 按类型查找唯一候选 |
| 5 | @Order/@Ordered | 排序注解决定优先级 |

---

## 6 新手常见误区

### 误区 1：字段注入是最方便所以最好的方式

```java
// ❌ 错误认知：字段注入最方便所以推荐
@Service
public class BadService {
    @Autowired
    private Repository repository;  // 看起来简洁，但问题很多
}

// ✅ 正确做法：构造器注入
@Service
public class GoodService {
    private final Repository repository;
    
    public GoodService(Repository repository) {
        this.repository = repository;  // 依赖明确，可测试，不可变
    }
}
```

**原因**：字段注入的问题：
- 无法声明 final 字段，依赖可能被意外修改
- 单元测试时必须用反射或 Spring 容器，不能直接 new
- 隐藏了依赖关系，不看代码不知道依赖了什么
- 容易导致一个类依赖太多组件（因为注入太"方便"了）

### 误区 2：@Autowired 和 @Resource 完全一样

```java
// ❌ 错误认知：两个注解效果一样
@Service
public class ConfusedService {
    @Autowired
    private MessageService service1;  // 按类型匹配
    
    @Resource
    private MessageService service2;  // 按名称匹配！
}

// 当有两个 MessageService 实现时：
// @Autowired 会报 NoUniqueBeanDefinitionException
// @Resource 会先按字段名 "service2" 去找 Bean，找不到才按类型
```

**原因**：两者的匹配策略完全不同。@Autowired 先按类型，@Resource 先按名称。在多个实现类的场景下，行为差异很大。

### 误区 3：@Autowired(required=false) 意味着可以为 null

```java
// ❌ 错误认知：required=false 就不用处理 null 了
@Service
public class RiskyService {
    @Autowired(required = false)
    private OptionalService optionalService;
    
    public void doWork() {
        optionalService.execute();  // 可能 NPE！
    }
}

// ✅ 正确做法：始终检查 null
@Service
public class SafeService {
    @Autowired(required = false)
    private OptionalService optionalService;
    
    public void doWork() {
        if (optionalService != null) {
            optionalService.execute();  // 安全调用
        }
    }
}

// ✅ 更好的做法：使用 Optional
@Service
public class BetterService {
    @Autowired(required = false)
    private Optional<OptionalService> optionalService;
    
    public void doWork() {
        optionalService.ifPresent(s -> s.execute());
    }
}
```

### 误区 4：@Qualifier 只能用在字段上

```java
// ❌ 错误认知：@Qualifier 只能标注在字段
@Service
public class LimitedService {
    @Autowired
    @Qualifier("emailService")
    private MessageService service;
}

// ✅ 正确做法：@Qualifier 可以用在很多地方
@Service
public class FlexibleService {
    
    // 用在构造器参数上
    public FlexibleService(
            @Qualifier("emailService") MessageService email,
            @Qualifier("smsService") MessageService sms) {
        // ...
    }
    
    // 用在 Setter 参数上
    @Autowired
    public void setService(@Qualifier("emailService") MessageService service) {
        // ...
    }
    
    // 用在方法参数上
    @Autowired
    public void configure(@Qualifier("emailService") MessageService service) {
        // ...
    }
}
```

### 误区 5：@Primary 可以标记多个 Bean

```java
// ❌ 错误写法：多个 @Primary
@Service
@Primary
public class ServiceA implements MyService {}

@Service
@Primary  // 又标记了一个 Primary！
public class ServiceB implements MyService {}

// 注入时仍然会报错，因为有两个 Primary，Spring 无法决定

// ✅ 正确写法：只有一个 @Primary
@Service
@Primary  // 只标记一个首选 Bean
public class DefaultServiceImpl implements MyService {}

@Service
public class SpecialServiceImpl implements MyService {}
```

---

## 7 动手练习

### 练习 1：多实现类注入

**题目**：定义一个 `Logger` 接口，创建 `ConsoleLogger` 和 `FileLogger` 两个实现类。在 `AppService` 中分别注入这两个 Logger，要求使用 @Qualifier 指定。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义接口
public interface Logger {
    void log(String message);
}

// 2. 控制台日志实现
@Service("consoleLogger")
public class ConsoleLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[CONSOLE] " + message);
    }
}

// 3. 文件日志实现
@Service("fileLogger")
public class FileLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[FILE] " + message);
    }
}

// 4. 使用 @Qualifier 分别注入
@Service
public class AppService {
    
    @Autowired
    @Qualifier("consoleLogger")
    private Logger consoleLogger;
    
    @Autowired
    @Qualifier("fileLogger")
    private Logger fileLogger;
    
    public void doWork() {
        consoleLogger.log("开始工作");
        // 业务逻辑
        fileLogger.log("工作完成");
    }
}
```

</details>

### 练习 2：构造器注入重构

**题目**：将下面的字段注入代码重构为构造器注入，并解释为什么构造器注入更好。

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private Logger logger;
    
    public void register(User user) {
        userRepository.save(user);
        emailService.sendWelcome(user.getEmail());
        logger.log("用户注册: " + user.getName());
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
@Service
public class UserService {
    
    // 所有依赖声明为 final，保证不可变
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final Logger logger;
    
    // 构造器注入：依赖关系一目了然
    public UserService(
            UserRepository userRepository,
            EmailService emailService,
            Logger logger) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.logger = logger;
    }
    
    public void register(User user) {
        userRepository.save(user);
        emailService.sendWelcome(user.getEmail());
        logger.log("用户注册: " + user.getName());
    }
}
```

**构造器注入的优势**：
1. 依赖不可变（final），线程安全
2. 保证依赖在对象创建时就已就绪，不会出现 NPE
3. 单元测试时可以直接 new UserService(mock1, mock2, mock3)
4. 依赖关系明确，不会隐藏依赖过多的问题

</details>

### 练习 3：自定义 @Qualifier

**题目**：创建两个自定义限定符注解 `@Database` 和 `@Cache`，分别标记两个 `DataRepository` 实现类，然后在 `DataService` 中用这两个注解注入对应的实现。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义自定义限定符注解
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Qualifier
public @interface Database {}

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Qualifier
public @interface Cache {}

// 2. 定义接口
public interface DataRepository {
    String getData(String key);
}

// 3. 数据库实现
@Service
@Database  // 标记为数据库类型
public class DatabaseRepository implements DataRepository {
    @Override
    public String getData(String key) {
        return "DB:" + key;
    }
}

// 4. 缓存实现
@Service
@Cache  // 标记为缓存类型
public class CacheRepository implements DataRepository {
    @Override
    public String getData(String key) {
        return "Cache:" + key;
    }
}

// 5. 使用自定义限定符注入
@Service
public class DataService {
    
    @Autowired
    @Database
    private DataRepository dbRepo;
    
    @Autowired
    @Cache
    private DataRepository cacheRepo;
    
    public String getData(String key) {
        // 先查缓存
        String cached = cacheRepo.getData(key);
        if (cached != null) return cached;
        // 缓存没有查数据库
        return dbRepo.getData(key);
    }
}
```

</details>

---

## 8 下一章预告

恭喜你学完了依赖注入的底层实现！现在你已经知道了 @Autowired、@Resource、@Inject 三者的区别，也理解了 Spring 是如何在底层解析和注入依赖的。

但是，当 Bean 之间互相依赖时（A 依赖 B，B 依赖 A），Spring 是怎么处理的呢？这就是所谓的**循环依赖**问题。

下一章我们会深入 Spring 的**三级缓存机制**，看看它是如何巧妙解决循环依赖的，以及为什么 @Async 注解会导致循环依赖失败。这可是面试高频题，也是理解 Spring 容器生命周期的重要一环。
