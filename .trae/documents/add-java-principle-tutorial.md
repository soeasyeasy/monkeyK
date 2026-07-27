# 添加 Java 原理教程计划

## 任务概述
在现有教程平台中添加一套完整的 **Java 原理深度解析** 教程系列，深入讲解 Java 语言核心原理、底层机制和高级特性。

## 当前状态分析

### 已有教程
- ✅ Java 从入门到精通（16章，基础到实战）
- ✅ JVM 核心原理与实战（16章，JVM 专项）
- ✅ Spring 原理深度解析（16章，Spring 原理）

### 缺失内容
- ❌ Java 语言核心原理教程（面向对象、泛型、反射、集合底层、并发原理等）

## 教程系列设计

### 教程信息
- **ID**: `java-principle`
- **标题**: Java 原理深度解析
- **描述**: 深入 Java 语言核心，掌握面向对象、泛型、反射、集合、并发、IO 等底层原理
- **分类**: `backend`（后端）
- **章节数**: 16 章

### 章节大纲

#### 基础篇（1-6章）
1. **Java 语言核心原理概述** - Java 设计哲学、语言特性演进、核心机制概览
2. **面向对象原理** - 对象模型、封装继承多态底层实现、虚方法表
3. **泛型原理** - 类型擦除、泛型推断、通配符机制、桥接方法
4. **反射原理** - Class 对象、运行时类型识别、动态代理基础
5. **注解原理** - 元注解、注解处理器、运行时注解解析
6. **异常处理原理** - 异常体系、异常链、异常性能优化、try-with-resources 实现

#### 进阶篇（7-12章）
7. **集合框架底层原理** - Collection 体系、ArrayList/LinkedList 实现、HashMap 红黑树
8. **并发编程原理** - 线程模型、内存可见性、synchronized 锁升级、AQS 框架
9. **IO/NIO 原理** - 阻塞非阻塞、多路复用、零拷贝、DirectBuffer
10. **序列化原理** - Serializable、transient、Externalizable、JSON 序列化
11. **网络编程原理** - Socket 模型、NIO 网络编程、Netty 架构原理
12. **动态代理原理** - JDK 动态代理、CGLIB、字节码生成、AOP 基础

#### 实战篇（13-16章）
13. **类加载原理** - 类加载过程、双亲委派、自定义类加载器、热部署
14. **字节码原理** - 字节码指令、javap 工具、字节码增强、ASM/ByteBuddy
15. **性能优化原理** - JIT 编译、逃逸分析、锁优化、内存模型优化
16. **Java 新特性原理** - Lambda 实现、Stream 原理、模块化、虚拟线程

## 实施步骤

### 步骤 1：更新教程目录配置
**文件**: `src/data/tutorial-series.ts`
- 在 `tutorialSeries` 数组中添加 `java-principle` 教程系列
- 包含 16 章的完整元数据（number、title、description、section、slug）

### 步骤 2：创建教程内容目录
**目录**: `src/content/tutorials/java-principle/`
- 创建 16 个 Markdown 文件
- 文件命名格式：`{number}-{slug}.md`

### 步骤 3：编写教程内容
每章教程必须包含 8 个部分：
1. 本章导读（3-4 个新手疑问）
2. 为什么需要这个技术（痛点分析 + 生活化类比）
3. 核心原理讲解（底层原理 + 通俗类比）
4. 基础用法（逐行注释代码）
5. 进阶用法（复杂场景）
6. 核心知识点总结（表格形式）
7. 新手常见误区（3-5 个）
8. 下一章预告

### 步骤 4：更新 README.md
**文件**: `README.md`
- 在"后端开发"分类下添加 Java 原理教程条目
- 格式：`| Java 原理深度解析 | 16 | 深入 Java 语言核心，掌握面向对象、泛型、反射、集合、并发、IO 等底层原理 | [src/content/tutorials/java-principle](src/content/tutorials/java-principle) |`

## 文件清单

### 需要修改的文件
1. `src/data/tutorial-series.ts` - 添加教程系列配置
2. `README.md` - 更新教程目录

### 需要创建的文件（16个）
1. `src/content/tutorials/java-principle/01-introduction.md`
2. `src/content/tutorials/java-principle/02-oop-principle.md`
3. `src/content/tutorials/java-principle/03-generics.md`
4. `src/content/tutorials/java-principle/04-reflection.md`
5. `src/content/tutorials/java-principle/05-annotation.md`
6. `src/content/tutorials/java-principle/06-exception.md`
7. `src/content/tutorials/java-principle/07-collections.md`
8. `src/content/tutorials/java-principle/08-concurrency.md`
9. `src/content/tutorials/java-principle/09-io-nio.md`
10. `src/content/tutorials/java-principle/10-serialization.md`
11. `src/content/tutorials/java-principle/11-network.md`
12. `src/content/tutorials/java-principle/12-dynamic-proxy.md`
13. `src/content/tutorials/java-principle/13-class-loading.md`
14. `src/content/tutorials/java-principle/14-bytecode.md`
15. `src/content/tutorials/java-principle/15-performance.md`
16. `src/content/tutorials/java-principle/16-new-features.md`

## 验证步骤
1. 运行 `pnpm dev` 启动开发服务器
2. 访问 `/tutorials/java-principle` 查看教程系列页
3. 检查所有章节是否能正常加载
4. 验证路由是否正确
5. 运行 `pnpm build` 确保构建成功

## 注意事项
- 教程内容必须通俗易懂，新手友好
- 每个核心概念都要有生活化类比
- 代码示例必须完整可运行，每行有注释
- 避免与已有 JVM 教程内容重复
- 保持与现有教程风格一致
