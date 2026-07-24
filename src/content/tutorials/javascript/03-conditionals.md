---
title: "第三章：条件语句"
description: "if、else、switch、三元表达式"
---

# 第三章：条件语句

## if 语句

```javascript
const age = 20

if (age >= 18) {
  console.log('成年人')
}
```

## if...else

```javascript
const score = 75

if (score >= 60) {
  console.log('及格')
} else {
  console.log('不及格')
}
```

## if...else if...else

```javascript
const score = 85

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

## 嵌套 if

```javascript
const age = 25
const hasTicket = true

if (age >= 18) {
  if (hasTicket) {
    console.log('可以入场')
  } else {
    console.log('请购票')
  }
} else {
  console.log('未成年人需家长陪同')
}
```

## switch 语句

```javascript
const day = 3
let dayName

switch (day) {
  case 1:
    dayName = '星期一'
    break
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
  default:
    dayName = '周末'
}

console.log(dayName) // '星期三'
```

## switch 穿透

```javascript
const grade = 'A'

switch (grade) {
  case 'A':
  case 'B':
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

## 三元运算符

```javascript
const age = 20
const status = age >= 18 ? '成年' : '未成年'
console.log(status) // '成年'

// 嵌套三元（不推荐，可读性差）
const score = 85
const level = score >= 90 ? '优秀' : score >= 60 ? '及格' : '不及格'
```

## 真值与假值

```javascript
// 假值（falsy）
if (false) {}
if (0) {}
if ('') {}
if (null) {}
if (undefined) {}
if (NaN) {}

// 真值（truthy）
if (true) {}
if (1) {}
if ('hello') {}
if ([]) {}  // 空数组也是真值
if ({}) {}  // 空对象也是真值
```

## 短路求值

```javascript
// AND 短路
const a = 0 && 'hello'  // 0（第一个假值）
const b = 1 && 'hello'  // 'hello'

// OR 短路
const c = 0 || 'default'  // 'default'
const d = 'value' || 'default'  // 'value'
```

## 总结

条件语句用于根据不同条件执行不同代码。推荐使用 if...else 处理复杂逻辑，switch 处理多分支等值判断。
