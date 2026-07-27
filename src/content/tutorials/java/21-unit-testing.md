---
title: '第二十一章：单元测试'
description: 'JUnit 5、断言、测试生命周期、Mock 基础'
---

# 第二十一章：单元测试

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是单元测试？为什么需要单元测试？
- 如何编写和运行单元测试？
- JUnit 5 有哪些常用的注解和断言方法？
- 如何测试异常情况？
- 什么是 Mock？为什么要使用 Mock？

这一章就是为了解答这些问题。我们会先理解 **单元测试的概念和重要性**，再学习 JUnit 5 的基本使用，包括测试注解、断言方法、测试生命周期，最后了解 Mock 的基本概念。学完这章，你就能编写高质量的单元测试了。

---

## 21.1 为什么需要单元测试？

### 痛点分析

想象你写了一个复杂的业务逻辑方法，每次修改代码后都要手动测试：

```java
public class Calculator {
    public int divide(int a, int b) {
        return a / b;  // 如果 b 为 0 会怎样？
    }
}

// 手动测试
public static void main(String[] args) {
    Calculator calc = new Calculator();
    System.out.println(calc.divide(10, 2));  // 5
    System.out.println(calc.divide(10, 0));  // ArithmeticException！
}
```

手动测试的问题：
1. **效率低**：每次修改都要手动运行测试
2. **容易遗漏**：测试用例不全面，容易漏掉边界情况
3. **无法回归**：修改代码后不知道是否影响了其他功能
4. **难以维护**：测试代码和业务代码混在一起

**生活类比**：单元测试就像"质量检查员"。每生产一个零件（方法），检查员都会按照标准流程（测试用例）检验它是否合格。这样在组装（集成）时就不会发现问题。

### 解决方案

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CalculatorTest {
    @Test
    public void testDivide() {
        Calculator calc = new Calculator();
        assertEquals(5, calc.divide(10, 2));  // 正常情况
        assertEquals(3, calc.divide(10, 3));  // 整数除法
    }
    
    @Test
    public void testDivideByZero() {
        Calculator calc = new Calculator();
        assertThrows(ArithmeticException.class, () -> {
            calc.divide(10, 0);  // 测试异常情况
        });
    }
}
```

> **一句话总结**：单元测试让测试自动化、可重复、可维护，保证代码质量。

---

## 21.2 JUnit 5 基础

### 什么是 JUnit 5？

JUnit 5 是 Java 最流行的单元测试框架，由三个子项目组成：

- **JUnit Jupiter**：编写测试的核心 API
- **JUnit Platform**：测试运行和报告平台
- **JUnit Vintage**：兼容旧版本 JUnit 3 和 4

### 添加依赖

在 Maven 项目中添加 JUnit 5 依赖：

```xml
<dependencies>
    <!-- JUnit 5 Jupiter API -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-api</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
    
    <!-- JUnit 5 Jupiter Engine -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-engine</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 第一个测试类

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CalculatorTest {
    
    @Test
    public void testAdd() {
        // 准备测试数据
        Calculator calc = new Calculator();
        
        // 执行测试
        int result = calc.add(2, 3);
        
        // 验证结果
        assertEquals(5, result, "2 + 3 应该等于 5");
    }
    
    @Test
    public void testSubtract() {
        Calculator calc = new Calculator();
        int result = calc.subtract(5, 3);
        assertEquals(2, result, "5 - 3 应该等于 2");
    }
}
```

### 测试类命名规范

```java
// ✅ 推荐：被测试类名 + Test
public class CalculatorTest { }
public class UserServiceTest { }
public class OrderRepositoryTest { }

// ❌ 不推荐：没有意义的命名
public class Test1 { }
public class MyTest { }
```

---

## 21.3 测试注解

### 核心注解

JUnit 5 提供了丰富的注解来组织测试：

```java
import org.junit.jupiter.api.*;

@DisplayName("计算器测试")  // 测试类显示名称
public class CalculatorTest {
    
    @BeforeAll  // 所有测试方法之前执行一次（静态方法）
    static void beforeAll() {
        System.out.println("初始化所有测试资源");
    }
    
    @AfterAll  // 所有测试方法之后执行一次（静态方法）
    static void afterAll() {
        System.out.println("清理所有测试资源");
    }
    
    @BeforeEach  // 每个测试方法之前执行
    void setUp() {
        System.out.println("初始化测试环境");
    }
    
    @AfterEach  // 每个测试方法之后执行
    void tearDown() {
        System.out.println("清理测试环境");
    }
    
    @Test
    @DisplayName("测试加法：2 + 3 = 5")
    void testAdd() {
        Calculator calc = new Calculator();
        assertEquals(5, calc.add(2, 3));
    }
    
    @Test
    @DisplayName("测试减法：5 - 3 = 2")
    void testSubtract() {
        Calculator calc = new Calculator();
        assertEquals(2, calc.subtract(5, 3));
    }
    
    @Test
    @Disabled("暂时禁用此测试")
    void testDisabled() {
        // 这个测试不会执行
    }
}
```

### 测试生命周期

```
@BeforeAll（执行一次）
  ↓
  @BeforeEach（每个测试前）
    ↓
    @Test（测试方法）
    ↓
  @AfterEach（每个测试后）
  ↓
  @BeforeEach（每个测试前）
    ↓
    @Test（测试方法）
    ↓
  @AfterEach（每个测试后）
  ↓
@AfterAll（执行一次）
```

### 嵌套测试

```java
@DisplayName("用户服务测试")
public class UserServiceTest {
    
    private UserService userService;
    
    @BeforeEach
    void setUp() {
        userService = new UserService();
    }
    
    @Nested
    @DisplayName("用户注册测试")
    class RegisterTests {
        
        @Test
        @DisplayName("正常注册")
        void testNormalRegister() {
            User user = new User("alice", "password123");
            User registered = userService.register(user);
            assertNotNull(registered.getId());
        }
        
        @Test
        @DisplayName("重复用户名注册失败")
        void testDuplicateUsername() {
            User user1 = new User("bob", "password123");
            User user2 = new User("bob", "password456");
            
            userService.register(user1);
            assertThrows(DuplicateUsernameException.class, () -> {
                userService.register(user2);
            });
        }
    }
    
    @Nested
    @DisplayName("用户登录测试")
    class LoginTests {
        
        @Test
        @DisplayName("正常登录")
        void testNormalLogin() {
            // 测试登录逻辑
        }
        
        @Test
        @DisplayName("密码错误登录失败")
        void testWrongPassword() {
            // 测试密码错误情况
        }
    }
}
```

---

## 21.4 断言方法

### 基本断言

JUnit 5 提供了丰富的断言方法：

```java
import static org.junit.jupiter.api.Assertions.*;

public class AssertionTest {
    
    @Test
    void testAssertions() {
        // 相等断言
        assertEquals(5, 2 + 3, "2 + 3 应该等于 5");
        assertEquals("Hello", "Hel" + "lo", "字符串应该相等");
        
        // 不相等断言
        assertNotEquals(5, 2 + 2, "2 + 2 不应该等于 5");
        
        // 布尔断言
        assertTrue(5 > 3, "5 应该大于 3");
        assertFalse(5 < 3, "5 不应该小于 3");
        
        // null 断言
        String nullStr = null;
        assertNull(nullStr, "应该是 null");
        
        String notNullStr = "Hello";
        assertNotNull(notNullStr, "不应该是 null");
        
        // 对象相等断言
        String str1 = new String("Hello");
        String str2 = new String("Hello");
        assertEquals(str1, str2, "字符串内容应该相等");
        assertSame(str1, str1, "应该是同一个对象");
        assertNotSame(str1, str2, "不应该是同一个对象");
    }
}
```

### 数组和集合断言

```java
@Test
void testArrayAndCollectionAssertions() {
    // 数组断言
    int[] expected = {1, 2, 3, 4, 5};
    int[] actual = {1, 2, 3, 4, 5};
    assertArrayEquals(expected, actual, "数组应该相等");
    
    // 集合断言
    List<String> expectedList = Arrays.asList("A", "B", "C");
    List<String> actualList = Arrays.asList("A", "B", "C");
    assertEquals(expectedList, actualList, "列表应该相等");
    
    // 迭代器断言
    assertIterableEquals(expectedList, actualList, "迭代器应该相等");
}
```

### 异常断言

```java
@Test
void testExceptionAssertions() {
    Calculator calc = new Calculator();
    
    // 断言抛出特定异常
    ArithmeticException exception = assertThrows(
        ArithmeticException.class,
        () -> calc.divide(10, 0),
        "除以 0 应该抛出 ArithmeticException"
    );
    
    // 验证异常消息
    assertTrue(exception.getMessage().contains("/ by zero"));
    
    // 断言不抛出异常
    assertDoesNotThrow(
        () -> calc.divide(10, 2),
        "10 / 2 不应该抛出异常"
    );
}
```

### 超时断言

```java
@Test
void testTimeout() {
    // 断言方法在 1 秒内完成
    assertTimeout(Duration.ofSeconds(1), () -> {
        // 模拟耗时操作
        Thread.sleep(500);
    });
    
    // 断言方法在 1 秒内完成，并返回结果
    String result = assertTimeout(Duration.ofSeconds(1), () -> {
        return "Hello";
    });
    assertEquals("Hello", result);
    
    // 超时则立即中断（preemptively）
    assertTimeoutPreemptively(Duration.ofSeconds(1), () -> {
        // 如果超时，会立即中断执行
    });
}
```

### 分组断言

```java
@Test
void testGroupedAssertions() {
    Person person = new Person("Alice", 25);
    
    // 使用 assertAll 分组断言，即使前面的断言失败，后面的断言也会执行
    assertAll("Person 属性验证",
        () -> assertEquals("Alice", person.getName(), "名字应该是 Alice"),
        () -> assertEquals(25, person.getAge(), "年龄应该是 25"),
        () -> assertTrue(person.isAdult(), "应该是成年人")
    );
}
```

---

## 21.5 参数化测试

### 基本参数化测试

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;

public class ParameterizedTestExample {
    
    // 单个参数
    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    void testWithSingleParameter(int number) {
        assertTrue(number > 0, "数字应该大于 0");
    }
    
    // 字符串参数
    @ParameterizedTest
    @ValueSource(strings = {"Hello", "World", "JUnit"})
    void testWithStringParameter(String text) {
        assertNotNull(text, "文本不应该为 null");
        assertTrue(text.length() > 0, "文本长度应该大于 0");
    }
    
    // 多个参数（CSV 格式）
    @ParameterizedTest
    @CsvSource({
        "1, 2, 3",
        "10, 20, 30",
        "100, 200, 300"
    })
    void testWithMultipleParameters(int a, int b, int expected) {
        Calculator calc = new Calculator();
        assertEquals(expected, calc.add(a, b));
    }
    
    // 从方法获取参数
    @ParameterizedTest
    @MethodSource("provideNumbers")
    void testWithMethodSource(int number) {
        assertTrue(number > 0);
    }
    
    static Stream<Arguments> provideNumbers() {
        return Stream.of(
            Arguments.of(1),
            Arguments.of(2),
            Arguments.of(3)
        );
    }
}
```

### 自定义参数提供者

```java
@ParameterizedTest
@MethodSource("provideUsers")
void testUserRegistration(User user) {
    UserService userService = new UserService();
    User registered = userService.register(user);
    assertNotNull(registered.getId());
}

static Stream<User> provideUsers() {
    return Stream.of(
        new User("alice", "password123"),
        new User("bob", "password456"),
        new User("charlie", "password789")
    );
}
```

---

## 21.6 测试组织

### 测试套件

```java
@Suite
@SelectClasses({
    CalculatorTest.class,
    UserServiceTest.class,
    OrderServiceTest.class
})
@SuiteDisplayName("核心业务逻辑测试套件")
public class BusinessLogicTestSuite {
}
```

### 标签过滤

```java
@Test
@Tag("fast")
@DisplayName("快速测试")
void testFast() {
    // 快速测试
}

@Test
@Tag("slow")
@DisplayName("慢速测试")
void testSlow() {
    // 慢速测试
}

@Test
@Tag("integration")
@DisplayName("集成测试")
void testIntegration() {
    // 集成测试
}
```

运行指定标签的测试：

```bash
# 只运行 fast 标签的测试
mvn test -Dgroups="fast"

# 排除 slow 标签的测试
mvn test -DexcludedGroups="slow"
```

---

## 21.7 Mock 基础

### 什么是 Mock？

Mock 是模拟真实对象的行为，用于隔离测试依赖。

**生活类比**：Mock 就像"替身演员"。在拍电影时，危险动作不需要真正的演员亲自上场，而是由替身演员完成。同样，在测试时，不需要真实的数据库连接或网络请求，而是用 Mock 对象代替。

### 为什么要使用 Mock？

```java
// ❌ 不使用 Mock：依赖真实数据库
public class UserServiceTest {
    @Test
    void testRegister() {
        UserService userService = new UserService();
        // 需要真实的数据库连接
        User user = userService.register("alice", "password");
        // 测试依赖数据库，不稳定
    }
}

// ✅ 使用 Mock：隔离依赖
public class UserServiceTest {
    @Test
    void testRegister() {
        // Mock UserRepository
        UserRepository mockRepo = Mockito.mock(UserRepository.class);
        when(mockRepo.save(any(User.class))).thenReturn(new User(1L, "alice"));
        
        UserService userService = new UserService(mockRepo);
        User user = userService.register("alice", "password");
        
        assertNotNull(user.getId());
        // 测试不依赖数据库，稳定可靠
    }
}
```

### Mockito 基础

添加 Mockito 依赖：

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.5.0</version>
    <scope>test</scope>
</dependency>
```

### 创建 Mock 对象

```java
import org.mockito.Mockito;
import static org.mockito.Mockito.*;

public class UserServiceTest {
    
    @Test
    void testWithMock() {
        // 创建 Mock 对象
        UserRepository mockRepo = Mockito.mock(UserRepository.class);
        
        // 定义 Mock 行为
        when(mockRepo.findById(1L)).thenReturn(new User(1L, "Alice"));
        when(mockRepo.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(100L);  // 模拟数据库生成 ID
            return user;
        });
        
        // 使用 Mock 对象
        UserService userService = new UserService(mockRepo);
        User user = userService.getUser(1L);
        
        // 验证结果
        assertEquals("Alice", user.getName());
        
        // 验证方法调用
        verify(mockRepo).findById(1L);
        verify(mockRepo, times(1)).findById(1L);
        verify(mockRepo, never()).delete(anyLong());
    }
}
```

### Mock 注解

```java
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    
    @Mock
    private UserRepository mockRepo;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void testRegister() {
        // 定义 Mock 行为
        when(mockRepo.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        
        // 执行测试
        User user = userService.register("alice", "password");
        
        // 验证结果
        assertNotNull(user.getId());
        assertEquals("alice", user.getUsername());
        
        // 验证交互
        verify(mockRepo).save(any(User.class));
    }
}
```

### 验证交互

```java
@Test
void testVerification() {
    UserRepository mockRepo = mock(UserRepository.class);
    UserService userService = new UserService(mockRepo);
    
    // 执行操作
    userService.register("alice", "password");
    userService.register("bob", "password");
    
    // 验证 save 方法被调用了 2 次
    verify(mockRepo, times(2)).save(any(User.class));
    
    // 验证 findById 方法从未被调用
    verify(mockRepo, never()).findById(anyLong());
    
    // 验证至少调用一次
    verify(mockRepo, atLeastOnce()).save(any(User.class));
    
    // 验证最多调用 3 次
    verify(mockRepo, atMost(3)).save(any(User.class));
}
```

### 参数匹配器

```java
@Test
void testArgumentMatchers() {
    UserRepository mockRepo = mock(UserRepository.class);
    
    // 使用参数匹配器
    when(mockRepo.findByUsername(anyString())).thenReturn(new User("alice"));
    when(mockRepo.findByAge(eq(25))).thenReturn(new User("bob"));
    when(mockRepo.findByName(startsWith("A"))).thenReturn(new User("alice"));
    when(mockRepo.findByName(endsWith("e"))).thenReturn(new User("alice"));
    when(mockRepo.findByAge(greaterThan(18))).thenReturn(new User("adult"));
    
    // 自定义参数匹配器
    when(mockRepo.save(argThat(user -> 
        user.getUsername() != null && user.getPassword() != null
    ))).thenAnswer(invocation -> invocation.getArgument(0));
}
```

---

## 21.8 测试最佳实践

### 1. 测试命名规范

```java
// ✅ 推荐：描述测试场景和预期结果
@Test
@DisplayName("当用户名为空时，应该抛出 IllegalArgumentException")
void testRegisterWithEmptyUsername() {
    // ...
}

// ✅ 推荐：使用方法名描述测试
@Test
void register_withEmptyUsername_throwsException() {
    // ...
}

// ❌ 不推荐：无意义的命名
@Test
void test1() { }

@Test
void testRegister() { }  // 没有说明测试什么场景
```

### 2. 测试结构（AAA 模式）

```java
@Test
void testWithdraw() {
    // Arrange（准备）
    Account account = new Account(1000);
    
    // Act（执行）
    account.withdraw(500);
    
    // Assert（断言）
    assertEquals(500, account.getBalance());
}
```

### 3. 一个测试一个概念

```java
// ❌ 错误：一个测试多个概念
@Test
void testCalculator() {
    Calculator calc = new Calculator();
    assertEquals(5, calc.add(2, 3));
    assertEquals(2, calc.subtract(5, 3));
    assertEquals(6, calc.multiply(2, 3));
    assertEquals(2, calc.divide(6, 3));
}

// ✅ 正确：每个测试一个概念
@Test
void testAdd() {
    Calculator calc = new Calculator();
    assertEquals(5, calc.add(2, 3));
}

@Test
void testSubtract() {
    Calculator calc = new Calculator();
    assertEquals(2, calc.subtract(5, 3));
}
```

### 4. 测试独立性

```java
// ✅ 正确：每个测试独立
public class UserServiceTest {
    
    private UserService userService;
    
    @BeforeEach
    void setUp() {
        // 每个测试前重新初始化
        userService = new UserService();
    }
    
    @Test
    void testRegister() {
        User user = userService.register("alice", "password");
        assertNotNull(user.getId());
    }
    
    @Test
    void testLogin() {
        // 不依赖 testRegister 的结果
        userService.register("bob", "password");
        User user = userService.login("bob", "password");
        assertNotNull(user);
    }
}
```

### 5. 测试边界条件

```java
@Test
void testArrayBoundary() {
    int[] emptyArray = {};
    int[] singleElement = {5};
    int[] largeArray = new int[10000];
    
    // 测试空数组
    assertEquals(0, ArrayUtil.sum(emptyArray));
    
    // 测试单元素数组
    assertEquals(5, ArrayUtil.sum(singleElement));
    
    // 测试大数组
    Arrays.fill(largeArray, 1);
    assertEquals(10000, ArrayUtil.sum(largeArray));
}
```

---

## 21.9 新手常见误区

### 误区 1：测试代码不需要维护

**错！** 测试代码同样需要高质量、可维护。

```java
// ❌ 错误：测试代码混乱
@Test
void test() {
    UserService s = new UserService();
    User u = s.register("a", "b");
    assertTrue(u != null);
}

// ✅ 正确：测试代码清晰
@Test
@DisplayName("注册新用户应该返回带 ID 的用户对象")
void register_newUser_returnsUserWithId() {
    // Arrange
    UserService userService = new UserService();
    String username = "alice";
    String password = "password123";
    
    // Act
    User registeredUser = userService.register(username, password);
    
    // Assert
    assertNotNull(registeredUser, "用户对象不应该为 null");
    assertNotNull(registeredUser.getId(), "用户 ID 不应该为 null");
    assertEquals(username, registeredUser.getUsername(), "用户名应该匹配");
}
```

### 误区 2：测试覆盖率越高越好

**注意！** 覆盖率是指标，不是目标。

```java
// ❌ 为了覆盖率而测试无意义的代码
@Test
void testGetterSetter() {
    User user = new User();
    user.setName("Alice");
    assertEquals("Alice", user.getName());
}

// ✅ 测试业务逻辑和边界条件
@Test
void testRegisterWithDuplicateUsername() {
    UserService userService = new UserService();
    userService.register("alice", "password1");
    
    assertThrows(DuplicateUsernameException.class, () -> {
        userService.register("alice", "password2");
    });
}
```

### 误区 3：测试依赖其他测试的执行顺序

**错！** 测试应该独立，不依赖执行顺序。

```java
// ❌ 错误：依赖测试顺序
@Test
void test1_register() {
    userService.register("alice", "password");
}

@Test
void test2_login() {
    // 依赖 test1 注册的用户
    User user = userService.login("alice", "password");
    assertNotNull(user);
}

// ✅ 正确：每个测试独立
@Test
void testRegister() {
    UserService userService = new UserService();
    User user = userService.register("alice", "password");
    assertNotNull(user);
}

@Test
void testLogin() {
    UserService userService = new UserService();
    userService.register("bob", "password");  // 自己准备数据
    User user = userService.login("bob", "password");
    assertNotNull(user);
}
```

### 误区 4：忽略异常测试

**注意！** 异常测试同样重要。

```java
// ❌ 只测试正常情况
@Test
void testDivide() {
    Calculator calc = new Calculator();
    assertEquals(5, calc.divide(10, 2));
}

// ✅ 同时测试异常情况
@Test
void testDivideByZero() {
    Calculator calc = new Calculator();
    assertThrows(ArithmeticException.class, () -> {
        calc.divide(10, 0);
    });
}
```

### 误区 5：Mock 所有依赖

**注意！** 不要过度使用 Mock。

```java
// ❌ 过度 Mock：测试没有意义
@Test
void testWithTooManyMocks() {
    User mockUser = mock(User.class);
    UserRepository mockRepo = mock(UserRepository.class);
    UserService mockService = mock(UserService.class);
    
    when(mockService.register(anyString(), anyString())).thenReturn(mockUser);
    // 测试的都是 Mock 对象，没有实际意义
}

// ✅ 合理使用 Mock：只 Mock 外部依赖
@Test
void testWithReasonableMocks() {
    UserRepository mockRepo = mock(UserRepository.class);  // Mock 数据库
    UserService userService = new UserService(mockRepo);  // 真实对象
    
    when(mockRepo.save(any(User.class))).thenAnswer(invocation -> {
        User user = invocation.getArgument(0);
        user.setId(1L);
        return user;
    });
    
    User user = userService.register("alice", "password");
    assertNotNull(user.getId());
}
```

---

## 21.10 动手练习

### 练习 1：基础练习 - 编写计算器测试

为以下 `Calculator` 类编写完整的单元测试：

```java
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public int subtract(int a, int b) { return a - b; }
    public int multiply(int a, int b) { return a * b; }
    public int divide(int a, int b) { 
        if (b == 0) throw new ArithmeticException("Division by zero");
        return a / b; 
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("计算器测试")
public class CalculatorTest {
    
    private Calculator calculator;
    
    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }
    
    @Nested
    @DisplayName("加法测试")
    class AddTests {
        
        @Test
        @DisplayName("正数相加")
        void testAddPositive() {
            assertEquals(5, calculator.add(2, 3));
        }
        
        @Test
        @DisplayName("负数相加")
        void testAddNegative() {
            assertEquals(-5, calculator.add(-2, -3));
        }
        
        @Test
        @DisplayName("零相加")
        void testAddZero() {
            assertEquals(5, calculator.add(5, 0));
        }
    }
    
    @Nested
    @DisplayName("除法测试")
    class DivideTests {
        
        @Test
        @DisplayName("正常除法")
        void testDivide() {
            assertEquals(5, calculator.divide(10, 2));
        }
        
        @Test
        @DisplayName("除以零抛出异常")
        void testDivideByZero() {
            assertThrows(ArithmeticException.class, () -> {
                calculator.divide(10, 0);
            });
        }
    }
}
```

</details>

### 练习 2：进阶练习 - 使用 Mock 测试服务层

为以下 `UserService` 类编写单元测试，使用 Mock 模拟 `UserRepository`：

```java
public class UserService {
    private UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public User register(String username, String password) {
        if (userRepository.findByUsername(username) != null) {
            throw new DuplicateUsernameException("Username already exists");
        }
        User user = new User(username, password);
        return userRepository.save(user);
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
import org.junit.jupiter.api.*;
import org.mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("用户服务测试")
public class UserServiceTest {
    
    @Mock
    private UserRepository mockRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    @DisplayName("注册新用户应该成功")
    void testRegisterNewUser() {
        // Arrange
        when(mockRepository.findByUsername("alice")).thenReturn(null);
        when(mockRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        
        // Act
        User user = userService.register("alice", "password123");
        
        // Assert
        assertNotNull(user.getId());
        assertEquals("alice", user.getUsername());
        verify(mockRepository).findByUsername("alice");
        verify(mockRepository).save(any(User.class));
    }
    
    @Test
    @DisplayName("注册重复用户名应该抛出异常")
    void testRegisterDuplicateUsername() {
        // Arrange
        when(mockRepository.findByUsername("bob")).thenReturn(new User("bob", "password"));
        
        // Act & Assert
        assertThrows(DuplicateUsernameException.class, () -> {
            userService.register("bob", "password123");
        });
        
        verify(mockRepository).findByUsername("bob");
        verify(mockRepository, never()).save(any(User.class));
    }
}
```

</details>

### 练习 3（挑战）：参数化测试

为以下 `StringUtils.isPalindrome()` 方法编写参数化测试：

```java
public class StringUtils {
    public static boolean isPalindrome(String str) {
        if (str == null) return false;
        String cleaned = str.replaceAll("\\s+", "").toLowerCase();
        int left = 0, right = cleaned.length() - 1;
        while (left < right) {
            if (cleaned.charAt(left) != cleaned.charAt(right)) return false;
            left++;
            right--;
        }
        return true;
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

public class StringUtilsTest {
    
    @ParameterizedTest(name = "\"{0}\" 应该是回文：{1}")
    @CsvSource({
        "'racecar', true",
        "'hello', false",
        "'A man a plan a canal Panama', true",
        "'Was it a car or a cat I saw', true",
        "'', true",
        "'a', true"
    })
    void testIsPalindrome(String input, boolean expected) {
        assertEquals(expected, StringUtils.isPalindrome(input));
    }
    
    @ParameterizedTest
    @org.junit.jupiter.params.provider.NullSource
    void testIsPalindromeWithNull(String input) {
        assertFalse(StringUtils.isPalindrome(input));
    }
}
```

</details>

---

## 21.11 核心知识点

| 知识点 | 说明 |
|--------|------|
| JUnit 5 | Java 最流行的单元测试框架 |
| @Test | 标记测试方法 |
| @BeforeEach / @AfterEach | 每个测试方法前后执行 |
| @BeforeAll / @AfterAll | 所有测试方法前后执行一次 |
| @DisplayName | 为测试类或方法提供显示名称 |
| @Nested | 嵌套测试，组织测试结构 |
| assertEquals / assertNotEquals | 相等/不相等断言 |
| assertTrue / assertFalse | 布尔断言 |
| assertNull / assertNotNull | null 断言 |
| assertThrows | 异常断言 |
| assertAll | 分组断言 |
| @ParameterizedTest | 参数化测试 |
| @Mock | 创建 Mock 对象 |
| @InjectMocks | 注入 Mock 到被测对象 |
| when().thenReturn() | 定义 Mock 行为 |
| verify() | 验证方法调用 |

---

## 下一章预告

恭喜你完成了 Java 从入门到精通的学习！至此，你已经掌握了：

- Java 基础语法和面向对象编程
- 集合框架、IO、多线程与并发
- Lambda 表达式和 Stream API
- 数据库编程和项目构建
- 字符串处理、正则表达式、日期时间 API
- 泛型和单元测试

接下来，你可以：

- 深入学习 **Java 原理深度解析** 教程，理解底层原理
- 学习 **Spring Boot** 框架，开发 Web 应用
- 学习 **微服务架构**，构建分布式系统
- 实践更多项目，提升编程能力

编程之路永无止境，持续学习，不断进步！

---

## 本章小结

单元测试是保证代码质量的重要手段。JUnit 5 提供了丰富的注解和断言方法来编写测试。Mock 可以隔离依赖，让测试更稳定。遵循测试最佳实践，编写可维护、独立的测试用例。通过持续练习，你将掌握单元测试的精髓，写出更可靠的代码。
