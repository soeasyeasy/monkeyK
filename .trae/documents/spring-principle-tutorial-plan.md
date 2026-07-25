# Spring 原理深度解析教程计划

## 概述

创建一个全新的 **Spring 原理深度解析** 教程系列，与现有 Spring 完全指南独立，专注于 Spring 框架底层原理的深度讲解。

## 新教程系列信息

| 属性 | 值 |
|------|-----|
| ID | `spring-principle` |
| 标题 | Spring 原理深度解析 |
| 描述 | 深入 Spring 底层，掌握 IoC、AOP、自动配置等核心原理 |
| 分类 | `backend` |
| 章节数 | 16 章 |

## 教程目录结构

### 第一部分：IoC 容器核心原理（第 1-6 章）

| 章节 | 标题 | 核心内容 |
|------|------|----------|
| 01 | IoC 容器核心原理 | BeanFactory vs ApplicationContext、容器启动流程、refresh() 12 步详解、BeanDefinition 注册中心 |
| 02 | BeanDefinition 深度解析 | BeanDefinition 数据结构、注册流程、BeanDefinitionReader 解析过程、XML/注解/JavaConfig 三种配置解析原理 |
| 03 | Bean 生命周期全解析 | 完整生命周期（实例化→属性填充→初始化→使用→销毁）、生命周期扩展点、回调顺序 |
| 04 | BeanPostProcessor 原理 | BeanPostProcessor 执行时机、初始化前后处理、Aware 接口回调机制、常见内置后处理器 |
| 05 | 依赖注入底层实现 | 依赖注入完整流程、@Autowired/@Resource/@Inject 区别、限定符与候选 Bean 解析、注入类型对比 |
| 06 | 循环依赖与三级缓存 | 循环依赖检测机制、三级缓存原理（singletonObjects/earlySingletonObjects/singletonFactories）、解决方案详解、@Async 导致循环依赖失效原因 |

### 第二部分：AOP 与事务原理（第 7-8 章）

| 章节 | 标题 | 核心内容 |
|------|------|----------|
| 07 | AOP 底层实现原理 | JDK 动态代理 vs CGLIB 对比、ProxyFactory 创建流程、Advisor 链执行顺序、切面织入时机、代理对象生成过程 |
| 08 | Spring 事务管理原理 | PlatformTransactionManager 体系、TransactionInterceptor 拦截流程、事务传播行为 7 种实现、@Transactional 失效 8 大场景与原理 |

### 第三部分：Spring Boot 原理（第 9-12 章）

| 章节 | 标题 | 核心内容 |
|------|------|----------|
| 09 | Spring Boot 自动配置原理 | @EnableAutoConfiguration 机制、spring.factories / AutoConfiguration.imports 加载流程、@Conditional 条件注解家族、自动配置过滤与排序 |
| 10 | Spring Boot Starter 原理 | Starter 组成结构、自定义 Starter 开发实战、spring-boot-autoconfigure 模块解析、@ConfigurationProperties 属性绑定原理 |
| 11 | Spring Boot 启动流程 | SpringApplication.run() 完整流程、ApplicationListener 监听机制、ApplicationRunner/CommandLineRunner 执行时机、启动报告与 Banner 原理 |
| 12 | Spring 注解驱动原理 | 注解元数据解析、RegisteredBean 注册流程、注解如何触发 Bean 创建、元注解与组合注解、@ComponentScan 扫描原理 |

### 第四部分：核心机制原理（第 13-16 章）

| 章节 | 标题 | 核心内容 |
|------|------|----------|
| 13 | Spring 事件机制原理 | ApplicationEvent 体系、ApplicationListener 注册流程、事件发布完整流程、@EventListener 原理、同步/异步事件、自定义事件实战 |
| 14 | Spring EL 表达式原理 | SpEL 语法详解、三种表达式（字面量/属性/方法）、ParserContext 解析流程、在 @Value/@If 中的使用、自定义函数与变量 |
| 15 | Spring 类型转换与校验 | ConversionService 体系、PropertyEditor 与 Formatter 对比、JSR-303 校验集成原理、自定义转换器与校验器 |
| 16 | Spring 常用设计模式 | 工厂模式（BeanFactory）、单例模式（DefaultSingletonBeanRegistry）、代理模式（AOP）、模板方法（JdbcTemplate）、观察者模式（事件机制）、策略模式（Resource）、适配器模式（HandlerAdapter） |

## 实施步骤

### 步骤 1：更新教程目录配置

修改文件：`src/data/tutorial-series.ts`

在 `tutorialSeries` 数组中新增一个独立的教程系列对象：

```typescript
{
  id: 'spring-principle',
  title: 'Spring 原理深度解析',
  description: '深入 Spring 底层，掌握 IoC、AOP、自动配置等核心原理',
  category: 'backend',
  chapters: [
    // 16 个章节配置
  ],
}
```

### 步骤 2：创建教程目录

创建新目录：`src/content/tutorials/spring-principle/`

### 步骤 3：创建 16 个教程文件

| 文件名 | 对应章节 |
|--------|----------|
| 01-ioc-container.md | IoC 容器核心原理 |
| 02-bean-definition.md | BeanDefinition 深度解析 |
| 03-bean-lifecycle.md | Bean 生命周期全解析 |
| 04-bean-post-processor.md | BeanPostProcessor 原理 |
| 05-dependency-injection.md | 依赖注入底层实现 |
| 06-circular-dependency.md | 循环依赖与三级缓存 |
| 07-aop-principle.md | AOP 底层实现原理 |
| 08-transaction-principle.md | Spring 事务管理原理 |
| 09-auto-configuration.md | Spring Boot 自动配置原理 |
| 10-starter-principle.md | Spring Boot Starter 原理 |
| 11-startup-process.md | Spring Boot 启动流程 |
| 12-annotation-driven.md | Spring 注解驱动原理 |
| 13-event-mechanism.md | Spring 事件机制原理 |
| 14-spel.md | Spring EL 表达式原理 |
| 15-type-conversion.md | Spring 类型转换与校验 |
| 16-design-patterns.md | Spring 常用设计模式 |

### 步骤 4：编写教程内容

每章教程严格遵循 8 部分结构：
1. 本章导读（3-4 个新手疑问）
2. 为什么需要这个技术（痛点 + 类比）
3. 核心原理讲解（底层原理 + 通俗类比 + 源码分析）
4. 基础用法 + 逐行注释
5. 对比表格
6. 新手常见误区（3-5 个）
7. 动手练习（3 个，带折叠答案）
8. 下一章预告

写作要求：
- 通俗易懂，口语化表达
- 每个核心概念配生活化类比
- 代码完整可运行，每行中文注释
- 用 ✅ ❌ 标记正确/错误写法
- 不使用 emoji 图标
- 深入源码层面讲解原理

## 验证步骤

1. 检查 `tutorial-series.ts` 中新增了 `spring-principle` 教程系列
2. 确认 `src/content/tutorials/spring-principle/` 目录下有 16 个 Markdown 文件
3. 运行 `npm run dev` 验证教程页面正常显示
4. 检查教程目录结构正确，章节编号 01-16

## 假设与决策

- 新教程系列 ID 为 `spring-principle`，与现有 `spring` 系列完全独立
- 章节编号从 01 开始，共 16 章
- 每章教程内容约 800-1200 行，确保深度覆盖
- 代码示例基于 Spring 6.x / Spring Boot 3.x
- 教程内容包含源码分析，帮助读者理解底层实现
