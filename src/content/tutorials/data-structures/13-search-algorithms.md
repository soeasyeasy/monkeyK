# 第十三章：查找算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 查找算法有哪些？它们之间有什么区别？
- 为什么有时候用线性查找，有时候用二分查找？
- 什么是时间复杂度？怎么衡量查找算法的效率？
- 在实际开发中，应该选择哪种查找方式？

这一章就是为了解答这些问题。我们会从最基础的线性查找讲起，逐步深入到二分查找、哈希查找，最后通过实战对比不同算法的性能差异。

---

## 13.1 为什么需要查找算法？

### 痛点分析

想象一下这个场景：

你有一本 1000 页的字典，想找单词 "algorithm"。你会怎么做？

**方法一**：从第 1 页开始，一页一页翻，直到找到为止。最坏情况下，你要翻完 1000 页。

**方法二**：先翻到中间，发现 "algorithm" 在前半部分，再翻前半部分的中间……每次排除一半，最多翻 10 次就能找到。

这两种方法就是**线性查找**和**二分查找**的区别。

### 生活化类比

> 查找算法就像在图书馆找书：
>
> - **线性查找**：从第一排书架开始，一本书一本书地看，直到找到你要的书
> - **二分查找**：先看中间书架，判断目标在前半区还是后半区，然后缩小范围继续找
> - **哈希查找**：直接查目录索引，一步到位找到书的位置

### 查找算法对比

| 查找方式 | 适用条件 | 时间复杂度 | 生活类比 |
| -------- | -------- | ---------- | -------- |
| 线性查找 | 无序/有序均可 | O(n) | 逐页翻字典 |
| 二分查找 | 必须有序 | O(log n) | 翻字典找单词 |
| 哈希查找 | 需要哈希表 | O(1) | 查目录索引 |
| 插值查找 | 必须有序且均匀分布 | O(log log n) | 估算位置翻字典 |

> **一句话总结**：查找算法的核心目标是用最少的比较次数，快速定位目标元素。

---

## 13.2 核心原理讲解

### 一、线性查找（Linear Search）

**底层原理**：

从数据集的第一个元素开始，逐个与目标值比较，直到找到目标或遍历完所有元素。

**通俗类比**：

> 就像在超市货架上找一瓶特定的饮料——你从左到右，一瓶一瓶看过去。

**执行过程**：

```
数组：[7, 3, 9, 1, 5, 8, 2]
目标：5

第1次比较：7 != 5，继续
第2次比较：3 != 5，继续
第3次比较：9 != 5，继续
第4次比较：1 != 5，继续
第5次比较：5 == 5，找到！返回索引 4
```

### 二、二分查找（Binary Search）

**底层原理**：

在**有序数组**中，每次取中间元素与目标值比较：
- 如果中间元素 == 目标值，查找成功
- 如果中间元素 > 目标值，在左半部分继续查找
- 如果中间元素 < 目标值，在右半部分继续查找

每次比较都将搜索范围缩小一半。

**通俗类比**：

> 就像猜数字游戏：我心里想了一个 1-100 的数字，你每次猜一个数，我告诉你"大了"或"小了"。
> 最优策略是每次都猜中间值——50、25、37……最多 7 次就能猜中。

**执行过程**：

```
有序数组：[1, 2, 3, 5, 7, 8, 9]
目标：7

第1轮：low=0, high=6, mid=3, arr[3]=5 < 7 → 在右半部分
第2轮：low=4, high=6, mid=5, arr[5]=8 > 7 → 在左半部分
第3轮：low=4, high=4, mid=4, arr[4]=7 == 7 → 找到！返回索引 4
```

### 三、哈希查找（Hash Search）

**底层原理**：

通过哈希函数将键（key）映射到数组的某个位置，直接访问该位置获取值。

**通俗类比**：

> 就像查字典的拼音索引——你知道字的拼音（key），通过索引表直接定位到页码（数组位置），一步到位。

**执行过程**：

```
哈希表：{ "apple": 10, "banana": 20, "cherry": 30 }
目标：查找 "banana"

1. 计算哈希值：hash("banana") → 映射到索引 1
2. 直接访问索引 1 的位置 → 得到值 20
```

### 三种查找算法对比

| 特性 | 线性查找 | 二分查找 | 哈希查找 |
| ---- | -------- | -------- | -------- |
| 数据要求 | 无序/有序均可 | 必须有序 | 需要哈希表 |
| 时间复杂度 | O(n) | O(log n) | O(1) 平均 |
| 空间复杂度 | O(1) | O(1) | O(n) |
| 适用场景 | 数据量小、无序 | 数据量大、有序 | 频繁查找、键值对 |
| 实现难度 | 简单 | 中等 | 需要处理冲突 |

---

## 13.3 基础用法

### 一、线性查找

```javascript
// 线性查找函数
function linearSearch(arr, target) {
  // 遍历数组中的每一个元素
  for (let i = 0; i < arr.length; i++) {
    // 如果当前元素等于目标值，返回其索引
    if (arr[i] === target) {
      return i; // 找到目标，返回索引
    }
  }
  // 遍历完整个数组都没找到，返回 -1
  return -1;
}

// 测试
const numbers = [7, 3, 9, 1, 5, 8, 2];
console.log(linearSearch(numbers, 5)); // 输出: 4（索引从0开始，5在第5个位置）
console.log(linearSearch(numbers, 6)); // 输出: -1（6不在数组中）
```

**正确写法**：

```javascript
// ✅ 正确：遍历完再返回 -1
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1; // 循环结束后才返回 -1
}
```

**错误写法**：

```javascript
// ❌ 错误：return -1 放在了循环里面，第一次不匹配就返回了
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
    return -1; // 这里会导致只检查第一个元素就退出
  }
}
```

### 二、二分查找（迭代版）

```javascript
// 二分查找函数（迭代版）
function binarySearch(arr, target) {
  // 定义搜索范围的左右边界
  let low = 0;
  let high = arr.length - 1;

  // 当左边界不超过右边界时，继续查找
  while (low <= high) {
    // 计算中间位置（使用位运算防止溢出）
    let mid = low + Math.floor((high - low) / 2);

    // 中间元素等于目标值，直接返回索引
    if (arr[mid] === target) {
      return mid;
    }
    // 中间元素小于目标值，说明目标在右半部分
    else if (arr[mid] < target) {
      low = mid + 1; // 左边界右移
    }
    // 中间元素大于目标值，说明目标在左半部分
    else {
      high = mid - 1; // 右边界左移
    }
  }

  // 查找完毕没找到，返回 -1
  return -1;
}

// 测试（注意：二分查找要求数组有序）
const sortedArr = [1, 3, 5, 7, 9, 11, 13, 15];
console.log(binarySearch(sortedArr, 7));  // 输出: 3
console.log(binarySearch(sortedArr, 1));  // 输出: 0
console.log(binarySearch(sortedArr, 15)); // 输出: 7
console.log(binarySearch(sortedArr, 8));  // 输出: -1
```

### 三、二分查找（递归版）

```javascript
// 二分查找函数（递归版）
function binarySearchRecursive(arr, target, low = 0, high = arr.length - 1) {
  // 递归终止条件：搜索范围为空
  if (low > high) {
    return -1; // 没找到，返回 -1
  }

  // 计算中间位置
  let mid = low + Math.floor((high - low) / 2);

  // 找到目标，返回索引
  if (arr[mid] === target) {
    return mid;
  }
  // 目标在右半部分，递归搜索右半部分
  else if (arr[mid] < target) {
    return binarySearchRecursive(arr, target, mid + 1, high);
  }
  // 目标在左半部分，递归搜索左半部分
  else {
    return binarySearchRecursive(arr, target, low, mid - 1);
  }
}

// 测试
const sortedArr2 = [2, 4, 6, 8, 10, 12, 14, 16];
console.log(binarySearchRecursive(sortedArr2, 10)); // 输出: 4
console.log(binarySearchRecursive(sortedArr2, 3));  // 输出: -1
```

### 四、哈希查找

```javascript
// 使用 JavaScript 的 Map 实现哈希查找
const hashMap = new Map();

// 插入数据（建立键值对）
hashMap.set("apple", 10);   // 键 "apple"，值 10
hashMap.set("banana", 20);  // 键 "banana"，值 20
hashMap.set("cherry", 30);  // 键 "cherry"，值 30

// 查找数据（O(1) 时间复杂度）
console.log(hashMap.get("banana")); // 输出: 20
console.log(hashMap.get("grape"));  // 输出: undefined（不存在）

// 判断键是否存在
console.log(hashMap.has("apple")); // 输出: true
console.log(hashMap.has("grape")); // 输出: false
```

**使用普通对象实现哈希查找**：

```javascript
// 使用普通对象实现简单的哈希表
function HashTable() {
  // 内部存储数据的对象
  this.table = {};
}

// 插入键值对
HashTable.prototype.put = function(key, value) {
  this.table[key] = value; // 直接以键名存储
};

// 根据键查找值
HashTable.prototype.get = function(key) {
  // 如果键存在，返回值；否则返回 undefined
  return this.table.hasOwnProperty(key) ? this.table[key] : undefined;
};

// 删除键值对
HashTable.prototype.remove = function(key) {
  delete this.table[key]; // 删除指定键
};

// 测试
const ht = new HashTable();
ht.put("name", "张三");
ht.put("age", 25);
ht.put("city", "北京");

console.log(ht.get("name")); // 输出: 张三
console.log(ht.get("age"));  // 输出: 25
console.log(ht.get("job"));  // 输出: undefined
```

---

## 13.4 进阶用法

### 一、查找第一个和最后一个出现的位置

```javascript
// 查找目标值在有序数组中第一次出现的位置
function findFirst(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  let result = -1; // 记录第一次出现的位置

  while (low <= high) {
    let mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) {
      result = mid;      // 记录当前位置
      high = mid - 1;    // 继续向左查找，看有没有更早出现的
    } else if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result; // 返回第一次出现的索引
}

// 查找目标值在有序数组中最后一次出现的位置
function findLast(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  let result = -1; // 记录最后一次出现的位置

  while (low <= high) {
    let mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) {
      result = mid;     // 记录当前位置
      low = mid + 1;    // 继续向右查找，看有没有更晚出现的
    } else if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result; // 返回最后一次出现的索引
}

// 测试
const arr = [1, 2, 2, 2, 3, 4, 5];
console.log(findFirst(arr, 2)); // 输出: 1（第一次出现在索引1）
console.log(findLast(arr, 2));  // 输出: 3（最后一次出现在索引3）
```

### 二、查找旋转排序数组中的最小值

```javascript
// 在一个旋转排序数组中查找最小值
// 例如：[4, 5, 6, 7, 0, 1, 2] 是 [0, 1, 2, 4, 5, 6, 7] 旋转后的结果
function findMin(arr) {
  let low = 0;
  let high = arr.length - 1;

  while (low < high) {
    let mid = low + Math.floor((high - low) / 2);

    // 中间元素大于右边界，说明最小值在右半部分
    if (arr[mid] > arr[high]) {
      low = mid + 1; // 缩小到右半部分
    }
    // 中间元素小于等于右边界，说明最小值在左半部分（包含mid）
    else {
      high = mid; // 注意：不能 mid - 1，因为 mid 可能就是最小值
    }
  }

  // 循环结束时 low === high，指向最小值
  return arr[low];
}

// 测试
console.log(findMin([4, 5, 6, 7, 0, 1, 2])); // 输出: 0
console.log(findMin([3, 4, 5, 1, 2]));       // 输出: 1
console.log(findMin([1, 2, 3, 4, 5]));       // 输出: 1（没有旋转的情况）
```

### 三、二维矩阵中的二分查找

```javascript
// 在一个每行从左到右递增、每列从上到下递增的矩阵中查找目标值
function searchMatrix(matrix, target) {
  // 从矩阵的右上角开始查找
  let row = 0;                    // 起始行
  let col = matrix[0].length - 1; // 起始列（最后一列）

  // 当行和列都在有效范围内时
  while (row < matrix.length && col >= 0) {
    // 当前元素等于目标值
    if (matrix[row][col] === target) {
      return true; // 找到了
    }
    // 当前元素大于目标值，排除当前列（当前列下面的都更大）
    else if (matrix[row][col] > target) {
      col--; // 向左移动一列
    }
    // 当前元素小于目标值，排除当前行（当前行左边的都更小）
    else {
      row++; // 向下移动一行
    }
  }

  // 遍历完没找到
  return false;
}

// 测试
const matrix = [
  [1,  4,  7,  11],
  [2,  5,  8,  12],
  [3,  6,  9,  16],
  [10, 13, 14, 17]
];

console.log(searchMatrix(matrix, 5));  // 输出: true
console.log(searchMatrix(matrix, 20)); // 输出: false
```

### 四、性能对比实验

```javascript
// 生成一个大数组用于测试
const largeArray = [];
for (let i = 0; i < 1000000; i++) {
  largeArray.push(i); // 生成 0 到 999999 的有序数组
}

// 测试线性查找的性能
function testLinearSearch() {
  const start = performance.now(); // 记录开始时间
  const result = largeArray.indexOf(999999); // 查找最后一个元素（最坏情况）
  const end = performance.now(); // 记录结束时间
  console.log(`线性查找耗时: ${(end - start).toFixed(4)} 毫秒`);
  return result;
}

// 测试二分查找的性能
function testBinarySearch() {
  const start = performance.now();
  const result = binarySearch(largeArray, 999999);
  const end = performance.now();
  console.log(`二分查找耗时: ${(end - start).toFixed(4)} 毫秒`);
  return result;
}

// 运行测试
testLinearSearch();  // 通常需要几毫秒
testBinarySearch();  // 通常不到 1 毫秒
```

---

## 13.5 核心知识点总结

| 知识点 | 说明 |
| ------ | ---- |
| 线性查找 | 逐个比较，适用于无序数据，时间复杂度 O(n) |
| 二分查找 | 每次排除一半，要求数据有序，时间复杂度 O(log n) |
| 哈希查找 | 通过哈希函数直接定位，时间复杂度 O(1) |
| 二分查找前提 | 数据必须是有序的 |
| 时间复杂度 | 线性 O(n) > 二分 O(log n) > 哈希 O(1) |
| 空间复杂度 | 线性和二分都是 O(1)，哈希需要额外空间 O(n) |
| 实际选择 | 小数据用线性，有序大数据用二分，频繁查找用哈希 |

---

## 13.6 新手常见误区

### 误区 1：二分查找可以用于无序数组

**错！** 二分查找的前提是数组必须是有序的。

**解释**：二分查找的核心逻辑是"根据中间值判断目标在左半边还是右半边"，如果数组无序，这个判断就失去了意义。

**正确做法**：

```javascript
// ❌ 错误：对无序数组直接使用二分查找
const unsorted = [5, 3, 9, 1, 7];
binarySearch(unsorted, 7); // 结果不可靠

// ✅ 正确：先排序，再二分查找
const sorted = [5, 3, 9, 1, 7].sort((a, b) => a - b); // [1, 3, 5, 7, 9]
binarySearch(sorted, 7); // 输出: 3
```

### 误区 2：计算中间位置用 (low + high) / 2

**有隐患！** 当 low 和 high 都很大时，low + high 可能超出整数范围导致溢出。

**解释**：虽然在 JavaScript 中整数范围很大，但在 Java、C++ 等语言中，两个大整数相加可能溢出。

**正确做法**：

```javascript
// ❌ 不推荐：可能溢出（在 Java/C++ 中）
let mid = Math.floor((low + high) / 2);

// ✅ 推荐：防止溢出
let mid = low + Math.floor((high - low) / 2);

// ✅ 也可以用位运算（更高效）
let mid = low + ((high - low) >> 1);
```

### 误区 3：二分查找的循环条件搞混

**常见错误**：把 `low <= high` 写成 `low < high`。

**解释**：
- `low <= high`：搜索区间是闭区间 [low, high]，包含两端
- `low < high`：搜索区间是半开半闭区间，不包含 high

**正确做法**：

```javascript
// ✅ 标准写法：闭区间 [low, high]
while (low <= high) {
  let mid = low + Math.floor((high - low) / 2);
  if (arr[mid] === target) return mid;
  else if (arr[mid] < target) low = mid + 1;
  else high = mid - 1;
}

// 注意：如果写成 low < high，当目标恰好在 low === high 的位置时会漏掉
```

### 误区 4：哈希查找一定比二分查找快

**不一定！** 哈希查找的平均时间复杂度是 O(1)，但最坏情况（大量哈希冲突）会退化到 O(n)。

**解释**：当不同的键映射到同一个位置时（哈希冲突），需要用链表或其他方式处理冲突，查找效率会下降。

**正确做法**：

```javascript
// 根据实际场景选择：
// - 数据量小且无序 → 线性查找
// - 数据有序 → 二分查找
// - 频繁查找且数据量大 → 哈希查找（注意选择合适的哈希函数）
```

### 误区 5：线性查找太慢，永远不要用

**错！** 线性查找在数据量小或无序场景下是最合适的选择。

**解释**：如果数据量只有几十个，线性查找的简单性反而比二分查找的排序开销更划算。

**正确做法**：

```javascript
// 数据量小（< 100 个）→ 线性查找就够了
const smallArr = [5, 3, 9, 1, 7];
smallArr.indexOf(7); // 简单直接

// 数据量大且有序 → 二分查找
const largeSortedArr = [1, 2, 3, ..., 1000000];
binarySearch(largeSortedArr, 500000); // 高效

// 频繁查找 → 哈希表
const map = new Map(); // 预建索引
map.get(key); // O(1) 快速查找
```

---

## 13.7 动手练习

### 练习 1：基础练习 - 实现线性查找

编写一个函数 `linearSearch(arr, target)`，在数组中查找目标值，返回其索引。如果找到多个匹配，返回第一个匹配的索引。如果没找到，返回 -1。

<details>
<summary>点击查看答案</summary>

```javascript
function linearSearch(arr, target) {
  // 遍历数组
  for (let i = 0; i < arr.length; i++) {
    // 找到第一个匹配的元素，立即返回
    if (arr[i] === target) {
      return i;
    }
  }
  // 没找到，返回 -1
  return -1;
}

// 测试
console.log(linearSearch([4, 2, 7, 1, 9], 7)); // 输出: 2
console.log(linearSearch([4, 2, 7, 1, 9], 5)); // 输出: -1
console.log(linearSearch([3, 3, 3, 3], 3));    // 输出: 0（返回第一个）
```

</details>

### 练习 2：进阶练习 - 二分查找变体

编写一个函数 `searchInsert(arr, target)`，在一个有序数组中查找目标值。如果目标值存在，返回其索引；如果不存在，返回它应该被插入的位置（保持数组有序）。

<details>
<summary>点击查看答案</summary>

```javascript
function searchInsert(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    let mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) {
      return mid; // 找到了，返回索引
    } else if (arr[mid] < target) {
      low = mid + 1; // 目标在右边
    } else {
      high = mid - 1; // 目标在左边
    }
  }

  // 循环结束时，low 就是目标值应该插入的位置
  return low;
}

// 测试
console.log(searchInsert([1, 3, 5, 7], 5)); // 输出: 2（5在索引2）
console.log(searchInsert([1, 3, 5, 7], 2)); // 输出: 1（2应该插在索引1，即1和3之间）
console.log(searchInsert([1, 3, 5, 7], 8)); // 输出: 4（8应该插在末尾）
```

</details>

### 练习 3（挑战）：综合练习 - 搜索旋转排序数组

假设给你一个升序排列但经过旋转的数组（例如 `[4, 5, 6, 7, 0, 1, 2]`），以及一个目标值。编写一个函数在 O(log n) 时间复杂度内查找目标值。如果存在返回索引，否则返回 -1。

<details>
<summary>点击查看答案</summary>

```javascript
function searchRotated(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    let mid = low + Math.floor((high - low) / 2);

    // 找到目标
    if (arr[mid] === target) {
      return mid;
    }

    // 判断 mid 在哪个有序部分
    if (arr[low] <= arr[mid]) {
      // mid 在左边的有序部分
      if (arr[low] <= target && target < arr[mid]) {
        high = mid - 1; // 目标在左半部分
      } else {
        low = mid + 1; // 目标在右半部分
      }
    } else {
      // mid 在右边的有序部分
      if (arr[mid] < target && target <= arr[high]) {
        low = mid + 1; // 目标在右半部分
      } else {
        high = mid - 1; // 目标在左半部分
      }
    }
  }

  return -1; // 没找到
}

// 测试
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); // 输出: 4
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 3)); // 输出: -1
console.log(searchRotated([1], 0));                     // 输出: -1
```

</details>

---

## 13.8 下一章预告

下一章我们将学习 **字符串算法**——如何处理和操作文本数据。你会学到字符串匹配、模式搜索、回文判断等经典算法，这些在实际开发中非常常用。

| 算法 | 时间复杂度 | 适用场景 |
| ---- | ---------- | -------- |
| 线性查找 | O(n) | 无序数据、小数据量 |
| 二分查找 | O(log n) | 有序数据、大数据量 |
| 哈希查找 | O(1) 平均 | 频繁查找、键值对存储 |
