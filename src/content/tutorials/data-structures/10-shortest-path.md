---
title: '第十章：图的最短路径'
description: 'Dijkstra算法、Bellman-Ford算法、Floyd算法'
---

# 第十章：图的最短路径

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 地图导航是如何计算最短路线的？
- 什么是最短路径算法？有哪些经典算法？
- Dijkstra 算法是如何工作的？为什么不能用负权边？
- 如何处理带负权边的图？

这一章就是为了解答这些问题。我们会从单源最短路径讲到全源最短路径，通过生活化类比和代码实例帮你掌握这些经典算法。学完这章，你就能实现自己的导航系统了。

---

## 1 为什么需要最短路径算法？

### 痛点分析

想象你要从家开车去公司，地图上有几十条路线可选。你不可能把所有路线都试一遍，然后选最短的。你需要一个智能算法，快速找出最短路线。

**生活类比**：最短路径算法就像导航软件的大脑。你告诉它起点和终点，它通过计算所有可能的路线，找出距离最短（或时间最少）的那条。Dijkstra 算法就像一个人从起点开始，逐步向外扩展，每次选择当前最近的未访问节点，直到到达终点。

### 代码对比

```java
// ❌ 暴力方法：尝试所有路径（指数级时间复杂度）
// 无法处理大规模图

// ✅ Dijkstra 算法：贪心策略（O(V²) 或 O(E log V)）
// 高效找到最短路径
```

> **一句话总结**：最短路径算法让导航、网络路由等应用成为可能。

---

## 2 核心原理

### 概念解释

**最短路径问题**：在带权图中，找到两个顶点之间权重之和最小的路径。

**算法分类**：

- **单源最短路径**：从一个起点到所有其他顶点的最短路径
  - Dijkstra 算法：适用于非负权边
  - Bellman-Ford 算法：可处理负权边
- **全源最短路径**：任意两个顶点之间的最短路径
  - Floyd-Warshall 算法

打个比方：

> Dijkstra 算法像消防员灭火。从起点开始，火势（最短距离）向四周蔓延，每次先烧到最近的房子（顶点）。当火烧到终点时，就找到了最短路径。

### 对比分析

| 算法 | 时间复杂度 | 适用场景 | 能否处理负权 |
|-----|-----------|---------|------------|
| Dijkstra | O(V²) 或 O(E log V) | 单源、非负权 | 否 |
| Bellman-Ford | O(VE) | 单源、可负权 | 是 |
| Floyd | O(V³) | 全源 | 是（无负环） |

---

## 3 Dijkstra 算法

### 基础用法

适用于**非负权图**的单源最短路径。

```java
import java.util.*;

class Dijkstra {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;
    
    public Dijkstra(int v) {
        vertices = v;
        adjMatrix = new int[v][v];
        // 初始化为无穷大
        for (int i = 0; i < v; i++) {
            Arrays.fill(adjMatrix[i], INF);
        }
    }
    
    // 添加带权边
    public void addEdge(int from, int to, int weight) {
        adjMatrix[from][to] = weight;
        adjMatrix[to][from] = weight;  // 无向图
    }
    
    // Dijkstra 算法
    public void dijkstra(int start) {
        int[] dist = new int[vertices];      // 最短距离数组
        boolean[] visited = new boolean[vertices];  // 已访问标记
        
        // 初始化距离为无穷大
        Arrays.fill(dist, INF);
        dist[start] = 0;  // 起点到自身距离为 0
        
        // 遍历所有顶点
        for (int i = 0; i < vertices; i++) {
            // 找到未访问顶点中距离最小的
            int minDist = INF;
            int minIndex = -1;
            for (int v = 0; v < vertices; v++) {
                if (!visited[v] && dist[v] < minDist) {
                    minDist = dist[v];
                    minIndex = v;
                }
            }
            
            // 如果找不到，说明剩余顶点不可达
            if (minIndex == -1) break;
            
            // 标记为已访问
            visited[minIndex] = true;
            
            // 更新邻居的距离
            for (int v = 0; v < vertices; v++) {
                if (adjMatrix[minIndex][v] != INF && !visited[v]) {
                    // 如果通过 minIndex 到 v 更短，则更新
                    if (dist[minIndex] + adjMatrix[minIndex][v] < dist[v]) {
                        dist[v] = dist[minIndex] + adjMatrix[minIndex][v];
                    }
                }
            }
        }
        
        // 打印结果
        System.out.println("从顶点 " + start + " 到各顶点的最短距离：");
        for (int i = 0; i < vertices; i++) {
            System.out.println("  -> " + i + ": " + dist[i]);
        }
    }
    
    public static void main(String[] args) {
        Dijkstra graph = new Dijkstra(5);
        graph.addEdge(0, 1, 10);
        graph.addEdge(0, 3, 5);
        graph.addEdge(1, 2, 1);
        graph.addEdge(1, 3, 2);
        graph.addEdge(2, 4, 4);
        graph.addEdge(3, 1, 3);
        graph.addEdge(3, 2, 9);
        graph.addEdge(3, 4, 2);
        
        graph.dijkstra(0);
        // 输出：
        // 从顶点 0 到各顶点的最短距离：
        //   -> 0: 0
        //   -> 1: 8
        //   -> 2: 9
        //   -> 3: 5
        //   -> 4: 7
    }
}

// ✅ 贪心策略，每次选最近的未访问顶点
// ❌ 不能处理负权边
```

### 算法步骤详解

```
初始化：
  dist[起点] = 0，其他 dist[i] = INF
  visited[] = false

循环 V 次：
  1. 找到未访问顶点中 dist 最小的顶点 u
  2. 标记 u 为已访问
  3. 对 u 的每个未访问邻居 v：
     如果 dist[u] + weight(u,v) < dist[v]：
       更新 dist[v] = dist[u] + weight(u,v)
```

### 生活化类比

想象你站在城市的起点，想知道到达所有地方的最短距离：

1. 你先看看周围直接相连的地方，记录下距离
2. 选择最近的未访问地点 A 走过去
3. 从 A 出发，看看通过 A 能否更快到达其他地方
4. 重复步骤 2-3，直到所有地方都访问过

---

## 4 Bellman-Ford 算法

### 基础用法

可以处理**负权边**，并能检测负权环。

```java
class BellmanFord {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;
    
    public BellmanFord(int v) {
        vertices = v;
        adjMatrix = new int[v][v];
        for (int i = 0; i < v; i++) {
            Arrays.fill(adjMatrix[i], INF);
        }
    }
    
    public void addEdge(int from, int to, int weight) {
        adjMatrix[from][to] = weight;
    }
    
    // Bellman-Ford 算法
    public boolean bellmanFord(int start) {
        int[] dist = new int[vertices];
        Arrays.fill(dist, INF);
        dist[start] = 0;
        
        // 松弛 V-1 次
        for (int i = 0; i < vertices - 1; i++) {
            for (int u = 0; u < vertices; u++) {
                for (int v = 0; v < vertices; v++) {
                    if (adjMatrix[u][v] != INF && dist[u] != INF) {
                        // 松弛操作
                        if (dist[u] + adjMatrix[u][v] < dist[v]) {
                            dist[v] = dist[u] + adjMatrix[u][v];
                        }
                    }
                }
            }
        }
        
        // 检测负权环
        for (int u = 0; u < vertices; u++) {
            for (int v = 0; v < vertices; v++) {
                if (adjMatrix[u][v] != INF && dist[u] != INF) {
                    if (dist[u] + adjMatrix[u][v] < dist[v]) {
                        return false;  // 存在负权环
                    }
                }
            }
        }
        
        // 打印结果
        System.out.println("从顶点 " + start + " 到各顶点的最短距离：");
        for (int i = 0; i < vertices; i++) {
            System.out.println("  -> " + i + ": " + dist[i]);
        }
        
        return true;  // 无负权环
    }
    
    public static void main(String[] args) {
        BellmanFord graph = new BellmanFord(4);
        graph.addEdge(0, 1, 5);
        graph.addEdge(0, 2, 4);
        graph.addEdge(1, 3, 3);
        graph.addEdge(2, 1, -6);  // 负权边
        graph.addEdge(3, 2, 2);
        
        if (graph.bellmanFord(0)) {
            System.out.println("无负权环");
        } else {
            System.out.println("存在负权环");
        }
    }
}

// ✅ 可以处理负权边，能检测负权环
// ❌ 时间复杂度高 O(V³)
```

### 算法原理

Bellman-Ford 的核心思想是**松弛**：

- 对所有边进行 V-1 轮松弛操作
- 每轮尝试更新所有顶点的最短距离
- V-1 轮后，如果没有负权环，所有最短路径都已确定
- 再做一轮，如果还能更新，说明存在负权环

---

## 5 Floyd-Warshall 算法

### 基础用法

计算**所有顶点对**之间的最短路径。

```java
class Floyd {
    private int vertices;
    private int[][] dist;
    private static final int INF = 9999;
    
    public Floyd(int v) {
        vertices = v;
        dist = new int[v][v];
        for (int i = 0; i < v; i++) {
            Arrays.fill(dist[i], INF);
            dist[i][i] = 0;  // 自身到自身距离为 0
        }
    }
    
    public void addEdge(int from, int to, int weight) {
        dist[from][to] = weight;
        dist[to][from] = weight;  // 无向图
    }
    
    // Floyd-Warshall 算法
    public void floyd() {
        // 三重循环
        for (int k = 0; k < vertices; k++) {          // 中间顶点
            for (int i = 0; i < vertices; i++) {      // 起点
                for (int j = 0; j < vertices; j++) {  // 终点
                    // 如果通过 k 更短，则更新
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
        
        // 打印结果
        System.out.println("所有顶点对之间的最短距离：");
        for (int i = 0; i < vertices; i++) {
            for (int j = 0; j < vertices; j++) {
                if (dist[i][j] == INF) {
                    System.out.print("INF ");
                } else {
                    System.out.print(dist[i][j] + " ");
                }
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        Floyd graph = new Floyd(4);
        graph.addEdge(0, 1, 3);
        graph.addEdge(0, 2, 6);
        graph.addEdge(1, 2, 2);
        graph.addEdge(1, 3, 1);
        graph.addEdge(2, 3, 4);
        
        graph.floyd();
        // 输出：
        // 0 3 5 4
        // 3 0 2 1
        // 5 2 0 3
        // 4 1 3 0
    }
}

// ✅ 可以处理所有顶点对，代码简洁
// ❌ 时间复杂度 O(V³)，不适合大规模图
```

### 算法原理

Floyd 算法的核心思想是**动态规划**：

- 假设从 i 到 j 的最短路径只经过顶点 0 到 k
- 尝试通过顶点 k 作为中转，看是否能缩短路径
- 如果 `dist[i][k] + dist[k][j] < dist[i][j]`，则更新

打个比方：

> 就像你从家到公司，原本走直线。现在发现经过朋友家（中转站）可能更快，因为朋友可以载你一程。Floyd 算法尝试所有可能的中转站，找出最快的路线。

---

## 6 核心知识点总结

| 知识点 | 说明 |
|-------|------|
| 单源最短路径 | 从一个起点到所有其他顶点的最短路径 |
| 全源最短路径 | 任意两个顶点之间的最短路径 |
| Dijkstra | 贪心算法，O(V²)，不能处理负权 |
| Bellman-Ford | 松弛操作，O(VE)，可处理负权 |
| Floyd | 动态规划，O(V³)，全源最短路径 |
| 松弛操作 | 尝试通过中转点缩短路径 |
| 负权环 | 权重之和为负的环，导致最短路径不存在 |

---

## 7 新手常见误区

### 误区 1：Dijkstra 算法用于负权图

```java
// ❌ 错误：Dijkstra 不能处理负权边
// 图包含负权边时，Dijkstra 会给出错误结果

// ✅ 正确：负权图使用 Bellman-Ford 算法
BellmanFord bf = new BellmanFord(vertices);
bf.bellmanFord(start);
```

**解释**：Dijkstra 基于贪心策略，一旦顶点被标记为已访问，就不会再更新。负权边可能导致后续发现更短路径，但已访问顶点无法更新。

### 误区 2：Floyd 算法忘记初始化对角线

```java
// ❌ 错误：忘记 dist[i][i] = 0
int[][] dist = new int[v][v];
for (int i = 0; i < v; i++) {
    Arrays.fill(dist[i], INF);
}

// ✅ 正确：自身到自身距离为 0
int[][] dist = new int[v][v];
for (int i = 0; i < v; i++) {
    Arrays.fill(dist[i], INF);
    dist[i][i] = 0;  // 重要！
}
```

**解释**：顶点到自身的距离必须是 0，否则算法会出错。

### 误区 3：Bellman-Ford 松弛次数错误

```java
// ❌ 错误：松弛 V 次（多余）
for (int i = 0; i < vertices; i++) {
    // 松弛操作
}

// ✅ 正确：松弛 V-1 次
for (int i = 0; i < vertices - 1; i++) {
    // 松弛操作
}
// 第 V 次用于检测负权环
```

**解释**：V-1 次松弛足以找到所有最短路径。第 V 次用于检测负权环。

### 误区 4：Dijkstra 算法中 INF 设置过小

```java
// ❌ 错误：INF 太小，可能导致溢出
final int INF = 100;
// 如果 dist[u] + weight 超过 INF，会出错

// ✅ 正确：INF 设置足够大，但不导致溢出
final int INF = 9999;  // 或 Integer.MAX_VALUE / 2
```

**解释**：INF 太小无法表示"无穷远"，太大可能导致加法溢出。

---

## 8 动手练习

### 练习 1：实现 Dijkstra 算法并输出路径

**题目**：修改 Dijkstra 算法，不仅输出最短距离，还输出具体路径。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class DijkstraWithPath {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;
    
    public DijkstraWithPath(int v) {
        vertices = v;
        adjMatrix = new int[v][v];
        for (int i = 0; i < v; i++) {
            Arrays.fill(adjMatrix[i], INF);
        }
    }
    
    public void addEdge(int from, int to, int weight) {
        adjMatrix[from][to] = weight;
        adjMatrix[to][from] = weight;
    }
    
    public void dijkstra(int start) {
        int[] dist = new int[vertices];
        int[] prev = new int[vertices];  // 记录前驱顶点
        boolean[] visited = new boolean[vertices];
        
        Arrays.fill(dist, INF);
        Arrays.fill(prev, -1);
        dist[start] = 0;
        
        for (int i = 0; i < vertices; i++) {
            int minDist = INF;
            int minIndex = -1;
            for (int v = 0; v < vertices; v++) {
                if (!visited[v] && dist[v] < minDist) {
                    minDist = dist[v];
                    minIndex = v;
                }
            }
            
            if (minIndex == -1) break;
            visited[minIndex] = true;
            
            for (int v = 0; v < vertices; v++) {
                if (adjMatrix[minIndex][v] != INF && !visited[v]) {
                    if (dist[minIndex] + adjMatrix[minIndex][v] < dist[v]) {
                        dist[v] = dist[minIndex] + adjMatrix[minIndex][v];
                        prev[v] = minIndex;  // 记录前驱
                    }
                }
            }
        }
        
        // 打印路径
        for (int i = 0; i < vertices; i++) {
            if (i != start && dist[i] != INF) {
                System.out.print("从 " + start + " 到 " + i + ": ");
                System.out.print("距离 = " + dist[i] + ", 路径 = ");
                printPath(prev, i);
                System.out.println();
            }
        }
    }
    
    private void printPath(int[] prev, int end) {
        LinkedList<Integer> path = new LinkedList<>();
        for (int v = end; v != -1; v = prev[v]) {
            path.addFirst(v);
        }
        System.out.println(path);
    }
    
    public static void main(String[] args) {
        DijkstraWithPath graph = new DijkstraWithPath(5);
        graph.addEdge(0, 1, 10);
        graph.addEdge(0, 3, 5);
        graph.addEdge(1, 2, 1);
        graph.addEdge(1, 3, 2);
        graph.addEdge(2, 4, 4);
        graph.addEdge(3, 1, 3);
        graph.addEdge(3, 2, 9);
        graph.addEdge(3, 4, 2);
        
        graph.dijkstra(0);
    }
}
```

</details>

### 练习 2：检测负权环

**题目**：使用 Bellman-Ford 算法检测图中是否存在负权环。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class NegativeCycleDetector {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;
    
    public NegativeCycleDetector(int v) {
        vertices = v;
        adjMatrix = new int[v][v];
        for (int i = 0; i < v; i++) {
            Arrays.fill(adjMatrix[i], INF);
        }
    }
    
    public void addEdge(int from, int to, int weight) {
        adjMatrix[from][to] = weight;
    }
    
    public boolean hasNegativeCycle() {
        int[] dist = new int[vertices];
        Arrays.fill(dist, INF);
        dist[0] = 0;  // 从顶点 0 开始
        
        // 松弛 V-1 次
        for (int i = 0; i < vertices - 1; i++) {
            for (int u = 0; u < vertices; u++) {
                for (int v = 0; v < vertices; v++) {
                    if (adjMatrix[u][v] != INF && dist[u] != INF) {
                        if (dist[u] + adjMatrix[u][v] < dist[v]) {
                            dist[v] = dist[u] + adjMatrix[u][v];
                        }
                    }
                }
            }
        }
        
        // 第 V 次检测负权环
        for (int u = 0; u < vertices; u++) {
            for (int v = 0; v < vertices; v++) {
                if (adjMatrix[u][v] != INF && dist[u] != INF) {
                    if (dist[u] + adjMatrix[u][v] < dist[v]) {
                        return true;  // 存在负权环
                    }
                }
            }
        }
        
        return false;  // 无负权环
    }
    
    public static void main(String[] args) {
        NegativeCycleDetector graph1 = new NegativeCycleDetector(3);
        graph1.addEdge(0, 1, 1);
        graph1.addEdge(1, 2, -3);
        graph1.addEdge(2, 0, 1);  // 形成负权环：0->1->2->0，权重 = -1
        
        System.out.println("图1有负权环吗？ " + graph1.hasNegativeCycle());  // true
        
        NegativeCycleDetector graph2 = new NegativeCycleDetector(3);
        graph2.addEdge(0, 1, 1);
        graph2.addEdge(1, 2, 2);
        graph2.addEdge(2, 0, 3);  // 正权环
        
        System.out.println("图2有负权环吗？ " + graph2.hasNegativeCycle());  // false
    }
}
```

</details>

### 练习 3：使用 Floyd 算法求全源最短路径

**题目**：给定一个带权图，使用 Floyd 算法计算所有顶点对之间的最短距离。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class FloydAllPairs {
    private int vertices;
    private int[][] dist;
    private static final int INF = 9999;
    
    public FloydAllPairs(int v) {
        vertices = v;
        dist = new int[v][v];
        for (int i = 0; i < v; i++) {
            Arrays.fill(dist[i], INF);
            dist[i][i] = 0;
        }
    }
    
    public void addEdge(int from, int to, int weight) {
        dist[from][to] = weight;
    }
    
    public void floyd() {
        for (int k = 0; k < vertices; k++) {
            for (int i = 0; i < vertices; i++) {
                for (int j = 0; j < vertices; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
        
        System.out.println("全源最短路径矩阵：");
        for (int i = 0; i < vertices; i++) {
            for (int j = 0; j < vertices; j++) {
                if (dist[i][j] == INF) {
                    System.out.print("INF\t");
                } else {
                    System.out.print(dist[i][j] + "\t");
                }
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        FloydAllPairs graph = new FloydAllPairs(4);
        graph.addEdge(0, 1, 3);
        graph.addEdge(0, 2, 8);
        graph.addEdge(1, 2, 2);
        graph.addEdge(2, 3, 1);
        graph.addEdge(1, 3, 7);
        
        graph.floyd();
    }
}
```

</details>

---

## 9 下一章预告

学完最短路径后，下一章我们将学习**最小生成树**。什么是最小生成树？想象你要在多个城市之间铺设光纤，如何用最少的电缆连接所有城市？Prim 和 Kruskal 算法就是解决这个问题的。我们会深入讲解这两个经典算法的原理和实现。
