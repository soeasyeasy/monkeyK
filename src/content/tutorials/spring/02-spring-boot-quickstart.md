---
title: "第2章：Spring Boot 快速入门"
description: "使用 Spring Boot 快速创建可运行的 Web 应用"
---

# 第2章：Spring Boot 快速入门

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring Boot 和 Spring 有什么区别？为什么要用 Spring Boot？
- 如何快速创建一个 Spring Boot 项目？
- Spring Boot 的自动配置是怎么工作的？
- 如何编写第一个 RESTful API？

这一章就是为了解答这些问题。我们会从零开始，快速创建一个 Spring Boot Web 应用，让你体验 Spring Boot 的便捷。

---

## 1 为什么需要 Spring Boot？

### 痛点分析

在 Spring Boot 出现之前，使用 Spring 框架开发 Web 应用需要：

1. **大量配置**：需要配置 web.xml、DispatcherServlet、视图解析器等
2. **依赖管理复杂**：需要手动管理各种依赖的版本兼容性
3. **部署繁琐**：需要打包成 WAR 文件，部署到外部 Tomcat
4. **开发效率低**：配置时间远超业务代码编写时间

用代码来说，传统 Spring Web 应用需要这样的配置：

```xml
<!-- web.xml - 需要配置大量内容 -->
<web-app>
    <servlet>
        <servlet-name>dispatcher</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>/WEB-INF/spring/dispatcher-servlet.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>dispatcher</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>
</web-app>
```

### 解决方案

Spring Boot 通过以下方式解决痛点：

1. **自动配置**：根据引入的依赖自动配置 Spring
2. **起步依赖**：提供 starter 依赖，一键引入相关库
3. **内嵌服务器**：内嵌 Tomcat/Jetty，直接运行 main 方法
4. **开箱即用**：零配置即可启动 Web 应用

用 Spring Boot 写同样的应用：

```java
// 只需要一个类，一个注解
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

// 控制器
@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello Spring Boot!";
    }
}
```

> **一句话总结**：Spring Boot 让 Spring 开发变得简单，从"配置地狱"变成"开箱即用"。

---

## 2 核心原理

### 2.2.1 自动配置原理

Spring Boot 的自动配置基于三个核心注解：

1. **@SpringBootApplication**：组合注解，包含：
   - @Configuration：标记为配置类
   - @EnableAutoConfiguration：启用自动配置
   - @ComponentScan：组件扫描

2. **@EnableAutoConfiguration**：根据类路径中的依赖自动配置 Bean

3. **条件注解**：@ConditionalOnClass、@ConditionalOnMissingBean 等

打个比方：

> 自动配置就像智能家电：你买了个微波炉（引入依赖），它自动帮你设置好默认参数（自动配置），不用你手动调时间、火力。

### 2.2.2 Starter 依赖机制

Spring Boot 提供了各种 starter 依赖：

| Starter | 功能 | 自动配置 |
| --- | --- | --- |
| spring-boot-starter-web | Web 开发 | 内嵌 Tomcat、Spring MVC |
| spring-boot-starter-data-jpa | JPA 数据访问 | 数据源、EntityManager |
| spring-boot-starter-security | 安全框架 | 认证、授权 |
| spring-boot-starter-test | 测试 | JUnit、Mockito |

> **原理**：每个 starter 都包含相关依赖和自动配置类，引入 starter 就自动引入所有需要的东西。

---

## 3 基础用法

### 2.3.1 创建 Spring Boot 项目

**方式一：使用 Spring Initializr（推荐）**

访问 https://start.spring.io/，选择：
- Project: Maven
- Language: Java
- Spring Boot: 3.x.x
- Group: com.example
- Artifact: demo
- Dependencies: Spring Web

**方式二：使用 IDE**

IntelliJ IDEA：File → New → Project → Spring Initializr

**方式三：命令行**

```bash
curl https://start.spring.io/starter.tgz \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d baseDir=demo \
  -d groupId=com.example \
  -d artifactId=demo \
  -d name=demo \
  -d description="Demo project for Spring Boot" \
  -d packageName=com.example.demo \
  -d dependencies=web \
  | tar -xzvf -
```

### 2.3.2 项目结构

```
demo/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               └── DemoApplication.java  # 启动类
│   │   └── resources/
│   │       ├── static/       # 静态资源
│   │       ├── templates/    # 模板文件
│   │       └── application.properties  # 配置文件
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       └── DemoApplicationTests.java  # 测试类
└── pom.xml  # Maven 配置
```

### 2.3.3 pom.xml 配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <!-- 继承 Spring Boot 父项目 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <!-- 项目基本信息 -->
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <description>Demo project for Spring Boot</description>
    
    <!-- Java 版本 -->
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <!-- 依赖管理 -->
    <dependencies>
        <!-- Spring Boot Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Boot 测试 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <!-- 构建插件 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.3.4 启动类

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// 标记为 Spring Boot 应用，启用自动配置和组件扫描
@SpringBootApplication
public class DemoApplication {
    
    // 主方法，应用入口
    public static void main(String[] args) {
        // 启动 Spring Boot 应用
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

> **原理**：`@SpringBootApplication` 是一个组合注解，包含了 `@Configuration`、`@EnableAutoConfiguration`、`@ComponentScan`。

### 2.3.5 第一个控制器

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// 标记为 REST 控制器，返回数据而非视图
@RestController
public class HelloController {
    
    // 映射 GET 请求到 /hello 路径
    @GetMapping("/hello")
    public String hello() {
        // 返回字符串，自动转换为 HTTP 响应
        return "Hello Spring Boot!";
    }
    
    // 带参数的请求
    @GetMapping("/greet")
    public String greet(String name) {
        // 接收 name 参数，返回问候语
        return "Hello, " + name + "!";
    }
    
    // 返回 JSON 对象
    @GetMapping("/user")
    public User getUser() {
        // 返回对象，自动转换为 JSON
        return new User("张三", 25);
    }
}

// 用户类
class User {
    private String name;
    private int age;
    
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // getter 和 setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}
```

### 2.3.6 配置文件

**application.properties**

```properties
# 服务器端口
server.port=8080

# 应用名称
spring.application.name=demo

# 日志级别
logging.level.root=INFO
logging.level.com.example=DEBUG
```

**application.yml（推荐）**

```yaml
server:
  port: 8080  # 服务器端口

spring:
  application:
    name: demo  # 应用名称

logging:
  level:
    root: INFO  # 根日志级别
    com.example: DEBUG  # 包日志级别
```

### 2.3.7 运行应用

**方式一：IDE 运行**

直接运行 `DemoApplication` 的 `main` 方法

**方式二：Maven 命令**

```bash
mvn spring-boot:run
```

**方式三：打包运行**

```bash
# 打包
mvn clean package

# 运行
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

访问 http://localhost:8080/hello 即可看到效果。

---

## 4 进阶用法

### 2.4.1 多环境配置

```yaml
# application.yml - 公共配置
server:
  port: 8080

# application-dev.yml - 开发环境
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db
    username: root
    password: 123456

# application-prod.yml - 生产环境
spring:
  datasource:
    url: jdbc:mysql://prod-server:3306/prod_db
    username: prod_user
    password: prod_password
```

激活环境：

```bash
# 方式一：命令行参数
java -jar demo.jar --spring.profiles.active=prod

# 方式二：配置文件
spring:
  profiles:
    active: dev
```

### 2.4.2 自定义配置

```java
package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// 绑定配置前缀
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    
    // 应用名称
    private String name;
    
    // 版本号
    private String version;
    
    // 是否启用缓存
    private boolean cacheEnabled;
    
    // getter 和 setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public boolean isCacheEnabled() { return cacheEnabled; }
    public void setCacheEnabled(boolean cacheEnabled) { 
        this.cacheEnabled = cacheEnabled; 
    }
}
```

```yaml
# application.yml
app:
  name: 我的应用
  version: 1.0.0
  cache-enabled: true
```

### 2.4.3 读取配置

```java
package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfigController {
    
    // 使用 @Value 读取配置
    @Value("${server.port}")
    private int port;
    
    @Value("${app.name}")
    private String appName;
    
    @GetMapping("/config")
    public String getConfig() {
        return "端口: " + port + ", 应用名: " + appName;
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @SpringBootApplication | 组合注解，启用自动配置和组件扫描 |
| SpringApplication.run() | 启动 Spring Boot 应用 |
| @RestController | 标记 REST 控制器 |
| @GetMapping | 映射 GET 请求 |
| application.properties/yml | 配置文件 |
| spring-boot-starter-* | 起步依赖，一键引入相关库 |
| 多环境配置 | 通过 profiles 切换不同环境 |

---

## 6 新手常见误区

### 误区 1："Spring Boot 必须用 Java 17+"

**错！** Spring Boot 3.x 需要 Java 17+，但 Spring Boot 2.x 支持 Java 8+。根据项目需求选择版本。

**正确做法**：
- 新项目：使用 Spring Boot 3.x + Java 17
- 老项目升级：可以使用 Spring Boot 2.x + Java 8

### 误区 2："@SpringBootApplication 可以省略"

不是的。`@SpringBootApplication` 是必须的，它包含了三个关键注解：
- `@Configuration`：标记配置类
- `@EnableAutoConfiguration`：启用自动配置
- `@ComponentScan`：组件扫描

省略任何一个都会导致应用无法正常工作。

### 误区 3："配置文件只能用 properties"

不是的。Spring Boot 支持两种配置文件：
- `.properties`：键值对格式
- `.yml` / `.yaml`：YAML 格式（推荐，更清晰）

YAML 格式更推荐，因为结构清晰、支持嵌套。

### 误区 4："自动配置会覆盖我的配置"

**不会！** Spring Boot 的自动配置遵循"用户配置优先"原则。如果你手动配置了某个 Bean，自动配置就不会生效。

**正确理解**：自动配置是兜底方案，你的配置优先级更高。

### 误区 5："Spring Boot 只能做 Web 应用"

**错！** Spring Boot 可以做任何类型的 Java 应用：
- Web 应用（spring-boot-starter-web）
- 批处理应用（spring-boot-starter-batch）
- 消息队列应用（spring-boot-starter-amqp）
- 命令行应用（spring-boot-starter）

Spring Boot 只是一个快速开发框架，不限制应用类型。

---

## 7 动手练习

### 练习 1：基础练习 - 创建 Hello World 应用

创建一个 Spring Boot 应用，实现以下功能：
1. 访问 `/` 返回 "Welcome to Spring Boot!"
2. 访问 `/time` 返回当前时间
3. 访问 `/info` 返回应用信息（名称、版本）

<details>
<summary>点击查看答案</summary>

```java
// DemoApplication.java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

// InfoController.java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
public class InfoController {
    
    @GetMapping("/")
    public String welcome() {
        return "Welcome to Spring Boot!";
    }
    
    @GetMapping("/time")
    public String getTime() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return "当前时间: " + now.format(formatter);
    }
    
    @GetMapping("/info")
    public String getInfo() {
        return "应用名称: Demo\n版本: 1.0.0";
    }
}
```

</details>

### 练习 2：进阶练习 - 自定义配置

创建一个 Spring Boot 应用，实现以下功能：
1. 在 `application.yml` 中配置数据库连接信息
2. 创建配置类绑定配置
3. 创建控制器显示配置信息

<details>
<summary>点击查看答案</summary>

```yaml
# application.yml
server:
  port: 8080

app:
  database:
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456
    max-connections: 10
```

```java
// DatabaseProperties.java
package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.database")
public class DatabaseProperties {
    
    private String url;
    private String username;
    private String password;
    private int maxConnections;
    
    // getter 和 setter
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public int getMaxConnections() { return maxConnections; }
    public void setMaxConnections(int maxConnections) { 
        this.maxConnections = maxConnections; 
    }
}

// ConfigController.java
package com.example.demo.controller;

import com.example.demo.config.DatabaseProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfigController {
    
    @Autowired
    private DatabaseProperties dbProperties;
    
    @GetMapping("/db-info")
    public String getDbInfo() {
        return "数据库 URL: " + dbProperties.getUrl() + 
               "\n用户名: " + dbProperties.getUsername() +
               "\n最大连接数: " + dbProperties.getMaxConnections();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - RESTful API

创建一个 Spring Boot 应用，实现简单的用户管理 API：
1. GET `/users` - 获取所有用户
2. GET `/users/{id}` - 获取指定用户
3. POST `/users` - 创建用户
4. PUT `/users/{id}` - 更新用户
5. DELETE `/users/{id}` - 删除用户

<details>
<summary>点击查看答案</summary>

```java
// User.java
package com.example.demo.model;

public class User {
    private Long id;
    private String name;
    private Integer age;
    
    public User() {}
    
    public User(Long id, String name, Integer age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
    
    // getter 和 setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}

// UserController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/users")
public class UserController {
    
    // 模拟数据库
    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);
    
    // 获取所有用户
    @GetMapping
    public List<User> getAllUsers() {
        return new ArrayList<>(users.values());
    }
    
    // 获取指定用户
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        User user = users.get(id);
        if (user == null) {
            throw new RuntimeException("用户不存在: " + id);
        }
        return user;
    }
    
    // 创建用户
    @PostMapping
    public User createUser(@RequestBody User user) {
        Long id = idCounter.getAndIncrement();
        user.setId(id);
        users.put(id, user);
        return user;
    }
    
    // 更新用户
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        if (!users.containsKey(id)) {
            throw new RuntimeException("用户不存在: " + id);
        }
        user.setId(id);
        users.put(id, user);
        return user;
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        User removed = users.remove(id);
        if (removed == null) {
            throw new RuntimeException("用户不存在: " + id);
        }
        return "删除成功: " + id;
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Bean 管理**——也就是如何管理 Spring 容器中的对象。你会学到：

- Bean 的生命周期
- Bean 的作用域
- 条件装配
- @Component 体系注解

准备好了吗？让我们继续深入 Spring 的世界！
