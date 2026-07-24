---
title: '第一章：Java 简介与环境搭建'
description: 'Java 发展史、JDK 安装、Hello World'
---

# 第一章：Java 简介与环境搭建

## 运行结果

| 特性         | 说明                      |
| ------------ | ------------------------- |
| 跨平台       | 一次编写，到处运行（JVM） |
| 面向对象     | 封装、继承、多态          |
| 强类型       | 编译时类型检查            |
| 自动内存管理 | 垃圾回收机制（GC）        |
| 多线程支持   | 内建多线程支持            |

## Java 简介

Java 是由 Sun Microsystems（现属 Oracle）于 1995 年推出的面向对象编程语言。Java 以"一次编写，到处运行"（Write Once, Run Anywhere）著称，其程序编译后在 JVM（Java 虚拟机）上运行，实现跨平台。

### Java 的发展历程

```
1995年 - Java 1.0 发布
2004年 - Java 5.0（重大更新：泛型、注解、枚举、自动装箱拆箱）
2014年 - Java 8（Lambda 表达式、Stream API、新日期时间 API）
2017年 - Java 9（模块化、JShell、私有接口方法）
2018年 - Java 10（局部变量类型推断 var）
2021年 - Java 17（LTS 长期支持版本）
2023年 - Java 21（LTS，虚拟线程、模式匹配）
```

### Java 的应用领域

| 领域         | 说明         | 代表技术                          |
| ------------ | ------------ | --------------------------------- |
| 企业级应用   | 大型业务系统 | Spring、Spring Boot、Spring Cloud |
| Android 开发 | 移动应用     | Android SDK、Kotlin（兼容 Java）  |
| 大数据       | 数据处理     | Hadoop、Spark、Kafka、Flink       |
| 微服务       | 分布式系统   | Spring Cloud、Dubbo、gRPC         |
| 金融系统     | 银行、证券   | 高并发、高可用架构                |
| Web 应用     | 后端服务     | Spring MVC、Struts                |
| 嵌入式系统   | IoT 设备     | Java ME                           |

## Java 工作原理

### 编译与运行过程

```
源代码（.java） → 编译器（javac） → 字节码（.class） → JVM → 运行
```

1. **编写源代码**：使用文本编辑器或 IDE 编写 `.java` 文件
2. **编译**：使用 `javac` 命令将源代码编译为字节码（`.class` 文件）
3. **运行**：使用 `java` 命令启动 JVM，加载并执行字节码

### JVM、JRE、JDK 的区别

| 组件 | 全称                     | 说明                              |
| ---- | ------------------------ | --------------------------------- |
| JVM  | Java Virtual Machine     | Java 虚拟机，执行字节码           |
| JRE  | Java Runtime Environment | Java 运行环境（JVM + 核心类库）   |
| JDK  | Java Development Kit     | Java 开发工具包（JRE + 开发工具） |

::: tip

- 运行 Java 程序：只需安装 JRE
- 开发 Java 程序：必须安装 JDK
- 现代 JDK（Java 11+）已包含 JRE，无需单独安装
  :::

## 安装 JDK

### 1. 下载 JDK

推荐下载 LTS（长期支持）版本：

| 版本            | 说明                   | 下载地址                                            |
| --------------- | ---------------------- | --------------------------------------------------- |
| Oracle JDK      | 官方版本（商用需付费） | https://www.oracle.com/java/technologies/downloads/ |
| OpenJDK         | 开源免费版本           | https://adoptium.net/                               |
| Amazon Corretto | AWS 维护的 OpenJDK     | https://aws.amazon.com/corretto/                    |

::: tip
推荐使用 **Adoptium（Eclipse Temurin）** 或 **Oracle OpenJDK**，免费且长期支持。
:::

### 2. 安装 JDK

**Windows 安装步骤：**

1. 下载 `.msi` 或 `.exe` 安装包
2. 双击运行安装程序
3. 选择安装路径（建议：`C:\Program Files\Java\jdk-17`）
4. 完成安装

### 3. 配置环境变量

**Windows 系统：**

```powershell
# 1. 打开"系统属性" → "高级" → "环境变量"

# 2. 新建系统变量 JAVA_HOME
变量名：JAVA_HOME
变量值：C:\Program Files\Java\jdk-17

# 3. 编辑 Path 变量，添加
%JAVA_HOME%\bin

# 4. 验证配置
java -version
javac -version
```

**macOS 安装：**

```bash
# 使用 Homebrew 安装
brew install openjdk@17

# 配置环境变量（添加到 ~/.zshrc 或 ~/.bash_profile）
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# 验证
java -version
```

**Linux 安装（Ubuntu/Debian）：**

```bash
# 安装 OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk

# 验证
java -version
javac -version

# 配置 JAVA_HOME（可选）
echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
source ~/.bashrc
```

### 4. 验证安装

```bash
# 查看 Java 版本
java -version
# 输出示例：
# openjdk version "17.0.8" 2023-07-18
# OpenJDK Runtime Environment Temurin-17.0.8+7 (build 17.0.8+7)
# OpenJDK 64-Bit Server Temurin-17.0.8+7 (build 17.0.8+7, mixed mode, sharing)

# 查看编译器版本
javac -version
# 输出：javac 17.0.8
```

## Hello World 程序

### 第一个 Java 程序

```java
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("欢迎来到 Java 世界！");
    }
}
```

### 编译与运行

```bash
# 1. 编译源代码
javac HelloWorld.java
# 生成 HelloWorld.class 文件

# 2. 运行程序
java HelloWorld
# 输出：
# Hello, World!
# 欢迎来到 Java 世界！
```

### 代码逐行解析

```java
public class HelloWorld {       // ① 定义一个公共类，类名为 HelloWorld
    public static void main(String[] args) {  // ② 主方法，程序入口
        System.out.println("Hello, World!");   // ③ 输出语句
        System.out.println("欢迎来到 Java 世界！");
    }
}
```

**逐行说明：**

| 行号 | 代码                                     | 说明                                     |
| ---- | ---------------------------------------- | ---------------------------------------- |
| ①    | `public class HelloWorld`                | 定义公共类，**文件名必须与类名相同**     |
| ②    | `public static void main(String[] args)` | 主方法，JVM 调用的程序入口，**签名固定** |
| ③    | `System.out.println()`                   | 标准输出语句，输出后换行                 |

::: warning 注意事项

1. **文件名必须与公共类名相同**：`HelloWorld.java` 对应 `public class HelloWorld`
2. **main 方法签名固定**：`public static void main(String[] args)` 不能修改
3. **Java 区分大小写**：`HelloWorld` 和 `helloworld` 是不同的
4. **每条语句以分号结尾**：`;` 不能省略
   :::

## Java 程序结构

### 包声明（可选）

```java
package com.example;  // 声明包名

public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### 导入类（可选）

```java
import java.util.Scanner;  // 导入 Scanner 类

public class InputExample {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("请输入你的名字：");
        String name = scanner.nextLine();
        System.out.println("你好，" + name + "！");
        scanner.close();
    }
}
```

### 多个类在一个文件中

```java
// Test.java
public class Test {
    public static void main(String[] args) {
        Person p = new Person();
        p.sayHello();
    }
}

class Person {  // 非公共类，可以与文件名不同
    public void sayHello() {
        System.out.println("Hello!");
    }
}
```

::: tip
一个 `.java` 文件中可以有多个类，但**最多只能有一个 public 类**，且文件名必须与 public 类名相同。
:::

## Java 开发工具

### 命令行工具

| 命令      | 说明                                    |
| --------- | --------------------------------------- |
| `javac`   | Java 编译器，将 `.java` 编译为 `.class` |
| `java`    | Java 启动器，运行 `.class` 文件         |
| `javadoc` | 文档生成工具                            |
| `jar`     | 打包工具，将类文件打包为 `.jar`         |
| `jshell`  | 交互式编程工具（Java 9+）               |

### 常用 IDE

| IDE           | 说明                      | 适用场景           |
| ------------- | ------------------------- | ------------------ |
| IntelliJ IDEA | 最流行的 Java IDE（推荐） | 企业开发、大型项目 |
| Eclipse       | 开源免费，插件丰富        | 传统企业项目       |
| VS Code       | 轻量级，通过插件支持 Java | 小型项目、学习     |
| NetBeans      | Oracle 官方 IDE           | 教学、快速原型     |

::: tip
**推荐使用 IntelliJ IDEA**，社区版免费且功能强大，是业界主流选择。
:::

## 使用 JShell（Java 9+）

JShell 是 Java 的交互式编程工具，可以立即执行代码片段。

```bash
# 启动 JShell
jshell

# 在 JShell 中执行代码
jshell> System.out.println("Hello, JShell!");
Hello, JShell!

jshell> int x = 10;
x ==> 10

jshell> int y = x * 2;
y ==> 20

jshell> /exit
| 再见
```

### JShell 常用命令

| 命令           | 说明             |
| -------------- | ---------------- |
| `/help`        | 查看帮助         |
| `/list`        | 列出所有代码片段 |
| `/edit`        | 编辑代码片段     |
| `/exit`        | 退出 JShell      |
| `/reset`       | 重置环境         |
| `/save <file>` | 保存到文件       |

## 常见问题

### 1. "java 不是内部或外部命令"

**原因**：环境变量未配置或配置错误

**解决**：

- 检查 `JAVA_HOME` 是否正确
- 检查 `Path` 中是否包含 `%JAVA_HOME%\bin`
- 重新打开命令行窗口

### 2. "错误: 找不到或无法加载主类"

**原因**：

- 类名与文件名不一致
- 运行命令错误（不需要 `.class` 后缀）

**解决**：

```bash
# 错误：java HelloWorld.class
# 正确：
java HelloWorld
```

### 3. 中文乱码

**原因**：文件编码与系统默认编码不一致

**解决**：

```bash
# 指定编码编译
javac -encoding UTF-8 HelloWorld.java
```

## 核心知识点

1. **Java 是跨平台语言**：通过 JVM 实现"一次编写，到处运行"
2. **JDK 包含 JRE**：开发需要 JDK，运行只需 JRE
3. **编译与运行**：`javac` 编译源代码，`java` 运行字节码
4. **文件名规则**：public 类名必须与文件名相同
5. **main 方法**：程序入口，签名固定为 `public static void main(String[] args)`
6. **IDE 推荐**：IntelliJ IDEA 是最流行的 Java 开发工具

## 本章小结

本章介绍了 Java 的历史、应用领域、工作原理，以及如何安装 JDK 和编写第一个 Java 程序。掌握环境搭建是学习 Java 的第一步，接下来我们将学习 Java 的基础语法。
