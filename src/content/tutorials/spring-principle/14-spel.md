---
title: "第 14 章：Spring EL 表达式原理"
description: "深入理解 Spring EL 表达式语言，掌握 SpEL 语法与解析原理"
---

# 第 14 章：Spring EL 表达式原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SpEL 到底是什么？和普通字符串有什么区别？
- 为什么 @Value 注解里可以写 #{systemProperties['java.version']}？
- SpEL 是怎么解析的？底层原理是什么？
- 怎么在 SpEL 中调用方法？怎么自定义函数？

这一章就是为了解答这些问题。我们会先搞清楚 **SpEL 的核心原理**，再学习各种语法用法，最后深入源码看看 Spring 是怎么解析表达式的。

---

## 1 为什么需要 SpEL？

### 痛点分析

想象一下这个场景：你需要在配置文件中动态获取一些值：

```java
// 没有 SpEL 时
@Value("${database.url}")
private String databaseUrl;

@Value("${app.name}")
private String appName;

// 想要获取系统属性？麻烦了
private String javaVersion = System.getProperty("java.version");

// 想要调用方法？更麻烦
private String upperName = appName.toUpperCase();
```

**问题来了**：
- 只能注入简单的配置值
- 无法动态计算或调用方法
- 无法访问系统属性、环境变量
- 无法进行条件判断

### 解决方案

有了 SpEL，代码变成这样：

```java
// 注入配置值
@Value("${database.url}")
private String databaseUrl;

// 获取系统属性
@Value("#{systemProperties['java.version']}")
private String javaVersion;

// 调用方法
@Value("#{appName.toUpperCase()}")
private String upperName;

// 条件判断
@Value("#{age >= 18 ? '成年' : '未成年'}")
private String ageCategory;

// 访问环境变量
@Value("#{environment['HOME']}")
private String homeDir;
```

**好处**：
- 可以在注解中写表达式
- 支持方法调用、属性访问
- 支持条件运算、集合操作
- 功能强大且灵活

> **一句话总结**：SpEL 是 Spring 的表达式语言，让你在配置和注解中写"小代码"，实现动态值注入。

---

## 2 核心原理讲解

### 概念解释

SpEL（Spring Expression Language）是 Spring 的表达式语言，它有三个核心组件：

1. **ExpressionParser**：解析器，把字符串解析成表达式对象
2. **Expression**：表达式对象，可以求值
3. **EvaluationContext**：求值上下文，提供变量和函数

打个比方：

> SpEL 就像一个计算器。你输入一个表达式（比如 "1 + 2"），解析器把它解析成计算对象，然后在上下文中求值，得到结果（3）。

### SpEL 语法分类

SpEL 支持三种主要的表达式：

```
1. 字面量表达式
   - 字符串：'Hello'
   - 数字：123、3.14
   - 布尔：true、false
   - null：null

2. 属性访问表达式
   - 对象属性：user.name
   - Map 访问：map['key']
   - List 访问：list[0]

3. 方法调用表达式
   - 静态方法：T(java.lang.Math).random()
   - 实例方法：user.getName()
   - Bean 方法：@userService.getUser()
```

### 源码分析

让我们看看 SpEL 解析的核心源码：

```java
// 1. 创建解析器
ExpressionParser parser = new SpelExpressionParser();

// 2. 解析表达式字符串
Expression expression = parser.parseExpression("#{user.name}");

// 3. 创建求值上下文
StandardEvaluationContext context = new StandardEvaluationContext();
context.setVariable("user", new User("张三"));

// 4. 求值
String name = (String) expression.getValue(context);
System.out.println(name);  // 输出：张三
```

**SpelExpressionParser 核心源码**：

```java
public class SpelExpressionParser implements ExpressionParser {
    @Override
    public Expression parseExpression(String expressionString) throws ParseException {
        return parseExpression(expressionString, null);
    }
    
    @Override
    public Expression parseExpression(String expressionString, ParserContext context) 
            throws ParseException {
        // 1. 创建词法分析器
        Tokenizer tokenizer = new Tokenizer(expressionString);
        
        // 2. 词法分析，生成 Token 流
        List<Token> tokens = tokenizer.tokenize();
        
        // 3. 语法分析，构建 AST（抽象语法树）
        SpelNodeImpl rootAst = new InternalSpelExpressionParser(this, tokens, context)
                .doParseExpression();
        
        // 4. 返回表达式对象
        return new SpelExpression(expressionString, rootAst, context.getEvaluationContext());
    }
}

// 表达式求值
public class SpelExpression implements Expression {
    @Override
    public Object getValue(EvaluationContext context) throws EvaluationException {
        // 1. 获取 AST 根节点
        SpelNodeImpl ast = this.ast;
        
        // 2. 在上下文中求值
        return ast.getValue(context, context.getRootObject().getValue());
    }
}
```

**关键点**：
- SpEL 先词法分析，把字符串拆成 Token
- 再语法分析，构建抽象语法树（AST）
- 最后在上下文中遍历 AST 求值

### ParserContext 解析流程

ParserContext 用于处理模板表达式（包含 #{...} 的字符串）：

```java
// 模板表达式解析
ParserContext parserContext = new TemplateParserContext("#{", "}");

// 解析表达式
Expression expression = parser.parseExpression(
    "Hello #{user.name}, you are #{user.age} years old", 
    parserContext
);

// 求值
String result = expression.getValue(context, String.class);
// 输出：Hello 张三, you are 25 years old
```

**解析流程**：
1. 识别模板标记 #{ 和 }
2. 提取表达式部分 user.name 和 user.age
3. 分别解析每个表达式
4. 在求值时替换模板中的表达式

### 对比分析

| 特性 | @Value("${...}") | @Value("#{...}") |
| --- | --- | --- |
| 表达式类型 | 占位符表达式 | SpEL 表达式 |
| 解析时机 | BeanDefinition 解析阶段 | Bean 实例化后 |
| 功能 | 只能注入配置值 | 支持方法调用、运算等 |
| 性能 | 较高 | 较低（需要解析表达式） |
| 使用场景 | 简单配置注入 | 复杂动态值计算 |

---

## 3 基础用法

### 示例 1：字面量表达式

```java
@Component
public class LiteralExpressionDemo {
    // 字符串字面量（注意单引号）
    @Value("#{'Hello Spring EL'}")
    private String message;
    
    // 数字字面量
    @Value("#{123}")
    private Integer number;
    
    // 浮点数字面量
    @Value("#{3.14}")
    private Double pi;
    
    // 布尔字面量
    @Value("#{true}")
    private Boolean flag;
    
    // null 字面量
    @Value("#{null}")
    private Object nullValue;
    
    @PostConstruct
    public void print() {
        System.out.println("message: " + message);
        System.out.println("number: " + number);
        System.out.println("pi: " + pi);
        System.out.println("flag: " + flag);
        System.out.println("nullValue: " + nullValue);
    }
}
```

### 示例 2：属性访问表达式

```java
@Component
public class PropertyAccessDemo {
    @Autowired
    private User user;
    
    // 访问对象属性
    @Value("#{user.name}")
    private String userName;
    
    // 访问嵌套属性
    @Value("#{user.address.city}")
    private String city;
    
    // 访问 Map 属性
    @Value("#{user.info['age']}")
    private Integer age;
    
    // 访问 List 属性
    @Value("#{user.hobbies[0]}")
    private String firstHobby;
    
    @PostConstruct
    public void print() {
        System.out.println("userName: " + userName);
        System.out.println("city: " + city);
        System.out.println("age: " + age);
        System.out.println("firstHobby: " + firstHobby);
    }
}
```

### 示例 3：方法调用表达式

```java
@Component
public class MethodCallDemo {
    // 调用静态方法
    @Value("#{T(java.lang.Math).random()}")
    private Double randomValue;
    
    // 调用静态方法（Math.max）
    @Value("#{T(java.lang.Math).max(10, 20)}")
    private Integer maxValue;
    
    // 调用 Bean 的方法
    @Value("#{userService.getCurrentUser().getName()}")
    private String currentUserName;
    
    // 字符串方法
    @Value("#{'hello'.toUpperCase()}")
    private String upperCase;
    
    // 字符串方法（截取）
    @Value("#{'Hello World'.substring(0, 5)}")
    private String subString;
    
    @PostConstruct
    public void print() {
        System.out.println("randomValue: " + randomValue);
        System.out.println("maxValue: " + maxValue);
        System.out.println("currentUserName: " + currentUserName);
        System.out.println("upperCase: " + upperCase);
        System.out.println("subString: " + subString);
    }
}
```

### 示例 4：运算符表达式

```java
@Component
public class OperatorDemo {
    // 算术运算符
    @Value("#{10 + 20}")
    private Integer sum;
    
    @Value("#{100 - 30}")
    private Integer difference;
    
    @Value("#{10 * 5}")
    private Integer product;
    
    @Value("#{100 / 3}")
    private Integer quotient;
    
    @Value("#{100 % 3}")
    private Integer remainder;
    
    // 比较运算符
    @Value("#{10 > 5}")
    private Boolean greater;
    
    @Value("#{10 == 10}")
    private Boolean equal;
    
    @Value("#{10 != 20}")
    private Boolean notEqual;
    
    // 逻辑运算符
    @Value("#{true and false}")
    private Boolean andResult;
    
    @Value("#{true or false}")
    private Boolean orResult;
    
    @Value("#{not true}")
    private Boolean notResult;
    
    // 三元运算符
    @Value("#{10 > 5 ? '大于' : '小于等于'}")
    private String ternaryResult;
    
    // Elvis 运算符（简化三元运算）
    @Value("#{userName ?: '默认用户'}")
    private String defaultName;
    
    @PostConstruct
    public void print() {
        System.out.println("sum: " + sum);
        System.out.println("difference: " + difference);
        System.out.println("product: " + product);
        System.out.println("quotient: " + quotient);
        System.out.println("remainder: " + remainder);
        System.out.println("greater: " + greater);
        System.out.println("equal: " + equal);
        System.out.println("notEqual: " + notEqual);
        System.out.println("andResult: " + andResult);
        System.out.println("orResult: " + orResult);
        System.out.println("notResult: " + notResult);
        System.out.println("ternaryResult: " + ternaryResult);
        System.out.println("defaultName: " + defaultName);
    }
}
```

### 示例 5：访问系统对象

```java
@Component
public class SystemObjectDemo {
    // 访问系统属性
    @Value("#{systemProperties['java.version']}")
    private String javaVersion;
    
    @Value("#{systemProperties['os.name']}")
    private String osName;
    
    // 访问环境变量
    @Value("#{systemEnvironment['HOME']}")
    private String homeDir;
    
    @Value("#{systemEnvironment['PATH']}")
    private String path;
    
    // 访问 Bean 容器
    @Value("#{@userService.getCurrentUser().getName()}")
    private String beanMethodResult;
    
    @PostConstruct
    public void print() {
        System.out.println("javaVersion: " + javaVersion);
        System.out.println("osName: " + osName);
        System.out.println("homeDir: " + homeDir);
        System.out.println("beanMethodResult: " + beanMethodResult);
    }
}
```

---

## 4 进阶用法

### 集合操作

```java
@Component
public class CollectionDemo {
    // 创建 List
    @Value("#{'apple', 'banana', 'orange'}")
    private List<String> fruits;
    
    // 创建 Map
    @Value("#{{'name': '张三', 'age': 25}}")
    private Map<String, Object> info;
    
    // 创建数组
    @Value("#{new String[]{'a', 'b', 'c'}}")
    private String[] letters;
    
    // List 操作
    @Value("#{fruits.size()}")
    private Integer fruitCount;
    
    @Value("#{fruits[0]}")
    private String firstFruit;
    
    @Value("#{fruits.contains('banana')}")
    private Boolean containsBanana;
    
    // Map 操作
    @Value("#{info['name']}")
    private String name;
    
    @Value("#{info.containsKey('age')}")
    private Boolean hasAge;
    
    @PostConstruct
    public void print() {
        System.out.println("fruits: " + fruits);
        System.out.println("info: " + info);
        System.out.println("fruitCount: " + fruitCount);
        System.out.println("firstFruit: " + firstFruit);
        System.out.println("containsBanana: " + containsBanana);
        System.out.println("name: " + name);
        System.out.println("hasAge: " + hasAge);
    }
}
```

### 集合投影与选择

```java
@Component
public class CollectionProjectionDemo {
    @Autowired
    private List<User> users;
    
    // 投影：提取所有用户的名字
    @Value("#{users.![name]}")
    private List<String> userNames;
    
    // 投影：提取所有用户的年龄
    @Value("#{users.![age]}")
    private List<Integer> userAges;
    
    // 选择：筛选年龄大于 18 的用户
    @Value("#{users.?[age > 18]}")
    private List<User> adultUsers;
    
    // 选择第一个：找到第一个年龄大于 18 的用户
    @Value("#{users.^[age > 18]}")
    private User firstAdult;
    
    // 选择最后一个：找到最后一个年龄大于 18 的用户
    @Value("#{users.$[age > 18]}")
    private User lastAdult;
    
    @PostConstruct
    public void print() {
        System.out.println("userNames: " + userNames);
        System.out.println("userAges: " + userAges);
        System.out.println("adultUsers: " + adultUsers);
        System.out.println("firstAdult: " + firstAdult);
        System.out.println("lastAdult: " + lastAdult);
    }
}
```

### 自定义函数

```java
// 1. 定义工具类
public class StringUtils {
    // 必须是静态方法
    public static String reverse(String str) {
        return new StringBuilder(str).reverse().toString();
    }
    
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}

// 2. 配置类
@Configuration
public class SpelConfig {
    @Bean
    public StandardEvaluationContext spelContext() {
        StandardEvaluationContext context = new StandardEvaluationContext();
        
        // 注册自定义函数
        try {
            context.registerFunction(
                "reverse",
                StringUtils.class.getMethod("reverse", String.class)
            );
            
            context.registerFunction(
                "isBlank",
                StringUtils.class.getMethod("isBlank", String.class)
            );
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        }
        
        return context;
    }
}

// 3. 使用自定义函数
@Component
public class CustomFunctionDemo {
    // 调用自定义函数
    @Value("#{#reverse('hello')}")
    private String reversed;
    
    @Value("#{#isBlank('')}")
    private Boolean blank;
    
    @PostConstruct
    public void print() {
        System.out.println("reversed: " + reversed);  // 输出：olleh
        System.out.println("blank: " + blank);        // 输出：true
    }
}
```

### 自定义变量

```java
@Configuration
public class VariableConfig {
    @Bean
    public StandardEvaluationContext variableContext() {
        StandardEvaluationContext context = new StandardEvaluationContext();
        
        // 注册变量
        context.setVariable("appName", "MyApp");
        context.setVariable("version", "1.0.0");
        context.setVariable("maxRetry", 3);
        
        return context;
    }
}

@Component
public class VariableDemo {
    // 使用自定义变量
    @Value("#{#appName}")
    private String appName;
    
    @Value("#{#version}")
    private String version;
    
    @Value("#{#maxRetry}")
    private Integer maxRetry;
    
    @PostConstruct
    public void print() {
        System.out.println("appName: " + appName);
        System.out.println("version: " + version);
        System.out.println("maxRetry: " + maxRetry);
    }
}
```

### 在 @If 条件中使用 SpEL

```java
@Configuration
public class ConditionalConfig {
    
    // 根据配置决定是否创建 Bean
    @Bean
    @ConditionalOnExpression("#{${app.cache.enabled} == true}")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager();
    }
    
    // 根据环境变量决定 Bean 实现
    @Bean
    @ConditionalOnExpression("#{systemEnvironment['ENV'] == 'prod'}")
    public DataSource prodDataSource() {
        // 生产环境数据源
        return new HikariDataSource();
    }
    
    // 复杂条件
    @Bean
    @ConditionalOnExpression("#{${app.debug} == true and ${app.log.level} == 'DEBUG'}")
    public DebugLogger debugLogger() {
        return new DebugLogger();
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| ExpressionParser | 表达式解析器，将字符串解析为 Expression 对象 |
| Expression | 表达式对象，可以求值 |
| EvaluationContext | 求值上下文，提供变量和函数 |
| #{...} | SpEL 表达式标记 |
| ${...} | 占位符表达式标记 |
| T(...) | 访问类的静态成员 |
| @beanName | 访问 Bean 容器中的 Bean |
| .?[] | 集合选择操作 |
| .![] | 集合投影操作 |
| ?: | Elvis 运算符 |

---

## 6 新手常见误区

### 误区 1："SpEL 和占位符表达式是一回事"

**错！** SpEL（#{...}）和占位符（${...}）是两种不同的表达式：
- 占位符只能注入配置值
- SpEL 支持方法调用、运算等复杂逻辑

正确做法：
```java
// ✅ 简单配置用占位符
@Value("${database.url}")
private String dbUrl;

// ✅ 复杂逻辑用 SpEL
@Value("#{T(java.lang.Math).random()}")
private Double random;
```

### 误区 2："SpEL 表达式中的字符串用双引号"

**错！** SpEL 中字符串必须用**单引号**，双引号会报错。

正确做法：
```java
// ✅ 正确
@Value("#{'Hello World'}")
private String message;

// ❌ 错误
@Value("#{"Hello World"}")  // 编译错误
private String message;
```

### 误区 3："SpEL 可以访问私有方法"

**错！** SpEL 只能访问**public**方法，私有方法会抛出异常。

正确做法：
```java
public class UserService {
    // ✅ 公开方法
    public String getCurrentUser() {
        return "张三";
    }
    
    // ❌ 私有方法，SpEL 无法访问
    private String getSecret() {
        return "secret";
    }
}
```

### 误区 4："SpEL 表达式写错不会有影响"

**错！** SpEL 表达式在运行时解析，写错了会导致**运行时异常**。

正确做法：
```java
// ✅ 测试表达式是否正确
@Test
public void testSpelExpression() {
    ExpressionParser parser = new SpelExpressionParser();
    Expression expression = parser.parseExpression("#{1 + 1}");
    Integer result = expression.getValue(Integer.class);
    assertEquals(2, result);
}
```

### 误区 5："SpEL 性能很好，可以随便用"

不一定。SpEL 需要解析和求值，**性能比直接写代码低**。

正确做法：
- 简单值用占位符 ${...}
- 复杂逻辑用 SpEL #{...}
- 不要在循环或高频调用的地方使用 SpEL

---

## 7 动手练习

### 练习 1：基础练习 - 使用 SpEL 注入系统属性

使用 SpEL 注入 Java 版本、操作系统名称、用户目录。

<details>
<summary>点击查看答案</summary>

```java
@Component
public class SystemPropertyDemo {
    // 注入 Java 版本
    @Value("#{systemProperties['java.version']}")
    private String javaVersion;
    
    // 注入操作系统名称
    @Value("#{systemProperties['os.name']}")
    private String osName;
    
    // 注入用户目录
    @Value("#{systemProperties['user.dir']}")
    private String userDir;
    
    @PostConstruct
    public void print() {
        System.out.println("Java 版本：" + javaVersion);
        System.out.println("操作系统：" + osName);
        System.out.println("用户目录：" + userDir);
    }
}

// 测试
@SpringBootTest
public class SystemPropertyTest {
    @Autowired
    private SystemPropertyDemo demo;
    
    @Test
    public void testSystemProperties() {
        // 验证值不为空
        assertNotNull(demo.getJavaVersion());
        assertNotNull(demo.getOsName());
        assertNotNull(demo.getUserDir());
    }
}
```

</details>

### 练习 2：进阶练习 - 自定义 SpEL 函数

实现一个自定义函数 formatCurrency，将数字格式化为货币格式（如：1234.56 -> ¥1,234.56）。

<details>
<summary>点击查看答案</summary>

```java
// 1. 工具类
public class CurrencyUtils {
    // 必须是静态方法
    public static String formatCurrency(Number amount) {
        DecimalFormat formatter = new DecimalFormat("¥#,##0.00");
        return formatter.format(amount);
    }
}

// 2. 配置类
@Configuration
public class SpelConfig {
    @Bean
    public StandardEvaluationContext currencyContext() {
        StandardEvaluationContext context = new StandardEvaluationContext();
        
        try {
            // 注册自定义函数
            context.registerFunction(
                "formatCurrency",
                CurrencyUtils.class.getMethod("formatCurrency", Number.class)
            );
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        }
        
        return context;
    }
}

// 3. 使用自定义函数
@Component
public class CurrencyDemo {
    @Value("#{#formatCurrency(1234.56)}")
    private String price1;
    
    @Value("#{#formatCurrency(999999.99)}")
    private String price2;
    
    @PostConstruct
    public void print() {
        System.out.println("价格 1：" + price1);  // 输出：¥1,234.56
        System.out.println("价格 2：" + price2);  // 输出：¥999,999.99
    }
}

// 4. 测试
@SpringBootTest
public class CurrencyTest {
    @Autowired
    private CurrencyDemo demo;
    
    @Test
    public void testFormatCurrency() {
        assertEquals("¥1,234.56", demo.getPrice1());
        assertEquals("¥999,999.99", demo.getPrice2());
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - SpEL 集合操作

给定一个用户列表，使用 SpEL 实现：
1. 提取所有用户的邮箱
2. 筛选年龄大于 18 的用户
3. 统计成年用户的数量

<details>
<summary>点击查看答案</summary>

```java
// 1. 用户类
public class User {
    private String name;
    private Integer age;
    private String email;
    
    // 构造函数、getter、setter
    public User(String name, Integer age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }
    
    public String getName() { return name; }
    public Integer getAge() { return age; }
    public String getEmail() { return email; }
}

// 2. 配置类
@Configuration
public class UserConfig {
    @Bean
    public List<User> userList() {
        return Arrays.asList(
            new User("张三", 25, "zhangsan@example.com"),
            new User("李四", 16, "lisi@example.com"),
            new User("王五", 30, "wangwu@example.com"),
            new User("赵六", 17, "zhaoliu@example.com")
        );
    }
}

// 3. 使用 SpEL 集合操作
@Component
public class UserCollectionDemo {
    // 提取所有用户的邮箱
    @Value("#{userList.![email]}")
    private List<String> emails;
    
    // 筛选年龄大于 18 的用户
    @Value("#{userList.?[age > 18]}")
    private List<User> adultUsers;
    
    // 统计成年用户数量
    @Value("#{userList.?[age > 18].size()}")
    private Integer adultCount;
    
    @PostConstruct
    public void print() {
        System.out.println("所有邮箱：" + emails);
        System.out.println("成年用户：" + adultUsers);
        System.out.println("成年用户数量：" + adultCount);
    }
}

// 4. 测试
@SpringBootTest
public class UserCollectionTest {
    @Autowired
    private UserCollectionDemo demo;
    
    @Test
    public void testCollectionOperations() {
        // 验证邮箱列表
        assertEquals(4, demo.getEmails().size());
        assertTrue(demo.getEmails().contains("zhangsan@example.com"));
        
        // 验证成年用户
        assertEquals(2, demo.getAdultUsers().size());
        assertEquals(2, demo.getAdultCount());
        
        // 验证成年用户是张三和王五
        List<String> adultNames = demo.getAdultUsers().stream()
            .map(User::getName)
            .collect(Collectors.toList());
        assertTrue(adultNames.contains("张三"));
        assertTrue(adultNames.contains("王五"));
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 类型转换与校验**——也就是 ConversionService 体系。你会学到：
- ConversionService 和 PropertyEditor 的区别
- Formatter 的使用场景
- JSR-303 校验集成原理
- 自定义转换器与校验器

类型转换是 Spring 中非常基础但重要的功能，掌握它能让你更好地理解 Spring 的数据绑定机制。我们下一章见！
