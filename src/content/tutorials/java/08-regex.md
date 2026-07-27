---
title: '第八章：正则表达式'
description: '正则语法、Pattern、Matcher、常用正则示例'
---

# 第八章：正则表达式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 正则表达式是什么？为什么需要学习它？
- 正则表达式的语法看起来很复杂，怎么入门？
- Java 中如何使用正则表达式？
- 有哪些常用的正则表达式示例？

这一章就是为了解答这些问题。我们会先理解 **正则表达式的基本概念**，再学习 Java 中的 Pattern 和 Matcher 类，最后通过大量实例掌握常用正则表达式。学完这章，你就能高效地处理文本验证和提取了。

---

## 1 为什么需要正则表达式？

### 痛点分析

想象你要验证用户输入的邮箱地址是否合法。如果用普通的字符串方法：

```java
// ❌ 手动验证邮箱：代码复杂且容易出错
public boolean isValidEmail(String email) {
    if (email == null || email.isEmpty()) return false;
    
    int atIndex = email.indexOf('@');
    if (atIndex <= 0 || atIndex == email.length() - 1) return false;
    
    int dotIndex = email.lastIndexOf('.');
    if (dotIndex <= atIndex + 1 || dotIndex == email.length() - 1) return false;
    
    // 还要检查更多规则...
    return true;
}
```

这段代码复杂、难以维护，而且容易遗漏边界情况。

**生活类比**：正则表达式就像"文本的模具"。你定义一个规则（模具），所有符合这个规则的文本都能通过验证。就像筛子一样，只有符合大小要求的颗粒才能通过。

### 解决方案

```java
// ✅ 使用正则表达式：简洁且强大
public boolean isValidEmail(String email) {
    String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    return email.matches(regex);
}
```

> **一句话总结**：正则表达式是文本处理的"瑞士军刀"，能简洁高效地完成复杂的文本匹配任务。

---

## 2 正则表达式基础语法

### 字符类

字符类用于匹配一组字符。

| 语法 | 说明 | 示例 | 匹配 |
|------|------|------|------|
| `[abc]` | 匹配 a、b 或 c | `[abc]` | "a"、"b"、"c" |
| `[^abc]` | 匹配除了 a、b、c 之外的字符 | `[^abc]` | "d"、"e"、"1" |
| `[a-z]` | 匹配 a 到 z 之间的任意小写字母 | `[a-z]` | "a"、"b"、"z" |
| `[A-Z]` | 匹配 A 到 Z 之间的任意大写字母 | `[A-Z]` | "A"、"B"、"Z" |
| `[0-9]` | 匹配 0 到 9 之间的任意数字 | `[0-9]` | "0"、"5"、"9" |
| `[a-zA-Z]` | 匹配任意字母 | `[a-zA-Z]` | "a"、"Z" |
| `[a-z0-9]` | 匹配小写字母或数字 | `[a-z0-9]` | "a"、"5" |

### 预定义字符类

Java 提供了一些常用的预定义字符类。

| 语法 | 说明 | 等价于 | 示例 |
|------|------|--------|------|
| `.` | 匹配任意字符（除换行符） | | "a"、"1"、"@" |
| `\d` | 匹配数字 | `[0-9]` | "0"、"5"、"9" |
| `\D` | 匹配非数字 | `[^0-9]` | "a"、"@" |
| `\w` | 匹配单词字符 | `[a-zA-Z0-9_]` | "a"、"1"、"_" |
| `\W` | 匹配非单词字符 | `[^\w]` | "@"、" " |
| `\s` | 匹配空白字符 | `[ \t\n\r\f]` | " "、"\t"、"\n" |
| `\S` | 匹配非空白字符 | `[^\s]` | "a"、"1" |

### 量词

量词用于指定匹配的次数。

| 语法 | 说明 | 示例 | 匹配 |
|------|------|------|------|
| `*` | 匹配 0 次或多次 | `a*` | ""、"a"、"aaa" |
| `+` | 匹配 1 次或多次 | `a+` | "a"、"aa"、"aaa" |
| `?` | 匹配 0 次或 1 次 | `a?` | ""、"a" |
| `{n}` | 匹配恰好 n 次 | `a{3}` | "aaa" |
| `{n,}` | 匹配至少 n 次 | `a{2,}` | "aa"、"aaa"、"aaaa" |
| `{n,m}` | 匹配 n 到 m 次 | `a{2,4}` | "aa"、"aaa"、"aaaa" |

### 边界匹配

边界匹配用于指定匹配的位置。

| 语法 | 说明 | 示例 | 匹配 |
|------|------|------|------|
| `^` | 匹配字符串开头 | `^Hello` | "Hello World" |
| `$` | 匹配字符串结尾 | `World$` | "Hello World" |
| `\b` | 匹配单词边界 | `\bcat\b` | "cat"（不是 "category"） |
| `\B` | 匹配非单词边界 | `\Bcat\B` | "category" 中的 "cat" |

### 分组与捕获

分组用于将多个字符组合为一个整体。

| 语法 | 说明 | 示例 | 匹配 |
|------|------|------|------|
| `(abc)` | 捕获分组 | `(abc)+` | "abc"、"abcabc" |
| `(?:abc)` | 非捕获分组 | `(?:abc)+` | "abc"、"abcabc" |
| `\1` | 引用第一个捕获分组 | `(a)b\1` | "aba" |
| `(?<name>abc)` | 命名捕获分组 | `(?<word>abc)` | "abc" |

### 选择与转义

| 语法 | 说明 | 示例 | 匹配 |
|------|------|------|------|
| `|` | 或操作 | `cat|dog` | "cat" 或 "dog" |
| `\` | 转义字符 | `\.` | "."（不是任意字符） |

---

## 3 Java 中的正则表达式

### Pattern 类

Pattern 类用于编译正则表达式。

```java
import java.util.regex.Pattern;

// 编译正则表达式
Pattern pattern = Pattern.compile("\\d+");

// 常用标志
Pattern caseInsensitive = Pattern.compile("[a-z]+", Pattern.CASE_INSENSITIVE);
Pattern multiLine = Pattern.compile("^Hello", Pattern.MULTILINE);

// 检查整个字符串是否匹配
boolean matches = pattern.matcher("12345").matches();  // true

// 快速匹配（不推荐频繁使用，因为每次都会编译）
boolean quickMatch = "12345".matches("\\d+");  // true
```

### Matcher 类

Matcher 类用于在字符串中查找匹配。

```java
import java.util.regex.Matcher;
import java.util.regex.Pattern;

Pattern pattern = Pattern.compile("\\d+");
String text = "我的电话是 12345，他的电话是 67890";

Matcher matcher = pattern.matcher(text);

// 查找所有匹配
while (matcher.find()) {
    System.out.println("找到：" + matcher.group());
    System.out.println("位置：" + matcher.start() + " - " + matcher.end());
}
// 输出：
// 找到：12345
// 位置：6 - 11
// 找到：67890
// 位置：19 - 24

// 检查是否找到
boolean found = matcher.find();  // true（如果还有匹配）

// 重置匹配器
matcher.reset();
```

### 常用方法

```java
Pattern pattern = Pattern.compile("(\\d{4})-(\\d{2})-(\\d{2})");
Matcher matcher = pattern.matcher("今天是 2024-01-15，明天是 2024-01-16");

// 查找并提取分组
while (matcher.find()) {
    System.out.println("完整匹配：" + matcher.group(0));  // "2024-01-15"
    System.out.println("年：" + matcher.group(1));  // "2024"
    System.out.println("月：" + matcher.group(2));  // "01"
    System.out.println("日：" + matcher.group(3));  // "15"
}

// 替换
String result = matcher.replaceAll("****-**-**");
System.out.println(result);  // "今天是 ****-**-**，明天是 ****-**-**"

// 分割
Pattern splitPattern = Pattern.compile("[,;]");
String[] parts = splitPattern.split("apple,banana;orange");
// ["apple", "banana", "orange"]
```

---

## 4 常用正则表达式示例

### 验证类

#### 邮箱验证

```java
// 简单邮箱验证
String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

System.out.println("test@example.com".matches(emailRegex));  // true
System.out.println("user.name@domain.co".matches(emailRegex));  // true
System.out.println("invalid-email".matches(emailRegex));  // false
System.out.println("@example.com".matches(emailRegex));  // false
```

#### 手机号验证（中国大陆）

```java
// 中国大陆手机号：1开头，第二位3-9，共11位
String phoneRegex = "^1[3-9]\\d{9}$";

System.out.println("13812345678".matches(phoneRegex));  // true
System.out.println("15912345678".matches(phoneRegex));  // true
System.out.println("12345678901".matches(phoneRegex));  // false（第二位不是3-9）
System.out.println("1381234567".matches(phoneRegex));  // false（只有10位）
```

#### 身份证号验证

```java
// 18位身份证号：6位地区码 + 8位出生日期 + 3位顺序码 + 1位校验码
String idCardRegex = "^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$";

System.out.println("110101199001011234".matches(idCardRegex));  // true
System.out.println("11010119900101123X".matches(idCardRegex));  // true
System.out.println("110101199013011234".matches(idCardRegex));  // false（月份13无效）
```

#### 密码强度验证

```java
// 强密码：至少8位，包含大小写字母、数字和特殊字符
String strongPasswordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

System.out.println("Password123!".matches(strongPasswordRegex));  // true
System.out.println("password123".matches(strongPasswordRegex));  // false（没有大写和特殊字符）
System.out.println("PASS123!".matches(strongPasswordRegex));  // false（没有小写）
```

### 提取类

#### 提取 URL

```java
String text = "访问 https://www.example.com 或 http://test.org 获取更多信息";
String urlRegex = "https?://[\\w.-]+(?:/[\\w.-]*)*";

Pattern pattern = Pattern.compile(urlRegex);
Matcher matcher = pattern.matcher(text);

while (matcher.find()) {
    System.out.println("URL: " + matcher.group());
}
// 输出：
// URL: https://www.example.com
// URL: http://test.org
```

#### 提取日期

```java
String text = "会议时间：2024-01-15，下次会议：2024-02-20";
String dateRegex = "(\\d{4})-(\\d{2})-(\\d{2})";

Pattern pattern = Pattern.compile(dateRegex);
Matcher matcher = pattern.matcher(text);

while (matcher.find()) {
    System.out.println("日期：" + matcher.group());
    System.out.println("年：" + matcher.group(1) + "，月：" + matcher.group(2) + "，日：" + matcher.group(3));
}
// 输出：
// 日期：2024-01-15
// 年：2024，月：01，日：15
// 日期：2024-02-20
// 年：2024，月：02，日：20
```

#### 提取 HTML 标签内容

```java
String html = "<h1>标题</h1><p>这是段落</p><a href='#'>链接</a>";
String tagRegex = "<(\\w+)>(.*?)</\\1>";

Pattern pattern = Pattern.compile(tagRegex);
Matcher matcher = pattern.matcher(html);

while (matcher.find()) {
    System.out.println("标签：" + matcher.group(1) + "，内容：" + matcher.group(2));
}
// 输出：
// 标签：h1，内容：标题
// 标签：p，内容：这是段落
// 标签：a，内容：链接
```

### 替换类

#### 隐藏手机号中间数字

```java
String phone = "13812345678";
String hidden = phone.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2");
System.out.println(hidden);  // "138****5678"
```

#### 去除 HTML 标签

```java
String html = "<p>这是<strong>重要</strong>的文本</p>";
String text = html.replaceAll("<[^>]+>", "");
System.out.println(text);  // "这是重要的文本"
```

#### 格式化金额

```java
String amount = "1234567.89";
String formatted = amount.replaceAll("(\\d)(?=(\\d{3})+(?!\\d))", "$1,");
System.out.println(formatted);  // "1,234,567.89"
```

---

## 5 正则表达式高级技巧

### 贪婪与非贪婪匹配

```java
String text = "<h1>标题</h1><p>段落</p>";

// 贪婪匹配（默认）：尽可能多地匹配
Pattern greedy = Pattern.compile("<.*>");
Matcher m1 = greedy.matcher(text);
if (m1.find()) {
    System.out.println("贪婪：" + m1.group());  // "<h1>标题</h1><p>段落</p>"
}

// 非贪婪匹配：尽可能少地匹配
Pattern lazy = Pattern.compile("<.*?>");
Matcher m2 = lazy.matcher(text);
while (m2.find()) {
    System.out.println("非贪婪：" + m2.group());
}
// 输出：
// 非贪婪：<h1>
// 非贪婪：</h1>
// 非贪婪：<p>
// 非贪婪：</p>
```

### 前瞻与后顾（Lookaround）

```java
// 前瞻（Positive Lookahead）：(?=...)
String text = "123 apples, 456 oranges, 789 bananas";
Pattern pattern = Pattern.compile("\\d+(?= apples)");
Matcher matcher = pattern.matcher(text);
if (matcher.find()) {
    System.out.println(matcher.group());  // "123"（只匹配后面是 apples 的数字）
}

// 负前瞻（Negative Lookahead）：(?!...)
Pattern negative = Pattern.compile("\\d+(?! apples)");
Matcher m2 = negative.matcher(text);
while (m2.find()) {
    System.out.println(m2.group());  // "456", "789"（匹配后面不是 apples 的数字）
}

// 后顾（Positive Lookbehind）：(?<=...)
Pattern lookbehind = Pattern.compile("(?<=apples, )\\d+");
Matcher m3 = lookbehind.matcher(text);
if (m3.find()) {
    System.out.println(m3.group());  // "456"（只匹配前面是 apples, 的数字）
}
```

### 分组命名

```java
String date = "2024-01-15";
Pattern pattern = Pattern.compile("(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})");
Matcher matcher = pattern.matcher(date);

if (matcher.matches()) {
    System.out.println("年：" + matcher.group("year"));  // "2024"
    System.out.println("月：" + matcher.group("month"));  // "01"
    System.out.println("日：" + matcher.group("day"));  // "15"
}
```

---

## 6 性能注意事项

### 预编译 Pattern

```java
// ❌ 不推荐：每次匹配都编译正则
for (int i = 0; i < 1000; i++) {
    "test123".matches("\\d+");  // 每次都会编译正则
}

// ✅ 推荐：预编译 Pattern
Pattern pattern = Pattern.compile("\\d+");
for (int i = 0; i < 1000; i++) {
    pattern.matcher("test123").matches();  // 只编译一次
}
```

### 避免灾难性回溯

```java
// ❌ 危险：可能导致灾难性回溯
String badRegex = "(a+)+b";
String text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaac";
// 这个匹配可能会花费很长时间

// ✅ 安全：使用更精确的正则
String goodRegex = "a+b";
```

### 使用字符串方法（简单场景）

```java
// 简单验证可以用 String.matches()
boolean isValid = "12345".matches("\\d+");

// 简单替换可以用 String.replaceAll()
String result = "hello123".replaceAll("\\d", "");  // "hello"

// 简单分割可以用 String.split()
String[] parts = "a,b,c".split(",");
```

---

## 7 新手常见误区

### 误区 1：忘记转义特殊字符

**错！** 正则表达式中的特殊字符需要转义。

```java
// ❌ 错误：. 是特殊字符，匹配任意字符
String regex = "192.168.1.1";
System.out.println("192a168b1c1".matches(regex));  // true（不是预期的IP匹配）

// ✅ 正确：转义 .
String correctRegex = "192\\.168\\.1\\.1";
System.out.println("192.168.1.1".matches(correctRegex));  // true
System.out.println("192a168b1c1".matches(correctRegex));  // false
```

### 误区 2：混淆 matches() 和 find()

**注意！** `matches()` 匹配整个字符串，`find()` 查找子串。

```java
Pattern pattern = Pattern.compile("\\d+");

// matches()：匹配整个字符串
System.out.println(pattern.matcher("12345").matches());  // true
System.out.println(pattern.matcher("abc12345").matches());  // false（不是全数字）

// find()：查找子串
Matcher matcher = pattern.matcher("abc12345def");
System.out.println(matcher.find());  // true（找到了 12345）
```

### 误区 3：在字符类中使用转义

**注意！** 字符类 `[]` 中的特殊字符不需要转义（除了 `]`、`\`、`^`、`-`）。

```java
// ❌ 错误：字符类中不需要转义 .
String regex = "[a-z\\.]+";  // 虽然能工作，但不必要

// ✅ 正确：字符类中 . 就是普通字符
String correctRegex = "[a-z.]+";  // 匹配小写字母和点
```

### 误区 4：忽略正则表达式的性能问题

**注意！** 复杂的正则表达式可能导致性能问题。

```java
// ❌ 性能差：嵌套量词
String badRegex = "(a+)+b";

// ✅ 性能好：简化正则
String goodRegex = "a+b";

// ✅ 更好：使用 possessive 量词（Java 支持）
String betterRegex = "a++b";  // 不回溯
```

### 误区 5：认为正则表达式可以解决所有问题

**注意！** 正则表达式虽然强大，但不是万能的。

```java
// ❌ 不适合：解析 HTML（HTML 不是正则语言）
String html = "<div><p>嵌套内容</p></div>";
// 用正则解析 HTML 很容易出错

// ✅ 适合：简单的文本验证和提取
String email = "test@example.com";
boolean isValid = email.matches("^[\\w.-]+@[\\w.-]+\\.[a-z]{2,}$");
```

---

## 8 动手练习

### 练习 1：基础练习 —— 数字提取

编写程序，从字符串中提取所有数字并求和。

<details>
<summary>点击查看答案</summary>

```java
import java.util.regex.*;

public class NumberExtractor {
    public static void main(String[] args) {
        String text = "苹果 10 元，香蕉 5 元，橙子 8 元";
        
        Pattern pattern = Pattern.compile("\\d+");
        Matcher matcher = pattern.matcher(text);
        
        int sum = 0;
        while (matcher.find()) {
            int num = Integer.parseInt(matcher.group());
            sum += num;
            System.out.println("找到数字：" + num);
        }
        
        System.out.println("总和：" + sum);  // 23
    }
}
```

</details>

### 练习 2：进阶练习 —— 邮箱验证器

编写程序，验证邮箱地址是否合法。

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class EmailValidator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("请输入邮箱地址：");
        String email = scanner.nextLine();
        
        String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        
        if (email.matches(regex)) {
            System.out.println("✓ 邮箱格式正确");
        } else {
            System.out.println("✗ 邮箱格式错误");
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 文本分析器

编写程序，统计文本中单词的出现次数。

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;
import java.util.regex.*;

public class WordCounter {
    public static void main(String[] args) {
        String text = "Hello world hello Java world Java is great";
        
        // 提取所有单词（不区分大小写）
        Pattern pattern = Pattern.compile("\\b[a-z]+\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        
        // 统计词频
        Map<String, Integer> wordCount = new HashMap<>();
        while (matcher.find()) {
            String word = matcher.group().toLowerCase();
            wordCount.put(word, wordCount.getOrDefault(word, 0) + 1);
        }
        
        // 输出结果
        System.out.println("词频统计：");
        wordCount.forEach((word, count) -> 
            System.out.println(word + ": " + count)
        );
    }
}
```

</details>

---

## 9 核心知识点

| 知识点 | 说明 |
|--------|------|
| 字符类 | `[abc]`、`[a-z]`、`\d`、`\w`、`\s` 等 |
| 量词 | `*`、`+`、`?`、`{n}`、`{n,}`、`{n,m}` |
| 边界匹配 | `^`、`$`、`\b` |
| 分组 | `(abc)`、`\1`、`(?<name>abc)` |
| Pattern 类 | 编译正则表达式 |
| Matcher 类 | 执行匹配操作 |
| 常用方法 | `matches()`、`find()`、`group()`、`replaceAll()` |

---

## 下一章预告

下一章我们会学习 **日期时间 API**——Java 8+ 的日期时间处理。你会学到：

- LocalDate、LocalTime、LocalDateTime 的使用
- DateTimeFormatter 格式化日期时间
- Duration 和 Period 计算时间间隔
- 时区处理和日期计算

日期时间是业务开发中经常需要处理的内容，掌握 Java 8+ 的新 API 能让你的代码更简洁、更安全。准备好了吗？让我们进入日期时间的世界！

---

## 本章小结

正则表达式是文本处理的强大工具。Java 通过 Pattern 和 Matcher 类提供正则支持。常用语法包括字符类、量词、边界匹配、分组等。正则表达式适用于文本验证、提取和替换。使用时要注意性能和特殊字符转义。接下来我们将学习日期时间 API。
