---
title: "第十二章：动态代理原理"
description: "深入理解 JDK 动态代理、CGLIB 代理及 AOP 底层原理"
---

# 第十二章：动态代理原理

## 本章导读

本章将带你深入理解动态代理的底层原理。我们会从最基础的代理模式开始，搞懂静态代理的局限性，然后深入 JDK 动态代理的源码，看看 `$Proxy` 类是如何在运行时被生成的。接着学习 CGLIB 如何通过继承和 ASM 字节码生成实现代理，对比两种代理方式的优劣，最后了解 Spring AOP 是如何选择代理方式的。

学完本章，你将能够：
- 理解代理模式的作用和静态代理的局限
- 掌握 JDK 动态代理的底层原理
- 理解 CGLIB 代理的实现机制
- 对比 JDK 代理和 CGLIB 代理的优劣
- 了解 Spring AOP 如何选择代理方式
- 手写简单的动态代理实现

## 1 为什么需要动态代理？

### 生活中的类比

想象你要买房子：

**自己买房（不用代理）：** 你亲自跑楼盘、谈价格、办手续——费时费力。

**找中介买房（静态代理）：** 中介帮你完成所有流程，但你只能找某一个特定的中介，而且每个楼盘都要找不同的中介——不够灵活。

**找智能代理平台（动态代理）：** 你告诉平台"我要买房"，平台自动帮你匹配最合适的中介、处理所有手续、还能顺便帮你办贷款、装修——一个平台搞定所有事。

### 技术层面的需求

在开发中，我们经常需要在不修改原有代码的情况下，给方法添加额外功能：

```java
// 原始业务类
public class UserService {
    public void addUser(String name) {
        System.out.println("添加用户：" + name);
        // 实际业务逻辑...
    }
}

// 需求：在 addUser 执行前后添加日志和事务管理
// 方案1：直接修改 UserService（违反开闭原则）
// 方案2：创建子类重写方法（只能继承，不够灵活）
// 方案3：使用代理（推荐！）
```

**动态代理的典型应用场景：**
1. **Spring AOP**：事务管理、日志记录、权限检查
2. **RPC 框架**：Dubbo 通过动态代理生成远程调用的客户端
3. **MyBatis**：Mapper 接口通过动态代理生成实现类
4. **Mock 框架**：Mockito 通过动态代理生成 Mock 对象

## 2 核心原理

### 12.2.1 代理模式基础

代理模式的核心思想：为其他对象提供一种代理以控制对这个对象的访问。

```
┌─────────────────────────────────────────┐
│              代理模式结构                 │
│                                         │
│  ┌──────────────┐                       │
│  │   Subject    │ ← 接口                │
│  │  (抽象主题)   │                       │
│  └──────────────┘                       │
│         ↑                               │
│    ┌────┴────┐                          │
│    │         │                          │
│  ┌─┴──────┐ ┌┴─────────┐              │
│  │RealSubj│ │ Proxy    │              │
│  │ect     │ │ (代理)    │              │
│  │(真实主题)│ │          │              │
│  └────────┘ └──────────┘              │
│                ↑                      │
│           包含对 RealSubject 的引用     │
└─────────────────────────────────────────┘
```

#### 静态代理

```java
// 1. 定义接口
interface IUserService {
    void addUser(String name);
    void deleteUser(int id);
}

// 2. 真实主题：业务类
class UserService implements IUserService {
    @Override
    public void addUser(String name) {
        System.out.println("添加用户：" + name);
    }

    @Override
    public void deleteUser(int id) {
        System.out.println("删除用户：" + id);
    }
}

// 3. 代理类：静态代理
class UserServiceProxy implements IUserService {
    private IUserService target; // 持有真实对象的引用

    public UserServiceProxy(IUserService target) {
        this.target = target;
    }

    @Override
    public void addUser(String name) {
        // 前置增强：添加日志
        System.out.println("[日志] 开始执行 addUser 方法");
        // 调用真实方法
        target.addUser(name);
        // 后置增强：添加日志
        System.out.println("[日志] addUser 方法执行完成");
    }

    @Override
    public void deleteUser(int id) {
        System.out.println("[日志] 开始执行 deleteUser 方法");
        target.deleteUser(id);
        System.out.println("[日志] deleteUser 方法执行完成");
    }
}

// 使用
public class StaticProxyDemo {
    public static void main(String[] args) {
        // 创建真实对象
        IUserService userService = new UserService();
        // 创建代理对象
        IUserService proxy = new UserServiceProxy(userService);
        // 调用代理对象的方法
        proxy.addUser("张三");
        // 输出：
        // [日志] 开始执行 addUser 方法
        // 添加用户：张三
        // [日志] addUser 方法执行完成
    }
}
```

**静态代理的问题：**

1. **代码冗余**：每个接口方法都要在代理类中重写
2. **不够灵活**：代理类在编译时就确定了，无法动态改变
3. **维护成本高**：接口新增方法时，代理类也要跟着改

这就是为什么需要**动态代理**——在运行时动态生成代理类，不需要手动编写。

### 12.2.2 JDK 动态代理原理

JDK 动态代理通过 `java.lang.reflect.Proxy` 类和 `java.lang.reflect.InvocationHandler` 接口实现：

```
核心流程：
1. 定义 InvocationHandler，实现 invoke() 方法
2. 调用 Proxy.newProxyInstance() 创建代理对象
3. 代理对象的方法调用会被转发到 InvocationHandler.invoke()
```

**底层原理：**

```
Proxy.newProxyInstance() 执行过程：

1. 根据目标对象的接口列表，动态生成一个代理类的字节码
   类名格式：$Proxy0、$Proxy1、$Proxy2...
   
2. 代理类继承 java.lang.reflect.Proxy，实现目标的所有接口
   例如：public class $Proxy0 implements IUserService { ... }
   
3. 代理类中为接口的每个方法生成对应的实现
   每个方法内部调用 InvocationHandler.invoke()
   
4. 加载代理类的字节码，创建代理实例
```

**生成的代理类源码（反编译后）：**

```java
// JDK 动态生成的代理类（简化版）
public final class $Proxy0 extends Proxy implements IUserService {
    // 持有 InvocationHandler 引用（继承自 Proxy 父类）
    // private InvocationHandler h;
    
    // 静态字段：保存方法对象的引用
    private static Method addUser$12345;
    private static Method deleteUser$67890;
    
    // 构造函数
    public $Proxy0(InvocationHandler h) {
        super(h); // 调用父类 Proxy 的构造函数，保存 h
    }
    
    // 实现接口方法
    public final void addUser(String name) {
        try {
            // 把方法调用转发给 InvocationHandler
            h.invoke(this, addUser$12345, new Object[]{name});
        } catch (RuntimeException | Error e) {
            throw e;
        } catch (Throwable e) {
            throw new UndeclaredThrowableException(e);
        }
    }
    
    public final void deleteUser(int id) {
        try {
            h.invoke(this, deleteUser$67890, new Object[]{id});
        } catch (RuntimeException | Error e) {
            throw e;
        } catch (Throwable e) {
            throw new UndeclaredThrowableException(e);
        }
    }
}
```

**关键点：**
1. 代理类继承 `Proxy`，所以 JDK 代理只能代理接口
2. 所有方法调用都转发给 `InvocationHandler.invoke()`
3. 代理类在运行时动态生成，编译后不存在 `.java` 文件

### 12.2.3 CGLIB 代理原理

CGLIB（Code Generation Library）通过继承目标类并生成子类实现代理：

```
CGLIB 代理流程：

1. 查找目标类的所有非 final 方法
2. 生成目标类的子类（继承目标类）
3. 使用 ASM 字节码操作框架，在子类中重写目标方法
4. 在重写的方法中添加方法拦截逻辑
5. 调用 MethodInterceptor.intercept() 处理
```

**CGLIB 生成的代理类（简化版）：**

```java
// CGLIB 动态生成的代理类（简化版）
public class UserService$$EnhancerByCGLIB$$12345 extends UserService {
    // 持有 MethodInterceptor 引用
    private MethodInterceptor interceptor;
    
    // 重写目标方法
    @Override
    public void addUser(String name) {
        Method method = UserService.class.getMethod("addUser", String.class);
        Object[] args = new Object[]{name};
        
        // 调用拦截器
        Object result = interceptor.intercept(this, method, args, 
                new MethodProxy());
        
        // 如果没有拦截器，调用父类（真实对象）的方法
        if (result == null) {
            super.addUser(name);
        }
    }
}
```

**CGLIB 的特点：**
1. 通过继承实现，所以不能代理 final 类和 final 方法
2. 使用 ASM 字节码框架生成代理类，性能较好
3. 不需要目标类实现接口

### 12.2.4 JDK 代理 vs CGLIB 对比

| 对比项 | JDK 动态代理 | CGLIB 代理 |
|--------|-------------|-----------|
| 实现方式 | 实现接口 | 继承目标类 |
| 是否需要接口 | 必须 | 不需要 |
| 代理 final 类/方法 | 不能 | 不能 |
| 性能（创建） | 较快 | 较慢（需要生成子类字节码） |
| 性能（调用） | 较慢（反射调用） | 较快（FastClass 机制） |
| 依赖 | JDK 自带 | 需要第三方库 |
| Spring 默认 | 有接口时默认 | 无接口时默认 |
| 典型框架 | Dubbo、RMI | Spring AOP（无接口时） |

### 12.2.5 Spring AOP 如何选择代理方式

Spring AOP 根据目标类是否实现接口来选择代理方式：

```
Spring AOP 选择逻辑：

if (目标类实现了至少一个接口) {
    if (配置强制使用 CGLIB) {
        使用 CGLIB 代理;
    } else {
        使用 JDK 动态代理;  // 默认
    }
} else {
    使用 CGLIB 代理;  // 没有接口，只能用 CGLIB
}

Spring Boot 2.x 之后：
- 默认使用 CGLIB 代理（即使有接口）
- 可以通过 spring.aop.proxy-target-class=false 切换回 JDK 代理
```

**为什么 Spring Boot 默认使用 CGLIB？**

1. **兼容性更好**：不需要目标类实现接口
2. **性能更好**：CGLIB 的 FastClass 机制比 JDK 反射快
3. **避免问题**：JDK 代理返回的是接口类型，可能导致类型转换问题

### 12.2.6 动态代理的应用场景

#### 1. 事务管理

```java
// 使用动态代理实现事务管理
class TransactionProxy implements InvocationHandler {
    private Object target;
    
    public Object bind(Object target) {
        this.target = target;
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                this);
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Connection conn = null;
        try {
            conn = DataSourceUtil.getConnection();
            conn.setAutoCommit(false); // 开启事务
            
            Object result = method.invoke(target, args); // 执行业务方法
            
            conn.commit(); // 提交事务
            return result;
        } catch (Exception e) {
            conn.rollback(); // 回滚事务
            throw e;
        } finally {
            conn.close();
        }
    }
}
```

#### 2. 日志记录

```java
// 使用动态代理记录方法调用日志
class LogProxy implements InvocationHandler {
    private Object target;
    
    public Object bind(Object target) {
        this.target = target;
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                this);
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        long startTime = System.currentTimeMillis();
        System.out.println("[LOG] 调用方法：" + method.getName() + 
                "，参数：" + Arrays.toString(args));
        
        Object result = method.invoke(target, args);
        
        long endTime = System.currentTimeMillis();
        System.out.println("[LOG] 方法执行完成，耗时：" + (endTime - startTime) + "ms");
        
        return result;
    }
}
```

#### 3. 权限检查

```java
// 使用动态代理进行权限检查
class AuthProxy implements InvocationHandler {
    private Object target;
    
    public Object bind(Object target) {
        this.target = target;
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                this);
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 检查方法上是否有 @RequiresRole 注解
        RequiresRole annotation = method.getAnnotation(RequiresRole.class);
        if (annotation != null) {
            String requiredRole = annotation.value();
            String currentRole = SecurityContext.getCurrentRole();
            
            if (!requiredRole.equals(currentRole)) {
                throw new SecurityException("权限不足，需要角色：" + requiredRole);
            }
        }
        
        return method.invoke(target, args);
    }
}

// 自定义注解
@interface RequiresRole {
    String value();
}
```

## 3 基础用法

### 12.3.1 JDK 动态代理完整示例

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

// 1. 定义接口
interface HelloService {
    void sayHello(String name);
    String greet(String message);
}

// 2. 实现类
class HelloServiceImpl implements HelloService {
    @Override
    public void sayHello(String name) {
        System.out.println("Hello, " + name + "!");
    }

    @Override
    public String greet(String message) {
        return "Greeting: " + message;
    }
}

// 3. 实现 InvocationHandler
class LogInvocationHandler implements InvocationHandler {
    private Object target; // 目标对象

    public LogInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 前置处理
        System.out.println("[前置] 调用方法：" + method.getName());
        System.out.println("[前置] 参数：" + java.util.Arrays.toString(args));

        // 调用目标方法
        Object result = method.invoke(target, args);

        // 后置处理
        System.out.println("[后置] 方法执行完成");
        if (result != null) {
            System.out.println("[后置] 返回值：" + result);
        }

        return result;
    }
}

// 4. 测试
public class JdkProxyDemo {
    public static void main(String[] args) {
        // 创建目标对象
        HelloService target = new HelloServiceImpl();

        // 创建 InvocationHandler
        InvocationHandler handler = new LogInvocationHandler(target);

        // 创建代理对象
        HelloService proxy = (HelloService) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),  // 类加载器
                target.getClass().getInterfaces(),   // 代理类要实现的接口
                handler                               // 调用处理器
        );

        // 调用代理对象的方法
        proxy.sayHello("张三");
        System.out.println("---");
        String result = proxy.greet("Good morning");
        System.out.println("最终结果：" + result);

        // 查看代理类的名称
        System.out.println("代理类名称：" + proxy.getClass().getName());
        // 输出类似：com.sun.proxy.$Proxy0
    }
}
```

### 12.3.2 CGLIB 代理完整示例

```java
import org.springframework.cglib.proxy.Enhancer;
import org.springframework.cglib.proxy.MethodInterceptor;
import org.springframework.cglib.proxy.MethodProxy;
import java.lang.reflect.Method;

// 1. 目标类（不需要实现接口）
class UserService {
    public void addUser(String name) {
        System.out.println("添加用户：" + name);
    }

    public void deleteUser(int id) {
        System.out.println("删除用户：" + id);
    }

    // final 方法不能被代理
    public final void finalMethod() {
        System.out.println("这是 final 方法");
    }
}

// 2. 实现 MethodInterceptor
class UserServiceInterceptor implements MethodInterceptor {
    @Override
    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
        // 前置处理
        System.out.println("[CGLIB 前置] 方法：" + method.getName());

        // 调用目标方法
        // 注意：这里使用 proxy.invokeSuper()，不是 method.invoke()
        Object result = proxy.invokeSuper(obj, args);

        // 后置处理
        System.out.println("[CGLIB 后置] 方法执行完成");

        return result;
    }
}

// 3. 测试
public class CglibProxyDemo {
    public static void main(String[] args) {
        // 创建 Enhancer（CGLIB 的增强器）
        Enhancer enhancer = new Enhancer();

        // 设置父类（目标类）
        enhancer.setSuperclass(UserService.class);

        // 设置回调（方法拦截器）
        enhancer.setCallback(new UserServiceInterceptor());

        // 创建代理对象
        UserService proxy = (UserService) enhancer.create();

        // 调用代理对象的方法
        proxy.addUser("李四");
        System.out.println("---");
        proxy.deleteUser(1);

        // final 方法不会被代理
        proxy.finalMethod();

        // 查看代理类名称
        System.out.println("代理类名称：" + proxy.getClass().getName());
        // 输出类似：UserService$$EnhancerByCGLIB$$12345
    }
}
```

### 12.3.3 手写简单的动态代理

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

// 手写一个简单的动态代理工具类
public class SimpleProxyFactory {

    /**
     * 创建代理对象
     * @param target 目标对象
     * @param before 前置处理逻辑
     * @param after 后置处理逻辑
     * @return 代理对象
     */
    public static Object createProxy(Object target, Runnable before, Runnable after) {
        // 获取目标对象的接口
        Class<?>[] interfaces = target.getClass().getInterfaces();

        if (interfaces.length == 0) {
            throw new IllegalArgumentException("目标对象必须实现至少一个接口");
        }

        // 创建 InvocationHandler
        InvocationHandler handler = (proxy, method, args) -> {
            // 执行前置逻辑
            if (before != null) {
                before.run();
            }

            // 调用目标方法
            Object result = method.invoke(target, args);

            // 执行后置逻辑
            if (after != null) {
                after.run();
            }

            return result;
        };

        // 创建并返回代理对象
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                interfaces,
                handler
        );
    }

    // 测试
    public static void main(String[] args) {
        // 目标对象
        Runnable target = () -> System.out.println("执行业务逻辑");

        // 创建代理
        Runnable proxy = (Runnable) createProxy(
                target,
                () -> System.out.println("【前置】准备执行"),
                () -> System.out.println("【后置】执行完成")
        );

        // 调用代理
        proxy.run();
        // 输出：
        // 【前置】准备执行
        // 执行业务逻辑
        // 【后置】执行完成
    }
}
```

## 4 进阶用法

### 12.4.1 动态代理的性能优化

```java
// JDK 动态代理性能优化
// 1. 缓存 Method 对象，避免重复反射
class CachedInvocationHandler implements InvocationHandler {
    private Object target;
    private Map<String, Method> methodCache = new HashMap<>();

    public CachedInvocationHandler(Object target) {
        this.target = target;
        // 预加载所有方法
        for (Method m : target.getClass().getMethods()) {
            methodCache.put(m.getName(), m);
        }
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 使用缓存的方法对象
        Method cachedMethod = methodCache.get(method.getName());
        return cachedMethod.invoke(target, args);
    }
}

// CGLIB 性能优化
// 使用 FastClass 机制，避免反射调用
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(UserService.class);
enhancer.setCallback(new MethodInterceptor() {
    @Override
    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
        // 使用 FastClass，比反射快
        return proxy.invokeSuper(obj, args);
    }
});
```

### 12.4.2 多条件代理选择

```java
// 根据条件动态选择 JDK 代理或 CGLIB 代理
public class ProxyFactory {

    public static <T> T createProxy(T target, InvocationHandler handler) {
        Class<?> targetClass = target.getClass();

        // 如果目标类实现了接口，使用 JDK 代理
        if (targetClass.getInterfaces().length > 0) {
            return (T) Proxy.newProxyInstance(
                    targetClass.getClassLoader(),
                    targetClass.getInterfaces(),
                    handler
            );
        }

        // 否则使用 CGLIB 代理
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);
        enhancer.setCallback((MethodInterceptor) (obj, method, args, proxy) -> {
            return handler.invoke(obj, method, args);
        });
        return (T) enhancer.create();
    }
}
```

## 5 核心知识点总结

| 知识点 | 核心要点 |
|--------|----------|
| 代理模式 | 为对象提供代理以控制访问，分静态代理和动态代理 |
| 静态代理 | 编译时确定，代码冗余，维护成本高 |
| JDK 动态代理 | 基于接口，运行时生成 $Proxy 类，通过 InvocationHandler 转发调用 |
| CGLIB 代理 | 基于继承，运行时生成子类，通过 MethodInterceptor 拦截调用 |
| 代理类生成 | JDK 用反射生成字节码，CGLIB 用 ASM 框架生成字节码 |
| Spring AOP 选择 | 有接口默认 JDK 代理，无接口用 CGLIB，Spring Boot 2.x 后默认 CGLIB |
| 应用场景 | 事务、日志、权限、RPC、Mock 等 |
| 限制 | JDK 代理必须实现接口，CGLIB 不能代理 final 类/方法 |

## 6 新手常见误区

### 误区 1：JDK 动态代理比 CGLIB 慢

**错误理解：** JDK 动态代理使用反射，所以一定比 CGLIB 慢。

**正确理解：** 这个结论不准确。JDK 动态代理在**创建代理对象**时确实比 CGLIB 快（不需要生成子类字节码），但在**方法调用**时，CGLIB 通过 FastClass 机制避免了反射，所以更快。实际性能差异取决于具体场景：如果代理对象创建频繁，JDK 可能更快；如果方法调用频繁，CGLIB 更快。现代 JDK 对反射有优化（如 MethodHandle），性能差距在缩小。

### 误区 2：CGLIB 可以代理任何类

**错误理解：** CGLIB 可以代理所有类，没有限制。

**正确理解：** CGLIB 通过继承实现代理，所以有以下限制：
1. **不能代理 final 类**：final 类不能被继承
2. **不能代理 final 方法**：final 方法不能被重写
3. **不能代理 private 方法**：private 方法对子类不可见
4. **构造函数不会被代理**：CGLIB 代理会调用目标类的无参构造函数

### 误区 3：动态代理生成的类可以被 GC 回收

**错误理解：** 动态代理生成的类和其他类一样，可以被 GC 正常回收。

**正确理解：** 动态代理生成的类由自定义类加载器加载，只有当这个类加载器被 GC 回收时，代理类才会被回收。如果代理类被频繁创建（如在循环中不断调用 `Proxy.newProxyInstance()`），可能导致方法区（元空间）内存泄漏。解决办法：缓存代理类或复用 InvocationHandler，避免反复生成新的代理类。

### 误区 4：代理对象和目标对象是同一个类型

**错误理解：** `proxy instanceof UserService` 返回 true，代理对象和目标对象类型完全一样。

**正确理解：** JDK 动态代理生成的代理类名是 `$Proxy0`，它实现了目标接口但不是目标类的实例。CGLIB 生成的代理类是目标类的子类，所以 `proxy instanceof UserService` 返回 true，但 `proxy.getClass() != UserService.class`。在使用 `getClass()` 做类型判断时要注意这个区别。

### 误区 5：Spring AOP 中同类方法调用会导致代理失效

**错误理解：** 在同一个类中，方法 A 调用方法 B，B 上的事务/权限注解会生效。

**正确理解：** Spring AOP 基于代理实现，外部调用的是代理对象的方法。但类内部的方法调用使用的是 `this`（目标对象本身），不经过代理，所以 B 方法上的注解不会生效。解决方案：
1. 把方法 B 抽到另一个 Bean 中
2. 通过 `AopContext.currentProxy()` 获取代理对象（需开启 `exposeProxy=true`）
3. 自己注入自己（不推荐）

## 7 动手练习

### 练习 1：实现一个性能监控代理

使用 JDK 动态代理实现一个通用的性能监控工具：
1. 记录每个方法的执行时间
2. 如果方法执行时间超过阈值（如 100ms），打印警告日志
3. 支持同时代理多个不同的目标对象

<details>
<summary>点击查看答案</summary>

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

// 性能监控处理器
class PerformanceHandler implements InvocationHandler {
    private Object target;       // 目标对象
    private long warnThreshold;  // 警告阈值（毫秒）

    public PerformanceHandler(Object target, long warnThreshold) {
        this.target = target;
        this.warnThreshold = warnThreshold;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        long startTime = System.currentTimeMillis(); // 记录开始时间

        try {
            // 调用目标方法
            Object result = method.invoke(target, args);
            return result;
        } finally {
            long elapsed = System.currentTimeMillis() - startTime; // 计算耗时

            if (elapsed > warnThreshold) {
                // 超过阈值，打印警告
                System.out.println("[警告] " + target.getClass().getSimpleName()
                        + "." + method.getName() + "() 耗时 " + elapsed + "ms"
                        + "，超过阈值 " + warnThreshold + "ms");
            } else {
                // 正常耗时，打印调试信息
                System.out.println("[信息] " + target.getClass().getSimpleName()
                        + "." + method.getName() + "() 耗时 " + elapsed + "ms");
            }
        }
    }
}

// 代理工厂：创建带性能监控的代理对象
class PerformanceProxyFactory {
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target, long warnThreshold) {
        return (T) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                new PerformanceHandler(target, warnThreshold)
        );
    }
}

// 测试接口和实现
interface Calculator {
    int add(int a, int b);
    int slowCalculate(int n);
}

class CalculatorImpl implements Calculator {
    @Override
    public int add(int a, int b) {
        return a + b; // 快速操作
    }

    @Override
    public int slowCalculate(int n) {
        try {
            Thread.sleep(200); // 模拟耗时操作
        } catch (InterruptedException e) {}
        return n * n;
    }
}

// 测试
public class PerformanceProxyDemo {
    public static void main(String[] args) {
        // 创建代理对象，阈值设为 100ms
        Calculator calc = PerformanceProxyFactory.createProxy(
                new CalculatorImpl(), 100);

        calc.add(1, 2);          // 快速方法，不会触发警告
        calc.slowCalculate(10);  // 慢方法，超过 100ms 会打印警告
    }
}
```
</details>

### 练习 2：实现一个支持重试的代理

使用 JDK 动态代理实现一个重试代理：
1. 目标方法抛出异常时，自动重试指定次数
2. 每次重试间隔递增（如 1s、2s、3s）
3. 超过重试次数后抛出最后一次异常

<details>
<summary>点击查看答案</summary>

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

// 重试处理器
class RetryHandler implements InvocationHandler {
    private Object target;     // 目标对象
    private int maxRetries;    // 最大重试次数

    public RetryHandler(Object target, int maxRetries) {
        this.target = target;
        this.maxRetries = maxRetries;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        int attempt = 0;        // 当前尝试次数
        Throwable lastException = null; // 记录最后一次异常

        while (attempt <= maxRetries) {
            try {
                // 调用目标方法
                return method.invoke(target, args);
            } catch (Exception e) {
                // 获取真实异常（InvocationTargetException 需要解包）
                lastException = e.getCause() != null ? e.getCause() : e;
                attempt++;

                if (attempt <= maxRetries) {
                    // 还没超过重试次数，等待后重试
                    long waitTime = attempt * 1000L; // 递增等待：1s, 2s, 3s...
                    System.out.println("[重试] " + method.getName()
                            + " 第 " + attempt + " 次失败，"
                            + waitTime + "ms 后重试...");
                    Thread.sleep(waitTime);
                }
            }
        }

        // 超过重试次数，抛出最后一次异常
        System.out.println("[失败] " + method.getName()
                + " 重试 " + maxRetries + " 次后仍然失败");
        throw lastException;
    }
}

// 重试代理工厂
class RetryProxyFactory {
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target, int maxRetries) {
        return (T) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                new RetryHandler(target, maxRetries)
        );
    }
}

// 测试
interface RemoteService {
    String callRemote() throws Exception;
}

class UnstableRemoteService implements RemoteService {
    private int failCount = 0; // 失败计数

    @Override
    public String callRemote() throws Exception {
        failCount++;
        if (failCount <= 2) {
            // 前两次调用抛异常
            throw new RuntimeException("网络超时（第 " + failCount + " 次）");
        }
        // 第三次成功
        return "调用成功！";
    }
}

public class RetryProxyDemo {
    public static void main(String[] args) throws Exception {
        RemoteService service = RetryProxyFactory.createProxy(
                new UnstableRemoteService(), 3);

        try {
            String result = service.callRemote();
            System.out.println("结果：" + result);
        } catch (Exception e) {
            System.out.println("最终失败：" + e.getMessage());
        }
    }
}
```
</details>

### 练习 3：手写一个简单的代理框架（支持链式调用）

实现一个简单的代理框架，支持：
1. 添加多个前置处理器（如日志、权限、事务）
2. 添加多个后置处理器
3. 处理器按添加顺序依次执行
4. 类似 Netty 的 Pipeline 设计

<details>
<summary>点击查看答案</summary>

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;

// 拦截器接口
interface Interceptor {
    // 前置处理，返回 true 继续执行，false 中断
    boolean before(Object target, Method method, Object[] args);
    // 后置处理
    void after(Object target, Method method, Object[] args, Object result);
}

// 日志拦截器
class LogInterceptor implements Interceptor {
    @Override
    public boolean before(Object target, Method method, Object[] args) {
        System.out.println("[日志] 调用 " + method.getName());
        return true; // 继续执行
    }

    @Override
    public void after(Object target, Method method, Object[] args, Object result) {
        System.out.println("[日志] " + method.getName() + " 执行完成");
    }
}

// 权限拦截器
class AuthInterceptor implements Interceptor {
    @Override
    public boolean before(Object target, Method method, Object[] args) {
        System.out.println("[权限] 检查权限...");
        // 模拟权限检查通过
        return true;
    }

    @Override
    public void after(Object target, Method method, Object[] args, Object result) {
        System.out.println("[权限] 操作已记录审计日志");
    }
}

// 事务拦截器
class TransactionInterceptor implements Interceptor {
    @Override
    public boolean before(Object target, Method method, Object[] args) {
        System.out.println("[事务] 开启事务");
        return true;
    }

    @Override
    public void after(Object target, Method method, Object[] args, Object result) {
        System.out.println("[事务] 提交事务");
    }
}

// 代理构建器：支持链式添加拦截器
class ProxyBuilder {
    private Object target;
    private List<Interceptor> interceptors = new ArrayList<>();

    public ProxyBuilder(Object target) {
        this.target = target;
    }

    // 链式添加拦截器
    public ProxyBuilder addInterceptor(Interceptor interceptor) {
        interceptors.add(interceptor);
        return this; // 返回 this 支持链式调用
    }

    // 构建代理对象
    @SuppressWarnings("unchecked")
    public <T> T build() {
        return (T) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                new PipelineHandler(target, interceptors)
        );
    }
}

// Pipeline 处理器：按顺序执行所有拦截器
class PipelineHandler implements InvocationHandler {
    private Object target;
    private List<Interceptor> interceptors;

    public PipelineHandler(Object target, List<Interceptor> interceptors) {
        this.target = target;
        this.interceptors = interceptors;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 执行所有前置处理
        for (Interceptor interceptor : interceptors) {
            if (!interceptor.before(target, method, args)) {
                // 某个拦截器返回 false，中断执行
                System.out.println("[中断] " + method.getName() + " 被拦截器中断");
                return null;
            }
        }

        // 执行目标方法
        Object result = method.invoke(target, args);

        // 执行所有后置处理（倒序）
        for (int i = interceptors.size() - 1; i >= 0; i--) {
            interceptors.get(i).after(target, method, args, result);
        }

        return result;
    }
}

// 测试
interface OrderService {
    void createOrder(String orderId);
}

class OrderServiceImpl implements OrderService {
    @Override
    public void createOrder(String orderId) {
        System.out.println("  → 创建订单：" + orderId);
    }
}

public class PipelineProxyDemo {
    public static void main(String[] args) {
        // 链式构建代理，添加多个拦截器
        OrderService proxy = new ProxyBuilder(new OrderServiceImpl())
                .addInterceptor(new LogInterceptor())       // 第一层：日志
                .addInterceptor(new AuthInterceptor())      // 第二层：权限
                .addInterceptor(new TransactionInterceptor()) // 第三层：事务
                .build();

        // 调用代理方法
        proxy.createOrder("ORD-001");
        // 输出顺序：
        // [日志] 调用 createOrder
        // [权限] 检查权限...
        // [事务] 开启事务
        //   → 创建订单：ORD-001
        // [事务] 提交事务
        // [权限] 操作已记录审计日志
        // [日志] createOrder 执行完成
    }
}
```
</details>

## 下一章预告

下一章我们将进入 **并发编程** 的世界。线程的生命周期是怎样的？synchronized 的底层原理是什么？volatile 如何保证可见性？线程池的核心参数有哪些？敬请期待！