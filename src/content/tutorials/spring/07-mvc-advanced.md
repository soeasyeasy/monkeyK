---
title: "第7章：Spring MVC 进阶"
description: "掌握参数绑定、数据校验、文件上传和国际化"
---

# 第7章：Spring MVC 进阶

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何将请求参数自动转换为对象？
- 如何验证用户输入的数据？
- 如何处理文件上传？
- 如何实现多语言支持？

这一章就是为了解答这些问题。我们会深入学习 Spring MVC 的高级特性，掌握参数绑定、数据校验、文件上传和国际化等实用技术。

---

## 1 参数绑定

### 7.1.1 简单类型绑定

```java
@Controller
@RequestMapping("/users")
public class UserController {
    
    // 基本类型自动转换
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        // String 自动转换为 Long
        return "user/detail";
    }
    
    // 日期类型绑定
    @GetMapping("/search")
    public String search(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        // 2024-01-01 自动转换为 Date
        return "search/result";
    }
    
    // 数组绑定
    @GetMapping("/batch")
    public String batchDelete(@RequestParam Long[] ids) {
        // /batch?ids=1&ids=2&ids=3
        for (Long id : ids) {
            System.out.println("删除: " + id);
        }
        return "redirect:/users";
    }
    
    // List 绑定
    @GetMapping("/batch2")
    public String batchDelete2(@RequestParam List<Long> ids) {
        // /batch2?ids=1,2,3
        return "redirect:/users";
    }
}
```

### 7.1.2 对象绑定

```java
// User.java
public class User {
    private Long id;
    private String username;
    private String email;
    private Integer age;
    private Date birthday;
    
    // getter 和 setter
}

@Controller
public class BindController {
    
    // 表单对象绑定
    @PostMapping("/users")
    public String createUser(User user) {
        // 自动将表单参数绑定到 User 对象
        // username=xxx&email=xxx&age=20
        System.out.println(user.getUsername());
        return "redirect:/users";
    }
    
    // 嵌套对象绑定
    @PostMapping("/orders")
    public String createOrder(Order order) {
        // Order 中包含 User 属性
        // user.username=xxx&user.email=xxx
        return "redirect:/orders";
    }
    
    // List 对象绑定
    @PostMapping("/users/batch")
    public String batchCreate(@ModelAttribute("users") List<User> users) {
        // users[0].username=xxx&users[1].username=yyy
        for (User user : users) {
            System.out.println(user.getUsername());
        }
        return "redirect:/users";
    }
}

// Order.java
public class Order {
    private Long id;
    private User user; // 嵌套对象
    private List<OrderItem> items; // 嵌套 List
    
    // getter 和 setter
}
```

### 7.1.3 自定义转换器

```java
// 自定义转换器：String -> User
@Component
public class StringToUserConverter implements Converter<String, User> {
    
    @Override
    public User convert(String source) {
        // 格式: id:username:email
        String[] parts = source.split(":");
        User user = new User();
        user.setId(Long.parseLong(parts[0]));
        user.setUsername(parts[1]);
        user.setEmail(parts[2]);
        return user;
    }
}

// 配置转换器
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToUserConverter());
    }
}

// 使用
@GetMapping("/user")
public String getUser(@RequestParam User user) {
    // /user?user=1:张三:zhangsan@example.com
    System.out.println(user.getUsername());
    return "user/detail";
}
```

---

## 2 数据校验

### 7.2.1 使用 JSR-303 验证

```java
// User.java
import javax.validation.constraints.*;

public class User {
    
    @NotNull(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度 3-20")
    private String username;
    
    @NotNull(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 18, message = "年龄不能小于 18")
    @Max(value = 100, message = "年龄不能大于 100")
    private Integer age;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    // getter 和 setter
}

// Controller
@Controller
public class ValidationController {
    
    @PostMapping("/users")
    public String createUser(@Valid User user, BindingResult result) {
        // @Valid 触发验证
        if (result.hasErrors()) {
            // 获取错误信息
            for (FieldError error : result.getFieldErrors()) {
                System.out.println(error.getField() + ": " + error.getDefaultMessage());
            }
            return "user/form"; // 返回表单页面
        }
        
        // 验证通过，保存用户
        userService.save(user);
        return "redirect:/users";
    }
}
```

### 7.2.2 常用验证注解

| 注解 | 说明 | 示例 |
| --- | --- | --- |
| @NotNull | 不能为 null | @NotNull(message = "不能为空") |
| @NotEmpty | 不能为空（字符串、集合） | @NotEmpty |
| @NotBlank | 不能为空且去除空格后长度大于 0 | @NotBlank |
| @Size | 长度范围 | @Size(min = 3, max = 20) |
| @Min | 最小值 | @Min(18) |
| @Max | 最大值 | @Max(100) |
| @Email | 邮箱格式 | @Email |
| @Pattern | 正则表达式 | @Pattern(regexp = "^\\d+$") |
| @Past | 过去的时间 | @Past |
| @Future | 未来的时间 | @Future |

### 7.2.3 自定义验证注解

```java
// 自定义注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneValidator.class)
public @interface Phone {
    String message() default "手机号格式不正确";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 验证器
public class PhoneValidator implements ConstraintValidator<Phone, String> {
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // null 由 @NotNull 处理
        }
        return value.matches("^1[3-9]\\d{9}$");
    }
}

// 使用
public class User {
    
    @Phone
    private String phone;
}
```

### 7.2.4 分组验证

```java
// 定义分组
public interface CreateGroup {}
public interface UpdateGroup {}

// User.java
public class User {
    
    @Null(groups = CreateGroup.class) // 创建时 ID 必须为空
    @NotNull(groups = UpdateGroup.class) // 更新时 ID 不能为空
    private Long id;
    
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class})
    private String username;
}

// Controller
@PostMapping("/users")
public String createUser(@Validated(CreateGroup.class) User user, BindingResult result) {
    // 只验证 CreateGroup 分组的注解
    return "redirect:/users";
}

@PutMapping("/users/{id}")
public String updateUser(@Validated(UpdateGroup.class) User user, BindingResult result) {
    // 只验证 UpdateGroup 分组的注解
    return "redirect:/users";
}
```

---

## 3 文件上传

### 7.3.1 单文件上传

```java
@Controller
public class UploadController {
    
    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file) throws IOException {
        // 检查文件是否为空
        if (file.isEmpty()) {
            return "error";
        }
        
        // 获取文件信息
        String filename = file.getOriginalFilename();
        long size = file.getSize();
        String contentType = file.getContentType();
        
        // 保存文件
        File dest = new File("/uploads/" + filename);
        file.transferTo(dest);
        
        return "redirect:/success";
    }
}
```

### 7.3.2 多文件上传

```java
@PostMapping("/upload/batch")
public String batchUpload(@RequestParam("files") MultipartFile[] files) throws IOException {
    for (MultipartFile file : files) {
        if (!file.isEmpty()) {
            String filename = file.getOriginalFilename();
            File dest = new File("/uploads/" + filename);
            file.transferTo(dest);
        }
    }
    return "redirect:/success";
}

// 使用 List
@PostMapping("/upload/batch2")
public String batchUpload2(@RequestParam("files") List<MultipartFile> files) throws IOException {
    for (MultipartFile file : files) {
        if (!file.isEmpty()) {
            file.transferTo(new File("/uploads/" + file.getOriginalFilename()));
        }
    }
    return "redirect:/success";
}
```

### 7.3.3 文件上传配置

```java
@Configuration
public class UploadConfig {
    
    @Bean
    public MultipartResolver multipartResolver() {
        CommonsMultipartResolver resolver = new CommonsMultipartResolver();
        resolver.setDefaultEncoding("UTF-8");
        resolver.setMaxUploadSize(10 * 1024 * 1024); // 最大 10MB
        resolver.setMaxUploadSizePerFile(5 * 1024 * 1024); // 单文件最大 5MB
        resolver.setMaxInMemorySize(4096); // 内存阈值
        return resolver;
    }
}

// Spring Boot 配置
// application.yml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 100MB
```

### 7.3.4 文件下载

```java
@GetMapping("/download/{filename}")
public ResponseEntity<Resource> download(@PathVariable String filename) throws IOException {
    File file = new File("/uploads/" + filename);
    
    if (!file.exists()) {
        return ResponseEntity.notFound().build();
    }
    
    Resource resource = new FileSystemResource(file);
    
    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(resource);
}
```

---

## 4 国际化

### 7.4.1 配置国际化

```java
@Configuration
public class I18nConfig implements WebMvcConfigurer {
    
    @Bean
    public LocaleResolver localeResolver() {
        SessionLocaleResolver resolver = new SessionLocaleResolver();
        resolver.setDefaultLocale(Locale.CHINA);
        return resolver;
    }
    
    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang"); // ?lang=en_US
        return interceptor;
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
    }
    
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasenames("i18n/messages"); // 资源文件路径
        source.setDefaultEncoding("UTF-8");
        return source;
    }
}
```

### 7.4.2 资源文件

```properties
# i18n/messages.properties (默认)
welcome=欢迎
user.login=用户登录
user.username=用户名
user.password=密码

# i18n/messages_en_US.properties (英文)
welcome=Welcome
user.login=User Login
user.username=Username
user.password=Password

# i18n/messages_zh_CN.properties (中文)
welcome=欢迎
user.login=用户登录
user.username=用户名
user.password=密码
```

### 7.4.3 使用国际化

```java
@Controller
public class I18nController {
    
    @Autowired
    private MessageSource messageSource;
    
    @GetMapping("/welcome")
    public String welcome(Locale locale, Model model) {
        // 获取国际化消息
        String message = messageSource.getMessage("welcome", null, locale);
        model.addAttribute("message", message);
        return "welcome";
    }
    
    @GetMapping("/login")
    public String login() {
        return "login";
    }
}

// 在 JSP 中使用
// <%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
// <spring:message code="welcome" />
// <spring:message code="user.login" />
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @DateTimeFormat | 日期格式转换 |
| Converter | 自定义类型转换器 |
| @Valid | 触发验证 |
| BindingResult | 验证结果 |
| @NotNull/@Email/@Size | 验证注解 |
| MultipartFile | 文件上传 |
| LocaleResolver | 国际化解析器 |
| MessageSource | 消息源 |

---

## 6 新手常见误区

### 误区 1："@Valid 和 @Validated 是一样的"

**不完全一样！** 
- @Valid：JSR-303 标准，不支持分组
- @Validated：Spring 提供，支持分组

**选择建议**：需要分组验证时使用 @Validated。

### 误区 2："文件上传不需要配置"

**错！** 需要配置 MultipartResolver：
- Spring MVC：配置 CommonsMultipartResolver
- Spring Boot：配置 application.yml

### 误区 3："国际化只能用于页面"

**错！** 国际化可以用于：
- 页面文本
- 验证消息
- 异常消息
- 邮件内容

---

## 7 动手练习

### 练习 1：基础练习 - 参数绑定

创建一个控制器，实现以下功能：
1. 接收日期参数（yyyy-MM-dd 格式）
2. 接收 List 参数
3. 接收嵌套对象参数

<details>
<summary>点击查看答案</summary>

```java
@Controller
public class BindController {
    
    @GetMapping("/search")
    public String search(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        System.out.println("开始: " + startDate);
        System.out.println("结束: " + endDate);
        return "search/result";
    }
    
    @GetMapping("/batch")
    public String batch(@RequestParam List<Long> ids) {
        for (Long id : ids) {
            System.out.println("ID: " + id);
        }
        return "redirect:/success";
    }
    
    @PostMapping("/orders")
    public String createOrder(Order order) {
        // Order 包含 User 属性
        System.out.println("用户: " + order.getUser().getUsername());
        return "redirect:/orders";
    }
}
```

</details>

### 练习 2：进阶练习 - 数据校验

创建一个用户注册功能，实现以下验证：
1. 用户名 3-20 位
2. 邮箱格式正确
3. 年龄 18-100
4. 手机号格式正确

<details>
<summary>点击查看答案</summary>

```java
// User.java
public class User {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度 3-20")
    private String username;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 18, message = "年龄不能小于 18")
    @Max(value = 100, message = "年龄不能大于 100")
    private Integer age;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    // getter 和 setter
}

// Controller
@Controller
public class RegisterController {
    
    @GetMapping("/register")
    public String showForm() {
        return "register/form";
    }
    
    @PostMapping("/register")
    public String register(@Valid User user, BindingResult result) {
        if (result.hasErrors()) {
            return "register/form";
        }
        // 保存用户
        return "redirect:/login";
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 文件上传

创建一个图片上传功能：
1. 只允许上传图片（jpg、png、gif）
2. 限制大小 5MB
3. 重命名文件（UUID）
4. 显示上传成功的图片

<details>
<summary>点击查看答案</summary>

```java
@Controller
public class ImageUploadController {
    
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif"
    );
    
    @PostMapping("/upload/image")
    public String uploadImage(@RequestParam("image") MultipartFile file, 
                             Model model) throws IOException {
        // 检查文件
        if (file.isEmpty()) {
            model.addAttribute("error", "请选择文件");
            return "upload/form";
        }
        
        // 检查类型
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            model.addAttribute("error", "只能上传图片文件");
            return "upload/form";
        }
        
        // 检查大小
        if (file.getSize() > 5 * 1024 * 1024) {
            model.addAttribute("error", "文件大小不能超过 5MB");
            return "upload/form";
        }
        
        // 重命名
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String newFilename = UUID.randomUUID().toString() + extension;
        
        // 保存
        File dest = new File("/uploads/images/" + newFilename);
        file.transferTo(dest);
        
        model.addAttribute("imageUrl", "/uploads/images/" + newFilename);
        return "upload/success";
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 数据访问**——也就是如何使用 Spring 操作数据库。你会学到：

- JdbcTemplate 的使用
- 数据源配置
- Spring Data JDBC
- CRUD 操作

准备好了吗？让我们继续深入 Spring 的世界！
