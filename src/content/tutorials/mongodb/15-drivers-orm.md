---
title: "第15章：驱动与 ORM"
description: "Node.js 驱动、Mongoose、Spring Data MongoDB"
---

# 第15章：驱动与 ORM

## 本章导读

在学习驱动与 ORM 之前，你可能会有这些疑问：

1. **什么是驱动？什么是 ORM？** 它们有什么区别？
2. **为什么需要 Mongoose？** 直接用官方驱动不行吗？
3. **Java 项目应该用什么？** Spring Data MongoDB 好用吗？
4. **这么多驱动，我应该学哪个？** 怎么选？

这些疑问很正常。MongoDB 支持几十种编程语言的驱动，每种语言还有不同的 ORM/ODM 工具，确实让人眼花缭乱。本章将帮你理清思路，掌握最常用的工具。

## 为什么需要驱动与 ORM

### 痛点分析

想象这些场景：

- 你想在 Node.js 中连接 MongoDB，但原生 API 太底层
- 每次操作都要手动验证数据类型，容易出错
- 多个地方重复写相同的查询逻辑
- 团队协作时，数据结构不统一，Bug 频出

### 生活化类比

把 MongoDB 驱动想象成翻译官：

- **官方驱动** = 直译员（忠实原文，但不够灵活）
- **Mongoose** = 同声传译 + 秘书（翻译 + 整理文档 + 提醒事项）
- **Spring Data MongoDB** = 翻译官 + 管家（翻译 + 帮你管理一切）

### 代码对比

**直接使用官方驱动：**
```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('myapp');

// 手动构造查询对象
const users = await db.collection('users').find({
  age: { $gt: 18 },
  status: 'active'
}).toArray();

// 没有类型验证，容易出错 ❌
await db.collection('users').insertOne({
  name: 'Tom',
  age: 'twenty'  // ❌ 字符串而不是数字，不会报错
});
```

**使用 Mongoose：**
```javascript
const mongoose = require('mongoose');

// 定义数据结构，自动验证类型
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },  // ✅ 类型验证
  status: { type: String, default: 'active' }
});

const User = mongoose.model('User', userSchema);

// 简洁的查询 API
const users = await User.find({ age: { $gt: 18 }, status: 'active' });

// 类型验证
await User.create({ name: 'Tom', age: 'twenty' });
// ❌ 报错：Cast to Number failed for value "twenty"
```

## 核心原理讲解

### 驱动 vs ORM vs ODM

| 概念 | 全称 | 作用 | 类比 |
|------|------|------|------|
| 驱动 | Driver | 连接数据库的底层接口 | 电话线 |
| ORM | Object-Relational Mapping | 关系型数据库的对象映射 | 翻译官 |
| ODM | Object-Document Mapping | 文档型数据库的对象映射 | 翻译官 + 秘书 |

### 各语言主流工具

| 语言 | 官方驱动 | ORM/ODM | 特点 |
|------|---------|---------|------|
| Node.js | mongodb | Mongoose | 最流行 |
| Java | mongodb-driver | Spring Data MongoDB | 企业级 |
| Python | pymongo | MongoEngine | 简洁 |
| C# | MongoDB.Driver | MongoDB.Entities | 强类型 |
| Go | mongo-go-driver | - | 轻量 |

## 基础用法

### 1. Node.js 官方驱动

#### 安装

```bash
npm install mongodb
```

#### 基本使用

```javascript
const { MongoClient } = require('mongodb');

// 连接字符串
const uri = 'mongodb://localhost:27017';

// 创建客户端
const client = new MongoClient(uri);

async function run() {
  try {
    // 连接数据库
    await client.connect();
    console.log('连接成功 ✅');

    // 选择数据库
    const db = client.db('myapp');

    // 选择集合
    const users = db.collection('users');

    // 插入文档
    const result = await users.insertOne({
      name: '张三',
      age: 25,
      email: 'zhangsan@example.com'
    });
    console.log('插入ID:', result.insertedId);

    // 查询文档
    const user = await users.findOne({ name: '张三' });
    console.log('查询结果:', user);

    // 更新文档
    await users.updateOne(
      { name: '张三' },
      { $set: { age: 26 } }
    );

    // 删除文档
    await users.deleteOne({ name: '张三' });

  } catch (err) {
    console.error('操作失败:', err);
  } finally {
    // 关闭连接
    await client.close();
  }
}

run();

// 错误示例：忘记关闭连接
async function bad() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('myapp');
  await db.collection('users').find({}).toArray();
  // ❌ 没有调用 client.close()，连接泄漏
}
```

#### 批量操作

```javascript
const { MongoClient } = require('mongodb');

async function bulkOps() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('myapp');
  const users = db.collection('users');

  // 批量插入
  const insertResult = await users.insertMany([
    { name: '张三', age: 25 },
    { name: '李四', age: 30 },
    { name: '王五', age: 28 }
  ]);
  console.log('插入数量:', insertResult.insertedCount);

  // 批量操作（有序）
  const bulkResult = await users.bulkWrite([
    { insertOne: { document: { name: '赵六', age: 22 } } },
    { updateOne: {
      filter: { name: '张三' },
      update: { $set: { age: 26 } }
    }},
    { deleteOne: { filter: { name: '王五' } } }
  ]);
  console.log('批量操作结果:', bulkResult);

  await client.close();
}

bulkOps();
```

### 2. Mongoose ODM

#### 安装

```bash
npm install mongoose
```

#### Schema 定义

```javascript
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/myapp');

// 定义 Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '姓名不能为空'],  // ✅ 自定义错误信息
    trim: true,                         // ✅ 自动去除空格
    minlength: [2, '姓名至少2个字符']
  },
  age: {
    type: Number,
    min: [0, '年龄不能为负数'],
    max: [150, '年龄不能超过150'],
    validate: {
      validator: (v) => v >= 0 && v <= 150,
      message: '年龄必须在0-150之间'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,       // ✅ 唯一索引
    lowercase: true,    // ✅ 自动转小写
    match: [/^\S+@\S+\.\S+$/, '邮箱格式不正确']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'editor'],  // ✅ 枚举限制
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 错误示例：Schema 定义后修改无效
const User = mongoose.model('User', userSchema);
// ❌ 下面这行无效，Schema 已经编译
userSchema.add({ phone: String });
```

#### Model 与文档操作

```javascript
const mongoose = require('mongoose');

// 创建 Model
const User = mongoose.model('User', userSchema);

// 创建文档（方式1）
const user1 = new User({
  name: '张三',
  age: 25,
  email: 'zhangsan@example.com'
});
await user1.save();

// 创建文档（方式2）
const user2 = await User.create({
  name: '李四',
  age: 30,
  email: 'lisi@example.com'
});

// 创建文档（方式3）
const user3 = await User.insertMany([
  { name: '王五', age: 28, email: 'wangwu@example.com' },
  { name: '赵六', age: 22, email: 'zhaoliu@example.com' }
]);

// 查询文档
const allUsers = await User.find({});               // 查询所有
const adminUsers = await User.find({ role: 'admin' }); // 条件查询
const oneUser = await User.findOne({ name: '张三' });  // 查询单个
const byId = await User.findById('64a1b2c3d4e5f6g7h8i9j0k1');

// 更新文档
await User.updateOne(
  { name: '张三' },
  { age: 26 }
);

await User.findByIdAndUpdate('64a1b2c3d4e5f6g7h8i9j0k1', {
  age: 27
});

// 删除文档
await User.deleteOne({ name: '张三' });
await User.findByIdAndDelete('64a1b2c3d4e5f6g7h8i9j0k1');

// 链式查询
const result = await User.find({ role: 'user' })
  .sort({ age: -1 })          // 按年龄降序
  .skip(0)                    // 跳过0条
  .limit(10)                  // 限制10条
  .select('name email age')   // 只返回指定字段
  .exec();
```

#### Mongoose 中间件（pre/post hooks）

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// pre save 钩子：保存前加密密码
userSchema.pre('save', async function(next) {
  // 只在密码被修改时加密
  if (!this.isModified('password')) return next();

  // 加密密码
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// post save 钩子：保存后发送欢迎邮件
userSchema.post('save', function(doc) {
  console.log(`新用户 ${doc.name} 注册成功，发送欢迎邮件`);
  // sendWelcomeEmail(doc.email);
});

// pre find 钩子：查询前自动过滤软删除
userSchema.pre('find', function(next) {
  this.where({ deleted: false });
  next();
});

// pre remove 钩子：删除前记录日志
userSchema.pre('remove', async function(next) {
  console.log(`用户 ${this.name} 即将被删除`);
  // 记录到审计日志
  next();
});

const User = mongoose.model('User', userSchema);

// 使用
const user = await User.create({
  name: '张三',
  email: 'zhangsan@example.com',
  password: '123456'  // 保存前会自动加密 ✅
});
console.log(user.password);  // 已经是加密后的值
```

#### 虚拟字段与插件

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String  // 不返回给前端
});

// 虚拟字段：不存储在数据库中，动态计算
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('fullName').set(function(name) {
  const parts = name.split(' ');
  this.firstName = parts[0];
  this.lastName = parts[1];
});

// toJSON 时包含虚拟字段
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// 移除密码字段
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;  // ✅ 不返回密码
    return ret;
  }
});

// 插件：可复用的逻辑
const timestampPlugin = (schema) => {
  schema.add({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  schema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
};

// 使用插件
userSchema.plugin(timestampPlugin);

const User = mongoose.model('User', userSchema);

// 使用虚拟字段
const user = new User({ firstName: '张', lastName: '三' });
console.log(user.fullName);  // 输出: "张三" ✅

user.fullName = '李 四';
console.log(user.firstName);  // 输出: "李" ✅
console.log(user.lastName);   // 输出: "四" ✅
```

### 3. Spring Data MongoDB（Java）

#### Maven 依赖

```xml
<!-- pom.xml -->
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
  </dependency>
</dependencies>
```

#### 配置文件

```yaml
# application.yml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/myapp
      # 或者分开配置
      # host: localhost
      # port: 27017
      # database: myapp
```

#### 实体类

```java
// User.java
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "users")  // 指定集合名
public class User {

    @Id
    private String id;           // MongoDB 的 _id 字段

    @Field("name")
    private String name;

    @Field("age")
    private Integer age;

    @Field("email")
    private String email;

    // 构造方法
    public User() {}

    public User(String name, Integer age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    // Getter 和 Setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

#### Repository 模式

```java
// UserRepository.java
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {

    // 方法名查询（自动生成查询语句）
    List<User> findByName(String name);

    List<User> findByAgeGreaterThan(Integer age);

    List<User> findByAgeBetween(Integer min, Integer max);

    User findByEmail(String email);

    // 自定义查询
    @Query("{ 'role': 'admin' }")
    List<User> findAdmins();

    @Query("{ 'age': { $gt: ?0 } }")
    List<User> findByAgeGreaterThanCustom(Integer age);
}
```

#### Service 层

```java
// UserService.java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    // 使用 Repository
    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public void deleteById(String id) {
        userRepository.deleteById(id);
    }

    // 使用 MongoTemplate（更灵活）
    public List<User> findByAgeRange(int min, int max) {
        Query query = new Query();
        query.addCriteria(Criteria.where("age").gte(min).lte(max));
        return mongoTemplate.find(query, User.class);
    }

    public User updateAge(String id, int newAge) {
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update().set("age", newAge);
        return mongoTemplate.findAndModify(query, update, User.class);
    }

    // 聚合查询
    public List<User> findActiveUsers() {
        return mongoTemplate.find(
            new Query(Criteria.where("status").is("active")),
            User.class
        );
    }
}
```

#### Controller 层

```java
// UserController.java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public User create(@RequestBody User user) {
        return userService.save(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```

## 对比表格

### 不同驱动/ORM 特点对比

| 特性 | Node.js 驱动 | Mongoose | Spring Data MongoDB |
|------|-------------|----------|-------------------|
| 类型验证 | 无 | 有（Schema） | 有（注解） |
| 学习曲线 | 低 | 中 | 中 |
| 灵活性 | 高 | 中 | 中 |
| 性能 | 高 | 中（有开销） | 高 |
| 中间件 | 无 | 有（pre/post） | 有（事件） |
| 事务支持 | 有 | 有 | 有 |
| 适用场景 | 轻量应用 | 中型应用 | 企业级应用 |
| 社区生态 | 好 | 最好 | 好 |

### Mongoose vs 官方驱动

| 功能 | 官方驱动 (mongodb) | Mongoose |
|------|-------------------|----------|
| Schema 定义 | 无 | 有 ✅ |
| 类型验证 | 手动 | 自动 ✅ |
| 中间件 | 无 | pre/post hooks ✅ |
| 虚拟字段 | 无 | 有 ✅ |
| 插件系统 | 无 | 有 ✅ |
| 填充引用 | 手动 | populate() ✅ |
| 性能 | 快 | 稍慢（有开销） |
| 包大小 | 小 | 大 |

## 新手常见误区

### 误区 1：Mongoose 是 MongoDB 官方产品

**错误认识：** "Mongoose 是 MongoDB 官方出的。"

**正确理解：** 
- Mongoose 是第三方库，由 Automattic 公司维护
- 官方驱动是 `mongodb` 包
- Mongoose 基于官方驱动封装

### 误区 2：ORM/ODM 会严重影响性能

**错误认识：** "用 Mongoose 会很慢，应该直接用官方驱动。"

**正确理解：** 
- Mongoose 的性能开销通常在 10% 以内
- 对于大多数应用，开发效率比性能更重要
- 只有在极端性能要求下才考虑去掉 ODM

### 误区 3：Schema 限制了 MongoDB 的灵活性

**错误认识：** "MongoDB 是 NoSQL，不需要 Schema。"

**正确理解：** 
- MongoDB 本身不强制 Schema
- 但在应用层定义 Schema 有很多好处：
  - 类型安全
  - 数据验证
  - 代码可读性
  - 团队协作

### 误区 4：Spring Data MongoDB 只能用于 Spring Boot

**错误认识：** "只有 Spring Boot 项目才能用 Spring Data MongoDB。"

**正确理解：** 
- Spring Data MongoDB 可以用于任何 Spring 项目
- 但配合 Spring Boot 使用最方便（自动配置）

### 误区 5：不同语言的驱动功能完全一致

**错误认识：** "Node.js 驱动和 Java 驱动的 API 应该一样。"

**正确理解：** 
- 各语言驱动遵循相同的协议
- 但 API 风格因语言而异
- 高级功能（如事务、change stream）支持程度不同

## 动手练习

### 练习 1：使用 Mongoose 实现用户管理

**需求：** 
1. 定义 User Schema（包含 name、email、password、role 字段）
2. 添加 pre save 钩子，自动加密密码
3. 添加虚拟字段 fullName
4. 实现增删改查操作

<details>
<summary>点击查看答案</summary>

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. 定义 Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// 2. 虚拟字段
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// 3. pre save 钩子
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 4. 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// 5. 增删改查
async function test() {
  await mongoose.connect('mongodb://localhost:27017/myapp');

  // 增
  const user = await User.create({
    firstName: '张',
    lastName: '三',
    email: 'zhangsan@example.com',
    password: '123456'
  });
  console.log('创建用户:', user.fullName);

  // 查
  const found = await User.findOne({ email: 'zhangsan@example.com' });
  console.log('查询用户:', found.fullName);

  // 改
  found.firstName = '李';
  await found.save();
  console.log('更新后:', found.fullName);

  // 删
  await User.deleteOne({ _id: found._id });

  await mongoose.disconnect();
}

test();
```

</details>

### 练习 2：使用 Node.js 驱动实现聚合查询

**需求：** 使用官方驱动实现以下聚合操作：
1. 按角色分组统计用户数量
2. 计算每个角色的平均年龄
3. 找出年龄最大的前 5 个用户

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function aggregateDemo() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('myapp');
  const users = db.collection('users');

  // 1. 按角色分组统计
  const roleStats = await users.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        avgAge: { $avg: '$age' }
      }
    }
  ]).toArray();
  console.log('角色统计:', roleStats);

  // 2. 年龄最大的前5个用户
  const topUsers = await users.aggregate([
    { $sort: { age: -1 } },
    { $limit: 5 },
    { $project: { name: 1, age: 1, _id: 0 } }
  ]).toArray();
  console.log('年龄最大的5个用户:', topUsers);

  await client.close();
}

aggregateDemo();
```

</details>

### 练习 3：Spring Data MongoDB 实现 Repository

**需求：** 使用 Spring Data MongoDB 实现：
1. 定义 Product 实体类
2. 创建 ProductRepository
3. 实现按名称搜索、按价格范围查询

<details>
<summary>点击查看答案</summary>

```java
// Product.java
@Document(collection = "products")
public class Product {
    @Id
    private String id;
    private String name;
    private Double price;
    private String category;
    private Integer stock;

    // 构造方法、Getter、Setter 省略
}

// ProductRepository.java
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByNameContaining(String keyword);

    List<Product> findByPriceBetween(Double min, Double max);

    List<Product> findByCategoryAndStockGreaterThan(String category, Integer stock);

    @Query("{ 'price': { $lt: ?0 } }")
    List<Product> findCheapProducts(Double maxPrice);
}

// ProductService.java
@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    public List<Product> search(String keyword) {
        return productRepository.findByNameContaining(keyword);
    }

    public List<Product> findByPriceRange(Double min, Double max) {
        return productRepository.findByPriceBetween(min, max);
    }
}
```

</details>

## 选择建议

| 场景 | 推荐工具 | 原因 |
|------|---------|------|
| 快速原型 | Mongoose | 开发效率高 |
| 企业级 Java 应用 | Spring Data MongoDB | 生态完善 |
| 高性能微服务 | 官方驱动 | 性能最好 |
| 已有 MongoDB 经验 | 官方驱动 | 更灵活 |
| 团队协作 | Mongoose | Schema 规范数据 |

## 下一章预告

下一章我们将进行综合实战项目。你将把前面学到的所有知识应用到一个真实项目中：

- 博客系统：文章、评论、标签的数据模型设计
- 日志分析系统：日志存储与聚合统计
- 电商应用：商品、订单、用户的完整实现

通过实战项目，你将真正掌握 MongoDB 在实际生产环境中的使用方法。
