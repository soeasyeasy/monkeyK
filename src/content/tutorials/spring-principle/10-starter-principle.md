---
title: "第 10 章：Spring Boot Starter 原理"
description: "深入理解 Starter 组成结构、自定义 Starter 开发实战、spring-boot-autoconfigure 模块解析、@ConfigurationProperties 属性绑定原理"
---

# 第 10 章：Spring Boot Starter 原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring Boot Starter 到底是什么？它和普通的 jar 包有什么区别？
- 为什么引入一个 `spring-boot-starter-web` 就能用 Spring MVC？
- 怎么开发一个自己的 Starter 给团队或开源社区用？
- @ConfigurationProperties 是怎么把配置文件中的值绑定到 Java 对象的？

这一章就是为了解答这些问题。我们会从 Starter 的组成结构开始，深入理解 spring-boot-autoconfigure 模块的工作原理，动手开发一个自定义 Starter，最后剖析 @ConfigurationProperties 属性绑定的底层机制。

---

## 1 为什么需要 Starter？

### 痛点分析

在 Spring Boot 出现之前，引入一个第三方框架需要手动配置大量依赖：

```xml
<!-- 想用 Spring MVC，你需要手动引入这些依赖 -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>5.3.20</version>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <version>5.3.20</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.13.3</version>
</dependency>
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
</dependency>
<!-- 还有 Tomcat、日志、参数校验... 一堆依赖 -->
```

**问题**：
- 依赖太多，不知道需要引入哪些
- 版本容易冲突，需要手动对齐
- 配置繁琐，每个框架都要写一堆配置代码
- 新人上手困难，不知道"标准搭配"是什么

### 解决方案

Spring Boot 通过 Starter 实现"一键引入"：

```xml
<!-- 只需要一个 Starter，自动引入所有相关依赖 + 自动配置 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

打个比方：

> Starter 就像"套餐"：
> - 单点模式（传统方式）：你要自己选汉堡、薯条、可乐，还要考虑搭配
> - 套餐模式（Starter）：直接点一个"汉堡套餐"，里面搭配好了所有东西
> - 官方 Starter = 官方推荐套餐，保证搭配合理
> - 第三方 Starter = 其他餐厅的套餐，也能用，但质量参差不齐

---

## 2 核心原理

### 10.2.1 Starter 的组成结构

一个完整的 Starter 通常由两个模块组成：

```
my-custom-spring-boot-starter/
├── my-custom-spring-boot-starter/          # Starter 模块（空壳）
│   └── pom.xml                             # 只包含依赖
│
└── my-custom-spring-boot-autoconfigure/    # 自动配置模块
    ├── pom.xml
    └── src/main/java/
        └── com/example/autoconfigure/
            ├── MyAutoConfiguration.java    # 自动配置类
            ├── MyProperties.java           # 配置属性类
            └── MyService.java              # 核心服务类
```

#### 各模块职责

| 模块 | 职责 | 内容 |
| --- | --- | --- |
| Starter 模块 | 依赖聚合 | pom.xml 中引入 autoconfigure 模块和其他依赖 |
| Autoconfigure 模块 | 自动配置 | 自动配置类、配置属性类、核心服务类 |

#### Starter 模块的 pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>my-custom-spring-boot-starter</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>My Custom Spring Boot Starter</name>
    <description>自定义 Spring Boot Starter</description>
    
    <dependencies>
        <!-- 引入自动配置模块 -->
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>my-custom-spring-boot-autoconfigure</artifactId>
            <version>1.0.0</version>
        </dependency>
        
        <!-- 引入其他需要的依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
    </dependencies>
</project>
```

### 10.2.2 spring-boot-autoconfigure 模块解析

#### 官方 autoconfigure 模块结构

```
spring-boot-autoconfigure/
├── src/main/java/
│   └── org/springframework/boot/autoconfigure/
│       ├── web/                    # Web 相关自动配置
│       │   ├── servlet/            # Servlet Web 配置
│       │   │   ├── ServletWebServerFactoryAutoConfiguration.java
│       │   │   ├── DispatcherServletAutoConfiguration.java
│       │   │   └── ...
│       │   └── reactive/           # 响应式 Web 配置
│       ├── jdbc/                   # JDBC 相关自动配置
│       │   ├── DataSourceAutoConfiguration.java
│       │   ├── JdbcTemplateAutoConfiguration.java
│       │   └── ...
│       ├── data/                   # 数据访问相关
│       │   ├── redis/
│       │   ├── mongodb/
│       │   └── ...
│       └── ...
├── src/main/resources/
│   └── META-INF/
│       └── spring/
│           └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
└── pom.xml
```

#### 自动配置类示例

```java
// DataSourceAutoConfiguration 简化版
@Configuration(proxyBeanMethods = false)  // 不使用 CGLIB 代理，提升性能
@ConditionalOnClass(DataSource.class)  // 类路径中有 DataSource 类
@EnableConfigurationProperties(DataSourceProperties.class)  // 启用配置属性绑定
@AutoConfigureBefore(HibernateJpaAutoConfiguration.class)  // 在 JPA 配置之前
public class DataSourceAutoConfiguration {
    
    // 内嵌配置类： pooled 数据源
    @Configuration(proxyBeanMethods = false)
    @ConditionalOnMissingBean(type = "io.r2dbc.spi.ConnectionFactory")  // 没有 R2DBC
    protected static class PooledDataSourceConfiguration {
        
        @Bean
        @ConditionalOnMissingBean  // 容器中没有 DataSource 时才创建
        public DataSource dataSource(DataSourceProperties properties) {
            // 使用 HikariCP 连接池
            return properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        }
    }
}
```

### 10.2.3 @ConfigurationProperties 属性绑定原理

#### 工作流程

```
1. 用户在配置文件中写属性
   my.service.name=my-service
   ↓
2. @ConfigurationProperties 标注的 Bean 被识别
   ↓
3. ConfigurationPropertiesBindingPostProcessor 拦截
   ↓
4. Binder 从 Environment 中读取属性
   ↓
5. 通过反射调用 setter 方法或构造函数绑定值
   ↓
6. 类型转换（String -> int, String -> boolean 等）
   ↓
7. 绑定完成，Bean 可以使用配置值
```

#### 源码解析

```java
// @ConfigurationProperties 注解定义
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ConfigurationProperties {
    
    // 配置前缀
    String prefix() default "";
    
    // 配置前缀（Spring Boot 2.2+ 推荐用 value）
    @AliasFor("prefix")
    String value() default "";
}

// ConfigurationPropertiesBindingPostProcessor 核心逻辑
public class ConfigurationPropertiesBindingPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        // 获取 @ConfigurationProperties 注解
        ConfigurationProperties annotation = 
            AnnotationUtils.findAnnotation(bean.getClass(), ConfigurationProperties.class);
        
        if (annotation != null) {
            // 执行属性绑定
            bind(bean, beanName, annotation);
        }
        
        return bean;
    }
    
    private void bind(Object bean, String beanName, ConfigurationProperties annotation) {
        // 1. 获取配置前缀
        String prefix = annotation.prefix();
        if (prefix.isEmpty()) {
            prefix = annotation.value();
        }
        
        // 2. 创建 Binder
        Binder binder = Binder.get(this.environment);
        
        // 3. 执行绑定
        Bindable<?> target = Bindable.of(bean.getClass())
            .withExistingBean(bean)
            .withAnnotations(annotation);
        
        binder.bind(prefix, target);
    }
}

// Binder 核心逻辑
public class Binder {
    
    public <T> BindResult<T> bind(String name, Bindable<T> target) {
        // 1. 获取配置属性
        ConfigurationPropertySource source = 
            ConfigurationPropertySources.get(this.environment).iterator().next();
        
        // 2. 解析属性值
        T result = bindProperty(source, name, target);
        
        return BindResult.of(result);
    }
    
    private <T> T bindProperty(ConfigurationPropertySource source, 
                               String name, 
                               Bindable<T> target) {
        Class<T> type = (Class<T>) target.getType();
        T instance = (T) target.getValue().orElse(null);
        
        // 如果没有实例，通过反射创建
        if (instance == null) {
            instance = type.getDeclaredConstructor().newInstance();
        }
        
        // 遍历所有属性，通过 setter 绑定
        for (PropertyDescriptor property : getPropertyDescriptors(type)) {
            String propertyName = property.getName();
            String key = name + "." + kebabCase(propertyName);  // 驼峰转短横线
            
            // 从 Environment 中获取值
            Object value = this.environment.getProperty(key);
            
            if (value != null) {
                // 类型转换
                Object convertedValue = convert(value, property.getPropertyType());
                
                // 调用 setter 方法
                Method setter = property.getWriteMethod();
                if (setter != null) {
                    setter.invoke(instance, convertedValue);
                }
            }
        }
        
        return instance;
    }
}
```

#### 属性名映射规则

| 配置文件中的写法 | Java 属性名 | 说明 |
| --- | --- | --- |
| my.service.name | name | 直接映射 |
| my.service.max-retries | maxRetries | 短横线转驼峰 |
| my.service.max_retries | maxRetries | 下划线转驼峰 |
| my.service.MAX_RETRIES | maxRetries | 大写下划线转驼峰 |
| my.service.maxRetries | maxRetries | 直接匹配 |

---

## 3 基础用法

### 10.3.1 自定义 Starter 完整开发流程

#### 第一步：创建项目结构

```
my-spring-boot-starter/
├── pom.xml                                    # 父 POM
├── my-spring-boot-starter/                    # Starter 模块
│   ├── pom.xml
├── my-spring-boot-autoconfigure/              # 自动配置模块
│   ├── pom.xml
│   └── src/main/java/com/example/
│       ├── autoconfigure/
│       │   ├── GreetingAutoConfiguration.java
│       │   └── GreetingProperties.java
│       └── service/
│           └── GreetingService.java
```

#### 第二步：编写父 POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>my-spring-boot-starter-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <!-- 继承 Spring Boot 父 POM -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.0.0</version>
    </parent>
    
    <modules>
        <module>my-spring-boot-autoconfigure</module>
        <module>my-spring-boot-starter</module>
    </modules>
    
    <properties>
        <java.version>17</java.version>
    </properties>
</project>
```

#### 第三步：编写自动配置模块

```xml
<!-- my-spring-boot-autoconfigure/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-spring-boot-starter-parent</artifactId>
        <version>1.0.0</version>
    </parent>
    
    <artifactId>my-spring-boot-autoconfigure</artifactId>
    
    <dependencies>
        <!-- Spring Boot 自动配置支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
        
        <!-- 配置属性元数据生成（IDE 提示支持） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

```java
// GreetingProperties.java - 配置属性类
package com.example.autoconfigure;

import org.springframework.boot.context.properties.ConfigurationProperties;

// 绑定 my.greeting 前缀的配置
@ConfigurationProperties(prefix = "my.greeting")
public class GreetingProperties {
    
    // 问候语前缀，默认 "Hello"
    private String prefix = "Hello";
    
    // 问候语后缀，默认为空
    private String suffix = "";
    
    // 是否启用，默认 true
    private boolean enabled = true;
    
    // getter 和 setter 方法（必须有，否则无法绑定）
    public String getPrefix() {
        return prefix;
    }
    
    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }
    
    public String getSuffix() {
        return suffix;
    }
    
    public void setSuffix(String suffix) {
        this.suffix = suffix;
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
```

```java
// GreetingService.java - 核心服务类
package com.example.service;

import com.example.autoconfigure.GreetingProperties;

public class GreetingService {
    
    private final GreetingProperties properties;
    
    // 通过构造函数注入配置属性
    public GreetingService(GreetingProperties properties) {
        this.properties = properties;
    }
    
    // 生成问候语
    public String greet(String name) {
        return properties.getPrefix() + ", " + name + properties.getSuffix();
    }
}
```

```java
// GreetingAutoConfiguration.java - 自动配置类
package com.example.autoconfigure;

import com.example.service.GreetingService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration  // 标注为配置类
@ConditionalOnClass(GreetingService.class)  // 类路径中有 GreetingService 时生效
@EnableConfigurationProperties(GreetingProperties.class)  // 启用配置属性绑定
public class GreetingAutoConfiguration {
    
    private final GreetingProperties properties;
    
    // 通过构造函数注入配置属性
    public GreetingAutoConfiguration(GreetingProperties properties) {
        this.properties = properties;
    }
    
    // 创建 GreetingService Bean
    @Bean
    @ConditionalOnMissingBean  // 容器中没有时才创建
    @ConditionalOnProperty(  // 配置 my.greeting.enabled=true 时生效
        prefix = "my.greeting",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true  // 没有配置时也生效
    )
    public GreetingService greetingService() {
        return new GreetingService(properties);
    }
}
```

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.autoconfigure.GreetingAutoConfiguration
```

#### 第四步：编写 Starter 模块

```xml
<!-- my-spring-boot-starter/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-spring-boot-starter-parent</artifactId>
        <version>1.0.0</version>
    </parent>
    
    <artifactId>my-spring-boot-starter</artifactId>
    
    <dependencies>
        <!-- 引入自动配置模块 -->
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>my-spring-boot-autoconfigure</artifactId>
            <version>${project.version}</version>
        </dependency>
        
        <!-- 引入 Spring Boot 基础 Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
    </dependencies>
</project>
```

#### 第五步：使用自定义 Starter

```xml
<!-- 在其他项目的 pom.xml 中引入 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>my-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

```yaml
# application.yml
my:
  greeting:
    prefix: "Hi"       # 自定义前缀
    suffix: "!"        # 自定义后缀
    enabled: true      # 启用服务
```

```java
// 使用自动配置的 Bean
@SpringBootApplication
public class DemoApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

@RestController
public class GreetingController {
    
    @Autowired
    private GreetingService greetingService;  // 自动注入
    
    @GetMapping("/greet")
    public String greet(@RequestParam String name) {
        return greetingService.greet(name);  // 输出: Hi, name!
    }
}
```

### 10.3.2 @ConfigurationProperties 进阶用法

#### 嵌套属性绑定

```java
// 配置属性类 - 支持嵌套对象
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    
    private String name;  // 应用名称
    private Server server = new Server();  // 服务器配置
    private Database database = new Database();  // 数据库配置
    
    // getter 和 setter
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Server getServer() {
        return server;
    }
    
    public void setServer(Server server) {
        this.server = server;
    }
    
    public Database getDatabase() {
        return database;
    }
    
    public void setDatabase(Database database) {
        this.database = database;
    }
    
    // 嵌套类：服务器配置
    public static class Server {
        
        private String host = "localhost";  // 主机名
        private int port = 8080;  // 端口号
        
        public String getHost() {
            return host;
        }
        
        public void setHost(String host) {
            this.host = host;
        }
        
        public int getPort() {
            return port;
        }
        
        public void setPort(int port) {
            this.port = port;
        }
    }
    
    // 嵌套类：数据库配置
    public static class Database {
        
        private String url;  // 数据库 URL
        private String username;  // 用户名
        private String password;  // 密码
        private int maxConnections = 10;  // 最大连接数
        
        public String getUrl() {
            return url;
        }
        
        public void setUrl(String url) {
            this.url = url;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
        
        public int getMaxConnections() {
            return maxConnections;
        }
        
        public void setMaxConnections(int maxConnections) {
            this.maxConnections = maxConnections;
        }
    }
}
```

```yaml
# application.yml
my:
  app:
    name: my-application
    server:
      host: 0.0.0.0
      port: 9090
    database:
      url: jdbc:mysql://localhost:3306/mydb
      username: root
      password: 123456
      max-connections: 20
```

#### List 和 Map 属性绑定

```java
// 配置属性类 - 支持 List 和 Map
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    
    // List 属性
    private List<String> allowedOrigins = new ArrayList<>();
    
    // Map 属性
    private Map<String, String> metadata = new HashMap<>();
    
    // List 嵌套对象
    private List<Feature> features = new ArrayList<>();
    
    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }
    
    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }
    
    public Map<String, String> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }
    
    public List<Feature> getFeatures() {
        return features;
    }
    
    public void setFeatures(List<Feature> features) {
        this.features = features;
    }
    
    // 嵌套类
    public static class Feature {
        private String name;
        private boolean enabled;
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public boolean isEnabled() {
            return enabled;
        }
        
        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
```

```yaml
# application.yml
my:
  app:
    allowed-origins:
      - http://localhost:3000
      - http://localhost:8080
      - https://www.example.com
    metadata:
      version: 1.0.0
      author: developer
      description: my application
    features:
      - name: cache
        enabled: true
      - name: logging
        enabled: true
      - name: monitoring
        enabled: false
```

#### 构造函数绑定（不可变配置）

```java
// 使用构造函数绑定（Spring Boot 2.2+）
@ConfigurationProperties(prefix = "my.app")
public class ImmutableAppProperties {
    
    private final String name;  // final 字段
    private final int port;  // final 字段
    
    // 使用 @ConstructorBinding 注解
    @ConstructorBinding
    public ImmutableAppProperties(String name, int port) {
        this.name = name;
        this.port = port;
    }
    
    // 只需要 getter，不需要 setter
    public String getName() {
        return name;
    }
    
    public int getPort() {
        return port;
    }
}
```

---

## 4 对比表格

### 官方常用 Starter 对比

| Starter | 包含内容 | 自动配置 |
| --- | --- | --- |
| spring-boot-starter | Spring 核心、日志、自动配置 | 基础自动配置 |
| spring-boot-starter-web | Spring MVC、Jackson、Tomcat | Web 自动配置 |
| spring-boot-starter-data-jpa | Spring Data JPA、Hibernate、HikariCP | 数据源 + JPA 自动配置 |
| spring-boot-starter-data-redis | Spring Data Redis、Lettuce | Redis 自动配置 |
| spring-boot-starter-security | Spring Security | Security 自动配置 |
| spring-boot-starter-test | JUnit、Mockito、AssertJ | 测试相关配置 |
| spring-boot-starter-actuator | Spring Actuator | 监控端点自动配置 |

### 自定义 Starter 命名规范

| 模式 | 示例 | 说明 |
| --- | --- | --- |
| 官方 Starter | spring-boot-starter-xxx | Spring Boot 官方提供 |
| 第三方 Starter | xxx-spring-boot-starter | 第三方提供，推荐格式 |
| 不推荐 | spring-boot-starter-xxx | 第三方使用官方前缀会混淆 |

### @ConfigurationProperties vs @Value 对比

| 特性 | @ConfigurationProperties | @Value |
| --- | --- | --- |
| 绑定方式 | 批量绑定（前缀 + 属性名） | 单个绑定（指定全路径） |
| 类型支持 | 支持复杂类型（对象、List、Map） | 只支持基本类型和 String |
| 类型转换 | 自动类型转换 | 需要 SpEL 表达式 |
| IDE 提示 | 支持（配合元数据） | 不支持 |
| 校验 | 支持 JSR-303 校验 | 不支持 |
| 松散绑定 | 支持（驼峰、短横线、下划线） | 不支持 |
| 适用场景 | 配置项较多、结构化配置 | 少量简单配置 |

---

## 5 新手常见误区

### 误区 1：Starter 模块必须包含代码

**错！** Starter 模块是一个"空壳"，它的作用只是聚合依赖：

```xml
<!-- ✅ 正确：Starter 模块只包含依赖 -->
<dependencies>
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>my-spring-boot-autoconfigure</artifactId>
    </dependency>
</dependencies>

<!-- ❌ 错误：在 Starter 模块中写业务代码 -->
<!-- Starter 模块不应该包含任何 Java 代码 -->
```

### 误区 2：@ConfigurationProperties 不需要 getter/setter

**错！** @ConfigurationProperties 依赖 getter/setter 进行属性绑定：

```java
// ❌ 错误：没有 getter/setter
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    private String name;  // 没有 getter/setter，无法绑定
}

// ✅ 正确：提供完整的 getter/setter
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    private String name;
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}
```

### 误区 3：自动配置类必须放在 Starter 模块中

**错！** 自动配置类应该放在 autoconfigure 模块中：

```
// ❌ 错误：Starter 模块中放自动配置类
my-spring-boot-starter/
└── src/main/java/
    └── MyAutoConfiguration.java  // 不应该在这里

// ✅ 正确：autoconfigure 模块中放自动配置类
my-spring-boot-autoconfigure/
└── src/main/java/
    └── MyAutoConfiguration.java  // 应该在这里
```

### 误区 4：@ConfigurationProperties 和 @Component 一起使用

**不推荐！** 两种方式只能选一种：

```java
// 方式 1：使用 @Component + @ConfigurationProperties
@Component  // 注册为 Bean
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    // ...
}

// 方式 2：使用 @EnableConfigurationProperties（推荐）
@Configuration
@EnableConfigurationProperties(AppProperties.class)  // 自动注册为 Bean
public class MyAutoConfiguration {
    // ...
}
```

### 误区 5：配置属性类不需要默认值

**错！** 没有默认值可能导致空指针异常：

```java
// ❌ 错误：没有默认值
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    private Server server;  // 没有初始化，可能为 null
}

// ✅ 正确：提供默认值
@ConfigurationProperties(prefix = "my.app")
public class AppProperties {
    private Server server = new Server();  // 初始化默认值
}
```

---

## 6 动手练习

### 练习 1：基础练习 - 创建简单 Starter

创建一个 `logging-spring-boot-starter`，自动配置一个日志增强服务，支持通过配置文件设置日志前缀。

<details>
<summary>点击查看答案</summary>

```java
// 1. 配置属性类
@ConfigurationProperties(prefix = "my.logging")
public class LoggingProperties {
    
    private String prefix = "[LOG]";  // 日志前缀
    private boolean enabled = true;  // 是否启用
    
    public String getPrefix() {
        return prefix;
    }
    
    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}

// 2. 核心服务类
public class EnhancedLoggingService {
    
    private final LoggingProperties properties;
    
    public EnhancedLoggingService(LoggingProperties properties) {
        this.properties = properties;
    }
    
    public void log(String message) {
        if (properties.isEnabled()) {
            System.out.println(properties.getPrefix() + " " + message);
        }
    }
}

// 3. 自动配置类
@Configuration
@ConditionalOnClass(EnhancedLoggingService.class)
@EnableConfigurationProperties(LoggingProperties.class)
public class LoggingAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(
        prefix = "my.logging",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
    )
    public EnhancedLoggingService enhancedLoggingService(LoggingProperties properties) {
        return new EnhancedLoggingService(properties);
    }
}
```

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.LoggingAutoConfiguration
```

```yaml
# application.yml
my:
  logging:
    prefix: "[MyApp]"
    enabled: true
```

</details>

### 练习 2：进阶练习 - 支持嵌套配置

创建一个 `database-spring-boot-starter`，支持嵌套配置（主库 + 从库）。

<details>
<summary>点击查看答案</summary>

```java
// 1. 配置属性类 - 支持嵌套
@ConfigurationProperties(prefix = "my.database")
public class DatabaseProperties {
    
    private DataSourceConfig master = new DataSourceConfig();  // 主库配置
    private List<DataSourceConfig> slaves = new ArrayList<>();  // 从库配置列表
    
    public DataSourceConfig getMaster() {
        return master;
    }
    
    public void setMaster(DataSourceConfig master) {
        this.master = master;
    }
    
    public List<DataSourceConfig> getSlaves() {
        return slaves;
    }
    
    public void setSlaves(List<DataSourceConfig> slaves) {
        this.slaves = slaves;
    }
    
    // 嵌套类：数据源配置
    public static class DataSourceConfig {
        
        private String url;  // 数据库 URL
        private String username;  // 用户名
        private String password;  // 密码
        private int maxConnections = 10;  // 最大连接数
        
        public String getUrl() {
            return url;
        }
        
        public void setUrl(String url) {
            this.url = url;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
        
        public int getMaxConnections() {
            return maxConnections;
        }
        
        public void setMaxConnections(int maxConnections) {
            this.maxConnections = maxConnections;
        }
    }
}

// 2. 核心服务类
public class DatabaseService {
    
    private final DatabaseProperties properties;
    
    public DatabaseService(DatabaseProperties properties) {
        this.properties = properties;
    }
    
    public void showConfig() {
        System.out.println("Master: " + properties.getMaster().getUrl());
        for (int i = 0; i < properties.getSlaves().size(); i++) {
            System.out.println("Slave " + i + ": " + 
                properties.getSlaves().get(i).getUrl());
        }
    }
}

// 3. 自动配置类
@Configuration
@ConditionalOnClass(DatabaseService.class)
@EnableConfigurationProperties(DatabaseProperties.class)
public class DatabaseAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public DatabaseService databaseService(DatabaseProperties properties) {
        return new DatabaseService(properties);
    }
}
```

```yaml
# application.yml
my:
  database:
    master:
      url: jdbc:mysql://localhost:3306/master
      username: root
      password: 123456
      max-connections: 20
    slaves:
      - url: jdbc:mysql://localhost:3306/slave1
        username: root
        password: 123456
        max-connections: 10
      - url: jdbc:mysql://localhost:3306/slave2
        username: root
        password: 123456
        max-connections: 10
```

</details>

### 练习 3（挑战）：综合练习 - 完整的自定义 Starter

创建一个 `cache-spring-boot-starter`，支持多种缓存实现（内存缓存、Redis 缓存），通过配置切换。

<details>
<summary>点击查看答案</summary>

```java
// 1. 配置属性类
@ConfigurationProperties(prefix = "my.cache")
public class CacheProperties {
    
    private String type = "memory";  // 缓存类型：memory, redis
    private int maxSize = 1000;  // 最大缓存数量
    private int ttl = 3600;  // 过期时间（秒）
    private RedisConfig redis = new RedisConfig();  // Redis 配置
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public int getMaxSize() {
        return maxSize;
    }
    
    public void setMaxSize(int maxSize) {
        this.maxSize = maxSize;
    }
    
    public int getTtl() {
        return ttl;
    }
    
    public void setTtl(int ttl) {
        this.ttl = ttl;
    }
    
    public RedisConfig getRedis() {
        return redis;
    }
    
    public void setRedis(RedisConfig redis) {
        this.redis = redis;
    }
    
    public static class RedisConfig {
        private String host = "localhost";
        private int port = 6379;
        private String password;
        
        public String getHost() {
            return host;
        }
        
        public void setHost(String host) {
            this.host = host;
        }
        
        public int getPort() {
            return port;
        }
        
        public void setPort(int port) {
            this.port = port;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
}

// 2. 缓存接口
public interface CacheService {
    void put(String key, Object value);
    Object get(String key);
    void remove(String key);
}

// 3. 内存缓存实现
public class MemoryCacheService implements CacheService {
    
    private final Map<String, Object> cache = new ConcurrentHashMap<>();
    private final CacheProperties properties;
    
    public MemoryCacheService(CacheProperties properties) {
        this.properties = properties;
    }
    
    @Override
    public void put(String key, Object value) {
        if (cache.size() >= properties.getMaxSize()) {
            // 简单实现：移除第一个
            cache.remove(cache.keySet().iterator().next());
        }
        cache.put(key, value);
        System.out.println("Memory cache put: " + key);
    }
    
    @Override
    public Object get(String key) {
        System.out.println("Memory cache get: " + key);
        return cache.get(key);
    }
    
    @Override
    public void remove(String key) {
        cache.remove(key);
        System.out.println("Memory cache remove: " + key);
    }
}

// 4. Redis 缓存实现（模拟）
public class RedisCacheService implements CacheService {
    
    private final CacheProperties properties;
    
    public RedisCacheService(CacheProperties properties) {
        this.properties = properties;
        System.out.println("Redis connected: " + 
            properties.getRedis().getHost() + ":" + 
            properties.getRedis().getPort());
    }
    
    @Override
    public void put(String key, Object value) {
        System.out.println("Redis cache put: " + key + " (TTL: " + 
            properties.getTtl() + "s)");
    }
    
    @Override
    public Object get(String key) {
        System.out.println("Redis cache get: " + key);
        return null;  // 模拟实现
    }
    
    @Override
    public void remove(String key) {
        System.out.println("Redis cache remove: " + key);
    }
}

// 5. 自动配置类
@Configuration
@ConditionalOnClass(CacheService.class)
@EnableConfigurationProperties(CacheProperties.class)
public class CacheAutoConfiguration {
    
    // 内存缓存配置
    @Configuration
    @ConditionalOnProperty(
        prefix = "my.cache",
        name = "type",
        havingValue = "memory",
        matchIfMissing = true  // 默认使用内存缓存
    )
    static class MemoryCacheConfiguration {
        
        @Bean
        @ConditionalOnMissingBean
        public CacheService memoryCacheService(CacheProperties properties) {
            return new MemoryCacheService(properties);
        }
    }
    
    // Redis 缓存配置
    @Configuration
    @ConditionalOnProperty(
        prefix = "my.cache",
        name = "type",
        havingValue = "redis"
    )
    static class RedisCacheConfiguration {
        
        @Bean
        @ConditionalOnMissingBean
        public CacheService redisCacheService(CacheProperties properties) {
            return new RedisCacheService(properties);
        }
    }
}
```

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.CacheAutoConfiguration
```

```yaml
# application.yml - 使用内存缓存
my:
  cache:
    type: memory
    max-size: 500
    ttl: 1800

# application.yml - 使用 Redis 缓存
# my:
#   cache:
#     type: redis
#     ttl: 3600
#     redis:
#       host: 192.168.1.100
#       port: 6379
#       password: redis123
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot 启动流程**——也就是 SpringApplication.run() 完整流程、ApplicationListener 监听机制、ApplicationRunner/CommandLineRunner 执行时机、启动报告与 Banner 原理。你会学到 Spring Boot 从启动到运行完成的每一个步骤，理解事件监听机制，掌握如何在启动过程中插入自定义逻辑。
