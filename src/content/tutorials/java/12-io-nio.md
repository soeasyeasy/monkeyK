---
title: '第十二章：IO 与 NIO'
description: 'File、Stream、Reader/Writer、NIO 通道与缓冲区'
---

# 第十二章：IO 与 NIO

## File 类

```java
import java.io.File;

File file = new File("test.txt");

System.out.println(file.getName());        // test.txt
System.out.println(file.getPath());        // test.txt
System.out.println(file.getAbsolutePath()); // 绝对路径
System.out.println(file.exists());         // 是否存在
System.out.println(file.isFile());         // 是否文件
System.out.println(file.isDirectory());    // 是否目录
System.out.println(file.length());         // 文件大小（字节）

// 创建文件
file.createNewFile();

// 创建目录
File dir = new File("mydir");
dir.mkdir();          // 创建单级目录
dir.mkdirs();         // 创建多级目录

// 列出目录内容
File[] files = dir.listFiles();
```

## 字节流

### FileInputStream

```java
import java.io.FileInputStream;

try (FileInputStream fis = new FileInputStream("test.txt")) {
    int data;
    while ((data = fis.read()) != -1) {
        System.out.print((char) data);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### FileOutputStream

```java
import java.io.FileOutputStream;

try (FileOutputStream fos = new FileOutputStream("output.txt")) {
    String text = "Hello, Java IO!";
    fos.write(text.getBytes());
} catch (IOException e) {
    e.printStackTrace();
}
```

## 字符流

### FileReader

```java
import java.io.FileReader;
import java.io.BufferedReader;

try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### FileWriter

```java
import java.io.FileWriter;
import java.io.BufferedWriter;

try (BufferedWriter bw = new BufferedWriter(new FileWriter("output.txt"))) {
    bw.write("第一行");
    bw.newLine();
    bw.write("第二行");
} catch (IOException e) {
    e.printStackTrace();
}
```

## 字节流 vs 字符流

| 特性     | 字节流                     | 字符流          |
| -------- | -------------------------- | --------------- |
| 基类     | InputStream / OutputStream | Reader / Writer |
| 处理单位 | 字节（8 bit）              | 字符（16 bit）  |
| 适用场景 | 图片、视频、二进制文件     | 文本文件        |
| 缓冲     | BufferedInputStream        | BufferedReader  |

## 对象序列化

```java
import java.io.*;

class User implements Serializable {
    private static final long serialVersionUID = 1L;
    String name;
    int age;

    User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// 序列化
try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("user.dat"))) {
    User user = new User("张三", 25);
    oos.writeObject(user);
}

// 反序列化
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("user.dat"))) {
    User user = (User) ois.readObject();
    System.out.println(user.name + ", " + user.age);
}
```

## NIO（New IO）

### Path 与 Files

```java
import java.nio.file.*;

Path path = Path.of("test.txt");

// 读取文件
String content = Files.readString(path);
List<String> lines = Files.readAllLines(path);

// 写入文件
Files.writeString(path, "Hello NIO");
Files.write(path, List.of("第一行", "第二行"));

// 复制、移动、删除
Files.copy(path, Path.of("copy.txt"));
Files.move(path, Path.of("new.txt"));
Files.delete(path);

// 判断
System.out.println(Files.exists(path));
System.out.println(Files.isDirectory(path));
```

### Channel 与 Buffer

```java
import java.nio.*;
import java.nio.channels.*;
import java.nio.file.*;

// 使用 Channel 和 Buffer 读写文件
try (FileChannel channel = FileChannel.open(Path.of("test.txt"),
        StandardOpenOption.READ)) {
    ByteBuffer buffer = ByteBuffer.allocate(1024);
    while (channel.read(buffer) > 0) {
        buffer.flip();    // 切换为读模式
        System.out.print(Charset.defaultCharset().decode(buffer));
        buffer.clear();   // 清空缓冲区
    }
}
```

## 字符编码

### 常见编码格式

```java
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

// 查看系统默认编码
System.out.println(Charset.defaultCharset());  // 通常是 UTF-8

// 常用编码
Charset utf8 = StandardCharsets.UTF_8;
Charset gbk = Charset.forName("GBK");

// 字符串与字节转换
String text = "Hello 你好";
byte[] utf8Bytes = text.getBytes(StandardCharsets.UTF_8);
byte[] gbkBytes = text.getBytes("GBK");

// 字节转字符串
String fromUtf8 = new String(utf8Bytes, StandardCharsets.UTF_8);
String fromGbk = new String(gbkBytes, "GBK");
```

### 乱码问题

```java
// ❌ 编码不一致导致乱码
String original = "你好";
byte[] bytes = original.getBytes("UTF-8");
String wrong = new String(bytes, "GBK");  // 乱码
System.out.println(wrong);  // 显示乱码字符

// ✅ 正确做法：使用相同编码
String correct = new String(bytes, "UTF-8");
System.out.println(correct);  // 正常显示
```

## 文件操作实战

### 复制文件

```java
// 方式一：使用 Files.copy
Path source = Path.of("source.txt");
Path target = Path.of("target.txt");
Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);

// 方式二：使用流（适合大文件）
try (InputStream in = Files.newInputStream(source);
     OutputStream out = Files.newOutputStream(target)) {
    byte[] buffer = new byte[8192];
    int bytesRead;
    while ((bytesRead = in.read(buffer)) != -1) {
        out.write(buffer, 0, bytesRead);
    }
}
```

### 遍历目录

```java
// 遍历当前目录
try (Stream<Path> paths = Files.list(Path.of("."))) {
    paths.forEach(System.out::println);
}

// 递归遍历所有子目录
try (Stream<Path> paths = Files.walk(Path.of("."))) {
    paths.filter(Files::isRegularFile)
         .forEach(System.out::println);
}

// 使用 DirectoryStream（适合大目录）
try (DirectoryStream<Path> stream = Files.newDirectoryStream(Path.of("."), "*.java")) {
    for (Path entry : stream) {
        System.out.println(entry);
    }
}
```

### 文件属性

```java
Path path = Path.of("test.txt");

// 基本属性
System.out.println("文件大小: " + Files.size(path) + " bytes");
System.out.println("最后修改时间: " + Files.getLastModifiedTime(path));
System.out.println("是否可读: " + Files.isReadable(path));
System.out.println("是否可写: " + Files.isWritable(path));

// 详细属性（使用 BasicFileAttributes）
BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
System.out.println("创建时间: " + attrs.creationTime());
System.out.println("是否目录: " + attrs.isDirectory());
System.out.println("是否符号链接: " + attrs.isSymbolicLink());
```

## 对象序列化高级特性

### transient 关键字

```java
class User implements Serializable {
    private static final long serialVersionUID = 1L;

    String username;
    String password;
    transient String tempData;  // 不会被序列化

    User(String username, String password) {
        this.username = username;
        this.password = password;
        this.tempData = "临时数据";
    }
}

User user = new User("admin", "123456");
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("user.dat"))) {
    oos.writeObject(user);
}

try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("user.dat"))) {
    User loaded = (User) ois.readObject();
    System.out.println(loaded.username);    // admin
    System.out.println(loaded.password);    // 123456
    System.out.println(loaded.tempData);    // null（未被序列化）
}
```

### 自定义序列化

```java
class CustomObject implements Serializable {
    private String data;
    private transient String cachedValue;

    // 自定义序列化
    private void writeObject(ObjectOutputStream out) throws IOException {
        out.defaultWriteObject();  // 序列化默认字段
        out.writeUTF(cachedValue); // 手动序列化 transient 字段
    }

    // 自定义反序列化
    private void readObject(ObjectInputStream in)
            throws IOException, ClassNotFoundException {
        in.defaultReadObject();    // 反序列化默认字段
        cachedValue = in.readUTF(); // 手动反序列化
    }
}
```

## NIO 高级特性

### 文件监听（WatchService）

```java
import java.nio.file.*;

WatchService watchService = FileSystems.getDefault().newWatchService();
Path dir = Path.of(".");

// 注册监听事件
dir.register(watchService,
    StandardWatchEventKinds.ENTRY_CREATE,
    StandardWatchEventKinds.ENTRY_MODIFY,
    StandardWatchEventKinds.ENTRY_DELETE);

System.out.println("开始监听文件变化...");

// 监听事件
while (true) {
    WatchKey key = watchService.take();  // 阻塞等待

    for (WatchEvent<?> event : key.pollEvents()) {
        WatchEvent.Kind<?> kind = event.kind();
        Path fileName = (Path) event.context();

        System.out.println("检测到: " + kind.name() + " - " + fileName);
    }

    key.reset();  // 重置，继续监听
}
```

### 内存映射文件

```java
// 适合大文件的高效读写
try (FileChannel channel = FileChannel.open(
        Path.of("large.dat"),
        StandardOpenOption.READ,
        StandardOpenOption.WRITE)) {

    // 映射整个文件到内存
    MappedByteBuffer buffer = channel.map(
        FileChannel.MapMode.READ_WRITE, 0, channel.size());

    // 直接操作缓冲区
    buffer.put(0, (byte) 'H');
    buffer.put(1, (byte) 'i');

    // 强制写入磁盘
    buffer.force();
}
```

## IO vs NIO 对比

| 特性       | IO（传统）       | NIO（新IO）          |
| ---------- | ---------------- | -------------------- |
| 面向       | 流（Stream）     | 缓冲区（Buffer）     |
| 阻塞       | 阻塞IO           | 非阻塞IO             |
| 选择器     | 无               | 支持Selector         |
| 适用场景   | 小文件、简单操作 | 大文件、高并发       |
| 代码复杂度 | 简单             | 较复杂               |
| 性能       | 一般             | 更高（特别是大文件） |

## 常见问题与解决方案

### 1. 文件路径问题

```java
// ❌ 硬编码路径分隔符
Path wrong = Path.of("folder\\file.txt");  // Windows 可以，Linux 不行

// ✅ 使用 Path 的 resolve 方法
Path correct = Path.of("folder").resolve("file.txt");  // 跨平台
```

### 2. 资源未关闭

```java
// ❌ 可能资源泄漏
FileInputStream fis = new FileInputStream("test.txt");
int data = fis.read();
// 忘记关闭

// ✅ 使用 try-with-resources
try (FileInputStream fis = new FileInputStream("test.txt")) {
    int data = fis.read();
}  // 自动关闭
```

### 3. 大文件内存溢出

```java
// ❌ 读取大文件到内存
String content = Files.readString(Path.of("large.txt"));  // 可能 OOM

// ✅ 逐行读取
try (BufferedReader reader = Files.newBufferedReader(Path.of("large.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        processLine(line);  // 逐行处理
    }
}
```

## 核心知识点

1. **File 类**：文件和目录的基本操作
2. **字节流**：InputStream/OutputStream，处理二进制数据
3. **字符流**：Reader/Writer，处理文本数据
4. **缓冲流**：提高IO性能
5. **对象序列化**：使用 Serializable 接口，transient 排除字段
6. **NIO**：Path/Files 工具类，Channel/Buffer 机制
7. **字符编码**：UTF-8、GBK 等，注意乱码问题

## 本章小结

IO 流分为字节流和字符流，分别处理二进制和文本数据。NIO 提供 Path/Files 工具类和 Channel/Buffer 机制，性能更高。实际开发中要注意资源关闭、编码一致性和大文件处理。接下来我们将学习多线程与并发。
