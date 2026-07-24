---
title: "第四章：循环"
description: "for、while、do-while、for...of"
---

# 第四章：循环

## for 循环

```javascript
for (let i = 0; i < 5; i++) {
  console.log(i) // 0, 1, 2, 3, 4
}
```

## while 循环

```javascript
let count = 0
while (count < 5) {
  console.log(count)
  count++
}
```

## do...while 循环

```javascript
let num = 0
do {
  console.log(num)
  num++
} while (num < 5)
```

## for...of 循环

```javascript
const fruits = ['苹果', '香蕉', '橙子']

for (const fruit of fruits) {
  console.log(fruit)
}
```

## for...in 循环

```javascript
const person = { name: '张三', age: 25, city: '北京' }

for (const key in person) {
  console.log(`${key}: ${person[key]}`)
}
```

## 遍历数组

```javascript
const numbers = [1, 2, 3, 4, 5]

// forEach
numbers.forEach((num, index) => {
  console.log(`${index}: ${num}`)
})

// map（返回新数组）
const doubled = numbers.map(num => num * 2)
console.log(doubled) // [2, 4, 6, 8, 10]

// filter（过滤）
const evens = numbers.filter(num => num % 2 === 0)
console.log(evens) // [2, 4]

// reduce（累积）
const sum = numbers.reduce((acc, num) => acc + num, 0)
console.log(sum) // 15
```

## break 和 continue

```javascript
// break：跳出循环
for (let i = 0; i < 10; i++) {
  if (i === 5) break
  console.log(i) // 0, 1, 2, 3, 4
}

// continue：跳过本次
for (let i = 0; i < 5; i++) {
  if (i === 2) continue
  console.log(i) // 0, 1, 3, 4
}
```

## 嵌套循环

```javascript
for (let i = 1; i <= 3; i++) {
  for (let j = 1; j <= 3; j++) {
    console.log(`${i} x ${j} = ${i * j}`)
  }
}
```

## 无限循环

```javascript
// 危险：无限循环
// while (true) {
//   console.log('永远运行')
// }

// 安全的无限循环（带 break）
while (true) {
  const input = prompt('输入 quit 退出')
  if (input === 'quit') break
}
```

## 性能优化

```javascript
// 缓存数组长度
const arr = [1, 2, 3, 4, 5]
for (let i = 0, len = arr.length; i < len; i++) {
  console.log(arr[i])
}

// 倒序循环
for (let i = arr.length - 1; i >= 0; i--) {
  console.log(arr[i])
}
```

## 总结

JavaScript 提供了多种循环方式。for...of 适合遍历可迭代对象，for...in 适合遍历对象属性，数组方法（map、filter、reduce）更函数式。
