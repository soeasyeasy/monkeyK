---
title: "第7章：参数映射原理"
description: "#{}与${}原理、ParameterHandler、类型转换机制"
---

# 第7章：参数映射原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- #{} 和 ${} 有什么区别？底层是如何实现的？
- ParameterHandler 是如何设置参数的？
- 参数是如何从 Java 对象映射到 SQL 的？
- 类型转换是如何工作的？

这一章就是为了解答这些问题。我们会从 **#{} 与 ${} 的区别** 入手，再深入 **ParameterHandler 的实现原理**。

---

## 1 为什么需要参数映射？

### 痛点分析

JDBC 设置参数需要手动处理类型转换：

```java
// ❌ JDBC 方式：手动设置参数
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, user.getId());
pstmt.setString(2, user.getName());
pstmt.setDate(3, new java.sql.Date(user.getBirthday().getTime()));
```

### 解决方案

MyBatis 自动完成参数映射：

```java
// ✅ MyBatis 方式：自动映射
@Select("SELECT * FROM user WHERE id = #{id} AND name = #{name}")
User selectUser(@Param("id") int id, @Param("name") String name);
```

> **一句话总结**：参数映射让你专注于业务逻辑，而不必关心类型转换细节。

---

## 2 #{} 与 ${} 的区别

### 2.1 对比表

| 特性 | #{} | ${} |
|------|-----|-----|
| **本质** | 预编译参数 | 字符串替换 |
| **SQL 方式** | PreparedStatement | Statement |
| **安全性** | 安全（防 SQL 注入） | 不安全 |
| **使用场景** | 参数值 | 表名、列名、动态排序 |
| **性能** | 可缓存执行计划 | 每次生成新 SQL |

### 2.2 代码示例

```xml
<!-- ✅ #{}：预编译参数 -->
<select id="selectById" resultType="User">
    SELECT * FROM user WHERE id = #{id}
</select>
<!-- 生成：SELECT * FROM user WHERE id = ? -->

<!-- ❌ ${}：字符串替换 -->
<select id="selectByTable" resultType="User">
    SELECT * FROM ${tableName} WHERE id = #{id}
</select>
<!-- 生成：SELECT * FROM user WHERE id = ? -->
```

### 2.3 原理对比

```java
// #{} 原理：PreparedStatement
String sql = "SELECT * FROM user WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, 1);  // 参数作为值处理

// ${} 原理：字符串拼接
String tableName = "user";
String sql = "SELECT * FROM " + tableName + " WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, 1);
```

---

## 3 ParameterHandler 原理

### 3.1 核心接口

```java
public interface ParameterHandler {
    // 获取参数对象
    Object getParameterObject();
    
    // 设置参数
    void setParameters(PreparedStatement ps) throws SQLException;
}
```

### 3.2 默认实现：DefaultParameterHandler

```java
public class DefaultParameterHandler implements ParameterHandler {
    private final TypeHandlerRegistry typeHandlerRegistry;
    private final MappedStatement mappedStatement;
    private final Object parameterObject;
    private final BoundSql boundSql;
    private final Configuration configuration;
    
    @Override
    public void setParameters(PreparedStatement ps) throws SQLException {
        // 1. 获取参数映射列表
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        
        if (parameterMappings != null) {
            for (int i = 0; i < parameterMappings.size(); i++) {
                ParameterMapping parameterMapping = parameterMappings.get(i);
                
                // 2. 获取参数值
                Object value = null;
                String propertyName = parameterMapping.getProperty();
                
                if (boundSql.hasAdditionalParameter(propertyName)) {
                    // 动态 SQL 生成的额外参数
                    value = boundSql.getAdditionalParameter(propertyName);
                } else if (parameterObject == null) {
                    value = null;
                } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
                    // 简单类型
                    value = parameterObject;
                } else {
                    // 复杂类型，通过反射获取属性值
                    MetaObject metaObject = configuration.newMetaObject(parameterObject);
                    value = metaObject.getValue(propertyName);
                }
                
                // 3. 设置参数
                TypeHandler typeHandler = parameterMapping.getTypeHandler();
                JdbcType jdbcType = parameterMapping.getJdbcType();
                
                if (value == null && jdbcType == null) {
                    jdbcType = configuration.getJdbcTypeForNull();
                }
                
                try {
                    typeHandler.setParameter(ps, i + 1, value, jdbcType);
                } catch (Exception e) {
                    throw new TypeException("Could not set parameters for mapping: " + parameterMapping + ". Cause: " + e, e);
                }
            }
        }
    }
}
```

---

## 4 类型转换机制

### 4.1 TypeHandler 接口

```java
public interface TypeHandler<T> {
    // 设置参数
    void setParameter(PreparedStatement ps, int i, T parameter, JdbcType jdbcType) throws SQLException;
    
    // 获取结果
    T getResult(ResultSet rs, String columnName) throws SQLException;
    T getResult(ResultSet rs, int columnIndex) throws SQLException;
    T getResult(CallableStatement cs, int columnIndex) throws SQLException;
}
```

### 4.2 常用 TypeHandler

| Java 类型 | JDBC 类型 | TypeHandler |
|-----------|-----------|-------------|
| Integer | INTEGER | IntegerTypeHandler |
| String | VARCHAR | StringTypeHandler |
| Date | TIMESTAMP | DateTypeHandler |
| Boolean | BOOLEAN | BooleanTypeHandler |
| BigDecimal | DECIMAL | BigDecimalTypeHandler |

### 4.3 自定义 TypeHandler

```java
// 示例：枚举类型处理器
@MappedTypes(RoleEnum.class)
@MappedJdbcTypes(JdbcType.VARCHAR)
public class RoleEnumTypeHandler extends BaseTypeHandler<RoleEnum> {
    
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, 
                                     RoleEnum parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter.getCode());
    }
    
    @Override
    public RoleEnum getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String code = rs.getString(columnName);
        return RoleEnum.getByCode(code);
    }
    
    @Override
    public RoleEnum getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String code = rs.getString(columnIndex);
        return RoleEnum.getByCode(code);
    }
    
    @Override
    public RoleEnum getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String code = cs.getString(columnIndex);
        return RoleEnum.getByCode(code);
    }
}
```

---

## 5 参数映射流程

### 5.1 流程图

```
XML 中的 #{id}
    ↓
SqlSource 解析
    ↓
BoundSql（包含参数映射列表）
    ↓
ParameterHandler.setParameters()
    ↓
TypeHandler.setParameter()
    ↓
PreparedStatement.setXxx()
```

### 5.2 BoundSql 结构

```java
public class BoundSql {
    private final String sql;                    // 解析后的 SQL
    private final List<ParameterMapping> parameterMappings;  // 参数映射列表
    private final Object parameterObject;        // 参数对象
    private final Map<String, Object> additionalParameters;  // 额外参数
    private final MetaObject metaParameters;     // 额外参数的 MetaObject
    
    // ...
}
```

### 5.3 ParameterMapping 结构

```java
public class ParameterMapping {
    private String property;        // 属性名
    private ParameterMode mode;     // 参数模式（IN/OUT/INOUT）
    private Class<?> javaType;      // Java 类型
    private JdbcType jdbcType;      // JDBC 类型
    private TypeHandler typeHandler; // 类型处理器
    // ...
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| #{} | 预编译参数，PreparedStatement，安全 |
| ${} | 字符串替换，Statement，不安全 |
| ParameterHandler | 负责设置 SQL 参数 |
| TypeHandler | 负责 Java 类型与 JDBC 类型的转换 |
| BoundSql | 包含解析后的 SQL 和参数映射列表 |

---

## 7 新手常见误区

### 误区 1："#{} 和 ${} 可以互换使用"

**错！** #{} 用于参数值，${} 用于表名、列名等。${} 有 SQL 注入风险。

### 误区 2："MyBatis 不支持自定义类型转换"

不是的。可以通过实现 TypeHandler 接口自定义类型转换。

### 误区 3："参数映射只支持简单类型"

**错！** MyBatis 支持复杂对象，通过反射获取属性值。

---

## 8 动手练习

### 练习 1：基础练习

说明 #{} 和 ${} 的区别。

<details>
<summary>点击查看答案</summary>

```
#{}：
- 预编译参数，使用 PreparedStatement
- 安全，防止 SQL 注入
- 用于参数值

${}：
- 字符串替换，使用 Statement
- 不安全，可能 SQL 注入
- 用于表名、列名、动态排序
```

</details>

### 练习 2：进阶练习

说明 ParameterHandler 的参数设置流程。

<details>
<summary>点击查看答案</summary>

```java
1. 获取参数映射列表 parameterMappings
2. 遍历每个参数映射
3. 获取参数值：
   - 优先从 additionalParameters 获取（动态 SQL）
   - 如果参数对象是简单类型，直接使用
   - 否则通过反射获取属性值
4. 使用 TypeHandler 设置参数
5. 调用 PreparedStatement.setXxx()
```

</details>

### 练习 3（挑战）：综合练习

实现一个自定义 TypeHandler，将 JSON 字符串转换为 Map 对象。

<details>
<summary>点击查看答案</summary>

```java
@MappedTypes(Map.class)
@MappedJdbcTypes(JdbcType.VARCHAR)
public class JsonMapTypeHandler extends BaseTypeHandler<Map<String, Object>> {
    
    private static final ObjectMapper mapper = new ObjectMapper();
    
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, 
                                     Map<String, Object> parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, mapper.writeValueAsString(parameter));
        } catch (JsonProcessingException e) {
            throw new SQLException("Error converting Map to JSON", e);
        }
    }
    
    @Override
    public Map<String, Object> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String json = rs.getString(columnName);
        return parseJson(json);
    }
    
    @Override
    public Map<String, Object> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String json = rs.getString(columnIndex);
        return parseJson(json);
    }
    
    @Override
    public Map<String, Object> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String json = cs.getString(columnIndex);
        return parseJson(json);
    }
    
    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return mapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing JSON", e);
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **结果集映射原理**——深入理解 ResultSetHandler 如何将 ResultSet 转换为 Java 对象。你会学到结果映射的完整流程。
