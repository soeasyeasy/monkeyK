---
title: '第十五章：JDBC 数据库编程'
description: 'JDBC 连接、PreparedStatement、事务管理'
---

# 第十五章：JDBC 数据库编程

## JDBC 简介

JDBC（Java Database Connectivity）是 Java 连接数据库的标准 API。

## 连接数据库

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

String url = "jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC";
String user = "root";
String password = "123456";

try (Connection conn = DriverManager.getConnection(url, user, password)) {
    System.out.println("连接成功！");
} catch (SQLException e) {
    e.printStackTrace();
}
```

## 执行 SQL

### Statement（不推荐）

```java
try (Statement stmt = conn.createStatement()) {
    ResultSet rs = stmt.executeQuery("SELECT * FROM users");
    while (rs.next()) {
        System.out.println(rs.getString("name") + ", " + rs.getInt("age"));
    }
}
```

### PreparedStatement（推荐）

防止 SQL 注入，性能更好。

```java
// 查询
String sql = "SELECT * FROM users WHERE age > ?";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, 18);
    ResultSet rs = pstmt.executeQuery();
    while (rs.next()) {
        System.out.println(rs.getString("name"));
    }
}

// 插入
String insertSql = "INSERT INTO users (name, age, email) VALUES (?, ?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
    pstmt.setString(1, "张三");
    pstmt.setInt(2, 25);
    pstmt.setString(3, "zhangsan@example.com");
    int rows = pstmt.executeUpdate();
    System.out.println("插入 " + rows + " 行");
}

// 更新
String updateSql = "UPDATE users SET age = ? WHERE name = ?";
try (PreparedStatement pstmt = conn.prepareStatement(updateSql)) {
    pstmt.setInt(1, 26);
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

## ResultSet

```java
ResultSet rs = pstmt.executeQuery();

while (rs.next()) {
    // 按列名获取
    String name = rs.getString("name");
    int age = rs.getInt("age");
    String email = rs.getString("email");

    // 按列索引获取（从 1 开始）
    String name2 = rs.getString(1);
    int age2 = rs.getInt(2);
}
```

## 事务管理

```java
Connection conn = null;
try {
    conn = DriverManager.getConnection(url, user, password);

    // 开启事务
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
            conn.setAutoCommit(true);
            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

## 封装 JDBC 工具类

```java
public class DBUtil {
    private static final String URL = "jdbc:mysql://localhost:3306/mydb";
    private static final String USER = "root";
    private static final String PASSWORD = "123456";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void close(Connection conn, Statement stmt, ResultSet rs) {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

## 连接池

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

### Druid

Maven 依赖：

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.2.20</version>
</dependency>
```

使用示例：

```java
import com.alibaba.druid.pool.DruidDataSource;

DruidDataSource ds = new DruidDataSource();
ds.setUrl("jdbc:mysql://localhost:3306/mydb");
ds.setUsername("root");
ds.setPassword("123456");
ds.setInitialSize(5);
ds.setMaxActive(10);
ds.setMinIdle(5);

Connection conn = ds.getConnection();
// 使用连接...
```

## DAO 模式

使用 DAO（Data Access Object）模式封装数据库操作，解耦业务逻辑。

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

    @Override
    public void update(User user) {
        String sql = "UPDATE users SET name=?, age=?, email=? WHERE id=?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user.getName());
            pstmt.setInt(2, user.getAge());
            pstmt.setString(3, user.getEmail());
            pstmt.setInt(4, user.getId());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("更新用户失败", e);
        }
    }

    @Override
    public void delete(int id) {
        String sql = "DELETE FROM users WHERE id=?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("删除用户失败", e);
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

### 使用 DAO

```java
// 初始化
DataSource ds = new HikariDataSource(config);
UserDao userDao = new UserDaoImpl(ds);

// 查询
User user = userDao.findById(1);
List<User> allUsers = userDao.findAll();

// 插入
User newUser = new User();
newUser.setName("张三");
newUser.setAge(25);
newUser.setEmail("zhangsan@example.com");
userDao.insert(newUser);

// 更新
user.setAge(26);
userDao.update(user);

// 删除
userDao.delete(1);
```

## 批处理

```java
String sql = "INSERT INTO users (name, age, email) VALUES (?, ?, ?)";
try (Connection conn = getConnection();
     PreparedStatement pstmt = conn.prepareStatement(sql)) {

    conn.setAutoCommit(false);

    for (int i = 0; i < 1000; i++) {
        pstmt.setString(1, "用户" + i);
        pstmt.setInt(2, 20 + i % 50);
        pstmt.setString(3, "user" + i + "@example.com");
        pstmt.addBatch();  // 添加到批处理

        if (i % 100 == 99) {
            pstmt.executeBatch();  // 每 100 条执行一次
            pstmt.clearBatch();
        }
    }

    conn.commit();
} catch (SQLException e) {
    e.printStackTrace();
}
```

## SQL 注入防护

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

## 元数据

```java
// 数据库元数据
DatabaseMetaData dbMeta = conn.getMetaData();
System.out.println("数据库产品: " + dbMeta.getDatabaseProductName());
System.out.println("数据库版本: " + dbMeta.getDatabaseProductVersion());

// ResultSet 元数据
ResultSetMetaData rsMeta = rs.getMetaData();
int columnCount = rsMeta.getColumnCount();
for (int i = 1; i <= columnCount; i++) {
    System.out.println("列名: " + rsMeta.getColumnName(i));
    System.out.println("类型: " + rsMeta.getColumnTypeName(i));
}

// PreparedStatement 参数元数据
ParameterMetaData paramMeta = pstmt.getParameterMetaData();
System.out.println("参数个数: " + paramMeta.getParameterCount());
```

## 核心知识点

1. **JDBC 连接**：DriverManager 或 DataSource 获取连接
2. **PreparedStatement**：预编译 SQL，防止注入，性能更好
3. **ResultSet**：遍历查询结果，按列名或索引获取数据
4. **事务管理**：setAutoCommit(false)、commit()、rollback()
5. **连接池**：HikariCP、Druid 等，复用连接提高性能
6. **DAO 模式**：封装数据库操作，解耦业务逻辑
7. **批处理**：addBatch()、executeBatch() 提高批量操作效率

## 本章小结

JDBC 是 Java 操作数据库的标准 API。推荐使用 PreparedStatement 防止 SQL 注入。事务通过 setAutoCommit(false)、commit()、rollback() 管理。实际项目中使用连接池和 DAO 模式提高性能和可维护性。接下来我们将学习 Maven 与项目构建。
