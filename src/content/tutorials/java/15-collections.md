---
title: '第十五章：集合框架'
description: 'List、Set、Map、Iterator、泛型集合'
---

# 第十五章：集合框架

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数组长度固定，有没有能"自动扩容"的数据容器？
- List、Set、Map 有什么区别？什么时候用哪个？
- ArrayList 和 LinkedList 都是 List，性能差别大吗？
- 怎么保证集合中的元素不重复？

这一章就是为了解答这些问题。我们会先搞清楚 **集合框架的核心结构**，再动手实践 List、Set、Map 的常用操作。学完这章，你就能灵活管理一组数据了。

---

## 1 为什么需要集合框架？

### 痛点分析

想象你要存储一个班级的学生姓名，学生人数不固定：

```java
// ❌ 用数组：长度固定，不够灵活
String[] students = new String[30];  // 最多存 30 个学生
students[0] = "张三";
students[1] = "李四";
// 如果班级有 35 个学生，数组越界了！
// 如果只有 10 个学生，浪费了 20 个位置
```

数组的问题：**长度固定，无法动态调整**。

### 解决方案

```java
// ✅ 用集合：自动扩容，灵活管理
List<String> students = new ArrayList<>();
students.add("张三");
students.add("李四");
students.add("王五");
// 可以无限添加，集合会自动扩容
System.out.println(students.size());  // 输出：3
```

> **一句话总结**：集合是"可变长度的数组"，能动态管理数据。

### 生活类比

打个比方：

> 数组就像**固定大小的盒子**——你买了一个能装 30 个苹果的盒子，装不下 35 个，空着 20 个位置也浪费空间。集合就像**弹性袋子**——放多少东西就撑多大，永远不会浪费。

---

## 2 核心原理

### 集合框架结构

```
Collection（接口）
├── List（有序、可重复）
│   ├── ArrayList         ← 基于动态数组，查询快
│   ├── LinkedList        ← 基于双向链表，插入删除快
│   └── Vector            ← 线程安全的 ArrayList（过时了）
├── Set（无序、不可重复）
│   ├── HashSet           ← 基于 HashMap，快速去重
│   ├── LinkedHashSet     ← 保持插入顺序
│   └── TreeSet           ← 自动排序
└── Queue（队列）
    ├── LinkedList        ← 也可以当队列用
    └── PriorityQueue     ← 优先级队列

Map（接口，键值对）
├── HashMap               ← 最常用，基于哈希表
├── LinkedHashMap         ← 保持插入顺序
├── TreeMap               ← 按键排序
└── Hashtable             ← 线程安全的 HashMap（过时了）
```

打个比方：

> - **List** 就像**排队买票**——有顺序，可以重复（同一个人可以排多次队）。
> - **Set** 就像**身份证号**——无序，但不能重复（每个人只有一个唯一 ID）。
> - **Map** 就像**电话簿**——通过名字（键）找电话（值），名字不能重复。

### List vs Set vs Map 对比

| 特性     | List                   | Set                     | Map                                   |
| -------- | ---------------------- | ----------------------- | ------------------------------------- |
| 有序性   | ✅ 有序（按插入顺序）  | ❌ 无序（TreeSet 有序） | ❌ 无序（TreeMap/LinkedHashMap 有序） |
| 重复性   | ✅ 可重复              | ❌ 不可重复             | ❌ 键不可重复，值可重复               |
| 访问方式 | 按索引访问             | 遍历                    | 按键访问                              |
| 典型实现 | ArrayList              | HashSet                 | HashMap                               |
| 适用场景 | 需要保持顺序、允许重复 | 需要去重                | 键值对映射                            |

---

## 3 基础用法

### List

#### ArrayList

```java
import java.util.ArrayList;
import java.util.List;

// 创建一个存储字符串的 ArrayList
List<String> list = new ArrayList<>();

// 添加元素
list.add("Java");     // 添加到末尾
list.add("Python");
list.add("Go");

// 访问元素（通过索引，从 0 开始）
System.out.println(list.get(0));     // 输出：Java
System.out.println(list.size());     // 输出：3（集合大小）

// 修改元素
list.set(1, "Python3");  // 把索引 1 的元素改为 "Python3"

// 删除元素
list.remove("Go");       // 按值删除
list.remove(0);          // 按索引删除

// 遍历集合
for (String item : list) {
    System.out.println(item);  // 打印每个元素
}
```

#### LinkedList

```java
import java.util.LinkedList;

// LinkedList 除了是 List，还可以当双端队列用
LinkedList<String> linkedList = new LinkedList<>();
linkedList.add("A");              // 添加到末尾
linkedList.add("B");
linkedList.addFirst("Head");      // 添加到头部
linkedList.addLast("Tail");       // 添加到尾部

System.out.println(linkedList.getFirst());  // 输出：Head（获取头部）
System.out.println(linkedList.getLast());   // 输出：Tail（获取尾部）
```

#### ArrayList vs LinkedList

| 特性     | ArrayList               | LinkedList                   |
| -------- | ----------------------- | ---------------------------- |
| 底层结构 | 动态数组                | 双向链表                     |
| 随机访问 | 快 O(1)                 | 慢 O(n)                      |
| 插入删除 | 慢 O(n)（需要移动元素） | 快 O(1)（已知位置时）        |
| 内存占用 | 较少                    | 较多（每个节点要存前后指针） |
| 适用场景 | 频繁查询                | 频繁插入删除                 |

### Set

#### HashSet

```java
import java.util.HashSet;
import java.util.Set;

// 创建一个 HashSet
Set<String> set = new HashSet<>();

set.add("Java");
set.add("Python");
set.add("Java");    // 重复元素，不会添加

System.out.println(set.size());         // 输出：2（去重了）
System.out.println(set.contains("Java")); // 输出：true（是否包含）

set.remove("Python");  // 删除元素
```

#### TreeSet（自动排序）

```java
import java.util.TreeSet;

TreeSet<Integer> treeSet = new TreeSet<>();
treeSet.add(5);
treeSet.add(1);
treeSet.add(3);
treeSet.add(2);
treeSet.add(4);

System.out.println(treeSet);  // 输出：[1, 2, 3, 4, 5]（自动排序）
```

### Map

#### HashMap

```java
import java.util.HashMap;
import java.util.Map;

// 创建一个 HashMap，键是字符串，值是整数
Map<String, Integer> scores = new HashMap<>();

// 添加键值对
scores.put("张三", 90);
scores.put("李四", 85);
scores.put("王五", 92);

// 访问值（通过键）
System.out.println(scores.get("张三"));      // 输出：90
System.out.println(scores.getOrDefault("赵六", 0));  // 输出：0（键不存在时返回默认值）

// 判断
System.out.println(scores.containsKey("李四"));   // 输出：true（是否包含键）
System.out.println(scores.containsValue(85));     // 输出：true（是否包含值）

// 删除
scores.remove("王五");

// 遍历方式 1：通过 entrySet
for (Map.Entry<String, Integer> entry : scores.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// 遍历方式 2：Java 8+ forEach
scores.forEach((name, score) -> {
    System.out.println(name + ": " + score);
});
```

#### LinkedHashMap（保持插入顺序）

```java
Map<String, Integer> linkedMap = new LinkedHashMap<>();
linkedMap.put("C", 3);
linkedMap.put("A", 1);
linkedMap.put("B", 2);

System.out.println(linkedMap);  // 输出：{C=3, A=1, B=2}（保持插入顺序）
```

### Iterator（迭代器）

```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));

// 获取迭代器
Iterator<String> it = list.iterator();
while (it.hasNext()) {  // 判断是否还有下一个元素
    String item = it.next();  // 获取下一个元素
    System.out.println(item);
    if (item.equals("B")) {
        it.remove();    // 安全删除（不会抛出 ConcurrentModificationException）
    }
}
```

---

## 4 泛型集合

```java
// 泛型确保类型安全
List<Integer> numbers = new ArrayList<>();
numbers.add(1);
numbers.add(2);
// numbers.add("hello");  // ❌ 编译错误：类型不匹配

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

---

## 5 Collections 工具类

```java
import java.util.Collections;

List<Integer> list = new ArrayList<>(List.of(3, 1, 4, 1, 5, 9));

Collections.sort(list);           // 排序：[1, 1, 3, 4, 5, 9]
Collections.reverse(list);        // 反转：[9, 5, 4, 3, 1, 1]
Collections.shuffle(list);        // 随机打乱
System.out.println(Collections.max(list));  // 最大值：9
System.out.println(Collections.min(list));  // 最小值：1
```

### 不可修改集合

```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));
List<String> unmodifiable = Collections.unmodifiableList(list);

// unmodifiable.add("D");  // ❌ UnsupportedOperationException
```

### 线程安全集合

```java
List<String> list = new ArrayList<>();
List<String> syncList = Collections.synchronizedList(list);

// 多线程环境下安全使用
syncList.add("A");
syncList.add("B");
```

---

## 6 新手常见误区

### 误区 1：在 foreach 循环中删除元素

**错！** 会抛出 `ConcurrentModificationException`。

```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));

// ❌ 错误：在 foreach 中删除
for (String item : list) {
    if (item.equals("B")) {
        list.remove(item);  // ❌ 抛出 ConcurrentModificationException
    }
}

// ✅ 正确：使用 Iterator
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("B")) {
        it.remove();  // ✅ 安全删除
    }
}

// ✅ 正确：使用 removeIf（Java 8+）
list.removeIf(item -> item.equals("B"));
```

### 误区 2：ArrayList 和 LinkedList 性能差不多

**错！** 性能差异很大。

```java
// ArrayList：随机访问快，插入删除慢
List<Integer> arrayList = new ArrayList<>();
arrayList.get(1000);  // O(1)，很快
arrayList.add(0, 1);  // O(n)，需要移动后面的元素

// LinkedList：随机访问慢，插入删除快
List<Integer> linkedList = new LinkedList<>();
linkedList.get(1000);  // O(n)，需要从头遍历
linkedList.add(0, 1);  // O(1)，直接修改指针
```

### 误区 3：HashSet 中的对象不需要重写 hashCode 和 equals

**错！** 必须重写，否则无法正确去重。

```java
class Student {
    String name;
    int age;

    // ❌ 不重写 hashCode 和 equals
    // 两个内容相同的 Student 对象会被认为是不同的
}

Set<Student> set = new HashSet<>();
set.add(new Student("张三", 20));
set.add(new Student("张三", 20));
System.out.println(set.size());  // 输出：2（应该是 1）

// ✅ 正确：重写 hashCode 和 equals
class Student {
    String name;
    int age;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Student student = (Student) o;
        return age == student.age && Objects.equals(name, student.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
}
```

### 误区 4：Map 的 key 可以是任意对象

**是的，但要注意。** 如果用自定义对象作为 key，必须重写 `hashCode` 和 `equals`。

```java
Map<Student, Integer> map = new HashMap<>();
Student s = new Student("张三", 20);
map.put(s, 90);

// ❌ 如果不重写 hashCode，这里找不到
System.out.println(map.get(new Student("张三", 20)));  // 输出：null
```

### 误区 5：集合可以存储基本类型

**错！** 集合只能存储对象，不能存储基本类型。

```java
// ❌ 错误
List<int> list = new ArrayList<>();

// ✅ 正确：使用包装类
List<Integer> list = new ArrayList<>();
list.add(1);  // 自动装箱：int → Integer
```

---

## 7 动手练习

### 练习 1：基础练习 —— 学生成绩管理

创建一个 `List<Student>`，添加 5 个学生的成绩，按成绩从高到低排序。

<details>
<summary>点击查看答案</summary>

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

public class GradeSorter {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("张三", 92));
        students.add(new Student("李四", 85));
        students.add(new Student("王五", 78));
        students.add(new Student("赵六", 95));
        students.add(new Student("孙七", 88));

        // 按成绩从高到低排序
        students.sort((s1, s2) -> Double.compare(s2.score, s1.score));

        // 打印结果
        for (Student s : students) {
            System.out.println(s);
        }
    }
}
```

</details>

### 练习 2：进阶练习 —— 单词去重

读取一段文本，提取所有单词并去重，最后按字母顺序输出。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

public class WordDedup {
    public static void main(String[] args) {
        String text = "apple banana apple orange banana grape";

        // 使用 Set 去重
        Set<String> words = new HashSet<>();
        String[] parts = text.split(" ");
        for (String word : parts) {
            words.add(word);
        }

        // 转为 List 并排序
        List<String> sortedWords = new ArrayList<>(words);
        Collections.sort(sortedWords);

        // 打印结果
        for (String word : sortedWords) {
            System.out.println(word);
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 词频统计

统计一段文本中每个单词出现的次数，输出出现次数最多的前 3 个单词。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;

public class WordCount {
    public static void main(String[] args) {
        String text = "apple banana apple orange banana grape apple banana apple";

        // 统计词频
        Map<String, Integer> wordCount = new HashMap<>();
        String[] words = text.split(" ");
        for (String word : words) {
            wordCount.put(word, wordCount.getOrDefault(word, 0) + 1);
        }

        // 按词频排序
        List<Map.Entry<String, Integer>> entries = new ArrayList<>(wordCount.entrySet());
        entries.sort((e1, e2) -> e2.getValue() - e1.getValue());

        // 输出前 3 个
        for (int i = 0; i < Math.min(3, entries.size()); i++) {
            Map.Entry<String, Integer> entry = entries.get(i);
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
}
```

</details>

---

## 8 核心知识点

| 知识点             | 说明                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| List               | 有序可重复，ArrayList 适合随机访问，LinkedList 适合频繁插入删除      |
| Set                | 无序不可重复，HashSet 快速去重，TreeSet 自动排序                     |
| Map                | 键值对存储，HashMap 最常用，LinkedHashMap 保持顺序，TreeMap 按键排序 |
| Iterator           | 统一遍历集合的方式，支持安全删除元素                                 |
| 泛型集合           | 确保类型安全，避免类型转换                                           |
| Collections 工具类 | 提供排序、反转、同步等便捷方法                                       |

---

## 下一章预告

下一章我们会学习 **IO 与 NIO**——Java 的文件读写操作。你会学到 File 类、字节流、字符流、对象序列化，以及 NIO 的 Path 和 Files 工具类。学完这章，你就能在程序中读写文件、处理文本数据了。
