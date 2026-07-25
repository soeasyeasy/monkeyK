---
title: '第四章：哈希表'
description: '哈希表的原理、哈希函数、冲突解决与实际应用'
---

# 第四章：哈希表

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 哈希表是什么？为什么它能做到 O(1) 的查找速度？
- JavaScript 的 Object 和 Map 底层是怎么实现的？跟哈希表有什么关系？
- 什么是哈希函数？什么是哈希冲突？为什么会有冲突？
- 哈希表在实际开发中有哪些应用？

这一章就是为了解答这些问题。我们会先搞清楚**哈希表的工作原理**，再学习哈希函数和冲突解决方法，最后了解它在实际开发中的各种应用。学完之后，你就能理解字典、缓存、数据库索引等系统的底层原理。

---

## 4.1 为什么需要哈希表？

### 痛点分析

想象一下这个场景：

你要在一个通讯录里查找"张三"的电话号码。如果通讯录是按姓名首字母排序的，你可以用二分查找，速度很快。但如果要找的是"李四"的电话号码，而通讯录只有 10000 个人，你还是得从头到尾翻一遍。

有没有一种方法，不管通讯录有多大，都能**直接定位**到"李四"的电话号码，不需要遍历？

这就是**哈希表**的核心价值：**通过键（key）直接定位到值（value），不需要遍历**。

### 生活化类比

> **哈希表**就像一个带编号的储物柜。
>
> - 你要存东西？先算一下东西的"编号"（哈希值），然后直接放到对应编号的柜子里。
> - 你要取东西？再算一下编号，直接打开对应柜子，一步到位。
>
> 不需要从 1 号柜子开始一个一个找，直接就知道东西在哪。

```
传统查找（数组/链表）：
找"张三"的电话 -> 从第 1 个开始找 -> 第 2 个 -> 第 3 个 -> ... -> 找到！
时间复杂度：O(n)

哈希表查找：
找"张三"的电话 -> 计算哈希值 -> 直接定位到 37 号柜子 -> 找到！
时间复杂度：O(1)
```

### 哈希表在编程中的地位

哈希表是**最常用的数据结构之一**。JavaScript 的 Object、Map、Set 底层都用到了哈希表。数据库的索引、缓存系统、编译器中的符号表，都用到了哈希表。

掌握哈希表，是理解这些系统的基础。

---

## 4.2 哈希表的核心原理

### 什么是哈希表

**哈希表（Hash Table）**，也叫**散列表**，是一种根据**键（key）**直接访问**值（value）**的数据结构。

核心思想：

- 通过一个**哈希函数**，将键映射到表中的一个位置
- 直接通过这个位置访问值，不需要遍历

```
哈希表的结构：

键（key）  ->  哈希函数  ->  索引（index）  ->  值（value）

"张三"     ->  hash()    ->  37            ->  "13800138000"
"李四"     ->  hash()    ->  52            ->  "13900139000"
"王五"     ->  hash()    ->  18            ->  "13700137000"
```

### 哈希函数

**哈希函数（Hash Function）** 是将任意大小的输入（键）映射到固定大小输出（哈希值）的函数。

好的哈希函数应该满足：

- **确定性**：相同的输入总是产生相同的输出
- **均匀性**：输出尽可能均匀分布，减少冲突
- **高效性**：计算速度快
- **单向性**：从输出很难反推输入

```javascript
// 一个简单的哈希函数示例
function simpleHash(key, tableSize) {
  let hash = 0; // 初始哈希值
  // 遍历键的每个字符
  for (let i = 0; i < key.length; i++) {
    hash += key.charCodeAt(i); // 累加字符的 ASCII 值
  }
  return hash % tableSize; // 取模，确保在表范围内
}

// 使用示例
console.log(simpleHash('张三', 100)); // 输出一个 0-99 之间的数
console.log(simpleHash('李四', 100)); // 输出一个 0-99 之间的数
```

### 哈希冲突

**哈希冲突**是指：不同的键经过哈希函数后，得到了相同的哈希值（即映射到同一个位置）。

```
冲突示例：

哈希表大小：10
hash("张三") = 37 % 10 = 7
hash("李四") = 27 % 10 = 7  <- 冲突！两个键都映射到 7 号位置

+---+---+---+---+---+---+---+---+---+---+
| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
+---+---+---+---+---+---+---+---+---+---+
                              ^
                         张三和李四都在这里
```

为什么会有冲突？

- **鸽巢原理**：如果键的数量大于表的大小，必然有冲突
- **哈希函数的局限性**：再好的哈希函数也不能完全避免冲突

### 解决冲突的方法

#### 方法 1：链地址法（Separate Chaining）

每个位置维护一个链表，冲突的元素都挂在同一个链表上。

```
链地址法示意图：

哈希表：
+---+
| 0 | -> null
+---+
| 1 | -> [王五] -> null
+---+
| 2 | -> null
+---+
...
+---+
| 7 | -> [张三] -> [李四] -> null  <- 冲突的元素挂在同一个链表
+---+
...

查找"李四"：
1. 计算 hash("李四") = 7
2. 走到 7 号位置
3. 遍历链表，找到"李四"
```

#### 方法 2：开放地址法（Open Addressing）

冲突时，按照某种规则寻找下一个空位。

常见的探测方式：

- **线性探测**：依次检查下一个位置（1, 2, 3, ...）
- **二次探测**：检查 1^2, 2^2, 3^2, ... 的位置
- **双重哈希**：用第二个哈希函数计算步长

```
线性探测示意图：

插入"张三"：hash = 7，7 号位置空，直接放入
+---+---+---+---+---+---+---+---+---+---+
| 0 | 1 | 2 | 3 | 4 | 5 | 6 |张三| 8 | 9 |
+---+---+---+---+---+---+---+---+---+---+

插入"李四"：hash = 7，7 号位置已被占用
-> 检查 8 号位置，空，放入 8 号
+---+---+---+---+---+---+---+---+---+---+
| 0 | 1 | 2 | 3 | 4 | 5 | 6 |张三|李四| 9 |
+---+---+---+---+---+---+---+---+---+---+

查找"李四"：
1. 计算 hash = 7
2. 7 号位置是"张三"，不是"李四"
3. 继续检查 8 号，是"李四"，找到！
```

### 两种方法的对比

| 特性 | 链地址法 | 开放地址法 |
| --- | --- | --- |
| 冲突处理 | 用链表连接冲突元素 | 寻找下一个空位 |
| 内存占用 | 需要额外的指针空间 | 不需要额外空间 |
| 删除操作 | 简单，直接删除链表节点 | 复杂，需要特殊标记 |
| 缓存友好性 | 差（链表不连续） | 好（数组连续） |
| 适用场景 | 冲突频繁、需要删除 | 冲突较少、缓存友好 |

---

## 4.3 代码实现：哈希表

### 用链地址法实现哈希表

```javascript
// 定义链表节点（用于链地址法）
class HashNode {
  constructor(key, value) {
    this.key = key; // 键
    this.value = value; // 值
    this.next = null; // 指向下一个节点
  }
}

// 哈希表实现
class HashTable {
  constructor(size = 53) {
    this.size = size; // 哈希表大小
    this.table = new Array(size); // 底层数组
    // 初始化每个位置为空
    for (let i = 0; i < size; i++) {
      this.table[i] = null;
    }
  }

  // 哈希函数
  _hash(key) {
    let hash = 0; // 初始哈希值
    // 遍历键的每个字符
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % this.size; // 常用算法
    }
    return hash; // 返回 0 到 size-1 之间的索引
  }

  // 插入键值对 - O(1) 平均
  set(key, value) {
    const index = this._hash(key); // 计算哈希值
    // 如果该位置为空，直接创建新节点
    if (!this.table[index]) {
      this.table[index] = new HashNode(key, value);
      return;
    }
    // 否则遍历链表
    let current = this.table[index];
    // 如果键已存在，更新值
    if (current.key === key) {
      current.value = value;
      return;
    }
    // 找到链表末尾
    while (current.next) {
      // 检查是否有相同的键
      if (current.next.key === key) {
        current.next.value = value; // 更新值
        return;
      }
      current = current.next;
    }
    // 在末尾添加新节点
    current.next = new HashNode(key, value);
  }

  // 获取值 - O(1) 平均
  get(key) {
    const index = this._hash(key); // 计算哈希值
    let current = this.table[index]; // 获取链表头
    // 遍历链表查找键
    while (current) {
      if (current.key === key) {
        return current.value; // 找到，返回值
      }
      current = current.next;
    }
    return undefined; // 没找到
  }

  // 删除键值对 - O(1) 平均
  remove(key) {
    const index = this._hash(key); // 计算哈希值
    let current = this.table[index];
    let prev = null; // 记录前一个节点
    // 遍历链表
    while (current) {
      if (current.key === key) {
        // 找到了
        if (!prev) {
          // 如果是第一个节点
          this.table[index] = current.next; // 直接移除
        } else {
          prev.next = current.next; // 跳过当前节点
        }
        return true; // 删除成功
      }
      prev = current;
      current = current.next;
    }
    return false; // 没找到
  }

  // 检查键是否存在
  has(key) {
    return this.get(key) !== undefined;
  }

  // 获取所有键
  keys() {
    const keys = []; // 存储所有键
    // 遍历整个哈希表
    for (let i = 0; i < this.size; i++) {
      let current = this.table[i];
      while (current) {
        keys.push(current.key); // 收集键
        current = current.next;
      }
    }
    return keys;
  }

  // 获取所有值
  values() {
    const values = [];
    for (let i = 0; i < this.size; i++) {
      let current = this.table[i];
      while (current) {
        values.push(current.value);
        current = current.next;
      }
    }
    return values;
  }
}

// 使用示例
const hashTable = new HashTable();
hashTable.set('name', '张三'); // 插入
hashTable.set('age', 25);
hashTable.set('city', '北京');
console.log(hashTable.get('name')); // 输出：张三
console.log(hashTable.has('age')); // 输出：true
hashTable.remove('city'); // 删除
console.log(hashTable.keys()); // 输出：['name', 'age']
```

### 用开放地址法（线性探测）实现哈希表

```javascript
// 开放地址法实现
class OpenAddressingHashTable {
  constructor(size = 53) {
    this.size = size;
    this.keys = new Array(size); // 存储键
    this.values = new Array(size); // 存储值
    // 初始化
    for (let i = 0; i < size; i++) {
      this.keys[i] = undefined;
      this.values[i] = undefined;
    }
  }

  _hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % this.size;
    }
    return hash;
  }

  // 插入 - O(1) 平均
  set(key, value) {
    let index = this._hash(key); // 计算初始位置
    // 线性探测：寻找空位或已有的键
    while (this.keys[index] !== undefined) {
      if (this.keys[index] === key) {
        // 键已存在，更新值
        this.values[index] = value;
        return;
      }
      index = (index + 1) % this.size; // 移动到下一个位置
    }
    // 找到空位，插入
    this.keys[index] = key;
    this.values[index] = value;
  }

  // 获取 - O(1) 平均
  get(key) {
    let index = this._hash(key);
    // 线性探测：寻找键
    while (this.keys[index] !== undefined) {
      if (this.keys[index] === key) {
        return this.values[index]; // 找到
      }
      index = (index + 1) % this.size;
    }
    return undefined; // 没找到
  }

  // 删除 - 比较复杂
  remove(key) {
    let index = this._hash(key);
    // 找到键的位置
    while (this.keys[index] !== undefined) {
      if (this.keys[index] === key) {
        // 标记为已删除（用特殊值）
        this.keys[index] = 'DELETED';
        this.values[index] = undefined;
        return true;
      }
      index = (index + 1) % this.size;
    }
    return false;
  }
}
```

---

## 4.4 JavaScript 中的哈希表

### Object

JavaScript 的 Object 就是哈希表的实现。

```javascript
// Object 作为哈希表
const user = {
  name: '张三', // 键值对
  age: 25,
  city: '北京',
};

// 访问 - O(1)
console.log(user.name); // 张三
console.log(user['age']); // 25

// 插入 - O(1)
user.email = 'zhangsan@example.com';

// 删除 - O(1)
delete user.city;

// 检查 - O(1)
console.log('name' in user); // true
```

### Map

ES6 引入的 Map 是更规范的哈希表实现。

```javascript
// Map 作为哈希表
const map = new Map();

// 插入
map.set('name', '张三');
map.set('age', 25);
map.set('city', '北京');

// 访问
console.log(map.get('name')); // 张三

// 删除
map.delete('city');

// 检查
console.log(map.has('age')); // true

// 遍历
for (let [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// 获取大小
console.log(map.size); // 2
```

### Object vs Map

| 特性 | Object | Map |
| --- | --- | --- |
| 键的类型 | 只能是字符串或 Symbol | 任意类型（对象、函数等） |
| 键的顺序 | 无序（虽然现代引擎保持插入顺序） | 有序（按插入顺序） |
| 大小 | 需要手动计算 | 有 `size` 属性 |
| 性能 | 优化后很快 | 通常更快 |
| 原型链 | 有原型链干扰 | 没有原型链 |
| 适用场景 | 简单键值对、JSON 数据 | 需要频繁增删、键类型多样 |

```javascript
// ✅ 正确：用 Object 存储简单键值对
const config = {
  host: 'localhost',
  port: 3000,
};

// ✅ 正确：用 Map 存储复杂键或需要频繁增删
const cache = new Map();
cache.set({ id: 1 }, 'data1'); // 键是对象
cache.set({ id: 2 }, 'data2');

// ❌ 错误：用 Object 存储非字符串键
const obj = {};
obj[{ id: 1 }] = 'data'; // 键会被转为字符串 "[object Object]"
```

---

## 4.5 哈希表的应用场景

### 1. 快速查找

```javascript
// 用哈希表实现快速查找
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
];

// ❌ 错误：用数组查找 - O(n)
const user = users.find(u => u.id === 2); // 需要遍历

// ✅ 正确：用哈希表查找 - O(1)
const userMap = new Map(users.map(u => [u.id, u])); // 建立索引
const fastUser = userMap.get(2); // 直接定位
```

### 2. 计数器

```javascript
// 统计字符出现次数
function countCharacters(str) {
  const count = new Map(); // 用 Map 存储计数
  for (let char of str) {
    count.set(char, (count.get(char) || 0) + 1); // 累加计数
  }
  return count;
}

console.log(countCharacters('hello'));
// Map { 'h' => 1, 'e' => 1, 'l' => 2, 'o' => 1 }
```

### 3. 去重

```javascript
// 用 Set（基于哈希表）去重
const arr = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
const unique = [...new Set(arr)]; // [1, 2, 3, 4]

// 用 Map 去重并保留最后出现的
const items = [
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
  { id: 1, name: 'c' }, // 重复的 id
];
const uniqueItems = [...new Map(items.map(item => [item.id, item])).values()];
// [{ id: 1, name: 'c' }, { id: 2, name: 'b' }]
```

### 4. 缓存（LRU）

```javascript
// 用 Map 实现简单缓存
class SimpleCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    // 移到最前面（最近使用）
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // 删除旧的
    } else if (this.cache.size >= this.maxSize) {
      // 满了，删除最久未使用的（第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value); // 插入新的
  }
}

const cache = new SimpleCache(3);
cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);
cache.get('a'); // 访问 a，a 变成最近使用
cache.set('d', 4); // 满了，删除 b（最久未使用）
```

### 5. 两数之和

```javascript
// 经典算法题：两数之和
// 给定一个数组和一个目标值，找出数组中两个数之和等于目标值的下标

// ❌ 错误：暴力解法 - O(n^2)
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}

// ✅ 正确：用哈希表 - O(n)
function twoSum(nums, target) {
  const map = new Map(); // 存储 值 -> 下标
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]; // 计算需要的另一个数
    if (map.has(complement)) {
      // 如果找到了
      return [map.get(complement), i]; // 返回两个下标
    }
    map.set(nums[i], i); // 否则存入当前值
  }
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
```

---

## 4.6 哈希表的性能分析

### 时间复杂度

| 操作 | 平均情况 | 最坏情况 | 说明 |
| --- | --- | --- | --- |
| 插入 | O(1) | O(n) | 最坏情况是所有键都冲突 |
| 查找 | O(1) | O(n) | 最坏情况是链表很长 |
| 删除 | O(1) | O(n) | 最坏情况是链表很长 |

### 影响性能的因素

1. **负载因子（Load Factor）**

```
负载因子 = 元素个数 / 哈希表大小

负载因子越小，冲突越少，性能越好
负载因子越大，冲突越多，性能越差

通常保持负载因子在 0.75 以下
```

2. **哈希函数质量**

```
好的哈希函数：
- 均匀分布，减少冲突
- 计算快速

差的哈希函数：
- 分布不均，冲突频繁
- 计算复杂
```

3. **冲突解决方法**

```
链地址法：
- 冲突频繁时性能下降
- 但不会恶化到 O(n)，除非所有键都冲突

开放地址法：
- 负载因子高时性能急剧下降
- 需要及时调整大小
```

### 动态扩容

当负载因子超过阈值时，哈希表需要扩容。

```javascript
// 模拟扩容过程
class DynamicHashTable {
  constructor(initialSize = 16) {
    this.size = initialSize;
    this.count = 0; // 元素个数
    this.table = new Array(this.size);
    this.loadFactorThreshold = 0.75; // 负载因子阈值
  }

  set(key, value) {
    // 检查是否需要扩容
    if (this.count / this.size >= this.loadFactorThreshold) {
      this._resize(this.size * 2); // 扩容为 2 倍
    }
    // 插入逻辑...
    this.count++;
  }

  _resize(newSize) {
    const oldTable = this.table; // 保存旧表
    this.size = newSize; // 更新大小
    this.table = new Array(this.size); // 创建新表
    this.count = 0; // 重置计数
    // 重新插入所有元素
    for (let bucket of oldTable) {
      let current = bucket;
      while (current) {
        this.set(current.key, current.value); // 重新哈希并插入
        current = current.next;
      }
    }
  }
}
```

---

## 4.7 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 哈希表的定义 | 通过键直接访问值的数据结构 |
| 核心思想 | 键 -> 哈希函数 -> 索引 -> 值 |
| 哈希函数 | 将键映射到索引的函数，要求确定性、均匀性、高效性 |
| 哈希冲突 | 不同的键映射到同一个索引 |
| 链地址法 | 每个位置维护链表，冲突元素挂在同一个链表 |
| 开放地址法 | 冲突时寻找下一个空位（线性探测、二次探测等） |
| 负载因子 | 元素个数 / 哈希表大小，影响性能 |
| 动态扩容 | 负载因子超过阈值时，扩容并重新哈希 |
| JavaScript 实现 | Object 和 Map 都是哈希表 |
| 应用场景 | 快速查找、计数器、去重、缓存、两数之和 |
| 时间复杂度 | 平均 O(1)，最坏 O(n) |

---

## 4.8 新手常见误区

### 误区 1：哈希表的查找总是 O(1)

**错误理解**：哈希表的任何操作都是 O(1)，永远很快。

**正确理解**：哈希表的**平均**时间复杂度是 O(1)，但**最坏情况**是 O(n)。当所有键都冲突时（比如都映射到同一个位置），查找需要遍历整个链表，退化为 O(n)。实际应用中，通过好的哈希函数和合理的负载因子，可以接近 O(1)。

### 误区 2：哈希函数越复杂越好

**错误理解**：哈希函数越复杂，性能越好。

**正确理解**：哈希函数需要在**均匀性**和**计算速度**之间平衡。太复杂的哈希函数计算慢，反而降低整体性能。常用的简单哈希函数（如 DJB2、SDBM）已经足够好。

### 误区 3：Object 和 Map 完全一样，随便用哪个都行

**错误理解**：Object 和 Map 功能一样，只是语法不同。

**正确理解**：Object 的键只能是字符串或 Symbol，Map 的键可以是任意类型。Map 保持插入顺序，有 `size` 属性，性能通常更好。需要频繁增删、键类型多样时用 Map；简单键值对、JSON 数据用 Object。

### 误区 4：哈希表不需要考虑冲突

**错误理解**：只要哈希函数好，就不会有冲突。

**正确理解**：根据鸽巢原理，当元素个数超过哈希表大小时，必然有冲突。再好的哈希函数也不能完全避免冲突，只能减少冲突的概率。必须实现冲突解决机制。

### 误区 5：哈希表适合所有场景

**错误理解**：哈希表查找最快，所以什么场景都用哈希表。

**正确理解**：哈希表适合**快速查找**，但不适合**有序遍历**、**范围查询**。如果需要按顺序遍历数据，用数组或链表；如果需要范围查询（如找 10-20 之间的数），用树结构（如红黑树）。选择数据结构要看具体需求。

---

## 4.9 动手练习

### 练习 1：实现第一个不重复的字符

给定一个字符串，找到第一个不重复的字符，并返回它的索引。如果不存在，返回 -1。

```javascript
function firstUniqChar(s) {
  // 你的代码
}

// 示例
firstUniqChar('leetcode'); // 返回 0（'l' 是第一个不重复的字符）
firstUniqChar('loveleetcode'); // 返回 2（'v' 是第一个不重复的字符）
firstUniqChar('aabb'); // 返回 -1（没有不重复的字符）
```

::: details 点击查看答案

```javascript
function firstUniqChar(s) {
  const count = new Map(); // 统计每个字符出现的次数
  // 第一遍遍历：统计
  for (let char of s) {
    count.set(char, (count.get(char) || 0) + 1);
  }
  // 第二遍遍历：找到第一个出现次数为 1 的字符
  for (let i = 0; i < s.length; i++) {
    if (count.get(s[i]) === 1) {
      return i; // 返回索引
    }
  }
  return -1; // 没找到
}
```

核心思路：用哈希表统计每个字符的出现次数，然后再次遍历字符串，找到第一个出现次数为 1 的字符。

:::

### 练习 2：两个数组的交集

给定两个数组，返回它们的交集（去重）。

```javascript
function intersection(nums1, nums2) {
  // 你的代码
}

// 示例
intersection([1, 2, 2, 1], [2, 2]); // [2]
intersection([4, 9, 5], [9, 4, 9, 8, 4]); // [4, 9] 或 [9, 4]
```

::: details 点击查看答案

```javascript
function intersection(nums1, nums2) {
  const set1 = new Set(nums1); // 将第一个数组转为 Set
  const result = new Set(); // 存储结果（自动去重）
  // 遍历第二个数组
  for (let num of nums2) {
    if (set1.has(num)) {
      // 如果在 set1 中存在
      result.add(num); // 加入结果
    }
  }
  return [...result]; // 转为数组返回
}
```

核心思路：用 Set 去重并快速查找。时间复杂度 O(m + n)，其中 m 和 n 分别是两个数组的长度。

:::

### 练习 3：字母异位词分组

给定一个字符串数组，将字母异位词组合在一起。

字母异位词是指：由相同字母重新排列组成的单词。

```javascript
function groupAnagrams(strs) {
  // 你的代码
}

// 示例
groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
// 返回 [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
// 注意：返回的顺序无所谓
```

::: details 点击查看答案

```javascript
function groupAnagrams(strs) {
  const map = new Map(); // 存储 排序后的字符串 -> 异位词数组
  for (let str of strs) {
    // 将字符串排序，作为键
    const key = str.split('').sort().join('');
    // 如果键不存在，创建新数组
    if (!map.has(key)) {
      map.set(key, []);
    }
    // 将当前字符串加入对应的数组
    map.get(key).push(str);
  }
  // 返回所有数组
  return [...map.values()];
}
```

核心思路：将每个字符串排序后作为键，相同的键说明是异位词。用 Map 存储键到数组的映射。

例如：'eat'、'tea'、'ate' 排序后都是 'aet'，所以它们会被分到同一组。

:::

---

## 4.10 下一章预告

到这里，我们已经学完了数据结构的基础部分——线性结构（数组、链表、栈、队列）和哈希表。这些是日常开发中最常用的数据结构。

下一章我们将进入**树形结构**的世界，学习二叉树、二叉搜索树、平衡树等。树形结构在数据库、文件系统、编译器中有着广泛的应用。我们会搞清楚：

- 树是什么？为什么需要树？
- 二叉树有哪些特殊的性质？
- 什么是二叉搜索树？它怎么做到高效查找的？

学完下一章，你就能理解文件系统、DOM 树、数据库索引等系统的底层原理。
