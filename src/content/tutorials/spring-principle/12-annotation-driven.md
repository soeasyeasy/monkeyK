---
title: "第 12 章：Spring 注解驱动原理"
description: "深入理解注解元数据解析、RegisteredBean 注册流程、注解如何触发 Bean 创建、元注解与组合注解、@ComponentScan 扫描原理"
---

# 第 12 章：Spring 注解驱动原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 是怎么"看懂"注解的？@Component 标注在类上，Spring 怎么就知道要创建 Bean？
- 注解本身只是标记，Spring 底层是怎么解析注解元数据的？
- @SpringBootApplication 为什么能同时具备多个注解的能力？元注解是怎么工作的？
- @ComponentScan 是怎么扫描到所有带 @Component 的类的？
- 一个类从被扫描到最终成为 Bean，中间经历了哪些步骤？

这一章就是为了解答这些问题。我们会从注解的本质开始，深入理解注解元数据的解析过程，剖析 RegisteredBean 的注册流程，掌握注解如何触发 Bean 创建，理解元注解与组合注解的底层机制，最后全面解析 @ComponentScan 的扫描原理。

---

## 12.1 为什么需要注解驱动？

### 痛点分析

在 Spring 早期，配置 Bean 主要靠 XML：

```xml
<!-- 传统 XML 配置方式 -->
<beans>
    <!-- 配置一个 Bean -->
    <bean id="userService" class="com.example.UserService">
        <property name="userDao" ref="userDao"/>
    </bean>
    
    <bean id="userDao" class="com.example.UserDao">
        <property name="dataSource" ref="dataSource"/>
    </bean>
    
    <!-- 每个 Bean 都要在 XML 里声明 -->
    <bean id="orderService" class="com.example.OrderService">
        <property name="orderDao" ref="orderDao"/>
    </bean>
    
    <!-- 项目大了之后，XML 文件会变得非常庞大 -->
    <bean id="orderDao" class="com.example.OrderDao"/>
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource"/>
    <!-- ... 几百个 Bean -->
</beans>
```

**问题**：
- XML 配置繁琐，维护成本高
- Bean 定义和代码分散在两个地方
- 没有类型安全，写错了运行时才发现
- 重构困难，改了类名还要改 XML

### 解决方案

Spring 2.5 引入注解驱动，Spring 3.0 后全面拥抱注解：

```java
// 注解驱动方式 - 配置和代码在一起
@Component  // 标注为 Bean
public class UserService {
    
    @Autowired  // 自动注入依赖
    private UserDao userDao;
}

@Component
public class UserDao {
    
    @Autowired
    private DataSource dataSource;
}
```

打个比方：

> 注解驱动就像"身份证"：
> - XML 方式：你要去派出所登记（XML 文件），派出所才知道你是谁
> - 注解方式：你身上带着身份证（注解），警察一扫就知道你的信息
> - 元注解 = 身份证上的各种信息（姓名、性别、民族...）
> - @ComponentScan = 警察挨家挨户扫描，找到所有带身份证的人

---

## 12.2 核心原理

### 12.2.1 注解的本质

#### 注解是什么？

```java
// 注解本质上是一个接口，继承自 java.lang.annotation.Annotation
public @interface Component {
    String value() default "";  // 注解的属性
}

// 编译后生成的字节码：
// public interface Component extends Annotation {
//     String value() default "";
// }

// 使用注解：
@Component("userService")  // 给注解的属性赋值
public class UserService {}

// 等价于：
@Component  // 使用默认值
public class UserService {}
```

#### 注解只是标记

```java
// 注解本身只是一个标记，没有任何行为
@Component
public class UserService {}

// 上面的代码等价于：
// "UserService 类上贴了一个 @Component 标签"
// 仅此而已！Spring 需要自己去"读"这个标签并做相应处理
```

### 12.2.2 注解元数据解析

#### AnnotationMetadata

```java
// Spring 用 AnnotationMetadata 来读取注解信息
public interface AnnotationMetadata extends ClassMetadata {
    
    // 获取指定注解的属性
    Map<String, Object> getAnnotationAttributes(String annotationName);
    
    // 获取指定注解的属性（是否嵌套解析）
    Map<String, Object> getAnnotationAttributes(String annotationName, boolean classValuesAsString);
    
    // 获取所有注解
    Set<String> getAnnotationTypes();
    
    // 是否有某个注解
    boolean hasAnnotation(String annotationName);
    
    // 获取元注解（标注在注解上的注解）
    Set<String> getMetaAnnotationTypes(String annotationName);
}

// 实现类：StandardAnnotationMetadata（基于反射）
public class StandardAnnotationMetadata extends StandardClassMetadata 
        implements AnnotationMetadata {
    
    @Override
    public Map<String, Object> getAnnotationAttributes(String annotationName) {
        // 通过 Java 反射获取注解
        Annotation annotation = getIntrospectedClass().getAnnotation(
            (Class<? extends Annotation>) ClassUtils.forName(annotationName));
        
        if (annotation == null) {
            return null;
        }
        
        // 提取注解属性
        return extractAttributes(annotation);
    }
    
    // ASM 实现：SimpleAnnotationMetadata（不加载类，性能更好）
    // Spring Boot 默认使用 ASM 方式
}
```

#### ASM 方式读取注解（不加载类）

```java
// 使用 ASM 字节码框架读取注解信息
// 优点：不需要加载类到 JVM，性能更好
public class SimpleAnnotationMetadataReadingVisitor extends ClassVisitor {
    
    @Override
    public AnnotationVisitor visitAnnotation(String descriptor, boolean visible) {
        // 读取类上的注解
        String annotationClassName = Type.getType(descriptor).getClassName();
        
        // 记录注解信息
        this.annotationNames.add(annotationClassName);
        
        return new AnnotationMetadataReadingVisitor(...);
    }
}

// ASM vs 反射 对比：
// | 方式 | 优点 | 缺点 |
// | --- | --- | --- |
// | 反射 | 简单直接 | 需要加载类，占用内存 |
// | ASM | 不需要加载类，性能好 | 实现复杂 |
```

### 12.2.3 RegisteredBean 注册流程

#### 从注解到 BeanDefinition

```
注解 -> BeanDefinition -> Bean 的完整流程：

1. @ComponentScan 扫描类
   ↓
2. 读取类上的注解（AnnotationMetadata）
   ↓
3. 判断是否有 @Component 或其派生注解
   ↓
4. 创建 BeanDefinition
   ├── beanClass = 类的全限定名
   ├── scope = singleton（默认）
   ├── lazyInit = false（默认）
   └── autowireMode = AUTOWIRE_BY_TYPE
   ↓
5. 注册 BeanDefinition 到 BeanDefinitionRegistry
   ↓
6. BeanDefinition 被 BeanFactory 使用
   ↓
7. 通过 BeanDefinition 创建 Bean 实例
```

#### 源码解析

```java
// ClassPathBeanDefinitionScanner - 扫描 @Component 注解
public class ClassPathBeanDefinitionScanner extends ClassPathScanningCandidateComponentProvider {
    
    // 扫描指定包路径
    public Set<BeanDefinitionHolder> doScan(String... basePackages) {
        Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet<>();
        
        for (String basePackage : basePackages) {
            // 1. 找到所有候选组件（带 @Component 注解的类）
            Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
            
            for (BeanDefinition candidate : candidates) {
                // 2. 解析 scope 属性
                ScopeMetadata scopeMetadata = 
                    this.scopeMetadataResolver.resolveScopeMetadata(candidate);
                candidate.setScope(scopeMetadata.getScopeName());
                
                // 3. 生成 Bean 名称
                String beanName = this.beanNameGenerator.generateBeanName(
                    candidate, this.registry);
                
                // 4. 处理通用注解（@Lazy、@Autowired 等）
                if (candidate instanceof AbstractBeanDefinition) {
                    postProcessBeanDefinition(
                        (AbstractBeanDefinition) candidate, beanName);
                }
                
                // 5. 处理 @Component 派生注解（@Service、@Repository 等）
                if (candidate instanceof AnnotatedBeanDefinition) {
                    AnnotationConfigUtils.processCommonDefinitionAnnotations(
                        (AnnotatedBeanDefinition) candidate);
                }
                
                // 6. 注册 BeanDefinition
                if (checkCandidate(beanName, candidate)) {
                    BeanDefinitionHolder definitionHolder = 
                        new BeanDefinitionHolder(candidate, beanName);
                    
                    // 7. 应用 scope 代理（如果需要）
                    definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(
                        this.scopeMetadataResolver, definitionHolder, this.registry);
                    
                    beanDefinitions.add(definitionHolder);
                    
                    // 8. 注册到 BeanDefinitionRegistry
                    registerBeanDefinition(definitionHolder, this.registry);
                }
            }
        }
        
        return beanDefinitions;
    }
}

// AnnotationConfigUtils.processCommonDefinitionAnnotations 源码
public static void processCommonDefinitionAnnotations(AnnotatedBeanDefinition abd) {
    // 处理 @Lazy 注解
    if (abd.getMetadata().hasAnnotation(Lazy.class.getName())) {
        abd.setLazyInit(true);
    } else if (abd.getFactoryMethodMetadata() != null &&
            abd.getFactoryMethodMetadata().hasAnnotation(Lazy.class.getName())) {
        abd.setLazyInit(true);
    }
    
    // 处理 @Primary 注解
    if (abd.getMetadata().hasAnnotation(Primary.class.getName())) {
        abd.setPrimary(true);
    }
    
    // 处理 @DependsOn 注解
    if (abd.getMetadata().hasAnnotation(DependsOn.class.getName())) {
        Map<String, Object> attributes = abd.getMetadata()
            .getAnnotationAttributes(DependsOn.class.getName());
        abd.setDependsOn((String[]) attributes.get("value"));
    }
    
    // 处理 @Role 注解
    // 处理 @Description 注解
    // ...
}
```

### 12.2.4 注解如何触发 Bean 创建

#### 完整链路

```
@Component 注解触发 Bean 创建的完整链路：

1. @ComponentScan 扫描
   ClassPathBeanDefinitionScanner.doScan()
   ↓
2. 读取注解元数据
   SimpleAnnotationMetadataReadingVisitor 读取类上的注解
   ↓
3. 判断是否为候选组件
   isCandidateComponent() -> 检查是否有 @Component 注解
   ↓
4. 创建 BeanDefinition
   ScannedGenericBeanDefinition 包装类的元数据
   ↓
5. 注册到容器
   BeanDefinitionRegistry.registerBeanDefinition()
   ↓
6. 容器刷新时创建 Bean
   AbstractBeanFactory.getBean()
   ↓
7. 实例化 Bean
   AbstractAutowireCapableBeanFactory.createBeanInstance()
   ↓
8. 属性注入
   populateBean() -> 处理 @Autowired
   ↓
9. 初始化
   initializeBean() -> @PostConstruct、InitializingBean
   ↓
10. Bean 就绪，可以使用
```

#### 关键源码

```java
// 判断是否为候选组件
public boolean isCandidateComponent(AnnotatedBeanDefinition beanDefinition) {
    AnnotationMetadata metadata = beanDefinition.getMetadata();
    
    // 1. 必须是独立类（不能是内部类，除非是 static）
    boolean isIndependent = !metadata.hasEnclosingClass() ||
        metadata.hasAnnotatedMethods(Lookup.class.getName());
    
    if (isIndependent) {
        // 2. 不能是抽象类（除非有 @Lookup 方法）
        boolean isConcrete = !metadata.isAbstract() &&
            !metadata.isInterface();
        
        // 3. 不能有 @Indexed 注解（除非被 @Component 派生）
        boolean isComponent = metadata.hasAnnotation(Component.class.getName()) ||
            hasMetaAnnotation(metadata, Component.class.getName());
        
        return isConcrete && isComponent;
    }
    
    return false;
}

// 检查元注解
private boolean hasMetaAnnotation(AnnotationMetadata metadata, String metaAnnotationName) {
    // 获取所有注解
    for (String annotationName : metadata.getAnnotationTypes()) {
        // 检查该注解上是否有 @Component
        Set<String> metaAnnotations = metadata.getMetaAnnotationTypes(annotationName);
        if (metaAnnotations.contains(metaAnnotationName)) {
            return true;
        }
    }
    return false;
}
```

### 12.2.5 元注解与组合注解

#### 元注解是什么？

```java
// 元注解 = 标注在注解上的注解
// 例如：@Service 上标注了 @Component

// @Service 的定义
@Target(ElementType.TYPE)  // 元注解 1：只能标注在类上
@Retention(RetentionPolicy.RUNTIME)  // 元注解 2：运行时保留
@Documented  // 元注解 3：生成 JavaDoc 时包含
@Component  // 元注解 4：这是一个 @Component 的派生注解！
public @interface Service {
    String value() default "";
}

// 所以 @Service 标注的类，Spring 会认为它也是 @Component
```

#### Spring 的元注解体系

```java
// @Component 的派生注解（都带有 @Component 元注解）
@Component
public @interface Service {}  // 业务层

@Component
public @interface Repository {}  // 数据访问层

@Component
public @interface Controller {}  // 控制层

@Component
public @interface Configuration {}  // 配置类（额外能力：支持 @Bean）

// 组合注解 = 多个注解组合成一个
// 例如：@SpringBootApplication = @Configuration + @ComponentScan + @EnableAutoConfiguration

@Configuration  // 组合注解 1
@ComponentScan  // 组合注解 2
@EnableAutoConfiguration  // 组合注解 3
public @interface SpringBootApplication {
    // ...
}

// @EnableAutoConfiguration 本身也是组合注解
@AutoConfigurationPackage  // 组合注解 3.1
@Import(AutoConfigurationImportSelector.class)  // 组合注解 3.2
public @interface EnableAutoConfiguration {
    // ...
}
```

#### 元注解解析源码

```java
// MergedAnnotations - Spring 5.2+ 的注解解析 API
public interface MergedAnnotations extends Iterable<MergedAnnotation<?>> {
    
    // 获取指定注解
    <A extends Annotation> MergedAnnotation<A> get(Class<A> annotationType);
    
    // 是否包含指定注解（包括元注解）
    boolean isPresent(Class<? extends Annotation> annotationType);
    
    // 获取所有注解（包括元注解）
    Stream<MergedAnnotation<?>> stream();
}

// 使用示例
MergedAnnotations annotations = MergedAnnotations.from(UserService.class);

// 获取 @Service 注解
MergedAnnotation<Service> serviceAnnotation = annotations.get(Service.class);
if (serviceAnnotation.isPresent()) {
    String value = serviceAnnotation.getString("value");
}

// 检查是否有 @Component（包括通过元注解继承的）
boolean hasComponent = annotations.isPresent(Component.class);
// 即使类上只有 @Service，这里也返回 true，因为 @Service 上有 @Component
```

### 12.2.6 @ComponentScan 扫描原理

#### 扫描流程

```
@ComponentScan 扫描流程：

1. 解析 @ComponentScan 注解
   ├── basePackages = 扫描的包路径
   ├── basePackageClasses = 扫描的类所在包
   └── 默认值 = 配置类所在包
   ↓
2. 创建 ClassPathBeanDefinitionScanner
   ↓
3. 扫描指定包路径下的所有 .class 文件
   ├── 递归扫描子包
   ├── 过滤非 .class 文件
   └── 处理 jar 包中的类
   ↓
4. 读取每个类的注解元数据
   ├── 使用 ASM 读取字节码（不加载类）
   └── 提取注解信息
   ↓
5. 判断是否为候选组件
   ├── 是否有 @Component 或其派生注解
   ├── 是否是具体类（非抽象、非接口）
   └── 是否满足过滤条件
   ↓
6. 创建 BeanDefinition 并注册
```

#### 源码解析

```java
// ClassPathScanningCandidateComponentProvider - 扫描候选组件
public class ClassPathScanningCandidateComponentProvider {
    
    // 查找候选组件
    public Set<BeanDefinition> findCandidateComponents(String basePackage) {
        // 是否使用索引扫描（Spring 5.0+）
        if (this.useIndex) {
            return scanCandidateComponentsUsingIndex(basePackage);
        } else {
            return scanCandidateComponentsUsingScanner(basePackage);
        }
    }
    
    // 使用扫描器查找
    private Set<BeanDefinition> scanCandidateComponentsUsingScanner(String basePackage) {
        Set<BeanDefinition> result = new LinkedHashSet<>();
        
        // 1. 创建 ClassPathScanner
        ClassPathScanner scanner = new ClassPathScanner(this.resourcePatternResolver);
        
        // 2. 将包名转换为资源路径
        // com.example.service -> com/example/service
        String packageSearchPath = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX +
            resolveBasePackage(basePackage) + '/' + this.resourcePattern;
        // resourcePattern 默认是 "**/*.class"
        
        // 3. 查找所有匹配的资源
        Resource[] resources = scanner.getResources(packageSearchPath);
        
        // 4. 遍历每个资源
        for (Resource resource : resources) {
            if (resource.isReadable()) {
                try {
                    // 5. 使用 ASM 读取类的元数据
                    SimpleMetadataReader metadataReader = 
                        getMetadataReaderFactory().getMetadataReader(resource);
                    
                    // 6. 判断是否为候选组件
                    if (isCandidateComponent(metadataReader)) {
                        // 7. 创建 BeanDefinition
                        ScannedGenericBeanDefinition sbd = 
                            new ScannedGenericBeanDefinition(metadataReader);
                        sbd.setSource(resource);
                        
                        // 8. 再次检查（可能是抽象类等）
                        if (isCandidateComponent(sbd)) {
                            result.add(sbd);
                        }
                    }
                } catch (Throwable ex) {
                    throw new BeanDefinitionStoreException(
                        "Failed to read candidate component class: " + resource, ex);
                }
            }
        }
        
        return result;
    }
    
    // 判断是否为候选组件
    protected boolean isCandidateComponent(MetadataReader metadataReader) throws IOException {
        // 1. 执行自定义过滤器
        for (TypeFilter tf : this.excludeFilters) {
            if (tf.match(metadataReader, getMetadataReaderFactory())) {
                return false;  // 被排除
            }
        }
        
        // 2. 检查是否匹配包含过滤器
        for (TypeFilter tf : this.includeFilters) {
            if (tf.match(metadataReader, getMetadataReaderFactory())) {
                // 3. 检查是否是具体类
                return isConditionMatch(metadataReader);
            }
        }
        
        return false;
    }
}

// AnnotationTypeFilter - 注解类型过滤器
public class AnnotationTypeFilter implements TypeFilter {
    
    private final AnnotationMetadataReader annotationMetadataReader;
    
    @Override
    public boolean match(MetadataReader metadataReader, 
                        MetadataReaderFactory metadataReaderFactory) throws IOException {
        
        AnnotationMetadata metadata = metadataReader.getAnnotationMetadata();
        
        // 检查类上是否有指定注解（包括元注解）
        return metadata.hasAnnotation(this.annotationType.getName()) ||
            (this.considerMetaAnnotations && 
             hasMetaAnnotation(metadata, this.annotationType.getName()));
    }
}
```

#### @ComponentScan 属性详解

```java
// @ComponentScan 完整属性
@ComponentScan(
    // 扫描的包路径（默认当前包）
    basePackages = {"com.example.service", "com.example.dao"},
    
    // 扫描指定类所在的包
    basePackageClasses = {UserService.class},
    
    // 包含过滤器（只扫描带指定注解的类）
    includeFilters = {
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Service.class)
    },
    
    // 排除过滤器（排除某些类）
    excludeFilters = {
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Deprecated.class),
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = ".*Test.*")
    },
    
    // 是否使用默认过滤器
    useDefaultFilters = true,
    
    // 作用域代理模式
    scopedProxy = ScopedProxyMode.DEFAULT,
    
    // 资源过滤模式
    resourcePattern = "**/*.class",
    
    // 是否使用懒加载
    lazyInit = false
)
```

#### 过滤器类型

```java
// FilterType - 过滤器类型
public enum FilterType {
    
    // 按注解过滤
    ANNOTATION,
    
    // 按类名正则过滤
    REGEX,
    
    // 按自定义 TypeFilter 过滤
    CUSTOM,
    
    // 按类名 AspectJ 表达式过滤
    ASPECTJ,
    
    // 可分配类型过滤（isAssignableFrom）
    ASSIGNABLE_TYPE
}

// 使用示例
@ComponentScan(
    excludeFilters = {
        // 排除所有带 @Deprecated 注解的类
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Deprecated.class),
        
        // 排除所有 Test 结尾的类
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = ".*Test"),
        
        // 排除指定类型的类
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = AbstractService.class)
    }
)
```

---

## 12.3 基础用法

### 12.3.1 自定义注解触发 Bean 注册

```java
// 1. 定义自定义注解
@Target(ElementType.TYPE)  // 只能标注在类上
@Retention(RetentionPolicy.RUNTIME)  // 运行时保留
@Documented
@Component  // 元注解：标记为 Spring Bean
@Scope("prototype")  // 元注解：设置作用域
public @interface MyBean {
    String value() default "";  // Bean 名称
    String description() default "";  // 描述信息
}

// 2. 使用自定义注解
@MyBean(value = "myService", description = "我的服务")
public class MyService {
    
    public void doSomething() {
        System.out.println("MyService is working!");
    }
}

// 3. 配置类
@Configuration
@ComponentScan(basePackages = "com.example")  // 扫描包
public class AppConfig {
}

// 4. 测试
public class Test {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        // MyService 会被自动注册为 Bean
        MyService myService = context.getBean(MyService.class);
        myService.doSomething();
        
        // 验证作用域
        MyService myService2 = context.getBean(MyService.class);
        System.out.println(myService == myService2);  // false（prototype 作用域）
    }
}
```

### 12.3.2 自定义 BeanFactoryPostProcessor 处理注解

```java
// 自定义注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyComponent {
    String value() default "";
}

// 自定义 BeanFactoryPostProcessor 处理注解
@Component
public class MyComponentBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        // 获取所有 BeanDefinition
        String[] beanDefinitionNames = beanFactory.getBeanDefinitionNames();
        
        for (String beanName : beanDefinitionNames) {
            BeanDefinition bd = beanFactory.getBeanDefinition(beanName);
            
            // 获取 Bean 的类名
            String beanClassName = bd.getBeanClassName();
            if (beanClassName == null) continue;
            
            try {
                Class<?> beanClass = Class.forName(beanClassName);
                
                // 检查是否有 @MyComponent 注解
                MyComponent annotation = beanClass.getAnnotation(MyComponent.class);
                if (annotation != null) {
                    System.out.println("发现 @MyComponent: " + beanName);
                    
                    // 可以修改 BeanDefinition
                    if (bd instanceof AbstractBeanDefinition) {
                        AbstractBeanDefinition abd = (AbstractBeanDefinition) bd;
                        // 设置描述
                        abd.setDescription(annotation.value());
                    }
                }
            } catch (ClassNotFoundException e) {
                // 忽略
            }
        }
    }
}
```

### 12.3.3 自定义 ImportBeanDefinitionRegistrar

```java
// 自定义注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(MyMapperRegistrar.class)  // 导入注册器
public @interface EnableMyMappers {
    String basePackage() default "";  // 扫描的包路径
}

// 自定义 ImportBeanDefinitionRegistrar
public class MyMapperRegistrar implements ImportBeanDefinitionRegistrar {
    
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata,
                                       BeanDefinitionRegistry registry) {
        // 1. 获取 @EnableMyMappers 注解的属性
        Map<String, Object> attrs = importingClassMetadata.getAnnotationAttributes(
            EnableMyMappers.class.getName());
        
        String basePackage = (String) attrs.get("basePackage");
        
        // 2. 如果没有指定，使用默认值
        if (basePackage.isEmpty()) {
            basePackage = getDefaultBasePackage(importingClassMetadata);
        }
        
        // 3. 创建扫描器
        ClassPathBeanDefinitionScanner scanner = new ClassPathBeanDefinitionScanner(registry);
        
        // 4. 添加过滤器：只扫描带 @MyMapper 注解的类
        scanner.addIncludeFilter(new AnnotationTypeFilter(MyMapper.class));
        
        // 5. 扫描并注册
        Set<BeanDefinitionHolder> holders = scanner.doScan(new String[]{basePackage});
        
        // 6. 后处理每个 BeanDefinition
        for (BeanDefinitionHolder holder : holders) {
            GenericBeanDefinition definition = (GenericBeanDefinition) holder.getBeanDefinition();
            
            // 设置 BeanClass 为 MapperFactoryBean
            definition.getConstructorArgumentValues()
                .addGenericArgumentValue(definition.getBeanClassName());
            definition.setBeanClass(MyMapperFactoryBean.class);
            
            // 设置自动注入模式
            definition.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_TYPE);
        }
    }
    
    private String getDefaultBasePackage(AnnotationMetadata importingClassMetadata) {
        return ClassUtils.getPackageName(importingClassMetadata.getClassName());
    }
}

// Mapper 接口注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyMapper {
}

// Mapper 工厂 Bean
public class MyMapperFactoryBean<T> implements FactoryBean<T> {
    
    private Class<T> mapperInterface;
    
    public MyMapperFactoryBean(Class<T> mapperInterface) {
        this.mapperInterface = mapperInterface;
    }
    
    @Override
    public T getObject() throws Exception {
        // 使用 JDK 动态代理创建 Mapper 实现
        return (T) Proxy.newProxyInstance(
            mapperInterface.getClassLoader(),
            new Class[]{mapperInterface},
            (proxy, method, args) -> {
                System.out.println("执行 Mapper 方法: " + method.getName());
                return null;
            }
        );
    }
    
    @Override
    public Class<?> getObjectType() {
        return mapperInterface;
    }
}

// 使用
@Configuration
@EnableMyMappers(basePackage = "com.example.mapper")
public class AppConfig {
}

// Mapper 接口
@MyMapper
public interface UserMapper {
    User findById(Long id);
    List<User> findAll();
}
```

---

## 12.4 对比表格

### 注解读取方式对比

| 方式 | 实现类 | 优点 | 缺点 | 使用场景 |
| --- | --- | --- | --- | --- |
| 反射 | StandardAnnotationMetadata | 简单直接 | 需要加载类，占用内存 | 开发调试 |
| ASM | SimpleAnnotationMetadata | 不加载类，性能好 | 实现复杂 | 生产环境（默认） |
| MergedAnnotations | MergedAnnotation | 功能全面，支持元注解 | API 较复杂 | Spring 5.2+ |

### @Component 派生注解对比

| 注解 | 元注解 | 语义 | 特殊处理 |
| --- | --- | --- | --- |
| @Component | 无 | 通用组件 | 无 |
| @Service | @Component | 业务层 | 无（语义化） |
| @Repository | @Component | 数据访问层 | 异常转换 |
| @Controller | @Component | 控制层 | DispatcherServlet 处理 |
| @Configuration | @Component | 配置类 | 支持 @Bean、CGLIB 代理 |

### 过滤器类型对比

| FilterType | 说明 | 示例 |
| --- | --- | --- |
| ANNOTATION | 按注解过滤 | classes = Service.class |
| REGEX | 按正则表达式过滤 | pattern = ".*Test.*" |
| ASPECTJ | 按 AspectJ 表达式过滤 | pattern = "com.example..*Service" |
| ASSIGNABLE_TYPE | 按可分配类型过滤 | classes = AbstractService.class |
| CUSTOM | 自定义 TypeFilter | classes = MyFilter.class |

### Bean 注册方式对比

| 方式 | 触发方式 | 适用场景 | 示例 |
| --- | --- | --- | --- |
| @ComponentScan | 扫描 @Component | 通用 Bean 注册 | @Component、@Service |
| @Bean | 配置类方法 | 第三方库 Bean | @Bean DataSource |
| @Import | 导入配置类 | 模块化配置 | @Import(AppConfig.class) |
| ImportBeanDefinitionRegistrar | 编程式注册 | 动态注册 | MyBatis Mapper 扫描 |
| BeanDefinitionRegistryPostProcessor | 后处理注册 | 修改 BeanDefinition | 自定义注解处理 |

---

## 12.5 新手常见误区

### 误区 1：注解会自动生效

**错！** 注解只是一个标记，需要有人"读"它才会生效：

```java
// ❌ 错误理解：以为加了 @Component 就会自动变成 Bean
@Component
public class UserService {}
// 实际上，必须有 @ComponentScan 扫描到这个类，它才会被注册为 Bean

// ✅ 正确理解：注解 + 扫描 = Bean
@Configuration
@ComponentScan  // 必须有这个注解，@Component 才会生效
public class AppConfig {}
```

### 误区 2：@Service 和 @Component 没有区别

**错！** @Service 是 @Component 的派生注解，但有语义差别：

```java
// ❌ 错误：在 DAO 层用 @Service
@Service  // 语义不对，这是数据访问层
public class UserDao {}

// ✅ 正确：在 DAO 层用 @Repository
@Repository  // 语义正确，且有异常转换功能
public class UserDao {}

// 注意：@Repository 有额外的异常转换功能
// 会把底层异常转换为 Spring 的 DataAccessException
```

### 误区 3：@ComponentScan 只能扫描一个包

**错！** 可以扫描多个包：

```java
// ❌ 错误：以为只能扫描一个包
@ComponentScan("com.example.service")
public class AppConfig {}

// ✅ 正确：可以扫描多个包
@ComponentScan(basePackages = {
    "com.example.service",
    "com.example.dao",
    "com.example.config"
})
public class AppConfig {}

// ✅ 也可以重复使用 @ComponentScan（Spring 4.2+）
@ComponentScans({
    @ComponentScan("com.example.service"),
    @ComponentScan("com.example.dao")
})
public class AppConfig {}
```

### 误区 4：元注解只能有一层

**错！** 元注解可以多层嵌套：

```java
// 第一层：@Component
@Component
public @interface MyService {}

// 第二层：@MyService 上有 @Component
@MyService
public @interface MySpecialService {}

// 第三层：使用 @MySpecialService
@MySpecialService
public class UserService {}
// UserService 同时拥有 @MySpecialService、@MyService、@Component 三个注解
// Spring 会递归解析所有元注解
```

### 误区 5：@ComponentScan 的默认扫描范围是当前包

**部分正确！** 默认扫描的是配置类所在的包及其子包：

```java
package com.example.config;

// ❌ 错误：以为会扫描整个项目
@Configuration
@ComponentScan  // 只扫描 com.example.config 及其子包
public class AppConfig {}

// ✅ 正确：明确指定扫描范围
@Configuration
@ComponentScan(basePackages = "com.example")  // 扫描 com.example 及所有子包
public class AppConfig {}
```

---

## 12.6 动手练习

### 练习 1：基础练习 - 自定义注解

创建一个自定义注解 `@MyRepository`，功能类似 `@Repository`，标注在类上后能被 Spring 扫描并注册为 Bean。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义自定义注解
@Target(ElementType.TYPE)  // 只能标注在类上
@Retention(RetentionPolicy.RUNTIME)  // 运行时保留
@Documented
@Component  // 元注解：标记为 Spring Bean
public @interface MyRepository {
    String value() default "";  // Bean 名称
}

// 2. 使用自定义注解
@MyRepository("userRepo")
public class UserRepository {
    
    public void save(String data) {
        System.out.println("保存数据: " + data);
    }
    
    public String findById(Long id) {
        return "User-" + id;
    }
}

// 3. 配置类
@Configuration
@ComponentScan(basePackages = "com.example")
public class AppConfig {
}

// 4. 测试
public class Test {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 验证 Bean 是否注册成功
        UserRepository userRepo = context.getBean("userRepo", UserRepository.class);
        userRepo.save("test data");
        
        // 验证 @Component 元注解是否生效
        boolean isComponent = context.containsBean("userRepository");
        System.out.println("Bean 是否注册: " + isComponent);  // true
    }
}
```

</details>

### 练习 2：进阶练习 - 自定义组件扫描过滤器

创建一个过滤器，排除所有带 `@Deprecated` 注解的类，以及类名中包含 `Test` 的类。

<details>
<summary>点击查看答案</summary>

```java
// 1. 自定义过滤器：排除 @Deprecated 注解的类
public class ExcludeDeprecatedFilter implements TypeFilter {
    
    @Override
    public boolean match(MetadataReader metadataReader, 
                        MetadataReaderFactory metadataReaderFactory) throws IOException {
        AnnotationMetadata metadata = metadataReader.getAnnotationMetadata();
        
        // 如果类上有 @Deprecated 注解，返回 true（排除）
        return metadata.hasAnnotation(Deprecated.class.getName());
    }
}

// 2. 自定义过滤器：排除类名包含 Test 的类
public class ExcludeTestFilter implements TypeFilter {
    
    @Override
    public boolean match(MetadataReader metadataReader, 
                        MetadataReaderFactory metadataReaderFactory) throws IOException {
        ClassMetadata classMetadata = metadataReader.getClassMetadata();
        String className = classMetadata.getClassName();
        
        // 如果类名包含 Test，返回 true（排除）
        return className.contains("Test");
    }
}

// 3. 使用自定义过滤器
@Configuration
@ComponentScan(
    basePackages = "com.example",
    excludeFilters = {
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = ExcludeDeprecatedFilter.class),
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = ExcludeTestFilter.class)
    }
)
public class AppConfig {
}

// 4. 测试类
@Deprecated  // 会被排除
@Component
public class OldService {}

@Component
public class UserServiceTest {}  // 会被排除（类名包含 Test）

@Component
public class UserService {}  // 不会被排除，正常注册

// 5. 验证
public class Test {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        System.out.println("UserService 是否注册: " + 
            context.containsBean("userService"));  // true
        System.out.println("OldService 是否注册: " + 
            context.containsBean("oldService"));  // false
        System.out.println("UserServiceTest 是否注册: " + 
            context.containsBean("userServiceTest"));  // false
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 自定义注解 + ImportBeanDefinitionRegistrar

实现一个 `@EnableMyCache` 注解，使用 `ImportBeanDefinitionRegistrar` 动态注册缓存相关的 Bean。

<details>
<summary>点击查看答案</summary>

```java
// 1. 自定义注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(MyCacheRegistrar.class)  // 导入注册器
public @interface EnableMyCache {
    String basePackage() default "";  // 扫描包路径
    String cacheType() default "memory";  // 缓存类型
}

// 2. 缓存接口
public interface CacheManager {
    void put(String key, Object value);
    Object get(String key);
    void remove(String key);
}

// 3. 内存缓存实现
public class MemoryCacheManager implements CacheManager {
    
    private final Map<String, Object> cache = new ConcurrentHashMap<>();
    
    @Override
    public void put(String key, Object value) {
        cache.put(key, value);
        System.out.println("缓存写入: " + key);
    }
    
    @Override
    public Object get(String key) {
        System.out.println("缓存读取: " + key);
        return cache.get(key);
    }
    
    @Override
    public void remove(String key) {
        cache.remove(key);
        System.out.println("缓存删除: " + key);
    }
}

// 4. 缓存操作拦截器
public class CacheInterceptor implements MethodInterceptor {
    
    private final CacheManager cacheManager;
    
    public CacheInterceptor(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }
    
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        String methodName = invocation.getMethod().getName();
        String cacheKey = methodName + ":" + Arrays.toString(invocation.getArguments());
        
        // 先查缓存
        Object cached = cacheManager.get(cacheKey);
        if (cached != null) {
            System.out.println("命中缓存: " + cacheKey);
            return cached;
        }
        
        // 缓存未命中，执行方法
        Object result = invocation.proceed();
        
        // 写入缓存
        cacheManager.put(cacheKey, result);
        
        return result;
    }
}

// 5. ImportBeanDefinitionRegistrar 实现
public class MyCacheRegistrar implements ImportBeanDefinitionRegistrar {
    
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata,
                                       BeanDefinitionRegistry registry) {
        // 1. 获取 @EnableMyCache 注解属性
        Map<String, Object> attrs = importingClassMetadata.getAnnotationAttributes(
            EnableMyCache.class.getName());
        String cacheType = (String) attrs.get("cacheType");
        
        // 2. 注册 CacheManager Bean
        registerCacheManager(registry, cacheType);
        
        // 3. 注册 CacheInterceptor Bean
        registerCacheInterceptor(registry);
        
        // 4. 如果有 basePackage，扫描带 @Cacheable 注解的类
        String basePackage = (String) attrs.get("basePackage");
        if (!basePackage.isEmpty()) {
            registerCacheableBeans(registry, basePackage);
        }
    }
    
    private void registerCacheManager(BeanDefinitionRegistry registry, String cacheType) {
        if (!registry.containsBeanDefinition("cacheManager")) {
            BeanDefinitionBuilder builder = BeanDefinitionBuilder
                .genericBeanDefinition(MemoryCacheManager.class);
            
            registry.registerBeanDefinition("cacheManager", builder.getBeanDefinition());
        }
    }
    
    private void registerCacheInterceptor(BeanDefinitionRegistry registry) {
        if (!registry.containsBeanDefinition("cacheInterceptor")) {
            BeanDefinitionBuilder builder = BeanDefinitionBuilder
                .genericBeanDefinition(CacheInterceptor.class);
            
            // 注入 CacheManager
            builder.addConstructorArgReference("cacheManager");
            
            registry.registerBeanDefinition("cacheInterceptor", builder.getBeanDefinition());
        }
    }
    
    private void registerCacheableBeans(BeanDefinitionRegistry registry, String basePackage) {
        ClassPathBeanDefinitionScanner scanner = new ClassPathBeanDefinitionScanner(registry);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Component.class));
        
        Set<BeanDefinitionHolder> holders = scanner.doScan(new String[]{basePackage});
        
        for (BeanDefinitionHolder holder : holders) {
            BeanDefinition bd = holder.getBeanDefinition();
            String beanClassName = bd.getBeanClassName();
            
            if (beanClassName != null) {
                try {
                    Class<?> beanClass = Class.forName(beanClassName);
                    
                    // 检查是否有 @Cacheable 方法
                    boolean hasCacheable = false;
                    for (Method method : beanClass.getDeclaredMethods()) {
                        if (method.isAnnotationPresent(Cacheable.class)) {
                            hasCacheable = true;
                            break;
                        }
                    }
                    
                    if (hasCacheable) {
                        System.out.println("发现可缓存类: " + beanClassName);
                    }
                } catch (ClassNotFoundException e) {
                    // 忽略
                }
            }
        }
    }
}

// 6. 缓存方法注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Cacheable {
    String key() default "";
}

// 7. 使用
@Configuration
@EnableMyCache(basePackage = "com.example.service", cacheType = "memory")
public class AppConfig {
}

// 8. 测试
@Service
public class UserService {
    
    @Cacheable
    public User findById(Long id) {
        System.out.println("查询数据库...");
        return new User(id, "User-" + id);
    }
}

public class Test {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = 
            new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 验证 CacheManager 是否注册
        CacheManager cacheManager = context.getBean(CacheManager.class);
        System.out.println("CacheManager 已注册: " + (cacheManager != null));
        
        // 使用缓存
        cacheManager.put("test", "value");
        Object value = cacheManager.get("test");
        System.out.println("缓存值: " + value);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 事件机制原理**——也就是 ApplicationEvent 体系、事件发布流程、@EventListener、同步/异步事件。你会学到 Spring 内部是怎么实现事件驱动的，如何发布和监听自定义事件，以及同步事件和异步事件的区别和实现原理。
