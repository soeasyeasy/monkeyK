---
title: "第13章：CI/CD 自动化部署"
description: "持续集成与持续部署，自动化测试，部署流水线搭建"
---

# 第13章：CI/CD 自动化部署

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 CI/CD？为什么要用它？
- 如何搭建自动化部署流水线？
- 如何实现自动化测试？
- 如何做到一键部署？

这一章就是为了解答这些问题。我们会学习 CI/CD 的核心概念，掌握如何使用 GitHub Actions 搭建自动化部署流水线。

---

## 1 为什么需要 CI/CD？

### 痛点分析

想象一下这个场景：你要更新模型服务：

```bash
# 手动部署流程：
# 1. 修改代码
# 2. 本地测试
# 3. 构建镜像
# 4. 推送到仓库
# 5. 登录服务器
# 6. 拉取镜像
# 7. 重启服务
# 8. 验证部署

# 每次都要重复这些步骤，太繁琐了...
# 而且容易出错...
```

或者更糟糕的情况：

```bash
# 多人协作时：
# 小明改了代码，推送到主分支
# 小红也在改代码，推送到主分支
# 代码冲突了！
# 服务挂了！
# 不知道是谁的问题...
```

> **一句话总结**：手动部署效率低、易出错，需要自动化流水线。

### 解决方案

CI/CD（持续集成/持续部署）是一套自动化流程：
- **CI（持续集成）**：代码提交后自动测试
- **CD（持续部署）**：测试通过后自动部署

打个比方：

> CI/CD 就像是一条自动化生产线，代码提交后自动经过测试、构建、部署，全程无需人工干预。

---

## 2 核心原理

### CI/CD 流程

```
代码提交 → 自动测试 → 构建镜像 → 推送仓库 → 部署上线 → 验证
```

### CI/CD 工具对比

| 工具 | 特点 | 适用场景 |
| --- | --- | --- |
| GitHub Actions | GitHub 原生集成，配置简单 | GitHub 项目 |
| GitLab CI | GitLab 原生集成，功能强大 | GitLab 项目 |
| Jenkins | 功能强大，插件丰富 | 复杂流水线 |
| CircleCI | 云原生，易于扩展 | 云项目 |

---

## 3 基础用法

### GitHub Actions 基础配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Model Deploy

# 触发条件
on:
  push:
    branches: [main]  # 推送到 main 分支时触发
  pull_request:
    branches: [main]  # PR 到 main 分支时触发

# 任务
jobs:
  # 测试任务
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest tests/ -v --cov=src
  
  # 构建任务
  build:
    needs: test  # 依赖测试任务
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -t model-service:${{ github.sha }} .
    
    - name: Test image
      run: |
        docker run --rm model-service:${{ github.sha }} python -c "import model; print('OK')"
  
  # 部署任务
  deploy:
    needs: build  # 依赖构建任务
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'  # 只在 main 分支部署
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to server
      run: |
        echo "Deploying to production..."
        # 这里添加实际的部署命令
```

### 完整的 CI/CD 流水线

```yaml
name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 代码质量检查
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install flake8 black ruff
    
    - name: Run linters
      run: |
        flake8 src/ --count --select=E9,F63,F7,F82 --show-source --statistics
        black --check src/
        ruff check src/
  
  # 单元测试
  test:
    runs-on: ubuntu-latest
    needs: lint
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        pytest tests/ -v --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
  
  # 构建和推送镜像
  build:
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=sha
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
  
  # 部署到测试环境
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # 添加部署命令
  
  # 部署到生产环境
  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # 添加部署命令
```

### 自动化测试

创建 `tests/test_model.py`：

```python
import pytest
import numpy as np
from src.model import ModelService

class TestModelService:
    """模型服务测试"""
    
    @pytest.fixture
    def model_service(self):
        """创建模型服务实例"""
        return ModelService("model.joblib")
    
    def test_predict_single(self, model_service):
        """测试单条预测"""
        features = [5.1, 3.5, 1.4, 0.2]
        result = model_service.predict(features)
        
        assert isinstance(result, int)
        assert 0 <= result <= 2
    
    def test_predict_batch(self, model_service):
        """测试批量预测"""
        features_list = [
            [5.1, 3.5, 1.4, 0.2],
            [6.2, 3.4, 5.4, 2.3]
        ]
        results = model_service.predict_batch(features_list)
        
        assert len(results) == 2
        assert all(isinstance(r, int) for r in results)
    
    def test_invalid_input(self, model_service):
        """测试无效输入"""
        with pytest.raises(ValueError):
            model_service.predict([1, 2, 3])  # 特征数量不对
```

### 部署脚本

创建 `scripts/deploy.sh`：

```bash
#!/bin/bash

# 部署脚本
set -e  # 遇到错误立即退出

# 配置
IMAGE_NAME="model-service"
IMAGE_TAG=$1
SERVER="user@example.com"
DEPLOY_DIR="/opt/model-service"

echo "开始部署 ${IMAGE_NAME}:${IMAGE_TAG}..."

# 拉取镜像
echo "拉取镜像..."
docker pull ${IMAGE_NAME}:${IMAGE_TAG}

# 停止旧容器
echo "停止旧容器..."
docker stop model-api || true
docker rm model-api || true

# 启动新容器
echo "启动新容器..."
docker run -d \
  --name model-api \
  -p 8000:8000 \
  -e MODEL_PATH=/app/data/models/model.joblib \
  -v /opt/model-data:/app/data \
  --restart unless-stopped \
  ${IMAGE_NAME}:${IMAGE_TAG}

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 健康检查
echo "执行健康检查..."
for i in {1..5}; do
  if curl -f http://localhost:8000/health; then
    echo "✓ 部署成功！"
    exit 0
  fi
  echo "等待服务就绪... ($i/5)"
  sleep 5
done

echo "✗ 部署失败！"
exit 1
```

在 GitHub Actions 中使用：

```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to server
      env:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
      run: |
        # 设置 SSH
        mkdir -p ~/.ssh
        echo "${SSH_PRIVATE_KEY}" > ~/.ssh/id_rsa
        chmod 600 ~/.ssh/id_rsa
        
        # 复制部署脚本
        scp scripts/deploy.sh user@example.com:/tmp/
        
        # 执行部署
        ssh user@example.com "bash /tmp/deploy.sh ${{ github.sha }}"
```

---

## 4 进阶用法

### 多环境部署

```yaml
name: Multi-Environment Deploy

on:
  push:
    branches:
      - develop  # 开发环境
      - staging  # 测试环境
      - main     # 生产环境

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Determine environment
      id: env
      run: |
        if [[ ${{ github.ref }} == "refs/heads/develop" ]]; then
          echo "env=development" >> $GITHUB_OUTPUT
          echo "url=http://dev.example.com" >> $GITHUB_OUTPUT
        elif [[ ${{ github.ref }} == "refs/heads/staging" ]]; then
          echo "env=staging" >> $GITHUB_OUTPUT
          echo "url=http://staging.example.com" >> $GITHUB_OUTPUT
        elif [[ ${{ github.ref }} == "refs/heads/main" ]]; then
          echo "env=production" >> $GITHUB_OUTPUT
          echo "url=http://example.com" >> $GITHUB_OUTPUT
        fi
    
    - name: Deploy to ${{ steps.env.outputs.env }}
      run: |
        echo "Deploying to ${{ steps.env.outputs.env }}"
        echo "URL: ${{ steps.env.outputs.url }}"
        # 根据环境执行不同的部署逻辑
```

### 蓝绿部署

```yaml
  deploy-blue-green:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Get current environment
      id: current
      run: |
        # 获取当前运行的环境（blue 或 green）
        CURRENT=$(curl -s http://lb.example.com/status | jq -r '.environment')
        if [ "$CURRENT" == "blue" ]; then
          echo "next=green" >> $GITHUB_OUTPUT
        else
          echo "next=blue" >> $GITHUB_OUTPUT
        fi
    
    - name: Deploy to ${{ steps.current.outputs.next }}
      run: |
        # 部署到非当前环境
        echo "Deploying to ${{ steps.current.outputs.next }} environment"
        # 部署逻辑...
    
    - name: Switch traffic
      run: |
        # 切换流量到新环境
        echo "Switching traffic to ${{ steps.current.outputs.next }}"
        # 切换逻辑...
```

### 金丝雀发布

```yaml
  deploy-canary:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy canary
      run: |
        # 部署金丝雀版本（10% 流量）
        kubectl set image deployment/model-api model-api=model-service:${{ github.sha }}
        kubectl annotate deployment/model-api kubernetes.io/canary-weight="10"
    
    - name: Monitor canary
      run: |
        # 监控金丝雀版本
        sleep 300  # 等待 5 分钟
        
        # 检查错误率
        ERROR_RATE=$(kubectl logs deployment/model-api | grep "error" | wc -l)
        if [ $ERROR_RATE -gt 10 ]; then
          echo "错误率过高，回滚..."
          kubectl rollout undo deployment/model-api
          exit 1
        fi
    
    - name: Promote canary
      run: |
        # 提升金丝雀版本到全量
        kubectl annotate deployment/model-api kubernetes.io/canary-weight="100"
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| CI/CD | 持续集成和持续部署，自动化代码测试和部署 |
| GitHub Actions | GitHub 原生的 CI/CD 工具 |
| 自动化测试 | 代码提交后自动运行测试 |
| 构建镜像 | 自动构建 Docker 镜像并推送到仓库 |
| 多环境部署 | 根据不同分支部署到不同环境 |
| 蓝绿部署 | 两个环境切换，零停机部署 |
| 金丝雀发布 | 先发布小流量，验证后再全量发布 |

---

## 6 新手常见误区

### 误区 1："CI/CD 只需要配置一次就行"

**错！** CI/CD 需要持续维护：
- 测试用例需要更新
- 部署脚本需要优化
- 环境配置可能变化

正确做法：定期审查和更新 CI/CD 配置。

### 误区 2："不需要自动化测试"

**错！** 没有自动化测试会导致：
- 代码质量问题无法及时发现
- 部署后才发现 bug
- 回滚成本高

正确做法：在 CI 流水线中加入完整的测试套件。

### 误区 3："所有分支都需要部署到生产"

**错！** 应该根据分支策略决定：
- main/master：生产环境
- develop：测试环境
- feature：不部署

正确做法：使用分支保护策略，控制部署流程。

### 误区 4："部署失败不需要通知"

**错！** 部署失败需要及时通知：
- 开发人员需要知道
- 运维人员需要介入
- 可能需要回滚

正确做法：配置部署通知（邮件、Slack、钉钉等）。

### 误区 5："CI/CD 流水线越复杂越好"

**错！** 过于复杂的流水线会导致：
- 运行时间长
- 维护困难
- 调试复杂

正确做法：保持流水线简洁，只包含必要的步骤。

---

## 7 动手练习

### 练习 1：基础练习 - 创建简单的 CI 流水线

创建一个 GitHub Actions 工作流，在代码提交时自动运行测试。

<details>
<summary>点击查看答案</summary>

`.github/workflows/test.yml`：

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest
    
    - name: Run tests
      run: pytest tests/ -v
```

</details>

### 练习 2：进阶练习 - 构建和推送 Docker 镜像

创建一个工作流，自动构建 Docker 镜像并推送到 GitHub Container Registry。

<details>
<summary>点击查看答案</summary>

`.github/workflows/build.yml`：

```yaml
name: Build and Push

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

</details>

### 练习 3（挑战）：综合练习 - 完整的 CI/CD 流水线

创建一个完整的 CI/CD 流水线，包括测试、构建、部署。

<details>
<summary>点击查看答案</summary>

`.github/workflows/cicd.yml`：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: pytest tests/ -v --cov=src
  
  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      env:
        SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
      run: |
        mkdir -p ~/.ssh
        echo "${SSH_KEY}" > ~/.ssh/id_rsa
        chmod 600 ~/.ssh/id_rsa
        
        ssh -o StrictHostKeyChecking=no user@example.com << 'EOF'
          docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker stop model-api || true
          docker rm model-api || true
          docker run -d --name model-api -p 8000:8000 ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        EOF
```

</details>

---

## 下一章预告

下一章我们会学习 **A/B 测试与灰度发布**——也就是如何安全地发布新版本。你会学到：

- A/B 测试的原理和实现
- 灰度发布策略
- 流量分配和监控
- 回滚机制

掌握这些知识后，你就能安全地发布新版本了。
