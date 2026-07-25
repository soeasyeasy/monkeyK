# 第十四章：字符串算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 字符串算法有哪些常见的应用场景？
- 如何高效地在文本中查找某个模式？
- 什么是字符串匹配算法？它们之间有什么区别？
- 在实际开发中，如何处理大量的文本数据？

这一章就是为了解答这些问题。我们会从字符串的基础操作讲起，逐步深入到模式匹配、回文判断、字符串压缩等经典算法，最后通过实战掌握文本处理的核心技巧。

---

## 14.1 为什么需要字符串算法？

### 痛点分析

想象一下这些场景：

**场景一**：你在写一个文本编辑器，需要实现"查找并替换"功能。用户输入一段文本和一个关键词，你要快速找到所有匹配的位置。

**场景二**：你在开发一个搜索引擎，用户输入关键词，你要从数百万个网页中找出包含这个关键词的页面。

**场景三**：你在做 DNA 序列分析，要在一条长长的基因序列中查找特定的片段。

这些问题的核心都是**字符串匹配**——在一个长文本中快速找到目标模式。

### 生活化类比

> 字符串算法就像是在一本书中找特定的内容：
>
> - **暴力匹配**：从第一页开始，一页一页翻，逐字对比
> - **KMP 算法**：先分析模式的特点，遇到不匹配时跳过一些位置，不用从头开始
> - **Rabin-Karp**：给每段文本算一个"指纹"，只对比指纹相同的部分

### 字符串算法对比

| 算法 | 时间复杂度 | 适用场景 | 特点 |
| ---- | ---------- | -------- | ---- |
| 暴力匹配 | O(n*m) | 短文本、小数据量 | 简单直观，但效率低 |
| KMP | O(n+m) | 长文本、频繁匹配 | 预处理模式串，避免回溯 |
| Rabin-Karp | O(n+m) 平均 | 多模式匹配 | 使用哈希，快速筛选 |
| Boyer-Moore | O(n/m) 最好 | 长模式串 | 从后往前匹配，跳跃式搜索 |

> **一句话总结**：字符串算法的核心目标是高效地在文本中定位、匹配和处理模式。

---

## 14.2 核心原理讲解

### 一、暴力匹配（Brute Force）

**底层原理**：

从文本的第一个字符开始，逐个与模式串对比。如果匹配失败，回到文本的下一个位置，重新开始匹配。

**通俗类比**：

> 就像在一篇文章中找"算法"这个词——你从第一个字开始，看是不是"算"，如果是，再看下一个字是不是"法"。如果不是，就从第二个字重新开始。

**执行过程**：

```
文本：ABABCABAB
模式：ABAB

第1轮：ABABC vs ABAB → 前4个字符匹配，但第5个不匹配
第2轮：BABCA vs ABAB → 第1个字符就不匹配
第3轮：ABCAB vs ABAB → 第1个字符匹配，第2个不匹配
第4轮：BCABA vs ABAB → 第1个字符就不匹配
第5轮：CABAB vs ABAB → 第1个字符就不匹配
第6轮：ABABA vs ABAB → 匹配成功！返回位置 5
```

### 二、KMP 算法（Knuth-Morris-Pratt）

**底层原理**：

KMP 的核心思想是：当匹配失败时，利用已经匹配的信息，跳过一些不必要的比较。

通过预处理模式串，构建一个"部分匹配表"（也叫 next 数组或 failure 函数），记录模式串中每个位置的最长相同前后缀长度。

**通俗类比**：

> 就像你在背单词"algorithm"，当你背到"algor"发现背错了，你不需要从"a"重新开始，因为你知道"al"是对的，可以直接从"al"后面继续。

**执行过程**：

```
文本：ABABCABAB
模式：ABAB

预处理模式串，构建 next 数组：
A B A B
0 0 1 2

匹配过程：
第1轮：ABABC vs ABAB → 前4个匹配，第5个失败
       根据 next 数组，模式可以向右滑动 2 位（不用从头开始）
第2轮：ABABC vs   ABAB → 匹配成功！
```

### 三、Rabin-Karp 算法

**底层原理**：

使用滚动哈希（rolling hash）快速计算文本子串的哈希值，只有当哈希值相同时才进行逐字符比较。

**通俗类比**：

> 就像查字典时，你先看拼音索引（哈希值），找到对应的页码后，再逐字确认是不是你要找的词。

**执行过程**：

```
文本：ABCDBCDA
模式：BCD

假设哈希函数：hash("BCD") = 2*3 + 3*2 + 4*1 = 16

第1轮：hash("ABC") = 1*3 + 2*2 + 3*1 = 10 ≠ 16，跳过
第2轮：hash("BCD") = 16 = 16，逐字比较 → 匹配成功！
```

---

## 14.3 基础用法

### 一、暴力匹配

```javascript
// 暴力匹配函数
function bruteForceSearch(text, pattern) {
  const n = text.length;    // 文本长度
  const m = pattern.length; // 模式串长度

  // 遍历文本的每个可能起始位置
  for (let i = 0; i <= n - m; i++) {
    let j = 0; // 模式串的当前比较位置

    // 逐个字符比较
    while (j < m && text[i + j] === pattern[j]) {
      j++; // 匹配成功，继续比较下一个字符
    }

    // 如果 j 等于 m，说明模式串完全匹配
    if (j === m) {
      return i; // 返回匹配的起始位置
    }
  }

  // 没找到，返回 -1
  return -1;
}

// 测试
const text = "ABABCABAB";
const pattern = "ABAB";
console.log(bruteForceSearch(text, pattern)); // 输出: 5
```

**正确写法**：

```javascript
// ✅ 正确：外层循环条件是 i <= n - m
function bruteForceSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;

  for (let i = 0; i <= n - m; i++) { // 注意：是 <= 不是 <
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) {
      j++;
    }
    if (j === m) return i;
  }
  return -1;
}
```

**错误写法**：

```javascript
// ❌ 错误：i < n - m 会漏掉最后一个可能的匹配位置
function bruteForceSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;

  for (let i = 0; i < n - m; i++) { // 错误：应该是 <=
    // ...
  }
}
```

### 二、KMP 算法

```javascript
// KMP 算法主函数
function kmpSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;

  // 如果模式串为空，直接返回 0
  if (m === 0) return 0;

  // 构建 next 数组（部分匹配表）
  const next = buildNextArray(pattern);

  let i = 0; // 文本的当前位置
  let j = 0; // 模式串的当前位置

  while (i < n) {
    // 字符匹配，两个指针都前进
    if (text[i] === pattern[j]) {
      i++;
      j++;
    }

    // 模式串完全匹配
    if (j === m) {
      return i - j; // 返回匹配的起始位置
    }
    // 匹配失败，且 j > 0，根据 next 数组回退
    else if (i < n && text[i] !== pattern[j]) {
      if (j !== 0) {
        j = next[j - 1]; // 回退到 next 数组记录的位置
      } else {
        i++; // j === 0 时，直接移动文本指针
      }
    }
  }

  return -1; // 没找到
}

// 构建 KMP 的 next 数组
function buildNextArray(pattern) {
  const m = pattern.length;
  const next = new Array(m).fill(0); // 初始化 next 数组

  let len = 0; // 最长相同前后缀的长度
  let i = 1;   // 从第二个字符开始

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;           // 前后缀长度加 1
      next[i] = len;   // 记录当前位置的 next 值
      i++;
    } else {
      if (len !== 0) {
        len = next[len - 1]; // 回退到前一个 next 值
      } else {
        next[i] = 0; // 没有相同前后缀
        i++;
      }
    }
  }

  return next;
}

// 测试
const text = "ABABCABAB";
const pattern = "ABAB";
console.log(kmpSearch(text, pattern)); // 输出: 5

// 查看 next 数组
console.log(buildNextArray("ABAB")); // 输出: [0, 0, 1, 2]
```

### 三、Rabin-Karp 算法

```javascript
// Rabin-Karp 算法
function rabinKarpSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const d = 256; // 字符集大小（ASCII）
  const q = 101; // 一个质数，用于取模

  if (m > n) return -1;

  let pHash = 0; // 模式串的哈希值
  let tHash = 0; // 文本窗口的哈希值
  let h = 1;     // d^(m-1) % q

  // 计算 h = d^(m-1) % q
  for (let i = 0; i < m - 1; i++) {
    h = (h * d) % q;
  }

  // 计算初始哈希值
  for (let i = 0; i < m; i++) {
    pHash = (d * pHash + pattern.charCodeAt(i)) % q;
    tHash = (d * tHash + text.charCodeAt(i)) % q;
  }

  // 滑动窗口
  for (let i = 0; i <= n - m; i++) {
    // 哈希值相等，逐字符比较（防止哈希冲突）
    if (pHash === tHash) {
      let match = true;
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return i; // 匹配成功
    }

    // 计算下一个窗口的哈希值（滚动哈希）
    if (i < n - m) {
      tHash = (d * (tHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
      // 确保哈希值为正数
      if (tHash < 0) tHash += q;
    }
  }

  return -1; // 没找到
}

// 测试
const text = "ABCDBCDA";
const pattern = "BCD";
console.log(rabinKarpSearch(text, pattern)); // 输出: 1
```

### 四、JavaScript 内置方法

```javascript
// JavaScript 提供了高效的字符串查找方法
const text = "Hello, world! Welcome to the world of programming.";

// indexOf：查找第一次出现的位置
console.log(text.indexOf("world")); // 输出: 7

// lastIndexOf：查找最后一次出现的位置
console.log(text.lastIndexOf("world")); // 输出: 26

// includes：判断是否包含
console.log(text.includes("programming")); // 输出: true
console.log(text.includes("java"));        // 输出: false

// startsWith：判断是否以某字符串开头
console.log(text.startsWith("Hello")); // 输出: true

// endsWith：判断是否以某字符串结尾
console.log(text.endsWith("programming.")); // 输出: true
```

---

## 14.4 进阶用法

### 一、查找所有匹配位置

```javascript
// 查找文本中所有模式串的出现位置
function findAllOccurrences(text, pattern) {
  const results = []; // 存储所有匹配位置
  const n = text.length;
  const m = pattern.length;

  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) {
      j++;
    }
    if (j === m) {
      results.push(i); // 记录匹配位置
    }
  }

  return results;
}

// 测试
const text = "ABABABAB";
const pattern = "ABA";
console.log(findAllOccurrences(text, pattern)); // 输出: [0, 2, 4]
```

### 二、回文判断

```javascript
// 判断一个字符串是否是回文（正读反读都一样）
function isPalindrome(str) {
  // 去除非字母数字字符，并转为小写
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // 双指针法
  let left = 0;                    // 左指针
  let right = cleaned.length - 1;  // 右指针

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false; // 不对称，不是回文
    }
    left++;  // 左指针右移
    right--; // 右指针左移
  }

  return true; // 所有字符都对称，是回文
}

// 测试
console.log(isPalindrome("A man, a plan, a canal: Panama")); // 输出: true
console.log(isPalindrome("racecar"));                        // 输出: true
console.log(isPalindrome("hello"));                          // 输出: false
```

### 三、最长回文子串

```javascript
// 查找字符串中的最长回文子串（中心扩展法）
function longestPalindrome(s) {
  if (!s || s.length === 0) return "";

  let start = 0; // 最长回文的起始位置
  let maxLen = 1; // 最长回文的长度

  // 中心扩展函数
  function expandAroundCenter(left, right) {
    // 向两边扩展，直到不匹配
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    // 返回回文长度
    return right - left - 1;
  }

  // 遍历每个字符，作为中心
  for (let i = 0; i < s.length; i++) {
    // 奇数长度回文（以 i 为中心）
    const len1 = expandAroundCenter(i, i);
    // 偶数长度回文（以 i 和 i+1 为中心）
    const len2 = expandAroundCenter(i, i + 1);

    // 取较长的回文
    const len = Math.max(len1, len2);

    // 更新最长回文
    if (len > maxLen) {
      maxLen = len;
      start = i - Math.floor((len - 1) / 2);
    }
  }

  return s.substring(start, start + maxLen);
}

// 测试
console.log(longestPalindrome("babad")); // 输出: "bab" 或 "aba"
console.log(longestPalindrome("cbbd"));  // 输出: "bb"
```

### 四、字符串压缩

```javascript
// 字符串压缩：将连续重复字符压缩为"字符+数量"的形式
function compressString(str) {
  if (!str || str.length === 0) return str;

  let result = "";     // 压缩后的字符串
  let count = 1;       // 当前字符的计数

  for (let i = 1; i <= str.length; i++) {
    // 如果当前字符与前一个相同，计数加 1
    if (i < str.length && str[i] === str[i - 1]) {
      count++;
    } else {
      // 否则，将字符和计数追加到结果
      result += str[i - 1] + count;
      count = 1; // 重置计数
    }
  }

  // 如果压缩后更长，返回原字符串
  return result.length < str.length ? result : str;
}

// 测试
console.log(compressString("aabcccccaaa")); // 输出: "a2b1c5a3"
console.log(compressString("abcdef"));      // 输出: "abcdef"（压缩后更长，返回原串）
```

---

## 14.5 核心知识点总结

| 知识点 | 说明 |
| ------ | ---- |
| 暴力匹配 | 逐个位置尝试，时间复杂度 O(n*m) |
| KMP 算法 | 利用已匹配信息避免回溯，时间复杂度 O(n+m) |
| Rabin-Karp | 使用滚动哈希快速筛选，平均 O(n+m) |
| 回文判断 | 双指针法，从两端向中间比较 |
| 字符串压缩 | 统计连续重复字符，压缩表示 |
| JavaScript 内置方法 | indexOf、includes、startsWith 等 |

---

## 14.6 新手常见误区

### 误区 1：暴力匹配效率太低，永远不要用

**错！** 暴力匹配在短文本或小数据量场景下是最简单直接的选择。

**解释**：JavaScript 的内置方法（如 indexOf）底层已经高度优化，对于大多数日常场景已经足够快。

**正确做法**：

```javascript
// 日常开发：直接用内置方法
const text = "Hello, world!";
const pos = text.indexOf("world"); // 简单高效

// 只有当性能成为瓶颈时，才考虑 KMP 等高级算法
```

### 误区 2：KMP 的 next 数组很难理解

**不难！** next 数组的核心思想是"最长相同前后缀"。

**解释**：next[i] 表示模式串中前 i+1 个字符的最长相同前后缀长度。

**正确做法**：

```javascript
// 手动计算 next 数组
// 模式串：A B A B
// 位置：  0 1 2 3
// next：  0 0 1 2

// A: 没有前后缀，next[0] = 0
// AB: 前缀 A，后缀 B，不相同，next[1] = 0
// ABA: 前缀 A，后缀 A，相同，next[2] = 1
// ABAB: 前缀 AB，后缀 AB，相同，next[3] = 2
```

### 误区 3：哈希函数越复杂越好

**不一定！** 哈希函数需要在速度和冲突率之间平衡。

**解释**：过于复杂的哈希函数计算开销大，简单的哈希函数可能冲突多。

**正确做法**：

```javascript
// 简单的哈希函数（适用于教学）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = hash * 31 + str.charCodeAt(i); // 31 是常用的质数
  }
  return hash;
}

// 实际开发：使用成熟的哈希库（如 crypto-js）
```

### 误区 4：字符串匹配只能用算法库

**错！** 理解底层算法有助于写出更高效的代码。

**解释**：知道 KMP 的原理后，你会明白为什么某些场景下内置方法更快，某些场景下需要自定义算法。

**正确做法**：

```javascript
// 了解原理，灵活选择
// - 简单查找：indexOf、includes
// - 正则匹配：match、replace
// - 复杂场景：自定义 KMP 或其他算法
```

---

## 14.7 动手练习

### 练习 1：基础练习 - 统计子串出现次数

编写一个函数 `countOccurrences(text, pattern)`，统计模式串在文本中出现的次数（允许重叠）。

<details>
<summary>点击查看答案</summary>

```javascript
function countOccurrences(text, pattern) {
  let count = 0; // 计数器
  const n = text.length;
  const m = pattern.length;

  // 遍历文本
  for (let i = 0; i <= n - m; i++) {
    let match = true;
    // 逐个字符比较
    for (let j = 0; j < m; j++) {
      if (text[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) count++; // 匹配成功，计数加 1
  }

  return count;
}

// 测试
console.log(countOccurrences("ABABABA", "ABA")); // 输出: 3（位置 0, 2, 4）
console.log(countOccurrences("AAAAA", "AA"));    // 输出: 4（位置 0, 1, 2, 3）
```

</details>

### 练习 2：进阶练习 - 验证回文串

编写一个函数 `isPalindrome(str)`，判断一个字符串是否是回文（忽略大小写和非字母数字字符）。

<details>
<summary>点击查看答案</summary>

```javascript
function isPalindrome(str) {
  // 清理字符串：只保留字母数字，并转为小写
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // 双指针法
  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false; // 不对称
    }
    left++;
    right--;
  }

  return true;
}

// 测试
console.log(isPalindrome("A man, a plan, a canal: Panama")); // 输出: true
console.log(isPalindrome("race a car"));                     // 输出: false
```

</details>

### 练习 3（挑战）：综合练习 - 实现 strStr()

实现 `strStr(text, pattern)` 函数，返回模式串在文本中第一次出现的位置。如果不存在，返回 -1。要求使用 KMP 算法。

<details>
<summary>点击查看答案</summary>

```javascript
function strStr(text, pattern) {
  if (pattern === "") return 0;

  // 构建 next 数组
  const next = buildNext(pattern);

  let i = 0; // 文本指针
  let j = 0; // 模式指针

  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
      if (j === pattern.length) {
        return i - j; // 匹配成功
      }
    } else if (j > 0) {
      j = next[j - 1]; // 回退
    } else {
      i++;
    }
  }

  return -1; // 没找到
}

function buildNext(pattern) {
  const next = [0];
  let len = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      next[i] = len;
      i++;
    } else if (len > 0) {
      len = next[len - 1];
    } else {
      next[i] = 0;
      i++;
    }
  }

  return next;
}

// 测试
console.log(strStr("hello", "ll"));    // 输出: 2
console.log(strStr("aaaaa", "bba"));   // 输出: -1
console.log(strStr("ABABAB", "ABAB")); // 输出: 0
```

</details>

---

## 14.8 下一章预告

下一章我们将学习 **高级数据结构**——树、图、堆等复杂数据结构的原理和应用。你会学到二叉树遍历、图的搜索、堆的实现等核心算法，这些是解决复杂问题的基础。

| 算法 | 时间复杂度 | 应用场景 |
| ---- | ---------- | -------- |
| 暴力匹配 | O(n*m) | 短文本查找 |
| KMP | O(n+m) | 长文本匹配 |
| Rabin-Karp | O(n+m) 平均 | 多模式匹配 |
| 回文判断 | O(n) | 字符串对称性检测 |
