---
title: "第9章：动态 SQL 原理"
description: "动态 SQL 解析、SqlNode 体系、OGNL 表达式"
---

# 第9章：动态 SQL 原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 动态 SQL 是如何解析的？
- SqlNode 体系包含哪些节点类型？
- OGNL 表达式在动态 SQL 中起什么作用？
- 动态 SQL 的解析流程是什么？

这一章就是为了解答这些问题。我们会从 **动态 SQL 的使用场景** 入手，再深入 **SqlNode 体系** 和 **解析流程**。

---

## 1 为什么需要动态 SQL？

### 痛点分析

在复杂查询中，条件往往是动态的：

```java
// ❌ 传统方式：拼接 SQL（不安全）
String sql = "SELECT * FROM user WHERE 1=1";
if (name != null) {
    sql += " AND name = '" + name + "'";
}
if (age != null) {
    sql += " AND age = " + age;
}
```

### 解决方案

MyBatis 提供动态 SQL 标签：

```xml
<!-- ✅ MyBatis 方式：动态 SQL -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null">
            AND name = #{name}
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>
```

> **一句话总结**：动态 SQL 让你安全、灵活地构建 SQL 语句。

---

## 2 动态 SQL 标签

### 2.1 常用标签

| 标签 | 作用 | 使用场景 |
|------|------|----------|
| `<if>` | 条件判断 | 单条件判断 |
| `<choose>/<when>/<otherwise>` | 多条件选择 | switch-case 逻辑 |
| `<where>` | 自动处理 AND/OR | WHERE 子句 |
| `<set>` | 自动处理逗号 | UPDATE 语句 |
| `<foreach>` | 循环遍历 | IN 查询、批量操作 |
| `<trim>` | 自定义裁剪 | 自定义前缀/后缀 |
| `<bind>` | 创建变量 | 模糊查询 |

### 2.2 使用示例

```xml
<!-- if 标签 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>

<!-- choose 标签 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    <where>
        <choose>
            <when test="name != null">
                AND name = #{name}
            </when>
            <when test="age != null">
                AND age = #{age}
            </when>
            <otherwise>
                AND status = 1
            </otherwise>
        </choose>
    </where>
</select>

<!-- foreach 标签 -->
<select id="selectUsersByIds" resultType="User">
    SELECT * FROM user
    WHERE id IN
    <foreach collection="list" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```

---

## 3 SqlNode 体系

### 3.1 SqlNode 接口

```java
public interface SqlNode {
    // 应用节点内容
    boolean apply(DynamicContext context);
}
```

### 3.2 SqlNode 类型

| 类型 | 对应标签 | 说明 |
|------|----------|------|
| **StaticTextSqlNode** | 静态文本 | 普通 SQL 文本 |
| **TextSqlNode** | ${} | 字符串替换 |
| **IfSqlNode** | `<if>` | 条件判断 |
| **ChooseSqlNode** | `<choose>` | 多条件选择 |
| **WhereSqlNode** | `<where>` | WHERE 子句 |
| **SetSqlNode** | `<set>` | SET 子句 |
| **ForeachSqlNode** | `<foreach>` | 循环遍历 |
| **TrimSqlNode** | `<trim>` | 裁剪 |
| **MixedSqlNode** | 混合节点 | 包含多个子节点 |

### 3.3 SqlNode 继承关系

```
SqlNode
├── StaticTextSqlNode（静态文本）
├── TextSqlNode（${} 文本）
├── IfSqlNode（if 条件）
├── ChooseSqlNode（choose 选择）
│   ├── WhenSqlNode
│   └── MixedSqlNode
├── WhereSqlNode（where 子句，继承自 TrimSqlNode）
├── SetSqlNode（set 子句，继承自 TrimSqlNode）
├── TrimSqlNode（trim 裁剪）
├── ForeachSqlNode（foreach 循环）
└── MixedSqlNode（混合节点）
```

---

## 4 动态 SQL 解析流程

### 4.1 解析流程图

```
XML 中的动态 SQL
    ↓
XMLScriptBuilder.parseDynamicTags()
    ↓
创建 SqlNode 树
    ↓
SqlSource（DynamicSqlSource）
    ↓
调用时执行 apply()
    ↓
生成 BoundSql
    ↓
执行 SQL
```

### 4.2 解析过程详解

```java
// XMLScriptBuilder 解析动态标签
private SqlNode parseDynamicTags(XNode node) {
    List<SqlNode> contents = new ArrayList<>();
    NodeList children = node.getNode().getChildNodes();
    
    for (int i = 0; i < children.getLength(); i++) {
        XNode child = node.newXNode(children.item(i));
        
        if (child.getNode().getNodeType() == Node.CDATA_SECTION_NODE 
            || child.getNode().getNodeType() == Node.TEXT_NODE) {
            // 文本节点
            String data = child.getStringBody("");
            TextSqlNode textSqlNode = new TextSqlNode(data);
            contents.add(textSqlNode);
        } else if (child.getNode().getNodeType() == Node.ELEMENT_NODE) {
            // 元素节点（动态标签）
            String nodeName = child.getNode().getNodeName();
            NodeHandler handler = nodeHandlerMap.get(nodeName);
            if (handler == null) {
                throw new BuilderException("Unknown element <" + nodeName + "> in SQL statement.");
            }
            handler.handleNode(child, contents);
        }
    }
    
    return new MixedSqlNode(contents);
}
```

### 4.3 IfSqlNode 实现

```java
public class IfSqlNode implements SqlNode {
    private final Expression test;      // OGNL 表达式
    private final SqlNode contents;     // 子节点
    
    @Override
    public boolean apply(DynamicContext context) {
        // 使用 OGNL 计算表达式
        if (evaluator.evaluateBoolean(test, context.getBindings())) {
            contents.apply(context);
            return true;
        }
        return false;
    }
}
```

### 4.4 ForeachSqlNode 实现

```java
public class ForeachSqlNode implements SqlNode {
    private final String collectionExpression;  // 集合表达式
    private final String item;                  // 元素变量名
    private final String index;                 // 索引变量名
    private final SqlNode contents;             // 子节点
    private final String open;                  // 前缀
    private final String close;                 // 后缀
    private final String separator;             // 分隔符
    
    @Override
    public boolean apply(DynamicContext context) {
        // 获取集合对象
        Object iterable = evaluator.evaluateCollection(collectionExpression, context.getBindings());
        
        if (iterable != null) {
            // 处理前缀
            if (open != null) {
                context.appendSql(open);
            }
            
            // 遍历集合
            PrefixedContext prefixedContext = new PrefixedContext(context, "");
            int i = 0;
            for (Object item : iterable) {
                // 设置变量
                Map<String, Object> bindings = new HashMap<>();
                bindings.put(item, item);
                bindings.put(index, i);
                
                // 应用子节点
                contents.apply(new FilteredDynamicContext(context, bindings));
                
                // 添加分隔符
                if (i++ > 0) {
                    prefixedContext.appendSql(separator);
                }
            }
            
            // 处理后缀
            if (close != null) {
                context.appendSql(close);
            }
        }
        
        return true;
    }
}
```

---

## 5 OGNL 表达式

### 5.1 OGNL 简介

OGNL（Object-Graph Navigation Language）是强大的表达式语言：

```java
// 常用 OGNL 表达式
name != null              // 判断非空
name == 'admin'           // 字符串比较
age > 18                  // 数值比较
list.size() > 0           // 调用方法
user.name                 // 访问属性
```

### 5.2 在动态 SQL 中的应用

```xml
<!-- 简单判断 -->
<if test="name != null">
    AND name = #{name}
</if>

<!-- 字符串判断 -->
<if test="name != null and name != ''">
    AND name = #{name}
</if>

<!-- 集合判断 -->
<if test="list != null and list.size() > 0">
    <!-- ... -->
</if>
```

### 5.3 OGNL 上下文

```java
// DynamicContext 提供 OGNL 上下文
public class DynamicContext {
    private final Map<String, Object> bindings;  // 参数绑定
    private final StringBuilder sqlBuilder;       // SQL 构建器
    
    public void bind(String name, Object value) {
        bindings.put(name, value);
    }
    
    public Object getBinding(String name) {
        return bindings.get(name);
    }
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 动态 SQL 标签 | if、choose、where、set、foreach、trim、bind |
| SqlNode 体系 | 各种标签对应的节点类型 |
| 解析流程 | XML → SqlNode 树 → DynamicSqlSource → BoundSql |
| OGNL 表达式 | 用于条件判断 |
| 节点类型 | StaticTextSqlNode、IfSqlNode、ForeachSqlNode 等 |

---

## 7 新手常见误区

### 误区 1："动态 SQL 在编译时解析"

**错！** 动态 SQL 在运行时解析，每次执行都会重新计算条件。

### 误区 2："OGNL 表达式可以写任意 Java 代码"

不是的。OGNL 是表达式语言，不能写语句，只能写表达式。

### 误区 3："foreach 只能遍历 List"

**错！** foreach 可以遍历任何实现了 Iterable 接口的集合。

---

## 8 动手练习

### 练习 1：基础练习

列举 MyBatis 的动态 SQL 标签。

<details>
<summary>点击查看答案</summary>

```
1. <if>：条件判断
2. <choose>/<when>/<otherwise>：多条件选择
3. <where>：WHERE 子句，自动处理 AND/OR
4. <set>：SET 子句，自动处理逗号
5. <foreach>：循环遍历
6. <trim>：自定义裁剪
7. <bind>：创建变量
```

</details>

### 练习 2：进阶练习

说明 SqlNode 的继承关系。

<details>
<summary>点击查看答案</summary>

```
SqlNode（接口）
├── StaticTextSqlNode：静态文本
├── TextSqlNode：${} 文本
├── IfSqlNode：if 条件
├── ChooseSqlNode：choose 选择
├── WhereSqlNode：where 子句（继承 TrimSqlNode）
├── SetSqlNode：set 子句（继承 TrimSqlNode）
├── TrimSqlNode：trim 裁剪
├── ForeachSqlNode：foreach 循环
└── MixedSqlNode：混合节点
```

</details>

### 练习 3（挑战）：综合练习

实现一个动态 SQL，支持多条件查询和分页。

<details>
<summary>点击查看答案</summary>

```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
    </where>
    ORDER BY id DESC
    LIMIT #{offset}, #{limit}
</select>
```

</details>

---

## 下一章预告

下一章我们会学习 **缓存机制原理**——深入理解一级缓存、二级缓存的实现原理，以及缓存失效场景。你会学到 MyBatis 是如何管理缓存的。
