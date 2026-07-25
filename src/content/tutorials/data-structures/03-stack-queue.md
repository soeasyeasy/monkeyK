---
title: '第三章：栈与队列'
description: '栈和队列的原理、实现、应用场景与经典问题'
---

# 第三章：栈与队列

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 栈和队列听起来很抽象，它们到底有什么用？
- 为什么浏览器有"前进/后退"功能？这跟栈有什么关系？
- 什么是"先进先出"和"后进先出"？为什么要有这种限制？
- 消息队列、函数调用栈这些名词经常听到，它们底层是怎么工作的？

这一章就是为了解答这些问题。我们会先搞清楚**栈和队列的工作原理**，再学会用代码实现它们，最后了解它们在实际开发中的各种应用。学完之后，你就能理解函数调用栈、事件循环、浏览器历史记录等核心概念的底层原理。

---

## 3.1 为什么需要栈和队列？

### 痛点分析

想象一下这两个场景：

**场景 1：浏览器的后退功能**

你在浏览器里访问了 A 页面，然后点链接到了 B 页面，又到了 C 页面。现在你想回到 B 页面，点"后退"按钮就行。再点一次，回到 A 页面。

但如果我想从 A 页面直接跳到 C 页面呢？不行，必须按顺序经过 B。这就是**后进先出**的特性——最后访问的页面最先被退回。

**场景 2：打印机的任务队列**

办公室有一台打印机，5 个人同时要打印文件。打印机不可能同时处理 5 个任务，只能一个一个来。谁先提交的请求，谁先被处理。后来的人必须排队等待。

这就是**先进先出**的特性——最先提交的任务最先被处理。

### 生活化类比

> **栈**就像一摞盘子。你只能从最上面放盘子，也只能从最上面拿盘子。最后放上去的盘子最先被拿走。这叫**后进先出（LIFO - Last In First Out）**。
>
> **队列**就像排队买票。先排队的人先买到票，后排队的人后买到票。不能插队。这叫**先进先出（FIFO - First In First Out）**。

```
栈（LIFO）：                    队列（FIFO）：
  |5|                             入口 -> |1|2|3|4|5| -> 出口
  |4|                                     ^           ^
  |3|                                   先出        后出
  |2|
  |1|
  最后放的最先拿              最先排队的最先服务
```

---

## 3.2 栈（Stack）

### 栈的核心原理

**栈**是一种**受限的线性数据结构**，只允许在**一端（栈顶）**进行插入和删除操作。

核心操作：

- **push(value)**：将元素压入栈顶
- **pop()**：将栈顶元素弹出
- **peek()/top()**：查看栈顶元素但不弹出
- **isEmpty()**：判断栈是否为空
- **size()**：获取栈中元素个数

```
栈的操作过程：

初始状态：空栈
[]

push(10)：
[10]

push(20)：
[10, 20]  <- 栈顶

push(30)：
[10, 20, 30]  <- 栈顶

pop()：返回 30
[10, 20]  <- 栈顶

peek()：返回 20（不弹出）
[10, 20]
```

### 代码实现：用数组实现栈

```javascript
// 用数组实现栈
class Stack {
  constructor() {
    this.items = []; // 底层用数组存储
  }

  // 压入栈顶 - O(1)
  push(value) {
    this.items.push(value); // 在数组末尾添加元素
  }

  // 弹出栈顶 - O(1)
  pop() {
    // 检查栈是否为空
    if (this.isEmpty()) {
      throw new Error('栈为空，无法弹出');
    }
    return this.items.pop(); // 删除并返回数组末尾的元素
  }

  // 查看栈顶元素 - O(1)
  peek() {
    // 检查栈是否为空
    if (this.isEmpty()) {
      throw new Error('栈为空');
    }
    return this.items[this.items.length - 1]; // 返回最后一个元素
  }

  // 判断栈是否为空 - O(1)
  isEmpty() {
    return this.items.length === 0; // 检查数组长度
  }

  // 获取栈的大小 - O(1)
  size() {
    return this.items.length; // 返回数组长度
  }

  // 清空栈
  clear() {
    this.items = []; // 重置数组
  }
}

// 使用示例
const stack = new Stack(); // 创建空栈
stack.push(10); // 10
stack.push(20); // 10, 20
stack.push(30); // 10, 20, 30
console.log(stack.peek()); // 输出 30，查看栈顶
console.log(stack.pop()); // 输出 30，弹出栈顶
console.log(stack.peek()); // 输出 20，现在栈顶是 20
console.log(stack.size()); // 输出 2，栈中有 2 个元素
```

### 代码实现：用链表实现栈

```javascript
// 用链表实现栈 - 在头部操作更高效
class StackNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedListStack {
  constructor() {
    this.top = null; // 栈顶指针（链表头部）
    this.size = 0;
  }

  // 压入栈顶 - O(1)
  push(value) {
    const newNode = new StackNode(value); // 创建新节点
    newNode.next = this.top; // 新节点指向原栈顶
    this.top = newNode; // 更新栈顶为新节点
    this.size++;
  }

  // 弹出栈顶 - O(1)
  pop() {
    if (this.isEmpty()) {
      throw new Error('栈为空');
    }
    const removed = this.top; // 保存栈顶节点
    this.top = this.top.next; // 栈顶下移
    this.size--;
    return removed.value;
  }

  // 查看栈顶 - O(1)
  peek() {
    if (this.isEmpty()) {
      throw new Error('栈为空');
    }
    return this.top.value;
  }

  isEmpty() {
    return this.top === null;
  }
}
```

### 栈的应用场景

#### 1. 函数调用栈

JavaScript 引擎用栈来管理函数调用。每次调用函数时，都会创建一个**栈帧**压入栈中，函数返回时弹出。

```javascript
// 函数调用栈示例
function funcA() {
  console.log('进入 funcA');
  funcB(); // 调用 funcB
  console.log('离开 funcA');
}

function funcB() {
  console.log('进入 funcB');
  funcC(); // 调用 funcC
  console.log('离开 funcB');
}

function funcC() {
  console.log('进入 funcC');
  console.log('离开 funcC');
}

funcA(); // 开始调用

// 调用栈变化过程：
// 1. 调用 funcA -> 栈：[funcA]
// 2. funcA 调用 funcB -> 栈：[funcA, funcB]
// 3. funcB 调用 funcC -> 栈：[funcA, funcB, funcC]
// 4. funcC 返回 -> 栈：[funcA, funcB]
// 5. funcB 返回 -> 栈：[funcA]
// 6. funcA 返回 -> 栈：[]（空）
```

#### 2. 括号匹配

检查字符串中的括号是否匹配。

```javascript
// 用栈检查括号是否匹配
function isValidParentheses(s) {
  const stack = new Stack(); // 创建栈
  const map = {
    ')': '(', // 右括号对应左括号
    ']': '[',
    '}': '{',
  };

  for (let char of s) {
    // 如果是左括号，压入栈
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char);
    }
    // 如果是右括号
    else {
      // 栈为空说明没有匹配的左括号
      if (stack.isEmpty()) return false;
      // 弹出栈顶，检查是否匹配
      const top = stack.pop();
      if (top !== map[char]) return false; // 不匹配
    }
  }
  // 最后栈应该为空，说明所有括号都匹配了
  return stack.isEmpty();
}

// 测试
console.log(isValidParentheses('()')); // true
console.log(isValidParentheses('()[]{}')); // true
console.log(isValidParentheses('(]')); // false
console.log(isValidParentheses('([)]')); // false
console.log(isValidParentheses('{[]}')); // true
```

#### 3. 浏览器历史记录

浏览器的后退/前进功能就是用栈实现的。

```javascript
// 模拟浏览器历史记录
class BrowserHistory {
  constructor() {
    this.backStack = new Stack(); // 后退栈
    this.forwardStack = new Stack(); // 前进栈
  }

  // 访问新页面
  visit(url) {
    this.backStack.push(url); // 压入后退栈
    this.forwardStack.clear(); // 清空前进栈
    console.log(`访问：${url}`);
  }

  // 后退
  back() {
    if (this.backStack.size() <= 1) {
      console.log('已经到最后了');
      return;
    }
    const current = this.backStack.pop(); // 从后退栈弹出
    this.forwardStack.push(current); // 压入前进栈
    console.log(`后退到：${this.backStack.peek()}`);
  }

  // 前进
  forward() {
    if (this.forwardStack.isEmpty()) {
      console.log('已经到最前了');
      return;
    }
    const url = this.forwardStack.pop(); // 从前进栈弹出
    this.backStack.push(url); // 压入后退栈
    console.log(`前进到：${url}`);
  }
}

// 使用示例
const browser = new BrowserHistory();
browser.visit('google.com'); // 访问 google
browser.visit('github.com'); // 访问 github
browser.visit('stackoverflow.com'); // 访问 stackoverflow
browser.back(); // 后退到 github
browser.back(); // 后退到 google
browser.forward(); // 前进到 github
```

---

## 3.3 队列（Queue）

### 队列的核心原理

**队列**是一种**受限的线性数据结构**，允许在**一端（队尾）**插入，在**另一端（队头）**删除。

核心操作：

- **enqueue(value)**：将元素加入队尾
- **dequeue()**：将队头元素移出
- **front()/peek()**：查看队头元素但不移出
- **isEmpty()**：判断队列是否为空
- **size()**：获取队列中元素个数

```
队列的操作过程：

初始状态：空队列
[]

enqueue(10)：
[10]

enqueue(20)：
[10, 20]

enqueue(30)：
[10, 20, 30]
 ^队头        ^队尾

dequeue()：返回 10
[20, 30]
 ^队头

front()：返回 20（不移出）
[20, 30]
```

### 代码实现：用数组实现队列

```javascript
// 用数组实现队列 - 简单但效率不高
class ArrayQueue {
  constructor() {
    this.items = []; // 底层用数组存储
  }

  // 加入队尾 - O(1)
  enqueue(value) {
    this.items.push(value); // 在数组末尾添加
  }

  // 移出队头 - O(n) ❌ 效率低
  dequeue() {
    if (this.isEmpty()) {
      throw new Error('队列为空');
    }
    return this.items.shift(); // 删除数组第一个元素，后面的都要前移
  }

  // 查看队头 - O(1)
  front() {
    if (this.isEmpty()) {
      throw new Error('队列为空');
    }
    return this.items[0]; // 返回第一个元素
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}
```

::: warning 性能问题

用数组的 `shift()` 实现 `dequeue()` 时间复杂度是 O(n)，因为删除第一个元素后，后面所有元素都要前移一位。当队列很大时，这会很慢。

:::

### 代码实现：用链表实现队列（推荐）

```javascript
// 用链表实现队列 - O(1) 的入队和出队
class QueueNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedListQueue {
  constructor() {
    this.head = null; // 队头指针
    this.tail = null; // 队尾指针
    this.size = 0;
  }

  // 加入队尾 - O(1)
  enqueue(value) {
    const newNode = new QueueNode(value); // 创建新节点
    if (this.tail) {
      // 队列不为空
      this.tail.next = newNode; // 原队尾指向新节点
    } else {
      // 队列为空
      this.head = newNode;
    }
    this.tail = newNode; // 更新队尾
    this.size++;
  }

  // 移出队头 - O(1)
  dequeue() {
    if (this.isEmpty()) {
      throw new Error('队列为空');
    }
    const removed = this.head; // 保存队头节点
    this.head = this.head.next; // 队头后移
    if (!this.head) {
      // 如果队列空了
      this.tail = null; // 队尾也要清空
    }
    this.size--;
    return removed.value;
  }

  // 查看队头 - O(1)
  front() {
    if (this.isEmpty()) {
      throw new Error('队列为空');
    }
    return this.head.value;
  }

  isEmpty() {
    return this.size === 0;
  }
}

// 使用示例
const queue = new LinkedListQueue();
queue.enqueue(10); // 10
queue.enqueue(20); // 10 <- 20
queue.enqueue(30); // 10 <- 20 <- 30
console.log(queue.front()); // 输出 10
console.log(queue.dequeue()); // 输出 10
console.log(queue.front()); // 输出 20
```

### 队列的应用场景

#### 1. 消息队列

操作系统、Node.js 的事件循环都用到了队列。

```javascript
// 模拟简单的消息队列
class MessageQueue {
  constructor() {
    this.queue = new LinkedListQueue();
  }

  // 发送消息
  sendMessage(message) {
    this.queue.enqueue(message); // 消息入队
    console.log(`发送消息：${message}`);
  }

  // 处理消息
  processMessage() {
    if (this.queue.isEmpty()) {
      console.log('没有消息了');
      return;
    }
    const message = this.queue.dequeue(); // 消息出队
    console.log(`处理消息：${message}`);
  }
}

// 使用示例
const mq = new MessageQueue();
mq.sendMessage('用户登录');
mq.sendMessage('发送邮件');
mq.sendMessage('生成报告');
mq.processMessage(); // 处理：用户登录
mq.processMessage(); // 处理：发送邮件
```

#### 2. 广度优先搜索（BFS）

图的广度优先搜索用队列实现。

```javascript
// 用队列实现广度优先搜索
function bfs(graph, startNode) {
  const queue = new LinkedListQueue(); // 创建队列
  const visited = new Set(); // 记录已访问的节点

  queue.enqueue(startNode); // 起始节点入队
  visited.add(startNode); // 标记为已访问

  while (!queue.isEmpty()) {
    const node = queue.dequeue(); // 出队
    console.log(node); // 访问节点

    // 遍历所有邻居
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        // 如果没访问过
        visited.add(neighbor); // 标记为已访问
        queue.enqueue(neighbor); // 入队
      }
    }
  }
}

// 示例图
const graph = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'F'],
  D: ['B'],
  E: ['B', 'F'],
  F: ['C', 'E'],
};

bfs(graph, 'A'); // 从 A 开始广度优先搜索
// 输出顺序：A -> B -> C -> D -> E -> F
```

#### 3. 打印任务队列

```javascript
// 模拟打印队列
class PrintQueue {
  constructor() {
    this.queue = new LinkedListQueue();
  }

  // 提交打印任务
  submitPrintJob(document) {
    this.queue.enqueue(document);
    console.log(`提交打印任务：${document}`);
  }

  // 处理打印
  processPrint() {
    if (this.queue.isEmpty()) {
      console.log('没有打印任务');
      return;
    }
    const document = this.queue.dequeue();
    console.log(`正在打印：${document}`);
  }
}

const printer = new PrintQueue();
printer.submitPrintJob('报告.pdf');
printer.submitPrintJob('图片.png');
printer.submitPrintJob('表格.xlsx');
printer.processPrint(); // 打印：报告.pdf
printer.processPrint(); // 打印：图片.png
```

---

## 3.4 栈与队列的对比

| 特性 | 栈 | 队列 |
| --- | --- | --- |
| 访问规则 | 后进先出（LIFO） | 先进先出（FIFO） |
| 插入位置 | 栈顶 | 队尾 |
| 删除位置 | 栈顶 | 队头 |
| 核心操作 | push/pop | enqueue/dequeue |
| 应用场景 | 函数调用、括号匹配、撤销操作 | 消息队列、BFS、任务调度 |
| 实现方式 | 数组或链表 | 链表（推荐）或数组 |

---

## 3.5 进阶用法

### 进阶 1：用两个栈实现队列

```javascript
// 用两个栈实现队列
class TwoStackQueue {
  constructor() {
    this.stack1 = new Stack(); // 用于入队
    this.stack2 = new Stack(); // 用于出队
  }

  // 入队 - O(1)
  enqueue(value) {
    this.stack1.push(value); // 直接压入 stack1
  }

  // 出队 - 均摊 O(1)
  dequeue() {
    // 如果 stack2 为空，把 stack1 的元素倒过来
    if (this.stack2.isEmpty()) {
      while (!this.stack1.isEmpty()) {
        this.stack2.push(this.stack1.pop());
      }
    }
    // 如果还是空，说明队列真的空了
    if (this.stack2.isEmpty()) {
      throw new Error('队列为空');
    }
    return this.stack2.pop(); // 从 stack2 弹出
  }

  // 查看队头
  front() {
    if (this.stack2.isEmpty()) {
      while (!this.stack1.isEmpty()) {
        this.stack2.push(this.stack1.pop());
      }
    }
    if (this.stack2.isEmpty()) {
      throw new Error('队列为空');
    }
    return this.stack2.peek();
  }

  isEmpty() {
    return this.stack1.isEmpty() && this.stack2.isEmpty();
  }
}

// 原理：
// stack1: [1, 2, 3] （3 在栈顶）
// 倒到 stack2: [3, 2, 1] （1 在栈顶）
// 从 stack2 弹出，就是 1，符合队列的先进先出
```

### 进阶 2：用队列实现栈

```javascript
// 用两个队列实现栈
class TwoQueueStack {
  constructor() {
    this.queue1 = new LinkedListQueue(); // 主队列
    this.queue2 = new LinkedListQueue(); // 辅助队列
  }

  // 入栈 - O(1)
  push(value) {
    this.queue1.enqueue(value); // 直接入队
  }

  // 出栈 - O(n)
  pop() {
    if (this.queue1.isEmpty()) {
      throw new Error('栈为空');
    }
    // 把 queue1 的前 n-1 个元素移到 queue2
    while (this.queue1.size > 1) {
      this.queue2.enqueue(this.queue1.dequeue());
    }
    // 剩下的最后一个就是要弹出的
    const top = this.queue1.dequeue();
    // 交换 queue1 和 queue2
    [this.queue1, this.queue2] = [this.queue2, this.queue1];
    return top;
  }

  // 查看栈顶 - O(n)
  top() {
    if (this.queue1.isEmpty()) {
      throw new Error('栈为空');
    }
    while (this.queue1.size > 1) {
      this.queue2.enqueue(this.queue1.dequeue());
    }
    const top = this.queue1.dequeue();
    this.queue2.enqueue(top); // 最后一个也要移过去
    [this.queue1, this.queue2] = [this.queue2, this.queue1];
    return top;
  }

  isEmpty() {
    return this.queue1.isEmpty();
  }
}
```

### 进阶 3：最小栈

设计一个支持 `push`、`pop`、`top` 和 `getMin` 操作的栈，要求所有操作都是 O(1)。

```javascript
// 最小栈 - 支持 O(1) 获取最小值
class MinStack {
  constructor() {
    this.stack = new Stack(); // 主栈
    this.minStack = new Stack(); // 辅助栈，存储最小值
  }

  // 压入 - O(1)
  push(value) {
    this.stack.push(value);
    // 如果 minStack 为空，或者新值 <= 当前最小值
    if (this.minStack.isEmpty() || value <= this.getMin()) {
      this.minStack.push(value); // 压入 minStack
    }
  }

  // 弹出 - O(1)
  pop() {
    const value = this.stack.pop();
    // 如果弹出的值等于当前最小值，minStack 也要弹出
    if (value === this.getMin()) {
      this.minStack.pop();
    }
    return value;
  }

  // 查看栈顶 - O(1)
  top() {
    return this.stack.peek();
  }

  // 获取最小值 - O(1)
  getMin() {
    if (this.minStack.isEmpty()) {
      throw new Error('栈为空');
    }
    return this.minStack.peek(); // minStack 栈顶就是最小值
  }
}

// 使用示例
const minStack = new MinStack();
minStack.push(5); // 栈：[5]，最小值：5
minStack.push(3); // 栈：[5, 3]，最小值：3
minStack.push(7); // 栈：[5, 3, 7]，最小值：3
minStack.push(2); // 栈：[5, 3, 7, 2]，最小值：2
console.log(minStack.getMin()); // 输出 2
minStack.pop(); // 弹出 2，最小值变回 3
console.log(minStack.getMin()); // 输出 3
```

---

## 3.6 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 栈的特性 | 后进先出（LIFO），只在栈顶操作 |
| 栈的核心操作 | push（压栈）、pop（弹栈）、peek（查看栈顶） |
| 栈的应用 | 函数调用栈、括号匹配、浏览器后退、撤销操作 |
| 队列的特性 | 先进先出（FIFO），队尾入队，队头出队 |
| 队列的核心操作 | enqueue（入队）、dequeue（出队）、front（查看队头） |
| 队列的应用 | 消息队列、BFS、任务调度、打印队列 |
| 栈的实现 | 数组或链表都可以，在头部操作更高效 |
| 队列的实现 | 推荐用链表（O(1)），数组实现 dequeue 是 O(n) |
| 用栈实现队列 | 两个栈，一个用于入队，一个用于出队 |
| 用队列实现栈 | 两个队列，出栈时把前 n-1 个移到另一个队列 |
| 最小栈 | 用辅助栈存储最小值，保证 getMin 是 O(1) |

---

## 3.7 新手常见误区

### 误区 1：栈和队列是特殊的数组或链表

**错误理解**：栈就是数组，队列就是链表。

**正确理解**：栈和队列是**逻辑结构**，规定了数据的访问规则（LIFO 或 FIFO）。数组和链表是**物理结构**，规定了数据的存储方式。栈可以用数组或链表实现，队列也可以用数组或链表实现。它们是不同层面的概念。

### 误区 2：JavaScript 的 Array 可以直接当栈用，所以不需要学栈

**错误理解**：JavaScript 的 Array 有 push/pop/shift/unshift，直接用就行了，不需要单独学栈。

**正确理解**：虽然 Array 可以实现栈的功能，但理解栈的概念很重要。很多算法（如深度优先搜索、括号匹配、表达式求值）都用栈的思想。而且，用 Array 的 shift 实现队列效率很低（O(n)），应该用链表或专门的队列结构。

### 误区 3：队列的 dequeue 操作是 O(1)

**错误理解**：队列的出队操作是 O(1)，和入队一样快。

**正确理解**：如果用数组实现，dequeue 需要移动所有元素，是 O(n)。只有用链表实现（维护头尾指针），dequeue 才是 O(1)。这也是为什么推荐用链表实现队列。

### 误区 4：栈只能用于函数调用

**错误理解**：栈只在编译器或解释器内部用，业务开发用不到。

**正确理解**：栈的应用非常广泛。浏览器的后退功能、编辑器的撤销功能、深度优先搜索、表达式求值、括号匹配、HTML 的 DOM 树解析，都用到了栈。理解栈有助于理解这些系统的原理。

---

## 3.8 动手练习

### 练习 1：有效的括号

给定一个只包含 `()`、`[]`、`{}` 的字符串，判断字符串是否有效。

有效字符串需满足：

- 左括号必须用相同类型的右括号闭合
- 左括号必须以正确的顺序闭合

```javascript
function isValid(s) {
  // 你的代码
}

// 示例
isValid('()'); // true
isValid('()[]{}'); // true
isValid('(]'); // false
isValid('([)]'); // false
isValid('{[]}'); // true
```

::: details 点击查看答案

```javascript
function isValid(s) {
  const stack = []; // 用数组模拟栈
  const map = {
    ')': '(',
    ']': '[',
    '}': '{',
  };

  for (let char of s) {
    // 如果是左括号，压入栈
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char);
    }
    // 如果是右括号
    else {
      // 栈为空或栈顶不匹配
      if (stack.length === 0 || stack[stack.length - 1] !== map[char]) {
        return false;
      }
      stack.pop(); // 匹配成功，弹出栈顶
    }
  }
  // 最后栈应该为空
  return stack.length === 0;
}
```

核心思路：遇到左括号压栈，遇到右括号检查栈顶是否匹配。最后栈为空说明全部匹配。

:::

### 练习 2：用栈实现队列

请你仅使用两个栈实现先入先出队列。

```javascript
class MyQueue {
  constructor() {
    // 你的代码
  }

  push(x) {
    // 入队
  }

  pop() {
    // 出队
  }

  peek() {
    // 查看队头
  }

  empty() {
    // 判断是否为空
  }
}
```

::: details 点击查看答案

```javascript
class MyQueue {
  constructor() {
    this.stack1 = []; // 用于入队
    this.stack2 = []; // 用于出队
  }

  push(x) {
    this.stack1.push(x); // 直接压入 stack1
  }

  pop() {
    // 如果 stack2 为空，把 stack1 的元素倒过来
    if (this.stack2.length === 0) {
      while (this.stack1.length > 0) {
        this.stack2.push(this.stack1.pop());
      }
    }
    return this.stack2.pop();
  }

  peek() {
    if (this.stack2.length === 0) {
      while (this.stack1.length > 0) {
        this.stack2.push(this.stack1.pop());
      }
    }
    return this.stack2[this.stack2.length - 1];
  }

  empty() {
    return this.stack1.length === 0 && this.stack2.length === 0;
  }
}
```

:::

### 练习 3：逆波兰表达式求值

根据逆波兰表示法（后缀表达式）求值。

```javascript
function evalRPN(tokens) {
  // 你的代码
}

// 示例
evalRPN(['2', '1', '+', '3', '*']); // ((2 + 1) * 3) = 9
evalRPN(['4', '13', '5', '/', '+']); // (4 + (13 / 5)) = 6
```

::: details 点击查看答案

```javascript
function evalRPN(tokens) {
  const stack = []; // 用栈存储操作数

  for (let token of tokens) {
    // 如果是运算符
    if (['+', '-', '*', '/'].includes(token)) {
      const b = stack.pop(); // 弹出右操作数
      const a = stack.pop(); // 弹出左操作数
      let result;
      // 根据运算符计算
      if (token === '+') result = a + b;
      else if (token === '-') result = a - b;
      else if (token === '*') result = a * b;
      else if (token === '/') result = Math.trunc(a / b); // 向零取整
      stack.push(result); // 结果压回栈
    }
    // 如果是数字
    else {
      stack.push(parseInt(token)); // 转为数字压栈
    }
  }
  return stack[0]; // 最后栈里只剩一个元素，就是结果
}
```

核心思路：遇到数字压栈，遇到运算符弹出两个数字计算，结果压回栈。

:::

---

## 3.9 下一章预告

下一章我们将学习一种非常重要的数据结构——**哈希表**。它是实现快速查找的利器，JavaScript 的 Object 和 Map 底层都用到了哈希表。我们会搞清楚：

- 哈希表是怎么做到 O(1) 查找的？
- 什么是哈希函数？什么是哈希冲突？
- 如何解决哈希冲突？

学完下一章，你就能理解字典、缓存、数据库索引等系统的底层原理。
