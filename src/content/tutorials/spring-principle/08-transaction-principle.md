---
title: "第8章：Spring 事务管理原理"
description: "深入理解 Spring 事务管理的底层原理、事务传播行为与 @Transactional 失效场景"
---

# 第8章：Spring 事务管理原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- @Transactional 注解到底是怎么工作的？为什么加个注解就能管理事务？
- Spring 的事务传播行为有 7 种，它们到底有什么区别？
- 为什么有时候 @Transactional 会失效？加了注解但事务没生效？
- Spring 是如何保证事务的 ACID 特性的？底层原理是什么？

这一章我们会彻底搞懂 **Spring 事务管理的底层实现原理**，从源码层面理解 PlatformTransactionManager 体系、TransactionInterceptor 拦截流程，以及事务传播行为的实现机制。搞懂了这些，你就能真正掌握事务管理的核心技术，遇到事务失效问题也能自己排查。

---

## 8.1 为什么需要深入理解事务管理？

### 痛点分析

很多开发者用事务只是"加个 @Transactional 注解"，直到遇到这些问题才懵：

1. **事务失效**：加了 @Transactional，但数据还是不一致
2. **传播行为混乱**：REQUIRED、REQUIRES_NEW、NESTED 到底有什么区别？
3. **性能问题**：事务范围太大，导致数据库连接长时间占用
4. **异常处理不当**：事务回滚了但异常没处理，或者异常处理了但事务没回滚
5. **自调用失效**：同一个类中方法调用，事务不生效

### 生活化类比

把事务管理想象成**银行的转账流程**：

- 你要从 A 账户转 1000 元到 B 账户
- 这个操作包含两步：A 账户扣款、B 账户加款
- 如果只完成了一步（A 扣款了但 B 没加款），就会出现数据不一致
- 事务就是保证这两步要么都成功，要么都失败
- 如果中间出错，就"回滚"到操作前的状态

Spring 的事务管理就像**银行的自动柜员机**：
1. 你只需要说"我要转账"（加 @Transactional）
2. 柜员机自动处理：开启事务、执行操作、提交或回滚
3. 如果中间出错，自动撤销所有操作
4. 你不需要手动管理连接的获取、释放、事务的开启、提交

---

## 8.2 核心原理讲解

### 8.2.1 PlatformTransactionManager 体系

Spring 的事务管理核心是 `PlatformTransactionManager` 接口，它定义了事务管理的标准：

```java
// PlatformTransactionManager 接口定义
public interface PlatformTransactionManager {
    
    // 获取事务（开启事务）
    TransactionStatus getTransaction(TransactionDefinition definition) 
        throws TransactionException;
    
    // 提交事务
    void commit(TransactionStatus status) throws TransactionException;
    
    // 回滚事务
    void rollback(TransactionStatus status) throws TransactionException;
}
```

**常见的实现类：**

| 实现类 | 使用场景 | 说明 |
|--------|---------|------|
| DataSourceTransactionManager | JDBC/MyBatis | 最常用，管理基于 JDBC 的事务 |
| JpaTransactionManager | JPA/Hibernate | 管理 JPA 事务 |
| JtaTransactionManager | 分布式事务 | 管理 JTA 事务（跨多个数据源） |
| HibernateTransactionManager | Hibernate | 管理 Hibernate 事务 |

**源码简化版：**

```java
// DataSourceTransactionManager 的核心实现
public class DataSourceTransactionManager implements PlatformTransactionManager {
    
    private DataSource dataSource;  // 数据源
    
    // 获取事务
    public TransactionStatus getTransaction(TransactionDefinition definition) {
        // 1. 获取数据库连接
        ConnectionHolder conHolder = (ConnectionHolder) TransactionSynchronizationManager
            .getResource(this.dataSource);
        
        // 2. 如果没有连接，创建新连接
        if (conHolder == null) {
            conHolder = new ConnectionHolder(obtainDataSource().getConnection());
            TransactionSynchronizationManager.bindResource(this.dataSource, conHolder);
        }
        
        // 3. 开启事务
        conHolder.getConnection().setAutoCommit(false);  // 关闭自动提交
        
        // 4. 返回事务状态
        return new DefaultTransactionStatus(conHolder, true, true, false, false, null);
    }
    
    // 提交事务
    public void commit(TransactionStatus status) {
        // 1. 获取连接
        ConnectionHolder conHolder = (ConnectionHolder) status.getTransaction();
        Connection con = conHolder.getConnection();
        
        // 2. 提交
        con.commit();
        
        // 3. 恢复自动提交
        con.setAutoCommit(true);
        
        // 4. 释放连接
        conHolder.released();
    }
    
    // 回滚事务
    public void rollback(TransactionStatus status) {
        // 1. 获取连接
        ConnectionHolder conHolder = (ConnectionHolder) status.getTransaction();
        Connection con = conHolder.getConnection();
        
        // 2. 回滚
        con.rollback();
        
        // 3. 恢复自动提交
        con.setAutoCommit(true);
        
        // 4. 释放连接
        conHolder.released();
    }
}
```

**通俗类比：**

PlatformTransactionManager 就像**餐厅的经理**：
1. 顾客点菜（方法调用）
2. 经理开启订单（getTransaction：获取连接、开启事务）
3. 厨师做菜（执行业务逻辑）
4. 如果菜做好了，经理确认订单（commit：提交事务）
5. 如果做错了，经理取消订单（rollback：回滚事务）

### 8.2.2 TransactionInterceptor 拦截流程

`@Transactional` 注解的生效是通过 AOP 实现的，核心拦截器是 `TransactionInterceptor`：

```java
// TransactionInterceptor 的核心逻辑
public class TransactionInterceptor extends TransactionAspectSupport 
        implements MethodInterceptor, Serializable {
    
    // 拦截方法调用
    public Object invoke(MethodInvocation invocation) throws Throwable {
        // 1. 获取目标类和方法
        Class<?> targetClass = (invocation.getThis() != null ? 
                               AopUtils.getTargetClass(invocation.getThis()) : null);
        
        // 2. 获取事务属性（@Transactional 注解的配置）
        TransactionAttribute txAttr = getTransactionAttributeSource()
            .getTransactionAttribute(invocation.getMethod(), targetClass);
        
        // 3. 获取事务管理器
        PlatformTransactionManager tm = determineTransactionManager(txAttr);
        
        // 4. 创建事务
        TransactionStatus txStatus = getTransactionManager().getTransaction(txAttr);
        
        // 5. 执行目标方法
        Object result;
        try {
            result = invocation.proceed();
        } catch (Throwable ex) {
            // 6. 如果发生异常，回滚事务
            rollbackOn(ex, txStatus);
            throw ex;
        }
        
        // 7. 如果没有异常，提交事务
        commit(txStatus);
        
        return result;
    }
    
    // 判断是否需要回滚
    protected boolean rollbackOn(Throwable ex, TransactionStatus status) {
        // 1. 获取事务属性
        TransactionAttribute txAttr = getTransactionAttributeSource()
            .getTransactionAttribute(ex.getClass());
        
        // 2. 检查异常类型
        // 默认情况下，RuntimeException 和 Error 会回滚
        // CheckedException 不会回滚（除非明确指定）
        if (txAttr != null && txAttr.rollbackOn(ex)) {
            return true;
        }
        
        return false;
    }
}
```

**通俗类比：**

TransactionInterceptor 就像**餐厅的服务员**：
1. 顾客点菜（方法调用）
2. 服务员记录订单（开启事务）
3. 厨房做菜（执行业务逻辑）
4. 如果菜做好了，服务员上菜并确认（提交事务）
5. 如果做错了，服务员取消订单（回滚事务）
6. 根据错误类型决定是否取消（异常类型决定是否回滚）

### 8.2.3 事务传播行为

事务传播行为定义了**当一个事务方法被另一个事务方法调用时，事务应该如何传播**。Spring 定义了 7 种传播行为：

| 传播行为 | 说明 | 使用场景 |
|---------|------|---------|
| REQUIRED（默认） | 如果当前有事务，就加入；否则创建新事务 | 大多数场景 |
| SUPPORTS | 如果当前有事务，就加入；否则非事务执行 | 查询方法 |
| MANDATORY | 必须在事务中调用，否则抛异常 | 强制要求事务 |
| REQUIRES_NEW | 总是创建新事务，挂起当前事务 | 独立的事务操作 |
| NOT_SUPPORTED | 非事务执行，挂起当前事务 | 不需要事务的操作 |
| NEVER | 非事务执行，如果当前有事务则抛异常 | 禁止事务 |
| NESTED | 如果当前有事务，创建嵌套事务；否则创建新事务 | 部分回滚 |

**源码实现：**

```java
// AbstractPlatformTransactionManager 中的事务传播逻辑
public final TransactionStatus getTransaction(TransactionDefinition definition) {
    // 1. 获取当前事务
    Object transaction = doGetTransaction();
    
    // 2. 判断是否存在事务
    if (transaction != null && isExistingTransaction(transaction)) {
        // 3. 如果存在事务，根据传播行为处理
        return handleExistingTransaction(definition, transaction);
    }
    
    // 4. 如果不存在事务，根据传播行为处理
    return handleNewTransaction(definition);
}

// 处理已存在的事务
private TransactionStatus handleExistingTransaction(
        TransactionDefinition definition, Object transaction) {
    
    switch (definition.getPropagationBehavior()) {
        case TransactionDefinition.PROPAGATION_REQUIRED:
            // 加入当前事务
            return joinTransaction(transaction);
            
        case TransactionDefinition.PROPAGATION_SUPPORTS:
        case TransactionDefinition.PROPAGATION_MANDATORY:
            if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {
                // MANDATORY 必须在事务中
                throw new IllegalTransactionStateException("No existing transaction found");
            }
            // SUPPORTS 加入当前事务
            return joinTransaction(transaction);
            
        case TransactionDefinition.PROPAGATION_REQUIRES_NEW:
            // 挂起当前事务，创建新事务
            suspend(transaction);
            return createNewTransaction(definition);
            
        case TransactionDefinition.PROPAGATION_NOT_SUPPORTED:
        case TransactionDefinition.PROPAGATION_NEVER:
            if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NEVER) {
                throw new IllegalTransactionStateException("Existing transaction found");
            }
            // 挂起当前事务，非事务执行
            suspend(transaction);
            return null;
            
        case TransactionDefinition.PROPAGATION_NESTED:
            // 创建嵌套事务
            return createNestedTransaction(definition, transaction);
    }
}
```

**通俗类比：**

把事务传播行为想象成**公司的工作流程**：

- **REQUIRED**：如果有人在开会，就加入；否则自己发起会议
- **SUPPORTS**：如果有人在开会，就加入；否则自己干自己的
- **MANDATORY**：必须有人在开会，否则报错
- **REQUIRES_NEW**：不管有没有会议，自己开一个新会议
- **NOT_SUPPORTED**：不管有没有会议，自己都不参加，自己干
- **NEVER**：禁止开会，如果有人在开会就报错
- **NESTED**：如果有人在开会，在会议中开一个小分组讨论

### 8.2.4 嵌套事务的实现

嵌套事务（NESTED）是通过**保存点（Savepoint）** 实现的：

```java
// 嵌套事务的实现
protected TransactionStatus createNestedTransaction(
        TransactionDefinition definition, Object transaction) {
    
    // 1. 获取当前连接
    ConnectionHolder conHolder = (ConnectionHolder) transaction;
    Connection con = conHolder.getConnection();
    
    // 2. 创建保存点
    Savepoint savepoint = con.setSavepoint();
    
    // 3. 返回嵌套事务状态
    return new DefaultTransactionStatus(transaction, false, false, true, false, savepoint);
}

// 回滚时
public void rollback(TransactionStatus status) {
    if (status.hasSavepoint()) {
        // 如果有保存点，回滚到保存点（不影响外层事务）
        Savepoint savepoint = status.getSavepoint();
        Connection con = getConnection(status);
        con.rollback(savepoint);
    } else {
        // 如果没有保存点，完全回滚
        Connection con = getConnection(status);
        con.rollback();
    }
}
```

**通俗类比：**

嵌套事务就像**写文章时的草稿**：
1. 你正在写一篇文章（外层事务）
2. 写到一半，想试试另一个写法（嵌套事务）
3. 你在当前页做个标记（保存点）
4. 在另一张纸上试写（嵌套事务）
5. 如果试写成功，把内容抄到正文（提交嵌套事务）
6. 如果试写失败，撕掉试写的纸，正文不受影响（回滚到保存点）

---

## 8.3 基础用法与逐行注释

### 8.3.1 @Transactional 基础用法

```java
@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private InventoryRepository inventoryRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    // ✅ 基础用法：方法级事务
    @Transactional
    public void createOrder(Order order) {
        // 1. 保存订单
        orderRepository.save(order);
        
        // 2. 扣减库存
        inventoryRepository.decreaseStock(order.getProductId(), order.getQuantity());
        
        // 3. 创建支付记录
        paymentRepository.createPayment(order);
        
        // 如果任何一步失败，整个事务回滚
    }
    
    // ✅ 指定回滚规则
    @Transactional(rollbackFor = Exception.class)  // 所有异常都回滚
    public void processOrder(Order order) throws Exception {
        // 业务逻辑
        if (order.getAmount() > 10000) {
            throw new Exception("订单金额过大");  // 会回滚
        }
    }
    
    // ✅ 指定传播行为
    @Transactional(propagation = Propagation.REQUIRES_NEW)  // 总是创建新事务
    public void logOrderCreation(Order order) {
        // 这个操作独立于外层事务
        // 即使外层事务回滚，这个日志也会保存
        logRepository.log("订单创建: " + order.getId());
    }
    
    // ✅ 指定隔离级别
    @Transactional(isolation = Isolation.SERIALIZABLE)  // 最高隔离级别
    public void criticalOperation() {
        // 事务之间完全隔离，性能最差但最安全
    }
    
    // ✅ 指定超时时间
    @Transactional(timeout = 1000)  // 1 秒超时
    public void slowOperation() {
        // 如果超过 1 秒还没完成，自动回滚
    }
    
    // ✅ 只读事务
    @Transactional(readOnly = true)  // 只读，优化性能
    public List<Order> getAllOrders() {
        // 只查询，不修改数据
        return orderRepository.findAll();
    }
}
```

### 8.3.2 事务传播行为示例

```java
@Service
public class OuterService {
    
    @Autowired
    private InnerService innerService;
    
    // 外层事务
    @Transactional
    public void outerMethod() {
        System.out.println("外层方法开始");
        
        // 调用内层方法
        innerService.innerMethod();
        
        System.out.println("外层方法结束");
    }
}

@Service
public class InnerService {
    
    // 场景 1：REQUIRED（默认）
    @Transactional(propagation = Propagation.REQUIRED)
    public void innerMethod() {
        // 如果外层有事务，加入外层事务
        // 如果外层没有事务，创建新事务
        System.out.println("内层方法（REQUIRED）");
    }
    
    // 场景 2：REQUIRES_NEW
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void innerMethodNew() {
        // 总是创建新事务，挂起外层事务
        // 内层事务独立于外层事务
        System.out.println("内层方法（REQUIRES_NEW）");
    }
    
    // 场景 3：NESTED
    @Transactional(propagation = Propagation.NESTED)
    public void innerMethodNested() {
        // 如果外层有事务，创建嵌套事务
        // 嵌套事务回滚不影响外层事务
        System.out.println("内层方法（NESTED）");
    }
    
    // 场景 4：SUPPORTS
    @Transactional(propagation = Propagation.SUPPORTS)
    public void innerMethodSupports() {
        // 如果外层有事务，加入外层事务
        // 如果外层没有事务，非事务执行
        System.out.println("内层方法（SUPPORTS）");
    }
}
```

### 8.3.3 编程式事务管理

```java
@Service
public class ProgrammaticTransactionService {
    
    @Autowired
    private PlatformTransactionManager transactionManager;
    
    @Autowired
    private TransactionTemplate transactionTemplate;
    
    // 方式 1：使用 TransactionTemplate（推荐）
    public void methodWithTemplate() {
        transactionTemplate.execute(status -> {
            // 事务内的代码
            try {
                // 业务逻辑
                doSomething();
                return "success";
            } catch (Exception e) {
                status.setRollbackOnly();  // 标记回滚
                return "error";
            }
        });
    }
    
    // 方式 2：手动管理事务
    public void methodManual() {
        // 1. 定义事务属性
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
        def.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        
        // 2. 开启事务
        TransactionStatus status = transactionManager.getTransaction(def);
        
        try {
            // 3. 执行业务逻辑
            doSomething();
            
            // 4. 提交事务
            transactionManager.commit(status);
        } catch (Exception e) {
            // 5. 回滚事务
            transactionManager.rollback(status);
            throw e;
        }
    }
}
```

---

## 8.4 @Transactional 失效的 8 大场景

### 场景 1：方法不是 public

```java
@Service
public class UserService {
    
    // ❌ 错误：private 方法，事务失效
    @Transactional
    private void privateMethod() {
        // 事务不会生效！
    }
    
    // ❌ 错误：protected 方法，事务失效
    @Transactional
    protected void protectedMethod() {
        // 事务不会生效！
    }
    
    // ✅ 正确：public 方法
    @Transactional
    public void publicMethod() {
        // 事务正常生效
    }
}

// 原因：Spring AOP 只能代理 public 方法
// 解决方案：把方法改为 public
```

### 场景 2：同一个类中的方法调用

```java
@Service
public class UserService {
    
    @Transactional
    public void methodA() {
        // 事务生效
    }
    
    public void methodB() {
        // ❌ 错误：直接调用 methodA，事务失效
        this.methodA();  // this 调用，不经过代理！
    }
    
    public void methodC() {
        // ✅ 正确：通过代理对象调用
        UserService proxy = AopContext.currentProxy();
        proxy.methodA();  // 通过代理调用，事务生效
    }
}

// 原因：同一个类中的方法调用是 this 调用，不经过代理对象
// 解决方案：
// 1. 通过 AopContext.currentProxy() 获取代理对象
// 2. 把方法提取到另一个类中
// 3. 通过 ApplicationContext 获取代理对象
```

### 场景 3：异常被捕获

```java
@Service
public class OrderService {
    
    @Transactional
    public void createOrder() {
        try {
            // 业务逻辑
            throw new RuntimeException("订单创建失败");
        } catch (Exception e) {
            // ❌ 错误：异常被捕获，事务不会回滚！
            System.out.println("捕获异常: " + e.getMessage());
            // 事务认为没有异常，会提交
        }
    }
    
    @Transactional
    public void createOrder2() {
        try {
            throw new RuntimeException("订单创建失败");
        } catch (Exception e) {
            System.out.println("捕获异常: " + e.getMessage());
            // ✅ 正确：重新抛出异常
            throw e;  // 事务会回滚
        }
    }
}

// 原因：Spring 事务通过异常判断是否回滚
// 如果异常被捕获且不抛出，Spring 认为方法正常执行，会提交事务
// 解决方案：捕获异常后重新抛出，或手动标记回滚
```

### 场景 4：抛出非 RuntimeException

```java
@Service
public class UserService {
    
    // ❌ 错误：抛出 CheckedException，默认不回滚
    @Transactional
    public void method1() throws Exception {
        throw new Exception("业务异常");  // 事务不会回滚！
    }
    
    // ✅ 正确：指定 rollbackFor
    @Transactional(rollbackFor = Exception.class)
    public void method2() throws Exception {
        throw new Exception("业务异常");  // 事务会回滚
    }
    
    // ✅ 正确：抛出 RuntimeException
    @Transactional
    public void method3() {
        throw new RuntimeException("业务异常");  // 事务会回滚
    }
}

// 原因：Spring 默认只对 RuntimeException 和 Error 回滚
// CheckedException（如 Exception）不会回滚
// 解决方案：使用 rollbackFor = Exception.class
```

### 场景 5：数据库引擎不支持事务

```java
// ❌ 错误：MySQL 的 MyISAM 引擎不支持事务
// 即使加了 @Transactional，也不会生效

// ✅ 正确：使用 InnoDB 引擎
// 在创建表时指定引擎
// CREATE TABLE user (
//     id INT PRIMARY KEY,
//     name VARCHAR(50)
// ) ENGINE=InnoDB;

// 或者修改现有表的引擎
// ALTER TABLE user ENGINE=InnoDB;
```

### 场景 6：Bean 没有被 Spring 管理

```java
// ❌ 错误：类没有注册为 Bean
@Transactional
public class UserService {  // 没有 @Service 或 @Component！
    public void method() {
        // 事务不会生效！
    }
}

// ✅ 正确：注册为 Bean
@Service  // 或 @Component
@Transactional
public class UserService {
    public void method() {
        // 事务正常生效
    }
}
```

### 场景 7：多线程调用

```java
@Service
public class AsyncService {
    
    @Transactional
    public void methodA() {
        // 事务 A
        new Thread(() -> {
            // ❌ 错误：新线程不在同一个事务中
            methodB();  // 这个方法的事务和方法 A 无关
        }).start();
    }
    
    @Transactional
    public void methodB() {
        // 事务 B（独立的事务）
    }
}

// 原因：事务是通过 ThreadLocal 绑定的
// 新线程没有继承外层线程的事务上下文
// 解决方案：使用编程式事务管理，或避免在事务中使用多线程
```

### 场景 8：传播行为设置错误

```java
@Service
public class OuterService {
    
    @Transactional
    public void outerMethod() {
        // 外层事务
        innerService.innerMethod();
    }
}

@Service
public class InnerService {
    
    // ❌ 错误：使用 NOT_SUPPORTED，非事务执行
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void innerMethod() {
        // 这个方法不会在事务中执行！
        // 即使外层有事务
    }
    
    // ✅ 正确：使用 REQUIRED（默认）
    @Transactional
    public void innerMethod2() {
        // 加入外层事务
    }
}
```

---

## 8.5 对比表格

### 8.5.1 七种事务传播行为对比

| 传播行为 | 外层有事务 | 外层无事务 | 回滚影响 | 使用场景 |
|---------|-----------|-----------|---------|---------|
| REQUIRED | 加入外层 | 创建新事务 | 一起回滚 | 默认，大多数场景 |
| SUPPORTS | 加入外层 | 非事务执行 | 一起回滚 | 查询方法 |
| MANDATORY | 加入外层 | 抛异常 | 一起回滚 | 强制要求事务 |
| REQUIRES_NEW | 挂起外层 | 创建新事务 | 独立回滚 | 独立操作（如日志） |
| NOT_SUPPORTED | 挂起外层 | 非事务执行 | 不影响 | 不需要事务 |
| NEVER | 抛异常 | 非事务执行 | 无 | 禁止事务 |
| NESTED | 嵌套事务 | 创建新事务 | 部分回滚 | 部分操作可回滚 |

### 8.5.2 事务失效场景总结

| 失效场景 | 原因 | 解决方案 |
|---------|------|---------|
| 方法不是 public | AOP 只能代理 public 方法 | 改为 public |
| 同类方法调用 | this 调用不经过代理 | 使用 AopContext 或提取方法 |
| 异常被捕获 | Spring 检测不到异常 | 重新抛出异常 |
| 非 RuntimeException | 默认只对 RuntimeException 回滚 | 指定 rollbackFor |
| 数据库不支持 | MyISAM 不支持事务 | 使用 InnoDB |
| Bean 未注册 | Spring 不知道这个类 | 添加 @Service/@Component |
| 多线程 | ThreadLocal 不继承 | 避免事务中用多线程 |
| 传播行为错误 | 配置了不支持事务的传播行为 | 检查传播行为配置 |

### 8.5.3 事务隔离级别对比

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|---------|------|-----------|------|------|
| READ_UNCOMMITTED | 可能 | 可能 | 可能 | 最好 |
| READ_COMMITTED | 不会 | 可能 | 可能 | 较好 |
| REPEATABLE_READ | 不会 | 不会 | 可能 | 一般 |
| SERIALIZABLE | 不会 | 不会 | 不会 | 最差 |

---

## 8.6 新手常见误区

### 误区 1：@Transactional 加在类上，所有方法都有事务

```java
// ❌ 错误认知：类上加 @Transactional，所有方法都有事务
@Service
@Transactional
public class UserService {
    
    public void method1() {
        // 有事务
    }
    
    public void method2() {
        // 有事务
    }
    
    // 但实际上，只有 public 方法才有事务
    private void privateMethod() {
        // 没有事务！
    }
}

// 真相：@Transactional 加在类上，只是默认所有 public 方法都有事务
// 但可以通过方法级别的 @Transactional 覆盖类级别的配置
```

### 误区 2：事务范围越大越好

```java
// ❌ 错误认知：事务范围越大越安全
@Transactional
public void processAll() {
    // 1. 查询数据（不需要事务）
    List<User> users = userRepository.findAll();
    
    // 2. 处理数据（不需要事务）
    for (User user : users) {
        processUser(user);
    }
    
    // 3. 保存数据（需要事务）
    userRepository.saveAll(users);
}

// 问题：
// 1. 事务范围太大，长时间占用数据库连接
// 2. 查询和处理数据时也在事务中，浪费资源
// 3. 可能导致死锁

// ✅ 正确做法：缩小事务范围
public void processAll() {
    // 1. 查询数据（无事务）
    List<User> users = userRepository.findAll();
    
    // 2. 处理数据（无事务）
    for (User user : users) {
        processUser(user);
    }
    
    // 3. 保存数据（有事务）
    saveUsers(users);
}

@Transactional
public void saveUsers(List<User> users) {
    userRepository.saveAll(users);
}
```

### 误区 3：@Transactional 一定会创建数据库事务

```java
// ❌ 错误认知：加了 @Transactional 就一定有数据库事务
@Service
public class UserService {
    
    @Transactional
    public void method() {
        // 如果没有配置数据源，或者方法没有数据库操作
        // 事务实际上不会创建数据库事务
    }
}

// 真相：@Transactional 只是告诉 Spring 需要事务管理
// 如果方法中没有数据库操作，Spring 不会创建真正的数据库事务
// 事务是在第一次数据库操作时才真正开启的（延迟开启）
```

### 误区 4：事务回滚了，所有操作都会撤销

```java
// ❌ 错误认知：事务回滚会撤销所有操作
@Service
public class OrderService {
    
    @Transactional
    public void createOrder() {
        // 1. 保存订单
        orderRepository.save(order);
        
        // 2. 发送 HTTP 请求（不受事务控制！）
        httpClient.post("http://external-api.com/notify", data);
        
        // 3. 抛出异常，事务回滚
        throw new RuntimeException("失败");
    }
}

// 真相：事务只能回滚数据库操作
// HTTP 请求、文件操作、消息队列等外部操作无法回滚
// 解决方案：使用补偿机制或分布式事务
```

### 误区 5：NESTED 和 REQUIRES_NEW 是一样的

```java
// ❌ 错误认知：NESTED 和 REQUIRES_NEW 效果一样

// REQUIRES_NEW：
// - 总是创建新事务
// - 挂起外层事务
// - 新事务完全独立
// - 新事务回滚不影响外层

// NESTED：
// - 在外层事务中创建嵌套事务
// - 通过保存点实现
// - 嵌套事务回滚不影响外层
// - 但外层回滚会导致嵌套事务也回滚

// 示例：
@Service
public class OuterService {
    
    @Autowired
    private InnerService innerService;
    
    @Transactional
    public void outerMethod() {
        // 外层事务
        try {
            innerService.requiresNewMethod();  // 独立事务
        } catch (Exception e) {
            // 即使内层抛异常，外层可以继续
        }
        
        try {
            innerService.nestedMethod();  // 嵌套事务
        } catch (Exception e) {
            // 即使内层抛异常，外层可以继续
        }
        
        // 如果外层抛异常：
        // - requiresNewMethod 的数据已提交，不会回滚
        // - nestedMethod 的数据会回滚（因为外层回滚）
    }
}
```

---

## 8.7 动手练习

### 练习 1：验证事务回滚

**题目**：创建一个转账服务，从 A 账户转 1000 元到 B 账户。验证事务回滚机制：如果中间步骤失败，两个账户的余额都应该恢复原状。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义实体类
@Entity
public class Account {
    @Id
    private Long id;
    private String name;
    private BigDecimal balance;
    
    // getters and setters
}

// 2. 定义 Repository
@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
}

// 3. 定义服务
@Service
public class TransferService {
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Transactional(rollbackFor = Exception.class)
    public void transfer(Long fromId, Long toId, BigDecimal amount) throws Exception {
        // 1. 查询账户
        Account fromAccount = accountRepository.findById(fromId)
            .orElseThrow(() -> new Exception("账户不存在"));
        Account toAccount = accountRepository.findById(toId)
            .orElseThrow(() -> new Exception("账户不存在"));
        
        // 2. 检查余额
        if (fromAccount.getBalance().compareTo(amount) < 0) {
            throw new Exception("余额不足");
        }
        
        // 3. 扣款
        fromAccount.setBalance(fromAccount.getBalance().subtract(amount));
        accountRepository.save(fromAccount);
        
        // 4. 模拟异常（测试事务回滚）
        if (amount.compareTo(new BigDecimal("5000")) > 0) {
            throw new Exception("转账金额过大");
        }
        
        // 5. 加款
        toAccount.setBalance(toAccount.getBalance().add(amount));
        accountRepository.save(toAccount);
        
        System.out.println("转账成功");
    }
}

// 4. 测试代码
@SpringBootTest
public class TransferTest {
    
    @Autowired
    private TransferService transferService;
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Test
    public void testTransfer() {
        // 准备测试数据
        Account a = new Account();
        a.setName("A");
        a.setBalance(new BigDecimal("10000"));
        accountRepository.save(a);
        
        Account b = new Account();
        b.setName("B");
        b.setBalance(new BigDecimal("5000"));
        accountRepository.save(b);
        
        // 测试正常转账
        transferService.transfer(a.getId(), b.getId(), new BigDecimal("1000"));
        // A: 9000, B: 6000
        
        // 测试事务回滚
        try {
            transferService.transfer(a.getId(), b.getId(), new BigDecimal("6000"));
        } catch (Exception e) {
            System.out.println("捕获异常: " + e.getMessage());
        }
        // A: 9000, B: 6000（没有变化，因为事务回滚了）
    }
}
```

</details>

### 练习 2：验证事务传播行为

**题目**：创建外层服务和内层服务，验证 REQUIRES_NEW 和 NESTED 两种传播行为的区别。

<details>
<summary>点击查看答案</summary>

```java
// 1. 外层服务
@Service
public class OuterService {
    
    @Autowired
    private InnerService innerService;
    
    @Autowired
    private DataRepository dataRepository;
    
    @Transactional
    public void outerMethod() {
        System.out.println("外层方法开始");
        
        // 保存数据
        dataRepository.save(new Data("outer"));
        
        // 测试 REQUIRES_NEW
        try {
            innerService.requiresNewMethod();
        } catch (Exception e) {
            System.out.println("内层 REQUIRES_NEW 异常: " + e.getMessage());
        }
        
        // 测试 NESTED
        try {
            innerService.nestedMethod();
        } catch (Exception e) {
            System.out.println("内层 NESTED 异常: " + e.getMessage());
        }
        
        System.out.println("外层方法结束");
    }
}

// 2. 内层服务
@Service
public class InnerService {
    
    @Autowired
    private DataRepository dataRepository;
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void requiresNewMethod() throws Exception {
        System.out.println("REQUIRES_NEW 方法开始");
        dataRepository.save(new Data("requires_new"));
        throw new Exception("REQUIRES_NEW 失败");
    }
    
    @Transactional(propagation = Propagation.NESTED)
    public void nestedMethod() throws Exception {
        System.out.println("NESTED 方法开始");
        dataRepository.save(new Data("nested"));
        throw new Exception("NESTED 失败");
    }
}

// 3. 测试
@SpringBootTest
public class PropagationTest {
    
    @Autowired
    private OuterService outerService;
    
    @Autowired
    private DataRepository dataRepository;
    
    @Test
    public void testPropagation() {
        outerService.outerMethod();
        
        // 查询结果
        List<Data> dataList = dataRepository.findAll();
        for (Data data : dataList) {
            System.out.println("数据: " + data.getName());
        }
        
        // 结果：
        // outer（外层保存的）
        // requires_new（内层 REQUIRES_NEW 保存的，独立事务，已提交）
        // nested 没有（内层 NESTED 保存的，嵌套事务，已回滚）
    }
}
```

</details>

### 练习 3：解决 @Transactional 失效问题

**题目**：以下代码中 @Transactional 失效了，找出问题并修复。

```java
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // 问题 1
    @Transactional
    private void addUser(User user) {
        userRepository.save(user);
    }
    
    // 问题 2
    @Transactional
    public void updateUser(User user) {
        try {
            userRepository.save(user);
            throw new Exception("更新失败");
        } catch (Exception e) {
            System.out.println("异常: " + e.getMessage());
        }
    }
    
    // 问题 3
    public void processUser(User user) {
        this.addUser(user);
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // 修复 1：改为 public
    @Transactional
    public void addUser(User user) {
        userRepository.save(user);
    }
    
    // 修复 2：指定 rollbackFor，并重新抛出异常
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(User user) throws Exception {
        try {
            userRepository.save(user);
            throw new Exception("更新失败");
        } catch (Exception e) {
            System.out.println("异常: " + e.getMessage());
            throw e;  // 重新抛出异常，事务才会回滚
        }
    }
    
    // 修复 3：通过代理对象调用
    @Transactional
    public void processUser(User user) {
        UserService proxy = (UserService) AopContext.currentProxy();
        proxy.addUser(user);  // 通过代理调用，事务生效
    }
}

// 需要在配置类中启用 AopContext
@Configuration
@EnableAspectJAutoProxy(exposeProxy = true)
public class AopConfig {
}
```

**修复总结**：
1. 方法必须是 public
2. 异常必须抛出（或手动标记回滚）
3. 同类方法调用必须通过代理对象
4. CheckedException 需要指定 rollbackFor

</details>

---

## 8.8 下一章预告

恭喜你学完了 Spring 事务管理的底层原理！现在你已经理解了 @Transactional 的工作机制，知道了事务传播行为的区别，也掌握了 @Transactional 失效的 8 大场景。

到这里，Spring 原理深度解析教程就告一段落了。我们从依赖注入的底层实现，到循环依赖的三级缓存机制，再到 AOP 的代理原理，最后到事务管理的完整流程，系统地学习了 Spring 的核心原理。

但是，Spring 的世界远不止这些。接下来你可以继续学习：
- Spring MVC 的请求处理流程
- Spring Boot 的自动配置原理
- Spring Cloud 的微服务架构
- Spring Security 的安全机制

希望这个教程能帮助你更好地理解 Spring，在实际开发中更加游刃有余！
