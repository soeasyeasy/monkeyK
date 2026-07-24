---
title: "第三章：条件语句"
description: "if、else、switch、三元表达式，让程序学会判断"
---

# 第三章：条件语句

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是条件语句？为什么需要条件语句？
- `if` 和 `switch` 有什么区别？该用哪个？
- 什么是真值和假值？怎么利用它们简化代码？
- `switch` 语句中的 `break` 是干什么用的？

这一章就是为了解答这些问题。我们会学习如何让程序根据不同条件执行不同的代码。

---

## 3.1 为什么需要条件语句？

### 痛点分析

想象一下，如果没有条件语句，程序只能按顺序执行：

```javascript
// ❌ 没有条件语句：无论什么情况都执行同样的代码
console.log('欢迎光临！')
console.log('请出示身份证')
console.log('请购票入场')
```

如果是一个儿童，不需要出示身份证；如果是老年人，可能有优惠票。没有条件判断，程序就太死板了！

### 解决方案

用条件语句让程序"做出判断"：

```javascript
// ✅ 使用条件语句：根据不同情况执行不同代码
const age = 20

if (age < 12) {
  console.log('欢迎光临！儿童免票')
} else if (age >= 65) {
  console.log('欢迎光临！老年人半价')
} else {
  console.log('欢迎光临！请购票入场')
}
```

> **一句话总结**：条件语句就像交通信号灯，根据不同情况（红/黄/绿）决定程序该走哪条路。

---

## 3.2 核心原理

### 条件判断的本质

条件语句的本质是 **"如果满足某个条件，就执行某段代码；否则，执行另一段代码"**。

打个比方：

> 想象你去自动售货机买饮料。
> - `if (money >= 5)` 就像"如果你投了足够的钱"
> - `{ dispenseDrink() }` 就像"机器吐出饮料"
> - `else { returnMoney() }` 就像"否则退回你的钱"

### 真值与假值

在条件判断中，JavaScript 会自动把值转为布尔值：

| 假值（falsy） | 真值（truthy） |
| --- | --- |
| `false` | 除了假值之外的所有值 |
| `0` | `1`、`-1`、`0.5` 等非零数字 |
| `''`（空字符串） | `'hello'`、`' '`（含空格）等非空字符串 |
| `null` | `{}`（空对象） |
| `undefined` | `[]`（空数组） |
| `NaN` | `function() {}`（函数） |

---

## 3.3 if 语句

`if` 语句是最常用的条件语句，用于判断一个条件是否成立。

```javascript
const age = 20

// 基本 if 语句：条件为 true 时执行代码块
if (age >= 18) {
  console.log('成年人') // 会执行
}

// 可以省略大括号（不推荐，容易出错）
if (age >= 18) console.log('成年人')
```

> **注意**：即使只有一行代码，也推荐使用大括号，这样更清晰、更不容易出错。

---

## 3.4 if...else

`if...else` 用于在两种情况中选择一种执行。

```javascript
const score = 75

// 如果条件为 true，执行 if 块；否则执行 else 块
if (score >= 60) {
  console.log('及格')
} else {
  console.log('不及格')
}
```

### 真值简化

利用真值假值，可以简化条件判断：

```javascript
const username = ''

// ✅ 完整写法：检查是否为空
if (username === '') {
  console.log('请输入用户名')
}

// ✅ 简化写法：空字符串是假值
if (!username) {
  console.log('请输入用户名')
}

// ✅ 检查数组是否有内容
const items = []
if (items.length > 0) {
  console.log('有数据')
}
// 简化写法
if (items.length) {
  console.log('有数据')
}
```

---

## 3.5 if...else if...else

`if...else if...else` 用于处理多种条件分支。

```javascript
const score = 85

// 按顺序检查条件，满足第一个就执行对应的代码块
if (score >= 90) {
  console.log('优秀')
} else if (score >= 80) {
  console.log('良好')
} else if (score >= 60) {
  console.log('及格')
} else {
  console.log('不及格')
}
```

> **注意**：条件是按顺序检查的，一旦某个条件满足，后面的条件就不会再检查了。

---

## 3.6 嵌套 if

在 `if` 语句内部可以再嵌套 `if` 语句，处理更复杂的逻辑。

```javascript
const age = 25
const hasTicket = true

// 外层判断年龄
if (age >= 18) {
  // 内层判断是否有票
  if (hasTicket) {
    console.log('可以入场')
  } else {
    console.log('请购票')
  }
} else {
  console.log('未成年人需家长陪同')
}

// 等价的简化写法（使用 && 连接条件）
if (age >= 18 && hasTicket) {
  console.log('可以入场')
} else if (age >= 18 && !hasTicket) {
  console.log('请购票')
} else {
  console.log('未成年人需家长陪同')
}
```

---

## 3.7 switch 语句

`switch` 语句用于处理多个等值判断的情况。

```javascript
const day = 3
let dayName

// switch 会依次比较 case 值和表达式是否相等
switch (day) {
  case 1:
    dayName = '星期一'
    break  // 跳出 switch，避免继续执行后面的 case
  case 2:
    dayName = '星期二'
    break
  case 3:
    dayName = '星期三'
    break
  case 4:
    dayName = '星期四'
    break
  case 5:
    dayName = '星期五'
    break
  default:  // 所有 case 都不匹配时执行
    dayName = '周末'
}

console.log(dayName) // '星期三'
```

### switch 穿透

如果忘记写 `break`，代码会"穿透"到下一个 `case`：

```javascript
const grade = 'A'

switch (grade) {
  case 'A':
  case 'B':  // A 和 B 都执行同样的代码
    console.log('优秀')
    break
  case 'C':
    console.log('良好')
    break
  case 'D':
    console.log('及格')
    break
  default:
    console.log('不及格')
}
```

> **注意**：`switch` 使用 `===` 进行比较，不会进行类型转换。

---

## 3.8 三元运算符

三元运算符是 `if...else` 的简写形式。

```javascript
// 基本用法：条件 ? 真值 : 假值
const age = 20
const status = age >= 18 ? '成年' : '未成年'
console.log(status) // '成年'

// 等价于 if...else
let status2
if (age >= 18) {
  status2 = '成年'
} else {
  status2 = '未成年'
}

// 嵌套三元（不推荐，可读性差）
const score = 85
const level = score >= 90 ? '优秀' : score >= 60 ? '及格' : '不及格'
console.log(level) // '及格'
```

---

## 3.9 短路求值

利用逻辑运算符的短路特性，可以实现简洁的条件执行。

### && 短路

```javascript
// 如果条件为 true，执行后面的代码
const user = { name: '张三' }
user && console.log(user.name) // '张三'

// 如果条件为 false，后面的代码不会执行
const nullUser = null
nullUser && console.log(nullUser.name) // 什么都不输出（不会报错）
```

### || 短路

```javascript
// 如果第一个值为假值，使用第二个值作为默认值
const username = inputName || '匿名用户'

// 如果第一个值为真值，直接使用它
const name = '张三' || '匿名用户' // '张三'
```

---

## 3.10 if vs switch 对比

| 特性 | if...else | switch |
| --- | --- | --- |
| 判断方式 | 支持任意条件（>、<、=== 等） | 只支持等值判断（===） |
| 可读性 | 适合少量分支 | 适合多个等值分支 |
| 穿透问题 | 没有 | 需要 break，否则会穿透 |
| 默认情况 | else | default |
| 使用场景 | 复杂条件判断 | 多值等值判断 |

---

## 3.11 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| if 语句 | 基本条件判断，条件为 true 时执行 |
| if...else | 二选一，条件为 true 执行 if，否则执行 else |
| if...else if | 多选一，按顺序检查条件 |
| switch | 多值等值判断，需要 break 防止穿透 |
| 三元运算符 | `if...else` 的简写，适合简单判断 |
| 真值假值 | 6 个假值：false、0、''、null、undefined、NaN |
| 短路求值 | `&&` 和 `\|\|` 的短路特性可以简化代码 |

---

## 3.12 新手常见误区

### 误区 1：`switch` 中的 `break` 可有可无

**错！** 忘记 `break` 会导致代码"穿透"到下一个 `case`。

```javascript
const day = 1

switch (day) {
  case 1:
    console.log('星期一')
    // ❌ 忘记 break，会继续执行 case 2
  case 2:
    console.log('星期二')
    break
}
// 输出：星期一、星期二 ❌
```

### 误区 2：空数组 `[]` 和空对象 `{}` 是假值

**错！** 它们是真值，只有 6 个假值。

```javascript
// ❌ 错误的判断方式
const arr = []
if (!arr) {
  console.log('数组为空') // 不会执行！
}

// ✅ 正确的判断方式
if (arr.length === 0) {
  console.log('数组为空') // 会执行 ✅
}
```

### 误区 3：`switch` 会进行类型转换

**错！** `switch` 使用严格相等 `===` 比较。

```javascript
const num = '1'

switch (num) {
  case 1:
    console.log('数字 1')  // 不会执行！
    break
  case '1':
    console.log('字符串 "1"') // 会执行 ✅
    break
}
```

### 误区 4：嵌套三元运算符很优雅

**错！** 嵌套三元运算符可读性很差，应该用 `if...else`。

```javascript
// ❌ 不好：嵌套过深，难以阅读
const result = a > b ? a > c ? 'a 最大' : 'c 最大' : b > c ? 'b 最大' : 'c 最大'

// ✅ 好：使用 if...else，清晰易懂
let result2
if (a > b) {
  result2 = a > c ? 'a 最大' : 'c 最大'
} else {
  result2 = b > c ? 'b 最大' : 'c 最大'
}
```

### 误区 5：条件语句中可以省略大括号

**不推荐！** 省略大括号容易引入 bug。

```javascript
// ❌ 危险：缩进误导，deleteUser() 会无条件执行
if (isAdmin)
  console.log('管理员')
  deleteUser() // 这行不在 if 块内！

// ✅ 安全：使用大括号，清晰明确
if (isAdmin) {
  console.log('管理员')
  deleteUser()
}
```

---

## 3.13 动手练习

### 练习 1：基础练习

写一个函数，根据分数返回对应的等级（A/B/C/D/E）。

<details>
<summary>点击查看答案</summary>

```javascript
function getGrade(score) {
  if (score >= 90) {
    return 'A'
  } else if (score >= 80) {
    return 'B'
  } else if (score >= 70) {
    return 'C'
  } else if (score >= 60) {
    return 'D'
  } else {
    return 'E'
  }
}

// 测试
console.log(getGrade(95)) // 'A'
console.log(getGrade(85)) // 'B'
console.log(getGrade(75)) // 'C'
console.log(getGrade(65)) // 'D'
console.log(getGrade(55)) // 'E'
```

</details>

### 练习 2：进阶练习

写一个函数，判断用户是否可以登录。条件：用户名不为空、密码长度至少 6 位、年龄满 18 岁。

<details>
<summary>点击查看答案</summary>

```javascript
function canLogin(user) {
  // 检查用户名
  if (!user.username) {
    return '用户名不能为空'
  }
  
  // 检查密码长度
  if (!user.password || user.password.length < 6) {
    return '密码长度至少6位'
  }
  
  // 检查年龄
  if (!user.age || user.age < 18) {
    return '必须年满18岁'
  }
  
  return '可以登录'
}

// 测试
console.log(canLogin({ username: '', password: '123456', age: 20 }))
// '用户名不能为空'

console.log(canLogin({ username: '张三', password: '123', age: 20 }))
// '密码长度至少6位'

console.log(canLogin({ username: '张三', password: '123456', age: 17 }))
// '必须年满18岁'

console.log(canLogin({ username: '张三', password: '123456', age: 20 }))
// '可以登录'
```

</details>

### 练习 3（挑战）：综合练习

写一个函数，根据月份返回对应的季节（春季/夏季/秋季/冬季）。

<details>
<summary>点击查看答案</summary>

```javascript
function getSeason(month) {
  // 使用 switch 语句处理多个等值判断
  switch (month) {
    case 3:
    case 4:
    case 5:
      return '春季'
    case 6:
    case 7:
    case 8:
      return '夏季'
    case 9:
    case 10:
    case 11:
      return '秋季'
    case 12:
    case 1:
    case 2:
      return '冬季'
    default:
      return '无效的月份'
  }
}

// 测试
console.log(getSeason(3))   // '春季'
console.log(getSeason(6))   // '夏季'
console.log(getSeason(9))   // '秋季'
console.log(getSeason(12))  // '冬季'
console.log(getSeason(1))   // '冬季'
console.log(getSeason(13))  // '无效的月份'

// 也可以用 if...else 实现
function getSeason2(month) {
  if (month >= 3 && month <= 5) return '春季'
  if (month >= 6 && month <= 8) return '夏季'
  if (month >= 9 && month <= 11) return '秋季'
  if (month === 12 || month === 1 || month === 2) return '冬季'
  return '无效的月份'
}

console.log(getSeason2(7)) // '夏季'
```

</details>

---

## 下一章预告

下一章我们会学习 **循环**——也就是让程序重复执行一段代码的能力。你会学到 `for`、`while`、`for...of` 等循环方式，以及如何用 `break` 和 `continue` 控制循环。掌握这些，你就能处理批量数据了！