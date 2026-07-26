---
title: "第11章：事务与一致性"
description: "多文档事务、ACID 保证、会话隔离级别"
---

# 第11章：事务与一致性

## 本章导读

### 新手常见疑问

1. **MongoDB 支持事务吗？不是说不支持吗？**
   - 听说 MongoDB 没有事务，这是真的吗？
   - 什么时候开始支持多文档事务的？

2. **什么是 ACID？MongoDB 能保证吗？**
   - 原子性、一致性、隔离性、持久性，MongoDB 都能做到吗？
   - 和 MySQL 的事务有什么区别？

3. **什么是会话（Session）？和事务有什么关系？**
   - 为什么使用事务必须创建会话？
   - 会话的作用是什么？

4. **事务会影响性能吗？什么时候该用事务？**
   - 是不是所有操作都应该放在事务里？
   - 事务的性能开销有多大？

---

## 为什么需要事务技术

### 痛点分析

在金融、电商等关键业务中，数据一致性至关重要：

**转账场景的问题：**
```
用户A给用户B转账100元：
1. 从A账户扣除100元 ✓
2. 向B账户增加100元 ✗（系统崩溃）

结果：A少了100元，B没收到，钱"消失"了
```

**没有事务的后果：**
- 部分操作成功，部分失败 → 数据不一致
- 并发操作互相干扰 → 脏读、幻读
- 系统故障后无法恢复 → 数据损坏

### 生活化类比

把事务想象成**银行柜台的业务流程**：

- **原子性（Atomicity）**：业务要么全部完成，要么全部取消
  - 转账：扣款和入账必须同时成功或失败
  - 不能只扣款不入账

- **一致性（Consistency）**：业务前后数据状态正确
  - 转账前：A有1000元，B有500元
  - 转账后：A有900元，B有600元
  - 总金额不变

- **隔离性（Isolation）**：多个业务互不干扰
  - A给B转账的同时，C给D转账
  - 两笔业务独立进行，不会互相影响

- **持久性（Durability）**：业务完成后数据永久保存
  - 转账成功后，即使系统崩溃，数据也不会丢失

### 代码对比

**❌ 没有事务的操作：**

```javascript
// 转账操作：从A账户转100元到B账户
const accounts = db.collection('accounts');

// 步骤1：扣除A账户
await accounts.updateOne(
  { userId: 'A' },
  { $inc: { balance: -100 } }
);

// 问题：如果这里系统崩溃，B账户不会收到钱
// 结果：A少了100元，B没收到，数据不一致

// 步骤2：增加B账户
await accounts.updateOne(
  { userId: 'B' },
  { $inc: { balance: 100 } }
);
```

**✅ 使用事务的操作：**

```javascript
// 使用事务保证原子性
const session = client.startSession();

try {
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  });

  const accounts = client.db('bank').collection('accounts');

  // 步骤1：扣除A账户
  await accounts.updateOne(
    { userId: 'A' },
    { $inc: { balance: -100 } },
    { session }
  );

  // 步骤2：增加B账户
  await accounts.updateOne(
    { userId: 'B' },
    { $inc: { balance: 100 } },
    { session }
  );

  // 提交事务（两步操作同时生效）
  await session.commitTransaction();
  console.log('转账成功');

} catch (error) {
  // 任何错误都会回滚事务
  await session.abortTransaction();
  console.log('转账失败，已回滚');
  throw error;
} finally {
  session.endSession();
}
```

---

## 核心原理讲解

### MongoDB 事务发展历程

| 版本 | 事务支持 | 说明 |
|------|----------|------|
| **MongoDB 4.0之前** | 仅单文档事务 | 单个文档的更新是原子的 |
| **MongoDB 4.0** | 多文档事务（副本集） | 支持副本集环境的多文档事务 |
| **MongoDB 4.2** | 多文档事务（分片集群） | 支持分片集群环境的多文档事务 |
| **MongoDB 5.0** | 事务优化 | 性能提升，限制放宽 |

**关键概念：**
- **单文档原子性**：单个文档的更新操作是原子的（始终支持）
- **多文档事务**：多个文档的多个操作作为一个整体（4.0+）

### ACID 在 MongoDB 中的实现

**原子性（Atomicity）：**
```javascript
// ✅ 单文档原子性（始终支持）
db.users.updateOne(
  { userId: 1 },
  { $set: { name: 'Alice' }, $inc: { age: 1 } }
);
// 两个操作要么都成功，要么都失败

// ✅ 多文档原子性（事务支持）
session.startTransaction();
await collection1.updateOne(...);
await collection2.insertOne(...);
await session.commitTransaction();
// 两个操作作为一个整体提交
```

**一致性（Consistency）：**
```javascript
// 通过验证规则保证数据一致性
db.createCollection("accounts", {
  validator: {
    $jsonSchema: {
      properties: {
        balance: { bsonType: "number", minimum: 0 }
      }
    }
  }
});

// 如果违反规则，操作会失败
// 事务也会回滚，保证数据一致性
```

**隔离性（Isolation）：**
```javascript
// 通过会话和隔离级别控制
session.startTransaction({
  readConcern: { level: 'snapshot' }  // 快照隔离
});

// 事务中的操作与其他操作隔离
// 其他会话看不到事务中间状态
```

**持久性（Durability）：**
```javascript
// 通过 Write Concern 控制
session.startTransaction({
  writeConcern: { w: 'majority' }  // 多数节点确认
});

// 事务提交后，数据永久保存
// 即使系统崩溃，也能恢复
```

### 会话（Session）概念

**会话的作用：**
1. **跟踪事务**：标识一个事务的所有操作
2. **因果一致性**：保证读到自己写的数据
3. **资源管理**：管理事务的生命周期

**会话类型：**

```javascript
// 1. 显式会话（用于事务）
const session = client.startSession();
session.startTransaction();
// ... 操作 ...
await session.commitTransaction();
session.endSession();

// 2. 隐式会话（用于因果一致性）
const session = client.startSession();
// 不使用事务，但保证因果一致性
await collection.insertOne({ data: 'test' }, { session });
const result = await collection.findOne({}, { session });
session.endSession();
```

**对比表格：显式会话 vs 隐式会话**

| 特性 | 显式会话 | 隐式会话 |
|------|----------|----------|
| **事务支持** | 支持 | 不支持 |
| **因果一致性** | 支持 | 支持 |
| **生命周期** | 手动管理 | 自动管理 |
| **使用场景** | 多文档事务 | 单次操作、因果一致性 |

### 隔离级别

MongoDB 支持两种隔离级别：

**1. Read Committed（读已提交）**

```javascript
session.startTransaction({
  readConcern: { level: 'readCommitted' }
});

// 只能读取其他事务已提交的数据
// 避免脏读，但可能有不可重复读和幻读
```

**2. Snapshot（快照隔离）**

```javascript
session.startTransaction({
  readConcern: { level: 'snapshot' }
});

// 读取事务开始时的数据快照
// 避免脏读、不可重复读、幻读
// 默认隔离级别（推荐）
```

**对比表格：隔离级别**

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|----------|------|------------|------|------|
| **Read Committed** | 避免 | 可能 | 可能 | 较高 |
| **Snapshot** | 避免 | 避免 | 避免 | 较低 |

---

## 基础用法与实战

### 1. Node.js 事务示例

**完整的转账事务：**

```javascript
const { MongoClient } = require('mongodb');

async function transferMoney(fromUser, toUser, amount) {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('bank');
    const accounts = db.collection('accounts');
    
    // 创建会话
    const session = client.startSession();
    
    try {
      // 开始事务
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
      
      // 步骤1：检查余额
      const fromAccount = await accounts.findOne(
        { userId: fromUser },
        { session }
      );
      
      if (!fromAccount || fromAccount.balance < amount) {
        throw new Error('余额不足');
      }
      
      // 步骤2：扣除金额
      await accounts.updateOne(
        { userId: fromUser },
        { $inc: { balance: -amount } },
        { session }
      );
      
      // 步骤3：增加金额
      await accounts.updateOne(
        { userId: toUser },
        { $inc: { balance: amount } },
        { session }
      );
      
      // 提交事务
      await session.commitTransaction();
      console.log(`转账成功：${fromUser} -> ${toUser} ${amount}元`);
      
    } catch (error) {
      // 回滚事务
      await session.abortTransaction();
      console.error('转账失败:', error.message);
      throw error;
    } finally {
      // 结束会话
      session.endSession();
    }
    
  } finally {
    await client.close();
  }
}

// 使用示例
transferMoney('A', 'B', 100)
  .then(() => console.log('完成'))
  .catch(err => console.error('错误:', err));
```

### 2. Java 事务示例

**使用 MongoDB Java Driver：**

```java
import com.mongodb.client.*;
import com.mongodb.client.model.*;
import org.bson.Document;

public class TransactionExample {
    public static void main(String[] args) {
        MongoClient client = MongoClients.create("mongodb://localhost:27017");
        MongoDatabase database = client.getDatabase("bank");
        MongoCollection<Document> collection = database.getCollection("accounts");
        
        // 创建会话
        try (ClientSession session = client.startSession()) {
            // 开始事务
            TransactionOptions txnOptions = TransactionOptions.builder()
                .readConcern(ReadConcern.SNAPSHOT)
                .writeConcern(WriteConcern.MAJORITY)
                .build();
            
            session.startTransaction(txnOptions);
            
            try {
                // 步骤1：扣除A账户
                collection.updateOne(
                    session,
                    Filters.eq("userId", "A"),
                    Updates.inc("balance", -100)
                );
                
                // 步骤2：增加B账户
                collection.updateOne(
                    session,
                    Filters.eq("userId", "B"),
                    Updates.inc("balance", 100)
                );
                
                // 提交事务
                session.commitTransaction();
                System.out.println("转账成功");
                
            } catch (Exception e) {
                // 回滚事务
                session.abortTransaction();
                System.err.println("转账失败: " + e.getMessage());
                throw e;
            }
        }
        
        client.close();
    }
}
```

### 3. Python 事务示例

**使用 PyMongo：**

```python
from pymongo import MongoClient, WriteConcern, ReadConcern

def transfer_money(from_user, to_user, amount):
    client = MongoClient('mongodb://localhost:27017')
    db = client['bank']
    accounts = db['accounts']
    
    # 创建会话
    with client.start_session() as session:
        # 开始事务
        with session.start_transaction(
            read_concern=ReadConcern.SNAPSHOT,
            write_concern=WriteConcern(w="majority")
        ):
            try:
                # 步骤1：扣除A账户
                accounts.update_one(
                    {"userId": from_user},
                    {"$inc": {"balance": -amount}},
                    session=session
                )
                
                # 步骤2：增加B账户
                accounts.update_one(
                    {"userId": to_user},
                    {"$inc": {"balance": amount}},
                    session=session
                )
                
                # 提交事务（自动）
                print(f"转账成功：{from_user} -> {to_user} {amount}元")
                
            except Exception as e:
                # 回滚事务（自动）
                print(f"转账失败: {e}")
                raise

# 使用示例
transfer_money('A', 'B', 100)
```

### 4. 事务重试机制

**处理事务冲突：**

```javascript
async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.hasErrorLabel('UnknownTransactionCommitResult')) {
        // 提交结果未知，可以重试
        console.log('事务提交结果未知，重试...');
        continue;
      } else if (error.hasErrorLabel('TransientTransactionError')) {
        // 临时性错误，可以重试
        console.log('临时性错误，重试...');
        continue;
      } else {
        // 其他错误，不重试
        throw error;
      }
    }
  }
  throw new Error('事务重试次数超限');
}

// 使用示例
await withRetry(async () => {
  await transferMoney('A', 'B', 100);
});
```

**对比表格：事务错误类型**

| 错误类型 | 说明 | 是否重试 |
|----------|------|----------|
| **UnknownTransactionCommitResult** | 提交结果未知 | 是 |
| **TransientTransactionError** | 临时性错误（如写冲突） | 是 |
| **其他错误** | 业务逻辑错误、验证失败等 | 否 |

---

## 新手常见误区

### 误区1：认为所有操作都需要事务

**错误理解：**
"为了保证一致性，所有操作都应该放在事务里"

**实际情况：**
- 事务有性能开销（约10-20%）
- 单文档操作本身就是原子的，不需要事务
- 只有多文档、多步骤操作才需要事务

**正确做法：**
```javascript
// ❌ 不需要事务：单文档操作
const session = client.startSession();
session.startTransaction();
await collection.updateOne({ _id: 1 }, { $set: { name: 'Alice' } }, { session });
await session.commitTransaction();

// ✅ 不需要事务：单文档操作
await collection.updateOne({ _id: 1 }, { $set: { name: 'Alice' } });

// ✅ 需要事务：多文档操作
session.startTransaction();
await accounts.updateOne({ userId: 'A' }, { $inc: { balance: -100 } }, { session });
await accounts.updateOne({ userId: 'B' }, { $inc: { balance: 100 } }, { session });
await session.commitTransaction();
```

### 误区2：认为事务可以解决所有并发问题

**错误理解：**
"有了事务，就不用担心并发问题了"

**实际情况：**
- 事务只能保证 ACID，不能解决所有并发问题
- 长事务会导致锁竞争，降低并发性能
- 需要合理设计事务的范围和时长

**正确做法：**
```javascript
// ❌ 错误：事务太长
session.startTransaction();
await operation1();  // 1秒
await operation2();  // 2秒
await operation3();  // 3秒
// 事务持续6秒，锁竞争严重

// ✅ 正确：事务尽量短
session.startTransaction();
await criticalOperation1();  // 只包含必要的操作
await criticalOperation2();
// 事务持续1-2秒
```

### 误区3：忽略事务的性能影响

**错误理解：**
"事务不会影响性能"

**实际情况：**
- 事务需要维护会话状态、锁、日志等
- 性能开销约10-20%
- 在高并发场景下，开销更明显

**正确做法：**
```javascript
// ✅ 只在必要时使用事务
// 场景1：转账（必须用事务）
// 场景2：订单创建（可以用事务，也可以用补偿机制）
// 场景3：简单的数据更新（不需要事务）

// ✅ 优化事务性能
session.startTransaction({
  readConcern: { level: 'readCommitted' },  // 降低隔离级别
  writeConcern: { w: 1 }  // 降低写入确认
});
```

### 误区4：认为事务可以跨分片自动工作

**错误理解：**
"分片集群中的事务和副本集一样"

**实际情况：**
- 分片集群的事务需要 MongoDB 4.2+
- 跨分片事务性能更差
- 需要确保所有分片都支持事务

**正确做法：**
```javascript
// ✅ 检查分片集群版本
db.version();  // 需要 4.2+

// ✅ 尽量减少跨分片事务
// 如果可能，将相关数据放在同一个分片

// ✅ 监控事务性能
db.adminCommand({ getTransactionMetrics: 1 });
```

### 误区5：认为事务提交后就万无一失了

**错误理解：**
"事务提交成功，数据就一定正确了"

**实际情况：**
- 事务提交成功只保证操作成功
- 不保证业务逻辑正确
- 需要应用层验证数据一致性

**正确做法：**
```javascript
// ✅ 事务提交后验证
session.startTransaction();
await accounts.updateOne({ userId: 'A' }, { $inc: { balance: -100 } }, { session });
await accounts.updateOne({ userId: 'B' }, { $inc: { balance: 100 } }, { session });
await session.commitTransaction();

// 验证数据一致性
const totalBalance = await accounts.aggregate([
  { $group: { _id: null, total: { $sum: '$balance' } } }
]).toArray();

if (totalBalance[0].total !== expectedTotal) {
  console.error('数据不一致！');
}
```

---

## 动手练习

### 练习1：实现转账事务

**任务：**
使用 Node.js 实现一个完整的转账事务，包括余额检查、扣款、入账、错误处理。

**要求：**
1. 创建两个用户账户
2. 实现转账函数，使用事务
3. 测试正常转账和余额不足的情况
4. 验证事务的原子性

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function setup() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  
  const db = client.db('bank');
  const accounts = db.collection('accounts');
  
  // 清空数据
  await accounts.deleteMany({});
  
  // 创建测试账户
  await accounts.insertMany([
    { userId: 'A', name: 'Alice', balance: 1000 },
    { userId: 'B', name: 'Bob', balance: 500 }
  ]);
  
  console.log('初始账户状态:');
  console.log(await accounts.find({}).toArray());
  
  await client.close();
}

async function transfer(fromUser, toUser, amount) {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('bank');
    const accounts = db.collection('accounts');
    
    const session = client.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
      
      // 检查余额
      const fromAccount = await accounts.findOne(
        { userId: fromUser },
        { session }
      );
      
      if (!fromAccount) {
        throw new Error('转出账户不存在');
      }
      
      if (fromAccount.balance < amount) {
        throw new Error('余额不足');
      }
      
      // 扣除金额
      await accounts.updateOne(
        { userId: fromUser },
        { $inc: { balance: -amount } },
        { session }
      );
      
      // 增加金额
      await accounts.updateOne(
        { userId: toUser },
        { $inc: { balance: amount } },
        { session }
      );
      
      await session.commitTransaction();
      console.log(`\n转账成功：${fromUser} -> ${toUser} ${amount}元`);
      
    } catch (error) {
      await session.abortTransaction();
      console.error(`\n转账失败: ${error.message}`);
    } finally {
      session.endSession();
    }
    
    // 验证结果
    console.log('\n转账后账户状态:');
    console.log(await accounts.find({}).toArray());
    
  } finally {
    await client.close();
  }
}

// 测试
async function test() {
  await setup();
  
  // 测试1：正常转账
  console.log('\n=== 测试1：正常转账 ===');
  await transfer('A', 'B', 200);
  
  // 测试2：余额不足
  console.log('\n=== 测试2：余额不足 ===');
  await transfer('A', 'B', 2000);
  
  // 测试3：连续转账
  console.log('\n=== 测试3：连续转账 ===');
  await transfer('A', 'B', 100);
  await transfer('B', 'A', 50);
}

test().catch(console.error);
```

</details>

### 练习2：实现订单创建事务

**任务：**
实现一个电商订单创建事务，包括：创建订单、扣减库存、创建支付记录。

**要求：**
1. 三个操作必须原子性完成
2. 如果库存不足，整个事务回滚
3. 验证事务的原子性

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function createOrder(userId, productId, quantity) {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('shop');
    
    const orders = db.collection('orders');
    const products = db.collection('products');
    const payments = db.collection('payments');
    
    const session = client.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
      
      // 步骤1：检查库存
      const product = await products.findOne(
        { _id: productId },
        { session }
      );
      
      if (!product) {
        throw new Error('商品不存在');
      }
      
      if (product.stock < quantity) {
        throw new Error('库存不足');
      }
      
      // 步骤2：创建订单
      const order = {
        userId,
        productId,
        quantity,
        totalAmount: product.price * quantity,
        status: 'pending',
        createdAt: new Date()
      };
      
      const orderResult = await orders.insertOne(order, { session });
      
      // 步骤3：扣减库存
      await products.updateOne(
        { _id: productId },
        { $inc: { stock: -quantity } },
        { session }
      );
      
      // 步骤4：创建支付记录
      const payment = {
        orderId: orderResult.insertedId,
        userId,
        amount: order.totalAmount,
        status: 'unpaid',
        createdAt: new Date()
      };
      
      await payments.insertOne(payment, { session });
      
      await session.commitTransaction();
      console.log('订单创建成功');
      console.log('订单ID:', orderResult.insertedId);
      
    } catch (error) {
      await session.abortTransaction();
      console.error('订单创建失败:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
    
  } finally {
    await client.close();
  }
}

// 测试
async function test() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  
  const db = client.db('shop');
  
  // 准备测试数据
  await db.collection('products').deleteMany({});
  await db.collection('products').insertOne({
    _id: 'product1',
    name: 'iPhone 15',
    price: 5999,
    stock: 10
  });
  
  await client.close();
  
  // 测试1：正常创建订单
  console.log('\n=== 测试1：正常创建订单 ===');
  await createOrder('user1', 'product1', 2);
  
  // 测试2：库存不足
  console.log('\n=== 测试2：库存不足 ===');
  try {
    await createOrder('user2', 'product1', 100);
  } catch (error) {
    console.log('预期错误:', error.message);
  }
  
  // 验证结果
  const client2 = new MongoClient('mongodb://localhost:27017');
  await client2.connect();
  const db2 = client2.db('shop');
  
  console.log('\n=== 最终状态 ===');
  console.log('商品库存:', await db2.collection('products').findOne({ _id: 'product1' }));
  console.log('订单数量:', await db2.collection('orders').countDocuments({}));
  console.log('支付记录:', await db2.collection('payments').countDocuments({}));
  
  await client2.close();
}

test().catch(console.error);
```

</details>

### 练习3：对比事务前后性能

**任务：**
测试使用事务和不使用事务的性能差异，理解事务的性能开销。

**要求：**
1. 插入1000条数据，分别使用事务和不使用事务
2. 记录执行时间
3. 对比性能差异

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function benchmark() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('test');
    const collection = db.collection('benchmark');
    
    // 清空数据
    await collection.deleteMany({});
    
    // 测试1：不使用事务
    console.log('=== 测试1：不使用事务 ===');
    const start1 = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      await collection.insertOne({
        index: i,
        data: `Data ${i}`,
        timestamp: new Date()
      });
    }
    
    const time1 = Date.now() - start1;
    console.log(`不使用事务: ${time1}ms`);
    
    // 清空数据
    await collection.deleteMany({});
    
    // 测试2：使用事务（每条插入单独事务）
    console.log('\n=== 测试2：使用事务 ===');
    const start2 = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      const session = client.startSession();
      
      try {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 1 }
        });
        
        await collection.insertOne(
          {
            index: i,
            data: `Data ${i}`,
            timestamp: new Date()
          },
          { session }
        );
        
        await session.commitTransaction();
      } finally {
        session.endSession();
      }
    }
    
    const time2 = Date.now() - start2;
    console.log(`使用事务: ${time2}ms`);
    
    // 性能对比
    console.log('\n=== 性能对比 ===');
    console.log(`事务开销: ${time2 - time1}ms`);
    console.log(`性能下降: ${((time2 / time1 - 1) * 100).toFixed(2)}%`);
    
  } finally {
    await client.close();
  }
}

benchmark().catch(console.error);
```

**预期结果：**
- 使用事务的性能比不使用事务慢 10-30%
- 事务开销主要来自：会话管理、锁、日志记录
- 在高并发场景下，开销会更明显

</details>

---

## 下一章预告

恭喜你完成了第11章的学习！现在你已经掌握了 MongoDB 事务的核心概念，包括：

- MongoDB 事务的发展历程
- ACID 在 MongoDB 中的实现
- 会话（Session）和隔离级别
- 事务代码示例（Node.js/Java/Python）
- 何时使用事务

**下一章我们将学习：性能优化**

如何让你的 MongoDB 跑得更快？我们将学习：

- 查询优化：explain 分析、查询计划
- 索引策略：覆盖查询、索引选择
- 内存管理：WiredTiger 缓存
- 性能监控工具
- 慢查询分析
- 写入优化

敬请期待第12章：性能优化！
