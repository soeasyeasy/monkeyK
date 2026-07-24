---
title: "第十六章：部署与最佳实践"
description: "掌握 Vite 项目的生产构建、CDN 部署、CI/CD 集成和常见问题解决"
---

# 第十六章：部署与最佳实践

## 生产构建

### 基础构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 构建输出

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── logo-[hash].png
└── favicon.ico
```

### 构建配置

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // 输出目录
    outDir: 'dist',

    // 资源目录
    assetsDir: 'assets',

    // 静态资源大小限制
    assetsInlineLimit: 4096,

    // CSS 代码分割
    cssCodeSplit: true,

    // Source Map
    sourcemap: false,

    // 压缩
    minify: 'esbuild',

    // 目标浏览器
    target: 'es2015',
  },
})
```

## 部署到不同平台

### 静态托管

#### Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod
```

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### GitHub Pages

```javascript
// vite.config.js
export default defineConfig({
  base: '/repository-name/',
})
```

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 云服务器

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html/dist;
    index index.html;

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3'
services:
  web:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html
```

### CDN 部署

#### 配置 CDN

```javascript
// vite.config.js
export default defineConfig({
  base: 'https://cdn.example.com/',
})
```

#### 资源上传

```bash
# 使用 aws cli
aws s3 sync dist/ s3://my-bucket/ --acl public-read

# 使用 aliyun cli
aliyun oss sync dist/ oss://my-bucket/
```

## CI/CD 集成

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: |
          # 部署逻辑
          echo "Deploying..."
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache rsync
    - rsync -avz dist/ user@server:/var/www/html/
  only:
    - main
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'rsync -avz dist/ user@server:/var/www/html/'
            }
        }
    }
}
```

## 环境变量管理

### 多环境配置

```bash
# .env.development
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development

# .env.staging
VITE_API_URL=https://staging-api.example.com
VITE_APP_ENV=staging

# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_ENV=production
```

### 构建脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production"
  }
}
```

## 性能优化

### 预加载关键资源

```html
<!-- index.html -->
<link rel="modulepreload" href="/src/main.js" />
<link rel="preload" href="/assets/critical.css" as="style" />
```

### Gzip/Brotli 压缩

```bash
npm install -D vite-plugin-compression
```

```javascript
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
})
```

### 缓存策略

```nginx
# Nginx 配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location = /index.html {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

## 常见问题

### 构建失败

```bash
# 增加内存限制
node --max-old-space-size=4096 node_modules/vite/bin/vite.js build

# 清除缓存
rm -rf node_modules/.vite
npm install
```

### 路径问题

```javascript
// vite.config.js
export default defineConfig({
  // 相对路径
  base: './',

  // 或绝对路径
  base: '/my-app/',
})
```

### 路由 404

```nginx
# Nginx 配置
location / {
    try_files $uri $uri/ /index.html;
}
```

### 跨域问题

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://api.example.com',
      changeOrigin: true,
    },
  },
}
```

## 最佳实践清单

### 开发阶段

- [ ] 使用 TypeScript
- [ ] 配置 ESLint 和 Prettier
- [ ] 使用环境变量管理配置
- [ ] 编写单元测试

### 构建阶段

- [ ] 启用 Tree-shaking
- [ ] 配置代码分割
- [ ] 使用 CDN 外部化大依赖
- [ ] 启用压缩

### 部署阶段

- [ ] 配置 CI/CD
- [ ] 使用 HTTPS
- [ ] 配置缓存策略
- [ ] 启用 Gzip/Brotli 压缩
- [ ] 配置错误监控

## 小结

本章介绍了 Vite 项目的部署与最佳实践，包括生产构建、不同平台的部署方式、CI/CD 集成等。通过合理的部署配置，可以确保应用稳定运行。

恭喜你完成了 Vite 完全指南的全部章节！通过本教程，你已经掌握了 Vite 从基础到高级的所有知识，可以熟练使用 Vite 构建现代前端应用。
