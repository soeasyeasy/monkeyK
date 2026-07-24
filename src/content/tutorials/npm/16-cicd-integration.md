---
title: "第十六章：CI/CD 中的 npm"
description: "在持续集成中使用 npm，自动化构建与发布"
---

# 第十六章：CI/CD 中的 npm

## CI/CD 基础

CI/CD（持续集成/持续部署）是自动化软件交付的实践。

| 阶段 | 说明 |
| --- | --- |
| CI（持续集成） | 自动构建、测试、代码检查 |
| CD（持续部署） | 自动发布到生产环境 |
| CD（持续交付） | 手动触发部署 |

## GitHub Actions

### 基础工作流

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### 缓存优化

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # 自动缓存 node_modules
```

### 发布工作流

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - install
  - test
  - build
  - deploy

variables:
  npm_config_cache: .npm

cache:
  key:
    files:
      - package-lock.json
  paths:
    - .npm/
    - node_modules/

install:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/

test:
  stage: test
  script:
    - npm test

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - npm publish
  only:
    - tags
```

## Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([string(credentialsId: 'npm-token', variable: 'NPM_TOKEN')]) {
                    sh 'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc'
                    sh 'npm publish'
                }
            }
        }
    }
}
```

## 环境变量管理

### GitHub Secrets

```bash
# 添加 secret
# Settings → Secrets and variables → Actions → New repository secret

# 使用
${{ secrets.NPM_TOKEN }}
```

### GitLab CI/CD Variables

```bash
# 添加变量
# Settings → CI/CD → Variables

# 使用
$NPM_TOKEN
```

### .npmrc 配置

```ini
# 项目根目录 .npmrc
registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

## 自动化版本管理

### 使用 changesets

```bash
# 安装
npm install -D @changesets/cli

# 初始化
npx changeset init
```

```yaml
# .github/workflows/version.yml
name: Version

on:
  push:
    branches: [main]

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Create Release Pull Request
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 使用 semantic-release

```bash
# 安装
npm install -D semantic-release @semantic-release/changelog @semantic-release/git
```

```json
// package.json
{
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      "@semantic-release/npm",
      "@semantic-release/github",
      "@semantic-release/git"
    ]
  }
}
```

## 最佳实践

1. **使用 npm ci**：确保可重复构建
2. **缓存 node_modules**：加速 CI 流程
3. **环境变量管理**：使用 secrets 存储敏感信息
4. **自动化版本**：使用 changesets 或 semantic-release
5. **并行任务**：测试和构建可以并行执行

## 完整示例

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Test
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 总结

恭喜你完成了 npm 完全指南！现在你已经掌握了：

- npm 基础使用与配置
- 依赖管理与版本控制
- npm scripts 自动化
- 全局与本地安装
- node_modules 与模块解析
- package-lock.json 与团队协作
- 发布自己的包
- 私有包与组织管理
- 工作区与 Monorepo
- 缓存与性能优化
- 安全审计
- 常见命令与技巧
- 包管理器对比
- CI/CD 集成

继续实践，成为 npm 专家！
