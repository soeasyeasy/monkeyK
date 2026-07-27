---
title: "第7章：AOP 底层实现原理"
description: "深入理解 Spring AOP 的 JDK 动态代理、CGLIB 代理、ProxyFactory 与 Advisor 链的底层源码"
---

# 第7章：AOP 底层实现原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- AOP 到底是怎么实现的？为什么加个注解就能拦截方法？
- JDK 动态代理和 CGLIB 代理有什么区别？Spring 是怎么选择的？
- ProxyFactory 是怎么创建代理对象的？
- 多个切面的执行顺序是怎样的？Advisor 链是怎么工作的？

这一章我们会彻底搞懂 **AOP 的底层实现原理**，从源码层面理解代理对象的生成过程、切面的织入时机，以及 Advisor 链的执行机制。搞懂了这些，你就能真正掌握 AOP 的核心技术，遇到 AOP 相关问题也能自己排查。

---

## 1 为什么需要深入理解 AOP？

### 痛点分析

很多开发者用 AOP 只是停留在"加个 @Aspect 注解写切面"的层面，直到遇到这些问题才懵：

1. **代理对象调用失效**：同一个类中方法调用，AOP 不生效
2. **不知道用的哪种代理**：JDK 代理还是 CGLIB 代理？有什么区别？
3. **多切面顺序混乱**：多个切面的执行顺序不可控
4. **性能问题**：AOP 对性能有多大影响？怎么优化？
5. **事务失效**：@Transactional 为什么有时候不生效？

### 生活化类比

把 AOP 想象成**快递的分拣流程**：

- 原始包裹（目标对象）需要从发件人到收件人
- 但中间要经过多个检查站（切面）：安检、称重、扫码、消毒
- 每个检查站都有自己的职责，互不干扰
- 包裹依次经过所有检查站，最终到达目的地
- 如果想加一个新的检查站（新切面），不需要改动现有的流程

如果没有 AOP，每个业务方法都要自己写日志、事务、权限检查等代码，既重复又难以维护。AOP 就是把这些**横切关注点**提取出来，统一管理。

---

## 2 核心原理讲解

### 7.2.1 AOP 的核心概念

先理清 AOP 中的核心术语：

| 概念 | 英文 | 说明 | 类比 |
|------|------|------|------|
| 切面 | Aspect | 横切关注点的模块化 | 检查站 |
| 连接点 | JoinPoint | 程序执行的某个点（方法调用、异常抛出等） | 包裹经过的每个节点 |
| 切入点 | Pointcut | 匹配连接点的表达式 | 检查站的工作范围 |
| 通知 | Advice | 在连接点执行的动作 | 检查站的具体操作 |
| 目标对象 | Target | 被代理的对象 | 原始包裹 |
| 代理对象 | Proxy | 增强后的对象 | 经过检查的包裹 |
| 织入 | Weaving | 把切面应用到目标对象的过程 | 包裹过安检的过程 |

**通知类型（Advice）：**

```java
// 1. 前置通知（Before Advice）
// 在目标方法执行前执行
@Before("execution(* com.example.service.*.*(..))")
public void beforeAdvice(JoinPoint joinPoint) {
    System.out.println("方法执行前");
}

// 2. 后置通知（After Returning Advice）
// 在目标方法成功执行后执行
@AfterReturning(pointcut = "...", returning = "result")
public void afterReturningAdvice(JoinPoint joinPoint, Object result) {
    System.out.println("方法返回: " + result);
}

// 3. 异常通知（After Throwing Advice）
// 在目标方法抛出异常后执行
@AfterThrowing(pointcut = "...", throwing = "ex")
public void afterThrowingAdvice(JoinPoint joinPoint, Exception ex) {
    System.out.println("方法异常: " + ex.getMessage());
}

// 4. 最终通知（After Advice）
// 在目标方法执行后执行（无论成功还是异常）
@After("execution(* com.example.service.*.*(..))")
public void afterAdvice(JoinPoint joinPoint) {
    System.out.println("方法执行完毕");
}

// 5. 环绕通知（Around Advice）
// 最强大的通知，可以控制目标方法是否执行
@Around("execution(* com.example.service.*.*(..))")
public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
    System.out.println("方法执行前");
    Object result = pjp.proceed();  // 执行目标方法
    System.out.println("方法执行后");
    return result;
}
```

### 7.2.2 JDK 动态代理 vs CGLIB 代理

Spring AOP 有两种代理方式：**JDK 动态代理**和 **CGLIB 代理**。

**JDK 动态代理：**

```java
// JDK 动态代理的原理
// 1. 目标类必须实现接口
// 2. 通过反射生成接口的代理实现类
// 3. 代理类实现了目标接口，拦截方法调用

// 源码简化版
public class JdkDynamicAopProxy implements AopProxy, InvocationHandler {
    
    private final AdvisedSupport advised;  // 包含切面信息
    
    // 生成代理对象
    public Object getProxy() {
        Class<?> targetInterface = advised.getTargetSource().getInterfaces()[0];
        // 使用 Proxy.newProxyInstance 创建代理
        return Proxy.newProxyInstance(
            targetInterface.getClassLoader(),
            new Class<?>[] { targetInterface },
            this  // InvocationHandler
        );
    }
    
    // 拦截方法调用
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 1. 获取拦截器链
        List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method);
        
        // 2. 如果没有拦截器，直接调用目标方法
        if (chain.isEmpty()) {
            return invokeTargetMethod(method, args);
        }
        
        // 3. 创建方法拦截器并执行
        MethodInvocation invocation = new ReflectiveMethodInvocation(
            proxy, target, method, args, chain);
        return invocation.proceed();  // 执行拦截器链
    }
}
```

**通俗类比：**

JDK 动态代理就像**找替身演员**：
- 原演员（目标对象）会演戏（实现接口方法）
- 替身演员（代理对象）也会演戏，而且会按照剧本（拦截器链）表演
- 观众（调用者）看到的是替身在演戏，但以为是原演员
- 替身只能在原演员会的技能（接口方法）范围内表演

**CGLIB 代理：**

```java
// CGLIB 代理的原理
// 1. 目标类不需要实现接口
// 2. 通过继承目标类生成子类
// 3. 子类重写父类方法，拦截方法调用

// 源码简化版
public class CglibAopProxy implements AopProxy {
    
    private final AdvisedSupport advised;
    
    public Object getProxy() {
        Class<?> targetClass = advised.getTargetSource().getTargetClass();
        
        // 创建 Enhancer（CGLIB 的增强器）
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);  // 设置父类
        enhancer.setInterfaces(getProxiedInterfaces(advised));
        enhancer.setCallback(new DynamicAdvisedInterceptor(advised));
        
        // 生成代理类并创建实例
        return enhancer.create();
    }
    
    // CGLIB 的回调拦截器
    private static class DynamicAdvisedInterceptor implements MethodInterceptor {
        
        public Object intercept(Object proxy, Method method, Object[] args, 
                               MethodProxy methodProxy) throws Throwable {
            // 1. 获取拦截器链
            List<Object> chain = advised.getInterceptorsAndDynamicInterceptionAdvice(method);
            
            // 2. 创建方法拦截器并执行
            MethodInvocation invocation = new ReflectiveMethodInvocation(
                proxy, target, method, args, chain);
            return invocation.proceed();
        }
    }
}
```

**通俗类比：**

CGLIB 代理就像**收徒弟**：
- 师傅（目标对象）有各种技能（方法）
- 徒弟（代理对象）继承师傅的所有技能，但可以Override
- 徒弟在师傅的技能基础上加了自己的逻辑（拦截器）
- 徒弟可以比师傅多学一些技能（实现额外接口）
- 但师傅的 final 方法徒弟改不了（final 方法无法代理）

### 7.2.3 Spring 如何选择代理方式

```java
// DefaultAopProxyFactory 中的选择逻辑
public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
    // 1. 如果目标类是接口，使用 JDK 动态代理
    if (config.getInterfaces().size() > 0 || config.isProxyTargetClass()) {
        // 检查是否配置了 proxyTargetClass=true
        if (config.isProxyTargetClass()) {
            // 强制使用 CGLIB
            return new CglibAopProxy(config);
        }
        // 默认使用 JDK 代理
        return new JdkDynamicAopProxy(config);
    }
    
    // 2. 如果目标类没有实现接口，使用 CGLIB
    return new CglibAopProxy(config);
}
```

**选择规则：**

| 场景 | 代理方式 | 原因 |
|------|---------|------|
| 目标类实现了接口 | JDK 动态代理 | 默认行为，性能好 |
| 目标类没有实现接口 | CGLIB 代理 | 必须用继承方式 |
| proxyTargetClass=true | CGLIB 代理 | 强制使用 CGLIB |
| Spring Boot 2.x+ | CGLIB 代理 | 默认 proxyTargetClass=true |

### 7.2.4 ProxyFactory 创建流程

`ProxyFactory` 是 Spring AOP 的核心类，负责创建代理对象：

```java
// ProxyFactory 的使用示例
public class AopDemo {
    public static void main(String[] args) {
        // 1. 创建目标对象
        UserService target = new UserServiceImpl();
        
        // 2. 创建 ProxyFactory
        ProxyFactory proxyFactory = new ProxyFactory();
        proxyFactory.setTarget(target);  // 设置目标对象
        proxyFactory.addInterface(UserService.class);  // 设置接口
        
        // 3. 添加通知（Advice）
        proxyFactory.addAdvice(new MethodBeforeAdvice() {
            public void before(Method method, Object[] args, Object target) {
                System.out.println("前置通知: " + method.getName());
            }
        });
        
        // 4. 创建代理对象
        UserService proxy = (UserService) proxyFactory.getProxy();
        
        // 5. 调用代理对象的方法
        proxy.doSomething();  // 会触发前置通知
    }
}
```

**ProxyFactory 的创建流程源码：**

```java
// ProxyFactory 继承体系
// ProxyConfig -> AdvisedSupport -> ProxyFactory
// AdvisedSupport 包含了所有的代理配置：目标对象、接口、拦截器等

public class ProxyFactory extends ProxyCreatorSupport {
    
    public ProxyFactory(Object target) {
        setTarget(target);  // 设置目标对象
    }
    
    // 创建代理对象的核心方法
    public Object getProxy() {
        return createAopProxy().getProxy();
    }
    
    // 创建 AopProxy
    protected final AopProxy createAopProxy() {
        // 1. 获取代理配置
        AdvisedSupport config = this;
        
        // 2. 根据配置决定使用哪种代理方式
        AopProxy aopProxy = getDefaultAopProxyFactory().createAopProxy(config);
        
        return aopProxy;
    }
}
```

**通俗类比：**

ProxyFactory 就像**汽车改装厂**：
1. 你把一辆普通车（目标对象）送进去
2. 告诉改装师你要加什么配置（添加通知/拦截器）
3. 改装师根据你的要求改装（生成代理对象）
4. 改装后的车（代理对象）保留了原来的功能，还多了新功能

### 7.2.5 Advisor 链执行顺序

当有多个切面时，Spring 会把它们组织成一个**拦截器链（Advisor Chain）**，依次执行：

```java
// ReflectiveMethodInvocation 中的 proceed 方法
// 这是拦截器链执行的核心逻辑
public Object proceed() throws Throwable {
    // 如果所有拦截器都执行完了，执行目标方法
    if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
        return invokeJoinpoint();  // 调用目标方法
    }
    
    // 获取下一个拦截器
    Object interceptorOrInterceptionAdvice = 
        this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);
    
    // 如果是动态拦截器（需要运行时匹配）
    if (interceptorOrInterceptionAdvice instanceof InterceptorAndDynamicMethodMatcher) {
        InterceptorAndDynamicMethodMatcher mdmatch = 
            (InterceptorAndDynamicMethodMatcher) interceptorOrInterceptionAdvice;
        
        // 运行时参数匹配
        if (mdmatch.methodMatcher.matches(this.method, this.targetClass, this.arguments)) {
            // 匹配成功，执行拦截器
            return ((MethodInterceptor) mdmatch.interceptor).invoke(this);
        } else {
            // 匹配失败，跳过这个拦截器，执行下一个
            return proceed();
        }
    } else {
        // 普通拦截器，直接执行
        return ((MethodInterceptor) interceptorOrInterceptionAdvice).invoke(this);
    }
}
```

**通俗类比：**

拦截器链就像**过安检**：
1. 包裹（方法调用）进入安检通道
2. 第一个检查站（拦截器1）检查
3. 检查通过后，交给第二个检查站（拦截器2）
4. 依次经过所有检查站
5. 最后到达目的地（目标方法）
6. 返回时再反向经过所有检查站

**多切面执行顺序：**

```java
// 切面 1
@Aspect
@Order(1)  // 优先级 1
public class Aspect1 {
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("Aspect1 前置");
        Object result = pjp.proceed();
        System.out.println("Aspect1 后置");
        return result;
    }
}

// 切面 2
@Aspect
@Order(2)  // 优先级 2
public class Aspect2 {
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("Aspect2 前置");
        Object result = pjp.proceed();
        System.out.println("Aspect2 后置");
        return result;
    }
}

// 执行顺序：
// Aspect1 前置 -> Aspect2 前置 -> 目标方法 -> Aspect2 后置 -> Aspect1 后置
// 就像洋葱模型：外层切面前置先执行，后置后执行
```

---

## 3 基础用法与逐行注释

### 7.3.1 使用 @Aspect 定义切面

```java
// 1. 定义目标接口
public interface UserService {
    void addUser(String username);
    String getUser(String id);
}

// 2. 实现类
@Service
public class UserServiceImpl implements UserService {
    @Override
    public void addUser(String username) {
        System.out.println("添加用户: " + username);
    }
    
    @Override
    public String getUser(String id) {
        System.out.println("查询用户: " + id);
        return "User-" + id;
    }
}

// 3. 定义切面
@Aspect  // 标记为切面类
@Component  // 必须交给 Spring 管理
public class LogAspect {
    
    // 定义切入点：匹配 UserService 的所有方法
    @Pointcut("execution(* com.example.service.UserService.*(..))")
    public void userServicePointcut() {}
    
    // 前置通知
    @Before("userServicePointcut()")
    public void beforeAdvice(JoinPoint joinPoint) {
        // joinPoint 包含方法信息：方法名、参数等
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        System.out.println("[前置通知] 方法: " + methodName + ", 参数: " + Arrays.toString(args));
    }
    
    // 后置通知
    @AfterReturning(pointcut = "userServicePointcut()", returning = "result")
    public void afterReturningAdvice(JoinPoint joinPoint, Object result) {
        System.out.println("[后置通知] 方法: " + joinPoint.getSignature().getName() 
                         + ", 返回值: " + result);
    }
    
    // 异常通知
    @AfterThrowing(pointcut = "userServicePointcut()", throwing = "ex")
    public void afterThrowingAdvice(JoinPoint joinPoint, Throwable ex) {
        System.out.println("[异常通知] 方法: " + joinPoint.getSignature().getName() 
                         + ", 异常: " + ex.getMessage());
    }
    
    // 最终通知
    @After("userServicePointcut()")
    public void afterAdvice(JoinPoint joinPoint) {
        System.out.println("[最终通知] 方法: " + joinPoint.getSignature().getName() + " 执行完毕");
    }
    
    // 环绕通知（最强大）
    @Around("userServicePointcut()")
    public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();  // 记录开始时间
        System.out.println("[环绕通知-前] 开始执行");
        
        Object result = pjp.proceed();  // 执行目标方法
        
        long end = System.currentTimeMillis();  // 记录结束时间
        System.out.println("[环绕通知-后] 执行耗时: " + (end - start) + "ms");
        
        return result;  // 返回目标方法的返回值
    }
}
```

### 7.3.2 切入点表达式详解

```java
// 切入点表达式语法：execution(修饰符 返回类型 类名.方法名(参数) 异常)

// 1. 匹配所有 public 方法
@Pointcut("execution(public * *(..))")

// 2. 匹配 service 包下所有类的所有方法
@Pointcut("execution(* com.example.service.*.*(..))")

// 3. 匹配 service 包及其子包下所有类的所有方法
@Pointcut("execution(* com.example.service..*.*(..))")

// 4. 匹配所有以 find 开头的方法
@Pointcut("execution(* *..find*(..))")

// 5. 匹配所有有两个参数的方法
@Pointcut("execution(* *(*, *))")

// 6. 匹配指定注解的方法
@Pointcut("@annotation(com.example.Log)")

// 7. 匹配指定注解的类的所有方法
@Pointcut("@within(com.example.Service)")

// 8. 组合切入点
@Pointcut("userServicePointcut() || orderServicePointcut()")
public void allServicePointcut() {}

// 9. 使用 && 和 || 组合
@Pointcut("execution(* com.example.service.*.*(..)) && @annotation(com.example.Log)")
public void logPointcut() {}
```

### 7.3.3 自定义注解切面

```java
// 1. 定义自定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Log {
    String value() default "";  // 日志描述
}

// 2. 定义切面
@Aspect
@Component
public class LogAnnotationAspect {
    
    // 匹配所有标注了 @Log 注解的方法
    @Around("@annotation(log)")
    public Object around(ProceedingJoinPoint pjp, Log log) throws Throwable {
        String methodName = pjp.getSignature().getName();
        String description = log.value();
        
        System.out.println("[日志] 开始执行: " + description);
        long start = System.currentTimeMillis();
        
        try {
            Object result = pjp.proceed();  // 执行目标方法
            System.out.println("[日志] 执行成功: " + description);
            return result;
        } catch (Throwable ex) {
            System.out.println("[日志] 执行失败: " + description + ", 异常: " + ex.getMessage());
            throw ex;
        } finally {
            long end = System.currentTimeMillis();
            System.out.println("[日志] 耗时: " + (end - start) + "ms");
        }
    }
}

// 3. 使用自定义注解
@Service
public class OrderService {
    
    @Log("创建订单")
    public void createOrder(Order order) {
        System.out.println("创建订单: " + order.getId());
    }
    
    @Log("查询订单")
    public Order getOrder(String orderId) {
        System.out.println("查询订单: " + orderId);
        return new Order(orderId);
    }
}
```

### 7.3.4 强制使用 CGLIB 代理

```java
// 方式 1：配置类中设置
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)  // 强制使用 CGLIB
public class AopConfig {
}

// 方式 2：Spring Boot 配置（application.properties）
// spring.aop.proxy-target-class=true

// 方式 3：针对特定 Bean
@Configuration
public class ProxyConfig {
    @Bean
    public ProxyFactory proxyFactory() {
        ProxyFactory factory = new ProxyFactory();
        factory.setTarget(new UserServiceImpl());
        factory.setProxyTargetClass(true);  // 强制使用 CGLIB
        return factory;
    }
}
```

---

## 4 代理对象生成过程详解

### 7.4.1 BeanPostProcessor 介入时机

Spring 在 Bean 初始化后，会通过 `AnnotationAwareAspectJAutoProxyCreator` 来创建代理：

```java
// AnnotationAwareAspectJAutoProxyCreator 的核心逻辑
// 它实现了 BeanPostProcessor 接口，在 Bean 初始化后介入

public class AnnotationAwareAspectJAutoProxyCreator extends AspectJAwareAdvisorAutoProxyCreator {
    
    // 在 Bean 初始化后调用
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // 如果这个 Bean 需要被代理，创建代理对象
        return wrapIfNecessary(bean, beanName);
    }
    
    // 判断是否需要代理，如果需要则创建代理
    protected Object wrapIfNecessary(Object bean, String beanName) {
        // 1. 获取适用于这个 Bean 的 Advisor（切面）
        List<Advisor> advisors = findAdvisorsThatCanApply(bean.getClass(), beanName);
        
        // 2. 如果没有 Advisor，不需要代理
        if (advisors.isEmpty()) {
            return bean;
        }
        
        // 3. 创建代理对象
        return createProxy(bean, beanName, advisors);
    }
    
    // 创建代理对象
    protected Object createProxy(Object bean, String beanName, List<Advisor> advisors) {
        // 1. 创建 ProxyFactory
        ProxyFactory proxyFactory = new ProxyFactory();
        
        // 2. 配置 ProxyFactory
        proxyFactory.copyFrom(this);  // 复制配置
        proxyFactory.setTarget(bean);  // 设置目标对象
        proxyFactory.addAdvisors(advisors);  // 添加所有 Advisor
        
        // 3. 创建代理
        return proxyFactory.getProxy();
    }
}
```

**通俗类比：**

这个过程就像**产品出厂前的质检**：
1. 产品生产出来（Bean 初始化完成）
2. 质检员（AnnotationAwareAspectJAutoProxyCreator）检查
3. 如果这个产品需要特殊包装（有 Advisor），就包装一下（创建代理）
4. 包装后的产品（代理对象）交给用户使用

### 7.4.2 拦截器链的构建

```java
// 构建拦截器链的过程
private List<Object> getInterceptorsAndDynamicInterceptionAdvice(Method method) {
    List<Object> interceptionList = new ArrayList<>();
    
    // 遍历所有的 Advisor
    for (Advisor advisor : this.advisors) {
        // 1. 如果是 MethodInterceptor 类型的 Advisor
        if (advisor instanceof PointcutAdvisor) {
            PointcutAdvisor pointcutAdvisor = (PointcutAdvisor) advisor;
            
            // 2. 检查切入点是否匹配当前方法
            if (pointcutAdvisor.getPointcut().getMethodMatcher().matches(method)) {
                // 3. 匹配成功，获取拦截器
                MethodInterceptor interceptor = (MethodInterceptor) advisor.getAdvice();
                
                // 4. 检查是否是动态匹配（需要运行时参数）
                if (pointcutAdvisor.getPointcut().getMethodMatcher() 
                        instanceof DynamicMethodMatcher) {
                    // 动态匹配，需要运行时检查参数
                    interceptionList.add(new InterceptorAndDynamicMethodMatcher(
                        interceptor, pointcutAdvisor.getPointcut().getMethodMatcher()));
                } else {
                    // 静态匹配，直接添加
                    interceptionList.add(interceptor);
                }
            }
        }
    }
    
    return interceptionList;
}
```

---

## 5 对比表格

### 7.5.1 JDK 动态代理 vs CGLIB 代理

| 对比项 | JDK 动态代理 | CGLIB 代理 |
|--------|-------------|-----------|
| 依赖 | JDK 内置 | 需要引入 CGLIB 库 |
| 目标类要求 | 必须实现接口 | 不需要实现接口 |
| 代理原理 | 实现目标接口 | 继承目标类 |
| 性能 | 反射调用，较慢 | FastClass 机制，较快 |
| 创建时间 | 快 | 慢（需要生成字节码） |
| 能否代理 final 方法 | 能（接口方法） | 不能（final 无法重写） |
| 能否代理 final 类 | 能（接口实现） | 不能（final 无法继承） |
| Spring 默认 | 有接口时默认 | 无接口或 proxyTargetClass=true |
| 内存占用 | 较少 | 较多（生成子类） |

### 7.5.2 五种通知类型对比

| 通知类型 | 注解 | 执行时机 | 能否访问返回值 | 能否阻止目标方法 | 使用场景 |
|---------|------|---------|--------------|----------------|---------|
| 前置通知 | @Before | 目标方法执行前 | 否 | 否（只能抛异常） | 参数校验、日志 |
| 后置通知 | @AfterReturning | 目标方法成功后 | 是 | 否 | 结果处理、日志 |
| 异常通知 | @AfterThrowing | 目标方法异常后 | 否（只能访问异常） | 否 | 异常处理、告警 |
| 最终通知 | @After | 目标方法执行后 | 否 | 否 | 资源清理 |
| 环绕通知 | @Around | 目标方法前后 | 是 | 是（最灵活） | 性能监控、事务 |

### 7.5.3 切入点表达式关键字

| 关键字 | 说明 | 示例 |
|--------|------|------|
| execution | 匹配方法执行 | execution(* com.example.service.*.*(..)) |
| @annotation | 匹配指定注解的方法 | @annotation(com.example.Log) |
| @within | 匹配指定注解的类的所有方法 | @within(com.example.Service) |
| @args | 匹配参数类型有指定注解的方法 | @args(com.example.MyArg) |
| @target | 匹配目标对象有指定注解的方法 | @target(com.example.Service) |
| within | 匹配指定类或包内的所有方法 | within(com.example.service.*) |
| bean | 匹配指定 Bean 名称 | bean(userService) |

---

## 6 新手常见误区

### 误区 1：同一个类中方法调用会触发 AOP

```java
@Service
public class UserService {
    
    @Log("查询用户")
    public User getUser(String id) {
        // 业务逻辑
        return new User(id);
    }
    
    public void processUser(String id) {
        // ❌ 错误认知：这里调用 getUser 会触发 @Log 切面
        User user = this.getUser(id);  // 直接调用，不经过代理！
        // 实际上不会触发切面，因为是 this 调用，不是代理对象调用
    }
}

// ✅ 正确做法：通过代理对象调用
@Service
public class UserService implements ApplicationContextAware {
    private ApplicationContext context;
    
    @Override
    public void setApplicationContext(ApplicationContext context) {
        this.context = context;
    }
    
    @Log("查询用户")
    public User getUser(String id) {
        return new User(id);
    }
    
    public void processUser(String id) {
        // ✅ 通过代理对象调用
        UserService proxy = context.getBean(UserService.class);
        User user = proxy.getUser(id);  // 这样会触发切面
    }
}
```

**原因**：AOP 是通过代理对象实现的。同一个类内部的方法调用是 this 调用，不经过代理对象，所以不会触发切面。

### 误区 2：JDK 代理比 CGLIB 代理快

```java
// ❌ 错误认知：JDK 代理性能更好
// 实际上：
// 1. JDK 代理使用反射调用，每次方法调用都要通过反射
// 2. CGLIB 使用 FastClass 机制，直接调用方法，避免了反射
// 3. 在方法调用频繁的场景，CGLIB 性能更好
// 4. 但 CGLIB 生成代理类的时间较长

// 结论：
// - 创建代理对象：JDK 快
// - 方法调用：CGLIB 快
// - 综合来看：CGLIB 更适合大多数场景
// - 这也是 Spring Boot 默认使用 CGLIB 的原因
```

### 误区 3：@Aspect 类不需要注册为 Bean

```java
// ❌ 错误写法：切面类没有注册为 Bean
@Aspect
public class LogAspect {  // 没有 @Component！
    @Before("...")
    public void before() {
        System.out.println("前置通知");
    }
}

// 这样切面不会生效！因为 Spring 不知道这个切面的存在

// ✅ 正确写法：必须注册为 Bean
@Aspect
@Component  // 或者 @Service、@Bean 等方式
public class LogAspect {
    @Before("...")
    public void before() {
        System.out.println("前置通知");
    }
}
```

### 误区 4：所有方法都能被代理

```java
// ❌ 错误认知：所有方法都能被 AOP 拦截
@Service
public class UserService {
    
    // private 方法无法被代理
    @Log
    private void privateMethod() {
        System.out.println("私有方法");
    }
    
    // final 方法无法被 CGLIB 代理
    @Log
    public final void finalMethod() {
        System.out.println("final 方法");
    }
    
    // static 方法无法被代理
    @Log
    public static void staticMethod() {
        System.out.println("静态方法");
    }
    
    // 构造方法无法被代理
    @Log
    public UserService() {
        System.out.println("构造方法");
    }
}

// 只有 public 非 final 非 static 的方法才能被代理
```

### 误区 5：切入点表达式写错了不会报错

```java
// ❌ 错误写法：切入点表达式语法错误
@Pointcut("execution(* com.example.service.*.*(..)")  // 缺少右括号
public void wrongPointcut() {}

// 可能不会立即报错，但切面不会生效
// 或者在运行时抛出 IllegalArgumentException

// ✅ 正确做法：仔细检查表达式，使用 IDE 的提示功能
@Pointcut("execution(* com.example.service.*.*(..))")
public void correctPointcut() {}
```

---

## 7 动手练习

### 练习 1：实现方法执行耗时统计切面

**题目**：创建一个切面，统计所有 Service 类方法的执行耗时，并在控制台输出方法名和耗时。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义切面
@Aspect
@Component
public class PerformanceAspect {
    
    // 切入点：匹配所有 Service 类的方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void servicePointcut() {}
    
    // 环绕通知：统计耗时
    @Around("servicePointcut()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().toShortString();
        long start = System.currentTimeMillis();
        
        try {
            Object result = pjp.proceed();  // 执行目标方法
            return result;
        } finally {
            long end = System.currentTimeMillis();
            long duration = end - start;
            System.out.println("[性能监控] " + methodName + " 耗时: " + duration + "ms");
            
            // 如果耗时超过阈值，记录警告
            if (duration > 1000) {
                System.out.println("[警告] 方法执行过慢: " + methodName);
            }
        }
    }
}

// 2. 使用示例
@Service
public class UserService {
    public void slowMethod() {
        try {
            Thread.sleep(1500);  // 模拟慢方法
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}

// 调用 slowMethod() 会输出：
// [性能监控] UserService.slowMethod(..) 耗时: 1500ms
// [警告] 方法执行过慢: UserService.slowMethod(..)
```

</details>

### 练习 2：实现基于自定义注解的权限检查

**题目**：创建 @RequireRole 注解和对应的切面，在方法执行前检查当前用户是否有指定角色。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String value();  // 需要的角色
}

// 2. 定义切面
@Aspect
@Component
public class RoleCheckAspect {
    
    // 模拟当前用户角色（实际项目中从 Session/Token 获取）
    private String currentUserRole = "admin";
    
    @Around("@annotation(requireRole)")
    public Object checkRole(ProceedingJoinPoint pjp, RequireRole requireRole) throws Throwable {
        String requiredRole = requireRole.value();
        
        // 检查角色
        if (!hasRole(requiredRole)) {
            throw new SecurityException("权限不足，需要角色: " + requiredRole 
                                      + ", 当前角色: " + currentUserRole);
        }
        
        // 权限通过，执行目标方法
        return pjp.proceed();
    }
    
    private boolean hasRole(String requiredRole) {
        return currentUserRole.equals(requiredRole);
    }
}

// 3. 使用示例
@Service
public class AdminService {
    
    @RequireRole("admin")  // 需要 admin 角色
    public void adminOnly() {
        System.out.println("管理员操作");
    }
    
    @RequireRole("superadmin")  // 需要 superadmin 角色
    public void superAdminOnly() {
        System.out.println("超级管理员操作");
    }
}

// 调用 adminOnly() 正常执行
// 调用 superAdminOnly() 抛出 SecurityException
```

</details>

### 练习 3：实现多切面执行顺序验证

**题目**：创建三个切面，分别标注 @Order(1)、@Order(2)、@Order(3)，验证它们的执行顺序。

<details>
<summary>点击查看答案</summary>

```java
// 切面 1
@Aspect
@Component
@Order(1)
public class Aspect1 {
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("Aspect1 前置");
        Object result = pjp.proceed();
        System.out.println("Aspect1 后置");
        return result;
    }
}

// 切面 2
@Aspect
@Component
@Order(2)
public class Aspect2 {
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("Aspect2 前置");
        Object result = pjp.proceed();
        System.out.println("Aspect2 后置");
        return result;
    }
}

// 切面 3
@Aspect
@Component
@Order(3)
public class Aspect3 {
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("Aspect3 前置");
        Object result = pjp.proceed();
        System.out.println("Aspect3 后置");
        return result;
    }
}

// 执行顺序：
// Aspect1 前置
// Aspect2 前置
// Aspect3 前置
// 目标方法
// Aspect3 后置
// Aspect2 后置
// Aspect1 后置

// 规律：
// - @Order 值越小，优先级越高
// - 前置通知：Order 从小到大执行
// - 后置通知：Order 从大到小执行（像洋葱模型）
```

</details>

---

## 8 下一章预告

恭喜你学完了 AOP 的底层实现原理！现在你已经理解了 JDK 动态代理和 CGLIB 代理的区别，知道了 ProxyFactory 是如何创建代理对象的，也掌握了 Advisor 链的执行顺序。

但是，AOP 最重要的应用之一就是**事务管理**。你有没有想过，为什么加一个 @Transactional 注解就能自动管理事务？它背后的原理是什么？事务传播行为是怎么实现的？为什么有时候 @Transactional 会失效？

下一章我们会深入 **Spring 事务管理的底层原理**，看看 PlatformTransactionManager 体系是如何工作的，TransactionInterceptor 是如何拦截方法的，以及 @Transactional 失效的 8 大场景。搞懂了这些，你就能真正掌握事务管理的核心技术了。
