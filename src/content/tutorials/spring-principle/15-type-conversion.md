---
title: "第 15 章：Spring 类型转换与校验"
description: "深入理解 Spring 类型转换体系，掌握 ConversionService 与 JSR-303 校验集成"
---

# 第 15 章：Spring 类型转换与校验

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 是怎么把字符串 "2024-01-01" 转成 LocalDate 对象的？
- ConversionService 和 PropertyEditor 有什么区别？
- Formatter 是什么？什么时候用它？
- JSR-303 校验是怎么集成的？@Valid 和 @Validated 有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **类型转换的核心原理**，再学习各种转换器和校验器的使用，最后深入源码看看 Spring 是怎么玩转类型转换的。

---

## 15.1 为什么需要类型转换？

### 痛点分析

想象一下这个场景：用户在表单中输入日期 "2024-01-01"，后端需要转成 LocalDate 对象：

```java
// 没有类型转换时
@PostMapping("/user")
public String createUser(@RequestParam String birthday) {
    // 手动转换，容易出错
    try {
        LocalDate date = LocalDate.parse(birthday);
        // 保存用户
    } catch (DateTimeParseException e) {
        // 处理异常
        return "日期格式错误";
    }
}
```

**问题来了**：
- 每个接口都要手动转换
- 转换逻辑重复，代码冗余
- 容易忘记转换，导致 bug
- 无法统一处理转换异常

### 解决方案

有了 Spring 类型转换，代码变成这样：

```java
// 自动转换，无需手动处理
@PostMapping("/user")
public String createUser(@RequestParam LocalDate birthday) {
    // Spring 自动把字符串转成 LocalDate
    // 保存用户
    return "success";
}
```

**好处**：
- 自动完成类型转换
- 支持自定义转换规则
- 统一的异常处理
- 代码简洁，易于维护

> **一句话总结**：类型转换让 Spring 自动帮你把一种类型转成另一种类型，省去手动转换的麻烦。

---

## 15.2 核心原理讲解

### 概念解释

Spring 类型转换有三个核心组件：

1. **PropertyEditor**：JavaBean 规范的属性编辑器（旧版本）
2. **ConversionService**：Spring 的类型转换服务（推荐）
3. **Formatter**：格式化器，用于字符串和对象之间的转换

打个比方：

> 类型转换就像一个翻译官。你说中文（字符串），翻译官帮你翻译成英文（对象）。不同的翻译官有不同的专长，有的擅长翻译日期，有的擅长翻译数字。

### 类型转换体系演进

```
Java 1.0 - PropertyEditor（JavaBean 规范）
    ↓
Spring 3.0 - ConversionService（Spring 推荐）
    ↓
Spring 3.0 - Formatter（格式化器，基于 ConversionService）
    ↓
Spring 4.0 - 集成 JSR-303 校验
```

### PropertyEditor 原理

PropertyEditor 是 JavaBean 规范的属性编辑器：

```java
// 自定义 PropertyEditor
public class DatePropertyEditor extends PropertyEditorSupport {
    @Override
    public void setAsText(String text) throws IllegalArgumentException {
        try {
            // 把字符串转成 Date
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Date date = sdf.parse(text);
            setValue(date);  // 设置转换后的值
        } catch (ParseException e) {
            throw new IllegalArgumentException("日期格式错误：" + text);
        }
    }
    
    @Override
    public String getAsText() {
        // 把 Date 转成字符串
        Date date = (Date) getValue();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(date);
    }
}

// 注册 PropertyEditor
@InitBinder
public void initBinder(WebDataBinder binder) {
    binder.registerCustomEditor(Date.class, new DatePropertyEditor());
}
```

**缺点**：
- 只能处理 String 和 Object 之间的转换
- 不是线程安全的
- API 设计不够清晰

### ConversionService 原理

ConversionService 是 Spring 推荐的类型转换服务：

```java
// 核心接口
public interface ConversionService {
    // 判断是否可以转换
    boolean canConvert(Class<?> sourceType, Class<?> targetType);
    
    // 执行转换
    <T> T convert(Object source, Class<T> targetType);
}

// 使用示例
@Autowired
private ConversionService conversionService;

public void test() {
    // 字符串转数字
    Integer number = conversionService.convert("123", Integer.class);
    
    // 字符串转日期
    LocalDate date = conversionService.convert("2024-01-01", LocalDate.class);
}
```

**源码分析**：

```java
// DefaultConversionService 核心实现
public class DefaultConversionService extends GenericConversionService {
    public DefaultConversionService() {
        // 注册默认转换器
        addDefaultConverters(this);
    }
    
    public static void addDefaultConverters(ConverterRegistry converterRegistry) {
        // 1. 添加标量转换器（String <-> 基本类型）
        addScalarConverters(converterRegistry);
        
        // 2. 添加集合转换器（List <-> Array 等）
        addCollectionConverters(converterRegistry);
        
        // 3. 添加 Map 转换器
        converterRegistry.addConverter(new StringToCollectionConverter());
    }
    
    private static void addScalarConverters(ConverterRegistry registry) {
        // 注册 String -> Integer 转换器
        registry.addConverter(String.class, Integer.class, 
            new StringToIntegerConverter());
        
        // 注册 String -> Long 转换器
        registry.addConverter(String.class, Long.class, 
            new StringToLongConverter());
        
        // 注册 String -> Date 转换器
        registry.addConverter(String.class, Date.class, 
            new StringToDateConverter());
    }
}

// 自定义转换器
public class StringToLocalDateConverter implements Converter<String, LocalDate> {
    @Override
    public LocalDate convert(String source) {
        // 实现转换逻辑
        return LocalDate.parse(source, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
}

// 注册自定义转换器
@Configuration
public class ConversionConfig {
    @Bean
    public ConversionService conversionService() {
        DefaultConversionService service = new DefaultConversionService();
        
        // 注册自定义转换器
        service.addConverter(new StringToLocalDateConverter());
        
        return service;
    }
}
```

**关键点**：
- ConversionService 是线程安全的
- 支持任意类型之间的转换
- 可以注册自定义转换器
- 内置了大量常用转换器

### Formatter 原理

Formatter 是 ConversionService 的增强版，专门用于字符串和对象之间的转换：

```java
// 自定义 Formatter
public class DateFormatter implements Formatter<LocalDate> {
    private final DateTimeFormatter formatter = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    @Override
    public String print(LocalDate object, Locale locale) {
        // 对象 -> 字符串（用于显示）
        return object.format(formatter);
    }
    
    @Override
    public LocalDate parse(String text, Locale locale) throws ParseException {
        // 字符串 -> 对象（用于解析）
        return LocalDate.parse(text, formatter);
    }
}

// 注册 Formatter
@Configuration
public class FormatterConfig implements WebMvcConfigurer {
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addFormatter(new DateFormatter());
    }
}
```

**Formatter vs Converter**：

| 特性 | Converter | Formatter |
| --- | --- | --- |
| 转换方向 | 任意类型 -> 任意类型 | String <-> 对象 |
| 是否支持 Locale | 不支持 | 支持 |
| 使用场景 | 通用类型转换 | 格式化显示和解析 |
| 推荐度 | 高 | 需要格式化时 |

### JSR-303 校验集成原理

JSR-303 是 Java 的 Bean 校验规范：

```java
// 1. 添加依赖
// pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

// 2. 在 Bean 上添加校验注解
public class User {
    @NotNull(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在 3-20 之间")
    private String username;
    
    @NotNull(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 18, message = "年龄必须大于等于 18")
    @Max(value = 100, message = "年龄必须小于等于 100")
    private Integer age;
}

// 3. 在控制器中启用校验
@PostMapping("/user")
public String createUser(@Valid @RequestBody User user, BindingResult result) {
    if (result.hasErrors()) {
        // 处理校验错误
        return "error";
    }
    // 保存用户
    return "success";
}
```

**校验流程**：
1. Spring 接收到请求参数
2. 类型转换（String -> 对象）
3. 触发校验（@Valid）
4. 如果校验失败，错误信息存入 BindingResult
5. 如果校验成功，执行业务逻辑

### 对比分析

| 特性 | PropertyEditor | ConversionService | Formatter |
| --- | --- | --- | --- |
| 版本 | Java 1.0 | Spring 3.0+ | Spring 3.0+ |
| 线程安全 | 否 | 是 | 是 |
| 转换范围 | String <-> Object | 任意类型 | String <-> 对象 |
| Locale 支持 | 否 | 否 | 是 |
| 推荐使用 | 否 | 是 | 需要格式化时 |

---

## 15.3 基础用法

### 示例 1：自定义 Converter

```java
// 1. 定义转换器：String -> LocalDate
@Component
public class StringToLocalDateConverter implements Converter<String, LocalDate> {
    @Override
    public LocalDate convert(String source) {
        // 解析字符串为 LocalDate
        return LocalDate.parse(source, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
}

// 2. 注册转换器
@Configuration
public class ConversionConfig implements WebMvcConfigurer {
    @Autowired
    private StringToLocalDateConverter converter;
    
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(converter);
    }
}

// 3. 使用自动转换
@RestController
public class UserController {
    @GetMapping("/user")
    public String getUser(@RequestParam LocalDate birthday) {
        // Spring 自动把字符串转成 LocalDate
        return "生日：" + birthday;
    }
}
```

### 示例 2：自定义 Formatter

```java
// 1. 定义格式化器
@Component
public class MoneyFormatter implements Formatter<BigDecimal> {
    private final NumberFormat numberFormat = NumberFormat.getCurrencyInstance(Locale.CHINA);
    
    @Override
    public String print(BigDecimal object, Locale locale) {
        // 对象 -> 字符串（用于显示）
        return numberFormat.format(object);
    }
    
    @Override
    public BigDecimal parse(String text, Locale locale) throws ParseException {
        // 字符串 -> 对象（用于解析）
        // 去掉货币符号和逗号
        String cleanText = text.replace("￥", "").replace(",", "");
        return new BigDecimal(cleanText);
    }
}

// 2. 注册格式化器
@Configuration
public class FormatterConfig implements WebMvcConfigurer {
    @Autowired
    private MoneyFormatter moneyFormatter;
    
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addFormatter(moneyFormatter);
    }
}

// 3. 使用自动格式化
@RestController
public class ProductController {
    @GetMapping("/product")
    public String getProduct(@RequestParam BigDecimal price) {
        // Spring 自动把 "￥1,234.56" 转成 BigDecimal
        return "价格：" + price;
    }
}
```

### 示例 3：@Valid 校验

```java
// 1. 定义校验规则
public class User {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在 3-20 之间")
    private String username;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @NotNull(message = "年龄不能为空")
    @Min(value = 18, message = "年龄必须大于等于 18")
    @Max(value = 100, message = "年龄必须小于等于 100")
    private Integer age;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    // getter、setter
}

// 2. 控制器中启用校验
@RestController
@RequestMapping("/api/user")
public class UserController {
    
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User user, 
                                       BindingResult result) {
        // 检查是否有校验错误
        if (result.hasErrors()) {
            // 收集所有错误信息
            List<String> errors = result.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.toList());
            
            return ResponseEntity.badRequest().body(errors);
        }
        
        // 校验通过，保存用户
        return ResponseEntity.ok("用户创建成功");
    }
}
```

### 示例 4：自定义校验注解

```java
// 1. 定义校验注解
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IdCardValidator.class)
public @interface IdCard {
    String message() default "身份证号格式不正确";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}

// 2. 实现校验器
public class IdCardValidator implements ConstraintValidator<IdCard, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;  // 空值由 @NotNull 处理
        }
        
        // 简单的身份证号校验（18 位）
        String regex = "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$";
        return value.matches(regex);
    }
}

// 3. 使用自定义校验
public class User {
    @IdCard(message = "身份证号格式不正确")
    private String idCard;
}
```

### 示例 5：分组校验

```java
// 1. 定义分组接口
public interface CreateGroup {}
public interface UpdateGroup {}

// 2. 在不同场景使用不同校验
public class User {
    // 创建时不校验 id，更新时校验
    @Null(groups = CreateGroup.class, message = "创建时 ID 必须为空")
    @NotNull(groups = UpdateGroup.class, message = "更新时 ID 不能为空")
    private Long id;
    
    // 创建和更新都要校验
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class}, 
              message = "用户名不能为空")
    private String username;
}

// 3. 指定校验分组
@RestController
public class UserController {
    @PostMapping
    public ResponseEntity<?> createUser(@Validated(CreateGroup.class) 
                                       @RequestBody User user) {
        // 使用 CreateGroup 分组校验
        return ResponseEntity.ok("创建成功");
    }
    
    @PutMapping
    public ResponseEntity<?> updateUser(@Validated(UpdateGroup.class) 
                                       @RequestBody User user) {
        // 使用 UpdateGroup 分组校验
        return ResponseEntity.ok("更新成功");
    }
}
```

---

## 15.4 进阶用法

### 嵌套对象校验

```java
// 地址类
public class Address {
    @NotBlank(message = "省份不能为空")
    private String province;
    
    @NotBlank(message = "城市不能为空")
    private String city;
    
    @NotBlank(message = "详细地址不能为空")
    private String detail;
}

// 用户类
public class User {
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @Valid  // 级联校验
    @NotNull(message = "地址不能为空")
    private Address address;
}

// 控制器
@RestController
public class UserController {
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User user, 
                                       BindingResult result) {
        if (result.hasErrors()) {
            // 会校验 address 中的字段
            List<String> errors = result.getAllErrors().stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(errors);
        }
        return ResponseEntity.ok("成功");
    }
}
```

### 自定义校验逻辑

```java
// 1. 定义类级别校验注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordMatchValidator.class)
public @interface PasswordMatch {
    String message() default "两次密码输入不一致";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 2. 实现校验器
public class PasswordMatchValidator 
        implements ConstraintValidator<PasswordMatch, UserRegistrationForm> {
    
    @Override
    public boolean isValid(UserRegistrationForm form, ConstraintValidatorContext context) {
        if (form.getPassword() == null || form.getConfirmPassword() == null) {
            return true;
        }
        
        // 检查两次密码是否一致
        boolean matches = form.getPassword().equals(form.getConfirmPassword());
        
        if (!matches) {
            // 自定义错误信息
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("两次密码输入不一致")
                .addPropertyNode("confirmPassword")
                .addConstraintViolation();
        }
        
        return matches;
    }
}

// 3. 使用类级别校验
@PasswordMatch
public class UserRegistrationForm {
    @NotBlank(message = "密码不能为空")
    private String password;
    
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;
}
```

### 异步校验

```java
// 1. 定义异步校验注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UsernameUniqueValidator.class)
public @interface UsernameUnique {
    String message() default "用户名已存在";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 2. 实现异步校验器
public class UsernameUniqueValidator 
        implements ConstraintValidator<UsernameUnique, String> {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public boolean isValid(String username, ConstraintValidatorContext context) {
        if (username == null || username.isEmpty()) {
            return true;
        }
        
        // 查询数据库检查用户名是否唯一
        // 注意：这里会阻塞，实际项目中应该使用异步校验
        return !userRepository.existsByUsername(username);
    }
}

// 3. 使用
public class User {
    @UsernameUnique
    private String username;
}
```

### 全局异常处理

```java
// 全局校验异常处理
@RestControllerAdvice
public class ValidationExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            String field = error.getField();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });
        
        return ResponseEntity.badRequest().body(errors);
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(
            ConstraintViolationException ex) {
        
        Map<String, String> errors = new HashMap<>();
        
        ex.getConstraintViolations().forEach(violation -> {
            String field = violation.getPropertyPath().toString();
            String message = violation.getMessage();
            errors.put(field, message);
        });
        
        return ResponseEntity.badRequest().body(errors);
    }
}
```

---

## 15.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| PropertyEditor | JavaBean 规范的属性编辑器，已过时 |
| ConversionService | Spring 推荐的类型转换服务 |
| Converter | 类型转换接口，任意类型 -> 任意类型 |
| Formatter | 格式化器，String <-> 对象，支持 Locale |
| @Valid | JSR-303 校验注解，触发校验 |
| @Validated | Spring 提供的校验注解，支持分组 |
| BindingResult | 校验结果对象 |
| ConstraintValidator | 自定义校验器接口 |
| @InitBinder | 注册自定义编辑器 |

---

## 15.6 新手常见误区

### 误区 1："@Valid 和 @Validated 是一回事"

**错！** 它们是两个不同的注解：
- @Valid 是 JSR-303 标准注解
- @Validated 是 Spring 提供的注解，支持分组校验

正确做法：
```java
// ✅ 简单校验用 @Valid
@PostMapping
public ResponseEntity<?> create(@Valid @RequestBody User user) {
    // ...
}

// ✅ 需要分组用 @Validated
@PostMapping
public ResponseEntity<?> create(@Validated(CreateGroup.class) @RequestBody User user) {
    // ...
}
```

### 误区 2："Converter 和 Formatter 可以互换使用"

**错！** 它们的职责不同：
- Converter 用于任意类型之间的转换
- Formatter 专门用于字符串和对象之间的转换，且支持 Locale

正确做法：
```java
// ✅ 字符串转日期，用 Formatter（需要国际化）
public class DateFormatter implements Formatter<LocalDate> {
    @Override
    public String print(LocalDate object, Locale locale) {
        // 根据 Locale 格式化
    }
}

// ✅ 对象转 DTO，用 Converter
public class UserToUserDTOConverter implements Converter<User, UserDTO> {
    @Override
    public UserDTO convert(User source) {
        // 转换逻辑
    }
}
```

### 误区 3："校验失败会抛出异常"

**错！** 校验失败不会抛出异常，而是把错误信息存入 BindingResult。

正确做法：
```java
@PostMapping
public ResponseEntity<?> create(@Valid @RequestBody User user, 
                               BindingResult result) {
    // ✅ 检查 BindingResult
    if (result.hasErrors()) {
        List<String> errors = result.getFieldErrors().stream()
            .map(e -> e.getDefaultMessage())
            .collect(Collectors.toList());
        return ResponseEntity.badRequest().body(errors);
    }
    
    // 校验通过
    return ResponseEntity.ok("成功");
}
```

### 误区 4："自定义校验器可以是实例方法"

**错！** 自定义校验器的 isValid 方法必须是**实例方法**，但校验器本身会被 Spring 管理为 Bean。

正确做法：
```java
// ✅ 正确
public class MyValidator implements ConstraintValidator<MyAnnotation, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // 校验逻辑
    }
}

// ❌ 错误：静态方法
public class MyValidator implements ConstraintValidator<MyAnnotation, String> {
    public static boolean isValid(String value, ConstraintValidatorContext context) {
        // 不会被调用
    }
}
```

### 误区 5："类型转换失败会返回 null"

**错！** 类型转换失败会抛出 **TypeMismatchException** 异常。

正确做法：
```java
// ✅ 捕获转换异常
@ExceptionHandler(TypeMismatchException.class)
public ResponseEntity<String> handleTypeMismatch(TypeMismatchException ex) {
    return ResponseEntity.badRequest()
        .body("类型转换失败：" + ex.getValue() + " 无法转换为 " + ex.getRequiredType());
}
```

---

## 15.7 动手练习

### 练习 1：基础练习 - 自定义转换器

实现一个 String -> User 的转换器，将 JSON 字符串转成 User 对象。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义转换器
@Component
public class StringToUserConverter implements Converter<String, User> {
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public User convert(String source) {
        try {
            // 解析 JSON 字符串为 User 对象
            return objectMapper.readValue(source, User.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("JSON 格式错误：" + source, e);
        }
    }
}

// 2. 注册转换器
@Configuration
public class ConversionConfig implements WebMvcConfigurer {
    @Autowired
    private StringToUserConverter converter;
    
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(converter);
    }
}

// 3. 使用
@RestController
public class UserController {
    @PostMapping("/user")
    public String createUser(@RequestParam User user) {
        // Spring 自动把 JSON 字符串转成 User 对象
        return "用户：" + user.getUsername();
    }
}

// 4. 测试
@SpringBootTest
public class ConverterTest {
    @Autowired
    private ConversionService conversionService;
    
    @Test
    public void testStringToUser() {
        String json = "{\"username\":\"张三\",\"age\":25}";
        User user = conversionService.convert(json, User.class);
        
        assertNotNull(user);
        assertEquals("张三", user.getUsername());
        assertEquals(25, user.getAge());
    }
}
```

</details>

### 练习 2：进阶练习 - 自定义校验注解

实现一个 @Phone 校验注解，校验中国大陆手机号格式。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义校验注解
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneValidator.class)
public @interface Phone {
    String message() default "手机号格式不正确";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}

// 2. 实现校验器
public class PhoneValidator implements ConstraintValidator<Phone, String> {
    // 中国大陆手机号正则
    private static final String PHONE_REGEX = "^1[3-9]\\d{9}$";
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;  // 空值由 @NotNull 处理
        }
        
        return value.matches(PHONE_REGEX);
    }
}

// 3. 使用自定义校验
public class User {
    @Phone(message = "手机号格式不正确")
    private String phone;
}

// 4. 测试
@SpringBootTest
public class PhoneValidationTest {
    @Autowired
    private Validator validator;
    
    @Test
    public void testValidPhone() {
        User user = new User();
        user.setPhone("13812345678");
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    public void testInvalidPhone() {
        User user = new User();
        user.setPhone("12345678901");
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertEquals(1, violations.size());
        assertEquals("手机号格式不正确", violations.iterator().next().getMessage());
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 完整的用户注册校验

实现一个用户注册接口，包含以下校验：
1. 用户名：3-20 位，字母开头
2. 密码：6-20 位，必须包含字母和数字
3. 邮箱：格式正确
4. 年龄：18-100
5. 两次密码一致（类级别校验）

<details>
<summary>点击查看答案</summary>

```java
// 1. 自定义校验注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UsernameValidator.class)
public @interface Username {
    String message() default "用户名格式不正确（3-20 位，字母开头）";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class UsernameValidator implements ConstraintValidator<Username, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;
        }
        // 字母开头，3-20 位
        return value.matches("^[a-zA-Z][a-zA-Z0-9_]{2,19}$");
    }
}

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface Password {
    String message() default "密码格式不正确（6-20 位，必须包含字母和数字）";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordValidator implements ConstraintValidator<Password, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;
        }
        // 6-20 位，必须包含字母和数字
        return value.matches("^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d]{6,20}$");
    }
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordMatchValidator.class)
public @interface PasswordMatch {
    String message() default "两次密码输入不一致";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordMatchValidator 
        implements ConstraintValidator<PasswordMatch, UserRegistrationForm> {
    @Override
    public boolean isValid(UserRegistrationForm form, ConstraintValidatorContext context) {
        if (form.getPassword() == null || form.getConfirmPassword() == null) {
            return true;
        }
        return form.getPassword().equals(form.getConfirmPassword());
    }
}

// 2. 注册表单
@PasswordMatch
public class UserRegistrationForm {
    @Username
    private String username;
    
    @Password
    private String password;
    
    @Password
    private String confirmPassword;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 18, message = "年龄必须大于等于 18")
    @Max(value = 100, message = "年龄必须小于等于 100")
    private Integer age;
    
    // getter、setter
}

// 3. 控制器
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationForm form,
                                     BindingResult result) {
        if (result.hasErrors()) {
            List<String> errors = result.getAllErrors().stream()
                .map(error -> {
                    if (error instanceof FieldError) {
                        return ((FieldError) error).getField() + ": " + 
                               error.getDefaultMessage();
                    }
                    return error.getDefaultMessage();
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.badRequest().body(errors);
        }
        
        // 注册成功
        return ResponseEntity.ok("注册成功");
    }
}

// 4. 测试
@SpringBootTest
public class RegistrationTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testValidRegistration() throws Exception {
        String json = "{" +
            "\"username\":\"zhangsan\"," +
            "\"password\":\"abc123\"," +
            "\"confirmPassword\":\"abc123\"," +
            "\"email\":\"zhangsan@example.com\"," +
            "\"age\":25" +
            "}";
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(content().string("注册成功"));
    }
    
    @Test
    public void testInvalidUsername() throws Exception {
        String json = "{" +
            "\"username\":\"1zhangsan\"," +  // 数字开头
            "\"password\":\"abc123\"," +
            "\"confirmPassword\":\"abc123\"," +
            "\"email\":\"zhangsan@example.com\"," +
            "\"age\":25" +
            "}";
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest());
    }
    
    @Test
    public void testPasswordMismatch() throws Exception {
        String json = "{" +
            "\"username\":\"zhangsan\"," +
            "\"password\":\"abc123\"," +
            "\"confirmPassword\":\"abc456\"," +  // 不一致
            "\"email\":\"zhangsan@example.com\"," +
            "\"age\":25" +
            "}";
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest());
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 常用设计模式**——看看 Spring 是如何运用各种设计模式的。你会学到：
- 工厂模式在 BeanFactory 中的应用
- 单例模式在 DefaultSingletonBeanRegistry 中的实现
- 代理模式在 AOP 中的使用
- 模板方法在 JdbcTemplate 中的体现
- 观察者模式在事件机制中的应用
- 策略模式在 Resource 中的使用
- 适配器模式在 HandlerAdapter 中的实现

设计模式是 Spring 的灵魂，掌握它们能让你更深入理解 Spring 的设计思想。我们下一章见！
