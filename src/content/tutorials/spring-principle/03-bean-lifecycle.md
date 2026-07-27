---
title: "第 3 章：Bean 生命周期全解析"
description: "深入理解 Bean 从创建到销毁的完整生命周期，掌握各个扩展点和回调顺序"
---

# 第 3 章：Bean 生命周期全解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Bean 的生命周期到底有多少个阶段？每个阶段都做了什么？
- 构造器、属性填充、初始化方法、销毁方法的执行顺序是什么？
- InitializingBean、DisposableBean 这些回调接口什么时候执行？
- 如何在 Bean 创建过程中插入自定义逻辑？

这一章就是为了解答这些问题。我们会从源码层面，搞清楚 **Bean 生命周期的完整流程**，让你理解 Spring 是如何管理 Bean 的"一生"的。

学完本章，你将能够：
- 清楚说出 Bean 生命周期的每个阶段和回调顺序
- 理解 InitializingBean、DisposableBean 等接口的执行时机
- 掌握 init-method、destroy-method 的底层实现
- 能够利用生命周期扩展点实现自定义逻辑

---

## 1 为什么需要生命周期管理？

### 痛点分析

想象你是一个餐厅老板，你要管理 100 道菜的生命周期：
1. **创建阶段**：需要采购食材、清洗、切配
2. **初始化阶段**：需要预热烤箱、准备调料
3. **使用阶段**：需要监控火候、调整口味
4. **销毁阶段**：需要清理厨房、处理剩余食材

如果没有"生命周期管理系统"，你得：
- 每次做菜都手动处理这些步骤
- 容易忘记某些步骤（比如忘记预热烤箱）
- 难以统一管理所有菜的流程

```java
// 没有生命周期管理时的做法 - 手动处理一切
public class BadService {
    private Connection connection;
    
    public BadService() {
        // 问题：构造器里不应该做太多事
        // 1. 依赖可能还没注入
        // 2. 无法处理异常
        // 3. 难以测试
        try {
            connection = DriverManager.getConnection("jdbc:...");
        } catch (Exception e) {
            // 构造器里抛异常很危险！
            throw new RuntimeException(e);
        }
    }
    
    // 问题：没有统一的销毁机制
    // 连接可能永远不会关闭，造成资源泄漏
}
```

**问题很明显**：
- 构造器里做太多事会导致问题（依赖未注入、异常处理困难）
- 没有统一的初始化时机
- 没有统一的销毁机制，容易资源泄漏
- 难以在合适的时机插入自定义逻辑

### 解决方案：Bean 生命周期管理

有了 Spring 的生命周期管理，就像有了"自动化厨房系统"：
1. **实例化**：系统自动创建对象（就像准备食材）
2. **属性填充**：系统自动注入依赖（就像分配厨具）
3. **初始化**：系统在合适的时机调用初始化方法（就像预热烤箱）
4. **使用**：对象可以正常工作
5. **销毁**：系统在容器关闭时调用销毁方法（就像清理厨房）

```java
// 有生命周期管理后的做法 - 清晰明了
@Component
public class GoodService {
    private Connection connection;
    
    // 1. 构造器：只负责创建对象
    public GoodService() {
        System.out.println("构造器：创建对象");
    }
    
    // 2. 属性填充：依赖自动注入
    @Autowired
    private DataSource dataSource;
    
    // 3. 初始化：在依赖注入完成后执行
    @PostConstruct  // 或实现 InitializingBean 接口
    public void init() {
        System.out.println("初始化：建立连接");
        try {
            connection = dataSource.getConnection();
        } catch (Exception e) {
            // 初始化方法里可以安全地处理异常
            throw new RuntimeException("Failed to connect", e);
        }
    }
    
    // 4. 销毁：在容器关闭时执行
    @PreDestroy  // 或实现 DisposableBean 接口
    public void destroy() {
        System.out.println("销毁：关闭连接");
        try {
            if (connection != null) {
                connection.close();
            }
        } catch (Exception e) {
            // 销毁方法里也要处理异常
            e.printStackTrace();
        }
    }
}
```

> **一句话总结**：Bean 生命周期管理让 Spring 在合适的时机执行合适的操作，保证 Bean 的正确创建和资源释放。

---

## 2 核心原理：Bean 生命周期完整流程

### 生命周期总览

Bean 的完整生命周期可以分为 5 个阶段：

```
1. 实例化（Instantiation）
   ↓
2. 属性填充（Population of Properties）
   ↓
3. 初始化（Initialization）
   ↓
4. 使用（In Use）
   ↓
5. 销毁（Destruction）
```

### 源码解析：AbstractAutowireCapableBeanFactory.doCreateBean()

```java
// 源码位置：org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory
protected Object doCreateBean(String beanName, RootBeanDefinition mbd, Object[] args) 
    throws BeanCreationException {
    
    // ============ 阶段 1：实例化 ============
    BeanWrapper instanceWrapper = null;
    if (instanceWrapper == null) {
        // 1.1 创建 Bean 实例（通过构造器或工厂方法）
        instanceWrapper = createBeanInstance(beanName, mbd, args);
    }
    
    // 获取原始 Bean 实例
    Object bean = instanceWrapper.getWrappedInstance();
    
    // 1.2 应用 MergedBeanDefinitionPostProcessor（用于合并 BeanDefinition）
    // 这是处理 @Autowired 等注解的关键时机
    synchronized (mbd.postProcessingLock) {
        if (!mbd.postProcessed) {
            try {
                applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
            } catch (Throwable ex) {
                throw new BeanCreationException("Post-processing failed", ex);
            }
            mbd.postProcessed = true;
        }
    }
    
    // 1.3 提前暴露 Bean（用于解决循环依赖）
    boolean earlySingletonExposure = (mbd.isSingleton() && 
        this.allowCircularReferences && isSingletonCurrentlyInCreation(beanName));
    if (earlySingletonExposure) {
        // 将 Bean 放入三级缓存
        addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
    }
    
    // ============ 阶段 2：属性填充 ============
    Object exposedObject = bean;
    try {
        // 2.1 注入依赖（@Autowired、@Value 等）
        populateBean(beanName, mbd, instanceWrapper);
        
        // ============ 阶段 3：初始化 ============
        // 3.1 调用初始化方法
        exposedObject = initializeBean(beanName, exposedObject, mbd);
    } catch (Throwable ex) {
        // 处理初始化异常
        if (ex instanceof BeanCreationException) {
            throw (BeanCreationException) ex;
        }
        throw new BeanCreationException(beanName, "Initialization failed", ex);
    }
    
    // ============ 阶段 4：注册销毁回调 ============
    if (mbd.isSingleton()) {
        // 注册 DisposableBean 和 destroy-method
        registerDisposableBeanIfNecessary(beanName, bean, mbd);
    }
    
    return exposedObject;
}
```

### 阶段 1：实例化（Instantiation）

```java
// 创建 Bean 实例
protected BeanWrapper createBeanInstance(String beanName, RootBeanDefinition mbd, Object[] args) {
    // 1. 获取 Bean 的 Class 对象
    Class<?> beanClass = resolveBeanClass(mbd, beanName);
    
    // 2. 确定使用的构造器
    // 2.1 如果有 @Autowired 注解的构造器，使用它
    Constructor<?>[] ctors = determineConstructorsFromBeanPostProcessors(beanClass);
    if (ctors != null) {
        return autowireConstructor(beanName, mbd, ctors, args);
    }
    
    // 2.2 如果指定了构造器参数，使用有参构造器
    if (mbd.hasConstructorArgumentValues()) {
        ConstructorArgumentValues cargs = mbd.getConstructorArgumentValues();
        return autowireConstructor(beanName, mbd, null, null);
    }
    
    // 2.3 使用默认构造器（无参构造器）
    return instantiateBean(beanName, mbd);
}

// 使用默认构造器实例化
protected BeanWrapper instantiateBean(String beanName, RootBeanDefinition mbd) {
    try {
        Object beanInstance;
        // 如果有工厂方法，使用工厂方法
        if (mbd.getFactoryMethodName() != null) {
            beanInstance = instantiateUsingFactoryMethod(beanName, mbd, null);
        } else {
            // 否则使用构造器
            Class<?> beanClass = resolveBeanClass(mbd, beanName);
            beanInstance = getInstantiationStrategy().instantiate(mbd, beanName, this);
        }
        return new BeanWrapperImpl(beanInstance);
    } catch (Exception ex) {
        throw new BeanCreationException(mbd.getResourceDescription(), beanName, 
            "Instantiation failed", ex);
    }
}

// SimpleInstantiationStrategy 的 instantiate 方法
public Object instantiate(RootBeanDefinition bd, String beanName, BeanFactory owner) {
    // 如果有方法覆盖（lookup-method 等）
    if (bd.getMethodOverrides().hasOverrides()) {
        return instantiateWithMethodInjection(bd, beanName, owner);
    } else {
        // 使用反射创建实例
        return BeanUtils.instantiateClass(bd.getBeanClass());
    }
}
```

> **生活化类比**：
> 实例化就像"盖房子"：
> - 准备建筑材料（Class 对象）
> - 选择建造方式（构造器或工厂方法）
> - 搭建基本框架（创建对象实例）

### 阶段 2：属性填充（Population of Properties）

```java
// 填充 Bean 的属性（依赖注入）
protected void populateBean(String beanName, RootBeanDefinition mbd, BeanWrapper bw) {
    // 1. 调用 InstantiationAwareBeanPostProcessor.postProcessAfterInstantiation()
    if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
        for (InstantiationAwareBeanPostProcessor bp : getBeanPostProcessors()) {
            if (!bp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName)) {
                return;
            }
        }
    }
    
    // 2. 处理 XML 中的 <property> 元素
    PropertyValues pvs = mbd.getPropertyValues();
    
    // 3. 处理注解注入（@Autowired、@Value 等）
    if (hasDestructionAwareBeanPostProcessors()) {
        // 调用 BeanPostProcessor 处理属性
        for (BeanPostProcessor bp : getBeanPostProcessors()) {
            if (bp instanceof InstantiationAwareBeanPostProcessor) {
                PropertyValues pvsToUse = ((InstantiationAwareBeanPostProcessor) bp)
                    .postProcessPropertyValues(pvs, null, bw.getWrappedInstance(), beanName);
                if (pvsToUse != null) {
                    pvs = pvsToUse;
                }
            }
        }
    }
    
    // 4. 应用属性值
    if (pvs != null) {
        applyPropertyValues(beanName, mbd, bw, pvs);
    }
}

// 应用属性值（依赖注入的核心）
protected void applyPropertyValues(String beanName, RootBeanDefinition mbd, 
    BeanWrapper bw, PropertyValues pvs) {
    
    // 1. 获取属性值列表
    MutablePropertyValues mpvs = (pvs instanceof MutablePropertyValues) ? 
        (MutablePropertyValues) pvs : new MutablePropertyValues(pvs);
    
    // 2. 类型转换
    TypeConverter converter = getCustomTypeConverter();
    if (converter == null) {
        converter = bw;
    }
    
    // 3. 解析属性值
    BeanDefinitionValueResolver valueResolver = 
        new BeanDefinitionValueResolver(this, beanName, mbd, converter);
    
    // 4. 遍历每个属性
    for (PropertyValue pv : mpvs.getPropertyValues()) {
        Object value = valueResolver.resolveValueIfNecessary(pv, pv.getValue());
        
        // 5. 设置属性（通过 setter 或反射）
        try {
            bw.setPropertyValue(pv.getName(), value);
        } catch (BeansException ex) {
            throw new BeanCreationException(beanName, "Error setting property", ex);
        }
    }
}
```

> **生活化类比**：
> 属性填充就像"装修房子"：
> - 安装门窗（注入简单属性）
> - 连接水电（注入依赖对象）
> - 配置家具（设置集合属性）

### 阶段 3：初始化（Initialization）

```java
// 初始化 Bean
protected Object initializeBean(String beanName, Object bean, RootBeanDefinition mbd) {
    // 1. 调用 Aware 接口回调
    invokeAwareMethods(beanName, bean);
    
    Object wrappedBean = bean;
    
    // 2. 调用 BeanPostProcessor 的 postProcessBeforeInitialization()
    if (mbd == null || !mbd.isSynthetic()) {
        wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
    }
    
    // 3. 调用初始化方法
    try {
        invokeInitMethods(beanName, wrappedBean, mbd);
    } catch (Throwable ex) {
        throw new BeanCreationException(beanName, "Invocation of init method failed", ex);
    }
    
    // 4. 调用 BeanPostProcessor 的 postProcessAfterInitialization()
    if (mbd == null || !mbd.isSynthetic()) {
        wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
    }
    
    return wrappedBean;
}

// 调用 Aware 接口回调
private void invokeAwareMethods(String beanName, Object bean) {
    if (bean instanceof Aware) {
        if (bean instanceof BeanNameAware) {
            ((BeanNameAware) bean).setBeanName(beanName);
        }
        if (bean instanceof BeanClassLoaderAware) {
            ((BeanClassLoaderAware) bean).setBeanClassLoader(getClassLoader());
        }
        if (bean instanceof BeanFactoryAware) {
            ((BeanFactoryAware) bean).setBeanFactory(this);
        }
    }
}

// 调用初始化方法
protected void invokeInitMethods(String beanName, Object bean, RootBeanDefinition mbd) 
    throws Throwable {
    
    // 1. 调用 InitializingBean.afterPropertiesSet()
    boolean isInitializingBean = (bean instanceof InitializingBean);
    if (isInitializingBean) {
        ((InitializingBean) bean).afterPropertiesSet();
    }
    
    // 2. 调用自定义初始化方法（init-method）
    String initMethodName = (mbd != null ? mbd.getInitMethodName() : null);
    if (initMethodName != null) {
        // 确保不是 InitializingBean 的 afterPropertiesSet
        boolean isInitMethod = !isInitializingBean || 
            !"afterPropertiesSet".equals(initMethodName);
        
        if (isInitMethod) {
            // 通过反射调用初始化方法
            Method initMethod = BeanUtils.findMethod(bean.getClass(), initMethodName);
            if (initMethod == null) {
                // 查找无参方法
                initMethod = BeanUtils.findDeclaredMethod(bean.getClass(), initMethodName);
            }
            if (initMethod != null) {
                ReflectionUtils.makeAccessible(initMethod);
                initMethod.invoke(bean);
            } else {
                // 如果找不到方法，且强制要求，则抛出异常
                if (mbd.isEnforceInitMethod()) {
                    throw new BeanDefinitionValidationException(
                        "Could not find init method named '" + initMethodName + "'");
                }
            }
        }
    }
}
```

> **生活化类比**：
> 初始化就像"入住前的准备"：
> - 检查房屋设施（Aware 接口回调）
> - 进行基础装修（BeanPostProcessor 前置处理）
> - 完成最后准备（InitializingBean + init-method）
> - 最终验收（BeanPostProcessor 后置处理）

### 阶段 4：使用（In Use）

Bean 初始化完成后，就可以正常使用了。这个阶段是 Bean 的"工作阶段"，可以执行业务逻辑。

```java
// 使用 Bean
public class BeanUsageDemo {
    public static void main(String[] args) {
        ApplicationContext context = new ClassPathXmlApplicationContext("application.xml");
        
        // 获取 Bean（此时 Bean 已经完全初始化）
        UserService userService = context.getBean(UserService.class);
        
        // 使用 Bean
        userService.doSomething();  // 执行业务逻辑
        
        // Bean 在这个阶段是"活跃"的
        // 可以处理请求、执行业务、返回结果
    }
}
```

### 阶段 5：销毁（Destruction）

```java
// 注册销毁回调
protected void registerDisposableBeanIfNecessary(String beanName, Object bean, RootBeanDefinition mbd) {
    // 只处理单例 Bean
    if (!mbd.isSingleton()) {
        return;
    }
    
    // 检查是否需要销毁
    boolean hasDestroyMethod = (bean instanceof DisposableBean || 
        mbd.getDestroyMethodName() != null);
    
    if (hasDestroyMethod) {
        // 注册到 DisposableBeanAdapter
        registerDisposableBean(beanName, new DisposableBeanAdapter(bean, beanName, mbd));
    }
}

// DisposableBeanAdapter 的销毁逻辑
public void destroy() {
    // 1. 调用 DisposableBean.destroy()
    if (this.bean instanceof DisposableBean) {
        ((DisposableBean) this.bean).destroy();
    }
    
    // 2. 调用自定义销毁方法（destroy-method）
    if (this.destroyMethodName != null) {
        Method destroyMethod = findDestroyMethod();
        if (destroyMethod != null) {
            ReflectionUtils.makeAccessible(destroyMethod);
            destroyMethod.invoke(this.bean);
        }
    }
}

// 容器关闭时调用
public void close() {
    // 销毁所有单例 Bean
    destroySingletons();
}

protected void destroySingletons() {
    // 获取所有单例 Bean 名称
    String[] singletonNames = getSingletonNames();
    
    // 逆序销毁（后创建的先销毁）
    for (int i = singletonNames.length - 1; i >= 0; i--) {
        Object singletonInstance = getSingleton(singletonNames[i]);
        if (singletonInstance instanceof DisposableBean) {
            try {
                ((DisposableBean) singletonInstance).destroy();
            } catch (Exception ex) {
                // 忽略销毁异常
            }
        }
    }
    
    // 清空缓存
    destroySingleton(singletonNames);
}
```

> **生活化类比**：
> 销毁就像"退房时的清理"：
> - 清理个人物品（DisposableBean.destroy()）
> - 恢复原状（destroy-method）
> - 交还钥匙（释放资源）

---

## 3 生命周期扩展点详解

### 3.3.1 Aware 接口回调

Spring 提供了一系列 Aware 接口，让 Bean 可以感知容器的某些能力：

```java
// 常见的 Aware 接口
public interface BeanNameAware {
    void setBeanName(String name);
}

public interface BeanClassLoaderAware {
    void setBeanClassLoader(ClassLoader classLoader);
}

public interface BeanFactoryAware {
    void setBeanFactory(BeanFactory beanFactory);
}

public interface ApplicationContextAware {
    void setApplicationContext(ApplicationContext applicationContext);
}

public interface EnvironmentAware {
    void setEnvironment(Environment environment);
}

public interface ApplicationEventPublisherAware {
    void setApplicationEventPublisher(ApplicationEventPublisher publisher);
}

public interface ResourceLoaderAware {
    void setResourceLoader(ResourceLoader resourceLoader);
}

public interface MessageSourceAware {
    void setMessageSource(MessageSource messageSource);
}

// 使用示例
@Component
public class MyService implements BeanNameAware, ApplicationContextAware {
    
    private String beanName;
    private ApplicationContext context;
    
    // 1. BeanNameAware：获取 Bean 的名称
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("Bean 名称: " + name);
    }
    
    // 2. ApplicationContextAware：获取 ApplicationContext
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.context = applicationContext;
        System.out.println("获取到 ApplicationContext");
    }
    
    public void doSomething() {
        // 可以使用注入的 ApplicationContext
        MyService otherService = context.getBean("otherService", MyService.class);
    }
}
```

**执行时机**：Aware 接口回调发生在 BeanPostProcessor 之前，是最早的扩展点。

### 3.3.2 BeanPostProcessor 扩展点

```java
// BeanPostProcessor 接口
public interface BeanPostProcessor {
    // 初始化前调用
    Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException;
    
    // 初始化后调用
    Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException;
}

// 使用示例：日志后处理器
@Component
public class LoggingBeanPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("初始化前: " + beanName + " -> " + bean.getClass().getSimpleName());
        return bean;  // 可以返回代理对象替换原 Bean
    }
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        System.out.println("初始化后: " + beanName + " -> " + bean.getClass().getSimpleName());
        return bean;
    }
}
```

### 3.3.3 InitializingBean 和 DisposableBean

```java
// InitializingBean：初始化回调
public interface InitializingBean {
    void afterPropertiesSet() throws Exception;
}

// DisposableBean：销毁回调
public interface DisposableBean {
    void destroy() throws Exception;
}

// 使用示例
@Component
public class ConnectionPool implements InitializingBean, DisposableBean {
    
    private List<Connection> pool;
    
    // 1. 初始化：在属性填充后执行
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("初始化连接池");
        pool = new ArrayList<>();
        // 创建连接
        for (int i = 0; i < 10; i++) {
            pool.add(createConnection());
        }
    }
    
    // 2. 销毁：在容器关闭时执行
    @Override
    public void destroy() throws Exception {
        System.out.println("关闭连接池");
        for (Connection conn : pool) {
            conn.close();
        }
        pool.clear();
    }
    
    private Connection createConnection() {
        return DriverManager.getConnection("jdbc:...");
    }
}
```

### 3.3.4 @PostConstruct 和 @PreDestroy

```java
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class CacheManager {
    
    private Map<String, Object> cache;
    
    // 1. 初始化：等价于 InitializingBean.afterPropertiesSet()
    @PostConstruct
    public void init() {
        System.out.println("初始化缓存");
        cache = new ConcurrentHashMap<>();
        // 预加载数据
        cache.put("key1", "value1");
    }
    
    // 2. 销毁：等价于 DisposableBean.destroy()
    @PreDestroy
    public void cleanup() {
        System.out.println("清理缓存");
        cache.clear();
    }
}
```

**底层实现**：`@PostConstruct` 和 `@PreDestroy` 是通过 `CommonAnnotationBeanPostProcessor` 处理的。

### 3.3.5 init-method 和 destroy-method

```java
// XML 配置
<bean id="myService" class="com.example.MyService" 
      init-method="customInit" 
      destroy-method="customDestroy"/>

// Java 类
public class MyService {
    
    // 自定义初始化方法
    public void customInit() {
        System.out.println("自定义初始化");
    }
    
    // 自定义销毁方法
    public void customDestroy() {
        System.out.println("自定义销毁");
    }
}

// JavaConfig 配置
@Bean(initMethod = "customInit", destroyMethod = "customDestroy")
public MyService myService() {
    return new MyService();
}
```

---

## 4 初始化回调的执行顺序

### 完整顺序

```
1. 构造器执行
   ↓
2. 属性填充（依赖注入）
   ↓
3. Aware 接口回调（BeanNameAware、BeanFactoryAware 等）
   ↓
4. BeanPostProcessor.postProcessBeforeInitialization()
   ↓
5. InitializingBean.afterPropertiesSet()
   ↓
6. @PostConstruct 方法
   ↓
7. init-method 方法
   ↓
8. BeanPostProcessor.postProcessAfterInitialization()
   ↓
9. Bean 可以使用了
```

### 源码验证

```java
// 初始化方法的执行顺序
protected Object initializeBean(String beanName, Object bean, RootBeanDefinition mbd) {
    // 1. Aware 接口回调
    invokeAwareMethods(beanName, bean);
    
    Object wrappedBean = bean;
    
    // 2. BeanPostProcessor 前置处理
    if (mbd == null || !mbd.isSynthetic()) {
        wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
    }
    
    // 3. 初始化方法（按顺序执行）
    try {
        invokeInitMethods(beanName, wrappedBean, mbd);
    } catch (Throwable ex) {
        throw new BeanCreationException(beanName, "Invocation of init method failed", ex);
    }
    
    // 4. BeanPostProcessor 后置处理
    if (mbd == null || !mbd.isSynthetic()) {
        wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
    }
    
    return wrappedBean;
}

// invokeInitMethods 的内部逻辑
protected void invokeInitMethods(String beanName, Object bean, RootBeanDefinition mbd) {
    // 1. InitializingBean.afterPropertiesSet()
    boolean isInitializingBean = (bean instanceof InitializingBean);
    if (isInitializingBean) {
        ((InitializingBean) bean).afterPropertiesSet();
    }
    
    // 2. @PostConstruct（由 CommonAnnotationBeanPostProcessor 处理）
    // 实际上在 BeanPostProcessor 中已经处理了
    
    // 3. init-method
    String initMethodName = (mbd != null ? mbd.getInitMethodName() : null);
    if (initMethodName != null) {
        // 调用自定义初始化方法
        Method initMethod = BeanUtils.findMethod(bean.getClass(), initMethodName);
        if (initMethod != null) {
            ReflectionUtils.makeAccessible(initMethod);
            initMethod.invoke(bean);
        }
    }
}
```

### 销毁回调的执行顺序

```
1. @PreDestroy 方法
   ↓
2. DisposableBean.destroy()
   ↓
3. destroy-method 方法
```

---

## 5 基础用法：生命周期实践

### 完整的生命周期示例

```java
import org.springframework.beans.factory.*;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

// 配置类
@Configuration
public class AppConfig {
    
    @Bean(initMethod = "xmlInit", destroyMethod = "xmlDestroy")
    public LifecycleBean lifecycleBean() {
        return new LifecycleBean();
    }
}

// 完整的生命周期 Bean
@Component
public class LifecycleBean implements 
    BeanNameAware, 
    BeanFactoryAware, 
    ApplicationContextAware,
    InitializingBean, 
    DisposableBean {
    
    private String beanName;
    private BeanFactory beanFactory;
    private ApplicationContext context;
    
    // 1. 构造器
    public LifecycleBean() {
        System.out.println("1. 构造器执行");
    }
    
    // 2. BeanNameAware
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("2. BeanNameAware.setBeanName(): " + name);
    }
    
    // 3. BeanFactoryAware
    @Override
    public void setBeanFactory(BeanFactory beanFactory) {
        this.beanFactory = beanFactory;
        System.out.println("3. BeanFactoryAware.setBeanFactory()");
    }
    
    // 4. ApplicationContextAware
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.context = applicationContext;
        System.out.println("4. ApplicationContextAware.setApplicationContext()");
    }
    
    // 5. BeanPostProcessor 前置处理（由其他类实现）
    // 这里不实现，由外部 BeanPostProcessor 处理
    
    // 6. InitializingBean
    @Override
    public void afterPropertiesSet() {
        System.out.println("6. InitializingBean.afterPropertiesSet()");
    }
    
    // 7. @PostConstruct
    @PostConstruct
    public void postConstruct() {
        System.out.println("7. @PostConstruct");
    }
    
    // 8. init-method
    public void xmlInit() {
        System.out.println("8. init-method (xmlInit)");
    }
    
    // 9. BeanPostProcessor 后置处理（由其他类实现）
    
    // 10. @PreDestroy
    @PreDestroy
    public void preDestroy() {
        System.out.println("10. @PreDestroy");
    }
    
    // 11. DisposableBean
    @Override
    public void destroy() {
        System.out.println("11. DisposableBean.destroy()");
    }
    
    // 12. destroy-method
    public void xmlDestroy() {
        System.out.println("12. destroy-method (xmlDestroy)");
    }
}

// BeanPostProcessor
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if (bean instanceof LifecycleBean) {
            System.out.println("5. BeanPostProcessor.postProcessBeforeInitialization()");
        }
        return bean;
    }
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof LifecycleBean) {
            System.out.println("9. BeanPostProcessor.postProcessAfterInitialization()");
        }
        return bean;
    }
}

// 主程序
public class LifecycleDemo {
    public static void main(String[] args) {
        // 创建容器
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 获取 Bean
        LifecycleBean bean = context.getBean(LifecycleBean.class);
        
        // 关闭容器
        context.close();
    }
}
```

输出结果：

```
1. 构造器执行
2. BeanNameAware.setBeanName(): lifecycleBean
3. BeanFactoryAware.setBeanFactory()
4. ApplicationContextAware.setApplicationContext()
5. BeanPostProcessor.postProcessBeforeInitialization()
6. InitializingBean.afterPropertiesSet()
7. @PostConstruct
8. init-method (xmlInit)
9. BeanPostProcessor.postProcessAfterInitialization()
10. @PreDestroy
11. DisposableBean.destroy()
12. destroy-method (xmlDestroy)
```

### 资源管理最佳实践

```java
// ✅ 正确：使用 @PostConstruct 和 @PreDestroy
@Component
public class DatabaseService {
    
    private Connection connection;
    
    @Autowired
    private DataSource dataSource;
    
    @PostConstruct
    public void init() {
        try {
            connection = dataSource.getConnection();
            System.out.println("数据库连接已建立");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect", e);
        }
    }
    
    @PreDestroy
    public void cleanup() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                System.out.println("数据库连接已关闭");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}

// ❌ 错误：在构造器中建立连接
@Component
public class BadDatabaseService {
    
    private Connection connection;
    
    public BadDatabaseService() {
        // 问题：此时 DataSource 还没注入
        // 问题：构造器里抛异常很危险
        try {
            connection = DriverManager.getConnection("jdbc:...");
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
```

---

## 6 对比表格

### 初始化方式对比

| 方式 | 执行时机 | 特点 | 推荐场景 |
|------|---------|------|---------|
| 构造器 | 最早 | 无法使用注入的依赖 | 简单初始化 |
| @PostConstruct | 属性填充后 | JSR-250 标准，推荐 | 通用初始化 |
| InitializingBean | 属性填充后 | Spring 接口，耦合 Spring | Spring 项目 |
| init-method | 最后 | XML 配置，灵活 | 第三方 Bean |

### 销毁方式对比

| 方式 | 执行时机 | 特点 | 推荐场景 |
|------|---------|------|---------|
| @PreDestroy | 最早 | JSR-250 标准，推荐 | 通用销毁 |
| DisposableBean | 中间 | Spring 接口，耦合 Spring | Spring 项目 |
| destroy-method | 最后 | XML 配置，灵活 | 第三方 Bean |

### Aware 接口对比

| 接口 | 回调方法 | 注入内容 | 使用场景 |
|------|---------|---------|---------|
| BeanNameAware | setBeanName | Bean 名称 | 日志、调试 |
| BeanClassLoaderAware | setBeanClassLoader | 类加载器 | 动态加载类 |
| BeanFactoryAware | setBeanFactory | BeanFactory | 底层操作 |
| ApplicationContextAware | setApplicationContext | ApplicationContext | 获取其他 Bean |
| EnvironmentAware | setEnvironment | Environment | 读取配置 |
| ApplicationEventPublisherAware | setApplicationEventPublisher | 事件发布器 | 发布事件 |
| ResourceLoaderAware | setResourceLoader | 资源加载器 | 加载资源 |
| MessageSourceAware | setMessageSource | 消息源 | 国际化 |

---

## 7 新手常见误区

### 误区 1："构造器里可以使用注入的依赖"

**错！** 构造器执行时，依赖还没注入：

```java
// ❌ 错误
@Component
public class MyService {
    @Autowired
    private UserDao userDao;
    
    public MyService() {
        // 此时 userDao 还是 null！
        userDao.query();  // NullPointerException
    }
}

// ✅ 正确
@Component
public class MyService {
    @Autowired
    private UserDao userDao;
    
    @PostConstruct
    public void init() {
        // 此时 userDao 已经注入
        userDao.query();
    }
}
```

### 误区 2："@PostConstruct 和 InitializingBean 是一样的"

**不完全对！** 虽然执行时机相同，但有区别：

```java
// @PostConstruct 是 JSR-250 标准
import javax.annotation.PostConstruct;

@Component
public class Service1 {
    @PostConstruct
    public void init() {
        // 不依赖 Spring 接口
    }
}

// InitializingBean 是 Spring 接口
import org.springframework.beans.factory.InitializingBean;

@Component
public class Service2 implements InitializingBean {
    @Override
    public void afterPropertiesSet() {
        // 耦合 Spring
    }
}

// 如果同时使用，执行顺序：
// 1. @PostConstruct（由 CommonAnnotationBeanPostProcessor 处理）
// 2. InitializingBean.afterPropertiesSet()
```

### 误区 3："destroy-method 在每次使用后都会调用"

**错！** destroy-method 只在容器关闭时调用：

```java
// ❌ 错误理解
@Component
public class MyService {
    public void doSomething() {
        System.out.println("执行业务");
    }
    
    public void destroy() {
        System.out.println("销毁");  // 不是每次使用后都调用！
    }
}

// ✅ 正确理解
// destroy-method 只在容器关闭时调用一次
public class Demo {
    public static void main(String[] args) {
        ApplicationContext context = new ClassPathXmlApplicationContext("config.xml");
        MyService service = context.getBean(MyService.class);
        
        service.doSomething();  // 执行业务
        service.doSomething();  // 执行业务
        
        // 只有这里才会调用 destroy
        ((AbstractApplicationContext) context).close();
    }
}
```

### 误区 4："原型 Bean 也会调用销毁方法"

**错！** 原型 Bean 不会调用销毁方法：

```java
// ❌ 错误：原型 Bean 的销毁方法不会被调用
@Component
@Scope("prototype")
public class PrototypeBean implements DisposableBean {
    
    @Override
    public void destroy() {
        // 这个方法永远不会被调用！
        System.out.println("销毁");
    }
}

// ✅ 正确：原型 Bean 需要手动管理
public class Demo {
    public static void main(String[] args) {
        ApplicationContext context = new ClassPathXmlApplicationContext("config.xml");
        
        PrototypeBean bean1 = context.getBean(PrototypeBean.class);
        PrototypeBean bean2 = context.getBean(PrototypeBean.class);
        
        // 需要手动调用销毁
        if (bean1 instanceof DisposableBean) {
            ((DisposableBean) bean1).destroy();
        }
        if (bean2 instanceof DisposableBean) {
            ((DisposableBean) bean2).destroy();
        }
    }
}
```

### 误区 5："Aware 接口可以在任何时候使用"

**不完全对！** Aware 回调有特定的执行时机：

```java
// ❌ 错误：在构造器中使用 Aware
@Component
public class MyService implements ApplicationContextAware {
    
    private ApplicationContext context;
    
    public MyService() {
        // 此时 context 还是 null！
        context.getBean("other");  // NullPointerException
    }
    
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.context = applicationContext;
    }
}

// ✅ 正确：在初始化方法中使用
@Component
public class MyService implements ApplicationContextAware {
    
    private ApplicationContext context;
    
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.context = applicationContext;
    }
    
    @PostConstruct
    public void init() {
        // 此时 context 已经注入
        Object other = context.getBean("other");
    }
}
```

---

## 8 动手练习

### 练习 1：基础练习 - 实现生命周期回调

创建一个 `FileService` 类，实现以下功能：
1. 在 `@PostConstruct` 中打开文件
2. 在 `@PreDestroy` 中关闭文件
3. 验证生命周期回调的执行时机

<details>
<summary>点击查看答案</summary>

```java
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

@Configuration
public class AppConfig {
    // 配置类
}

@Component
public class FileService {
    
    private File file;
    private FileWriter writer;
    
    // 1. 构造器
    public FileService() {
        System.out.println("FileService 构造器");
    }
    
    // 2. 初始化：打开文件
    @PostConstruct
    public void init() {
        System.out.println("初始化：打开文件");
        try {
            file = new File("test.txt");
            writer = new FileWriter(file, true);
            writer.write("FileService 已初始化\n");
            writer.flush();
            System.out.println("文件已打开: " + file.getAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Failed to open file", e);
        }
    }
    
    // 3. 业务方法：写入文件
    public void write(String content) {
        try {
            writer.write(content + "\n");
            writer.flush();
            System.out.println("写入: " + content);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write", e);
        }
    }
    
    // 4. 销毁：关闭文件
    @PreDestroy
    public void destroy() {
        System.out.println("销毁：关闭文件");
        try {
            if (writer != null) {
                writer.write("FileService 已销毁\n");
                writer.close();
                System.out.println("文件已关闭");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

public class Exercise1 {
    public static void main(String[] args) {
        // 创建容器
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 获取 Bean
        FileService fileService = context.getBean(FileService.class);
        
        // 使用 Bean
        fileService.write("Hello, World!");
        fileService.write("Spring Lifecycle");
        
        // 关闭容器（触发销毁）
        context.close();
    }
}
```

</details>

### 练习 2：进阶练习 - 实现 Aware 接口

创建一个 `AwareService` 类，实现以下 Aware 接口：
1. `BeanNameAware` - 获取 Bean 名称
2. `ApplicationContextAware` - 获取 ApplicationContext
3. 在初始化方法中使用这些注入的内容

<details>
<summary>点击查看答案</summary>

```java
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Configuration
public class AppConfig {
    
    @Bean
    public String appName() {
        return "My Application";
    }
}

@Component
public class AwareService implements BeanNameAware, ApplicationContextAware {
    
    private String beanName;
    private ApplicationContext context;
    
    // 1. BeanNameAware
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("BeanNameAware: " + name);
    }
    
    // 2. ApplicationContextAware
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.context = applicationContext;
        System.out.println("ApplicationContextAware: 已注入");
    }
    
    // 3. 初始化方法：使用注入的内容
    @PostConstruct
    public void init() {
        System.out.println("初始化方法执行");
        
        // 使用 Bean 名称
        System.out.println("我的 Bean 名称: " + beanName);
        
        // 使用 ApplicationContext 获取其他 Bean
        String appName = context.getBean("appName", String.class);
        System.out.println("应用名称: " + appName);
        
        // 获取所有 Bean 名称
        String[] beanNames = context.getBeanDefinitionNames();
        System.out.println("容器中 Bean 数量: " + beanNames.length);
    }
    
    public void doSomething() {
        System.out.println("AwareService 正在工作");
    }
}

public class Exercise2 {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        AwareService awareService = context.getBean(AwareService.class);
        awareService.doSomething();
        
        context.close();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 自定义 BeanPostProcessor

实现一个 `TimingBeanPostProcessor`，记录每个 Bean 的初始化耗时：
1. 在 `postProcessBeforeInitialization` 中记录开始时间
2. 在 `postProcessAfterInitialization` 中计算并打印耗时

<details>
<summary>点击查看答案</summary>

```java
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class AppConfig {
    // 配置类
}

@Component
public class TimingBeanPostProcessor implements BeanPostProcessor {
    
    // 存储 Bean 的初始化开始时间
    private final Map<String, Long> startTimeMap = new ConcurrentHashMap<>();
    
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        // 记录开始时间
        startTimeMap.put(beanName, System.currentTimeMillis());
        return bean;
    }
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        // 计算耗时
        Long startTime = startTimeMap.remove(beanName);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            System.out.printf("Bean [%s] 初始化耗时: %d ms%n", beanName, duration);
        }
        return bean;
    }
}

// 模拟慢初始化的 Bean
@Component
public class SlowService {
    
    @javax.annotation.PostConstruct
    public void init() {
        try {
            System.out.println("SlowService 开始初始化...");
            Thread.sleep(100);  // 模拟耗时操作
            System.out.println("SlowService 初始化完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

@Component
public class FastService {
    
    @javax.annotation.PostConstruct
    public void init() {
        System.out.println("FastService 初始化");
    }
}

public class Exercise3 {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 获取 Bean（会触发初始化）
        SlowService slowService = context.getBean(SlowService.class);
        FastService fastService = context.getBean(FastService.class);
        
        context.close();
    }
}
```

输出示例：

```
SlowService 开始初始化...
SlowService 初始化完成
Bean [slowService] 初始化耗时: 105 ms
FastService 初始化
Bean [fastService] 初始化耗时: 2 ms
```

</details>

---

## 下一章预告

下一章我们会学习 **BeanPostProcessor 原理**——也就是 Spring 中最强大的扩展点之一。你会学到：

- BeanPostProcessor 的执行时机和底层原理
- 如何通过 BeanPostProcessor 实现 AOP、注解处理等功能
- 常见的内置 BeanPostProcessor（如 AutowiredAnnotationBeanPostProcessor）
- 如何自定义 BeanPostProcessor 实现高级功能

这些知识将帮助你理解 Spring 的很多高级特性是如何基于 BeanPostProcessor 实现的。
