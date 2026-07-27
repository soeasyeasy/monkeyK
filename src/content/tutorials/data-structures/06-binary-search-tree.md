---
title: '第六章：二叉搜索树'
description: '二叉搜索树的特性、查找、插入、删除操作及效率分析'
---

# 第六章：二叉搜索树

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 二叉搜索树和普通二叉树有什么区别？
- 为什么说二叉搜索树查找很快？
- 怎么在二叉搜索树中插入和删除节点？
- 二叉搜索树什么时候会失效？

这一章就是为了解答这些问题。我们会从二叉搜索树的定义和特性讲起，然后逐一实现查找、插入、删除操作，最后分析它的效率问题和退化现象。学完之后，你就能理解为什么需要平衡二叉树了。

---

## 1 为什么需要二叉搜索树？

### 痛点分析

在上一章我们学了二叉树的遍历，但普通的二叉树对数据没有任何排序要求，查找一个元素只能遍历整棵树，时间复杂度 O(n)。

有没有一种二叉树，既能保持树结构的灵活性（插入删除方便），又能像有序数组一样快速查找？

答案就是**二叉搜索树**（Binary Search Tree，简称 BST）。

### 生活类比

> 二叉搜索树就像一本字典。翻开字典，如果目标单词在当前页的左边，就去左半部分找；如果在右边，就去右半部分找。每次都能排除一半的候选项，所以查找非常快。
>
> 再比如猜数字游戏：我心里想一个 1-100 的数字，你猜是多少。每次你说一个数，我告诉你"大了"或"小了"。你每次都取中间值猜，最多7次就能猜中。这就是二叉搜索的思想。

```
查找 7 的过程：

          8
         / \
        3   10
       / \    \
      1   6    14
         /    /
        4    13
              \
               7（找到了！）

从 8 开始：7 < 8，往左走
到 3：7 > 3，往右走
到 6：7 > 6，往右走
... 最终找到 7
```

> 一句话总结：二叉搜索树让查找操作像"二分查找"一样高效，平均时间复杂度 O(log n)。

---

## 2 核心原理

### 定义

二叉搜索树（BST）是一种特殊的二叉树，满足以下性质：

1. 若左子树不为空，则左子树上所有节点的值**都小于**根节点的值
2. 若右子树不为空，则右子树上所有节点的值**都大于**根节点的值
3. 左右子树也分别是二叉搜索树

打个比方：

> BST 就像一个"比大小擂台"。每个节点都是一个裁判：比它小的站左边，比它大的站右边。这个规则在每一层都成立。

### 核心特性

| 特性 | 说明 |
| --- | --- |
| 左小右大 | 左子树所有值 < 根 < 右子树所有值 |
| 中序有序 | 中序遍历 BST 得到的是升序序列 |
| 无重复（通常） | 一般约定 BST 中不允许重复值 |
| 查找高效 | 平均时间复杂度 O(log n) |

### 验证 BST 的方法

中序遍历 BST，如果得到的序列是严格递增的，那就是一棵合法的 BST。

```java
// 验证是否为二叉搜索树
public boolean isValidBST(TreeNode root) {
    if (root == null) {
        return true;
    }
    // 中序遍历，检查是否严格递增
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) {
        return true;
    }
    // 当前节点值必须在 (min, max) 范围内
    if (node.val <= min || node.val >= max) {
        return false;
    }
    // 左子树：上界更新为当前节点值
    // 右子树：下界更新为当前节点值
    return validate(node.left, min, node.val)
        && validate(node.right, node.val, max);
}
```

---

## 3 基础用法：BST 的核心操作

### 节点定义

BST 的节点和上一章的二叉树节点一样：

```java
class TreeNode {
    int val;             // 节点存储的数据
    TreeNode left;       // 指向左孩子的引用
    TreeNode right;      // 指向右孩子的引用

    TreeNode(int val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}
```

### 查找操作

在 BST 中查找某个值，利用"左小右大"的性质，每次排除一半。

```java
// 在 BST 中查找目标值
public TreeNode search(TreeNode root, int target) {
    if (root == null) {              // 没找到，返回 null
        return null;
    }
    if (target == root.val) {        // 找到了，返回当前节点
        return root;
    }
    if (target < root.val) {         // 目标值比当前节点小
        return search(root.left, target);   // 去左子树找
    } else {                         // 目标值比当前节点大
        return search(root.right, target);  // 去右子树找
    }
}

// 迭代版本的查找（不用递归）
public TreeNode searchIterative(TreeNode root, int target) {
    TreeNode current = root;         // 从根节点开始
    while (current != null) {        // 还没找到
        if (target == current.val) { // 找到了
            return current;
        } else if (target < current.val) {  // 目标值更小
            current = current.left;  // 往左走
        } else {                     // 目标值更大
            current = current.right; // 往右走
        }
    }
    return null;                     // 没找到
}
```

打个比方：

> 查找就像翻字典。目标单词在当前页前面，就往前翻；在后面，就往后翻。每次都缩小范围。

### 插入操作

插入新节点时，按照 BST 的规则找到合适的位置。

```java
// 在 BST 中插入新值
public TreeNode insert(TreeNode root, int val) {
    if (root == null) {              // 找到空位置了，创建新节点
        return new TreeNode(val);
    }
    if (val < root.val) {            // 新值比当前节点小
        root.left = insert(root.left, val);  // 插入到左子树
    } else if (val > root.val) {     // 新值比当前节点大
        root.right = insert(root.right, val); // 插入到右子树
    }
    // val == root.val 时不插入（BST 通常不存重复值）
    return root;                     // 返回当前节点
}
```

打个比方：

> 插入就像安排座位。新来一个人，从根节点开始比大小，小的往左坐，大的往右坐，一直找到一个空位。

插入过程示例：

```
原 BST：          插入 5 后：
    8                 8
   / \               / \
  3   10            3   10
 / \    \          / \    \
1   6    14       1   6    14
   /     /          /    /
  4     13         4    13
                    \
                     5
```

### 删除操作

删除操作是 BST 中最复杂的，分三种情况：

| 情况 | 处理方式 |
| --- | --- |
| 删除叶子节点 | 直接删除，父节点指向 null |
| 删除只有一个孩子的节点 | 用孩子替代被删除的节点 |
| 删除有两个孩子的节点 | 用右子树最小值（或左子树最大值）替代 |

```java
// 在 BST 中删除指定值的节点
public TreeNode delete(TreeNode root, int target) {
    if (root == null) {              // 没找到要删除的节点
        return null;
    }

    if (target < root.val) {         // 目标值比当前节点小
        root.left = delete(root.left, target);  // 去左子树删除
    } else if (target > root.val) {  // 目标值比当前节点大
        root.right = delete(root.right, target); // 去右子树删除
    } else {
        // 找到要删除的节点了，分三种情况

        // 情况1：叶子节点（没有孩子）
        if (root.left == null && root.right == null) {
            return null;             // 直接删除
        }

        // 情况2：只有一个孩子
        if (root.left == null) {     // 只有右孩子
            return root.right;       // 用右孩子替代
        }
        if (root.right == null) {    // 只有左孩子
            return root.left;        // 用左孩子替代
        }

        // 情况3：有两个孩子
        // 找到右子树中的最小值（后继节点）
        TreeNode successor = findMin(root.right);
        root.val = successor.val;    // 用后继节点的值替代当前节点
        root.right = delete(root.right, successor.val); // 删除后继节点
    }
    return root;
}

// 辅助方法：找到以 node 为根的树中的最小值节点
private TreeNode findMin(TreeNode node) {
    while (node.left != null) {      // 一直往左走
        node = node.left;
    }
    return node;                     // 最左边的节点就是最小值
}
```

删除过程示例：

```
删除 3（有两个孩子 1 和 6）：

原 BST：               删除后：
    8                     8
   / \                   / \
  3   10                4   10
 / \    \              / \    \
1   6    14           1   6    14
   /    /                /    /
  4    13               5    13
   \
    5

3 的后继节点是 4（右子树中的最小值）
用 4 替代 3，再删除原来的 4
```

### 查找最小值和最大值

```java
// 查找 BST 中的最小值（最左边的节点）
public TreeNode findMin(TreeNode root) {
    TreeNode current = root;
    while (current.left != null) {   // 一直往左走
        current = current.left;
    }
    return current;                  // 最左边的节点
}

// 查找 BST 中的最大值（最右边的节点）
public TreeNode findMax(TreeNode root) {
    TreeNode current = root;
    while (current.right != null) {  // 一直往右走
        current = current.right;
    }
    return current;                  // 最右边的节点
}
```

### 中序遍历得到有序序列

```java
// 中序遍历 BST，得到升序序列
public void inOrder(TreeNode root) {
    if (root == null) {
        return;
    }
    inOrder(root.left);                    // 先遍历左子树（更小的值）
    System.out.print(root.val + " ");      // 访问根节点
    inOrder(root.right);                   // 再遍历右子树（更大的值）
}

// 对于 BST：
//       8
//      / \
//     3   10
//    / \    \
//   1   6    14
// 中序遍历结果：1 3 6 8 10 14（升序！）
```

---

## 4 进阶用法

### 查找前驱和后继

```java
// 查找 BST 中某个节点的中序后继（比它大的最小值）
public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
    TreeNode successor = null;       // 记录后继节点
    TreeNode current = root;

    while (current != null) {
        if (p.val < current.val) {   // p 比当前节点小
            successor = current;     // 当前节点可能是后继
            current = current.left;  // 继续往左找更小的
        } else {                     // p 比当前节点大或相等
            current = current.right; // 往右找
        }
    }
    return successor;                // 返回找到的后继节点
}
```

### 将有序数组转换为 BST

```java
// 将有序数组转换为高度平衡的 BST
public TreeNode sortedArrayToBST(int[] nums) {
    if (nums == null || nums.length == 0) {
        return null;
    }
    return buildBST(nums, 0, nums.length - 1);
}

private TreeNode buildBST(int[] nums, int left, int right) {
    if (left > right) {              // 区间无效
        return null;
    }
    int mid = left + (right - left) / 2;  // 取中间位置
    TreeNode root = new TreeNode(nums[mid]);  // 中间值作为根
    root.left = buildBST(nums, left, mid - 1);    // 左半部分构建左子树
    root.right = buildBST(nums, mid + 1, right);  // 右半部分构建右子树
    return root;
}
```

### 查找 BST 中两个节点的最近公共祖先

```java
// 查找 BST 中两个节点的最近公共祖先（LCA）
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode current = root;
    while (current != null) {
        if (p.val < current.val && q.val < current.val) {
            current = current.left;  // 两个节点都在左子树
        } else if (p.val > current.val && q.val > current.val) {
            current = current.right; // 两个节点都在右子树
        } else {
            return current;          // 一左一右，当前节点就是 LCA
        }
    }
    return null;
}
```

### BST 的范围查询

```java
// 查找 BST 中值在 [low, high] 范围内的所有节点
public List<Integer> rangeSearch(TreeNode root, int low, int high) {
    List<Integer> result = new ArrayList<>();
    rangeSearchHelper(root, low, high, result);
    return result;
}

private void rangeSearchHelper(TreeNode node, int low, int high, List<Integer> result) {
    if (node == null) {
        return;
    }
    if (node.val > low) {                  // 左子树可能有范围内的值
        rangeSearchHelper(node.left, low, high, result);
    }
    if (node.val >= low && node.val <= high) {  // 当前节点在范围内
        result.add(node.val);
    }
    if (node.val < high) {                 // 右子树可能有范围内的值
        rangeSearchHelper(node.right, low, high, result);
    }
}
```

---

## 5 效率分析与退化问题

### BST 的效率

| 操作 | 平均时间复杂度 | 最坏时间复杂度 |
| --- | --- | --- |
| 查找 | O(log n) | O(n) |
| 插入 | O(log n) | O(n) |
| 删除 | O(log n) | O(n) |

### 退化问题

当插入的数据是有序的（比如 1, 2, 3, 4, 5），BST 会退化成一条链表：

```
正常 BST（平衡）：        退化 BST（链状）：
      3                       1
     / \                       \
    2   5                       2
   /   / \                       \
  1   4   6                       3
                                   \
                                    4
                                     \
                                      5
                                       \
                                        6

深度 O(log n)，查找 O(log n)    深度 O(n)，查找 O(n)
```

> 这就是为什么我们需要**平衡二叉树**（下一章的内容），它能自动调整树的形态，保证查找效率始终是 O(log n)。

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| BST 定义 | 左子树 < 根 < 右子树 |
| 中序遍历 | 得到升序序列 |
| 查找 | 利用左小右大性质，平均 O(log n) |
| 插入 | 找到合适位置插入新节点 |
| 删除 | 分三种情况：叶子、单孩子、双孩子 |
| 后继节点 | 右子树中的最小值节点 |
| 退化问题 | 有序数据插入导致退化成链表 |
| 最坏复杂度 | O(n)，需要平衡二叉树来解决 |

---

## 7 新手常见误区

### 误区 1："BST 的左子树只比根小一点就行"

**错！** BST 要求的是**整个左子树**的所有节点都小于根节点，不仅仅是左孩子。

```
    5
   / \
  3   8
 / \
2   6     <-- 6 > 5，违反了 BST 性质！
          虽然 6 > 3（满足局部），但 6 > 5（违反全局）
```

### 误区 2："删除有两个孩子的节点时，随便选一个子树的值替代就行"

**错！** 必须选择右子树的最小值（后继）或左子树的最大值（前驱），否则破坏 BST 性质。

```java
// ✅ 正确：用右子树最小值替代
TreeNode successor = findMin(root.right);
root.val = successor.val;
root.right = delete(root.right, successor.val);

// ❌ 错误：随便用右子树的根替代
// root.val = root.right.val;  // 可能破坏 BST 性质
```

### 误区 3："BST 查找总是 O(log n)"

**错！** 只有在树平衡的情况下才是 O(log n)。如果树退化成链表，查找就是 O(n)。

```
有序插入 1,2,3,4,5 后：
1
 \
  2
   \
    3
     \
      4
       \
        5
查找 5 需要遍历所有节点，时间复杂度 O(n)
```

### 误区 4："BST 中不能有重复值"

**不绝对。** 严格来说，经典 BST 定义不允许重复值。但有些变体允许重复值，通常约定重复值放在右子树（或左子树），只要保持一致即可。大多数教材和面试中默认不允许重复。

### 误区 5："插入和删除操作不会改变树的形状"

**错！** 插入操作会在树的底部添加新节点，可能增加树的深度。删除操作也可能改变树的结构。这就是为什么需要平衡二叉树来自动维护树的平衡。

---

## 8 动手练习

### 练习 1：基础练习 - BST 的插入与中序遍历

依次插入以下值构建 BST：`8, 3, 10, 1, 6, 14, 4, 7, 13`

要求：

- 按顺序插入
- 插入完成后进行中序遍历
- 验证中序遍历结果是升序的

<details>
<summary>点击查看答案</summary>

```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class BSTBuild {

    // 插入节点
    public static TreeNode insert(TreeNode root, int val) {
        if (root == null) {
            return new TreeNode(val);
        }
        if (val < root.val) {
            root.left = insert(root.left, val);
        } else if (val > root.val) {
            root.right = insert(root.right, val);
        }
        return root;
    }

    // 中序遍历
    public static void inOrder(TreeNode root) {
        if (root == null) return;
        inOrder(root.left);
        System.out.print(root.val + " ");
        inOrder(root.right);
    }

    public static void main(String[] args) {
        int[] values = {8, 3, 10, 1, 6, 14, 4, 7, 13};
        TreeNode root = null;

        for (int val : values) {
            root = insert(root, val);  // 逐个插入
        }

        System.out.print("中序遍历：");
        inOrder(root);
        // 输出：1 3 4 6 7 8 10 13 14（升序，验证成功）
    }
}
```

</details>

### 练习 2：进阶练习 - BST 查找与删除

在练习 1 构建的 BST 中：

1. 查找值为 6 的节点
2. 删除值为 3 的节点（它有两个孩子 1 和 6）
3. 删除后再次中序遍历，验证结果

<details>
<summary>点击查看答案</summary>

```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class BSTDelete {

    public static TreeNode insert(TreeNode root, int val) {
        if (root == null) return new TreeNode(val);
        if (val < root.val) root.left = insert(root.left, val);
        else if (val > root.val) root.right = insert(root.right, val);
        return root;
    }

    public static TreeNode search(TreeNode root, int target) {
        if (root == null || root.val == target) return root;
        if (target < root.val) return search(root.left, target);
        return search(root.right, target);
    }

    public static TreeNode delete(TreeNode root, int target) {
        if (root == null) return null;
        if (target < root.val) {
            root.left = delete(root.left, target);
        } else if (target > root.val) {
            root.right = delete(root.right, target);
        } else {
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            TreeNode successor = findMin(root.right);
            root.val = successor.val;
            root.right = delete(root.right, successor.val);
        }
        return root;
    }

    private static TreeNode findMin(TreeNode node) {
        while (node.left != null) node = node.left;
        return node;
    }

    public static void inOrder(TreeNode root) {
        if (root == null) return;
        inOrder(root.left);
        System.out.print(root.val + " ");
        inOrder(root.right);
    }

    public static void main(String[] args) {
        int[] values = {8, 3, 10, 1, 6, 14, 4, 7, 13};
        TreeNode root = null;
        for (int val : values) {
            root = insert(root, val);
        }

        // 查找 6
        TreeNode found = search(root, 6);
        System.out.println("查找 6：" + (found != null ? "找到" : "未找到"));

        // 删除 3
        root = delete(root, 3);
        System.out.print("删除 3 后中序遍历：");
        inOrder(root);
        // 输出：1 4 6 7 8 10 13 14
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 有序数组转 BST

将有序数组 `[1, 2, 3, 4, 5, 6, 7]` 转换为一棵高度平衡的 BST，并输出其层序遍历结果。

<details>
<summary>点击查看答案</summary>

```java
import java.util.LinkedList;
import java.util.Queue;

class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class SortedArrayToBST {

    public static TreeNode sortedArrayToBST(int[] nums) {
        if (nums == null || nums.length == 0) return null;
        return build(nums, 0, nums.length - 1);
    }

    private static TreeNode build(int[] nums, int left, int right) {
        if (left > right) return null;
        int mid = left + (right - left) / 2;
        TreeNode root = new TreeNode(nums[mid]);
        root.left = build(nums, left, mid - 1);
        root.right = build(nums, mid + 1, right);
        return root;
    }

    public static void levelOrder(TreeNode root) {
        if (root == null) return;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            System.out.print(node.val + " ");
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5, 6, 7};
        TreeNode root = sortedArrayToBST(nums);

        System.out.print("层序遍历：");
        levelOrder(root);
        // 输出：4 2 6 1 3 5 7
        // 树结构：
        //       4
        //      / \
        //     2   6
        //    / \ / \
        //   1  3 5  7
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习**平衡二叉树**（AVL 树和红黑树）。你会发现：

- 为什么 BST 会退化？怎么避免？
- AVL 树是怎么通过"旋转"来保持平衡的？
- 红黑树的五条性质是什么？
- Java 中的 TreeMap、TreeSet 底层是怎么实现的？

平衡二叉树解决了 BST 的退化问题，是实际工程中最常用的树结构。准备好了吗？
