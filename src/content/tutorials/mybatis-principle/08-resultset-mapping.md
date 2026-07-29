---
title: "第8章：结果集映射原理"
description: "ResultSetHandler、结果集解析、TypeHandler 机制"
---

# 第8章：结果集映射原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- ResultSetHandler 是如何将 ResultSet 转换为 Java 对象的？
- 结果映射的完整流程是什么？
- 复杂映射（嵌套查询、关联映射）是如何实现的？
- TypeHandler 在结果映射中起什么作用？

这一章就是为了解答这些问题。我们会从 **结果映射流程** 入手，再深入 **ResultSetHandler 的实现原理**。

---

## 1 为什么需要结果集映射？

### 痛点分析

JDBC 处理结果集需要手动转换：

```java
// ❌ JDBC 方式：手动映射
ResultSet rs = pstmt.executeQuery();
List<User> users = new ArrayList<>();
while (rs.next()) {
    User user = new User();
    user.setId(rs.getInt("id"));
    user.setName(rs.getString("name"));
    user.setAge(rs.getInt("age"));
    user.setBirthday(rs.getDate("birthday").toLocalDate());
    users.add(user);
}
```

### 解决方案

MyBatis 自动完成结果映射：

```java
// ✅ MyBatis 方式：自动映射
@Select("SELECT * FROM user")
List<User> selectAll();
```

> **一句话总结**：结果映射让你专注于业务逻辑，而不必关心类型转换细节。

---

## 2 ResultSetHandler 原理

### 2.1 核心接口

```java
public interface ResultSetHandler {
    // 处理结果集
    <E> List<E> handleResultSets(Statement stmt) throws SQLException;
    
    // 处理游标结果集
    <E> Cursor<E> handleCursorResultSets(Statement stmt) throws SQLException;
    
    // 处理输出参数
    void handleOutputParameters(CallableStatement cs) throws SQLException;
}
```

### 2.2 默认实现：DefaultResultSetHandler

```java
public class DefaultResultSetHandler implements ResultSetHandler {
    
    @Override
    public <E> List<E> handleResultSets(Statement stmt) throws SQLException {
        final List<Object> multipleResults = new ArrayList<>();
        
        int resultSetCount = 0;
        ResultSetWrapper rsw = getFirstResultSet(stmt);
        
        List<ResultMap> resultMaps = mappedStatement.getResultMaps();
        int resultMapCount = resultMaps.size();
        
        while (rsw != null && resultMapCount > resultSetCount) {
            ResultMap resultMap = resultMaps.get(resultSetCount);
            handleResultSet(rsw, resultMap, multipleResults, null);
            rsw = getNextResultSet(stmt);
            resultSetCount++;
        }
        
        return collapseSingleResultList(multipleResults);
    }
}
```

---

## 3 结果映射流程

### 3.1 流程图

```
Statement 执行完成
    ↓
ResultSetHandler.handleResultSets()
    ↓
获取 ResultSetWrapper（包装 ResultSet）
    ↓
获取 ResultMap（结果映射配置）
    ↓
handleResultSet()
    ↓
遍历 ResultSet
    ↓
createResultObject()（创建结果对象）
    ↓
applyPropertyMappings()（设置属性值）
    ↓
返回结果列表
```

### 3.2 核心步骤详解

```java
private void handleResultSet(ResultSetWrapper rsw, ResultMap resultMap, 
                             List<Object> multipleResults, ResultMapping parentMapping) {
    try {
        // 1. 获取结果上下文
        ResultContext resultContext = new DefaultResultContext();
        
        // 2. 跳过前 N 行（RowBounds）
        skipRows(rsw.getResultSet(), rowBounds);
        
        // 3. 检查是否应该返回更多行
        while (shouldProcessMoreRows(resultContext, rowBounds) 
               && rsw.getResultSet().next()) {
            
            // 4. 获取区分标识（用于鉴别器）
            ResultMap discriminatedResultMap = resolveDiscriminatedResultMap(
                resultMap, rsw.getResultSet(), null);
            
            // 5. 创建结果对象
            Object rowValue = getRowValue(rsw, discriminatedResultMap);
            
            // 6. 存储结果
            storeObject(resultContext, rowValue, parentMapping);
        }
    } catch (Exception e) {
        throw new ExecutorException(...);
    }
}
```

### 3.3 创建结果对象

```java
private Object getRowValue(ResultSetWrapper rsw, ResultMap resultMap) {
    // 1. 创建结果对象
    Object rowValue = createResultObject(rsw, resultMap);
    
    // 2. 如果有 TypeHandler，直接转换
    if (rowValue != null && !hasTypeHandler(resultMap.getType())) {
        final MetaObject metaObject = configuration.newMetaObject(rowValue);
        
        // 3. 自动映射
        applyAutomaticMappings(rsw, resultMap, metaObject, null);
        
        // 4. 属性映射
        applyPropertyMappings(rsw, resultMap, metaObject, null);
    }
    
    return rowValue;
}
```

---

## 4 结果映射类型

### 4.1 简单映射

```xml
<!-- 自动映射（列名与属性名相同） -->
<select id="selectUser" resultType="User">
    SELECT id, name, age FROM user WHERE id = #{id}
</select>

<!-- 手动映射（使用 resultMap） -->
<resultMap id="userMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
</resultMap>

<select id="selectUser" resultMap="userMap">
    SELECT id, name, age FROM user WHERE id = #{id}
</select>
```

### 4.2 关联映射

```xml
<!-- 一对一关联 -->
<resultMap id="userWithOrderMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <association property="order" javaType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
    </association>
</resultMap>

<!-- 一对多关联 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
    </collection>
</resultMap>
```

### 4.3 嵌套查询

```xml
<!-- 嵌套查询（分步查询） -->
<resultMap id="userWithOrderMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <association property="order" 
                 column="id" 
                 select="selectOrder"/>
</resultMap>

<select id="selectOrder" resultType="Order">
    SELECT * FROM order WHERE user_id = #{id}
</select>
```

---

## 5 自动映射机制

### 5.1 自动映射级别

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- NONE：不自动映射 -->
    <!-- PARTIAL：只自动映射没有嵌套的结果（默认） -->
    <!-- FULL：自动映射所有结果 -->
    <setting name="autoMappingBehavior" value="PARTIAL"/>
</settings>
```

### 5.2 自动映射流程

```java
private void applyAutomaticMappings(ResultSetWrapper rsw, ResultMap resultMap, 
                                     MetaObject metaObject, String columnPrefix) {
    // 1. 获取自动映射列表
    List<UnMappedColumnAutoMapping> autoMappings = createAutomaticMappings(rsw, resultMap, metaObject, columnPrefix);
    
    // 2. 遍历设置属性值
    for (UnMappedColumnAutoMapping mapping : autoMappings) {
        Object value = mapping.typeHandler.getResult(rsw.getResultSet(), mapping.column);
        if (value != null) {
            metaObject.setValue(mapping.property, value);
        }
    }
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| ResultSetHandler | 负责将 ResultSet 转换为 Java 对象 |
| ResultMap | 定义结果映射规则 |
| 自动映射 | 列名与属性名相同时自动映射 |
| 关联映射 | association（一对一）、collection（一对多） |
| 嵌套查询 | 通过 select 属性执行子查询 |
| TypeHandler | 负责类型转换 |

---

## 7 新手常见误区

### 误区 1："resultType 和 resultMap 可以混用"

**错！** resultType 用于简单映射，resultMap 用于复杂映射，两者不能同时使用。

### 误区 2："自动映射可以处理所有场景"

不是的。自动映射只能处理列名与属性名相同的情况，复杂映射需要手动配置 resultMap。

### 误区 3："嵌套查询性能很好"

**错！** 嵌套查询会导致 N+1 问题，建议使用嵌套结果映射（JOIN 查询）。

---

## 8 动手练习

### 练习 1：基础练习

说明 resultType 和 resultMap 的区别。

<details>
<summary>点击查看答案</summary>

```
resultType：
- 用于简单映射
- 列名与属性名相同或开启驼峰命名映射
- 不需要额外配置

resultMap：
- 用于复杂映射
- 可以自定义列名与属性名的映射关系
- 支持关联映射、嵌套查询
- 需要额外配置
```

</details>

### 练习 2：进阶练习

说明 association 和 collection 的区别。

<details>
<summary>点击查看答案</summary>

```xml
association：
- 一对一关联
- javaType 指定关联对象的类型
- 示例：<association property="order" javaType="Order">

collection：
- 一对多关联
- ofType 指定集合元素的类型
- 示例：<collection property="orders" ofType="Order">
```

</details>

### 练习 3（挑战）：综合练习

实现一个包含嵌套查询的 resultMap，查询用户及其订单信息。

<details>
<summary>点击查看答案</summary>

```xml
<!-- 用户 ResultMap -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <collection property="orders" column="id" select="selectOrdersByUserId"/>
</resultMap>

<!-- 查询用户 -->
<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
    SELECT * FROM user WHERE id = #{id}
</select>

<!-- 查询用户的订单（嵌套查询） -->
<select id="selectOrdersByUserId" resultType="Order">
    SELECT * FROM order WHERE user_id = #{id}
</select>
```

</details>

---

## 下一章预告

下一章我们会学习 **动态 SQL 原理**——深入理解动态 SQL 的解析流程、SqlNode 体系、OGNL 表达式。你会学到 MyBatis 是如何动态生成 SQL 的。
