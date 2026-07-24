---
title: '第十一章：集合框架'
description: 'List、Set、Map、Iterator、泛型集合'
---

# 第十一章：集合框架

## 集合框架概览

```
Collection（接口）
├── List（有序、可重复）
│   ├── ArrayList
│   ├── LinkedList
│   └── Vector
├── Set（无序、不可重复）
│   ├── HashSet
│   ├── LinkedHashSet
│   └── TreeSet
└── Queue（队列）
    ├── LinkedList
    └── PriorityQueue

Map（接口，键值对）
├── HashMap
├── LinkedHashMap
├── TreeMap
└── Hashtable
```

## List

### ArrayList

```java
import java.util.ArrayList;
import java.util.List;

List<String> list = new ArrayList<>();

// 添加元素
list.add("Java");
list.add("Python");
list.add("Go");

// 访问
System.out.println(list.get(0));     // Java
System.out.println(list.size());     // 3

// 修改
list.set(1, "Python3");

// 删除
list.remove("Go");
list.remove(0);

// 遍历
for (String item : list) {
    System.out.println(item);
}
```

### LinkedList

```java
import java.util.LinkedList;

LinkedList<String> linkedList = new LinkedList<>();
linkedList.add("A");
linkedList.add("B");
linkedList.addFirst("Head");    // 添加到头部
linkedList.addLast("Tail");     // 添加到尾部

System.out.println(linkedList.getFirst());  // Head
System.out.println(linkedList.getLast());   // Tail
```

### ArrayList vs LinkedList

| 特性     | ArrayList | LinkedList |
| -------- | --------- | ---------- |
| 底层结构 | 数组      | 双向链表   |
| 随机访问 | 快 O(1)   | 慢 O(n)    |
| 插入删除 | 慢 O(n)   | 快 O(1)    |
| 内存占用 | 较少      | 较多       |

## Set

### HashSet

```java
import java.util.HashSet;
import java.util.Set;

Set<String> set = new HashSet<>();

set.add("Java");
set.add("Python");
set.add("Java");    // 重复元素，不会添加

System.out.println(set.size());         // 2
System.out.println(set.contains("Java")); // true

set.remove("Python");
```

### TreeSet（有序）

```java
import java.util.TreeSet;

TreeSet<Integer> treeSet = new TreeSet<>();
treeSet.add(5);
treeSet.add(1);
treeSet.add(3);
treeSet.add(2);
treeSet.add(4);

System.out.println(treeSet);  // [1, 2, 3, 4, 5]（自动排序）
```

## Map

### HashMap

```java
import java.util.HashMap;
import java.util.Map;

Map<String, Integer> scores = new HashMap<>();

// 添加
scores.put("张三", 90);
scores.put("李四", 85);
scores.put("王五", 92);

// 访问
System.out.println(scores.get("张三"));      // 90
System.out.println(scores.getOrDefault("赵六", 0));  // 0

// 判断
System.out.println(scores.containsKey("李四"));   // true
System.out.println(scores.containsValue(85));     // true

// 删除
scores.remove("王五");

// 遍历
for (Map.Entry<String, Integer> entry : scores.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// Java 8+ forEach
scores.forEach((name, score) -> {
    System.out.println(name + ": " + score);
});
```

### LinkedHashMap（保持插入顺序）

```java
Map<String, Integer> linkedMap = new LinkedHashMap<>();
linkedMap.put("C", 3);
linkedMap.put("A", 1);
linkedMap.put("B", 2);

System.out.println(linkedMap);  // {C=3, A=1, B=2}
```

## Iterator

```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));

Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String item = it.next();
    System.out.println(item);
    if (item.equals("B")) {
        it.remove();    // 安全删除
    }
}
```

## 泛型集合

```java
// 泛型确保类型安全
List<Integer> numbers = new ArrayList<>();
numbers.add(1);
numbers.add(2);
// numbers.add("hello");  // 编译错误

// 自定义对象
class Student {
    String name;
    int age;

    Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

List<Student> students = new ArrayList<>();
students.add(new Student("张三", 20));
students.add(new Student("李四", 22));

for (Student s : students) {
    System.out.println(s.name + ", " + s.age);
}
```

## Collections 工具类

```java
import java.util.Collections;

List<Integer> list = new ArrayList<>(List.of(3, 1, 4, 1, 5, 9));

Collections.sort(list);           // 排序
Collections.reverse(list);        // 反转
Collections.shuffle(list);        // 随机打乱
System.out.println(Collections.max(list));  // 最大值
System.out.println(Collections.min(list));  // 最小值
```

## 集合工具类方法详解

### Collections.unmodifiableList

创建不可修改的集合视图。

```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));
List<String> unmodifiable = Collections.unmodifiableList(list);

// unmodifiable.add("D");  // ❌ UnsupportedOperationException
```

### Collections.synchronizedList

创建线程安全的集合。

```java
List<String> list = new ArrayList<>();
List<String> syncList = Collections.synchronizedList(list);

// 多线程环境下安全使用
syncList.add("A");
syncList.add("B");
```

## 实际案例：学生成绩管理

```java
import java.util.*;

class Student {
    String name;
    double score;

    Student(String name, double score) {
        this.name = name;
        this.score = score;
    }

    @Override
    public String toString() {
        return name + ": " + score;
    }
}

public class GradeManager {
    private List<Student> students = new ArrayList<>();

    public void addStudent(String name, double score) {
        students.add(new Student(name, score));
    }

    // 按成绩排序
    public List<Student> sortByScore() {
        List<Student> sorted = new ArrayList<>(students);
        sorted.sort((s1, s2) -> Double.compare(s2.score, s1.score));
        return sorted;
    }

    // 计算平均分
    public double averageScore() {
        return students.stream()
            .mapToDouble(s -> s.score)
            .average()
            .orElse(0);
    }

    // 查找最高分
    public Student topStudent() {
        return students.stream()
            .max(Comparator.comparingDouble(s -> s.score))
            .orElse(null);
    }

    // 统计各分数段人数
    public Map<String, Integer> scoreDistribution() {
        Map<String, Integer> dist = new LinkedHashMap<>();
        dist.put("优秀(90-100)", 0);
        dist.put("良好(80-89)", 0);
        dist.put("及格(60-79)", 0);
        dist.put("不及格(<60)", 0);

        for (Student s : students) {
            if (s.score >= 90) dist.merge("优秀(90-100)", 1, Integer::sum);
            else if (s.score >= 80) dist.merge("良好(80-89)", 1, Integer::sum);
            else if (s.score >= 60) dist.merge("及格(60-79)", 1, Integer::sum);
            else dist.merge("不及格(<60)", 1, Integer::sum);
        }
        return dist;
    }
}

GradeManager manager = new GradeManager();
manager.addStudent("张三", 92);
manager.addStudent("李四", 85);
manager.addStudent("王五", 78);
manager.addStudent("赵六", 95);

System.out.println("平均分: " + manager.averageScore());
System.out.println("最高分: " + manager.topStudent());
System.out.println("成绩分布: " + manager.scoreDistribution());
```

## 集合选择指南

| 场景             | 推荐集合          | 原因          |
| ---------------- | ----------------- | ------------- |
| 频繁随机访问     | ArrayList         | O(1) 访问速度 |
| 频繁插入删除     | LinkedList        | O(1) 插入删除 |
| 需要唯一元素     | HashSet           | 快速去重      |
| 需要排序         | TreeSet           | 自动排序      |
| 保持插入顺序     | LinkedHashMap     | 有序且高效    |
| 键值对存储       | HashMap           | 快速查找      |
| 需要排序的键值对 | TreeMap           | 按键排序      |
| 线程安全         | ConcurrentHashMap | 高性能并发    |

## 核心知识点

1. **List**：有序可重复，ArrayList 适合随机访问，LinkedList 适合频繁插入删除
2. **Set**：无序不可重复，HashSet 快速去重，TreeSet 自动排序
3. **Map**：键值对存储，HashMap 最常用，LinkedHashMap 保持顺序，TreeMap 按键排序
4. **Iterator**：统一遍历集合的方式，支持安全删除元素
5. **泛型集合**：确保类型安全，避免类型转换
6. **Collections 工具类**：提供排序、反转、同步等便捷方法

## 本章小结

List 有序可重复，Set 无序不可重复，Map 存储键值对。ArrayList 适合随机访问，LinkedList 适合频繁插入删除。使用泛型确保类型安全。接下来我们将学习 IO 与 NIO。
