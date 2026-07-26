---
title: "第16章：综合实战项目"
description: "内容管理系统、日志分析、电商应用实战"
---

# 第16章：综合实战项目

## 本章导读

在学习了 MongoDB 的基础知识和高级特性后，你可能会有这些疑问：

1. **如何把学到的知识应用到实际项目中？** 理论和实践之间有多大差距？
2. **真实项目的数据模型应该怎么设计？** 和教程里的例子有什么不同？
3. **生产环境需要注意什么？** 有哪些最佳实践？
4. **学完这些内容后，下一步该学什么？** 进阶方向是什么？

本章将通过三个实战项目，帮你把理论知识转化为实际能力。每个项目都包含需求分析、数据模型设计和核心代码实现。

## 项目一：博客系统

### 需求分析

一个典型的博客系统需要支持：

- 文章管理：创建、编辑、删除、发布文章
- 评论功能：读者可以对文章发表评论
- 标签分类：文章可以打多个标签
- 用户系统：作者、读者、管理员
- 阅读统计：记录文章的阅读量

### 数据模型设计

#### 用户集合（users）

```javascript
// 用户数据结构
{
  _id: ObjectId("..."),
  username: "zhangsan",           // 用户名，唯一
  email: "zhangsan@example.com",  // 邮箱，唯一
  password: "hashed_password",    // 加密后的密码
  role: "author",                 // 角色：admin/author/reader
  avatar: "https://...",          // 头像 URL
  bio: "个人简介",
  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:00:00Z")
}
```

#### 文章集合（posts）

```javascript
// 文章数据结构
{
  _id: ObjectId("..."),
  title: "MongoDB 入门教程",
  slug: "mongodb-tutorial",       // URL 友好的标题
  content: "文章正文内容...",
  excerpt: "文章摘要...",
  author: ObjectId("..."),        // 关联用户 ID
  coverImage: "https://...",      // 封面图
  tags: ["mongodb", "数据库", "NoSQL"],  // 标签数组
  status: "published",            // 状态：draft/published/archived
  viewCount: 1520,                // 阅读量
  likeCount: 89,                  // 点赞数
  commentCount: 23,               // 评论数（冗余字段，提高查询性能）
  publishedAt: ISODate("2024-01-15T10:00:00Z"),
  createdAt: ISODate("2024-01-15T09:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

#### 评论集合（comments）

```javascript
// 评论数据结构
{
  _id: ObjectId("..."),
  postId: ObjectId("..."),        // 关联文章 ID
  parentId: ObjectId("..."),      // 父评论 ID（用于回复）
  author: ObjectId("..."),        // 评论者 ID
  content: "写得很好，学到了很多！",
  status: "approved",             // 状态：pending/approved/spam
  likeCount: 5,
  createdAt: ISODate("2024-01-15T11:00:00Z")
}
```

### 核心代码实现

#### 使用 Mongoose 定义模型

```javascript
const mongoose = require('mongoose');

// 用户模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'author', 'reader'],
    default: 'reader'
  },
  avatar: String,
  bio: String
}, {
  timestamps: true  // 自动添加 createdAt 和 updatedAt
});

// 文章模型
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage: String,
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  publishedAt: Date
}, {
  timestamps: true
});

// 创建索引
postSchema.index({ status: 1, publishedAt: -1 });  // 查询已发布文章
postSchema.index({ tags: 1 });                      // 按标签查询
postSchema.index({ title: 'text', content: 'text' }); // 全文搜索

// 评论模型
const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'spam'],
    default: 'pending'
  },
  likeCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

commentSchema.index({ postId: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
```

#### 文章查询与分页

```javascript
// 获取已发布文章列表（分页）
async function getPublishedPosts(page = 1, limit = 10, tag = null) {
  const query = { status: 'published' };

  // 按标签过滤
  if (tag) {
    query.tags = tag;
  }

  const posts = await Post.find(query)
    .populate('author', 'username avatar')  // 关联查询作者信息
    .sort({ publishedAt: -1 })              // 按发布时间降序
    .skip((page - 1) * limit)               // 跳过前面的页
    .limit(limit)                           // 限制数量
    .select('-content');                    // 不返回正文内容

  const total = await Post.countDocuments(query);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// 获取文章详情（同时增加阅读量）
async function getPostBySlug(slug) {
  const post = await Post.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { viewCount: 1 } },  // 原子操作增加阅读量
    { new: true }
  ).populate('author', 'username avatar bio');

  if (!post) {
    throw new Error('文章不存在');
  }

  return post;
}

// 搜索文章
async function searchPosts(keyword, page = 1, limit = 10) {
  const posts = await Post.find({
    $text: { $search: keyword },
    status: 'published'
  })
    .populate('author', 'username')
    .sort({ score: { $meta: 'textScore' } })  // 按相关度排序
    .skip((page - 1) * limit)
    .limit(limit);

  return posts;
}
```

#### 评论功能

```javascript
// 发表评论
async function addComment(postId, authorId, content, parentId = null) {
  const comment = await Comment.create({
    postId,
    author: authorId,
    content,
    parentId,
    status: 'pending'
  });

  // 更新文章的评论数
  await Post.findByIdAndUpdate(postId, {
    $inc: { commentCount: 1 }
  });

  return comment;
}

// 获取文章的评论（树形结构）
async function getCommentsByPost(postId) {
  // 获取所有顶级评论（没有父评论）
  const topComments = await Comment.find({
    postId,
    parentId: null,
    status: 'approved'
  })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 });

  // 获取所有子评论
  const allComments = await Comment.find({
    postId,
    status: 'approved'
  }).populate('author', 'username avatar');

  // 构建树形结构
  const commentMap = new Map();
  allComments.forEach(c => {
    commentMap.set(c._id.toString(), { ...c.toObject(), replies: [] });
  });

  const tree = [];
  allComments.forEach(c => {
    const comment = commentMap.get(c._id.toString());
    if (c.parentId) {
      const parent = commentMap.get(c.parentId.toString());
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      tree.push(comment);
    }
  });

  return tree;
}
```

#### 聚合统计

```javascript
// 获取博客统计信息
async function getBlogStats() {
  const stats = await Post.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likeCount' },
        avgViews: { $avg: '$viewCount' }
      }
    }
  ]);

  // 热门标签
  const popularTags = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return {
    ...stats[0],
    popularTags
  };
}
```

## 项目二：日志分析系统

### 需求分析

日志分析系统需要：

- 高效存储大量日志数据
- 支持时间范围查询
- 实时聚合统计
- 日志级别分类
- 错误追踪与告警

### 数据模型设计

#### 日志集合（logs）

```javascript
// 日志数据结构
{
  _id: ObjectId("..."),
  timestamp: ISODate("2024-01-15T10:30:00Z"),  // 日志时间
  level: "ERROR",                               // 级别：DEBUG/INFO/WARN/ERROR/FATAL
  service: "user-service",                      // 服务名
  message: "Database connection failed",        // 日志消息
  context: {                                    // 上下文信息
    userId: "12345",
    requestId: "req-abc-123",
    ip: "192.168.1.100"
  },
  stack: "Error: Connection refused\n    at ...",  // 错误堆栈（仅错误日志）
  tags: ["database", "critical"],               // 标签
  createdAt: ISODate("2024-01-15T10:30:00Z")
}
```

### 核心代码实现

#### 日志模型

```javascript
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  level: {
    type: String,
    enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    index: true
  },
  service: { type: String, index: true },
  message: { type: String, required: true },
  context: { type: mongoose.Schema.Types.Mixed },
  stack: String,
  tags: [String]
});

// 复合索引：时间范围查询
logSchema.index({ timestamp: -1, level: 1 });
logSchema.index({ service: 1, timestamp: -1 });

// TTL 索引：自动删除 30 天前的日志
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Log = mongoose.model('Log', logSchema);
```

#### 日志写入

```javascript
// 批量写入日志（提高性能）
async function writeLogs(logs) {
  // 使用 insertMany 批量插入
  return await Log.insertMany(logs, {
    ordered: false,  // 无序插入，提高性能
    lean: true       // 不返回 Mongoose 文档，减少开销
  });
}

// 单条日志写入
async function writeLog(level, service, message, context = {}, tags = []) {
  const log = new Log({
    level,
    service,
    message,
    context,
    tags
  });

  // 如果是错误日志，捕获堆栈
  if (level === 'ERROR' || level === 'FATAL') {
    log.stack = new Error().stack;
  }

  return await log.save();
}
```

#### 日志查询

```javascript
// 按时间范围查询
async function getLogsByTimeRange(startTime, endTime, options = {}) {
  const { level, service, limit = 100, skip = 0 } = options;

  const query = {
    timestamp: { $gte: startTime, $lte: endTime }
  };

  if (level) query.level = level;
  if (service) query.service = service;

  const logs = await Log.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();  // 使用 lean() 提高性能

  return logs;
}

// 查询错误日志
async function getErrorLogs(service = null, hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const query = {
    level: { $in: ['ERROR', 'FATAL'] },
    timestamp: { $gte: startTime }
  };

  if (service) query.service = service;

  return await Log.find(query)
    .sort({ timestamp: -1 })
    .lean();
}
```

#### 聚合统计

```javascript
// 按小时统计日志数量
async function getHourlyStats(service = null, hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const matchStage = {
    timestamp: { $gte: startTime }
  };

  if (service) matchStage.service = service;

  const stats = await Log.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          level: '$level'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.hour',
        counts: {
          $push: {
            level: '$_id.level',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return stats;
}

// 获取最常见的错误
async function getTopErrors(hours = 24, limit = 10) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const errors = await Log.aggregate([
    {
      $match: {
        level: { $in: ['ERROR', 'FATAL'] },
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$message',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
        services: { $addToSet: '$service' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return errors;
}

// 服务健康度统计
async function getServiceHealth(hours = 1) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const health = await Log.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$service',
        total: { $sum: 1 },
        errors: {
          $sum: {
            $cond: [{ $in: ['$level', ['ERROR', 'FATAL']] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        service: '$_id',
        total: 1,
        errors: 1,
        errorRate: {
          $multiply: [{ $divide: ['$errors', '$total'] }, 100]
        },
        healthScore: {
          $subtract: [100, { $multiply: [{ $divide: ['$errors', '$total'] }, 100] }]
        }
      }
    },
    { $sort: { healthScore: -1 } }
  ]);

  return health;
}
```

#### 实时告警

```javascript
// 检查是否需要告警
async function checkAlerts() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // 统计最近 5 分钟的错误数量
  const recentErrors = await Log.countDocuments({
    level: { $in: ['ERROR', 'FATAL'] },
    timestamp: { $gte: fiveMinutesAgo }
  });

  // 超过阈值则告警
  if (recentErrors > 100) {
    await sendAlert({
      type: 'HIGH_ERROR_RATE',
      message: `最近 5 分钟有 ${recentErrors} 个错误`,
      count: recentErrors
    });
  }

  // 检查特定服务的错误
  const serviceErrors = await Log.aggregate([
    {
      $match: {
        level: { $in: ['ERROR', 'FATAL'] },
        timestamp: { $gte: fiveMinutesAgo }
      }
    },
    {
      $group: {
        _id: '$service',
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 50 } } }
  ]);

  for (const error of serviceErrors) {
    await sendAlert({
      type: 'SERVICE_ERROR',
      service: error._id,
      message: `服务 ${error._id} 最近 5 分钟有 ${error.count} 个错误`,
      count: error.count
    });
  }
}

// 模拟发送告警
async function sendAlert(alert) {
  console.log('发送告警:', alert);
  // 实际项目中可以发送邮件、短信、Slack 通知等
}
```

## 项目三：电商应用

### 需求分析

电商应用需要：

- 商品管理：分类、属性、库存、价格
- 订单系统：下单、支付、发货、完成
- 用户系统：注册、登录、地址管理
- 购物车：临时存储
- 评价系统：商品评价

### 数据模型设计

#### 用户集合（users）

```javascript
{
  _id: ObjectId("..."),
  username: "zhangsan",
  email: "zhangsan@example.com",
  password: "hashed_password",
  phone: "13800138000",
  addresses: [                    // 收货地址数组
    {
      _id: ObjectId("..."),
      name: "张三",
      phone: "13800138000",
      province: "广东省",
      city: "深圳市",
      district: "南山区",
      detail: "科技园南路 100 号",
      isDefault: true
    }
  ],
  role: "customer",               // customer/admin/seller
  createdAt: ISODate("2024-01-15T10:00:00Z")
}
```

#### 商品集合（products）

```javascript
{
  _id: ObjectId("..."),
  name: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  description: "苹果最新旗舰手机",
  category: ObjectId("..."),      // 分类 ID
  brand: "Apple",
  price: {
    original: 8999,               // 原价
    current: 7999,                // 现价
    currency: "CNY"
  },
  stock: {
    total: 1000,
    available: 850,
    locked: 150                   // 已下单未支付
  },
  images: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  attributes: {                   // 商品属性
    color: ["深空黑", "银色", "金色"],
    storage: ["128GB", "256GB", "512GB", "1TB"]
  },
  skus: [                         // SKU 列表
    {
      _id: ObjectId("..."),
      color: "深空黑",
      storage: "256GB",
      price: 7999,
      stock: 300,
      skuCode: "IP15P-BK-256"
    }
  ],
  status: "active",               // active/inactive/deleted
  salesCount: 1520,
  rating: 4.8,
  reviewCount: 356,
  tags: ["手机", "苹果", "5G"],
  createdAt: ISODate("2024-01-15T10:00:00Z")
}
```

#### 订单集合（orders）

```javascript
{
  _id: ObjectId("..."),
  orderNo: "ORD202401151000001",  // 订单号
  userId: ObjectId("..."),
  items: [                        // 订单商品
    {
      productId: ObjectId("..."),
      skuId: ObjectId("..."),
      name: "iPhone 15 Pro",
      image: "https://...",
      skuCode: "IP15P-BK-256",
      price: 7999,
      quantity: 1,
      subtotal: 7999
    }
  ],
  shipping: {
    address: {
      name: "张三",
      phone: "13800138000",
      fullAddress: "广东省深圳市南山区科技园南路 100 号"
    },
    method: "SF Express",
    fee: 0,
    trackingNo: "SF1234567890"
  },
  payment: {
    method: "alipay",             // alipay/wechat/card
    amount: 7999,
    status: "paid",               // pending/paid/refunded
    paidAt: ISODate("2024-01-15T10:05:00Z"),
    transactionId: "ALIPAY123456"
  },
  status: "shipped",              // pending/paid/shipped/delivered/completed/cancelled
  statusHistory: [                // 状态变更历史
    { status: "pending", at: ISODate("2024-01-15T10:00:00Z") },
    { status: "paid", at: ISODate("2024-01-15T10:05:00Z") },
    { status: "shipped", at: ISODate("2024-01-15T14:00:00Z") }
  ],
  totals: {
    subtotal: 7999,
    shipping: 0,
    discount: 0,
    total: 7999
  },
  note: "请尽快发货",
  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T14:00:00Z")
}
```

### 核心代码实现

#### 商品模型

```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: String,
  price: {
    original: Number,
    current: { type: Number, required: true },
    currency: { type: String, default: 'CNY' }
  },
  stock: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    locked: { type: Number, default: 0 }
  },
  images: [String],
  attributes: { type: Map, of: [String] },
  skus: [{
    color: String,
    storage: String,
    price: Number,
    stock: Number,
    skuCode: { type: String, unique: true }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  salesCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  tags: [String]
}, {
  timestamps: true
});

// 索引
productSchema.index({ status: 1, 'price.current': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
```

#### 订单模型

```javascript
const orderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    skuId: mongoose.Schema.Types.ObjectId,
    name: String,
    image: String,
    skuCode: String,
    price: Number,
    quantity: Number,
    subtotal: Number
  }],
  shipping: {
    address: {
      name: String,
      phone: String,
      fullAddress: String
    },
    method: String,
    fee: { type: Number, default: 0 },
    trackingNo: String
  },
  payment: {
    method: String,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    transactionId: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    at: { type: Date, default: Date.now }
  }],
  totals: {
    subtotal: Number,
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: Number
  },
  note: String
}, {
  timestamps: true
});

// 索引
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNo: 1 });

// 更新状态时自动记录历史
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      at: new Date()
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
```

#### 下单流程

```javascript
// 创建订单（事务操作）
async function createOrder(userId, items, shippingAddress, paymentMethod) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. 验证商品和库存
    const productIds = items.map(i => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active'
    }).session(session);

    if (products.length !== items.length) {
      throw new Error('部分商品不存在或已下架');
    }

    // 2. 计算订单金额
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) throw new Error(`商品 ${item.productId} 不存在`);

      const sku = product.skus.id(item.skuId);
      if (!sku) throw new Error(`SKU ${item.skuId} 不存在`);

      if (sku.stock < item.quantity) {
        throw new Error(`${product.name} 库存不足`);
      }

      const itemSubtotal = sku.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        skuId: sku._id,
        name: product.name,
        image: product.images[0],
        skuCode: sku.skuCode,
        price: sku.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    // 3. 锁定库存
    for (const item of items) {
      await Product.updateOne(
        {
          _id: item.productId,
          'skus._id': item.skuId
        },
        {
          $inc: {
            'stock.available': -item.quantity,
            'stock.locked': item.quantity,
            'skus.$.stock': -item.quantity
          }
        }
      ).session(session);
    }

    // 4. 创建订单
    const order = await Order.create([{
      orderNo: generateOrderNo(),
      userId,
      items: orderItems,
      shipping: {
        address: shippingAddress,
        method: 'SF Express',
        fee: subtotal >= 99 ? 0 : 10  // 满 99 包邮
      },
      payment: {
        method: paymentMethod,
        amount: subtotal + (subtotal >= 99 ? 0 : 10)
      },
      totals: {
        subtotal,
        shipping: subtotal >= 99 ? 0 : 10,
        discount: 0,
        total: subtotal + (subtotal >= 99 ? 0 : 10)
      },
      status: 'pending'
    }], { session });

    await session.commitTransaction();
    return order[0];

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date}${random}`;
}
```

#### 支付回调

```javascript
// 支付成功回调
async function handlePaymentCallback(orderNo, transactionId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({ orderNo }).session(session);
    if (!order) throw new Error('订单不存在');

    if (order.payment.status === 'paid') {
      throw new Error('订单已支付');
    }

    // 1. 更新订单状态
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    order.payment.transactionId = transactionId;
    order.status = 'paid';
    await order.save({ session });

    // 2. 扣减库存（从 locked 中扣除）
    for (const item of order.items) {
      await Product.updateOne(
        {
          _id: item.productId,
          'skus._id': item.skuId
        },
        {
          $inc: {
            'stock.locked': -item.quantity,
            'stock.total': -item.quantity,
            'salesCount': item.quantity
          }
        }
      ).session(session);
    }

    await session.commitTransaction();
    return order;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

#### 订单查询

```javascript
// 获取用户订单列表
async function getUserOrders(userId, status = null, page = 1, limit = 10) {
  const query = { userId };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('items.productId', 'name images')
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// 订单统计
async function getOrderStats(startDate, endDate) {
  const stats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totals.total' },
        avgOrderValue: { $avg: '$totals.total' }
      }
    }
  ]);

  // 按状态统计
  const statusStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    summary: stats[0] || {},
    byStatus: statusStats
  };
}
```

## MongoDB 生产环境最佳实践

### 1. 索引策略

```javascript
// 分析查询模式，创建合适的索引
db.orders.getExplain().find({ userId: '123', status: 'paid' }).sort({ createdAt: -1 });

// 复合索引遵循最左前缀原则
db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 });

// 避免过多索引影响写入性能
// 定期审查未使用的索引
```

### 2. 读写分离

```javascript
// 读操作指向从节点
const client = new MongoClient(uri, {
  readPreference: 'secondaryPreferred'
});

// 写操作自动路由到主节点
```

### 3. 连接池配置

```javascript
const client = new MongoClient(uri, {
  maxPoolSize: 100,        // 最大连接数
  minPoolSize: 10,         // 最小连接数
  maxIdleTimeMS: 30000,    // 空闲超时
  waitQueueTimeoutMS: 5000 // 等待队列超时
});
```

### 4. 监控与告警

- 使用 MongoDB Atlas 或 Prometheus + Grafana
- 监控关键指标：连接数、查询延迟、慢查询、磁盘使用率
- 设置告警阈值

### 5. 数据验证

```javascript
// 使用 JSON Schema 验证
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      required: ['username', 'email'],
      properties: {
        username: { bsonType: 'string', minLength: 3 },
        email: { bsonType: 'string', pattern: '^\\S+@\\S+\\.\\S+$' }
      }
    }
  }
})
```

## 学习路线图与进阶方向

### 初级阶段（已完成）

- MongoDB 基础语法
- CRUD 操作
- 索引与查询优化
- 数据模型设计

### 中级阶段

- 副本集与高可用
- 分片集群
- 备份与恢复
- 安全与权限

### 高级阶段

- 性能调优
- 架构设计
- 监控与运维
- 源码阅读

### 进阶方向

1. **MongoDB Atlas**：云服务管理
2. **Change Streams**：实时数据变更通知
3. **Time Series Collections**：时间序列数据
4. **Vector Search**：向量搜索（AI 应用）
5. **GraphQL + MongoDB**：现代 API 开发

### 推荐资源

- 官方文档：https://docs.mongodb.com/
- MongoDB University：https://university.mongodb.com/
- 《MongoDB 权威指南》
- 《MongoDB 实战》

## 总结

通过这三个实战项目，你已经掌握了：

1. **博客系统**：内容管理、关联查询、聚合统计
2. **日志分析**：时间序列数据、批量写入、实时监控
3. **电商应用**：复杂事务、库存管理、订单流程

MongoDB 的强大之处在于它的灵活性和可扩展性。在实际项目中，你需要根据业务需求选择合适的数据模型和架构方案。

记住以下原则：

- 为访问模式而设计（Design for your queries）
- 数据一起访问就一起存储（Data that is accessed together should be stored together）
- 预计算常用结果（Pre-compute what you can）
- /embed 还是 reference，取决于你的查询模式

祝你在 MongoDB 的学习道路上越走越远！
