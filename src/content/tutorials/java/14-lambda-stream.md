---
title: '第十四章：Lambda 与 Stream API'
description: '函数式接口、Lambda 表达式、Stream 操作'
---

# 第十四章：Lambda 与 Stream API

## Lambda 表达式

Lambda 是匿名函数的简写，用于实现函数式接口。

```java
// 匿名内部类
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Lambda
Runnable r2 = () -> System.out.println("Hello");

// 带参数
Comparator<Integer> cmp = (a, b) -> a - b;

// 多行代码
Comparator<String> cmp2 = (s1, s2) -> {
    int lenDiff = s1.length() - s2.length();
    return lenDiff != 0 ? lenDiff : s1.compareTo(s2);
};
```

## 函数式接口

只有一个抽象方法的接口。Java 内置常用函数式接口：

| 接口            | 方法              | 说明 |
| --------------- | ----------------- | ---- |
| Predicate\<T\>  | boolean test(T t) | 判断 |
| Function\<T,R\> | R apply(T t)      | 转换 |
| Consumer\<T\>   | void accept(T t)  | 消费 |
| Supplier\<T\>   | T get()           | 生产 |

```java
import java.util.function.*;

// Predicate
Predicate<Integer> isPositive = n -> n > 0;
System.out.println(isPositive.test(5));    // true

// Function
Function<String, Integer> strLen = s -> s.length();
System.out.println(strLen.apply("Hello")); // 5

// Consumer
Consumer<String> printer = s -> System.out.println(">> " + s);
printer.accept("Java");  // >> Java

// Supplier
Supplier<Double> random = () -> Math.random();
System.out.println(random.get());
```

### 自定义函数式接口

```java
@FunctionalInterface
public interface Calculator {
    int calculate(int a, int b);
}

Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(3, 5));      // 8
System.out.println(multiply.calculate(3, 5)); // 15
```

## 方法引用

方法引用是 Lambda 的进一步简化。

```java
// 静态方法引用
Function<String, Integer> parseInt = Integer::parseInt;

// 实例方法引用
List<String> list = List.of("banana", "apple", "cherry");
list.forEach(System.out::println);

// 构造器引用
Supplier<ArrayList<String>> listCreator = ArrayList::new;
```

## Stream API

Stream 用于对集合进行链式操作。

### 创建 Stream

```java
List<String> list = List.of("Java", "Python", "Go", "Rust");

// 从集合创建
Stream<String> stream1 = list.stream();

// 从数组创建
Stream<Integer> stream2 = Stream.of(1, 2, 3, 4, 5);

// 并行流
Stream<String> parallelStream = list.parallelStream();
```

### 常用操作

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// filter — 过滤
List<Integer> evens = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// [2, 4, 6, 8, 10]

// map — 转换
List<Integer> squares = numbers.stream()
    .map(n -> n * n)
    .collect(Collectors.toList());
// [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

// sorted — 排序
List<Integer> sorted = numbers.stream()
    .sorted((a, b) -> b - a)    // 降序
    .collect(Collectors.toList());

// distinct — 去重
List<Integer> unique = Stream.of(1, 2, 2, 3, 3, 3)
    .distinct()
    .collect(Collectors.toList());
// [1, 2, 3]

// limit & skip
List<Integer> page = numbers.stream()
    .skip(2)     // 跳过前 2 个
    .limit(3)    // 取 3 个
    .collect(Collectors.toList());
// [3, 4, 5]
```

### 聚合操作

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

// 求和
int sum = numbers.stream().reduce(0, Integer::sum);

// 最大值
Optional<Integer> max = numbers.stream().reduce(Integer::max);

// 计数
long count = numbers.stream().count();

// 统计
IntSummaryStatistics stats = numbers.stream()
    .mapToInt(Integer::intValue)
    .summaryStatistics();

System.out.println("平均值: " + stats.getAverage());
System.out.println("最大值: " + stats.getMax());
System.out.println("最小值: " + stats.getMin());
System.out.println("总数: " + stats.getSum());
```

### 收集器

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
// "张三, 李四, 王五, 张三"
```

## Lambda 语法详解

### 参数类型推断

```java
// 完整写法
Comparator<String> cmp1 = (String s1, String s2) -> s1.compareTo(s2);

// 省略参数类型（编译器自动推断）
Comparator<String> cmp2 = (s1, s2) -> s1.compareTo(s2);

// 单参数可省略括号
Consumer<String> printer = s -> System.out.println(s);

// 无参数
Runnable task = () -> System.out.println("Hello");
```

### Lambda 中的变量捕获

```java
// Lambda 可以访问外部的 effectively final 变量
String prefix = "Hello";
Consumer<String> greeter = name -> System.out.println(prefix + " " + name);
greeter.accept("World");  // Hello World

// prefix = "Hi";  // ❌ 如果修改外部变量，编译错误
```

### 方法引用四种形式

```java
// 1. 静态方法引用：类名::静态方法名
Function<String, Integer> parseInt = Integer::parseInt;

// 2. 实例方法引用：对象::实例方法名
String str = "Hello";
Supplier<Integer> len = str::length;

// 3. 类方法引用：类名::实例方法名（第一个参数作为调用对象）
Function<String, String> toUpper = String::toUpperCase;
System.out.println(toUpper.apply("hello"));  // HELLO

// 4. 构造器引用：类名::new
Supplier<List<String>> listFactory = ArrayList::new;
List<String> list = listFactory.get();
```

## Stream 高级操作

### flatMap — 扁平化

```java
// 将嵌套结构展平
List<String> words = List.of("Hello World", "Java Stream", "Good Morning");

List<String> allWords = words.stream()
    .map(w -> w.split(" "))     // Stream<String[]>
    .flatMap(Arrays::stream)    // Stream<String>
    .collect(Collectors.toList());
// [Hello, World, Java, Stream, Good, Morning]

// 数字展平
List<List<Integer>> nested = List.of(
    List.of(1, 2, 3),
    List.of(4, 5),
    List.of(6, 7, 8, 9)
);

List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());
// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### peek — 调试利器

```java
List<Integer> result = List.of(1, 2, 3, 4, 5).stream()
    .peek(n -> System.out.println("原始值: " + n))
    .filter(n -> n % 2 == 0)
    .peek(n -> System.out.println("过滤后: " + n))
    .map(n -> n * n)
    .peek(n -> System.out.println("映射后: " + n))
    .collect(Collectors.toList());
// 原始值: 1
// 原始值: 2
// 过滤后: 2
// 映射后: 4
// 原始值: 3
// 原始值: 4
// 过滤后: 4
// 映射后: 16
// 原始值: 5
```

### 分组与分区

```java
List<Student> students = List.of(
    new Student("张三", "A班", 90),
    new Student("李四", "B班", 85),
    new Student("王五", "A班", 78),
    new Student("赵六", "B班", 92),
    new Student("孙七", "A班", 88)
);

// 按班级分组
Map<String, List<Student>> byClass = students.stream()
    .collect(Collectors.groupingBy(s -> s.className));

// 按班级分组并统计人数
Map<String, Long> countByClass = students.stream()
    .collect(Collectors.groupingBy(s -> s.className, Collectors.counting()));

// 按班级分组并计算平均分
Map<String, Double> avgByClass = students.stream()
    .collect(Collectors.groupingBy(
        s -> s.className,
        Collectors.averagingInt(s -> s.score)
    ));

// 二级分组
Map<String, Map<String, List<Student>>> twoLevel = students.stream()
    .collect(Collectors.groupingBy(
        s -> s.className,
        Collectors.groupingBy(s -> s.score >= 90 ? "优秀" : "普通")
    ));

// 分区（按条件分为两组）
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
4. 使用 `parallel()` 和 `sequential()` 可以切换串行/并行
   :::

## Optional

Stream 操作中经常用到 `Optional` 处理可能为 null 的值。

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

// orElse — 提供默认值
String value = opt2.orElse("默认值");

// orElseGet — 延迟计算默认值
String value2 = opt2.orElseGet(() -> "计算得到的默认值");

// orElseThrow — 不存在则抛异常
String value3 = opt2.orElseThrow(() -> new RuntimeException("值不存在"));

// 链式操作
Optional<String> upper = opt1
    .filter(s -> s.length() > 3)
    .map(String::toUpperCase);
// Optional[HELLO]

// ifPresent — 存在则执行
opt1.ifPresent(s -> System.out.println("值: " + s));
```

## 实际案例：数据分析

```java
class Order {
    String product;
    String category;
    double price;
    int quantity;
    LocalDate date;

    Order(String product, String category, double price, int quantity, LocalDate date) {
        this.product = product;
        this.category = category;
        this.price = price;
        this.quantity = quantity;
        this.date = date;
    }
}

List<Order> orders = List.of(
    new Order("Java书", "图书", 59.9, 2, LocalDate.of(2024, 1, 15)),
    new Order("键盘", "电子", 299.0, 1, LocalDate.of(2024, 1, 20)),
    new Order("Python书", "图书", 49.9, 3, LocalDate.of(2024, 2, 10)),
    new Order("鼠标", "电子", 149.0, 2, LocalDate.of(2024, 2, 15)),
    new Order("Go书", "图书", 69.9, 1, LocalDate.of(2024, 3, 5))
);

// 1. 总销售额
double totalRevenue = orders.stream()
    .mapToDouble(o -> o.price * o.quantity)
    .sum();

// 2. 各品类销售额
Map<String, Double> revenueByCategory = orders.stream()
    .collect(Collectors.groupingBy(
        o -> o.category,
        Collectors.summingDouble(o -> o.price * o.quantity)
    ));

// 3. 销量最高的产品
Optional<Order> bestSeller = orders.stream()
    .max(Comparator.comparingInt(o -> o.quantity));

// 4. 按月统计订单数
Map<Month, Long> ordersByMonth = orders.stream()
    .collect(Collectors.groupingBy(
        o -> o.date.getMonth(),
        TreeMap::new,
        Collectors.counting()
    ));

// 5. 图书类商品的平均价格
DoubleSummaryStatistics bookStats = orders.stream()
    .filter(o -> "图书".equals(o.category))
    .mapToDouble(o -> o.price)
    .summaryStatistics();

System.out.println("图书均价: " + bookStats.getAverage());
System.out.println("图书最高价: " + bookStats.getMax());
```

## 核心知识点

1. **Lambda 表达式**：匿名函数简写，用于实现函数式接口
2. **函数式接口**：Predicate、Function、Consumer、Supplier
3. **方法引用**：`::` 语法进一步简化 Lambda
4. **Stream 操作**：filter、map、flatMap、sorted、distinct、limit、skip
5. **聚合操作**：reduce、collect、count、summaryStatistics
6. **收集器**：toList、toSet、toMap、groupingBy、partitioningBy、joining
7. **Optional**：安全处理可能为 null 的值
8. **并行流**：利用多核 CPU 加速处理大数据量

## 本章小结

Lambda 简化了匿名内部类的写法。Stream API 提供 filter、map、reduce 等操作，支持链式处理集合数据。结合 Optional 可以安全处理空值。接下来我们将学习 JDBC 数据库编程。
