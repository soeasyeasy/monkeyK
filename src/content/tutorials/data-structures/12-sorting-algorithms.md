---
title: '第十二章：排序算法'
description: '冒泡排序、选择排序、插入排序、快速排序、归并排序、堆排序'
---

# 第十二章：排序算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 排序算法有哪些？它们有什么区别？
- 为什么有这么多排序算法？不能只用一个吗？
- 快速排序为什么叫"快速"？它比其他排序快在哪里？
- 如何根据数据特点选择最合适的排序算法？

这一章就是为了解答这些问题。我们会从简单的 O(n²) 排序讲起，逐步深入到 O(n log n) 的高效排序，通过生活化类比和代码实例帮你掌握各种排序算法。学完这章，你就能根据场景选择最优排序方案了。

---

## 12.1 为什么需要排序算法？

### 痛点分析

想象你有一堆扑克牌，需要按花色和大小排列。你可以一张张比较、交换位置，但这样效率很低。专业的扑克玩家会用更聪明的方法：先按花色分组，再在每组内排序。

**生活类比**：排序算法就像整理书架。你可以从左到右一本本整理（冒泡排序），也可以每次找最矮的书放左边（选择排序），还可以像插牌一样一张张插入正确位置（插入排序）。不同的方法效率不同，适用场景也不同。

### 代码对比

```java
// ❌ 暴力方法：随机交换，直到有序
// 效率极低，几乎不可能完成

// ✅ 排序算法：系统化的方法
// 冒泡、选择、插入、快速、归并、堆排序等
```

> **一句话总结**：排序算法是高效处理数据的基础，是算法学习的必经之路。

---

## 12.2 核心原理

### 概念解释

**排序**：将一组数据按特定顺序（通常是升序或降序）重新排列。

**排序算法分类**：

- **比较类排序**：通过比较元素大小决定顺序
  - O(n²)：冒泡排序、选择排序、插入排序
  - O(n log n)：快速排序、归并排序、堆排序
- **非比较类排序**：不比较元素大小
  - 计数排序、桶排序、基数排序

**关键特性**：

- **稳定性**：相等元素的相对顺序是否改变
- **时间复杂度**：算法执行时间与数据规模的关系
- **空间复杂度**：算法需要的额外空间

打个比方：

> 排序就像整理队伍。O(n²) 算法是每个人和旁边的人比较、交换；O(n log n) 算法是先把队伍分成小组，组内排好序，再合并。

### 对比分析

| 算法 | 时间复杂度（平均） | 时间复杂度（最坏） | 空间复杂度 | 稳定性 |
|-----|------------------|------------------|-----------|--------|
| 冒泡排序 | O(n²) | O(n²) | O(1) | 稳定 |
| 选择排序 | O(n²) | O(n²) | O(1) | 不稳定 |
| 插入排序 | O(n²) | O(n²) | O(1) | 稳定 |
| 快速排序 | O(n log n) | O(n²) | O(log n) | 不稳定 |
| 归并排序 | O(n log n) | O(n log n) | O(n) | 稳定 |
| 堆排序 | O(n log n) | O(n log n) | O(1) | 不稳定 |

---

## 12.3 基础排序算法

### 冒泡排序

重复遍历数组，相邻元素两两比较，将大的元素"冒泡"到后面。

```java
class BubbleSort {
    // 冒泡排序
    public static void sort(int[] arr) {
        int n = arr.length;
        
        // 外层循环：需要 n-1 轮
        for (int i = 0; i < n - 1; i++) {
            // 内层循环：每轮比较到 n-1-i
            for (int j = 0; j < n - 1 - i; j++) {
                // 如果前一个比后一个大，交换
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    
    // 优化版：提前终止
    public static void sortOptimized(int[] arr) {
        int n = arr.length;
        
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;  // 标记是否交换
            
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swapped = true;
                }
            }
            
            // 如果这一轮没有交换，说明已经有序
            if (!swapped) {
                break;
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        sort(arr);
        System.out.println(Arrays.toString(arr));  // [11, 12, 22, 25, 34, 64, 90]
    }
}

// ✅ 简单易懂，稳定排序
// ❌ 效率低 O(n²)，不适合大数据
```

### 选择排序

每次从未排序部分选出最小元素，放到已排序部分的末尾。

```java
class SelectionSort {
    // 选择排序
    public static void sort(int[] arr) {
        int n = arr.length;
        
        // 外层循环：需要 n-1 轮
        for (int i = 0; i < n - 1; i++) {
            int minIndex = i;  // 假设当前位置是最小值
            
            // 在未排序部分找最小值
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIndex]) {
                    minIndex = j;  // 更新最小值索引
                }
            }
            
            // 将最小值交换到当前位置
            if (minIndex != i) {
                int temp = arr[i];
                arr[i] = arr[minIndex];
                arr[minIndex] = temp;
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 25, 12, 22, 11};
        sort(arr);
        System.out.println(Arrays.toString(arr));  // [11, 12, 22, 25, 64]
    }
}

// ✅ 交换次数少
// ❌ 效率低 O(n²)，不稳定
```

### 插入排序

将未排序元素逐个插入到已排序部分的正确位置。

```java
class InsertionSort {
    // 插入排序
    public static void sort(int[] arr) {
        int n = arr.length;
        
        // 从第二个元素开始（第一个元素默认有序）
        for (int i = 1; i < n; i++) {
            int key = arr[i];  // 待插入的元素
            int j = i - 1;
            
            // 在已排序部分从右向左找插入位置
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];  // 元素后移
                j--;
            }
            
            // 插入到正确位置
            arr[j + 1] = key;
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6};
        sort(arr);
        System.out.println(Arrays.toString(arr));  // [5, 6, 11, 12, 13]
    }
}

// ✅ 对小规模或基本有序的数据高效，稳定
// ❌ 平均效率 O(n²)
```

---

## 12.4 高效排序算法

### 快速排序

使用分治策略，选择一个基准元素，将数组分成两部分。

```java
class QuickSort {
    // 快速排序
    public static void sort(int[] arr, int low, int high) {
        if (low < high) {
            // 分区，找到基准元素的正确位置
            int pivotIndex = partition(arr, low, high);
            
            // 递归排序左半部分
            sort(arr, low, pivotIndex - 1);
            // 递归排序右半部分
            sort(arr, pivotIndex + 1, high);
        }
    }
    
    // 分区函数
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];  // 选择最后一个元素作为基准
        int i = low - 1;        // i 指向小于基准的最后一个元素
        
        for (int j = low; j < high; j++) {
            // 如果当前元素小于基准
            if (arr[j] < pivot) {
                i++;
                // 交换 arr[i] 和 arr[j]
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        
        // 将基准放到正确位置
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        
        return i + 1;  // 返回基准的索引
    }
    
    public static void main(String[] args) {
        int[] arr = {10, 7, 8, 9, 1, 5};
        sort(arr, 0, arr.length - 1);
        System.out.println(Arrays.toString(arr));  // [1, 5, 7, 8, 9, 10]
    }
}

// ✅ 平均效率 O(n log n)，常数因子小
// ❌ 最坏情况 O(n²)，不稳定
```

### 算法步骤详解

```
快速排序(arr, low, high):
  如果 low < high:
    pivotIndex = partition(arr, low, high)
    快速排序(arr, low, pivotIndex - 1)
    快速排序(arr, pivotIndex + 1, high)

分区(arr, low, high):
  pivot = arr[high]
  i = low - 1
  对于 j 从 low 到 high-1:
    如果 arr[j] < pivot:
      i++
      交换 arr[i] 和 arr[j]
  交换 arr[i+1] 和 arr[high]
  返回 i+1
```

### 生活化类比

想象你要整理一副扑克牌：

1. 选一张牌作为基准（比如最后一张）
2. 把所有比它小的放左边，比它大的放右边
3. 对左右两堆重复步骤 1-2
4. 直到每堆只剩一张牌

### 归并排序

使用分治策略，将数组分成两半，分别排序后合并。

```java
class MergeSort {
    // 归并排序
    public static void sort(int[] arr, int left, int right) {
        if (left < right) {
            // 找到中点
            int mid = left + (right - left) / 2;
            
            // 递归排序左半部分
            sort(arr, left, mid);
            // 递归排序右半部分
            sort(arr, mid + 1, right);
            
            // 合并两部分
            merge(arr, left, mid, right);
        }
    }
    
    // 合并函数
    private static void merge(int[] arr, int left, int mid, int right) {
        int n1 = mid - left + 1;  // 左半部分长度
        int n2 = right - mid;     // 右半部分长度
        
        // 创建临时数组
        int[] L = new int[n1];
        int[] R = new int[n2];
        
        // 复制数据
        for (int i = 0; i < n1; i++) {
            L[i] = arr[left + i];
        }
        for (int j = 0; j < n2; j++) {
            R[j] = arr[mid + 1 + j];
        }
        
        // 合并
        int i = 0, j = 0, k = left;
        while (i < n1 && j < n2) {
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            k++;
        }
        
        // 复制剩余元素
        while (i < n1) {
            arr[k] = L[i];
            i++;
            k++;
        }
        while (j < n2) {
            arr[k] = R[j];
            j++;
            k++;
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6, 7};
        sort(arr, 0, arr.length - 1);
        System.out.println(Arrays.toString(arr));  // [5, 6, 7, 11, 12, 13]
    }
}

// ✅ 稳定排序，时间复杂度始终 O(n log n)
// ❌ 需要 O(n) 额外空间
```

### 堆排序

利用堆这种数据结构进行排序。

```java
class HeapSort {
    // 堆排序
    public static void sort(int[] arr) {
        int n = arr.length;
        
        // 构建最大堆
        for (int i = n / 2 - 1; i >= 0; i--) {
            heapify(arr, n, i);
        }
        
        // 逐个取出堆顶元素（最大值）
        for (int i = n - 1; i > 0; i--) {
            // 将堆顶（最大值）移到末尾
            int temp = arr[0];
            arr[0] = arr[i];
            arr[i] = temp;
            
            // 对减少后的堆进行调整
            heapify(arr, i, 0);
        }
    }
    
    // 调整堆
    private static void heapify(int[] arr, int n, int i) {
        int largest = i;        // 初始化最大值为根
        int left = 2 * i + 1;   // 左孩子
        int right = 2 * i + 2;  // 右孩子
        
        // 如果左孩子比根大
        if (left < n && arr[left] > arr[largest]) {
            largest = left;
        }
        
        // 如果右孩子比当前最大值大
        if (right < n && arr[right] > arr[largest]) {
            largest = right;
        }
        
        // 如果最大值不是根
        if (largest != i) {
            int swap = arr[i];
            arr[i] = arr[largest];
            arr[largest] = swap;
            
            // 递归调整受影响的子树
            heapify(arr, n, largest);
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6, 7};
        sort(arr);
        System.out.println(Arrays.toString(arr));  // [5, 6, 7, 11, 12, 13]
    }
}

// ✅ 空间复杂度 O(1)，时间复杂度始终 O(n log n)
// ❌ 不稳定，常数因子比快排大
```

---

## 12.5 核心知识点总结

| 知识点 | 说明 |
|-------|------|
| 冒泡排序 | 相邻比较交换，O(n²)，稳定 |
| 选择排序 | 每次选最小，O(n²)，不稳定 |
| 插入排序 | 逐个插入，O(n²)，稳定，适合小数据 |
| 快速排序 | 分治+分区，O(n log n)，不稳定 |
| 归并排序 | 分治+合并，O(n log n)，稳定，需额外空间 |
| 堆排序 | 利用堆结构，O(n log n)，不稳定 |
| 稳定性 | 相等元素相对顺序是否改变 |
| 时间复杂度 | 算法执行时间的增长趋势 |

---

## 12.6 新手常见误区

### 误区 1：认为快速排序总是最快的

```java
// ❌ 错误：在所有场景都用快速排序
// 快速排序最坏情况 O(n²)

// ✅ 正确：根据数据特点选择
// 小数据：插入排序
// 大数据：快速排序或归并排序
// 需要稳定：归并排序
```

**解释**：快速排序平均性能优秀，但最坏情况（已排序数据）会退化到 O(n²)。

### 误区 2：忽略稳定性的重要性

```java
// ❌ 错误：只关注时间复杂度，忽略稳定性
// 对复杂对象排序时，稳定性很重要

// ✅ 正确：需要稳定性时用归并排序
class Student {
    String name;
    int score;
}
// 按分数排序，希望相同分数的保持原有顺序
// 用归并排序（稳定），不用快速排序（不稳定）
```

**解释**：稳定性在多关键字排序时很重要，可以保证次要关键字的顺序。

### 误区 3：快速排序分区逻辑错误

```java
// ❌ 错误：分区时边界处理不当
private static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low;  // 错误：应该从 low-1 开始
    
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            // 交换逻辑错误
        }
    }
}

// ✅ 正确：标准分区实现
private static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;  // 正确
    
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    
    return i + 1;
}
```

**解释**：分区是快速排序的核心，边界处理错误会导致死循环或错误结果。

### 误区 4：归并排序忘记合并剩余元素

```java
// ❌ 错误：只合并到一方为空
while (i < n1 && j < n2) {
    if (L[i] <= R[j]) {
        arr[k++] = L[i++];
    } else {
        arr[k++] = R[j++];
    }
}
// 忘记复制剩余元素！

// ✅ 正确：复制所有剩余元素
while (i < n1) {
    arr[k++] = L[i++];
}
while (j < n2) {
    arr[k++] = R[j++];
}
```

**解释**：合并时一方先空，另一方还有剩余元素，必须全部复制。

---

## 12.7 动手练习

### 练习 1：实现冒泡排序并优化

**题目**：实现冒泡排序，并添加优化（提前终止）。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class BubbleSortExercise {
    public static void sort(int[] arr) {
        int n = arr.length;
        
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swapped = true;
                }
            }
            
            if (!swapped) {
                break;  // 提前终止
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        sort(arr);
        System.out.println(Arrays.toString(arr));
    }
}
```

</details>

### 练习 2：实现快速排序

**题目**：实现快速排序算法，并对已排序数组进行测试。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class QuickSortExercise {
    public static void sort(int[] arr, int low, int high) {
        if (low < high) {
            int pivotIndex = partition(arr, low, high);
            sort(arr, low, pivotIndex - 1);
            sort(arr, pivotIndex + 1, high);
        }
    }
    
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        
        return i + 1;
    }
    
    public static void main(String[] args) {
        int[] arr = {10, 7, 8, 9, 1, 5};
        sort(arr, 0, arr.length - 1);
        System.out.println(Arrays.toString(arr));
        
        // 测试已排序数组
        int[] sorted = {1, 2, 3, 4, 5};
        sort(sorted, 0, sorted.length - 1);
        System.out.println(Arrays.toString(sorted));
    }
}
```

</details>

### 练习 3：比较不同排序算法的性能

**题目**：对同一组数据分别使用冒泡、插入、快速排序，比较执行时间。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class SortComparison {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    
    public static void insertionSort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }
    
    public static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pivotIndex = partition(arr, low, high);
            quickSort(arr, low, pivotIndex - 1);
            quickSort(arr, pivotIndex + 1, high);
        }
    }
    
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }
    
    public static void main(String[] args) {
        int n = 10000;
        int[] arr = new int[n];
        Random rand = new Random();
        
        // 生成随机数据
        for (int i = 0; i < n; i++) {
            arr[i] = rand.nextInt(n);
        }
        
        // 冒泡排序
        int[] arr1 = arr.clone();
        long start = System.currentTimeMillis();
        bubbleSort(arr1);
        System.out.println("冒泡排序: " + (System.currentTimeMillis() - start) + "ms");
        
        // 插入排序
        int[] arr2 = arr.clone();
        start = System.currentTimeMillis();
        insertionSort(arr2);
        System.out.println("插入排序: " + (System.currentTimeMillis() - start) + "ms");
        
        // 快速排序
        int[] arr3 = arr.clone();
        start = System.currentTimeMillis();
        quickSort(arr3, 0, arr3.length - 1);
        System.out.println("快速排序: " + (System.currentTimeMillis() - start) + "ms");
    }
}
```

</details>

---

## 12.8 下一章预告

学完排序算法后，你已经掌握了数据结构与算法的核心内容。下一章我们将进入**综合实战**，通过实际项目案例，将前面学到的数据结构（数组、链表、栈、队列、树、图）和算法（排序、搜索、动态规划）应用到真实场景中，提升你的工程实践能力。
