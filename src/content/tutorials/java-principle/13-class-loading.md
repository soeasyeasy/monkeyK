---
title: "第十三章：类加载原理"
description: "深入理解类加载过程、双亲委派模型、自定义类加载器与热部署原理"
---

# 第十三章：类加载原理

## 本章导读

在前面几章我们学习了 JVM 的内存结构和垃圾回收机制。但你有没有想过这些问题：

- 你写了一个 `.java` 文件，从编译到运行，中间到底经历了什么？
- 为什么有时候明明类存在，运行时却报 `ClassNotFoundException`？
- 双亲委派模型是什么？为什么 Java 要设计这么"绕"的加载机制？
- Tomcat 为什么要打破双亲委派？热部署又是怎么实现的？

这一章我们就来揭开类加载的神秘面纱。类加载是 Java 运行的第一步，理解了它，你才能真正明白 Java 程序是怎么"跑起来"的。

学完本章，你将能够：
- 完整描述类从加载到卸载的生命周期
- 理解双亲委派模型的设计原理和实际意义
- 手写自定义类加载器
- 理解热部署的底层实现原理
- 掌握类的初始化时机（主动引用 vs 被动引用）

---

## 13.1 为什么需要类加载机制？

### 生活化类比

想象你去一家餐厅吃饭。你不需要知道厨师怎么切菜、怎么炒菜——你只需要点菜，服务员就会把菜端上来。

类加载机制就像餐厅的"后厨系统"：
- 你写了代码（点了菜）
- JVM 自动帮你把类加载进来（后厨自动做菜）
- 你直接使用类（享受美食）

但如果你不了解后厨的运作方式，当菜出了问题（比如 `ClassNotFoundException`），你就完全不知道该怎么办。

### 痛点分析

如果没有类加载机制，会面临这些问题：

1. **无法动态加载**：所有类必须在编译时就确定，无法在运行时按需加载
2. **无法隔离**：不同应用的类会互相冲突（比如两个应用用了不同版本的同一个库）
3. **无法热替换**：修改一个类必须重启整个 JVM
4. **安全隐患**：无法阻止恶意代码替换核心类

```java
// 没有类加载机制的世界 —— 想象一下有多可怕
// 1. 所有类启动时全部加载，内存直接爆炸
// 2. 两个 jar 包有同名类，直接冲突
// 3. 改了一行代码，必须重启整个应用
// 4. 有人伪造了一个 java.lang.String，你根本无法防御
```

### 解决方案：类加载机制

Java 的类加载机制完美解决了以上问题：
- **按需加载**：用到哪个类才加载哪个类
- **命名空间隔离**：不同类加载器加载的类互不冲突
- **热部署**：通过替换类加载器实现类的热替换
- **安全校验**：加载过程中有验证环节，防止恶意代码

---

## 13.2 核心原理

### 13.2.1 类的生命周期

一个类从诞生到消亡，经历 **7 个阶段**：

```
加载 → 验证 → 准备 → 解析 → 初始化 → 使用 → 卸载
|______加载阶段______|          |__使用__|
         ↑                        ↑
    类加载器负责              JVM 负责
```

> 其中验证、准备、解析统称为 **连接（Linking）** 阶段。

#### 各阶段详解

| 阶段 | 做了什么 | 生活化类比 |
|------|---------|-----------|
| 加载 | 找到 .class 文件，读取字节流，创建 Class 对象 | 快递员把包裹送到你家 |
| 验证 | 检查字节码是否符合 JVM 规范 | 安检员检查包裹有没有违禁品 |
| 准备 | 给类的静态变量分配内存并设默认值 | 给新房子通水通电（但还没开通网络） |
| 解析 | 把符号引用替换为直接引用 | 把门牌号换成实际GPS坐标 |
| 初始化 | 执行静态代码块和静态变量赋值 | 正式入住，开始生活 |
| 使用 | 程序正常使用这个类 | 正常过日子 |
| 卸载 | 类不再使用，从方法区清除 | 搬走，拆除房子 |

#### 代码示例：观察加载过程

```java
// 演示类的初始化时机
public class ClassInitDemo {
    public static void main(String[] args) {
        // 此时 Father 类还没有被初始化
        System.out.println("开始测试");

        // 主动引用 —— 触发 Father 的初始化
        System.out.println(Father.field);
        // 输出：Father 静态代码块执行
        // 输出：Hello

        // 被动引用 —— 不会触发 Father 的初始化
        System.out.println(Father.staticField);
        // 通过子类引用父类静态字段，只触发 Father 初始化，不触发 Child 初始化
    }
}

class Father {
    // 静态变量 —— 准备阶段赋默认值 0，初始化阶段赋 100
    public static int field = 100;

    // 常量 —— 编译期就确定了，不会触发初始化
    public static final int staticField = 200;

    // 静态代码块 —— 初始化阶段执行
    static {
        System.out.println("Father 静态代码块执行");
    }
}

class Child extends Father {
    static {
        System.out.println("Child 静态代码块执行");
    }
}
```

### 13.2.2 类加载器层次结构

Java 的类加载器像一棵"家谱树"，从上到下分四层：

```
          ┌──────────────────┐
          │  Bootstrap 类加载器  │  ← 加载 rt.jar（java.lang.* 等核心类）
          │    （启动类加载器）    │     C++ 实现，不是 Java 类
          └────────┬─────────┘
                   │
          ┌────────▼─────────┐
          │  Extension 类加载器   │  ← 加载 ext 目录下的 jar 包
          │   （扩展类加载器）     │
          └────────┬─────────┘
                   │
          ┌────────▼─────────┐
          │ Application 类加载器 │  ← 加载 classpath 下的类（你的代码）
          │  （应用类加载器）     │
          └────────┬─────────┘
                   │
          ┌────────▼─────────┐
          │  Custom 类加载器     │  ← 你自己写的类加载器
          │  （自定义类加载器）    │
          └──────────────────┘
```

```java
// 查看各类加载器的实际身份
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // 查看核心类由谁加载
        System.out.println(String.class.getClassLoader());
        // 输出：null（Bootstrap 加载的，Java 层面看不到）

        // 查看扩展类由谁加载
        // System.out.println(SomeExtClass.class.getClassLoader());
        // 输出：sun.misc.Launcher$ExtClassLoader@xxx

        // 查看我们自己写的类由谁加载
        System.out.println(ClassLoaderDemo.class.getClassLoader());
        // 输出：sun.misc.Launcher$AppClassLoader@xxx（JDK8）
        // 或：jdk.internal.loader.ClassLoaders$AppClassLoader@xxx（JDK9+）
    }
}
```

### 13.2.3 双亲委派模型

#### 什么是双亲委派？

> "双亲"不是"两个爸爸"，而是"父加载器"的意思。每个类加载器都有自己的"父亲"。

**工作流程**（用生活类比）：

想象你要办一件大事，你自己搞不定，你会：
1. 先问自己能不能做 → 自己不行
2. 问爸爸能不能做 → 爸爸不行
3. 问爷爷能不能做 → 爷爷不行
4. 问曾祖父能不能做 → 曾祖父搞定了！
5. 如果曾祖父也搞不定，再一层层退回来，最终由自己能做的层级来做

```java
// 双亲委派的源码 —— 其实非常简单
// 来自 java.lang.ClassLoader
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException {
    
    synchronized (getClassLoadingLock(name)) {
        // 1. 先检查这个类是否已经被加载过了
        Class<?> c = findLoadedClass(name);
        
        if (c == null) {
            // 2. 还没加载过，开始双亲委派
            try {
                if (parent != null) {
                    // 2a. 有父加载器，委托给父加载器
                    c = parent.loadClass(name, resolve);
                } else {
                    // 2b. 没有父加载器了（到 Bootstrap 了）
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 3. 父加载器们也加载不了，抛异常
            }
            
            if (c == null) {
                // 4. 父加载器们都加载不了，自己来
                c = findClass(name);
            }
        }
        
        if (resolve) {
            // 5. 如果需要解析，执行链接操作
            resolveClass(c);
        }
        
        return c;
    }
}
```

#### 为什么需要双亲委派？

**核心原因：安全 + 唯一**

```java
// 如果没有双亲委派，会出什么事？
// 场景：有人写了一个恶意的 java.lang.String 类

package java.lang;
public class String {
    // 恶意代码：偷偷把你的数据发送到黑客服务器
    public String hack() {
        // 发送数据到远程服务器...
        return "hacked!";
    }
}

// 有了双亲委派：
// 1. 你的应用类加载器收到加载 java.lang.String 的请求
// 2. 委托给 Extension → 再委托给 Bootstrap
// 3. Bootstrap 在 rt.jar 中找到了官方的 String 类，直接加载
// 4. 你的恶意 String 永远不会被加载！
```

**双亲委派的两大好处**：

| 好处 | 说明 | 类比 |
|------|------|------|
| 避免重复加载 | 父加载器加载过的类，子加载器不会再加载 | 爸爸处理过的事，儿子不用重复处理 |
| 防止核心类被篡改 | java.lang.* 等核心类永远由 Bootstrap 加载 | 身份证只能由公安局发，任何人都不能伪造 |

### 13.2.4 打破双亲委派

有些场景必须打破双亲委派：

#### 场景一：SPI 机制（JDBC、SLF4J）

```java
// SPI 问题：
// Bootstrap 加载器加载 java.sql.Driver 接口
// 但实现类（如 com.mysql.cj.jdbc.Driver）在 classpath 下
// Bootstrap 加载器找不到实现类！

// 解决方案：线程上下文类加载器
// 父加载器可以"反向"请求子加载器去加载

// JDBC 加载驱动的源码
public class DriverManager {
    // 静态代码块中加载驱动
    static {
        // 使用线程上下文类加载器（默认是 AppClassLoader）
        // 这样就打破了双亲委派，从 Bootstrap 反向委托到 Application
        loadInitialDrivers();
    }
    
    private static void loadInitialDrivers() {
        // 通过 ServiceLoader 加载 SPI 实现
        ServiceLoader<Driver> loadedDrivers = ServiceLoader.load(Driver.class);
        // ServiceLoader 内部使用线程上下文类加载器来查找实现类
    }
}
```

#### 场景二：Tomcat 的 WebAppClassLoader

```
           Bootstrap
               │
          System (App)
               │
        ┌──────┴──────┐
   WebAppCL1      WebAppCL2      ← 两个 Web 应用各自独立
   (App1)         (App2)           可以加载不同版本的同名类
```

```java
// Tomcat 为什么要打破双亲委派？
// 假设你部署了两个 Web 应用：
// - App1 用了 Spring 5.x
// - App2 用了 Spring 6.x
// 如果用双亲委派，两个应用只能加载一个版本的 Spring
// Tomcat 让每个 Web 应用有自己的类加载器，互相隔离

// Tomcat 的类加载顺序（与双亲委派相反）：
// 1. 先从自己的 WebApp 目录找（优先加载应用自己的类）
// 2. 找不到再委托给父加载器
// 这叫"子类优先"模式
```

#### 场景三：OSGi 模块化

```java
// OSGi 实现了真正的"热插拔"模块系统
// 每个 Bundle（模块）有自己的类加载器
// Bundle 之间可以共享类，也可以隔离类
// 这就是 Eclipse 插件系统的底层原理
```

### 13.2.5 自定义类加载器

```java
// 自定义类加载器的两种方式：
// 方式一（推荐）：重写 findClass() 方法 —— 保持双亲委派
// 方式二（不推荐）：重写 loadClass() 方法 —— 打破双亲委派

import java.io.*;
import java.nio.file.*;

// 方式一：自定义类加载器（推荐写法）
public class MyClassLoader extends ClassLoader {
    
    // 类文件的查找路径
    private String classPath;
    
    // 构造方法：指定查找路径
    public MyClassLoader(String classPath) {
        this.classPath = classPath;
    }
    
    // 核心：重写 findClass 方法
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            // 1. 把类名转换为文件路径（com.example.Hello → com/example/Hello.class）
            String fileName = name.replace('.', '/') + ".class";
            
            // 2. 拼接完整路径
            Path path = Paths.get(classPath, fileName);
            
            // 3. 读取字节码
            byte[] bytes = Files.readAllBytes(path);
            
            // 4. 调用 defineClass 把字节码转换为 Class 对象
            return defineClass(name, bytes, 0, bytes.length);
            
        } catch (IOException e) {
            // 找不到类文件，抛出异常
            throw new ClassNotFoundException("找不到类: " + name, e);
        }
    }
}
```

```java
// 测试自定义类加载器
public class CustomClassLoaderTest {
    public static void main(String[] args) throws Exception {
        // 创建自定义类加载器，指定类文件所在目录
        MyClassLoader myLoader = new MyClassLoader("D:/myclasses");
        
        // 使用自定义加载器加载类
        Class<?> clazz = myLoader.loadClass("com.example.Hello");
        
        // 创建实例并调用方法
        Object obj = clazz.getDeclaredConstructor().newInstance();
        // 通过反射调用方法
        clazz.getMethod("sayHello").invoke(obj);
        
        // 验证加载器身份
        System.out.println("加载器: " + clazz.getClassLoader());
        // 输出：加载器: MyClassLoader@xxx
    }
}
```

### 13.2.6 热部署原理

```java
// 热部署的核心思路：
// 1. 每个模块用独立的类加载器加载
// 2. 需要更新时，丢弃旧的类加载器，创建新的
// 3. 新类加载器重新加载修改后的类

// 简化的热部署实现
public class HotDeployDemo {
    
    // 当前模块的类加载器
    private static MyClassLoader currentLoader;
    
    // 模拟模块加载
    public static void loadModule(String modulePath) throws Exception {
        // 创建新的类加载器
        currentLoader = new MyClassLoader(modulePath);
        
        // 加载模块中的类
        Class<?> clazz = currentLoader.loadClass("com.example.Module");
        System.out.println("模块加载完成，类加载器: " + currentLoader);
    }
    
    // 模拟热更新
    public static void hotReload(String modulePath) throws Exception {
        // 1. 保存旧的类加载器引用（旧的 Class 对象会被 GC 回收）
        MyClassLoader oldLoader = currentLoader;
        
        // 2. 创建新的类加载器
        currentLoader = new MyClassLoader(modulePath);
        
        // 3. 重新加载类（会加载到最新编译的版本）
        Class<?> clazz = currentLoader.loadClass("com.example.Module");
        System.out.println("热更新完成，新类加载器: " + currentLoader);
        
        // 4. 旧类加载器没有任何引用后，会被 GC 回收
        // 包括它加载的所有 Class 对象也会被回收
    }
    
    public static void main(String[] args) throws Exception {
        // 第一次加载
        loadModule("D:/modules/v1");
        
        // 修改代码后，重新编译
        // ...
        
        // 热更新（不需要重启 JVM）
        hotReload("D:/modules/v2");
    }
}
```

### 13.2.7 类的初始化时机

Java 规定了 **5 种主动引用** 会触发类的初始化：

```java
public class InitTiming {
    public static void main(String[] args) {
        // ===== 主动引用（会触发初始化）=====
        
        // 1. new 对象
        MyClass obj = new MyClass();
        
        // 2. 读写静态字段（final 常量除外）
        int value = MyClass.staticField;
        
        // 3. 调用静态方法
        MyClass.staticMethod();
        
        // 4. 反射调用 Class.forName()
        Class<?> clazz = Class.forName("com.example.MyClass");
        
        // 5. 初始化子类时，父类先初始化
        // new ChildClass(); // 会先初始化 ParentClass
    }
}

// ===== 被动引用（不会触发初始化）=====
public class PassiveRef {
    public static void main(String[] args) {
        // 1. 通过子类引用父类的静态字段 —— 只初始化父类
        System.out.println(Child.staticField);
        // 只会初始化 Parent，不会初始化 Child
        
        // 2. 通过数组定义引用类 —— 不初始化
        Parent[] arr = new Parent[10];
        // 不会触发 Parent 的初始化
        
        // 3. 引用 final 静态常量 —— 编译期已确定值
        System.out.println(Parent.CONSTANT);
        // 不会触发 Parent 的初始化（值在编译时已内联）
    }
}

class Parent {
    public static int staticField = 100;
    public static final int CONSTANT = 200; // 编译期常量
    static { System.out.println("Parent 初始化"); }
}

class Child extends Parent {
    static { System.out.println("Child 初始化"); }
}
```

---

## 13.3 基础用法

### 获取类加载器信息

```java
// 获取类加载器的三种方式
public class GetClassLoader {
    public static void main(String[] args) {
        // 方式一：通过 Class 对象获取
        ClassLoader loader1 = String.class.getClassLoader();
        System.out.println("String 的加载器: " + loader1);
        // 输出 null —— 因为 String 是 Bootstrap 加载的

        // 方式二：通过当前线程获取
        ClassLoader loader2 = Thread.currentThread().getContextClassLoader();
        System.out.println("当前线程的加载器: " + loader2);
        // 输出：AppClassLoader —— 线程上下文类加载器

        // 方式三：通过系统类加载器获取
        ClassLoader loader3 = ClassLoader.getSystemClassLoader();
        System.out.println("系统加载器: " + loader3);
        // 输出：AppClassLoader

        // 获取加载器层级关系
        ClassLoader appLoader = ClassLoader.getSystemClassLoader();
        System.out.println("App 的父加载器: " + appLoader.getParent());
        // 输出：ExtClassLoader（JDK8）或 PlatformClassLoader（JDK9+）
        
        System.out.println("Ext 的父加载器: " + appLoader.getParent().getParent());
        // 输出：null（Bootstrap 是 C++ 实现的，Java 层面是 null）
    }
}
```

### 使用 SPI 机制

```java
// 演示 SPI 的使用（以 JDBC 为例）
import java.sql.Driver;
import java.util.ServiceLoader;

public class SPIDemo {
    public static void main(String[] args) {
        // 方式一：传统的 JDBC 驱动加载
        // Class.forName("com.mysql.cj.jdbc.Driver"); // 触发类初始化，注册驱动
        
        // 方式二：ServiceLoader 加载 SPI 实现
        // ServiceLoader 内部使用线程上下文类加载器
        ServiceLoader<Driver> drivers = ServiceLoader.load(Driver.class);
        
        // 遍历所有注册的驱动
        for (Driver driver : drivers) {
            System.out.println("发现驱动: " + driver.getClass().getName());
            // 输出：发现驱动: com.mysql.cj.jdbc.Driver
        }
    }
}

// SPI 的配置文件位置：
// META-INF/services/java.sql.Driver
// 文件内容：
// com.mysql.cj.jdbc.Driver
```

---

## 13.4 进阶用法

### 实现一个支持热部署的文件监控类加载器

```java
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.*;

// 支持文件监控的热部署类加载器
public class HotSwapClassLoader extends ClassLoader {
    
    // 类文件所在的目录
    private String classDir;
    
    // 已经加载的类名集合（用于判断是否需要重新加载）
    private ConcurrentHashMap<String, Long> classLoadTime = new ConcurrentHashMap<>();
    
    public HotSwapClassLoader(String classDir) {
        this.classDir = classDir;
    }
    
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            // 1. 构建文件路径
            String filePath = classDir + File.separatorChar 
                + name.replace('.', File.separatorChar) + ".class";
            
            // 2. 读取文件内容
            File file = new File(filePath);
            byte[] bytes = loadFileBytes(file);
            
            // 3. 记录加载时间
            classLoadTime.put(name, file.lastModified());
            
            // 4. 把字节码转换为 Class 对象
            return defineClass(name, bytes, 0, bytes.length);
            
        } catch (IOException e) {
            throw new ClassNotFoundException("加载类失败: " + name, e);
        }
    }
    
    // 检查类文件是否被修改过
    public boolean isModified(String name) {
        Long lastLoadTime = classLoadTime.get(name);
        if (lastLoadTime == null) {
            return false; // 还没加载过
        }
        
        String filePath = classDir + File.separatorChar 
            + name.replace('.', File.separatorChar) + ".class";
        File file = new File(filePath);
        
        // 比较文件修改时间和加载时间
        return file.lastModified() > lastLoadTime;
    }
    
    // 读取文件字节
    private byte[] loadFileBytes(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024]; // 1KB 缓冲区
            int len;
            while ((len = fis.read(buffer)) != -1) {
                baos.write(buffer, 0, len); // 写入缓冲区
            }
            return baos.toByteArray(); // 返回完整字节数组
        }
    }
}
```

### 实现双类加载器隔离

```java
// 模拟 Tomcat 的隔离机制：两个应用加载同名类互不干扰
public class IsolationDemo {
    public static void main(String[] args) throws Exception {
        // 创建两个独立的类加载器
        HotSwapClassLoader loader1 = new HotSwapClassLoader("D:/app1/classes");
        HotSwapClassLoader loader2 = new HotSwapClassLoader("D:/app2/classes");
        
        // 两个加载器分别加载同名类
        Class<?> class1 = loader1.loadClass("com.example.Service");
        Class<?> class2 = loader2.loadClass("com.example.Service");
        
        // 虽然是同名类，但它们是不同的 Class 对象
        System.out.println("class1 加载器: " + class1.getClassLoader());
        System.out.println("class2 加载器: " + class2.getClassLoader());
        System.out.println("是否相同: " + (class1 == class2));
        // 输出：false —— 不同类加载器加载的类互不相等
        
        // 不能互相转型
        // Object obj1 = class1.getDeclaredConstructor().newInstance();
        // Service s = (Service) obj1; // 如果 Service 是 class2 加载的，会 ClassCastException
    }
}
```

---

## 13.5 核心知识点总结

### 对比表格

| 知识点 | 核心内容 | 重要程度 |
|--------|---------|---------|
| 类加载过程 | 加载→验证→准备→解析→初始化→使用→卸载 | ★★★★★ |
| 类加载器层次 | Bootstrap → Extension → Application → Custom | ★★★★★ |
| 双亲委派 | 先委托父加载器，父加载器找不到才自己加载 | ★★★★★ |
| 打破双亲委派 | SPI（线程上下文类加载器）、Tomcat（子类优先）、OSGi | ★★★★ |
| 自定义加载器 | 推荐重写 findClass()，保持双亲委派 | ★★★★ |
| 热部署 | 替换类加载器实现类替换，旧加载器被 GC 回收 | ★★★ |
| 初始化时机 | 5 种主动引用触发初始化，3 种被动引用不触发 | ★★★★ |

### 关键公式

```
类加载 = 找到字节码（加载） + 合法性检查（验证） + 内存分配（准备） 
       + 符号解析（解析） + 执行静态代码（初始化）

双亲委派 = 向上委托查找 + 向下委托加载（实际加载的层级）
```

---

## 13.6 新手常见误区

### 误区 1："双亲委派就是两个父亲在委派"

**错！** "双亲"是"父加载器"的意思，不是两个爸爸。每个类加载器只有一个父加载器，形成的是链式结构，不是树状分叉。

```java
// 错误理解：以为 AppClassLoader 有两个父亲
// AppClassLoader → ExtClassLoader → BootstrapClassLoader（两个父亲？）

// 正确理解：每个加载器只有一个父亲，形成单链
// AppClassLoader 的父亲是 ExtClassLoader
// ExtClassLoader 的父亲是 BootstrapClassLoader
// 就像一条链子，不是分叉的树
```

### 误区 2："重写 loadClass() 和 findClass() 效果一样"

**错！** 区别非常大：

```java
// 重写 findClass()（推荐）
// - 保持双亲委派机制
// - 只改变了"自己加载"这一步的逻辑
// - 父加载器仍然优先加载
class MyLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) {
        // 只在这里实现自己的加载逻辑
        byte[] data = loadDataFromSomewhere(name);
        return defineClass(name, data, 0, data.length);
    }
}

// 重写 loadClass()（不推荐，除非你要打破双亲委派）
// - 完全覆盖了双亲委派逻辑
// - 需要自己处理所有加载流程
class MyLoader extends ClassLoader {
    @Override
    protected Class<?> loadClass(String name, boolean resolve) {
        // 这里直接加载，不委托给父加载器
        return findClass(name); // 打破了双亲委派！
    }
}
```

### 误区 3："类加载器越多越好"

**错！** 类加载器过多会导致：
- **内存泄漏**：每个类加载器都会持有它加载的 Class 对象引用
- **类隔离问题**：不同加载器加载的同名类不能互相转型
- **性能下降**：类查找路径变长

```java
// 错误做法：创建大量类加载器
for (int i = 0; i < 1000; i++) {
    new MyClassLoader("path/" + i); // 每创建一个就是一份内存开销
}

// 正确做法：按需创建，及时释放
MyClassLoader loader = new MyClassLoader("path");
// 使用完后，确保没有任何引用指向它，让 GC 回收
loader = null;
```

### 误区 4："热部署就是直接替换 .class 文件"

**错！** 仅仅替换文件是不够的，因为：
- 旧的 Class 对象仍然被引用，不会被 GC 回收
- 必须替换类加载器，让旧的 Class 对象失去引用

```java
// 错误做法：只替换文件
// 1. 把新的 A.class 复制到目录
// 2. 调用 loader.loadClass("A") —— 返回的还是旧版本！
// 因为 ClassLoader 会缓存已加载的类

// 正确做法：替换类加载器
// 1. 把新的 A.class 复制到目录
// 2. 创建新的 ClassLoader
// 3. 用新 ClassLoader 加载 A —— 得到新版本
// 4. 旧 ClassLoader 和它加载的旧 Class 被 GC 回收
```

### 误区 5："Bootstrap 加载器加载了所有 Java 核心类"

**不完全对！** JDK9 之后，Bootstrap 加载器的行为发生了变化：

```java
// JDK8：Bootstrap 从 rt.jar 加载核心类
// JDK9+：模块化后，Bootstrap 从模块系统加载核心类
// 而且 JDK9+ 把 ExtClassLoader 改名为 PlatformClassLoader

// JDK8 的加载器层次：
// Bootstrap → ExtClassLoader → AppClassLoader

// JDK9+ 的加载器层次：
// Bootstrap → PlatformClassLoader → AppClassLoader
```

---

## 13.7 动手练习

### 练习 1：验证双亲委派

编写代码验证双亲委派模型的工作流程：
1. 打印各类加载器的父子关系
2. 验证 `java.lang.String` 的加载器是 null
3. 验证自定义类的加载器是 AppClassLoader

<details>
<summary>点击查看答案</summary>

```java
public class Exercise1 {
    public static void main(String[] args) {
        // 1. 获取系统类加载器（AppClassLoader）
        ClassLoader appLoader = ClassLoader.getSystemClassLoader();
        System.out.println("系统加载器: " + appLoader);
        // 输出：jdk.internal.loader.ClassLoaders$AppClassLoader@xxx

        // 2. 获取父加载器（PlatformClassLoader / ExtClassLoader）
        ClassLoader extLoader = appLoader.getParent();
        System.out.println("父加载器: " + extLoader);
        // 输出：jdk.internal.loader.ClassLoaders$PlatformClassLoader@xxx（JDK9+）
        // 或：sun.misc.Launcher$ExtClassLoader@xxx（JDK8）

        // 3. 获取祖父加载器（应该是 null，因为 Bootstrap 是 C++ 实现的）
        ClassLoader bootstrapLoader = extLoader.getParent();
        System.out.println("祖父加载器: " + bootstrapLoader);
        // 输出：null

        // 4. 验证 String 的加载器
        System.out.println("String 的加载器: " + String.class.getClassLoader());
        // 输出：null —— Bootstrap 加载的核心类

        // 5. 验证自定义类的加载器
        System.out.println("Exercise1 的加载器: " + Exercise1.class.getClassLoader());
        // 输出：AppClassLoader —— 我们写的代码由应用加载器加载

        // 6. 验证双亲委派：自定义类加载器加载 String
        try {
            Class<?> clazz = new MyClassLoader("D:/classes").loadClass("java.lang.String");
            System.out.println("自定义加载器加载 String: " + clazz.getClassLoader());
            // 输出：null —— 仍然由 Bootstrap 加载（双亲委派生效）
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}

// 自定义类加载器
class MyClassLoader extends ClassLoader {
    private String classPath;

    public MyClassLoader(String classPath) {
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            String filePath = classPath + "/" + name.replace('.', '/') + ".class";
            java.io.File file = new java.io.File(filePath);
            if (file.exists()) {
                byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                return defineClass(name, bytes, 0, bytes.length);
            }
            throw new ClassNotFoundException(name);
        } catch (java.io.IOException e) {
            throw new ClassNotFoundException(name, e);
        }
    }
}
```

</details>

### 练习 2：自定义类加载器加载加密类

实现一个类加载器，能够加载经过简单 XOR 加密的 .class 文件：
1. 先用 XOR 加密 .class 文件
2. 自定义类加载器在加载时解密
3. 验证能正常创建对象和调用方法

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.nio.file.*;

public class Exercise2 {

    // 加密密钥（实际项目中应该更安全）
    private static final byte KEY = 0x42;

    // ===== 第一步：加密工具 =====
    // 把 .class 文件加密
    public static void encryptClass(String inputPath, String outputPath) throws IOException {
        // 读取原始字节码
        byte[] originalBytes = Files.readAllBytes(Paths.get(inputPath));

        // XOR 加密每个字节
        byte[] encryptedBytes = new byte[originalBytes.length];
        for (int i = 0; i < originalBytes.length; i++) {
            encryptedBytes[i] = (byte) (originalBytes[i] ^ KEY); // XOR 加密
        }

        // 写入加密后的文件
        Files.write(Paths.get(outputPath), encryptedBytes);
        System.out.println("加密完成: " + outputPath);
    }

    // ===== 第二步：自定义解密类加载器 =====
    static class DecryptClassLoader extends ClassLoader {
        private String classDir; // 加密类文件所在目录

        public DecryptClassLoader(String classDir) {
            this.classDir = classDir;
        }

        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            try {
                // 1. 构建文件路径
                String filePath = classDir + "/" + name.replace('.', '/') + ".class";

                // 2. 读取加密的字节码
                byte[] encryptedBytes = Files.readAllBytes(Paths.get(filePath));

                // 3. XOR 解密（XOR 的逆运算还是 XOR）
                byte[] decryptedBytes = new byte[encryptedBytes.length];
                for (int i = 0; i < encryptedBytes.length; i++) {
                    decryptedBytes[i] = (byte) (encryptedBytes[i] ^ KEY); // XOR 解密
                }

                // 4. 转换为 Class 对象
                return defineClass(name, decryptedBytes, 0, decryptedBytes.length);

            } catch (IOException e) {
                throw new ClassNotFoundException("解密加载失败: " + name, e);
            }
        }
    }

    // ===== 第三步：测试 =====
    public static void main(String[] args) throws Exception {
        // 假设你已经编译了 Hello.class 并加密到了 D:/encrypted_classes 目录
        // encryptClass("D:/classes/Hello.class", "D:/encrypted_classes/Hello.class");

        // 使用解密类加载器加载
        DecryptClassLoader loader = new DecryptClassLoader("D:/encrypted_classes");
        Class<?> clazz = loader.loadClass("Hello");

        // 创建对象并调用方法
        Object obj = clazz.getDeclaredConstructor().newInstance();
        clazz.getMethod("sayHello").invoke(obj);
        // 输出：Hello, World!

        System.out.println("加载器: " + clazz.getClassLoader());
        // 输出：DecryptClassLoader —— 证明确实是自定义加载器加载的
    }
}

// 被加密的类（需要先编译再加密）
// class Hello {
//     public void sayHello() {
//         System.out.println("Hello, World!");
//     }
// }
```

</details>

### 练习 3（挑战）：模拟热部署

实现一个完整的热部署演示：
1. 定义一个接口 `Greeter`（由 AppClassLoader 加载）
2. 定义一个实现类 `GreeterImpl`（由自定义加载器加载）
3. 模拟"更新代码"后，用新加载器重新加载 `GreeterImpl`
4. 验证新旧实例的行为不同

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.nio.file.*;

// 接口由 AppClassLoader 加载（放在 classpath 下）
interface Greeter {
    String greet(String name);
}

// 模拟热部署管理器
class HotDeployManager {
    // 当前使用的类加载器
    private ClassLoader currentLoader;
    // 当前 Greeter 实例
    private Greeter currentGreeter;

    // 部署（或更新）模块
    public void deploy(String classDir) throws Exception {
        // 1. 创建新的类加载器
        currentLoader = new ClassLoader(null) { // parent 为 null，不委托给任何加载器
            @Override
            protected Class<?> findClass(String name) throws ClassNotFoundException {
                try {
                    // 对于 Greeter 接口，委托给系统加载器（保持接口一致）
                    if (name.equals("Greeter")) {
                        return Class.forName(name);
                    }
                    // 其他类自己加载
                    String filePath = classDir + "/" + name.replace('.', '/') + ".class";
                    byte[] bytes = Files.readAllBytes(Paths.get(filePath));
                    return defineClass(name, bytes, 0, bytes.length);
                } catch (IOException e) {
                    throw new ClassNotFoundException(name, e);
                }
            }
        };

        // 2. 加载 GreeterImpl
        Class<?> implClass = currentLoader.loadClass("GreeterImpl");

        // 3. 创建实例（通过接口引用）
        currentGreeter = (Greeter) implClass.getDeclaredConstructor().newInstance();
        System.out.println("部署完成，加载器: " + implClass.getClassLoader());
    }

    // 使用当前部署
    public String greet(String name) {
        return currentGreeter.greet(name);
    }
}

// 主程序
public class Exercise3 {
    public static void main(String[] args) throws Exception {
        HotDeployManager manager = new HotDeployManager();

        // 第一次部署（v1 版本）
        manager.deploy("D:/modules/v1");
        System.out.println(manager.greet("Alice"));
        // 输出：Hello, Alice! (v1)

        // 模拟代码更新：重新编译 GreeterImpl 到 v2 目录
        // GreeterImpl v2 的 greet 方法返回 "Hi, " + name + " (v2)"

        // 热更新（不需要重启 JVM）
        manager.deploy("D:/modules/v2");
        System.out.println(manager.greet("Alice"));
        // 输出：Hi, Alice! (v2) —— 行为已经变了！

        // 旧的类加载器和它加载的 Class 对象会被 GC 回收
        System.gc(); // 建议 GC 回收
    }
}

// v1 版本的 GreeterImpl（放在 D:/modules/v1/ 下编译）
// public class GreeterImpl implements Greeter {
//     public String greet(String name) {
//         return "Hello, " + name + "! (v1)";
//     }
// }

// v2 版本的 GreeterImpl（放在 D:/modules/v2/ 下编译）
// public class GreeterImpl implements Greeter {
//     public String greet(String name) {
//         return "Hi, " + name + "! (v2)";
//     }
// }
```

</details>

---

## 下一章预告

下一章我们会进入 **字节码原理** 的世界——揭开 `.class` 文件的内部结构。你会学到：

- `.class` 文件到底长什么样（魔数、常量池、字段表、方法表）
- 常用字节码指令的含义（iload、istore、invokevirtual 等）
- 如何用 `javap` 工具查看字节码
- 四种方法调用指令的区别
- 字节码增强技术（ASM、ByteBuddy）
- Spring AOP、Mockito 等框架如何利用字节码增强

理解了字节码，你就能真正看懂 Java 代码在 JVM 层面到底是怎么执行的。
