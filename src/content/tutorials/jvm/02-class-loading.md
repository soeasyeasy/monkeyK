---
title: '第二章：类加载机制'
description: '类加载过程、双亲委派模型、自定义类加载器'
---

# 第二章：类加载机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- JVM 是如何加载 `.class` 文件的？
- 什么是类加载器？有哪些类型？
- 什么是双亲委派模型？为什么要这样设计？
- 如何自定义类加载器？有什么应用场景？

这一章就是为了解答这些问题。我们会先搞清楚 **类加载的完整过程**，再深入理解双亲委派模型，最后动手实现自定义类加载器。

---

## 2.1 为什么需要类加载机制？

### 痛点分析

想象一下这个场景：

你写了一个 Java 程序，里面有 1000 个类。如果程序启动时就把所有类都加载到内存，会浪费大量内存资源。而且，有些类可能永远用不到。

这就是**类加载的必要性**——按需加载，节省内存。

### 类加载的解决方案

JVM 采用**懒加载**策略：只有当程序主动使用某个类时，才会加载该类。

打个比方：

> 就像你去图书馆，不会把整个图书馆的书都搬回家，而是需要什么书才去借什么书。

---

## 2.2 类加载的完整过程

### 类加载的五个阶段

类从被加载到内存中，到卸载出内存，整个生命周期包括：

```
加载 → 验证 → 准备 → 解析 → 初始化 → 使用 → 卸载
```

其中，**验证、准备、解析**统称为**连接（Linking）**。

### 各阶段详解

#### 1. 加载（Loading）

加载阶段做的事情：

- 通过类的全限定名获取二进制字节流
- 将字节流代表的静态存储结构转化为方法区的运行时数据结构
- 在堆中生成一个代表这个类的 `java.lang.Class` 对象

```java
// 示例：加载一个类
// 当代码中首次使用 MyClass 时，JVM 会加载它
MyClass obj = new MyClass(); // 这里触发加载
```

#### 2. 验证（Verification）

验证阶段的目的是确保字节码文件的格式正确，不会对 JVM 造成危害。

验证的内容包括：

- 文件格式验证（是否符合 Class 文件格式规范）
- 元数据验证（是否符合 Java 语法规范）
- 字节码验证（是否符合 JVM 指令规范）
- 符号引用验证（是否可以正确解析）

#### 3. 准备（Preparation）

准备阶段为**类的静态变量**分配内存并设置初始值。

```java
// 示例：准备阶段
public class MyClass {
    // 准备阶段设置为默认值 0
    public static int count = 10; // 注意：这里先设为 0
    
    // 准备阶段设置为默认值 null
    public static String name = "test"; // 注意：这里先设为 null
}
```

> **注意**：准备阶段只设置默认值，真正的赋值是在初始化阶段。

#### 4. 解析（Resolution）

解析阶段将**符号引用**替换为**直接引用**。

- **符号引用**：用名称来标识目标（如类名、方法名）
- **直接引用**：直接指向目标的指针（如内存地址）

#### 5. 初始化（Initialization）

初始化阶段执行**类的静态代码块**和**静态变量赋值**。

```java
// 示例：初始化阶段
public class MyClass {
    // 静态变量
    public static int count = 10; // 初始化阶段赋值为 10
    
    // 静态代码块
    static {
        System.out.println("MyClass 被初始化了");
        // 这里可以执行复杂的初始化逻辑
    }
}
```

### 初始化时机

类会在以下情况被初始化：

| 场景 | 说明 |
| --- | --- |
|  new 对象 | 使用 `new` 关键字创建对象 |
| 访问静态字段 | 读取或设置类的静态变量 |
| 调用静态方法 | 调用类的静态方法 |
| 反射调用 | 使用 `Class.forName()` 等反射方法 |
| 初始化子类 | 初始化子类时，父类先初始化 |
| 主类启动 | JVM 启动时先初始化主类 |

---

## 2.3 类加载器

### 什么是类加载器

类加载器（ClassLoader）是 JVM 中负责**加载类**的组件。它根据类的全限定名查找并加载类文件。

### 类加载器的分类

JVM 内置了三种类加载器：

```
Bootstrap ClassLoader（启动类加载器）
    ↓
Extension ClassLoader（扩展类加载器）
    ↓
Application ClassLoader（应用程序类加载器）
    ↓
Custom ClassLoader（自定义类加载器）
```

| 类加载器 | 职责 | 加载位置 |
| --- | --- | --- |
| Bootstrap ClassLoader | 加载 Java 核心类库 | `rt.jar`、`classes` 等 |
| Extension ClassLoader | 加载扩展类库 | `ext` 目录 |
| Application ClassLoader | 加载用户类路径上的类 | `classpath` |
| Custom ClassLoader | 加载自定义位置的类 | 自定义位置 |

### 类加载器的关系

```java
// 示例：查看类加载器
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // 获取系统类加载器
        ClassLoader systemLoader = ClassLoader.getSystemClassLoader();
        System.out.println("系统类加载器：" + systemLoader);
        
        // 获取扩展类加载器
        ClassLoader extLoader = systemLoader.getParent();
        System.out.println("扩展类加载器：" + extLoader);
        
        // 获取启动类加载器
        ClassLoader bootstrapLoader = extLoader.getParent();
        System.out.println("启动类加载器：" + bootstrapLoader);
        
        // 查看当前类的类加载器
        System.out.println("当前类的类加载器：" + 
            ClassLoaderDemo.class.getClassLoader());
    }
}
```

---

## 2.4 双亲委派模型

### 什么是双亲委派模型

双亲委派模型是一种**类加载的委托机制**：当一个类加载器收到加载请求时，它不会自己先加载，而是把请求委托给父类加载器。

### 工作流程

```
加载请求 → Application ClassLoader
    ↓ 委托
Extension ClassLoader
    ↓ 委托
Bootstrap ClassLoader
    ↓ 尝试加载
如果父加载器无法加载，子加载器再尝试加载
```

### 双亲委派的好处

| 好处 | 说明 |
| --- | --- |
| 避免重复加载 | 父类加载器已经加载的类，子类加载器不会再加载 |
| 保证核心类安全 | 防止用户自定义的类替换核心类（如 `java.lang.String`） |
| 层次清晰 | 不同层次的类由不同的类加载器负责 |

### 双亲委派的实现

```java
// 示例：双亲委派的实现逻辑
protected Class<?> loadClass(String name, boolean resolve) 
    throws ClassNotFoundException {
    
    // 先检查这个类是否已经被加载过
    Class<?> c = findLoadedClass(name);
    
    if (c == null) {
        try {
            // 如果有父类加载器，委托给父类加载器
            if (parent != null) {
                c = parent.loadClass(name);
            } else {
                // 如果没有父类加载器，使用启动类加载器
                c = findBootstrapClassOrNull(name);
            }
        } catch (ClassNotFoundException e) {
            // 父类加载器无法加载，子类加载器自己尝试加载
            c = findClass(name);
        }
    }
    
    if (resolve) {
        resolveClass(c);
    }
    
    return c;
}
```

---

## 2.5 打破双亲委派模型

### 为什么要打破双亲委派

有些场景需要打破双亲委派：

| 场景 | 原因 |
| --- | --- |
| SPI 机制 | 核心类需要加载用户实现的类 |
| OSGi | 模块化需要灵活的类加载策略 |
| 热部署 | 需要重新加载已加载的类 |

### 如何打破双亲委派

自定义类加载器，重写 `loadClass` 方法：

```java
// 示例：自定义类加载器
public class MyClassLoader extends ClassLoader {
    
    private String classPath;
    
    public MyClassLoader(String classPath) {
        this.classPath = classPath;
    }
    
    @Override
    protected Class<?> findClass(String name) 
        throws ClassNotFoundException {
        try {
            // 读取类文件的字节码
            byte[] data = loadClassData(name);
            // 定义类
            return defineClass(name, data, 0, data.length);
        } catch (IOException e) {
            throw new ClassNotFoundException(name);
        }
    }
    
    private byte[] loadClassData(String name) throws IOException {
        // 将类名转换为文件路径
        String path = classPath + File.separator + 
            name.replace('.', File.separatorChar) + ".class";
        
        // 读取文件内容
        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = is.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
            return baos.toByteArray();
        }
    }
}
```

### 使用自定义类加载器

```java
// 示例：使用自定义类加载器
public class ClassLoaderTest {
    public static void main(String[] args) throws Exception {
        // 创建自定义类加载器
        MyClassLoader myLoader = new MyClassLoader("/path/to/classes");
        
        // 加载类
        Class<?> clazz = myLoader.loadClass("com.example.MyClass");
        
        // 创建对象
        Object obj = clazz.newInstance();
        
        // 调用方法
        Method method = clazz.getMethod("sayHello");
        method.invoke(obj);
        
        // 查看类加载器
        System.out.println("类加载器：" + clazz.getClassLoader());
    }
}
```

---

## 2.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 类加载过程 | 加载 → 验证 → 准备 → 解析 → 初始化 |
| 类加载器分类 | Bootstrap、Extension、Application、Custom |
| 双亲委派模型 | 类加载的委托机制，保证核心类安全 |
| 打破双亲委派 | 自定义类加载器，重写 `loadClass` 方法 |
| 初始化时机 | new 对象、访问静态字段、调用静态方法等 |

---

## 2.7 新手常见误区

### 误区 1："类加载就是类初始化"

**错！** 类加载包括五个阶段：加载、验证、准备、解析、初始化。初始化只是其中一个阶段。

正确做法：理解类加载的完整过程，初始化只是最后一步。

### 误区 2："双亲委派是必须的，不能打破"

不是的。双亲委派只是推荐的设计模式，不是强制要求。可以通过自定义类加载器打破双亲委派。

### 误区 3："准备阶段会给静态变量赋初始值"

不对。准备阶段只设置**默认值**（如 int 为 0，对象为 null），真正的赋值是在**初始化阶段**。

### 误区 4："自定义类加载器必须重写 loadClass 方法"

实际上，通常只需要重写 `findClass` 方法。`loadClass` 方法已经实现了双亲委派逻辑，除非你想打破它。

---

## 2.8 动手练习

### 练习 1：基础题

请回答以下问题：

1. 类加载的五个阶段是什么？
2. 双亲委派模型有什么好处？
3. 什么时候会触发类的初始化？

<details>
<summary>点击查看答案</summary>

1. 类加载的五个阶段：
   - 加载（Loading）
   - 验证（Verification）
   - 准备（Preparation）
   - 解析（Resolution）
   - 初始化（Initialization）

2. 双亲委派模型的好处：
   - 避免重复加载
   - 保证核心类安全（防止用户自定义类替换核心类）
   - 层次清晰，职责分明

3. 触发类初始化的场景：
   - 使用 `new` 关键字创建对象
   - 访问类的静态字段（非 final 常量）
   - 调用类的静态方法
   - 使用反射调用类
   - 初始化子类时，父类先初始化
   - JVM 启动时加载主类

</details>

### 练习 2：进阶题

请编写一个自定义类加载器，能够加载指定目录下的类文件。

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;

public class CustomClassLoader extends ClassLoader {
    
    private String classDir;
    
    public CustomClassLoader(String classDir) {
        this.classDir = classDir;
    }
    
    @Override
    protected Class<?> findClass(String name) 
        throws ClassNotFoundException {
        try {
            // 构建类文件路径
            String filePath = classDir + File.separator + 
                name.replace('.', File.separatorChar) + ".class";
            
            // 读取类文件
            File classFile = new File(filePath);
            if (!classFile.exists()) {
                throw new ClassNotFoundException("类文件不存在：" + filePath);
            }
            
            // 读取字节码
            try (FileInputStream fis = new FileInputStream(classFile);
                 ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                
                byte[] buffer = new byte[1024];
                int len;
                while ((len = fis.read(buffer)) != -1) {
                    baos.write(buffer, 0, len);
                }
                
                byte[] classData = baos.toByteArray();
                
                // 定义类
                return defineClass(name, classData, 0, classData.length);
            }
        } catch (IOException e) {
            throw new ClassNotFoundException("加载类失败：" + name, e);
        }
    }
}

// 使用示例
public class CustomClassLoaderDemo {
    public static void main(String[] args) throws Exception {
        CustomClassLoader loader = new CustomClassLoader("/path/to/classes");
        Class<?> clazz = loader.loadClass("com.example.MyClass");
        Object obj = clazz.newInstance();
        System.out.println("类加载成功：" + obj.getClass().getName());
    }
}
```

</details>

### 练习 3（挑战）：综合题

请解释为什么 Java 的 SPI（Service Provider Interface）机制需要打破双亲委派模型？如何实现？

<details>
<summary>点击查看答案</summary>

**为什么需要打破双亲委派**：

Java 的 SPI 机制中，核心接口（如 `java.sql.Driver`）由启动类加载器加载，但实现类通常由用户定义，在 classpath 下。

如果遵循双亲委派，启动类加载器无法加载 classpath 下的实现类。因此需要打破双亲委派，让核心接口能够加载用户实现的类。

**如何实现**：

使用**线程上下文类加载器**（Thread Context ClassLoader）：

```java
// 示例：SPI 机制的实现
public class ServiceLoader<S> implements Iterable<S> {
    
    private static final String PREFIX = "META-INF/services/";
    
    public static <S> ServiceLoader<S> load(Class<S> service) {
        // 获取线程上下文类加载器
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        return new ServiceLoader<>(service, cl);
    }
    
    private ServiceLoader(Class<S> service, ClassLoader loader) {
        // 使用指定的类加载器加载实现类
        load(service, loader);
    }
    
    private void load(Class<S> service, ClassLoader loader) {
        // 读取 META-INF/services/ 下的配置文件
        // 使用 loader 加载实现类
    }
}
```

通过线程上下文类加载器，核心代码可以使用应用程序类加载器加载用户实现的类，从而打破双亲委派。

</details>

---

## 下一章预告

下一章我们会学习 **运行时数据区**——也就是 JVM 在运行程序时如何管理内存。你会学到堆、栈、方法区等内存区域的作用和特点，以及它们如何协同工作。
