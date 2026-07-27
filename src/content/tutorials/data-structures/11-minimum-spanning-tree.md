---
title: '第十一章：最小生成树'
description: 'Prim算法、Kruskal算法、并查集'
---

# 第十一章：最小生成树

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是最小生成树？它和最短路径有什么区别？
- 最小生成树有哪些实际应用场景？
- Prim 算法和 Kruskal 算法有什么不同？
- 什么是并查集？它在 Kruskal 算法中起什么作用？

这一章就是为了解答这些问题。我们会从最小生成树的概念讲起，通过生活化类比和代码实例帮你掌握 Prim 和 Kruskal 这两个经典算法。学完这章，你就能解决网络设计、电路布线等优化问题了。

---

## 1 为什么需要最小生成树？

### 痛点分析

想象你要在 5 个城市之间铺设光纤，让所有城市都能通信。任意两个城市之间都可以铺设线路，但成本不同。你的目标是：用最少的光缆连接所有城市，且总成本最低。

**生活类比**：最小生成树就像设计一个最经济的交通网络。你要连接所有城市，但不需要每两个城市之间都有直达路。只要所有城市都连通，且总建设成本最低即可。

### 代码对比

```java
// ❌ 最短路径：关注两点之间的最短路线
// 可能只连接部分城市

// ✅ 最小生成树：连接所有城市，总成本最低
// 确保所有节点连通，边权之和最小
```

> **一句话总结**：最小生成树解决的是"如何用最低成本连接所有节点"的问题。

---

## 2 核心原理

### 概念解释

**生成树**：包含图中所有顶点的树（无环连通图）。

**最小生成树（MST）**：所有生成树中，边权之和最小的那棵。

**关键特性**：

- 包含所有顶点
- 是树（无环）
- 边数 = 顶点数 - 1
- 边权之和最小

打个比方：

> 最小生成树就像用最少的水管连接所有房间。每个房间都要有水，但不需要每两个房间之间都有直接管道。只要所有房间都连通，且总管道长度最短即可。

### 对比分析

| 概念 | 最短路径 | 最小生成树 |
|-----|---------|-----------|
| 目标 | 两点间最短 | 连接所有点，总权最小 |
| 起点终点 | 指定起点和终点 | 无特定起点终点 |
| 结果 | 一条路径 | 一棵树 |
| 边数 | 不定 | V-1（V为顶点数） |
| 算法 | Dijkstra, Bellman-Ford | Prim, Kruskal |

---

## 3 Prim 算法

### 基础用法

从**一个顶点**开始，逐步扩展生成树。

```java
import java.util.*;

class PrimMST {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;
    
    public PrimMST(int v) {
        vertices = v;
        adjMatrix = new int[v][v];
        for (int i = 0; i < v; i++) {
            Arrays.fill(adjMatrix[i], INF);
        }
    }
    
    // 添加带权边
    public void addEdge(int from, int to, int weight) {
        adjMatrix[from][to] = weight;
        adjMatrix[to][from] = weight;  // 无向图
    }
    
    // Prim 算法
    public void prim() {
        boolean[] inMST = new boolean[vertices];  // 标记是否在 MST 中
        int[] key = new int[vertices];            // 连接到 MST 的最小权重
        int[] parent = new int[vertices];         // MST 中的父节点
        
        // 初始化
        Arrays.fill(key, INF);
        Arrays.fill(parent, -1);
        key[0] = 0;  // 从顶点 0 开始
        
        // 需要添加 V 个顶点到 MST
        for (int count = 0; count < vertices; count++) {
            // 找到不在 MST 中且 key 最小的顶点
            int minKey = INF;
            int minIndex = -1;
            for (int v = 0; v < vertices; v++) {
                if (!inMST[v] && key[v] < minKey) {
                    minKey = key[v];
                    minIndex = v;
                }
            }
            
            // 将选中的顶点加入 MST
            inMST[minIndex] = true;
            
            // 更新邻居的 key 值
            for (int v = 0; v < vertices; v++) {
                if (adjMatrix[minIndex][v] != INF && !inMST[v] 
                    && adjMatrix[minIndex][v] < key[v]) {
                    key[v] = adjMatrix[minIndex][v];
                    parent[v] = minIndex;
                }
            }
        }
        
        // 打印 MST
        System.out.println("最小生成树的边：");
        int totalWeight = 0;
        for (int i = 1; i < vertices; i++) {
            System.out.println(parent[i] + " - " + i + ": " + key[i]);
            totalWeight += key[i];
        }
        System.out.println("总权重: " + totalWeight);
    }
    
    public static void main(String[] args) {
        PrimMST graph = new PrimMST(5);
        graph.addEdge(0, 1, 2);
        graph.addEdge(0, 3, 6);
        graph.addEdge(1, 2, 3);
        graph.addEdge(1, 3, 8);
        graph.addEdge(1, 4, 5);
        graph.addEdge(2, 4, 7);
        graph.addEdge(3, 4, 9);
        
        graph.prim();
        // 输出：
        // 最小生成树的边：
        // 0 - 1: 2
        // 1 - 2: 3
        // 0 - 3: 6
        // 1 - 4: 5
        // 总权重: 16
    }
}

// ✅ 适合稠密图（边多）
// ❌ 需要维护 key 数组，代码较复杂
```

### 算法步骤详解

```
初始化：
  key[起点] = 0，其他 key[i] = INF
  inMST[] = false

循环 V 次：
  1. 找到不在 MST 中且 key 最小的顶点 u
  2. 将 u 加入 MST
  3. 对 u 的每个不在 MST 中的邻居 v：
     如果 weight(u,v) < key[v]：
       更新 key[v] = weight(u,v)
       parent[v] = u
```

### 生活化类比

想象你要铺设水管连接所有房间：

1. 从第一个房间开始
2. 找到离当前已连接房间最近的未连接房间
3. 铺设管道连接它
4. 重复步骤 2-3，直到所有房间都连通

---

## 4 Kruskal 算法

### 基础用法

从**边**的角度，逐步构建生成树。

```java
import java.util.*;

class Edge implements Comparable<Edge> {
    int from, to, weight;
    
    public Edge(int from, int to, int weight) {
        this.from = from;
        this.to = to;
        this.weight = weight;
    }
    
    @Override
    public int compareTo(Edge other) {
        return Integer.compare(this.weight, other.weight);
    }
}

class UnionFind {
    private int[] parent;
    private int[] rank;
    
    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;  // 每个元素自成一个集合
        }
    }
    
    // 查找根节点（带路径压缩）
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // 路径压缩
        }
        return parent[x];
    }
    
    // 合并两个集合
    public boolean union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        
        if (rootX == rootY) {
            return false;  // 已在同一集合，合并会形成环
        }
        
        // 按秩合并
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        
        return true;
    }
}

class KruskalMST {
    private int vertices;
    private List<Edge> edges;
    
    public KruskalMST(int v) {
        vertices = v;
        edges = new ArrayList<>();
    }
    
    public void addEdge(int from, int to, int weight) {
        edges.add(new Edge(from, to, weight));
    }
    
    public void kruskal() {
        // 按权重排序所有边
        Collections.sort(edges);
        
        UnionFind uf = new UnionFind(vertices);
        List<Edge> mst = new ArrayList<>();
        int totalWeight = 0;
        
        // 遍历所有边
        for (Edge edge : edges) {
            // 如果这条边连接的两个顶点不在同一集合
            if (uf.union(edge.from, edge.to)) {
                mst.add(edge);  // 加入 MST
                totalWeight += edge.weight;
                
                // 如果已经选了 V-1 条边，提前结束
                if (mst.size() == vertices - 1) {
                    break;
                }
            }
        }
        
        // 打印结果
        System.out.println("最小生成树的边：");
        for (Edge edge : mst) {
            System.out.println(edge.from + " - " + edge.to + ": " + edge.weight);
        }
        System.out.println("总权重: " + totalWeight);
    }
    
    public static void main(String[] args) {
        KruskalMST graph = new KruskalMST(5);
        graph.addEdge(0, 1, 2);
        graph.addEdge(0, 3, 6);
        graph.addEdge(1, 2, 3);
        graph.addEdge(1, 3, 8);
        graph.addEdge(1, 4, 5);
        graph.addEdge(2, 4, 7);
        graph.addEdge(3, 4, 9);
        
        graph.kruskal();
        // 输出：
        // 最小生成树的边：
        // 0 - 1: 2
        // 1 - 2: 3
        // 0 - 3: 6
        // 1 - 4: 5
        // 总权重: 16
    }
}

// ✅ 适合稀疏图（边少），代码简洁
// ❌ 需要排序所有边，时间复杂度 O(E log E)
```

### 并查集的作用

并查集（Union-Find）用于高效地：

1. **查找**：判断两个顶点是否在同一连通分量
2. **合并**：将两个连通分量合并

**为什么需要并查集？**

Kruskal 算法按权重从小到大选边。如果一条边的两个顶点已经在同一连通分量（已连通），加入这条边会形成环，所以要跳过。

打个比方：

> 并查集就像管理班级。每个学生一开始自成一班。当两个学生要组队时，先查他们是否同班。如果同班，不组队（会形成环）；如果不同班，合并班级。

### 算法步骤详解

```
1. 将所有边按权重排序
2. 初始化并查集，每个顶点自成一个集合
3. 遍历排序后的边：
   如果边的两个顶点不在同一集合：
     将这条边加入 MST
     合并两个集合
4. 直到选了 V-1 条边
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|-------|------|
| 生成树 | 包含所有顶点的树，边数 = V-1 |
| 最小生成树 | 边权之和最小的生成树 |
| Prim 算法 | 从顶点扩展，适合稠密图，O(V²) |
| Kruskal 算法 | 从边扩展，适合稀疏图，O(E log E) |
| 并查集 | 高效管理集合，支持查找和合并 |
| 路径压缩 | 并查集优化，让树更扁平 |
| 按秩合并 | 并查集优化，小树挂在大树下 |

---

## 6 新手常见误区

### 误区 1：混淆最短路径和最小生成树

```java
// ❌ 错误：用 Dijkstra 算法求最小生成树
// Dijkstra 找的是两点间最短路径，不是全局最优

// ✅ 正确：用 Prim 或 Kruskal 算法
PrimMST prim = new PrimMST(vertices);
prim.prim();

KruskalMST kruskal = new KruskalMST(vertices);
kruskal.kruskal();
```

**解释**：最短路径关注两点间的最短路线，最小生成树关注连接所有点的最小总成本。

### 误区 2：Kruskal 算法忘记检测环

```java
// ❌ 错误：直接加入所有边，可能形成环
for (Edge edge : edges) {
    mst.add(edge);  // 会形成环！
}

// ✅ 正确：用并查集检测环
for (Edge edge : edges) {
    if (uf.union(edge.from, edge.to)) {
        mst.add(edge);  // 不会形成环才加入
    }
}
```

**解释**：生成树不能有环。如果一条边的两个顶点已经连通，加入会形成环。

### 误区 3：Prim 算法初始化错误

```java
// ❌ 错误：所有 key 都初始化为 0
Arrays.fill(key, 0);

// ✅ 正确：起点 key 为 0，其他为 INF
Arrays.fill(key, INF);
key[0] = 0;  // 起点
```

**解释**：key 数组记录连接到 MST 的最小权重，初始时只有起点在 MST 中。

### 误区 4：并查集不优化

```java
// ❌ 错误：朴素实现，效率低
public int find(int x) {
    while (parent[x] != x) {
        x = parent[x];
    }
    return x;
}

// ✅ 正确：路径压缩 + 按秩合并
public int find(int x) {
    if (parent[x] != x) {
        parent[x] = find(parent[x]);  // 路径压缩
    }
    return parent[x];
}

public boolean union(int x, int y) {
    int rootX = find(x);
    int rootY = find(y);
    
    if (rank[rootX] < rank[rootY]) {
        parent[rootX] = rootY;
    } else if (rank[rootX] > rank[rootY]) {
        parent[rootY] = rootX;
    } else {
        parent[rootY] = rootX;
        rank[rootX]++;  // 按秩合并
    }
    return true;
}
```

**解释**：优化后的并查集接近 O(1) 时间复杂度，显著提升性能。

---

## 7 动手练习

### 练习 1：实现 Prim 算法并计算总权重

**题目**：给定一个带权图，使用 Prim 算法找出最小生成树并计算总权重。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class PrimExercise {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;
    
    public PrimExercise(int v) {
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
    
    public int prim() {
        boolean[] inMST = new boolean[vertices];
        int[] key = new int[vertices];
        int[] parent = new int[vertices];
        
        Arrays.fill(key, INF);
        Arrays.fill(parent, -1);
        key[0] = 0;
        
        int totalWeight = 0;
        
        for (int count = 0; count < vertices; count++) {
            int minKey = INF;
            int minIndex = -1;
            for (int v = 0; v < vertices; v++) {
                if (!inMST[v] && key[v] < minKey) {
                    minKey = key[v];
                    minIndex = v;
                }
            }
            
            inMST[minIndex] = true;
            totalWeight += key[minIndex];
            
            for (int v = 0; v < vertices; v++) {
                if (adjMatrix[minIndex][v] != INF && !inMST[v] 
                    && adjMatrix[minIndex][v] < key[v]) {
                    key[v] = adjMatrix[minIndex][v];
                    parent[v] = minIndex;
                }
            }
        }
        
        System.out.println("MST 边：");
        for (int i = 1; i < vertices; i++) {
            System.out.println(parent[i] + " - " + i + ": " + key[i]);
        }
        
        return totalWeight;
    }
    
    public static void main(String[] args) {
        PrimExercise graph = new PrimExercise(4);
        graph.addEdge(0, 1, 10);
        graph.addEdge(0, 2, 6);
        graph.addEdge(0, 3, 5);
        graph.addEdge(1, 3, 15);
        graph.addEdge(2, 3, 4);
        
        int total = graph.prim();
        System.out.println("总权重: " + total);  // 19
    }
}
```

</details>

### 练习 2：实现 Kruskal 算法

**题目**：给定一个带权图，使用 Kruskal 算法找出最小生成树。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class KruskalExercise {
    private int vertices;
    private List<int[]> edges;  // [from, to, weight]
    
    public KruskalExercise(int v) {
        vertices = v;
        edges = new ArrayList<>();
    }
    
    public void addEdge(int from, int to, int weight) {
        edges.add(new int[]{from, to, weight});
    }
    
    public void kruskal() {
        // 按权重排序
        edges.sort((a, b) -> Integer.compare(a[2], b[2]));
        
        int[] parent = new int[vertices];
        for (int i = 0; i < vertices; i++) {
            parent[i] = i;
        }
        
        List<int[]> mst = new ArrayList<>();
        int totalWeight = 0;
        
        for (int[] edge : edges) {
            int from = edge[0], to = edge[1], weight = edge[2];
            
            int rootFrom = find(parent, from);
            int rootTo = find(parent, to);
            
            if (rootFrom != rootTo) {
                mst.add(edge);
                totalWeight += weight;
                parent[rootFrom] = rootTo;
                
                if (mst.size() == vertices - 1) {
                    break;
                }
            }
        }
        
        System.out.println("MST 边：");
        for (int[] edge : mst) {
            System.out.println(edge[0] + " - " + edge[1] + ": " + edge[2]);
        }
        System.out.println("总权重: " + totalWeight);
    }
    
    private int find(int[] parent, int x) {
        while (parent[x] != x) {
            x = parent[x];
        }
        return x;
    }
    
    public static void main(String[] args) {
        KruskalExercise graph = new KruskalExercise(4);
        graph.addEdge(0, 1, 10);
        graph.addEdge(0, 2, 6);
        graph.addEdge(0, 3, 5);
        graph.addEdge(1, 3, 15);
        graph.addEdge(2, 3, 4);
        
        graph.kruskal();
    }
}
```

</details>

### 练习 3：判断图是否连通

**题目**：使用并查集判断一个无向图是否连通。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class ConnectivityChecker {
    private int vertices;
    private int[] parent;
    private int components;  // 连通分量数
    
    public ConnectivityChecker(int v) {
        vertices = v;
        parent = new int[v];
        components = v;  // 初始时每个顶点自成一个分量
        for (int i = 0; i < v; i++) {
            parent[i] = i;
        }
    }
    
    public void addEdge(int from, int to) {
        int rootFrom = find(from);
        int rootTo = find(to);
        
        if (rootFrom != rootTo) {
            parent[rootFrom] = rootTo;
            components--;  // 合并后分量数减 1
        }
    }
    
    private int find(int x) {
        while (parent[x] != x) {
            x = parent[x];
        }
        return x;
    }
    
    public boolean isConnected() {
        return components == 1;  // 只有一个连通分量
    }
    
    public static void main(String[] args) {
        ConnectivityChecker graph1 = new ConnectivityChecker(4);
        graph1.addEdge(0, 1);
        graph1.addEdge(1, 2);
        graph1.addEdge(2, 3);
        
        System.out.println("图1连通吗？ " + graph1.isConnected());  // true
        
        ConnectivityChecker graph2 = new ConnectivityChecker(4);
        graph2.addEdge(0, 1);
        graph2.addEdge(2, 3);
        
        System.out.println("图2连通吗？ " + graph2.isConnected());  // false
    }
}
```

</details>

---

## 8 下一章预告

学完最小生成树后，下一章我们将学习**排序算法**。排序是计算机科学中最基础也最重要的算法之一。从简单的冒泡排序到高效的快速排序，我们会深入讲解各种排序算法的原理、实现和性能对比。掌握这些算法，你就能根据数据特点选择最合适的排序方法了。
