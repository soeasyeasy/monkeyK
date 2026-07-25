---
title: '第九章：图的基础'
description: '图的概念、存储结构、遍历算法'
---

# 第九章：图的基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是图？它和树有什么区别？
- 图在现实生活中有哪些应用场景？
- 如何在计算机中存储和表示一个图？
- 如何遍历图中的所有节点？

这一章就是为了解答这些问题。我们会先搞清楚**图的基本概念和存储方式**，再学习图的遍历算法。学完这章，你就能理解社交网络、地图导航等应用背后的数据结构了。

---

## 9.1 为什么需要图？

### 痛点分析

想象你要开发一个社交网络应用，用户之间可以互相关注。如果用数组或链表，只能表示线性关系；如果用树，只能表示层级关系。但社交网络是多对多的复杂关系，这些数据结构都不够用。

**生活类比**：图就像城市的交通网络。每个路口是一个节点（顶点），连接路口的道路是边。你可以从任意路口出发，通过道路到达其他路口。有些道路是单行道（有向图），有些是双向道（无向图）；有些道路长有些短（带权图）。

### 代码对比

```java
// ❌ 用数组表示社交关系：无法表达复杂的多对多关系
String[] users = {"Alice", "Bob", "Charlie"};
// 无法表示谁关注了谁

// ✅ 用图表示社交关系：清晰表达多对多关系
// Alice -> Bob (Alice关注Bob)
// Bob -> Charlie
// Charlie -> Alice
```

> **一句话总结**：图是表示多对多关系的最强数据结构。

---

## 9.2 核心原理

### 概念解释

图（Graph）由**顶点（Vertex）**和**边（Edge）**组成：

- **顶点**：图中的节点，代表实体（如人、城市、网页）
- **边**：连接顶点的线，代表关系（如 friendship、道路、链接）

**图的分类**：

- **无向图**：边没有方向（如微信好友关系，A是B的朋友，B也是A的朋友）
- **有向图**：边有方向（如微博关注，A关注B，B不一定关注A）
- **带权图**：边有权重（如道路距离、机票价格）
- **无权图**：边没有权重（如好友关系，只有"是/否"）

打个比方：

> 图就像人际关系网。每个人是一个顶点，关系是边。如果是无向图，就像 friendships（双向）；如果是有向图，就像 Twitter 关注（单向）。

### 对比分析

| 数据结构 | 关系类型 | 适用场景 | 示例 |
|---------|---------|---------|------|
| 数组 | 无关系 | 批量同类型数据 | 学生成绩列表 |
| 链表 | 一对一 | 线性序列 | 任务队列 |
| 树 | 一对多 | 层级关系 | 文件系统 |
| 图 | 多对多 | 复杂网络关系 | 社交网络、地图 |

---

## 9.3 图的存储结构

### 邻接矩阵

用二维数组表示图。`matrix[i][j] = 1` 表示顶点 i 和 j 之间有边。

```java
// 无向图的邻接矩阵表示
// 顶点：0=A, 1=B, 2=C
// 边：A-B, B-C, A-C

int[][] adjMatrix = {
    {0, 1, 1},  // A 连接 B 和 C
    {1, 0, 1},  // B 连接 A 和 C
    {1, 1, 0}   // C 连接 A 和 B
};

// 检查 A 和 B 是否相连
boolean connected = adjMatrix[0][1] == 1;  // true

// ✅ 优点：查询两点是否相连很快 O(1)
// ❌ 缺点：空间复杂度高 O(V²)，稀疏图浪费空间
```

### 邻接表

用链表数组表示图。每个顶点对应一个链表，存储与之相连的所有顶点。

```java
import java.util.*;

// 邻接表实现
class Graph {
    private int vertices;  // 顶点数量
    private LinkedList<Integer>[] adjList;  // 邻接表
    
    // 构造函数
    public Graph(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    // 添加边（无向图）
    public void addEdge(int from, int to) {
        adjList[from].add(to);  // from 连接到 to
        adjList[to].add(from);  // to 连接到 from（无向图需要双向）
    }
    
    // 添加边（有向图）
    public void addDirectedEdge(int from, int to) {
        adjList[from].add(to);  // 只添加 from -> to
    }
    
    // 获取顶点的所有邻居
    public List<Integer> getNeighbors(int v) {
        return adjList[v];
    }
}

// 使用示例
Graph graph = new Graph(4);  // 4个顶点：0,1,2,3
graph.addEdge(0, 1);  // 0-1
graph.addEdge(0, 2);  // 0-2
graph.addEdge(1, 3);  // 1-3
graph.addEdge(2, 3);  // 2-3

// ✅ 优点：空间复杂度 O(V+E)，适合稀疏图
// ❌ 缺点：查询两点是否相连需要 O(度) 时间
```

### 对比表格

| 存储方式 | 空间复杂度 | 查询边 | 遍历邻居 | 适用场景 |
|---------|-----------|--------|---------|---------|
| 邻接矩阵 | O(V²) | O(1) | O(V) | 稠密图（边多） |
| 邻接表 | O(V+E) | O(度) | O(度) | 稀疏图（边少） |

---

## 9.4 基础用法：图的遍历

### 深度优先搜索（DFS）

像走迷宫一样，一条路走到黑，走不通再回头。

```java
import java.util.*;

class GraphDFS {
    private int vertices;
    private LinkedList<Integer>[] adjList;
    private boolean[] visited;  // 记录已访问的顶点
    
    public GraphDFS(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        visited = new boolean[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    public void addEdge(int from, int to) {
        adjList[from].add(to);
        adjList[to].add(from);  // 无向图
    }
    
    // DFS 遍历
    public void dfs(int start) {
        // 标记当前顶点为已访问
        visited[start] = true;
        System.out.print(start + " ");  // 访问该顶点
        
        // 遍历所有邻居
        for (int neighbor : adjList[start]) {
            // 如果邻居未被访问，递归访问
            if (!visited[neighbor]) {
                dfs(neighbor);
            }
        }
    }
    
    public static void main(String[] args) {
        GraphDFS graph = new GraphDFS(5);
        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(1, 3);
        graph.addEdge(2, 4);
        
        // 从顶点 0 开始 DFS
        graph.dfs(0);  // 输出：0 1 3 2 4
    }
}

// ✅ DFS 使用递归，代码简洁
// ❌ 不适合求最短路径
```

### 广度优先搜索（BFS）

像水波纹一样，一层一层向外扩展。

```java
import java.util.*;

class GraphBFS {
    private int vertices;
    private LinkedList<Integer>[] adjList;
    
    public GraphBFS(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    public void addEdge(int from, int to) {
        adjList[from].add(to);
        adjList[to].add(from);
    }
    
    // BFS 遍历
    public void bfs(int start) {
        boolean[] visited = new boolean[vertices];  // 记录已访问的顶点
        Queue<Integer> queue = new LinkedList<>();  // 用队列实现
        
        // 标记起始顶点并加入队列
        visited[start] = true;
        queue.add(start);
        
        while (!queue.isEmpty()) {
            // 取出队首顶点
            int current = queue.poll();
            System.out.print(current + " ");  // 访问该顶点
            
            // 遍历所有邻居
            for (int neighbor : adjList[current]) {
                // 如果邻居未被访问，标记并加入队列
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.add(neighbor);
                }
            }
        }
    }
    
    public static void main(String[] args) {
        GraphBFS graph = new GraphBFS(5);
        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(1, 3);
        graph.addEdge(2, 4);
        
        // 从顶点 0 开始 BFS
        graph.bfs(0);  // 输出：0 1 2 3 4
    }
}

// ✅ BFS 可以找到最短路径（无权图）
// ❌ 代码比 DFS 复杂，需要队列
```

---

## 9.5 进阶用法：带权图

### 带权邻接矩阵

```java
class WeightedGraph {
    private int vertices;
    private int[][] adjMatrix;
    private static final int INF = 9999;  // 表示无穷大（无边）
    
    public WeightedGraph(int v) {
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
    
    // 获取边的权重
    public int getWeight(int from, int to) {
        return adjMatrix[from][to];
    }
    
    public static void main(String[] args) {
        WeightedGraph graph = new WeightedGraph(4);
        graph.addEdge(0, 1, 5);   // 0-1 权重 5
        graph.addEdge(0, 2, 3);   // 0-2 权重 3
        graph.addEdge(1, 3, 2);   // 1-3 权重 2
        graph.addEdge(2, 3, 4);   // 2-3 权重 4
        
        System.out.println(graph.getWeight(0, 1));  // 5
        System.out.println(graph.getWeight(0, 3));  // 9999（无边）
    }
}
```

### 带权邻接表

```java
class Edge {
    int to;
    int weight;
    
    public Edge(int to, int weight) {
        this.to = to;
        this.weight = weight;
    }
}

class WeightedGraphList {
    private int vertices;
    private LinkedList<Edge>[] adjList;
    
    public WeightedGraphList(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    public void addEdge(int from, int to, int weight) {
        adjList[from].add(new Edge(to, weight));
        adjList[to].add(new Edge(from, weight));  // 无向图
    }
    
    public List<Edge> getNeighbors(int v) {
        return adjList[v];
    }
    
    public static void main(String[] args) {
        WeightedGraphList graph = new WeightedGraphList(3);
        graph.addEdge(0, 1, 10);
        graph.addEdge(1, 2, 20);
        
        for (Edge e : graph.getNeighbors(0)) {
            System.out.println("0 -> " + e.to + " (权重: " + e.weight + ")");
        }
    }
}
```

---

## 9.6 核心知识点总结

| 知识点 | 说明 |
|-------|------|
| 图的组成 | 顶点（Vertex）+ 边（Edge） |
| 无向图 | 边没有方向，A-B 和 B-A 相同 |
| 有向图 | 边有方向，A->B 和 B->A 不同 |
| 带权图 | 边有权重，表示距离、成本等 |
| 邻接矩阵 | 二维数组，空间 O(V²)，查询 O(1) |
| 邻接表 | 链表数组，空间 O(V+E)，查询 O(度) |
| DFS | 深度优先，递归实现，一条路走到黑 |
| BFS | 广度优先，队列实现，一层层扩展 |

---

## 9.7 新手常见误区

### 误区 1：混淆有向图和无向图的边添加

```java
// ❌ 错误：无向图只添加单向边
public void addEdge(int from, int to) {
    adjList[from].add(to);  // 只添加了 from -> to
}

// ✅ 正确：无向图需要添加双向边
public void addEdge(int from, int to) {
    adjList[from].add(to);   // from -> to
    adjList[to].add(from);   // to -> from
}
```

**解释**：无向图的边是双向的，A-B 意味着 A 到 B 和 B 到 A 都连通。

### 误区 2：DFS 忘记标记已访问

```java
// ❌ 错误：会导致无限递归
public void dfs(int v) {
    System.out.print(v + " ");
    for (int neighbor : adjList[v]) {
        dfs(neighbor);  // 会重复访问已访问的顶点
    }
}

// ✅ 正确：标记已访问的顶点
public void dfs(int v) {
    visited[v] = true;  // 先标记
    System.out.print(v + " ");
    for (int neighbor : adjList[v]) {
        if (!visited[neighbor]) {  // 检查是否已访问
            dfs(neighbor);
        }
    }
}
```

**解释**：图有环，不标记已访问会导致死循环。

### 误区 3：邻接矩阵初始化错误

```java
// ❌ 错误：初始化为 0，无法区分"无边"和"权重为0"
int[][] adjMatrix = new int[4][4];  // 默认都是 0

// ✅ 正确：用无穷大表示无边
int[][] adjMatrix = new int[4][4];
for (int i = 0; i < 4; i++) {
    Arrays.fill(adjMatrix[i], 9999);  // 9999 表示无穷大
}
```

**解释**：带权图中，权重可能为 0，需要用特殊值（如 INF）表示无边。

### 误区 4：BFS 不标记已访问就加入队列

```java
// ❌ 错误：同一顶点可能被多次加入队列
public void bfs(int start) {
    Queue<Integer> queue = new LinkedList<>();
    queue.add(start);
    
    while (!queue.isEmpty()) {
        int current = queue.poll();
        System.out.print(current + " ");
        
        for (int neighbor : adjList[current]) {
            queue.add(neighbor);  // 没有检查是否已访问
        }
    }
}

// ✅ 正确：加入队列前标记已访问
public void bfs(int start) {
    boolean[] visited = new boolean[vertices];
    Queue<Integer> queue = new LinkedList<>();
    
    visited[start] = true;  // 加入队列前标记
    queue.add(start);
    
    while (!queue.isEmpty()) {
        int current = queue.poll();
        System.out.print(current + " ");
        
        for (int neighbor : adjList[current]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;  // 加入队列前标记
                queue.add(neighbor);
            }
        }
    }
}
```

**解释**：不标记会导致同一顶点被重复处理，浪费时间和空间。

---

## 9.8 动手练习

### 练习 1：实现有向图的邻接表

**题目**：实现一个有向图类，支持添加有向边和打印图的结构。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class DirectedGraph {
    private int vertices;
    private LinkedList<Integer>[] adjList;
    
    public DirectedGraph(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    public void addEdge(int from, int to) {
        adjList[from].add(to);  // 只添加单向边
    }
    
    public void printGraph() {
        for (int i = 0; i < vertices; i++) {
            System.out.print("顶点 " + i + " -> ");
            for (int neighbor : adjList[i]) {
                System.out.print(neighbor + " ");
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        DirectedGraph graph = new DirectedGraph(4);
        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(1, 3);
        graph.addEdge(2, 3);
        
        graph.printGraph();
        // 输出：
        // 顶点 0 -> 1 2
        // 顶点 1 -> 3
        // 顶点 2 -> 3
        // 顶点 3 ->
    }
}
```

</details>

### 练习 2：判断图中是否存在路径

**题目**：给定图和两个顶点，判断从起点到终点是否存在路径。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class PathFinder {
    private int vertices;
    private LinkedList<Integer>[] adjList;
    
    public PathFinder(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    public void addEdge(int from, int to) {
        adjList[from].add(to);
        adjList[to].add(from);
    }
    
    // 使用 DFS 判断是否存在路径
    public boolean hasPath(int start, int end) {
        boolean[] visited = new boolean[vertices];
        return dfs(start, end, visited);
    }
    
    private boolean dfs(int current, int target, boolean[] visited) {
        if (current == target) {
            return true;  // 找到目标
        }
        
        visited[current] = true;  // 标记已访问
        
        for (int neighbor : adjList[current]) {
            if (!visited[neighbor]) {
                if (dfs(neighbor, target, visited)) {
                    return true;  // 递归找到路径
                }
            }
        }
        
        return false;  // 未找到路径
    }
    
    public static void main(String[] args) {
        PathFinder graph = new PathFinder(5);
        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(3, 4);
        
        System.out.println(graph.hasPath(0, 2));  // true（0->1->2）
        System.out.println(graph.hasPath(0, 4));  // false（不连通）
    }
}
```

</details>

### 练习 3：计算顶点的度

**题目**：对于无向图，计算给定顶点的度（与该顶点相连的边数）。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

class DegreeCalculator {
    private int vertices;
    private LinkedList<Integer>[] adjList;
    
    public DegreeCalculator(int v) {
        vertices = v;
        adjList = new LinkedList[v];
        for (int i = 0; i < v; i++) {
            adjList[i] = new LinkedList<>();
        }
    }
    
    public void addEdge(int from, int to) {
        adjList[from].add(to);
        adjList[to].add(from);
    }
    
    // 计算顶点的度
    public int getDegree(int v) {
        return adjList[v].size();  // 邻接表的大小就是度
    }
    
    public static void main(String[] args) {
        DegreeCalculator graph = new DegreeCalculator(4);
        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(1, 2);
        graph.addEdge(1, 3);
        
        System.out.println("顶点 0 的度: " + graph.getDegree(0));  // 2
        System.out.println("顶点 1 的度: " + graph.getDegree(1));  // 3
        System.out.println("顶点 2 的度: " + graph.getDegree(2));  // 2
        System.out.println("顶点 3 的度: " + graph.getDegree(3));  // 1
    }
}
```

</details>

---

## 9.9 下一章预告

学完图的基础后，下一章我们将学习**图的最短路径算法**。当你用地图导航时，系统如何快速找到两地之间的最短路线？Dijkstra 算法和 Bellman-Ford 算法就是解决这个问题的。我们会深入讲解这些经典算法的原理和实现。
