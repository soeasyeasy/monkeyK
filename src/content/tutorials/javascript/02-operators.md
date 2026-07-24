---
title: "第二章：运算符"
description: "算术、比较、逻辑、三元运算符，掌握 JavaScript 的计算工具"
---

# 第二章：运算符

## 本章导读

在学这一章之前，你可能会有这些疑问：

- JavaScript 有哪些运算符？分别有什么用？
- `==` 和 `===` 有什么区别？该用哪个？
- `&&` 和 `||` 什么时候会"短路"？
- `??` 和 `||` 有什么不同？

这一章就是为了解答这些问题。我们会系统地学习各种运算符，搞清楚它们的优先级和使用场景。

---

## 2.1 为什么需要运算符？

### 痛点分析

想象一下，如果没有运算符，你要比较两个数的大小：

```javascript
// ❌ 没有运算符：代码冗长，难以理解
function isGreater(a, b) {
  if (a > b) {
    return true
  } else {
    return false
  }
}

// 如果可以直接比较，为什么要写这么多行？
```

### 解决方案

用运算符让代码简洁高效：

```javascript
// ✅ 使用运算符：一行代码搞定
const isGreater = (a, b) => a > b

// 复杂计算也变得简单
const result = (10 + 5) * 2 - 3 / 1
console.log(result) // 27
```

> **一句话总结**：运算符就像工具箱里的工具，让你能轻松对数据进行计算、比较和判断。

---

## 2.2 核心原理

### 运算符的本质

运算符是告诉 JavaScript 引擎 **"对操作数做什么"** 的指令。

打个比方：

> 想象你在厨房里做菜。
> - `+` 运算符就像一把铲子，把两个食材（数字）"混合"在一起变成一个新的食材（和）
> - `>` 运算符就像一个天平，比较两个食材哪个"更重"（更大）
> - `&&` 运算符就像一个门禁系统，只有两个条件都满足才能通过

### 运算符优先级

运算符有优先级，就像数学里的"先乘除后加减"。

```javascript
// 先算乘法，再算加法
3 + 5 * 2  // 13，不是 16

// 使用括号改变优先级
(3 + 5) * 2  // 16
```

---

## 2.3 算术运算符

算术运算符用于数学计算，返回一个数值。

```javascript
const a = 10
const b = 3

// 加法：把两个数加起来
console.log(a + b)  // 13

// 减法：从第一个数减去第二个数
console.log(a - b)  // 7

// 乘法：两个数相乘
console.log(a * b)  // 30

// 除法：第一个数除以第二个数
console.log(a / b)  // 3.333...

// 取余：求除法的余数
console.log(a % b)  // 1（10 ÷ 3 = 3 余 1）

// 幂运算：第一个数的第二个数次方
console.log(a ** b) // 1000（10 × 10 × 10）
```

### 字符串拼接

`+` 运算符遇到字符串会变成字符串拼接：

```javascript
// 字符串 + 字符串 = 字符串
'hello' + 'world'  // 'helloworld'

// 数字 + 字符串 = 字符串（数字自动转字符串）
10 + '个苹果'  // '10个苹果'

// ❌ 注意：先算加法，再拼接
1 + 2 + '个'  // '3个'
'有' + 1 + 2  // '有12'
```

---

## 2.4 自增自减运算符

`++` 和 `--` 用于快速增加或减少变量的值。

```javascript
let x = 5

// 后置自增：先使用值，再增加
console.log(x++)  // 5（输出5，然后x变成6）
console.log(x)    // 6

// 前置自增：先增加，再使用值
console.log(++x)  // 7（x先变成7，然后输出7）
console.log(x)    // 7

// 后置自减：先使用值，再减少
console.log(x--)  // 7（输出7，然后x变成6）

// 前置自减：先减少，再使用值
console.log(--x)  // 5（x先变成5，然后输出5）
```

> **注意**：自增自减只能用于变量，不能用于常量或字面量。

```javascript
// ❌ 错误！不能对常量使用自增
const num = 5
// num++ // Uncaught TypeError

// ❌ 错误！不能对字面量使用自增
// 5++ // Uncaught ReferenceError
```

---

## 2.5 赋值运算符

赋值运算符用于给变量赋值，常与其他运算符组合。

```javascript
let y = 10

// 基本赋值：把右边的值赋给左边
y = 15

// 加法赋值：y = y + 5
y += 5  // y = 20

// 减法赋值：y = y - 3
y -= 3  // y = 17

// 乘法赋值：y = y * 2
y *= 2  // y = 34

// 除法赋值：y = y / 4
y /= 4  // y = 8.5

// 取余赋值：y = y % 4
y %= 4  // y = 0.5

// 幂运算赋值：y = y ** 3
y **= 3 // y = 0.125
```

---

## 2.6 比较运算符

比较运算符用于比较两个值，返回布尔值 `true` 或 `false`。

```javascript
// 宽松相等：会进行类型转换
console.log(5 == '5')   // true ❗ 不推荐

// 严格相等：不转换类型，值和类型都要相同
console.log(5 === '5')  // false ✅ 推荐

// 不相等
console.log(5 != '5')   // false
console.log(5 !== '5')  // true ✅

// 大于/小于
console.log(5 > 3)   // true
console.log(5 < 3)   // false

// 大于等于/小于等于
console.log(5 >= 5)  // true
console.log(5 <= 4)  // false
```

### == vs === 对比

| 特性 | ==（宽松相等） | ===（严格相等） |
| --- | --- | --- |
| 类型转换 | 是，会自动转换类型 | 否，类型必须相同 |
| `5 == '5'` | true | false |
| `0 == false` | true | false |
| `'' == false` | true | false |
| `null == undefined` | true | false |
| 推荐度 | ❌ 不推荐 | ✅ 强烈推荐 |

---

## 2.7 逻辑运算符

逻辑运算符用于连接多个条件，返回布尔值或参与运算的值。

### 逻辑与 `&&`

```javascript
// 两个条件都为 true，结果才是 true
console.log(true && true)   // true
console.log(true && false)  // false

// 短路求值：第一个是假值，直接返回第一个值
const result = 0 && 'hello'  // 0
const result2 = 1 && 'hello' // 'hello'

// 实际应用：条件赋值
const user = null
const userName = user && user.name  // null（不会报错）
```

### 逻辑或 `||`

```javascript
// 只要有一个条件为 true，结果就是 true
console.log(true || false)  // true
console.log(false || false) // false

// 短路求值：第一个是真值，直接返回第一个值
const result = 'value' || 'default'  // 'value'
const result2 = 0 || 'default'       // 'default'

// 实际应用：设置默认值
const name = inputName || '匿名用户'
```

### 逻辑非 `!`

```javascript
// 取反：true 变 false，false 变 true
console.log(!true)   // false
console.log(!false)  // true

// 双重取反：把值转为布尔值
console.log(!!0)     // false
console.log(!!'')    // false
console.log(!!'hello') // true
console.log(!!42)    // true
```

---

## 2.8 空值合并运算符 `??`

`??` 只在左侧是 `null` 或 `undefined` 时才返回右侧的值。

```javascript
// null 时返回默认值
const value = null ?? '默认值'  // '默认值'

// undefined 时返回默认值
const value2 = undefined ?? '默认值'  // '默认值'

// 0 不是 null/undefined，返回 0 ✅
const zero = 0 ?? 10  // 0

// 空字符串不是 null/undefined，返回空字符串 ✅
const empty = '' ?? '默认'  // ''

// 对比 ||（会把 0 和 '' 当作假值）
const zero2 = 0 || 10   // 10 ❌ 可能不是你想要的
const empty2 = '' || '默认' // '默认' ❌
```

### `??` vs `||` 对比

| 左侧值 | `value ?? '默认'` | `value \|\| '默认'` |
| --- | --- | --- |
| `null` | '默认' | '默认' |
| `undefined` | '默认' | '默认' |
| `0` | `0` | '默认' |
| `''` | `''` | '默认' |
| `false` | `false` | '默认' |
| `'hello'` | 'hello' | 'hello' |
| `42` | `42` | `42` |

---

## 2.9 可选链 `?.`

`?.` 用于安全访问嵌套对象的属性，不会因为中间值为 `null`/`undefined` 而报错。

```javascript
const user = { name: '张三' }

// 安全访问存在的属性
console.log(user?.name)  // '张三'

// 安全访问不存在的属性（不会报错）
console.log(user?.age)   // undefined

// 安全访问嵌套属性
const user2 = { 
  name: '李四', 
  address: { city: '北京' } 
}
console.log(user2?.address?.city)  // '北京'

// 如果中间值不存在，直接返回 undefined
const user3 = null
console.log(user3?.address?.city) // undefined（不会报错）

// ❌ 如果不用可选链，会报错
// const user4 = null
// console.log(user4.address.city) // Uncaught TypeError
```

---

## 2.10 三元运算符 `? :`

三元运算符是 `if...else` 的简写形式，用于简单的条件判断。

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

> **注意**：三元运算符只适合简单的条件判断，复杂逻辑请用 `if...else`。

---

## 2.11 typeof 和 instanceof

### typeof：检测基本类型

```javascript
typeof 'hello'  // 'string'
typeof 42       // 'number'
typeof true     // 'boolean'
typeof undefined // 'undefined'
typeof null     // 'object' ❗ 历史遗留 bug
typeof function(){} // 'function'
typeof []       // 'object'
typeof {}       // 'object'
```

### instanceof：检测对象类型

```javascript
const arr = [1, 2, 3]
const obj = { name: '张三' }

// 检测是否是数组
console.log(arr instanceof Array)  // true

// 检测是否是对象
console.log(obj instanceof Object) // true

// 数组也是对象的一种
console.log(arr instanceof Object) // true
```

---

## 2.12 运算符优先级表

| 优先级 | 运算符 | 说明 |
| --- | --- | --- |
| 1 | `()` | 括号（最高优先级） |
| 2 | `**` | 幂运算 |
| 3 | `++` `--` `!` `typeof` | 一元运算符 |
| 4 | `*` `/` `%` | 乘、除、取余 |
| 5 | `+` `-` | 加、减 |
| 6 | `>` `<` `>=` `<=` | 比较运算符 |
| 7 | `==` `!=` `===` `!==` | 相等运算符 |
| 8 | `&&` | 逻辑与 |
| 9 | `\|\|` | 逻辑或 |
| 10 | `??` | 空值合并 |
| 11 | `? :` | 三元运算符 |
| 12 | `=` `+=` `-=` 等 | 赋值运算符（最低优先级） |

> **记忆技巧**：先括号，再幂，再一元，然后乘除加减，然后比较，然后逻辑，最后赋值。

---

## 2.13 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 算术运算符 | `+ - * / % **`，用于数学计算 |
| 比较运算符 | `== != === !== > < >= <=`，返回布尔值 |
| 逻辑运算符 | `&& \|\| !`，连接条件，支持短路求值 |
| 空值合并 | `??`，只对 `null`/`undefined` 返回默认值 |
| 可选链 | `?.`，安全访问嵌套属性 |
| 三元运算符 | `? :`，`if...else` 的简写 |
| 推荐用法 | 用 `===` 代替 `==`，用 `??` 代替 `||` 设置默认值 |

---

## 2.14 新手常见误区

### 误区 1：`==` 和 `===` 没区别

**错！** `==` 会进行类型转换，容易产生意外结果。

```javascript
// ❌ 意外的结果
console.log(0 == false)    // true
console.log('' == false)   // true
console.log(null == undefined) // true

// ✅ 使用 ===，结果符合预期
console.log(0 === false)    // false
console.log('' === false)   // false
console.log(null === undefined) // false
```

### 误区 2：`||` 可以用来设置所有默认值

**错！** `||` 会把 `0`、`''`、`false` 当作假值。

```javascript
// ❌ 错误：0 被当作假值
const count = 0
const displayCount = count || 10
console.log(displayCount) // 10 ❌ 应该是 0

// ✅ 正确：用 ?? 只对 null/undefined 生效
const displayCount2 = count ?? 10
console.log(displayCount2) // 0 ✅
```

### 误区 3：`++i` 和 `i++` 结果一样

**错！** 前置和后置的返回值不同。

```javascript
let i = 5

// 后置：先返回值，再自增
const a = i++
console.log(a) // 5 ✅
console.log(i) // 6

// 前置：先自增，再返回值
const b = ++i
console.log(b) // 7 ✅
console.log(i) // 7
```

### 误区 4：逻辑运算符只返回布尔值

**错！** `&&` 和 `||` 返回参与运算的值，不一定是布尔值。

```javascript
// && 返回第一个假值或最后一个真值
const result1 = 0 && 'hello'   // 0（不是 false）
const result2 = 'hi' && 'hello' // 'hello'（不是 true）

// || 返回第一个真值或最后一个假值
const result3 = 'value' || 'default' // 'value'（不是 true）
const result4 = 0 || false          // false
```

---

## 2.15 动手练习

### 练习 1：基础练习

计算一个数的平方和立方，并判断这个数是否大于 10。

<details>
<summary>点击查看答案</summary>

```javascript
const num = 5

// 计算平方和立方
const square = num ** 2
const cube = num ** 3

console.log(`${num} 的平方是 ${square}`) // '5 的平方是 25'
console.log(`${num} 的立方是 ${cube}`)   // '5 的立方是 125'

// 判断是否大于 10
const isGreaterThan10 = num > 10
console.log(`${num} 是否大于 10：${isGreaterThan10}`) // '5 是否大于 10：false'
```

</details>

### 练习 2：进阶练习

写一个函数，接收用户输入的年龄，返回对应的年龄段描述（儿童/青少年/成年/老年）。

<details>
<summary>点击查看答案</summary>

```javascript
function getAgeGroup(age) {
  // 使用三元运算符进行多重判断
  return age < 12 ? '儿童' 
    : age < 18 ? '青少年' 
    : age < 65 ? '成年' 
    : '老年'
}

// 测试
console.log(getAgeGroup(5))   // '儿童'
console.log(getAgeGroup(15))  // '青少年'
console.log(getAgeGroup(30))  // '成年'
console.log(getAgeGroup(70))  // '老年'
```

</details>

### 练习 3（挑战）：综合练习

写一个函数，接收一个对象，安全地获取嵌套属性 `user.address.city`，如果不存在则返回默认值 '未知城市'。

<details>
<summary>点击查看答案</summary>

```javascript
function getCity(user) {
  // 使用可选链安全访问嵌套属性
  // 使用空值合并设置默认值
  return user?.address?.city ?? '未知城市'
}

// 测试
const user1 = { name: '张三', address: { city: '北京' } }
const user2 = { name: '李四' }
const user3 = null
const user4 = { name: '王五', address: {} }

console.log(getCity(user1)) // '北京'
console.log(getCity(user2)) // '未知城市'
console.log(getCity(user3)) // '未知城市'
console.log(getCity(user4)) // '未知城市'
```

</details>

---

## 下一章预告

下一章我们会学习 **条件语句**——也就是根据不同情况执行不同代码的能力。你会学到 `if...else`、`switch` 语句，以及如何利用真值假值简化逻辑。掌握这些，你就能让程序"做出判断"了！