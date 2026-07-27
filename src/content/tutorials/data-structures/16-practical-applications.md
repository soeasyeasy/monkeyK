# 第十六章：数据结构实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 学了这么多数据结构，实际开发中到底怎么用？
- 面对一个问题，如何判断应该用哪种数据结构？
- 前端开发中有哪些数据结构的应用场景？
- 如何分析算法的时间复杂度和空间复杂度？

这一章就是为了解答这些问题。我们会通过真实的开发场景，综合运用前面学到的数组、链表、栈、队列、树、图等数据结构，掌握如何选择合适的数据结构解决问题，以及如何评估算法的效率。

---

## 1 为什么需要数据结构实战？

### 痛点分析

想象一下这些场景：

**场景一**：你在开发一个浏览器的前进后退功能。用户点击链接时，需要记录历史；点击后退时，需要回到上一个页面。用什么数据结构最合适？

**场景二**：你在开发一个任务调度系统，有多个任务需要按优先级执行。有的任务紧急，有的任务可以延后。如何高效地管理这些任务？

**场景三**：你在开发一个路由系统，需要匹配 URL 路径。例如 `/user/123/profile` 要匹配到对应的处理函数。如何快速找到匹配的路由？

**场景四**：你在开发一个组件库，组件之间有依赖关系。例如 Button 依赖 Icon，Modal 依赖 Button。如何确定加载顺序？

这些问题的核心是**选择合适的数据结构**来解决实际问题。

### 生活化类比

> 数据结构实战就像是装修房子：
>
> - **选数据结构**：就像选家具——不同的房间需要不同的家具
> - **分析复杂度**：就像量尺寸——确保家具放得下
> - **优化算法**：就像调整布局——让空间利用更合理

### 常见应用场景

| 场景 | 推荐数据结构 | 原因 |
| ---- | ------------ | ---- |
| 浏览器历史 | 栈 | 后进先出，符合前进后退逻辑 |
| 任务调度 | 堆（优先队列） | 快速取出优先级最高的任务 |
| 路由匹配 | 字典树 | 前缀匹配，快速查找 |
| 依赖管理 | 图 + 拓扑排序 | 处理依赖关系，确定顺序 |
| 缓存系统 | 哈希表 + 双向链表 | O(1) 查找和更新 |
| 搜索建议 | 字典树 | 前缀补全 |
| 社交网络 | 图 | 表示用户关系 |
| 撤销操作 | 栈 | 记录操作历史 |

> **一句话总结**：数据结构实战的核心是"根据问题特点选择合适的数据结构"。

---

## 2 核心原理讲解

### 一、如何选择数据结构

**决策流程**：

```
1. 分析数据特点
   - 数据量大小？
   - 是否需要有序？
   - 是否有层级关系？
   - 是否有网络关系？

2. 分析操作需求
   - 主要操作是什么？（查找/插入/删除）
   - 操作频率如何？
   - 对性能要求多高？

3. 选择数据结构
   - 线性数据 → 数组/链表/栈/队列
   - 层级数据 → 树
   - 网络数据 → 图
   - 键值对 → 哈希表
   - 优先级 → 堆

4. 评估复杂度
   - 时间复杂度是否满足要求？
   - 空间复杂度是否可接受？
```

**通俗类比**：

> 就像选择交通工具：
> - 短距离 → 步行（简单直接）
> - 中距离 → 自行车（平衡效率）
> - 长距离 → 汽车（快速高效）
> - 跨海 → 飞机（特殊需求）

### 二、复杂度分析

**时间复杂度**：

| 复杂度 | 名称 | 示例 | 可接受度 |
| ------ | ---- | ---- | -------- |
| O(1) | 常数时间 | 哈希表查找 | 最优 |
| O(log n) | 对数时间 | 二分查找 | 很好 |
| O(n) | 线性时间 | 遍历数组 | 可接受 |
| O(n log n) | 线性对数 | 快速排序 | 一般 |
| O(n^2) | 平方时间 | 冒泡排序 | 较差 |
| O(2^n) | 指数时间 | 递归斐波那契 | 不可接受 |

**空间复杂度**：

```javascript
// O(1) 空间：只使用常数个变量
function sum(arr) {
  let total = 0; // 一个变量
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

// O(n) 空间：创建了新数组
function double(arr) {
  const result = []; // 新数组，长度与原数组相同
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i] * 2);
  }
  return result;
}

// O(n^2) 空间：创建了二维数组
function createMatrix(n) {
  const matrix = []; // n x n 的矩阵
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = 0;
    }
  }
  return matrix;
}
```

### 三、常见模式

**滑动窗口**：

```javascript
// 问题：找出数组中和最大的长度为 k 的连续子数组
function maxSumSubarray(arr, k) {
  let maxSum = 0;
  let windowSum = 0;

  // 计算第一个窗口的和
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;

  // 滑动窗口
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum + arr[i] - arr[i - k]; // 加入新元素，移除旧元素
    maxSum = Math.max(maxSum, windowSum); // 更新最大值
  }

  return maxSum;
}

// 测试
console.log(maxSumSubarray([2, 1, 5, 1, 3, 2], 3)); // 输出: 9（[5, 1, 3]）
```

**双指针**：

```javascript
// 问题：在有序数组中找两个数，使它们的和等于目标值
function twoSum(arr, target) {
  let left = 0; // 左指针
  let right = arr.length - 1; // 右指针

  while (left < right) {
    const sum = arr[left] + arr[right];

    if (sum === target) {
      return [left, right]; // 找到答案
    } else if (sum < target) {
      left++; // 和太小，左指针右移
    } else {
      right--; // 和太大，右指针左移
    }
  }

  return [-1, -1]; // 没找到
}

// 测试
console.log(twoSum([1, 2, 3, 4, 6], 6)); // 输出: [1, 3]（2 + 4 = 6）
```

**递归 + 记忆化**：

```javascript
// 问题：计算斐波那契数列的第 n 项
// 普通递归：O(2^n)
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// 记忆化优化：O(n)
function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n]; // 已计算过，直接返回
  if (n <= 1) return n;

  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo); // 记录结果
  return memo[n];
}

// 测试
console.log(fibMemo(50)); // 瞬间得出结果
```

---

## 3 基础用法

### 一、浏览器历史记录（栈）

```javascript
// 浏览器历史记录管理器
class BrowserHistory {
  constructor() {
    this.history = []; // 历史记录栈
    this.currentIndex = -1; // 当前位置
  }

  // 访问新页面
  visit(url) {
    // 清除前进历史（如果当前位置不是栈顶）
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(url); // 新页面入栈
    this.currentIndex++; // 更新当前位置
  }

  // 后退
  back(steps) {
    // 最多后退到栈底
    this.currentIndex = Math.max(0, this.currentIndex - steps);
    return this.history[this.currentIndex]; // 返回当前页面
  }

  // 前进
  forward(steps) {
    // 最多前进到栈顶
    this.currentIndex = Math.min(
      this.history.length - 1,
      this.currentIndex + steps
    );
    return this.history[this.currentIndex]; // 返回当前页面
  }

  // 获取当前页面
  getCurrent() {
    return this.history[this.currentIndex];
  }
}

// 测试
const browser = new BrowserHistory();
browser.visit("google.com");
browser.visit("github.com");
browser.visit("stackoverflow.com");

console.log(browser.getCurrent()); // 输出: stackoverflow.com
console.log(browser.back(1));      // 输出: github.com
console.log(browser.back(1));      // 输出: google.com
console.log(browser.forward(1));   // 输出: github.com
console.log(browser.visit("youtube.com")); // 访问新页面
console.log(browser.forward(1));   // 输出: youtube.com（前进历史被清除）
```

### 二、任务调度系统（优先队列/堆）

```javascript
// 任务类
class Task {
  constructor(name, priority) {
    this.name = name; // 任务名称
    this.priority = priority; // 优先级（数字越大优先级越高）
  }
}

// 优先队列（基于最大堆）
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // 获取父节点索引
  getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  // 获取左子节点索引
  getLeftChildIndex(index) {
    return 2 * index + 1;
  }

  // 获取右子节点索引
  getRightChildIndex(index) {
    return 2 * index + 2;
  }

  // 交换两个元素
  swap(index1, index2) {
    [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
  }

  // 插入任务
  enqueue(task) {
    this.heap.push(task);
    this.heapifyUp();
  }

  // 向上调整
  heapifyUp() {
    let index = this.heap.length - 1;

    while (
      index > 0 &&
      this.heap[index].priority > this.heap[this.getParentIndex(index)].priority
    ) {
      this.swap(index, this.getParentIndex(index));
      index = this.getParentIndex(index);
    }
  }

  // 取出最高优先级任务
  dequeue() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown();
    return max;
  }

  // 向下调整
  heapifyDown() {
    let index = 0;

    while (this.getLeftChildIndex(index) < this.heap.length) {
      let higherPriorityIndex = this.getLeftChildIndex(index);

      if (
        this.getRightChildIndex(index) < this.heap.length &&
        this.heap[this.getRightChildIndex(index)].priority >
          this.heap[higherPriorityIndex].priority
      ) {
        higherPriorityIndex = this.getRightChildIndex(index);
      }

      if (this.heap[index].priority >= this.heap[higherPriorityIndex].priority) {
        break;
      }

      this.swap(index, higherPriorityIndex);
      index = higherPriorityIndex;
    }
  }

  // 判断是否为空
  isEmpty() {
    return this.heap.length === 0;
  }
}

// 任务调度器
class TaskScheduler {
  constructor() {
    this.queue = new PriorityQueue();
  }

  // 添加任务
  addTask(name, priority) {
    const task = new Task(name, priority);
    this.queue.enqueue(task);
    console.log(`添加任务: ${name} (优先级: ${priority})`);
  }

  // 执行下一个任务
  executeNext() {
    if (this.queue.isEmpty()) {
      console.log("没有待执行的任务");
      return null;
    }

    const task = this.queue.dequeue();
    console.log(`执行任务: ${task.name} (优先级: ${task.priority})`);
    return task;
  }
}

// 测试
const scheduler = new TaskScheduler();
scheduler.addTask("发送邮件", 2);
scheduler.addTask("修复 Bug", 5);
scheduler.addTask("写文档", 1);
scheduler.addTask("紧急会议", 10);

scheduler.executeNext(); // 输出: 执行任务: 紧急会议 (优先级: 10)
scheduler.executeNext(); // 输出: 执行任务: 修复 Bug (优先级: 5)
scheduler.executeNext(); // 输出: 执行任务: 发送邮件 (优先级: 2)
scheduler.executeNext(); // 输出: 执行任务: 写文档 (优先级: 1)
```

### 三、路由匹配系统（字典树）

```javascript
// 路由节点
class RouteNode {
  constructor() {
    this.children = new Map(); // 子节点映射
    this.handler = null; // 路由处理函数
    this.isRoute = false; // 是否是完整路由
  }
}

// 路由系统
class Router {
  constructor() {
    this.root = new RouteNode();
  }

  // 注册路由
  addRoute(path, handler) {
    let current = this.root;
    const segments = path.split('/').filter(s => s.length > 0); // 分割路径

    for (const segment of segments) {
      // 如果段不存在，创建新节点
      if (!current.children.has(segment)) {
        current.children.set(segment, new RouteNode());
      }
      current = current.children.get(segment);
    }

    current.handler = handler; // 设置处理函数
    current.isRoute = true; // 标记为完整路由
  }

  // 匹配路由
  match(path) {
    let current = this.root;
    const segments = path.split('/').filter(s => s.length > 0);
    const params = {}; // 存储参数

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // 精确匹配
      if (current.children.has(segment)) {
        current = current.children.get(segment);
      }
      // 参数匹配（以 : 开头）
      else if (current.children.has(':')) {
        current = current.children.get(':');
        // 假设参数名是 "id"（实际应该从路由定义中获取）
        params['param' + i] = segment;
      }
      // 不匹配
      else {
        return null;
      }
    }

    // 检查是否是完整路由
    if (current.isRoute) {
      return { handler: current.handler, params };
    }

    return null;
  }
}

// 测试
const router = new Router();

// 注册路由
router.addRoute('/user/list', () => '用户列表页面');
router.addRoute('/user/:id', (params) => `用户详情页面: ${params.param0}`);
router.addRoute('/user/:id/profile', (params) => `用户资料页面: ${params.param0}`);

// 匹配路由
const result1 = router.match('/user/list');
console.log(result1.handler()); // 输出: 用户列表页面

const result2 = router.match('/user/123');
console.log(result2.handler(result2.params)); // 输出: 用户详情页面: 123

const result3 = router.match('/user/456/profile');
console.log(result3.handler(result3.params)); // 输出: 用户资料页面: 456
```

### 四、缓存系统（LRU）

```javascript
// LRU 缓存（已在第 15 章实现，这里简化版本）
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity; // 容量
    this.cache = new Map(); // 缓存
  }

  // 获取值
  get(key) {
    if (!this.cache.has(key)) return -1;

    const value = this.cache.get(key);
    this.cache.delete(key); // 删除
    this.cache.set(key, value); // 重新设置（移到最近使用）
    return value;
  }

  // 设置值
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // 已存在，先删除
    } else if (this.cache.size >= this.capacity) {
      // 超过容量，删除最久未使用的
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value); // 添加新值
  }

  // 打印缓存内容
  print() {
    console.log(Array.from(this.cache.entries()));
  }
}

// 测试
const cache = new LRUCache(3);
cache.put(1, 'a');
cache.put(2, 'b');
cache.put(3, 'c');
cache.print(); // 输出: [[1, 'a'], [2, 'b'], [3, 'c']]

console.log(cache.get(1)); // 输出: 'a'
cache.print(); // 输出: [[2, 'b'], [3, 'c'], [1, 'a']]（1 移到后面）

cache.put(4, 'd'); // 淘汰 key 2
cache.print(); // 输出: [[3, 'c'], [1, 'a'], [4, 'd']]
```

---

## 4 进阶用法

### 一、依赖管理（拓扑排序）

```javascript
// 图的拓扑排序（Kahn 算法）
function topologicalSort(dependencies) {
  // 构建图和入度表
  const graph = new Map(); // 邻接表
  const inDegree = new Map(); // 入度

  // 初始化
  for (const [from, to] of dependencies) {
    if (!graph.has(from)) graph.set(from, []);
    if (!inDegree.has(from)) inDegree.set(from, 0);
    if (!inDegree.has(to)) inDegree.set(to, 0);
  }

  // 构建图
  for (const [from, to] of dependencies) {
    graph.get(from).push(to); // from -> to
    inDegree.set(to, inDegree.get(to) + 1); // to 的入度加 1
  }

  // 找到所有入度为 0 的节点
  const queue = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      queue.push(node); // 入度为 0，可以先行
    }
  }

  const result = []; // 拓扑排序结果

  // BFS
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node); // 加入结果

    // 遍历邻居
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1); // 入度减 1
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor); // 入度为 0，加入队列
      }
    }
  }

  // 检查是否有环
  if (result.length !== inDegree.size) {
    throw new Error("依赖关系存在环！");
  }

  return result;
}

// 测试
const dependencies = [
  ['A', 'B'], // A 依赖 B
  ['A', 'C'], // A 依赖 C
  ['B', 'D'], // B 依赖 D
  ['C', 'D'], // C 依赖 D
  ['D', 'E'], // D 依赖 E
];

console.log(topologicalSort(dependencies)); // 输出: ['E', 'D', 'B', 'C', 'A']（可能不同）
```

### 二、最短路径（Dijkstra 算法）

```javascript
// Dijkstra 算法（使用优先队列）
function dijkstra(graph, start) {
  const distances = new Map(); // 最短距离
  const previous = new Map(); // 前驱节点
  const pq = new PriorityQueue(); // 优先队列

  // 初始化
  for (const node of graph.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(start, 0);
  pq.enqueue({ node: start, distance: 0 });

  while (!pq.isEmpty()) {
    const { node: currentNode } = pq.dequeue();

    // 遍历邻居
    const neighbors = graph.get(currentNode) || [];
    for (const { node: neighbor, weight } of neighbors) {
      const alt = distances.get(currentNode) + weight;

      // 找到更短的路径
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, currentNode);
        pq.enqueue({ node: neighbor, distance: alt });
      }
    }
  }

  return { distances, previous };
}

// 测试
const graph = new Map();
graph.set('A', [{ node: 'B', weight: 1 }, { node: 'C', weight: 4 }]);
graph.set('B', [{ node: 'C', weight: 2 }, { node: 'D', weight: 5 }]);
graph.set('C', [{ node: 'D', weight: 1 }]);
graph.set('D', []);

const result = dijkstra(graph, 'A');
console.log(result.distances); // 输出: Map { 'A' => 0, 'B' => 1, 'C' => 3, 'D' => 4 }
```

### 三、表达式求值（栈）

```javascript
// 中缀表达式转后缀表达式
function infixToPostfix(expression) {
  const output = []; // 输出队列
  const operators = []; // 运算符栈
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 }; // 优先级

  const tokens = expression.split(' '); // 分词

  for (const token of tokens) {
    // 数字
    if (!isNaN(token)) {
      output.push(token);
    }
    // 运算符
    else if (token in precedence) {
      while (
        operators.length > 0 &&
        operators[operators.length - 1] in precedence &&
        precedence[operators[operators.length - 1]] >= precedence[token]
      ) {
        output.push(operators.pop()); // 弹出优先级更高的运算符
      }
      operators.push(token); // 当前运算符入栈
    }
    // 左括号
    else if (token === '(') {
      operators.push(token);
    }
    // 右括号
    else if (token === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        output.push(operators.pop());
      }
      operators.pop(); // 弹出左括号
    }
  }

  // 弹出剩余运算符
  while (operators.length > 0) {
    output.push(operators.pop());
  }

  return output.join(' ');
}

// 后缀表达式求值
function evaluatePostfix(expression) {
  const stack = [];
  const tokens = expression.split(' ');

  for (const token of tokens) {
    if (!isNaN(token)) {
      stack.push(parseFloat(token)); // 数字入栈
    } else {
      const b = stack.pop(); // 右操作数
      const a = stack.pop(); // 左操作数

      switch (token) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(a / b); break;
      }
    }
  }

  return stack[0];
}

// 测试
const infix = "3 + 4 * 2 + ( 8 + 2 ) / 2";
const postfix = infixToPostfix(infix);
console.log(postfix); // 输出: "3 4 2 * + 8 2 + 2 / +"
console.log(evaluatePostfix(postfix)); // 输出: 16
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| ------ | ---- |
| 选择数据结构 | 根据数据特点和操作需求选择 |
| 时间复杂度 | O(1) < O(log n) < O(n) < O(n^2) |
| 空间复杂度 | 权衡时间和空间 |
| 滑动窗口 | 优化连续子数组/子串问题 |
| 双指针 | 优化有序数组问题 |
| 记忆化 | 避免重复计算 |
| 栈 | 浏览器历史、撤销操作 |
| 优先队列 | 任务调度 |
| 字典树 | 路由匹配、自动补全 |
| 拓扑排序 | 依赖管理 |
| Dijkstra | 最短路径 |
| 表达式求值 | 栈的应用 |

---

## 6 新手常见误区

### 误区 1：总是用最熟悉的数据结构

**错！** 应该根据问题特点选择最合适的数据结构。

**解释**：如果你只会用数组，遇到需要频繁插入删除的问题时，链表可能更合适。

**正确做法**：

```javascript
// ❌ 错误：总是用数组
const tasks = [];
// 每次都要遍历找最高优先级
const maxPriority = Math.max(...tasks.map(t => t.priority));

// ✅ 正确：用优先队列
const pq = new PriorityQueue();
pq.enqueue(task); // O(log n)
const max = pq.dequeue(); // O(log n)
```

### 误区 2：忽略空间复杂度

**错！** 时间复杂度和空间复杂度同样重要。

**解释**：有些算法时间复杂度低，但需要大量额外空间，可能导致内存溢出。

**正确做法**：

```javascript
// ❌ 错误：创建大数组
const matrix = new Array(10000).fill(0).map(() => new Array(10000).fill(0));
// 空间复杂度 O(n^2)

// ✅ 正确：如果只需要部分数据，用稀疏表示
const sparseMatrix = new Map();
sparseMatrix.set('0,0', 1);
sparseMatrix.set('9999,9999', 2);
// 空间复杂度 O(k) k 是非零元素个数
```

### 误区 3：递归不用记忆化

**错！** 递归如果有重叠子问题，一定要用记忆化优化。

**解释**：普通递归的时间复杂度可能是指数级，加上记忆化后变成线性。

**正确做法**：

```javascript
// ❌ 错误：普通递归
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2); // 大量重复计算
}

// ✅ 正确：记忆化
function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}
```

### 误区 4：图算法太复杂，实际用不到

**错！** 图算法在很多场景下都有应用。

**解释**：社交网络、地图导航、依赖管理、任务调度等都是图的应用场景。

**正确做法**：

```javascript
// 社交网络：用户关系是图
// 地图导航：城市和道路是图
// 依赖管理：包依赖是图
// 任务调度：任务依赖是图

// 学习图算法，解决实际问题
```

### 误区 5：复杂度分析只是理论

**错！** 复杂度分析直接影响代码性能。

**解释**：O(n^2) 的算法在数据量大时会非常慢，可能导致程序卡死。

**正确做法**：

```javascript
// 数据量 100：O(n^2) 可以接受
// 数据量 10000：O(n^2) 可能需要几秒
// 数据量 1000000：O(n^2) 可能需要几分钟

// 始终关注复杂度，选择合适算法
```

---

## 7 动手练习

### 练习 1：基础练习 - 有效的括号

编写一个函数 `isValid(s)`，判断一个只包含 '(', ')', '{', '}', '[', ']' 的字符串是否有效。有效字符串要求：左括号必须用相同类型的右括号闭合，且顺序正确。

<details>
<summary>点击查看答案</summary>

```javascript
function isValid(s) {
  const stack = []; // 栈
  const map = { ')': '(', '}': '{', ']': '[' }; // 映射

  for (let char of s) {
    if (char in map) {
      // 右括号
      const top = stack.pop(); // 弹出栈顶
      if (map[char] !== top) return false; // 不匹配
    } else {
      // 左括号
      stack.push(char); // 入栈
    }
  }

  return stack.length === 0; // 栈为空说明全部匹配
}

// 测试
console.log(isValid("()")); // 输出: true
console.log(isValid("()[]{}")); // 输出: true
console.log(isValid("(]")); // 输出: false
console.log(isValid("([)]")); // 输出: false
console.log(isValid("{[]}")); // 输出: true
```

</details>

### 练习 2：进阶练习 - 合并 K 个有序链表

编写一个函数 `mergeKLists(lists)`，将 k 个有序链表合并成一个有序链表。

<details>
<summary>点击查看答案</summary>

```javascript
// 链表节点
class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

function mergeKLists(lists) {
  // 使用最小堆
  const pq = new PriorityQueue();

  // 将每个链表的头节点加入堆
  for (const head of lists) {
    if (head) {
      pq.enqueue({ val: head.val, node: head });
    }
  }

  const dummy = new ListNode(0); // 虚拟头节点
  let current = dummy;

  while (!pq.isEmpty()) {
    const { node } = pq.dequeue(); // 取出最小值
    current.next = node;
    current = current.next;

    if (node.next) {
      pq.enqueue({ val: node.next.val, node: node.next }); // 加入下一个节点
    }
  }

  return dummy.next;
}

// 测试
const l1 = new ListNode(1);
l1.next = new ListNode(4);
l1.next.next = new ListNode(5);

const l2 = new ListNode(1);
l2.next = new ListNode(3);
l2.next.next = new ListNode(4);

const l3 = new ListNode(2);
l3.next = new ListNode(6);

const merged = mergeKLists([l1, l2, l3]);
// 输出: 1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6
```

</details>

### 练习 3（挑战）：综合练习 - 单词接龙

给定两个单词 `beginWord` 和 `endWord`，以及一个字典 `wordList`。找到从 `beginWord` 到 `endWord` 的最短转换序列的长度。转换规则：每次只能改变一个字母，且中间单词必须在字典中。

<details>
<summary>点击查看答案</summary>

```javascript
function ladderLength(beginWord, endWord, wordList) {
  const wordSet = new Set(wordList); // 字典集合

  if (!wordSet.has(endWord)) return 0; // 终点不在字典中

  const queue = [[beginWord, 1]]; // 队列：[单词, 步数]
  const visited = new Set([beginWord]); // 已访问集合

  while (queue.length > 0) {
    const [word, steps] = queue.shift();

    // 尝试每个位置的每个字母
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) { // a-z
        const newChar = String.fromCharCode(c);
        if (newChar === word[i]) continue; // 跳过相同字母

        const newWord = word.slice(0, i) + newChar + word.slice(i + 1);

        if (newWord === endWord) return steps + 1; // 找到终点

        if (wordSet.has(newWord) && !visited.has(newWord)) {
          visited.add(newWord); // 标记已访问
          queue.push([newWord, steps + 1]); // 加入队列
        }
      }
    }
  }

  return 0; // 无法到达
}

// 测试
console.log(ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"]));
// 输出: 5（hit -> hot -> dot -> dog -> cog）
```

</details>

---

## 8 数据结构学习总结

恭喜你完成了数据结构的学习！让我们回顾一下整个学习历程：

| 章节 | 内容 | 核心知识点 |
| ---- | ---- | ---------- |
| 第 1-6 章 | 基础数据结构 | 数组、链表、栈、队列、哈希表 |
| 第 7-9 章 | 排序与查找 | 冒泡、选择、插入、快速、归并排序；线性、二分查找 |
| 第 10-12 章 | 树与图 | 二叉树、BST、堆、图的遍历 |
| 第 13 章 | 查找算法 | 线性、二分、哈希查找 |
| 第 14 章 | 字符串算法 | 暴力匹配、KMP、Rabin-Karp |
| 第 15 章 | 高级数据结构 | 树、堆、图、字典树 |
| 第 16 章 | 实战应用 | 选择数据结构、复杂度分析、实际场景 |

**学习建议**：

1. **多动手实践**：光看不练假把式，一定要写代码实现
2. **理解原理**：不要死记硬背，理解背后的思想
3. **循序渐进**：从简单到复杂，逐步深入
4. **总结归纳**：每学完一个知识点，总结核心要点
5. **实际应用**：尝试在实际项目中使用数据结构

**下一步学习方向**：

- 算法设计模式：动态规划、贪心算法、回溯算法
- 高级算法：字符串算法、图算法、计算几何
- 系统设计：大数据处理、分布式系统、机器学习

---

## 附录：数据结构速查表

| 数据结构 | 查找 | 插入 | 删除 | 适用场景 |
| -------- | ---- | ---- | ---- | -------- |
| 数组 | O(n) | O(n) | O(n) | 随机访问、小数据量 |
| 有序数组 | O(log n) | O(n) | O(n) | 有序数据、二分查找 |
| 链表 | O(n) | O(1) | O(1) | 频繁插入删除 |
| 栈 | O(n) | O(1) | O(1) | 后进先出场景 |
| 队列 | O(n) | O(1) | O(1) | 先进先出场景 |
| 哈希表 | O(1) | O(1) | O(1) | 键值对、快速查找 |
| 二叉搜索树 | O(log n) | O(log n) | O(log n) | 有序数据管理 |
| 堆 | O(1) 最值 | O(log n) | O(log n) | 优先队列 |
| 字典树 | O(L) | O(L) | O(L) | 字符串检索 |
| 图 | - | - | - | 网络、关系 |
