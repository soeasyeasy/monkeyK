---
title: '第八章：堆与优先队列'
description: '堆的概念、实现、堆排序与优先队列的应用'
---

# 第八章：堆与优先队列

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 堆是什么？和内存中的堆是同一个东西吗？
- 堆和二叉搜索树有什么区别？为什么需要堆？
- 怎么用数组来实现堆？
- 优先队列和普通队列有什么不同？
- 堆排序是怎么工作的？

这一章就是为了解答这些问题。我们会从堆的定义讲起，然后学习如何用数组实现堆，接着掌握堆的上浮和下沉操作，最后学习堆排序和优先队列的应用。学完之后，你就能理解 Top-K 问题、任务调度等实际场景的底层原理了。

---

## 1 为什么需要堆？

### 痛点分析

在前面我们学了队列（先进先出），但有时候我们需要的是"优先级最高的先出"，而不是"最先进来的先出"。

比如：
- 医院急诊室：病情最严重的先治疗，而不是先来的人先治疗
- 操作系统的任务调度：优先级高的任务先执行
- 合并多个有序数组：每次取最小的元素

如果用普通队列或数组，每次都要遍历找最大值/最小值，时间复杂度 O(n)。有没有一种结构，能快速找到最值，又能快速插入新元素？

答案就是**堆**（Heap）。

### 生活类比

> 堆就像一个"擂台赛"。擂主永远是当前最强的人（最大值或最小值）。新来的人挑战擂主，如果更强就取代擂主。这样我们随时都能知道"当前最强的是谁"。
>
> 再比如考试排名：每次考试后，学校都要快速找出最高分。如果用堆结构，最高分永远在"堆顶"，一找就是 O(1)。

```
大顶堆示例（最大值在堆顶）：

          90（堆顶，最大值）
        /    \
      80      70
     /  \    /  \
   60   50  40   30

特点：每个父节点都 >= 它的孩子节点
```

> 一句话总结：堆是一种能快速找到最值的树结构，适合解决"动态最值"问题。

---

## 2 核心原理

### 堆的定义

堆（Heap）是一种特殊的**完全二叉树**，满足以下两个性质：

1. **结构性质**：堆是一棵完全二叉树（除最后一层外，其他层都满，最后一层节点靠左）
2. **堆序性质**：
   - **大顶堆**（Max Heap）：每个节点的值 >= 它的孩子节点的值
   - **小顶堆**（Min Heap）：每个节点的值 <= 它的孩子节点的值

打个比方：

> 大顶堆就像"公司层级"：老板（堆顶）的工资最高，每个经理的工资都比他的下属高。
>
> 小顶堆反过来：最底层的人工资最低，越往上工资越低（听起来不太合理，但数据结构就是这样定义的）。

### 大顶堆 vs 小顶堆

| 特性 | 大顶堆 | 小顶堆 |
| --- | --- | --- |
| 堆顶元素 | 最大值 | 最小值 |
| 父节点与孩子关系 | 父 >= 孩子 | 父 <= 孩子 |
| 典型应用 | 找最大值、降序排序 | 找最小值、升序排序 |
| 示例 | 堆顶是 90，往下递减 | 堆顶是 10，往递增 |

```
大顶堆：                    小顶堆：
      90                          10
     /  \                        /  \
   80    70                    20    30
  / \   / \                   / \   / \
60  50 40  30               40  50 60  70
（父 >= 子）                （父 <= 子）
```

### 堆的存储结构

堆通常用**数组**来存储，不需要指针。对于完全二叉树，节点 i 的孩子和父节点可以通过简单的公式计算：

```
数组索引：  0  1  2  3  4  5  6
存储数据： 90 80 70 60 50 40 30

对应关系：
- 节点 i 的父节点：(i - 1) / 2
- 节点 i 的左孩子：2 * i + 1
- 节点 i 的右孩子：2 * i + 2
```

```
数组表示的堆：
索引：  0   1   2   3   4   5   6
数据： 90  80  70  60  50  40  30

对应的树结构：
        90(0)
       /     \
    80(1)   70(2)
    /  \     /  \
 60(3) 50(4) 40(5) 30(6)

验证：
- 节点1(80)的父节点：(1-1)/2 = 0 ✅
- 节点1(80)的左孩子：2*1+1 = 3(60) ✅
- 节点1(80)的右孩子：2*1+2 = 4(50) ✅
```

> 一句话总结：堆用数组存储完全二叉树，通过索引公式快速找到父节点和孩子节点。

---

## 3 基础用法：堆的核心操作

堆的两个核心操作是**上浮**（shiftUp）和**下沉**（shiftDown），它们用于维护堆的性质。

### 堆的类定义

```java
class MaxHeap {
    private int[] heap;          // 用数组存储堆
    private int size;            // 堆中元素的个数

    public MaxHeap(int capacity) {
        heap = new int[capacity];  // 初始化数组
        size = 0;                  // 初始时堆为空
    }

    public MaxHeap() {
        this(10);                  // 默认容量为10
    }
}
```

### 上浮操作（插入时使用）

当向堆中插入新元素时，先把新元素放在数组末尾，然后让它"上浮"到合适的位置。

```
插入 85 到下面的大顶堆：

插入前：                    插入后（上浮前）：           上浮后：
      90                          90                        90
     /  \                        /  \                      /  \
   80    70                    80    70                  85    70
  / \   / \                   / \   / \                 /  \  / \
60  50 40  30               60  50 40  30             60   50 40 30
                                                       ↑
                                                     85刚插入
                                                     在索引4的位置

85 > 50（父节点），上浮交换：
      90
     /  \
   80    70
  / \   / \
60  85 40  30
    ↑
  85上浮到索引1

85 < 90（父节点），停止上浮，插入完成
```

```java
// 上浮操作：插入新元素后调用
private void shiftUp(int index) {
    while (index > 0) {                      // 不是根节点时循环
        int parentIndex = (index - 1) / 2;   // 计算父节点索引

        if (heap[index] > heap[parentIndex]) {  // 如果当前节点比父节点大
            swap(index, parentIndex);           // 交换
            index = parentIndex;                // 更新索引，继续上浮
        } else {
            break;                              // 满足堆性质，停止上浮
        }
    }
}

// 交换两个元素
private void swap(int i, int j) {
    int temp = heap[i];
    heap[i] = heap[j];
    heap[j] = temp;
}
```

### 插入操作

```java
// 向堆中插入新元素
public void insert(int val) {
    if (size == heap.length) {
        throw new RuntimeException("堆已满");
    }

    heap[size] = val;              // 先把新元素放在数组末尾
    shiftUp(size);                 // 然后上浮到合适位置
    size++;                        // 堆的大小加1
}
```

打个比方：

> 插入就像"新员工入职"。新员工先站在队伍最后面，如果他比领导强，就晋升一级，直到找到一个他比不过的位置。

### 下沉操作（删除堆顶时使用）

删除堆顶元素后，把数组最后一个元素移到堆顶，然后让它"下沉"到合适的位置。

```
删除堆顶 90 后：

删除前：                    删除堆顶后：                 下沉后：
      90                          30                        80
     /  \                        /  \                      /  \
   80    70                    80    70                  60    70
  / \   / \                   / \   / \                 / \   / \
60  50 40  30               60  50 40                  60  50 40
                                                       ↑
                                                     80下沉
30移到堆顶，开始下沉：

30 < 80（左孩子），且 30 < 70（右孩子），选择较大的 80 交换：
      80
     /  \
   30    70
  / \   / \
60  50 40

30 < 60（左孩子），交换：
      80
     /  \
   60    70
  / \   / \
30  50 40

30 没有孩子了，停止下沉，删除完成
```

```java
// 下沉操作：删除堆顶后调用
private void shiftDown(int index) {
    while (true) {
        int leftChild = 2 * index + 1;       // 左孩子索引
        int rightChild = 2 * index + 2;      // 右孩子索引
        int largest = index;                 // 假设当前节点最大

        // 如果左孩子存在，且比当前最大节点大
        if (leftChild < size && heap[leftChild] > heap[largest]) {
            largest = leftChild;
        }

        // 如果右孩子存在，且比当前最大节点大
        if (rightChild < size && heap[rightChild] > heap[largest]) {
            largest = rightChild;
        }

        if (largest != index) {              // 如果最大节点不是当前节点
            swap(index, largest);            // 交换
            index = largest;                 // 更新索引，继续下沉
        } else {
            break;                           // 满足堆性质，停止下沉
        }
    }
}
```

### 删除堆顶操作

```java
// 删除并返回堆顶元素（最大值）
public int extractMax() {
    if (size == 0) {
        throw new RuntimeException("堆为空");
    }

    int maxVal = heap[0];              // 堆顶就是最大值
    heap[0] = heap[size - 1];          // 把最后一个元素移到堆顶
    size--;                            // 堆的大小减1
    shiftDown(0);                      // 从堆顶开始下沉

    return maxVal;                     // 返回最大值
}

// 获取堆顶元素（不删除）
public int getMax() {
    if (size == 0) {
        throw new RuntimeException("堆为空");
    }
    return heap[0];                    // 直接返回堆顶
}
```

打个比方：

> 删除堆顶就像"老板离职"。老板走了，把最底层的员工提拔到老板位置，然后他一级一级下沉，直到找到合适的位置。

---

## 4 进阶用法

### 堆排序

堆排序利用堆的性质，可以高效地完成排序。

```java
// 堆排序（升序）
public static void heapSort(int[] arr) {
    int n = arr.length;

    // 第一步：构建大顶堆
    for (int i = n / 2 - 1; i >= 0; i--) {
        shiftDown(arr, n, i);          // 从最后一个非叶子节点开始下沉
    }

    // 第二步：依次将堆顶元素（最大值）移到末尾
    for (int i = n - 1; i > 0; i--) {
        swap(arr, 0, i);               // 堆顶和末尾交换
        shiftDown(arr, i, 0);          // 重新调整为大顶堆
    }
}

// 下沉操作（堆排序版本）
private static void shiftDown(int[] arr, int n, int index) {
    while (true) {
        int leftChild = 2 * index + 1;
        int rightChild = 2 * index + 2;
        int largest = index;

        if (leftChild < n && arr[leftChild] > arr[largest]) {
            largest = leftChild;
        }
        if (rightChild < n && arr[rightChild] > arr[largest]) {
            largest = rightChild;
        }

        if (largest != index) {
            swap(arr, index, largest);
            index = largest;
        } else {
            break;
        }
    }
}

private static void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
```

堆排序过程示例：

```
原数组：[4, 10, 3, 5, 1, 2]

第一步：构建大顶堆
构建后：[10, 5, 3, 4, 1, 2]
对应的树：
        10
       /  \
      5    3
     / \  /
    4   1 2

第二步：依次交换堆顶和末尾，重新调整
第1轮：交换 10 和 2，调整 [2, 5, 3, 4, 1, | 10]
       调整后：[5, 4, 3, 2, 1, | 10]

第2轮：交换 5 和 1，调整 [1, 4, 3, 2, | 5, 10]
       调整后：[4, 2, 3, 1, | 5, 10]

第3轮：交换 4 和 1，调整 [1, 2, 3, | 4, 5, 10]
       调整后：[3, 2, 1, | 4, 5, 10]

第4轮：交换 3 和 1，调整 [1, 2, | 3, 4, 5, 10]
       调整后：[2, 1, | 3, 4, 5, 10]

第5轮：交换 2 和 1，调整 [1, | 2, 3, 4, 5, 10]
       调整后：[1, | 2, 3, 4, 5, 10]

最终结果：[1, 2, 3, 4, 5, 10]（升序）
```

### 优先队列（PriorityQueue）

优先队列是一种特殊的队列，出队顺序按照优先级决定，而不是先进先出。

Java 中的 `PriorityQueue` 默认是小顶堆（最小值先出队）。

```java
import java.util.PriorityQueue;

// 创建优先队列（默认小顶堆）
PriorityQueue<Integer> pq = new PriorityQueue<>();

// 插入元素
pq.offer(30);                    // 插入 30
pq.offer(10);                    // 插入 10
pq.offer(20);                    // 插入 20
pq.offer(5);                     // 插入 5

// 获取队头元素（最小值，不删除）
System.out.println(pq.peek());   // 输出：5

// 出队（删除并返回最小值）
System.out.println(pq.poll());   // 输出：5
System.out.println(pq.poll());   // 输出：10
System.out.println(pq.poll());   // 输出：20
System.out.println(pq.poll());   // 输出：30
```

### 大顶堆版本的优先队列

```java
import java.util.PriorityQueue;
import java.util.Collections;

// 创建大顶堆（通过自定义比较器）
PriorityQueue<Integer> maxPq = new PriorityQueue<>(Collections.reverseOrder());

maxPq.offer(30);
maxPq.offer(10);
maxPq.offer(20);

System.out.println(maxPq.poll());  // 输出：30（最大值先出）
System.out.println(maxPq.poll());  // 输出：20
System.out.println(maxPq.poll());  // 输出：10
```

### Top-K 问题

找出数据中最大（或最小）的 K 个元素。

```java
import java.util.PriorityQueue;

// 找出数组中最大的 3 个数
public static int[] topK(int[] nums, int k) {
    // 创建小顶堆（维护最大的 K 个数）
    PriorityQueue<Integer> pq = new PriorityQueue<>();

    for (int num : nums) {
        pq.offer(num);                 // 先插入
        if (pq.size() > k) {           // 如果堆的大小超过 K
            pq.poll();                 // 弹出最小值（留下较大的 K 个）
        }
    }

    // 堆中剩下的就是最大的 K 个数
    int[] result = new int[k];
    for (int i = 0; i < k; i++) {
        result[i] = pq.poll();
    }
    return result;
}

// 测试
int[] nums = {3, 1, 5, 7, 2, 9, 4, 6, 8};
int[] top3 = topK(nums, 3);
// 结果：[7, 8, 9]（最大的3个数）
```

打个比方：

> Top-K 问题就像"选拔赛"。维护一个大小为 K 的小顶堆，每次新来一个人，如果比堆中最弱的强，就替换掉最弱的。最后堆中剩下的就是最强的 K 个人。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 堆的定义 | 完全二叉树，满足堆序性质 |
| 大顶堆 | 父节点 >= 孩子节点，堆顶是最大值 |
| 小顶堆 | 父节点 <= 孩子节点，堆顶是最小值 |
| 数组存储 | 父节点 (i-1)/2，左孩子 2i+1，右孩子 2i+2 |
| 上浮操作 | 插入新元素后，从底部向上调整 |
| 下沉操作 | 删除堆顶后，从顶部向下调整 |
| 插入复杂度 | O(log n) |
| 删除堆顶复杂度 | O(log n) |
| 堆排序复杂度 | O(n log n) |
| 优先队列 | 基于堆实现，按优先级出队 |
| Top-K 问题 | 用小顶堆维护最大的 K 个数 |

---

## 6 新手常见误区

### 误区 1："堆和内存中的堆是同一个东西"

**错！** 数据结构中的"堆"和内存管理中的"堆"是两个完全不同的概念。

- **数据结构中的堆**：一种完全二叉树，用于快速找到最值
- **内存中的堆**：一块动态分配的内存区域（和栈相对）

它们只是名字相同，没有任何关系。

### 误区 2："堆是有序的"

**错！** 堆只是"部分有序"。堆保证堆顶是最值，父节点和孩子节点有大小关系，但兄弟节点之间没有顺序关系。

```
大顶堆：
      90
     /  \
   80    70
  / \   / \
60  50 40  30

中序遍历：60, 80, 50, 90, 40, 70, 30（不是有序的！）
只有堆顶 90 保证是最大值
```

### 误区 3："优先队列就是队列"

**不完全对。** 优先队列虽然叫"队列"，但它的出队顺序不是先进先出，而是按优先级出队。底层是用堆实现的，不是用普通数组或链表。

```java
// 普通队列：先进先出
Queue<Integer> queue = new LinkedList<>();
queue.offer(1);
queue.offer(2);
queue.offer(3);
System.out.println(queue.poll());  // 输出：1（最先进来的）

// 优先队列：按优先级出队
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.offer(3);
pq.offer(1);
pq.offer(2);
System.out.println(pq.poll());  // 输出：1（最小的，不是最先进来的）
```

### 误区 4："堆排序比快速排序快"

**不一定。** 虽然堆排序的时间复杂度稳定是 O(n log n)，但实际运行中，快速排序通常更快。因为：

- 堆排序的常数因子较大（需要频繁上浮下沉）
- 快速排序的缓存局部性更好（顺序访问内存）

所以 Java 的 `Arrays.sort()` 用的是快速排序的变体，而不是堆排序。

### 误区 5："PriorityQueue 是大顶堆"

**错！** Java 的 `PriorityQueue` 默认是**小顶堆**（最小值先出队）。如果需要大顶堆，要传入自定义比较器。

```java
// 默认小顶堆
PriorityQueue<Integer> minPq = new PriorityQueue<>();
minPq.offer(3);
minPq.offer(1);
minPq.offer(2);
System.out.println(minPq.poll());  // 输出：1（最小值）

// 大顶堆
PriorityQueue<Integer> maxPq = new PriorityQueue<>(Collections.reverseOrder());
maxPq.offer(3);
maxPq.offer(1);
maxPq.offer(2);
System.out.println(maxPq.poll());  // 输出：3（最大值）
```

---

## 7 动手练习

### 练习 1：基础练习 - 手动构建堆

依次插入以下值到大顶堆中：`10, 20, 15, 30, 40`

要求：

- 手动画出每次插入后堆的结构
- 写出对应的数组表示
- 验证是否满足大顶堆性质

<details>
<summary>点击查看答案</summary>

```
步骤1：插入 10
数组：[10]
树：
   10
（满足大顶堆 ✅）

步骤2：插入 20
数组：[10, 20]
插入后：
   10
    \
    20
20 > 10，上浮交换：
   20
  /
10
数组：[20, 10]
（满足大顶堆 ✅）

步骤3：插入 15
数组：[20, 10, 15]
树：
    20
   /  \
  10   15
（15 < 20，不需要上浮，满足大顶堆 ✅）

步骤4：插入 30
数组：[20, 10, 15, 30]
插入后：
      20
     /  \
   10    15
   /
  30
30 > 10，上浮：
      20
     /  \
   30    15
   /
  10
30 > 20，继续上浮：
      30
     /  \
   20    15
   /
  10
数组：[30, 20, 15, 10]
（满足大顶堆 ✅）

步骤5：插入 40
数组：[30, 20, 15, 10, 40]
插入后：
      30
     /  \
   20    15
   / \
  10  40
40 > 20，上浮：
      30
     /  \
   40    15
   / \
  10  20
40 > 30，继续上浮：
      40
     /  \
   30    15
   / \
  10  20
数组：[40, 30, 15, 10, 20]
（满足大顶堆 ✅）

最终结果：
数组：[40, 30, 15, 10, 20]
树结构：
      40
     /  \
   30    15
   / \
  10  20

验证：
- 40 >= 30, 40 >= 15 ✅
- 30 >= 10, 30 >= 20 ✅
- 15 没有孩子 ✅
满足大顶堆性质
```

</details>

### 练习 2：进阶练习 - 实现堆的删除操作

实现一个大顶堆类，支持 `insert` 和 `extractMax` 操作。

要求：

- 依次插入：`10, 20, 15, 30`
- 删除堆顶 2 次
- 输出每次删除后的堆结构

<details>
<summary>点击查看答案</summary>

```java
class MaxHeap {
    private int[] heap;
    private int size;

    public MaxHeap(int capacity) {
        heap = new int[capacity];
        size = 0;
    }

    public void insert(int val) {
        heap[size] = val;
        shiftUp(size);
        size++;
    }

    private void shiftUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (heap[index] > heap[parent]) {
                swap(index, parent);
                index = parent;
            } else {
                break;
            }
        }
    }

    public int extractMax() {
        if (size == 0) throw new RuntimeException("堆为空");
        int max = heap[0];
        heap[0] = heap[size - 1];
        size--;
        shiftDown(0);
        return max;
    }

    private void shiftDown(int index) {
        while (true) {
            int left = 2 * index + 1;
            int right = 2 * index + 2;
            int largest = index;

            if (left < size && heap[left] > heap[largest]) {
                largest = left;
            }
            if (right < size && heap[right] > heap[largest]) {
                largest = right;
            }

            if (largest != index) {
                swap(index, largest);
                index = largest;
            } else {
                break;
            }
        }
    }

    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    public void printHeap() {
        System.out.print("堆数组：[");
        for (int i = 0; i < size; i++) {
            System.out.print(heap[i]);
            if (i < size - 1) System.out.print(", ");
        }
        System.out.println("]");
    }

    public static void main(String[] args) {
        MaxHeap heap = new MaxHeap(10);

        heap.insert(10);
        heap.insert(20);
        heap.insert(15);
        heap.insert(30);
        System.out.println("插入后：");
        heap.printHeap();  // [30, 20, 15, 10]

        System.out.println("第1次删除：" + heap.extractMax());  // 30
        heap.printHeap();  // [20, 10, 15]

        System.out.println("第2次删除：" + heap.extractMax());  // 20
        heap.printHeap();  // [15, 10]
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - Top-K 问题

找出数组 `[3, 1, 5, 7, 2, 9, 4, 6, 8]` 中最大的 3 个数。

要求：

- 使用优先队列实现
- 输出这 3 个数（不要求顺序）

<details>
<summary>点击查看答案</summary>

```java
import java.util.PriorityQueue;

public class TopK {

    public static int[] topK(int[] nums, int k) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();  // 小顶堆

        for (int num : nums) {
            pq.offer(num);                      // 插入元素
            if (pq.size() > k) {                // 堆大小超过 K
                pq.poll();                      // 弹出最小值
            }
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = pq.poll();              // 取出堆中元素
        }
        return result;
    }

    public static void main(String[] args) {
        int[] nums = {3, 1, 5, 7, 2, 9, 4, 6, 8};
        int k = 3;

        int[] result = topK(nums, k);
        System.out.print("最大的 " + k + " 个数：");
        for (int num : result) {
            System.out.print(num + " ");
        }
        // 输出：7 8 9（顺序可能不同）
    }
}
```

</details>

---

## 本章小结

本章我们学习了堆与优先队列的核心内容：

1. **堆的定义**：堆是一种完全二叉树，分为大顶堆和小顶堆
2. **堆的存储**：用数组存储完全二叉树，通过索引公式快速访问父节点和孩子节点
3. **核心操作**：上浮（插入时使用）和下沉（删除堆顶时使用）
4. **堆排序**：利用堆的性质进行排序，时间复杂度 O(n log n)
5. **优先队列**：基于堆实现，按优先级出队
6. **Top-K 问题**：用小顶堆维护最大的 K 个数

堆结构在实际开发中应用广泛，比如任务调度、合并有序数组、中位数问题等。掌握堆的原理和实现，是学习高级算法的基础。

---

## 下一章预告

下一章我们会进入**图结构**的学习。图是一种比树更复杂的数据结构，用于表示多对多的关系。你会学到：

- 图的基本概念：顶点、边、有向图、无向图
- 图的存储方式：邻接矩阵和邻接表
- 图的遍历：深度优先搜索（DFS）和广度优先搜索（BFS）
- 最短路径算法：Dijkstra 算法

图结构在社交网络、地图导航、任务依赖等场景中非常重要。准备好了吗？让我们继续前进！
