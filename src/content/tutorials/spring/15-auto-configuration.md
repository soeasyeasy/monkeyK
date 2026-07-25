---
title: "第15章：Spring Boot 自动配置原理"
description: "深入理解 Spring Boot 自动配置机制和自定义 Starter"
---

# 第15章：Spring Boot 自动配置原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring Boot 是如何实现"开箱即用"的？
- @EnableAutoConfiguration 到底做了什么？
- 条件注解是什么？如何使用？
- 如何自定义 Starter？
- 自动配置是如何工作的？

这一章就是为了解答这些问题。我们会从自动配置的核心原理开始，深入理解条件注解的工作机制，学习自定义 Starter 的开发方法，掌握自动配置的实现细节。

---

## 15.1 为什么需要自动配置？

### 痛点分析

在 Spring Boot 出现之前，使用 Spring 框架需要大量配置：

```xml
<!-- 配置数据源 -->
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
    <property name="jdbcUrl" value="jdbc:mysql://localhost:3306/test"/>
    <property name="username" value="root"/>
    <property name="password" value="123456"/>
</bean>

<!-- 配置 SqlSessionFactory -->
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <property name="dataSource" ref="dataSource"/>
    <property name="mapperLocations" value="classpath:mapper/*.xml"/>
</bean>

<!-- 配置 Mapper 扫描 -->
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="com.example.mapper"/>
</bean>
```

**问题**：
- 配置繁琐，容易出错
- 每个项目都要重复配置
- 配置难以维护和升级

### 解决方案

Spring Boot 通过自动配置实现"约定优于配置"：

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456

mybatis:
  mapper-locations: classpath:mapper/*.xml
```

> **一句话总结**：自动配置根据你引入的依赖，自动帮你完成配置，让你专注于业务逻辑。

---

## 15.2 核心原理

### 15.2.1 自动配置三要素

| 要素 | 说明 | 例子 |
| --- | --- | --- |
| @EnableAutoConfiguration | 启用自动配置 | 标注在启动类上 |
| 条件注解 | 控制配置是否生效 | @ConditionalOnClass |
| spring.factories | 配置类注册文件 | META-INF/spring.factories |

打个比方：

> 自动配置就像智能家电：
> - @EnableAutoConfiguration = 打开电源开关
> - 条件注解 = 传感器（检测是否有洗衣机、冰箱等）
> - spring.factories = 设备清单（告诉系统有哪些设备可以自动配置）

### 15.2.2 自动配置流程

```
1. 应用启动
   ↓
2. @EnableAutoConfiguration 生效
   ↓
3. 读取 META-INF/spring.factories
   ↓
4. 加载所有自动配置类
   ↓
5. 根据条件注解判断是否生效
   ↓
6. 生效的配置类注册 Bean
```

### 15.2.3 条件注解体系

| 注解 | 说明 | 使用场景 |
| --- | --- | --- |
| @ConditionalOnClass | 类路径中存在指定类 | 引入依赖时生效 |
| @ConditionalOnMissingClass | 类路径中不存在指定类 | 未引入依赖时生效 |
| @ConditionalOnBean | 容器中存在指定 Bean | 依赖其他 Bean 时生效 |
| @ConditionalOnMissingBean | 容器中不存在指定 Bean | 用户未自定义时生效 |
| @ConditionalOnProperty | 配置属性满足条件 | 配置开关控制 |
| @ConditionalOnWebApplication | 是 Web 应用 | Web 相关配置 |

---

## 15.3 基础用法

### 15.3.1 查看自动配置报告

```yaml
# application.yml
debug: true
```

启动时会输出自动配置报告：

```
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass found required class 'javax.sql.DataSource' (OnClassCondition)
      
Negative matches:
-----------------
   MongoAutoConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class 'com.mongodb.client.MongoClient' (OnClassCondition)
```

### 15.3.2 自定义自动配置

**步骤一：创建配置类**

```java
package com.example.autoconfig;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnClass(MyService.class) // 类路径中存在 MyService 时生效
public class MyAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean // 容器中没有 MyService 时创建
    public MyService myService() {
        System.out.println("自动配置 MyService");
        return new MyService();
    }
}
```

**步骤二：注册配置类**

创建 `META-INF/spring.factories`：

```properties
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.autoconfig.MyAutoConfiguration
```

**步骤三：使用配置**

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 15.3.3 条件属性配置

```java
@Configuration
@ConditionalOnProperty(
    prefix = "my.service",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true // 未配置时默认生效
)
public class MyServiceAutoConfiguration {
    
    @Bean
    public MyService myService() {
        return new MyService();
    }
}
```

```yaml
# application.yml
my:
  service:
    enabled: true # 设置为 false 可以禁用
```

### 15.3.4 配置属性绑定

```java
// 配置属性类
@ConfigurationProperties(prefix = "my.service")
public class MyServiceProperties {
    
    private boolean enabled = true;
    private String name = "default";
    private int timeout = 3000;
    
    // getter 和 setter
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getTimeout() { return timeout; }
    public void setTimeout(int timeout) { this.timeout = timeout; }
}

// 自动配置类
@Configuration
@EnableConfigurationProperties(MyServiceProperties.class)
@ConditionalOnProperty(prefix = "my.service", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MyServiceAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyServiceProperties properties) {
        return new MyService(properties.getName(), properties.getTimeout());
    }
}
```

---

## 15.4 进阶用法

### 15.4.1 自定义 Starter

**Starter 结构**：

```
my-spring-boot-starter/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── example/
│       │           └── starter/
│       │               ├── MyServiceAutoConfiguration.java
│       │               ├── MyServiceProperties.java
│       │               └── MyService.java
│       └── resources/
│           └── META-INF/
│               └── spring.factories
└── pom.xml
```

**pom.xml**：

```xml
<project>
    <groupId>com.example</groupId>
    <artifactId>my-spring-boot-starter</artifactId>
    <version>1.0.0</version>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
    </dependencies>
</project>
```

**配置属性类**：

```java
@ConfigurationProperties(prefix = "my.service")
public class MyServiceProperties {
    
    private String prefix = "[MyService]";
    private String suffix = "!";
    
    public String getPrefix() { return prefix; }
    public void setPrefix(String prefix) { this.prefix = prefix; }
    public String getSuffix() { return suffix; }
    public void setSuffix(String suffix) { this.suffix = suffix; }
}
```

**服务类**：

```java
public class MyService {
    
    private MyServiceProperties properties;
    
    public MyService(MyServiceProperties properties) {
        this.properties = properties;
    }
    
    public String wrap(String text) {
        return properties.getPrefix() + text + properties.getSuffix();
    }
}
```

**自动配置类**：

```java
@Configuration
@EnableConfigurationProperties(MyServiceProperties.class)
@ConditionalOnClass(MyService.class)
public class MyServiceAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyServiceProperties properties) {
        return new MyService(properties);
    }
}
```

**注册配置**：

```properties
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.starter.MyServiceAutoConfiguration
```

**使用 Starter**：

```xml
<!-- 在其他项目中引入 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>my-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

```yaml
# application.yml
my:
  service:
    prefix: "[Hello]"
    suffix: "!"
```

```java
@RestController
public class DemoController {
    
    @Autowired
    private MyService myService;
    
    @GetMapping("/wrap")
    public String wrap(String text) {
        return myService.wrap(text); // 返回 "[Hello]text!"
    }
}
```

### 15.4.2 排除自动配置

```java
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    MongoAutoConfiguration.class
})
public class DemoApplication {
}
```

```yaml
# application.yml
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
      - org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration
```

### 15.4.3 配置优先级

```java
@Configuration
public class CustomConfig {
    
    // 用户自定义的 Bean 优先级高于自动配置
    @Bean
    public MyService myService() {
        return new MyService("custom");
    }
}
```

> **原理**：自动配置类使用 @ConditionalOnMissingBean，如果用户已经定义了 Bean，自动配置就不会生效。

---

## 15.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @EnableAutoConfiguration | 启用自动配置 |
| @ConditionalOnClass | 类存在时生效 |
| @ConditionalOnMissingBean | Bean 不存在时生效 |
| @ConditionalOnProperty | 属性满足条件时生效 |
| spring.factories | 配置类注册文件 |
| @ConfigurationProperties | 配置属性绑定 |
| Starter | 自动配置依赖包 |
| debug: true | 查看自动配置报告 |

---

## 15.6 新手常见误区

### 误区 1："自动配置会覆盖我的配置"

**错！** 自动配置使用 @ConditionalOnMissingBean，用户自定义的 Bean 优先级更高。

```java
// 用户自定义
@Bean
public DataSource dataSource() {
    return new HikariDataSource(); // 自动配置的 DataSource 不会生效
}
```

### 误区 2："引入依赖就会自动配置"

**不完全对！** 引入依赖只是第一步，还需要满足条件注解的要求。例如，引入 Redis 依赖但没有配置连接信息，Redis 自动配置不会生效。

### 误区 3："自动配置类不能修改"

**可以！** 可以通过以下方式修改：
- 排除自动配置类
- 自定义 Bean 覆盖
- 配置属性调整

### 误区 4："Starter 必须包含自动配置"

**不是！** Starter 可以只是依赖的集合，不包含自动配置。例如 spring-boot-starter-web 包含了很多依赖，但自动配置在 spring-boot-autoconfigure 中。

### 误区 5："条件注解可以随意使用"

**要注意顺序！** 条件注解有优先级，使用不当会导致配置不生效。应该按照官方文档的建议使用。

---

## 15.7 动手练习

### 练习 1：基础练习 - 查看自动配置报告

启用自动配置报告，查看哪些配置生效了，哪些没有。

<details>
<summary>点击查看答案</summary>

```yaml
# application.yml
debug: true
```

启动应用，查看控制台输出的 CONDITIONS EVALUATION REPORT。

</details>

### 练习 2：进阶练习 - 自定义自动配置

创建一个简单的自动配置，根据配置属性决定是否创建 Bean。

<details>
<summary>点击查看答案</summary>

```java
// 配置属性
@ConfigurationProperties(prefix = "my.cache")
public class CacheProperties {
    private boolean enabled = true;
    private int maxSize = 100;
    
    // getter 和 setter
}

// 自动配置
@Configuration
@EnableConfigurationProperties(CacheProperties.class)
@ConditionalOnProperty(prefix = "my.cache", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CacheAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public CacheService cacheService(CacheProperties properties) {
        return new CacheService(properties.getMaxSize());
    }
}

// 注册
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.config.CacheAutoConfiguration
```

</details>

### 练习 3（挑战）：综合练习 - 自定义 Starter

创建一个完整的 Starter，包含配置属性、服务类和自动配置。

<details>
<summary>点击查看答案</summary>

```java
// 配置属性
@ConfigurationProperties(prefix = "greeting")
public class GreetingProperties {
    private String prefix = "Hello";
    private String suffix = "!";
    
    // getter 和 setter
}

// 服务类
public class GreetingService {
    private GreetingProperties properties;
    
    public GreetingService(GreetingProperties properties) {
        this.properties = properties;
    }
    
    public String greet(String name) {
        return properties.getPrefix() + " " + name + properties.getSuffix();
    }
}

// 自动配置
@Configuration
@EnableConfigurationProperties(GreetingProperties.class)
@ConditionalOnClass(GreetingService.class)
public class GreetingAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public GreetingService greetingService(GreetingProperties properties) {
        return new GreetingService(properties);
    }
}

// 注册
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.starter.GreetingAutoConfiguration
```

```yaml
# 使用
greeting:
  prefix: "Hi"
  suffix: "!"
```

```java
@RestController
public class GreetingController {
    @Autowired
    private GreetingService greetingService;
    
    @GetMapping("/greet")
    public String greet(String name) {
        return greetingService.greet(name);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot 综合实战**——也就是如何开发一个完整的 Spring Boot 项目。你会学到：

- 项目分层架构
- 接口文档生成
- 单元测试
- 打包部署

准备好了吗？让我们完成 Spring 学习的最后一站！
