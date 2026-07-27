---
title: '第十二章：泛型基础'
description: '泛型类、泛型方法、通配符、类型擦除'
---

# 第十二章：泛型基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是泛型？为什么需要泛型？
- 泛型类和泛型方法有什么区别？
- 泛型通配符 `?`、`? extends T`、`? super T` 分别是什么意思？
- 什么是类型擦除？为什么会有类型擦除？
- 泛型有哪些常见的应用场景？

这一章就是为了解答这些问题。我们会先理解 **泛型的概念和必要性**，再学习泛型类、泛型方法、通配符的使用，最后了解类型擦除的基本概念。学完这章，你就能写出更类型安全、更复用的代码了。

---

## 1 为什么需要泛型？

### 痛点分析

在没有泛型之前，如果你想写一个可以处理任意类型数据的类，只能使用 `Object` 类型：

```java
// ❌ 没有泛型：使用 Object 类型
public class Box {
    private Object content;
    
    public void set(Object content) {
        this.content = content;
    }
    
    public Object get() {
        return content;
    }
}

// 使用
Box stringBox = new Box();
stringBox.set("Hello");
String str = (String) stringBox.get();  // 需要强制类型转换

Box intBox = new Box();
intBox.set(100);
int num = (Integer) intBox.get();  // 需要强制类型转换

// 问题：类型不安全
Box box = new Box();
box.set("Hello");
Integer num = (Integer) box.get();  // 运行时抛出 ClassCastException！
```

这段代码的问题是：
1. **类型不安全**：编译时不会报错，运行时才会发现类型错误
2. **需要强制类型转换**：代码冗长，容易出错
3. **可读性差**：无法从代码中直接看出存储的是什么类型

**生活类比**：泛型就像"带标签的盒子"。你在盒子上贴上标签（类型参数），告诉别人这个盒子只能装什么类型的东西。这样在装东西和取东西时，编译器都会帮你检查类型是否正确。

### 解决方案

```java
// ✅ 使用泛型：类型安全
public class Box<T> {
    private T content;
    
    public void set(T content) {
        this.content = content;
    }
    
    public T get() {
        return content;
    }
}

// 使用
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String str = stringBox.get();  // 不需要强制类型转换

Box<Integer> intBox = new Box<>();
intBox.set(100);
int num = intBox.get();  // 不需要强制类型转换

// 类型安全：编译时就能发现错误
Box<String> box = new Box<>();
box.set("Hello");
Integer num = box.get();  // ❌ 编译错误！类型不匹配
```

> **一句话总结**：泛型让类型检查从运行时提前到编译时，避免运行时类型转换错误。

---

## 2 泛型类

### 基本语法

泛型类是在类定义时声明类型参数的类。

```java
// 语法：类名<类型参数>
public class Box<T> {
    private T content;
    
    public Box(T content) {
        this.content = content;
    }
    
    public T getContent() {
        return content;
    }
    
    public void setContent(T content) {
        this.content = content;
    }
}
```

### 使用泛型类

```java
// 创建泛型类的实例
Box<String> stringBox = new Box<>("Hello");
String str = stringBox.getContent();  // "Hello"

Box<Integer> intBox = new Box<>(100);
int num = intBox.getContent();  // 100

Box<Double> doubleBox = new Box<>(3.14);
double pi = doubleBox.getContent();  // 3.14
```

### 多个类型参数

泛型类可以有多个类型参数。

```java
public class Pair<K, V> {
    private K key;
    private V value;
    
    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
    
    public K getKey() {
        return key;
    }
    
    public V getValue() {
        return value;
    }
}

// 使用
Pair<String, Integer> pair = new Pair<>("Age", 25);
String key = pair.getKey();  // "Age"
Integer value = pair.getValue();  // 25

// 常见应用：Map 就是使用两个类型参数
Map<String, Integer> map = new HashMap<>();
map.put("Age", 25);
```

### 类型参数命名规范

| 类型参数 | 含义 | 常见场景 |
|---------|------|---------|
| `T` | Type（类型） | 单个类型参数 |
| `E` | Element（元素） | 集合中的元素 |
| `K` | Key（键） | 键值对的键 |
| `V` | Value（值） | 键值对的值 |
| `N` | Number（数字） | 数值类型 |
| `R` | Result（结果） | 返回值类型 |

### 泛型类的实际应用

```java
// 通用的结果包装类
public class Result<T> {
    private boolean success;
    private T data;
    private String message;
    
    public Result(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(true, data, "操作成功");
    }
    
    public static <T> Result<T> error(String message) {
        return new Result<>(false, null, message);
    }
    
    // getter 方法省略
}

// 使用
Result<String> stringResult = Result.success("Hello");
Result<Integer> intResult = Result.success(100);
Result<Object> errorResult = Result.error("操作失败");
```

---

## 3 泛型方法

### 基本语法

泛型方法是在方法定义时声明类型参数的方法。

```java
// 语法：<类型参数> 返回类型 方法名(参数列表)
public class Util {
    // 泛型方法
    public static <T> void printArray(T[] array) {
        for (T item : array) {
            System.out.print(item + " ");
        }
        System.out.println();
    }
    
    // 多个类型参数
    public static <K, V> void printKeyValue(K key, V value) {
        System.out.println(key + " = " + value);
    }
}

// 使用
String[] strings = {"A", "B", "C"};
Integer[] integers = {1, 2, 3};

Util.printArray(strings);  // A B C
Util.printArray(integers);  // 1 2 3

Util.printKeyValue("Name", "Alice");  // Name = Alice
Util.printKeyValue(1, "One");  // 1 = One
```

### 泛型方法的类型推断

Java 编译器可以自动推断泛型方法的类型参数。

```java
public class Util {
    public static <T> T getFirst(List<T> list) {
        return list.isEmpty() ? null : list.get(0);
    }
}

// 使用：编译器自动推断类型
List<String> strings = Arrays.asList("A", "B", "C");
String first = Util.getFirst(strings);  // 推断为 String

List<Integer> integers = Arrays.asList(1, 2, 3);
Integer firstInt = Util.getFirst(integers);  // 推断为 Integer
```

### 泛型方法与泛型类的区别

```java
public class Box<T> {
    private T content;
    
    // 泛型类的方法：使用类的类型参数
    public T getContent() {
        return content;
    }
    
    // 泛型方法：有自己的类型参数
    public <U> void printAndReturn(U item) {
        System.out.println(item);
    }
}

// 使用
Box<String> box = new Box<>();
box.setContent("Hello");
String content = box.getContent();  // 使用类的类型参数 T

box.printAndReturn(100);  // 使用方法的类型参数 U
box.printAndReturn("World");  // U 可以是任意类型
```

### 泛型方法的实际应用

```java
public class ArrayUtil {
    // 将数组转换为 List
    public static <T> List<T> asList(T[] array) {
        List<T> list = new ArrayList<>();
        for (T item : array) {
            list.add(item);
        }
        return list;
    }
    
    // 交换数组中的两个元素
    public static <T> void swap(T[] array, int i, int j) {
        T temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    
    // 查找数组中的最大值
    public static <T extends Comparable<T>> T max(T[] array) {
        T max = array[0];
        for (T item : array) {
            if (item.compareTo(max) > 0) {
                max = item;
            }
        }
        return max;
    }
}

// 使用
String[] strings = {"Apple", "Banana", "Cherry"};
List<String> list = ArrayUtil.asList(strings);
ArrayUtil.swap(strings, 0, 2);  // ["Cherry", "Banana", "Apple"]
String maxStr = ArrayUtil.max(strings);  // "Cherry"
```

---

## 4 泛型通配符

### 无界通配符 `<?>`

`<?>` 表示未知类型，可以匹配任意类型。

```java
public class Util {
    // 使用无界通配符
    public static void printList(List<?> list) {
        for (Object item : list) {
            System.out.print(item + " ");
        }
        System.out.println();
    }
}

// 使用
List<String> strings = Arrays.asList("A", "B", "C");
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Double> doubles = Arrays.asList(1.1, 2.2, 3.3);

Util.printList(strings);  // A B C
Util.printList(integers);  // 1 2 3
Util.printList(doubles);  // 1.1 2.2 3.3
```

### 上界通配符 `<? extends T>`

`<? extends T>` 表示 T 或 T 的子类，用于读取数据。

```java
public class NumberUtil {
    // 只接受 Number 或 Number 的子类
    public static double sum(List<? extends Number> list) {
        double sum = 0;
        for (Number num : list) {
            sum += num.doubleValue();
        }
        return sum;
    }
}

// 使用
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Double> doubles = Arrays.asList(1.1, 2.2, 3.3);
List<Number> numbers = Arrays.asList(1, 2.2, 3);

System.out.println(NumberUtil.sum(integers));  // 6.0
System.out.println(NumberUtil.sum(doubles));  // 6.6
System.out.println(NumberUtil.sum(numbers));  // 6.2
```

### 下界通配符 `<? super T>`

`<? super T>` 表示 T 或 T 的父类，用于写入数据。

```java
public class ListUtil {
    // 只接受 Integer 或 Integer 的父类
    public static void addNumbers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
    }
}

// 使用
List<Integer> integers = new ArrayList<>();
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

ListUtil.addNumbers(integers);  // [1, 2, 3]
ListUtil.addNumbers(numbers);  // [1, 2, 3]
ListUtil.addNumbers(objects);  // [1, 2, 3]
```

### PECS 原则

PECS（Producer Extends, Consumer Super）是泛型通配符的使用原则：

- **Producer（生产者）**：如果只读取数据，使用 `<? extends T>`
- **Consumer（消费者）**：如果只写入数据，使用 `<? super T>`
- **既读又写**：不使用通配符，使用确定的类型参数

```java
public class CollectionUtil {
    // 从 source 读取（Producer），使用 extends
    // 向 dest 写入（Consumer），使用 super
    public static <T> void copy(List<? extends T> source, List<? super T> dest) {
        for (T item : source) {
            dest.add(item);
        }
    }
}

// 使用
List<Integer> source = Arrays.asList(1, 2, 3);
List<Number> dest = new ArrayList<>();
CollectionUtil.copy(source, dest);  // dest: [1, 2, 3]
```

---

## 5 类型限制

### 限制类型参数

可以使用 `extends` 关键字限制类型参数的上界。

```java
// T 必须是 Number 或 Number 的子类
public class Calculator<T extends Number> {
    private T value;
    
    public Calculator(T value) {
        this.value = value;
    }
    
    public double doubleValue() {
        return value.doubleValue();
    }
}

// 使用
Calculator<Integer> intCalc = new Calculator<>(100);  // ✓
Calculator<Double> doubleCalc = new Calculator<>(3.14);  // ✓
// Calculator<String> stringCalc = new Calculator<>("Hello");  // ❌ 编译错误
```

### 多个限制

可以限制类型参数实现多个接口。

```java
// T 必须同时实现 Comparable 和 Serializable
public class SortableData<T extends Comparable<T> & Serializable> {
    private T data;
    
    public SortableData(T data) {
        this.data = data;
    }
    
    public int compareTo(SortableData<T> other) {
        return this.data.compareTo(other.data);
    }
}
```

---

## 6 类型擦除

### 什么是类型擦除？

类型擦除是 Java 泛型的实现机制。在编译时，编译器会擦除所有类型参数信息，将它们替换为它们的上界（如果没有指定上界，则替换为 `Object`）。

```java
// 编译前
public class Box<T> {
    private T content;
    
    public T getContent() {
        return content;
    }
}

// 编译后（类型擦除）
public class Box {
    private Object content;  // T 被替换为 Object
    
    public Object getContent() {
        return content;
    }
}
```

### 类型擦除的影响

#### 1. 不能使用基本类型

```java
// ❌ 错误：不能使用基本类型
Box<int> intBox = new Box<>();  // 编译错误

// ✅ 正确：使用包装类
Box<Integer> intBox = new Box<>();
```

#### 2. 不能创建泛型类型的实例

```java
public class Box<T> {
    // ❌ 错误：不能创建泛型类型的实例
    public Box() {
        content = new T();  // 编译错误
    }
    
    // ✅ 正确：使用反射或工厂方法
    public Box(Class<T> clazz) {
        try {
            content = clazz.newInstance();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

#### 3. 不能创建泛型数组

```java
// ❌ 错误：不能创建泛型数组
T[] array = new T[10];  // 编译错误

// ✅ 正确：使用 Object 数组或 ArrayList
Object[] array = new Object[10];
List<T> list = new ArrayList<>();
```

#### 4. 不能进行 instanceof 检查

```java
// ❌ 错误：不能使用 instanceof 检查泛型类型
if (obj instanceof Box<String>) {  // 编译错误
    // ...
}

// ✅ 正确：使用无界通配符
if (obj instanceof Box<?>) {
    // ...
}
```

#### 5. 泛型类的静态成员不能使用类的类型参数

```java
public class Box<T> {
    // ❌ 错误：静态成员不能使用类的类型参数
    private static T staticField;  // 编译错误
    
    // ✅ 正确：静态方法可以有自己的类型参数
    public static <U> void staticMethod(U param) {
        // ...
    }
}
```

---

## 7 泛型的实际应用

### 1. 集合框架

Java 集合框架大量使用泛型。

```java
// List、Set、Map 都是泛型类
List<String> list = new ArrayList<>();
Set<Integer> set = new HashSet<>();
Map<String, Integer> map = new HashMap<>();

// 类型安全
list.add("Hello");
// list.add(100);  // ❌ 编译错误

String str = list.get(0);  // 不需要强制类型转换
```

### 2. 自定义数据结构

```java
// 泛型链表节点
public class Node<T> {
    private T data;
    private Node<T> next;
    
    public Node(T data) {
        this.data = data;
    }
    
    // getter 和 setter 省略
}

// 泛型栈
public class Stack<T> {
    private Node<T> top;
    
    public void push(T data) {
        Node<T> newNode = new Node<>(data);
        newNode.next = top;
        top = newNode;
    }
    
    public T pop() {
        if (top == null) {
            throw new EmptyStackException();
        }
        T data = top.data;
        top = top.next;
        return data;
    }
}
```

### 3. 通用的工具类

```java
// 通用的转换器
public class Converter<T, U> {
    private Function<T, U> converter;
    
    public Converter(Function<T, U> converter) {
        this.converter = converter;
    }
    
    public U convert(T input) {
        return converter.apply(input);
    }
}

// 使用
Converter<String, Integer> stringToInt = new Converter<>(Integer::parseInt);
Integer num = stringToInt.convert("123");  // 123

Converter<Integer, String> intToString = new Converter<>(String::valueOf);
String str = intToString.convert(456);  // "456"
```

---

## 8 新手常见误区

### 误区 1：认为泛型类型可以不同

**错！** 泛型类型在编译时是严格检查的。

```java
// ❌ 错误：认为 List<String> 和 List<Object> 可以互相赋值
List<String> strings = new ArrayList<>();
List<Object> objects = strings;  // ❌ 编译错误

// ✅ 正确：使用通配符
List<? extends Object> objects = strings;  // ✓
```

### 误区 2：认为类型擦除后泛型没有意义

**注意！** 虽然类型信息在运行时被擦除，但编译时的类型检查仍然有效。

```java
// 编译时的类型检查
List<String> strings = new ArrayList<>();
// strings.add(100);  // ❌ 编译错误

// 运行时的类型擦除
System.out.println(strings.getClass() == new ArrayList<Integer>().getClass());
// true（运行时类型相同）
```

### 误区 3：混淆泛型方法和泛型类

**注意！** 泛型方法的类型参数是独立的，与类的类型参数无关。

```java
public class Box<T> {
    // 泛型类的方法
    public T get() {
        return null;
    }
    
    // 泛型方法：有自己的类型参数 U
    public <U> U process(U item) {
        return item;
    }
}

// 使用
Box<String> box = new Box<>();
String str = box.get();  // 使用类的类型参数 T

Integer num = box.process(100);  // 使用方法的类型参数 U
String text = box.process("Hello");  // U 可以是任意类型
```

### 误区 4：滥用通配符

**注意！** 通配符应该谨慎使用，遵循 PECS 原则。

```java
// ❌ 错误：滥用通配符
public void process(List<?> list) {
    // list.add(new Object());  // ❌ 编译错误：不能添加元素
    Object item = list.get(0);  // ✓ 可以读取
}

// ✅ 正确：遵循 PECS 原则
public <T> void copy(List<? extends T> source, List<? super T> dest) {
    for (T item : source) {
        dest.add(item);
    }
}
```

### 误区 5：认为泛型可以限制运行时类型

**注意！** 泛型只在编译时有效，运行时类型会被擦除。

```java
List<String> strings = new ArrayList<>();
List<Integer> integers = new ArrayList<>();

// 运行时类型相同
System.out.println(strings.getClass() == integers.getClass());
// true（都是 ArrayList）

// 不能进行 instanceof 检查
// if (strings instanceof List<String>) {  // ❌ 编译错误
//     // ...
// }
```

---

## 9 动手练习

### 练习 1：基础练习 —— 泛型盒子

创建一个泛型类 `Box<T>`，可以存储任意类型的对象，并提供 `get()` 和 `set()` 方法。

<details>
<summary>点击查看答案</summary>

```java
public class Box<T> {
    private T content;
    
    public Box() {
    }
    
    public Box(T content) {
        this.content = content;
    }
    
    public T getContent() {
        return content;
    }
    
    public void setContent(T content) {
        this.content = content;
    }
    
    @Override
    public String toString() {
        return "Box{" + content + "}";
    }
    
    public static void main(String[] args) {
        Box<String> stringBox = new Box<>("Hello");
        System.out.println(stringBox.getContent());  // Hello
        
        Box<Integer> intBox = new Box<>(100);
        System.out.println(intBox.getContent());  // 100
    }
}
```

</details>

### 练习 2：进阶练习 —— 泛型工具类

创建一个泛型工具类 `ArrayUtil`，包含以下方法：
1. `printArray(T[] array)`：打印数组元素
2. `findMax(T[] array)`：查找数组中的最大值（要求 T 实现 Comparable）

<details>
<summary>点击查看答案</summary>

```java
public class ArrayUtil {
    // 打印数组
    public static <T> void printArray(T[] array) {
        for (T item : array) {
            System.out.print(item + " ");
        }
        System.out.println();
    }
    
    // 查找最大值
    public static <T extends Comparable<T>> T findMax(T[] array) {
        if (array == null || array.length == 0) {
            throw new IllegalArgumentException("Array is empty");
        }
        
        T max = array[0];
        for (T item : array) {
            if (item.compareTo(max) > 0) {
                max = item;
            }
        }
        return max;
    }
    
    public static void main(String[] args) {
        Integer[] integers = {3, 1, 4, 1, 5, 9};
        String[] strings = {"Apple", "Banana", "Cherry"};
        
        printArray(integers);  // 3 1 4 1 5 9
        printArray(strings);  // Apple Banana Cherry
        
        System.out.println("Max integer: " + findMax(integers));  // 9
        System.out.println("Max string: " + findMax(strings));  // Cherry
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 泛型缓存

创建一个泛型缓存类 `Cache<K, V>`，支持以下操作：
1. `put(K key, V value)`：添加键值对
2. `get(K key)`：获取值
3. `remove(K key)`：删除键值对
4. `size()`：获取缓存大小

<details>
<summary>点击查看答案</summary>

```java
import java.util.HashMap;
import java.util.Map;

public class Cache<K, V> {
    private Map<K, V> cache = new HashMap<>();
    
    public void put(K key, V value) {
        cache.put(key, value);
    }
    
    public V get(K key) {
        return cache.get(key);
    }
    
    public void remove(K key) {
        cache.remove(key);
    }
    
    public int size() {
        return cache.size();
    }
    
    public static void main(String[] args) {
        Cache<String, Integer> cache = new Cache<>();
        
        cache.put("Alice", 25);
        cache.put("Bob", 30);
        cache.put("Charlie", 35);
        
        System.out.println("Alice's age: " + cache.get("Alice"));  // 25
        System.out.println("Cache size: " + cache.size());  // 3
        
        cache.remove("Bob");
        System.out.println("Cache size: " + cache.size());  // 2
    }
}
```

</details>

---

## 10 核心知识点

| 知识点 | 说明 |
|--------|------|
| 泛型类 | 在类定义时声明类型参数，如 `Box<T>` |
| 泛型方法 | 在方法定义时声明类型参数，如 `<T> void print(T item)` |
| 无界通配符 | `<?>` 表示未知类型，可以匹配任意类型 |
| 上界通配符 | `<? extends T>` 表示 T 或 T 的子类，用于读取 |
| 下界通配符 | `<? super T>` 表示 T 或 T 的父类，用于写入 |
| PECS 原则 | Producer Extends, Consumer Super |
| 类型擦除 | 编译时擦除类型信息，运行时都是 Object |
| 类型限制 | 使用 `extends` 限制类型参数的上界 |

---

## 下一章预告

下一章我们会学习 **继承与多态**——面向对象的核心特性。你会学到 extends、方法重写 override、多态、super 关键字、抽象类和接口。

---

## 本章小结

泛型是 Java 中重要的特性，让类型检查从运行时提前到编译时。泛型类和泛型方法可以处理任意类型的数据。通配符 `?`、`? extends T`、`? super T` 提供了更灵活的类型匹配。类型擦除是泛型的实现机制，在编译时擦除类型信息。遵循 PECS 原则可以正确使用通配符。接下来我们将学习继承与多态。
