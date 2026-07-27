---
title: '第十九章：JDBC 数据库编程'
description: 'JDBC 连接、PreparedStatement、事务管理'
---

# 第十九章：JDBC 数据库编程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 程序怎么连接数据库？
- 什么是 JDBC？它和数据库是什么关系？
- 怎么防止 SQL 注入攻击？
- 什么是事务？怎么保证数据一致性？

这一章就是为了解答这些问题。我们会先搞清楚 **JDBC 的核心概念**，再动手实践数据库连接、SQL 执行、事务管理。学完这章，你就能在 Java 程序中操作数据库了。

---

## 1 为什么需要 JDBC？

### 痛点分析

程序运行时数据都在内存里，关机就没了。怎么把数据**永久保存**到数据库中？

```java
// ❌ 没有数据库：数据只在内存中
List<User> users = new ArrayList<>();
users.add(new User("张三", 25));
// 程序关闭后，users 就没了
```

### 解决方案

```java
// ✅ 用 JDBC：把数据保存到数据库
String sql = "INSERT INTO users (name, age) VALUES (?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, "张三");
    pstmt.setInt(2, 25);
    pstmt.executeUpdate();  // 数据永久保存到数据库了
}
```

> **一句话总结**：JDBC 是 Java 连接数据库的"桥梁"，让程序能操作数据库中的数据。

### 生活类比

打个比方：

> JDBC 就像**翻译官**——你说中文（Java 代码），数据库说英文（SQL），JDBC 帮你翻译，让双方能沟通。

---

## 2 核心原理

### JDBC 架构

```
Java 程序
    ↓
JDBC API（java.sql.*）
    ↓
JDBC 驱动（数据库厂商提供）
    ↓
数据库（MySQL、Oracle、PostgreSQL）
```

打个比方：

> JDBC 驱动就像**USB 驱动**——不同的数据库（设备）需要不同的驱动（驱动程序），JDBC API 是统一的接口标准。

### JDBC 核心接口

| 接口              | 说明               |
| ----------------- | ------------------ |
| Connection        | 数据库连接         |
| Statement         | 执行 SQL 语句      |
| PreparedStatement | 预编译 SQL（推荐） |
| ResultSet         | 查询结果集         |

---

## 3 基础用法

### 1. 添加驱动依赖

Maven 项目添加 MySQL 驱动：

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.0.33</version>
</dependency>
```

### 2. 建立连接

```java
import java.sql.*;

// 数据库连接信息
String url = "jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC";
String user = "root";
String password = "123456";

// 使用 try-with-resources 自动关闭连接
try (Connection conn = DriverManager.getConnection(url, user, password)) {
    System.out.println("连接成功！");
} catch (SQLException e) {
    e.printStackTrace();
}
```

### 3. 执行 SQL

#### Statement（不推荐）

```java
try (Statement stmt = conn.createStatement()) {
    ResultSet rs = stmt.executeQuery("SELECT * FROM users");
    while (rs.next()) {
        System.out.println(rs.getString("name") + ", " + rs.getInt("age"));
    }
}
```

#### PreparedStatement（推荐）

防止 SQL 注入，性能更好。

```java
// 查询
String sql = "SELECT * FROM users WHERE age > ?";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, 18);  // 设置参数：第一个 ? 设为 18
    ResultSet rs = pstmt.executeQuery();  // 执行查询
    while (rs.next()) {
        System.out.println(rs.getString("name"));
    }
}

// 插入
String insertSql = "INSERT INTO users (name, age, email) VALUES (?, ?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
    pstmt.setString(1, "张三");  // 第一个 ? 设为 "张三"
    pstmt.setInt(2, 25);         // 第二个 ? 设为 25
    pstmt.setString(3, "zhangsan@example.com");
    int rows = pstmt.executeUpdate();  // 执行插入，返回受影响行数
    System.out.println("插入 " + rows + " 行");
}

// 更新
String updateSql = "UPDATE users SET age = ? WHERE name = ?";
try (PreparedStatement pstmt = conn.prepareStatement(updateSql)) {
    pstmt.setInt(1, 26);     // 新年龄
    pstmt.setString(2, "张三");
    int rows = pstmt.executeUpdate();
    System.out.println("更新 " + rows + " 行");
}

// 删除
String deleteSql = "DELETE FROM users WHERE name = ?";
try (PreparedStatement pstmt = conn.prepareStatement(deleteSql)) {
    pstmt.setString(1, "张三");
    int rows = pstmt.executeUpdate();
    System.out.println("删除 " + rows + " 行");
}
```

### 4. ResultSet

```java
ResultSet rs = pstmt.executeQuery();

while (rs.next()) {  // 遍历结果集
    // 按列名获取
    String name = rs.getString("name");
    int age = rs.getInt("age");
    String email = rs.getString("email");

    // 按列索引获取（从 1 开始）
    String name2 = rs.getString(1);
    int age2 = rs.getInt(2);
}
```

### Statement vs PreparedStatement 对比

| 特性         | Statement          | PreparedStatement  |
| ------------ | ------------------ | ------------------ |
| SQL 注入防护 | ❌ 容易受攻击      | ✅ 自动转义参数    |
| 性能         | 每次编译 SQL       | 预编译，可复用     |
| 参数绑定     | ❌ 不支持          | ✅ 支持 `?` 占位符 |
| 适用场景     | 静态 SQL（无参数） | 动态 SQL（有参数） |
| 代码可读性   | 差（字符串拼接）   | 好（参数分离）     |
| **推荐度**   | ❌ 不推荐          | ✅ **强烈推荐**    |

### 连接方式对比

| 方式          | 实现            | 连接池    | 性能               | 适用场景         |
| ------------- | --------------- | --------- | ------------------ | ---------------- |
| DriverManager | JDBC 原生       | ❌ 无     | 差（每次创建连接） | 学习/测试        |
| DataSource    | 接口            | ✅ 支持   | 好（复用连接）     | **生产环境**     |
| HikariCP      | DataSource 实现 | ✅ 高性能 | 最优               | Spring Boot 默认 |
| Druid         | DataSource 实现 | ✅ 带监控 | 优秀               | 阿里生态         |

---

## 4 事务管理

事务保证多个操作要么全部成功，要么全部失败。

```java
Connection conn = null;
try {
    conn = DriverManager.getConnection(url, user, password);

    // 开启事务（关闭自动提交）
    conn.setAutoCommit(false);

    // 执行多个 SQL
    try (PreparedStatement pstmt1 = conn.prepareStatement(
            "UPDATE accounts SET balance = balance - ? WHERE name = ?")) {
        pstmt1.setDouble(1, 100);
        pstmt1.setString(2, "张三");
        pstmt1.executeUpdate();
    }

    try (PreparedStatement pstmt2 = conn.prepareStatement(
            "UPDATE accounts SET balance = balance + ? WHERE name = ?")) {
        pstmt2.setDouble(1, 100);
        pstmt2.setString(2, "李四");
        pstmt2.executeUpdate();
    }

    // 提交事务
    conn.commit();
    System.out.println("转账成功");

} catch (SQLException e) {
    // 回滚事务
    if (conn != null) {
        try {
            conn.rollback();
            System.out.println("转账失败，已回滚");
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
    }
} finally {
    if (conn != null) {
        try {
            conn.setAutoCommit(true);  // 恢复自动提交
            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

---

## 5 连接池

实际项目中推荐使用连接池，避免频繁创建和关闭连接。

### HikariCP（推荐）

Maven 依赖：

```xml
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>5.0.1</version>
</dependency>
```

使用示例：

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
config.setUsername("root");
config.setPassword("123456");
config.setMaximumPoolSize(10);        // 最大连接数
config.setMinimumIdle(5);             // 最小空闲连接
config.setConnectionTimeout(30000);   // 连接超时（毫秒）
config.setIdleTimeout(600000);        // 空闲超时
config.setMaxLifetime(1800000);       // 连接最大存活时间

try (HikariDataSource ds = new HikariDataSource(config)) {
    Connection conn = ds.getConnection();
    // 使用连接...
    // 关闭时归还到连接池，而不是真正关闭
}
```

---

## 6 DAO 模式

DAO（Data Access Object）模式封装数据库操作，解耦业务逻辑。

### 实体类

```java
public class User {
    private int id;
    private String name;
    private int age;
    private String email;

    // 构造器、getter、setter、toString 省略
}
```

### DAO 接口

```java
public interface UserDao {
    User findById(int id);
    List<User> findAll();
    void insert(User user);
    void update(User user);
    void delete(int id);
}
```

### DAO 实现

```java
public class UserDaoImpl implements UserDao {
    private DataSource dataSource;

    public UserDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public User findById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("查询用户失败", e);
        }
        return null;
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        List<User> users = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            while (rs.next()) {
                users.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("查询所有用户失败", e);
        }
        return users;
    }

    @Override
    public void insert(User user) {
        String sql = "INSERT INTO users (name, age, email) VALUES (?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user.getName());
            pstmt.setInt(2, user.getAge());
            pstmt.setString(3, user.getEmail());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("插入用户失败", e);
        }
    }

    private User mapRow(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getInt("id"));
        user.setName(rs.getString("name"));
        user.setAge(rs.getInt("age"));
        user.setEmail(rs.getString("email"));
        return user;
    }
}
```

---

## 7 新手常见误区

### 误区 1：使用 Statement 而不是 PreparedStatement

**错！** Statement 容易被 SQL 注入攻击。

```java
// ❌ 危险：字符串拼接 SQL
String name = "'; DROP TABLE users; --";
String sql = "SELECT * FROM users WHERE name = '" + name + "'";
// 实际执行：SELECT * FROM users WHERE name = ''; DROP TABLE users; --'

// ✅ 安全：使用 PreparedStatement
String sql = "SELECT * FROM users WHERE name = ?";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, name);  // 自动转义特殊字符
    ResultSet rs = pstmt.executeQuery();
}
```

### 误区 2：不关闭资源

**错！** 不关闭连接会导致资源泄漏。

```java
// ❌ 错误：忘记关闭
Connection conn = DriverManager.getConnection(url, user, password);
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users");
// 忘记关闭了！

// ✅ 正确：使用 try-with-resources
try (Connection conn = DriverManager.getConnection(url, user, password);
     PreparedStatement pstmt = conn.prepareStatement(sql);
     ResultSet rs = pstmt.executeQuery()) {
    // 自动关闭
}
```

### 误区 3：每次操作都创建新连接

**错！** 频繁创建连接性能很差，应该使用连接池。

```java
// ❌ 错误：每次创建新连接
Connection conn = DriverManager.getConnection(url, user, password);
// 使用...
conn.close();

// ✅ 正确：使用连接池
DataSource ds = new HikariDataSource(config);
Connection conn = ds.getConnection();
// 使用...
conn.close();  // 归还到连接池，不是真正关闭
```

### 误区 4：事务中忘记 rollback

**错！** 发生异常时必须回滚，否则数据不一致。

```java
// ❌ 错误：没有回滚
try {
    conn.setAutoCommit(false);
    // 执行 SQL...
    conn.commit();
} catch (SQLException e) {
    // 忘记 rollback 了！
}

// ✅ 正确：异常时回滚
try {
    conn.setAutoCommit(false);
    // 执行 SQL...
    conn.commit();
} catch (SQLException e) {
    conn.rollback();  // 回滚事务
}
```

### 误区 5：在 DAO 中处理业务逻辑

**错！** DAO 只负责数据访问，业务逻辑应该在 Service 层。

```java
// ❌ 错误：DAO 中处理业务逻辑
public void transfer(String from, String to, double amount) {
    // 查询余额、判断、扣款、入账...
}

// ✅ 正确：DAO 只做数据操作
public interface UserDao {
    User findById(int id);
    void update(User user);
}

// 业务逻辑在 Service 层
public class UserService {
    public void transfer(int fromId, int toId, double amount) {
        User from = userDao.findById(fromId);
        User to = userDao.findById(toId);
        // 业务逻辑...
        userDao.update(from);
        userDao.update(to);
    }
}
```

---

## 8 动手练习

### 练习 1：基础练习 —— 查询用户

编写一个方法，根据用户 ID 查询用户信息并打印。

<details>
<summary>点击查看答案</summary>

```java
import java.sql.*;

public class UserDao {
    private String url = "jdbc:mysql://localhost:3306/mydb";
    private String user = "root";
    private String password = "123456";

    public void findUserById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);  // 设置参数
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    // 打印用户信息
                    System.out.println("ID: " + rs.getInt("id"));
                    System.out.println("姓名: " + rs.getString("name"));
                    System.out.println("年龄: " + rs.getInt("age"));
                    System.out.println("邮箱: " + rs.getString("email"));
                } else {
                    System.out.println("用户不存在");
                }
            }
        } catch (SQLException e) {
            System.out.println("查询失败: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        UserDao dao = new UserDao();
        dao.findUserById(1);
    }
}
```

</details>

### 练习 2：进阶练习 —— 插入用户

编写一个方法，插入新用户并返回生成的用户 ID。

<details>
<summary>点击查看答案</summary>

```java
import java.sql.*;

public class UserDao {
    private String url = "jdbc:mysql://localhost:3306/mydb";
    private String user = "root";
    private String password = "123456";

    public int insertUser(String name, int age, String email) {
        String sql = "INSERT INTO users (name, age, email) VALUES (?, ?, ?)";
        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            pstmt.setString(1, name);
            pstmt.setInt(2, age);
            pstmt.setString(3, email);
            int rows = pstmt.executeUpdate();
            if (rows > 0) {
                // 获取生成的主键
                try (ResultSet rs = pstmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        return rs.getInt(1);  // 返回生成的 ID
                    }
                }
            }
        } catch (SQLException e) {
            System.out.println("插入失败: " + e.getMessage());
        }
        return -1;
    }

    public static void main(String[] args) {
        UserDao dao = new UserDao();
        int id = dao.insertUser("张三", 25, "zhangsan@example.com");
        System.out.println("插入成功，ID: " + id);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 转账事务

实现转账功能，使用事务保证数据一致性。

<details>
<summary>点击查看答案</summary>

```java
import java.sql.*;

public class AccountService {
    private String url = "jdbc:mysql://localhost:3306/mydb";
    private String user = "root";
    private String password = "123456";

    public boolean transfer(int fromId, int toId, double amount) {
        Connection conn = null;
        try {
            conn = DriverManager.getConnection(url, user, password);
            conn.setAutoCommit(false);  // 开启事务

            // 扣款
            String sql1 = "UPDATE accounts SET balance = balance - ? WHERE id = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(sql1)) {
                pstmt.setDouble(1, amount);
                pstmt.setInt(2, fromId);
                int rows = pstmt.executeUpdate();
                if (rows == 0) {
                    throw new SQLException("付款账户不存在");
                }
            }

            // 入账
            String sql2 = "UPDATE accounts SET balance = balance + ? WHERE id = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(sql2)) {
                pstmt.setDouble(1, amount);
                pstmt.setInt(2, toId);
                int rows = pstmt.executeUpdate();
                if (rows == 0) {
                    throw new SQLException("收款账户不存在");
                }
            }

            conn.commit();  // 提交事务
            return true;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();  // 回滚事务
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            System.out.println("转账失败: " + e.getMessage());
            return false;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public static void main(String[] args) {
        AccountService service = new AccountService();
        boolean success = service.transfer(1, 2, 100);
        System.out.println("转账结果: " + (success ? "成功" : "失败"));
    }
}
```

</details>

---

## 9 核心知识点

| 知识点            | 说明                                       |
| ----------------- | ------------------------------------------ |
| JDBC 连接         | DriverManager 或 DataSource 获取连接       |
| PreparedStatement | 预编译 SQL，防止注入，性能更好             |
| ResultSet         | 遍历查询结果，按列名或索引获取数据         |
| 事务管理          | setAutoCommit(false)、commit()、rollback() |
| 连接池            | HikariCP、Druid 等，复用连接提高性能       |
| DAO 模式          | 封装数据库操作，解耦业务逻辑               |

---

## 下一章预告

下一章我们会学习 **Maven 与项目构建**——Java 的项目管理和依赖管理工具。你会学到 pom.xml 配置、依赖管理、生命周期、插件配置。学完这章，你就能用 Maven 管理 Java 项目了。
