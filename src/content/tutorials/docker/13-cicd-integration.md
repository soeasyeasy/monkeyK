---
title: "第13章：CI/CD 集成"
description: "自动化构建、镜像推送、持续部署"
---

# 第13章：CI/CD 集成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何将 Docker 集成到 CI/CD 流程中？
- 如何自动化构建和推送镜像？
- 如何实现持续部署？
- 有哪些常用的 CI/CD 工具？

这一章会教你将 Docker 集成到持续集成和持续部署流程中。学会这些，你就能实现自动化的构建、测试和部署。

---

## 13.1 为什么需要 CI/CD 集成？

### 痛点分析

手动构建和部署的问题：

- **效率低**：每次都要手动执行构建、测试、部署命令
- **易出错**：人工操作容易遗漏步骤或出错
- **不可追溯**：不知道谁在什么时候做了什么
- **难以回滚**：出问题了很难快速恢复

### 解决方案

通过 CI/CD 集成，你可以：

- **自动化流程**：代码提交后自动构建、测试、部署
- **保证质量**：每次变更都经过自动化测试
- **快速交付**：缩短从代码到生产的时间
- **可追溯性**：所有操作都有记录

打个比方：

> 手动部署就像手工制作蛋糕，每个步骤都要人工操作，慢且容易出错。
>
> CI/CD 集成就像自动化生产线，原料进去，成品出来，快速、稳定、可靠。

---

## 13.2 CI/CD 基础概念

### CI（持续集成）

持续集成是指开发者频繁地将代码集成到主干，每次集成都自动进行构建和测试。

**核心实践**：
- 频繁提交代码（每天至少一次）
- 自动化构建
- 自动化测试
- 快速反馈

### CD（持续交付/持续部署）

**持续交付**：代码经过自动化测试后，可以随时部署到生产环境。

**持续部署**：代码通过自动化测试后，自动部署到生产环境。

### CI/CD 流程

```
代码提交 → 构建 → 测试 → 打包镜像 → 推送镜像 → 部署
   ↓        ↓      ↓        ↓          ↓         ↓
  Git    Docker   单元测试  Docker    Registry  Kubernetes
  push   build    集成测试   tag       push      或 Docker Compose
```

---

## 13.3 GitHub Actions

### 基础工作流

```yaml
# .github/workflows/docker-ci.yml
name: Docker CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Docker image
      run: |
        docker build -t myapp:${{ github.sha }} .
    
    - name: Test Docker image
      run: |
        docker run --rm myapp:${{ github.sha }} npm test
```

### 推送到 Docker Hub

```yaml
# .github/workflows/docker-push.yml
name: Docker Push

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: yourusername/myapp
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

### 多架构构建

```yaml
# .github/workflows/docker-multi-arch.yml
name: Docker Multi-Arch

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up QEMU
      uses: docker/setup-qemu-action@v2
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: yourusername/myapp:latest
```

---

## 13.4 GitLab CI/CD

### 基础配置

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - push
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

build:
  stage: build
  script:
    - docker build -t $DOCKER_IMAGE .
  only:
    - main
    - develop

test:
  stage: test
  script:
    - docker run --rm $DOCKER_IMAGE npm test
  only:
    - main
    - develop

push:
  stage: push
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker push $DOCKER_IMAGE
  only:
    - main

deploy:
  stage: deploy
  script:
    - docker pull $DOCKER_IMAGE
    - docker-compose -f docker-compose.prod.yml up -d
  only:
    - main
  when: manual
```

### 使用 Docker-in-Docker

```yaml
# .gitlab-ci.yml
image: docker:latest

services:
  - docker:dind

variables:
  DOCKER_HOST: tcp://docker:2375
  DOCKER_DRIVER: overlay2

stages:
  - build
  - test
  - push

build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_SHA .

test:
  stage: test
  script:
    - docker run --rm myapp:$CI_COMMIT_SHA npm test

push:
  stage: push
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker tag myapp:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

---

## 13.5 Jenkins

### Pipeline 配置

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'yourusername/myapp'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").inside {
                        sh 'npm test'
                    }
                }
            }
        }
        
        stage('Push') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push('latest')
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sshagent(['ssh-credentials-id']) {
                        sh '''
                            ssh user@server "docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}"
                            ssh user@server "docker-compose -f /path/to/docker-compose.yml up -d"
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

---

## 13.6 镜像构建优化

### 使用 BuildKit

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1

# 或使用 docker buildx
docker buildx build -t myapp:latest .
```

### 缓存优化

```yaml
# GitHub Actions 缓存
- name: Build and push
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: yourusername/myapp:latest
    cache-from: type=registry,ref=yourusername/myapp:buildcache
    cache-to: type=registry,ref=yourusername/myapp:buildcache,mode=max
```

### 多阶段构建

```dockerfile
# Dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 13.7 自动化测试

### 单元测试

```yaml
# GitHub Actions
- name: Run unit tests
  run: |
    docker run --rm myapp:latest npm run test:unit
```

### 集成测试

```yaml
# GitHub Actions
- name: Start test environment
  run: |
    docker-compose -f docker-compose.test.yml up -d
    
- name: Run integration tests
  run: |
    docker-compose -f docker-compose.test.yml exec -T app npm run test:integration
    
- name: Cleanup
  if: always()
  run: |
    docker-compose -f docker-compose.test.yml down
```

### 端到端测试

```yaml
# GitHub Actions
- name: Start application
  run: |
    docker-compose up -d
    
- name: Wait for application to be ready
  run: |
    timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 1; done'
    
- name: Run E2E tests
  run: |
    docker run --rm --network host cypress/included:12.0.0
    
- name: Cleanup
  if: always()
  run: |
    docker-compose down
```

---

## 13.8 部署策略

### 滚动更新

```bash
# Docker Swarm
docker service update --image myapp:new-version myapp

# Kubernetes
kubectl set image deployment/myapp myapp=myapp:new-version
```

### 蓝绿部署

```bash
# 部署新版本（绿色）
docker-compose -f docker-compose.green.yml up -d

# 测试新版本
curl http://localhost:3001/health

# 切换流量到新版本
# 修改负载均衡器配置

# 停止旧版本（蓝色）
docker-compose -f docker-compose.blue.yml down
```

### 金丝雀发布

```bash
# 部署新版本（少量实例）
docker service update --image myapp:new-version --replicas 1 myapp-canary

# 监控新版本
# 如果正常，逐步增加实例数
docker service update --replicas 5 myapp-canary

# 如果有问题，回滚
docker service update --rollback myapp
```

---

## 13.9 环境管理

### 多环境配置

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
    ports:
      - "3000:3000"

# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: myapp:latest
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
    ports:
      - "80:3000"
```

### 环境变量管理

```bash
# .env.dev
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306

# .env.prod
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_PORT=3306
```

```yaml
# docker-compose.yml
services:
  app:
    image: myapp:latest
    env_file:
      - .env.${ENVIRONMENT}
```

---

## 13.10 安全最佳实践

### 镜像安全扫描

```yaml
# GitHub Actions
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'yourusername/myapp:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

### 密钥管理

```yaml
# GitHub Actions（使用 Secrets）
- name: Deploy
  run: |
    echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
```

```yaml
# GitLab CI（使用 Variables）
deploy:
  script:
    - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
```

---

## 13.11 监控和日志

### 构建监控

```yaml
# GitHub Actions
- name: Notify on success
  if: success()
  run: |
    curl -X POST https://hooks.slack.com/services/xxx \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ Build succeeded: ${{ github.repository }}"}'

- name: Notify on failure
  if: failure()
  run: |
    curl -X POST https://hooks.slack.com/services/xxx \
      -H 'Content-Type: application/json' \
      -d '{"text":"❌ Build failed: ${{ github.repository }}"}'
```

### 部署监控

```bash
# 健康检查
docker ps --filter "name=myapp" --format "{{.Status}}"

# 日志收集
docker logs myapp | tee /var/log/myapp.log

# 指标收集
docker stats --no-stream myapp
```

---

## 13.12 完整示例

### GitHub Actions 完整工作流

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  DOCKER_IMAGE: yourusername/myapp
  DOCKER_REGISTRY: docker.io

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        load: true
        tags: ${{ env.DOCKER_IMAGE }}:test
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Run tests
      run: |
        docker run --rm ${{ env.DOCKER_IMAGE }}:test npm test
    
    - name: Run security scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: '${{ env.DOCKER_IMAGE }}:test'
        format: 'table'
        exit-code: '1'
        ignore-unfixed: true
        severity: 'CRITICAL,HIGH'

  push:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.DOCKER_IMAGE }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # 这里添加你的部署逻辑
        # 例如：SSH 到服务器，拉取新镜像，重启容器
```

---

## 13.13 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| CI/CD 概念 | 持续集成、持续交付、持续部署 |
| GitHub Actions | 流行的 CI/CD 工具 |
| GitLab CI/CD | GitLab 内置的 CI/CD 工具 |
| Jenkins | 老牌 CI/CD 工具 |
| 镜像构建优化 | BuildKit、缓存、多阶段构建 |
| 自动化测试 | 单元测试、集成测试、端到端测试 |
| 部署策略 | 滚动更新、蓝绿部署、金丝雀发布 |
| 环境管理 | 开发、测试、生产环境配置 |
| 安全实践 | 镜像扫描、密钥管理 |

---

## 13.14 新手常见误区

### 误区 1："CI/CD 太复杂，不需要"

**错！** CI/CD 可以大幅提高开发效率和代码质量，减少人为错误。即使是小项目也值得投入。

### 误区 2："每次都要重新构建所有层"

不是的。通过合理的 Dockerfile 设计和缓存策略，可以大幅加快构建速度。

### 误区 3："测试可以在本地做"

不是的。本地环境和 CI 环境可能不同，应该在 CI 中运行测试，确保一致性。

### 误区 4："部署后不需要监控"

不是的。部署后需要持续监控应用状态，及时发现问题并回滚。

---

## 13.15 动手练习

### 练习 1：GitHub Actions 基础

创建一个简单的 GitHub Actions 工作流，自动构建 Docker 镜像。

<details>
<summary>点击查看答案</summary>

```yaml
# .github/workflows/docker-build.yml
name: Docker Build

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -t myapp:${{ github.sha }} .
    
    - name: Test image
      run: |
        docker run --rm myapp:${{ github.sha }} echo "Hello from Docker"
```

</details>

### 练习 2：推送到 Docker Hub

配置 GitHub Actions 自动推送镜像到 Docker Hub。

<details>
<summary>点击查看答案</summary>

```yaml
# .github/workflows/docker-push.yml
name: Docker Push

on:
  push:
    branches: [ main ]

jobs:
  push:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          yourusername/myapp:latest
          yourusername/myapp:${{ github.sha }}
```

需要在 GitHub 仓库的 Settings > Secrets 中添加：
- `DOCKER_USERNAME`：Docker Hub 用户名
- `DOCKER_PASSWORD`：Docker Hub 密码或访问令牌

</details>

### 练习 3（挑战）：完整 CI/CD 流程

创建一个完整的 CI/CD 流程，包括构建、测试、推送和部署。

<details>
<summary>点击查看答案</summary>

```yaml
# .github/workflows/full-cicd.yml
name: Full CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Build test image
      run: docker build -t myapp:test .
    
    - name: Run tests
      run: docker run --rm myapp:test npm test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          yourusername/myapp:latest
          yourusername/myapp:${{ github.sha }}
    
    - name: Image digest
      run: echo ${{ steps.build-and-push.outputs.digest }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          docker pull yourusername/myapp:latest
          docker-compose -f /path/to/docker-compose.yml up -d
          docker image prune -f
```

</details>

---

## 下一章预告

下一章我们会学习 **微服务架构部署**——如何使用 Docker 部署微服务应用。你会学到服务拆分、容器编排、服务发现等核心概念。
