---
title: "第七章：对象"
description: "对象字面量、this、解构赋值，掌握复杂数据组织"
---

# 第七章：对象

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是对象？为什么需要对象？
- `this` 到底指向哪里？为什么有时候会变？
- 对象的浅拷贝和深拷贝有什么区别？
- getter 和 setter 有什么用？

这一章就是为了解答这些问题。我们会学习如何组织和操作复杂的数据结构。

---

## 7.1 为什么需要对象？

### 痛点分析

想象一下，如果没有对象，你要存储一个用户的信息：

```javascript
// ❌ 没有对象：每个属性都要单独声明变量，难以管理
const userName = '张三'
const userAge = 25
const userCity = '北京'
const userEmail = 'zhangsan@example.com'

// 打印用户信息，需要记住所有变量名
console.log(`姓名：${userName}，年龄：${userAge}，城市：${userCity}`)
```

如果有 100 个用户，就要声明 400 个变量！太不现实了！

### 解决方案

用对象把相关属性组织在一起：

```javascript
// ✅ 使用对象：一个变量存储所有相关属性
const user = {
  name: '张三',
  age: 25,
  city: '北京',
  email: 'zhangsan@example.com'
}

// 访问属性很方便
console.log(`姓名：${user.name}，年龄：${user.age}，城市：${user.city}`)
```

> **一句话总结**：对象就像一个信息卡片，可以把相关的数据（属性）和操作（方法）放在一起。

---

## 7.2 核心原理

### 对象的本质

对象是 **键值对的集合**，每个键（属性名）对应一个值（属性值）。

打个比方：

> 想象你去银行开户。
> - `const account = { name: '张三', balance: 1000 }` 就像你的银行账户信息
> - `account.name` 就像账户上的姓名
> - `account.balance` 就像账户余额
> - `account.deposit()` 就像存款操作

### 对象是引用类型

对象是引用类型，变量存储的是指向对象的地址：

```javascript
const obj1 = { name: '张三' }
const obj2 = obj1 // 复制的是地址，不是值

obj2.name = '李四'
console.log(obj1.name) // '李四' ❗ obj1 也被修改了
```

---

## 7.3 创建对象

### 对象字面量（最常用）

```javascript
const person = {
  name: '张三',
  age: 25,
  city: '北京',
  // 方法简写
  greet() {
    console.log(`你好，我是${this.name}`)
  }
}

person.greet() // '你好，我是张三'
```

### 构造函数

```javascript
function Person(name, age) {
  this.name = name
  this.age = age
  this.greet = function() {
    console.log(`你好，我是${this.name}`)
  }
}

const person = new Person('张三', 25)
person.greet() // '你好，我是张三'
```

### Object.create()

```javascript
// 创建一个空对象，指定原型
const obj = Object.create(null)
obj.name = '张三'

// 创建一个继承原型的对象
const parent = { greet() { console.log('你好') } }
const child = Object.create(parent)
child.name = '张三'
child.greet() // '你好'（继承自父对象）
```

---

## 7.4 访问属性

### 点语法

```javascript
const person = { name: '张三', age: 25 }

// 使用点语法访问属性（最常用）
console.log(person.name)  // '张三'
console.log(person.age)   // 25
```

### 方括号语法

```javascript
const person = { name: '张三', age: 25 }

// 使用方括号语法
console.log(person['age']) // 25

// 动态属性名（方括号语法的优势）
const key = 'name'
console.log(person[key])   // '张三'

// 属性名包含特殊字符（必须用方括号）
const obj = { 'user-name': '张三', 'is-active': true }
console.log(obj['user-name'])  // '张三'
console.log(obj['is-active'])  // true
```

---

## 7.5 修改属性

```javascript
const person = { name: '张三', age: 25 }

// 修改现有属性
person.age = 26
console.log(person.age) // 26

// 添加新属性
person.city = '北京'
console.log(person.city) // '北京'

// 删除属性
delete person.age
console.log(person.age) // undefined
```

---

## 7.6 方法简写

```javascript
// 传统写法
const obj = {
  greet: function() {
    console.log('你好')
  }
}

// ES6 简写（推荐）
const obj2 = {
  greet() {
    console.log('你好')
  },
  // 箭头函数作为方法（不推荐，因为没有 this）
  // sayHi: () => console.log(this) // this 指向全局对象
}
```

---

## 7.7 this 关键字

### this 的指向

`this` 指向函数的**调用者**：

```javascript
const person = {
  name: '张三',
  greet() {
    console.log(`你好，我是${this.name}`)
  }
}

person.greet() // '你好，我是张三'（this 指向 person）

// 把方法赋值给变量后，this 指向全局对象
const greet = person.greet
greet() // '你好，我是undefined'（this 指向全局对象）
```

### 改变 this 指向

```javascript
function greet(greeting) {
  console.log(`${greeting}，我是${this.name}`)
}

const person = { name: '张三' }

// call：立即执行，参数逐个传递
greet.call(person, '你好')  // '你好，我是张三'

// apply：立即执行，参数放在数组中
greet.apply(person, ['你好']) // '你好，我是张三'

// bind：返回新函数，不立即执行
const boundGreet = greet.bind(person)
boundGreet('你好')  // '你好，我是张三'
```

### 箭头函数中的 this

箭头函数没有自己的 `this`，它继承外层作用域的 `this`：

```javascript
const obj = {
  name: '张三',
  // ❌ 箭头函数的 this 不指向 obj
  greet: () => {
    console.log(`你好，我是${this.name}`) // this 指向全局对象
  },
  // ✅ 普通函数的 this 指向 obj
  sayHi() {
    console.log(`你好，我是${this.name}`) // '你好，我是张三'
  }
}
```

---

## 7.8 解构赋值

### 基本解构

```javascript
const person = { name: '张三', age: 25, city: '北京' }

// 提取指定属性
const { name, age } = person
console.log(name, age) // '张三', 25

// 提取所有属性
const { ...all } = person
console.log(all) // { name: '张三', age: 25, city: '北京' }
```

### 重命名

```javascript
const person = { name: '张三', age: 25 }

// 重命名属性
const { name: userName, age: userAge } = person
console.log(userName, userAge) // '张三', 25
```

### 默认值

```javascript
const person = { name: '张三', age: 25 }

// 设置默认值
const { name, age, country = '中国' } = person
console.log(country) // '中国'

// 属性不存在时使用默认值
const { phone = '暂无' } = person
console.log(phone) // '暂无'
```

### 嵌套解构

```javascript
const user = {
  name: '张三',
  address: { 
    city: '北京', 
    street: '长安街',
    zipCode: '100000'
  }
}

// 嵌套解构
const { address: { city, street } } = user
console.log(city, street) // '北京', '长安街'

// 嵌套解构 + 默认值
const { address: { district = '朝阳区' } } = user
console.log(district) // '朝阳区'
```

---

## 7.9 展开运算符

```javascript
const person = { name: '张三', age: 25 }

// 复制对象（浅拷贝）
const copy = { ...person }
console.log(copy) // { name: '张三', age: 25 }

// 合并对象
const merged = { ...person, city: '北京' }
console.log(merged) // { name: '张三', age: 25, city: '北京' }

// 覆盖属性（后面的会覆盖前面的）
const updated = { ...person, age: 26 }
console.log(updated) // { name: '张三', age: 26 }

// 合并多个对象
const obj1 = { a: 1 }
const obj2 = { b: 2 }
const obj3 = { c: 3 }
const combined = { ...obj1, ...obj2, ...obj3 }
console.log(combined) // { a: 1, b: 2, c: 3 }
```

---

## 7.10 对象方法

### Object.keys()

```javascript
const person = { name: '张三', age: 25, city: '北京' }

// 获取所有键（属性名）
const keys = Object.keys(person)
console.log(keys) // ['name', 'age', 'city']
```

### Object.values()

```javascript
const person = { name: '张三', age: 25, city: '北京' }

// 获取所有值（属性值）
const values = Object.values(person)
console.log(values) // ['张三', 25, '北京']
```

### Object.entries()

```javascript
const person = { name: '张三', age: 25, city: '北京' }

// 获取所有键值对
const entries = Object.entries(person)
console.log(entries) // [['name', '张三'], ['age', 25], ['city', '北京']]

// 遍历
for (const [key, value] of Object.entries(person)) {
  console.log(`${key}: ${value}`)
}
```

### Object.assign()

```javascript
const target = { a: 1 }
const source = { b: 2 }

// 合并对象（把 source 的属性复制到 target）
Object.assign(target, source)
console.log(target) // { a: 1, b: 2 }

// 创建新对象，不修改原对象
const newObj = Object.assign({}, target, source)
```

---

## 7.11 可选链

可选链用于安全访问嵌套对象的属性：

```javascript
const user = { name: '张三' }

// 安全访问存在的属性
console.log(user?.name)           // '张三'

// 安全访问不存在的属性（不会报错）
console.log(user?.age)            // undefined

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

## 7.12 计算属性

```javascript
// 动态属性名
const key = 'name'
const person = {
  [key]: '张三',
  ['age']: 25,
  // 更复杂的表达式
  [`user-${key}`]: 'user-张三'
}

console.log(person.name)      // '张三'
console.log(person['user-name']) // 'user-张三'
```

---

## 7.13 getter 和 setter

getter 和 setter 用于定义属性的访问器：

```javascript
const person = {
  firstName: '张',
  lastName: '三',
  
  // getter：读取属性时自动调用
  get fullName() {
    return `${this.firstName}${this.lastName}`
  },
  
  // setter：设置属性时自动调用
  set fullName(value) {
    const parts = value.split('')
    this.firstName = parts[0]
    this.lastName = parts.slice(1).join('')
  }
}

// 使用 getter（不需要括号）
console.log(person.fullName) // '张三'

// 使用 setter（像赋值一样）
person.fullName = '李四'
console.log(person.firstName) // '李'
console.log(person.lastName)  // '四'
```

### getter 和 setter 的用途

| 用途 | 说明 |
| --- | --- |
| 计算属性 | 根据其他属性计算值 |
| 数据验证 | 设置属性时进行验证 |
| 数据格式化 | 读取时格式化数据 |
| 封装 | 隐藏内部实现细节 |

---

## 7.14 浅拷贝 vs 深拷贝

### 浅拷贝

浅拷贝只复制第一层属性，如果属性值是对象或数组，复制的是引用：

```javascript
const original = {
  name: '张三',
  address: { city: '北京' }
}

// 浅拷贝（展开运算符）
const shallowCopy = { ...original }

// 修改嵌套对象，原对象也会被修改
shallowCopy.address.city = '上海'
console.log(original.address.city) // '上海' ❗
```

### 深拷贝

深拷贝会递归复制所有层级，创建完全独立的副本：

```javascript
const original = {
  name: '张三',
  address: { city: '北京' }
}

// 方法一：JSON 序列化（简单但有局限性）
const deepCopy1 = JSON.parse(JSON.stringify(original))

// 修改嵌套对象，原对象不受影响
deepCopy1.address.city = '上海'
console.log(original.address.city) // '北京' ✅

// 方法二：递归函数（更灵活）
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }
  
  const clone = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key])
    }
  }
  return clone
}

const deepCopy2 = deepClone(original)
```

> **注意**：`JSON.parse(JSON.stringify())` 不能处理函数、日期、正则等特殊类型。

---

## 7.15 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 创建对象 | 对象字面量 `{}`、构造函数、`Object.create()` |
| 访问属性 | 点语法 `obj.key`、方括号语法 `obj[key]` |
| 修改属性 | `obj.key = value`、`delete obj.key` |
| this | 指向调用者，箭头函数继承外层 this |
| 解构赋值 | `const { a, b } = obj` |
| 展开运算符 | `{ ...obj }` 合并/复制对象 |
| 可选链 | `obj?.a?.b` 安全访问嵌套属性 |
| getter/setter | 定义属性的访问器 |
| Object.keys/values/entries | 获取对象的键、值、键值对 |

---

## 7.16 新手常见误区

### 误区 1：`const` 声明的对象完全不能修改

**错！** `const` 只是不能重新赋值，对象内部属性可以修改。

```javascript
const person = { name: '张三' }

// ✅ 可以修改内部属性
person.name = '李四'
console.log(person.name) // '李四'

// ❌ 不能重新赋值整个变量
// person = { name: '王五' }
// Uncaught TypeError
```

### 误区 2：对象赋值就是复制

**错！** 对象是引用类型，赋值复制的是地址。

```javascript
// ❌ 错误：只是复制了地址
const original = { name: '张三' }
const copy = original

copy.name = '李四'
console.log(original.name) // '李四' ❗

// ✅ 正确：使用展开运算符复制（浅拷贝）
const copy2 = { ...original }
copy2.name = '王五'
console.log(original.name) // '李四' ✅
```

### 误区 3：箭头函数可以作为对象方法

**错！** 箭头函数没有自己的 `this`，不适合作为对象方法。

```javascript
const obj = {
  name: '张三',
  // ❌ 错误：箭头函数的 this 不指向 obj
  greet: () => {
    console.log(`你好，我是${this.name}`) // '你好，我是undefined'
  },
  // ✅ 正确：使用普通函数
  sayHi() {
    console.log(`你好，我是${this.name}`) // '你好，我是张三'
  }
}
```

### 误区 4：方括号语法和点语法完全一样

**错！** 方括号语法支持动态属性名和特殊字符。

```javascript
const obj = { 'user-name': '张三' }

// ✅ 使用方括号语法
console.log(obj['user-name']) // '张三'

// ❌ 使用点语法会报错
// console.log(obj.user-name) // Uncaught ReferenceError

// ✅ 动态属性名（必须用方括号）
const key = 'user-name'
console.log(obj[key]) // '张三'
```

---

## 7.17 动手练习

### 练习 1：基础练习

写一个函数，接收一个用户对象，返回用户的完整信息字符串。

<details>
<summary>点击查看答案</summary>

```javascript
function formatUser(user) {
  // 使用解构获取属性
  const { name, age, city = '未知城市', email = '暂无邮箱' } = user
  return `姓名：${name}，年龄：${age}，城市：${city}，邮箱：${email}`
}

// 测试
const user1 = { name: '张三', age: 25, city: '北京' }
const user2 = { name: '李四', age: 30, email: 'lisi@example.com' }

console.log(formatUser(user1))
// '姓名：张三，年龄：25，城市：北京，邮箱：暂无邮箱'

console.log(formatUser(user2))
// '姓名：李四，年龄：30，城市：未知城市，邮箱：lisi@example.com'
```

</details>

### 练习 2：进阶练习

写一个函数，合并两个对象，如果有相同属性，后面的对象覆盖前面的。

<details>
<summary>点击查看答案</summary>

```javascript
function mergeObjects(obj1, obj2) {
  // 使用展开运算符合并
  return { ...obj1, ...obj2 }
}

// 测试
const obj1 = { a: 1, b: 2, c: 3 }
const obj2 = { b: 20, d: 4 }

const merged = mergeObjects(obj1, obj2)
console.log(merged) // { a: 1, b: 20, c: 3, d: 4 }

// 验证原对象不变
console.log(obj1) // { a: 1, b: 2, c: 3 }
console.log(obj2) // { b: 20, d: 4 }
```

</details>

### 练习 3（挑战）：综合练习

写一个深拷贝函数，能够复制任意嵌套深度的对象和数组。

<details>
<summary>点击查看答案</summary>

```javascript
function deepClone(obj) {
  // 如果是基本类型，直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  // 如果是数组，递归复制每个元素
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }
  
  // 如果是对象，递归复制每个属性
  const clone = {}
  for (const key in obj) {
    // 只复制自身属性，不复制原型链上的属性
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key])
    }
  }
  
  return clone
}

// 测试
const original = {
  name: '张三',
  age: 25,
  address: {
    city: '北京',
    street: '长安街'
  },
  hobbies: ['读书', '运动', { type: '篮球', level: '业余' }]
}

const cloned = deepClone(original)

// 修改克隆对象
cloned.name = '李四'
cloned.address.city = '上海'
cloned.hobbies[2].level = '专业'

// 验证原对象不变
console.log(original.name)                 // '张三' ✅
console.log(original.address.city)         // '北京' ✅
console.log(original.hobbies[2].level)     // '业余' ✅

console.log(cloned.name)                   // '李四' ✅
console.log(cloned.address.city)           // '上海' ✅
console.log(cloned.hobbies[2].level)       // '专业' ✅
```

</details>

---

## 下一章预告

下一章我们会学习 **DOM 操作**——也就是 JavaScript 与网页交互的能力。你会学到如何选择元素、修改内容、创建节点等。掌握这些，你就能写出动态的网页了！