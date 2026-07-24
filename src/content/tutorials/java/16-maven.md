---
title: '第十六章：Maven 与项目构建'
description: 'Maven 基础、pom.xml、依赖管理、生命周期'
---

# 第十六章：Maven 与项目构建

## Maven 简介

Maven 是 Java 生态中最流行的项目管理和构建工具，基于 POM（Project Object Model）管理项目依赖、编译、测试、打包等流程。

## 安装与配置

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

## pom.xml 详解

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <!-- 项目坐标 -->
    <groupId>com.example</groupId>
    <artifactId>my-app</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <!-- 属性 -->
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- 依赖管理 -->
    <dependencies>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.0.33</version>
        </dependency>
    </dependencies>

</project>
```

## 依赖管理

### 依赖范围（scope）

| scope    | 说明 | 生效范围                       |
| -------- | ---- | ------------------------------ |
| compile  | 默认 | 编译、测试、运行               |
| test     | 测试 | 仅测试                         |
| provided | 编译 | 编译、测试（运行时由容器提供） |
| runtime  | 运行 | 测试、运行                     |

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>
```

### 依赖传递与冲突

Maven 会自动传递依赖。当出现版本冲突时，使用 `<dependencyManagement>` 统一管理：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>32.1.3-jre</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 排除传递依赖

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>some-lib</artifactId>
    <version>1.0.0</version>
    <exclusions>
        <exclusion>
            <groupId>com.unwanted</groupId>
            <artifactId>unwanted-lib</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

## Maven 生命周期

### 主要阶段

```
validate → compile → test → package → verify → install → deploy
```

### 常用命令

```bash
mvn clean                  # 清除构建目录
mvn compile                # 编译主代码
mvn test-compile           # 编译测试代码
mvn test                   # 运行测试
mvn package                # 打包（jar/war）
mvn install                # 安装到本地仓库
mvn deploy                 # 部署到远程仓库
mvn clean package -DskipTests  # 跳过测试打包
```

## 常用插件

### compiler 插件

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>17</source>
                <target>17</target>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### jar 插件（指定主类）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <archive>
            <manifest>
                <mainClass>com.example.Main</mainClass>
            </manifest>
        </archive>
    </configuration>
</plugin>
```

### shade 插件（打 fat jar）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.5.1</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## 多模块项目

```xml
<!-- 父 pom.xml -->
<project>
    <groupId>com.example</groupId>
    <artifactId>parent-project</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <modules>
        <module>module-a</module>
        <module>module-b</module>
        <module>module-c</module>
    </modules>
</project>
```

## 常用仓库

| 仓库          | 地址                                          |
| ------------- | --------------------------------------------- |
| Maven Central | https://repo.maven.apache.org/maven2          |
| 阿里云        | https://maven.aliyun.com/repository/central   |
| 华为云        | https://repo.huaweicloud.com/repository/maven |

## 项目结构

标准 Maven 项目结构：

```
my-app/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── App.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── AppTest.java
└── target/
    ├── classes/
    └── my-app-1.0.0.jar
```

## 常用依赖

### 日志框架

```xml
<!-- SLF4J + Logback -->
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.4.11</version>
</dependency>

<!-- 使用 -->
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

Logger logger = LoggerFactory.getLogger(App.class);
logger.info("应用启动");
logger.error("发生错误", exception);
```

### JSON 处理

```xml
<!-- Jackson -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.3</version>
</dependency>

<!-- Gson -->
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>
```

### 工具类库

```xml
<!-- Apache Commons Lang -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.13.0</version>
</dependency>

<!-- Guava -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>32.1.3-jre</version>
</dependency>

<!-- Hutool -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.22</version>
</dependency>
```

### 测试框架

```xml
<!-- JUnit 5 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>

<!-- Mockito -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.5.0</version>
    <scope>test</scope>
</dependency>
```

## Profile 环境配置

```xml
<profiles>
    <!-- 开发环境 -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <env>dev</env>
            <db.url>jdbc:mysql://localhost:3306/dev_db</db.url>
        </properties>
    </profile>

    <!-- 测试环境 -->
    <profile>
        <id>test</id>
        <properties>
            <env>test</env>
            <db.url>jdbc:mysql://test-server:3306/test_db</db.url>
        </properties>
    </profile>

    <!-- 生产环境 -->
    <profile>
        <id>prod</id>
        <properties>
            <env>prod</env>
            <db.url>jdbc:mysql://prod-server:3306/prod_db</db.url>
        </properties>
    </profile>
</profiles>

<!-- 使用 Profile 属性 -->
<properties>
    <db.url>jdbc:mysql://localhost:3306/default_db</db.url>
</properties>
```

激活 Profile：

```bash
mvn package -P test    # 使用测试环境
mvn package -P prod    # 使用生产环境
```

## 资源过滤

```xml
<build>
    <resources>
        <resource>
            <directory>src/main/resources</directory>
            <filtering>true</filtering>
        </resource>
    </resources>
</build>
```

application.properties：

```properties
app.version=${project.version}
app.name=${project.artifactId}
db.url=${db.url}
```

## 常用命令组合

```bash
# 清理并编译
mvn clean compile

# 运行测试并生成报告
mvn test

# 打包（跳过测试）
mvn package -DskipTests

# 安装到本地仓库
mvn install

# 查看依赖树
mvn dependency:tree

# 查看依赖冲突
mvn dependency:analyze

# 生成项目站点文档
mvn site

# 使用特定 Profile 打包
mvn clean package -P prod -DskipTests

# 执行特定测试类
mvn test -Dtest=UserServiceTest

# 执行特定测试方法
mvn test -Dtest=UserServiceTest#testFindUser
```

## 父 POM 继承

```xml
<!-- 父 POM -->
<project>
    <groupId>com.example</groupId>
    <artifactId>parent-project</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <properties>
        <java.version>17</java.version>
        <spring.version>5.3.30</spring.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-core</artifactId>
                <version>${spring.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>

<!-- 子模块继承 -->
<project>
    <parent>
        <groupId>com.example</groupId>
        <artifactId>parent-project</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>child-module</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <!-- 版本从父 POM 继承 -->
        </dependency>
    </dependencies>
</project>
```

## 常见问题

### 1. 依赖冲突

```bash
# 查看依赖树
mvn dependency:tree

# 排除冲突依赖
<dependency>
    <groupId>com.example</groupId>
    <artifactId>lib-a</artifactId>
    <version>1.0.0</version>
    <exclusions>
        <exclusion>
            <groupId>com.conflict</groupId>
            <artifactId>lib-b</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### 2. 本地仓库清理

```bash
# 删除特定依赖
rm -rf ~/.m2/repository/com/example/

# 强制更新快照依赖
mvn clean install -U
```

### 3. 离线模式

```bash
# 使用本地仓库，不访问远程
mvn package -o
```

## 核心知识点

1. **Maven 坐标**：groupId、artifactId、version 唯一标识项目
2. **依赖管理**：dependencies、dependencyManagement、scope
3. **生命周期**：clean、compile、test、package、install、deploy
4. **插件配置**：compiler、jar、shade 等常用插件
5. **多模块项目**：父 POM 统一管理，子模块继承
6. **Profile 配置**：不同环境使用不同配置
7. **资源过滤**：动态替换配置文件中的变量

## 本章小结

Maven 是 Java 项目构建和依赖管理的标准工具。通过 pom.xml 管理项目配置，使用 mvn 命令执行编译、测试、打包等生命周期阶段。实际开发中要合理使用依赖、Profile 和多模块结构。
