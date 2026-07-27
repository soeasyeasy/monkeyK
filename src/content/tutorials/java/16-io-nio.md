---
title: '第十六章：IO 与 NIO'
description: 'File、Stream、Reader/Writer、NIO 通道与缓冲区'
---

# 第十六章：IO 与 NIO

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 程序怎么读写文件？数据在硬盘上是怎么流动的？
- 字节流和字符流有什么区别？什么时候用哪个？
- 什么是序列化？为什么要序列化对象？
- NIO 和传统 IO 有什么不同？什么时候该用 NIO？

这一章就是为了解答这些问题。我们会先搞清楚 **IO 流的核心概念**，再动手实践文件读写、对象序列化，最后了解 NIO 的高效操作。学完这章，你就能在程序中自由读写文件了。

---

## 1 为什么需要 IO？

### 痛点分析

程序运行时数据都在内存里，一关机就没了。怎么把数据**持久化**到硬盘上？

```java
// ❌ 没有 IO：数据只在内存中，程序结束就丢失
String data = "重要数据";
// 程序关闭后，data 就没了
```

### 解决方案

```java
// ✅ 用 IO：把数据写入文件，永久保存
try (FileWriter fw = new FileWriter("data.txt")) {
    fw.write("重要数据");  // 写入文件
}
// 数据已经保存到 data.txt 中了，程序关闭也不会丢失
```

> **一句话总结**：IO 就是程序和外部世界（文件、网络、数据库）之间的"数据通道"。

### 生活类比

打个比方：

> IO 就像**水管**——水（数据）从水源（文件/网络）通过水管（IO 流）流到你家（程序）。字节流是"粗水管"，传输原始数据；字符流是"净水器"，专门处理文本数据。

---

## 2 核心原理

### IO 流分类

```
IO 流
├── 字节流（处理原始字节，适合所有文件）
│   ├── InputStream（读）
│   │   └── FileInputStream
│   └── OutputStream（写）
│       └── FileOutputStream
├── 字符流（处理文本，自动处理编码）
│   ├── Reader（读）
│   │   ├── FileReader
│   │   └── BufferedReader（带缓冲）
│   └── Writer（写）
│       ├── FileWriter
│       └── BufferedWriter（带缓冲）
└── 对象流（序列化/反序列化对象）
    ├── ObjectInputStream
    └── ObjectOutputStream
```

打个比方：

> - **字节流** 像**搬运工**——一字节一字节地搬数据，不管内容是什么。
> - **字符流** 像**翻译官**——专门处理文本，自动处理字符编码。
> - **缓冲流** 像**大卡车**——一次搬一大批，减少往返次数，提高效率。

### 字节流 vs 字符流 对比

| 特性     | 字节流                     | 字符流           |
| -------- | -------------------------- | ---------------- |
| 基类     | InputStream / OutputStream | Reader / Writer  |
| 处理单位 | 字节（8 bit）              | 字符（16 bit）   |
| 适用场景 | 图片、视频、二进制文件     | 文本文件         |
| 缓冲     | BufferedInputStream        | BufferedReader   |
| 编码处理 | 不处理                     | 自动处理字符编码 |

---

## 3 基础用法

### File 类

```java
import java.io.File;

// 创建一个 File 对象（不代表真实文件，只是路径）
File file = new File("test.txt");

System.out.println(file.getName());         // 输出：test.txt（文件名）
System.out.println(file.getPath());         // 输出：test.txt（路径）
System.out.println(file.getAbsolutePath()); // 输出绝对路径
System.out.println(file.exists());          // 输出：是否存在
System.out.println(file.isFile());          // 输出：是否是文件
System.out.println(file.isDirectory());     // 输出：是否是目录
System.out.println(file.length());          // 输出：文件大小（字节）

// 创建文件
file.createNewFile();

// 创建目录
File dir = new File("mydir");
dir.mkdir();      // 创建单级目录
dir.mkdirs();     // 创建多级目录（自动创建父目录）

// 列出目录内容
File[] files = dir.listFiles();
```

### 字节流

#### FileInputStream（读文件）

```java
import java.io.FileInputStream;

// 使用 try-with-resources 自动关闭流
try (FileInputStream fis = new FileInputStream("test.txt")) {
    int data;  // 存储每次读取的字节
    while ((data = fis.read()) != -1) {  // read() 返回 -1 表示读完
        System.out.print((char) data);  // 把字节转为字符打印
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

#### FileOutputStream（写文件）

```java
import java.io.FileOutputStream;

// 使用 try-with-resources 自动关闭流
try (FileOutputStream fos = new FileOutputStream("output.txt")) {
    String text = "Hello, Java IO!";
    fos.write(text.getBytes());  // 把字符串转为字节数组写入
} catch (IOException e) {
    e.printStackTrace();
}
```

### 字符流

#### FileReader + BufferedReader（读文本）

```java
import java.io.FileReader;
import java.io.BufferedReader;

// BufferedReader 提供缓冲，提高读取效率，还能逐行读取
try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    String line;  // 存储每一行
    while ((line = br.readLine()) != null) {  // readLine() 读取一行
        System.out.println(line);  // 打印每一行
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

#### FileWriter + BufferedWriter（写文本）

```java
import java.io.FileWriter;
import java.io.BufferedWriter;

// BufferedWriter 提供缓冲，提高写入效率
try (BufferedWriter bw = new BufferedWriter(new FileWriter("output.txt"))) {
    bw.write("第一行");  // 写入文本
    bw.newLine();        // 写入换行符
    bw.write("第二行");
} catch (IOException e) {
    e.printStackTrace();
}
```

### 对象序列化

把对象保存到文件中，以后还能恢复。

```java
import java.io.*;

// 要序列化的类必须实现 Serializable 接口
class User implements Serializable {
    private static final long serialVersionUID = 1L;  // 版本号
    String name;
    int age;

    User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// 序列化：对象 → 字节流 → 文件
try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("user.dat"))) {
    User user = new User("张三", 25);  // 创建对象
    oos.writeObject(user);             // 写入文件
}

// 反序列化：文件 → 字节流 → 对象
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("user.dat"))) {
    User user = (User) ois.readObject();  // 从文件读取并转型
    System.out.println(user.name + ", " + user.age);  // 输出：张三, 25
}
```

---

## 4 NIO（New IO）

NIO 是 Java 1.4 引入的新 IO API，更强大、更高效。

### Path 与 Files

```java
import java.nio.file.*;

// Path 替代 File，功能更强大
Path path = Path.of("test.txt");

// 读取文件（一行代码搞定）
String content = Files.readString(path);           // 读取全部内容
List<String> lines = Files.readAllLines(path);     // 读取所有行

// 写入文件
Files.writeString(path, "Hello NIO");              // 写入字符串
Files.write(path, List.of("第一行", "第二行"));     // 写入多行

// 复制、移动、删除
Files.copy(path, Path.of("copy.txt"));             // 复制文件
Files.move(path, Path.of("new.txt"));              // 移动/重命名
Files.delete(path);                                // 删除文件

// 判断
System.out.println(Files.exists(path));            // 是否存在
System.out.println(Files.isDirectory(path));       // 是否是目录
```

### Channel 与 Buffer

```java
import java.nio.*;
import java.nio.channels.*;
import java.nio.file.*;

// 使用 Channel 和 Buffer 读写文件（NIO 核心机制）
try (FileChannel channel = FileChannel.open(Path.of("test.txt"),
        StandardOpenOption.READ)) {
    ByteBuffer buffer = ByteBuffer.allocate(1024);  // 分配 1024 字节的缓冲区
    while (channel.read(buffer) > 0) {  // 从通道读取到缓冲区
        buffer.flip();    // 切换为读模式（position 归零，limit 设为之前的 position）
        System.out.print(Charset.defaultCharset().decode(buffer));  // 解码并打印
        buffer.clear();   // 清空缓冲区，准备下次读取
    }
}
```

### 字符编码

```java
import java.nio.charset.StandardCharsets;

// 查看系统默认编码
System.out.println(Charset.defaultCharset());  // 通常是 UTF-8

// 字符串与字节转换
String text = "Hello 你好";
byte[] utf8Bytes = text.getBytes(StandardCharsets.UTF_8);  // 用 UTF-8 编码
byte[] gbkBytes = text.getBytes("GBK");                     // 用 GBK 编码

// 字节转字符串（必须用相同编码，否则乱码）
String fromUtf8 = new String(utf8Bytes, StandardCharsets.UTF_8);  // ✅ 正常
String wrong = new String(utf8Bytes, "GBK");                       // ❌ 乱码
```

---

## 5 新手常见误区

### 误区 1：不关闭流

**错！** 不关闭流会导致资源泄漏。

```java
// ❌ 错误：忘记关闭流
FileInputStream fis = new FileInputStream("test.txt");
int data = fis.read();
// 忘记关闭了！

// ✅ 正确：使用 try-with-resources
try (FileInputStream fis = new FileInputStream("test.txt")) {
    int data = fis.read();
}  // 自动关闭
```

### 误区 2：读写文本文件用字节流

**不推荐！** 字符流会自动处理编码，字节流需要手动处理。

```java
// ❌ 不推荐：用字节流读文本，需要手动处理编码
try (FileInputStream fis = new FileInputStream("test.txt")) {
    byte[] bytes = fis.readAllBytes();
    String text = new String(bytes, StandardCharsets.UTF_8);  // 手动指定编码
}

// ✅ 推荐：用字符流读文本
try (BufferedReader br = Files.newBufferedReader(Path.of("test.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
}
```

### 误区 3：硬编码路径分隔符

**错！** Windows 用 `\`，Linux 用 `/`，硬编码会导致跨平台问题。

```java
// ❌ 错误：硬编码 Windows 路径
Path wrong = Path.of("folder\\file.txt");  // Linux 上不行

// ✅ 正确：使用 Path.resolve 拼接路径
Path correct = Path.of("folder").resolve("file.txt");  // 跨平台兼容
```

### 误区 4：大文件一次性读入内存

**错！** 大文件一次性读入会导致内存溢出（OOM）。

```java
// ❌ 错误：大文件可能 OOM
String content = Files.readString(Path.of("large.txt"));  // 整个文件加载到内存

// ✅ 正确：逐行读取
try (BufferedReader reader = Files.newBufferedReader(Path.of("large.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        processLine(line);  // 逐行处理，不会 OOM
    }
}
```

### 误区 5：序列化对象不需要实现 Serializable

**错！** 不实现 Serializable 接口会抛出 `NotSerializableException`。

```java
// ❌ 错误：没有实现 Serializable
class User {
    String name;
}

// ✅ 正确：实现 Serializable
class User implements Serializable {
    private static final long serialVersionUID = 1L;
    String name;
}
```

---

## 6 动手练习

### 练习 1：基础练习 —— 文本文件复制

使用字符流读取一个文本文件，将内容写入另一个文件。

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.nio.file.*;

public class FileCopy {
    public static void main(String[] args) {
        // 使用 try-with-resources 自动关闭流
        try (BufferedReader br = new BufferedReader(new FileReader("source.txt"));
             BufferedWriter bw = new BufferedWriter(new FileWriter("target.txt"))) {
            String line;  // 存储每一行
            while ((line = br.readLine()) != null) {  // 逐行读取
                bw.write(line);  // 写入目标文件
                bw.newLine();    // 写入换行符
            }
            System.out.println("文件复制完成");
        } catch (IOException e) {
            System.out.println("文件操作失败: " + e.getMessage());
        }
    }
}
```

</details>

### 练习 2：进阶练习 —— 统计文件信息

读取一个文本文件，统计行数、单词数和字符数。

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.nio.file.*;

public class FileStats {
    public static void main(String[] args) {
        int lineCount = 0;    // 行数计数器
        int wordCount = 0;    // 单词计数器
        int charCount = 0;    // 字符计数器

        try (BufferedReader br = Files.newBufferedReader(Path.of("test.txt"))) {
            String line;
            while ((line = br.readLine()) != null) {
                lineCount++;                    // 每读一行，行数加 1
                charCount += line.length();     // 累加字符数
                String[] words = line.split("\\s+");  // 按空白字符分割
                for (String word : words) {
                    if (!word.isEmpty()) {      // 跳过空字符串
                        wordCount++;            // 单词数加 1
                    }
                }
            }
        } catch (IOException e) {
            System.out.println("读取失败: " + e.getMessage());
        }

        System.out.println("行数: " + lineCount);
        System.out.println("单词数: " + wordCount);
        System.out.println("字符数: " + charCount);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 对象序列化与反序列化

创建一个 `Student` 类，实现序列化和反序列化，将对象保存到文件并恢复。

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;

// 实现 Serializable 接口才能序列化
class Student implements Serializable {
    private static final long serialVersionUID = 1L;  // 版本号
    String name;
    int age;
    double score;

    Student(String name, int age, double score) {
        this.name = name;
        this.age = age;
        this.score = score;
    }

    @Override
    public String toString() {
        return name + ", " + age + "岁, " + score + "分";
    }
}

public class StudentSerializer {
    public static void main(String[] args) {
        // 序列化：保存对象到文件
        try (ObjectOutputStream oos = new ObjectOutputStream(
                new FileOutputStream("students.dat"))) {
            Student s1 = new Student("张三", 20, 92.5);
            Student s2 = new Student("李四", 21, 88.0);
            oos.writeObject(s1);  // 写入第一个对象
            oos.writeObject(s2);  // 写入第二个对象
            System.out.println("序列化完成");
        } catch (IOException e) {
            System.out.println("序列化失败: " + e.getMessage());
        }

        // 反序列化：从文件恢复对象
        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream("students.dat"))) {
            Student s1 = (Student) ois.readObject();  // 读取第一个对象
            Student s2 = (Student) ois.readObject();  // 读取第二个对象
            System.out.println("恢复的对象:");
            System.out.println(s1);
            System.out.println(s2);
        } catch (IOException | ClassNotFoundException e) {
            System.out.println("反序列化失败: " + e.getMessage());
        }
    }
}
```

</details>

---

## 7 核心知识点

| 知识点     | 说明                                        |
| ---------- | ------------------------------------------- |
| File 类    | 文件和目录的基本操作（创建、删除、判断）    |
| 字节流     | InputStream/OutputStream，处理二进制数据    |
| 字符流     | Reader/Writer，处理文本数据，自动处理编码   |
| 缓冲流     | BufferedReader/BufferedWriter，提高 IO 性能 |
| 对象序列化 | 使用 Serializable 接口，transient 排除字段  |
| NIO        | Path/Files 工具类，Channel/Buffer 机制      |
| 字符编码   | UTF-8、GBK 等，注意编码一致性               |

---

## 下一章预告

下一章我们会学习 **多线程与并发**——让程序同时做多件事。你会学到 Thread、Runnable、线程池、synchronized 和 Lock。学完这章，你就能编写高效的多线程程序了。
