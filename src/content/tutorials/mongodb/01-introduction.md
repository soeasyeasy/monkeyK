---
title: "第1章：MongoDB 简介与环境搭建"
description: "什么是 MongoDB，核心优势，安装配置，第一个数据库"
---

# 第1章：MongoDB 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 MongoDB？它和 MySQL 有什么区别？
- 为什么现在这么多公司都在用 MongoDB？
- MongoDB 真的比关系型数据库更好吗？
- 安装 MongoDB 复杂吗？怎么开始使用？

这一章就是为了解答这些问题。我们会先搞清楚 **MongoDB 是什么、为什么需要它**，再动手把环境搭好，为后面的学习打下基础。

---

## 1.1 为什么需要 MongoDB？

### 痛点分析

想象一下这个场景：你正在开发一个电商系统，需要存储商品信息。在 MySQL 中，你需要先设计表结构，定义好字段类型，然后才能存储数据。

没有 MongoDB 之前，我们面临这些痛点：

- **表结构固定**：关系型数据库需要提前设计好表结构，字段一旦确定就很难修改
- **扩展困难**：数据量增大时，垂直扩展（升级硬件）成本高，水平扩展（分库分表）复杂
- **JSON 数据处理麻烦**：现代应用大量使用 JSON 数据，存入关系型数据库需要序列化/反序列化
- **开发效率低**：每次修改数据结构都要写迁移脚本，影响开发速度

### 生活化类比

> 传统关系型数据库就像一排排固定的文件柜：每个抽屉的大小、形状都是固定的，你只能放入符合尺寸的文件。如果要放一个大尺寸的海报，要么折叠（数据转换），要么换个更大的柜子（表结构迁移）。
>
> MongoDB 就像一个灵活的储物柜：你可以放入任何形状、任何大小的物品。今天放一本书，明天放一个篮球，后天放一个花瓶，柜子都能装得下。而且储物柜还可以无限扩展，东西多了就多放几个柜子。

### 代码对比

使用 MySQL 存储商品信息：

```javascript
// ❌ 需要先创建表结构，字段固定
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// ❌ 如果要添加新字段（如颜色、尺寸），需要修改表结构
ALTER TABLE products ADD COLUMN color VARCHAR(50);
ALTER TABLE products ADD COLUMN sizes JSON;

// ❌ 存储 JSON 数据需要序列化
const product = {
    name: 'T恤',
    price: 99.99,
    colors: ['红色', '蓝色', '黑色'],  // 需要转成 JSON 字符串存储
    sizes: ['S', 'M', 'L', 'XL']
};
// 插入时需要 JSON.stringify(colors)
```

使用 MongoDB 存储商品信息：

```javascript
// ✅ 直接存储 JSON 文档，无需预定义结构
db.products.insertOne({
    name: 'T恤',                    // 字符串字段
    price: 99.99,                   // 数字字段
    colors: ['红色', '蓝色', '黑色'], // 直接存储数组
    sizes: ['S', 'M', 'L', 'XL'],   // 直接存储数组
    specs: {                        // 直接存储嵌套对象
        material: '棉',
        weight: '200g'
    },
    created_at: new Date()          // 日期类型
});

// ✅ 不同商品可以有不同的字段
db.products.insertOne({
    name: '笔记本电脑',
    price: 5999.00,
    cpu: 'i7-12700H',              // 这个字段只有电子产品才有
    ram: '16GB',
    storage: '512GB SSD'
    // 没有 colors、sizes 字段，完全没问题
});
```

> **一句话总结**：MongoDB 让你的数据存储像 JavaScript 对象一样自然，不用再为表结构迁移头疼。

---

## 1.2 MongoDB 是什么？

### 概念解释

MongoDB 是一个开源的 **文档型 NoSQL 数据库**，它使用类似 JSON 的格式（BSON）来存储数据。

关键词解析：

- **文档型**：数据以文档（Document）的形式存储，每个文档就像一个 JavaScript 对象
- **NoSQL**：不使用传统的表、行、列结构，更灵活
- **BSON**：Binary JSON，是 JSON 的二进制形式，支持更多数据类型

### 核心特性

| 特性 | 说明 | 类比 |
|------|------|------|
| **灵活文档模型** | 每个文档可以有不同的字段 | 就像不同的信封可以装不同的内容 |
| **水平扩展** | 可以通过增加服务器来扩展 | 就像多开几个收银台应对客流高峰 |
| **高可用性** | 支持副本集，自动故障转移 | 就像备用发电机，主电源故障时自动切换 |
| **丰富查询** | 支持字段查询、范围查询、正则表达式等 | 就像在图书馆可以按书名、作者、出版社找书 |
| **索引支持** | 可以对任何字段建立索引 | 就像给书编目录，快速定位 |

---

## 1.3 MongoDB vs MySQL 对比

### 对比表格

| 对比项 | MongoDB | MySQL |
|--------|---------|-------|
| **数据模型** | 文档型（BSON） | 关系型（表） |
| **数据结构** | 灵活，无需预定义 | 固定，需要提前设计表结构 |
| **扩展性** | 水平扩展容易（分片） | 水平扩展复杂（分库分表） |
| **事务支持** | 支持多文档事务（4.0+） | 支持完善的事务机制 |
| **查询语言** | MQL（MongoDB Query Language） | SQL |
| **JOIN 操作** | 不支持传统 JOIN（用 $lookup） | 支持复杂的 JOIN |
| **适用场景** | 内容管理、实时分析、物联网 | 金融系统、ERP、需要强一致性的场景 |
| **性能** | 高并发读写性能优秀 | 复杂查询性能优秀 |
| **学习曲线** | 对前端友好，类似 JSON | 需要学习 SQL 语法 |

### 应用场景选择

**适合 MongoDB 的场景：**

- **内容管理系统**：文章、评论等数据结构经常变化
- **实时分析**：需要快速写入大量日志数据
- **物联网应用**：设备数据格式多样，需要灵活存储
- **用户画像**：用户属性多且经常扩展
- **商品目录**：不同商品属性差异大

**适合 MySQL 的场景：**

- **金融系统**：需要强一致性和复杂事务
- **ERP 系统**：数据结构稳定，关系复杂
- **传统企业应用**：已有成熟的 SQL 生态

---

## 1.4 安装 MongoDB

### Windows 安装

**方式一：安装包安装（推荐）**

1. 下载 MongoDB Community Server
   - 访问官网：https://www.mongodb.com/try/download/community
   - 选择 Windows 版本，下载 MSI 安装包

2. 运行安装程序
   - 选择 "Complete" 完整安装
   - 勾选 "Install MongoDB as a Service"（作为服务运行）
   - 勾选 "Install MongoDB Compass"（图形化工具）

3. 验证安装
   ```bash
   # 打开命令行，检查版本
   mongod --version
   ```

**方式二：Docker 安装**

```bash
# 拉取 MongoDB 镜像
docker pull mongo:latest

# 启动 MongoDB 容器
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# 参数说明：
# -d: 后台运行
# --name: 容器名称
# -p: 端口映射（宿主机:容器）
# -v: 数据卷挂载（持久化数据）
```

### Mac 安装

**方式一：Homebrew 安装（推荐）**

```bash
# 添加 MongoDB 源
brew tap mongodb/brew

# 安装 MongoDB
brew install mongodb-community

# 启动 MongoDB 服务
brew services start mongodb-community

# 验证安装
mongod --version
```

**方式二：Docker 安装**

同 Windows Docker 安装方式。

### Linux 安装（Ubuntu/Debian）

```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# 添加源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 安装 MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证安装
mongod --version
```

---

## 1.5 配置文件 mongod.conf

MongoDB 的配置文件通常位于：

- Windows: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`
- Mac/Linux: `/etc/mongod.conf` 或 `/usr/local/etc/mongod.conf`

### 常用配置项

```yaml
# 存储配置
storage:
  dbPath: /var/lib/mongodb          # 数据文件存储路径
  journal:
    enabled: true                   # 启用日志（保证数据持久性）

# 系统日志配置
systemLog:
  destination: file                 # 日志输出到文件
  path: /var/log/mongodb/mongod.log # 日志文件路径
  logAppend: true                   # 追加模式

# 网络配置
net:
  port: 27017                       # 默认端口
  bindIp: 127.0.0.1                 # 绑定 IP（127.0.0.1 表示只允许本地访问）

# 安全配置（后续章节会详细讲解）
# security:
#   authorization: enabled          # 启用认证

# 副本集配置（后续章节会详细讲解）
# replication:
#   replSetName: "rs0"              # 副本集名称
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `storage.dbPath` | 数据存储路径 | `/var/lib/mongodb` |
| `storage.journal.enabled` | 是否启用日志 | `true` |
| `systemLog.destination` | 日志输出方式 | `file` |
| `net.port` | 监听端口 | `27017` |
| `net.bindIp` | 绑定 IP | `127.0.0.1` |

---

## 1.6 使用 mongosh 连接 MongoDB

### 启动 MongoDB Shell

```bash
# 默认连接本地 MongoDB
mongosh

# 连接指定主机和端口
mongosh --host localhost --port 27017

# 连接指定数据库
mongosh "mongodb://localhost:27017/mydb"

# 连接带认证的数据库
mongosh "mongodb://username:password@localhost:27017/mydb"
```

### 基础操作

```javascript
// 查看所有数据库
show dbs
// 输出：
// admin   40.0 KB
// config  40.0 KB
// local   40.0 KB

// 切换/创建数据库（插入数据后才会真正创建）
use mydb
// 输出：switched to db mydb

// 查看当前数据库
db
// 输出：mydb

// 查看当前数据库的所有集合
show collections

// 创建集合并插入文档
db.users.insertOne({
    name: '张三',
    age: 25,
    email: 'zhangsan@example.com'
})
// 输出：{ acknowledged: true, insertedId: ObjectId('...') }

// 查询文档
db.users.find()
// 输出：[ { _id: ObjectId('...'), name: '张三', age: 25, email: 'zhangsan@example.com' } ]

// 格式化输出（更易读）
db.users.find().pretty()

// 删除数据库
db.dropDatabase()
// 输出：{ ok: 1, dropped: 'mydb' }
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `show dbs` | 查看所有数据库 |
| `use <dbname>` | 切换数据库 |
| `db` | 查看当前数据库 |
| `show collections` | 查看所有集合 |
| `db.createCollection(<name>)` | 创建集合 |
| `db.<collection>.drop()` | 删除集合 |
| `db.dropDatabase()` | 删除当前数据库 |
| `help` | 查看帮助 |
| `exit` | 退出 |

---

## 1.7 新手常见误区

### 误区一：MongoDB 没有事务

**错误认识**：MongoDB 不支持事务，所以不适合生产环境。

**正确理解**：MongoDB 从 4.0 版本开始支持多文档事务，从 4.2 版本开始支持分布式事务。虽然事务性能不如 MySQL，但对于大多数应用场景已经足够。

### 误区二：MongoDB 不适合复杂查询

**错误认识**：MongoDB 只能做简单的 CRUD，无法做复杂查询。

**正确理解**：MongoDB 支持丰富的查询操作符（$gt、$lt、$in、$regex 等），支持聚合管道（Aggregation Pipeline），可以完成复杂的分组、统计、关联查询。

### 误区三：MongoDB 不安全

**错误认识**：MongoDB 没有权限控制，数据容易被盗。

**正确理解**：MongoDB 支持基于角色的访问控制（RBAC），可以创建用户、分配权限。生产环境必须启用认证，并配置网络访问控制。

### 误区四：MongoDB 会丢失数据

**错误认识**：MongoDB 是 NoSQL，数据可靠性不如 MySQL。

**正确理解**：MongoDB 通过日志（Journal）机制保证数据持久性，通过副本集（Replica Set）实现高可用和数据冗余。只要配置正确，数据安全性有保障。

---

## 1.8 动手练习

### 练习 1：安装并连接 MongoDB

**要求**：
1. 在你的系统上安装 MongoDB
2. 使用 mongosh 连接到本地 MongoDB
3. 查看当前有哪些数据库

<details>
<summary>点击查看答案</summary>

```bash
# 1. 验证安装
mongod --version

# 2. 连接 MongoDB
mongosh

# 3. 查看所有数据库
show dbs
```

</details>

### 练习 2：创建第一个数据库和集合

**要求**：
1. 创建一个名为 `school` 的数据库
2. 在该数据库中创建一个 `students` 集合
3. 插入一条学生记录（包含姓名、年龄、专业）
4. 查询刚插入的记录

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 创建/切换到 school 数据库
use school

// 2. 插入学生记录（集合会自动创建）
db.students.insertOne({
    name: '李四',
    age: 20,
    major: '计算机科学'
})

// 3. 查询记录
db.students.find()

// 或者格式化输出
db.students.find().pretty()
```

</details>

### 练习 3：对比 MongoDB 和 MySQL 的数据存储

**要求**：
1. 思考一个场景：存储博客文章（包含标题、内容、标签、评论）
2. 分别用 MySQL 和 MongoDB 的方式设计数据结构
3. 分析哪种方式更适合

<details>
<summary>点击查看答案</summary>

**MySQL 方案：**

```sql
-- 需要创建多个表
CREATE TABLE articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200),
    content TEXT,
    created_at TIMESTAMP
);

CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50)
);

CREATE TABLE article_tags (
    article_id INT,
    tag_id INT,
    PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT,
    content TEXT,
    author VARCHAR(100),
    created_at TIMESTAMP
);

-- 插入数据需要多次操作
INSERT INTO articles (title, content) VALUES ('MongoDB 入门', '...');
INSERT INTO tags (name) VALUES ('数据库'), ('NoSQL');
INSERT INTO article_tags VALUES (1, 1), (1, 2);
INSERT INTO comments (article_id, content, author) VALUES (1, '好文章', '张三');
```

**MongoDB 方案：**

```javascript
// 一个文档搞定
db.articles.insertOne({
    title: 'MongoDB 入门',
    content: '...',
    tags: ['数据库', 'NoSQL'],  // 数组直接存储
    comments: [                 // 嵌套文档
        {
            content: '好文章',
            author: '张三',
            created_at: new Date()
        }
    ],
    created_at: new Date()
})
```

**分析**：MongoDB 方案更适合，因为：
1. 数据结构灵活，标签和评论直接嵌套在文章中
2. 一次插入完成所有数据，无需多次操作
3. 读取文章时一次性获取所有相关信息
4. 如果评论很多，也可以单独存储，用引用关联

</details>

---

## 1.9 下一章预告

恭喜你完成了第一章！现在你已经了解了 MongoDB 的基本概念，并成功搭建了环境。

在下一章中，我们将深入学习 **文档与集合**，包括：

- BSON 格式的详细讲解
- 文档结构设计（嵌套文档、数组）
- 集合的概念和命名空间
- `_id` 字段与 ObjectId 的生成规则
- 文档大小限制

这些知识是理解 MongoDB 数据存储机制的基础，继续加油！
