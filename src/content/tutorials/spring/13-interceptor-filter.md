---
title: "第13章：Spring 拦截器与过滤器"
description: "使用 Filter 和 HandlerInterceptor 拦截请求进行预处理"
---

# 第13章：Spring 拦截器与过滤器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Filter 和 Interceptor 有什么区别？
- 如何拦截请求进行登录验证？
- 如何记录所有请求的日志？
- 如何跨域处理？

这一章就是为了解答这些问题。我们会学习 Spring 中的 Filter 和 Interceptor，理解它们的区别和使用场景，掌握常见的拦截器应用。

---

## 13.1 为什么需要拦截器？

### 痛点分析

很多功能需要在所有请求中统一处理：

1. **登录验证**：每个接口都要检查是否登录
2. **日志记录**：每个请求都要记录访问日志
3. **跨域处理**：每个响应都要添加 CORS 头
4. **权限检查**：每个接口都要检查用户权限

如果在每个控制器中处理，代码重复且难以维护。

### 解决方案

使用 Filter 或 Interceptor 统一拦截：

```java
// 登录拦截器
@Component
public class LoginInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 检查是否登录
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            response.setStatus(401);
            return false; // 拦截请求
        }
        return true; // 放行
    }
}
```

> **一句话总结**：拦截器让你在请求到达控制器之前进行统一处理。

---

## 13.2 核心原理

### 13.2.1 Filter vs Interceptor

| 特性 | Filter | Interceptor |
| --- | --- | --- |
| 规范 | Servlet 规范 | Spring MVC |
| 依赖 | Servlet 容器 | Spring 容器 |
| 执行时机 | 所有请求 | 控制器方法前后 |
| 能否使用 Spring Bean | 不能 | 能 |
| 粒度 | 粗（URL 匹配） | 细（方法级别） |
| 访问 Spring 对象 | 不能 | 能 |

打个比方：

> Filter 就像小区大门的保安：检查所有进出小区的人
> Interceptor 就像楼栋的管家：只服务本栋楼的住户，更了解住户情况

### 13.2.2 执行流程

```
请求 → Filter → DispatcherServlet → Interceptor.preHandle → Controller
                                                              ↓
响应 ← Filter ← DispatcherServlet ← Interceptor.postHandle ← 视图
                                      ↓
                              Interceptor.afterCompletion
```

---

## 13.3 基础用法

### 13.3.1 Filter 过滤器

```java
package com.example.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
@WebFilter("/*")
public class LogFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        
        long start = System.currentTimeMillis();
        String uri = req.getRequestURI();
        
        System.out.println("请求开始: " + uri);
        
        // 放行
        chain.doFilter(request, response);
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("请求结束: " + uri + ", 耗时: " + elapsed + "ms");
    }
}
```

### 13.3.2 注册 Filter

```java
@Configuration
public class FilterConfig {
    
    @Bean
    public FilterRegistrationBean<LogFilter> logFilter() {
        FilterRegistrationBean<LogFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new LogFilter());
        registration.addUrlPatterns("/api/*"); // 拦截路径
        registration.setOrder(1); // 执行顺序
        registration.setName("logFilter");
        return registration;
    }
}
```

### 13.3.3 HandlerInterceptor 拦截器

```java
package com.example.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Component
public class LoginInterceptor implements HandlerInterceptor {
    
    // 控制器方法执行前
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 检查是否登录
        Object user = request.getSession().getAttribute("user");
        if (user == null) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            try {
                response.getWriter().write("{\"code\":401,\"message\":\"未登录\"}");
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false; // 拦截
        }
        return true; // 放行
    }
    
    // 控制器方法执行后，视图渲染前
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, 
                          Object handler, ModelAndView modelAndView) {
        System.out.println("postHandle 执行");
    }
    
    // 请求完成后（视图渲染后）
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                               Object handler, Exception ex) {
        System.out.println("afterCompletion 执行");
    }
}
```

### 13.3.4 注册拦截器

```java
package com.example.config;

import com.example.interceptor.LoginInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private LoginInterceptor loginInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/api/**")      // 拦截路径
                .excludePathPatterns("/api/login") // 排除路径
                .excludePathPatterns("/api/register");
    }
}
```

---

## 13.4 进阶用法

### 13.4.1 CORS 跨域过滤器

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}

// 或使用 Filter
@Component
public class CorsFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse resp = (HttpServletResponse) response;
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        resp.setHeader("Access-Control-Allow-Headers", "*");
        chain.doFilter(request, response);
    }
}
```

### 13.4.2 请求日志拦截器

```java
@Component
public class RequestLogInterceptor implements HandlerInterceptor {
    
    private static final Logger log = LoggerFactory.getLogger(RequestLogInterceptor.class);
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        
        log.info("请求开始: {} {} from {}", 
                request.getMethod(), 
                request.getRequestURI(),
                request.getRemoteAddr());
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                               Object handler, Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");
        long elapsed = System.currentTimeMillis() - startTime;
        
        log.info("请求完成: {} {} 耗时: {}ms 状态: {}", 
                request.getMethod(),
                request.getRequestURI(),
                elapsed,
                response.getStatus());
    }
}
```

### 13.4.3 权限拦截器

```java
@Component
public class PermissionInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 获取当前用户
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            sendError(response, 401, "未登录");
            return false;
        }
        
        // 获取请求路径
        String uri = request.getRequestURI();
        
        // 检查权限
        if (!hasPermission(user, uri)) {
            sendError(response, 403, "没有权限");
            return false;
        }
        
        return true;
    }
    
    private boolean hasPermission(User user, String uri) {
        // 简单权限检查
        if (user.getRole().equals("admin")) {
            return true;
        }
        // 普通用户只能访问自己的资源
        return uri.contains("/users/" + user.getId());
    }
    
    private void sendError(HttpServletResponse response, int status, String message) {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        try {
            response.getWriter().write("{\"code\":" + status + ",\"message\":\"" + message + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 13.4.4 多个拦截器执行顺序

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LogInterceptor()).order(1);     // 先执行
        registry.addInterceptor(new AuthInterceptor()).order(2);    // 后执行
        registry.addInterceptor(new PermissionInterceptor()).order(3); // 最后执行
    }
}
```

> **执行顺序**：preHandle 按 order 顺序执行，postHandle 和 afterCompletion 按 order 逆序执行。

---

## 13.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Filter | Servlet 过滤器 |
| HandlerInterceptor | Spring MVC 拦截器 |
| preHandle | 请求前处理 |
| postHandle | 请求后处理 |
| afterCompletion | 完成后处理 |
| FilterRegistrationBean | 注册 Filter |
| InterceptorRegistry | 注册 Interceptor |
| addPathPatterns | 拦截路径 |
| excludePathPatterns | 排除路径 |

---

## 13.6 新手常见误区

### 误区 1："Filter 和 Interceptor 可以互相替代"

**不完全对！** 虽然功能相似，但：
- Filter 是 Servlet 规范，不能访问 Spring Bean
- Interceptor 是 Spring MVC，可以访问 Spring Bean

**选择建议**：
- 简单过滤（编码、跨域）：用 Filter
- 需要 Spring 功能（权限、日志）：用 Interceptor

### 误区 2："拦截器可以拦截所有请求"

**错！** 拦截器只能拦截 DispatcherServlet 处理的请求。静态资源、Filter 中的错误不会经过拦截器。

### 误区 3："preHandle 返回 false 后还会执行 postHandle"

**错！** preHandle 返回 false 后，postHandle 和 afterCompletion 都不会执行（但 afterCompletion 在 Spring 5+ 会执行）。

### 误区 4："拦截器中不能使用 @Autowired"

**错！** 如果拦截器被 Spring 管理（加 @Component），可以使用 @Autowired。如果直接 new 则不能。

### 误区 5："多个拦截器执行顺序是固定的"

**可以控制！** 使用 order() 方法指定执行顺序。

---

## 13.7 动手练习

### 练习 1：基础练习 - 请求日志

创建一个拦截器，记录所有请求的 URI、方法和耗时。

<details>
<summary>点击查看答案</summary>

```java
@Component
public class LogInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute("startTime", System.currentTimeMillis());
        System.out.println("请求: " + request.getMethod() + " " + request.getRequestURI());
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                               Object handler, Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");
        long elapsed = System.currentTimeMillis() - startTime;
        System.out.println("耗时: " + elapsed + "ms");
    }
}
```

</details>

### 练习 2：进阶练习 - 登录拦截

创建一个登录拦截器，检查 Session 中是否有用户信息。

<details>
<summary>点击查看答案</summary>

```java
@Component
public class LoginInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 检查 Session
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            try {
                response.getWriter().write("{\"code\":401,\"message\":\"未登录\"}");
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
        return true;
    }
}

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private LoginInterceptor loginInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/login", "/api/register");
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 多拦截器链

创建日志、认证、权限三个拦截器，按顺序执行。

<details>
<summary>点击查看答案</summary>

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 日志拦截器（最先执行）
        registry.addInterceptor(new LogInterceptor()).order(1);
        
        // 认证拦截器
        registry.addInterceptor(new AuthInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/login")
                .order(2);
        
        // 权限拦截器（最后执行）
        registry.addInterceptor(new PermissionInterceptor())
                .addPathPatterns("/api/admin/**")
                .order(3);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Security 基础**——也就是 Spring 的安全框架。你会学到：

- 认证与授权
- SecurityFilterChain 配置
- UserDetailsService
- 密码加密

准备好了吗？让我们继续深入 Spring 的世界！
