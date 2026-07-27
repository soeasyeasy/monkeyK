---
title: "第五章：注解原理"
description: "元注解、注解处理器、运行时注解解析"
---

# 第五章：注解原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 注解到底是什么？它和注释有什么区别？
- 注解是怎么工作的？为什么加了个 `@Override` 编译器就能检查？
- 自定义注解有什么用？Spring 的 `@Autowired`、`@Service` 是怎么实现的？
- 注解在运行时还能读取吗？怎么读取？

这一章就是为了解答这些问题。我们会从注解的本质出发，搞清楚 **注解的底层实现原理**，再学习如何自定义注解和编写注解处理器，最后理解 Spring 框架是如何利用注解实现依赖注入的。

学完本章，你将能够：
- 清楚说出注解的本质和底层实现机制
- 掌握4种元注解的使用方法和作用
- 能够自定义注解并编写注解处理器
- 理解 Spring 注解驱动的核心原理

---

## 5.1 为什么需要注解？

### 痛点分析

想象一下这个场景：

你写了一个 Java 程序，里面有 100 个类。现在你需要：
1. 让某些类能被 Spring 管理
2. 让某些方法在事务中执行
3. 让某些字段自动注入依赖
4. 让某些方法在 Web 请求时触发

如果没有注解，你可能需要：
- 写大量的 XML 配置文件
- 在代码里写很多 if-else 判断
- 使用复杂的接口和继承体系

```java
// 没有注解时的做法 - 使用 XML 配置
// applicationContext.xml
<beans>
    <bean id="userService" class="com.example.UserService">
        <property name="userDao" ref="userDao"/>
    </bean>
    <bean id="userDao" class="com.example.UserDao"/>
</beans>

// 问题：配置和代码分离，维护困难
// 100 个类就要写 100 个 bean 配置
// 改个类名还要同时改 XML
```

**问题很明显**：
- 配置繁琐，维护成本高
- 配置和代码分离，容易不同步
- 缺乏类型安全，编译时无法检查
- 不够直观，看代码不知道它的作用

### 解决方案：注解

有了注解，就像给代码贴上了"标签"：

```java
// 使用注解后的做法
@Service  // 贴上"服务层"标签
public class UserService {
    
    @Autowired  // 贴上"自动注入"标签
    private UserDao userDao;
    
    @Transactional  // 贴上"事务管理"标签
    public void createUser(User user) {
        userDao.save(user);
    }
}

@Component  // 贴上"组件"标签
public class UserDao {
    // ...
}
```

> **一句话总结**：注解是一种元数据，它不直接影响代码逻辑，但可以被编译器或框架读取，用于配置、检查或运行时处理。

---

## 5.2 核心原理：注解的本质

### 注解是什么

注解（Annotation）本质上是一个**接口**，继承自 `java.lang.annotation.Annotation`。

```java
// 注解的定义
public @interface MyAnnotation {
    String value();  // 注解的属性
}

// 编译后生成的接口
public interface MyAnnotation extends Annotation {
    String value();  // 抽象方法
}
```

### 注解的底层实现

当你使用一个注解时，JVM 会生成一个**动态代理类**来实现这个注解接口。

```java
// 使用注解
@MyAnnotation("test")
public class MyClass {}

// 底层实现（简化版）
class MyAnnotationProxy implements MyAnnotation {
    private String value;
    
    public MyAnnotationProxy(String value) {
        this.value = value;
    }
    
    @Override
    public String value() {
        return value;
    }
    
    @Override
    public Class<? extends Annotation> annotationType() {
        return MyAnnotation.class;
    }
}
```

### 注解的存储

注解信息存储在 Class 文件的**属性表**中，运行时可以通过反射读取。

```java
// 读取注解
Class<MyClass> clazz = MyClass.class;
MyAnnotation annotation = clazz.getAnnotation(MyAnnotation.class);
if (annotation != null) {
    String value = annotation.value();  // 获取注解的值
    System.out.println("注解值：" + value);
}
```

---

## 5.3 元注解详解

元注解是用来**修饰注解的注解**，Java 提供了4种元注解：

### 1. @Target - 指定注解能用在哪里

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Target;

// 只能用在方法上
@Target(ElementType.METHOD)
public @interface MyMethodAnnotation {
    String value();
}

// 可以用在类、方法、字段上
@Target({ElementType.TYPE, ElementType.METHOD, ElementType.FIELD})
public @interface MyMultiTargetAnnotation {
    String value();
}
```

**ElementType 枚举值**：

| 枚举值 | 说明 | 示例 |
|--------|------|------|
| TYPE | 类、接口、枚举 | `@MyAnnotation class MyClass {}` |
| FIELD | 字段 | `@MyAnnotation private String name;` |
| METHOD | 方法 | `@MyAnnotation public void method() {}` |
| PARAMETER | 方法参数 | `public void method(@MyAnnotation String param) {}` |
| CONSTRUCTOR | 构造器 | `@MyAnnotation public MyClass() {}` |
| LOCAL_VARIABLE | 局部变量 | `@MyAnnotation String var = "test";` |
| ANNOTATION_TYPE | 注解类型 | `@MyAnnotation @interface MyAnno {}` |
| PACKAGE | 包 | `@MyAnnotation package com.example;` |

### 2. @Retention - 指定注解的生命周期

```java
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

// 注解只保留在源码中，编译后丢弃
@Retention(RetentionPolicy.SOURCE)
public @interface SourceAnnotation {}

// 注解保留在 Class 文件中，但运行时无法读取（默认）
@Retention(RetentionPolicy.CLASS)
public @interface ClassAnnotation {}

// 注解保留在 Class 文件中，运行时可以通过反射读取
@Retention(RetentionPolicy.RUNTIME)
public @interface RuntimeAnnotation {}
```

**RetentionPolicy 三种策略**：

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| SOURCE | 只存在于源码，编译后丢弃 | 类似 `@Override`，编译器检查用 |
| CLASS | 存在于 Class 文件，运行时不可读 | 默认策略，字节码分析工具使用 |
| RUNTIME | 始终存在，运行时可读 | Spring 注解、自定义注解处理器 |

### 3. @Documented - 注解是否会出现在 Javadoc 中

```java
import java.lang.annotation.Documented;

// 使用这个注解后，Javadoc 会包含 @MyAnnotation 的信息
@Documented
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation {
    String value();
}
```

### 4. @Repeatable - 允许重复使用同一个注解

```java
import java.lang.annotation.Repeatable;

// 定义容器注解
@Retention(RetentionPolicy.RUNTIME)
public @interface Roles {
    Role[] value();
}

// 可重复的注解
@Repeatable(Roles.class)
@Retention(RetentionPolicy.RUNTIME)
public @interface Role {
    String value();
}

// 使用方式
@Role("admin")
@Role("user")
@Role("manager")
public class User {}
```

---

## 5.4 基础用法：自定义注解

### 定义一个简单的注解

```java
import java.lang.annotation.*;

// 1. 定义注解
@Target({ElementType.TYPE, ElementType.METHOD})  // 可以用在类和方法上
@Retention(RetentionPolicy.RUNTIME)              // 运行时可读取
@Documented                                      // 包含在 Javadoc 中
public @interface MyAnnotation {
    
    // 注解的属性（必须是有默认值的或使用时必须赋值）
    String value() default "";           // 注解值
    int priority() default 0;            // 优先级
    boolean required() default false;    // 是否必需
}
```

### 使用注解

```java
// 在类上使用注解
@MyAnnotation(value = "用户服务", priority = 1, required = true)
public class UserService {
    
    // 在方法上使用注解
    @MyAnnotation(value = "创建用户", priority = 2)
    public void createUser() {
        System.out.println("创建用户");
    }
    
    // 只使用 value 属性（可以简写）
    @MyAnnotation("删除用户")  // 等同于 @MyAnnotation(value = "删除用户")
    public void deleteUser() {
        System.out.println("删除用户");
    }
}
```

### 注解处理器：通过反射读取注解

```java
import java.lang.reflect.Method;

public class AnnotationProcessor {
    
    public static void main(String[] args) {
        // 1. 获取 Class 对象
        Class<UserService> clazz = UserService.class;
        
        // 2. 检查类上是否有注解
        if (clazz.isAnnotationPresent(MyAnnotation.class)) {
            // 3. 获取注解
            MyAnnotation classAnnotation = clazz.getAnnotation(MyAnnotation.class);
            
            // 4. 读取注解的属性
            System.out.println("类注解值：" + classAnnotation.value());
            System.out.println("类优先级：" + classAnnotation.priority());
            System.out.println("是否必需：" + classAnnotation.required());
        }
        
        // 5. 遍历所有方法
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            // 6. 检查方法上是否有注解
            if (method.isAnnotationPresent(MyAnnotation.class)) {
                MyAnnotation methodAnnotation = method.getAnnotation(MyAnnotation.class);
                
                System.out.println("\n方法名：" + method.getName());
                System.out.println("方法注解值：" + methodAnnotation.value());
                System.out.println("方法优先级：" + methodAnnotation.priority());
            }
        }
    }
}
```

---

## 5.5 进阶用法：注解实战

### 实战1：实现一个简单的依赖注入框架

```java
import java.lang.annotation.*;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

// 1. 定义 @Component 注解（标记组件）
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Component {
    String value() default "";
}

// 2. 定义 @Inject 注解（标记注入点）
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Inject {
}

// 3. 简单的 IOC 容器
public class SimpleContainer {
    
    // 存储 Bean 实例
    private Map<String, Object> beans = new HashMap<>();
    
    // 初始化容器
    public void init(String... packageNames) {
        // 1. 扫描指定包下的所有类（简化版，实际需要用 ASM 或反射）
        for (String packageName : packageNames) {
            scanPackage(packageName);
        }
        
        // 2. 注入依赖
        injectDependencies();
    }
    
    // 扫描包
    private void scanPackage(String packageName) {
        // 这里简化处理，实际需要用 ClassLoader 扫描
        // 假设我们已经获取了所有类
        Class<?>[] classes = getClassesFromPackage(packageName);
        
        for (Class<?> clazz : classes) {
            // 检查是否有 @Component 注解
            if (clazz.isAnnotationPresent(Component.class)) {
                try {
                    // 创建实例
                    Object bean = clazz.getDeclaredConstructor().newInstance();
                    
                    // 获取 Bean 名称
                    Component annotation = clazz.getAnnotation(Component.class);
                    String beanName = annotation.value().isEmpty() 
                        ? clazz.getSimpleName() 
                        : annotation.value();
                    
                    // 存储到容器
                    beans.put(beanName, bean);
                    System.out.println("注册 Bean: " + beanName);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
    
    // 注入依赖
    private void injectDependencies() {
        for (Object bean : beans.values()) {
            Class<?> clazz = bean.getClass();
            
            // 遍历所有字段
            Field[] fields = clazz.getDeclaredFields();
            for (Field field : fields) {
                // 检查是否有 @Inject 注解
                if (field.isAnnotationPresent(Inject.class)) {
                    // 获取依赖的类型
                    Class<?> dependencyType = field.getType();
                    
                    // 从容器中查找依赖
                    Object dependency = findBeanByType(dependencyType);
                    
                    if (dependency != null) {
                        // 注入依赖
                        field.setAccessible(true);
                        try {
                            field.set(bean, dependency);
                            System.out.println("注入依赖: " + clazz.getSimpleName() 
                                + "." + field.getName());
                        } catch (IllegalAccessException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        }
    }
    
    // 根据类型查找 Bean
    private Object findBeanByType(Class<?> type) {
        for (Object bean : beans.values()) {
            if (type.isInstance(bean)) {
                return bean;
            }
        }
        return null;
    }
    
    // 获取 Bean
    public <T> T getBean(String name, Class<T> type) {
        Object bean = beans.get(name);
        if (bean != null && type.isInstance(bean)) {
            return type.cast(bean);
        }
        return null;
    }
    
    // 模拟从包中获取类
    private Class<?>[] getClassesFromPackage(String packageName) {
        // 实际实现需要用 ClassLoader 扫描
        // 这里返回测试用的类
        return new Class<?>[]{UserService.class, UserDao.class};
    }
}

// 4. 使用示例
@Component("userDao")
class UserDao {
    public void save(String data) {
        System.out.println("保存数据: " + data);
    }
}

@Component("userService")
class UserService {
    
    @Inject
    private UserDao userDao;
    
    public void createUser(String data) {
        System.out.println("创建用户");
        userDao.save(data);
    }
}

// 5. 测试
public class AnnotationDemo {
    public static void main(String[] args) {
        // 创建容器
        SimpleContainer container = new SimpleContainer();
        
        // 初始化容器（扫描包）
        container.init("com.example");
        
        // 获取 Bean
        UserService userService = container.getBean("userService", UserService.class);
        
        // 调用方法
        userService.createUser("测试数据");
    }
}
```

> **生活化类比**：
> 注解处理器就像"仓库管理员"：
> 1. 扫描货架（扫描包）
> 2. 看标签识别物品（读取注解）
> 3. 把物品放入仓库（创建 Bean 实例）
> 4. 根据标签建立关联（注入依赖）

### 实战2：实现一个简单的 AOP（面向切面编程）

```java
import java.lang.annotation.*;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

// 1. 定义 @Before 注解（前置通知）
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Before {
    String value();  // 通知内容
}

// 2. 定义 @After 注解（后置通知）
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface After {
    String value();  // 通知内容
}

// 3. 业务接口
public interface UserService {
    void createUser(String name);
    void deleteUser(String name);
}

// 4. 业务实现类
public class UserServiceImpl implements UserService {
    
    @Before("检查权限")
    @After("记录日志")
    @Override
    public void createUser(String name) {
        System.out.println("创建用户: " + name);
    }
    
    @Before("检查权限")
    @Override
    public void deleteUser(String name) {
        System.out.println("删除用户: " + name);
    }
}

// 5. 动态代理处理器
class AOPProxyHandler implements InvocationHandler {
    
    private Object target;  // 目标对象
    
    public AOPProxyHandler(Object target) {
        this.target = target;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 1. 执行 @Before 通知
        if (method.isAnnotationPresent(Before.class)) {
            Before before = method.getAnnotation(Before.class);
            System.out.println("[前置通知] " + before.value());
        }
        
        // 2. 执行目标方法
        Object result = method.invoke(target, args);
        
        // 3. 执行 @After 通知
        if (method.isAnnotationPresent(After.class)) {
            After after = method.getAnnotation(After.class);
            System.out.println("[后置通知] " + after.value());
        }
        
        return result;
    }
}

// 6. 创建代理的工厂
class AOPFactory {
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target) {
        // 获取目标对象的类
        Class<?> targetClass = target.getClass();
        
        // 创建代理对象
        return (T) Proxy.newProxyInstance(
            targetClass.getClassLoader(),           // 类加载器
            targetClass.getInterfaces(),             // 实现的接口
            new AOPProxyHandler(target)              // 调用处理器
        );
    }
}

// 7. 测试
public class AOPDemo {
    public static void main(String[] args) {
        // 创建目标对象
        UserService target = new UserServiceImpl();
        
        // 创建代理对象
        UserService proxy = AOPFactory.createProxy(target);
        
        // 调用方法
        System.out.println("=== 调用 createUser ===");
        proxy.createUser("张三");
        
        System.out.println("\n=== 调用 deleteUser ===");
        proxy.deleteUser("李四");
    }
}
```

---

## 5.6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 注解本质 | 注解是一个接口，继承自 `Annotation` |
| 注解实现 | 运行时通过动态代理实现注解实例 |
| 元注解 | `@Target`、`@Retention`、`@Documented`、`@Repeatable` |
| RetentionPolicy | SOURCE（源码）、CLASS（字节码）、RUNTIME（运行时） |
| 注解读取 | 通过反射 API 读取注解信息 |
| 注解处理器 | 读取注解并执行相应逻辑的程序 |
| Spring 应用 | `@Autowired`、`@Service` 等通过注解处理器实现依赖注入 |

---

## 5.7 新手常见误区

### 误区 1："注解就是注释，没有实际作用"

**错！** 注解和注释完全不同：

```java
// 这是注释，给人看的，编译器忽略
// TODO: 需要优化

// 这是注解，给编译器或框架看的，会被处理
@Override  // 编译器会检查是否真的重写了父类方法
@Autowired  // Spring 会自动注入依赖
```

**正确理解**：注解是元数据，可以被编译器或框架读取并处理。

### 误区 2："注解只能在运行时使用"

**错！** 注解可以在不同阶段使用：

```java
// SOURCE 阶段：编译时检查
@Override  // 编译器检查，编译后丢弃

// CLASS 阶段：字节码分析工具
@MyAnnotation  // 存在于 Class 文件，但运行时无法通过反射读取

// RUNTIME 阶段：运行时反射
@MyAnnotation  // 运行时可以通过反射读取
```

### 误区 3："注解的属性可以有任意类型"

**错！** 注解的属性类型有限制：

```java
@Target(ElementType.ANNOTATION_TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation {
    
    // ✅ 允许的类型
    String stringValue();           // 基本类型
    int intValue();                 // 基本类型
    Class<?> classValue();          // Class 对象
    String[] arrayValue();          // 数组
    ElementType enumValue();        // 枚举
    
    // ❌ 不允许的类型
    // Object objectValue();        // 对象类型
    // List<String> listValue();    // 集合类型
    // MyAnnotation nested();       // 注解类型（但可以是注解数组）
}
```

### 误区 4："自定义注解后就会自动生效"

**错！** 自定义注解后，还需要编写注解处理器：

```java
// 1. 定义注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation {
    String value();
}

// 2. 使用注解
@MyAnnotation("test")
public class MyClass {}

// 3. 必须编写处理器（否则注解没有任何作用）
public class MyAnnotationProcessor {
    public void process(Class<?> clazz) {
        if (clazz.isAnnotationPresent(MyAnnotation.class)) {
            MyAnnotation annotation = clazz.getAnnotation(MyAnnotation.class);
            System.out.println("处理注解: " + annotation.value());
            // 执行相应的逻辑
        }
    }
}
```

### 误区 5："@Retention(RetentionPolicy.CLASS) 的注解可以在运行时读取"

**错！** CLASS 策略的注解在运行时无法通过反射读取：

```java
@Retention(RetentionPolicy.CLASS)  // 只保留到 Class 文件
public @interface ClassAnnotation {}

@Retention(RetentionPolicy.RUNTIME)  // 保留到运行时
public @interface RuntimeAnnotation {}

@ClassAnnotation
@RuntimeAnnotation
public class MyClass {}

public class Test {
    public static void main(String[] args) {
        Class<MyClass> clazz = MyClass.class;
        
        // ❌ 返回 null，无法读取
        ClassAnnotation classAnno = clazz.getAnnotation(ClassAnnotation.class);
        System.out.println(classAnno);  // null
        
        // ✅ 可以读取
        RuntimeAnnotation runtimeAnno = clazz.getAnnotation(RuntimeAnnotation.class);
        System.out.println(runtimeAnno);  // 有值
    }
}
```

---

## 5.8 动手练习

### 练习 1：基础题

请回答以下问题：

1. 注解的本质是什么？
2. 4种元注解分别有什么作用？
3. RetentionPolicy 的三种策略有什么区别？

<details>
<summary>点击查看答案</summary>

1. **注解的本质**：
   - 注解是一个接口，继承自 `java.lang.annotation.Annotation`
   - 运行时通过动态代理生成注解实例
   - 注解信息存储在 Class 文件的属性表中

2. **4种元注解的作用**：
   - `@Target`：指定注解可以用在哪里（类、方法、字段等）
   - `@Retention`：指定注解的生命周期（SOURCE、CLASS、RUNTIME）
   - `@Documented`：注解是否会出现在 Javadoc 中
   - `@Repeatable`：允许重复使用同一个注解

3. **RetentionPolicy 三种策略的区别**：
   - `SOURCE`：只存在于源码，编译后丢弃（如 `@Override`）
   - `CLASS`：存在于 Class 文件，运行时不可读（默认策略）
   - `RUNTIME`：始终存在，运行时可以通过反射读取（自定义注解常用）

</details>

### 练习 2：进阶题

请编写一个自定义注解 `@Validate`，用于标记需要验证的方法，并编写注解处理器检查方法参数是否为 null。

<details>
<summary>点击查看答案</summary>

```java
import java.lang.annotation.*;
import java.lang.reflect.Method;

// 1. 定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Validate {
    String[] value();  // 需要验证的参数名
}

// 2. 业务类
public class UserService {
    
    @Validate({"username", "password"})
    public void createUser(String username, String password) {
        System.out.println("创建用户: " + username);
    }
    
    @Validate({"userId"})
    public void deleteUser(String userId) {
        System.out.println("删除用户: " + userId);
    }
}

// 3. 注解处理器
public class ValidationProcessor {
    
    public void validate(Object target, Method method, Object[] args) {
        // 检查是否有 @Validate 注解
        if (method.isAnnotationPresent(Validate.class)) {
            Validate annotation = method.getAnnotation(Validate.class);
            String[] paramNames = annotation.value();
            
            // 获取方法参数
            Class<?>[] paramTypes = method.getParameterTypes();
            
            // 验证每个参数
            for (int i = 0; i < paramNames.length; i++) {
                if (i < args.length && args[i] == null) {
                    throw new IllegalArgumentException(
                        "参数 " + paramNames[i] + " 不能为 null"
                    );
                }
            }
        }
        
        // 执行目标方法
        try {
            method.invoke(target, args);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public static void main(String[] args) throws Exception {
        UserService service = new UserService();
        ValidationProcessor processor = new ValidationProcessor();
        
        // 获取方法
        Method method = UserService.class.getMethod("createUser", String.class, String.class);
        
        // 正常调用
        processor.validate(service, method, new Object[]{"张三", "123456"});
        
        // 异常调用（参数为 null）
        try {
            processor.validate(service, method, new Object[]{null, "123456"});
        } catch (IllegalArgumentException e) {
            System.out.println("验证失败: " + e.getMessage());
        }
    }
}
```

</details>

### 练习 3（挑战）：综合题

请实现一个简单的 Spring 风格的依赖注入框架，支持 `@Component` 和 `@Autowired` 注解。

<details>
<summary>点击查看答案</summary>

```java
import java.lang.annotation.*;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

// 1. 定义 @Component 注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Component {
    String value() default "";
}

// 2. 定义 @Autowired 注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Autowired {
    boolean required() default true;
}

// 3. IOC 容器
public class SimpleSpringContainer {
    
    private Map<String, Object> beanMap = new HashMap<>();
    
    // 注册 Bean
    public void registerBean(Class<?> clazz) {
        if (clazz.isAnnotationPresent(Component.class)) {
            try {
                // 创建实例
                Object bean = clazz.getDeclaredConstructor().newInstance();
                
                // 获取 Bean 名称
                Component annotation = clazz.getAnnotation(Component.class);
                String beanName = annotation.value().isEmpty() 
                    ? clazz.getSimpleName() 
                    : annotation.value();
                
                // 存储到容器
                beanMap.put(beanName, bean);
                
                // 注入依赖
                injectDependencies(bean);
                
            } catch (Exception e) {
                throw new RuntimeException("创建 Bean 失败: " + clazz.getName(), e);
            }
        }
    }
    
    // 注入依赖
    private void injectDependencies(Object bean) {
        Class<?> clazz = bean.getClass();
        Field[] fields = clazz.getDeclaredFields();
        
        for (Field field : fields) {
            if (field.isAnnotationPresent(Autowired.class)) {
                Autowired annotation = field.getAnnotation(Autowired.class);
                
                // 根据类型查找依赖
                Class<?> fieldType = field.getType();
                Object dependency = findBeanByType(fieldType);
                
                if (dependency == null && annotation.required()) {
                    throw new RuntimeException(
                        "找不到依赖: " + clazz.getSimpleName() + "." + field.getName()
                    );
                }
                
                if (dependency != null) {
                    field.setAccessible(true);
                    try {
                        field.set(bean, dependency);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException("注入依赖失败", e);
                    }
                }
            }
        }
    }
    
    // 根据类型查找 Bean
    private Object findBeanByType(Class<?> type) {
        for (Object bean : beanMap.values()) {
            if (type.isInstance(bean)) {
                return bean;
            }
        }
        return null;
    }
    
    // 获取 Bean
    @SuppressWarnings("unchecked")
    public <T> T getBean(String name, Class<T> type) {
        Object bean = beanMap.get(name);
        if (bean != null && type.isInstance(bean)) {
            return (T) bean;
        }
        return null;
    }
}

// 4. 使用示例
@Component("userDao")
class UserDao {
    public void save(String data) {
        System.out.println("保存数据: " + data);
    }
}

@Component("userService")
class UserService {
    
    @Autowired
    private UserDao userDao;
    
    public void createUser(String data) {
        System.out.println("创建用户");
        userDao.save(data);
    }
}

// 5. 测试
public class SpringDemo {
    public static void main(String[] args) {
        // 创建容器
        SimpleSpringContainer container = new SimpleSpringContainer();
        
        // 注册 Bean
        container.registerBean(UserDao.class);
        container.registerBean(UserService.class);
        
        // 获取 Bean
        UserService userService = container.getBean("userService", UserService.class);
        
        // 调用方法
        userService.createUser("测试数据");
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **异常处理原理**——也就是 Java 异常体系的底层实现。你会学到：

- 异常体系的完整结构（Throwable → Error/Exception → RuntimeException）
- checked 和 unchecked 异常的设计哲学
- 异常的底层实现（栈追踪的生成过程）
- try-catch-finally 的字节码实现
- try-with-resources 的原理
- 异常的性能问题及优化

这些知识将帮助你理解 Java 异常处理的底层机制，以及如何编写更高效的异常处理代码。
