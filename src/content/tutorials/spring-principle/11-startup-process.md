---
title: "第 11 章：Spring Boot 启动流程"
description: "深入理解 SpringApplication.run() 完整流程、ApplicationListener 监听机制、ApplicationRunner/CommandLineRunner 执行时机、启动报告与 Banner 原理"
---

# 第 11 章：Spring Boot 启动流程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SpringApplication.run() 这一行代码背后到底做了多少事情？
- Spring Boot 启动时那些日志是怎么按顺序打印出来的？
- ApplicationRunner 和 CommandLineRunner 有什么区别？它们什么时候执行？
- 启动时那个好看的 Banner 是怎么来的？能自定义吗？
- 怎么在启动过程中插入自定义逻辑？

这一章就是为了解答这些问题。我们会从 SpringApplication.run() 的完整流程开始，逐步剖析每个阶段做了什么，深入理解 ApplicationListener 事件监听机制，掌握 Runner 的执行时机和区别，最后了解启动报告和 Banner 的底层原理。

---

## 11.1 为什么需要理解启动流程？

### 痛点分析

很多开发者写了很久 Spring Boot 项目，但对启动过程一无所知：

```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        // 你只知道调用这一行，但不知道它背后做了什么
        SpringApplication.run(MyApplication.class, args);
    }
}
```

**问题**：
- 启动报错时不知道卡在哪个阶段
- 想在启动时做一些初始化工作，不知道什么时候合适
- 不知道启动过程有哪些扩展点可以利用
- 对启动慢的问题无从下手优化

### 解决方案

理解启动流程后，你可以：

- 精准定位启动错误发生在哪个阶段
- 在正确的时机执行初始化逻辑
- 利用事件监听机制插入自定义逻辑
- 有针对性地优化启动速度

打个比方：

> 理解启动流程就像了解"餐厅开业流程"：
> - SpringApplication.run() = 开业仪式
> - 创建环境 = 布置餐厅（准备桌椅、餐具）
> - 创建容器 = 建好厨房
> - 加载 Bean = 请厨师、服务员就位
> - 发布事件 = 通知所有人"开业了"
> - Runner 执行 = 开始接待第一批客人

---

## 11.2 核心原理

### 11.2.1 SpringApplication.run() 完整流程

#### 流程总览

```
SpringApplication.run() 完整流程
│
├── 第一阶段：创建 SpringApplication 对象
│   ├── 1. 记录启动类（primarySources）
│   ├── 2. 推断应用类型（Web/非 Web）
│   ├── 3. 加载 ApplicationContextInitializer
│   └── 4. 加载 ApplicationListener
│
├── 第二阶段：执行 run() 方法
│   ├── 1. 创建并启动 SpringApplicationRunListeners
│   ├── 2. 封装命令行参数
│   ├── 3. 创建 ApplicationContext（容器）
│   ├── 4. 准备容器（prepareContext）
│   ├── 5. 刷新容器（refreshContext）
│   ├── 6. 刷新后回调（afterRefresh）
│   ├── 7. 发布 ApplicationStartedEvent
│   ├── 8. 执行 Runner（callRunners）
│   └── 9. 发布 ApplicationReadyEvent
│
└── 启动完成，应用开始提供服务
```

#### 源码解析

```java
// SpringApplication 构造方法
public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
    
    // 1. 记录 ResourceLoader
    this.resourceLoader = resourceLoader;
    
    // 2. 记录主配置类（就是你的启动类）
    this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
    
    // 3. 推断 Web 应用类型（SERVLET / REACTIVE / NONE）
    this.webApplicationType = WebApplicationType.deduceFromClasspath();
    // 原理：检查类路径中是否有 DispatcherServlet（Servlet MVC）
    // 或 DispatcherHandler（WebFlux），都没有就是非 Web
    
    // 4. 加载 ApplicationContextInitializer（上下文初始化器）
    this.bootstrapContextInitializers = getSpringFactoriesInstances(
        BootstrapRegistryInitializer.class);
    this.applicationContextInitializers = getSpringFactoriesInstances(
        ApplicationContextInitializer.class);
    // 原理：从 META-INF/spring.factories 加载
    
    // 5. 加载 ApplicationListener（应用监听器）
    this.listeners = getSpringFactoriesInstances(ApplicationListener.class);
    // 原理：同样从 META-INF/spring.factories 加载
}

// run() 方法核心源码
public ConfigurableApplicationContext run(String... args) {
    
    // 1. 创建计时器，记录启动时间
    StopWatch stopWatch = new StopWatch();
    stopWatch.start();
    
    // 2. 创建引导上下文（Spring Boot 2.4+）
    DefaultBootstrapContext bootstrapContext = createBootstrapContext();
    
    // 3. 设置 headless 模式（无头模式，不需要图形界面）
    HeadlessPropertySourceAccessor accessor = 
        HeadlessPropertySourceAccessor.headless();
    if (accessor != null) {
        System.setProperty("java.awt.headless", "true");
    }
    
    // 4. 创建并启动 SpringApplicationRunListeners
    SpringApplicationRunListeners listeners = getRunListeners(args);
    listeners.starting(bootstrapContext, this.mainApplicationClass);
    // 发布 ApplicationStartingEvent（应用正在启动）
    
    try {
        // 5. 封装命令行参数
        ApplicationArguments applicationArguments = 
            new DefaultApplicationArguments(args);
        
        // 6. 准备环境（加载配置文件、环境变量等）
        ConfigurableEnvironment environment = 
            prepareEnvironment(listeners, bootstrapContext, applicationArguments);
        configureIgnoreBeanInfo(environment);
        // 发布 ApplicationEnvironmentPreparedEvent（环境准备完成）
        
        // 7. 打印 Banner
        Banner printedBanner = printBanner(environment);
        
        // 8. 创建 ApplicationContext（IoC 容器）
        context = createApplicationContext();
        context.setApplicationStartup(this.applicationStartup);
        
        // 9. 准备容器
        prepareContext(bootstrapContext, context, environment, listeners, 
            applicationArguments, printedBanner);
        // 执行所有 ApplicationContextInitializer
        // 注册启动类为 BeanDefinition
        // 发布 ApplicationContextInitializedEvent
        
        // 10. 刷新容器（核心步骤！）
        refreshContext(context);
        // 这一步会触发：
        // - Bean 扫描和注册
        // - Bean 创建和初始化
        // - 自动配置生效
        // - 内嵌 Web 服务器启动
        
        // 11. 刷新后回调（默认空实现，可以重写）
        afterRefresh(context, applicationArguments);
        
        // 12. 停止计时
        stopWatch.stop();
        
        // 13. 发布 ApplicationStartedEvent（应用已启动）
        listeners.started(context, timeTakenToStartup);
        
        // 14. 执行 Runner
        callRunners(context, applicationArguments);
        
    } catch (Throwable ex) {
        // 启动失败处理
        handleRunFailure(context, ex, listeners);
        throw new IllegalStateException(ex);
    }
    
    // 15. 发布 ApplicationReadyEvent（应用就绪）
    listeners.ready(context, timeTakenToReady);
    
    return context;
}
```

### 11.2.2 各阶段详解

#### 阶段 1：推断 Web 应用类型

```java
// WebApplicationType 推断逻辑
public enum WebApplicationType {
    
    NONE,      // 非 Web 应用
    SERVLET,   // Servlet Web 应用（Spring MVC）
    REACTIVE;  // 响应式 Web 应用（Spring WebFlux）
    
    private static final String[] SERVLET_INDICATOR_CLASSES = {
        "javax.servlet.Servlet",
        "org.springframework.web.servlet.DispatcherServlet"
    };
    
    private static final String WEBFLUX_INDICATOR_CLASS = 
        "org.springframework.web.reactive.DispatcherHandler";
    
    static WebApplicationType deduceFromClasspath() {
        // 1. 如果有 WebFlux 但没有 Servlet，就是 REACTIVE
        if (isPresent(WEBFLUX_INDICATOR_CLASS) && 
            !isPresent("javax.servlet.Servlet")) {
            return REACTIVE;
        }
        
        // 2. 如果 Servlet 相关类都不存在，就是 NONE
        for (String className : SERVLET_INDICATOR_CLASSES) {
            if (!isPresent(className)) {
                return NONE;
            }
        }
        
        // 3. 否则就是 SERVLET
        return SERVLET;
    }
}
```

#### 阶段 2：准备环境

```java
// prepareEnvironment 核心逻辑
private ConfigurableEnvironment prepareEnvironment(
        SpringApplicationRunListeners listeners,
        DefaultBootstrapContext bootstrapContext,
        ApplicationArguments applicationArguments) {
    
    // 1. 根据 Web 类型创建对应的 Environment
    ConfigurableEnvironment environment = getOrCreateEnvironment();
    // SERVLET -> StandardServletEnvironment
    // REACTIVE -> StandardReactiveWebEnvironment
    // NONE -> StandardEnvironment
    
    // 2. 配置环境（设置 active profiles、默认 properties）
    configureEnvironment(environment, applicationArguments.getSourceArgs());
    
    // 3. 绑定环境到 ConfigurationPropertySources
    ConfigurationPropertySources.attach(environment);
    
    // 4. 发布 ApplicationEnvironmentPreparedEvent
    listeners.environmentPrepared(bootstrapContext, environment);
    // 监听这个事件可以修改 Environment
    
    // 5. 加载 application.properties / application.yml
    // 这个过程在 listeners.environmentPrepared() 中完成
    
    return environment;
}
```

#### 阶段 3：创建容器

```java
// createApplicationContext 核心逻辑
protected ConfigurableApplicationContext createApplicationContext() {
    // 根据 Web 类型创建不同的容器
    return this.applicationContextFactory.create(this.webApplicationType);
}

// 默认工厂方法
static ConfigurableApplicationContext createDefaultContext(WebApplicationType type) {
    switch (type) {
        case SERVLET:
            // Servlet Web -> AnnotationConfigServletWebServerApplicationContext
            return new AnnotationConfigServletWebServerApplicationContext();
        case REACTIVE:
            // 响应式 Web -> AnnotationConfigReactiveWebApplicationContext
            return new AnnotationConfigReactiveWebApplicationContext();
        case NONE:
            // 非 Web -> AnnotationConfigApplicationContext
            return new AnnotationConfigApplicationContext();
    }
}
```

#### 阶段 4：准备容器

```java
// prepareContext 核心逻辑
private void prepareContext(
        DefaultBootstrapContext bootstrapContext,
        ConfigurableApplicationContext context,
        ConfigurableEnvironment environment,
        SpringApplicationRunListeners listeners,
        ApplicationArguments applicationArguments,
        Banner printedBanner) {
    
    // 1. 绑定环境到容器
    context.setEnvironment(environment);
    
    // 2. 后处理（设置 bean name generator、conversion service 等）
    postProcessApplicationContext(context);
    
    // 3. 执行所有 ApplicationContextInitializer
    applyInitializers(context);
    // 每个 Initializer 可以对容器做自定义修改
    
    // 4. 发布 ApplicationContextInitializedEvent
    listeners.contextCreated(context);
    
    // 5. 注册启动类为 BeanDefinition
    BeanDefinitionLoader loader = new BeanDefinitionLoader(context);
    loader.setBeanNameGenerator(new AnnotationBeanNameGenerator());
    loader.load(this.primarySources);  // 加载你的 @SpringBootApplication 类
    loader.load(applicationArguments.getSourceArgs());
    
    // 6. 发布 ApplicationPreparedEvent
    listeners.prepared(context, applicationArguments);
}
```

#### 阶段 5：刷新容器（最核心）

```java
// refreshContext 核心逻辑
private void refreshContext(ConfigurableApplicationContext context) {
    // 注册 shutdown hook（JVM 关闭时自动关闭容器）
    if (this.registerShutdownHook) {
        shutdownHook.registerApplicationContext(context);
    }
    
    // 调用容器的 refresh() 方法
    // 这就是 Spring 容器启动的核心！
    refresh(context);
}

// refresh() 内部会调用 AbstractApplicationContext.refresh()
// 这个方法包含 12 个步骤（参考第 1 章 IoC 容器原理）：
// 1. 准备刷新
// 2. 获取 BeanFactory
// 3. 加载 BeanDefinition
// 4. 调用 BeanFactoryPostProcessor
// 5. 注册 BeanPostProcessor
// 6. 初始化 MessageSource
// 7. 初始化 ApplicationEventMulticaster
// 8. 初始化特殊 Bean（如 ViewResolver）
// 9. 注册监听器
// 10. 完成刷新（启动内嵌 Web 服务器在这里！）
// 11. 完成刷新回调
// 12. 发布 ContextRefreshedEvent
```

### 11.2.3 ApplicationListener 事件监听机制

#### 启动过程中的事件顺序

```
SpringApplication.run() 启动过程中发布的事件：

1. ApplicationStartingEvent
   ↓ 应用开始启动，环境还未创建
   ↓ 可以知道：应用类型、启动类
   ↓
2. ApplicationEnvironmentPreparedEvent
   ↓ 环境准备完成，配置文件已加载
   ↓ 可以知道：Environment、配置属性
   ↓ 可以修改：Environment
   ↓
3. ApplicationContextInitializedEvent
   ↓ 容器创建完成，Initializer 已执行
   ↓ 可以知道：ApplicationContext
   ↓
4. ApplicationPreparedEvent
   ↓ 容器准备完成，BeanDefinition 已加载
   ↓ 可以知道：ApplicationContext、ApplicationArguments
   ↓
5. ApplicationStartedEvent
   ↓ 容器刷新完成，Runner 还没执行
   ↓ 可以知道：应用已启动
   ↓
6. AvailabilityChangeEvent（LivenessState.CORRECT）
   ↓ 存活状态变为正确
   ↓
7. ApplicationReadyEvent
   ↓ Runner 执行完成，应用完全就绪
   ↓ 可以知道：应用已准备好接收请求
   ↓
8. AvailabilityChangeEvent（ReadinessState.ACCEPTING_TRAFFIC）
   ↓ 就绪状态变为接受流量
```

#### 监听事件的三种方式

```java
// 方式 1：实现 ApplicationListener 接口
public class MyApplicationListener implements ApplicationListener<ApplicationStartedEvent> {
    
    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        // 应用启动完成时执行
        System.out.println("应用已启动！");
    }
}

// 注册方式 1：在 spring.factories 中注册
// org.springframework.context.ApplicationListener=com.example.MyApplicationListener

// 注册方式 2：通过代码注册
SpringApplication app = new SpringApplication(MyApplication.class);
app.addListeners(new MyApplicationListener());
app.run(args);

// 方式 2：使用 @EventListener 注解（推荐）
@Component
public class MyEventListener {
    
    @EventListener(ApplicationStartedEvent.class)
    public void onApplicationStarted(ApplicationStartedEvent event) {
        System.out.println("应用已启动！");
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        System.out.println("应用已就绪，可以接收请求！");
    }
    
    @EventListener
    public void onEvent(ApplicationEvent event) {
        // 监听所有事件
        System.out.println("收到事件: " + event.getClass().getSimpleName());
    }
}

// 方式 3：实现 SmartLifecycle 接口
@Component
public class MySmartLifecycle implements SmartLifecycle {
    
    private boolean running = false;
    
    @Override
    public void start() {
        // 容器刷新完成后自动调用
        System.out.println("SmartLifecycle 启动");
        this.running = true;
    }
    
    @Override
    public void stop() {
        // 容器关闭时调用
        System.out.println("SmartLifecycle 停止");
        this.running = false;
    }
    
    @Override
    public boolean isRunning() {
        return running;
    }
    
    @Override
    public int getPhase() {
        return Integer.MAX_VALUE;  // 最后启动
    }
}
```

#### 源码解析：事件发布流程

```java
// SimpleApplicationEventMulticaster 事件发布核心逻辑
public class SimpleApplicationEventMulticaster extends AbstractApplicationEventMulticaster {
    
    @Override
    public void multicastEvent(ApplicationEvent event, ResolvableType eventType) {
        ResolvableType type = (eventType != null ? eventType : resolveDefaultEventType(event));
        
        // 获取线程池（如果有则异步执行）
        Executor executor = getTaskExecutor();
        
        // 遍历所有匹配的监听器
        for (ApplicationListener<?> listener : getApplicationListeners(event, type)) {
            
            // 检查是否支持当前事件类型
            boolean supportsEvent = supportsEvent(listener, type, event.getClass());
            
            if (supportsEvent) {
                if (executor != null) {
                    // 异步执行
                    executor.execute(() -> invokeListener(listener, event));
                } else {
                    // 同步执行
                    invokeListener(listener, event);
                }
            }
        }
    }
    
    // 调用监听器
    private void invokeListener(ApplicationListener<?> listener, ApplicationEvent event) {
        try {
            // 调用监听器的 onApplicationEvent 方法
            listener.onApplicationEvent(event);
        } catch (ClassCastException ex) {
            // 类型不匹配，忽略
        }
    }
}
```

### 11.2.4 ApplicationRunner 与 CommandLineRunner

#### 执行时机

```
SpringApplication.run() 执行顺序：

1. 创建 SpringApplication 对象
2. 执行 run() 方法
   ├── 创建环境
   ├── 创建容器
   ├── 准备容器
   ├── 刷新容器（Bean 初始化在这里）
   ├── 发布 ApplicationStartedEvent
   ├── callRunners()  ← Runner 在这里执行！
   │   ├── 先执行所有 CommandLineRunner
   │   └── 再执行所有 ApplicationRunner
   └── 发布 ApplicationReadyEvent
3. 启动完成
```

#### 源码解析

```java
// callRunners 源码
private void callRunners(ApplicationContext context, ApplicationArguments args) {
    
    // 1. 获取所有 Runner Bean
    List<Object> runners = new ArrayList<>();
    
    // 获取所有 CommandLineRunner
    runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
    
    // 获取所有 ApplicationRunner
    runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
    
    // 2. 排序（通过 @Order 注解或 Ordered 接口）
    AnnotationAwareOrderComparator.sort(runners);
    
    // 3. 依次执行
    for (Object runner : runners) {
        if (runner instanceof ApplicationRunner) {
            // ApplicationRunner：参数被封装成 ApplicationArguments 对象
            callApplicationRunner((ApplicationRunner) runner, args);
        } else if (runner instanceof CommandLineRunner) {
            // CommandLineRunner：参数是原始字符串数组
            callCommandLineRunner((CommandLineRunner) runner, args);
        }
    }
}

private void callApplicationRunner(ApplicationRunner runner, ApplicationArguments args) {
    runner.run(args);  // 传入封装好的参数对象
}

private void callCommandLineRunner(CommandLineRunner runner, ApplicationArguments args) {
    runner.run(args.getSourceArgs());  // 传入原始字符串数组
}
```

#### 使用示例

```java
// CommandLineRunner：接收原始字符串数组
@Component
@Order(1)  // 指定执行顺序
public class MyCommandLineRunner implements CommandLineRunner {
    
    @Override
    public void run(String... args) throws Exception {
        // args 是原始字符串数组
        // 例如：java -jar app.jar --name=test --port=8080
        // args = ["--name=test", "--port=8080"]
        
        System.out.println("CommandLineRunner 执行");
        for (String arg : args) {
            System.out.println("参数: " + arg);
        }
    }
}

// ApplicationRunner：接收封装好的参数对象
@Component
@Order(2)  // 指定执行顺序
public class MyApplicationRunner implements ApplicationRunner {
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        // args 是封装好的对象，可以方便地获取参数
        
        System.out.println("ApplicationRunner 执行");
        
        // 获取选项参数（--key=value 格式）
        Set<String> optionNames = args.getOptionNames();
        for (String name : optionNames) {
            System.out.println("选项: " + name + " = " + args.getOptionValues(name));
        }
        
        // 获取非选项参数（没有 -- 前缀的参数）
        List<String> nonOptionArgs = args.getNonOptionArgs();
        for (String arg : nonOptionArgs) {
            System.out.println("非选项参数: " + arg);
        }
        
        // 检查是否包含某个选项
        if (args.containsOption("name")) {
            System.out.println("name = " + args.getOptionValues("name").get(0));
        }
    }
}
```

### 11.2.5 启动报告与 Banner 原理

#### Banner 原理

```java
// Banner 加载流程
private Banner printBanner(ConfigurableEnvironment environment) {
    
    // 1. 检查是否禁用 Banner
    if (this.bannerMode == Banner.Mode.OFF) {
        return null;  // 不打印
    }
    
    // 2. 获取 Banner 资源
    Resource bannerResource = getBannerResource(environment);
    // 查找顺序：
    // 1. spring.banner.image.location 或 spring.banner.location 配置
    // 2. classpath:banner.gif / banner.jpg / banner.png
    // 3. classpath:banner.txt
    // 4. 默认 Spring Boot Banner
    
    // 3. 创建 Banner 对象
    Banner banner = createBanner(bannerResource);
    
    // 4. 打印 Banner
    if (this.bannerMode == Banner.Mode.CONSOLE) {
        banner.printBanner(environment, null, System.out);
    } else if (this.bannerMode == Banner.Mode.LOG) {
        banner.printBanner(environment, null, logger);
    }
    
    return banner;
}

// 自定义 Banner
// 方式 1：在 classpath 下放置 banner.txt
// 方式 2：通过配置指定路径
// spring.banner.location=classpath:custom-banner.txt
```

#### 启动报告原理

```java
// 启动完成后打印的报告
// 包含：启动时间、PID、端口等信息

// 关闭启动报告
// spring.main.log-startup-info=false

// 自定义启动报告
@Bean
public ApplicationStartup applicationStartup() {
    return new BufferingApplicationStartup(2048);
}
```

---

## 11.3 基础用法

### 11.3.1 自定义 SpringApplication

```java
// 方式 1：通过代码自定义
@SpringBootApplication
public class MyApplication {
    
    public static void main(String[] args) {
        // 创建 SpringApplication 对象
        SpringApplication app = new SpringApplication(MyApplication.class);
        
        // 设置 Banner 模式
        app.setBannerMode(Banner.Mode.OFF);  // 关闭 Banner
        
        // 设置是否 headless
        app.setHeadless(true);
        
        // 添加监听器
        app.addListeners(event -> {
            System.out.println("事件: " + event.getClass().getSimpleName());
        });
        
        // 添加初始化器
        app.addInitializers(context -> {
            System.out.println("容器初始化: " + context.getDisplayName());
        });
        
        // 设置默认属性
        app.setDefaultProperties(Map.of(
            "server.port", 8080,
            "spring.profiles.active", "dev"
        ));
        
        // 启动应用
        app.run(args);
    }
}

// 方式 2：通过 Builder 模式
@SpringBootApplication
public class MyApplication {
    
    public static void main(String[] args) {
        new SpringApplicationBuilder(MyApplication.class)
            .bannerMode(Banner.Mode.OFF)  // 关闭 Banner
            .web(WebApplicationType.SERVLET)  // 设置 Web 类型
            .properties("server.port=8080")  // 设置属性
            .listeners(event -> {  // 添加监听器
                System.out.println("事件: " + event.getClass().getSimpleName());
            })
            .run(args);
    }
}
```

### 11.3.2 启动时执行初始化逻辑

```java
// 方式 1：使用 CommandLineRunner（简单参数）
@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // 初始化数据库数据
        if (userRepository.count() == 0) {
            userRepository.save(new User("admin", "admin123"));
            userRepository.save(new User("user", "user123"));
            System.out.println("初始数据已加载");
        }
    }
}

// 方式 2：使用 ApplicationRunner（封装参数）
@Component
public class ConfigChecker implements ApplicationRunner {
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 检查必要参数
        if (!args.containsOption("config-path")) {
            System.out.println("警告：未指定 config-path 参数");
        }
    }
}

// 方式 3：使用 @EventListener（监听启动事件）
@Component
public class StartupLogger {
    
    @EventListener(ApplicationStartedEvent.class)
    public void onStarted() {
        System.out.println("应用已启动！");
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        System.out.println("应用已就绪，可以接收请求！");
    }
}
```

### 11.3.3 自定义 Banner

```
// banner.txt 示例
// 可以使用 http://patorjk.com/software/taag/ 生成 ASCII 艺术

  ____              __ _ _
 / ___| _ __  _ __ / _| |_   _
 \___ \| '_ \| '__| |_| | | | |
  ___) | |_) | |  |  _| | |_| |
 |____/| .__/|_|  |_| |_|\__, |
       |_|               |___/

:: Spring Boot ::  (v3.0.0)

// 在 banner.txt 中可以使用变量：
// ${application.version} - 应用版本
// ${application.formatted-version} - 格式化版本
// ${spring-boot.version} - Spring Boot 版本
// ${spring-boot.formatted-version} - 格式化 Spring Boot 版本
// ${AnsiColor.GREEN} - 设置颜色
// ${AnsiStyle.BOLD} - 设置样式
```

```
// 带颜色和变量的 banner.txt
${AnsiColor.GREEN}${AnsiStyle.BOLD}
  _   _   _   _   _   _   _   _
 / \ / \ / \ / \ / \ / \ / \ / \
( M | y | A | p | p | S | t | r )
 \_/ \_/ \_/ \_/ \_/ \_/ \_/ \_/
${AnsiColor.DEFAULT}
Application Version: ${application.version}
Spring Boot Version: ${spring-boot.formatted-version}
```

```yaml
# application.yml - Banner 配置
spring:
  banner:
    location: classpath:banner.txt  # 自定义 Banner 文件路径
    # image:
    #   location: classpath:banner.png  # 使用图片作为 Banner
```

---

## 11.4 对比表格

### 启动事件对比

| 事件 | 触发时机 | 可以获取的信息 | 典型用途 |
| --- | --- | --- | --- |
| ApplicationStartingEvent | 应用刚开始启动 | 应用类型、启动类 | 早期初始化 |
| ApplicationEnvironmentPreparedEvent | 环境准备完成 | Environment、配置 | 修改 Environment |
| ApplicationContextInitializedEvent | 容器创建完成 | ApplicationContext | 容器后处理 |
| ApplicationPreparedEvent | 容器准备完成 | ApplicationContext | 最终修改 |
| ApplicationStartedEvent | 容器刷新完成 | 应用已启动 | 初始化数据 |
| ApplicationReadyEvent | 应用完全就绪 | 应用可接收请求 | 注册服务、通知 |
| ApplicationFailedEvent | 启动失败 | 异常信息 | 错误处理、告警 |

### Runner 对比

| 特性 | CommandLineRunner | ApplicationRunner |
| --- | --- | --- |
| 参数类型 | String... args | ApplicationArguments |
| 参数格式 | 原始字符串数组 | 封装好的对象 |
| 获取选项参数 | 需要手动解析 | getOptionNames() / getOptionValues() |
| 获取非选项参数 | 需要手动过滤 | getNonOptionArgs() |
| 检查选项是否存在 | 需要手动遍历 | containsOption() |
| 执行顺序 | 先执行 | 后执行 |
| 适用场景 | 简单参数处理 | 复杂参数处理 |

### 初始化方式对比

| 方式 | 执行时机 | 获取 Bean | 适用场景 |
| --- | --- | --- | --- |
| CommandLineRunner | Runner 阶段 | 可以 | 需要依赖其他 Bean 的初始化 |
| ApplicationRunner | Runner 阶段 | 可以 | 需要解析命令行参数 |
| @EventListener | 指定事件时 | 可以 | 监听特定启动事件 |
| SmartLifecycle | 容器刷新时 | 可以 | 需要精确控制启动顺序 |
| ApplicationContextInitializer | 容器准备时 | 不可以 | 修改容器配置 |
| @PostConstruct | Bean 初始化时 | 当前 Bean | 单个 Bean 的初始化 |

---

## 11.5 新手常见误区

### 误区 1：在 @PostConstruct 中注入所有 Bean

**错！** @PostConstruct 在 Bean 初始化时执行，此时其他 Bean 可能还没初始化完：

```java
// ❌ 错误：@PostConstruct 中依赖其他 Bean
@Component
public class DataInitializer {
    
    @Autowired
    private UserService userService;
    
    @PostConstruct
    public void init() {
        // userService 可能还没初始化完
        // 或者 userService 依赖的其他 Bean 还没初始化
        userService.loadData();
    }
}

// ✅ 正确：使用 CommandLineRunner 或 ApplicationRunner
@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserService userService;
    
    @Override
    public void run(String... args) {
        // 此时所有 Bean 都已初始化完成
        userService.loadData();
    }
}
```

### 误区 2：CommandLineRunner 和 ApplicationRunner 的执行顺序

**错！** 不是"谁先注册谁先执行"，而是：
- 所有 CommandLineRunner 先执行
- 然后所有 ApplicationRunner 执行
- 同类型内按 @Order 排序

```java
// ❌ 错误理解：以为 MyApplicationRunner 会先执行（因为它先注册）
@Component
public class MyApplicationRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        System.out.println("ApplicationRunner");  // 实际第二个执行
    }
}

@Component
public class MyCommandLineRunner implements CommandLineRunner {
    @Override
    public void run(String... args) {
        System.out.println("CommandLineRunner");  // 实际第一个执行
    }
}
```

### 误区 3：ApplicationListener 只能监听内置事件

**错！** 你可以自定义事件并发布：

```java
// ✅ 自定义事件
public class MyEvent extends ApplicationEvent {
    
    private final String message;
    
    public MyEvent(Object source, String message) {
        super(source);
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
}

// 发布事件
@Component
public class MyEventPublisher {
    
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void doSomething() {
        // 发布自定义事件
        eventPublisher.publishEvent(new MyEvent(this, "Hello!"));
    }
}

// 监听自定义事件
@Component
public class MyEventListener {
    
    @EventListener
    public void handleMyEvent(MyEvent event) {
        System.out.println("收到事件: " + event.getMessage());
    }
}
```

### 误区 4：Runner 中抛出异常不影响启动

**错！** Runner 中抛出异常会导致启动失败：

```java
// ❌ 错误：Runner 中抛出异常
@Component
public class BadRunner implements CommandLineRunner {
    
    @Override
    public void run(String... args) throws Exception {
        throw new RuntimeException("初始化失败！");  // 会导致应用启动失败！
    }
}

// ✅ 正确：捕获异常并处理
@Component
public class GoodRunner implements CommandLineRunner {
    
    @Override
    public void run(String... args) throws Exception {
        try {
            // 可能失败的操作
            initializeData();
        } catch (Exception e) {
            // 记录日志但不抛出异常
            System.err.println("初始化失败，使用默认数据: " + e.getMessage());
            initializeDefaultData();
        }
    }
}
```

### 误区 5：启动慢只能忍着

**错！** 可以分析和优化启动速度：

```yaml
# application.yml - 开启启动耗时分析
spring:
  main:
    log-startup-info: true  # 打印启动信息
    lazy-initialization: true  # 延迟初始化 Bean（按需加载）

# 使用 Startup Endpoint 分析
# 启动后访问 /actuator/startup 查看每个 Bean 的初始化耗时
```

```java
// 使用 BufferingApplicationStartup 记录启动步骤
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MyApplication.class);
        // 记录最多 2048 个启动步骤
        app.setApplicationStartup(new BufferingApplicationStartup(2048));
        app.run(args);
    }
}
```

---

## 11.6 动手练习

### 练习 1：基础练习 - 监听启动事件

创建一个监听器，在应用启动的不同阶段打印日志，记录每个阶段的耗时。

<details>
<summary>点击查看答案</summary>

```java
@Component
public class StartupPhaseLogger {
    
    // 记录各阶段时间
    private long startingTime;
    private long environmentTime;
    private long contextTime;
    
    // 1. 应用开始启动
    @EventListener(ApplicationStartingEvent.class)
    public void onStarting() {
        startingTime = System.currentTimeMillis();
        System.out.println("[启动] 应用开始启动...");
    }
    
    // 2. 环境准备完成
    @EventListener(ApplicationEnvironmentPreparedEvent.class)
    public void onEnvironmentPrepared() {
        environmentTime = System.currentTimeMillis();
        long elapsed = environmentTime - startingTime;
        System.out.println("[启动] 环境准备完成，耗时: " + elapsed + "ms");
    }
    
    // 3. 容器创建完成
    @EventListener(ApplicationContextInitializedEvent.class)
    public void onContextInitialized() {
        contextTime = System.currentTimeMillis();
        long elapsed = contextTime - environmentTime;
        System.out.println("[启动] 容器创建完成，耗时: " + elapsed + "ms");
    }
    
    // 4. 应用启动完成
    @EventListener(ApplicationStartedEvent.class)
    public void onStarted() {
        long startedTime = System.currentTimeMillis();
        long elapsed = startedTime - contextTime;
        System.out.println("[启动] 容器刷新完成，耗时: " + elapsed + "ms");
    }
    
    // 5. 应用就绪
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        long readyTime = System.currentTimeMillis();
        long totalElapsed = readyTime - startingTime;
        System.out.println("[启动] 应用完全就绪！总耗时: " + totalElapsed + "ms");
    }
    
    // 6. 启动失败
    @EventListener(ApplicationFailedEvent.class)
    public void onFailed(ApplicationFailedEvent event) {
        System.out.println("[启动] 启动失败: " + event.getException().getMessage());
    }
}
```

</details>

### 练习 2：进阶练习 - 启动参数解析

创建一个应用，支持通过命令行参数配置数据库连接信息，并在启动时验证参数。

<details>
<summary>点击查看答案</summary>

```java
// 启动参数解析 Runner
@Component
public class DatabaseConfigRunner implements ApplicationRunner, ApplicationListener<ApplicationReadyEvent> {
    
    private boolean configValid = false;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("=== 数据库配置检查 ===");
        
        // 检查数据库 URL
        if (!args.containsOption("db-url")) {
            System.out.println("[警告] 未指定 --db-url，使用默认值");
        } else {
            String dbUrl = args.getOptionValues("db-url").get(0);
            System.out.println("[信息] 数据库 URL: " + dbUrl);
        }
        
        // 检查用户名
        if (!args.containsOption("db-username")) {
            System.out.println("[警告] 未指定 --db-username，使用默认值 root");
        } else {
            String username = args.getOptionValues("db-username").get(0);
            System.out.println("[信息] 数据库用户名: " + username);
        }
        
        // 检查密码
        if (!args.containsOption("db-password")) {
            System.out.println("[警告] 未指定 --db-password");
        }
        
        // 检查连接池大小
        if (args.containsOption("db-pool-size")) {
            int poolSize = Integer.parseInt(args.getOptionValues("db-pool-size").get(0));
            if (poolSize < 1 || poolSize > 100) {
                System.out.println("[错误] db-pool-size 必须在 1-100 之间");
            } else {
                System.out.println("[信息] 连接池大小: " + poolSize);
                configValid = true;
            }
        } else {
            System.out.println("[信息] 使用默认连接池大小: 10");
            configValid = true;
        }
        
        // 获取非选项参数
        List<String> nonOptionArgs = args.getNonOptionArgs();
        if (!nonOptionArgs.isEmpty()) {
            System.out.println("[信息] 非选项参数: " + nonOptionArgs);
        }
    }
    
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (configValid) {
            System.out.println("[信息] 数据库配置验证通过，应用已就绪");
        } else {
            System.out.println("[警告] 数据库配置可能有问题，请检查");
        }
    }
}

// 启动方式：
// java -jar app.jar --db-url=jdbc:mysql://localhost:3306/mydb --db-username=admin --db-password=123456 --db-pool-size=20
```

</details>

### 练习 3（挑战）：综合练习 - 启动健康检查

创建一个启动健康检查机制，在应用就绪后自动检查各个组件是否正常，并输出健康报告。

<details>
<summary>点击查看答案</summary>

```java
// 1. 健康检查接口
public interface HealthChecker {
    String getName();  // 组件名称
    boolean check();   // 检查结果
    String getMessage();  // 检查信息
}

// 2. 数据库健康检查
@Component
public class DatabaseHealthChecker implements HealthChecker {
    
    @Autowired(required = false)
    private DataSource dataSource;
    
    @Override
    public String getName() {
        return "数据库";
    }
    
    @Override
    public boolean check() {
        if (dataSource == null) {
            return true;  // 没有配置数据源，跳过检查
        }
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(3);  // 3 秒超时
        } catch (SQLException e) {
            return false;
        }
    }
    
    @Override
    public String getMessage() {
        return check() ? "连接正常" : "连接失败";
    }
}

// 3. Redis 健康检查（模拟）
@Component
public class RedisHealthChecker implements HealthChecker {
    
    @Override
    public String getName() {
        return "Redis";
    }
    
    @Override
    public boolean check() {
        // 模拟检查
        return true;
    }
    
    @Override
    public String getMessage() {
        return "连接正常";
    }
}

// 4. 外部服务健康检查（模拟）
@Component
public class ExternalServiceHealthChecker implements HealthChecker {
    
    @Override
    public String getName() {
        return "外部服务";
    }
    
    @Override
    public boolean check() {
        // 模拟检查
        return true;
    }
    
    @Override
    public String getMessage() {
        return "响应正常";
    }
}

// 5. 健康检查执行器
@Component
public class HealthCheckRunner implements ApplicationRunner {
    
    @Autowired
    private List<HealthChecker> healthCheckers;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println();
        System.out.println("========================================");
        System.out.println("         启动健康检查报告");
        System.out.println("========================================");
        
        int total = healthCheckers.size();
        int passed = 0;
        int failed = 0;
        
        for (HealthChecker checker : healthCheckers) {
            boolean result = checker.check();
            String status = result ? "[OK]" : "[FAIL]";
            
            System.out.printf("  %s %-10s - %s%n", 
                status, checker.getName(), checker.getMessage());
            
            if (result) {
                passed++;
            } else {
                failed++;
            }
        }
        
        System.out.println("========================================");
        System.out.printf("  总计: %d | 通过: %d | 失败: %d%n", total, passed, failed);
        
        if (failed == 0) {
            System.out.println("  状态: 所有组件正常");
        } else {
            System.out.println("  状态: 存在异常组件，请检查！");
        }
        
        System.out.println("========================================");
        System.out.println();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 注解驱动原理**——也就是注解元数据解析、RegisteredBean 注册流程、注解如何触发 Bean 创建、元注解与组合注解、@ComponentScan 扫描原理。你会学到 Spring 是怎么"看懂"注解的，注解背后的元数据是怎么解析的，以及 @ComponentScan 是怎么扫描到所有 Bean 的。
