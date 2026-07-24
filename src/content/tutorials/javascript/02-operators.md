---
title: "第二章：运算符"
description: "算术、比较、逻辑、三元运算符"
---

# 第二章：运算符

## 算术运算符

```javascript
const a = 10
const b = 3

console.log(a + b)  // 13 加法
console.log(a - b)  // 7  减法
console.log(a * b)  // 30 乘法
console.log(a / b)  // 3.333... 除法
console.log(a % b)  // 1  取余
console.log(a ** b) // 1000 幂运算
```

## 自增自减

```javascript
let x = 5
x++  // x = 6
x--  // x = 5
++x  // x = 6（先加后用）
--x  // x = 5（先减后用）
```

## 赋值运算符

```javascript
let y = 10
y += 5  // y = 15
y -= 3  // y = 12
y *= 2  // y = 24
y /= 4  // y = 6
y %= 4  // y = 2
y **= 3 // y = 8
```

## 比较运算符

```javascript
console.log(5 == '5')   // true  （宽松相等，会类型转换）
console.log(5 === '5')  // false （严格相等，不转换类型）
console.log(5 != '5')   // false
console.log(5 !== '5')  // true

console.log(5 > 3)   // true
console.log(5 < 3)   // false
console.log(5 >= 5)  // true
console.log(5 <= 4)  // false
```

## 逻辑运算符

```javascript
// AND
console.log(true && true)   // true
console.log(true && false)  // false

// OR
console.log(true || false)  // true
console.log(false || false) // false

// NOT
console.log(!true)   // false
console.log(!false)  // true
```

## 空值合并运算符

```javascript
const value = null ?? '默认值'  // '默认值'
const zero = 0 ?? 10            // 0（0 不是 null/undefined）
const empty = '' ?? '默认'      // ''（空字符串不是 null/undefined）
```

## 可选链

```javascript
const user = { name: '张三' }
console.log(user?.age)      // undefined（不会报错）
console.log(user?.address?.city) // undefined
```

## 三元运算符

```javascript
const age = 20
const status = age >= 18 ? '成年' : '未成年'
console.log(status) // '成年'
```

## typeof 运算符

```javascript
typeof 'hello'  // 'string'
typeof 42       // 'number'
typeof true     // 'boolean'
```

## instanceof 运算符

```javascript
const arr = [1, 2, 3]
console.log(arr instanceof Array)  // true
console.log(arr instanceof Object) // false
```

## 运算符优先级

| 优先级 | 运算符 |
| --- | --- |
| 1 | () 括号 |
| 2 | ** 幂 |
| 3 | * / % 乘除余 |
| 4 | + - 加减 |
| 5 | > < >= <= 比较 |
| 6 | === !== 严格比较 |
| 7 | && 逻辑与 |
| 8 | \|\| 逻辑或 |
| 9 | ?? 空值合并 |
| 10 | = 赋值 |

## 总结

JavaScript 提供了丰富的运算符，推荐使用严格相等（===）和空值合并（??）等现代运算符。
