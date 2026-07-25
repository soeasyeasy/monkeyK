# 第十五章：高级数据结构

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 除了数组、链表、栈、队列，还有哪些高级数据结构？
- 树、图、堆这些结构在实际开发中有什么用？
- 什么是二叉搜索树？什么是平衡二叉树？
- 图是怎么表示的？图的遍历算法有哪些？

这一章就是为了解答这些问题。我们会系统学习树、二叉树、堆、图等高级数据结构，理解它们的原理和应用场景，为后续的数据结构实战打下基础。

---

## 15.1 为什么需要高级数据结构？

### 痛点分析

想象一下这些场景：

**场景一**：你需要管理一个公司的组织架构——CEO 下面有部门经理，部门经理下面有员工。用数组或链表很难表达这种层级关系。

**场景二**：你需要实现一个任务调度系统，每次都要取出优先级最高的任务。用数组每次都要遍历找最大值，效率太低。

**场景三**：你需要实现地图导航，城市之间有多条道路相连。用简单的线性结构无法表达这种复杂的网络关系。

这些场景需要更复杂的数据结构来解决。

### 生活化类比

> 高级数据结构就像现实世界中的各种组织形式：
>
> - **树**：像家族族谱，有祖先、子孙，层级分明
> - **二叉搜索树**：像字典的拼音索引，左小右大，快速查找
> - **堆**：像排队挂号，优先级高的先看
> - **图**：像城市交通网，各个节点互相连接

### 高级数据结构对比

| 数据结构 | 特点 | 时间复杂度（查找/插入/删除） | 应用场景 |
| -------- | ---- | ---------------------------- | -------- |
| 二叉搜索树 | 左小右大 | O(log n) 平均 | 有序数据管理 |
| 平衡二叉树 | 自动平衡 | O(log n) 保证 | 数据库索引 |
| 堆 | 完全二叉树，父>子或父<子 | O(log n) | 优先队列 |
| 图 | 节点+边 | 取决于表示方式 | 网络、地图 |
| 字典树 | 前缀树，共享前缀 | O(L) L为键长 | 自动补全 |

> **一句话总结**：高级数据结构是为了解决特定场景下的效率问题而设计的。

---

## 15.2 核心原理讲解

### 一、树（Tree）

**底层原理**：

树是一种分层数据的抽象，由节点组成，每个节点有零个或多个子节点。最顶部的节点叫根节点，没有子节点的节点叫叶子节点。

**通俗类比**：

> 就像一棵真正的树——树根是根节点，树枝是分叉点，树叶是叶子节点。

**基本术语**：

```
        A          ← 根节点（没有父节点）
       / \
      B   C        ← A 的子节点
     / \   \
    D   E   F      ← 叶子节点（没有子节点）

- 节点 A 是节点 B、C 的父节点
- 节点 B、C 是节点 A 的子节点
- 节点 D、E、F 是叶子节点
- 树的深度 = 3（从根到最远叶子的距离）
```

### 二、二叉树（Binary Tree）

**底层原理**：

二叉树是一种特殊的树，每个节点最多有两个子节点（左子节点和右子节点）。

**通俗类比**：

> 就像家谱中的父母——每个人最多只能有两个孩子（虽然现实中不一定，但二叉树是这样的）。

**二叉树的类型**：

| 类型 | 特点 |
| ---- | ---- |
| 满二叉树 | 每个节点要么有 0 个子节点，要么有 2 个子节点 |
| 完全二叉树 | 除了最后一层，其他层都是满的，且最后一层从左到右连续 |
| 平衡二叉树 | 任意节点的左右子树高度差不超过 1 |

### 三、二叉搜索树（BST）

**底层原理**：

二叉搜索树是一种特殊的二叉树，满足以下性质：
- 左子树中所有节点的值 < 根节点的值
- 右子树中所有节点的值 > 根节点的值
- 左右子树也是二叉搜索树

**通俗类比**：

> 就像查字典——你要找 "apple"，先翻到中间，发现 "apple" 在前面，就往前翻；如果在后面，就往后翻。每次排除一半。

**执行过程**：

```
插入序列：5, 3, 7, 1, 4, 6, 8

构建的二叉搜索树：
        5
       / \
      3   7
     / \ / \
    1  4 6  8

查找 4：
1. 从根节点 5 开始，4 < 5，去左子树
2. 到节点 3，4 > 3，去右子树
3. 到节点 4，找到了！
```

### 四、堆（Heap）

**底层原理**：

堆是一种特殊的完全二叉树，分为最大堆和最小堆：
- **最大堆**：父节点的值 >= 子节点的值（根节点是最大值）
- **最小堆**：父节点的值 <= 子节点的值（根节点是最小值）

**通俗类比**：

> 就像医院的急诊室——病情最严重的优先处理（最大堆），或者排队时间最长的优先处理（最小堆）。

**堆的操作**：

```
最大堆示例：
        10
       /  \
      7    8
     / \  / \
    3  5 6   2

插入 9：
1. 先放在最后：9 成为 7 的子节点
2. 向上调整（heapify up）：9 > 7，交换
3. 9 > 8，继续交换
4. 最终 9 成为根节点的子节点

删除最大值 10：
1. 把最后一个节点 2 放到根节点
2. 向下调整（heapify down）：2 < 8，交换
3. 2 < 7，继续交换
4. 最终 8 成为新的根节点
```

### 五、图（Graph）

**底层原理**：

图由节点（顶点）和边组成，用于表示事物之间的关系。图可以分为：
- **有向图**：边有方向（如单行道）
- **无向图**：边无方向（如双向道路）
- **加权图**：边有权重（如道路长度）

**通俗类比**：

> 就像社交网络——人是节点，好友关系是边。A 关注 B 是有向边，A 和 B 是好友是无向边。

**图的表示方式**：

```
图示例：
    A --- B
    |   / |
    |  /  |
    | /   |
    C --- D

邻接矩阵表示：
    A  B  C  D
A [ 0, 1, 1, 0 ]
B [ 1, 0, 1, 1 ]
C [ 1, 1, 0, 1 ]
D [ 0, 1, 1, 0 ]

邻接表表示：
A: [B, C]
B: [A, C, D]
C: [A, B, D]
D: [B, C]
```

---

## 15.3 基础用法

### 一、二叉树的节点定义

```javascript
// 定义二叉树节点
class TreeNode {
  constructor(value) {
    this.value = value; // 节点的值
    this.left = null;   // 左子节点
    this.right = null;  // 右子节点
  }
}

// 创建一棵二叉树
//       1
//      / \
//     2   3
//    / \
//   4   5

const root = new TreeNode(1);    // 根节点
root.left = new TreeNode(2);     // 左子节点
root.right = new TreeNode(3);    // 右子节点
root.left.left = new TreeNode(4);  // 左子节点的左子节点
root.left.right = new TreeNode(5); // 左子节点的右子节点
```

### 二、二叉树的遍历

```javascript
// 前序遍历：根 -> 左 -> 右
function preOrder(node) {
  if (node === null) return; // 递归终止条件

  console.log(node.value); // 访问根节点
  preOrder(node.left);     // 遍历左子树
  preOrder(node.right);    // 遍历右子树
}

// 中序遍历：左 -> 根 -> 右
function inOrder(node) {
  if (node === null) return;

  inOrder(node.left);      // 遍历左子树
  console.log(node.value); // 访问根节点
  inOrder(node.right);     // 遍历右子树
}

// 后序遍历：左 -> 右 -> 根
function postOrder(node) {
  if (node === null) return;

  postOrder(node.left);    // 遍历左子树
  postOrder(node.right);   // 遍历右子树
  console.log(node.value); // 访问根节点
}

// 层序遍历（广度优先）
function levelOrder(root) {
  if (root === null) return [];

  const result = [];     // 存储结果
  const queue = [root];  // 队列，用于层序遍历

  while (queue.length > 0) {
    const node = queue.shift(); // 取出队首节点
    result.push(node.value);    // 访问节点

    // 将子节点加入队列
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return result;
}

// 测试
//       1
//      / \
//     2   3
//    / \
//   4   5

console.log("前序遍历:");
preOrder(root); // 输出: 1 2 4 5 3

console.log("中序遍历:");
inOrder(root); // 输出: 4 2 5 1 3

console.log("后序遍历:");
postOrder(root); // 输出: 4 5 2 3 1

console.log("层序遍历:", levelOrder(root)); // 输出: [1, 2, 3, 4, 5]
```

**正确写法**：

```javascript
// ✅ 正确：递归终止条件是 node === null
function preOrder(node) {
  if (node === null) return; // 空节点直接返回
  console.log(node.value);
  preOrder(node.left);
  preOrder(node.right);
}
```

**错误写法**：

```javascript
// ❌ 错误：没有终止条件，会导致无限递归
function preOrder(node) {
  console.log(node.value); // 如果 node 是 null，会报错
  preOrder(node.left);
  preOrder(node.right);
}
```

### 三、二叉搜索树

```javascript
// 二叉搜索树类
class BinarySearchTree {
  constructor() {
    this.root = null; // 根节点
  }

  // 插入节点
  insert(value) {
    const newNode = new TreeNode(value);

    // 如果树为空，新节点成为根节点
    if (this.root === null) {
      this.root = newNode;
      return;
    }

    // 从根节点开始查找插入位置
    let current = this.root;
    while (true) {
      // 值小于当前节点，去左子树
      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode; // 找到位置，插入
          return;
        }
        current = current.left; // 继续向左
      }
      // 值大于等于当前节点，去右子树
      else {
        if (current.right === null) {
          current.right = newNode; // 找到位置，插入
          return;
        }
        current = current.right; // 继续向右
      }
    }
  }

  // 查找节点
  search(value) {
    let current = this.root;

    while (current !== null) {
      if (value === current.value) {
        return true; // 找到了
      } else if (value < current.value) {
        current = current.left; // 去左子树
      } else {
        current = current.right; // 去右子树
      }
    }

    return false; // 没找到
  }

  // 中序遍历（得到有序序列）
  inOrder() {
    const result = [];

    function traverse(node) {
      if (node === null) return;
      traverse(node.left);      // 遍历左子树
      result.push(node.value);  // 访问根节点
      traverse(node.right);     // 遍历右子树
    }

    traverse(this.root);
    return result;
  }
}

// 测试
const bst = new BinarySearchTree();
bst.insert(5);
bst.insert(3);
bst.insert(7);
bst.insert(1);
bst.insert(4);
bst.insert(6);
bst.insert(8);

console.log(bst.search(4)); // 输出: true
console.log(bst.search(10)); // 输出: false
console.log(bst.inOrder()); // 输出: [1, 3, 4, 5, 6, 7, 8]（有序）
```

### 四、堆的实现

```javascript
// 最小堆类
class MinHeap {
  constructor() {
    this.heap = []; // 用数组存储堆
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

  // 插入元素
  insert(value) {
    this.heap.push(value); // 先放在最后
    this.heapifyUp();      // 向上调整
  }

  // 向上调整（插入后调用）
  heapifyUp() {
    let index = this.heap.length - 1;

    // 当不是根节点，且当前元素小于父节点时
    while (index > 0 && this.heap[index] < this.heap[this.getParentIndex(index)]) {
      // 交换当前节点和父节点
      this.swap(index, this.getParentIndex(index));
      index = this.getParentIndex(index); // 更新索引
    }
  }

  // 删除最小元素（根节点）
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0]; // 最小值是根节点
    this.heap[0] = this.heap.pop(); // 把最后一个元素放到根节点
    this.heapifyDown(); // 向下调整
    return min;
  }

  // 向下调整（删除后调用）
  heapifyDown() {
    let index = 0;

    while (this.getLeftChildIndex(index) < this.heap.length) {
      let smallerChildIndex = this.getLeftChildIndex(index);

      // 如果右子节点存在且更小
      if (this.getRightChildIndex(index) < this.heap.length &&
          this.heap[this.getRightChildIndex(index)] < this.heap[smallerChildIndex]) {
        smallerChildIndex = this.getRightChildIndex(index);
      }

      // 如果当前节点已经小于等于最小子节点，停止
      if (this.heap[index] <= this.heap[smallerChildIndex]) {
        break;
      }

      // 交换
      this.swap(index, smallerChildIndex);
      index = smallerChildIndex;
    }
  }

  // 获取最小值
  getMin() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }
}

// 测试
const minHeap = new MinHeap();
minHeap.insert(5);
minHeap.insert(3);
minHeap.insert(7);
minHeap.insert(1);

console.log(minHeap.getMin());     // 输出: 1
console.log(minHeap.extractMin()); // 输出: 1
console.log(minHeap.getMin());     // 输出: 3
```

---

## 15.4 进阶用法

### 一、图的邻接表表示

```javascript
// 图类（邻接表实现）
class Graph {
  constructor() {
    this.adjacencyList = new Map(); // 邻接表
  }

  // 添加顶点
  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []); // 顶点对应一个空数组
    }
  }

  // 添加边（无向图）
  addEdge(vertex1, vertex2) {
    // 确保顶点存在
    this.addVertex(vertex1);
    this.addVertex(vertex2);

    // 无向图：两个方向都要加
    this.adjacencyList.get(vertex1).push(vertex2);
    this.adjacencyList.get(vertex2).push(vertex1);
  }

  // 添加有向边
  addDirectedEdge(vertex1, vertex2) {
    this.addVertex(vertex1);
    this.addVertex(vertex2);
    this.adjacencyList.get(vertex1).push(vertex2); // 只加一个方向
  }

  // 打印图
  print() {
    for (const [vertex, neighbors] of this.adjacencyList) {
      console.log(`${vertex} -> ${neighbors.join(', ')}`);
    }
  }
}

// 测试
const graph = new Graph();
graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'D');
graph.addEdge('C', 'D');
graph.addEdge('D', 'E');

graph.print();
// 输出:
// A -> B, C
// B -> A, D
// C -> A, D
// D -> B, C, E
// E -> D
```

### 二、图的深度优先搜索（DFS）

```javascript
// 图的 DFS 遍历
class Graph {
  // ... 前面的代码 ...

  // 深度优先搜索
  dfs(startVertex) {
    const result = []; // 存储遍历结果
    const visited = new Set(); // 记录已访问的顶点

    // 递归 DFS 函数
    const dfsRecursive = (vertex) => {
      if (vertex === null) return;

      result.push(vertex); // 访问当前顶点
      visited.add(vertex); // 标记为已访问

      // 遍历所有邻居
      const neighbors = this.adjacencyList.get(vertex);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfsRecursive(neighbor); // 递归访问未访问的邻居
        }
      }
    };

    dfsRecursive(startVertex);
    return result;
  }
}

// 测试
const graph2 = new Graph();
graph2.addEdge('A', 'B');
graph2.addEdge('A', 'C');
graph2.addEdge('B', 'D');
graph2.addEdge('C', 'E');
graph2.addEdge('D', 'E');

console.log(graph2.dfs('A')); // 输出: ['A', 'B', 'D', 'E', 'C']（可能不同）
```

### 三、图的广度优先搜索（BFS）

```javascript
// 图的 BFS 遍历
class Graph {
  // ... 前面的代码 ...

  // 广度优先搜索
  bfs(startVertex) {
    const result = []; // 存储遍历结果
    const visited = new Set(); // 记录已访问的顶点
    const queue = [startVertex]; // 队列

    visited.add(startVertex); // 标记起始顶点

    while (queue.length > 0) {
      const vertex = queue.shift(); // 取出队首顶点
      result.push(vertex); // 访问

      // 遍历所有邻居
      const neighbors = this.adjacencyList.get(vertex);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor); // 标记为已访问
          queue.push(neighbor);  // 加入队列
        }
      }
    }

    return result;
  }
}

// 测试
console.log(graph2.bfs('A')); // 输出: ['A', 'B', 'C', 'D', 'E']
```

### 四、字典树（Trie）

```javascript
// 字典树节点
class TrieNode {
  constructor() {
    this.children = {}; // 子节点映射
    this.isEndOfWord = false; // 是否是单词结尾
  }
}

// 字典树类
class Trie {
  constructor() {
    this.root = new TrieNode(); // 根节点
  }

  // 插入单词
  insert(word) {
    let current = this.root;

    // 逐个字符处理
    for (let i = 0; i < word.length; i++) {
      const char = word[i];

      // 如果字符不存在，创建新节点
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }

      // 移动到子节点
      current = current.children[char];
    }

    // 标记单词结尾
    current.isEndOfWord = true;
  }

  // 查找单词
  search(word) {
    let current = this.root;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];

      // 字符不存在，说明单词不在字典树中
      if (!current.children[char]) {
        return false;
      }

      current = current.children[char];
    }

    // 返回是否是单词结尾
    return current.isEndOfWord;
  }

  // 查找前缀
  startsWith(prefix) {
    let current = this.root;

    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];

      if (!current.children[char]) {
        return false;
      }

      current = current.children[char];
    }

    return true; // 前缀存在
  }
}

// 测试
const trie = new Trie();
trie.insert("apple");
trie.insert("app");
trie.insert("application");

console.log(trie.search("apple"));       // 输出: true
console.log(trie.search("app"));         // 输出: true
console.log(trie.search("ap"));          // 输出: false（ap 不是完整单词）
console.log(trie.startsWith("app"));     // 输出: true
console.log(trie.startsWith("ban"));     // 输出: false
```

---

## 15.5 核心知识点总结

| 知识点 | 说明 |
| ------ | ---- |
| 树 | 分层结构，有根节点、子节点、叶子节点 |
| 二叉树 | 每个节点最多两个子节点 |
| 二叉搜索树 | 左小右大，支持高效查找 |
| 堆 | 完全二叉树，最大堆/最小堆 |
| 图 | 节点+边，邻接矩阵/邻接表表示 |
| DFS | 深度优先搜索，递归实现 |
| BFS | 广度优先搜索，队列实现 |
| 字典树 | 前缀树，用于字符串快速检索 |

---

## 15.6 新手常见误区

### 误区 1：二叉搜索树一定是平衡的

**错！** 二叉搜索树不一定是平衡的，最坏情况下会退化成链表。

**解释**：如果插入顺序是 1, 2, 3, 4, 5，二叉搜索树会变成一条链，查找时间复杂度变成 O(n)。

**正确做法**：

```javascript
// ❌ 错误：以为 BST 总是高效的
const bst = new BinarySearchTree();
[1, 2, 3, 4, 5].forEach(v => bst.insert(v)); // 退化成链表

// ✅ 正确：使用平衡二叉树（如 AVL 树、红黑树）
// 或者随机化插入顺序
```

### 误区 2：堆和二叉搜索树是一样的

**错！** 堆和 BST 的性质不同，用途也不同。

**解释**：
- **堆**：父节点 >= 或 <= 子节点，用于快速找最值
- **BST**：左子树 < 根 < 右子树，用于有序查找

**正确做法**：

```javascript
// 堆：快速找最大值/最小值
const heap = new MinHeap();
heap.insert(5);
heap.insert(3);
heap.insert(7);
console.log(heap.getMin()); // O(1) 获取最小值

// BST：有序查找
const bst = new BinarySearchTree();
bst.insert(5);
bst.insert(3);
bst.insert(7);
console.log(bst.inOrder()); // [3, 5, 7] 有序序列
```

### 误区 3：图的 DFS 和 BFS 结果一样

**错！** DFS 和 BFS 的遍历顺序不同。

**解释**：
- **DFS**：一条路走到黑，再回头
- **BFS**：层层推进，像水波纹

**正确做法**：

```javascript
// 根据需求选择：
// - 找最短路径 → BFS
// - 遍历所有可能 → DFS
// - 拓扑排序 → DFS
```

### 误区 4：字典树太浪费空间，不值得用

**不一定！** 字典树在特定场景下非常高效。

**解释**：字典树通过共享前缀节省空间，在自动补全、拼写检查等场景下性能优异。

**正确做法**：

```javascript
// 数据量大、前缀查询多 → 字典树
const trie = new Trie();
// 插入 100 万个单词
// 查询 "app" 开头的所有单词 → O(L) 快速返回

// 数据量小、查询少 → 哈希表就够了
const set = new Set(["apple", "app", "application"]);
```

### 误区 5：图的邻接矩阵比邻接表好

**不一定！** 两种表示方式各有优劣。

**解释**：
- **邻接矩阵**：空间 O(V^2)，查询边 O(1)，适合稠密图
- **邻接表**：空间 O(V+E)，查询边 O(度)，适合稀疏图

**正确做法**：

```javascript
// 稠密图（边多）→ 邻接矩阵
// 例如：100 个节点，5000 条边

// 稀疏图（边少）→ 邻接表
// 例如：100 个节点，200 条边
```

---

## 15.7 动手练习

### 练习 1：基础练习 - 二叉树的最大深度

编写一个函数 `maxDepth(root)`，计算二叉树的最大深度（从根节点到最远叶子节点的最长路径上的节点数）。

<details>
<summary>点击查看答案</summary>

```javascript
function maxDepth(root) {
  // 空节点深度为 0
  if (root === null) return 0;

  // 递归计算左右子树的深度
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);

  // 返回左右子树中较大的深度 + 1
  return Math.max(leftDepth, rightDepth) + 1;
}

// 测试
//       1
//      / \
//     2   3
//    / \
//   4   5

const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);

console.log(maxDepth(root)); // 输出: 3
```

</details>

### 练习 2：进阶练习 - 验证二叉搜索树

编写一个函数 `isValidBST(root)`，判断一个二叉树是否是有效的二叉搜索树。

<details>
<summary>点击查看答案</summary>

```javascript
function isValidBST(root) {
  // 中序遍历 BST 应该得到有序序列
  let prev = -Infinity;
  let valid = true;

  function inOrder(node) {
    if (node === null || !valid) return;

    inOrder(node.left); // 遍历左子树

    // 检查是否递增
    if (node.value <= prev) {
      valid = false;
      return;
    }
    prev = node.value; // 更新前一个值

    inOrder(node.right); // 遍历右子树
  }

  inOrder(root);
  return valid;
}

// 测试
// 有效的 BST
const bst1 = new TreeNode(2);
bst1.left = new TreeNode(1);
bst1.right = new TreeNode(3);
console.log(isValidBST(bst1)); // 输出: true

// 无效的 BST
const bst2 = new TreeNode(5);
bst2.left = new TreeNode(1);
bst2.right = new TreeNode(4);
bst2.right.left = new TreeNode(3);
bst2.right.right = new TreeNode(6);
console.log(isValidBST(bst2)); // 输出: false
```

</details>

### 练习 3（挑战）：综合练习 - 实现 LRU 缓存

使用哈希表和双向链表实现一个 LRU（最近最少使用）缓存，支持 `get(key)` 和 `put(key, value)` 操作，时间复杂度都是 O(1)。

<details>
<summary>点击查看答案</summary>

```javascript
// 双向链表节点
class DLinkedNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

// LRU 缓存
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity; // 容量
    this.cache = new Map();   // 哈希表
    this.size = 0;            // 当前大小

    // 使用伪头部和伪尾部节点
    this.head = new DLinkedNode();
    this.tail = new DLinkedNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // 添加到头部
  addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // 删除节点
  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  // 移动到头部
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  // 删除尾部节点
  removeTail() {
    const node = this.tail.prev;
    this.removeNode(node);
    return node;
  }

  // 获取值
  get(key) {
    if (!this.cache.has(key)) return -1;

    const node = this.cache.get(key);
    this.moveToHead(node); // 标记为最近使用
    return node.value;
  }

  // 插入值
  put(key, value) {
    if (this.cache.has(key)) {
      // 已存在，更新值
      const node = this.cache.get(key);
      node.value = value;
      this.moveToHead(node);
    } else {
      // 不存在，创建新节点
      const node = new DLinkedNode(key, value);
      this.cache.set(key, node);
      this.addToHead(node);
      this.size++;

      // 超过容量，删除最久未使用的
      if (this.size > this.capacity) {
        const tail = this.removeTail();
        this.cache.delete(tail.key);
        this.size--;
      }
    }
  }
}

// 测试
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1)); // 输出: 1
cache.put(3, 3);           // 淘汰 key 2
console.log(cache.get(2)); // 输出: -1（未找到）
cache.put(4, 4);           // 淘汰 key 1
console.log(cache.get(1)); // 输出: -1
console.log(cache.get(3)); // 输出: 3
console.log(cache.get(4)); // 输出: 4
```

</details>

---

## 15.8 下一章预告

下一章我们将进入 **数据结构实战**——综合运用前面学到的知识，解决实际问题。你会学到如何选择合适的数据结构、如何分析算法效率、如何处理真实场景中的数据问题。

| 数据结构 | 核心特点 | 典型应用 |
| -------- | -------- | -------- |
| 二叉搜索树 | 左小右大 | 有序数据管理 |
| 堆 | 快速取最值 | 优先队列 |
| 图 | 节点+边 | 网络、地图 |
| 字典树 | 前缀共享 | 自动补全 |
