---
title: "第 1 章：IoC 容器核心原理"
description: "深入理解 Spring IoC 容器的底层实现原理，掌握容器启动流程"
---

# 第 1 章：IoC 容器核心原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- IoC 容器到底是个什么东西？它和普通对象创建有什么区别？
- BeanFactory 和 ApplicationContext 都是容器，它们有什么区别？该用哪个？
- Spring 容器启动时到底做了什么？refresh() 方法里的 12 个步骤分别干了啥？
- BeanDefinition 注册中心是怎么工作的？为什么 Spring 能管理那么多 Bean？

这一章就是为了解答这些问题。我们会从最底层的源码出发，搞清楚 **IoC 容器的核心原理**，让你不再只是"会用"Spring，而是真正"理解"Spring。

学完本章，你将能够：
- 清楚说出 BeanFactory 和 ApplicationContext 的本质区别
- 理解容器启动的完整流程和每个步骤的作用
- 掌握 BeanDefinition 注册中心的工作原理
- 能够手动模拟一个简单的 IoC 容器

---

## 1 为什么需要 IoC 容器？

### 痛点分析

想象一下，你要开一家餐厅。如果没有"厨房管理系统"，每次做菜你都得：
1. 自己去仓库找食材（创建对象）
2. 自己检查食材新不新鲜（依赖检查）
3. 自己把食材交给厨师（依赖注入）
4. 自己收拾厨房（资源管理）

```java
// 没有 IoC 时的代码 - 就像自己管理一切
public class Restaurant {
    private Chef chef;
    private Waiter waiter;
    private Cashier cashier;
    
    public Restaurant() {
        // 自己创建所有依赖 - 累死了！
        this.chef = new ChefImpl();
        this.waiter = new WaiterImpl();
        this.cashier = new CashierImpl();
        
        // 还要手动设置它们之间的关系
        chef.setWaiter(waiter);
        waiter.setCashier(cashier);
    }
}
```

**问题很明显**：
- 对象之间的依赖关系硬编码在代码里，改一个地方可能要改很多地方
- 对象创建和管理的代码到处都是，难以维护
- 想换个实现？得把所有 new 的地方都改一遍
- 单元测试困难，因为依赖关系都是写死的

### 解决方案：IoC 容器

有了 IoC 容器，就像请了一个专业的"厨房管理系统"：
1. 你只需要告诉系统"我需要厨师、服务员、收银员"（声明依赖）
2. 系统自动帮你创建这些对象（对象创建）
3. 系统自动把它们组装好（依赖注入）
4. 系统还帮你管理它们的生命周期（生命周期管理）

```java
// 有 IoC 容器后的代码 - 轻松多了！
@Component
public class Restaurant {
    private final Chef chef;
    private final Waiter waiter;
    private final Cashier cashier;
    
    // 只需要声明需要什么，容器自动注入
    public Restaurant(Chef chef, Waiter waiter, Cashier cashier) {
        this.chef = chef;
        this.waiter = waiter;
        this.cashier = cashier;
    }
}
```

> **一句话总结**：IoC 容器就像一个"大管家"，帮你管理所有对象的创建、组装和生命周期，你只需要专注于业务逻辑。

---

## 2 核心原理：IoC 容器的本质

### 概念解释

IoC（Inversion of Control，控制反转）的核心思想是：**把对象的创建和管理权交给容器，而不是自己控制**。

打个比方：

> 传统方式就像你自己做饭，从买菜到炒菜全靠自己；
> IoC 方式就像点外卖，你只需要告诉平台"我要什么"，平台帮你搞定一切。

### 容器的本质：一个超级 Map

从底层来看，IoC 容器本质上就是一个**超级 Map**：
- Key：Bean 的名称或类型
- Value：Bean 的实例对象

```java
// 简化的容器实现 - 帮助理解本质
public class SimpleIoCContainer {
    // 存储 Bean 定义的地方（相当于菜单）
    private Map<String, BeanDefinition> beanDefinitionMap = new HashMap<>();
    
    // 存储 Bean 实例的地方（相当于做好的菜）
    private Map<String, Object> beanInstanceMap = new HashMap<>();
    
    // 注册 Bean 定义
    public void registerBeanDefinition(String name, BeanDefinition bd) {
        beanDefinitionMap.put(name, bd);
    }
    
    // 获取 Bean 实例
    public Object getBean(String name) {
        // 如果已经创建过，直接返回
        if (beanInstanceMap.containsKey(name)) {
            return beanInstanceMap.get(name);
        }
        
        // 否则，创建 Bean
        Object bean = createBean(name);
        beanInstanceMap.put(name, bean);
        return bean;
    }
    
    // 创建 Bean 的核心逻辑
    private Object createBean(String name) {
        BeanDefinition bd = beanDefinitionMap.get(name);
        // 1. 通过反射创建实例
        Object bean = instantiateBean(bd.getBeanClass());
        // 2. 注入依赖
        injectDependencies(bean, bd);
        // 3. 初始化
        initializeBean(bean);
        return bean;
    }
}
```

### BeanFactory vs ApplicationContext

这两个都是容器，但功能不同：

| 特性 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| 定位 | 最基础的 IoC 容器 | BeanFactory 的增强版 |
| Bean 创建时机 | 懒加载（用到时才创建） | 预加载（启动时创建所有单例） |
| 国际化支持 | 不支持 | 支持（MessageSource） |
| 事件机制 | 不支持 | 支持（ApplicationEvent） |
| AOP 集成 | 需要手动配置 | 自动集成 |
| 注解支持 | 基础支持 | 完整支持（@Autowired 等） |
| 使用场景 | 资源受限环境（如 Applet） | 绝大多数企业应用 |

**源码层面的区别**：

```java
// BeanFactory 的核心接口 - 非常简单
public interface BeanFactory {
    // 获取 Bean 实例
    Object getBean(String name) throws BeansException;
    <T> T getBean(String name, Class<T> requiredType) throws BeansException;
    <T> T getBean(Class<T> requiredType) throws BeansException;
    
    // 判断是否包含某个 Bean
    boolean containsBean(String name) throws NoSuchBeanDefinitionException;
    
    // 判断 Bean 是否是单例
    boolean isSingleton(String name) throws NoSuchBeanDefinitionException;
    boolean isPrototype(String name) throws NoSuchBeanDefinitionException;
}

// ApplicationContext 继承了多个接口，功能更强大
public interface ApplicationContext extends 
    BeanFactory,           // 继承 BeanFactory 的所有功能
    MessageSource,         // 国际化支持
    ApplicationEventPublisher, // 事件发布
    ResourcePatternResolver,   // 资源加载
    EnvironmentCapable {       // 环境配置
    
    // 获取应用 ID
    String getId();
    String getApplicationName();
    String getDisplayName();
    
    // 获取启动时间
    long getStartupDate();
    
    // 获取父容器
    ApplicationContext getParent();
    
    // 获取 BeanFactory（用于底层操作）
    AutowireCapableBeanFactory getAutowireCapableBeanFactory();
}
```

> **生活化类比**：
> - BeanFactory 就像一个"基础厨房"，只能做菜
> - ApplicationContext 像"智能厨房"，除了做菜，还能管理订单、处理支付、发送通知

---

## 3 容器启动流程：refresh() 12 步详解

### 核心源码位置

容器启动的核心逻辑在 `AbstractApplicationContext.refresh()` 方法中：

```java
// 源码位置：org.springframework.context.support.AbstractApplicationContext
@Override
public void refresh() throws BeansException, IllegalStateException {
    synchronized (this.startupShutdownMonitor) {
        // 1. 准备刷新：设置启动时间、标记状态等
        prepareRefresh();
        
        // 2. 获取 BeanFactory：创建或获取内部的 BeanFactory
        ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
        
        // 3. 准备 BeanFactory：设置类加载器、添加 BeanPostProcessor 等
        prepareBeanFactory(beanFactory);
        
        try {
            // 4. 后置处理 BeanFactory：留给子类扩展的钩子
            postProcessBeanFactory(beanFactory);
            
            // 5. 调用 BeanFactoryPostProcessor：修改 BeanDefinition
            invokeBeanFactoryPostProcessors(beanFactory);
            
            // 6. 注册 BeanPostProcessor：注册 Bean 后处理器
            registerBeanPostProcessors(beanFactory);
            
            // 7. 初始化消息源：国际化支持
            initMessageSource();
            
            // 8. 初始化事件广播器：事件机制支持
            initApplicationEventMulticaster();
            
            // 9. 子类特殊初始化：留给子类的扩展点
            onRefresh();
            
            // 10. 注册监听器：注册应用事件监听器
            registerListeners();
            
            // 11. 实例化所有单例 Bean：核心步骤！
            finishBeanFactoryInitialization(beanFactory);
            
            // 12. 完成刷新：发布事件、清理资源
            finishRefresh();
        } catch (BeansException ex) {
            // 异常处理：销毁已创建的 Bean
            destroyBeans();
            cancelRefresh(ex);
            throw ex;
        } finally {
            resetCommonCaches();
        }
    }
}
```

### 12 个步骤详解

#### 步骤 1：prepareRefresh() - 准备刷新

```java
// 源码解析
protected void prepareRefresh() {
    // 记录启动时间
    this.startupDate = System.currentTimeMillis();
    
    // 标记容器为活跃状态
    this.closed.set(false);
    this.active.set(true);
    
    // 初始化一些属性
    initPropertySources();
    
    // 验证必需的属性是否存在
    getEnvironment().validateRequiredProperties();
    
    // 初始化早期事件集合
    this.earlyApplicationEvents = new LinkedHashSet<>();
}
```

**作用**：设置启动时间、标记容器状态、验证环境配置。

#### 步骤 2：obtainFreshBeanFactory() - 获取 BeanFactory

```java
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
    // 如果是全新的容器，创建新的 BeanFactory
    refreshBeanFactory();
    
    // 返回内部的 BeanFactory
    return getBeanFactory();
}

// 实际的创建逻辑在子类中
// 例如：AbstractRefreshableApplicationContext
@Override
protected final void refreshBeanFactory() throws BeansException {
    // 如果已经有 BeanFactory，先销毁
    if (hasBeanFactory()) {
        destroyBeans();
        closeBeanFactory();
    }
    
    // 创建新的 DefaultListableBeanFactory
    DefaultListableBeanFactory beanFactory = createBeanFactory();
    beanFactory.setSerializationId(getId());
    customizeBeanFactory(beanFactory);
    
    // 加载 BeanDefinition
    loadBeanDefinitions(beanFactory);
    
    this.beanFactory = beanFactory;
}
```

**作用**：创建内部的 `DefaultListableBeanFactory`，这是真正管理 Bean 的地方。

#### 步骤 3：prepareBeanFactory() - 准备 BeanFactory

```java
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    // 设置类加载器
    beanFactory.setBeanClassLoader(getClassLoader());
    
    // 设置 SpEL 表达式解析器
    beanFactory.setExpressionResolver(new StandardBeanExpressionResolver());
    
    // 注册环境相关的 BeanPostProcessor
    beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
    
    // 忽略一些特殊的依赖接口
    beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
    beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
    beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);
    beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
    
    // 注册一些特殊的 Bean
    beanFactory.registerSingleton("environment", getEnvironment());
    beanFactory.registerSingleton("systemProperties", getEnvironment().getSystemProperties());
    beanFactory.registerSingleton("systemEnvironment", getEnvironment().getSystemEnvironment());
}
```

**作用**：配置 BeanFactory 的基础设施，注册必要的后处理器和特殊 Bean。

#### 步骤 4：postProcessBeanFactory() - 后置处理

```java
// 默认空实现，留给子类扩展
protected void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    // 子类可以重写这个方法，添加自定义的后处理逻辑
}

// 例如：WebApplicationContext 的实现
@Override
protected void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    // 添加 Web 相关的 Scope
    beanFactory.registerScope("request", new RequestScope());
    beanFactory.registerScope("session", new SessionScope());
    beanFactory.registerScope("globalSession", new SessionScope());
    
    // 添加 Web 相关的 BeanPostProcessor
    beanFactory.addBeanPostProcessor(new WebApplicationContextAwareProcessor(this));
    
    // 注册 Web 相关的 Bean
    registerWebApplicationScopes();
}
```

**作用**：给子类一个扩展点，可以添加特定环境的配置。

#### 步骤 5：invokeBeanFactoryPostProcessors() - 调用 BeanFactoryPostProcessor

```java
protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
    // 委托给 PostProcessorRegistrationDelegate 处理
    PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(
        beanFactory, getBeanFactoryPostProcessors());
}

// 核心逻辑
public static void invokeBeanFactoryPostProcessors(
    ConfigurableListableBeanFactory beanFactory,
    List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {
    
    // 1. 收集所有的 BeanFactoryPostProcessor
    Set<String> processedBeans = new HashSet<>();
    List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();
    List<BeanDefinitionRegistryPostProcessor> registryPostProcessors = new ArrayList<>();
    
    // 2. 分类处理：先处理 BeanDefinitionRegistryPostProcessor
    for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
        if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
            ((BeanDefinitionRegistryPostProcessor) postProcessor)
                .postProcessBeanDefinitionRegistry(registry);
            registryPostProcessors.add((BeanDefinitionRegistryPostProcessor) postProcessor);
        } else {
            regularPostProcessors.add(postProcessor);
        }
    }
    
    // 3. 处理配置类中的 @Bean 方法
    // 这是 @Configuration 类生效的关键！
    String[] postProcessorNames = beanFactory.getBeanNamesForType(
        BeanDefinitionRegistryPostProcessor.class, true, false);
    
    // 4. 按优先级排序执行
    // PriorityOrdered > Ordered > 普通
    invokeBeanFactoryPostProcessors(registryPostProcessors, beanFactory);
    invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
}
```

**作用**：执行所有的 `BeanFactoryPostProcessor`，这是修改 BeanDefinition 的关键时机。`@Configuration` 类的处理就在这里完成。

#### 步骤 6：registerBeanPostProcessors() - 注册 BeanPostProcessor

```java
protected void registerBeanPostProcessors(ConfigurableListableBeanFactory beanFactory) {
    PostProcessorRegistrationDelegate.registerBeanPostProcessors(
        beanFactory, this);
}

// 核心逻辑
public static void registerBeanPostProcessors(
    ConfigurableListableBeanFactory beanFactory,
    AbstractApplicationContext applicationContext) {
    
    // 1. 获取所有的 BeanPostProcessor Bean 定义
    String[] postProcessorNames = beanFactory.getBeanNamesForType(
        BeanPostProcessor.class, true, false);
    
    // 2. 按类型分类
    int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() 
        + 1 + postProcessorNames.length;
    
    List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
    List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
    List<String> orderedPostProcessorNames = new ArrayList<>();
    
    // 3. 先注册 PriorityOrdered 的
    for (String ppName : postProcessorNames) {
        if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
            BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
            priorityOrderedPostProcessors.add(pp);
        }
    }
    
    // 4. 排序并注册
    sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
    registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);
    
    // 5. 继续注册 Ordered 的和普通的
    // ... 类似逻辑
    
    // 6. 最后注册 MergedBeanDefinitionPostProcessor
    // 这个很重要，用于处理 @Autowired 等注解
    reRegisterBeanPostProcessors(beanFactory, internalPostProcessors);
    
    // 7. 重新注册所有后处理器（确保顺序正确）
    beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
}
```

**作用**：注册所有的 `BeanPostProcessor`，这些后处理器会在 Bean 创建过程中被调用。

#### 步骤 7：initMessageSource() - 初始化消息源

```java
protected void initMessageSource() {
    ConfigurableListableBeanFactory beanFactory = getBeanFactory();
    
    // 检查是否配置了 messageSource Bean
    if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
        // 使用用户配置的
        this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
    } else {
        // 使用默认的（空实现）
        this.messageSource = new StaticMessageSource();
    }
}
```

**作用**：初始化国际化消息源，支持多语言。

#### 步骤 8：initApplicationEventMulticaster() - 初始化事件广播器

```java
protected void initApplicationEventMulticaster() {
    ConfigurableListableBeanFactory beanFactory = getBeanFactory();
    
    // 检查是否配置了自定义的事件广播器
    if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
        this.applicationEventMulticaster = beanFactory.getBean(
            APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
    } else {
        // 使用默认的 SimpleApplicationEventMulticaster
        this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
        beanFactory.registerSingleton(
            APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
    }
}
```

**作用**：初始化事件广播器，支持 Spring 的事件机制。

#### 步骤 9：onRefresh() - 子类特殊初始化

```java
// 默认空实现
protected void onRefresh() throws BeansException {
    // 留给子类实现
}

// 例如：EmbeddedWebApplicationContext（Spring Boot）
@Override
protected void onRefresh() {
    super.onRefresh();
    try {
        // 创建内嵌的 Web 服务器
        createEmbeddedServletContainer();
    } catch (Throwable ex) {
        throw new ApplicationContextException("Unable to start embedded container", ex);
    }
}
```

**作用**：给子类一个扩展点，Spring Boot 在这里创建内嵌服务器。

#### 步骤 10：registerListeners() - 注册监听器

```java
protected void registerListeners() {
    // 1. 注册静态指定的监听器
    for (ApplicationListener<?> listener : getApplicationListeners()) {
        getApplicationEventMulticaster().addApplicationListener(listener);
    }
    
    // 2. 注册 Bean 定义中的监听器
    String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
    for (String listenerBeanName : listenerBeanNames) {
        getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
    }
    
    // 3. 发布早期事件（在容器刷新前发布的事件）
    Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
    this.earlyApplicationEvents = null;
    if (earlyEventsToProcess != null) {
        for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
            getApplicationEventMulticaster().multicastEvent(earlyEvent);
        }
    }
}
```

**作用**：注册所有的事件监听器，并发布早期事件。

#### 步骤 11：finishBeanFactoryInitialization() - 实例化单例 Bean

```java
protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
    // 1. 初始化类型转换服务
    if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
        beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
        beanFactory.setConversionService(
            beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
    }
    
    // 2. 注册默认的 embedded value resolver
    if (!beanFactory.hasEmbeddedValueResolver()) {
        beanFactory.addEmbeddedValueResolver(strVal -> getEnvironment().resolveRequiredPlaceholders(strVal));
    }
    
    // 3. 初始化 LoadTimeWeaverAware Bean
    String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class, false, false);
    for (String weaverAwareName : weaverAwareNames) {
        getBean(weaverAwareName);
    }
    
    // 4. 停止使用临时 ClassLoader
    beanFactory.setTempClassLoader(null);
    
    // 5. 冻结配置（不再允许修改）
    beanFactory.freezeConfiguration();
    
    // 6. 实例化所有剩余的单例 Bean - 核心步骤！
    beanFactory.preInstantiateSingletons();
}

// DefaultListableBeanFactory 中的实现
@Override
public void preInstantiateSingletons() throws BeansException {
    List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);
    
    // 遍历所有 Bean 定义
    for (String beanName : beanNames) {
        // 获取合并后的 BeanDefinition
        RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
        
        // 只处理非抽象的、单例的 Bean
        if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
            // 判断是否是 FactoryBean
            if (isFactoryBean(beanName)) {
                // FactoryBean 的特殊处理
                Object factory = getBean(FACTORY_BEAN_PREFIX + beanName);
                if (factory instanceof FactoryBean) {
                    // 根据 isLazyInit 决定是否立即创建
                    if (isEagerInit()) {
                        getBean(beanName);
                    }
                }
            } else {
                // 普通 Bean，直接创建
                getBean(beanName);
            }
        }
    }
    
    // 所有单例 Bean 创建完成后，触发 InitializingBean 的 afterSingletonsInstantiated
    for (String beanName : beanNames) {
        Object singletonInstance = getSingleton(beanName);
        if (singletonInstance instanceof SmartInitializingSingleton) {
            ((SmartInitializingSingleton) singletonInstance).afterSingletonsInstantiated();
        }
    }
}
```

**作用**：这是最核心的步骤！实例化所有非懒加载的单例 Bean。

#### 步骤 12：finishRefresh() - 完成刷新

```java
protected void finishRefresh() {
    // 1. 清除资源缓存
    clearResourceCaches();
    
    // 2. 初始化 LifecycleProcessor
    initLifecycleProcessor();
    getLifecycleProcessor().onRefresh();
    
    // 3. 发布 ContextRefreshedEvent 事件
    publishEvent(new ContextRefreshedEvent(this));
    
    // 4. 发布 ContextStartedEvent（如果配置了自动启动）
    // LiveBeansView 用于 JMX 监控
    LiveBeansView.registerApplicationContext(this);
}
```

**作用**：发布容器刷新完成事件，启动生命周期处理器。

---

## 4 BeanDefinition 注册中心

### 什么是 BeanDefinition？

BeanDefinition 就是 Bean 的"元数据"，描述了 Bean 的所有信息：

```java
// BeanDefinition 的核心属性
public interface BeanDefinition {
    // Bean 的类名
    String getBeanClassName();
    
    // Bean 的作用域（singleton、prototype 等）
    String getScope();
    
    // 是否懒加载
    boolean isLazyInit();
    
    // 是否主候选
    boolean isPrimary();
    
    // 依赖的 Bean
    String[] getDependsOn();
    
    // 是否自动装配候选
    boolean isAutowireCandidate();
    
    // 构造器参数
    ConstructorArgumentValues getConstructorArgumentValues();
    
    // 属性值
    MutablePropertyValues getPropertyValues();
    
    // 初始化方法名
    String getInitMethodName();
    
    // 销毁方法名
    String getDestroyMethodName();
}
```

### 注册中心：BeanDefinitionRegistry

```java
// BeanDefinition 的注册中心接口
public interface BeanDefinitionRegistry {
    // 注册 BeanDefinition
    void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
        throws BeanDefinitionStoreException;
    
    // 移除 BeanDefinition
    void removeBeanDefinition(String beanName) throws NoSuchBeanDefinitionException;
    
    // 获取 BeanDefinition
    BeanDefinition getBeanDefinition(String beanName) throws NoSuchBeanDefinitionException;
    
    // 判断是否包含
    boolean containsBeanDefinition(String beanName);
    
    // 获取所有 Bean 名称
    String[] getBeanDefinitionNames();
    
    // 获取 Bean 定义数量
    int getBeanDefinitionCount();
}

// DefaultListableBeanFactory 中的实现
public class DefaultListableBeanFactory extends ... implements BeanDefinitionRegistry {
    // 核心：存储 BeanDefinition 的 Map
    private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(256);
    
    // Bean 名称列表（保持顺序）
    private volatile List<String> beanDefinitionNames = new ArrayList<>(256);
    
    @Override
    public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition) {
        // 验证 BeanDefinition
        BeanDefinition existingDefinition = this.beanDefinitionMap.get(beanName);
        
        if (existingDefinition != null) {
            // 如果已存在，检查是否允许覆盖
            if (!isAllowBeanDefinitionOverriding()) {
                throw new BeanDefinitionOverrideException(beanName, ...);
            }
            // 覆盖原有的
            this.beanDefinitionMap.put(beanName, beanDefinition);
        } else {
            // 新的 BeanDefinition，直接注册
            this.beanDefinitionMap.put(beanName, beanDefinition);
            this.beanDefinitionNames.add(beanName);
        }
    }
}
```

> **生活化类比**：
> - BeanDefinition 就像"菜谱"，记录了菜的所有信息（食材、做法、口味等）
> - BeanDefinitionRegistry 就像"菜谱本"，管理所有的菜谱
> - Bean 实例就像"做好的菜"，是根据菜谱做出来的

---

## 5 基础用法：手动创建 IoC 容器

### 使用 ClassPathXmlApplicationContext

```java
// 基于 XML 配置的容器创建
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class XmlContainerDemo {
    public static void main(String[] args) {
        // 1. 创建容器，加载 XML 配置
        // 这一步会触发 refresh() 方法，执行完整的启动流程
        ApplicationContext context = new ClassPathXmlApplicationContext(
            "applicationContext.xml"  // classpath 下的配置文件
        );
        
        // 2. 从容器获取 Bean
        UserService userService = context.getBean(UserService.class);
        
        // 3. 使用 Bean
        userService.doSomething();
        
        // 4. 关闭容器（释放资源）
        ((AbstractApplicationContext) context).close();
    }
}
```

对应的 XML 配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">
    
    <!-- 定义 UserService Bean -->
    <bean id="userService" class="com.example.UserService">
        <!-- 注入依赖 -->
        <property name="userDao" ref="userDao"/>
    </bean>
    
    <!-- 定义 UserDao Bean -->
    <bean id="userDao" class="com.example.UserDao"/>
</beans>
```

### 使用 AnnotationConfigApplicationContext

```java
// 基于注解配置的容器创建
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

public class AnnotationContainerDemo {
    public static void main(String[] args) {
        // 1. 创建容器，指定配置类
        // 会自动扫描配置类及其包下的所有组件
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 2. 从容器获取 Bean
        UserService userService = context.getBean(UserService.class);
        
        // 3. 使用 Bean
        userService.doSomething();
    }
}

// 配置类
@Configuration  // 标记为配置类
@ComponentScan("com.example")  // 指定扫描包
public class AppConfig {
    // 配置类内容
}

// 组件类
@Component  // 标记为 Spring 组件
public class UserService {
    @Autowired  // 自动注入依赖
    private UserDao userDao;
    
    public void doSomething() {
        System.out.println("UserService doing something");
    }
}

@Component
public class UserDao {
    public void query() {
        System.out.println("UserDao querying");
    }
}
```

### 使用 GenericWebApplicationContext（Web 环境）

```java
// Web 环境下的容器创建
import org.springframework.web.context.support.GenericWebApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class WebContainerDemo {
    public static void main(String[] args) {
        // 1. 创建 Web 容器
        GenericWebApplicationContext context = new GenericWebApplicationContext();
        
        // 2. 设置父容器（可选）
        // context.setParent(parentContext);
        
        // 3. 注册 Bean
        context.registerBean("userService", UserService.class);
        
        // 4. 刷新容器（触发初始化）
        context.refresh();
        
        // 5. 使用 Bean
        UserService userService = context.getBean(UserService.class);
        userService.doSomething();
    }
}
```

---

## 6 对比表格

### 容器类型对比

| 容器类型 | 配置方式 | 启动时机 | 适用场景 | 特点 |
|---------|---------|---------|---------|------|
| ClassPathXmlApplicationContext | XML | 启动时加载 | 传统项目 | 配置清晰，但繁琐 |
| FileSystemXmlApplicationContext | XML | 启动时加载 | 需要绝对路径 | 支持文件系统路径 |
| AnnotationConfigApplicationContext | 注解 | 启动时扫描 | 现代项目 | 类型安全，易维护 |
| GenericApplicationContext | 编程式 | 手动注册 | 框架集成 | 灵活，可编程 |
| GenericWebApplicationContext | 编程式 | 手动注册 | Web 应用 | 支持 Web 特性 |

### BeanFactory vs ApplicationContext 详细对比

| 特性 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| 继承关系 | 基础接口 | 继承 BeanFactory + 其他接口 |
| Bean 创建时机 | 懒加载 | 预加载单例 |
| 国际化 | 不支持 | 支持 MessageSource |
| 事件机制 | 不支持 | 支持 ApplicationEvent |
| AOP 集成 | 手动 | 自动 |
| 注解支持 | 基础 | 完整（@Autowired 等） |
| 资源访问 | 基础 | 支持 ResourcePatternResolver |
| 使用复杂度 | 简单 | 功能多，稍复杂 |
| 性能 | 启动快，内存占用小 | 启动慢，内存占用大 |
| 推荐场景 | 资源受限环境 | 企业应用首选 |

---

## 7 新手常见误区

### 误区 1："BeanFactory 和 ApplicationContext 是一样的"

**错！** 虽然 ApplicationContext 继承了 BeanFactory，但它们有本质区别：

```java
// 错误理解
ApplicationContext context = new ClassPathXmlApplicationContext("config.xml");
// 以为和 BeanFactory 一样，用到时才创建 Bean

// 正确理解
// ApplicationContext 在启动时会预创建所有单例 Bean
// 这意味着：
// 1. 启动时就能发现配置错误
// 2. 运行时获取 Bean 更快（已经创建好了）
// 3. 但启动时间更长，内存占用更大
```

### 误区 2："容器启动后就不能修改了"

**不完全对！** 虽然单例 Bean 创建后不能修改，但你可以：

```java
// 可以动态注册 BeanDefinition
ConfigurableListableBeanFactory beanFactory = 
    ((ConfigurableApplicationContext) context).getBeanFactory();

// 注册新的 BeanDefinition
BeanDefinitionBuilder builder = BeanDefinitionBuilder
    .genericBeanDefinition(UserService.class)
    .addPropertyReference("userDao", "userDao");
beanFactory.registerBeanDefinition("dynamicUserService", builder.getBeanDefinition());

// 现在可以获取动态注册的 Bean
UserService dynamicService = context.getBean("dynamicUserService", UserService.class);
```

### 误区 3："所有 Bean 都在启动时创建"

**错！** 只有单例且非懒加载的 Bean 才会在启动时创建：

```java
// 启动时创建的 Bean
@Component
public class EagerBean {
    // 默认单例，启动时创建
}

// 启动时不创建的 Bean
@Component
@Lazy  // 标记为懒加载
public class LazyBean {
    // 第一次使用时才创建
}

@Component
@Scope("prototype")  // 原型作用域
public class PrototypeBean {
    // 每次获取都创建新实例
}
```

### 误区 4："refresh() 可以多次调用"

**错！** refresh() 只能调用一次：

```java
// 错误做法
AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
context.register(AppConfig.class);
context.refresh();  // 第一次调用
context.refresh();  // 第二次调用会抛出异常！

// 正确做法
// refresh() 只能调用一次，如果需要重新加载，应该创建新的容器
```

### 误区 5："BeanDefinition 注册后就不能修改"

**不完全对！** 在特定阶段可以修改：

```java
// 通过 BeanFactoryPostProcessor 可以修改 BeanDefinition
@Component
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        // 获取 BeanDefinition
        BeanDefinition bd = beanFactory.getBeanDefinition("userService");
        
        // 修改属性
        bd.setScope("prototype");  // 改为原型作用域
        bd.setLazyInit(true);      // 改为懒加载
        
        // 添加属性值
        bd.getPropertyValues().add("timeout", 3000);
    }
}
```

---

## 8 动手练习

### 练习 1：基础练习 - 手动创建 IoC 容器

创建一个简单的 IoC 容器，实现以下功能：
1. 注册 BeanDefinition
2. 根据 BeanDefinition 创建 Bean 实例
3. 支持简单的依赖注入

<details>
<summary>点击查看答案</summary>

```java
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

// 简化的 BeanDefinition
class SimpleBeanDefinition {
    private Class<?> beanClass;
    private Map<String, String> dependencies = new HashMap<>();
    
    public SimpleBeanDefinition(Class<?> beanClass) {
        this.beanClass = beanClass;
    }
    
    public Class<?> getBeanClass() {
        return beanClass;
    }
    
    public void addDependency(String fieldName, String beanName) {
        dependencies.put(fieldName, beanName);
    }
    
    public Map<String, String> getDependencies() {
        return dependencies;
    }
}

// 简化的 IoC 容器
class SimpleIoCContainer {
    // 存储 BeanDefinition
    private Map<String, SimpleBeanDefinition> beanDefinitionMap = new HashMap<>();
    // 存储 Bean 实例
    private Map<String, Object> beanInstanceMap = new HashMap<>();
    
    // 注册 BeanDefinition
    public void registerBeanDefinition(String name, SimpleBeanDefinition bd) {
        beanDefinitionMap.put(name, bd);
    }
    
    // 获取 Bean
    public Object getBean(String name) {
        // 如果已创建，直接返回
        if (beanInstanceMap.containsKey(name)) {
            return beanInstanceMap.get(name);
        }
        
        // 否则创建 Bean
        Object bean = createBean(name);
        beanInstanceMap.put(name, bean);
        return bean;
    }
    
    // 创建 Bean
    private Object createBean(String name) {
        SimpleBeanDefinition bd = beanDefinitionMap.get(name);
        if (bd == null) {
            throw new RuntimeException("Bean not found: " + name);
        }
        
        try {
            // 1. 通过反射创建实例
            Object bean = bd.getBeanClass().getDeclaredConstructor().newInstance();
            
            // 2. 注入依赖
            for (Map.Entry<String, String> dep : bd.getDependencies().entrySet()) {
                String fieldName = dep.getKey();
                String depBeanName = dep.getValue();
                
                // 获取依赖的 Bean
                Object depBean = getBean(depBeanName);
                
                // 通过反射设置字段
                Field field = bd.getBeanClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                field.set(bean, depBean);
            }
            
            return bean;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create bean: " + name, e);
        }
    }
}

// 测试类
class UserService {
    private UserDao userDao;
    
    public void doSomething() {
        System.out.println("UserService doing something with " + userDao);
    }
}

class UserDao {
    public void query() {
        System.out.println("UserDao querying");
    }
}

// 主程序
public class Exercise1 {
    public static void main(String[] args) {
        SimpleIoCContainer container = new SimpleIoCContainer();
        
        // 注册 BeanDefinition
        container.registerBeanDefinition("userDao", 
            new SimpleBeanDefinition(UserDao.class));
        
        SimpleBeanDefinition userServiceBd = new SimpleBeanDefinition(UserService.class);
        userServiceBd.addDependency("userDao", "userDao");
        container.registerBeanDefinition("userService", userServiceBd);
        
        // 获取并使用 Bean
        UserService userService = (UserService) container.getBean("userService");
        userService.doSomething();
    }
}
```

</details>

### 练习 2：进阶练习 - 实现 Bean 生命周期回调

在练习 1 的基础上，添加以下功能：
1. 支持 `InitializingBean` 接口（afterPropertiesSet 方法）
2. 支持自定义初始化方法（init-method）
3. 支持 `DisposableBean` 接口（destroy 方法）

<details>
<summary>点击查看答案</summary>

```java
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

// 生命周期接口
interface InitializingBean {
    void afterPropertiesSet() throws Exception;
}

interface DisposableBean {
    void destroy() throws Exception;
}

// 增强的 BeanDefinition
class EnhancedBeanDefinition {
    private Class<?> beanClass;
    private Map<String, String> dependencies = new HashMap<>();
    private String initMethodName;
    private String destroyMethodName;
    
    public EnhancedBeanDefinition(Class<?> beanClass) {
        this.beanClass = beanClass;
    }
    
    // getter 和 setter
    public Class<?> getBeanClass() { return beanClass; }
    public Map<String, String> getDependencies() { return dependencies; }
    public void addDependency(String fieldName, String beanName) {
        dependencies.put(fieldName, beanName);
    }
    public String getInitMethodName() { return initMethodName; }
    public void setInitMethodName(String name) { this.initMethodName = name; }
    public String getDestroyMethodName() { return destroyMethodName; }
    public void setDestroyMethodName(String name) { this.destroyMethodName = name; }
}

// 增强的 IoC 容器
class EnhancedIoCContainer {
    private Map<String, EnhancedBeanDefinition> beanDefinitionMap = new HashMap<>();
    private Map<String, Object> beanInstanceMap = new HashMap<>();
    
    public void registerBeanDefinition(String name, EnhancedBeanDefinition bd) {
        beanDefinitionMap.put(name, bd);
    }
    
    public Object getBean(String name) {
        if (beanInstanceMap.containsKey(name)) {
            return beanInstanceMap.get(name);
        }
        Object bean = createBean(name);
        beanInstanceMap.put(name, bean);
        return bean;
    }
    
    private Object createBean(String name) {
        EnhancedBeanDefinition bd = beanDefinitionMap.get(name);
        try {
            // 1. 实例化
            Object bean = bd.getBeanClass().getDeclaredConstructor().newInstance();
            
            // 2. 属性填充
            for (Map.Entry<String, String> dep : bd.getDependencies().entrySet()) {
                Field field = bd.getBeanClass().getDeclaredField(dep.getKey());
                field.setAccessible(true);
                field.set(bean, getBean(dep.getValue()));
            }
            
            // 3. 初始化
            initializeBean(bean, bd);
            
            return bean;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create bean: " + name, e);
        }
    }
    
    private void initializeBean(Object bean, EnhancedBeanDefinition bd) throws Exception {
        // 1. 调用 InitializingBean.afterPropertiesSet()
        if (bean instanceof InitializingBean) {
            ((InitializingBean) bean).afterPropertiesSet();
        }
        
        // 2. 调用自定义初始化方法
        if (bd.getInitMethodName() != null) {
            Method initMethod = bd.getBeanClass().getDeclaredMethod(bd.getInitMethodName());
            initMethod.setAccessible(true);
            initMethod.invoke(bean);
        }
    }
    
    // 关闭容器，销毁 Bean
    public void close() {
        for (Map.Entry<String, Object> entry : beanInstanceMap.entrySet()) {
            Object bean = entry.getValue();
            EnhancedBeanDefinition bd = beanDefinitionMap.get(entry.getKey());
            
            try {
                // 1. 调用 DisposableBean.destroy()
                if (bean instanceof DisposableBean) {
                    ((DisposableBean) bean).destroy();
                }
                
                // 2. 调用自定义销毁方法
                if (bd.getDestroyMethodName() != null) {
                    Method destroyMethod = bd.getBeanClass()
                        .getDeclaredMethod(bd.getDestroyMethodName());
                    destroyMethod.setAccessible(true);
                    destroyMethod.invoke(bean);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

// 测试类
class MyBean implements InitializingBean, DisposableBean {
    private String name;
    
    public MyBean() {
        System.out.println("MyBean 构造方法");
    }
    
    public void setName(String name) {
        this.name = name;
        System.out.println("MyBean setName: " + name);
    }
    
    @Override
    public void afterPropertiesSet() {
        System.out.println("MyBean afterPropertiesSet");
    }
    
    public void customInit() {
        System.out.println("MyBean customInit");
    }
    
    @Override
    public void destroy() {
        System.out.println("MyBean destroy");
    }
    
    public void customDestroy() {
        System.out.println("MyBean customDestroy");
    }
}

// 主程序
public class Exercise2 {
    public static void main(String[] args) {
        EnhancedIoCContainer container = new EnhancedIoCContainer();
        
        EnhancedBeanDefinition bd = new EnhancedBeanDefinition(MyBean.class);
        bd.setInitMethodName("customInit");
        bd.setDestroyMethodName("customDestroy");
        container.registerBeanDefinition("myBean", bd);
        
        // 获取 Bean（会触发初始化）
        MyBean bean = (MyBean) container.getBean("myBean");
        
        // 关闭容器（会触发销毁）
        container.close();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 模拟 refresh() 流程

实现一个简化的容器启动流程，包含以下步骤：
1. prepareRefresh() - 设置启动时间
2. obtainFreshBeanFactory() - 创建 BeanFactory
3. prepareBeanFactory() - 配置 BeanFactory
4. registerBeanPostProcessors() - 注册后处理器
5. finishBeanFactoryInitialization() - 实例化单例
6. finishRefresh() - 完成刷新

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

// 简化的容器实现
class MiniApplicationContext {
    private long startupDate;
    private boolean active = false;
    private Map<String, Object> beanDefinitionMap = new HashMap<>();
    private Map<String, Object> beanInstanceMap = new HashMap<>();
    private List<BeanPostProcessor> beanPostProcessors = new ArrayList<>();
    private List<String> singletonBeans = new ArrayList<>();
    
    // 模拟 refresh() 方法
    public void refresh() {
        synchronized (this) {
            // 1. 准备刷新
            prepareRefresh();
            
            // 2. 获取 BeanFactory（这里简化为直接使用 this）
            System.out.println("步骤 2: 获取 BeanFactory");
            
            // 3. 准备 BeanFactory
            prepareBeanFactory();
            
            try {
                // 4. 注册 BeanPostProcessor
                registerBeanPostProcessors();
                
                // 5. 实例化单例 Bean
                finishBeanFactoryInitialization();
                
                // 6. 完成刷新
                finishRefresh();
            } catch (Exception e) {
                destroyBeans();
                throw new RuntimeException("Container refresh failed", e);
            }
        }
    }
    
    private void prepareRefresh() {
        System.out.println("步骤 1: 准备刷新");
        this.startupDate = System.currentTimeMillis();
        this.active = true;
    }
    
    private void prepareBeanFactory() {
        System.out.println("步骤 3: 准备 BeanFactory");
        // 添加一些默认的 BeanPostProcessor
        beanPostProcessors.add(new DefaultBeanPostProcessor());
    }
    
    private void registerBeanPostProcessors() {
        System.out.println("步骤 4: 注册 BeanPostProcessor");
        // 实际实现中会扫描所有的 BeanPostProcessor Bean
        // 这里简化为直接使用
    }
    
    private void finishBeanFactoryInitialization() {
        System.out.println("步骤 5: 实例化单例 Bean");
        // 遍历所有的 BeanDefinition，创建单例 Bean
        for (String beanName : beanDefinitionMap.keySet()) {
            if (!beanInstanceMap.containsKey(beanName)) {
                Object bean = createBean(beanName);
                beanInstanceMap.put(beanName, bean);
                singletonBeans.add(beanName);
            }
        }
    }
    
    private void finishRefresh() {
        System.out.println("步骤 6: 完成刷新");
        System.out.println("容器启动成功，耗时: " + 
            (System.currentTimeMillis() - startupDate) + "ms");
    }
    
    private Object createBean(String beanName) {
        System.out.println("  创建 Bean: " + beanName);
        // 简化的 Bean 创建逻辑
        return new Object();
    }
    
    private void destroyBeans() {
        System.out.println("销毁所有 Bean");
        beanInstanceMap.clear();
    }
    
    // 注册 BeanDefinition
    public void registerBean(String name, Object beanDefinition) {
        beanDefinitionMap.put(name, beanDefinition);
    }
    
    // 获取 Bean
    public Object getBean(String name) {
        return beanInstanceMap.get(name);
    }
    
    public boolean isActive() {
        return active;
    }
}

// BeanPostProcessor 接口
interface BeanPostProcessor {
    Object postProcessBeforeInitialization(Object bean, String beanName);
    Object postProcessAfterInitialization(Object bean, String beanName);
}

// 默认的 BeanPostProcessor
class DefaultBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        return bean;
    }
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        return bean;
    }
}

// 主程序
public class Exercise3 {
    public static void main(String[] args) {
        MiniApplicationContext context = new MiniApplicationContext();
        
        // 注册一些 Bean
        context.registerBean("userService", new Object());
        context.registerBean("userDao", new Object());
        
        // 启动容器
        context.refresh();
        
        // 验证容器状态
        System.out.println("容器是否激活: " + context.isActive());
        System.out.println("userService: " + context.getBean("userService"));
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **BeanDefinition 深度解析**——也就是 Spring 如何描述和管理 Bean 的元数据。你会学到：

- BeanDefinition 的完整数据结构和设计原理
- 三种配置方式（XML、注解、JavaConfig）的解析流程
- BeanDefinitionReader 的工作原理
- BeanDefinition 的合并和继承机制

这些知识将帮助你理解 Spring 是如何从不同的配置源中收集 Bean 信息，并最终构建成完整的 Bean 定义体系的。
