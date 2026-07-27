---
title: "第三章：泛型原理"
description: "类型擦除、泛型推断、通配符机制、桥接方法"
---

# 第三章：泛型原理

## 本章导读

欢迎来到第三章！在前一章中，我们深入了解了面向对象的底层原理。本章将揭开 Java 泛型的神秘面纱，探索其背后的类型擦除机制。

**本章你将学到：**
- 为什么需要泛型（类型安全、消除强制转换）
- 类型擦除原理（编译后泛型信息丢失、Object 替代、桥接方法生成）
- 泛型推断机制
- 通配符：extends vs super（PECS 原则）
- 泛型的限制及其原因（不能用基本类型、不能创建泛型数组等）
- 使用 javap 验证类型擦除

**生活化类比：**
想象泛型就像一个带标签的收纳盒。买的时候（编译时）标签上写着"袜子"，你就知道里面装的是袜子。但到了晚上（运行时），标签被撕掉了，收纳盒看起来和其他盒子一样。虽然你知道里面应该是袜子，但盒子本身已经不记得了。这就是类型擦除——编译时有类型信息，运行时丢失。

---

## 1 为什么需要泛型？

### 3.1.1 没有泛型的日子

在 Java 5 之前，没有泛型机制。让我们看看那时候的代码有多痛苦：

```java
// Java 5 之前的代码（没有泛型）
public class GenericHistory {
    public static void main(String[] args) {
        // 使用原始集合（Raw Type）
        List list = new ArrayList();
        
        // 可以添加任何类型的对象
        list.add("Hello");
        list.add(123);
        list.add(new Date());
        
        // 取出时需要强制类型转换
        String str = (String) list.get(0);
        Integer num = (Integer) list.get(1);
        
        // 运行时错误！ClassCastException
        // String wrong = (String) list.get(1);  // 编译通过，运行时报错
    }
}
```

**问题分析：**
1. **类型不安全**：可以往集合里放任何类型的对象
2. **需要强制转换**：每次取出对象都要手动转换
3. **运行时错误**：类型错误在编译时检查不出来，运行时才崩溃

### 3.1.2 有了泛型之后

```java
// Java 5 之后的代码（使用泛型）
public class GenericModern {
    public static void main(String[] args) {
        // 使用泛型集合
        List<String> list = new ArrayList<>();
        
        // 只能添加 String 类型
        list.add("Hello");
        list.add("World");
        // list.add(123);  // 编译错误！类型安全
        
        // 不需要强制转换
        String str = list.get(0);
        System.out.println(str);
        
        // 编译时就能发现类型错误
        // String wrong = list.get(1);  // 如果放错了，编译时就报错
    }
}
```

**泛型带来的好处：**
1. **类型安全**：编译时检查类型错误
2. **消除强制转换**：代码更简洁
3. **代码复用**：一份代码适用于多种类型

### 3.1.3 泛型的三个核心优势

**优势一：类型安全**
```java
// 没有泛型：运行时崩溃
List list = new ArrayList();
list.add(123);
String str = (String) list.get(0);  // 运行时 ClassCastException

// 有泛型：编译时报错
List<Integer> list = new ArrayList<>();
list.add(123);
// String str = list.get(0);  // 编译错误，提前发现问题
```

**优势二：消除强制转换**
```java
// 没有泛型
List list = new ArrayList();
list.add("Hello");
String str = (String) list.get(0);  // 需要强制转换

// 有泛型
List<String> list = new ArrayList<>();
list.add("Hello");
String str = list.get(0);  // 不需要强制转换
```

**优势三：代码复用**
```java
// 没有泛型：需要为每种类型写一个类
class StringStack {
    private String[] data;
    public void push(String item) { }
    public String pop() { }
}

class IntegerStack {
    private Integer[] data;
    public void push(Integer item) { }
    public Integer pop() { }
}

// 有泛型：一个类适用于所有类型
class Stack<T> {
    private T[] data;
    public void push(T item) { }
    public T pop() { }
}

// 使用
Stack<String> stringStack = new Stack<>();
Stack<Integer> intStack = new Stack<>();
```

---

## 2 核心原理

### 3.2.1 类型擦除（Type Erasure）

**什么是类型擦除？**

类型擦除是 Java 泛型的核心机制。简单来说：
- 编译时：检查泛型类型
- 编译后：擦除泛型信息，用 Object 或上界替代
- 运行时：没有泛型信息

**生活化类比：**
想象你买了一瓶红酒（泛型类型），酒瓶上贴着标签"红酒"。但到了晚上（运行时），标签被撕掉了，瓶子里的液体看起来和其他饮料一样。虽然你知道它是红酒，但瓶子本身已经不记得了。

**类型擦除的规则：**

| 泛型类型 | 擦除后类型 | 说明 |
|---------|-----------|------|
| `List<T>` | `List` | 无界类型擦除为 Object |
| `List<String>` | `List` | 具体类型擦除为 Object |
| `List<? extends Number>` | `List<Number>` | 有上界擦除为上界 |
| `List<? super Integer>` | `List` | 有下界擦除为 Object |

**代码示例：验证类型擦除**
```java
public class TypeErasureDemo {
    public static void main(String[] args) {
        List<String> stringList = new ArrayList<>();
        List<Integer> intList = new ArrayList<>();
        
        // 编译时：类型不同
        // stringList.add("Hello");
        // intList.add(123);
        
        // 运行时：类型相同
        System.out.println(stringList.getClass() == intList.getClass());
        // 输出：true
        
        // 都是 java.util.ArrayList
        System.out.println(stringList.getClass().getName());
        // 输出：java.util.ArrayList
    }
}
```

**使用 javap 验证类型擦除：**

```java
// 源代码
public class GenericClass<T> {
    private T value;
    
    public T getValue() {
        return value;
    }
    
    public void setValue(T value) {
        this.value = value;
    }
}
```

```bash
# 编译
javac GenericClass.java

# 查看字节码
javap -v GenericClass.class
```

**字节码输出（关键部分）：**
```
// 字段签名
private java.lang.Object value;
  descriptor: Ljava/lang/Object;  // 注意：这里是 Object，不是 T
  Signature: #13                  // LTValue;

// 方法签名
public java.lang.Object getValue();
  descriptor: ()Ljava/lang/Object;  // 返回 Object，不是 T
  Signature: #15                    // ()LTValue;

public void setValue(java.lang.Object);
  descriptor: (Ljava/lang/Object;)V  // 参数是 Object，不是 T
  Signature: #17                     // (LTValue;)V
```

**关键点：**
- 字节码中，T 被替换为 Object
- Signature 属性保留了泛型信息（用于反射）
- 运行时无法直接获取泛型类型参数

### 3.2.2 桥接方法（Bridge Method）

**什么是桥接方法？**

当子类重写父类的泛型方法时，编译器会自动生成桥接方法，确保多态正常工作。

**生活化类比：**
想象父子俩都开公司。父亲公司招"员工"（泛型），儿子改成了只招"程序员"。但为了兼容，儿子公司门口还挂了个牌子"招员工"，实际上进来后都安排做程序员。这个"招员工"的牌子就是桥接方法。

**代码示例：**
```java
// 父类
public class Node<T> {
    private T value;
    
    public void setValue(T value) {
        this.value = value;
    }
    
    public T getValue() {
        return value;
    }
}

// 子类
public class StringNode extends Node<String> {
    @Override
    public void setValue(String value) {
        super.setValue(value);
    }
}
```

**使用 javap 查看桥接方法：**
```bash
javap -v StringNode.class
```

**字节码输出：**
```
// 子类重写的方法
public void setValue(java.lang.String);
  descriptor: (Ljava/lang/String;)V
  Signature: #12                  // (Ljava/lang/String;)V
  
// 编译器生成的桥接方法
public void setValue(java.lang.Object);
  descriptor: (Ljava/lang/Object;)V
  flags: ACC_PUBLIC, ACC_BRIDGE, ACC_SYNTHETIC  // 注意这些标志
  
  Code:
     0: aload_0
     1: aload_1
     2: checkcast     #2    // 类型检查：转换为 String
     5: invokevirtual #3    // 调用 setValue(String)
     8: return
```

**关键点：**
- 桥接方法由编译器自动生成
- 标志包含 `ACC_BRIDGE` 和 `ACC_SYNTHETIC`
- 桥接方法内部调用实际的重写方法
- 确保多态调用时类型正确

### 3.2.3 泛型推断机制

**什么是泛型推断？**

编译器根据上下文自动推断泛型类型，不需要显式指定。

**代码示例：**
```java
public class TypeInferenceDemo {
    // 泛型方法
    public static <T> void print(T value) {
        System.out.println(value);
    }
    
    // 泛型方法返回值
    public static <T> List<T> emptyList() {
        return new ArrayList<>();
    }
    
    public static void main(String[] args) {
        // 类型推断
        print("Hello");     // T 推断为 String
        print(123);         // T 推断为 Integer
        print(3.14);        // T 推断为 Double
        
        // 钻石语法（Diamond Syntax）
        List<String> list1 = new ArrayList<>();  // 推断为 String
        List<Integer> list2 = new ArrayList<>(); // 推断为 Integer
        
        // 方法返回值推断
        List<String> list3 = emptyList();  // 推断为 String
    }
}
```

**泛型推断的规则：**

1. **从参数推断**
```java
public static <T> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}

// 推断
Integer max1 = max(1, 2);        // T 推断为 Integer
String max2 = max("a", "b");     // T 推断为 String
```

2. **从返回值推断**
```java
public static <T> List<T> singletonList(T item) {
    List<T> list = new ArrayList<>();
    list.add(item);
    return list;
}

// 推断
List<String> list = singletonList("Hello");  // T 推断为 String
```

3. **从类型约束推断**
```java
public static <T extends Comparable<T>> T max(List<T> list) {
    // ...
}

List<String> list = Arrays.asList("a", "b", "c");
String max = max(list);  // T 推断为 String
```

### 3.2.4 通配符机制

**三种通配符：**

| 通配符 | 说明 | 用途 |
|--------|------|------|
| `?` | 无界通配符 | 任意类型 |
| `? extends T` | 上界通配符 | 只读（生产者） |
| `? super T` | 下界通配符 | 只写（消费者） |

**PECS 原则：**
- **Producer Extends**：如果只读取数据，使用 `extends`
- **Consumer Super**：如果只写入数据，使用 `super`

**代码示例：**
```java
public class WildcardDemo {
    // 无界通配符
    public static void printList(List<?> list) {
        for (Object item : list) {
            System.out.println(item);
        }
    }
    
    // 上界通配符（只读）
    public static double sum(List<? extends Number> list) {
        double sum = 0;
        for (Number n : list) {
            sum += n.doubleValue();
        }
        return sum;
    }
    
    // 下界通配符（只写）
    public static void addNumbers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
    }
    
    public static void main(String[] args) {
        // 无界通配符
        List<String> strList = Arrays.asList("a", "b", "c");
        printList(strList);
        
        // 上界通配符
        List<Integer> intList = Arrays.asList(1, 2, 3);
        double sum = sum(intList);
        
        // 下界通配符
        List<Number> numList = new ArrayList<>();
        addNumbers(numList);
    }
}
```

**为什么需要 PECS？**

```java
// 错误示例：没有通配符
public static void addIntegers(List<Number> list) {
    list.add(1);      // 可以
    list.add(2.5);    // 可以，但逻辑错误！
}

// 正确示例：使用下界通配符
public static void addIntegers(List<? super Integer> list) {
    list.add(1);      // 可以
    // list.add(2.5); // 编译错误！只能添加 Integer 或其子类
}

// 正确示例：使用上界通配符
public static double sum(List<? extends Number> list) {
    double sum = 0;
    for (Number n : list) {  // 可以读取为 Number
        sum += n.doubleValue();
    }
    // list.add(1);  // 编译错误！不能添加
    return sum;
}
```

**原理分析：**

```
上界通配符：List<? extends Number>
┌─────────────────────────────────────┐
│ 可以接受的类型：                     │
│ - List<Number>                      │
│ - List<Integer>                     │
│ - List<Double>                      │
│ - List<Float>                       │
│ ...                                 │
├─────────────────────────────────────┤
│ 读取：安全（都是 Number 的子类）     │
│ 写入：不安全（不知道具体类型）       │
└─────────────────────────────────────┘

下界通配符：List<? super Integer>
┌─────────────────────────────────────┐
│ 可以接受的类型：                     │
│ - List<Integer>                     │
│ - List<Number>                      │
│ - List<Object>                      │
├─────────────────────────────────────┤
│ 读取：不安全（可能是 Object）        │
│ 写入：安全（Integer 可以向上转型）   │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### 3.3.1 泛型类

**定义泛型类：**
```java
// 泛型类
public class Box<T> {
    private T item;
    
    public void setItem(T item) {
        this.item = item;
    }
    
    public T getItem() {
        return item;
    }
    
    public static void main(String[] args) {
        // 使用泛型类
        Box<String> stringBox = new Box<>();
        stringBox.setItem("Hello");
        String str = stringBox.getItem();  // 不需要强制转换
        
        Box<Integer> intBox = new Box<>();
        intBox.setItem(123);
        Integer num = intBox.getItem();
    }
}
```

**多类型参数：**
```java
// 多个类型参数
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
    
    public static void main(String[] args) {
        Pair<String, Integer> pair = new Pair<>("Age", 25);
        String key = pair.getKey();
        Integer value = pair.getValue();
    }
}
```

### 3.3.2 泛型方法

**定义泛型方法：**
```java
public class GenericMethodDemo {
    // 泛型方法
    public static <T> void printArray(T[] array) {
        for (T item : array) {
            System.out.print(item + " ");
        }
        System.out.println();
    }
    
    // 带返回值的泛型方法
    public static <T> T getFirst(List<T> list) {
        if (list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }
    
    // 带类型边界的泛型方法
    public static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) > 0 ? a : b;
    }
    
    public static void main(String[] args) {
        // 泛型方法调用
        String[] strArray = {"a", "b", "c"};
        printArray(strArray);
        
        Integer[] intArray = {1, 2, 3};
        printArray(intArray);
        
        // 类型推断
        String max1 = max("a", "b");
        Integer max2 = max(1, 2);
    }
}
```

### 3.3.3 泛型接口

**定义泛型接口：**
```java
// 泛型接口
public interface Comparable<T> {
    int compareTo(T o);
}

// 实现泛型接口
public class Student implements Comparable<Student> {
    private String name;
    private int age;
    
    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    @Override
    public int compareTo(Student other) {
        return this.age - other.age;
    }
    
    public static void main(String[] args) {
        Student s1 = new Student("Alice", 20);
        Student s2 = new Student("Bob", 22);
        
        int result = s1.compareTo(s2);
        System.out.println(result);  // -2
    }
}
```

---

## 4 进阶用法

### 3.4.1 泛型的限制及其原因

**限制一：不能使用基本数据类型**
```java
// 错误：不能使用基本类型
// List<int> list = new ArrayList<>();  // 编译错误

// 正确：使用包装类
List<Integer> list = new ArrayList<>();
```

**原因：**
- 类型擦除后，T 被替换为 Object
- Object 不能存储基本数据类型
- 自动装箱/拆箱机制解决了这个问题

**限制二：不能创建泛型数组**
```java
// 错误：不能创建泛型数组
// T[] array = new T[10];  // 编译错误
// List<T>[] listArray = new List<T>[10];  // 编译错误

// 正确：使用 Object 数组或集合
Object[] array = new Object[10];
List<List<T>> listList = new ArrayList<>();
```

**原因：**
- 数组在运行时需要知道具体类型
- 泛型在运行时被擦除
- 类型系统不兼容

**限制三：不能实例化泛型类型**
```java
// 错误：不能实例化泛型类型
// T obj = new T();  // 编译错误

// 正确：使用反射或工厂方法
public class Factory<T> {
    private Class<T> clazz;
    
    public Factory(Class<T> clazz) {
        this.clazz = clazz;
    }
    
    public T create() throws Exception {
        return clazz.newInstance();
    }
}
```

**原因：**
- 类型擦除后，不知道 T 的具体类型
- 无法确定要创建哪个类的实例

**限制四：不能声明静态泛型字段**
```java
// 错误：不能声明静态泛型字段
public class GenericStatic<T> {
    // private static T value;  // 编译错误
    
    private static Object value;  // 正确
}
```

**原因：**
- 静态字段属于类，不属于实例
- 泛型类型参数在创建实例时确定
- 静态字段在类加载时就存在

**限制五：不能捕获泛型异常**
```java
// 错误：不能捕获泛型异常
// public <T extends Exception> void execute() {
//     try {
//         // ...
//     } catch (T e) {  // 编译错误
//         // ...
//     }
// }

// 正确：捕获具体异常
public void execute() {
    try {
        // ...
    } catch (IOException e) {
        // ...
    }
}
```

**原因：**
- 异常处理在运行时进行
- 泛型在运行时被擦除
- 无法确定具体的异常类型

### 3.4.2 泛型与反射

**通过反射获取泛型信息：**
```java
import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;

public class GenericReflectionDemo {
    private List<String> list;
    
    public static void main(String[] args) throws Exception {
        // 获取字段
        Field field = GenericReflectionDemo.class.getDeclaredField("list");
        
        // 获取泛型类型
        Type type = field.getGenericType();
        
        if (type instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) type;
            
            // 获取原始类型
            System.out.println("Raw type: " + pt.getRawType());
            // 输出：Raw type: interface java.util.List
            
            // 获取类型参数
            Type[] typeArgs = pt.getActualTypeArguments();
            for (Type typeArg : typeArgs) {
                System.out.println("Type argument: " + typeArg);
                // 输出：Type argument: class java.lang.String
            }
        }
    }
}
```

**关键点：**
- 字段的泛型信息通过 Signature 属性保留
- 可以通过反射获取泛型类型参数
- 局部变量的泛型信息在运行时完全丢失

### 3.4.3 泛型与继承

**泛型类的继承：**
```java
// 父类
public class Base<T> {
    protected T value;
    
    public void setValue(T value) {
        this.value = value;
    }
}

// 子类：指定具体类型
public class StringBase extends Base<String> {
    // 继承 setValue(String)
}

// 子类：保持泛型
public class GenericBase<T> extends Base<T> {
    // 继承 setValue(T)
}

// 子类：扩展泛型
public class ExtendedBase<T, U> extends Base<T> {
    private U extra;
    
    public void setExtra(U extra) {
        this.extra = extra;
    }
}
```

**泛型方法的继承：**
```java
public class Parent {
    public <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) > 0 ? a : b;
    }
}

public class Child extends Parent {
    // 可以重写泛型方法
    @Override
    public <T extends Comparable<T>> T max(T a, T b) {
        // 自定义实现
        return a.compareTo(b) > 0 ? a : b;
    }
}
```

---

## 5 核心知识点总结

### 3.5.1 本章核心概念

| 概念 | 说明 | 重要性 |
|------|------|--------|
| **类型擦除** | 编译后擦除泛型信息，用 Object 或上界替代 | ⭐⭐⭐⭐⭐ |
| **桥接方法** | 编译器生成，确保泛型方法重写时多态正常 | ⭐⭐⭐⭐⭐ |
| **泛型推断** | 编译器根据上下文自动推断泛型类型 | ⭐⭐⭐⭐ |
| **通配符** | ?、? extends T、? super T | ⭐⭐⭐⭐⭐ |
| **PECS 原则** | Producer Extends, Consumer Super | ⭐⭐⭐⭐⭐ |
| **泛型限制** | 不能用基本类型、不能创建泛型数组等 | ⭐⭐⭐⭐ |

### 3.5.2 关键要点

1. **类型擦除的本质**
   - 编译时检查泛型类型
   - 编译后擦除泛型信息
   - 运行时没有泛型类型参数
   - Signature 属性保留泛型信息（用于反射）

2. **桥接方法的作用**
   - 确保泛型方法重写时多态正常
   - 由编译器自动生成
   - 标志包含 ACC_BRIDGE 和 ACC_SYNTHETIC
   - 内部调用实际的重写方法

3. **通配符的使用场景**
   - 无界通配符 ?：任意类型
   - 上界通配符 ? extends T：只读（生产者）
   - 下界通配符 ? super T：只写（消费者）

4. **PECS 原则**
   - Producer Extends：只读取数据时使用
   - Consumer Super：只写入数据时使用
   - 保证类型安全

5. **泛型的限制及原因**
   - 不能用基本类型：类型擦除后是 Object
   - 不能创建泛型数组：运行时不知道具体类型
   - 不能实例化泛型类型：类型擦除后不知道创建什么
   - 不能有静态泛型字段：静态属于类，不属于实例
   - 不能捕获泛型异常：异常处理在运行时进行

---

## 6 新手常见误区

### 误区 1：认为运行时可以获取泛类型

**错误理解：** "List<String> 和 List<Integer> 在运行时是不同的类"

**正确理解：** 
- 类型擦除后，泛型信息丢失
- List<String> 和 List<Integer> 在运行时都是 List
- 无法通过 instanceof 判断泛型类型

**实例：**
```java
List<String> strList = new ArrayList<>();
List<Integer> intList = new ArrayList<>();

// 错误理解
// if (strList instanceof List<String>) { }  // 编译错误

// 正确理解
System.out.println(strList.getClass() == intList.getClass());
// 输出：true，运行时类型相同
```

### 误区 2：认为可以创建泛型数组

**错误理解：** "可以创建 T[] array = new T[10]"

**正确理解：** 
- 数组在运行时需要知道具体类型
- 泛型在运行时被擦除
- 无法创建泛型数组

**实例：**
```java
// 错误：不能创建泛型数组
// T[] array = new T[10];  // 编译错误

// 正确：使用 Object 数组
Object[] array = new Object[10];

// 或者使用集合
List<T> list = new ArrayList<>();
```

### 误区 3：混淆 extends 和 super 的使用场景

**错误理解：** "extends 用于写入，super 用于读取"

**正确理解：** 
- extends 用于读取（Producer Extends）
- super 用于写入（Consumer Super）
- 记反了会导致类型不安全

**实例：**
```java
// 错误：用 extends 写入
public static void addToList(List<? extends Number> list) {
    // list.add(1);  // 编译错误！不能写入
}

// 错误：用 super 读取
public static double sum(List<? super Integer> list) {
    // double sum = 0;
    // for (Number n : list) { }  // 编译错误！不能读取为 Number
    // return sum;
}

// 正确：PECS 原则
public static double sum(List<? extends Number> list) {  // 读取
    double sum = 0;
    for (Number n : list) {
        sum += n.doubleValue();
    }
    return sum;
}

public static void addToList(List<? super Integer> list) {  // 写入
    list.add(1);
    list.add(2);
}
```

### 误区 4：认为泛型可以提高运行时性能

**错误理解：** "使用泛型会让程序运行更快"

**正确理解：** 
- 泛型在编译时检查类型
- 类型擦除后，运行时性能与原始类型相同
- 泛型不会提高运行时性能
- 可能因为自动装箱/拆箱略有性能损失

**实例：**
```java
// 泛型集合
List<Integer> list1 = new ArrayList<>();
list1.add(1);  // 自动装箱：int -> Integer
int n1 = list1.get(0);  // 自动拆箱：Integer -> int

// 原始类型
List list2 = new ArrayList();
list2.add(1);  // 自动装箱
int n2 = (Integer) list2.get(0);  // 强制转换 + 自动拆箱

// 性能对比：泛型略有损失（自动装箱/拆箱）
```

### 误区 5：认为泛型方法必须在泛型类中

**错误理解：** "只有泛型类才能定义泛型方法"

**正确理解：** 
- 泛型方法可以独立于泛型类存在
- 普通类也可以有泛型方法
- 泛型方法的类型参数在调用时确定

**实例：**
```java
// 普通类中的泛型方法
public class Utility {
    public static <T> void print(T value) {
        System.out.println(value);
    }
    
    public static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) > 0 ? a : b;
    }
}

// 使用
Utility.print("Hello");
Utility.print(123);
String max = Utility.max("a", "b");
```

---

## 7 动手练习

### 练习 1：验证类型擦除

**任务：**
1. 创建一个泛型类
2. 使用 javap 查看字节码
3. 验证类型擦除现象
4. 分析字节码中的泛型信息

**提示代码：**
```java
public class TypeErasureExercise<T> {
    private T value;
    
    public TypeErasureExercise(T value) {
        this.value = value;
    }
    
    public T getValue() {
        return value;
    }
    
    public void setValue(T value) {
        this.value = value;
    }
    
    public static void main(String[] args) {
        TypeErasureExercise<String> exercise = new TypeErasureExercise<>("Hello");
        String value = exercise.getValue();
        System.out.println(value);
    }
}
```

<details>
<summary>点击查看答案</summary>

**解答步骤：**

1. **编译代码**
```bash
javac TypeErasureExercise.java
```

2. **查看字节码**
```bash
javap -v TypeErasureExercise.class
```

3. **分析字节码**
```
// 字段
private java.lang.Object value;
  descriptor: Ljava/lang/Object;  // 注意：是 Object，不是 T
  Signature: #12                  // LTValue;

// 构造方法
public TypeErasureExercise(java.lang.Object);
  descriptor: (Ljava/lang/Object;)V  // 参数是 Object
  Signature: #14                     // (LTValue;)V

// getValue 方法
public java.lang.Object getValue();
  descriptor: ()Ljava/lang/Object;  // 返回 Object
  Signature: #16                    // ()LTValue;

// setValue 方法
public void setValue(java.lang.Object);
  descriptor: (Ljava/lang/Object;)V  // 参数是 Object
  Signature: #18                     // (LTValue;)V
```

4. **验证运行时类型**
```java
TypeErasureExercise<String> strExercise = new TypeErasureExercise<>("Hello");
TypeErasureExercise<Integer> intExercise = new TypeErasureExercise<>(123);

System.out.println(strExercise.getClass() == intExercise.getClass());
// 输出：true，运行时类型相同
```

5. **关键发现**
- 字节码中 T 被替换为 Object
- Signature 属性保留了泛型信息（用于反射）
- 运行时无法区分 TypeErasureExercise<String> 和 TypeErasureExercise<Integer>

**学习要点：**
- 理解类型擦除的本质
- 掌握字节码分析方法
- 认识泛型信息的保留方式

</details>

### 练习 2：验证桥接方法

**任务：**
1. 创建一个父类和子类，子类重写父类的泛型方法
2. 使用 javap 查看子类的字节码
3. 找到桥接方法并分析其作用
4. 理解桥接方法如何保证多态正常

**提示代码：**
```java
// 父类
public class Parent<T> {
    protected T value;
    
    public void setValue(T value) {
        this.value = value;
    }
    
    public T getValue() {
        return value;
    }
}

// 子类
public class Child extends Parent<String> {
    @Override
    public void setValue(String value) {
        super.setValue(value);
    }
    
    @Override
    public String getValue() {
        return value;
    }
    
    public static void main(String[] args) {
        Parent<String> parent = new Child();
        parent.setValue("Hello");
        String value = parent.getValue();
        System.out.println(value);
    }
}
```

<details>
<summary>点击查看答案</summary>

**解答步骤：**

1. **编译代码**
```bash
javac Parent.java Child.java
```

2. **查看 Child 类的字节码**
```bash
javap -v Child.class
```

3. **分析字节码**
```
// 子类重写的方法
public void setValue(java.lang.String);
  descriptor: (Ljava/lang/String;)V
  Signature: #15                  // (Ljava/lang/String;)V
  
// 编译器生成的桥接方法
public void setValue(java.lang.Object);
  descriptor: (Ljava/lang/Object;)V
  flags: ACC_PUBLIC, ACC_BRIDGE, ACC_SYNTHETIC
  
  Code:
     0: aload_0
     1: aload_1
     2: checkcast     #2    // 类型检查：转换为 String
     5: invokevirtual #3    // 调用 setValue(String)
     8: return

// 子类重写的方法
public java.lang.String getValue();
  descriptor: ()Ljava/lang/String;
  Signature: #17                  // ()Ljava/lang/String;

// 编译器生成的桥接方法
public java.lang.Object getValue();
  descriptor: ()Ljava/lang/Object;
  flags: ACC_PUBLIC, ACC_BRIDGE, ACC_SYNTHETIC
  
  Code:
     0: aload_0
     1: invokevirtual #4    // 调用 getValue()String
     4: areturn
```

4. **关键发现**
- 编译器生成了两个桥接方法
- setValue(Object) 桥接方法内部调用 setValue(String)
- getValue()Object 桥接方法内部调用 getValue()String
- 桥接方法标志包含 ACC_BRIDGE 和 ACC_SYNTHETIC

5. **理解桥接方法的作用**
```java
Parent<String> parent = new Child();
parent.setValue("Hello");  // 调用 setValue(Object)，桥接到 setValue(String)
String value = parent.getValue();  // 调用 getValue()Object，桥接到 getValue()String
```

**学习要点：**
- 理解桥接方法的生成原因
- 掌握桥接方法的字节码特征
- 认识桥接方法如何保证多态正常

</details>

### 练习 3：实践 PECS 原则

**任务：**
1. 创建一个方法，使用上界通配符读取数据
2. 创建一个方法，使用下界通配符写入数据
3. 验证 PECS 原则
4. 分析为什么不能违反 PECS 原则

**提示代码：**
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class PECSDemo {
    // 生产者：使用 extends，只读
    public static double sum(List<? extends Number> list) {
        double sum = 0;
        for (Number n : list) {
            sum += n.doubleValue();
        }
        return sum;
    }
    
    // 消费者：使用 super，只写
    public static void addIntegers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
    }
    
    public static void main(String[] args) {
        // 测试生产者
        List<Integer> intList = Arrays.asList(1, 2, 3);
        List<Double> doubleList = Arrays.asList(1.5, 2.5, 3.5);
        
        System.out.println("Integer sum: " + sum(intList));
        System.out.println("Double sum: " + sum(doubleList));
        
        // 测试消费者
        List<Number> numList = new ArrayList<>();
        addIntegers(numList);
        System.out.println("Number list: " + numList);
    }
}
```

<details>
<summary>点击查看答案</summary>

**解答步骤：**

1. **运行代码**
```bash
javac PECSDemo.java
java PECSDemo
```

**输出：**
```
Integer sum: 6.0
Double sum: 7.5
Number list: [1, 2, 3]
```

2. **验证上界通配符（只读）**
```java
// 正确：读取数据
public static double sum(List<? extends Number> list) {
    double sum = 0;
    for (Number n : list) {  // 可以读取为 Number
        sum += n.doubleValue();
    }
    return sum;
}

// 错误：尝试写入
public static void testExtends(List<? extends Number> list) {
    // list.add(1);  // 编译错误！不能写入
    // list.add(1.5);  // 编译错误！不能写入
}
```

**原因分析：**
- `List<? extends Number>` 可能是 List<Integer>、List<Double> 等
- 如果允许添加 Integer，但实际是 List<Double>，类型不安全
- 所以编译器禁止写入

3. **验证下界通配符（只写）**
```java
// 正确：写入数据
public static void addIntegers(List<? super Integer> list) {
    list.add(1);  // 可以添加 Integer
    list.add(2);
    list.add(3);
}

// 错误：尝试读取
public static void testSuper(List<? super Integer> list) {
    // Integer n = list.get(0);  // 编译错误！不能读取为 Integer
    // Number n = list.get(0);  // 编译错误！不能读取为 Number
    Object o = list.get(0);  // 只能读取为 Object
}
```

**原因分析：**
- `List<? super Integer>` 可能是 List<Integer>、List<Number>、List<Object>
- 如果读取为 Integer，但实际是 List<Object>，类型不安全
- 所以编译器限制只能读取为 Object

4. **PECS 原则总结**
- Producer Extends：只读，保证读取类型安全
- Consumer Super：只写，保证写入类型安全
- 违反原则会导致编译错误

**学习要点：**
- 理解 PECS 原则的原理
- 掌握通配符的使用场景
- 认识类型安全的重要性

</details>

---

## 下一章预告

在第四章《反射原理》中，我们将探索 Java 反射机制的底层实现：

- 什么是反射？（运行时获取类信息、操作对象）
- Class 对象的由来（类加载时 JVM 自动创建）
- 反射的底层 API（Class、Field、Method、Constructor）
- 反射的性能开销及优化（setAccessible、缓存 Method）
- 运行时类型识别（RTTI）与 instanceof 原理
- 反射在框架中的应用（Spring IoC、JSON 序列化）

**剧透：** 你将学会通过反射调用私有方法，理解 Spring 是如何在运行时创建和管理 Bean 的！

敬请期待！🚀
