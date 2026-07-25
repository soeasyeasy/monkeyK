---
title: "第6章：循环依赖与三级缓存"
description: "深入理解 Spring 循环依赖检测机制与三级缓存解决方案的底层原理"
---

# 第6章：循环依赖与三级缓存

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是循环依赖？为什么 Spring 要特殊处理它？
- 三级缓存到底是什么？为什么需要三个 Map？
- Spring 是怎么检测出循环依赖的？
- 为什么加了 @Async 注解，循环依赖就失效了？

这一章我们会彻底搞懂 **Spring 的三级缓存机制**，从源码层面理解它是如何巧妙解决循环依赖问题的。这是 Spring 面试的高频考点，也是理解 Bean 生命周期的关键一环。

---

## 6.1 为什么需要处理循环依赖？

### 痛点分析

想象一下这样的场景：

1. **A 类依赖 B 类**：A 的构造函数里需要 B
2. **B 类依赖 A 类**：B 的构造函数里需要 A
3. **创建 A 时需要 B**：但 B 还没创建
4. **创建 B 时需要 A**：但 A 还没创建

这就是**循环依赖**，也叫**循环引用**。如果没有特殊处理，程序会陷入死循环：创建 A → 需要 B → 创建 B → 需要 A → 创建 A → ...

**实际代码示例：**

```java
// 循环依赖示例
@Service
public class ServiceA {
    @Autowired
    private ServiceB serviceB;  // A 依赖 B
    
    public void doWork() {
        serviceB.help();
    }
}

@Service
public class ServiceB {
    @Autowired
    private ServiceA serviceA;  // B 依赖 A
    
    public void help() {
        serviceA.doWork();
    }
}
```

如果没有特殊机制，Spring 在创建 ServiceA 时需要 ServiceB，创建 ServiceB 时又需要 ServiceA，陷入死循环。

### 生活化类比

把循环依赖想象成**两个厨师互相等对方的锅**：

- 厨师 A 要做菜，但需要厨师 B 的锅
- 厨师 B 也要做菜，但需要厨师 A 的锅
- 如果两人都等对方先把锅给自己，就永远做不成菜

**解决方案**：
1. 厨师 A 先把自己的锅**提前暴露**给厨师 B（"我的锅先借你用"）
2. 厨师 B 拿到锅后开始做菜
3. 等厨师 B 做完菜，再把锅还给 A
4. 厨师 A 拿到锅后也开始做菜

这就是 Spring 三级缓存的核心思想：**提前暴露半成品 Bean**。

---

## 6.2 核心原理讲解

### 6.2.1 循环依赖的检测机制

Spring 在创建 Bean 时，会跟踪当前正在创建哪些 Bean。如果发现有循环，就会触发三级缓存机制。

**源码入口：**

```java
// AbstractBeanFactory 中的核心方法
protected <T> T doGetBean(String name, Class<T> requiredType, ...) {
    // 1. 先检查缓存中是否已有（包括三级缓存）
    Object sharedInstance = getSingleton(beanName);
    
    // 2. 如果缓存没有，开始创建 Bean
    if (sharedInstance == null) {
        // 标记这个 Bean 正在创建
        beforeSingletonCreation(beanName);
        
        try {
            // 3. 创建 Bean 实例
            sharedInstance = createBean(beanName, mbd, args);
        } finally {
            // 4. 创建完成，移除"正在创建"标记
            afterSingletonCreation(beanName);
        }
    }
    
    return (T) sharedInstance;
}
```

**检测循环的关键：**

```java
// DefaultSingletonBeanRegistry 中的关键数据结构
private final Set<String> singletonsCurrentlyInCreation = 
    Collections.newSetFromMap(new ConcurrentHashMap<>(16));

// 标记 Bean 正在创建
protected void beforeSingletonCreation(String beanName) {
    // 如果已经在创建中，说明有循环依赖
    if (!this.singletonsCurrentlyInCreation.add(beanName)) {
        throw new BeanCurrentlyInCreationException(beanName);
    }
}

// 移除"正在创建"标记
protected void afterSingletonCreation(String beanName) {
    this.singletonsCurrentlyInCreation.remove(beanName);
}
```

**通俗类比：**

就像餐厅的订单系统：
1. 厨师开始做菜时，在白板上写下"正在做：宫保鸡丁"
2. 如果另一道菜也需要这道菜作为配菜，看到白板上已经有了，就知道有循环
3. 做完菜后，从白板上擦掉

### 6.2.2 三级缓存的原理

Spring 用三个 Map 来解决循环依赖，每个 Map 有不同的职责：

```java
// DefaultSingletonBeanRegistry 中的三级缓存
// 第一级：完全初始化好的 Bean（可以直接使用的成品）
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

// 第二级：提前暴露的半成品 Bean（已经实例化，但还没注入属性）
private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);

// 第三级：Bean 的工厂对象（用来生成早期 Bean 的工厂）
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
```

**三级缓存的作用：**

| 缓存级别 | 名称 | 存储内容 | 作用 |
|---------|------|---------|------|
| 一级 | singletonObjects | 完整的 Bean | 存放已经完全初始化好的 Bean，可以直接使用 |
| 二级 | earlySingletonObjects | 早期 Bean | 存放提前暴露的半成品 Bean，用于解决循环依赖 |
| 三级 | singletonFactories | Bean 工厂 | 存放 Bean 的工厂对象，用来生成早期 Bean |

**通俗类比：**

把三级缓存想象成**餐厅的出菜流程**：

1. **三级缓存（singletonFactories）**：菜谱
   - 记录了怎么做菜，但菜还没开始做
   - 需要的时候可以根据菜谱做出菜来

2. **二级缓存（earlySingletonObjects）**：半成品菜
   - 菜已经做了一部分，可以提前给其他菜当配菜
   - 但还没完全做好，不能直接上桌

3. **一级缓存（singletonObjects）**：成品菜
   - 完全做好的菜，可以直接端给客人
   - 这是最终使用的缓存

### 6.2.3 解决循环依赖的完整流程

让我们通过源码看看 Spring 是如何解决 A 依赖 B，B 依赖 A 的循环依赖的：

```java
// 简化的创建流程
public Object getSingleton(String beanName) {
    // 1. 先从一级缓存找（成品 Bean）
    Object singletonObject = this.singletonObjects.get(beanName);
    
    // 2. 如果一级缓存没有，且 Bean 正在创建中（说明有循环依赖）
    if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
        // 3. 从二级缓存找（早期 Bean）
        singletonObject = this.earlySingletonObjects.get(beanName);
        
        // 4. 如果二级缓存也没有
        if (singletonObject == null) {
            // 5. 从三级缓存找（Bean 工厂）
            ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
            if (singletonFactory != null) {
                // 6. 通过工厂生成早期 Bean
                singletonObject = singletonFactory.getObject();
                // 7. 放入二级缓存，删除三级缓存
                this.earlySingletonObjects.put(beanName, singletonObject);
                this.singletonFactories.remove(beanName);
            }
        }
    }
    
    return singletonObject;
}
```

**完整流程图解：**

```
1. Spring 开始创建 ServiceA
   ↓
2. ServiceA 实例化（调用构造函数，得到半成品 A）
   ↓
3. 把 A 的工厂放入三级缓存：singletonFactories.put("serviceA", () -> A)
   ↓
4. ServiceA 开始注入属性，发现需要 ServiceB
   ↓
5. Spring 开始创建 ServiceB
   ↓
6. ServiceB 实例化（调用构造函数，得到半成品 B）
   ↓
7. 把 B 的工厂放入三级缓存：singletonFactories.put("serviceB", () -> B)
   ↓
8. ServiceB 开始注入属性，发现需要 ServiceA
   ↓
9. 从三级缓存获取 A 的工厂，调用 getObject() 得到早期 A
   ↓
10. 把早期 A 放入二级缓存，删除三级缓存的 A 工厂
    ↓
11. ServiceB 拿到早期 A，完成属性注入，ServiceB 创建完成
    ↓
12. ServiceB 放入一级缓存：singletonObjects.put("serviceB", 完整的 B)
    ↓
13. ServiceA 拿到完整的 B，完成属性注入，ServiceA 创建完成
    ↓
14. ServiceA 放入一级缓存：singletonObjects.put("serviceA", 完整的 A)
```

**通俗类比：**

就像两个厨师合作：
1. 厨师 A 开始做菜，但需要厨师 B 的配菜
2. 厨师 A 先把自己的半成品（早期 Bean）给厨师 B
3. 厨师 B 拿到半成品后，完成自己的菜
4. 厨师 B 把做好的菜给厨师 A
5. 厨师 A 拿到配菜后，完成自己的菜

### 6.2.4 为什么需要三级缓存？两级不行吗？

这是很多人会问的问题。答案是：**如果没有 AOP，两级缓存就够了；有了 AOP，必须三级缓存**。

**为什么需要第三级缓存（singletonFactories）？**

```java
// 第三级缓存存储的是 ObjectFactory，不是直接的 Bean
// 这样做的目的是为了支持 AOP 代理

// 在 createBean 时，会创建一个特殊的工厂
singletonFactories.put(beanName, new ObjectFactory<Object>() {
    public Object getObject() throws BeansException {
        // 这里可以生成代理对象
        Object earlyBean = createEarlyBean(beanName, mbd);
        // 如果有 AOP，这里返回代理对象；否则返回原始对象
        return getEarlyBeanReference(beanName, mbd, earlyBean);
    }
});
```

**通俗类比：**

- **两级缓存**：直接存储半成品菜（earlySingletonObjects）
  - 问题：如果这个菜需要特殊加工（AOP 代理），半成品可能不对
  
- **三级缓存**：存储菜谱（singletonFactories）
  - 好处：需要的时候可以根据菜谱做出不同的菜（原始对象或代理对象）
  - 如果有 AOP，菜谱会告诉你怎么做代理菜
  - 如果没有 AOP，菜谱就做普通菜

---

## 6.3 基础用法与逐行注释

### 6.3.1 循环依赖示例

```java
// 循环依赖示例：A 依赖 B，B 依赖 A
@Service
public class ServiceA {
    
    @Autowired
    private ServiceB serviceB;  // A 依赖 B
    
    public void methodA() {
        System.out.println("ServiceA 执行");
        serviceB.methodB();  // 调用 B 的方法
    }
    
    public void help() {
        System.out.println("ServiceA 帮助");
    }
}

@Service
public class ServiceB {
    
    @Autowired
    private ServiceA serviceA;  // B 依赖 A
    
    public void methodB() {
        System.out.println("ServiceB 执行");
        serviceA.help();  // 调用 A 的方法
    }
}

// ✅ Spring 可以解决这种字段注入的循环依赖
// 因为字段注入发生在 Bean 实例化之后，可以提前暴露半成品
```

### 6.3.2 构造器注入的循环依赖（无法解决）

```java
// ❌ 构造器注入的循环依赖无法解决
@Service
public class ServiceA {
    
    private final ServiceB serviceB;
    
    // 构造器注入：创建 A 时需要 B
    public ServiceA(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    
    private final ServiceA serviceA;
    
    // 构造器注入：创建 B 时需要 A
    public ServiceB(ServiceA serviceA) {
        this.serviceA = serviceA;
    }
}

// 启动报错：BeanCurrentlyInCreationException
// 原因：构造器注入发生在实例化阶段，此时还没有半成品可以暴露
```

**为什么构造器注入无法解决循环依赖？**

```java
// 创建 A 的流程：
// 1. 调用 A 的构造函数
// 2. 构造函数需要 B 作为参数
// 3. 但 B 还没创建，需要先创建 B
// 4. 创建 B 时，B 的构造函数需要 A
// 5. 但 A 正在创建中，陷入死循环

// 关键问题：构造器注入时，Bean 还没有实例化
// 没有半成品，就无法放入三级缓存
// 所以 Spring 无法解决构造器注入的循环依赖
```

**解决方案：**

```java
// ✅ 方案 1：使用 @Lazy 延迟加载
@Service
public class ServiceA {
    
    private final ServiceB serviceB;
    
    // @Lazy 会注入一个代理对象，真正使用时才初始化
    public ServiceA(@Lazy ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

// ✅ 方案 2：改用 Setter 注入或字段注入
@Service
public class ServiceA {
    
    @Autowired  // 字段注入可以解决循环依赖
    private ServiceB serviceB;
}
```

### 6.3.3 @Async 导致循环依赖失效

```java
// ❌ @Async 会导致循环依赖失败
@Service
public class ServiceA {
    
    @Autowired
    private ServiceB serviceB;
    
    @Async  // 异步方法
    public void asyncMethod() {
        System.out.println("异步执行");
    }
}

@Service
public class ServiceB {
    
    @Autowired
    private ServiceA serviceA;
}

// 启动报错：BeanCurrentlyInCreationException
```

**为什么 @Async 会导致循环依赖失败？**

```java
// 原因分析：

// 1. 正常情况下的循环依赖：
//    - A 实例化 → 放入三级缓存 → 注入属性时需要 B
//    - B 实例化 → 注入属性时需要 A → 从三级缓存获取 A 的早期引用
//    - B 完成 → A 拿到 B → A 完成

// 2. 加了 @Async 后的情况：
//    - A 实例化 → 放入三级缓存 → 注入属性时需要 B
//    - B 实例化 → 注入属性时需要 A
//    - 从三级缓存获取 A 时，需要生成代理对象（因为 @Async）
//    - 但代理对象的生成时机不对，导致获取的不是同一个对象
//    - Spring 检测到不一致，抛出异常

// 源码层面的原因：
// @Async 会创建代理，代理对象在 BeanPostProcessor 中生成
// 但三级缓存中的早期引用是原始对象
// 当从三级缓存获取时，如果生成了代理，和早期引用不一致
// Spring 会认为这是一个错误
```

**解决方案：**

```java
// ✅ 方案 1：避免循环依赖（最佳实践）
// 重新设计代码结构，打破循环

// ✅ 方案 2：使用 @Lazy
@Service
public class ServiceA {
    @Autowired
    @Lazy  // 延迟加载，注入代理对象
    private ServiceB serviceB;
}

// ✅ 方案 3：重构代码，提取公共逻辑到第三个类
@Service
public class CommonService {
    // 把 A 和 B 都需要的逻辑放到这里
}

@Service
public class ServiceA {
    @Autowired
    private CommonService commonService;
}

@Service
public class ServiceB {
    @Autowired
    private CommonService commonService;
}
```

---

## 6.4 源码深度解析

### 6.4.1 getSingleton 方法详解

```java
// DefaultSingletonBeanRegistry 中的核心方法
protected Object getSingleton(String beanName, boolean allowEarlyReference) {
    // 1. 快速检查：从一级缓存获取
    Object singletonObject = this.singletonObjects.get(beanName);
    
    // 2. 如果一级缓存没有，且 Bean 正在创建中
    if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
        // 3. 从二级缓存获取
        singletonObject = this.earlySingletonObjects.get(beanName);
        
        // 4. 如果二级缓存也没有，且允许早期引用
        if (singletonObject == null && allowEarlyReference) {
            // 5. 加锁，保证线程安全
            synchronized (this.singletonObjects) {
                // 6. 双重检查
                singletonObject = this.singletonObjects.get(beanName);
                if (singletonObject == null) {
                    singletonObject = this.earlySingletonObjects.get(beanName);
                    if (singletonObject == null) {
                        // 7. 从三级缓存获取工厂
                        ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
                        if (singletonFactory != null) {
                            // 8. 调用工厂生成早期 Bean
                            singletonObject = singletonFactory.getObject();
                            // 9. 放入二级缓存
                            this.earlySingletonObjects.put(beanName, singletonObject);
                            // 10. 删除三级缓存
                            this.singletonFactories.remove(beanName);
                        }
                    }
                }
            }
        }
    }
    return singletonObject;
}
```

**关键点解析：**

1. **为什么需要双重检查（double-check）？**
   - 第一次检查：快速路径，避免不必要的同步
   - 第二次检查：防止多线程重复创建

2. **为什么从三级缓存移到二级缓存？**
   - 三级缓存的工厂只能调用一次 getObject()
   - 移到二级缓存后，后续可以直接获取，不需要再调用工厂

3. **allowEarlyReference 参数的作用？**
   - 控制是否允许获取早期引用
   - 在某些场景下（如依赖检查），不允许获取早期引用

### 6.4.2 addSingletonFactory 方法

```java
// 在 Bean 实例化后，添加到三级缓存
protected void addSingletonFactory(String beanName, ObjectFactory<?> singletonFactory) {
    synchronized (this.singletonObjects) {
        // 如果一级缓存没有，才添加到三级缓存
        if (!this.singletonObjects.containsKey(beanName)) {
            this.singletonFactories.put(beanName, singletonFactory);
            this.earlySingletonObjects.remove(beanName);
            registerSingleton(beanName);
        }
    }
}

// 在 AbstractAutowireCapableBeanFactory 中的调用时机
protected Object doCreateBean(String beanName, RootBeanDefinition mbd, Object[] args) {
    // 1. 实例化 Bean
    BeanWrapper instanceWrapper = createBeanInstance(beanName, mbd, args);
    Object bean = instanceWrapper.getWrappedInstance();
    
    // 2. 添加到三级缓存（如果允许早期引用）
    if (mbd.isSingleton() && allowEarlyReference) {
        addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
    }
    
    // 3. 属性注入（这里可能触发循环依赖）
    populateBean(beanName, mbd, instanceWrapper);
    
    // 4. 初始化 Bean
    exposedObject = initializeBean(beanName, bean, mbd);
    
    return exposedObject;
}
```

### 6.4.3 getEarlyBeanReference 方法

```java
// 获取早期 Bean 引用，支持 AOP 代理
protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
    Object earlyRef = bean;
    
    // 如果有 SmartInstantiationAwareBeanPostProcessor（如 AOP）
    for (BeanPostProcessor bp : getBeanPostProcessors()) {
        if (bp instanceof SmartInstantiationAwareBeanPostProcessor) {
            SmartInstantiationAwareBeanPostProcessor ibp = 
                (SmartInstantiationAwareBeanPostProcessor) bp;
            // 生成早期引用（可能是代理对象）
            earlyRef = ibp.getEarlyBeanReference(earlyRef, beanName);
        }
    }
    
    return earlyRef;
}
```

**这就是为什么需要三级缓存的原因：**

- 如果没有 AOP，三级缓存的工厂直接返回原始对象
- 如果有 AOP，三级缓存的工厂会生成代理对象
- 这样保证了循环依赖时拿到的是正确的对象（代理或原始）

---

## 6.5 对比表格

### 6.5.1 三级缓存对比

| 缓存级别 | Map 名称 | 存储内容 | 放入时机 | 取出时机 | 作用 |
|---------|---------|---------|---------|---------|------|
| 一级 | singletonObjects | 完整的 Bean | Bean 创建完成后 | 获取 Bean 时 | 存放成品 Bean |
| 二级 | earlySingletonObjects | 早期 Bean | 从三级缓存获取时 | 循环依赖时 | 存放半成品 Bean |
| 三级 | singletonFactories | Bean 工厂 | Bean 实例化后 | 首次被循环依赖引用时 | 生成早期 Bean |

### 6.5.2 不同注入方式的循环依赖解决情况

| 注入方式 | 能否解决循环依赖 | 原因 |
|---------|----------------|------|
| 字段注入 | ✅ 可以 | 实例化后可以暴露半成品 |
| Setter 注入 | ✅ 可以 | 实例化后可以暴露半成品 |
| 构造器注入 | ❌ 不能 | 实例化时就需要依赖，没有半成品 |
| @Lazy + 构造器 | ✅ 可以 | 注入代理对象，延迟初始化 |

### 6.5.3 循环依赖场景分析

| 场景 | 是否报错 | 原因 |
|------|---------|------|
| A→B→A（字段注入） | ✅ 不报错 | 三级缓存解决 |
| A→B→A（构造器注入） | ❌ 报错 | 无法暴露半成品 |
| A→B→A（@Async） | ❌ 报错 | 代理对象不一致 |
| A→B→C→A | ✅ 不报错 | 三级缓存解决 |
| 自依赖（A→A） | ❌ 报错 | 特殊处理，不允许 |

---

## 6.6 新手常见误区

### 误区 1：Spring 可以解决所有循环依赖

```java
// ❌ 错误认知：Spring 能解决所有循环依赖
@Service
public class ServiceA {
    public ServiceA(ServiceB serviceB) {  // 构造器注入
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    public ServiceB(ServiceA serviceA) {  // 构造器注入
        this.serviceA = serviceA;
    }
}

// 启动报错：BeanCurrentlyInCreationException
// 原因：构造器注入的循环依赖无法解决
```

**真相**：Spring 只能解决**单例模式**下的**字段注入**和 **Setter 注入**的循环依赖。构造器注入的循环依赖无法解决。

### 误区 2：循环依赖不是问题，不用管

```java
// ❌ 错误认知：循环依赖没什么影响
@Service
public class ServiceA {
    @Autowired
    private ServiceB serviceB;
}

@Service
public class ServiceB {
    @Autowired
    private ServiceA serviceA;
}

// 虽然能运行，但问题很多：
// 1. 代码设计有问题，职责不清晰
// 2. 启动时间变长（需要三级缓存处理）
// 3. 可能出现意想不到的 bug
// 4. 难以理解和维护
```

**真相**：循环依赖是设计问题，应该通过重构代码来避免，而不是依赖 Spring 的机制。

### 误区 3：三级缓存是为了性能优化

```java
// ❌ 错误认知：三级缓存是为了提高性能
// 实际上：三级缓存是为了解决循环依赖，不是为了性能

// 一级缓存：存放成品 Bean（性能优化）
// 二级缓存：存放半成品 Bean（解决循环依赖）
// 三级缓存：存放 Bean 工厂（支持 AOP 代理）

// 如果没有循环依赖，只需要一级缓存
// 如果没有 AOP，两级缓存就够
// 三级缓存的存在是为了同时支持循环依赖和 AOP
```

**真相**：三级缓存的核心目的是**支持 AOP 代理**的同时**解决循环依赖**。这是一个巧妙的设计，但不是为了性能。

### 误区 4：@Async 导致循环依赖失败是 bug

```java
// ❌ 错误认知：@Async 导致循环依赖失败是 Spring 的 bug
// 实际上：这是设计如此，不是 bug

// 原因：
// 1. @Async 会创建代理对象
// 2. 代理对象在 BeanPostProcessor 中生成
// 3. 三级缓存中的早期引用是原始对象
// 4. 当循环依赖时，需要生成代理对象
// 5. 但代理对象和早期引用不一致，Spring 检测到错误

// 这是 Spring 的保护机制，防止出现不一致的对象引用
```

**真相**：@Async 导致循环依赖失败是 Spring 的**保护机制**，防止出现对象引用不一致的问题。

### 误区 5：prototype 作用域的循环依赖也能解决

```java
// ❌ 错误认知：prototype 作用域也能解决循环依赖
@Service
@Scope("prototype")  // 原型模式
public class ServiceA {
    @Autowired
    private ServiceB serviceB;
}

@Service
@Scope("prototype")
public class ServiceB {
    @Autowired
    private ServiceA serviceA;
}

// 启动报错：BeanCurrentlyInCreationException
// 原因：prototype 作用域不使用三级缓存
```

**真相**：Spring 只对**单例模式**的 Bean 解决循环依赖。prototype 作用域的 Bean 每次都是新创建，不使用三级缓存，所以无法解决循环依赖。

---

## 6.7 动手练习

### 练习 1：验证循环依赖

**题目**：创建两个 Service，形成循环依赖（A 依赖 B，B 依赖 A），验证 Spring 能否正常启动。然后改成构造器注入，观察报错信息。

<details>
<summary>点击查看答案</summary>

```java
// 1. 字段注入的循环依赖（可以解决）
@Service
public class ServiceA {
    @Autowired
    private ServiceB serviceB;  // A 依赖 B
    
    public void methodA() {
        System.out.println("ServiceA 执行");
    }
    
    public ServiceB getServiceB() {
        return serviceB;
    }
}

@Service
public class ServiceB {
    @Autowired
    private ServiceA serviceA;  // B 依赖 A
    
    public void methodB() {
        System.out.println("ServiceB 执行");
    }
    
    public ServiceA getServiceA() {
        return serviceA;
    }
}

// 测试代码
@SpringBootTest
public class CircularDependencyTest {
    @Autowired
    private ServiceA serviceA;
    
    @Autowired
    private ServiceB serviceB;
    
    @Test
    public void testCircularDependency() {
        // ✅ 字段注入可以正常启动
        assertNotNull(serviceA.getServiceB());
        assertNotNull(serviceB.getServiceA());
    }
}

// 2. 构造器注入的循环依赖（无法解决）
@Service
public class ServiceA {
    private final ServiceB serviceB;
    
    public ServiceA(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    private final ServiceA serviceA;
    
    public ServiceB(ServiceA serviceA) {
        this.serviceA = serviceA;
    }
}

// 启动报错：
// BeanCurrentlyInCreationException: Error creating bean with name 'serviceA': 
// Requested bean is currently in creation: Is there an unresolvable circular reference?
```

</details>

### 练习 2：使用 @Lazy 解决构造器循环依赖

**题目**：有两个类形成构造器注入的循环依赖，使用 @Lazy 注解解决这个问题。

<details>
<summary>点击查看答案</summary>

```java
// 1. 使用 @Lazy 延迟加载
@Service
public class ServiceA {
    private final ServiceB serviceB;
    
    // @Lazy 会注入一个代理对象，真正使用时才初始化
    public ServiceA(@Lazy ServiceB serviceB) {
        this.serviceB = serviceB;
    }
    
    public void methodA() {
        System.out.println("ServiceA 执行");
        serviceB.methodB();  // 真正调用时才初始化 ServiceB
    }
}

@Service
public class ServiceB {
    private final ServiceA serviceA;
    
    public ServiceB(@Lazy ServiceA serviceA) {
        this.serviceA = serviceA;
    }
    
    public void methodB() {
        System.out.println("ServiceB 执行");
    }
}

// 2. 测试代码
@SpringBootTest
public class LazyCircularDependencyTest {
    @Autowired
    private ServiceA serviceA;
    
    @Test
    public void testLazyCircularDependency() {
        // ✅ 使用 @Lazy 可以正常启动
        serviceA.methodA();
    }
}

// @Lazy 的原理：
// 1. Spring 不会立即创建 ServiceB 的真实对象
// 2. 而是创建一个代理对象注入到 ServiceA
// 3. 当调用 serviceB.methodB() 时，代理对象才会初始化真实的 ServiceB
// 4. 这样就打破了循环依赖的链条
```

</details>

### 练习 3：重构代码消除循环依赖

**题目**：以下代码存在循环依赖，通过重构代码结构来消除循环依赖（不使用 Spring 的机制）。

```java
@Service
public class OrderService {
    @Autowired
    private PaymentService paymentService;
    
    public void createOrder(Order order) {
        // 创建订单
        paymentService.processPayment(order.getPayment());
    }
    
    public void cancelOrder(Order order) {
        // 取消订单时需要退款
        paymentService.refund(order.getPayment());
    }
}

@Service
public class PaymentService {
    @Autowired
    private OrderService orderService;
    
    public void processPayment(Payment payment) {
        // 处理支付
    }
    
    public void refund(Payment payment) {
        // 退款时需要更新订单状态
        // orderService.updateStatus(payment.getOrderId(), "REFUNDED");
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
// 重构方案：提取公共逻辑到第三个类

// 1. 创建订单状态管理服务
@Service
public class OrderStatusService {
    public void updateStatus(String orderId, String status) {
        System.out.println("更新订单状态: " + orderId + " -> " + status);
    }
    
    public void markAsPaid(String orderId) {
        updateStatus(orderId, "PAID");
    }
    
    public void markAsRefunded(String orderId) {
        updateStatus(orderId, "REFUNDED");
    }
}

// 2. 重构 OrderService
@Service
public class OrderService {
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private OrderStatusService orderStatusService;
    
    public void createOrder(Order order) {
        // 创建订单
        paymentService.processPayment(order.getPayment());
        orderStatusService.markAsPaid(order.getId());
    }
    
    public void cancelOrder(Order order) {
        // 取消订单
        paymentService.refund(order.getPayment());
        orderStatusService.markAsRefunded(order.getId());
    }
}

// 3. 重构 PaymentService
@Service
public class PaymentService {
    // 不再依赖 OrderService，打破了循环依赖
    
    public void processPayment(Payment payment) {
        System.out.println("处理支付: " + payment.getId());
    }
    
    public void refund(Payment payment) {
        System.out.println("退款: " + payment.getId());
    }
}

// 重构后的依赖关系：
// OrderService -> PaymentService
// OrderService -> OrderStatusService
// PaymentService -> 无依赖
// 没有循环依赖了！
```

**重构原则**：
1. 识别循环依赖中的公共逻辑
2. 提取到独立的类中
3. 让原来的类依赖这个新类
4. 打破循环依赖链条

</details>

---

## 6.8 下一章预告

恭喜你学完了循环依赖与三级缓存！现在你已经理解了 Spring 是如何通过三级缓存巧妙解决循环依赖问题，也知道了为什么构造器注入和 @Async 会导致循环依赖失败。

但是，Spring 还有一个更强大的特性——**AOP（面向切面编程）**。你有没有想过，为什么加一个 @Transactional 注解就能自动管理事务？为什么加一个 @Async 注解就能异步执行？这些神奇的功能背后，都是 AOP 在起作用。

下一章我们会深入 **AOP 的底层实现原理**，看看 JDK 动态代理和 CGLIB 代理的区别，理解 ProxyFactory 是如何创建代理对象的，以及 Advisor 链的执行顺序。搞懂了这些，你就能自己实现各种神奇的切面功能了。
