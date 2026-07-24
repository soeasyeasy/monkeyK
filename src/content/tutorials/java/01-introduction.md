---
title: '第一章：Java 简介与环境搭建'
description: 'Java 发展史、JDK 安装、Hello World'
---

# 第一章：Java 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 是什么？为什么要学 Java？
- Java 和 C++、Python 有什么区别？
- 什么是 JVM？为什么说 Java 能"一次编写，到处运行"？
- JDK、JRE、JVM 这三个东西到底有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **Java 是什么、能做什么**，再动手搭建开发环境，最后写出你的第一个 Java 程序。

---

## 1.1 为什么需要 Java？

### 痛点分析

想象一下这个场景：

你写了一个 Windows 程序，老板说："这个程序也要在 Mac 上跑。"你不得不重写一遍代码。后来又要支持 Linux，你又得重写一遍。

这就是**跨平台问题**——不同操作系统的程序不能直接互通。

### Java 的解决方案

Java 的设计者说："我来解决这个问题。"

他们发明了 **JVM（Java 虚拟机）**。你的 Java 代码不是直接运行在操作系统上，而是运行在 JVM 上。只要不同系统都安装了 JVM，你的程序就能跑。

打个比方：

> 就像你用普通话写了一封信，虽然各地有方言，但只要有个翻译官（JVM）帮你翻译，全国各地的人都能看懂。

### 对比其他语言

| 语言   | 跨平台能力            | 说明                      |
| ------ | --------------------- | ------------------------- |
| C/C++  | ❌ 需要重新编译       | 不同平台要分别编译        |
| Python | ✅ 解释型             | 需要安装 Python 解释器    |
| Java   | ✅ 一次编写，到处运行 | 通过 JVM 实现真正的跨平台 |

> **一句话总结**：Java 通过 JVM 实现了"一次编写，到处运行"，解决了跨平台问题。

---

## 1.2 Java 的核心原理

### 编译与运行过程

Java 程序的运行分两步：

```
源代码（.java） → 编译器（javac） → 字节码（.class） → JVM → 运行
```

1. **编写源代码**：你写的 `.java` 文件
2. **编译**：`javac` 把源代码翻译成**字节码**（`.class` 文件）
3. **运行**：JVM 读取字节码，翻译成机器能懂的指令

打个比方：

> 就像你把中文文章翻译成世界语（字节码），然后各个国家的人（JVM）再根据自己的语言理解。这样你只需要翻译一次，全世界都能看懂。

### JVM、JRE、JDK 的区别

这三个概念新手容易搞混，我们用一个表格说清楚：

| 组件 | 全称                     | 说明                              | 类比                     |
| ---- | ------------------------ | --------------------------------- | ------------------------ |
| JVM  | Java Virtual Machine     | Java 虚拟机，执行字节码           | 翻译官                   |
| JRE  | Java Runtime Environment | Java 运行环境（JVM + 核心类库）   | 翻译官 + 词典            |
| JDK  | Java Development Kit     | Java 开发工具包（JRE + 开发工具） | 翻译官 + 词典 + 写作工具 |

::: tip 简单记忆

- **运行 Java 程序**：只需安装 JRE
- **开发 Java 程序**：必须安装 JDK
- 现代 JDK（Java 11+）已包含 JRE，无需单独安装

:::

---

## 1.3 Java 简介

Java 是由 Sun Microsystems（现属 Oracle）于 1995 年推出的面向对象编程语言。Java 以"一次编写，到处运行"（Write Once, Run Anywhere）著称。

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

---

## 1.4 安装 JDK

### 1. 下载 JDK

推荐下载 LTS（长期支持）版本：

| 版本            | 说明                   | 下载地址                                            |
| --------------- | ---------------------- | --------------------------------------------------- |
| Oracle JDK      | 官方版本（商用需付费） | https://www.oracle.com/java/technologies/downloads/ |
| OpenJDK         | 开源免费版本           | https://adoptium.net/                               |
| Amazon Corretto | AWS 维护的 OpenJDK     | https://aws.amazon.com/corretto/                    |

::: tip 推荐选择

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

---

## 1.5 Hello World 程序

### 第一个 Java 程序

```java
// HelloWorld.java —— 文件名必须和类名一致
public class HelloWorld {           // 定义一个公共类，类名为 HelloWorld
    public static void main(String[] args) {  // 主方法，程序入口点
        System.out.println("Hello, World!");   // 输出文本并换行
        System.out.println("欢迎来到 Java 世界！"); // 再输出一行
    }
}
```

### 编译与运行

```bash
# 1. 编译源代码（把 .java 翻译成 .class）
javac HelloWorld.java
# 生成 HelloWorld.class 文件

# 2. 运行程序（让 JVM 执行字节码）
java HelloWorld
# 输出：
# Hello, World!
# 欢迎来到 Java 世界！
```

### 代码逐行解析

```java
public class HelloWorld {       // ① 定义一个公共类，类名为 HelloWorld
    public static void main(String[] args) {  // ② 主方法，JVM 从这里开始执行
        System.out.println("Hello, World!");   // ③ 向控制台输出文本
        System.out.println("欢迎来到 Java 世界！"); // ④ 再输出一行
    }
}
```

**逐行说明：**

| 行号 | 代码                                     | 说明                                     |
| ---- | ---------------------------------------- | ---------------------------------------- |
| ①    | `public class HelloWorld`                | 定义公共类，**文件名必须与类名相同**     |
| ②    | `public static void main(String[] args)` | 主方法，JVM 调用的程序入口，**签名固定** |
| ③    | `System.out.println()`                   | 标准输出语句，输出后换行                 |

::: warning 新手必看

1. **文件名必须与公共类名相同**：`HelloWorld.java` 对应 `public class HelloWorld`
2. **main 方法签名固定**：`public static void main(String[] args)` 不能修改
3. **Java 区分大小写**：`HelloWorld` 和 `helloworld` 是不同的
4. **每条语句以分号结尾**：`;` 不能省略

:::

---

## 1.6 Java 程序结构

### 包声明（可选）

```java
package com.example;  // 声明包名，用于组织类

public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### 导入类（可选）

```java
import java.util.Scanner;  // 导入 Scanner 类，用于读取用户输入

public class InputExample {
    public static void main(String[] args) {
        // 创建 Scanner 对象，从标准输入读取
        Scanner scanner = new Scanner(System.in);
        System.out.print("请输入你的名字：");  // 提示用户输入
        String name = scanner.nextLine();      // 读取一行输入
        System.out.println("你好，" + name + "！"); // 输出问候语
        scanner.close();  // 关闭 Scanner，释放资源
    }
}
```

### 多个类在一个文件中

```java
// Test.java —— 文件名与 public 类名一致
public class Test {
    public static void main(String[] args) {
        Person p = new Person();  // 创建 Person 对象
        p.sayHello();             // 调用方法
    }
}

// 非公共类，可以与文件名不同
class Person {
    public void sayHello() {
        System.out.println("Hello!");
    }
}
```

::: tip 重要规则

一个 `.java` 文件中可以有多个类，但**最多只能有一个 public 类**，且文件名必须与 public 类名相同。

:::

---

## 1.7 Java 开发工具

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

::: tip 新手推荐

**推荐使用 IntelliJ IDEA**，社区版免费且功能强大，是业界主流选择。

:::

---

## 1.8 使用 JShell（Java 9+）

JShell 是 Java 的交互式编程工具，可以立即执行代码片段，不用写完整的类。

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

---

## 1.9 新手常见误区

### 误区 1："java 不是内部或外部命令"

**错！** 这不是 Java 的问题，是环境变量没配好。

**正确做法：**

- 检查 `JAVA_HOME` 是否正确
- 检查 `Path` 中是否包含 `%JAVA_HOME%\bin`
- 重新打开命令行窗口（配置环境变量后必须重启）

### 误区 2：运行命令加 .class 后缀

**错！** `java HelloWorld.class` 会报错。

**正确做法：**

```bash
# ❌ 错误
java HelloWorld.class

# ✅ 正确
java HelloWorld
```

### 误区 3：文件名和类名不一致

**错！** `public class` 的名称必须和文件名完全一致（包括大小写）。

**正确做法：**

```java
// 文件名：HelloWorld.java
public class HelloWorld {  // ✅ 类名和文件名一致
    // ...
}

// ❌ 错误：文件名是 HelloWorld.java，但类名是 helloWorld
public class helloWorld {
    // ...
}
```

### 误区 4：中文乱码不处理

**问题：** 编译时出现中文乱码。

**正确做法：**

```bash
# 指定编码编译
javac -encoding UTF-8 HelloWorld.java
```

---

## 1.10 动手练习

### 练习 1：基础练习 —— 输出个人信息

编写一个 Java 程序，输出你的姓名、年龄、兴趣爱好。

<details>
<summary>点击查看答案</summary>

```java
// PersonInfo.java
public class PersonInfo {
    public static void main(String[] args) {
        System.out.println("姓名：张三");
        System.out.println("年龄：25");
        System.out.println("爱好：编程、阅读、旅游");
    }
}
```

</details>

### 练习 2：进阶练习 —— 简单的用户输入

编写一个程序，读取用户输入的名字，然后输出问候语。

<details>
<summary>点击查看答案</summary>

```java
// Greeting.java
import java.util.Scanner;  // 导入 Scanner 类

public class Greeting {
    public static void main(String[] args) {
        // 创建 Scanner 对象
        Scanner scanner = new Scanner(System.in);

        // 提示用户输入
        System.out.print("请输入你的名字：");

        // 读取用户输入
        String name = scanner.nextLine();

        // 输出问候语
        System.out.println("你好，" + name + "！欢迎学习 Java！");

        // 关闭 Scanner
        scanner.close();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 计算器

编写一个程序，读取两个数字，输出它们的和、差、积、商。

<details>
<summary>点击查看答案</summary>

```java
// Calculator.java
import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 读取第一个数字
        System.out.print("请输入第一个数字：");
        double num1 = scanner.nextDouble();

        // 读取第二个数字
        System.out.print("请输入第二个数字：");
        double num2 = scanner.nextDouble();

        // 计算并输出结果
        System.out.println("和：" + (num1 + num2));
        System.out.println("差：" + (num1 - num2));
        System.out.println("积：" + (num1 * num2));

        // 处理除数为 0 的情况
        if (num2 != 0) {
            System.out.println("商：" + (num1 / num2));
        } else {
            System.out.println("商：除数不能为 0");
        }

        scanner.close();
    }
}
```

</details>

---

## 1.11 核心知识点

| 知识点       | 说明                                                          |
| ------------ | ------------------------------------------------------------- |
| Java 跨平台  | 通过 JVM 实现"一次编写，到处运行"                             |
| JDK 包含 JRE | 开发需要 JDK，运行只需 JRE                                    |
| 编译与运行   | `javac` 编译源代码，`java` 运行字节码                         |
| 文件名规则   | public 类名必须与文件名相同                                   |
| main 方法    | 程序入口，签名固定为 `public static void main(String[] args)` |
| IDE 推荐     | IntelliJ IDEA 是最流行的 Java 开发工具                        |

---

## 下一章预告

下一章我们会学习 **变量与数据类型**——Java 的基础语法。你会学到 Java 的 8 种基本数据类型、如何声明变量、类型转换等核心概念。这些是写出正确 Java 代码的基石。

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
