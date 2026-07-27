---
title: "第十四章：Git Hooks"
description: "使用 Git 钩子实现自动化检查和流程控制"
---

# 第十四章：Git Hooks

## 本章导读

上一章我们学了团队协作规范，但规范再好也得靠人自觉。你有没有遇到过这些情况：

- 提交代码时忘了跑 lint 检查，结果线上代码格式乱七八糟？
- 提交信息随手写了个"fix"，事后根本不知道改了什么？
- 每次都要手动跑检查命令，觉得特别烦？

这一章我们要学的 Git Hooks 就是来解决这些问题的。学完这一章，你会掌握：

- Git Hooks 是什么，怎么工作的
- 怎么用 Husky 管理钩子，让团队共享配置
- 怎么用 lint-staged 只检查改动的文件
- 怎么用 commitlint 强制提交信息规范

---

## 1 为什么需要 Git Hooks？

### 痛点分析

先来看看没有 Git Hooks 时，团队会遇到什么问题：

```
场景一：
小王提交了一段代码，没跑 lint，格式一塌糊涂
-> 代码审查者花 20 分钟指出格式问题
-> 小王改完再推，审查者再看，来回折腾

场景二：
小李提交信息写了个"改了点东西"
-> 三天后出了 bug，想找到那次提交
-> 翻遍历史记录，全是"改了点东西"、"fix"、"update"
-> 根本找不到

场景三：
小陈忘了跑测试就推送了代码
-> CI 构建失败，整个团队的流水线被阻塞
-> 大家等着小陈修复，白白浪费时间
```

这些问题的本质是：**靠人自觉是不可靠的**。人会忘事，会偷懒，会犯错。

打个比方：

> Git Hooks 就像地铁的安检门。你不用记得带身份证（手动跑检查），安检门会自动帮你检查（钩子自动执行）。没带身份证？过不去。代码不合格？提交不了。

### 解决方案

Git Hooks（Git 钩子）是 Git 在特定事件（比如提交、推送）时自动执行的脚本。你可以把它想象成 Git 的"闹钟"：

- 提交前自动跑 lint
- 提交时自动检查提交信息格式
- 推送前自动跑测试

> **一句话总结**：Git Hooks 把"人记得做"变成"系统自动做"，从根源上杜绝低级错误。

---

## 2 核心原理

### Git Hooks 的工作机制

Git 在执行各种操作时，会在特定时间点自动查找并执行对应的钩子脚本。这些脚本就放在 `.git/hooks/` 目录下。

打个比方：

> Git Hooks 就像门铃。你按门铃（触发 Git 操作），门铃自动响（执行钩子脚本）。不同的门有不同的门铃（不同的钩子对应不同的事件）。

```
Git 操作流程：

git commit
    |
    v
[pre-commit]  <-- 提交前：跑 lint、格式化
    |
    v
[prepare-commit-msg]  <-- 生成提交信息前：自动填充模板
    |
    v
[commit-msg]  <-- 提交信息写好后：验证格式
    |
    v
[post-commit]  <-- 提交完成后：发通知、记日志
```

### 钩子存放位置

```bash
# 查看你的 .git/hooks 目录，里面有很多 .sample 模板文件
ls .git/hooks/

# 输出示例（这些都是模板，去掉 .sample 后缀就能用）：
# applypatch-msg.sample
# commit-msg.sample
# pre-commit.sample
# pre-push.sample
# post-commit.sample
# ...
```

### 客户端钩子 vs 服务端钩子

| 分类 | 钩子 | 触发时机 | 用途 |
| --- | --- | --- | --- |
| 客户端 | pre-commit | 执行 git commit 前 | 代码格式化、lint 检查 |
| 客户端 | prepare-commit-msg | 编辑提交信息前 | 自动生成提交信息模板 |
| 客户端 | commit-msg | 提交信息编辑后 | 验证提交信息格式 |
| 客户端 | post-commit | 提交完成后 | 发通知、记录日志 |
| 客户端 | pre-push | 执行 git push 前 | 运行测试 |
| 服务端 | pre-receive | 接收推送前 | 权限检查、分支保护 |
| 服务端 | update | 每个分支更新前 | 细粒度分支控制 |
| 服务端 | post-receive | 接收推送后 | 自动部署、发通知 |

> 客户端钩子在你本地 Git 操作时触发，服务端钩子在远程仓库收到推送时触发。我们日常开发主要用的是客户端钩子。

---

## 3 使用本地钩子

### 创建 pre-commit 钩子

pre-commit 是最常用的钩子，在提交前自动执行检查。

```bash
# 第一步：复制模板文件（去掉 .sample 后缀）
cp .git/hooks/pre-commit.sample .git/hooks/pre-commit

# 第二步：编辑钩子脚本
```

编辑 `.git/hooks/pre-commit`：

```bash
#!/bin/sh

# 运行 ESLint 检查代码规范
echo "正在运行 ESLint 检查..."
npm run lint

# $? 是上一个命令的返回值，0 表示成功，非 0 表示失败
if [ $? -ne 0 ]; then
  echo "ESLint 检查未通过，提交已中止。"
  echo "请先修复代码规范问题再提交。"
  exit 1  # 退出码为 1，表示失败，Git 会中止提交
fi

# 运行单元测试
echo "正在运行测试..."
npm test

if [ $? -ne 0 ]; then
  echo "测试未通过，提交已中止。"
  exit 1  # 测试失败也中止提交
fi

echo "所有检查通过，允许提交。"
```

### 创建 commit-msg 钩子

commit-msg 钩子用来验证提交信息是否符合规范：

```bash
#!/bin/sh

# 读取提交信息（Git 会把信息存在临时文件里，$1 就是文件路径）
commit_msg=$(cat "$1")

# 用正则表达式检查是否符合 Conventional Commits 格式
# 格式要求：type(scope): subject 或 type: subject
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.*\))?: .+"; then
  echo "提交信息格式不符合规范！"
  echo ""
  echo "正确格式：<type>(<scope>): <subject>"
  echo "示例：feat(auth): 添加登录功能"
  echo ""
  echo "可用的 type：feat, fix, docs, style, refactor, test, chore"
  exit 1  # 格式不对，中止提交
fi
```

### 本地钩子的问题

本地钩子有一个致命缺陷：**不能随代码仓库共享给团队**。

因为 `.git/hooks/` 目录不在版本控制范围内，每个开发者 clone 项目后，需要手动配置钩子。这就导致：

- 小王配了钩子，小李忘了配
- 小王的代码有检查，小李的没有
- 团队规范形同虚设

所以我们需要一个工具来解决这个问题，这就是 Husky。

---

## 4 使用 Husky（推荐方案）

### 什么是 Husky

Husky 是一个流行的 Git Hooks 管理工具，它的核心作用是：

> 把 Git Hooks 的配置放进项目代码里，这样团队成员安装依赖后就能自动共享钩子配置。

打个比方：

> 本地钩子就像你自己手写的备忘录，只有你自己能看到。Husky 就像贴在办公室墙上的公告，所有人都能看到并遵守。

### 安装和配置

```bash
# 安装 Husky（作为开发依赖）
npm install husky --save-dev

# 初始化 Husky（创建 .husky/ 目录）
npx husky init
```

执行 `npx husky init` 后，项目中会多出 `.husky/` 目录，这个目录会被 Git 跟踪，可以共享给团队。

### 添加 pre-commit 钩子

```bash
# 创建一个 pre-commit 钩子，每次提交前运行 lint
npx husky add .husky/pre-commit "npm run lint"
```

生成的 `.husky/pre-commit` 文件内容：

```bash
#!/usr/bin/env sh
# 引入 Husky 的脚本环境
. "$(dirname -- "$0")/_/husky.sh"

# 运行 lint 检查
npm run lint
```

### 添加 commit-msg 钩子

```bash
# 创建 commit-msg 钩子，用 commitlint 验证提交信息
npx husky add .husky/commit-msg "npx --no-install commitlint --edit"
```

### 配合 lint-staged

每次提交都跑全项目 lint 太慢了，lint-staged 可以只对这次改动的文件跑检查。

打个比方：

> 全项目 lint 就像大扫除，每次都打扫整个房子，累死人。lint-staged 就像只打扫你弄脏的房间，又快又高效。

```bash
# 安装 lint-staged
npm install lint-staged --save-dev
```

在 `package.json` 中配置 lint-staged：

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "stylelint --fix"
    ]
  }
}
```

修改 `.husky/pre-commit`，让它调用 lint-staged：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 只对这次暂存的文件运行检查（而不是全项目）
npx lint-staged
```

### 完整配置流程

把 Husky + lint-staged + commitlint 组合在一起的完整流程：

```bash
# 第一步：安装所有依赖
npm install husky lint-staged @commitlint/cli @commitlint/config-conventional --save-dev

# 第二步：初始化 Husky
npx husky init

# 第三步：添加 pre-commit 钩子
npx husky add .husky/pre-commit "npx lint-staged"

# 第四步：添加 commit-msg 钩子
npx husky add .husky/commit-msg "npx --no-install commitlint --edit"
```

---

## 5 使用 commitlint

### 什么是 commitlint

commitlint 专门用来检查提交信息是否符合规范。配合上一章学的 Conventional Commits 规范使用。

### 安装和配置

```bash
# 安装 commitlint 和官方推荐配置
npm install @commitlint/cli @commitlint/config-conventional --save-dev
```

创建 `commitlint.config.js`：

```javascript
module.exports = {
  // 继承官方推荐配置
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 自定义规则：指定可用的 type
    'type-enum': [
      2,           // 2 表示错误级别（必须遵守）
      'always',    // 总是检查
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
    // 关闭 subject 大小写检查（中文提交信息不需要这个规则）
    'subject-case': [0],
  },
}
```

### commitlint 的检查效果

```bash
# 正确的提交信息 -> 通过
git commit -m "feat: 添加用户登录功能"
git commit -m "fix(cart): 修复价格计算错误"
git commit -m "docs: 更新 README"

# 错误的提交信息 -> 被拦截
git commit -m "改了点东西"       # type 不对
git commit -m "fix"              # 缺少描述
git commit -m "update code"      # type 不在允许列表中
```

---

## 6 其他钩子管理工具对比

除了 Husky，还有几个流行的替代方案：

| 工具 | 特点 | 配置方式 | 适合场景 |
| --- | --- | --- | --- |
| Husky | 最流行，社区生态好 | .husky/ 目录 | 大多数项目首选 |
| lint-staged | 只检查暂存文件，速度快 | package.json | 配合 Husky 使用 |
| lefthook | 速度快，支持并行执行 | lefthook.yml | 大项目、需要并行检查 |
| simple-git-hooks | 极简，配置少 | package.json | 小项目、不想引入太多依赖 |

### lefthook 配置示例

```bash
# 安装 lefthook
npm install lefthook --save-dev
```

创建 `lefthook.yml`：

```yaml
# pre-commit 钩子配置
pre-commit:
  parallel: true  # 并行执行所有检查，速度更快
  commands:
    # ESLint 检查
    eslint:
      glob: "*.{js,ts,vue}"          # 只检查这些文件类型
      run: npx eslint {staged_files}  # {staged_files} 会自动替换为暂存的文件
    # Prettier 格式化
    prettier:
      glob: "*.{js,ts,vue,json,css}"
      run: npx prettier --write {staged_files}
      stage_fixed: true  # 格式化后自动重新暂存

# commit-msg 钩子配置
commit-msg:
  commands:
    commitlint:
      run: npx commitlint --edit
```

### simple-git-hooks 配置示例

```bash
# 安装 simple-git-hooks
npm install simple-git-hooks --save-dev
```

在 `package.json` 中配置：

```json
{
  "simple-git-hooks": {
    "pre-commit": "npm run lint",
    "commit-msg": "npx commitlint --edit"
  },
  "scripts": {
    "postinstall": "npx simple-git-hooks"
  }
}
```

---

## 7 禁用钩子

有时候你需要紧急提交，来不及通过检查。Git 提供了跳过钩子的方式：

```bash
# 方式一：使用 --no-verify 参数
git commit --no-verify -m "紧急修复线上 bug"

# 方式二：使用简写 -n
git commit -n -m "紧急修复线上 bug"
```

::: warning
跳过钩子是不推荐的行为。如果经常需要跳过，说明钩子配置可能不合理（比如检查太慢），应该优化钩子配置，而不是绕过它。
:::

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Git Hooks | Git 在特定事件时自动执行的脚本 |
| pre-commit | 提交前触发，常用于 lint 检查和测试 |
| commit-msg | 提交信息编辑后触发，常用于验证提交信息格式 |
| pre-push | 推送前触发，常用于运行完整测试套件 |
| Husky | 最流行的 Git Hooks 管理工具，配置可共享 |
| lint-staged | 只对暂存文件运行检查，提升速度 |
| commitlint | 强制提交信息符合 Conventional Commits 规范 |
| --no-verify | 临时跳过钩子检查（不推荐） |

---

## 9 新手常见误区

### 误区 1："钩子配置好了就不用管了"

**错！** 钩子配置完后，团队成员每次拉取代码后都需要执行 `npm install`，这样才能激活钩子。如果新人 clone 项目后没装依赖，钩子就不会生效。

正确做法：在项目的 README 或 CONTRIBUTING 中写明"clone 后必须执行 npm install"。

### 误区 2："pre-commit 里跑的东西越多越好"

不是的。pre-commit 钩子会在每次提交时执行，如果里面跑了太多检查（比如完整的测试套件），每次提交都要等很久，严重影响开发效率。

正确做法：pre-commit 里只放快速的检查（lint、格式化），完整的测试交给 CI/CD 流水线。

### 误区 3："lint-staged 和全项目 lint 效果一样"

不一样。lint-staged 只检查你这次改动的文件，如果其他文件本来就有 lint 问题但没改动，它不会管。这既是优点也是缺点。

正确做法：定期（比如每周）跑一次全项目 lint，日常开发用 lint-staged 提高效率。

### 误区 4："钩子检查失败了，代码就丢了"

不会的。钩子只是阻止了提交，你的代码还在工作区里。修复问题后重新 `git add` 和 `git commit` 就行。

### 误区 5："Husky 和 lint-staged 必须一起用"

不是必须的，但强烈推荐。Husky 负责"什么时候执行"，lint-staged 负责"检查哪些文件"。没有 lint-staged，Husky 每次提交都要检查整个项目，很慢。

---

## 10 动手练习

### 练习 1：基础练习 - 配置 Husky

在一个 Node.js 项目中，配置 Husky 实现以下功能：
- 每次提交前自动运行 `npm run lint`
- 每次提交时自动检查提交信息格式

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：安装依赖
npm install husky @commitlint/cli @commitlint/config-conventional --save-dev

# 第二步：初始化 Husky
npx husky init

# 第三步：添加 pre-commit 钩子
npx husky add .husky/pre-commit "npm run lint"

# 第四步：添加 commit-msg 钩子
npx husky add .husky/commit-msg "npx --no-install commitlint --edit"

# 第五步：创建 commitlint 配置文件 commitlint.config.js
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],  // 关闭大小写检查，兼容中文
  },
}
```

</details>

### 练习 2：进阶练习 - 配置 lint-staged

为你的项目配置 lint-staged，实现以下需求：
- 对 .js 和 .ts 文件运行 eslint --fix
- 对 .css 和 .scss 文件运行 stylelint --fix
- 对所有文件运行 prettier --write

<details>
<summary>点击查看答案</summary>

```bash
# 安装依赖
npm install lint-staged --save-dev
```

```json
// package.json 中添加配置
{
  "lint-staged": {
    "*.{js,ts}": [
      "eslint --fix"
    ],
    "*.{css,scss}": [
      "stylelint --fix"
    ],
    "*": [
      "prettier --write"
    ]
  }
}
```

```bash
#!/usr/bin/env sh
# .husky/pre-commit 文件内容
. "$(dirname -- "$0")/_/husky.sh"

# 提交前只对本次暂存的文件运行检查
npx lint-staged
```

</details>

### 练习 3（挑战）：综合练习 - 搭建完整的自动化流程

为你的团队搭建一套完整的自动化流程，要求：
1. 使用 Husky 管理钩子
2. 提交前用 lint-staged 检查代码
3. 提交时用 commitlint 检查提交信息
4. 推送前运行完整测试
5. 写出每个文件的完整内容

<details>
<summary>点击查看答案</summary>

```bash
# 安装所有依赖
npm install husky lint-staged @commitlint/cli @commitlint/config-conventional --save-dev

# 初始化 Husky
npx husky init
```

```javascript
// commitlint.config.js - commitlint 配置
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
    'subject-case': [0],
  },
}
```

```json
// package.json 中的 lint-staged 配置
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "stylelint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
#!/usr/bin/env sh
# .husky/pre-commit - 提交前钩子
. "$(dirname -- "$0")/_/husky.sh"

# 只对暂存文件运行 lint 和格式化
npx lint-staged
```

```bash
#!/usr/bin/env sh
# .husky/commit-msg - 提交信息检查
. "$(dirname -- "$0")/_/husky.sh"

# 用 commitlint 检查提交信息格式
npx --no-install commitlint --edit
```

```bash
#!/usr/bin/env sh
# .husky/pre-push - 推送前钩子
. "$(dirname -- "$0")/_/husky.sh"

# 推送前运行完整测试套件
npm test
```

</details>

---

## 下一章预告

下一章我们会学习 **Git 子模块（Submodules）**——当你的项目需要引用另一个 Git 仓库作为依赖时，子模块就派上用场了。比如多个项目共享一套公共组件库，或者在主项目中嵌入一个独立维护的工具库。你会学到怎么添加、更新和管理子模块，让多个仓库协同工作。
