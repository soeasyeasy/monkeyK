---
title: "第13章：与 Spring 集成原理"
description: "SqlSessionFactoryBean、MapperScannerConfigurer、自动配置"
---

# 第13章：与 Spring 集成原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 是如何与 Spring 集成的？
- SqlSessionFactoryBean 的作用是什么？
- Mapper 接口是如何自动扫描的？
- Spring Boot 自动配置是如何工作的？

这一章就是为了解答这些问题。我们会从 **集成的必要性** 入手，再深入 **核心组件的实现原理**。

---

## 1 为什么需要与 Spring 集成？

### 痛点分析

独立使用 MyBatis 的问题：
- 需要手动管理 SqlSession
- 需要手动管理事务
- 需要手动管理数据源
- 代码冗余，容易出错

### 解决方案

与 Spring 集成后：
- Spring 管理 SqlSessionFactory
- Spring 管理事务
- Spring 管理数据源
- 自动扫描 Mapper 接口

> **一句话总结**：Spring 集成让你专注于业务逻辑，而不必关心底层细节。

---

## 2 SqlSessionFactoryBean

### 2.1 作用

SqlSessionFactoryBean 是 Spring 的 FactoryBean，用于创建 SqlSessionFactory：

```java
public class SqlSessionFactoryBean implements FactoryBean<SqlSessionFactory>, 
                                               InitializingBean, ApplicationContextAware {
    private DataSource dataSource;
    private Resource configLocation;
    private Resource[] mapperLocations;
    private TypeAliasPackage[] typeAliasesPackages;
    // ...
    
    @Override
    public SqlSessionFactory getObject() throws Exception {
        return buildSqlSessionFactory();
    }
    
    @Override
    public Class<?> getObjectType() {
        return SqlSessionFactory.class;
    }
    
    @Override
    public boolean isSingleton() {
        return true;
    }
}
```

### 2.2 核心方法

```java
protected SqlSessionFactory buildSqlSessionFactory() throws Exception {
    Configuration configuration;
    
    // 1. 解析 mybatis-config.xml
    if (this.configLocation != null) {
        XMLConfigBuilder xmlConfigBuilder = new XMLConfigBuilder(
            this.configLocation.getInputStream(), null, this.configurationProperties);
        configuration = xmlConfigBuilder.getConfiguration();
    } else {
        configuration = new Configuration();
    }
    
    // 2. 设置数据源
    if (this.dataSource != null) {
        Environment environment = new Environment("SqlSessionFactoryBean", 
            this.transactionFactory, this.dataSource);
        configuration.setEnvironment(environment);
    }
    
    // 3. 设置类型别名
    if (this.typeAliasesPackages != null) {
        for (TypeAliasPackage typeAliasPackage : this.typeAliasesPackages) {
            configuration.getTypeAliasRegistry().registerAliases(
                typeAliasPackage.getPackage(), typeAliasPackage.getSuperType());
        }
    }
    
    // 4. 加载 Mapper XML
    if (this.mapperLocations != null) {
        for (Resource mapperLocation : this.mapperLocations) {
            XMLMapperBuilder xmlMapperBuilder = new XMLMapperBuilder(
                mapperLocation.getInputStream(), configuration, 
                mapperLocation.toString(), configuration.getSqlFragments());
            xmlMapperBuilder.parse();
        }
    }
    
    // 5. 创建 SqlSessionFactory
    return new SqlSessionFactoryBuilder().build(configuration);
}
```

### 2.3 配置方式

```java
@Configuration
public class MyBatisConfig {
    
    @Bean
    public SqlSessionFactoryBean sqlSessionFactory(DataSource dataSource) {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        
        // 设置数据源
        factory.setDataSource(dataSource);
        
        // 设置 mybatis-config.xml
        factory.setConfigLocation(new ClassPathResource("mybatis-config.xml"));
        
        // 设置 Mapper XML 位置
        factory.setMapperLocations(new PathMatchingResourcePatternResolver()
            .getResources("classpath:mapper/*.xml"));
        
        // 设置类型别名包
        factory.setTypeAliasesPackage("com.example.model");
        
        return factory;
    }
}
```

---

## 3 MapperScannerConfigurer

### 3.1 作用

MapperScannerConfigurer 用于自动扫描 Mapper 接口：

```java
public class MapperScannerConfigurer implements BeanDefinitionRegistryPostProcessor {
    private String basePackage;
    private Class<? extends Annotation> annotationClass;
    private Class<?> markerInterface;
    private String sqlSessionFactoryBeanName;
    
    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        // 1. 创建类路径扫描器
        ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
        
        // 2. 设置扫描条件
        if (this.annotationClass != null) {
            scanner.addIncludeFilter(new AnnotationTypeFilter(this.annotationClass));
        }
        if (this.markerInterface != null) {
            scanner.addIncludeFilter(new AssignableTypeFilter(this.markerInterface));
        }
        
        // 3. 扫描包
        scanner.scan(StringUtils.tokenizeToStringArray(this.basePackage, 
            ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS));
    }
}
```

### 3.2 扫描过程

```java
public class ClassPathMapperScanner extends ClassPathBeanDefinitionScanner {
    
    @Override
    public Set<BeanDefinitionHolder> doScan(String... basePackages) {
        // 1. 扫描父类（Spring 的扫描逻辑）
        Set<BeanDefinitionHolder> beanDefinitions = super.doScan(basePackages);
        
        // 2. 处理 Mapper 接口
        for (BeanDefinitionHolder holder : beanDefinitions) {
            GenericBeanDefinition definition = (GenericBeanDefinition) holder.getBeanDefinition();
            
            // 3. 设置 Bean 类为 MapperFactoryBean
            definition.getPropertyValues().add("mapperInterface", 
                definition.getBeanClassName());
            definition.setBeanClass(MapperFactoryBean.class);
            
            // 4. 设置自动注入
            definition.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_TYPE);
        }
        
        return beanDefinitions;
    }
}
```

### 3.3 配置方式

```java
@Configuration
public class MyBatisConfig {
    
    @Bean
    public MapperScannerConfigurer mapperScannerConfigurer() {
        MapperScannerConfigurer configurer = new MapperScannerConfigurer();
        
        // 设置扫描包
        configurer.setBasePackage("com.example.mapper");
        
        // 设置 SqlSessionFactory
        configurer.setSqlSessionFactoryBeanName("sqlSessionFactory");
        
        return configurer;
    }
}
```

```java
// 或使用注解方式
@Configuration
@MapperScan("com.example.mapper")
public class MyBatisConfig {
    // ...
}
```

---

## 4 MapperFactoryBean

### 4.1 作用

MapperFactoryBean 是 Spring 的 FactoryBean，用于创建 Mapper 代理对象：

```java
public class MapperFactoryBean<T> extends SqlSessionDaoSupport implements FactoryBean<T> {
    private Class<T> mapperInterface;
    
    @Override
    public T getObject() throws Exception {
        return getSqlSession().getMapper(this.mapperInterface);
    }
    
    @Override
    public Class<T> getObjectType() {
        return this.mapperInterface;
    }
    
    @Override
    public boolean isSingleton() {
        return true;
    }
    
    @Override
    protected void checkDaoConfig() {
        super.checkDaoConfig();
        
        // 检查 Mapper 接口是否已配置
        if (this.mapperInterface == null) {
            throw new IllegalArgumentException("Property 'mapperInterface' are required");
        }
        
        Configuration configuration = getSqlSession().getConfiguration();
        
        // 检查 Mapper 接口是否已注册
        if (configuration.hasMapper(this.mapperInterface)) {
            // 已注册，添加 Mapper 注册
            configuration.addMapper(this.mapperInterface);
        }
    }
}
```

---

## 5 Spring Boot 自动配置

### 5.1 自动配置类

```java
@Configuration
@ConditionalOnClass({SqlSessionFactory.class, SqlSessionFactoryBean.class})
@ConditionalOnSingleCandidate(DataSource.class)
@EnableConfigurationProperties(MybatisProperties.class)
@AutoConfigureAfter({DataSourceAutoConfiguration.class})
public class MybatisAutoConfiguration {
    
    private final MybatisProperties properties;
    
    @Bean
    @ConditionalOnMissingBean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        
        // 设置配置
        if (this.properties.getConfigLocation() != null) {
            factory.setConfigLocation(this.properties.getConfigLocation());
        }
        
        // 设置 Mapper 位置
        if (this.properties.getMapperLocations() != null) {
            factory.setMapperLocations(this.properties.getMapperLocations());
        }
        
        // 设置类型别名
        if (this.properties.getTypeAliasesPackage() != null) {
            factory.setTypeAliasesPackage(this.properties.getTypeAliasesPackage());
        }
        
        return factory.getObject();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
    
    @Bean
    @ConditionalOnMissingBean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

### 5.2 配置文件

```yaml
# application.yml
mybatis:
  config-location: classpath:mybatis-config.xml
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.model
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: true
    lazy-loading-enabled: false
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| SqlSessionFactoryBean | 创建 SqlSessionFactory |
| MapperScannerConfigurer | 自动扫描 Mapper 接口 |
| MapperFactoryBean | 创建 Mapper 代理对象 |
| Spring Boot 自动配置 | MybatisAutoConfiguration |
| 事务管理 | Spring 管理事务 |

---

## 7 新手常见误区

### 误区 1："Spring 集成后还需要手动管理 SqlSession"

**错！** Spring 集成后，SqlSession 由 Spring 管理，无需手动管理。

### 误区 2："Mapper 接口需要实现类"

不是的。Spring 集成后，Mapper 接口由 MapperFactoryBean 创建代理对象。

### 误区 3："Spring Boot 自动配置不需要任何配置"

**错！** 虽然自动配置，但仍需要配置数据源、Mapper 位置等。

---

## 8 动手练习

### 练习 1：基础练习

说明 SqlSessionFactoryBean 的作用。

<details>
<parameter=点击查看答案