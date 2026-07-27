---
title: "第12章：Spring 统一异常处理"
description: "使用 @ExceptionHandler 和 @ControllerAdvice 统一处理异常"
---

# 第12章：Spring 统一异常处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何处理 API 中的异常？
- 如何统一异常响应格式？
- @ExceptionHandler 和 @ControllerAdvice 有什么区别？
- 如何自定义业务异常？

这一章就是为了解答这些问题。我们会学习 Spring 的异常处理机制，掌握统一异常处理的方法，学会自定义业务异常。

---

## 1 为什么需要统一异常处理？

### 痛点分析

没有统一异常处理时，每个方法都要处理异常：

```java
@RestController
public class UserController {
    
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        try {
            User user = userService.findById(id);
            return ResponseEntity.ok(user);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null); // 或者返回错误信息
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
    
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        try {
            User saved = userService.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}
```

**问题**：
- 大量重复的异常处理代码
- 错误响应格式不统一
- 难以维护和扩展

### 解决方案

使用 @ControllerAdvice 统一处理异常：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(404, ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        ErrorResponse error = new ErrorResponse(500, "服务器内部错误");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

// 控制器只需抛出异常
@RestController
public class UserController {
    
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id); // 异常由全局处理器处理
    }
}
```

> **一句话总结**：统一异常处理让控制器专注于业务逻辑，异常处理集中管理。

---

## 2 核心原理

### 12.2.1 异常处理机制

Spring MVC 的异常处理基于 AOP：

```
1. 控制器方法抛出异常
   ↓
2. DispatcherServlet 捕获异常
   ↓
3. HandlerExceptionResolver 处理异常
   ↓
4. 找到对应的 @ExceptionHandler 方法
   ↓
5. 执行异常处理方法，返回响应
```

### 12.2.2 @ExceptionHandler vs @ControllerAdvice

| 特性 | @ExceptionHandler | @ControllerAdvice |
| --- | --- | --- |
| 作用范围 | 单个控制器 | 全局 |
| 位置 | 控制器内部 | 独立类 |
| 优先级 | 高 | 低 |
| 使用场景 | 特定控制器异常 | 全局统一异常 |

---

## 3 基础用法

### 12.3.1 自定义异常类

```java
package com.example.exception;

public class BusinessException extends RuntimeException {
    
    private final int code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }
    
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
    
    public int getCode() {
        return code;
    }
}

// 具体业务异常
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(Long id) {
        super(404, "用户不存在: " + id);
    }
}

public class ValidationException extends BusinessException {
    public ValidationException(String message) {
        super(400, message);
    }
}
```

### 12.3.2 统一错误响应

```java
package com.example.exception;

public class ErrorResponse {
    private int code;
    private String message;
    private long timestamp;
    
    public ErrorResponse(int code, String message) {
        this.code = code;
        this.message = message;
        this.timestamp = System.currentTimeMillis();
    }
    
    // getter 和 setter
    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
```

### 12.3.3 全局异常处理器

```java
package com.example.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理用户不存在异常
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(ex.getCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    // 处理验证异常
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        ErrorResponse error = new ErrorResponse(ex.getCode(), ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
    
    // 处理所有业务异常
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        ErrorResponse error = new ErrorResponse(ex.getCode(), ex.getMessage());
        return ResponseEntity.status(ex.getCode()).body(error);
    }
    
    // 处理所有未捕获的异常
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        ErrorResponse error = new ErrorResponse(500, "服务器内部错误");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### 12.3.4 控制器中使用

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // 直接抛出异常，由全局处理器处理
        return userService.findById(id);
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        // 验证失败抛出异常
        if (user.getUsername() == null || user.getUsername().isEmpty()) {
            throw new ValidationException("用户名不能为空");
        }
        return userService.save(user);
    }
}

// Service
@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    public User findById(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new UserNotFoundException(id);
        }
        return user;
    }
}
```

---

## 4 进阶用法

### 12.4.1 处理验证异常

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理 @Valid 验证异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        StringBuilder message = new StringBuilder();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            message.append(error.getField())
                   .append(": ")
                   .append(error.getDefaultMessage())
                   .append("; ");
        }
        ErrorResponse error = new ErrorResponse(400, message.toString());
        return ResponseEntity.badRequest().body(error);
    }
    
    // 处理参数绑定异常
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBind(BindException ex) {
        ErrorResponse error = new ErrorResponse(400, "参数绑定错误");
        return ResponseEntity.badRequest().body(error);
    }
}
```

### 12.4.2 处理 404 异常

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理 404
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoHandlerFoundException ex) {
        ErrorResponse error = new ErrorResponse(404, "接口不存在: " + ex.getRequestURL());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}

// 配置
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 启用 404 异常
    }
}

// application.yml
spring:
  mvc:
    throw-exception-if-no-handler-found: true
  web:
    resources:
      add-mappings: false
```

### 12.4.3 日志记录

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        // 记录日志
        log.error("系统异常", ex);
        
        ErrorResponse error = new ErrorResponse(500, "服务器内部错误");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        // 业务异常只记录警告
        log.warn("业务异常: {}", ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(ex.getCode(), ex.getMessage());
        return ResponseEntity.status(ex.getCode()).body(error);
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @ExceptionHandler | 异常处理方法 |
| @RestControllerAdvice | 全局异常处理器 |
| BusinessException | 自定义业务异常 |
| ErrorResponse | 统一错误响应 |
| MethodArgumentNotValidException | 验证异常 |
| NoHandlerFoundException | 404 异常 |

---

## 6 新手常见误区

### 误区 1："@ExceptionHandler 可以处理所有异常"

**错！** @ExceptionHandler 只能处理当前控制器抛出的异常。要处理全局异常，需要使用 @RestControllerAdvice。

### 误区 2："异常处理器返回 void 就可以"

**错！** 异常处理器必须返回响应数据，否则客户端收不到错误信息。

### 误区 3："所有异常都应该返回 500"

**错！** 应该根据异常类型返回正确的状态码：
- 业务异常：返回对应的业务状态码
- 验证异常：返回 400
- 权限异常：返回 401/403
- 系统异常：返回 500

---

## 7 动手练习

### 练习 1：基础练习 - 全局异常处理

创建全局异常处理器，处理用户不存在和参数验证异常。

<details>
<summary>点击查看答案</summary>

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(400, message));
    }
}
```

</details>

### 练习 2：进阶练习 - 自定义异常

创建自定义业务异常类，支持错误码和错误信息。

<details>
<summary>点击查看答案</summary>

```java
public class BusinessException extends RuntimeException {
    private final int code;
    
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
    
    public int getCode() { return code; }
}

public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(Long id) {
        super(404, "用户不存在: " + id);
    }
}

public class DuplicateUserException extends BusinessException {
    public DuplicateUserException(String username) {
        super(409, "用户已存在: " + username);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 完整异常处理

实现完整的异常处理系统，包括自定义异常、全局处理器、日志记录。

<details>
<summary>点击查看答案</summary>

```java
// 错误响应
public class ErrorResponse {
    private int code;
    private String message;
    private long timestamp;
    private String path;
    
    public ErrorResponse(int code, String message, String path) {
        this.code = code;
        this.message = message;
        this.timestamp = System.currentTimeMillis();
        this.path = path;
    }
    // getter 和 setter
}

// 全局异常处理器
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest request) {
        log.warn("业务异常: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(ex.getCode(), ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(ex.getCode()).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        ErrorResponse error = new ErrorResponse(400, message, request.getRequestURI());
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        log.error("系统异常", ex);
        ErrorResponse error = new ErrorResponse(500, "服务器内部错误", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 拦截器与过滤器**——也就是如何拦截请求进行预处理和后处理。你会学到：

- Filter 过滤器的使用
- HandlerInterceptor 拦截器
- 拦截器链的执行顺序
- 实战：登录验证、日志记录

准备好了吗？让我们继续深入 Spring 的世界！
