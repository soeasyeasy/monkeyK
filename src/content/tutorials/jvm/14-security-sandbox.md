---
title: '第十四章：JVM 沙箱与安全'
description: '安全管理器、权限控制、代码签名、沙箱机制'
---

# 第十四章：JVM 沙箱与安全

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 JVM 沙箱？它有什么作用？
- 安全管理器（SecurityManager）如何控制权限？
- 什么是代码签名？如何验证代码来源？
- 如何防止恶意代码破坏系统？

这一章就是为了解答这些问题。我们会先搞清楚 **JVM 安全机制的核心概念**，再深入理解安全管理器、权限控制和代码签名，最后掌握沙箱机制的实现原理。学完这章，你就能理解 JVM 如何保护系统免受恶意代码攻击。

---

## 1 为什么需要 JVM 安全机制？

### 痛点分析

想象一下这个场景：

你下载了一个 Java 小程序（Applet），它声称是一个游戏。但运行后，它偷偷读取了你的文件系统，发送了你的个人信息到远程服务器。这就是**缺乏安全机制的风险**——恶意代码可以任意访问系统资源。

这就是**JVM 安全机制的必要性**——限制代码的权限，防止恶意行为。

### JVM 安全机制的解决方案

JVM 提供了一套完整的安全机制：

1. **安全管理器**：控制代码的访问权限
2. **权限控制**：细粒度的资源访问控制
3. **代码签名**：验证代码来源和完整性
4. **沙箱机制**：限制代码的运行环境

打个比方：

> 就像银行的保险箱，你需要身份验证（代码签名）才能进入，进入后只能访问自己的箱子（权限控制），不能随意进入其他区域（沙箱限制）。

---

## 2 安全管理器

### 什么是安全管理器

安全管理器（SecurityManager）是 Java 提供的**安全检查机制**，它在代码访问敏感资源时进行权限检查。

### 安全管理器的工作原理

```java
// 示例：安全管理器检查
public class SecurityManagerDemo {
    public static void main(String[] args) {
        // 安装安全管理器
        System.setSecurityManager(new SecurityManager());
        
        try {
            // 尝试读取文件
            // 安全管理器会检查是否有权限
            FileReader reader = new FileReader("/etc/passwd");
            System.out.println("文件读取成功");
        } catch (SecurityException e) {
            System.out.println("权限被拒绝: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**执行流程**：

1. 代码尝试访问敏感资源
2. 安全管理器拦截请求
3. 检查代码的权限
4. 如果有权限，允许访问；否则抛出 SecurityException

### 安全管理器的配置

```bash
# 启用安全管理器
java -Djava.security.manager MyApp

# 指定安全策略文件
java -Djava.security.manager -Djava.security.policy=policy.txt MyApp
```

### 安全策略文件

```java
// policy.txt 示例
// 授予所有权限
grant {
    permission java.security.AllPermission;
};

// 或者细粒度控制
grant codeBase "file:/path/to/app/-" {
    permission java.io.FilePermission "/tmp/*", "read,write";
    permission java.net.SocketPermission "localhost:8080", "connect";
};
```

**权限类型**：

| 权限类型 | 说明 |
| --- | --- |
| FilePermission | 文件访问权限 |
| SocketPermission | 网络访问权限 |
| PropertyPermission | 系统属性访问权限 |
| RuntimePermission | 运行时操作权限 |

---

## 3 权限控制

### 什么是权限控制

权限控制是**细粒度的资源访问控制**，决定代码是否可以执行特定操作。

### 权限检查示例

```java
// 示例：自定义权限检查
public class PermissionDemo {
    public static void main(String[] args) {
        // 安装安全管理器
        System.setSecurityManager(new SecurityManager());
        
        // 检查文件读取权限
        try {
            SecurityManager sm = System.getSecurityManager();
            if (sm != null) {
                sm.checkRead("/etc/passwd");
            }
            System.out.println("有文件读取权限");
        } catch (SecurityException e) {
            System.out.println("没有文件读取权限: " + e.getMessage());
        }
    }
}
```

### 自定义权限

```java
// 示例：自定义权限
import java.security.BasicPermission;

public class CustomPermission extends BasicPermission {
    public CustomPermission(String name) {
        super(name);
    }
    
    public CustomPermission(String name, String actions) {
        super(name, actions);
    }
}

// 使用自定义权限
public class CustomPermissionDemo {
    public static void main(String[] args) {
        System.setSecurityManager(new SecurityManager());
        
        try {
            // 检查自定义权限
            SecurityManager sm = System.getSecurityManager();
            if (sm != null) {
                sm.checkPermission(new CustomPermission("custom.action"));
            }
            System.out.println("有自定义权限");
        } catch (SecurityException e) {
            System.out.println("没有自定义权限: " + e.getMessage());
        }
    }
}
```

### 权限控制策略

```java
// policy.txt 示例
// 授予特定代码库权限
grant codeBase "file:/path/to/trusted/-" {
    permission java.io.FilePermission "<<ALL FILES>>", "read,write,delete";
    permission java.net.SocketPermission "*", "connect,accept,listen,resolve";
};

// 授予未签名代码有限权限
grant {
    permission java.io.FilePermission "/tmp/*", "read";
    permission java.util.PropertyPermission "user.dir", "read";
};
```

---

## 4 代码签名

### 什么是代码签名

代码签名是**验证代码来源和完整性**的机制。通过数字签名，可以确认代码没有被篡改，并且来自可信的发布者。

### 代码签名的工作原理

```
1. 开发者生成密钥对（公钥 + 私钥）
2. 使用私钥对代码进行签名
3. 用户获取代码和公钥
4. 使用公钥验证签名
5. 如果验证通过，说明代码来源可信且未被篡改
```

打个比方：

> 就像快递包裹，开发者用锁（私钥）锁上包裹，用户用钥匙（公钥）打开。如果包裹被打开过，锁会被破坏，用户就知道包裹被篡改了。

### 生成密钥对

```bash
# 生成密钥对
keytool -genkeypair -alias mykey -keyalg RSA -keystore keystore.jks

# 输入密码和相关信息
# 生成 keystore.jks 文件
```

### 签名 JAR 文件

```bash
# 签名 JAR 文件
jarsigner -keystore keystore.jks myapp.jar mykey

# 输入密码
# myapp.jar 被签名
```

### 验证签名

```bash
# 验证 JAR 签名
jarsigner -verify myapp.jar

# 输出：jar verified
```

### 代码签名示例

```java
// 示例：检查代码签名
public class SignatureDemo {
    public static void main(String[] args) {
        // 获取当前代码的证书
        CodeSource cs = SignatureDemo.class.getProtectionDomain().getCodeSource();
        if (cs != null) {
            Certificate[] certs = cs.getCertificates();
            if (certs != null && certs.length > 0) {
                System.out.println("代码已签名");
                for (Certificate cert : certs) {
                    System.out.println("证书: " + cert.getType());
                }
            } else {
                System.out.println("代码未签名");
            }
        }
    }
}
```

---

## 5 沙箱机制

### 什么是沙箱机制

沙箱机制是**限制代码运行环境**的安全机制。代码在沙箱中运行，只能访问被允许的资源，不能访问系统敏感资源。

### 沙箱的应用场景

| 场景 | 说明 |
| --- | --- |
| Applet | 浏览器中运行的 Java 小程序 |
| Web Start | 通过网页启动的 Java 应用 |
| 插件系统 | 第三方插件运行在沙箱中 |
| 不可信代码 | 运行来源不明的代码 |

### 沙箱的实现

```java
// 示例：创建沙箱环境
import java.security.*;

public class SandboxDemo {
    public static void main(String[] args) {
        // 创建受限的权限集
        Permissions perms = new Permissions();
        perms.add(new FilePermission("/tmp/*", "read,write"));
        perms.add(new PropertyPermission("user.dir", "read"));
        
        // 创建保护域
        CodeSource cs = new CodeSource(null, (java.security.cert.Certificate[]) null);
        ProtectionDomain pd = new ProtectionDomain(cs, perms);
        
        // 创建访问控制上下文
        AccessControlContext acc = new AccessControlContext(pd);
        
        // 在沙箱中执行代码
        try {
            AccessController.doPrivileged(new PrivilegedAction<Void>() {
                public Void run() {
                    // 这段代码在沙箱中运行
                    System.out.println("在沙箱中运行");
                    System.getProperty("user.dir"); // 允许
                    return null;
                }
            }, acc);
        } catch (Exception e) {
            System.out.println("沙箱限制: " + e.getMessage());
        }
    }
}
```

### 沙箱的安全策略

```java
// 示例：沙箱安全策略
grant codeBase "file:/path/to/untrusted/-" {
    // 只允许读取 /tmp 目录
    permission java.io.FilePermission "/tmp/*", "read,write";
    
    // 只允许读取特定系统属性
    permission java.util.PropertyPermission "user.dir", "read";
    permission java.util.PropertyPermission "os.name", "read";
    
    // 不允许网络访问
    // 不允许文件删除
    // 不允许反射
};
```

---

## 6 安全最佳实践

### 1. 最小权限原则

```java
// ❌ 错误：授予所有权限
grant {
    permission java.security.AllPermission;
};

// ✅ 正确：只授予必要权限
grant codeBase "file:/path/to/app/-" {
    permission java.io.FilePermission "/data/*", "read";
    permission java.net.SocketPermission "api.example.com:443", "connect";
};
```

### 2. 验证代码来源

```java
// ✅ 验证代码签名
public class CodeVerification {
    public static void main(String[] args) {
        CodeSource cs = CodeVerification.class.getProtectionDomain().getCodeSource();
        Certificate[] certs = cs.getCertificates();
        
        if (certs == null || certs.length == 0) {
            System.out.println("警告：代码未签名");
            // 可以选择拒绝运行
        }
    }
}
```

### 3. 使用安全管理器

```bash
# ✅ 启用安全管理器
java -Djava.security.manager -Djava.security.policy=policy.txt MyApp
```

### 4. 限制网络访问

```java
// policy.txt
grant codeBase "file:/path/to/app/-" {
    // 只允许访问特定域名
    permission java.net.SocketPermission "api.example.com", "connect,resolve";
    
    // 禁止其他网络访问
};
```

### 5. 限制文件访问

```java
// policy.txt
grant codeBase "file:/path/to/app/-" {
    // 只允许访问特定目录
    permission java.io.FilePermission "/data/app/-", "read,write";
    
    // 禁止访问系统文件
    // permission java.io.FilePermission "<<ALL FILES>>", "read"; // ❌ 不要这样做
};
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 安全管理器 | 控制代码的访问权限，防止恶意行为 |
| 权限控制 | 细粒度的资源访问控制 |
| 代码签名 | 验证代码来源和完整性 |
| 沙箱机制 | 限制代码运行环境，只允许访问被授权的资源 |
| 安全策略 | 定义代码的权限规则 |

---

## 8 新手常见误区

### 误区 1："安全管理器会影响性能，不应该启用"

**错！** 安全管理器的性能开销很小，而且只在访问敏感资源时才会检查。对于运行不可信代码的场景，安全管理器是必要的安全保障。

正确做法：根据应用场景决定是否启用安全管理器。运行不可信代码时必须启用。

### 误区 2："代码签名只是形式，不重要"

不是的。代码签名可以验证代码来源和完整性，防止代码被篡改。对于分发软件，代码签名是重要的安全措施。

### 误区 3："沙箱会限制所有功能"

不对。沙箱只是限制对敏感资源的访问，正常的业务功能不受影响。可以通过安全策略文件精细控制权限。

### 误区 4："JVM 安全机制可以完全防止攻击"

实际上，JVM 安全机制只是多层安全防护的一部分。还需要结合网络安全、应用安全、系统安全等多方面措施。

---

## 9 动手练习

### 练习 1：基础题

请回答以下问题：

1. 什么是安全管理器？它有什么作用？
2. 代码签名的工作原理是什么？
3. 沙箱机制的应用场景有哪些？

<details>
<summary>点击查看答案</summary>

1. 安全管理器（SecurityManager）是 Java 提供的安全检查机制，它在代码访问敏感资源时进行权限检查。作用是控制代码的访问权限，防止恶意行为。

2. 代码签名的工作原理：
   - 开发者生成密钥对（公钥 + 私钥）
   - 使用私钥对代码进行签名
   - 用户获取代码和公钥
   - 使用公钥验证签名
   - 如果验证通过，说明代码来源可信且未被篡改

3. 沙箱机制的应用场景：
   - **Applet**：浏览器中运行的 Java 小程序
   - **Web Start**：通过网页启动的 Java 应用
   - **插件系统**：第三方插件运行在沙箱中
   - **不可信代码**：运行来源不明的代码

</details>

### 练习 2：进阶题

请编写代码，演示如何使用安全管理器限制文件访问。

<details>
<summary>点击查看答案</summary>

```java
import java.io.FileReader;

public class SecurityManagerFileDemo {
    public static void main(String[] args) {
        // 安装安全管理器
        System.setSecurityManager(new SecurityManager());
        
        // 尝试读取允许的文件
        try {
            FileReader reader = new FileReader("/tmp/test.txt");
            System.out.println("读取 /tmp/test.txt 成功");
            reader.close();
        } catch (SecurityException e) {
            System.out.println("读取 /tmp/test.txt 被拒绝: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("文件不存在或其他错误");
        }
        
        // 尝试读取禁止的文件
        try {
            FileReader reader = new FileReader("/etc/passwd");
            System.out.println("读取 /etc/passwd 成功");
            reader.close();
        } catch (SecurityException e) {
            System.out.println("读取 /etc/passwd 被拒绝: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("文件不存在或其他错误");
        }
    }
}
```

**安全策略文件（policy.txt）**：

```java
grant {
    permission java.io.FilePermission "/tmp/*", "read";
};
```

**运行命令**：

```bash
java -Djava.security.manager -Djava.security.policy=policy.txt SecurityManagerFileDemo
```

**输出**：

```
读取 /tmp/test.txt 成功
读取 /etc/passwd 被拒绝: access denied ("java.io.FilePermission" "/etc/passwd" "read")
```

</details>

### 练习 3（挑战）：综合题

请解释如何为第三方插件创建沙箱环境，限制其只能访问特定资源。

<details>
<summary>点击查看答案</summary>

**创建插件沙箱环境**：

```java
import java.security.*;
import java.io.FilePermission;
import java.util.PropertyPermission;

public class PluginSandbox {
    
    public static void main(String[] args) {
        // 1. 定义插件的权限
        Permissions pluginPerms = new Permissions();
        
        // 只允许读取插件目录
        pluginPerms.add(new FilePermission("/plugins/-", "read"));
        
        // 只允许写入临时目录
        pluginPerms.add(new FilePermission("/tmp/plugins/-", "read,write"));
        
        // 只允许读取特定系统属性
        pluginPerms.add(new PropertyPermission("plugin.name", "read"));
        pluginPerms.add(new PropertyPermission("plugin.version", "read"));
        
        // 不允许网络访问
        // 不允许访问其他文件
        // 不允许反射
        
        // 2. 创建插件的保护域
        CodeSource pluginCodeSource = new CodeSource(
            null, 
            (java.security.cert.Certificate[]) null
        );
        ProtectionDomain pluginDomain = new ProtectionDomain(
            pluginCodeSource, 
            pluginPerms
        );
        
        // 3. 创建访问控制上下文
        AccessControlContext pluginACC = new AccessControlContext(pluginDomain);
        
        // 4. 在沙箱中加载和运行插件
        try {
            AccessController.doPrivileged(new PrivilegedAction<Void>() {
                public Void run() {
                    // 加载插件类
                    try {
                        Class<?> pluginClass = Class.forName("com.example.MyPlugin");
                        Object plugin = pluginClass.newInstance();
                        
                        // 调用插件方法
                        pluginClass.getMethod("execute").invoke(plugin);
                    } catch (Exception e) {
                        System.out.println("插件执行失败: " + e.getMessage());
                    }
                    return null;
                }
            }, pluginACC);
        } catch (Exception e) {
            System.out.println("插件沙箱限制: " + e.getMessage());
        }
    }
}
```

**安全策略文件（plugin-policy.txt）**：

```java
// 主程序权限
grant codeBase "file:/path/to/main/-" {
    permission java.security.AllPermission;
};

// 插件权限
grant codeBase "file:/plugins/-" {
    permission java.io.FilePermission "/plugins/-", "read";
    permission java.io.FilePermission "/tmp/plugins/-", "read,write";
    permission java.util.PropertyPermission "plugin.*", "read";
};
```

**运行命令**：

```bash
java -Djava.security.manager -Djava.security.policy=plugin-policy.txt PluginSandbox
```

**沙箱效果**：

- 插件只能读取 `/plugins/` 目录
- 插件只能写入 `/tmp/plugins/` 目录
- 插件只能读取 `plugin.*` 系统属性
- 插件不能访问网络
- 插件不能访问其他文件
- 插件不能使用反射

**安全优势**：

- 即使插件有恶意代码，也无法破坏系统
- 插件只能访问被授权的资源
- 主程序保持完全权限

</details>

---

## 下一章预告

下一章我们会学习 **生产环境 JVM 配置**——也就是如何在容器化部署、云原生环境中配置 JVM。你会学到容器化部署的最佳实践、云原生配置、性能基准测试等核心概念。
