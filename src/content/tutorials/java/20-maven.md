---
title: '第二十章：Maven 与项目构建'
description: 'Maven 基础、pom.xml、依赖管理、生命周期'
---

# 第二十章：Maven 与项目构建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Maven？为什么需要用它来管理项目？
- pom.xml 文件里那一堆配置到底是什么意思？
- 依赖冲突是什么？为什么我的项目总是报类找不到的错误？
- Maven 的生命周期是什么？mvn compile 和 mvn package 有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **Maven 的核心思想**，再动手实践依赖管理、项目构建。学完这章，你就能独立管理 Java 项目的依赖和构建了。

---

## 1 为什么需要 Maven？

### 痛点分析

想象你要开发一个项目，需要用 MySQL 驱动、日志框架、JSON 处理库等第三方依赖。

```java
// ❌ 没有 Maven：手动管理依赖
// 1. 去各个网站下载 jar 包
//    - MySQL: https://dev.mysql.com/downloads/connector/j/
//    - Logback: https://logback.qos.ch/download.html
//    - Jackson: https://github.com/FasterXML/jackson
// 2. 把 jar 包复制到项目的 lib 目录
// 3. 手动添加到 classpath
// 4. 如果依赖还有子依赖，继续重复以上步骤...

// 问题 1：依赖管理混乱
lib/
├── mysql-connector-j-8.0.33.jar
├── logback-classic-1.4.11.jar
├── logback-core-1.4.11.jar
├── slf4j-api-2.0.9.jar
├── jackson-databind-2.15.3.jar
├── jackson-core-2.15.3.jar
├── jackson-annotations-2.15.3.jar
└── ...  // 几十个 jar 包，谁依赖谁？

// 问题 2：版本冲突
// 项目 A 需要 guava-32.1.3
// 项目 B 需要 guava-31.1
// 两个项目合并时，用哪个版本？

// 问题 3：构建流程复杂
// 编译、测试、打包、部署...每个步骤都要手动执行
```

### 解决方案

```xml
<!-- ✅ 用 Maven：一个 pom.xml 搞定所有依赖 -->
<dependencies>
    <!-- MySQL 驱动 -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- 日志框架 -->
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>1.4.11</version>
    </dependency>

    <!-- JSON 处理 -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.3</version>
    </dependency>
</dependencies>
```

> **一句话总结**：Maven 帮你自动下载依赖、管理版本、执行构建，让你专注于业务代码。

### 生活类比

打个比方：

> Maven 就像**图书馆管理员**——你想看书（依赖），不用自己去各个出版社买（手动下载 jar），只要告诉管理员书名（pom.xml 配置），管理员就会从仓库里帮你找来，还帮你整理好书架（依赖管理）。

---

## 2 核心原理

### POM 模型

Maven 基于 **POM（Project Object Model）** 管理项目。每个项目都是一个 pom.xml 文件，描述项目的元数据、依赖、构建配置。

打个比方：

> pom.xml 就像**项目的身份证**——记录了项目叫什么名字（artifactId）、谁开发的（groupId）、什么版本（version）、需要哪些依赖（dependencies）。

### Maven 坐标

用 **groupId:artifactId:version** 唯一标识一个依赖。

```
groupId:    组织或公司（如 com.mysql）
artifactId: 项目名称（如 mysql-connector-j）
version:    版本号（如 8.0.33）
```

### 依赖传递机制

Maven 会自动下载依赖的依赖（传递依赖）。

```
你的项目
  └── 依赖 A
        ├── 依赖 B
        └── 依赖 C
```

### 对比分析

| 特性     | Maven          | Ant              | Gradle            |
| -------- | -------------- | ---------------- | ----------------- |
| 配置方式 | XML（pom.xml） | XML（build.xml） | Groovy/Kotlin DSL |
| 依赖管理 | ✅ 自动        | ❌ 手动          | ✅ 自动           |
| 生命周期 | ✅ 标准化      | ❌ 自定义        | ✅ 标准化         |
| 学习曲线 | 中等           | 陡峭             | 中等              |
| 适用场景 | 传统 Java 项目 | 老项目           | 大型项目、Android |

---

## 3 安装与配置

### 1. 下载 Maven

访问 https://maven.apache.org/download.cgi 下载最新版本。

### 2. 配置环境变量

```
MAVEN_HOME = D:\apache-maven-3.9.x
Path 中添加 %MAVEN_HOME%\bin
```

### 3. 验证安装

```bash
mvn -version
```

### 4. 配置本地仓库与镜像源

编辑 `conf/settings.xml`：

```xml
<localRepository>D:\maven-repo</localRepository>

<mirrors>
  <mirror>
    <id>aliyun</id>
    <mirrorOf>central</mirrorOf>
    <url>https://maven.aliyun.com/repository/central</url>
  </mirror>
</mirrors>
```

## 4 pom.xml 详解（逐行注释）

pom.xml 是 Maven 的核心配置文件，下面逐行解释每个配置的含义：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 声明 XML 版本和编码格式 -->

<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
<!-- 定义 POM 的命名空间和 schema 位置 -->

    <modelVersion>4.0.0</modelVersion>
    <!-- POM 模型版本，固定写 4.0.0 -->

    <!-- ========== 项目坐标（唯一标识一个项目） ========== -->
    <groupId>com.example</groupId>
    <!-- 组织 ID，通常是域名的反写，如 com.example -->
    <artifactId>my-app</artifactId>
    <!-- 项目 ID，在组织内唯一，如 my-app -->
    <version>1.0.0</version>
    <!-- 版本号，遵循语义化版本规范（主版本.次版本.补丁版本） -->
    <packaging>jar</packaging>
    <!-- 打包方式：jar（默认）或 war（Web 项目） -->

    <!-- ========== 属性配置（定义变量，后面可以引用） ========== -->
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <!-- Java 源码版本：17 -->
        <maven.compiler.target>17</maven.compiler.target>
        <!-- 编译目标版本：17（生成的字节码兼容 Java 17） -->
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- 源码编码格式：UTF-8（支持中文注释） -->
    </properties>

    <!-- ========== 依赖管理（声明项目需要的第三方库） ========== -->
    <dependencies>
        <dependency>
            <!-- 每个 dependency 声明一个依赖 -->
            <groupId>mysql</groupId>
            <!-- 依赖的组织 ID -->
            <artifactId>mysql-connector-j</artifactId>
            <!-- 依赖的项目 ID -->
            <version>8.0.33</version>
            <!-- 依赖的版本号 -->
        </dependency>
    </dependencies>

</project>
```

> **原理**：Maven 根据 pom.xml 中的坐标信息，自动从远程仓库下载依赖 jar 包到本地仓库（默认 `~/.m2/repository`），并添加到项目的 classpath 中。

---

## 5 依赖管理

### 依赖范围（scope）

scope 决定依赖在哪些阶段生效。

| scope    | 说明   | 编译 | 测试 | 运行 | 典型场景                         |
| -------- | ------ | ---- | ---- | ---- | -------------------------------- |
| compile  | 默认值 | ✅   | ✅   | ✅   | 大部分依赖（如 Spring、MyBatis） |
| test     | 仅测试 | ❌   | ✅   | ❌   | JUnit、Mockito                   |
| provided | 编译时 | ✅   | ✅   | ❌   | Servlet API（由 Tomcat 提供）    |
| runtime  | 运行时 | ❌   | ✅   | ✅   | JDBC 驱动（编译时不需要）        |

```xml
<!-- ✅ JUnit：只在测试时使用 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <!-- 依赖的组织 ID -->
    <artifactId>junit-jupiter</artifactId>
    <!-- 依赖的项目 ID -->
    <version>5.10.0</version>
    <!-- 依赖版本 -->
    <scope>test</scope>
    <!-- scope=test：只在测试时生效，不会打包到最终 jar 中 -->
</dependency>

<!-- ✅ Servlet API：编译时需要，运行时由 Tomcat 提供 -->
<dependency>
    <groupId>javax.servlet</groupId>
    <!-- 依赖的组织 ID -->
    <artifactId>javax.servlet-api</artifactId>
    <!-- 依赖的项目 ID -->
    <version>4.0.1</version>
    <!-- 依赖版本 -->
    <scope>provided</scope>
    <!-- scope=provided：编译时有，运行时由容器（Tomcat）提供 -->
</dependency>
```

### 依赖传递与冲突

Maven 会自动传递依赖。比如你引入了 `spring-boot-starter-web`，它又依赖了 `spring-core`、`spring-web` 等，Maven 会自动下载这些"依赖的依赖"。

```
你的项目
  └── spring-boot-starter-web:2.7.0
        ├── spring-core:5.3.22
        ├── spring-web:5.3.22
        ├── spring-webmvc:5.3.22
        └── jackson-databind:2.13.3
              ├── jackson-core:2.13.3
              └── jackson-annotations:2.13.3
```

**问题来了**：如果两个依赖引入了同一个库的不同版本，就会产生冲突。

```
你的项目
  ├── 依赖 A → guava:32.1.3
  └── 依赖 B → guava:31.1    ← 版本冲突！
```

**解决方案**：用 `<dependencyManagement>` 统一指定版本：

```xml
<dependencyManagement>
    <!-- dependencyManagement：统一管理依赖版本，不会真正引入依赖 -->
    <dependencies>
        <dependency>
            <groupId>com.google.guava</groupId>
            <!-- 冲突的依赖 -->
            <artifactId>guava</artifactId>
            <!-- 指定统一版本 -->
            <version>32.1.3-jre</version>
            <!-- 所有地方都用这个版本 -->
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 排除传递依赖

如果某个依赖引入了你不需要的子依赖，可以用 `<exclusions>` 排除：

```xml
<dependency>
    <groupId>com.example</groupId>
    <!-- 主依赖 -->
    <artifactId>some-lib</artifactId>
    <!-- 主依赖版本 -->
    <version>1.0.0</version>
    <!-- 主依赖版本号 -->
    <exclusions>
        <!-- exclusions：排除不需要的传递依赖 -->
        <exclusion>
            <!-- 每一个 exclusion 排除一个子依赖 -->
            <groupId>com.unwanted</groupId>
            <!-- 要排除的组织 ID -->
            <artifactId>unwanted-lib</artifactId>
            <!-- 要排除的项目 ID -->
        </exclusion>
    </exclusions>
</dependency>
```

---

## 6 Maven 生命周期

Maven 的生命周期是一组有序的阶段，每个阶段做一件事。你只需要执行某个阶段的命令，Maven 会自动执行之前的所有阶段。

打个比方：

> 生命周期就像**工厂的流水线**——原材料检验 → 加工 → 质检 → 包装 → 入库 → 发货。你只需要说"帮我包装"，前面的检验、加工、质检会自动完成。

### 主要阶段

```
validate → compile → test → package → verify → install → deploy
  验证       编译      测试     打包       校验      安装       部署
```

| 阶段     | 说明                             | 对应命令       |
| -------- | -------------------------------- | -------------- |
| validate | 验证 pom.xml 是否正确            | `mvn validate` |
| compile  | 编译主代码（src/main/java）      | `mvn compile`  |
| test     | 编译并运行测试（src/test/java）  | `mvn test`     |
| package  | 打包成 jar/war                   | `mvn package`  |
| verify   | 检查包的完整性和验证             | `mvn verify`   |
| install  | 安装到本地仓库（供其他项目使用） | `mvn install`  |
| deploy   | 部署到远程仓库（供团队使用）     | `mvn deploy`   |

### 常用命令

```bash
mvn clean                          # 清除构建目录（target/）
mvn compile                        # 编译主代码
mvn test-compile                   # 编译测试代码
mvn test                           # 运行测试
mvn package                        # 打包（jar/war）
mvn install                        # 安装到本地仓库
mvn deploy                         # 部署到远程仓库
mvn clean package -DskipTests      # 跳过测试打包
```

> **注意**：执行后面的阶段会自动执行前面的阶段。比如 `mvn package` 会自动执行 compile → test → package。

---

## 7 常用插件

Maven 本身只做"管理"，实际的编译、打包等工作都由**插件**完成。

### compiler 插件（编译）

```xml
<build>
    <!-- build：构建配置 -->
    <plugins>
        <!-- plugins：插件列表 -->
        <plugin>
            <!-- 每一个 plugin 配置一个插件 -->
            <groupId>org.apache.maven.plugins</groupId>
            <!-- 插件的组织 ID -->
            <artifactId>maven-compiler-plugin</artifactId>
            <!-- 插件的项目 ID -->
            <version>3.11.0</version>
            <!-- 插件版本 -->
            <configuration>
                <!-- configuration：插件的配置参数 -->
                <source>17</source>
                <!-- 源码版本：Java 17 -->
                <target>17</target>
                <!-- 目标版本：编译为 Java 17 字节码 -->
            </configuration>
        </plugin>
    </plugins>
</build>
```

### jar 插件（指定主类）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <!-- Maven 官方 jar 插件 -->
    <artifactId>maven-jar-plugin</artifactId>
    <!-- 插件 ID -->
    <version>3.3.0</version>
    <!-- 插件版本 -->
    <configuration>
        <archive>
            <!-- archive：打包配置 -->
            <manifest>
                <!-- manifest：MANIFEST.MF 文件配置 -->
                <mainClass>com.example.Main</mainClass>
                <!-- 指定主类，这样可以直接 java -jar 运行 -->
            </manifest>
        </archive>
    </configuration>
</plugin>
```

### shade 插件（打 fat jar）

普通的 jar 包只包含你自己的代码，shade 插件可以把所有依赖一起打包（fat jar），方便部署：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <!-- Maven 官方 shade 插件 -->
    <artifactId>maven-shade-plugin</artifactId>
    <!-- 插件 ID -->
    <version>3.5.1</version>
    <!-- 插件版本 -->
    <executions>
        <!-- executions：定义插件在哪个阶段执行 -->
        <execution>
            <!-- 每一个 execution 是一次执行配置 -->
            <phase>package</phase>
            <!-- phase=package：在打包阶段执行 -->
            <goals>
                <!-- goals：要执行的目标 -->
                <goal>shade</goal>
                <!-- shade 目标：生成包含所有依赖的 fat jar -->
            </goals>
        </execution>
    </executions>
</plugin>
```

---

## 8 项目结构

标准 Maven 项目结构（必须遵守）：

```
my-app/
├── pom.xml                    ← 项目配置文件（核心）
├── src/
│   ├── main/                  ← 主代码目录
│   │   ├── java/              ← Java 源码
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── App.java
│   │   └── resources/         ← 配置文件（properties、xml 等）
│   │       └── application.properties
│   └── test/                  ← 测试代码目录
│       └── java/              ← 测试 Java 源码
│           └── com/
│               └── example/
│                   └── AppTest.java
└── target/                    ← 构建输出目录（自动生成，不要手动修改）
    ├── classes/               ← 编译后的 .class 文件
    └── my-app-1.0.0.jar       ← 打包后的 jar 文件
```

> **注意**：`target/` 目录是 Maven 自动生成的，不要手动修改里面的内容。`mvn clean` 会删除这个目录。

---

## 9 多模块项目

当项目变大时，可以拆分成多个子模块，由父 POM 统一管理。

打个比方：

> 多模块项目就像**集团公司**——父公司（parent POM）统一管理规范和资源，各个子公司（子模块）各自负责不同的业务，但都遵循集团标准。

```xml
<!-- ========== 父 pom.xml ========== -->
<project>
    <groupId>com.example</groupId>
    <!-- 集团（父项目）的组织 ID -->
    <artifactId>parent-project</artifactId>
    <!-- 父项目 ID -->
    <version>1.0.0</version>
    <!-- 版本号 -->
    <packaging>pom</packaging>
    <!-- packaging=pom：表示这是一个聚合项目，不打包代码 -->

    <modules>
        <!-- modules：声明子模块 -->
        <module>module-a</module>
        <!-- 子模块 A（如：dao 层） -->
        <module>module-b</module>
        <!-- 子模块 B（如：service 层） -->
        <module>module-c</module>
        <!-- 子模块 C（如：web 层） -->
    </modules>
</project>
```

子模块继承父 POM：

```xml
<!-- ========== 子模块 pom.xml ========== -->
<project>
    <parent>
        <!-- parent：继承父 POM -->
        <groupId>com.example</groupId>
        <!-- 父项目的组织 ID -->
        <artifactId>parent-project</artifactId>
        <!-- 父项目 ID -->
        <version>1.0.0</version>
        <!-- 父项目版本 -->
    </parent>

    <artifactId>child-module</artifactId>
    <!-- 子模块自己的 ID（不需要 groupId 和 version，从父 POM 继承） -->

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <!-- 引入 Spring -->
            <artifactId>spring-core</artifactId>
            <!-- 版本从父 POM 的 dependencyManagement 继承，不需要写 version -->
        </dependency>
    </dependencies>
</project>
```

---

## 10 Profile 环境配置

实际项目中，开发环境、测试环境、生产环境的配置（数据库地址、日志级别等）是不同的。Profile 让你用同一份代码，切换不同环境。

```xml
<profiles>
    <!-- profiles：定义多个环境配置 -->

    <!-- 开发环境 -->
    <profile>
        <!-- 每一个 profile 是一个环境配置 -->
        <id>dev</id>
        <!-- profile 的 ID，用 -P dev 激活 -->
        <activation>
            <activeByDefault>true</activeByDefault>
            <!-- 默认激活这个 profile（不指定 -P 时用这个） -->
        </activation>
        <properties>
            <env>dev</env>
            <!-- 自定义属性 env=dev -->
            <db.url>jdbc:mysql://localhost:3306/dev_db</db.url>
            <!-- 自定义属性：开发环境的数据库地址 -->
        </properties>
    </profile>

    <!-- 生产环境 -->
    <profile>
        <id>prod</id>
        <!-- profile 的 ID，用 -P prod 激活 -->
        <properties>
            <env>prod</env>
            <!-- 自定义属性 env=prod -->
            <db.url>jdbc:mysql://prod-server:3306/prod_db</db.url>
            <!-- 自定义属性：生产环境的数据库地址 -->
        </properties>
    </profile>
</profiles>
```

激活 Profile：

```bash
mvn package -P dev     # 使用开发环境配置（默认）
mvn package -P prod    # 使用生产环境配置
```

---

## 11 常用仓库

Maven 从仓库下载依赖。默认使用 Maven Central（国外），国内推荐配置镜像源加速。

| 仓库          | 地址                                          | 说明                     |
| ------------- | --------------------------------------------- | ------------------------ |
| Maven Central | https://repo.maven.apache.org/maven2          | 官方中央仓库（国外，慢） |
| 阿里云        | https://maven.aliyun.com/repository/central   | 国内镜像（推荐）         |
| 华为云        | https://repo.huaweicloud.com/repository/maven | 国内镜像                 |

配置镜像源（编辑 `conf/settings.xml`）：

```xml
<mirrors>
    <!-- mirrors：镜像源列表 -->
    <mirror>
        <!-- 每一个 mirror 是一个镜像 -->
        <id>aliyun</id>
        <!-- 镜像 ID（唯一标识） -->
        <mirrorOf>central</mirrorOf>
        <!-- 替代哪个仓库：central（Maven 中央仓库） -->
        <url>https://maven.aliyun.com/repository/central</url>
        <!-- 镜像地址：阿里云 -->
    </mirror>
</mirrors>
```

---

## 12 新手常见误区

### 误区 1："dependencies 和 dependencyManagement 是一样的"

**错！** 它们的作用完全不同。

| 特性     | `<dependencies>` | `<dependencyManagement>` |
| -------- | ---------------- | ------------------------ |
| 作用     | 真正引入依赖     | 只管理版本号，不引入     |
| 子模块   | 自动继承         | 需要显式声明才引入       |
| 使用场景 | 普通项目         | 父 POM 统一版本          |

```xml
<!-- ❌ 错误：在父 POM 中用 dependencies，所有子模块都会引入 -->
<dependencies>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <version>8.0.33</version>
    </dependency>
</dependencies>

<!-- ✅ 正确：用 dependencyManagement 管理版本，子模块按需引入 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.0.33</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 误区 2："scope=provided 和 scope=test 效果一样"

**不是的。** 它们的生效范围不同。

```java
// scope=test：只在 src/test/java 中可用
// 编译 src/main/java 时会报错"找不到类"
import org.junit.jupiter.api.Test;  // ✅ 在测试代码中可用

// scope=provided：编译时可用，运行时由容器提供
import javax.servlet.http.HttpServlet;  // ✅ 编译通过，运行时 Tomcat 提供
```

### 误区 3："版本号随便写就行"

**错！** 版本号必须和仓库中实际存在的版本一致。

```xml
<!-- ❌ 错误：这个版本不存在 -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>999.999.999</version>  <!-- 下载失败！ -->
</dependency>

<!-- ✅ 正确：去 https://mvnrepository.com 查真实版本 -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.0.33</version>  <!-- 真实存在的版本 -->
</dependency>
```

### 误区 4："mvn compile 就能运行项目"

**不是的。** `mvn compile` 只是把 `.java` 编译成 `.class`，不会执行 main 方法。

```bash
# ❌ 错误想法
mvn compile
java com.example.Main    # 需要手动配置 classpath，很麻烦

# ✅ 正确做法 1：用 exec 插件运行
mvn exec:java -Dexec.mainClass="com.example.Main"

# ✅ 正确做法 2：先打包再运行
mvn package
java -jar target/my-app-1.0.0.jar
```

### 误区 5："本地仓库满了不用管"

**要注意。** 本地仓库（默认 `~/.m2/repository`）会不断积累依赖，可能占用几个 GB 的空间。

```bash
# 查看本地仓库大小
du -sh ~/.m2/repository        # Linux/Mac
# 或在 Windows 资源管理器中查看 C:\Users\你的用户名\.m2\repository

# 可以安全删除整个仓库（下次构建会重新下载）
rm -rf ~/.m2/repository
```

---

## 13 核心知识点总结

| 知识点         | 说明                                                   |
| -------------- | ------------------------------------------------------ |
| Maven 坐标     | groupId:artifactId:version 唯一标识一个依赖            |
| pom.xml        | 项目核心配置文件，声明坐标、依赖、插件等               |
| 依赖范围 scope | compile（默认）、test、provided、runtime               |
| 依赖传递       | 自动下载"依赖的依赖"，可能产生版本冲突                 |
| 依赖管理       | dependencyManagement 统一版本，exclusions 排除传递依赖 |
| 生命周期       | validate → compile → test → package → install → deploy |
| 插件           | compiler（编译）、jar（打包）、shade（fat jar）        |
| 多模块         | 父 POM 统一管理，子模块继承，packaging=pom             |
| Profile        | 不同环境（dev/test/prod）使用不同配置                  |
| 仓库           | 本地仓库 + 远程仓库，国内推荐配置阿里云镜像            |

---

## 14 动手练习

### 练习 1：基础练习 —— 创建 Maven 项目

创建一个 Maven 项目，添加 JUnit 5 和 MySQL 驱动依赖，配置编译插件使用 Java 17。

<details>
<summary>点击查看答案</summary>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 声明 XML 版本和编码 -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <!-- POM 命名空间声明 -->

    <modelVersion>4.0.0</modelVersion>
    <!-- POM 模型版本，固定 4.0.0 -->

    <!-- 项目坐标 -->
    <groupId>com.example</groupId>
    <!-- 组织 ID -->
    <artifactId>my-first-maven-project</artifactId>
    <!-- 项目 ID -->
    <version>1.0.0</version>
    <!-- 项目版本 -->
    <packaging>jar</packaging>
    <!-- 打包方式：jar -->

    <!-- 属性配置 -->
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <!-- Java 源码版本 -->
        <maven.compiler.target>17</maven.compiler.target>
        <!-- 编译目标版本 -->
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- 编码格式 -->
    </properties>

    <!-- 依赖管理 -->
    <dependencies>
        <!-- MySQL 驱动 -->
        <dependency>
            <groupId>mysql</groupId>
            <!-- MySQL 官方 -->
            <artifactId>mysql-connector-j</artifactId>
            <!-- MySQL JDBC 驱动 -->
            <version>8.0.33</version>
            <!-- 版本号 -->
        </dependency>

        <!-- JUnit 5 测试框架 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <!-- JUnit 官方 -->
            <artifactId>junit-jupiter</artifactId>
            <!-- JUnit 5 聚合依赖 -->
            <version>5.10.0</version>
            <!-- 版本号 -->
            <scope>test</scope>
            <!-- 只在测试时使用 -->
        </dependency>
    </dependencies>

    <!-- 构建配置 -->
    <build>
        <plugins>
            <!-- 编译插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <!-- Maven 官方插件 -->
                <artifactId>maven-compiler-plugin</artifactId>
                <!-- 编译插件 -->
                <version>3.11.0</version>
                <!-- 插件版本 -->
                <configuration>
                    <source>17</source>
                    <!-- 源码版本 -->
                    <target>17</target>
                    <!-- 目标版本 -->
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

</details>

### 练习 2：进阶练习 —— 多模块项目

创建一个多模块项目，包含 `dao`、`service`、`web` 三个子模块，父 POM 统一管理 Spring 版本。

<details>
<summary>点击查看答案</summary>

```xml
<!-- ========== 父 pom.xml ========== -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>
    <!-- POM 模型版本 -->

    <groupId>com.example</groupId>
    <!-- 组织 ID -->
    <artifactId>my-multi-project</artifactId>
    <!-- 父项目 ID -->
    <version>1.0.0</version>
    <!-- 版本号 -->
    <packaging>pom</packaging>
    <!-- packaging=pom：聚合项目，不打包代码 -->

    <!-- 声明子模块 -->
    <modules>
        <module>dao</module>
        <!-- 数据访问层子模块 -->
        <module>service</module>
        <!-- 业务逻辑层子模块 -->
        <module>web</module>
        <!-- Web 层子模块 -->
    </modules>

    <!-- 属性：统一管理版本号 -->
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <!-- Java 源码版本 -->
        <maven.compiler.target>17</maven.compiler.target>
        <!-- 编译目标版本 -->
        <spring.version>5.3.30</spring.version>
        <!-- Spring 版本：统一管理 -->
    </properties>

    <!-- 依赖管理：只管理版本，不真正引入 -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework</groupId>
                <!-- Spring 框架 -->
                <artifactId>spring-core</artifactId>
                <!-- Spring 核心 -->
                <version>${spring.version}</version>
                <!-- 引用 properties 中的版本号 -->
            </dependency>
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-web</artifactId>
                <!-- Spring Web -->
                <version>${spring.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

</project>

<!-- ========== dao/pom.xml（子模块） ========== -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <!-- 继承父 POM -->
    <parent>
        <groupId>com.example</groupId>
        <!-- 父项目组织 ID -->
        <artifactId>my-multi-project</artifactId>
        <!-- 父项目 ID -->
        <version>1.0.0</version>
        <!-- 父项目版本 -->
    </parent>

    <artifactId>dao</artifactId>
    <!-- 子模块 ID：dao -->

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <!-- 版本从父 POM 继承，不需要写 version -->
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.0.33</version>
            <!-- dao 层需要 MySQL 驱动 -->
        </dependency>
    </dependencies>

</project>
```

</details>

### 练习 3（挑战）：综合练习 —— Profile 多环境配置

创建一个项目，配置 dev、test、prod 三个 Profile，使用资源过滤将数据库地址动态注入到 `application.properties` 中。

<details>
<summary>点击查看答案</summary>

**pom.xml**：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>profile-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- 定义三个环境的 Profile -->
    <profiles>
        <!-- 开发环境 -->
        <profile>
            <id>dev</id>
            <!-- Profile ID -->
            <activation>
                <activeByDefault>true</activeByDefault>
                <!-- 默认激活 -->
            </activation>
            <properties>
                <db.url>jdbc:mysql://localhost:3306/dev_db</db.url>
                <!-- 开发环境数据库 -->
                <db.username>root</db.username>
                <!-- 开发环境用户名 -->
                <db.password>123456</db.password>
                <!-- 开发环境密码 -->
            </properties>
        </profile>

        <!-- 测试环境 -->
        <profile>
            <id>test</id>
            <properties>
                <db.url>jdbc:mysql://test-server:3306/test_db</db.url>
                <!-- 测试环境数据库 -->
                <db.username>test_user</db.username>
                <db.password>test_pass</db.password>
            </properties>
        </profile>

        <!-- 生产环境 -->
        <profile>
            <id>prod</id>
            <properties>
                <db.url>jdbc:mysql://prod-server:3306/prod_db</db.url>
                <!-- 生产环境数据库 -->
                <db.username>prod_user</db.username>
                <db.password>prod_secure_pass</db.password>
            </properties>
        </profile>
    </profiles>

    <build>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <!-- 资源目录 -->
                <filtering>true</filtering>
                <!-- 开启资源过滤：替换 ${} 占位符 -->
            </resource>
        </resources>
    </build>

</project>
```

**src/main/resources/application.properties**：

```properties
# 数据库配置
# 这些 ${} 占位符会在构建时被 Profile 中的属性替换
db.url=${db.url}
# 数据库地址：从 Profile 的 db.url 属性获取
db.username=${db.username}
# 数据库用户名：从 Profile 的 db.username 属性获取
db.password=${db.password}
# 数据库密码：从 Profile 的 db.password 属性获取
app.version=${project.version}
# 应用版本：从 pom.xml 的 version 获取
```

**构建命令**：

```bash
# 使用开发环境配置构建
mvn clean package -P dev

# 使用生产环境配置构建
mvn clean package -P prod

# 查看构建后 target/classes/application.properties 的内容
# 会发现 ${db.url} 已经被替换为实际的数据库地址
```

</details>

---

## 下一章预告

下一章我们会学习 **单元测试**——保证代码质量的重要手段。你会学到 JUnit 5 的基本使用、断言方法、测试生命周期、Mock 基础。
