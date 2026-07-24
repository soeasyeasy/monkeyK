---
title: "第七章：对象"
description: "对象字面量、this、解构赋值"
---

# 第七章：对象

## 创建对象

```javascript
// 对象字面量
const person = {
  name: '张三',
  age: 25,
  greet() {
    console.log(`你好，我是${this.name}`)
  }
}
```

## 访问属性

```javascript
const person = { name: '张三', age: 25 }

// 点语法
console.log(person.name)  // '张三'

// 方括号语法
console.log(person['age']) // 25

// 动态属性
const key = 'name'
console.log(person[key])   // '张三'
```

## 修改属性

```javascript
const person = { name: '张三', age: 25 }

// 修改
person.age = 26

// 添加
person.city = '北京'

// 删除
delete person.age
```

## 方法简写

```javascript
// 传统写法
const obj = {
  greet: function() {
    console.log('你好')
  }
}

// 简写
const obj2 = {
  greet() {
    console.log('你好')
  }
}
```

## this 关键字

```javascript
const person = {
  name: '张三',
  greet() {
    console.log(`你好，我是${this.name}`)
  }
}

person.greet() // '你好，我是张三'
```

### this 的指向

```javascript
// 对象方法中的 this 指向调用者
const obj = {
  name: '张三',
  greet: function() {
    console.log(this.name)
  }
}

// 箭头函数没有自己的 this
const obj2 = {
  name: '李四',
  greet: () => {
    console.log(this.name) // this 指向全局
  }
}
```

### 改变 this 指向

```javascript
function greet(greeting) {
  console.log(`${greeting}，我是${this.name}`)
}

const person = { name: '张三' }

// call
greet.call(person, '你好')  // '你好，我是张三'

// apply
greet.apply(person, ['你好']) // '你好，我是张三'

// bind
const boundGreet = greet.bind(person)
boundGreet('你好')  // '你好，我是张三'
```

## 解构赋值

```javascript
const person = { name: '张三', age: 25, city: '北京' }

// 基本解构
const { name, age } = person
console.log(name, age) // '张三', 25

// 重命名
const { name: userName, age: userAge } = person
console.log(userName, userAge) // '张三', 25

// 默认值
const { name, age, country = '中国' } = person
console.log(country) // '中国'

// 嵌套解构
const user = {
  name: '张三',
  address: { city: '北京', street: '长安街' }
}
const { address: { city } } = user
console.log(city) // '北京'
```

## 展开运算符

```javascript
const person = { name: '张三', age: 25 }

// 复制对象
const copy = { ...person }

// 合并对象
const merged = { ...person, city: '北京' }
console.log(merged) // { name: '张三', age: 25, city: '北京' }

// 覆盖属性
const updated = { ...person, age: 26 }
console.log(updated) // { name: '张三', age: 26 }
```

## 对象方法

```javascript
const person = { name: '张三', age: 25 }

// Object.keys
console.log(Object.keys(person))  // ['name', 'age']

// Object.values
console.log(Object.values(person)) // ['张三', 25]

// Object.entries
console.log(Object.entries(person)) // [['name', '张三'], ['age', 25]]

// 遍历
for (const [key, value] of Object.entries(person)) {
  console.log(`${key}: ${value}`)
}
```

## 可选链

```javascript
const user = { name: '张三', address: { city: '北京' } }

console.log(user?.name)           // '张三'
console.log(user?.address?.city)  // '北京'
console.log(user?.phone?.number)  // undefined（不会报错）
```

## 计算属性

```javascript
const key = 'name'
const person = {
  [key]: '张三',
  ['age']: 25
}
console.log(person.name) // '张三'
```

## getter 和 setter

```javascript
const person = {
  firstName: '张',
  lastName: '三',
  get fullName() {
    return `${this.firstName}${this.lastName}`
  },
  set fullName(value) {
    const parts = value.split('')
    this.firstName = parts[0]
    this.lastName = parts.slice(1).join('')
  }
}

console.log(person.fullName) // '张三'
person.fullName = '李四'
console.log(person.firstName) // '李'
```

## 总结

对象是 JavaScript 中最重要的数据结构。掌握解构、展开运算符和 this 的指向是编写现代 JavaScript 的关键。
