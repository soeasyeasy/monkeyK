---
title: '第七章：平衡二叉树'
description: 'AVL 树的原理、旋转操作与红黑树简介'
---

# 第七章：平衡二叉树

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 上一章说二叉搜索树会退化成链表，那怎么解决？
- AVL 树是什么？它是怎么保持平衡的？
- 旋转操作听起来很抽象，到底在干什么？
- 红黑树又是什么？和 AVL 树有什么区别？
- Java 里的 TreeMap 底层用的是什么树？

这一章就是为了解答这些问题。我们会先搞清楚平衡二叉树的概念，然后重点学习 AVL 树的四种旋转操作，最后简单介绍红黑树。学完之后，你就能理解 Java 集合框架中树结构的底层原理了。

---

## 1 为什么需要平衡二叉树？

### 痛点分析

上一章我们学到，二叉搜索树（BST）在插入有序数据时会退化成链表，查找效率从 O(log n) 降到 O(n)。

举个例子：依次插入 1, 2, 3, 4, 5，BST 变成了一条竖线：

```
1
 \
  2
   \
    3
     \
      4
       \
        5

查找 5 需要比较 5 次，和遍历链表一样慢
```

有没有一种方法，能让 BST 始终保持"矮胖"的形态，确保查找效率始终是 O(log n)？

答案就是**平衡二叉树**。

### 生活类比

> 平衡二叉树就像一个"自我调节的天平"。每次放上新东西（插入节点），天平都会自动调整，确保两边不会差太多。如果一边太重了，它就"旋转"一下，重新平衡。
>
> 再比如叠盘子：如果你总是把盘子往一边叠，塔就会倒。但如果你每次都注意让两边高度差不多，塔就能叠得很高还很稳。

```
不平衡的 BST（像歪斜的塔）：     平衡的树（像稳固的塔）：
      1                                3
       \                              / \
        2                            2   4
         \                          /     \
          3                        1       5
           \
            4
             \
              5

高度 = 5，查找 O(n)             高度 = 3，查找 O(log n)
```

> 一句话总结：平衡二叉树通过自动调整树的形态，保证查找效率始终是 O(log n)。

---

## 2 核心原理

### 什么是平衡二叉树？

平衡二叉树（Balanced Binary Tree）是一种特殊的二叉搜索树，它额外要求：**任何节点的左右子树高度差的绝对值不超过 1**。

这个高度差有一个专门的名字：**平衡因子**（Balance Factor）。

```
平衡因子 = 左子树高度 - 右子树高度
```

| 平衡因子 | 含义 |
| --- | --- |
| 0 | 左右子树一样高 |
| 1 | 左子树比右子树高1层 |
| -1 | 右子树比左子树高1层 |
| 其他值 | 不平衡！需要调整 |

打个比方：

> 平衡因子就像电梯两边的载重指示器。如果左边比右边重太多（平衡因子绝对值 > 1），电梯就会报警，需要重新分配重量。

### AVL 树

AVL 树是最早被发明的自平衡二叉搜索树，由 Adelson-Velsky 和 Landis 在 1962 年提出。

AVL 树满足以下条件：

1. 它是一棵二叉搜索树（左小右大）
2. 每个节点的平衡因子只能是 -1、0、1
3. 如果插入或删除导致不平衡，会通过**旋转**操作恢复平衡

### 为什么旋转能解决问题？

旋转的本质是**在不破坏 BST 性质（左小右大）的前提下，调整树的形态**，让矮的一边变高，高的一边变矮。

打个比方：

> 旋转就像跷跷板上的调整。一边太重了，就把一些重量从重的一边挪到轻的一边，让跷跷板恢复平衡。

---

## 3 基础用法：AVL 树的四种旋转

当插入新节点导致 AVL 树不平衡时，需要根据情况执行以下四种旋转之一：

| 失衡类型 | 失衡原因 | 旋转方式 |
| --- | --- | --- |
| LL 型 | 左孩子的左子树太高 | 右旋 |
| RR 型 | 右孩子的右子树太高 | 左旋 |
| LR 型 | 左孩子的右子树太高 | 先左旋再右旋 |
| RL 型 | 右孩子的左子树太高 | 先右旋再左旋 |

### 增强节点定义

AVL 树的节点需要额外记录高度信息：

```java
class AVLNode {
    int val;             // 节点存储的数据
    AVLNode left;        // 指向左孩子的引用
    AVLNode right;       // 指向右孩子的引用
    int height;          // 节点的高度（用于计算平衡因子）

    AVLNode(int val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.height = 1;     // 新节点初始高度为1
    }
}
```

### 辅助方法

```java
// 获取节点高度
private int getHeight(AVLNode node) {
    if (node == null) {
        return 0;                // 空节点高度为0
    }
    return node.height;
}

// 更新节点高度（取左右子树高度的较大值 + 1）
private void updateHeight(AVLNode node) {
    int leftHeight = getHeight(node.left);    // 左子树高度
    int rightHeight = getHeight(node.right);  // 右子树高度
    node.height = Math.max(leftHeight, rightHeight) + 1;  // 取较大值加1
}

// 计算平衡因子
private int getBalance(AVLNode node) {
    if (node == null) {
        return 0;
    }
    return getHeight(node.left) - getHeight(node.right);  // 左高 - 右高
}
```

### 右旋（LL 型失衡）

当某个节点的左孩子的左子树太高时，执行右旋。

```
失衡前（LL 型）：          右旋后：
      30                      20
     /                       /  \
   20         --->          10    30
   /
 10
（平衡因子 = 2）           （所有节点平衡因子都在 -1, 0, 1 之间）
```

```java
// 右旋操作
private AVLNode rightRotate(AVLNode y) {
    AVLNode x = y.left;          // x 是 y 的左孩子
    AVLNode T2 = x.right;        // T2 是 x 的右子树（将要移动）

    // 执行旋转
    x.right = y;                 // y 变成 x 的右孩子
    y.left = T2;                 // T2 变成 y 的左子树

    // 更新高度（先更新 y，再更新 x）
    updateHeight(y);             // y 的高度可能变了
    updateHeight(x);             // x 的高度可能变了

    return x;                    // 返回新的根节点 x
}
```

打个比方：

> 右旋就像"把左边的重物往上提"。原来 30 在最上面，但左边太重了，就把 20 提上去当新的根，30 降到右边。

### 左旋（RR 型失衡）

当某个节点的右孩子的右子树太高时，执行左旋。

```
失衡前（RR 型）：          左旋后：
  10                          20
    \                        /  \
    20        --->          10    30
      \
       30
（平衡因子 = -2）          （恢复平衡）
```

```java
// 左旋操作
private AVLNode leftRotate(AVLNode x) {
    AVLNode y = x.right;         // y 是 x 的右孩子
    AVLNode T2 = y.left;         // T2 是 y 的左子树（将要移动）

    // 执行旋转
    y.left = x;                  // x 变成 y 的左孩子
    x.right = T2;                // T2 变成 x 的右子树

    // 更新高度
    updateHeight(x);             // 先更新 x
    updateHeight(y);             // 再更新 y

    return y;                    // 返回新的根节点 y
}
```

### LR 型失衡（先左旋再右旋）

```
失衡前（LR 型）：          先对左孩子左旋：       再右旋：
      30                        30                    15
     /                         /                    /  \
   10                        15                   10    30
     \          --->         /
     15                     10
（平衡因子 = 2，            （变成 LL 型）          （恢复平衡）
 但左孩子的右子树更高）
```

```java
// LR 型：先对左孩子左旋，再右旋
private AVLNode lrRotate(AVLNode node) {
    node.left = leftRotate(node.left);   // 先对左孩子执行左旋
    return rightRotate(node);            // 再对当前节点执行右旋
}
```

### RL 型失衡（先右旋再左旋）

```
失衡前（RL 型）：          先对右孩子右旋：       再左旋：
  10                        10                     25
    \                         \                   /  \
    30                        25                 10   30
   /            --->           \
  25                            30               （恢复平衡）
（平衡因子 = -2，             （变成 RR 型）
 但右孩子的左子树更高）
```

```java
// RL 型：先对右孩子右旋，再左旋
private AVLNode rlRotate(AVLNode node) {
    node.right = rightRotate(node.right);  // 先对右孩子执行右旋
    return leftRotate(node);               // 再对当前节点执行左旋
}
```

### 四种旋转对比

| 类型 | 失衡特征 | 旋转方式 | 记忆口诀 |
| --- | --- | --- | --- |
| LL | 左边太高，且左孩子的左边更高 | 右旋 | 左左 -> 右旋 |
| RR | 右边太高，且右孩子的右边更高 | 左旋 | 右右 -> 左旋 |
| LR | 左边太高，但左孩子的右边更高 | 先左旋再右旋 | 左右 -> 先左后右 |
| RL | 右边太高，但右孩子的左边更高 | 先右旋再左旋 | 右左 -> 先右后左 |

---

## 4 AVL 树的插入与删除

### 插入操作

```java
// AVL 树插入节点
public AVLNode insert(AVLNode node, int val) {
    // 第一步：按照 BST 规则插入新节点
    if (node == null) {
        return new AVLNode(val);
    }
    if (val < node.val) {
        node.left = insert(node.left, val);    // 插入到左子树
    } else if (val > node.val) {
        node.right = insert(node.right, val);  // 插入到右子树
    } else {
        return node;                           // 不允许重复值
    }

    // 第二步：更新当前节点的高度
    updateHeight(node);

    // 第三步：检查平衡因子，必要时执行旋转
    int balance = getBalance(node);

    // LL 型：左子树太高，且新节点插在左孩子的左边
    if (balance > 1 && val < node.left.val) {
        return rightRotate(node);              // 右旋
    }

    // RR 型：右子树太高，且新节点插在右孩子的右边
    if (balance < -1 && val > node.right.val) {
        return leftRotate(node);               // 左旋
    }

    // LR 型：左子树太高，但新节点插在左孩子的右边
    if (balance > 1 && val > node.left.val) {
        return lrRotate(node);                 // 先左旋再右旋
    }

    // RL 型：右子树太高，但新节点插在右孩子的左边
    if (balance < -1 && val < node.right.val) {
        return rlRotate(node);                 // 先右旋再左旋
    }

    return node;                               // 返回（可能已经旋转的）节点
}
```

### 删除操作

```java
// AVL 树删除节点
public AVLNode delete(AVLNode root, int val) {
    // 第一步：按照 BST 规则删除节点
    if (root == null) {
        return null;
    }
    if (val < root.val) {
        root.left = delete(root.left, val);    // 去左子树删除
    } else if (val > root.val) {
        root.right = delete(root.right, val);  // 去右子树删除
    } else {
        // 找到要删除的节点
        if (root.left == null) {
            return root.right;                 // 只有右孩子或没有孩子
        } else if (root.right == null) {
            return root.left;                  // 只有左孩子
        }
        // 有两个孩子：用右子树最小值替代
        AVLNode successor = findMin(root.right);
        root.val = successor.val;
        root.right = delete(root.right, successor.val);
    }

    // 第二步：更新高度
    updateHeight(root);

    // 第三步：检查平衡并旋转（和插入后的平衡逻辑一样）
    int balance = getBalance(root);

    if (balance > 1 && getBalance(root.left) >= 0) {
        return rightRotate(root);
    }
    if (balance > 1 && getBalance(root.left) < 0) {
        root.left = leftRotate(root.left);
        return rightRotate(root);
    }
    if (balance < -1 && getBalance(root.right) <= 0) {
        return leftRotate(root);
    }
    if (balance < -1 && getBalance(root.right) > 0) {
        root.right = rightRotate(root.right);
        return leftRotate(root);
    }

    return root;
}

private AVLNode findMin(AVLNode node) {
    while (node.left != null) {
        node = node.left;
    }
    return node;
}
```

---

## 5 进阶用法：红黑树简介

### 为什么需要红黑树？

AVL 树虽然能保证严格的平衡，但插入和删除时需要频繁旋转。在频繁增删的场景下，AVL 树的维护成本较高。

红黑树（Red-Black Tree）是一种**弱平衡**的二叉搜索树，它在平衡性上做出了一些妥协，换取了更少的旋转操作。

打个比方：

> AVL 树像一个"完美主义者"，要求两边高度差不能超过1，稍微不平衡就要调整。
>
> 红黑树像一个"务实主义者"，只要满足几条规则就行，不需要严格平衡。这样插入删除时调整的次数更少。

### 红黑树的五条性质

| 编号 | 性质 | 通俗解释 |
| --- | --- | --- |
| 1 | 每个节点要么是红色，要么是黑色 | 节点有两种颜色 |
| 2 | 根节点是黑色 | 根必须是黑色 |
| 3 | 叶子节点（NIL 空节点）是黑色 | 空节点算黑色 |
| 4 | 红色节点的两个孩子必须是黑色 | 不能有两个红色相连 |
| 5 | 从任一节点到其所有叶子节点的路径上，黑色节点数目相同 | 每条路径黑节点数一样 |

```
一个合法的红黑树示例：

          10(黑)
         /      \
       5(红)    15(红)
      /   \     /   \
    3(黑) 7(黑)12(黑) 18(黑)

性质验证：
- 根节点 10 是黑色 ✅
- 红色节点 5 的孩子 3、7 都是黑色 ✅
- 红色节点 15 的孩子 12、18 都是黑色 ✅
- 从根到每个叶子，黑色节点数都是 2 ✅
```

### 红黑树 vs AVL 树

| 对比项 | AVL 树 | 红黑树 |
| --- | --- | --- |
| 平衡严格度 | 严格平衡（高度差 <= 1） | 弱平衡（满足5条性质） |
| 查找效率 | 更稳定，更接近 O(log n) | 略差于 AVL，但仍是 O(log n) |
| 插入效率 | 最多2次旋转 | 最多2次旋转 |
| 删除效率 | 最多 O(log n) 次旋转 | 最多2次旋转 |
| 适用场景 | 查找多、增删少 | 增删频繁 |
| 典型应用 | 数据库索引 | Java TreeMap、Linux 进程调度 |

> 一句话总结：红黑树用更宽松的平衡条件换取了更好的增删性能，是实际工程中应用最广的平衡树。

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 平衡因子 | 左子树高度 - 右子树高度，只能是 -1、0、1 |
| AVL 树 | 严格平衡的 BST，任何节点平衡因子绝对值 <= 1 |
| LL 型失衡 | 左左情况，执行右旋 |
| RR 型失衡 | 右右情况，执行左旋 |
| LR 型失衡 | 左右情况，先左旋再右旋 |
| RL 型失衡 | 右左情况，先右旋再左旋 |
| 红黑树 | 弱平衡 BST，增删效率更高 |
| 红黑树性质 | 5条性质，核心是"不能有连续红节点" |
| 实际应用 | AVL 适合查找多；红黑树适合增删多（如 TreeMap） |

---

## 7 新手常见误区

### 误区 1："平衡二叉树就是 AVL 树"

**不完全对。** AVL 树是平衡二叉树的一种，但不是唯一一种。红黑树、B 树、Treap 等都是平衡二叉树的不同实现。AVL 树要求严格平衡（高度差 <= 1），而红黑树只要求弱平衡。

### 误区 2："旋转会破坏 BST 的性质"

**错！** 旋转操作的设计原则就是**保持 BST 的左小右大性质不变**。

```
右旋前：            右旋后：
    30                  20
   /                   /  \
  20                  10    30
 /
10

验证 BST 性质：
右旋前：中序遍历 10, 20, 30 ✅
右旋后：中序遍历 10, 20, 30 ✅（顺序没变！）
```

### 误区 3："AVL 树比红黑树好"

**不能简单比较。** AVL 树查找更稳定（因为严格平衡），但增删时需要更多旋转。红黑树增删效率更高，但查找性能略有波动。不同的场景适合不同的树：

- 数据库索引（查找多、增删少）：适合 AVL 树
- Java TreeMap（增删频繁）：适合红黑树

### 误区 4："红黑树的红色节点就是存了额外数据"

**错！** 红黑树中的红色和黑色只是"标记"，用来辅助平衡判断，并不存储额外数据。颜色只是告诉你这个节点在结构中的"角色"。

### 误区 5："平衡树一定能保证 O(log n)"

**要看哪种平衡树。** AVL 树和红黑树都能保证操作复杂度为 O(log n)。但如果只是简单地检查平衡而不做旋转调整，树仍然可能退化。平衡的保证来自于**每次操作后都检查并修复平衡**。

---

## 8 动手练习

### 练习 1：基础练习 - 判断平衡二叉树

编写一个方法，判断给定的二叉树是否是平衡二叉树。

要求：

- 树结构如下：

```
        3
       / \
      9   20
         /  \
        15   7
```

- 判断是否平衡
- 再判断下面这棵树是否平衡：

```
    1
   /
  2
 /
3
```

<details>
<summary>点击查看答案</summary>

```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class BalancedCheck {

    // 判断是否平衡
    public static boolean isBalanced(TreeNode root) {
        if (root == null) {
            return true;                   // 空树是平衡的
        }
        int leftHeight = getHeight(root.left);   // 左子树高度
        int rightHeight = getHeight(root.right); // 右子树高度

        // 当前节点平衡，且左右子树也平衡
        if (Math.abs(leftHeight - rightHeight) > 1) {
            return false;                  // 当前节点不平衡
        }
        return isBalanced(root.left) && isBalanced(root.right);
    }

    // 获取树的高度
    private static int getHeight(TreeNode node) {
        if (node == null) return 0;
        return Math.max(getHeight(node.left), getHeight(node.right)) + 1;
    }

    public static void main(String[] args) {
        // 第一棵树
        TreeNode root1 = new TreeNode(3);
        root1.left = new TreeNode(9);
        root1.right = new TreeNode(20);
        root1.right.left = new TreeNode(15);
        root1.right.right = new TreeNode(7);
        System.out.println("第一棵树是否平衡：" + isBalanced(root1));  // true

        // 第二棵树
        TreeNode root2 = new TreeNode(1);
        root2.left = new TreeNode(2);
        root2.left.left = new TreeNode(3);
        System.out.println("第二棵树是否平衡：" + isBalanced(root2));  // false
    }
}
```

</details>

### 练习 2：进阶练习 - 手动模拟 AVL 树插入

依次插入以下值：`10, 20, 30, 25, 28`

要求：

- 手动画出每次插入后树的结构
- 标注每次插入后是否需要旋转
- 写出最终树的结构

<details>
<summary>点击查看答案</summary>

```
步骤1：插入 10
    10
（平衡因子 = 0，不需要旋转）

步骤2：插入 20
    10
      \
       20
（平衡因子：10 的 BF = -1，不需要旋转）

步骤3：插入 30
    10
      \
       20
         \
          30
（平衡因子：10 的 BF = -2，RR 型失衡！）
（执行左旋）

左旋后：
      20
     /  \
   10    30
（所有节点平衡，旋转完成）

步骤4：插入 25
      20
     /  \
   10    30
        /
      25
（平衡因子：20 的 BF = -1，30 的 BF = 1，都合法，不需要旋转）

步骤5：插入 28
      20
     /  \
   10    30
        /
      25
        \
         28
（平衡因子：30 的 BF = 2，25 的 BF = -1）
（RL 型失衡！先对 25 右旋，再对 30 左旋）

对 25 右旋：
      20
     /  \
   10    30
        /
      28
        \  (不对，应该是 25 变成 28 的左孩子)

重新来：对 25 右旋后：
      20
     /  \
   10    30
        /
      28
      /
    25

再对 30 左旋：
      20
     /  \
   10    28
        /  \
      25    30

最终树结构：
        20
       /  \
     10    28
          /  \
        25    30

验证中序遍历：10, 20, 25, 28, 30（升序，BST 性质保持 ✅）
```

</details>

### 练习 3（挑战）：综合练习 - 实现 AVL 树

实现一个完整的 AVL 树，支持插入和中序遍历。

要求：

- 依次插入：`30, 20, 40, 10, 25, 35, 50`
- 每次插入后检查平衡
- 输出最终树的中序遍历结果和树结构

<details>
<summary>点击查看答案</summary>

```java
class AVLNode {
    int val;
    AVLNode left, right;
    int height;

    AVLNode(int val) {
        this.val = val;
        this.height = 1;
    }
}

public class AVLTree {

    private int getHeight(AVLNode node) {
        return node == null ? 0 : node.height;
    }

    private void updateHeight(AVLNode node) {
        node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1;
    }

    private int getBalance(AVLNode node) {
        return node == null ? 0 : getHeight(node.left) - getHeight(node.right);
    }

    private AVLNode rightRotate(AVLNode y) {
        AVLNode x = y.left;
        AVLNode T2 = x.right;
        x.right = y;
        y.left = T2;
        updateHeight(y);
        updateHeight(x);
        return x;
    }

    private AVLNode leftRotate(AVLNode x) {
        AVLNode y = x.right;
        AVLNode T2 = y.left;
        y.left = x;
        x.right = T2;
        updateHeight(x);
        updateHeight(y);
        return y;
    }

    public AVLNode insert(AVLNode node, int val) {
        if (node == null) return new AVLNode(val);

        if (val < node.val) {
            node.left = insert(node.left, val);
        } else if (val > node.val) {
            node.right = insert(node.right, val);
        } else {
            return node;
        }

        updateHeight(node);
        int balance = getBalance(node);

        if (balance > 1 && val < node.left.val)
            return rightRotate(node);
        if (balance < -1 && val > node.right.val)
            return leftRotate(node);
        if (balance > 1 && val > node.left.val) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
        if (balance < -1 && val < node.right.val) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    public void inOrder(AVLNode root) {
        if (root == null) return;
        inOrder(root.left);
        System.out.print(root.val + " ");
        inOrder(root.right);
    }

    public static void main(String[] args) {
        AVLTree tree = new AVLTree();
        AVLNode root = null;
        int[] values = {30, 20, 40, 10, 25, 35, 50};

        for (int val : values) {
            root = tree.insert(root, val);
        }

        System.out.print("中序遍历：");
        tree.inOrder(root);
        // 输出：10 20 25 30 35 40 50

        // 最终树结构：
        //         30
        //        /  \
        //      20    40
        //     /  \   / \
        //    10  25 35  50
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习**堆与优先队列**，这是另一种重要的树结构。你会学到：

- 堆是什么？和二叉搜索树有什么区别？
- 大顶堆和小顶堆有什么不同？
- 怎么用数组来实现堆？
- 优先队列在实际开发中有哪些应用场景？

堆结构在排序算法（堆排序）和任务调度中非常重要，是面试常考的内容。
