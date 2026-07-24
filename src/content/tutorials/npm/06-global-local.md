---
title: "第六章：全局安装与本地安装"
description: "理解全局包和本地包的区别，掌握正确的安装方式"
---

# 第六章：全局安装与本地安装

## 两种安装方式

npm 支持两种安装方式：全局安装（global）和本地安装（local）。

| 特性 | 本地安装 | 全局安装 |
| --- | --- | --- |
| 安装位置 | 项目 `node_modules/` | 系统全局目录 |
| 作用范围 | 仅当前项目 | 所有项目 |
| 使用方式 | 通过 `npm run` 或 `npx` | 命令行直接调用 |
| 版本管理 | 每个项目独立 | 全局统一版本 |
| 推荐场景 | 项目依赖 | CLI 工具 |

## 本地安装（推荐）

### 安装到项目

```bash
# 默认安装到本地
npm install vue
npm install -D typescript

# 明确指定本地
npm install --save vue
npm install --save-dev typescript
```

### 使用本地包

```bash
# 通过 npm scripts 使用
npm run dev

# 通过 npx 使用
npx vite
npx vue-tsc --noEmit

# 在 package.json 的 scripts 中直接使用
{
  "scripts": {
    "dev": "vite",
    "type-check": "vue-tsc --noEmit"
  }
}
```

### 为什么推荐本地安装？

1. **版本隔离**：每个项目使用独立的依赖版本
2. **可重复构建**：团队成员使用相同版本
3. **易于部署**：生产环境只需 `npm install`
4. **避免冲突**：不同项目可使用不同版本

## 全局安装

### 安装全局包

```bash
# 全局安装
npm install -g typescript
npm install -g nodemon
npm install -g yarn

# 查看全局安装路径
npm root -g

# Windows 默认路径
# C:\Users\<username>\AppData\Roaming\npm

# macOS/Linux 默认路径
# /usr/local/lib/node_modules 或 ~/.nvm/versions/node/<version>/lib/node_modules
```

### 使用全局包

```bash
# 直接命令行调用
tsc --version
nodemon server.js
yarn --version
```

### 查看全局包

```bash
# 列出全局安装的包
npm list -g

# 查看深度（只显示第一层）
npm list -g --depth=0

# 查看过期全局包
npm outdated -g
```

### 卸载全局包

```bash
npm uninstall -g typescript
npm uninstall -g nodemon
```

### 更新全局包

```bash
# 更新指定全局包
npm update -g typescript

# 更新所有全局包（不推荐，可能破坏工具）
npm update -g
```

## 何时使用全局安装？

### 适合全局安装的场景

- **CLI 工具**：`typescript`、`nodemon`、`yarn`、`pnpm`
- **开发辅助工具**：`create-react-app`、`@vue/cli`
- **系统级工具**：`npm-check-updates`

### 不适合全局安装的场景

- **项目依赖**：vue、react、axios 等
- **构建工具**：vite、webpack、rollup
- **测试框架**：jest、vitest
- **代码质量工具**：eslint、prettier

## npx：全局安装的替代方案

`npx` 可以执行本地或临时安装的包，无需全局安装。

### 使用本地安装的包

```bash
# 无需全局安装 typescript
npx tsc --version

# 执行项目本地的 vite
npx vite
```

### 临时执行包

```bash
# 临时下载并执行
npx create-vite my-app

# 等同于
npm install -g create-vite
create-vite my-app
npm uninstall -g create-vite
```

### 指定版本执行

```bash
# 使用特定版本
npx typescript@5.0 tsc --version
```

## 全局安装路径配置

### 修改全局安装路径

```bash
# 查看当前全局路径
npm config get prefix

# 修改全局路径（例如改为 ~/.npm-global）
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# 添加到 PATH（~/.bashrc 或 ~/.zshrc）
export PATH=~/.npm-global/bin:$PATH

# 重新加载配置
source ~/.bashrc
```

### Windows 配置

```powershell
# 查看全局路径
npm config get prefix

# 修改全局路径
npm config set prefix "C:\npm-global"

# 添加到系统环境变量 PATH
# 控制面板 -> 系统 -> 高级系统设置 -> 环境变量
```

## 权限问题

### Linux/macOS

```bash
# 方法 1：使用 sudo（不推荐）
sudo npm install -g typescript

# 方法 2：修改 npm 目录权限（推荐）
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 方法 3：使用 nvm（推荐）
# nvm 安装的 Node.js 不需要 sudo
```

### Windows

Windows 通常不需要特殊权限，但如果遇到问题：
- 以管理员身份运行 PowerShell
- 或修改 npm 全局路径到用户目录

## 最佳实践

1. **优先使用本地安装**：项目依赖一律本地安装
2. **使用 npx 替代全局安装**：临时执行工具时
3. **全局只装 CLI 工具**：typescript、nodemon 等
4. **定期清理全局包**：`npm list -g --depth=0` 查看并卸载不用的
5. **使用版本管理器**：nvm（Node Version Manager）管理 Node 版本

## 常见问题

### 命令找不到

```bash
# 检查是否正确安装
npm list -g typescript

# 检查 PATH 是否包含 npm 全局路径
echo $PATH  # Linux/macOS
echo %PATH%  # Windows CMD
$env:PATH    # PowerShell
```

### 版本冲突

```bash
# 查看实际使用的版本
which tsc  # Linux/macOS
where tsc  # Windows

# 使用 npx 强制使用本地版本
npx tsc --version
```

## 下一步

下一章我们将深入理解 node_modules 的模块解析机制。
