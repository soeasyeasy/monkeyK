---
title: '第七章：字符串处理'
description: 'String 深入、StringBuilder、字符串格式化、常用方法'
---

# 第七章：字符串处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- String 为什么是不可变的？这有什么好处？
- 字符串拼接用 `+` 还是 StringBuilder？性能差别大吗？
- 字符串常量池是什么？有什么用？
- 怎么高效地格式化字符串？
- String 有哪些常用的方法？

这一章就是为了解答这些问题。我们会先理解 **String 的不可变性**，再学习字符串常量池、StringBuilder，最后掌握字符串的常用方法和格式化技巧。学完这章，你就能高效地处理字符串了。

---

## 1 为什么需要深入理解字符串？

### 痛点分析

想象你要拼接 1000 个字符串，如果直接用 `+` 拼接：

```java
String result = "";
for (int i = 0; i < 1000; i++) {
    result += "hello";  // 每次都会创建新对象
}
```

这段代码看起来没问题，但性能极差！因为每次 `+=` 都会创建一个新的 String 对象，产生 1000 个临时对象，浪费内存和时间。

**生活类比**：字符串就像刻在石头上的字——一旦刻上去就不能修改。如果你想"修改"，只能重新刻一块石头。这就是 String 的不可变性。

### 解决方案

```java
// ✅ 使用 StringBuilder：高效拼接
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append("hello");  // 在同一个对象上修改
}
String result = sb.toString();
```

> **一句话总结**：String 适合少量操作，StringBuilder 适合大量拼接。

---

## 2 String 的不可变性

### 什么是不可变？

String 对象一旦创建，其内容就不能修改。所有看起来"修改"字符串的操作，实际上都是创建新字符串。

```java
String s = "Hello";
s = s + " World";  // 不是修改原字符串，而是创建新字符串

// 内存中发生了什么？
// 1. 创建 "Hello"
// 2. 创建 " World"
// 3. 创建 "Hello World"（新对象）
// 4. s 指向新对象
// 5. 原来的 "Hello" 成为垃圾对象，等待回收
```

### 为什么设计成不可变？

| 优点 | 说明 |
|------|------|
| **线程安全** | 不可变对象天然线程安全，多个线程可以共享同一个 String 对象 |
| **缓存友好** | String 的 hashCode 可以缓存，适合作为 HashMap 的 key |
| **字符串常量池** | 相同内容的字符串可以共享，节省内存 |
| **安全性** | 作为参数传递时不会被意外修改（如网络连接、数据库连接） |

### 字符串常量池

字符串常量池是 JVM 中的一块特殊内存，用于存储字符串字面量。

```java
String s1 = "hello";  // 从常量池获取（或创建）
String s2 = "hello";  // 直接从常量池获取（同一个对象）
String s3 = new String("hello");  // 在堆中创建新对象

System.out.println(s1 == s2);  // true（同一个对象）
System.out.println(s1 == s3);  // false（不同对象）
System.out.println(s1.equals(s3));  // true（内容相同）
```

**内存示意图**：

```
字符串常量池：
┌─────────┐
│ "hello" │ ← s1、s2 指向这里
└─────────┘

堆内存：
┌─────────┐
│ "hello" │ ← s3 指向这里（新对象）
└─────────┘
```

### intern() 方法

`intern()` 方法会尝试将字符串放入常量池，如果池中已存在相同内容的字符串，则返回池中的引用。

```java
String s1 = new String("hello");
String s2 = s1.intern();  // 尝试放入常量池
String s3 = "hello";      // 从常量池获取

System.out.println(s1 == s2);  // false（s1 是堆中的对象）
System.out.println(s2 == s3);  // true（都指向常量池中的对象）
```

---

## 3 String 常用方法

### 字符串查找

```java
String str = "Hello World";

// 获取长度
int len = str.length();  // 11

// 查找字符位置
int pos1 = str.indexOf('o');      // 4（第一个 'o' 的位置）
int pos2 = str.lastIndexOf('o');  // 7（最后一个 'o' 的位置）

// 查找子串
int pos3 = str.indexOf("World");  // 6（"World" 的起始位置）
int pos4 = str.indexOf("Java");   // -1（不存在返回 -1）

// 判断是否包含
boolean has = str.contains("World");  // true
boolean starts = str.startsWith("Hello");  // true
boolean ends = str.endsWith("World");  // true
```

### 字符串截取

```java
String str = "Hello World";

// 从指定位置截取到末尾
String sub1 = str.substring(6);  // "World"

// 截取指定范围（起始索引，结束索引）
String sub2 = str.substring(0, 5);  // "Hello"（不包含结束索引）
```

### 字符串比较

```java
String s1 = "Hello";
String s2 = "hello";
String s3 = "Hello";

// 比较内容（区分大小写）
System.out.println(s1.equals(s2));      // false
System.out.println(s1.equals(s3));      // true

// 比较内容（不区分大小写）
System.out.println(s1.equalsIgnoreCase(s2));  // true

// 比较字典序
System.out.println(s1.compareTo(s2));   // 32（'H' - 'h' = 72 - 104 = -32）
System.out.println(s1.compareTo(s3));   // 0（相等）
```

### 字符串替换

```java
String str = "Hello World";

// 替换字符
String s1 = str.replace('o', '0');  // "Hell0 W0rld"

// 替换字符串
String s2 = str.replace("World", "Java");  // "Hello Java"

// 替换第一个匹配
String s3 = str.replaceFirst("o", "0");  // "Hell0 World"

// 正则替换
String s4 = str.replaceAll("[aeiou]", "*");  // "H*ll* W*rld"
```

### 字符串分割

```java
String str = "apple,banana,orange";

// 按指定分隔符分割
String[] parts = str.split(",");
// ["apple", "banana", "orange"]

// 限制分割次数
String[] parts2 = str.split(",", 2);
// ["apple", "banana,orange"]

// 注意：特殊字符需要转义
String csv = "a.b.c";
String[] dots = csv.split("\\.");  // ["a", "b", "c"]
```

### 大小写转换

```java
String str = "Hello World";

String upper = str.toUpperCase();  // "HELLO WORLD"
String lower = str.toLowerCase();  // "hello world"
```

### 去除空白

```java
String str = "  Hello World  ";

// 去除首尾空白
String trimmed = str.trim();  // "Hello World"

// Java 11+：去除开头空白
String strippedStart = str.stripLeading();  // "Hello World  "

// Java 11+：去除结尾空白
String strippedEnd = str.stripTrailing();  // "  Hello World"

// Java 11+：去除首尾空白（支持 Unicode 空白）
String stripped = str.strip();  // "Hello World"
```

### 其他常用方法

```java
String str = "Hello";

// 转为字符数组
char[] chars = str.toCharArray();  // ['H', 'e', 'l', 'l', 'o']

// 获取指定位置的字符
char c = str.charAt(1);  // 'e'

// 判断是否为空
boolean empty = "".isEmpty();  // true
boolean blank = "  ".isBlank();  // true（Java 11+，全空白返回 true）

// 重复字符串（Java 11+）
String repeated = "Ha".repeat(3);  // "HaHaHa"

// 字符串连接（Java 8+）
String joined = String.join("-", "2024", "01", "15");  // "2024-01-15"
```

---

## 4 StringBuilder 和 StringBuffer

### 为什么需要 StringBuilder？

String 是不可变的，每次修改都会创建新对象。如果需要频繁修改字符串，应该使用 StringBuilder。

```java
// ❌ 低效：使用 String 拼接
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i;  // 每次创建新对象
}

// ✅ 高效：使用 StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);  // 在同一个对象上修改
}
String result = sb.toString();
```

### StringBuilder vs StringBuffer

| 特性 | StringBuilder | StringBuffer |
|------|---------------|--------------|
| 线程安全 | ❌ 不安全 | ✅ 安全（方法同步） |
| 性能 | 快 | 慢（同步开销） |
| 使用场景 | 单线程环境 | 多线程环境 |
| 推荐度 | ⭐⭐⭐⭐⭐ 优先使用 | ⭐⭐ 除非需要线程安全 |

### StringBuilder 常用方法

```java
StringBuilder sb = new StringBuilder();

// 追加
sb.append("Hello");
sb.append(" ");
sb.append("World");
// "Hello World"

// 插入
sb.insert(5, " Java");  // "Hello Java World"

// 删除
sb.delete(5, 10);  // "Hello World"（删除索引 5-9）

// 替换
sb.replace(6, 11, "Java");  // "Hello Java"

// 反转
sb.reverse();  // "avaJ olleH"

// 获取长度
int len = sb.length();  // 11

// 转为 String
String str = sb.toString();  // "avaJ olleH"
```

### StringBuilder 的容量

```java
// 默认容量 16
StringBuilder sb1 = new StringBuilder();
System.out.println(sb1.capacity());  // 16

// 指定初始容量
StringBuilder sb2 = new StringBuilder(100);
System.out.println(sb2.capacity());  // 100

// 从字符串创建
StringBuilder sb3 = new StringBuilder("Hello");
System.out.println(sb3.capacity());  // 21（5 + 16）

// 确保容量
sb3.ensureCapacity(50);  // 如果当前容量小于 50，则扩容
```

---

## 5 字符串格式化

### String.format()

```java
// 基本格式化
String s1 = String.format("姓名：%s，年龄：%d", "张三", 25);
// "姓名：张三，年龄：25"

// 浮点数格式化
String s2 = String.format("圆周率：%.2f", 3.14159);
// "圆周率：3.14"

// 补零
String s3 = String.format("编号：%05d", 42);
// "编号：00042"

// 左对齐
String s4 = String.format("%-10s|", "Hello");
// "Hello     |"

// 右对齐
String s5 = String.format("%10s|", "Hello");
// "     Hello|"

// 百分比
String s6 = String.format("完成率：%.1f%%", 85.5);
// "完成率：85.5%"

// 日期格式化
Date now = new Date();
String s7 = String.format("当前时间：%tY-%tm-%td", now, now, now);
// "当前时间：2024-01-15"
```

### 常用格式化符号

| 符号 | 说明 | 示例 | 结果 |
|------|------|------|------|
| `%s` | 字符串 | `%s` | "Hello" |
| `%d` | 整数 | `%d` | "42" |
| `%f` | 浮点数 | `%.2f` | "3.14" |
| `%c` | 字符 | `%c` | "A" |
| `%b` | 布尔值 | `%b` | "true" |
| `%x` | 十六进制 | `%x` | "2a" |
| `%o` | 八进制 | `%o` | "52" |
| `%n` | 换行符 | `%n` | 换行 |
| `%%` | 百分号 | `%%` | "%" |

### MessageFormat（更强大的格式化）

```java
import java.text.MessageFormat;

// 基本用法
String pattern = "姓名：{0}，年龄：{1}，成绩：{2}";
String result = MessageFormat.format(pattern, "张三", 25, 95.5);
// "姓名：张三，年龄：25，成绩：95.5"

// 格式化数字
String pattern2 = "金额：{0,number,currency}";
String result2 = MessageFormat.format(pattern2, 1234.56);
// "金额：￥1,234.56"

// 格式化日期
String pattern3 = "日期：{0,date,yyyy-MM-dd}";
String result3 = MessageFormat.format(pattern3, new Date());
// "日期：2024-01-15"

// 复数处理
String pattern4 = "共 {0,choice,0#没有商品|1#1件商品|1<{0}件商品}";
System.out.println(MessageFormat.format(pattern4, 0));  // "共 没有商品"
System.out.println(MessageFormat.format(pattern4, 1));  // "共 1件商品"
System.out.println(MessageFormat.format(pattern4, 5));  // "共 5件商品"
```

---

## 6 字符串与基本类型转换

### 基本类型转字符串

```java
// 方式一：String.valueOf()
String s1 = String.valueOf(123);      // "123"
String s2 = String.valueOf(3.14);     // "3.14"
String s3 = String.valueOf(true);     // "true"

// 方式二：包装类的 toString()
String s4 = Integer.toString(456);    // "456"
String s5 = Double.toString(2.71);    // "2.71"

// 方式三：字符串拼接
String s6 = 100 + "";                 // "100"（不推荐）
```

### 字符串转基本类型

```java
// 字符串转整数
int num1 = Integer.parseInt("123");      // 123
int num2 = Integer.parseInt("FF", 16);   // 255（十六进制）

// 字符串转浮点数
double d1 = Double.parseDouble("3.14");  // 3.14
float f1 = Float.parseFloat("2.5f");     // 2.5

// 字符串转布尔值
boolean b1 = Boolean.parseBoolean("true");   // true
boolean b2 = Boolean.parseBoolean("false");  // false

// 字符串转 long
long l1 = Long.parseLong("1000000000000L");  // 1000000000000

// ⚠️ 格式错误会抛出 NumberFormatException
// int bad = Integer.parseInt("abc");  // ❌ 异常
```

### 安全的转换方法

```java
// 安全的字符串转整数
public static int safeParseInt(String str, int defaultValue) {
    try {
        return Integer.parseInt(str);
    } catch (NumberFormatException e) {
        return defaultValue;
    }
}

int num1 = safeParseInt("123", 0);   // 123
int num2 = safeParseInt("abc", 0);   // 0（默认值）
int num3 = safeParseInt(null, 0);    // 0（默认值）
```

---

## 7 新手常见误区

### 误区 1：用 == 比较字符串内容

**错！** `==` 比较的是内存地址，不是内容。

```java
String s1 = new String("Hello");
String s2 = new String("Hello");

// ❌ 错误
if (s1 == s2) {  // false，地址不同
    System.out.println("相等");
}

// ✅ 正确
if (s1.equals(s2)) {  // true，内容相同
    System.out.println("相等");
}
```

### 误区 2：在循环中用 + 拼接字符串

**错！** 每次 `+` 都会创建新对象，性能极差。

```java
// ❌ 错误：性能差
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i;  // 每次创建新对象
}

// ✅ 正确：使用 StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String result = sb.toString();
```

### 误区 3：认为 String 可以修改

**错！** String 是不可变的，所有"修改"操作都是创建新字符串。

```java
String s = "Hello";
s.toUpperCase();  // 返回新字符串 "HELLO"，s 本身没有改变
System.out.println(s);  // 还是 "Hello"

// 需要接收返回值
s = s.toUpperCase();  // 现在 s 指向新字符串
System.out.println(s);  // "HELLO"
```

### 误区 4：split 方法中使用特殊字符不转义

**错！** `split` 参数是正则表达式，特殊字符需要转义。

```java
String str = "a.b.c";

// ❌ 错误：. 是正则特殊字符
String[] parts = str.split(".");  // 空数组，不是 ["a", "b", "c"]

// ✅ 正确：转义特殊字符
String[] parts = str.split("\\.");  // ["a", "b", "c"]

// 其他需要转义的字符：|、*、+、?、(、)、[、]、{、}、^、$
String csv = "a|b|c";
String[] csvParts = csv.split("\\|");  // ["a", "b", "c"]
```

### 误区 5：忽略字符串编码问题

**注意！** 字符串在不同编码下可能表现不同。

```java
String str = "中文";

// 转为字节数组（指定编码）
byte[] utf8Bytes = str.getBytes(StandardCharsets.UTF_8);
byte[] gbkBytes = str.getBytes(StandardCharsets.GBK);

// 从字节数组恢复（必须使用相同编码）
String s1 = new String(utf8Bytes, StandardCharsets.UTF_8);  // "中文"
String s2 = new String(gbkBytes, StandardCharsets.GBK);     // "中文"

// ❌ 编码不匹配会乱码
String wrong = new String(utf8Bytes, StandardCharsets.GBK);  // 乱码
```

---

## 8 动手练习

### 练习 1：基础练习 —— 字符串统计

编写程序，统计字符串中字母、数字、空格和其他字符的个数。

<details>
<summary>点击查看答案</summary>

```java
public class StringCounter {
    public static void main(String[] args) {
        String str = "Hello World 123!";
        
        int letters = 0, digits = 0, spaces = 0, others = 0;
        
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            if (Character.isLetter(c)) {
                letters++;
            } else if (Character.isDigit(c)) {
                digits++;
            } else if (Character.isWhitespace(c)) {
                spaces++;
            } else {
                others++;
            }
        }
        
        System.out.println("字母：" + letters);
        System.out.println("数字：" + digits);
        System.out.println("空格：" + spaces);
        System.out.println("其他：" + others);
    }
}
```

</details>

### 练习 2：进阶练习 —— 字符串反转

编写程序，反转字符串中的单词顺序，但保持单词内部字符顺序不变。

例如："Hello World Java" → "Java World Hello"

<details>
<summary>点击查看答案</summary>

```java
public class WordReverser {
    public static void main(String[] args) {
        String str = "Hello World Java";
        
        // 按空格分割
        String[] words = str.split(" ");
        
        // 使用 StringBuilder 拼接
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) {
                sb.append(" ");
            }
        }
        
        String result = sb.toString();
        System.out.println("原字符串：" + str);
        System.out.println("反转后：" + result);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 简易 CSV 解析器

编写程序，解析 CSV 格式的字符串，提取每行的字段。

<details>
<summary>点击查看答案</summary>

```java
public class CsvParser {
    public static void main(String[] args) {
        String csv = "姓名,年龄,城市\n张三,25,北京\n李四,30,上海\n王五,28,广州";
        
        // 按换行分割
        String[] lines = csv.split("\n");
        
        // 获取表头
        String[] headers = lines[0].split(",");
        System.out.println("表头：" + String.join(" | ", headers));
        System.out.println("------");
        
        // 解析每行数据
        for (int i = 1; i < lines.length; i++) {
            String[] fields = lines[i].split(",");
            for (int j = 0; j < fields.length; j++) {
                System.out.println(headers[j] + "：" + fields[j]);
            }
            System.out.println("------");
        }
    }
}
```

</details>

---

## 9 核心知识点

| 知识点 | 说明 |
|--------|------|
| String 不可变性 | String 对象一旦创建就不能修改，所有修改操作都创建新字符串 |
| 字符串常量池 | JVM 中的特殊内存，存储字符串字面量，相同内容共享 |
| StringBuilder | 可变字符串，适合频繁拼接场景，性能优于 String |
| StringBuffer | 线程安全的 StringBuilder，性能略低 |
| 常用方法 | length()、charAt()、indexOf()、substring()、replace()、split() |
| 格式化 | String.format() 用于格式化字符串，MessageFormat 更强大 |

---

## 下一章预告

下一章我们会学习 **正则表达式**——文本处理的利器。你会学到：

- 正则表达式的基本语法
- Pattern 和 Matcher 类的使用
- 常用正则表达式示例
- 如何在实际项目中应用正则表达式

正则表达式是文本处理的强大工具，掌握它能让你高效地验证、提取和替换文本数据。准备好了吗？让我们进入正则表达式的世界！

---

## 本章小结

String 是不可变的，适合少量操作。StringBuilder 是可变的，适合频繁拼接。字符串常量池用于共享相同内容的字符串，节省内存。String 提供了丰富的方法用于查找、截取、替换、分割等操作。String.format() 和 MessageFormat 用于字符串格式化。接下来我们将学习正则表达式。
