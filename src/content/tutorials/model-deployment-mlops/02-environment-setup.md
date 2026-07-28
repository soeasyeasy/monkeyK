---
title: "第2章：开发环境与工具链准备"
description: "Python 环境配置，依赖管理，模型部署工具链介绍"
---

# 第2章：开发环境与工具链准备

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MLOps 开发环境需要哪些工具？
- 如何管理 Python 依赖，避免版本冲突？
- 模型部署常用的工具有哪些？
- 如何搭建一个标准化的开发环境？

这一章就是为了解答这些问题。我们会从零开始搭建一个完整的 MLOps 开发环境，让你能够顺利进行后续的模型部署实践。

---

## 1 为什么需要规范的环境配置？

### 痛点分析

想象一下这个场景：你在本地开发环境跑得好好的模型，部署到生产环境就报错：

```bash
# 本地运行正常
python train.py  # 成功

# 部署到服务器
python train.py  # 报错：ModuleNotFoundError: No module named 'torch'
```

或者更糟糕的情况：

```python
# 本地环境
scikit-learn==0.24.2  # 模型训练正常

# 生产环境
scikit-learn==1.0.0   # 模型加载失败，API 不兼容
```

> **一句话总结**：环境不一致是模型部署最常见的坑，规范的环境配置能避免 80% 的部署问题。

### 解决方案

规范的环境配置包括：
- **Python 环境管理**：使用虚拟环境隔离项目依赖
- **依赖管理**：使用 requirements.txt 或 pyproject.toml 锁定版本
- **容器化**：使用 Docker 保证环境一致性
- **工具链标准化**：统一团队使用的工具和版本

---

## 2 核心原理

### Python 环境管理

Python 环境管理的核心思想是：**每个项目应该有独立的虚拟环境**。

打个比方：

> 虚拟环境就像是一个独立的工具箱，每个项目都有自己的工具，不会互相干扰。

### 环境管理工具对比

| 工具 | 特点 | 适用场景 |
| --- | --- | --- |
| venv | Python 内置，轻量级 | 简单项目 |
| conda | 跨语言，支持 C 依赖 | 数据科学项目 |
| poetry | 现代依赖管理，类似 npm | 需要发布包的项目 |
| pipenv | 结合 pip 和 virtualenv | 需要锁定依赖的项目 |

### 依赖管理最佳实践

```txt
# ❌ 错误的做法：不指定版本
fastapi
uvicorn
scikit-learn

# ✅ 正确的做法：锁定版本
fastapi==0.104.1
uvicorn==0.24.0
scikit-learn==1.3.2
```

---

## 3 基础用法

### 步骤 1：创建项目结构

首先创建一个标准的项目结构：

```bash
# 创建项目目录
mkdir mlops-project
cd mlops-project

# 创建目录结构
mkdir -p src/{models,services,utils}
mkdir -p tests
mkdir -p configs
mkdir -p notebooks
mkdir -p data/{raw,processed,models}
```

完整的项目结构：

```
mlops-project/
├── src/                    # 源代码
│   ├── models/            # 模型相关代码
│   │   ├── train.py       # 训练脚本
│   │   ├── predict.py     # 预测脚本
│   │   └── evaluate.py    # 评估脚本
│   ├── services/          # 服务层
│   │   ├── api.py         # API 服务
│   │   └── inference.py   # 推理服务
│   └── utils/             # 工具函数
│       ├── data_loader.py # 数据加载
│       └── config.py      # 配置管理
├── tests/                 # 测试代码
├── configs/               # 配置文件
├── notebooks/             # Jupyter 笔记本
├── data/                  # 数据目录
│   ├── raw/              # 原始数据
│   ├── processed/        # 处理后的数据
│   └── models/           # 模型文件
├── requirements.txt       # 依赖列表
├── Dockerfile            # Docker 配置
├── .gitignore           # Git 忽略文件
└── README.md            # 项目说明
```

### 步骤 2：创建虚拟环境

使用 venv 创建虚拟环境：

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

#  deactivate  # 退出虚拟环境
```

使用 conda 创建虚拟环境：

```bash
# 创建 conda 环境
conda create -n mlops-env python=3.9

# 激活环境
conda activate mlops-env

# 退出环境
conda deactivate
```

### 步骤 3：安装依赖

创建 requirements.txt：

```txt
# 核心依赖
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0

# 机器学习
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2

# 深度学习（可选）
# torch==2.1.0
# transformers==4.35.2

# 数据处理
python-multipart==0.0.6
aiofiles==23.2.1

# 监控和日志
prometheus-client==0.19.0
loguru==0.7.2

# 测试
pytest==7.4.3
pytest-cov==4.1.0

# 工具
python-dotenv==1.0.0
pyyaml==6.0.1
```

安装依赖：

```bash
# 安装所有依赖
pip install -r requirements.txt

# 导出当前环境的依赖
pip freeze > requirements.txt

# 或使用 pipreqs 自动生成（更准确）
pip install pipreqs
pipreqs . --force
```

### 步骤 4：配置管理

创建配置文件 configs/config.yaml：

```yaml
# 模型配置
model:
  name: "text_classifier"
  version: "1.0.0"
  path: "data/models/"
  
# 训练配置
training:
  batch_size: 32
  epochs: 10
  learning_rate: 0.001
  validation_split: 0.2
  
# 服务配置
server:
  host: "0.0.0.0"
  port: 8000
  workers: 4
  reload: false
  
# 日志配置
logging:
  level: "INFO"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file: "logs/app.log"
```

创建配置加载工具 src/utils/config.py：

```python
import yaml
from pathlib import Path
from typing import Any, Dict

class Config:
    """配置管理类"""
    
    def __init__(self, config_path: str = "configs/config.yaml"):
        # 配置文件路径
        self.config_path = Path(config_path)
        # 加载配置
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载 YAML 配置文件"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"配置文件不存在：{self.config_path}")
        
        with open(self.config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置项，支持点号分隔的嵌套键"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        
        return value

# 使用示例
if __name__ == "__main__":
    config = Config()
    
    # 获取配置
    model_name = config.get("model.name")
    batch_size = config.get("training.batch_size")
    port = config.get("server.port", 8000)  # 带默认值
    
    print(f"模型名称：{model_name}")
    print(f"批大小：{batch_size}")
    print(f"端口：{port}")
```

### 步骤 5：环境变量管理

创建 .env 文件：

```bash
# API 密钥
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgresql://user:pass@localhost/dbname

# 环境配置
ENVIRONMENT=development
DEBUG=True

# 服务配置
HOST=0.0.0.0
PORT=8000
```

在代码中使用环境变量 src/utils/env.py：

```python
import os
from dotenv import load_dotenv
from pathlib import Path

# 加载 .env 文件
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# 获取环境变量
class Settings:
    """应用设置"""
    
    # API 密钥
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # 环境配置
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # 服务配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

# 使用示例
settings = Settings()
print(f"环境：{settings.ENVIRONMENT}")
print(f"调试模式：{settings.DEBUG}")
```

### 步骤 6：Git 配置

创建 .gitignore 文件：

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Jupyter Notebook
.ipynb_checkpoints

# 数据文件
data/raw/
data/processed/
*.csv
*.parquet

# 模型文件
*.pkl
*.h5
*.onnx
*.pt
*.pth

# 日志
logs/
*.log

# 环境变量
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 测试
.pytest_cache/
.coverage
htmlcov/

# 构建
dist/
build/
*.egg-info/
```

---

## 4 进阶用法

### 使用 Poetry 管理项目

Poetry 是一个现代的 Python 依赖管理工具，类似于 Node.js 的 npm。

安装 Poetry：

```bash
# 使用 pip 安装
pip install poetry

# 或使用官方安装脚本
curl -sSL https://install.python-poetry.org | python3 -
```

初始化项目：

```bash
# 初始化新项目
poetry init

# 或克隆现有项目
poetry install
```

pyproject.toml 示例：

```toml
[tool.poetry]
name = "mlops-project"
version = "0.1.0"
description = "MLOps 项目模板"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
scikit-learn = "^1.3.2"
pandas = "^2.1.3"
numpy = "^1.26.2"
joblib = "^1.3.2"

[tool.poetry.dev-dependencies]
pytest = "^7.4.3"
pytest-cov = "^4.1.0"
black = "^23.11.0"
ruff = "^0.1.6"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

常用命令：

```bash
# 添加依赖
poetry add fastapi

# 添加开发依赖
poetry add --dev pytest

# 移除依赖
poetry remove fastapi

# 更新依赖
poetry update

# 运行脚本
poetry run python src/models/train.py

# 导出 requirements.txt
poetry export -f requirements.txt --output requirements.txt
```

### 使用 Makefile 自动化任务

创建 Makefile：

```makefile
.PHONY: install test lint format clean run build

# 安装依赖
install:
	pip install -r requirements.txt

# 运行测试
test:
	pytest tests/ -v --cov=src

# 代码检查
lint:
	ruff check src/
	black --check src/

# 代码格式化
format:
	black src/ tests/
	ruff check --fix src/

# 清理缓存
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +

# 运行服务
run:
	uvicorn src.services.api:app --reload --host 0.0.0.0 --port 8000

# 构建 Docker 镜像
build:
	docker build -t mlops-project:latest .

# 运行 Docker 容器
docker-run:
	docker run -p 8000:8000 mlops-project:latest

# 训练模型
train:
	python src/models/train.py

# 评估模型
evaluate:
	python src/models/evaluate.py
```

使用 Makefile：

```bash
# 安装依赖
make install

# 运行测试
make test

# 格式化代码
make format

# 运行服务
make run

# 构建镜像
make build
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 虚拟环境 | 隔离项目依赖，避免版本冲突 |
| 依赖管理 | 使用 requirements.txt 或 pyproject.toml 锁定版本 |
| 配置管理 | 使用 YAML 文件管理配置，支持多环境 |
| 环境变量 | 敏感信息使用环境变量，不提交到代码库 |
| 项目结构 | 标准化的目录结构，便于团队协作 |
| 自动化工具 | 使用 Makefile 或 Poetry 简化常用任务 |

---

## 6 新手常见误区

### 误区 1："直接在系统 Python 环境安装包就行"

**错！** 这样会导致：
- 不同项目的依赖冲突
- 难以复现环境
- 部署时不知道需要哪些依赖

正确做法：每个项目使用独立的虚拟环境。

### 误区 2："requirements.txt 不需要锁定版本"

**错！** 不锁定版本会导致：
- 不同环境安装的版本不一致
- 新版本可能有破坏性变更
- 难以复现问题

正确做法：使用 `==` 锁定精确版本，或使用 `^`、`~` 指定版本范围。

### 误区 3："配置文件可以提交到 Git"

**错！** 配置文件可能包含敏感信息：
- API 密钥
- 数据库密码
- 服务器地址

正确做法：
- 使用 .env 文件存储敏感信息
- 将 .env 添加到 .gitignore
- 提交配置模板文件（如 .env.example）

### 误区 4："项目结构不重要，随便放就行"

**错！** 混乱的项目结构会导致：
- 难以维护
- 团队协作困难
- 新人上手慢

正确做法：使用标准化的项目结构，保持一致性。

### 误区 5："不需要自动化脚本，手动操作就行"

**错！** 手动操作容易出错，且效率低：
- 每次都要记住命令
- 容易遗漏步骤
- 团队协作不一致

正确做法：使用 Makefile 或类似工具自动化常用任务。

---

## 7 动手练习

### 练习 1：基础练习 - 创建虚拟环境

创建一个新项目，使用 venv 创建虚拟环境，并安装 fastapi 和 uvicorn。

<details>
<summary>点击查看答案</summary>

```bash
# 创建项目目录
mkdir my-mlops-project
cd my-mlops-project

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install fastapi==0.104.1 uvicorn==0.24.0

# 导出依赖
pip freeze > requirements.txt

# 验证安装
python -c "import fastapi; print(fastapi.__version__)"
```

</details>

### 练习 2：进阶练习 - 创建项目结构

创建一个完整的 MLOps 项目结构，包括配置文件和 .gitignore。

<details>
<summary>点击查看答案</summary>

```bash
# 创建目录结构
mkdir -p src/{models,services,utils}
mkdir -p tests
mkdir -p configs
mkdir -p notebooks
mkdir -p data/{raw,processed,models}
mkdir -p logs

# 创建配置文件
cat > configs/config.yaml << 'EOF'
model:
  name: "my_model"
  version: "1.0.0"
  path: "data/models/"

server:
  host: "0.0.0.0"
  port: 8000
  workers: 4

logging:
  level: "INFO"
  file: "logs/app.log"
EOF

# 创建 .env 文件
cat > .env << 'EOF'
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
EOF

# 创建 .env.example
cat > .env.example << 'EOF'
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
EOF

# 创建 .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
venv/

# 数据文件
data/raw/
data/processed/
*.csv

# 模型文件
*.pkl
*.h5

# 环境变量
.env

# 日志
logs/
*.log
EOF

# 创建 README.md
cat > README.md << 'EOF'
# MLOps 项目

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行服务

```bash
uvicorn src.services.api:app --reload
```
EOF
```

</details>

### 练习 3（挑战）：综合练习 - 使用 Poetry 管理项目

使用 Poetry 初始化一个项目，添加依赖，并导出 requirements.txt。

<details>
<summary>点击查看答案</summary>

```bash
# 安装 Poetry
pip install poetry

# 初始化项目
poetry init --name mlops-poetry-demo --python "^3.9"

# 添加依赖
poetry add fastapi uvicorn scikit-learn pandas numpy

# 添加开发依赖
poetry add --dev pytest pytest-cov black

# 查看依赖树
poetry show --tree

# 运行脚本
poetry run python -c "import fastapi; print(fastapi.__version__)"

# 导出 requirements.txt
poetry export -f requirements.txt --output requirements.txt --without-hashes

# 安装所有依赖
poetry install
```

pyproject.toml 示例：

```toml
[tool.poetry]
name = "mlops-poetry-demo"
version = "0.1.0"
description = ""
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.1"
uvicorn = "^0.24.0"
scikit-learn = "^1.3.2"
pandas = "^2.1.3"
numpy = "^1.26.2"

[tool.poetry.dev-dependencies]
pytest = "^7.4.3"
pytest-cov = "^4.1.0"
black = "^23.11.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

</details>

---

## 下一章预告

下一章我们会学习 **模型序列化与保存**——也就是如何将训练好的模型保存到文件。你会学到：

- 模型序列化的原理和方法
- 不同模型格式的对比（pickle、joblib、ONNX、TorchScript）
- 模型元数据管理
- 模型版本控制策略

这些是模型部署的基础，掌握后你就能将训练好的模型保存并加载使用了。
