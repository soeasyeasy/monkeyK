---
title: '第十四章：Lambda 与 Stream API'
description: '函数式接口、Lambda 表达式、Stream 操作'
---

# 第十四章：Lambda 与 Stream API

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Lambda 是什么？为什么 Java 8 要引入它？
- 函数式接口和普通接口有什么区别？
- Stream API 能干什么？和集合操作有什么不同？
- Optional 是什么？怎么用它避免空指针异常？

这一章就是为了解答这些问题。我们会先搞清楚 **Lambda 表达式的语法**，再动手实践 Stream API 的常用操作。学完这章，你就能写出更简洁、更优雅的 Java 代码了。

---

## 14.1 为什么需要 Lambda 和 Stream？

### 痛点分析

想象你要从一个列表中筛选出及格的学生，传统写法很繁琐：

```java
// ❌ 传统写法：代码冗长
List<Student> students = getStudents();
List<Student> passed = new ArrayList<>();
for (Student s : students) {
    if (s.getScore() >= 60) {
        passed.add(s);  // 手动添加到新列表
    }
}
```

如果还要排序、分组、统计，代码会更长。

### 解决方案

```java
// ✅ Lambda + Stream 写法：简洁优雅
List<Student> passed = students.stream()
    .filter(s -> s.getScore() >= 60)  // 筛选及格的学生
    .collect(Collectors.toList());     // 收集结果
```

> **一句话总结**：Lambda 让代码更简洁，Stream 让集合操作更优雅。

### 生活类比

打个比方：

> Lambda 就像**速记符号**——把冗长的匿名内部类简化为一行代码。Stream 就像**流水线**——数据经过筛选、转换、聚合，最终得到想要的结果。

---

## 14.2 核心原理

### Lambda 表达式

Lambda 是匿名函数的简写，用于实现**函数式接口**（只有一个抽象方法的接口）。

```java
// 传统匿名内部类写法
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Lambda 写法（简洁多了）
Runnable r2 = () -> System.out.println("Hello");
```

**Lambda 语法**：

- `()`：参数列表
- `->`：箭头符号
- `{}`：方法体

### 函数式接口

只有一个抽象方法的接口。Java 内置了 4 个常用函数式接口：

| 接口            | 方法              | 说明                    |
| --------------- | ----------------- | ----------------------- |
| Predicate\<T\>  | boolean test(T t) | 判断（返回 true/false） |
| Function\<T,R\> | R apply(T t)      | 转换（输入 T，输出 R）  |
| Consumer\<T\>   | void accept(T t)  | 消费（输入 T，无输出）  |
| Supplier\<T\>   | T get()           | 生产（无输入，输出 T）  |

### Stream API

Stream 是对集合的链式操作，支持 filter、map、reduce 等操作。

打个比方：

> Stream 就像**工厂流水线**——原材料（集合）进入流水线，经过筛选（filter）、加工（map）、组装（collect），最终得到产品（结果）。

---

## 14.3 基础用法

### Lambda 表达式（逐行注释）

```java
// 无参数的 Lambda
Runnable r = () -> System.out.println("Hello");
// () 表示没有参数
// -> 是 Lambda 箭头符号
// System.out.println("Hello") 是方法体，只有一行可以省略大括号

// 单参数的 Lambda（可省略括号）
Consumer<String> printer = s -> System.out.println(s);
// s 是参数名，类型由 Consumer<String> 自动推断
// 只有一个参数时可以省略括号
// 方法体只有一行，省略大括号和 return

// 多参数的 Lambda
Comparator<Integer> cmp = (a, b) -> a - b;
// (a, b) 是两个参数，类型由 Comparator<Integer> 推断为 Integer
// a - b 是方法体，返回比较结果（升序）

// 多行代码的 Lambda（需要大括号和 return）
Comparator<String> cmp2 = (s1, s2) -> {
    // 方法体有多行，必须用大括号包裹
    int lenDiff = s1.length() - s2.length();
    // 先比较长度
    return lenDiff != 0 ? lenDiff : s1.compareTo(s2);
    // 长度不同返回长度差，长度相同按字典序比较
    // 多行代码必须显式 return
};
```

### 函数式接口

```java
import java.util.function.*;

// Predicate：判断
Predicate<Integer> isPositive = n -> n > 0;
System.out.println(isPositive.test(5));    // 输出：true

// Function：转换
Function<String, Integer> strLen = s -> s.length();
System.out.println(strLen.apply("Hello")); // 输出：5

// Consumer：消费
Consumer<String> greeter = s -> System.out.println("Hello, " + s);
greeter.accept("World");  // 输出：Hello, World

// Supplier：生产
Supplier<Double> random = () -> Math.random();
System.out.println(random.get());  // 输出：随机数
```

### 常用函数式接口对比

| 接口                | 方法签名            | 用途                       | 示例                         |
| ------------------- | ------------------- | -------------------------- | ---------------------------- |
| Predicate\<T\>      | boolean test(T t)   | 判断/过滤                  | `n -> n > 0`                 |
| Function\<T,R\>     | R apply(T t)        | 转换/映射                  | `s -> s.length()`            |
| Consumer\<T\>       | void accept(T t)    | 消费/执行                  | `s -> System.out.println(s)` |
| Supplier\<T\>       | T get()             | 生产/创建                  | `() -> new ArrayList<>()`    |
| BiFunction\<T,U,R\> | R apply(T t, U u)   | 双参数转换                 | `(a, b) -> a + b`            |
| UnaryOperator\<T\>  | T apply(T t)        | 一元操作（输入输出同类型） | `s -> s.toUpperCase()`       |
| BinaryOperator\<T\> | T apply(T t1, T t2) | 二元操作（输入输出同类型） | `(a, b) -> a * b`            |

### 自定义函数式接口

```java
@FunctionalInterface  // 标记为函数式接口（可选，但推荐）
public interface Calculator {
    int calculate(int a, int b);  // 只有一个抽象方法
}

Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(3, 5));      // 输出：8
System.out.println(multiply.calculate(3, 5)); // 输出：15
```

### 方法引用

方法引用是 Lambda 的进一步简化，使用 `::` 语法。

```java
// 静态方法引用：类名::方法名
Function<String, Integer> parseInt = Integer::parseInt;

// 实例方法引用：对象::方法名
List<String> list = List.of("banana", "apple", "cherry");
list.forEach(System.out::println);  // 等价于 list.forEach(s -> System.out.println(s))

// 构造器引用：类名::new
Supplier<ArrayList<String>> listCreator = ArrayList::new;
```

### Stream API

#### 创建 Stream

```java
List<String> list = List.of("Java", "Python", "Go");

// 从集合创建
Stream<String> stream1 = list.stream();

// 从数组创建
Stream<Integer> stream2 = Stream.of(1, 2, 3);

// 并行流（多线程处理）
Stream<String> parallelStream = list.parallelStream();
```

#### 常用操作

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// filter：过滤
List<Integer> evens = numbers.stream()
    .filter(n -> n % 2 == 0)  // 保留偶数
    .collect(Collectors.toList());
// 结果：[2, 4, 6, 8, 10]

// map：转换
List<Integer> squares = numbers.stream()
    .map(n -> n * n)  // 每个数平方
    .collect(Collectors.toList());
// 结果：[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

// sorted：排序
List<Integer> sorted = numbers.stream()
    .sorted((a, b) -> b - a)  // 降序
    .collect(Collectors.toList());

// distinct：去重
List<Integer> unique = Stream.of(1, 2, 2, 3, 3, 3)
    .distinct()
    .collect(Collectors.toList());
// 结果：[1, 2, 3]

// limit & skip：分页
List<Integer> page = numbers.stream()
    .skip(2)     // 跳过前 2 个
    .limit(3)    // 取 3 个
    .collect(Collectors.toList());
// 结果：[3, 4, 5]
```

#### 聚合操作

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

// 求和
int sum = numbers.stream().reduce(0, Integer::sum);

// 最大值
Optional<Integer> max = numbers.stream().reduce(Integer::max);

// 计数
long count = numbers.stream().count();

// 统计信息
IntSummaryStatistics stats = numbers.stream()
    .mapToInt(Integer::intValue)
    .summaryStatistics();

System.out.println("平均值: " + stats.getAverage());
System.out.println("最大值: " + stats.getMax());
System.out.println("最小值: " + stats.getMin());
System.out.println("总数: " + stats.getSum());
```

#### 收集器

```java
List<String> names = List.of("张三", "李四", "王五", "张三");

// 转 List
List<String> list = names.stream().collect(Collectors.toList());

// 转 Set（去重）
Set<String> set = names.stream().collect(Collectors.toSet());

// 转 Map
Map<String, Integer> map = Stream.of("a=1", "b=2", "c=3")
    .map(s -> s.split("="))
    .collect(Collectors.toMap(
        arr -> arr[0],
        arr -> Integer.parseInt(arr[1])
    ));

// 分组
Map<Integer, List<String>> groupByNameLength = names.stream()
    .collect(Collectors.groupingBy(String::length));

// 拼接
String joined = names.stream()
    .collect(Collectors.joining(", "));
// 结果："张三, 李四, 王五, 张三"
```

### Stream 常用操作对比

| 操作     | 说明                     | 输入 → 输出     | 示例                                             |
| -------- | ------------------------ | --------------- | ------------------------------------------------ |
| filter   | 过滤，保留满足条件的元素 | T → boolean     | `filter(n -> n > 0)` 保留正数                    |
| map      | 转换每个元素             | T → R           | `map(s -> s.length())` 字符串变长度              |
| flatMap  | 展平嵌套结构             | T → Stream\<R\> | `flatMap(s -> Arrays.stream(s.split(" ")))`      |
| sorted   | 排序                     | -               | `sorted()` 自然排序，`sorted((a,b) -> b-a)` 降序 |
| distinct | 去重                     | -               | `distinct()` 去除重复元素                        |
| limit    | 取前 N 个                | -               | `limit(5)` 取前 5 个                             |
| skip     | 跳过前 N 个              | -               | `skip(3)` 跳过前 3 个                            |
| reduce   | 聚合为单个值             | T,T → T         | `reduce(0, Integer::sum)` 求和                   |
| collect  | 收集为集合               | T → Collection  | `collect(Collectors.toList())` 转 List           |
| forEach  | 遍历每个元素             | T → void        | `forEach(System.out::println)` 打印              |
| count    | 计数                     | - → long        | `count()` 元素个数                               |

### Optional

Optional 用于安全处理可能为 null 的值，避免空指针异常。

```java
import java.util.Optional;

// 创建 Optional
Optional<String> opt1 = Optional.of("Hello");       // 不能为 null
Optional<String> opt2 = Optional.ofNullable(null);   // 可以为 null
Optional<String> opt3 = Optional.empty();             // 空值

// 判断与获取
if (opt1.isPresent()) {
    System.out.println(opt1.get());
}

// orElse：提供默认值
String value = opt2.orElse("默认值");

// orElseGet：延迟计算默认值
String value2 = opt2.orElseGet(() -> "计算得到的默认值");

// orElseThrow：不存在则抛异常
String value3 = opt2.orElseThrow(() -> new RuntimeException("值不存在"));

// 链式操作
Optional<String> upper = opt1
    .filter(s -> s.length() > 3)  // 过滤
    .map(String::toUpperCase);     // 转换

// ifPresent：存在则执行
opt1.ifPresent(s -> System.out.println("值: " + s));
```

---

## 14.4 高级用法

### flatMap：扁平化

```java
// 将嵌套结构展平
List<String> words = List.of("Hello World", "Java Stream", "Good Morning");

List<String> allWords = words.stream()
    .map(w -> w.split(" "))     // 每个字符串拆分为数组
    .flatMap(Arrays::stream)    // 展平为单个流
    .collect(Collectors.toList());
// 结果：[Hello, World, Java, Stream, Good, Morning]
```

### peek：调试利器

```java
List<Integer> result = List.of(1, 2, 3, 4, 5).stream()
    .peek(n -> System.out.println("原始值: " + n))
    .filter(n -> n % 2 == 0)
    .peek(n -> System.out.println("过滤后: " + n))
    .map(n -> n * n)
    .peek(n -> System.out.println("映射后: " + n))
    .collect(Collectors.toList());
```

### 分组与分区

```java
List<Student> students = List.of(
    new Student("张三", "A班", 90),
    new Student("李四", "B班", 85),
    new Student("王五", "A班", 78),
    new Student("赵六", "B班", 92)
);

// 按班级分组
Map<String, List<Student>> byClass = students.stream()
    .collect(Collectors.groupingBy(s -> s.className));

// 按班级统计人数
Map<String, Long> countByClass = students.stream()
    .collect(Collectors.groupingBy(s -> s.className, Collectors.counting()));

// 按班级计算平均分
Map<String, Double> avgByClass = students.stream()
    .collect(Collectors.groupingBy(
        s -> s.className,
        Collectors.averagingInt(s -> s.score)
    ));

// 分区：按条件分为两组
Map<Boolean, List<Student>> partition = students.stream()
    .collect(Collectors.partitioningBy(s -> s.score >= 90));
```

### 并行流

```java
List<Integer> numbers = IntStream.range(1, 1_000_000)
    .boxed()
    .collect(Collectors.toList());

// 串行流
long t1 = System.currentTimeMillis();
long sum1 = numbers.stream()
    .filter(n -> n % 2 == 0)
    .mapToLong(n -> n)
    .sum();
System.out.println("串行: " + (System.currentTimeMillis() - t1) + "ms");

// 并行流（利用多核 CPU）
long t2 = System.currentTimeMillis();
long sum2 = numbers.parallelStream()
    .filter(n -> n % 2 == 0)
    .mapToLong(n -> n)
    .sum();
System.out.println("并行: " + (System.currentTimeMillis() - t2) + "ms");
```

::: warning 并行流注意事项

1. 数据量小时，并行流开销反而更大
2. 避免在并行流中修改共享变量
3. 某些操作（如 limit、findFirst）在并行流中效率较低

:::

---

## 14.5 新手常见误区

### 误区 1：Lambda 中修改外部变量

**错！** Lambda 中只能访问 effectively final 的变量。

```java
String prefix = "Hello";
Consumer<String> greeter = name -> System.out.println(prefix + " " + name);

// prefix = "Hi";  // ❌ 如果修改外部变量，编译错误
```

### 误区 2：Stream 会修改原集合

**错！** Stream 操作不会修改原集合，而是返回新集合。

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

List<Integer> evens = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());

System.out.println(numbers);  // 原集合不变：[1, 2, 3, 4, 5]
System.out.println(evens);    // 新集合：[2, 4]
```

### 误区 3：Stream 可以重复使用

**错！** Stream 只能使用一次，使用后就关闭了。

```java
Stream<Integer> stream = Stream.of(1, 2, 3);
stream.filter(n -> n > 1).forEach(System.out::println);

// stream.filter(n -> n > 2).forEach(System.out::println);  // ❌ 抛出 IllegalStateException
```

### 误区 4：Optional.get() 是安全的

**错！** 如果 Optional 为空，get() 会抛出 NoSuchElementException。

```java
Optional<String> opt = Optional.empty();

// ❌ 危险：直接 get()
String value = opt.get();  // 抛出异常

// ✅ 安全：先判断或使用 orElse
if (opt.isPresent()) {
    String value = opt.get();
}
String value = opt.orElse("默认值");  // 推荐
```

### 误区 5：所有集合操作都应该用 Stream

**不是的。** 简单操作用传统循环更直观，Stream 适合复杂链式操作。

```java
// ❌ 过度使用 Stream：简单遍历也要用 Stream
list.stream().forEach(System.out::println);

// ✅ 简单操作：传统循环更清晰
for (String item : list) {
    System.out.println(item);
}
```

---

## 14.6 动手练习

### 练习 1：基础练习 —— 筛选偶数

给定一个整数列表，使用 Stream 筛选出所有偶数并收集到新列表。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;
import java.util.stream.*;

public class EvenFilter {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 使用 Stream 筛选偶数
        List<Integer> evens = numbers.stream()
            .filter(n -> n % 2 == 0)  // 过滤条件：偶数
            .collect(Collectors.toList());  // 收集结果

        System.out.println(evens);  // 输出：[2, 4, 6, 8, 10]
    }
}
```

</details>

### 练习 2：进阶练习 —— 学生成绩统计

给定学生列表，使用 Stream 计算平均分、最高分，并按成绩排序。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;
import java.util.stream.*;

class Student {
    String name;
    double score;

    Student(String name, double score) {
        this.name = name;
        this.score = score;
    }

    public double getScore() {
        return score;
    }

    @Override
    public String toString() {
        return name + ": " + score;
    }
}

public class StudentStats {
    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("张三", 92),
            new Student("李四", 85),
            new Student("王五", 78),
            new Student("赵六", 95)
        );

        // 计算平均分
        double avg = students.stream()
            .mapToDouble(Student::getScore)
            .average()
            .orElse(0);
        System.out.println("平均分: " + avg);

        // 最高分
        Optional<Student> top = students.stream()
            .max(Comparator.comparingDouble(Student::getScore));
        top.ifPresent(s -> System.out.println("最高分: " + s));

        // 按成绩降序排序
        List<Student> sorted = students.stream()
            .sorted(Comparator.comparingDouble(Student::getScore).reversed())
            .collect(Collectors.toList());
        System.out.println("排序后: " + sorted);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 词频统计

给定一段文本，使用 Stream 统计每个单词出现的次数。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;
import java.util.stream.*;

public class WordCount {
    public static void main(String[] args) {
        String text = "apple banana apple orange banana grape apple banana";

        // 使用 Stream 统计词频
        Map<String, Long> wordCount = Arrays.stream(text.split(" "))
            .collect(Collectors.groupingBy(
                word -> word,
                Collectors.counting()
            ));

        System.out.println(wordCount);
        // 输出：{apple=3, banana=3, orange=1, grape=1}
    }
}
```

</details>

---

## 14.7 核心知识点

| 知识点        | 说明                                                      |
| ------------- | --------------------------------------------------------- |
| Lambda 表达式 | 匿名函数简写，用于实现函数式接口                          |
| 函数式接口    | Predicate、Function、Consumer、Supplier                   |
| 方法引用      | `::` 语法进一步简化 Lambda                                |
| Stream 操作   | filter、map、flatMap、sorted、distinct、limit、skip       |
| 聚合操作      | reduce、collect、count、summaryStatistics                 |
| 收集器        | toList、toSet、toMap、groupingBy、partitioningBy、joining |
| Optional      | 安全处理可能为 null 的值                                  |
| 并行流        | 利用多核 CPU 加速处理大数据量                             |

---

## 下一章预告

下一章我们会学习 **JDBC 数据库编程**——Java 连接和操作数据库的标准 API。你会学到如何连接数据库、执行 SQL、处理结果集、管理事务。学完这章，你就能在 Java 程序中操作数据库了。
