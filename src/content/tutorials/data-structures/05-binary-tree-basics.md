---
title: '第五章：二叉树基础'
description: '二叉树的概念、性质、存储结构与遍历方式'
---

# 第五章：二叉树基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 二叉树到底是什么？和普通的树有什么区别？
- 为什么要学二叉树？它在实际开发中有什么用？
- 二叉树的遍历方式有好几种，前序、中序、后序到底有什么区别？
- 代码里怎么表示一棵二叉树？

这一章就是为了解答这些问题。我们会从最基础的概念讲起，搞清楚二叉树的定义、性质、存储方式，然后重点学习二叉树的四种遍历方法。学完之后，你就掌握了学习更高级树结构的基础。

---

## 5.1 为什么需要二叉树？

### 痛点分析

在前面我们学了数组、链表、栈、队列这些线性数据结构。它们有一个共同的问题：当数据量很大时，查找效率很低。

比如在一个无序数组中查找某个元素，最坏情况下需要遍历整个数组，时间复杂度是 O(n)。有没有一种结构，既能像链表一样灵活地插入删除，又能快速地查找数据？

答案就是树结构，而二叉树是树结构中最基础、最重要的一种。

### 生活类比

> 二叉树就像一个家族族谱。每个人（节点）最多有两个孩子（左孩子和右孩子）。从祖先开始，一代一代往下分支，形成一棵倒过来的"树"。
>
> 再比如公司的组织架构图：CEO 是根节点，下面有两个副总裁（左子树和右子树），每个副总裁下面又有两个总监，以此类推。

```
            CEO（根节点）
           /            \
      副总裁A          副总裁B
       /    \           /    \
    总监C   总监D    总监E   总监F
```

> 一句话总结：二叉树是一种高效组织数据的方式，它是很多高级数据结构和算法的基础。

---

## 5.2 核心原理

### 什么是树？

先理解"树"这个概念。树是一种**非线性**数据结构，由节点和边组成。

- 最顶部的节点叫**根节点**（root）
- 每个节点可以有零个或多个子节点
- 没有子节点的节点叫**叶子节点**（leaf）

```
        A（根节点）
       / \
      B   C
     / \   \
    D   E   F（D、E、F 是叶子节点）
```

### 什么是二叉树？

二叉树（Binary Tree）是一种特殊的树，它满足两个条件：

1. **每个节点最多有两个子节点**（左孩子和右孩子）
2. **左右子树有严格的顺序**，不能颠倒

打个比方：

> 二叉树就像一个"二选一"的分叉路口。每到一个路口，你只能选择往左走或往右走。左边的路和右边的路是不同的，不能混为一谈。

### 二叉树的基本术语

| 术语 | 含义 | 生活化类比 |
| --- | --- | --- |
| 节点（Node） | 存储数据的元素 | 族谱中的一个人 |
| 根节点（Root） | 树的最顶层节点 | 家族的最早祖先 |
| 父节点（Parent） | 某个节点的上层节点 | 某个人的父亲 |
| 子节点（Child） | 某个节点的下层节点 | 某个人的孩子 |
| 叶子节点（Leaf） | 没有子节点的节点 | 家族中没有后代的人 |
| 深度（Depth） | 从根到该节点的层数 | 族谱中的第几代人 |
| 高度（Height） | 从该节点到最远叶子节点的层数 | 从某个人往下数有几代人 |
| 层（Level） | 根节点在第1层 | 辈分 |

### 二叉树的性质

| 性质 | 说明 |
| --- | --- |
| 第 i 层最多有 2^(i-1) 个节点 | 第1层最多1个，第2层最多2个，第3层最多4个 |
| 深度为 k 的二叉树最多有 2^k - 1 个节点 | 深度3的二叉树最多7个节点 |
| 叶子节点数 = 度为2的节点数 + 1 | 这是一个重要的数学性质 |
| n 个节点的完全二叉树深度为 floor(log2(n)) + 1 | 节点越多，树越深 |

### 特殊的二叉树

#### 满二叉树

每一层的节点数都达到最大值。

```
        A
       / \
      B   C
     / \ / \
    D  E F  G
（每个非叶子节点都有左右两个孩子）
```

#### 完全二叉树

除了最后一层，其他层的节点数都达到最大值，且最后一层的节点都靠左排列。

```
        A
       / \
      B   C
     / \  /
    D  E F
（最后一层节点靠左排列）
```

> 完全二叉树在堆（Heap）结构中非常重要，后面会学到。

---

## 5.3 二叉树的存储结构

### 链式存储（二叉链表）

最常见的存储方式。每个节点包含三个部分：数据、左孩子指针、右孩子指针。

```java
// 定义二叉树节点
class TreeNode {
    int val;             // 节点存储的数据
    TreeNode left;       // 指向左孩子的引用
    TreeNode right;      // 指向右孩子的引用

    // 构造方法：只传数据，左右孩子默认为 null
    TreeNode(int val) {
        this.val = val;
        this.left = null;    // 初始时没有左孩子
        this.right = null;   // 初始时没有右孩子
    }

    // 构造方法：传数据、左孩子、右孩子
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
```

用 Java 代码构建一棵二叉树：

```java
// 构建如下二叉树：
//       1
//      / \
//     2   3
//    / \
//   4   5

TreeNode root = new TreeNode(1);         // 创建根节点 1
root.left = new TreeNode(2);             // 根节点的左孩子 2
root.right = new TreeNode(3);            // 根节点的右孩子 3
root.left.left = new TreeNode(4);        // 节点2的左孩子 4
root.left.right = new TreeNode(5);       // 节点2的右孩子 5
```

### 顺序存储（数组）

对于完全二叉树，可以用数组来存储，不需要指针。

```
数组索引：  0  1  2  3  4  5  6
存储数据：  A  B  C  D  E  F  G

对应关系：
- 节点 i 的父节点：(i - 1) / 2
- 节点 i 的左孩子：2 * i + 1
- 节点 i 的右孩子：2 * i + 2
```

> 一句话总结：链式存储灵活通用，顺序存储适合完全二叉树（如堆）。

---

## 5.4 基础用法：二叉树的遍历

遍历是二叉树最重要的操作。所谓遍历，就是把树中所有节点都访问一遍，且每个节点只访问一次。

二叉树有四种遍历方式：

| 遍历方式 | 访问顺序 | 应用场景 |
| --- | --- | --- |
| 前序遍历 | 根 -> 左 -> 右 | 复制树结构、序列化 |
| 中序遍历 | 左 -> 根 -> 右 | 二叉搜索树的有序输出 |
| 后序遍历 | 左 -> 右 -> 根 | 删除树、计算目录大小 |
| 层序遍历 | 逐层从左到右 | 最短路径、层级渲染 |

### 前序遍历（根 -> 左 -> 右）

先访问根节点，再前序遍历左子树，最后前序遍历右子树。

```java
// 前序遍历（递归实现）
public void preOrder(TreeNode node) {
    if (node == null) {          // 递归终止条件：节点为空时返回
        return;
    }
    System.out.print(node.val + " ");  // 先访问根节点
    preOrder(node.left);               // 再遍历左子树
    preOrder(node.right);              // 最后遍历右子树
}

// 对于下面的树：
//       1
//      / \
//     2   3
//    / \
//   4   5
// 前序遍历结果：1 2 4 5 3
```

打个比方：

> 前序遍历就像"先跟自己打招呼，再去左边看看，最后去右边看看"。

### 中序遍历（左 -> 根 -> 右）

先中序遍历左子树，再访问根节点，最后中序遍历右子树。

```java
// 中序遍历（递归实现）
public void inOrder(TreeNode node) {
    if (node == null) {          // 递归终止条件：节点为空时返回
        return;
    }
    inOrder(node.left);                // 先遍历左子树
    System.out.print(node.val + " ");  // 再访问根节点
    inOrder(node.right);               // 最后遍历右子树
}

// 对于下面的树：
//       1
//      / \
//     2   3
//    / \
//   4   5
// 中序遍历结果：4 2 5 1 3
```

打个比方：

> 中序遍历就像"先去左边看看，再跟自己打招呼，最后去右边看看"。

### 后序遍历（左 -> 右 -> 根）

先后序遍历左子树，再后序遍历右子树，最后访问根节点。

```java
// 后序遍历（递归实现）
public void postOrder(TreeNode node) {
    if (node == null) {          // 递归终止条件：节点为空时返回
        return;
    }
    postOrder(node.left);              // 先遍历左子树
    postOrder(node.right);             // 再遍历右子树
    System.out.print(node.val + " ");  // 最后访问根节点
}

// 对于下面的树：
//       1
//      / \
//     2   3
//    / \
//   4   5
// 后序遍历结果：4 5 2 3 1
```

打个比方：

> 后序遍历就像"先去左边看看，再去右边看看，最后回来跟自己打招呼"。

### 层序遍历（逐层遍历）

从第一层开始，从左到右逐层访问所有节点。通常借助队列实现。

```java
import java.util.LinkedList;
import java.util.Queue;

// 层序遍历（借助队列实现）
public void levelOrder(TreeNode root) {
    if (root == null) {              // 根节点为空，直接返回
        return;
    }

    Queue<TreeNode> queue = new LinkedList<>();  // 创建一个队列
    queue.offer(root);                           // 根节点入队

    while (!queue.isEmpty()) {                   // 队列不为空时循环
        TreeNode node = queue.poll();            // 取出队头节点
        System.out.print(node.val + " ");        // 访问该节点

        if (node.left != null) {                 // 如果左孩子不为空
            queue.offer(node.left);              // 左孩子入队
        }
        if (node.right != null) {                // 如果右孩子不为空
            queue.offer(node.right);             // 右孩子入队
        }
    }
}

// 对于下面的树：
//       1
//      / \
//     2   3
//    / \
//   4   5
// 层序遍历结果：1 2 3 4 5
```

打个比方：

> 层序遍历就像拍集体照，第一排站好拍完，第二排再站好拍，一层一层来。

### 遍历方式对比

| 遍历方式 | 访问顺序 | 递归核心逻辑 | 典型应用 |
| --- | --- | --- | --- |
| 前序遍历 | 根 -> 左 -> 右 | 先处理当前节点，再递归左右 | 复制树、序列化 |
| 中序遍历 | 左 -> 根 -> 右 | 先递归左，再处理当前节点，再递归右 | 搜索树的有序输出 |
| 后序遍历 | 左 -> 右 -> 根 | 先递归左右，再处理当前节点 | 删除树、计算大小 |
| 层序遍历 | 逐层从左到右 | 借助队列，逐层扩展 | 最短路径、BFS |

---

## 5.5 进阶用法

### 计算二叉树的深度

```java
// 递归计算二叉树的深度
public int maxDepth(TreeNode root) {
    if (root == null) {              // 空节点深度为0
        return 0;
    }
    int leftDepth = maxDepth(root.left);   // 递归求左子树深度
    int rightDepth = maxDepth(root.right); // 递归求右子树深度
    return Math.max(leftDepth, rightDepth) + 1;  // 取较大值加1
}
```

### 翻转二叉树

```java
// 翻转二叉树（左右孩子互换）
public TreeNode invertTree(TreeNode root) {
    if (root == null) {              // 空节点直接返回
        return null;
    }
    // 交换左右孩子
    TreeNode temp = root.left;       // 暂存左孩子
    root.left = root.right;          // 左孩子换成右孩子
    root.right = temp;               // 右孩子换成原来的左孩子

    // 递归翻转左右子树
    invertTree(root.left);           // 翻转左子树
    invertTree(root.right);          // 翻转右子树

    return root;                     // 返回翻转后的根节点
}
```

### 判断对称二叉树

```java
// 判断二叉树是否对称
public boolean isSymmetric(TreeNode root) {
    if (root == null) {              // 空树是对称的
        return true;
    }
    return check(root.left, root.right);  // 检查左右子树是否镜像
}

private boolean check(TreeNode left, TreeNode right) {
    if (left == null && right == null) {  // 两边都为空，对称
        return true;
    }
    if (left == null || right == null) {  // 一边为空一边不空，不对称
        return false;
    }
    if (left.val != right.val) {          // 值不相等，不对称
        return false;
    }
    // 递归检查：左的左和右的右，左的右和右的左
    return check(left.left, right.right) && check(left.right, right.left);
}
```

### 根据前序和中序遍历重建二叉树

```java
// 根据前序遍历和中序遍历重建二叉树
public TreeNode buildTree(int[] preorder, int[] inorder) {
    if (preorder.length == 0) {      // 数组为空，返回 null
        return null;
    }

    int rootVal = preorder[0];       // 前序第一个元素是根节点
    TreeNode root = new TreeNode(rootVal);  // 创建根节点

    // 在中序数组中找到根节点的位置
    int rootIndex = 0;
    for (int i = 0; i < inorder.length; i++) {
        if (inorder[i] == rootVal) {  // 找到根节点在中序中的位置
            rootIndex = i;
            break;
        }
    }

    // 左子树的中序遍历：inorder[0..rootIndex-1]
    // 右子树的中序遍历：inorder[rootIndex+1..end]
    int leftSize = rootIndex;        // 左子树的节点个数

    // 递归构建左子树
    // 前序中左子树范围：preorder[1..leftSize]
    // 中序中左子树范围：inorder[0..rootIndex-1]
    root.left = buildTree(
        java.util.Arrays.copyOfRange(preorder, 1, 1 + leftSize),
        java.util.Arrays.copyOfRange(inorder, 0, rootIndex)
    );

    // 递归构建右子树
    // 前序中右子树范围：preorder[1+leftSize..end]
    // 中序中右子树范围：inorder[rootIndex+1..end]
    root.right = buildTree(
        java.util.Arrays.copyOfRange(preorder, 1 + leftSize, preorder.length),
        java.util.Arrays.copyOfRange(inorder, rootIndex + 1, inorder.length)
    );

    return root;                     // 返回构建好的根节点
}
```

---

## 5.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 二叉树定义 | 每个节点最多有两个子节点，分左右子树 |
| 满二叉树 | 每层节点数都达到最大值 |
| 完全二叉树 | 除最后一层外都满，最后一层靠左 |
| 节点存储 | 用 TreeNode 类，包含 val、left、right |
| 前序遍历 | 根 -> 左 -> 右 |
| 中序遍历 | 左 -> 根 -> 右 |
| 后序遍历 | 左 -> 右 -> 根 |
| 层序遍历 | 逐层从左到右，借助队列 |
| 时间复杂度 | 遍历都是 O(n)，n 为节点数 |
| 空间复杂度 | 递归 O(h)，h 为树高；层序最坏 O(n) |

---

## 5.7 新手常见误区

### 误区 1："二叉树就是度为2的有序树"

**不完全对。** 二叉树的子树有严格的左右之分，即使某个节点只有一个孩子，也要区分是左孩子还是右孩子。而普通的有序树只要求子节点之间有顺序，不区分左右。

```
    A           A
   /             \
  B               B
上面两棵树在二叉树中是不同的（一个左孩子，一个右孩子）
但在普通有序树中可能被认为是相同的
```

### 误区 2："遍历只需要记住顺序就行，不需要理解递归"

**错！** 二叉树的遍历本质上是递归操作。如果不理解递归的执行过程（调用栈），就很难真正掌握遍历。建议手动模拟一遍递归过程，搞清楚每次函数调用时发生了什么。

### 误区 3："层序遍历和前序遍历差不多"

**错！** 层序遍历是逐层访问（BFS，广度优先），用队列实现；前序遍历是深度优先（DFS），用递归或栈实现。两者的访问顺序完全不同。

```
树结构：
       1
      / \
     2   3
    / \
   4   5

前序遍历：1 2 4 5 3（深度优先）
层序遍历：1 2 3 4 5（逐层访问）
```

### 误区 4："二叉树节点数越多，深度一定越大"

**错！** 深度取决于树的形态，不完全取决于节点数。比如：

```
5个节点的链状树（深度5）：    5个节点的平衡树（深度3）：
    A                              A
    |                             / \
    B                            B   C
    |                           / \
    C                           D   E
    |
    D
    |
    E
```

---

## 5.8 动手练习

### 练习 1：基础练习 - 实现三种遍历

给定一棵二叉树，分别实现前序、中序、后序遍历。

要求：

- 使用递归方式实现
- 树结构如下：

```
       1
      / \
     2   3
      \
       4
```

- 输出三种遍历的结果

<details>
<summary>点击查看答案</summary>

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

public class TreeTraversal {

    // 前序遍历：根 -> 左 -> 右
    public static void preOrder(TreeNode node) {
        if (node == null) return;          // 空节点返回
        System.out.print(node.val + " ");  // 访问根节点
        preOrder(node.left);               // 遍历左子树
        preOrder(node.right);              // 遍历右子树
    }

    // 中序遍历：左 -> 根 -> 右
    public static void inOrder(TreeNode node) {
        if (node == null) return;          // 空节点返回
        inOrder(node.left);                // 遍历左子树
        System.out.print(node.val + " ");  // 访问根节点
        inOrder(node.right);               // 遍历右子树
    }

    // 后序遍历：左 -> 右 -> 根
    public static void postOrder(TreeNode node) {
        if (node == null) return;          // 空节点返回
        postOrder(node.left);              // 遍历左子树
        postOrder(node.right);             // 遍历右子树
        System.out.print(node.val + " ");  // 访问根节点
    }

    public static void main(String[] args) {
        // 构建树
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.right = new TreeNode(4);

        System.out.print("前序遍历：");
        preOrder(root);      // 输出：1 2 4 3
        System.out.println();

        System.out.print("中序遍历：");
        inOrder(root);       // 输出：2 4 1 3
        System.out.println();

        System.out.print("后序遍历：");
        postOrder(root);     // 输出：4 2 3 1
        System.out.println();
    }
}
```

</details>

### 练习 2：进阶练习 - 层序遍历按层输出

对二叉树进行层序遍历，要求每一层输出为一行。

要求：

- 树结构如下：

```
       3
      / \
     9   20
        /  \
       15   7
```

- 输出格式：
  ```
  第1层：3
  第2层：9 20
  第3层：15 7
  ```

<details>
<summary>点击查看答案</summary>

```java
import java.util.LinkedList;
import java.util.Queue;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

public class LevelOrderPrint {

    public static void levelOrderByLevel(TreeNode root) {
        if (root == null) return;              // 空树直接返回

        Queue<TreeNode> queue = new LinkedList<>();  // 创建队列
        queue.offer(root);                           // 根节点入队
        int level = 1;                               // 当前层数

        while (!queue.isEmpty()) {
            int size = queue.size();                 // 当前层的节点数
            System.out.print("第" + level + "层：");

            for (int i = 0; i < size; i++) {       // 遍历当前层所有节点
                TreeNode node = queue.poll();        // 取出队头节点
                System.out.print(node.val + " ");    // 访问该节点

                if (node.left != null) {             // 左孩子不为空
                    queue.offer(node.left);          // 左孩子入队
                }
                if (node.right != null) {            // 右孩子不为空
                    queue.offer(node.right);         // 右孩子入队
                }
            }
            System.out.println();                    // 换行
            level++;                                 // 层数加1
        }
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(3);
        root.left = new TreeNode(9);
        root.right = new TreeNode(20);
        root.right.left = new TreeNode(15);
        root.right.right = new TreeNode(7);

        levelOrderByLevel(root);
        // 输出：
        // 第1层：3
        // 第2层：9 20
        // 第3层：15 7
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 求二叉树的最大深度和节点数

编写两个方法，分别求二叉树的最大深度和总节点数。

要求：

- 树结构如下：

```
         1
        / \
       2   3
      / \
     4   5
    /
   6
```

- 输出最大深度和总节点数

<details>
<summary>点击查看答案</summary>

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
}

public class TreeInfo {

    // 求最大深度
    public static int maxDepth(TreeNode root) {
        if (root == null) {              // 空节点深度为0
            return 0;
        }
        int leftDepth = maxDepth(root.left);   // 递归求左子树深度
        int rightDepth = maxDepth(root.right); // 递归求右子树深度
        return Math.max(leftDepth, rightDepth) + 1;  // 取较大值加1
    }

    // 求总节点数
    public static int countNodes(TreeNode root) {
        if (root == null) {              // 空节点不计入
            return 0;
        }
        // 当前节点1个 + 左子树节点数 + 右子树节点数
        return 1 + countNodes(root.left) + countNodes(root.right);
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.left = new TreeNode(4);
        root.left.right = new TreeNode(5);
        root.left.left.left = new TreeNode(6);

        System.out.println("最大深度：" + maxDepth(root));    // 4
        System.out.println("总节点数：" + countNodes(root));  // 6
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习**二叉搜索树**（BST），它是二叉树最重要的应用。你会学到：

- 二叉搜索树的特性：左小右大
- 如何在 BST 中查找、插入、删除节点
- BST 的效率分析：为什么有时候会退化成链表
- 中序遍历 BST 为什么能得到有序序列

二叉搜索树是理解平衡二叉树（下一章）的前置知识，搞懂它非常关键。
