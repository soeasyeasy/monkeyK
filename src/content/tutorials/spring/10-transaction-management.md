---
title: "第10章：Spring 事务管理"
description: "掌握声明式事务、事务传播行为和隔离级别"
---

# 第10章：Spring 事务管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是事务？为什么需要事务？
- Spring 如何管理事务？
- @Transactional 怎么用？有哪些属性？
- 事务传播行为是什么？有哪些类型？
- 事务隔离级别有哪些？如何选择？

这一章就是为了解答这些问题。我们会从数据库事务的基础概念开始，逐步深入 Spring 的事务管理机制，掌握声明式事务的使用，理解事务传播行为和隔离级别。

---

## 1 为什么需要事务？

### 痛点分析

没有事务管理时，数据操作可能出现不一致：

```java
// 转账操作
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // 扣款
    jdbcTemplate.update("UPDATE accounts SET balance = balance - ? WHERE id = ?", 
                        amount, fromId);
    
    // 模拟异常（如网络中断）
    int i = 1 / 0;
    
    // 入账（这行代码不会执行）
    jdbcTemplate.update("UPDATE accounts SET balance = balance + ? WHERE id = ?", 
                        amount, toId);
}
```

**问题**：
- 扣款成功，入账失败
- 数据不一致：钱凭空消失了
- 无法回滚已执行的操作

### 解决方案

使用事务保证数据一致性：

```java
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // 扣款
    jdbcTemplate.update("UPDATE accounts SET balance = balance - ? WHERE id = ?", 
                        amount, fromId);
    
    // 模拟异常
    int i = 1 / 0;
    
    // 入账（不会执行）
    jdbcTemplate.update("UPDATE accounts SET balance = balance + ? WHERE id = ?", 
                        amount, toId);
}
// 发生异常时，扣款操作也会回滚
```

> **一句话总结**：事务保证多个操作要么全部成功，要么全部失败，确保数据一致性。

---

## 2 核心原理

### 10.2.1 事务的 ACID 特性

| 特性 | 说明 | 例子 |
| --- | --- | --- |
| 原子性（Atomicity） | 事务是最小单位，不可分割 | 转账要么全做，要么全不做 |
| 一致性（Consistency） | 事务前后数据状态一致 | 转账前后总金额不变 |
| 隔离性（Isolation） | 并发事务互不干扰 | 两个转账操作不会互相影响 |
| 持久性（Durability） | 事务提交后永久保存 | 转账成功后数据不会丢失 |

打个比方：

> 事务就像银行的转账操作：
> - 原子性：扣款和入账必须同时成功或同时失败
> - 一致性：转账前后总金额不变
> - 隔离性：多个转账操作互不干扰
> - 持久性：转账成功后数据永久保存

### 10.2.2 Spring 事务管理方式

| 方式 | 说明 | 优缺点 |
| --- | --- | --- |
| 编程式事务 | 手动管理事务 | 灵活但代码冗余 |
| 声明式事务 | 注解/XML 配置 | 简洁但灵活性差 |

**推荐使用声明式事务**，通过 @Transactional 注解实现。

### 10.2.3 事务管理原理

Spring 事务基于 AOP 实现：

```
1. 方法调用前：开启事务
2. 方法执行：执行业务逻辑
3. 方法正常结束：提交事务
4. 方法抛出异常：回滚事务
```

---

## 3 基础用法

### 10.3.1 启用事务管理

```java
@SpringBootApplication
@EnableTransactionManagement // 启用事务管理（Spring Boot 自动配置，可省略）
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 10.3.2 @Transactional 基本使用

```java
@Service
public class AccountService {
    
    @Autowired
    private AccountMapper accountMapper;
    
    // 声明式事务
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // 扣款
        Account from = accountMapper.findById(fromId);
        from.setBalance(from.getBalance().subtract(amount));
        accountMapper.update(from);
        
        // 模拟异常
        // int i = 1 / 0;
        
        // 入账
        Account to = accountMapper.findById(toId);
        to.setBalance(to.getBalance().add(amount));
        accountMapper.update(to);
    }
}
```

### 10.3.3 @Transactional 属性

```java
@Transactional(
    // 事务传播行为
    propagation = Propagation.REQUIRED,
    
    // 事务隔离级别
    isolation = Isolation.DEFAULT,
    
    // 超时时间（秒）
    timeout = 30,
    
    // 是否只读
    readOnly = false,
    
    // 回滚异常
    rollbackFor = Exception.class,
    
    // 不回滚异常
    noRollbackFor = NullPointerException.class
)
public void businessMethod() {
    // 业务逻辑
}
```

### 10.3.4 回滚规则

```java
@Service
public class UserService {
    
    // 默认：遇到 RuntimeException 和 Error 回滚
    @Transactional
    public void method1() {
        throw new RuntimeException(); // 回滚
    }
    
    // 指定回滚异常
    @Transactional(rollbackFor = Exception.class)
    public void method2() throws Exception {
        throw new Exception(); // 回滚
    }
    
    // 指定不回滚异常
    @Transactional(noRollbackFor = NullPointerException.class)
    public void method3() {
        throw new NullPointerException(); // 不回滚
    }
}
```

---

## 4 进阶用法

### 10.4.1 事务传播行为

当事务方法被另一个事务方法调用时，事务如何传播：

| 传播行为 | 说明 | 使用场景 |
| --- | --- | --- |
| REQUIRED（默认） | 有事务则加入，无则新建 | 大多数场景 |
| SUPPORTS | 有事务则加入，无则非事务执行 | 查询方法 |
| MANDATORY | 必须在事务中调用，否则抛异常 | 强制事务环境 |
| REQUIRES_NEW | 总是新建事务，挂起当前事务 | 独立事务操作 |
| NOT_SUPPORTED | 以非事务方式执行，挂起当前事务 | 非事务操作 |
| NEVER | 以非事务方式执行，有事务则抛异常 | 禁止事务 |
| NESTED | 有事务则嵌套执行，无则新建 | 嵌套事务 |

```java
@Service
public class OrderService {
    
    @Autowired
    private OrderMapper orderMapper;
    
    @Autowired
    private LogService logService;
    
    // 外层事务
    @Transactional
    public void createOrder(Order order) {
        orderMapper.insert(order);
        
        // 记录日志（独立事务）
        logService.log("创建订单: " + order.getId());
    }
}

@Service
public class LogService {
    
    // 总是新建事务，不受外层事务影响
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String message) {
        // 即使外层事务回滚，日志也会保存
        logMapper.insert(message);
    }
}
```

### 10.4.2 事务隔离级别

| 隔离级别 | 说明 | 问题 |
| --- | --- | --- |
| DEFAULT | 数据库默认级别 | - |
| READ_UNCOMMITTED | 读未提交 | 脏读、不可重复读、幻读 |
| READ_COMMITTED | 读已提交 | 不可重复读、幻读 |
| REPEATABLE_READ | 可重复读 | 幻读 |
| SERIALIZABLE | 串行化 | 无问题，性能最差 |

```java
@Service
public class AccountService {
    
    // 设置隔离级别
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // 转账操作
    }
}
```

### 10.4.3 只读事务

```java
@Service
public class UserService {
    
    // 只读事务，优化查询性能
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userMapper.findAll();
    }
    
    // 写操作不能使用只读
    @Transactional
    public void save(User user) {
        userMapper.insert(user);
    }
}
```

### 10.4.4 事务超时

```java
@Service
public class ReportService {
    
    // 设置超时时间为 10 秒
    @Transactional(timeout = 10)
    public void generateReport() {
        // 生成报表（可能耗时较长）
        // 如果超过 10 秒，事务自动回滚
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @Transactional | 声明式事务注解 |
| propagation | 事务传播行为 |
| isolation | 事务隔离级别 |
| timeout | 超时时间 |
| readOnly | 是否只读 |
| rollbackFor | 回滚异常 |
| noRollbackFor | 不回滚异常 |
| ACID | 事务四大特性 |

---

## 6 新手常见误区

### 误区 1："@Transactional 可以加在任何方法上"

**错！** @Transactional 只能加在 public 方法上，且类必须被 Spring 管理。

```java
// 错误：private 方法
@Transactional
private void method() {} // 不生效

// 错误：非 Spring 管理的类
public class MyService { // 没有 @Service
    @Transactional
    public void method() {} // 不生效
}
```

### 误区 2："事务可以嵌套"

**不完全对！** 默认传播行为是 REQUIRED，会加入当前事务。如果需要独立事务，使用 REQUIRES_NEW。

### 误区 3："隔离级别越高越好"

**不是！** 隔离级别越高，性能越差。应该根据业务需求选择合适的级别。

**推荐**：
- 大多数场景：READ_COMMITTED
- 需要防止幻读：REPEATABLE_READ

### 误区 4："@Transactional 失效是因为注解错了"

**常见原因**：
1. 方法不是 public
2. 类没有被 Spring 管理
3. 异常被 catch 了
4. 数据库不支持事务
5. 传播行为设置错误

### 误区 5："只读事务不能写数据"

**对！** 只读事务只能用于查询，不能执行增删改操作。

---

## 7 动手练习

### 练习 1：基础练习 - 转账事务

实现转账功能，使用事务保证数据一致性。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class AccountService {
    
    @Autowired
    private AccountMapper accountMapper;
    
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // 扣款
        Account from = accountMapper.findById(fromId);
        from.setBalance(from.getBalance().subtract(amount));
        accountMapper.update(from);
        
        // 入账
        Account to = accountMapper.findById(toId);
        to.setBalance(to.getBalance().add(amount));
        accountMapper.update(to);
    }
}
```

</details>

### 练习 2：进阶练习 - 事务传播

实现订单创建和日志记录，日志使用独立事务。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class OrderService {
    
    @Autowired
    private OrderMapper orderMapper;
    
    @Autowired
    private LogService logService;
    
    @Transactional
    public void createOrder(Order order) {
        orderMapper.insert(order);
        
        // 记录日志（独立事务）
        logService.log("创建订单: " + order.getId());
    }
}

@Service
public class LogService {
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String message) {
        logMapper.insert(message);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 事务超时

实现报表生成功能，设置事务超时时间。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class ReportService {
    
    @Autowired
    private ReportMapper reportMapper;
    
    @Transactional(timeout = 30, rollbackFor = Exception.class)
    public void generateReport() throws Exception {
        // 生成报表
        List<Data> dataList = reportMapper.queryData();
        
        // 处理数据（可能耗时较长）
        for (Data data : dataList) {
            process(data);
        }
        
        // 保存报表
        reportMapper.save(report);
    }
    
    private void process(Data data) {
        // 模拟耗时操作
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring RESTful API 设计**——也就是如何设计规范的 RESTful 接口。你会学到：

- RESTful 架构风格
- HTTP 方法语义
- 状态码规范
- 接口文档生成

准备好了吗？让我们继续深入 Spring 的世界！
