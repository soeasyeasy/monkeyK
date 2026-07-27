---
title: "第十章：序列化原理"
description: "深入理解 Java 序列化机制，掌握 Serializable、transient、Externalizable 及 JSON 序列化的底层原理"
---

# 第十章：序列化原理

## 本章导读

本章将带你深入理解 Java 序列化的底层原理。我们会从"对象如何变成字节流"这个基础问题出发，搞懂 Serializable 接口背后的机制、serialVersionUID 为什么重要、transient 关键字如何保护敏感字段、Externalizable 如何实现自定义序列化，以及 JSON 序列化框架是如何通过反射把对象变成文本的。

学完本章，你将能够：
- 理解序列化和反序列化的本质过程
- 掌握 Java 原生序列化的底层机制和安全风险
- 正确使用 transient 和 Externalizable
- 理解 JSON 序列化框架的反射原理
- 对比不同序列化方案的优劣

## 10.1 为什么需要序列化？

### 生活中的类比

想象你要搬家，家里有很多家具（对象）。直接搬整个房子（内存中的对象图）不现实，你需要：
1. **拆卸**：把家具拆成零件（序列化：对象 → 字节流/文本）
2. **运输**：用卡车运到新家（网络传输或存储到文件/数据库）
3. **组装**：在新家把零件重新组装成家具（反序列化：字节流/文本 → 对象）

### 技术层面的需求

在以下场景中，必须把内存中的对象转换成可传输/可存储的格式：

1. **网络传输**：RPC 调用时，参数对象需要序列化成字节流通过网络发送
2. **持久化存储**：把对象保存到文件或数据库，下次启动时恢复
3. **分布式缓存**：把对象存入 Redis，需要转换成字节数组
4. **消息队列**：发送对象到 Kafka/RabbitMQ，需要先序列化

```java
// 没有序列化，对象只能在当前 JVM 中使用
User user = new User("张三", 25);
// 想通过网络发给另一台机器？不行！必须先序列化
// 想保存到文件下次再用？不行！必须先序列化
```

## 10.2 核心原理

### 10.2.1 序列化的本质

序列化就是把内存中的对象图（Object Graph）转换成线性字节序列的过程：

```
内存中的对象：
┌─────────────────────────────────┐
│  User 对象（地址 0x1234）         │
│  name: "张三"（地址 0x5678）      │
│  age: 25                        │
│  address: Address 对象（0x9ABC） │
└─────────────────────────────────┘

序列化后的字节流：
[类型标记][类名][字段数][name 字段类型][name 值][age 字段类型][age 值][address 引用]...
```

反序列化就是根据字节流中的类型信息和字段值，重新在堆中创建对象的过程。

### 10.2.2 Java 原生序列化（Serializable）

Java 原生序列化通过实现 `Serializable` 接口来实现，这是一个标记接口（没有方法），告诉 JVM 这个类可以被序列化。

```java
import java.io.Serializable;

// 实现 Serializable 接口，标记这个类可以被序列化
public class User implements Serializable {
    // serialVersionUID：序列化版本号，用于验证序列化和反序列化时类是否一致
    // 如果不显式声明，JVM 会根据类结构自动生成一个
    // 强烈建议手动声明，否则类结构变化后自动生成的 UID 会变，导致反序列化失败
    private static final long serialVersionUID = 1L;

    private String name;    // 普通字段会被序列化
    private int age;        // 基本类型字段也会被序列化
    private transient String password; // transient 修饰的字段不会被序列化
}
```

**序列化过程（ObjectOutputStream）：**

```
1. 写出类描述信息：类名、serialVersionUID、字段信息
2. 递归写出父类的信息（如果没有实现 Serializable 则停止）
3. 写出对象实例数据：按字段顺序写出每个字段的值
4. 处理对象引用：使用句柄（handle）机制避免循环引用导致的无限递归
```

**反序列化过程（ObjectInputStream）：**

```
1. 读取类描述信息，加载对应的 Class 对象
2. 校验 serialVersionUID 是否匹配
3. 创建对象实例（不调用构造函数！）
4. 按字段顺序填充字段值
5. 如果有父类，递归处理父类的反序列化
```

**重要细节：反序列化不调用构造函数！**

```java
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;

    public User() {
        System.out.println("构造函数被调用");
    }

    public User(String name) {
        this.name = name;
    }
}

// 序列化
User user = new User("张三"); // 打印：构造函数被调用
byte[] data = serialize(user);

// 反序列化
User restored = deserialize(data); // 不会打印任何内容！构造函数没被调用
// 但 restored.name 仍然是 "张三"，因为字段值直接从字节流恢复
```

### 10.2.3 serialVersionUID 的作用

serialVersionUID 是序列化版本号，用于确保序列化和反序列化时类的版本一致：

```
场景：类结构发生变化

版本 1：User { name, age } → 序列化保存到文件
版本 2：User { name, age, email } → 从文件反序列化

如果没有 serialVersionUID：
- JVM 自动生成的 UID 基于类结构（字段、方法等）
- 类结构变了，UID 就变了
- 反序列化时发现 UID 不匹配，抛出 InvalidClassException

如果有 serialVersionUID = 1L：
- 手动指定的 UID 不会随类结构变化
- 反序列化时 UID 匹配，可以成功
- 新增的字段 email 会被赋予默认值（null）
- 删除的字段会被忽略
```

### 10.2.4 transient 关键字原理

transient 修饰的字段不会参与序列化过程：

```java
public class User implements Serializable {
    private String name;
    private transient String password; // 密码不会被序列化
    private transient Thread callback; // 线程不可序列化，用 transient 排除
}
```

**transient 的底层原理：**

在序列化过程中，ObjectOutputStream 会调用 `writeObject()` 方法，内部通过反射遍历对象的所有字段。对于 transient 字段，序列化逻辑会直接跳过，不会写入字节流。

**transient 的局限：**

```java
// 问题：transient 只能修饰字段，不能修饰方法
// 问题：static 字段天然不会被序列化（属于类不属于对象），不需要 transient
// 问题：如果整个对象都需要条件序列化，transient 不够用，需要 Externalizable
```

### 10.2.5 Externalizable 接口（自定义序列化）

Externalizable 继承了 Serializable，要求开发者完全控制序列化过程：

```java
import java.io.Externalizable;
import java.io.ObjectInput;
import java.io.ObjectOutput;
import java.io.IOException;

public class User implements Externalizable {
    private String name;
    private String password;

    // Externalizable 要求必须有无参构造函数！
    // 因为反序列化时会先调用无参构造创建对象，再调用 readExternal 填充数据
    public User() {
    }

    public User(String name, String password) {
        this.name = name;
        this.password = password;
    }

    // 自定义序列化：只序列化 name 字段
    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeUTF(name); // 手动决定哪些字段需要写入
        // password 不写入，实现加密效果
    }

    // 自定义反序列化：按写入顺序读取
    @Override
    public void readExternal(ObjectInput in) throws IOException, ClassNotFoundException {
        name = in.readUTF(); // 必须按写入顺序读取
        // password 不读取，保持 null
    }
}
```

**Serializable vs Externalizable 对比：**

| 对比项 | Serializable | Externalizable |
|--------|-------------|----------------|
| 控制粒度 | 默认全部字段，transient 排除 | 完全手动控制 |
| 性能 | 使用反射，较慢 | 直接读写，较快 |
| 构造函数 | 不调用构造函数 | 必须有无参构造函数 |
| 使用难度 | 简单（实现接口即可） | 较复杂（需手动维护读写逻辑） |
| 版本兼容 | 通过 serialVersionUID 控制 | 需要手动保证读写顺序一致 |

### 10.2.6 序列化安全问题

Java 原生序列化存在严重的安全漏洞，被称为"反序列化漏洞"：

**漏洞原理：**

```
攻击者构造恶意字节流：
[序列化的 User 对象] + [恶意的 hashCode 方法]

反序列化过程：
1. 创建 User 对象
2. 填充字段值
3. 如果 User 的某个字段是 HashMap
4. HashMap 反序列化时会自动调用 key 的 hashCode()
5. 如果 hashCode() 里包含恶意代码（如执行系统命令）
6. 反序列化完成时，恶意代码已经被执行了！
```

**真实案例：**

```java
// 常见的反序列化利用链（简化版）
// ObjectInputStream.readObject()
//   → AnnotationInvocationHandler.readObject()
//     → LazyMap.get()
//       → ChainedTransformer.transform()
//         → Runtime.getRuntime().exec("rm -rf /")  // 执行系统命令！
```

**为什么阿里巴巴开发规范不推荐 Java 原生序列化：**

1. **安全风险**：反序列化漏洞可导致远程代码执行（RCE）
2. **性能问题**：使用反射，序列化/反序列化速度慢
3. **跨语言差**：Java 特有的二进制格式，其他语言无法解析
4. **类依赖问题**：反序列化时需要类路径下有相同的类定义
5. **体积大**：序列化后的字节流包含大量元信息，体积较大

### 10.2.7 JSON 序列化原理

JSON 序列化把对象转换成可读的文本格式，底层依赖反射机制：

```
User 对象
    ↓ 反射获取所有字段
[name, age, email]
    ↓ 遍历字段，读取值
{"name": "张三", "age": 25, "email": "zhang@test.com"}
```

**Jackson 序列化流程：**

```
1. 通过 Class.getDeclaredFields() 获取所有字段
2. 过滤掉 @JsonIgnore 标记的字段
3. 对每个字段调用 Field.get(object) 获取值
4. 递归处理嵌套对象
5. 拼接成 JSON 字符串
```

**Gson 序列化流程：**

```
1. 通过 TypeToken 获取泛型类型信息
2. 为每种类型注册 TypeAdapter（类型适配器）
3. 序列化时调用对应 TypeAdapter 的 write 方法
4. TypeAdapter 内部通过反射读写字段
```

**JSON 序列化的优点：**

1. **可读性好**：文本格式，人类可读
2. **跨语言**：所有语言都支持 JSON
3. **安全**：不涉及代码执行，无反序列化漏洞
4. **灵活**：字段可以增删，兼容性好

## 10.3 基础用法

### 10.3.1 Java 原生序列化示例

```java
import java.io.*;

// 用户类，实现 Serializable 接口
class User implements Serializable {
    // 手动指定序列化版本号，保证版本兼容性
    private static final long serialVersionUID = 1L;

    private String name;        // 普通字段，会被序列化
    private int age;            // 基本类型，会被序列化
    private transient String password; // transient 修饰，不会被序列化

    public User(String name, int age, String password) {
        this.name = name;
        this.age = age;
        this.password = password;
    }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + ", password='" + password + "'}";
    }
}

public class SerializationDemo {
    public static void main(String[] args) throws Exception {
        User user = new User("张三", 25, "secret123");

        // 序列化：对象 → 字节流 → 文件
        FileOutputStream fos = new FileOutputStream("user.dat");
        ObjectOutputStream oos = new ObjectOutputStream(fos);
        oos.writeObject(user); // 把对象写入文件
        oos.close();
        System.out.println("序列化完成");

        // 反序列化：文件 → 字节流 → 对象
        FileInputStream fis = new FileInputStream("user.dat");
        ObjectInputStream ois = new ObjectInputStream(fis);
        User restored = (User) ois.readObject(); // 从文件恢复对象
        ois.close();

        // 验证结果
        System.out.println("原始对象：" + user);
        System.out.println("恢复对象：" + restored);
        // 输出：
        // 原始对象：User{name='张三', age=25, password='secret123'}
        // 恢复对象：User{name='张三', age=25, password='null'}  ← password 丢失了！
    }
}
```

### 10.3.2 Externalizable 自定义序列化示例

```java
import java.io.*;

// 使用 Externalizable 完全控制序列化过程
class SecureUser implements Externalizable {
    private static final long serialVersionUID = 1L;

    private String username;
    private String password;
    private String email;

    // Externalizable 必须提供无参构造函数
    public SecureUser() {
    }

    public SecureUser(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    // 自定义序列化逻辑：只序列化 username 和 email，password 加密后序列化
    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeUTF(username);           // 写入用户名
        out.writeUTF(encrypt(password));  // 密码加密后写入
        out.writeUTF(email);              // 写入邮箱
    }

    // 自定义反序列化逻辑：按写入顺序读取
    @Override
    public void readExternal(ObjectInput in) throws IOException {
        username = in.readUTF();           // 读取用户名
        password = decrypt(in.readUTF());  // 读取并解密密码
        email = in.readUTF();              // 读取邮箱
    }

    // 简单的加密方法（实际项目应使用 AES 等强加密）
    private String encrypt(String text) {
        return Base64.getEncoder().encodeToString(text.getBytes());
    }

    // 简单的解密方法
    private String decrypt(String text) {
        return new String(Base64.getDecoder().decode(text));
    }

    @Override
    public String toString() {
        return "SecureUser{username='" + username + "', password='" + password + "', email='" + email + "'}";
    }
}

public class ExternalizableDemo {
    public static void main(String[] args) throws Exception {
        SecureUser user = new SecureUser("zhangsan", "mypassword", "zhang@test.com");

        // 序列化
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(user);
        byte[] data = bos.toByteArray();
        System.out.println("序列化后大小：" + data.length + " 字节");

        // 反序列化
        ByteArrayInputStream bis = new ByteArrayInputStream(data);
        ObjectInputStream ois = new ObjectInputStream(bis);
        SecureUser restored = (SecureUser) ois.readObject();

        System.out.println("恢复的用户：" + restored);
        // 输出：SecureUser{username='zhangsan', password='mypassword', email='zhang@test.com'}
        // 密码虽然被加密存储，但反序列化后自动解密恢复
    }
}
```

### 10.3.3 JSON 序列化示例（使用 Jackson）

```java
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

class UserDTO {
    @JsonProperty("user_name") // 指定 JSON 字段名
    private String name;

    private int age;

    @JsonIgnore // 忽略这个字段，不会出现在 JSON 中
    private String internalId;

    public UserDTO() {}

    public UserDTO(String name, int age, String internalId) {
        this.name = name;
        this.age = age;
        this.internalId = internalId;
    }

    // getter 和 setter 省略（Jackson 需要）
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}

public class JsonSerializationDemo {
    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        UserDTO user = new UserDTO("张三", 25, "INT_001");

        // 对象 → JSON 字符串
        String json = mapper.writeValueAsString(user);
        System.out.println("JSON：" + json);
        // 输出：{"user_name":"张三","age":25}  ← internalId 被忽略了

        // JSON 字符串 → 对象
        UserDTO restored = mapper.readValue(json, UserDTO.class);
        System.out.println("恢复的用户名：" + restored.getName());
    }
}
```

## 10.4 进阶用法

### 10.4.1 序列化方案对比

| 对比项 | Java 原生序列化 | JSON（Jackson/Gson） | Protobuf | Kryo |
|--------|----------------|---------------------|----------|------|
| 格式 | 二进制 | 文本 | 二进制 | 二进制 |
| 可读性 | 差 | 好 | 差 | 差 |
| 跨语言 | 不支持 | 支持 | 支持 | 仅 Java |
| 性能 | 慢（反射） | 中等（反射） | 快（预编译） | 快（字节码生成） |
| 体积 | 大 | 大 | 小 | 小 |
| 安全性 | 差（RCE 漏洞） | 好 | 好 | 中等 |
| 使用难度 | 简单 | 简单 | 中等（需定义 proto） | 简单 |
| 版本兼容 | 差 | 好 | 好 | 中等 |
| 典型场景 | 不推荐 | Web API、配置 | RPC、消息队列 | 缓存、内部 RPC |

### 10.4.2 自定义 Serializable 的 writeObject/readObject

即使使用 Serializable，也可以通过定义私有的 `writeObject` 和 `readObject` 方法来控制序列化行为：

```java
import java.io.*;

class CustomSerializable implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private String sensitiveData;

    public CustomSerializable(String name, String sensitiveData) {
        this.name = name;
        this.sensitiveData = sensitiveData;
    }

    // 自定义序列化：JVM 会通过反射调用这个私有方法
    private void writeObject(ObjectOutputStream out) throws IOException {
        out.defaultWriteObject(); // 先执行默认序列化（序列化非 transient 字段）
        // 可以在这里添加额外的序列化逻辑
        out.writeUTF("额外数据"); // 写入一些附加信息
    }

    // 自定义反序列化：JVM 会通过反射调用这个私有方法
    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject(); // 先执行默认反序列化
        // 可以在这里添加额外的反序列化逻辑
        String extra = in.readUTF(); // 读取附加信息
        System.out.println("读取到附加数据：" + extra);

        // 防御性拷贝：防止反序列化后对象被恶意修改
        this.sensitiveData = this.sensitiveData != null ?
                this.sensitiveData.intern() : null;
    }
}
```

### 10.4.3 序列化性能优化建议

```java
// 1. 避免不必要的字段被序列化
class OptimizedUser implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient String cache; // 缓存数据不需要序列化
    private static final String CONSTANT = "CONST"; // 静态字段不会序列化
}

// 2. 使用 Externalizable 替代 Serializable（性能更好）
// 3. 使用 Protobuf 或 Kryo 替代 Java 原生序列化
// 4. 对于大对象，考虑分块序列化
// 5. 使用 @JsonIgnore 或 transient 排除不需要传输的字段
```

## 10.5 核心知识点总结

| 知识点 | 核心要点 |
|--------|----------|
| 序列化本质 | 对象图 → 线性字节序列，反序列化是逆过程 |
| Serializable | 标记接口，JVM 通过反射自动序列化所有非 transient 字段 |
| serialVersionUID | 序列化版本号，用于验证类版本一致性，建议手动声明 |
| transient | 修饰字段不参与序列化，底层通过反射遍历时跳过 |
| Externalizable | 完全手动控制序列化过程，性能更好但使用复杂 |
| 反序列化漏洞 | 恶意字节流可在反序列化时执行任意代码，安全风险极高 |
| JSON 序列化 | 基于反射获取字段信息，可读性好、跨语言，但性能中等 |
| 序列化选型 | 内部 RPC 用 Protobuf/Kryo，Web API 用 JSON，避免 Java 原生序列化 |

## 10.6 新手常见误区

### 误区 1：static 字段会被序列化

**错误理解：** 类的所有字段都会被序列化。

**正确理解：** static 字段属于类，不属于对象实例，因此不会被序列化。序列化只保存对象实例的状态。反序列化后，static 字段的值是类当前的值，而不是序列化时的值。

### 误区 2：反序列化会调用构造函数

**错误理解：** 反序列化时会调用类的构造函数创建对象。

**正确理解：** 反序列化通过 `Unsafe.allocateInstance()` 直接分配内存创建对象，绕过构造函数。这是为了保证即使构造函数有副作用（如连接数据库），反序列化时也不会执行。Externalizable 是例外，它会先调用无参构造函数，再调用 `readExternal()`。

### 误区 3：transient 可以修饰方法

**错误理解：** 可以用 transient 修饰方法，让方法不被序列化。

**正确理解：** transient 只能修饰字段，不能修饰方法或类。方法本身不会被序列化，只有字段的状态会被保存。如果想控制整个对象的序列化行为，应该使用 Externalizable 或自定义 writeObject/readObject。

### 误区 4：JSON 序列化没有安全风险

**错误理解：** JSON 是文本格式，不会有安全问题。

**正确理解：** 虽然 JSON 本身比 Java 原生序列化安全得多，但如果 JSON 反序列化框架配置不当（如开启了多态类型支持 `@JsonTypeInfo`），攻击者仍可能通过构造恶意 JSON 触发类加载和实例化，导致安全问题。应始终限制可反序列化的类型白名单。

### 误区 5：serialVersionUID 不一致也能反序列化成功

**错误理解：** serialVersionUID 只是警告，不一致也能反序列化。

**正确理解：** 如果 serialVersionUID 不一致，ObjectInputStream 会直接抛出 `InvalidClassException`，反序列化失败。只有 serialVersionUID 完全一致时，反序列化才会继续。这也是为什么强烈建议手动声明 serialVersionUID——避免类结构变化后自动生成的 UID 改变导致旧数据无法反序列化。

## 10.7 动手练习

### 练习 1：实现一个支持序列化的单例类

实现一个单例模式的 UserSession 类，要求：
1. 实现 Serializable 接口
2. 保证序列化后反序列化回来的对象仍然是同一个实例（单例不被破坏）
3. 使用 readResolve 方法解决反序列化破坏单例的问题

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;

class UserSession implements Serializable {
    private static final long serialVersionUID = 1L;

    // 单例实例
    private static final UserSession INSTANCE = new UserSession();

    private String currentUser;

    // 私有构造函数，防止外部创建新实例
    private UserSession() {
        this.currentUser = null;
    }

    // 获取单例实例
    public static UserSession getInstance() {
        return INSTANCE;
    }

    public void login(String user) {
        this.currentUser = user;
    }

    public String getCurrentUser() {
        return currentUser;
    }

    // 关键：readResolve 方法
    // 反序列化后，JVM 会调用这个方法，用返回值替代新创建的对象
    // 这样就能保证反序列化返回的仍然是单例实例
    private Object readResolve() throws ObjectStreamException {
        return INSTANCE; // 返回单例，丢弃反序列化创建的新对象
    }
}

public class SingletonSerializationDemo {
    public static void main(String[] args) throws Exception {
        UserSession session = UserSession.getInstance();
        session.login("张三");

        // 序列化
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(session);
        oos.close();

        // 反序列化
        ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
        ObjectInputStream ois = new ObjectInputStream(bis);
        UserSession restored = (UserSession) ois.readObject();

        // 验证是否是同一个实例
        System.out.println("原始实例：" + session);
        System.out.println("恢复实例：" + restored);
        System.out.println("是否同一实例：" + (session == restored)); // true
        System.out.println("当前用户：" + restored.getCurrentUser()); // 张三
    }
}
```
</details>

### 练习 2：实现一个安全的序列化类

实现一个 User 类，要求：
1. 使用 Externalizable 接口
2. password 字段序列化时加密（简单 Base64 即可）
3. 反序列化时自动解密
4. 验证序列化前后数据一致性

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.util.Base64;

class SecureUser implements Externalizable {
    private static final long serialVersionUID = 1L;
    private static final String SECRET_KEY = "my_secret_key"; // 实际项目应使用更强的加密

    private String username;
    private String password;
    private int age;

    // Externalizable 必须有无参构造函数
    public SecureUser() {}

    public SecureUser(String username, String password, int age) {
        this.username = username;
        this.password = password;
        this.age = age;
    }

    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeUTF(username);
        out.writeUTF(encrypt(password)); // 加密后写入
        out.writeInt(age);
    }

    @Override
    public void readExternal(ObjectInput in) throws IOException {
        username = in.readUTF();
        password = decrypt(in.readUTF()); // 读取后解密
        age = in.readInt();
    }

    private String encrypt(String text) {
        // 简单异或加密（演示用，实际应使用 AES）
        byte[] data = text.getBytes();
        byte[] key = SECRET_KEY.getBytes();
        byte[] result = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            result[i] = (byte) (data[i] ^ key[i % key.length]);
        }
        return Base64.getEncoder().encodeToString(result);
    }

    private String decrypt(String text) {
        byte[] data = Base64.getDecoder().decode(text);
        byte[] key = SECRET_KEY.getBytes();
        byte[] result = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            result[i] = (byte) (data[i] ^ key[i % key.length]);
        }
        return new String(result);
    }

    @Override
    public String toString() {
        return "SecureUser{username='" + username + "', password='" + password + "', age=" + age + "}";
    }
}

public class SecureSerializationDemo {
    public static void main(String[] args) throws Exception {
        SecureUser user = new SecureUser("zhangsan", "password123", 25);
        System.out.println("原始用户：" + user);

        // 序列化
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(user);
        byte[] data = bos.toByteArray();
        System.out.println("序列化数据大小：" + data.length + " 字节");

        // 反序列化
        ByteArrayInputStream bis = new ByteArrayInputStream(data);
        ObjectInputStream ois = new ObjectInputStream(bis);
        SecureUser restored = (SecureUser) ois.readObject();
        System.out.println("恢复用户：" + restored);

        // 验证
        System.out.println("用户名一致：" + user.username.equals(restored.username));
        System.out.println("密码一致：" + user.password.equals(restored.password));
        System.out.println("年龄一致：" + (user.age == restored.age));
    }
}
```
</details>

### 练习 3：手写一个简单的 JSON 序列化工具

不依赖任何第三方库，使用反射实现一个简单的对象转 JSON 字符串的工具类：
1. 支持基本类型和 String
2. 支持嵌套对象（递归处理）
3. 支持数组和 List 集合

<details>
<summary>点击查看答案</summary>

```java
import java.lang.reflect.Field;
import java.util.*;

public class SimpleJsonSerializer {

    // 把对象转换成 JSON 字符串
    public static String toJson(Object obj) throws Exception {
        if (obj == null) {
            return "null"; // null 对象直接返回 "null"
        }

        Class<?> clazz = obj.getClass();

        // 处理基本类型和包装类
        if (isPrimitive(clazz)) {
            return formatPrimitive(obj); // 基本类型直接格式化
        }

        // 处理 String
        if (obj instanceof String) {
            return "\"" + escapeString((String) obj) + "\""; // 字符串加引号并转义
        }

        // 处理数组
        if (clazz.isArray()) {
            return arrayToJson(obj); // 数组递归处理
        }

        // 处理 Collection（List、Set 等）
        if (obj instanceof Collection) {
            return collectionToJson((Collection<?>) obj); // 集合递归处理
        }

        // 处理普通对象：通过反射获取所有字段
        return objectToJson(obj);
    }

    // 处理普通对象
    private static String objectToJson(Object obj) throws Exception {
        StringBuilder sb = new StringBuilder("{"); // JSON 对象以 { 开头
        Field[] fields = obj.getClass().getDeclaredFields(); // 获取所有声明字段
        boolean first = true;

        for (Field field : fields) {
            // 跳过 static 和 transient 字段
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) continue;
            if (java.lang.reflect.Modifier.isTransient(field.getModifiers())) continue;

            field.setAccessible(true); // 允许访问私有字段
            Object value = field.get(obj); // 获取字段值

            if (!first) sb.append(","); // 非第一个字段前加逗号
            sb.append("\"").append(field.getName()).append("\":"); // 写入字段名
            sb.append(toJson(value)); // 递归处理字段值
            first = false;
        }

        sb.append("}"); // JSON 对象以 } 结尾
        return sb.toString();
    }

    // 处理数组
    private static String arrayToJson(Object array) throws Exception {
        StringBuilder sb = new StringBuilder("["); // JSON 数组以 [ 开头
        int length = java.lang.reflect.Array.getLength(array); // 获取数组长度

        for (int i = 0; i < length; i++) {
            if (i > 0) sb.append(","); // 元素间加逗号
            Object element = java.lang.reflect.Array.get(array, i); // 获取数组元素
            sb.append(toJson(element)); // 递归处理元素
        }

        sb.append("]"); // JSON 数组以 ] 结尾
        return sb.toString();
    }

    // 处理集合
    private static String collectionToJson(Collection<?> collection) throws Exception {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;

        for (Object item : collection) {
            if (!first) sb.append(",");
            sb.append(toJson(item)); // 递归处理集合元素
            first = false;
        }

        sb.append("]");
        return sb.toString();
    }

    // 判断是否是基本类型或包装类
    private static boolean isPrimitive(Class<?> clazz) {
        return clazz.isPrimitive() ||
               clazz == Integer.class || clazz == Long.class ||
               clazz == Double.class || clazz == Float.class ||
               clazz == Boolean.class || clazz == Byte.class ||
               clazz == Short.class || clazz == Character.class;
    }

    // 格式化基本类型
    private static String formatPrimitive(Object obj) {
        if (obj instanceof Boolean) {
            return obj.toString(); // 布尔值不加引号
        }
        if (obj instanceof Character) {
            return "\"" + escapeString(obj.toString()) + "\""; // 字符当字符串处理
        }
        return obj.toString(); // 数字直接转字符串
    }

    // 转义字符串中的特殊字符
    private static String escapeString(String str) {
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    // 测试
    public static void main(String[] args) throws Exception {
        // 简单对象
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("name", "张三");
        user.put("age", 25);
        user.put("scores", new int[]{90, 85, 92});
        System.out.println(toJson(user));
        // 输出：{"name":"张三","age":25,"scores":[90,85,92]}
    }
}
```
</details>

## 下一章预告

下一章我们将学习 **网络编程原理**。从最基础的 Socket 编程开始，理解 BIO 网络模型的瓶颈，掌握 NIO 网络编程的核心模式，深入了解 Reactor 模式和 Netty 的架构设计。敬请期待！
