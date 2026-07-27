---
title: '第二章：数组与链表'
description: '数组和链表的原理、实现、对比与应用场景'
---

# 第二章：数组与链表

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数组我在用啊，不就是 `[1, 2, 3]` 吗？它底层到底是怎么工作的？
- 链表又是什么？为什么有了数组还要搞个链表出来？
- 数组和链表到底哪个更快？为什么有人说数组快，又有人说链表快？
- 实际开发中，什么时候该用数组，什么时候该用链表？

这一章就是为了解答这些问题。我们会从内存层面搞清楚数组和链表的本质区别，学会用代码实现它们，最后掌握如何根据场景选择合适的结构。

---

## 1 为什么需要数组和链表？

### 痛点分析

想象一下你要存储一组数据（比如一个班级的学生成绩），你有两种选择：

**选择 1：把所有学生安排在同一排连续的电影院座位上**

- 优点：想找第 5 个学生，直接数到第 5 个座位就行
- 缺点：中间要插进来一个新学生？后面所有人都得挪一下

**选择 2：让学生分散坐在不同位置，每个人手里拿着下一个人的座位号**

- 优点：要加人？随便找个空位坐下，改一下前一个人的纸条就行
- 缺点：想找第 5 个学生？得从第 1 个开始，一个接一个问过去

这就是**数组**和**链表**的核心区别。

### 生活化类比

> **数组**就像一排储物柜，编号连续。你要找 3 号柜，直接走到 3 号柜面前。但要在 1 号和 2 号之间加个柜子？得把 2 号往后挪、3 号往后挪……
>
> **链表**就像寻宝游戏，每个宝箱里写着下一个宝箱的位置。你可以随时在任意位置插入新宝箱，只要改一下前一个宝箱里的纸条。但想找第 10 个宝箱？得从第 1 个开始一个一个找。

---

## 2 数组（Array）

### 数组的底层原理

**数组**是一种**线性数据结构**，它在内存中占用**连续的空间**。

```
内存中的数组 [10, 20, 30, 40, 50]：

地址:  1000   1004   1008   1012   1016
      +------+------+------+------+------+
值:   |  10  |  20  |  30  |  40  |  50  |
      +------+------+------+------+------+
下标:    0      1      2      3      4
```

关键特性：

- **连续存储**：元素在内存中紧挨着排列
- **固定大小**：创建时需要指定容量，通常不能动态扩展
- **随机访问**：可以通过下标直接访问任意元素，时间复杂度 O(1)

### 为什么数组能 O(1) 访问？

数组的每个元素占用相同大小的内存。假设每个元素占 4 字节，起始地址是 1000：

```
访问 arr[3] 的计算过程：

目标地址 = 起始地址 + 下标 * 元素大小
         = 1000 + 3 * 4
         = 1012

CPU 直接跳到 1012 地址，取出数据，一步到位。
```

打个比方：

> 就像一排编号连续的储物柜，你要找 3 号柜，不需要从 1 号开始数，直接走到 3 号柜面前就行。因为你知道每个柜子多宽，算一下就知道 3 号柜在哪。

### 数组的基本操作与时间复杂度

| 操作 | 时间复杂度 | 说明 |
| --- | --- | --- |
| 访问 arr[i] | O(1) | 通过下标直接定位 |
| 修改 arr[i] | O(1) | 通过下标直接定位后修改 |
| 在末尾插入 | O(1) | 直接在下一个空位放入（不考虑扩容） |
| 在开头插入 | O(n) | 所有元素都要后移一位 |
| 在中间插入 | O(n) | 插入位置后的元素都要后移 |
| 删除末尾元素 | O(1) | 直接移除 |
| 删除开头元素 | O(n) | 所有元素都要前移一位 |
| 查找某元素 | O(n) | 需要遍历（除非已排序可用二分查找） |

### 代码实现：手动实现一个简易数组

```javascript
// 手动实现一个简易的数组类，帮助理解底层原理
class MyArray {
  constructor(capacity = 10) {
    this.data = new Array(capacity); // 创建指定容量的底层存储
    this.length = 0; // 当前元素个数
    this.capacity = capacity; // 数组容量
  }

  // 通过下标访问元素 - O(1)
  get(index) {
    // 检查下标是否越界
    if (index < 0 || index >= this.length) {
      throw new Error('下标越界');
    }
    // 直接通过下标访问底层数组
    return this.data[index];
  }

  // 在末尾添加元素 - O(1)
  push(value) {
    // 检查是否已满，满了就扩容
    if (this.length === this.capacity) {
      this._resize(this.capacity * 2); // 扩容为原来的 2 倍
    }
    // 在 length 位置放入新值
    this.data[this.length] = value;
    // 长度加 1
    this.length++;
  }

  // 在指定位置插入元素 - O(n)
  insert(index, value) {
    // 检查下标合法性
    if (index < 0 || index > this.length) {
      throw new Error('下标越界');
    }
    // 如果满了就扩容
    if (this.length === this.capacity) {
      this._resize(this.capacity * 2);
    }
    // 从后往前，把 index 及之后的元素都后移一位
    for (let i = this.length; i > index; i--) {
      this.data[i] = this.data[i - 1]; // 后移
    }
    // 在 index 位置放入新值
    this.data[index] = value;
    // 长度加 1
    this.length++;
  }

  // 删除指定位置的元素 - O(n)
  remove(index) {
    // 检查下标合法性
    if (index < 0 || index >= this.length) {
      throw new Error('下标越界');
    }
    // 保存要删除的值
    const value = this.data[index];
    // 从前往后，把 index 之后的元素都前移一位
    for (let i = index; i < this.length - 1; i++) {
      this.data[i] = this.data[i + 1]; // 前移
    }
    // 长度减 1
    this.length--;
    // 返回被删除的值
    return value;
  }

  // 内部方法：扩容或缩容
  _resize(newCapacity) {
    const newData = new Array(newCapacity); // 创建新数组
    // 把旧数组的元素复制到新数组
    for (let i = 0; i < this.length; i++) {
      newData[i] = this.data[i];
    }
    // 替换底层存储
    this.data = newData;
    // 更新容量
    this.capacity = newCapacity;
  }
}

// 使用示例
const arr = new MyArray(4); // 创建容量为 4 的数组
arr.push(10); // 添加元素
arr.push(20);
arr.push(30);
console.log(arr.get(1)); // 输出 20，O(1) 访问
arr.insert(1, 15); // 在下标 1 处插入 15，后面的元素后移
console.log(arr.get(1)); // 输出 15
console.log(arr.get(2)); // 输出 20（原来的 20 被挤到了下标 2）
arr.remove(0); // 删除下标 0 的元素，后面的元素前移
```

### 数组的正确与错误用法

```javascript
// ✅ 正确：用数组存储同类型、需要随机访问的数据
const scores = [85, 92, 78, 96, 88]; // 学生成绩，需要通过下标快速访问
const thirdScore = scores[2]; // O(1) 直接访问第 3 个元素

// ✅ 正确：在末尾添加/删除元素
scores.push(90); // O(1) 在末尾添加
scores.pop(); // O(1) 删除末尾元素

// ❌ 错误：频繁在数组开头插入/删除
// 每次操作都要移动所有元素，效率很低
const queue = [];
queue.unshift(item); // O(n) - 不要用数组实现队列！

// ❌ 错误：用数组做大量查找操作（未排序时）
// 如果经常需要查找，应该用哈希表或树结构
const userData = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
const user = userData.find(u => u.id === 2); // O(n) 每次都要遍历
```

---

## 3 链表（Linked List）

### 链表的底层原理

**链表**是一种**线性数据结构**，但它在内存中**不要求连续的空间**。每个元素（称为**节点**）包含两部分：

- **数据域**：存储实际的数据
- **指针域**：存储下一个节点的地址（引用）

```
链表的结构：

头节点                                    尾节点
  |                                         |
  v                                         v
+------+------+    +------+------+    +------+------+
| data | next |--> | data | next |--> | data | null |
|  10  |      |    |  20  |      |    |  30  |      |
+------+------+    +------+------+    +------+------+
```

关键特性：

- **不连续存储**：节点可以分散在内存的任何位置
- **动态大小**：可以随时添加/删除节点，不需要预先指定容量
- **顺序访问**：必须从头节点开始，顺着指针一个一个找，不能跳级

### 为什么链表插入删除快？

```
在链表中插入一个节点：

插入前：A -> B -> C
插入 X 到 A 和 B 之间：

步骤 1：X.next = B     （让 X 指向 B）
步骤 2：A.next = X     （让 A 指向 X）

结果：A -> X -> B -> C

只需要修改两个指针，不需要移动任何数据！时间复杂度 O(1)。
```

打个比方：

> 链表就像一列火车。要在中间加一节车厢？断开连接，把新车厢接上去就行。要移除一节？断开前后连接就行。不需要让其他车厢移动。

### 链表的分类

| 类型 | 结构 | 特点 |
| --- | --- | --- |
| 单链表 | 每个节点只有一个 next 指针 | 只能从前往后遍历 |
| 双链表 | 每个节点有 next 和 prev 两个指针 | 可以双向遍历 |
| 循环链表 | 尾节点的 next 指向头节点 | 形成环，可以从任意节点遍历一圈 |

```
单链表：
A -> B -> C -> null

双链表：
null <- A <-> B <-> C -> null

循环链表：
A -> B -> C ->
^            |
|____________|
```

### 代码实现：单链表

```javascript
// 定义链表节点
class ListNode {
  constructor(value) {
    this.value = value; // 存储数据
    this.next = null; // 指向下一个节点的指针
  }
}

// 定义单链表
class LinkedList {
  constructor() {
    this.head = null; // 头节点
    this.length = 0; // 链表长度
  }

  // 在链表头部添加节点 - O(1)
  prepend(value) {
    const newNode = new ListNode(value); // 创建新节点
    newNode.next = this.head; // 新节点指向原来的头节点
    this.head = newNode; // 更新头节点为新节点
    this.length++; // 长度加 1
  }

  // 在链表尾部添加节点 - O(n)
  append(value) {
    const newNode = new ListNode(value); // 创建新节点
    // 如果链表为空，直接设为头节点
    if (!this.head) {
      this.head = newNode;
      this.length++;
      return;
    }
    // 否则找到最后一个节点
    let current = this.head; // 从头开始
    while (current.next) { // 一直走到最后一个
      current = current.next;
    }
    current.next = newNode; // 最后一个节点指向新节点
    this.length++;
  }

  // 在指定位置插入节点 - O(n)
  insert(index, value) {
    // 检查下标合法性
    if (index < 0 || index > this.length) {
      throw new Error('下标越界');
    }
    // 在头部插入
    if (index === 0) {
      this.prepend(value);
      return;
    }
    // 找到插入位置的前一个节点
    const newNode = new ListNode(value); // 创建新节点
    let current = this.head; // 从头开始
    // 走到 index - 1 的位置
    for (let i = 0; i < index - 1; i++) {
      current = current.next;
    }
    // 插入新节点
    newNode.next = current.next; // 新节点指向下一个节点
    current.next = newNode; // 前一个节点指向新节点
    this.length++;
  }

  // 查找指定值的节点 - O(n)
  find(value) {
    let current = this.head; // 从头开始
    while (current) { // 还没到末尾
      if (current.value === value) {
        return current; // 找到了
      }
      current = current.next; // 继续下一个
    }
    return null; // 没找到
  }

  // 删除指定值的节点 - O(n)
  remove(value) {
    // 如果链表为空
    if (!this.head) return null;
    // 如果要删除的是头节点
    if (this.head.value === value) {
      const removed = this.head; // 保存头节点
      this.head = this.head.next; // 头节点后移
      this.length--;
      return removed;
    }
    // 否则找到要删除节点的前一个节点
    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        const removed = current.next; // 保存要删除的节点
        current.next = current.next.next; // 跳过要删除的节点
        this.length--;
        return removed;
      }
      current = current.next;
    }
    return null; // 没找到
  }

  // 遍历链表
  traverse() {
    const result = []; // 存储遍历结果
    let current = this.head; // 从头开始
    while (current) { // 还没到末尾
      result.push(current.value); // 收集值
      current = current.next; // 移动到下一个
    }
    return result;
  }
}

// 使用示例
const list = new LinkedList(); // 创建空链表
list.append(10); // 10 -> null
list.append(20); // 10 -> 20 -> null
list.append(30); // 10 -> 20 -> 30 -> null
list.prepend(5); // 5 -> 10 -> 20 -> 30 -> null
list.insert(2, 15); // 5 -> 10 -> 15 -> 20 -> 30 -> null
console.log(list.traverse()); // [5, 10, 15, 20, 30]
list.remove(15); // 删除值为 15 的节点
console.log(list.traverse()); // [5, 10, 20, 30]
```

### 代码实现：双链表

```javascript
// 双链表节点 - 比单链表多一个 prev 指针
class DoublyListNode {
  constructor(value) {
    this.value = value; // 存储数据
    this.prev = null; // 指向前一个节点的指针
    this.next = null; // 指向后一个节点的指针
  }
}

// 双链表
class DoublyLinkedList {
  constructor() {
    this.head = null; // 头节点
    this.tail = null; // 尾节点
    this.length = 0;
  }

  // 在尾部添加 - O(1)，因为有 tail 指针
  append(value) {
    const newNode = new DoublyListNode(value); // 创建新节点
    if (!this.tail) {
      // 链表为空
      this.head = newNode;
      this.tail = newNode;
    } else {
      // 链表不为空
      this.tail.next = newNode; // 原尾节点指向新节点
      newNode.prev = this.tail; // 新节点指向前一个节点（原尾节点）
      this.tail = newNode; // 更新尾节点
    }
    this.length++;
  }

  // 在头部添加 - O(1)
  prepend(value) {
    const newNode = new DoublyListNode(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.head.prev = newNode; // 原头节点的 prev 指向新节点
      newNode.next = this.head; // 新节点指向原头节点
      this.head = newNode; // 更新头节点
    }
    this.length++;
  }

  // 双向遍历 - 可以从尾到头
  traverseReverse() {
    const result = [];
    let current = this.tail; // 从尾开始
    while (current) {
      result.push(current.value);
      current = current.prev; // 向前移动
    }
    return result;
  }
}

// 使用示例
const dList = new DoublyLinkedList();
dList.append(10); // 10
dList.append(20); // 10 <-> 20
dList.append(30); // 10 <-> 20 <-> 30
dList.prepend(5); // 5 <-> 10 <-> 20 <-> 30
console.log(dList.traverseReverse()); // [30, 20, 10, 5]
```

---

## 4 数组 vs 链表：全面对比

| 特性 | 数组 | 链表 |
| --- | --- | --- |
| 内存分布 | 连续 | 不连续 |
| 访问元素 | O(1) 随机访问 | O(n) 顺序访问 |
| 头部插入 | O(n) | O(1) |
| 尾部插入 | O(1) | O(n)（无尾指针）/ O(1)（有尾指针） |
| 中间插入 | O(n) | O(n)（需要先找到位置） |
| 删除元素 | O(n) | O(n)（需要先找到位置） |
| 内存占用 | 较小（只存数据） | 较大（额外存指针） |
| 缓存友好性 | 好（连续内存，CPU 缓存命中率高） | 差（分散内存，缓存命中率低） |
| 大小灵活性 | 固定或需要扩容 | 动态扩展 |

### 如何选择？

| 场景 | 推荐结构 | 原因 |
| --- | --- | --- |
| 需要频繁通过下标访问 | 数组 | O(1) 随机访问 |
| 数据量固定或变化不大 | 数组 | 不需要动态扩容 |
| 频繁在头部插入/删除 | 链表 | O(1) 操作 |
| 需要动态管理内存 | 链表 | 不需要预先分配 |
| 需要顺序遍历且数据量大 | 数组 | 缓存友好，实际更快 |
| 实现栈/队列 | 看具体需求 | 两者都可以，但链表在某些操作上更高效 |

---

## 5 进阶用法

### 进阶 1：数组的动态扩容

很多语言的标准库实现了动态数组（如 JavaScript 的 Array、Java 的 ArrayList）。它们的扩容策略通常是**容量翻倍**。

```javascript
// 模拟动态数组的扩容策略
class DynamicArray {
  constructor() {
    this.data = new Array(4); // 初始容量
    this.length = 0;
    this.capacity = 4;
  }

  push(value) {
    // 当元素个数等于容量时，扩容
    if (this.length === this.capacity) {
      this._resize(this.capacity * 2); // 容量翻倍
    }
    this.data[this.length++] = value;
  }

  _resize(newCapacity) {
    const newData = new Array(newCapacity);
    for (let i = 0; i < this.length; i++) {
      newData[i] = this.data[i]; // 复制旧数据
    }
    this.data = newData;
    this.capacity = newCapacity;
  }
}

// 扩容过程：
// 容量 4 -> 8 -> 16 -> 32 -> ...
// 虽然单次扩容是 O(n)，但均摊下来每次 push 仍然是 O(1)
```

### 进阶 2：链表的经典算法题 - 反转链表

```javascript
// 反转单链表 - 经典面试题
function reverseList(head) {
  let prev = null; // 前一个节点，初始为 null
  let current = head; // 当前节点，从头开始
  while (current) {
    const next = current.next; // 先保存下一个节点
    current.next = prev; // 当前节点指向前一个（反转）
    prev = current; // prev 前进一步
    current = next; // current 前进一步
  }
  return prev; // 新的头节点是原来的尾节点
}

// 过程图解：
// 原始：1 -> 2 -> 3 -> null
// 第 1 步：null <- 1    2 -> 3 -> null
// 第 2 步：null <- 1 <- 2    3 -> null
// 第 3 步：null <- 1 <- 2 <- 3
// 返回 prev（指向 3），即新的头节点
```

### 进阶 3：判断链表是否有环

```javascript
// 用快慢指针判断链表是否有环
function hasCycle(head) {
  if (!head) return false;
  let slow = head; // 慢指针，每次走一步
  let fast = head; // 快指针，每次走两步
  while (fast && fast.next) {
    slow = slow.next; // 慢指针走一步
    fast = fast.next.next; // 快指针走两步
    if (slow === fast) return true; // 快慢指针相遇，说明有环
  }
  return false; // 快指针走到了末尾，说明没有环
}

// 原理：如果链表有环，快指针一定会追上慢指针
// 就像操场跑步，跑得快的人一定会追上跑得慢的人
```

---

## 6 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 数组的存储方式 | 连续内存，通过下标直接计算地址 |
| 数组的优势 | O(1) 随机访问，缓存友好 |
| 数组的劣势 | 插入删除需要移动元素，大小固定 |
| 链表的存储方式 | 不连续内存，通过指针连接 |
| 链表的优势 | 插入删除只需修改指针，动态大小 |
| 链表的劣势 | O(n) 顺序访问，额外内存开销 |
| 单链表 vs 双链表 | 单链表只能单向遍历，双链表可以双向遍历 |
| 选择依据 | 根据访问模式和修改频率决定 |
| 动态数组扩容 | 容量翻倍策略，均摊 O(1) |
| 经典算法 | 反转链表、快慢指针判断环 |

---

## 7 新手常见误区

### 误区 1：链表插入删除是 O(1)，所以比数组快

**错误理解**：链表任何位置的插入删除都是 O(1)。

**正确理解**：链表只有在**已知插入/删除位置**的情况下才是 O(1)。如果要先找到位置，查找过程本身就是 O(n)。所以整体复杂度仍然是 O(n)。数组虽然移动元素是 O(n)，但如果已经知道位置，插入本身是 O(n)（因为要移动）。

### 误区 2：数组在内存中一定是连续的，所以永远比链表快

**错误理解**：数组因为连续存储，所以任何情况下都比链表快。

**正确理解**：数组在**随机访问**和**遍历**时确实更快（缓存友好）。但在**频繁插入删除**的场景下，数组需要移动大量元素，反而比链表慢。选择取决于具体操作模式。

### 误区 3：JavaScript 的 Array 就是数组

**错误理解**：JavaScript 的 Array 底层就是 C 语言那种连续内存的数组。

**正确理解**：JavaScript 的 Array 实际上是**对象**，底层实现可能是哈希表或动态数组，取决于引擎优化。它更像是一个"列表"而不是传统意义上的数组。但在概念上，我们仍然用数组的思维来使用它。

### 误区 4：链表不常用，学了没用

**错误理解**：链表只存在于教科书和面试中，实际开发用不到。

**正确理解**：链表是很多高级数据结构的基础。LRU 缓存、哈希表的冲突解决、操作系统的内存管理、浏览器的历史记录，底层都用到了链表。理解链表有助于理解这些系统的工作原理。

---

## 8 动手练习

### 练习 1：合并两个有序数组

将两个已排序的数组合并成一个有序数组。

```javascript
function mergeSortedArrays(arr1, arr2) {
  // 你的代码
}

// 示例
mergeSortedArrays([1, 3, 5], [2, 4, 6]); // 应该返回 [1, 2, 3, 4, 5, 6]
```

::: details 点击查看答案

```javascript
function mergeSortedArrays(arr1, arr2) {
  const result = []; // 存储结果
  let i = 0; // arr1 的指针
  let j = 0; // arr2 的指针
  // 比较两个数组的元素，谁小就先放谁
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] < arr2[j]) {
      result.push(arr1[i]); // arr1 的元素更小
      i++; // arr1 指针后移
    } else {
      result.push(arr2[j]); // arr2 的元素更小或相等
      j++; // arr2 指针后移
    }
  }
  // 把剩余的元素追加到结果中
  while (i < arr1.length) result.push(arr1[i++]);
  while (j < arr2.length) result.push(arr2[j++]);
  return result;
}
```

时间复杂度 O(m + n)，其中 m 和 n 分别是两个数组的长度。

:::

### 练习 2：删除链表的倒数第 N 个节点

给定一个链表，删除链表的倒数第 n 个节点。

```javascript
// 链表节点定义
class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

function removeNthFromEnd(head, n) {
  // 你的代码
}

// 示例
// 1 -> 2 -> 3 -> 4 -> 5, n = 2
// 删除倒数第 2 个节点（值为 4）
// 结果：1 -> 2 -> 3 -> 5
```

::: details 点击查看答案

```javascript
function removeNthFromEnd(head, n) {
  // 使用快慢指针
  const dummy = new ListNode(0); // 虚拟头节点，简化边界处理
  dummy.next = head;
  let fast = dummy; // 快指针
  let slow = dummy; // 慢指针
  // 快指针先走 n + 1 步
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }
  // 然后快慢指针一起走
  while (fast) {
    fast = fast.next; // 快指针继续走
    slow = slow.next; // 慢指针也开始走
  }
  // 当快指针到达末尾时，慢指针正好在倒数第 n + 1 个节点
  slow.next = slow.next.next; // 删除倒数第 n 个节点
  return dummy.next; // 返回新的头节点
}
```

核心思路：让快指针先走 n+1 步，然后快慢指针一起走。当快指针到达末尾时，慢指针正好在倒数第 n+1 个位置，就可以删除下一个节点了。

:::

### 练习 3：实现 LRU 缓存

设计一个 LRU（最近最少使用）缓存，支持以下操作：

- `get(key)`：如果 key 存在，返回对应的值，否则返回 -1
- `put(key, value)`：插入或更新键值对。如果缓存满了，删除最久未使用的项

要求两个操作的时间复杂度都是 O(1)。

::: details 点击查看答案

LRU 缓存的最佳实现是**哈希表 + 双链表**。

- 哈希表：O(1) 查找
- 双链表：O(1) 插入/删除，维护使用顺序

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity; // 缓存容量
    this.cache = new Map(); // 哈希表，key -> 链表节点
    this.head = new ListNode(0, 0); // 虚拟头节点
    this.tail = new ListNode(0, 0); // 虚拟尾节点
    this.head.next = this.tail; // 头尾相连
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.cache.has(key)) return -1; // 不存在
    const node = this.cache.get(key); // 获取节点
    this._moveToHead(node); // 移到头部（标记为最近使用）
    return node.value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      // 已存在，更新值
      const node = this.cache.get(key);
      node.value = value;
      this._moveToHead(node);
    } else {
      // 不存在，创建新节点
      const newNode = new ListNode(key, value);
      this.cache.set(key, newNode);
      this._addToHead(newNode);
      // 如果超过容量，删除最久未使用的（尾部）
      if (this.cache.size > this.capacity) {
        const removed = this._removeTail();
        this.cache.delete(removed.key);
      }
    }
  }

  _addToHead(node) {
    // 添加到头部
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    // 从链表中移除节点
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _moveToHead(node) {
    // 移到头部
    this._removeNode(node);
    this._addToHead(node);
  }

  _removeTail() {
    // 移除尾部节点（最久未使用）
    const removed = this.tail.prev;
    this._removeNode(removed);
    return removed;
  }
}

class ListNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}
```

:::

---

## 9 下一章预告

下一章我们将学习两种基于数组或链表实现的特殊数据结构——**栈与队列**。它们限制了数据的访问方式，但正是这种限制让它们在特定场景下非常高效。我们会搞清楚：

- 栈的"后进先出"是什么意思？
- 队列的"先进先出"又是什么？
- 它们在浏览器、操作系统中有哪些实际应用？

学完下一章，你就能理解函数调用栈、事件循环、消息队列等核心概念的底层原理。
