---
title: "第6章：Spring MVC 基础"
description: "使用 Spring MVC 构建 Web 应用，掌握控制器和请求处理"
---

# 第6章：Spring MVC 基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring MVC 是什么？它和 Spring 有什么关系？
- 请求是如何从浏览器到达控制器的？
- 如何编写一个控制器来处理 HTTP 请求？
- 如何将数据返回给前端？

这一章就是为了解答这些问题。我们会从 Spring MVC 的核心架构开始，理解请求处理的完整流程，然后动手编写控制器处理各种 HTTP 请求。

---

## 6.1 为什么需要 Spring MVC？

### 痛点分析

在 Spring MVC 出现之前，开发 Java Web 应用需要：

1. **直接使用 Servlet**：每个请求都要写一个 Servlet 类
2. **手动解析请求**：从 request 中手动获取参数、处理编码
3. **手动转发视图**：使用 RequestDispatcher 转发页面
4. **代码重复**：大量重复的请求处理代码

用代码来说，传统 Servlet 开发：

```java
// 传统 Servlet 开发
public class UserServlet extends HttpServlet {
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        // 手动设置编码
        req.setCharacterEncoding("UTF-8");
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("text/html");
        
        // 手动获取参数
        String id = req.getParameter("id");
        
        // 业务逻辑
        User user = userService.findById(Long.parseLong(id));
        
        // 手动转发视图
        req.setAttribute("user", user);
        req.getRequestDispatcher("/WEB-INF/views/user.jsp").forward(req, resp);
    }
}
```

### 解决方案

Spring MVC 提供了更优雅的方式：

```java
// Spring MVC 开发
@Controller
@RequestMapping("/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id, Model model) {
        User user = userService.findById(id);
        model.addAttribute("user", user);
        return "user"; // 视图名称
    }
}
```

> **一句话总结**：Spring MVC 简化了 Web 开发，让你专注于业务逻辑，而不是请求处理细节。

---

## 6.2 核心原理

### 6.2.1 Spring MVC 架构

Spring MVC 基于 MVC（Model-View-Controller）设计模式：

| 组件 | 职责 | 对应技术 |
| --- | --- | --- |
| Model（模型） | 数据和业务逻辑 | Service、Entity |
| View（视图） | 展示数据 | JSP、Thymeleaf、JSON |
| Controller（控制器） | 接收请求，调用模型，返回视图 | @Controller |

打个比方：

> Spring MVC 就像餐厅的运作：
> - 顾客（浏览器）点菜（发送请求）
> - 服务员（DispatcherServlet）接收订单
> - 厨师（Controller）根据订单做菜（处理业务逻辑）
> - 菜品（Model）做好后端给顾客（View 展示）

### 6.2.2 请求处理流程

```
1. 浏览器发送请求
   ↓
2. DispatcherServlet 接收请求
   ↓
3. HandlerMapping 找到对应的 Controller
   ↓
4. Controller 处理请求，返回 ModelAndView
   ↓
5. ViewResolver 解析视图
   ↓
6. 渲染视图，返回响应
```

**核心组件**：

| 组件 | 作用 |
| --- | --- |
| DispatcherServlet | 前端控制器，请求入口 |
| HandlerMapping | 处理器映射，找到对应的 Controller |
| Controller | 处理器，处理业务逻辑 |
| ModelAndView | 模型和视图的封装 |
| ViewResolver | 视图解析器，解析视图名称 |

### 6.2.3 DispatcherServlet 配置

```java
package com.example.config;

import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

// 替代 web.xml 配置
public class WebAppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {
    
    // Spring 配置类
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class<?>[] { AppConfig.class };
    }
    
    // Spring MVC 配置类
    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class<?>[] { WebConfig.class };
    }
    
    // DispatcherServlet 映射路径
    @Override
    protected String[] getServletMappings() {
        return new String[] { "/" };
    }
}
```

---

## 6.3 基础用法

### 6.3.1 创建控制器

```java
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

// 标记为控制器
@Controller
@RequestMapping("/users") // 类级别的请求映射
public class UserController {
    
    // 处理 GET /users
    @RequestMapping(method = RequestMethod.GET)
    public String listUsers() {
        return "user/list"; // 视图名称
    }
    
    // 处理 GET /users/{id}
    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public String getUser() {
        return "user/detail";
    }
}
```

### 6.3.2 请求映射注解

```java
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/users")
public class UserController {
    
    // GET 请求
    @GetMapping
    public String listUsers() {
        return "user/list";
    }
    
    // GET 请求带路径参数
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "user/detail";
    }
    
    // POST 请求
    @PostMapping
    public String createUser() {
        return "redirect:/users";
    }
    
    // PUT 请求
    @PutMapping("/{id}")
    public String updateUser(@PathVariable Long id) {
        return "redirect:/users/" + id;
    }
    
    // DELETE 请求
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        return "redirect:/users";
    }
}
```

### 6.3.3 接收请求参数

**方式一：@RequestParam**

```java
@GetMapping("/search")
public String search(
        @RequestParam String keyword,           // 必填参数
        @RequestParam(required = false) String category, // 可选参数
        @RequestParam(defaultValue = "1") int page,      // 默认值
        Model model) {
    
    System.out.println("关键词: " + keyword);
    System.out.println("分类: " + category);
    System.out.println("页码: " + page);
    
    return "search/result";
}
```

**方式二：@PathVariable**

```java
@GetMapping("/users/{id}")
public String getUser(@PathVariable Long id, Model model) {
    User user = userService.findById(id);
    model.addAttribute("user", user);
    return "user/detail";
}

// 多个路径变量
@GetMapping("/users/{userId}/orders/{orderId}")
public String getOrder(
        @PathVariable Long userId,
        @PathVariable Long orderId) {
    // ...
}
```

**方式三：@RequestBody**

```java
@PostMapping("/users")
public String createUser(@RequestBody User user) {
    // 从请求体中读取 JSON 数据
    userService.save(user);
    return "redirect:/users";
}
```

**方式四：表单对象绑定**

```java
// 表单
// <form action="/users" method="post">
//     <input name="username" />
//     <input name="email" />
// </form>

@PostMapping("/users")
public String createUser(User user) {
    // Spring 自动将表单参数绑定到 User 对象
    userService.save(user);
    return "redirect:/users";
}
```

### 6.3.4 返回数据

**方式一：返回视图名称**

```java
@GetMapping("/users")
public String listUsers(Model model) {
    List<User> users = userService.findAll();
    model.addAttribute("users", users);
    return "user/list"; // 视图名称，对应 /WEB-INF/views/user/list.jsp
}
```

**方式二：返回 JSON（RESTful）**

```java
@RestController // 注意：使用 @RestController
@RequestMapping("/api/users")
public class UserApiController {
    
    @GetMapping
    public List<User> listUsers() {
        // 直接返回对象，自动转换为 JSON
        return userService.findAll();
    }
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

**方式三：返回 ResponseEntity**

```java
@GetMapping("/users/{id}")
public ResponseEntity<User> getUser(@PathVariable Long id) {
    User user = userService.findById(id);
    if (user == null) {
        return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(user);
}

@PostMapping("/users")
public ResponseEntity<User> createUser(@RequestBody User user) {
    User saved = userService.save(user);
    // 返回 201 状态码和创建的资源
    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(saved);
}
```

### 6.3.5 重定向和转发

```java
@PostMapping("/users")
public String createUser(User user) {
    userService.save(user);
    
    // 重定向（浏览器地址栏改变）
    return "redirect:/users";
    
    // 转发（服务器内部跳转，地址栏不变）
    // return "forward:/users";
}

// 重定向带参数
@PostMapping("/users")
public String createUser(User user, RedirectAttributes attributes) {
    userService.save(user);
    
    // 添加 flash 属性（一次性使用）
    attributes.addFlashAttribute("message", "创建成功");
    
    return "redirect:/users";
}
```

---

## 6.4 进阶用法

### 6.4.1 模型数据

```java
@Controller
public class ModelController {
    
    // Model：模型数据
    @GetMapping("/users")
    public String listUsers(Model model) {
        model.addAttribute("users", userService.findAll());
        model.addAttribute("count", userService.count());
        return "user/list";
    }
    
    // Map：也可以使用 Map
    @GetMapping("/users2")
    public String listUsers2(Map<String, Object> map) {
        map.put("users", userService.findAll());
        return "user/list";
    }
    
    // ModelAndView：同时设置视图和数据
    @GetMapping("/users3")
    public ModelAndView listUsers3() {
        ModelAndView mav = new ModelAndView();
        mav.addObject("users", userService.findAll());
        mav.setViewName("user/list");
        return mav;
    }
}
```

### 6.4.2 Session 数据

```java
@Controller
@SessionAttributes("currentUser") // 将 currentUser 存入 Session
public class SessionController {
    
    @PostMapping("/login")
    public String login(String username, Model model) {
        User user = userService.authenticate(username);
        // 存入 Session
        model.addAttribute("currentUser", user);
        return "redirect:/home";
    }
    
    @GetMapping("/home")
    public String home(@SessionAttribute("currentUser") User user) {
        // 从 Session 获取
        System.out.println("当前用户: " + user.getUsername());
        return "home";
    }
    
    @PostMapping("/logout")
    public String logout(SessionStatus status) {
        // 清除 Session 属性
        status.setComplete();
        return "redirect:/login";
    }
}
```

### 6.4.3 全局模型属性

```java
@Controller
@RequestMapping("/users")
public class UserController {
    
    // 所有请求都会执行的模型属性
    @ModelAttribute("roles")
    public List<String> getRoles() {
        return Arrays.asList("admin", "user", "guest");
    }
    
    @GetMapping
    public String listUsers() {
        // model 中自动包含 roles
        return "user/list";
    }
    
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        // model 中自动包含 roles
        return "user/detail";
    }
}
```

---

## 6.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @Controller | 标记控制器 |
| @RestController | 标记 REST 控制器（返回 JSON） |
| @RequestMapping | 请求映射 |
| @GetMapping | GET 请求映射 |
| @PostMapping | POST 请求映射 |
| @PutMapping | PUT 请求映射 |
| @DeleteMapping | DELETE 请求映射 |
| @RequestParam | 获取请求参数 |
| @PathVariable | 获取路径变量 |
| @RequestBody | 获取请求体 |
| @ResponseBody | 返回响应体 |
| Model | 模型数据 |
| @ModelAttribute | 模型属性 |
| @SessionAttributes | Session 属性 |

---

## 6.6 新手常见误区

### 误区 1："@Controller 和 @RestController 是一样的"

**错！** 它们有本质区别：
- @Controller：返回视图名称，需要视图解析器
- @RestController：返回数据（JSON/XML），不需要视图

**选择建议**：
- 传统 Web 应用（返回页面）：使用 @Controller
- RESTful API（返回 JSON）：使用 @RestController

### 误区 2："@RequestParam 可以接收 JSON"

**错！** @RequestParam 只能接收表单参数或 URL 参数，不能接收 JSON。

**正确做法**：接收 JSON 使用 @RequestBody

```java
// 错误：JSON 无法接收
@PostMapping("/users")
public String createUser(@RequestParam String username) { ... }

// 正确：使用 @RequestBody
@PostMapping("/users")
public String createUser(@RequestBody User user) { ... }
```

### 误区 3："@PathVariable 和 @RequestParam 可以混用"

**可以！** 它们可以同时使用：

```java
@GetMapping("/users/{id}")
public String getUser(
        @PathVariable Long id,           // 路径变量
        @RequestParam String format) {   // 查询参数
    // /users/1?format=json
}
```

### 误区 4："Model 和 Map 是完全相同的"

**基本相同！** Model 是 Spring 提供的接口，Map 是 Java 标准接口。Spring 内部会将 Map 转换为 Model。

**选择建议**：推荐使用 Model，语义更明确。

### 误区 5："重定向和转发是一样的"

**不一样！** 
- 重定向（redirect）：浏览器地址栏改变，是新的请求
- 转发（forward）：服务器内部跳转，地址栏不变

**选择建议**：
- POST 后防止重复提交：使用重定向
- 服务器内部跳转：使用转发

---

## 6.7 动手练习

### 练习 1：基础练习 - 简单控制器

创建一个控制器，实现以下功能：
1. GET `/` 返回欢迎页面
2. GET `/hello?name=xxx` 返回问候语
3. GET `/users/{id}` 返回用户信息

<details>
<summary>点击查看答案</summary>

```java
// HomeController.java
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String home() {
        return "welcome"; // 返回 welcome.jsp 或 welcome.html
    }
    
    @GetMapping("/hello")
    public String hello(@RequestParam String name, Model model) {
        model.addAttribute("name", name);
        model.addAttribute("message", "Hello, " + name + "!");
        return "hello";
    }
    
    @GetMapping("/users/{id}")
    public String getUser(@PathVariable Long id, Model model) {
        // 模拟用户数据
        model.addAttribute("userId", id);
        model.addAttribute("username", "用户" + id);
        return "user/detail";
    }
}
```

</details>

### 练习 2：进阶练习 - 表单处理

创建一个用户注册功能：
1. GET `/register` 显示注册表单
2. POST `/register` 处理注册提交
3. 注册成功后重定向到登录页

<details>
<summary>点击查看答案</summary>

```java
// User.java
package com.example.model;

public class User {
    private String username;
    private String email;
    private String password;
    
    // getter 和 setter
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

// RegisterController.java
package com.example.controller;

import com.example.model.User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/register")
public class RegisterController {
    
    // 显示注册表单
    @GetMapping
    public String showForm() {
        return "register/form";
    }
    
    // 处理注册
    @PostMapping
    public String register(User user, RedirectAttributes attributes) {
        // 保存用户（实际项目中应该调用 Service）
        System.out.println("注册成功: " + user.getUsername());
        
        // 添加 flash 属性
        attributes.addFlashAttribute("message", "注册成功，请登录");
        
        // 重定向到登录页
        return "redirect:/login";
    }
}

// LoginController.java
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/login")
public class LoginController {
    
    @GetMapping
    public String showForm() {
        return "login/form";
    }
    
    @PostMapping
    public String login(String username, String password) {
        // 登录逻辑
        return "redirect:/home";
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - RESTful API

创建一个完整的用户管理 RESTful API：
1. GET `/api/users` - 获取所有用户
2. GET `/api/users/{id}` - 获取指定用户
3. POST `/api/users` - 创建用户
4. PUT `/api/users/{id}` - 更新用户
5. DELETE `/api/users/{id}` - 删除用户

<details>
<summary>点击查看答案</summary>

```java
// User.java
package com.example.model;

public class User {
    private Long id;
    private String username;
    private String email;
    
    public User() {}
    
    public User(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }
    
    // getter 和 setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

// UserApiController.java
package com.example.controller;

import com.example.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/users")
public class UserApiController {
    
    // 模拟数据库
    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);
    
    // 获取所有用户
    @GetMapping
    public List<User> getAllUsers() {
        return new ArrayList<>(users.values());
    }
    
    // 获取指定用户
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = users.get(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    // 创建用户
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        Long id = idCounter.getAndIncrement();
        user.setId(id);
        users.put(id, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    // 更新用户
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        if (!users.containsKey(id)) {
            return ResponseEntity.notFound().build();
        }
        user.setId(id);
        users.put(id, user);
        return ResponseEntity.ok(user);
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User removed = users.remove(id);
        if (removed == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring MVC 进阶**——也就是更高级的请求处理技术。你会学到：

- 参数绑定和验证
- 文件上传
- 国际化
- 异常处理

准备好了吗？让我们继续深入 Spring 的世界！
