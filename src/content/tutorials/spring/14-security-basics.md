---
title: "第14章：Spring Security 基础"
description: "使用 Spring Security 实现认证与授权"
---

# 第14章：Spring Security 基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring Security 是什么？它能解决什么问题？
- 如何实现用户登录认证？
- 如何实现权限控制？
- 密码应该如何加密存储？

这一章就是为了解答这些问题。我们会从 Spring Security 的核心概念开始，学习认证与授权的实现，掌握密码加密和用户管理。

---

## 14.1 为什么需要 Spring Security？

### 痛点分析

自己实现安全框架需要处理很多问题：

1. **认证**：用户登录、Session 管理、Token 验证
2. **授权**：权限检查、角色控制、资源访问
3. **密码安全**：加密存储、防止暴力破解
4. **安全防护**：CSRF、XSS、会话固定攻击

自己实现容易出错，且难以保证安全。

### 解决方案

Spring Security 提供完整的安全解决方案：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/register").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/home")
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout")
            );
        
        return http.build();
    }
}
```

> **一句话总结**：Spring Security 提供企业级安全框架，让你专注于业务逻辑，不用操心安全问题。

---

## 14.2 核心原理

### 14.2.1 认证与授权

| 概念 | 说明 | 例子 |
| --- | --- | --- |
| 认证（Authentication） | 验证用户身份 | 登录验证 |
| 授权（Authorization） | 验证用户权限 | 检查是否有管理员权限 |

打个比方：

> 认证就像进小区：保安检查你的门禁卡，确认你是小区住户
> 授权就像进楼栋：有些楼栋需要特定权限才能进入

### 14.2.2 Security 架构

```
请求 → FilterChain → AuthenticationFilter → AuthenticationManager
                                              ↓
                                    UserDetailsService
                                              ↓
                                    UserDetails（用户信息）
                                              ↓
                                    SecurityContext（安全上下文）
```

**核心组件**：

| 组件 | 职责 |
| --- | --- |
| SecurityFilterChain | 过滤器链 |
| AuthenticationManager | 认证管理器 |
| UserDetailsService | 用户详情服务 |
| UserDetails | 用户信息 |
| SecurityContext | 安全上下文 |

---

## 14.3 基础用法

### 14.3.1 添加依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

### 14.3.2 配置 Security

```java
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 配置请求授权
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/register", "/css/**", "/js/**").permitAll() // 公开访问
                .requestMatchers("/admin/**").hasRole("ADMIN") // 需要 ADMIN 角色
                .anyRequest().authenticated() // 其他请求需要认证
            )
            // 配置表单登录
            .formLogin(form -> form
                .loginPage("/login") // 自定义登录页
                .loginProcessingUrl("/login") // 登录处理 URL
                .defaultSuccessUrl("/home") // 登录成功跳转
                .failureUrl("/login?error") // 登录失败跳转
                .permitAll()
            )
            // 配置登出
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )
            // 禁用 CSRF（RESTful API 通常禁用）
            .csrf(csrf -> csrf.disable());
        
        return http.build();
    }
}
```

### 14.3.3 用户详情服务

```java
package com.example.security;

import com.example.model.User;
import com.example.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 从数据库查询用户
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }
        
        // 构建 UserDetails
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword()) // 加密后的密码
                .authorities(Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole())
                ))
                .build();
    }
}
```

### 14.3.4 密码加密

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    // 密码编码器
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // ... 配置
    }
}

// 注册时使用
@Service
public class UserService {
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private UserMapper userMapper;
    
    public void register(String username, String rawPassword) {
        // 加密密码
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(encodedPassword);
        user.setRole("USER");
        
        userMapper.save(user);
    }
}
```

### 14.3.5 获取当前用户

```java
@RestController
public class UserController {
    
    // 方式一：通过参数注入
    @GetMapping("/me")
    public String getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return "当前用户: " + userDetails.getUsername();
    }
    
    // 方式二：通过 SecurityContext
    @GetMapping("/me2")
    public String getCurrentUser2() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return "当前用户: " + auth.getName();
    }
    
    // 方式三：在方法中使用
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users")
    public List<User> getAllUsers() {
        return userService.findAll();
    }
}
```

---

## 14.4 进阶用法

### 14.4.1 方法级安全

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // 启用方法级安全
public class SecurityConfig {
    // ...
}

@Service
public class UserService {
    
    // 需要 ADMIN 角色
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) {
        userMapper.deleteById(id);
    }
    
    // 需要特定权限
    @PreAuthorize("hasAuthority('user:delete')")
    public void deleteUser2(Long id) {
        userMapper.deleteById(id);
    }
    
    // 自定义表达式
    @PreAuthorize("#id == authentication.principal.id")
    public User getUser(@PathVariable Long id) {
        return userMapper.findById(id);
    }
}
```

### 14.4.2 自定义认证提供者

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}
```

### 14.4.3 JWT 认证

```java
// JWT 过滤器
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        // 获取 Token
        String token = getTokenFromRequest(request);
        
        // 验证 Token
        if (token != null && tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsernameFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

// JWT 工具类
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration}")
    private long expiration;
    
    public String generateToken(UserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }
    
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(secret)
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

---

## 14.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @EnableWebSecurity | 启用 Security |
| SecurityFilterChain | 过滤器链配置 |
| authorizeHttpRequests | 请求授权 |
| formLogin | 表单登录 |
| UserDetailsService | 用户详情服务 |
| UserDetails | 用户信息 |
| PasswordEncoder | 密码编码器 |
| @PreAuthorize | 方法级授权 |
| SecurityContext | 安全上下文 |

---

## 14.6 新手常见误区

### 误区 1："Spring Security 太复杂，不如自己写"

**不建议！** 自己写安全框架容易出错，且难以保证安全。Spring Security 虽然学习曲线陡峭，但功能强大且经过验证。

### 误区 2："密码可以明文存储"

**绝对不行！** 密码必须加密存储。使用 BCryptPasswordEncoder，它会自动加盐。

```java
// 错误
user.setPassword("123456");

// 正确
user.setPassword(passwordEncoder.encode("123456"));
```

### 误区 3："@PreAuthorize 和 @Secured 是一样的"

**不完全一样！**
- @PreAuthorize：支持 SpEL 表达式，更灵活
- @Secured：只支持角色，较简单

**推荐**：使用 @PreAuthorize。

### 误区 4："CSRF 防护可以禁用"

**看情况！** 
- 传统 Web 应用（使用 Session）：不要禁用
- RESTful API（使用 Token）：可以禁用

### 误区 5："SecurityContext 可以在任何地方获取"

**错！** SecurityContext 只能在当前线程中获取，异步线程需要手动传递。

---

## 14.7 动手练习

### 练习 1：基础练习 - 简单认证

配置 Spring Security，实现简单的表单登录。

<details>
<summary>点击查看答案</summary>

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/css/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/home")
                .permitAll()
            );
        
        return http.build();
    }
    
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user = User.withUsername("user")
                .password("{noop}password") // 不加密
                .roles("USER")
                .build();
        
        return new InMemoryUserDetailsManager(user);
    }
}
```

</details>

### 练习 2：进阶练习 - 数据库认证

实现从数据库加载用户信息。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在");
        }
        
        return User.withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();
    }
}

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .formLogin(form -> form.defaultSuccessUrl("/home"));
        return http.build();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - JWT 认证

实现基于 JWT 的无状态认证。

<details>
<summary>点击查看答案</summary>

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()));
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return tokenProvider.generateToken(userDetails);
    }
}

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthenticationFilter(), 
                           UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot 自动配置原理**——也就是 Spring Boot 如何实现自动配置。你会学到：

- @EnableAutoConfiguration 原理
- 条件注解的使用
- 自定义 Starter
- 自动配置的实现机制

准备好了吗？让我们继续深入 Spring 的世界！
