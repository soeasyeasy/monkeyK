---
title: "第11章：Spring RESTful API 设计"
description: "设计规范的 RESTful 接口，掌握 HTTP 语义和状态码"
---

# 第11章：Spring RESTful API 设计

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 RESTful？它和普通 API 有什么区别？
- HTTP 方法（GET、POST、PUT、DELETE）各有什么语义？
- 如何正确使用 HTTP 状态码？
- 如何设计清晰的 API 路径？
- 如何生成 API 文档？

这一章就是为了解答这些问题。我们会从 RESTful 架构风格开始，学习 HTTP 语义和状态码规范，掌握 Spring 中 RESTful API 的设计方法。

---

## 11.1 为什么需要 RESTful？

### 痛点分析

没有 RESTful 规范时，API 设计五花八门：

```
// 路径不规范
GET /getUser?id=1
POST /deleteUser?id=1
POST /updateUser
GET /listUsers?page=1&size=10

// 动词在路径中
GET /getUsers
POST /createUser
POST /deleteUser

// 状态码混乱
// 所有请求都返回 200，用 code 字段区分
{ "code": 200, "message": "success", "data": {...} }
{ "code": 404, "message": "用户不存在", "data": null }
```

**问题**：
- 路径不统一，难以理解
- 无法利用 HTTP 缓存
- 客户端需要解析自定义格式

### 解决方案

RESTful 提供统一的设计规范：

```
// 资源导向
GET    /users          # 获取用户列表
GET    /users/1        # 获取 ID 为 1 的用户
POST   /users          # 创建用户
PUT    /users/1        # 更新 ID 为 1 的用户
DELETE /users/1        # 删除 ID 为 1 的用户

// 正确使用状态码
// 成功：200 OK
// 创建成功：201 Created
// 删除成功：204 No Content
// 资源不存在：404 Not Found
```

> **一句话总结**：RESTful 让 API 设计变得统一、可预测，充分利用 HTTP 协议的能力。

---

## 11.2 核心原理

### 11.2.1 REST 六大原则

| 原则 | 说明 |
| --- | --- |
| 统一接口 | 使用 HTTP 方法操作资源 |
| 客户端-服务器 | 前后端分离 |
| 无状态 | 每次请求包含所有必要信息 |
| 可缓存 | 响应可标记为可缓存或不可缓存 |
| 分层系统 | 中间层对客户端透明 |
| 按需代码 | 服务器可发送可执行代码 |

打个比方：

> RESTful 就像邮局的运作：
> - 资源 = 邮件（名词，不是动词）
> - HTTP 方法 = 操作（寄、收、改、退）
> - 状态码 = 回执（成功、失败、需要补充信息）

### 11.2.2 HTTP 方法语义

| 方法 | 语义 | 幂等 | 安全 |
| --- | --- | --- | --- |
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 | 否 | 否 |
| PUT | 更新资源（全量） | 是 | 否 |
| PATCH | 更新资源（部分） | 否 | 否 |
| DELETE | 删除资源 | 是 | 否 |

> **幂等**：多次执行结果相同
> **安全**：不会修改服务器状态

### 11.2.3 HTTP 状态码

| 状态码 | 含义 | 使用场景 |
| --- | --- | --- |
| 200 OK | 成功 | GET、PUT、PATCH |
| 201 Created | 创建成功 | POST |
| 204 No Content | 无内容 | DELETE |
| 400 Bad Request | 请求错误 | 参数错误 |
| 401 Unauthorized | 未认证 | 未登录 |
| 403 Forbidden | 无权限 | 权限不足 |
| 404 Not Found | 资源不存在 | 资源不存在 |
| 500 Internal Server Error | 服务器错误 | 系统异常 |

---

## 11.3 基础用法

### 11.3.1 RESTful 控制器

```java
package com.example.controller;

import com.example.model.User;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    // 获取用户列表
    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }
    
    // 获取单个用户
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    // 创建用户
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User saved = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    // 更新用户（全量）
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        if (!userService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        user.setId(id);
        User updated = userService.update(user);
        return ResponseEntity.ok(updated);
    }
    
    // 部分更新
    @PatchMapping("/{id}")
    public ResponseEntity<User> patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        User updated = userService.patch(id, updates);
        return ResponseEntity.ok(updated);
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 11.3.2 统一响应格式

```java
// ApiResponse.java
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }
    
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
    
    // 构造函数、getter、setter
}

// 使用
@RestController
public class UserController {
    
    @GetMapping("/{id}")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        return ApiResponse.success(user);
    }
}
```

### 11.3.3 分页查询

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<User> users = userService.findAll(pageable);
        
        return ResponseEntity.ok(users);
    }
}
```

---

## 11.4 进阶用法

### 11.4.1 资源关联

```java
// 用户-订单关联
@RestController
@RequestMapping("/api/users/{userId}/orders")
public class UserOrderController {
    
    @GetMapping
    public List<Order> getUserOrders(@PathVariable Long userId) {
        return orderService.findByUserId(userId);
    }
    
    @PostMapping
    public ResponseEntity<Order> createOrder(@PathVariable Long userId, @RequestBody Order order) {
        order.setUserId(userId);
        Order saved = orderService.save(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
```

### 11.4.2 HATEOAS

```java
@RestController
public class UserController {
    
    @GetMapping("/{id}")
    public EntityModel<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        
        // 添加链接
        return EntityModel.of(user,
                linkTo(methodOn(UserController.class).getUser(id)).withSelfRel(),
                linkTo(methodOn(UserController.class).getAllUsers()).withRel("users")
        );
    }
}
```

### 11.4.3 API 版本控制

```java
// 方式一：URL 版本
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {
    // V1 接口
}

@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {
    // V2 接口
}

// 方式二：请求头版本
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping(headers = "API-Version=1")
    public List<User> getUsersV1() {
        // V1 逻辑
    }
    
    @GetMapping(headers = "API-Version=2")
    public List<User> getUsersV2() {
        // V2 逻辑
    }
}
```

---

## 11.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @RestController | REST 控制器 |
| @RequestMapping | 路径映射 |
| @GetMapping/@PostMapping | HTTP 方法映射 |
| ResponseEntity | 响应实体 |
| HttpStatus | HTTP 状态码 |
| @PathVariable | 路径变量 |
| @RequestBody | 请求体 |
| Pageable | 分页参数 |

---

## 11.6 新手常见误区

### 误区 1："RESTful 就是返回 JSON"

**错！** RESTful 是一种架构风格，不只是返回格式。核心是资源导向、HTTP 方法语义、状态码规范。

### 误区 2："POST 可以用于查询"

**错！** POST 用于创建资源，GET 用于查询。POST 请求不会被缓存。

### 误区 3："所有请求都返回 200"

**错！** 应该根据操作结果返回正确的状态码：
- 创建成功：201
- 删除成功：204
- 资源不存在：404

### 误区 4："PUT 和 PATCH 是一样的"

**不一样！**
- PUT：全量更新，替换整个资源
- PATCH：部分更新，只修改指定字段

### 误区 5："路径中应该用动词"

**错！** RESTful 路径应该用名词（资源），操作用 HTTP 方法表示。

```
// 错误
GET /getUsers
POST /createUser

// 正确
GET /users
POST /users
```

---

## 11.7 动手练习

### 练习 1：基础练习 - RESTful 控制器

创建一个用户管理的 RESTful API。

<details>
<summary>点击查看答案</summary>

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<User> getAll() {
        return userService.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        User user = userService.findById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }
    
    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.save(user));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User user) {
        if (!userService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        user.setId(id);
        return ResponseEntity.ok(userService.update(user));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!userService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```

</details>

### 练习 2：进阶练习 - 分页查询

实现分页查询用户列表。

<details>
<summary>点击查看答案</summary>

```java
@GetMapping
public Page<User> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "id") String sortBy) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
    return userService.findAll(pageable);
}
```

</details>

### 练习 3（挑战）：综合练习 - 资源关联

实现用户-订单关联 API。

<details>
<summary>点击查看答案</summary>

```java
@RestController
@RequestMapping("/api/users/{userId}/orders")
public class UserOrderController {
    
    @Autowired
    private OrderService orderService;
    
    @GetMapping
    public List<Order> getUserOrders(@PathVariable Long userId) {
        return orderService.findByUserId(userId);
    }
    
    @PostMapping
    public ResponseEntity<Order> createOrder(@PathVariable Long userId, @RequestBody Order order) {
        order.setUserId(userId);
        Order saved = orderService.save(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable Long userId, @PathVariable Long orderId) {
        Order order = orderService.findById(orderId);
        if (order == null || !order.getUserId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }
    
    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long userId, @PathVariable Long orderId) {
        Order order = orderService.findById(orderId);
        if (order == null || !order.getUserId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        orderService.deleteById(orderId);
        return ResponseEntity.noContent().build();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 统一异常处理**——也就是如何优雅地处理 API 异常。你会学到：

- @ExceptionHandler 的使用
- @ControllerAdvice 全局异常处理
- 自定义异常类
- 统一错误响应格式

准备好了吗？让我们继续深入 Spring 的世界！
