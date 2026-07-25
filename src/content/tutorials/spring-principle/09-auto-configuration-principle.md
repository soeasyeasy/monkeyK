---
title: "第 9 章：Spring Boot 自动配置原理"
description: "深入理解 @EnableAutoConfiguration 机制、条件注解家族、自动配置加载流程"
---

# 第 9 章：Spring Boot 自动配置原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring Boot 是怎么做到"开箱即用"的？为什么引入一个依赖就能用？
- @EnableAutoConfiguration 注解到底做了什么？它是怎么找到并加载配置类的？
- @Conditional 系列注解是怎么控制配置是否生效的？
- 自动配置类那么多，Spring Boot 是怎么过滤和排序的？

这一章就是为了解答这些问题。我们会从自动配置的核心原理开始，深入理解 @EnableAutoConfiguration 的工作机制，剖析 spring.factories 和 AutoConfiguration.imports 的加载流程，掌握 @Conditional 条件注解家族的使用方式，最后了解自动配置的过滤与排序机制。

---

## 9.1 为什么需要自动配置？

### 痛点分析

在 Spring Boot 出现之前，使用 Spring 框架开发一个 Web 应用需要大量配置：

```xml
<!-- 配置视图解析器 -->
<bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
    <property name="prefix" value="/WEB-INF/views/"/>
    <property name="suffix" value=".jsp"/>
</bean>

<!-- 配置消息转换器 -->
<bean class="org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter">
    <property name="messageConverters">
        <list>
            <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter"/>
        </list>
    </property>
</bean>

<!-- 配置字符编码过滤器 -->
<filter>
    <filter-name>characterEncodingFilter</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
        <param-name>encoding</param-name>
        <param-value>UTF-8</param-value>
    </init-param>
</filter>
```

**问题**：
- 配置繁琐，每个项目都要重复写
- 容易出错，配置项太多记不住
- 难以维护，升级框架时要改很多地方

### 解决方案

Spring Boot 通过自动配置实现"约定优于配置"：

```java
// 只需要一个注解，自动帮你配置好所有东西
@SpringBootApplication  // 这个注解包含了 @EnableAutoConfiguration
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

```yaml
# application.yml - 只需要配置必要的参数
spring:
  mvc:
    charset: UTF-8  # 配置字符编码
```

打个比方：

> 自动配置就像"智能家居系统"：
> - 传统方式：你要手动打开每个电器（配置每个 Bean）
> - 自动配置：系统检测到你是"回家模式"，自动帮你开灯、开空调、开电视
> - @EnableAutoConfiguration = 打开智能模式
> - 条件注解 = 传感器（检测是否有空调、电视等设备）
> - spring.factories = 设备清单（告诉系统有哪些设备可以自动配置）

---

## 9.2 核心原理

### 9.2.1 @EnableAutoConfiguration 机制

#### 源码解析

```java
// @EnableAutoConfiguration 注解的定义
@Target(ElementType.TYPE)  // 只能标注在类上
@Retention(RetentionPolicy.RUNTIME)  // 运行时保留
@Documented
@Inherited
@AutoConfigurationPackage  // 元注解 1：自动配置包
@Import(AutoConfigurationImportSelector.class)  // 元注解 2：导入自动配置选择器
public @interface EnableAutoConfiguration {
    
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";
    
    // 是否启用自动配置
    boolean enabled() default true;
    
    // 排除指定的自动配置类
    Class<?>[] exclude() default {};
    
    // 排除指定的自动配置类名（字符串形式）
    String[] excludeName() default {};
}
```

#### 工作流程

```
1. @EnableAutoConfiguration 标注在启动类上
   ↓
2. @Import(AutoConfigurationImportSelector.class) 生效
   ↓
3. AutoConfigurationImportSelector 实现 ImportSelector 接口
   ↓
4. 调用 selectImports() 方法，返回要导入的自动配置类全限定名
   ↓
5. 从 META-INF/spring.factories 或 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 加载配置类
   ↓
6. 过滤掉不符合条件的配置类
   ↓
7. 排序后注册到 Spring 容器
```

#### 源码分析

```java
// AutoConfigurationImportSelector 的核心逻辑
public class AutoConfigurationImportSelector implements DeferredImportSelector {
    
    @Override
    public String[] selectImports(AnnotationMetadata metadata) {
        // 1. 获取自动配置类列表
        List<String> configurations = getCandidateConfigurations(
            getAnnotationMetadata(), 
            getImportSource()
        );
        
        // 2. 过滤掉重复的配置类
        configurations = removeDuplicates(configurations);
        
        // 3. 排除用户指定的配置类
        Set<String> exclusions = getExclusions(metadata, attributes);
        configurations.removeAll(exclusions);
        
        // 4. 过滤不符合条件的配置类（通过 @Conditional 注解）
        configurations = getConfigurationClassFilter()
            .filter(configurations);
        
        // 5. 排序
        configurations = getAutoConfigurationSorter()
            .getInPriorityOrder(configurations);
        
        return configurations.toArray(new String[0]);
    }
    
    // 获取候选配置类
    protected List<String> getCandidateConfigurations(
            AnnotationMetadata metadata, 
            AnnotationSource source) {
        
        // 从 META-INF/spring.factories 加载
        List<String> factories = SpringFactoriesLoader.loadFactoryNames(
            EnableAutoConfiguration.class, 
            getClassLoader()
        );
        
        // 从 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 加载（Spring Boot 2.7+）
        List<String> imports = AutoConfigurationImportsLoader.loadImports(
            getClassLoader()
        );
        
        // 合并两个来源的配置类
        List<String> all = new ArrayList<>();
        all.addAll(factories);
        all.addAll(imports);
        
        return all;
    }
}
```

### 9.2.2 spring.factories 加载机制

#### 文件格式

```properties
# META-INF/spring.factories

# 自动配置类列表
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration,\
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,\
  org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```

#### 加载源码

```java
// SpringFactoriesLoader 的核心逻辑
public abstract class SpringFactoriesLoader {
    
    // 缓存，避免重复加载
    private static final Map<ClassLoader, MultiValueMap<String, String>> cache = new ConcurrentReferenceHashMap<>();
    
    // 加载工厂类名
    public static List<String> loadFactoryNames(Class<?> factoryType, ClassLoader classLoader) {
        String factoryTypeName = factoryType.getName();
        
        // 从缓存中获取
        MultiValueMap<String, String> cacheKey = cache.get(classLoader);
        if (cacheKey == null) {
            // 加载所有 META-INF/spring.factories 文件
            cacheKey = loadSpringFactories(classLoader);
            cache.put(classLoader, cacheKey);
        }
        
        // 获取指定类型的所有实现类
        List<String> result = cacheKey.get(factoryTypeName);
        if (result == null) {
            return Collections.emptyList();
        }
        
        return new ArrayList<>(result);
    }
    
    // 加载 spring.factories 文件
    private static MultiValueMap<String, String> loadSpringFactories(ClassLoader classLoader) {
        MultiValueMap<String, String> result = new LinkedMultiValueMap<>();
        
        try {
            // 查找所有 META-INF/spring.factories 文件
            Enumeration<URL> urls = classLoader.getResources("META-INF/spring.factories");
            
            while (urls.hasMoreElements()) {
                URL url = urls.nextElement();
                
                // 读取文件内容
                Properties properties = PropertiesLoaderUtils.loadProperties(new UrlResource(url));
                
                // 解析键值对
                for (Map.Entry<Object, Object> entry : properties.entrySet()) {
                    String factoryTypeName = ((String) entry.getKey()).trim();
                    
                    // 支持多个值，用逗号分隔
                    String[] factoryImplementationNames = 
                        StringUtils.commaDelimitedListToStringArray((String) entry.getValue());
                    
                    for (String implementationName : factoryImplementationNames) {
                        result.add(factoryTypeName, implementationName.trim());
                    }
                }
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to load factories from location [" + 
                "META-INF/spring.factories" + "]", ex);
        }
        
        return result;
    }
}
```

### 9.2.3 AutoConfiguration.imports 加载机制（Spring Boot 2.7+）

#### 文件格式

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

# 每行一个自动配置类的全限定名
org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```

#### 为什么引入新格式？

| 特性 | spring.factories | AutoConfiguration.imports |
| --- | --- | --- |
| 格式 | Properties 格式，键值对 | 纯文本，每行一个类名 |
| 可读性 | 较差，需要理解键的含义 | 更好，一目了然 |
| 维护性 | 多个模块的配置混在一起 | 每个模块独立维护 |
| 性能 | 需要解析 Properties | 直接读取，更快 |
| 兼容性 | Spring Boot 2.7 之前 | Spring Boot 2.7+ |

#### 加载源码

```java
// AutoConfigurationImportsLoader 的核心逻辑
public final class AutoConfigurationImportsLoader {
    
    private static final String AUTO_CONFIGURATION_IMPORTS_PATH = 
        "META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports";
    
    public static List<String> loadImports(ClassLoader classLoader) {
        List<String> imports = new ArrayList<>();
        
        try {
            // 查找所有 AutoConfiguration.imports 文件
            Enumeration<URL> urls = classLoader.getResources(AUTO_CONFIGURATION_IMPORTS_PATH);
            
            while (urls.hasMoreElements()) {
                URL url = urls.nextElement();
                
                // 读取文件内容
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(url.openStream(), StandardCharsets.UTF_8))) {
                    
                    String line;
                    while ((line = reader.readLine()) != null) {
                        // 去除注释和空行
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#")) {
                            imports.add(line);
                        }
                    }
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to load AutoConfiguration.imports", ex);
        }
        
        return imports;
    }
}
```

### 9.2.4 @Conditional 条件注解家族

#### 核心条件注解

| 注解 | 作用 | 使用场景 |
| --- | --- | --- |
| @ConditionalOnClass | 类路径中存在指定类时生效 | 引入了某个依赖时 |
| @ConditionalOnMissingClass | 类路径中不存在指定类时生效 | 没有引入某个依赖时 |
| @ConditionalOnBean | 容器中存在指定 Bean 时生效 | 依赖某个 Bean 时 |
| @ConditionalOnMissingBean | 容器中不存在指定 Bean 时生效 | 提供默认实现时 |
| @ConditionalOnProperty | 配置属性满足条件时生效 | 根据配置开关控制 |
| @ConditionalOnWebApplication | 是 Web 应用时生效 | Web 相关配置 |
| @ConditionalOnNotWebApplication | 不是 Web 应用时生效 | 非 Web 相关配置 |

#### 源码解析

```java
// @ConditionalOnClass 的定义
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnClassCondition.class)  // 指定条件判断类
public @interface ConditionalOnClass {
    
    // 指定类（Class 数组）
    Class<?>[] value() default {};
    
    // 指定类名（字符串数组，避免类加载问题）
    String[] name() default {};
}

// OnClassCondition 的实现
class OnClassCondition extends FilteringSpringBootCondition {
    
    @Override
    protected SourceSelector getMatchingClasses(
            ConditionEvaluationReport report,
            ConditionMessage.Builder messageBuilder,
            String[] onClasses,
            String[] onMissingClasses) {
        
        return (metadata, classLoader) -> {
            // 检查类路径中是否存在指定的类
            for (String className : onClasses) {
                if (!isPresent(className, classLoader)) {
                    // 类不存在，条件不满足
                    return ConditionOutcome.noMatch(
                        ConditionMessage.forCondition("OnClassCondition")
                            .because(className + " is not present")
                    );
                }
            }
            
            // 所有类都存在，条件满足
            return ConditionOutcome.match();
        };
    }
    
    private boolean isPresent(String className, ClassLoader classLoader) {
        try {
            Class.forName(className, false, classLoader);
            return true;
        } catch (ClassNotFoundException ex) {
            return false;
        }
    }
}
```

#### 使用示例

```java
// 示例 1：只有当类路径中存在 DataSource 类时才生效
@Configuration
@ConditionalOnClass(DataSource.class)  // 引入了数据库依赖
public class DataSourceAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean  // 容器中没有 DataSource 时才创建
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}

// 示例 2：根据配置属性控制
@Configuration
@ConditionalOnProperty(
    prefix = "my.feature",  // 配置前缀
    name = "enabled",       // 配置项名称
    havingValue = "true",   // 只有值为 true 时才生效
    matchIfMissing = false  // 没有配置时不生效
)
public class MyFeatureAutoConfiguration {
    
    @Bean
    public MyFeature myFeature() {
        return new MyFeature();
    }
}

// 示例 3：Web 应用才生效
@Configuration
@ConditionalOnWebApplication  // 是 Web 应用时
public class WebMvcAutoConfiguration {
    
    @Bean
    public ViewResolver viewResolver() {
        return new InternalResourceViewResolver();
    }
}
```

### 9.2.5 自动配置过滤与排序

#### 过滤机制

```java
// 自动配置过滤的核心逻辑
public class AutoConfigurationImportFilter {
    
    public String[] filter(String[] autoConfigurationClasses, 
                           AutoConfigurationMetadata autoConfigurationMetadata) {
        
        List<String> filtered = new ArrayList<>();
        
        for (String className : autoConfigurationClasses) {
            // 1. 检查 @Conditional 条件
            if (matches(className, autoConfigurationMetadata)) {
                filtered.add(className);
            } else {
                // 记录过滤原因
                report.recordConditionEvaluation(
                    className, 
                    ConditionEvaluationReport.noMatch("条件不满足")
                );
            }
        }
        
        return filtered.toArray(new String[0]);
    }
    
    private boolean matches(String className, AutoConfigurationMetadata metadata) {
        // 获取配置类上的所有 @Conditional 注解
        AnnotationMetadata annotationMetadata = getAnnotationMetadata(className);
        
        // 检查每个条件
        for (AnnotationAttributes attributes : getConditionalAttributes(annotationMetadata)) {
            Condition condition = getCondition(attributes);
            
            if (!condition.matches(getConditionContext(), annotationMetadata)) {
                return false;  // 任何一个条件不满足就过滤掉
            }
        }
        
        return true;
    }
}
```

#### 排序机制

```java
// 自动配置排序的核心逻辑
public class AutoConfigurationSorter {
    
    public List<String> getInPriorityOrder(Collection<String> classNames) {
        // 1. 收集排序信息
        Map<String, AutoConfigurationClass> classes = new LinkedHashMap<>();
        
        for (String className : classNames) {
            AutoConfigurationClass autoConfig = new AutoConfigurationClass(className);
            
            // 读取 @AutoConfigureOrder 注解
            AutoConfigureOrder order = getAnnotation(className, AutoConfigureOrder.class);
            if (order != null) {
                autoConfig.setOrder(order.value());
            }
            
            // 读取 @AutoConfigureBefore 注解
            AutoConfigureBefore before = getAnnotation(className, AutoConfigureBefore.class);
            if (before != null) {
                autoConfig.setBefore(Arrays.asList(before.value()));
            }
            
            // 读取 @AutoConfigureAfter 注解
            AutoConfigureAfter after = getAnnotation(className, AutoConfigureAfter.class);
            if (after != null) {
                autoConfig.setAfter(Arrays.asList(after.value()));
            }
            
            classes.put(className, autoConfig);
        }
        
        // 2. 拓扑排序
        List<String> sorted = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        
        for (String className : classNames) {
            visit(className, classes, sorted, visited);
        }
        
        return sorted;
    }
    
    private void visit(String className, 
                      Map<String, AutoConfigurationClass> classes,
                      List<String> sorted,
                      Set<String> visited) {
        
        if (visited.contains(className)) {
            return;  // 避免循环依赖
        }
        
        visited.add(className);
        AutoConfigurationClass autoConfig = classes.get(className);
        
        // 先处理 @AutoConfigureAfter 指定的类
        for (String afterClass : autoConfig.getAfter()) {
            visit(afterClass, classes, sorted, visited);
        }
        
        // 再添加当前类
        sorted.add(className);
    }
}
```

---

## 9.3 基础用法

### 9.3.1 创建自定义自动配置类

```java
// 自定义自动配置类
@Configuration  // 标注为配置类
@ConditionalOnClass(MyService.class)  // 类路径中存在 MyService 类时才生效
@ConditionalOnProperty(  // 配置属性满足条件时才生效
    prefix = "my.service",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true  // 没有配置时也生效
)
@AutoConfigureAfter(WebMvcAutoConfiguration.class)  // 在 WebMvc 自动配置之后
public class MyServiceAutoConfiguration {
    
    // 创建 MyService Bean
    @Bean
    @ConditionalOnMissingBean  // 容器中没有 MyService 时才创建
    public MyService myService() {
        return new MyService();
    }
    
    // 创建 MyServiceProperties Bean
    @Bean
    @ConditionalOnMissingBean
    @ConfigurationProperties(prefix = "my.service")  // 绑定配置属性
    public MyServiceProperties myServiceProperties() {
        return new MyServiceProperties();
    }
}

// 配置属性类
public class MyServiceProperties {
    
    private boolean enabled = true;  // 是否启用
    private String name = "default";  // 服务名称
    private int timeout = 3000;  // 超时时间（毫秒）
    
    // getter 和 setter 方法
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public int getTimeout() {
        return timeout;
    }
    
    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }
}

// 服务类
public class MyService {
    
    public void doSomething() {
        System.out.println("MyService is working!");
    }
}
```

### 9.3.2 注册自动配置类

#### 方式 1：使用 spring.factories（Spring Boot 2.7 之前）

```properties
# META-INF/spring.factories

# 注册自动配置类
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.MyServiceAutoConfiguration
```

#### 方式 2：使用 AutoConfiguration.imports（Spring Boot 2.7+）

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

# 每行一个自动配置类的全限定名
com.example.MyServiceAutoConfiguration
```

### 9.3.3 使用自动配置

```java
// 启动类
@SpringBootApplication
public class MyApplication {
    
    public static void main(String[] args) {
        // 启动应用
        SpringApplication.run(MyApplication.class, args);
    }
}

// 使用自动配置的 Bean
@RestController
public class MyController {
    
    @Autowired
    private MyService myService;  // 自动注入
    
    @GetMapping("/test")
    public String test() {
        myService.doSomething();
        return "Success!";
    }
}
```

```yaml
# application.yml
my:
  service:
    enabled: true  # 启用服务
    name: my-custom-service  # 服务名称
    timeout: 5000  # 超时时间
```

---

## 9.4 对比表格

### 自动配置加载方式对比

| 特性 | spring.factories | AutoConfiguration.imports |
| --- | --- | --- |
| 引入版本 | Spring Boot 1.x | Spring Boot 2.7+ |
| 文件格式 | Properties 格式 | 纯文本格式 |
| 键名 | org.springframework.boot.autoconfigure.EnableAutoConfiguration | 无键名 |
| 值格式 | 逗号分隔的类名列表 | 每行一个类名 |
| 可读性 | 较差 | 更好 |
| 维护性 | 多个模块混在一起 | 每个模块独立 |
| 性能 | 需要解析 Properties | 直接读取，更快 |
| 兼容性 | 所有版本 | 2.7+ 版本 |
| 推荐度 | 不推荐（已废弃） | 推荐使用 |

### 条件注解对比

| 注解 | 判断条件 | 典型使用场景 |
| --- | --- | --- |
| @ConditionalOnClass | 类路径中存在指定类 | 引入了某个依赖 |
| @ConditionalOnMissingClass | 类路径中不存在指定类 | 没有引入某个依赖 |
| @ConditionalOnBean | 容器中存在指定 Bean | 依赖某个 Bean |
| @ConditionalOnMissingBean | 容器中不存在指定 Bean | 提供默认实现 |
| @ConditionalOnProperty | 配置属性满足条件 | 根据配置开关控制 |
| @ConditionalOnWebApplication | 是 Web 应用 | Web 相关配置 |
| @ConditionalOnNotWebApplication | 不是 Web 应用 | 非 Web 相关配置 |
| @ConditionalOnExpression | SpEL 表达式为 true | 复杂条件判断 |

---

## 9.5 新手常见误区

### 误区 1：自动配置类越多越好

**错！** 自动配置类太多会导致：
- 启动速度变慢（需要加载和过滤更多配置类）
- 内存占用增加
- 难以排查问题

正确做法：
- 只引入真正需要的自动配置
- 使用条件注解精确控制生效条件
- 定期清理不再使用的自动配置

### 误区 2：@ConditionalOnBean 和 @ConditionalOnMissingBean 可以随意使用

**错！** 这两个注解的使用时机很重要：
- @ConditionalOnBean：在 Bean 已经注册后才判断，适合用在配置类的 @Bean 方法上
- @ConditionalOnMissingBean：在 Bean 还没注册时判断，适合用在自动配置类上

错误示例：

```java
// ❌ 错误：在类级别使用 @ConditionalOnBean
@Configuration
@ConditionalOnBean(DataSource.class)  // 此时 DataSource 可能还没注册
public class MyAutoConfiguration {
    // ...
}
```

正确示例：

```java
// ✅ 正确：在 @Bean 方法上使用 @ConditionalOnMissingBean
@Configuration
public class MyAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean  // 此时判断容器中是否已有 DataSource
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}
```

### 误区 3：自动配置类不需要排序

**错！** 自动配置类的执行顺序很重要：
- 某些配置依赖其他配置先执行
- 排序不当会导致 Bean 覆盖或冲突

正确做法：
- 使用 @AutoConfigureBefore 指定在哪些配置之前
- 使用 @AutoConfigureAfter 指定在哪些配置之后
- 使用 @AutoConfigureOrder 指定优先级

```java
// ✅ 正确：指定排序
@Configuration
@AutoConfigureAfter(DataSourceAutoConfiguration.class)  // 在数据源配置之后
public class MyRepositoryAutoConfiguration {
    // ...
}
```

### 误区 4：spring.factories 和 AutoConfiguration.imports 可以同时使用

**不推荐！** 虽然可以同时使用，但会导致：
- 配置分散在两个地方，难以维护
- 可能出现重复加载

正确做法：
- Spring Boot 2.7+ 项目统一使用 AutoConfiguration.imports
- 老项目迁移时逐步切换到新格式

### 误区 5：@Conditional 注解可以叠加使用

**部分正确！** @Conditional 注解可以叠加，但要注意：
- 多个 @Conditional 注解是"与"关系（全部满足才生效）
- 不能在同一位置使用多个相同的 @Conditional 注解

```java
// ✅ 正确：多个不同的 @Conditional 注解
@Configuration
@ConditionalOnClass(DataSource.class)
@ConditionalOnProperty(prefix = "spring.datasource", name = "enabled", havingValue = "true")
public class DataSourceAutoConfiguration {
    // 类路径中有 DataSource 且配置启用时才生效
}

// ❌ 错误：多个相同的 @Conditional 注解
@Configuration
@ConditionalOnClass(DataSource.class)
@ConditionalOnClass(RedisTemplate.class)  // 编译错误，不能重复使用
public class MyAutoConfiguration {
    // ...
}
```

---

## 9.6 动手练习

### 练习 1：基础练习 - 创建简单的自动配置

创建一个自动配置类，当类路径中存在 `CacheService` 类时，自动创建一个 `CacheManager` Bean。

<details>
<summary>点击查看答案</summary>

```java
// 1. 创建 CacheService 类
public class CacheService {
    
    public void put(String key, Object value) {
        System.out.println("Putting " + key + " = " + value);
    }
    
    public Object get(String key) {
        System.out.println("Getting " + key);
        return "value";
    }
}

// 2. 创建 CacheManager 类
public class CacheManager {
    
    private CacheService cacheService;
    
    public CacheManager(CacheService cacheService) {
        this.cacheService = cacheService;
    }
    
    public void manage() {
        cacheService.put("key", "value");
        cacheService.get("key");
    }
}

// 3. 创建自动配置类
@Configuration
@ConditionalOnClass(CacheService.class)  // 类路径中有 CacheService 时才生效
public class CacheAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean  // 容器中没有 CacheManager 时才创建
    public CacheManager cacheManager() {
        return new CacheManager(new CacheService());
    }
}
```

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.CacheAutoConfiguration
```

</details>

### 练习 2：进阶练习 - 使用配置属性

创建一个自动配置类，支持通过配置文件自定义参数，并根据参数决定是否创建 Bean。

<details>
<summary>点击查看答案</summary>

```java
// 1. 创建配置属性类
public class NotificationProperties {
    
    private boolean enabled = true;  // 是否启用通知
    private String type = "email";  // 通知类型：email, sms, wechat
    private int retryCount = 3;  // 重试次数
    
    // getter 和 setter
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public int getRetryCount() {
        return retryCount;
    }
    
    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }
}

// 2. 创建通知服务接口
public interface NotificationService {
    void send(String message);
}

// 3. 创建邮件通知实现
public class EmailNotificationService implements NotificationService {
    
    @Override
    public void send(String message) {
        System.out.println("Sending email: " + message);
    }
}

// 4. 创建短信通知实现
public class SmsNotificationService implements NotificationService {
    
    @Override
    public void send(String message) {
        System.out.println("Sending SMS: " + message);
    }
}

// 5. 创建自动配置类
@Configuration
@ConditionalOnProperty(
    prefix = "notification",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true  // 没有配置时也生效
)
public class NotificationAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    @ConfigurationProperties(prefix = "notification")
    public NotificationProperties notificationProperties() {
        return new NotificationProperties();
    }
    
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(
        prefix = "notification",
        name = "type",
        havingValue = "email",
        matchIfMissing = true  // 默认使用 email
    )
    public NotificationService emailNotificationService() {
        return new EmailNotificationService();
    }
    
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(
        prefix = "notification",
        name = "type",
        havingValue = "sms"
    )
    public NotificationService smsNotificationService() {
        return new SmsNotificationService();
    }
}
```

```yaml
# application.yml
notification:
  enabled: true  # 启用通知
  type: sms  # 使用短信通知
  retry-count: 5  # 重试 5 次
```

</details>

### 练习 3（挑战）：综合练习 - 自定义 Starter

创建一个完整的自定义 Starter，包含自动配置、配置属性、条件判断和排序。

<details>
<summary>点击查看答案</summary>

```java
// 1. 创建配置属性类
public class MyStarterProperties {
    
    private boolean enabled = true;
    private String prefix = "[MyStarter]";
    private String suffix = "";
    private int maxRetries = 3;
    
    // getter 和 setter
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
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
    
    public int getMaxRetries() {
        return maxRetries;
    }
    
    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }
}

// 2. 创建核心服务类
public class MyStarterService {
    
    private MyStarterProperties properties;
    
    public MyStarterService(MyStarterProperties properties) {
        this.properties = properties;
    }
    
    public String process(String input) {
        String result = properties.getPrefix() + input + properties.getSuffix();
        System.out.println("Processed: " + result);
        return result;
    }
    
    public void executeWithRetry(Runnable task) {
        int retries = 0;
        while (retries < properties.getMaxRetries()) {
            try {
                task.run();
                return;
            } catch (Exception e) {
                retries++;
                System.out.println("Retry " + retries + "/" + properties.getMaxRetries());
                if (retries >= properties.getMaxRetries()) {
                    throw new RuntimeException("Max retries exceeded", e);
                }
            }
        }
    }
}

// 3. 创建自动配置类
@Configuration
@ConditionalOnClass(MyStarterService.class)  // 类路径中有 MyStarterService 时才生效
@ConditionalOnProperty(
    prefix = "my.starter",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = true  // 没有配置时也生效
)
@AutoConfigureOrder(Ordered.LOWEST_PRECEDENCE)  // 最低优先级
public class MyStarterAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    @ConfigurationProperties(prefix = "my.starter")
    public MyStarterProperties myStarterProperties() {
        return new MyStarterProperties();
    }
    
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnBean(MyStarterProperties.class)  // 依赖 Properties Bean
    public MyStarterService myStarterService(MyStarterProperties properties) {
        return new MyStarterService(properties);
    }
}
```

```properties
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.MyStarterAutoConfiguration
```

```yaml
# application.yml
my:
  starter:
    enabled: true
    prefix: "[Custom]"
    suffix: "[END]"
    max-retries: 5
```

```java
// 4. 使用 Starter
@SpringBootApplication
public class MyApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

@RestController
public class MyController {
    
    @Autowired
    private MyStarterService myStarterService;
    
    @GetMapping("/process")
    public String process(@RequestParam String input) {
        return myStarterService.process(input);
    }
    
    @GetMapping("/execute")
    public String execute() {
        myStarterService.executeWithRetry(() -> {
            System.out.println("Executing task...");
            // 模拟可能失败的任务
            if (Math.random() > 0.5) {
                throw new RuntimeException("Task failed");
            }
        });
        return "Task executed successfully";
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot Starter 原理**——也就是 Starter 的组成结构、自定义 Starter 开发实战、spring-boot-autoconfigure 模块解析、@ConfigurationProperties 属性绑定原理。你会学到如何创建一个完整的 Starter，理解 Spring Boot 内置 Starter 的工作原理，掌握配置属性绑定的底层机制。
