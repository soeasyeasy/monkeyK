---
title: "第四章：反射原理"
description: "Class 对象、运行时类型识别、动态代理基础"
---

# 第四章：反射原理

## 本章导读

欢迎来到第四章！在前一章中，我们深入了解了泛型的类型擦除机制。本章将揭开 Java 反射的神秘面纱，这是 Java 最强大的特性之一，也是很多框架的基石。

**本章你将学到：**
- 什么是反射（运行时获取类信息、操作对象）
- Class 对象的由来（类加载时 JVM 自动创建）
- 反射的底层 API（Class、Field、Method、Constructor）
- 反射的性能开销及优化（setAccessible、缓存 Method）
- 运行时类型识别（RTTI）与 instanceof 原理
- 反射在框架中的应用（Spring IoC、JSON 序列化）
- 代码示例：通过反射调用私有方法

**生活化类比：**
想象反射就像 X 光机。正常情况下，你只能看到一个人的外表（公开方法）。但有了 X 光机（反射），你可以看到他的骨骼、内脏（私有字段、私有方法），甚至可以操控他的身体（调用私有方法、修改私有字段）。反射让程序在运行时能够"透视"类的内部结构。

---

## 1 为什么需要反射？

### 4.1.1 没有反射的困境

**场景一：开发 IDE**
```java
// 问题：如何让 IDE 自动显示类的所有方法和字段？
// 没有反射：无法在运行时获取类信息
// 有反射：可以动态获取类的所有信息
```

**场景二：开发框架**
```java
// Spring IoC 容器需要：
// 1. 根据类名创建对象
// 2. 注入依赖（调用 setter 或构造器）
// 3. 调用初始化方法

// 没有反射：无法实现
// 有反射：可以轻松实现
```

**场景三：JSON 序列化**
```java
// 将对象转换为 JSON 字符串
// 需要：获取对象的所有字段和值
// 没有反射：无法实现
// 有反射：可以轻松实现
```

### 4.1.2 反射的核心价值

**价值一：动态性**
- 运行时获取类信息
- 运行时创建对象
- 运行时调用方法

**价值二：灵活性**
- 可以操作任何类
- 可以访问私有成员
- 可以动态组合功能

**价值三：框架基石**
- Spring IoC：依赖注入
- Hibernate：ORM 映射
- Jackson：JSON 序列化
- JUnit：测试框架

### 4.1.3 反射的典型应用

**应用一：Spring IoC**
```java
// Spring 容器根据配置创建对象
// applicationContext.xml
// <bean id="userService" class="com.example.UserService"/>

// Spring 内部使用反射
Class<?> clazz = Class.forName("com.example.UserService");
Object obj = clazz.newInstance();  // 创建对象
```

**应用二：JSON 序列化**
```java
// 将对象转换为 JSON
User user = new User("Alice", 25);
String json = objectMapper.writeValueAsString(user);

// Jackson 内部使用反射
Field[] fields = clazz.getDeclaredFields();
for (Field field : fields) {
    field.setAccessible(true);
    Object value = field.get(obj);
    // 构建 JSON
}
```

**应用三：动态代理**
```java
// JDK 动态代理
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class<?>[]{UserService.class},
    new InvocationHandler() {
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) {
            // 拦截方法调用
            return method.invoke(target, args);
        }
    }
);
```

---

## 2 核心原理

### 4.2.1 Class 对象的由来

**什么是 Class 对象？**

Class 对象是 JVM 在类加载时自动创建的，它代表了类的元数据（结构信息）。

**生活化类比：**
想象 Class 对象就像人的身份证。身份证记录了你的姓名、性别、出生日期等信息。Class 对象记录了类的名称、字段、方法、构造器等信息。

**Class 对象的创建过程：**

```
1. 源代码编译成字节码（.class 文件）
   ↓
2. 类加载器加载字节码
   ↓
3. JVM 在方法区创建 Class 对象
   ↓
4. Class 对象包含类的元数据
```

**代码示例：**
```java
public class ClassObjectDemo {
    public static void main(String[] args) {
        // 获取 Class 对象的三种方式
        
        // 方式一：通过类名.class
        Class<String> clazz1 = String.class;
        System.out.println(clazz1.getName());  // java.lang.String
        
        // 方式二：通过对象.getClass()
        String str = "Hello";
        Class<?> clazz2 = str.getClass();
        System.out.println(clazz2.getName());  // java.lang.String
        
        // 方式三：通过 Class.forName()
        try {
            Class<?> clazz3 = Class.forName("java.lang.String");
            System.out.println(clazz3.getName());  // java.lang.String
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        
        // 验证：三个 Class 对象是同一个
        System.out.println(clazz1 == clazz2);  // true
        System.out.println(clazz2 == clazz3);  // true
    }
}
```

**关键点：**
- 每个类只有一个 Class 对象
- Class 对象在类加载时创建
- Class 对象存储在方法区（元空间）

### 4.2.2 反射的底层 API

**反射的四大核心类：**

| 类 | 说明 | 用途 |
|---|------|------|
| **Class** | 类的元数据 | 获取类信息 |
| **Field** | 字段信息 | 获取/设置字段值 |
| **Method** | 方法信息 | 调用方法 |
| **Constructor** | 构造器信息 | 创建对象 |

**Class 类的常用方法：**

```java
public class ClassAPIDemo {
    public static void main(String[] args) {
        Class<String> clazz = String.class;
        
        // 获取类名
        System.out.println(clazz.getName());  // java.lang.String
        System.out.println(clazz.getSimpleName());  // String
        System.out.println(clazz.getCanonicalName());  // java.lang.String
        
        // 获取字段
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            System.out.println(field.getName());
        }
        
        // 获取方法
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println(method.getName());
        }
        
        // 获取构造器
        Constructor<?>[] constructors = clazz.getDeclaredConstructors();
        for (Constructor<?> constructor : constructors) {
            System.out.println(constructor.getName());
        }
        
        // 获取父类
        Class<?> superClass = clazz.getSuperclass();
        System.out.println(superClass.getName());  // java.lang.Object
        
        // 获取接口
        Class<?>[] interfaces = clazz.getInterfaces();
        for (Class<?> iface : interfaces) {
            System.out.println(iface.getName());
        }
    }
}
```

**Field 类的常用方法：**

```java
public class FieldAPIDemo {
    private String name;
    private int age;
    
    public static void main(String[] args) throws Exception {
        Class<FieldAPIDemo> clazz = FieldAPIDemo.class;
        
        // 获取字段
        Field nameField = clazz.getDeclaredField("name");
        
        // 获取字段信息
        System.out.println(nameField.getName());  // name
        System.out.println(nameField.getType());  // class java.lang.String
        System.out.println(nameField.getModifiers());  // 修饰符
        
        // 创建对象
        FieldAPIDemo obj = new FieldAPIDemo();
        
        // 设置可访问私有字段
        nameField.setAccessible(true);
        
        // 设置字段值
        nameField.set(obj, "Alice");
        
        // 获取字段值
        String name = (String) nameField.get(obj);
        System.out.println(name);  // Alice
    }
}
```

**Method 类的常用方法：**

```java
public class MethodAPIDemo {
    private void privateMethod(String msg) {
        System.out.println("Private method: " + msg);
    }
    
    public static void main(String[] args) throws Exception {
        Class<MethodAPIDemo> clazz = MethodAPIDemo.class;
        
        // 获取方法
        Method method = clazz.getDeclaredMethod("privateMethod", String.class);
        
        // 获取方法信息
        System.out.println(method.getName());  // privateMethod
        System.out.println(method.getReturnType());  // void
        System.out.println(method.getParameterCount());  // 1
        
        // 创建对象
        MethodAPIDemo obj = new MethodAPIDemo();
        
        // 设置可访问私有方法
        method.setAccessible(true);
        
        // 调用方法
        method.invoke(obj, "Hello");  // Private method: Hello
    }
}
```

**Constructor 类的常用方法：**

```java
public class ConstructorAPIDemo {
    private String name;
    private int age;
    
    private ConstructorAPIDemo(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public static void main(String[] args) throws Exception {
        Class<ConstructorAPIDemo> clazz = ConstructorAPIDemo.class;
        
        // 获取构造器
        Constructor<ConstructorAPIDemo> constructor = 
            clazz.getDeclaredConstructor(String.class, int.class);
        
        // 获取构造器信息
        System.out.println(constructor.getName());
        System.out.println(constructor.getParameterCount());  // 2
        
        // 设置可访问私有构造器
        constructor.setAccessible(true);
        
        // 使用构造器创建对象
        ConstructorAPIDemo obj = constructor.newInstance("Alice", 25);
        
        System.out.println(obj.name);  // Alice
        System.out.println(obj.age);   // 25
    }
}
```

### 4.2.3 反射的性能开销

**反射为什么慢？**

1. **动态解析**：需要在运行时解析字节码
2. **安全检查**：需要检查访问权限
3. **类型转换**：需要进行类型检查和转换
4. **无法内联**：JIT 编译器无法优化

**性能对比：**

```java
public class PerformanceDemo {
    private int value = 0;
    
    // 直接调用
    public void directCall() {
        value = 100;
    }
    
    public static void main(String[] args) throws Exception {
        PerformanceDemo demo = new PerformanceDemo();
        
        // 直接调用
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000000; i++) {
            demo.directCall();
        }
        long end = System.currentTimeMillis();
        System.out.println("直接调用：" + (end - start) + "ms");
        
        // 反射调用
        Method method = PerformanceDemo.class.getDeclaredMethod("directCall");
        method.setAccessible(true);
        
        start = System.currentTimeMillis();
        for (int i = 0; i < 1000000; i++) {
            method.invoke(demo);
        }
        end = System.currentTimeMillis();
        System.out.println("反射调用：" + (end - start) + "ms");
    }
}
```

**典型结果：**
```
直接调用：5ms
反射调用：50ms
```

**结论：** 反射调用比直接调用慢 10 倍左右

### 4.2.4 反射的优化

**优化一：setAccessible(true)**

```java
// 未优化：每次都检查访问权限
Method method = clazz.getDeclaredMethod("privateMethod");
method.invoke(obj);  // 慢

// 优化：跳过访问权限检查
method.setAccessible(true);
method.invoke(obj);  // 快
```

**优化二：缓存 Method 对象**

```java
// 未优化：每次都查找 Method
for (int i = 0; i < 1000000; i++) {
    Method method = clazz.getDeclaredMethod("method");
    method.invoke(obj);
}

// 优化：缓存 Method 对象
Method method = clazz.getDeclaredMethod("method");
for (int i = 0; i < 1000000; i++) {
    method.invoke(obj);
}
```

**优化三：使用 MethodHandle（Java 7+）**

```java
// 反射调用
Method method = clazz.getDeclaredMethod("method");
method.invoke(obj);

// MethodHandle 调用
MethodHandles.Lookup lookup = MethodHandles.lookup();
MethodHandle handle = lookup.findVirtual(clazz, "method", MethodType.methodType());
handle.invoke(obj);
```

**优化四：使用字节码生成（CGLIB、ASM）**

```java
// 反射：运行时解析
Method method = clazz.getDeclaredMethod("method");
method.invoke(obj);

// CGLIB：生成字节码，接近直接调用
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(clazz);
enhancer.setCallback(new MethodInterceptor() {
    @Override
    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) {
        return proxy.invokeSuper(obj, args);
    }
});
Object proxy = enhancer.create();
```

### 4.2.5 运行时类型识别（RTTI）

**什么是 RTTI？**

RTTI（Run-Time Type Identification）是运行时类型识别，用于在运行时确定对象的实际类型。

**instanceof 关键字：**

```java
public class RTTIDemo {
    public static void main(String[] args) {
        Object obj = new String("Hello");
        
        // instanceof 检查
        if (obj instanceof String) {
            System.out.println("obj is String");
        }
        
        if (obj instanceof Object) {
            System.out.println("obj is Object");
        }
        
        // instanceof 与 null
        Object nullObj = null;
        System.out.println(nullObj instanceof String);  // false
    }
}
```

**instanceof 的底层实现：**

```
1. 获取对象的类型指针（对象头）
2. 比较类型指针是否匹配
3. 如果不匹配，检查父类和接口
```

**Class.isInstance() 方法：**

```java
public class IsInstanceDemo {
    public static void main(String[] args) {
        Object obj = new String("Hello");
        
        // 等价于 instanceof
        boolean result1 = String.class.isInstance(obj);
        System.out.println(result1);  // true
        
        boolean result2 = Object.class.isInstance(obj);
        System.out.println(result2);  // true
        
        boolean result3 = Integer.class.isInstance(obj);
        System.out.println(result3);  // false
    }
}
```

**Class.isAssignableFrom() 方法：**

```java
public class IsAssignableFromDemo {
    public static void main(String[] args) {
        // 检查类是否可以赋值
        boolean result1 = Object.class.isAssignableFrom(String.class);
        System.out.println(result1);  // true（String 是 Object 的子类）
        
        boolean result2 = String.class.isAssignableFrom(Object.class);
        System.out.println(result2);  // false（Object 不是 String 的子类）
        
        boolean result3 = Comparable.class.isAssignableFrom(String.class);
        System.out.println(result3);  // true（String 实现了 Comparable）
    }
}
```

---

## 3 基础用法

### 4.3.1 获取 Class 对象

**三种获取方式：**

```java
public class GetClassDemo {
    public static void main(String[] args) {
        // 方式一：类名.class（编译时确定）
        Class<String> clazz1 = String.class;
        System.out.println(clazz1.getName());
        
        // 方式二：对象.getClass()（运行时获取）
        String str = "Hello";
        Class<?> clazz2 = str.getClass();
        System.out.println(clazz2.getName());
        
        // 方式三：Class.forName()（动态加载）
        try {
            Class<?> clazz3 = Class.forName("java.lang.String");
            System.out.println(clazz3.getName());
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

**对比表格：**

| 方式 | 时机 | 优点 | 缺点 |
|------|------|------|------|
| 类名.class | 编译时 | 类型安全 | 需要知道类名 |
| 对象.getClass() | 运行时 | 动态获取 | 需要先创建对象 |
| Class.forName() | 运行时 | 最灵活 | 需要处理异常 |

### 4.3.2 创建对象

**两种创建方式：**

```java
public class CreateObjectDemo {
    public static void main(String[] args) {
        try {
            Class<String> clazz = String.class;
            
            // 方式一：Class.newInstance()（已废弃）
            // 要求：必须有无参构造器，且构造器必须公开
            // String str1 = clazz.newInstance();
            
            // 方式二：Constructor.newInstance()（推荐）
            Constructor<String> constructor = clazz.getConstructor(String.class);
            String str2 = constructor.newInstance("Hello");
            System.out.println(str2);  // Hello
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**对比表格：**

| 方式 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Class.newInstance() | 简单 | 限制多 | ✗ 不推荐 |
| Constructor.newInstance() | 灵活 | 稍复杂 | ✓ 推荐 |

### 4.3.3 访问字段

**访问字段示例：**

```java
public class AccessFieldDemo {
    private String name;
    public int age;
    
    public AccessFieldDemo(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public static void main(String[] args) throws Exception {
        Class<AccessFieldDemo> clazz = AccessFieldDemo.class;
        AccessFieldDemo obj = new AccessFieldDemo("Alice", 25);
        
        // 访问公有字段
        Field ageField = clazz.getField("age");
        System.out.println(ageField.get(obj));  // 25
        ageField.set(obj, 30);
        System.out.println(obj.age);  // 30
        
        // 访问私有字段
        Field nameField = clazz.getDeclaredField("name");
        nameField.setAccessible(true);  // 跳过访问检查
        System.out.println(nameField.get(obj));  // Alice
        nameField.set(obj, "Bob");
        System.out.println(nameField.get(obj));  // Bob
    }
}
```

### 4.3.4 调用方法

**调用方法示例：**

```java
public class InvokeMethodDemo {
    private void privateMethod(String msg) {
        System.out.println("Private: " + msg);
    }
    
    public void publicMethod(String msg) {
        System.out.println("Public: " + msg);
    }
    
    public static void main(String[] args) throws Exception {
        Class<InvokeMethodDemo> clazz = InvokeMethodDemo.class;
        InvokeMethodDemo obj = new InvokeMethodDemo();
        
        // 调用公有方法
        Method publicMethod = clazz.getMethod("publicMethod", String.class);
        publicMethod.invoke(obj, "Hello");  // Public: Hello
        
        // 调用私有方法
        Method privateMethod = clazz.getDeclaredMethod("privateMethod", String.class);
        privateMethod.setAccessible(true);
        privateMethod.invoke(obj, "World");  // Private: World
    }
}
```

---

## 4 进阶用法

### 4.4.1 反射与泛型

**通过反射获取泛型信息：**

```java
import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

public class GenericReflectionDemo {
    private List<String> list;
    private Map<String, Integer> map;
    
    public static void main(String[] args) throws Exception {
        Class<GenericReflectionDemo> clazz = GenericReflectionDemo.class;
        
        // 获取 list 字段的泛型信息
        Field listField = clazz.getDeclaredField("list");
        Type listType = listField.getGenericType();
        
        if (listType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) listType;
            System.out.println("原始类型：" + pt.getRawType());  // interface java.util.List
            
            Type[] typeArgs = pt.getActualTypeArguments();
            for (Type typeArg : typeArgs) {
                System.out.println("类型参数：" + typeArg);  // class java.lang.String
            }
        }
        
        // 获取 map 字段的泛型信息
        Field mapField = clazz.getDeclaredField("map");
        Type mapType = mapField.getGenericType();
        
        if (mapType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) mapType;
            System.out.println("原始类型：" + pt.getRawType());  // interface java.util.Map
            
            Type[] typeArgs = pt.getActualTypeArguments();
            for (Type typeArg : typeArgs) {
                System.out.println("类型参数：" + typeArg);
                // class java.lang.String
                // class java.lang.Integer
            }
        }
    }
}
```

**关键点：**
- 字段的泛型信息通过 Signature 属性保留
- 可以通过反射获取泛型类型参数
- 局部变量的泛型信息在运行时完全丢失

### 4.4.2 反射与注解

**通过反射获取注解信息：**

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

// 定义注解
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
@interface MyAnnotation {
    String value();
    int priority() default 0;
}

public class AnnotationReflectionDemo {
    @MyAnnotation(value = "name", priority = 1)
    private String name;
    
    @MyAnnotation(value = "getName", priority = 2)
    public String getName() {
        return name;
    }
    
    public static void main(String[] args) throws Exception {
        Class<AnnotationReflectionDemo> clazz = AnnotationReflectionDemo.class;
        
        // 获取字段上的注解
        Field nameField = clazz.getDeclaredField("name");
        if (nameField.isAnnotationPresent(MyAnnotation.class)) {
            MyAnnotation annotation = nameField.getAnnotation(MyAnnotation.class);
            System.out.println("字段注解值：" + annotation.value());  // name
            System.out.println("字段优先级：" + annotation.priority());  // 1
        }
        
        // 获取方法上的注解
        Method getNameMethod = clazz.getMethod("getName");
        if (getNameMethod.isAnnotationPresent(MyAnnotation.class)) {
            MyAnnotation annotation = getNameMethod.getAnnotation(MyAnnotation.class);
            System.out.println("方法注解值：" + annotation.value());  // getName
            System.out.println("方法优先级：" + annotation.priority());  // 2
        }
    }
}
```

**关键点：**
- 注解必须使用 @Retention(RetentionPolicy.RUNTIME) 才能在运行时获取
- 使用 isAnnotationPresent() 检查注解是否存在
- 使用 getAnnotation() 获取注解实例

### 4.4.3 反射与数组

**通过反射操作数组：**

```java
import java.lang.reflect.Array;

public class ArrayReflectionDemo {
    public static void main(String[] args) {
        // 创建数组
        int[] intArray = (int[]) Array.newInstance(int.class, 5);
        
        // 设置数组元素
        for (int i = 0; i < 5; i++) {
            Array.set(intArray, i, i * 10);
        }
        
        // 获取数组元素
        for (int i = 0; i < 5; i++) {
            System.out.println(Array.get(intArray, i));
        }
        
        // 获取数组长度
        int length = Array.getLength(intArray);
        System.out.println("数组长度：" + length);  // 5
        
        // 获取数组类型
        Class<?> componentType = intArray.getClass().getComponentType();
        System.out.println("数组类型：" + componentType.getName());  // int
    }
}
```

**关键点：**
- 使用 Array.newInstance() 创建数组
- 使用 Array.get() 和 Array.set() 访问数组元素
- 使用 getComponentType() 获取数组元素类型

---

## 5 核心知识点总结

### 4.5.1 本章核心概念

| 概念 | 说明 | 重要性 |
|------|------|--------|
| **Class 对象** | 类的元数据，JVM 在类加载时创建 | ⭐⭐⭐⭐⭐ |
| **反射 API** | Class、Field、Method、Constructor | ⭐⭐⭐⭐⭐ |
| **setAccessible** | 跳过访问权限检查 | ⭐⭐⭐⭐ |
| **性能优化** | 缓存 Method、MethodHandle | ⭐⭐⭐⭐ |
| **RTTI** | 运行时类型识别 | ⭐⭐⭐⭐ |
| **泛型反射** | 获取字段的泛型信息 | ⭐⭐⭐ |

### 4.5.2 关键要点

1. **Class 对象的由来**
   - JVM 在类加载时自动创建
   - 每个类只有一个 Class 对象
   - 存储在方法区（元空间）

2. **反射的四大核心 API**
   - Class：获取类信息
   - Field：访问字段
   - Method：调用方法
   - Constructor：创建对象

3. **反射的性能开销**
   - 动态解析字节码
   - 安全检查
   - 类型转换
   - 无法内联优化

4. **反射的优化方法**
   - setAccessible(true)：跳过访问检查
   - 缓存 Method 对象：避免重复查找
   - 使用 MethodHandle：更接近直接调用
   - 使用字节码生成：CGLIB、ASM

5. **运行时类型识别（RTTI）**
   - instanceof：检查对象类型
   - Class.isInstance()：等价于 instanceof
   - Class.isAssignableFrom()：检查类是否可以赋值

6. **反射在框架中的应用**
   - Spring IoC：依赖注入
   - Jackson：JSON 序列化
   - Hibernate：ORM 映射
   - JUnit：测试框架

---

## 6 新手常见误区

### 误区 1：认为反射可以获取局部变量的泛型信息

**错误理解：** "可以通过反射获取方法内部局部变量的泛型类型"

**正确理解：** 
- 局部变量的泛型信息在编译后完全丢失
- 只能获取字段、方法参数、返回值的泛型信息
- 无法获取局部变量的泛型信息

**实例：**
```java
public void method() {
    List<String> list = new ArrayList<>();  // 局部变量
    // 无法通过反射获取 list 的泛型类型
}

private List<String> field;  // 字段
// 可以通过反射获取 field 的泛型类型
```

### 误区 2：认为反射的性能可以优化到与直接调用相同

**错误理解：** "使用 setAccessible 和缓存后，反射性能和直接调用一样"

**正确理解：** 
- 优化后性能可以提升，但仍有差距
- 反射调用仍然需要动态解析
- 无法完全消除性能开销
- 高频调用场景建议使用字节码生成

**实例：**
```java
// 直接调用：1x
obj.method();

// 优化后的反射：5-10x
Method method = clazz.getMethod("method");
method.setAccessible(true);
method.invoke(obj);

// 字节码生成：1-2x（接近直接调用）
// 使用 CGLIB、ASM 等工具
```

### 误区 3：认为反射可以破坏封装性

**错误理解：** "反射可以访问私有成员，所以封装性被破坏了"

**正确理解：** 
- 反射确实可以访问私有成员
- 但这是有意为之的设计（用于框架开发）
- 正常情况下不应该使用反射访问私有成员
- 封装性是设计原则，反射是工具

**实例：**
```java
// 错误使用：破坏封装性
class User {
    private String password;
}

Field field = User.class.getDeclaredField("password");
field.setAccessible(true);
field.set(user, "newPassword");  // 不推荐

// 正确使用：框架开发
// Spring IoC 容器需要注入依赖
// Jackson 需要序列化私有字段
```

### 误区 4：认为 Class.forName() 会创建对象

**错误理解：** "调用 Class.forName() 会创建类的实例"

**正确理解：** 
- Class.forName() 只是加载类，获取 Class 对象
- 不会创建类的实例
- 会执行静态代码块（类初始化）

**实例：**
```java
// 不会创建对象
Class<?> clazz = Class.forName("com.example.User");

// 会创建对象
Object obj = clazz.newInstance();  // 已废弃
Object obj2 = clazz.getConstructor().newInstance();  // 推荐

// 会执行静态代码块
class User {
    static {
        System.out.println("静态代码块执行");
    }
}

Class.forName("User");  // 输出：静态代码块执行
```

### 误区 5：认为反射可以获取方法的局部变量信息

**错误理解：** "可以通过反射获取方法的参数名、局部变量名"

**正确理解：** 
- 默认情况下，编译后参数名和局部变量名丢失
- 需要使用 -parameters 编译选项保留参数名
- 局部变量名始终无法获取

**实例：**
```java
// 编译时保留参数名
// javac -parameters MyClass.java

public void method(String paramName) {
    int localVar = 10;  // 无法获取
}

// 反射获取参数名
Method method = MyClass.class.getMethod("method", String.class);
Parameter[] parameters = method.getParameters();
for (Parameter parameter : parameters) {
    System.out.println(parameter.getName());  // paramName（需要 -parameters）
}
```

---

## 7 动手练习

### 练习 1：通过反射调用私有方法

**任务：**
1. 创建一个包含私有方法的类
2. 使用反射获取私有方法
3. 设置 setAccessible(true)
4. 调用私有方法并验证结果

**提示代码：**
```java
public class PrivateMethodExercise {
    private String secretMessage = "Hello, Reflection!";
    
    private void printSecret() {
        System.out.println("Secret: " + secretMessage);
    }
    
    private String getSecret(int code) {
        return "Code: " + code + ", Secret: " + secretMessage;
    }
    
    public static void main(String[] args) {
        // TODO: 使用反射调用 printSecret() 和 getSecret(int)
    }
}
```

<details>
<summary>点击查看答案</summary>

**解答代码：**

```java
public class PrivateMethodExercise {
    private String secretMessage = "Hello, Reflection!";
    
    private void printSecret() {
        System.out.println("Secret: " + secretMessage);
    }
    
    private String getSecret(int code) {
        return "Code: " + code + ", Secret: " + secretMessage;
    }
    
    public static void main(String[] args) {
        try {
            PrivateMethodExercise exercise = new PrivateMethodExercise();
            Class<PrivateMethodExercise> clazz = PrivateMethodExercise.class;
            
            // 调用无参私有方法
            Method printMethod = clazz.getDeclaredMethod("printSecret");
            printMethod.setAccessible(true);
            printMethod.invoke(exercise);  // Secret: Hello, Reflection!
            
            // 调用有参私有方法
            Method getMethod = clazz.getDeclaredMethod("getSecret", int.class);
            getMethod.setAccessible(true);
            String result = (String) getMethod.invoke(exercise, 123);
            System.out.println(result);  // Code: 123, Secret: Hello, Reflection!
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**关键步骤：**
1. 使用 getDeclaredMethod() 获取私有方法
2. 调用 setAccessible(true) 跳过访问检查
3. 使用 invoke() 调用方法
4. 处理可能的异常

**学习要点：**
- 掌握反射调用私有方法的方式
- 理解 setAccessible 的作用
- 认识反射的灵活性

</details>

### 练习 2：实现简单的依赖注入

**任务：**
1. 创建两个类：UserService 和 UserDao
2. UserService 依赖 UserDao
3. 使用反射实现简单的依赖注入
4. 验证注入是否成功

**提示代码：**
```java
// UserDao 类
public class UserDao {
    public void save(String data) {
        System.out.println("Saving: " + data);
    }
}

// UserService 类
public class UserService {
    private UserDao userDao;
    
    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }
    
    public void saveUser(String data) {
        if (userDao == null) {
            throw new RuntimeException("UserDao not injected!");
        }
        userDao.save(data);
    }
}

public class DependencyInjectionExercise {
    public static void main(String[] args) {
        // TODO: 使用反射实现依赖注入
        // 1. 创建 UserService 对象
        // 2. 创建 UserDao 对象
        // 3. 使用反射调用 setUserDao 方法
        // 4. 调用 saveUser 方法验证
    }
}
```

<details>
<summary>点击查看答案</summary>

**解答代码：**

```java
public class UserDao {
    public void save(String data) {
        System.out.println("Saving: " + data);
    }
}

public class UserService {
    private UserDao userDao;
    
    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }
    
    public void saveUser(String data) {
        if (userDao == null) {
            throw new RuntimeException("UserDao not injected!");
        }
        userDao.save(data);
    }
}

public class DependencyInjectionExercise {
    public static void main(String[] args) {
        try {
            // 1. 创建 UserService 对象
            Class<?> userServiceClass = Class.forName("UserService");
            Object userService = userServiceClass.getConstructor().newInstance();
            
            // 2. 创建 UserDao 对象
            Class<?> userDaoClass = Class.forName("UserDao");
            Object userDao = userDaoClass.getConstructor().newInstance();
            
            // 3. 使用反射调用 setUserDao 方法
            Method setUserDaoMethod = userServiceClass.getMethod("setUserDao", userDaoClass);
            setUserDaoMethod.invoke(userService, userDao);
            
            // 4. 调用 saveUser 方法验证
            Method saveUserMethod = userServiceClass.getMethod("saveUser", String.class);
            saveUserMethod.invoke(userService, "Alice");
            // 输出：Saving: Alice
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**关键步骤：**
1. 使用 Class.forName() 加载类
2. 使用 Constructor.newInstance() 创建对象
3. 使用 Method.invoke() 调用方法
4. 处理依赖注入逻辑

**学习要点：**
- 理解 Spring IoC 的基本原理
- 掌握反射创建对象和调用方法
- 认识反射在框架中的应用

</details>

### 练习 3：实现简单的 JSON 序列化

**任务：**
1. 创建一个 User 类，包含多个字段
2. 使用反射获取所有字段
3. 将对象转换为 JSON 字符串格式
4. 处理不同类型的字段（String、int、boolean）

**提示代码：**
```java
public class User {
    private String name;
    private int age;
    private boolean active;
    
    public User(String name, int age, boolean active) {
        this.name = name;
        this.age = age;
        this.active = active;
    }
}

public class JsonSerializationExercise {
    public static void main(String[] args) {
        User user = new User("Alice", 25, true);
        
        // TODO: 使用反射将 user 对象转换为 JSON 字符串
        // 期望输出：{"name":"Alice","age":25,"active":true}
    }
    
    // TODO: 实现 toJson 方法
    public static String toJson(Object obj) {
        // 使用反射获取字段
        // 构建 JSON 字符串
        return "";
    }
}
```

<details>
<summary>点击查看答案</summary>

**解答代码：**

```java
public class User {
    private String name;
    private int age;
    private boolean active;
    
    public User(String name, int age, boolean active) {
        this.name = name;
        this.age = age;
        this.active = active;
    }
}

public class JsonSerializationExercise {
    public static void main(String[] args) {
        User user = new User("Alice", 25, true);
        String json = toJson(user);
        System.out.println(json);
        // 输出：{"name":"Alice","age":25,"active":true}
    }
    
    public static String toJson(Object obj) {
        try {
            StringBuilder json = new StringBuilder("{");
            Class<?> clazz = obj.getClass();
            Field[] fields = clazz.getDeclaredFields();
            
            for (int i = 0; i < fields.length; i++) {
                Field field = fields[i];
                field.setAccessible(true);  // 跳过访问检查
                
                // 添加字段名
                json.append("\"").append(field.getName()).append("\":");
                
                // 获取字段值
                Object value = field.get(obj);
                
                // 根据类型格式化值
                if (value instanceof String) {
                    json.append("\"").append(value).append("\"");
                } else if (value instanceof Boolean || value instanceof Number) {
                    json.append(value);
                } else if (value == null) {
                    json.append("null");
                } else {
                    json.append("\"").append(value.toString()).append("\"");
                }
                
                // 添加逗号（最后一个字段不加）
                if (i < fields.length - 1) {
                    json.append(",");
                }
            }
            
            json.append("}");
            return json.toString();
            
        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
        }
    }
}
```

**关键步骤：**
1. 使用 getDeclaredFields() 获取所有字段
2. 使用 setAccessible(true) 访问私有字段
3. 使用 Field.get() 获取字段值
4. 根据字段类型格式化 JSON 值

**学习要点：**
- 理解 Jackson 等 JSON 库的基本原理
- 掌握反射获取字段和值
- 认识反射在序列化中的应用

</details>

---

## 下一章预告

在第五章《类加载机制》中，我们将深入探索 JVM 的类加载过程：

- 类加载的完整过程（加载、验证、准备、解析、初始化）
- 类加载器的层次结构（Bootstrap、Extension、Application）
- 双亲委派模型的工作原理
- 如何打破双亲委派模型（自定义类加载器）
- 热部署的实现原理
- OSGi 模块化机制

**剧透：** 你将学会编写自定义类加载器，实现类的热替换，理解 Tomcat 是如何隔离不同 Web 应用的！

敬请期待！🚀
