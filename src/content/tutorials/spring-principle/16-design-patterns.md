---
title: "第 16 章：Spring 常用设计模式"
description: "深入理解 Spring 框架中运用的设计模式，掌握工厂、单例、代理、模板方法、观察者、策略、适配器模式"
---

# 第 16 章：Spring 常用设计模式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 为什么被称为"工厂模式"的经典实现？
- BeanFactory 和 ApplicationContext 有什么区别？
- Spring 是如何保证 Bean 单例的？和传统的单例模式有什么不同？
- AOP 底层用了什么设计模式？
- JdbcTemplate 为什么要用模板方法模式？
- Spring 事件机制和观察者模式有什么关系？
- Resource 接口为什么是策略模式？
- HandlerAdapter 是如何体现适配器模式的？

这一章就是为了解答这些问题。我们会通过源码分析和实际案例，深入理解 Spring 是如何巧妙运用这些设计模式的。

---

## 16.1 为什么需要学习设计模式？

### 痛点分析

很多开发者在使用 Spring 时，只是停留在"会用"的层面：
- 知道 @Autowired 可以注入依赖，但不知道背后的工厂模式
- 知道 @Transactional 可以管理事务，但不知道背后的代理模式
- 知道 ApplicationEventPublisher 可以发布事件，但不知道背后的观察者模式

**问题来了**：
- 遇到问题时，不知道如何排查
- 想扩展功能时，不知道从哪里入手
- 面试时被问到设计模式，答不上来
- 代码质量难以提升

### 解决方案

学习 Spring 中的设计模式，可以：
- 深入理解 Spring 的设计思想
- 提升代码设计能力
- 更好地进行问题排查和功能扩展
- 在面试中脱颖而出

> **一句话总结**：设计模式是 Spring 的灵魂，掌握它们能让你从"会用"升级到"懂原理"。

---

## 16.2 核心原理讲解

### 16.2.1 工厂模式（Factory Pattern）

#### 概念解释

工厂模式是一种创建型模式，它提供一个创建对象的接口，但不暴露创建逻辑。

打个比方：

> 想象你去餐厅吃饭，你不需要知道厨师怎么做菜，只需要告诉服务员你要什么菜，服务员（工厂）会把菜做好端给你。

#### Spring 中的工厂模式

Spring 的核心就是工厂模式，有两个主要的工厂：

1. **BeanFactory**：Spring 的基础工厂接口
2. **ApplicationContext**：BeanFactory 的增强版，提供了更多企业级功能

#### 源码分析

```java
// BeanFactory 接口定义
public interface BeanFactory {
    // 根据名称获取 Bean
    Object getBean(String name) throws BeansException;
    
    // 根据名称和类型获取 Bean
    <T> T getBean(String name, Class<T> requiredType) throws BeansException;
    
    // 根据类型获取 Bean
    <T> T getBean(Class<T> requiredType) throws BeansException;
    
    // 判断是否包含指定名称的 Bean
    boolean containsBean(String name);
    
    // 判断 Bean 是否为单例
    boolean isSingleton(String name) throws NoSuchBeanDefinitionException;
    
    // 判断 Bean 是否为原型
    boolean isPrototype(String name) throws NoSuchBeanDefinitionException;
}

// AbstractBeanFactory 实现（核心逻辑）
public abstract class AbstractBeanFactory extends FactoryBeanRegistrySupport 
        implements ConfigurableBeanFactory {
    
    @Override
    public Object getBean(String name) throws BeansException {
        return doGetBean(name, null, null, true);
    }
    
    // 核心方法：获取 Bean
    protected <T> T doGetBean(String name, Class<T> requiredType, 
                              Object[] args, boolean typeCheckOnly) {
        
        // 1. 转换 Bean 名称（处理别名、FactoryBean 等）
        String beanName = transformedBeanName(name);
        
        // 2. 尝试从缓存中获取（单例 Bean）
        Object sharedInstance = getSingleton(beanName);
        if (sharedInstance != null) {
            // 如果是 FactoryBean，获取 getObject()
            return (T) getObjectForBeanInstance(sharedInstance, name, beanName, null);
        }
        
        // 3. 检查父 BeanFactory
        BeanFactory parentBeanFactory = getParentBeanFactory();
        if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
            return parentBeanFactory.getBean(name);
        }
        
        // 4. 获取 BeanDefinition
        RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
        
        // 5. 创建 Bean（根据作用域）
        if (mbd.isSingleton()) {
            // 单例：创建并缓存
            sharedInstance = getSingleton(beanName, () -> {
                return createBean(beanName, mbd, args);
            });
        } else if (mbd.isPrototype()) {
            // 原型：每次创建新实例
            sharedInstance = createBean(beanName, mbd, args);
        } else {
            // 其他作用域（request、session 等）
            // ...
        }
        
        // 6. 类型转换
        return (T) getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
    }
}

// ApplicationContext 接口（继承 BeanFactory）
public interface ApplicationContext extends BeanFactory, 
        MessageSource, 
        ApplicationEventPublisher, 
        ResourcePatternResolver {
    
    // 获取应用名称
    String getId();
    
    // 获取显示名称
    String getDisplayName();
    
    // 获取启动时间
    long getStartupDate();
    
    // 获取父容器
    ApplicationContext getParent();
    
    // 获取 AutowireCapableBeanFactory
    AutowireCapableBeanFactory getAutowireCapableBeanFactory() 
            throws IllegalStateException;
}
```

#### BeanFactory vs ApplicationContext

| 特性 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| Bean 实例化时机 | 第一次使用时 | 容器启动时 |
| 国际化支持 | 不支持 | 支持（MessageSource） |
| 事件发布 | 不支持 | 支持（ApplicationEventPublisher） |
| 资源加载 | 不支持 | 支持（ResourcePatternResolver） |
| AOP 集成 | 不自动 | 自动 |
| 推荐使用 | 不推荐 | 推荐 |

#### 实际案例

```java
// 自定义工厂 Bean
@Component
public class UserServiceFactory implements FactoryBean<UserService> {
    
    @Override
    public UserService getObject() throws Exception {
        // 创建 UserService 的逻辑
        UserService service = new UserService();
        // 可以添加一些初始化逻辑
        return service;
    }
    
    @Override
    public Class<?> getObjectType() {
        return UserService.class;
    }
    
    @Override
    public boolean isSingleton() {
        return true;
    }
}

// 使用
@RestController
public class UserController {
    @Autowired
    private UserService userService;  // 注入的是 FactoryBean.getObject() 返回的对象
}
```

---

### 16.2.2 单例模式（Singleton Pattern）

#### 概念解释

单例模式确保一个类只有一个实例，并提供全局访问点。

打个比方：

> 想象一个公司只有一个 CEO，所有人都找同一个 CEO 审批，而不是每个部门一个 CEO。

#### Spring 中的单例模式

Spring 默认所有 Bean 都是单例的，通过 **DefaultSingletonBeanRegistry** 来管理。

#### 源码分析

```java
// DefaultSingletonBeanRegistry 核心实现
public class DefaultSingletonBeanRegistry extends SimpleAliasRegistry 
        implements SingletonBeanRegistry {
    
    // 单例 Bean 缓存（一级缓存）
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);
    
    // 早期 Bean 缓存（二级缓存，用于解决循环依赖）
    private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);
    
    // Bean 工厂缓存（三级缓存，用于解决循环依赖）
    private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
    
    // 已注册的单例 Bean 名称
    private final Set<String> registeredSingletons = new LinkedHashSet<>(256);
    
    // 正在创建的单例 Bean
    private final Set<String> singletonsCurrentlyInCreation = 
            Collections.newSetFromMap(new ConcurrentHashMap<>(16));
    
    @Override
    public void registerSingleton(String beanName, Object singletonObject) {
        synchronized (this.singletonObjects) {
            Object oldObject = this.singletonObjects.get(beanName);
            if (oldObject != null) {
                throw new IllegalStateException("Could not register object [" + 
                        singletonObject + "] under bean name '" + beanName + 
                        "': there's already object [" + oldObject + "] bound");
            }
            addSingleton(beanName, singletonObject);
        }
    }
    
    protected void addSingleton(String beanName, Object singletonObject) {
        synchronized (this.singletonObjects) {
            this.singletonObjects.put(beanName, singletonObject);
            this.singletonFactories.remove(beanName);
            this.earlySingletonObjects.remove(beanName);
            this.registeredSingletons.add(beanName);
        }
    }
    
    @Override
    public Object getSingleton(String beanName) {
        return getSingleton(beanName, true);
    }
    
    protected Object getSingleton(String beanName, boolean allowEarlyReference) {
        // 1. 从一级缓存获取
        Object singletonObject = this.singletonObjects.get(beanName);
        if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
            synchronized (this.singletonObjects) {
                // 2. 从二级缓存获取
                singletonObject = this.earlySingletonObjects.get(beanName);
                if (singletonObject == null && allowEarlyReference) {
                    // 3. 从三级缓存获取
                    ObjectFactory<?> singletonFactory = 
                            this.singletonFactories.get(beanName);
                    if (singletonFactory != null) {
                        singletonObject = singletonFactory.getObject();
                        // 升级到二级缓存
                        this.earlySingletonObjects.put(beanName, singletonObject);
                        this.singletonFactories.remove(beanName);
                    }
                }
            }
        }
        return singletonObject;
    }
    
    // 获取单例 Bean（带创建逻辑）
    public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
        synchronized (this.singletonObjects) {
            // 先尝试从缓存获取
            Object singletonObject = this.singletonObjects.get(beanName);
            if (singletonObject == null) {
                // 标记为正在创建
                beforeSingletonCreation(beanName);
                
                boolean newSingleton = false;
                try {
                    // 创建 Bean
                    singletonObject = singletonFactory.getObject();
                    newSingleton = true;
                } finally {
                    afterSingletonCreation(beanName);
                }
                
                // 添加到缓存
                if (newSingleton) {
                    addSingleton(beanName, singletonObject);
                }
            }
            return singletonObject;
        }
    }
}
```

#### 三级缓存解决循环依赖

Spring 通过三级缓存解决循环依赖问题：

```java
// 示例：A 依赖 B，B 依赖 A
@Component
public class A {
    @Autowired
    private B b;
}

@Component
public class B {
    @Autowired
    private A a;
}
```

**解决流程**：

1. 创建 A 时，发现依赖 B
2. 创建 B 时，发现依赖 A
3. 此时 A 正在创建中，从三级缓存获取 A 的早期引用
4. B 创建完成，注入 A 的早期引用
5. A 创建完成，注入 B

#### 单例 vs 原型

```java
// 单例（默认）
@Component
public class SingletonService {
    // 整个应用中只有一个实例
}

// 原型
@Component
@Scope("prototype")
public class PrototypeService {
    // 每次注入都会创建新实例
}
```

---

### 16.2.3 代理模式（Proxy Pattern）

#### 概念解释

代理模式为其他对象提供一种代理以控制对这个对象的访问。

打个比方：

> 想象你要买房子，但你不想直接和房东打交道，于是找了中介（代理）。中介帮你处理所有事务，你只需要和中介沟通。

#### Spring 中的代理模式

Spring AOP 就是基于代理模式实现的，有两种代理方式：

1. **JDK 动态代理**：基于接口
2. **CGLIB 代理**：基于继承

#### 源码分析

```java
// ProxyFactory 核心实现
public class ProxyFactory extends ProxyCreatorSupport {
    
    public ProxyFactory() {
    }
    
    public ProxyFactory(Object target) {
        setTarget(target);
        setInterfaces(ClassUtils.getAllInterfaces(target));
    }
    
    // 创建代理
    public Object getProxy() {
        return createAopProxy().getProxy();
    }
}

// AopProxyFactory 接口
public interface AopProxyFactory {
    // 创建 AOP 代理
    AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException;
}

// DefaultAopProxyFactory 实现
public class DefaultAopProxyFactory implements AopProxyFactory, Serializable {
    
    @Override
    public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
        if (config.isOptimize() || config.isProxyTargetClass() || 
                hasNoUserSuppliedProxyInterfaces(config)) {
            
            Class<?> targetClass = config.getTargetClass();
            if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
                // JDK 动态代理
                return new JdkDynamicAopProxy(config);
            } else {
                // CGLIB 代理
                return new ObjenesisCglibAopProxy(config);
            }
        } else {
            // JDK 动态代理
            return new JdkDynamicAopProxy(config);
        }
    }
}

// JdkDynamicAopProxy 实现
final class JdkDynamicAopProxy implements AopProxy, InvocationHandler, Serializable {
    
    private final AdvisedSupport advised;
    
    @Override
    public Object getProxy() {
        return getProxy(ClassUtils.getDefaultClassLoader());
    }
    
    @Override
    public Object getProxy(ClassLoader classLoader) {
        // 获取目标类实现的所有接口
        Class<?>[] proxiedInterfaces = AopProxyUtils.completeProxiedInterfaces(
                this.advised);
        
        // 创建代理对象
        return Proxy.newProxyInstance(classLoader, proxiedInterfaces, this);
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        MethodInvocation invocation;
        Object oldProxy = null;
        
        try {
            // 获取拦截器链
            List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(
                    method, targetClass);
            
            if (chain.isEmpty()) {
                // 没有拦截器，直接调用目标方法
                invocation = new ReflectiveMethodInvocation(proxy, target, method, 
                        args, targetClass, chain);
                retVal = invocation.proceed();
            } else {
                // 有拦截器，创建方法调用对象并执行
                invocation = new ReflectiveMethodInvocation(proxy, target, method, 
                        args, targetClass, chain);
                retVal = invocation.proceed();
            }
        } finally {
            // 清理
        }
        
        return retVal;
    }
}

// CglibAopProxy 实现
class CglibAopProxy implements AopProxy {
    
    @Override
    public Object getProxy() {
        return getProxy(null);
    }
    
    @Override
    public Object getProxy(ClassLoader classLoader) {
        // 获取目标类
        Class<?> rootClass = this.advised.getTargetClass();
        
        // 配置 CGLIB
        Enhancer enhancer = createEnhancer();
        if (classLoader != null) {
            enhancer.setClassLoader(classLoader);
        }
        enhancer.setSuperclass(rootClass);
        enhancer.setInterfaces(AopProxyUtils.getProxiedInterfaces(this.advised));
        enhancer.setNamingPolicy(SpringNamingPolicy.INSTANCE);
        enhancer.setStrategy(new ClassLoaderAwareUndeclaredThrowableStrategy(classLoader));
        
        // 设置回调
        Callback[] callbacks = getCallbacks(rootClass);
        enhancer.setCallbacks(callbacks);
        
        // 创建代理对象
        Object proxy;
        if (this.advised.isFrozen()) {
            proxy = enhancer.create();
        } else {
            proxy = enhancer.create(this.constructorArgs, this.constructorArgTypes);
        }
        
        return proxy;
    }
}
```

#### JDK 动态代理 vs CGLIB

| 特性 | JDK 动态代理 | CGLIB 代理 |
|------|-------------|-----------|
| 要求 | 目标类必须实现接口 | 目标类不能是 final |
| 原理 | 基于反射，生成接口实现类 | 基于 ASM，生成子类 |
| 性能 | 创建快，调用慢 | 创建慢，调用快 |
| Spring Boot 2.x | 默认 | 需要配置 |
| Spring Boot 3.x | 不推荐 | 默认 |

#### 实际案例

```java
// 目标接口
public interface UserService {
    void save(User user);
}

// 目标类
@Service
public class UserServiceImpl implements UserService {
    @Override
    public void save(User user) {
        System.out.println("保存用户：" + user.getName());
    }
}

// 切面
@Aspect
@Component
public class LogAspect {
    
    @Before("execution(* com.example.service.*.*(..))")
    public void before(JoinPoint joinPoint) {
        System.out.println("方法执行前：" + joinPoint.getSignature().getName());
    }
    
    @After("execution(* com.example.service.*.*(..))")
    public void after(JoinPoint joinPoint) {
        System.out.println("方法执行后：" + joinPoint.getSignature().getName());
    }
}

// 配置类
@Configuration
@EnableAspectJAutoProxy
public class AopConfig {
    // 启用 AOP
}
```

---

### 16.2.4 模板方法模式（Template Method Pattern）

#### 概念解释

模板方法模式定义一个操作中的算法骨架，而将一些步骤延迟到子类中。

打个比方：

> 想象你去餐厅吃饭，流程是固定的：点餐 -> 等待 -> 上菜 -> 吃饭 -> 结账。但每个步骤的具体内容可以不同（点什么菜、怎么吃）。

#### Spring 中的模板方法模式

Spring 中有很多模板方法模式的经典应用：

1. **JdbcTemplate**：数据库操作模板
2. **RestTemplate**：HTTP 请求模板
3. **AbstractApplicationContext**：容器刷新模板

#### 源码分析

```java
// JdbcTemplate 核心实现
public class JdbcTemplate extends JdbcAccessor implements JdbcOperations {
    
    // 模板方法：查询对象
    @Override
    public <T> T queryForObject(String sql, Object[] args, Class<T> requiredType) {
        return query(sql, args, new SingleColumnRowMapper<>(requiredType));
    }
    
    // 模板方法：查询列表
    @Override
    public <T> List<T> query(String sql, Class<T> elementType) {
        return query(sql, new SingleColumnRowMapper<>(elementType));
    }
    
    // 核心模板方法
    @Override
    public <T> T query(String sql, RowMapper<T> rowMapper) {
        return execute(sql, new RowMapperResultSetExtractor<>(rowMapper));
    }
    
    // 执行模板
    @Override
    public <T> T execute(StatementCallback<T> action) {
        // 1. 获取连接
        Connection con = DataSourceUtils.getConnection(obtainDataSource());
        Statement stmt = null;
        try {
            // 2. 创建 Statement
            stmt = con.createStatement();
            
            // 3. 执行回调（由子类实现具体逻辑）
            T result = action.doInStatement(stmt);
            
            // 4. 处理警告
            handleWarnings(stmt);
            
            return result;
        } catch (SQLException ex) {
            // 5. 处理异常
            releaseStatement(stmt);
            throw translateException("StatementCallback", sql, ex);
        } finally {
            // 6. 释放资源
            JdbcUtils.closeStatement(stmt);
            DataSourceUtils.releaseConnection(con, getDataSource());
        }
    }
    
    // 更新操作模板
    @Override
    public int update(String sql, Object[] args, int[] argTypes) {
        return update(sql, new ArgPreparedStatementSetter(args, argTypes));
    }
    
    @Override
    public int update(String sql, PreparedStatementSetter pss) {
        return execute(sql, (StatementCallback<Integer>) stmt -> {
            PreparedStatement ps = null;
            try {
                // 1. 创建 PreparedStatement
                ps = (stmt instanceof PreparedStatement ? 
                        (PreparedStatement) stmt : 
                        con.prepareStatement(sql));
                
                // 2. 设置参数（由调用者实现）
                if (pss != null) {
                    pss.setValues(ps);
                }
                
                // 3. 执行更新
                int rowsAffected = ps.executeUpdate();
                
                return rowsAffected;
            } finally {
                JdbcUtils.closeStatement(ps);
            }
        });
    }
}

// AbstractApplicationContext 模板方法
public abstract class AbstractApplicationContext extends DefaultResourceLoader 
        implements ConfigurableApplicationContext {
    
    // 模板方法：刷新容器
    @Override
    public void refresh() {
        synchronized (this.startupShutdownMonitor) {
            // 1. 准备刷新
            prepareRefresh();
            
            // 2. 获取 BeanFactory（由子类实现）
            ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
            
            // 3. 准备 BeanFactory
            prepareBeanFactory(beanFactory);
            
            try {
                // 4. 后处理 BeanFactory
                postProcessBeanFactory(beanFactory);
                
                // 5. 调用 BeanFactoryPostProcessor
                invokeBeanFactoryPostProcessors(beanFactory);
                
                // 6. 注册 BeanPostProcessor
                registerBeanPostProcessors(beanFactory);
                
                // 7. 初始化消息源
                initMessageSource();
                
                // 8. 初始化事件广播器
                initApplicationEventMulticaster();
                
                // 9. 子类特殊初始化（由子类实现）
                onRefresh();
                
                // 10. 注册监听器
                registerListeners();
                
                // 11. 实例化单例 Bean
                finishBeanFactoryInitialization(beanFactory);
                
                // 12. 完成刷新
                finishRefresh();
            } catch (BeansException ex) {
                // 13. 异常处理
                destroyBeans();
                cancelRefresh(ex);
                throw ex;
            } finally {
                resetCommonCaches();
            }
        }
    }
    
    // 由子类实现的方法
    protected abstract void refreshBeanFactory() throws BeansException, IllegalStateException;
    
    protected abstract ConfigurableListableBeanFactory getBeanFactory() 
            throws IllegalStateException;
}
```

#### 实际案例

```java
// 自定义模板方法
public abstract class AbstractDataProcessor<T> {
    
    // 模板方法
    public final void process(T data) {
        // 1. 验证数据
        validate(data);
        
        // 2. 转换数据（由子类实现）
        Object converted = convert(data);
        
        // 3. 保存数据
        save(converted);
        
        // 4. 发送通知
        notify(data);
    }
    
    // 固定步骤
    private void validate(T data) {
        if (data == null) {
            throw new IllegalArgumentException("数据不能为空");
        }
    }
    
    // 抽象方法：由子类实现
    protected abstract Object convert(T data);
    
    // 固定步骤
    private void save(Object data) {
        System.out.println("保存数据：" + data);
    }
    
    // 固定步骤
    private void notify(T data) {
        System.out.println("发送通知");
    }
}

// 具体实现
public class UserProcessor extends AbstractDataProcessor<User> {
    
    @Override
    protected Object convert(User user) {
        // 用户特定的转换逻辑
        UserDTO dto = new UserDTO();
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        return dto;
    }
}
```

---

### 16.2.5 观察者模式（Observer Pattern）

#### 概念解释

观察者模式定义对象间的一种一对多依赖关系，当一个对象状态发生改变时，所有依赖它的对象都得到通知。

打个比方：

> 想象你订阅了公众号，当公众号发布新文章时，所有订阅者都会收到推送。

#### Spring 中的观察者模式

Spring 的事件机制就是基于观察者模式实现的：

1. **ApplicationEvent**：事件（被观察的对象）
2. **ApplicationListener**：监听器（观察者）
3. **ApplicationEventPublisher**：事件发布器

#### 源码分析

```java
// ApplicationEvent 基类
public abstract class ApplicationEvent extends EventObject {
    
    private static final long serialVersionUID = 7099057708183571937L;
    
    private final long timestamp;
    
    public ApplicationEvent(Object source) {
        super(source);
        this.timestamp = System.currentTimeMillis();
    }
    
    public final long getTimestamp() {
        return this.timestamp;
    }
}

// ApplicationListener 接口
@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
    
    void onApplicationEvent(E event);
}

// ApplicationEventPublisher 接口
public interface ApplicationEventPublisher {
    
    default void publishEvent(ApplicationEvent event) {
        publishEvent((Object) event);
    }
    
    void publishEvent(Object event);
}

// SimpleApplicationEventMulticaster 实现
public class SimpleApplicationEventMulticaster extends AbstractApplicationEventMulticaster {
    
    private Executor taskExecutor;
    
    @Override
    public void multicastEvent(ApplicationEvent event) {
        multicastEvent(event, resolveDefaultEventType(event));
    }
    
    @Override
    public void multicastEvent(final ApplicationEvent event, ResolvableType eventType) {
        for (ApplicationListener<?> listener : getApplicationListeners(event, eventType)) {
            Executor executor = getTaskExecutor();
            if (executor != null) {
                // 异步执行
                executor.execute(() -> invokeListener(listener, event));
            } else {
                // 同步执行
                invokeListener(listener, event);
            }
        }
    }
    
    protected void invokeListener(ApplicationListener<?> listener, ApplicationEvent event) {
        try {
            // 调用监听器的 onApplicationEvent 方法
            listener.onApplicationEvent(event);
        } catch (ClassCastException ex) {
            // 类型不匹配，忽略
        }
    }
}

// AbstractApplicationContext 中的事件发布
public abstract class AbstractApplicationContext {
    
    private ApplicationEventMulticaster applicationEventMulticaster;
    
    @Override
    public void publishEvent(ApplicationEvent event) {
        publishEvent(event, null);
    }
    
    @Override
    public void publishEvent(Object event) {
        publishEvent(event, resolveDefaultEventType(event));
    }
    
    protected void publishEvent(Object event, ResolvableType eventType) {
        // 包装事件
        ApplicationEvent applicationEvent;
        if (event instanceof ApplicationEvent) {
            applicationEvent = (ApplicationEvent) event;
        } else {
            applicationEvent = new PayloadApplicationEvent<>(this, event);
            if (eventType == null) {
                eventType = ((PayloadApplicationEvent<?>) applicationEvent).getResolvableType();
            }
        }
        
        // 发布事件
        if (this.applicationEventMulticaster != null) {
            this.applicationEventMulticaster.multicastEvent(applicationEvent, eventType);
        }
    }
}
```

#### 实际案例

```java
// 自定义事件
public class UserRegisteredEvent extends ApplicationEvent {
    
    private final User user;
    
    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }
    
    public User getUser() {
        return user;
    }
}

// 监听器 1：发送邮件
@Component
public class EmailNotificationListener implements ApplicationListener<UserRegisteredEvent> {
    
    @Override
    public void onApplicationEvent(UserRegisteredEvent event) {
        User user = event.getUser();
        System.out.println("发送邮件给：" + user.getEmail());
    }
}

// 监听器 2：初始化积分
@Component
public class PointsInitializationListener {
    
    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        User user = event.getUser();
        System.out.println("初始化积分：" + user.getName());
    }
}

// 事件发布器
@Service
public class UserService {
    
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void register(User user) {
        // 1. 保存用户
        System.out.println("保存用户：" + user.getName());
        
        // 2. 发布事件
        eventPublisher.publishEvent(new UserRegisteredEvent(this, user));
    }
}
```

---

### 16.2.6 策略模式（Strategy Pattern）

#### 概念解释

策略模式定义一系列算法，把它们一个个封装起来，并且使它们可相互替换。

打个比方：

> 想象你去旅行，可以选择不同的交通方式：飞机、火车、汽车。每种方式都是一个策略，你可以根据情况选择不同的策略。

#### Spring 中的策略模式

Spring 的 Resource 接口就是策略模式的经典应用：

1. **Resource**：策略接口
2. **ClassPathResource**：从类路径加载
3. **FileSystemResource**：从文件系统加载
4. **UrlResource**：从 URL 加载

#### 源码分析

```java
// Resource 接口（策略接口）
public interface Resource extends InputStreamSource {
    
    // 判断是否存在
    boolean exists();
    
    // 判断是否可读
    boolean isReadable();
    
    // 判断是否打开
    boolean isOpen();
    
    // 获取 URL
    URL getURL() throws IOException;
    
    // 获取 URI
    URI getURI() throws IOException;
    
    // 获取 File
    File getFile() throws IOException;
    
    // 获取内容长度
    long contentLength() throws IOException;
    
    // 获取最后修改时间
    long lastModified() throws IOException;
    
    // 创建相对资源
    Resource createRelative(String relativePath) throws IOException;
    
    // 获取文件名
    String getFilename();
    
    // 获取描述
    String getDescription();
}

// ClassPathResource 实现
public class ClassPathResource extends AbstractFileResolvingResource {
    
    private final String path;
    private ClassLoader classLoader;
    
    public ClassPathResource(String path) {
        this(path, (ClassLoader) null);
    }
    
    public ClassPathResource(String path, ClassLoader classLoader) {
        this.path = StringUtils.cleanPath(path);
        this.classLoader = (classLoader != null ? classLoader : 
                ClassUtils.getDefaultClassLoader());
    }
    
    @Override
    public InputStream getInputStream() throws IOException {
        InputStream is = this.classLoader.getResourceAsStream(this.path);
        if (is == null) {
            throw new FileNotFoundException(this.path + " cannot be opened because it does not exist");
        }
        return is;
    }
    
    @Override
    public URL getURL() throws IOException {
        URL url = this.classLoader.getResource(this.path);
        if (url == null) {
            throw new FileNotFoundException(this.path + " cannot be resolved to URL");
        }
        return url;
    }
}

// FileSystemResource 实现
public class FileSystemResource extends AbstractResource implements WritableResource {
    
    private final String path;
    private final File file;
    
    public FileSystemResource(String path) {
        this.path = StringUtils.cleanPath(path);
        this.file = new File(path);
    }
    
    @Override
    public InputStream getInputStream() throws IOException {
        return new FileInputStream(this.file);
    }
    
    @Override
    public URL getURL() throws IOException {
        return this.file.toURI().toURL();
    }
}

// UrlResource 实现
public class UrlResource extends AbstractResource {
    
    private final URL url;
    
    public UrlResource(URL url) {
        this.url = url;
    }
    
    public UrlResource(String url) throws MalformedURLException {
        this.url = new URL(url);
    }
    
    @Override
    public InputStream getInputStream() throws IOException {
        URLConnection con = this.url.openConnection();
        return con.getInputStream();
    }
}

// ResourceLoader 接口（策略选择器）
public interface ResourceLoader {
    
    String CLASSPATH_URL_PREFIX = ResourceUtils.CLASSPATH_URL_PREFIX;
    
    Resource getResource(String location);
    
    ClassLoader getClassLoader();
}

// DefaultResourceLoader 实现
public class DefaultResourceLoader implements ResourceLoader {
    
    @Override
    public Resource getResource(String location) {
        if (location.startsWith(CLASSPATH_URL_PREFIX)) {
            // classpath: 前缀
            return new ClassPathResource(location.substring(CLASSPATH_URL_PREFIX.length()));
        } else {
            try {
                // 尝试作为 URL
                URL url = new URL(location);
                return new UrlResource(url);
            } catch (MalformedURLException ex) {
                // 作为文件系统路径
                return new FileSystemResource(location);
            }
        }
    }
}
```

#### 实际案例

```java
// 使用不同的 Resource 策略
@Service
public class FileService {
    
    @Autowired
    private ResourceLoader resourceLoader;
    
    // 从类路径加载
    public void loadFromClasspath() throws IOException {
        Resource resource = resourceLoader.getResource("classpath:config.properties");
        InputStream is = resource.getInputStream();
        // 读取配置
    }
    
    // 从文件系统加载
    public void loadFromFileSystem() throws IOException {
        Resource resource = resourceLoader.getResource("file:/etc/config.properties");
        InputStream is = resource.getInputStream();
        // 读取配置
    }
    
    // 从 URL 加载
    public void loadFromUrl() throws IOException {
        Resource resource = resourceLoader.getResource("http://example.com/config.properties");
        InputStream is = resource.getInputStream();
        // 读取配置
    }
}
```

---

### 16.2.7 适配器模式（Adapter Pattern）

#### 概念解释

适配器模式将一个类的接口转换成客户希望的另外一个接口。

打个比方：

> 想象你有一个 USB-C 接口的笔记本，但你的鼠标是 USB-A 接口，你需要一个适配器（转接头）来连接它们。

#### Spring 中的适配器模式

Spring MVC 的 HandlerAdapter 就是适配器模式的经典应用：

1. **HandlerAdapter**：适配器接口
2. **RequestMappingHandlerAdapter**：适配 @RequestMapping 方法
3. **HttpRequestHandlerAdapter**：适配 HttpRequestHandler
4. **SimpleControllerHandlerAdapter**：适配 Controller 接口

#### 源码分析

```java
// HandlerAdapter 接口
public interface HandlerAdapter {
    
    // 判断是否支持该 Handler
    boolean supports(Object handler);
    
    // 处理请求
    ModelAndView handle(HttpServletRequest request, HttpServletResponse response, 
                        Object handler) throws Exception;
    
    // 获取最后修改时间
    long getLastModified(HttpServletRequest request, Object handler);
}

// RequestMappingHandlerAdapter 实现
public class RequestMappingHandlerAdapter extends AbstractHandlerMethodAdapter 
        implements HandlerExceptionResolver {
    
    @Override
    public boolean supports(Object handler) {
        // 判断是否是 HandlerMethod（@RequestMapping 方法）
        return handler instanceof HandlerMethod;
    }
    
    @Override
    protected ModelAndView handleInternal(HttpServletRequest request, 
                                          HttpServletResponse response, 
                                          HandlerMethod handlerMethod) throws Exception {
        
        // 1. 获取方法参数
        Object[] args = getMethodArgumentValues(request, handlerMethod);
        
        // 2. 调用方法
        Object returnValue = handlerMethod.getMethod().invoke(
                handlerMethod.getBean(), args);
        
        // 3. 处理返回值
        ModelAndView mav = new ModelAndView();
        if (returnValue instanceof ModelAndView) {
            mav = (ModelAndView) returnValue;
        } else if (returnValue instanceof String) {
            mav.setViewName((String) returnValue);
        }
        
        return mav;
    }
}

// SimpleControllerHandlerAdapter 实现
public class SimpleControllerHandlerAdapter implements HandlerAdapter {
    
    @Override
    public boolean supports(Object handler) {
        // 判断是否是 Controller 接口
        return handler instanceof Controller;
    }
    
    @Override
    public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, 
                               Object handler) throws Exception {
        // 调用 Controller 的 handleRequest 方法
        return ((Controller) handler).handleRequest(request, response);
    }
}

// DispatcherServlet 中的适配器使用
public class DispatcherServlet extends FrameworkServlet {
    
    private List<HandlerAdapter> handlerAdapters;
    
    @Override
    protected void doDispatch(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        // 1. 获取 Handler
        HandlerExecutionChain mappedHandler = getHandler(request);
        
        // 2. 获取 HandlerAdapter
        HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
        
        // 3. 调用 HandlerAdapter
        ModelAndView mv = ha.handle(request, response, mappedHandler.getHandler());
        
        // 4. 处理视图
        processDispatchResult(request, response, mv);
    }
    
    protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
        for (HandlerAdapter ha : this.handlerAdapters) {
            if (ha.supports(handler)) {
                return ha;
            }
        }
        throw new ServletException("No adapter for handler [" + handler + "]");
    }
}
```

#### 实际案例

```java
// 自定义 HandlerAdapter
public class MyHandlerAdapter implements HandlerAdapter {
    
    @Override
    public boolean supports(Object handler) {
        // 支持自定义的 MyHandler 接口
        return handler instanceof MyHandler;
    }
    
    @Override
    public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, 
                               Object handler) throws Exception {
        MyHandler myHandler = (MyHandler) handler;
        
        // 调用自定义处理逻辑
        Object result = myHandler.handle(request);
        
        // 构建 ModelAndView
        ModelAndView mav = new ModelAndView();
        mav.addObject("result", result);
        mav.setViewName("myView");
        
        return mav;
    }
    
    @Override
    public long getLastModified(HttpServletRequest request, Object handler) {
        return -1;
    }
}

// 自定义 Handler
public interface MyHandler {
    Object handle(HttpServletRequest request);
}

// 具体实现
@Component
public class UserHandler implements MyHandler {
    @Override
    public Object handle(HttpServletRequest request) {
        return "User list";
    }
}
```

---

## 16.3 对比表格

### 设计模式对比

| 设计模式 | 类型 | Spring 中的应用 | 核心思想 |
|---------|------|----------------|---------|
| 工厂模式 | 创建型 | BeanFactory、ApplicationContext | 封装对象创建逻辑 |
| 单例模式 | 创建型 | DefaultSingletonBeanRegistry | 确保一个类只有一个实例 |
| 代理模式 | 结构型 | AOP（JDK 动态代理、CGLIB） | 为对象提供代理以控制访问 |
| 模板方法 | 行为型 | JdbcTemplate、AbstractApplicationContext | 定义算法骨架，延迟到子类 |
| 观察者模式 | 行为型 | 事件机制（ApplicationEvent） | 一对多依赖，状态变更通知 |
| 策略模式 | 行为型 | Resource 接口 | 定义一系列算法，可相互替换 |
| 适配器模式 | 结构型 | HandlerAdapter | 接口转换 |

---

## 16.4 新手常见误区

### 误区 1："Spring 的 Bean 都是单例的"

**错！** Spring 的 Bean 默认是单例的，但可以通过 @Scope 注解改变作用域：

```java
// ✅ 单例（默认）
@Component
public class SingletonService {
}

// ✅ 原型
@Component
@Scope("prototype")
public class PrototypeService {
}

// ✅ 请求作用域
@Component
@Scope("request")
public class RequestService {
}

// ✅ 会话作用域
@Component
@Scope("session")
public class SessionService {
}
```

### 误区 2："JDK 动态代理和 CGLIB 性能一样"

**错！** 两者性能特点不同：

```java
// JDK 动态代理
// - 创建快（基于反射）
// - 调用慢（需要反射调用）
// - 要求目标类实现接口

// CGLIB
// - 创建慢（需要生成字节码）
// - 调用快（直接调用）
// - 目标类不能是 final
```

### 误区 3："模板方法模式只能用于数据库操作"

**错！** 模板方法模式可以用于任何有固定流程的场景：

```java
// ✅ 数据库操作
jdbcTemplate.query(sql, rowMapper);

// ✅ HTTP 请求
restTemplate.getForObject(url, responseType);

// ✅ 文件处理
public abstract class FileProcessor {
    public final void process(File file) {
        validate(file);
        parse(file);
        transform(file);
        save(file);
    }
    
    protected abstract void parse(File file);
    protected abstract void transform(File file);
}
```

### 误区 4："观察者模式中，所有监听器都是同步执行的"

**错！** Spring 事件机制支持异步执行：

```java
// ✅ 同步监听器
@Component
public class SyncListener implements ApplicationListener<MyEvent> {
    @Override
    public void onApplicationEvent(MyEvent event) {
        // 同步执行
    }
}

// ✅ 异步监听器
@Component
public class AsyncListener {
    @Async
    @EventListener
    public void handleEvent(MyEvent event) {
        // 异步执行
    }
}
```

### 误区 5："策略模式和工厂模式是一样的"

**错！** 虽然都是创建对象，但目的不同：

```java
// 工厂模式：创建对象
public class BeanFactory {
    public Object getBean(String name) {
        // 创建并返回 Bean
    }
}

// 策略模式：选择算法
public interface Resource {
    InputStream getInputStream() throws IOException;
}

public class ClassPathResource implements Resource {
    // 从类路径加载
}

public class FileSystemResource implements Resource {
    // 从文件系统加载
}
```

---

## 16.5 动手练习

### 练习 1：基础练习 - 自定义工厂 Bean

实现一个 FactoryBean，创建数据库连接池。

<details>
<summary>点击查看答案</summary>

```java
// 自定义 FactoryBean
@Component
public class DataSourceFactoryBean implements FactoryBean<DataSource> {
    
    @Value("${db.url}")
    private String url;
    
    @Value("${db.username}")
    private String username;
    
    @Value("${db.password}")
    private String password;
    
    @Override
    public DataSource getObject() throws Exception {
        // 创建 HikariCP 连接池
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        
        return new HikariDataSource(config);
    }
    
    @Override
    public Class<?> getObjectType() {
        return DataSource.class;
    }
    
    @Override
    public boolean isSingleton() {
        return true;
    }
}

// 使用
@Service
public class UserService {
    
    @Autowired
    private DataSource dataSource;  // 注入的是 FactoryBean 创建的对象
    
    public void test() {
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("连接成功：" + conn.getMetaData().getURL());
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

</details>

### 练习 2：进阶练习 - 自定义模板方法

实现一个数据导入模板，支持 CSV、Excel、JSON 三种格式。

<details>
<summary>点击查看答案</summary>

```java
// 抽象模板类
public abstract class AbstractDataImporter<T> {
    
    // 模板方法
    public final List<T> importData(String filePath) {
        // 1. 验证文件
        validateFile(filePath);
        
        // 2. 读取文件（由子类实现）
        List<String> lines = readFile(filePath);
        
        // 3. 解析数据（由子类实现）
        List<T> data = parseData(lines);
        
        // 4. 数据转换
        List<T> transformed = transformData(data);
        
        // 5. 保存数据
        saveData(transformed);
        
        return transformed;
    }
    
    // 固定步骤
    private void validateFile(String filePath) {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IllegalArgumentException("文件不存在：" + filePath);
        }
    }
    
    // 抽象方法：由子类实现
    protected abstract List<String> readFile(String filePath);
    
    protected abstract List<T> parseData(List<String> lines);
    
    // 可选覆盖的方法
    protected List<T> transformData(List<T> data) {
        // 默认不做转换，直接返回
        return data;
    }
    
    // 固定步骤
    private void saveData(List<T> data) {
        System.out.println("保存数据：" + data.size() + " 条");
    }
}

// CSV 导入器
@Component
public class CsvDataImporter extends AbstractDataImporter<User> {
    
    @Override
    protected List<String> readFile(String filePath) {
        try {
            return Files.readAllLines(Paths.get(filePath));
        } catch (IOException e) {
            throw new RuntimeException("读取 CSV 文件失败", e);
        }
    }
    
    @Override
    protected List<User> parseData(List<String> lines) {
        List<User> users = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {  // 跳过表头
            String[] fields = lines.get(i).split(",");
            User user = new User();
            user.setName(fields[0]);
            user.setEmail(fields[1]);
            user.setAge(Integer.parseInt(fields[2]));
            users.add(user);
        }
        return users;
    }
}

// Excel 导入器
@Component
public class ExcelDataImporter extends AbstractDataImporter<User> {
    
    @Override
    protected List<String> readFile(String filePath) {
        // 使用 Apache POI 读取 Excel
        // 这里简化处理
        return Arrays.asList("name,email,age", "张三,zhangsan@example.com,25");
    }
    
    @Override
    protected List<User> parseData(List<String> lines) {
        // 解析 Excel 数据
        List<User> users = new ArrayList<>();
        // ...
        return users;
    }
}

// JSON 导入器
@Component
public class JsonDataImporter extends AbstractDataImporter<User> {
    
    @Override
    protected List<String> readFile(String filePath) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(filePath)));
            return Arrays.asList(content);
        } catch (IOException e) {
            throw new RuntimeException("读取 JSON 文件失败", e);
        }
    }
    
    @Override
    protected List<User> parseData(List<String> lines) {
        // 使用 Jackson 解析 JSON
        ObjectMapper mapper = new ObjectMapper();
        try {
            return Arrays.asList(mapper.readValue(lines.get(0), User[].class));
        } catch (IOException e) {
            throw new RuntimeException("解析 JSON 失败", e);
        }
    }
}

// 使用
@Service
public class DataImportService {
    
    @Autowired
    private CsvDataImporter csvImporter;
    
    @Autowired
    private ExcelDataImporter excelImporter;
    
    @Autowired
    private JsonDataImporter jsonImporter;
    
    public void importCsv(String filePath) {
        List<User> users = csvImporter.importData(filePath);
        System.out.println("导入 CSV：" + users.size() + " 条");
    }
    
    public void importExcel(String filePath) {
        List<User> users = excelImporter.importData(filePath);
        System.out.println("导入 Excel：" + users.size() + " 条");
    }
    
    public void importJson(String filePath) {
        List<User> users = jsonImporter.importData(filePath);
        System.out.println("导入 JSON：" + users.size() + " 条");
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 自定义策略模式

实现一个支付系统，支持支付宝、微信、银联三种支付策略。

<details>
<summary>点击查看答案</summary>

```java
// 支付策略接口
public interface PaymentStrategy {
    
    // 支付
    PaymentResult pay(PaymentRequest request);
    
    // 获取策略名称
    String getStrategyName();
}

// 支付宝支付策略
@Component
public class AlipayStrategy implements PaymentStrategy {
    
    @Override
    public PaymentResult pay(PaymentRequest request) {
        System.out.println("使用支付宝支付");
        System.out.println("订单号：" + request.getOrderNo());
        System.out.println("金额：" + request.getAmount());
        
        // 调用支付宝 API
        // ...
        
        return new PaymentResult(true, "支付宝支付成功");
    }
    
    @Override
    public String getStrategyName() {
        return "ALIPAY";
    }
}

// 微信支付策略
@Component
public class WechatPayStrategy implements PaymentStrategy {
    
    @Override
    public PaymentResult pay(PaymentRequest request) {
        System.out.println("使用微信支付");
        System.out.println("订单号：" + request.getOrderNo());
        System.out.println("金额：" + request.getAmount());
        
        // 调用微信支付 API
        // ...
        
        return new PaymentResult(true, "微信支付成功");
    }
    
    @Override
    public String getStrategyName() {
        return "WECHAT";
    }
}

// 银联支付策略
@Component
public class UnionPayStrategy implements PaymentStrategy {
    
    @Override
    public PaymentResult pay(PaymentRequest request) {
        System.out.println("使用银联支付");
        System.out.println("订单号：" + request.getOrderNo());
        System.out.println("金额：" + request.getAmount());
        
        // 调用银联 API
        // ...
        
        return new PaymentResult(true, "银联支付成功");
    }
    
    @Override
    public String getStrategyName() {
        return "UNIONPAY";
    }
}

// 支付策略工厂
@Component
public class PaymentStrategyFactory {
    
    private final Map<String, PaymentStrategy> strategyMap = new HashMap<>();
    
    @Autowired
    public PaymentStrategyFactory(List<PaymentStrategy> strategies) {
        // 自动注入所有 PaymentStrategy 实现
        for (PaymentStrategy strategy : strategies) {
            strategyMap.put(strategy.getStrategyName(), strategy);
        }
    }
    
    public PaymentStrategy getStrategy(String strategyName) {
        PaymentStrategy strategy = strategyMap.get(strategyName);
        if (strategy == null) {
            throw new IllegalArgumentException("不支持的支付策略：" + strategyName);
        }
        return strategy;
    }
}

// 支付请求
public class PaymentRequest {
    private String orderNo;
    private BigDecimal amount;
    private String strategyName;
    
    // getter、setter
}

// 支付结果
public class PaymentResult {
    private boolean success;
    private String message;
    
    public PaymentResult(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    // getter、setter
}

// 支付服务
@Service
public class PaymentService {
    
    @Autowired
    private PaymentStrategyFactory strategyFactory;
    
    public PaymentResult pay(PaymentRequest request) {
        // 1. 获取支付策略
        PaymentStrategy strategy = strategyFactory.getStrategy(request.getStrategyName());
        
        // 2. 执行支付
        PaymentResult result = strategy.pay(request);
        
        // 3. 记录日志
        System.out.println("支付结果：" + result.getMessage());
        
        return result;
    }
}

// 测试
@SpringBootTest
public class PaymentServiceTest {
    
    @Autowired
    private PaymentService paymentService;
    
    @Test
    public void testAlipay() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderNo("ORD001");
        request.setAmount(new BigDecimal("100.00"));
        request.setStrategyName("ALIPAY");
        
        PaymentResult result = paymentService.pay(request);
        assertTrue(result.isSuccess());
    }
    
    @Test
    public void testWechatPay() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderNo("ORD002");
        request.setAmount(new BigDecimal("200.00"));
        request.setStrategyName("WECHAT");
        
        PaymentResult result = paymentService.pay(request);
        assertTrue(result.isSuccess());
    }
    
    @Test
    public void testUnionPay() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderNo("ORD003");
        request.setAmount(new BigDecimal("300.00"));
        request.setStrategyName("UNIONPAY");
        
        PaymentResult result = paymentService.pay(request);
        assertTrue(result.isSuccess());
    }
}
```

</details>

---

## 下一章预告

恭喜你完成了 Spring 原理深度解析教程的全部章节！通过这 16 章的学习，你已经掌握了：

- IoC 容器的核心原理
- BeanDefinition 和 Bean 生命周期
- 依赖注入和循环依赖
- AOP 和事务管理
- Spring Boot 自动配置和启动流程
- 注解驱动原理
- 事件机制
- SpEL 表达式
- 类型转换与校验
- 常用设计模式

这些知识将帮助你深入理解 Spring 的设计思想，提升代码质量，在面试中脱颖而出。

接下来，你可以：
- 阅读 Spring 源码，加深理解
- 动手实现一个简单的 Spring 框架
- 学习 Spring Cloud 微服务
- 研究其他框架的设计模式

祝你学习愉快！
