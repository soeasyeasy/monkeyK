---
title: "第9章：模型版本管理"
description: "模型版本控制策略，模型注册表，版本切换与回滚"
---

# 第9章：模型版本管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 模型为什么需要版本管理？
- 如何命名和组织模型版本？
- 如何快速切换和回滚模型版本？
- 如何管理模型的元数据？

这一章就是为了解答这些问题。我们会学习模型版本管理的最佳实践，掌握如何高效地管理多个模型版本。

---

## 1 为什么需要模型版本管理？

### 痛点分析

想象一下这个场景：你更新了模型，结果效果变差了：

```python
# 更新模型
model = load_model('model_v2.pkl')

# 结果：准确率从 95% 降到 70%
# 想回滚到 v1，但找不到文件了...
```

或者更糟糕的情况：

```python
# 生产环境
model_v1.pkl  # 在用
model_v2.pkl  # 测试中
model_v3.pkl  # 开发中
model_final.pkl  # 不知道是哪个版本
model_final_v2.pkl  # 越来越混乱...
```

> **一句话总结**：没有版本管理，模型更新就像开盲盒，出了问题无法回滚。

### 解决方案

模型版本管理的核心：
- **版本命名规范**：清晰的版本号
- **模型注册表**：统一管理所有版本
- **元数据记录**：记录每个版本的信息
- **快速切换**：一键切换模型版本

打个比方：

> 模型版本管理就像 Git 管理代码，可以随时切换到任何版本，知道每个版本改了什么。

---

## 2 核心原理

### 版本命名规范

常用的版本命名方式：

| 方式 | 示例 | 说明 |
| --- | --- | --- |
| 语义化版本 | v1.2.3 | 主版本.次版本.修订版本 |
| 日期版本 | v20240115 | 年月日 |
| 哈希版本 | vabc123 | Git commit hash |
| 序号版本 | v1, v2, v3 | 简单递增 |

### 语义化版本规范

```
主版本号.次版本号.修订版本号-预发布标签

示例：
1.0.0          # 正式版
1.1.0          # 新增功能
1.1.1          # 修复 bug
2.0.0-alpha    # 2.0 预览版
```

**版本号变更规则**：
- **主版本号**：不兼容的 API 变更
- **次版本号**：向下兼容的功能性新增
- **修订版本号**：向下兼容的问题修正

---

## 3 基础用法

### 简单的模型版本管理

```python
import joblib
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class SimpleModelRegistry:
    """简单模型注册表"""
    
    def __init__(self, registry_path: str = "model_registry"):
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(exist_ok=True)
        self.metadata_file = self.registry_path / "registry.json"
        self.registry = self._load_registry()
    
    def _load_registry(self) -> Dict:
        """加载注册表"""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"models": {}}
    
    def _save_registry(self):
        """保存注册表"""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.registry, f, indent=2, ensure_ascii=False)
    
    def register(
        self,
        model_name: str,
        version: str,
        model,
        metrics: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ):
        """注册模型"""
        # 创建模型目录
        model_dir = self.registry_path / model_name / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存模型
        model_path = model_dir / "model.joblib"
        joblib.dump(model, model_path)
        
        # 创建模型信息
        model_info = {
            "version": version,
            "registered_at": datetime.now().isoformat(),
            "model_path": str(model_path),
            "metrics": metrics or {},
            "metadata": metadata or {},
            "status": "staging"  # staging, production, archived
        }
        
        # 更新注册表
        if model_name not in self.registry["models"]:
            self.registry["models"][model_name] = {"versions": {}}
        
        self.registry["models"][model_name]["versions"][version] = model_info
        self._save_registry()
        
        print(f"✓ 模型已注册：{model_name} v{version}")
    
    def load(self, model_name: str, version: str = "latest"):
        """加载模型"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version == "latest":
            version = sorted(versions.keys())[-1]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        model_path = versions[version]["model_path"]
        return joblib.load(model_path)
    
    def list_models(self) -> List[str]:
        """列出所有模型"""
        return list(self.registry["models"].keys())
    
    def list_versions(self, model_name: str) -> List[str]:
        """列出模型版本"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        return list(self.registry["models"][model_name]["versions"].keys())

# 使用示例
if __name__ == "__main__":
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.datasets import load_iris
    
    # 训练模型
    iris = load_iris()
    X, y = iris.data, iris.target
    
    # 创建注册表
    registry = SimpleModelRegistry()
    
    # 注册多个版本
    for i, n_estimators in enumerate([50, 100, 150]):
        model = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
        model.fit(X, y)
        
        version = f"1.0.{i}"
        registry.register(
            model_name="iris_classifier",
            version=version,
            model=model,
            metrics={"n_estimators": n_estimators, "accuracy": 0.95 + i * 0.01}
        )
    
    # 列出模型和版本
    print(f"\n已注册模型：{registry.list_models()}")
    print(f"模型版本：{registry.list_versions('iris_classifier')}")
    
    # 加载最新版本
    latest_model = registry.load("iris_classifier", "latest")
    print(f"\n已加载最新版本模型")
```

---

## 4 进阶用法

### 完整的模型注册表

```python
import joblib
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class ModelInfo:
    """模型信息"""
    name: str
    version: str
    path: str
    registered_at: str
    metrics: Dict
    metadata: Dict
    status: str  # staging, production, archived
    tags: List[str]

class ModelRegistry:
    """完整模型注册表"""
    
    def __init__(self, registry_path: str = "model_registry"):
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(exist_ok=True)
        self.metadata_file = self.registry_path / "registry.json"
        self.registry = self._load_registry()
    
    def _load_registry(self) -> Dict:
        """加载注册表"""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"models": {}}
    
    def _save_registry(self):
        """保存注册表"""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.registry, f, indent=2, ensure_ascii=False)
    
    def register(
        self,
        model_name: str,
        version: str,
        model,
        metrics: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None
    ) -> ModelInfo:
        """注册模型"""
        # 创建模型目录
        model_dir = self.registry_path / model_name / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存模型
        model_path = model_dir / "model.joblib"
        joblib.dump(model, model_path)
        
        # 创建模型信息
        model_info = ModelInfo(
            name=model_name,
            version=version,
            path=str(model_path),
            registered_at=datetime.now().isoformat(),
            metrics=metrics or {},
            metadata=metadata or {},
            status="staging",
            tags=tags or []
        )
        
        # 更新注册表
        if model_name not in self.registry["models"]:
            self.registry["models"][model_name] = {"versions": {}}
        
        self.registry["models"][model_name]["versions"][version] = asdict(model_info)
        self._save_registry()
        
        print(f"✓ 模型已注册：{model_name} v{version}")
        return model_info
    
    def load(self, model_name: str, version: str = "latest"):
        """加载模型"""
        model_info = self.get_model_info(model_name, version)
        return joblib.load(model_info.path)
    
    def get_model_info(self, model_name: str, version: str = "latest") -> ModelInfo:
        """获取模型信息"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version == "latest":
            version = sorted(versions.keys())[-1]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        return ModelInfo(**versions[version])
    
    def list_models(self) -> List[str]:
        """列出所有模型"""
        return list(self.registry["models"].keys())
    
    def list_versions(self, model_name: str) -> List[str]:
        """列出模型版本"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        return list(self.registry["models"][model_name]["versions"].keys())
    
    def promote_to_production(self, model_name: str, version: str):
        """提升到生产环境"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        # 将其他版本设为 archived
        for v in versions:
            if v != version:
                versions[v]["status"] = "archived"
        
        # 将指定版本设为 production
        versions[version]["status"] = "production"
        self._save_registry()
        
        print(f"✓ 模型 {model_name} v{version} 已提升到生产环境")
    
    def rollback(self, model_name: str, version: str):
        """回滚到指定版本"""
        self.promote_to_production(model_name, version)
        print(f"✓ 已回滚到 {model_name} v{version}")
    
    def delete_version(self, model_name: str, version: str):
        """删除模型版本"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        # 删除模型文件
        model_path = Path(versions[version]["path"])
        if model_path.exists():
            shutil.rmtree(model_path.parent)
        
        # 从注册表中删除
        del versions[version]
        self._save_registry()
        
        print(f"✓ 已删除 {model_name} v{version}")
    
    def compare_versions(self, model_name: str, version1: str, version2: str):
        """对比两个版本"""
        info1 = self.get_model_info(model_name, version1)
        info2 = self.get_model_info(model_name, version2)
        
        print(f"\n对比 {model_name} v{version1} vs v{version2}")
        print("=" * 60)
        print(f"{'指标':<20} {'v' + version1:<15} {'v' + version2:<15}")
        print("-" * 60)
        
        all_metrics = set(info1.metrics.keys()) | set(info2.metrics.keys())
        for metric in sorted(all_metrics):
            val1 = info1.metrics.get(metric, "N/A")
            val2 = info2.metrics.get(metric, "N/A")
            print(f"{metric:<20} {str(val1):<15} {str(val2):<15}")

# 使用示例
if __name__ == "__main__":
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.datasets import load_iris
    
    # 训练模型
    iris = load_iris()
    X, y = iris.data, iris.target
    
    # 创建注册表
    registry = ModelRegistry()
    
    # 注册多个版本
    for i, n_estimators in enumerate([50, 100, 150]):
        model = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
        model.fit(X, y)
        
        version = f"1.0.{i}"
        registry.register(
            model_name="iris_classifier",
            version=version,
            model=model,
            metrics={"accuracy": 0.90 + i * 0.02, "f1_score": 0.89 + i * 0.02},
            metadata={"n_estimators": n_estimators},
            tags=["production"] if i == 2 else []
        )
    
    # 提升到生产环境
    registry.promote_to_production("iris_classifier", "1.0.2")
    
    # 对比版本
    registry.compare_versions("iris_classifier", "1.0.0", "1.0.2")
    
    # 回滚
    registry.rollback("iris_classifier", "1.0.1")
```

### 在 FastAPI 中使用模型版本管理

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
from typing import Optional

app = FastAPI()
registry = ModelRegistry()

# 当前使用的模型版本
current_model_version = "latest"
current_model = None

def load_current_model():
    """加载当前模型"""
    global current_model, current_model_version
    current_model = registry.load("iris_classifier", current_model_version)
    print(f"已加载模型：iris_classifier v{current_model_version}")

# 启动时加载模型
@app.on_event("startup")
def startup():
    load_current_model()

class PredictRequest(BaseModel):
    features: list[float]
    model_version: Optional[str] = None  # 可选：指定模型版本

@app.post("/predict")
def predict(request: PredictRequest):
    # 使用指定版本或当前版本
    if request.model_version and request.model_version != current_model_version:
        model = registry.load("iris_classifier", request.model_version)
    else:
        model = current_model
    
    # 推理
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    return {
        "prediction": prediction,
        "model_version": request.model_version or current_model_version
    }

@app.post("/admin/switch-version")
def switch_version(version: str):
    """切换模型版本"""
    global current_model_version
    try:
        # 验证版本存在
        registry.get_model_info("iris_classifier", version)
        current_model_version = version
        load_current_model()
        return {"message": f"已切换到版本 {version}"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/admin/versions")
def list_versions():
    """列出所有版本"""
    versions = registry.list_versions("iris_classifier")
    return {"versions": versions}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 版本命名 | 使用语义化版本或日期版本 |
| 模型注册表 | 统一管理所有模型版本 |
| 元数据管理 | 记录模型的指标、配置、依赖等信息 |
| 版本切换 | 快速切换到指定版本 |
| 版本回滚 | 出现问题时快速回滚 |
| 版本对比 | 对比不同版本的性能指标 |

---

## 6 新手常见误区

### 误区 1："模型文件命名用 final、final_v2 就行"

**错！** 这种命名会导致：
- 不知道哪个是最新版本
- 无法追溯历史
- 容易覆盖错误文件

正确做法：使用语义化版本号（v1.0.0、v1.1.0）。

### 误区 2："不需要记录模型元数据"

**错！** 不记录元数据会导致：
- 不知道模型是怎么训练的
- 不知道模型的性能如何
- 无法复现模型

正确做法：记录完整的元数据，包括训练数据、超参数、评估指标等。

### 误区 3："模型版本不需要回滚能力"

**错！** 没有回滚能力会导致：
- 新模型出问题无法快速恢复
- 需要手动替换文件
- 恢复时间长

正确做法：实现快速回滚机制，一键切换到历史版本。

### 误区 4："所有版本都保留，不需要清理"

**错！** 保留所有版本会导致：
- 存储空间浪费
- 管理混乱
- 查找困难

正确做法：制定版本保留策略，定期清理旧版本。

### 误区 5："模型版本管理只需要文件系统就行"

**错！** 只用文件系统会导致：
- 没有版本对比
- 没有元数据管理
- 没有权限控制

正确做法：使用模型注册表，提供完整的版本管理功能。

---

## 7 动手练习

### 练习 1：基础练习 - 实现简单版本管理

实现一个简单的模型版本管理，支持注册和加载。

<details>
<summary>点击查看答案</summary>

```python
import joblib
import json
from pathlib import Path
from datetime import datetime

class SimpleRegistry:
    def __init__(self, path="registry"):
        self.path = Path(path)
        self.path.mkdir(exist_ok=True)
        self.metadata_file = self.path / "registry.json"
        self.registry = self._load()
    
    def _load(self):
        if self.metadata_file.exists():
            with open(self.metadata_file) as f:
                return json.load(f)
        return {"models": {}}
    
    def _save(self):
        with open(self.metadata_file, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def register(self, name, version, model, metrics=None):
        model_dir = self.path / name / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / "model.joblib"
        joblib.dump(model, model_path)
        
        if name not in self.registry["models"]:
            self.registry["models"][name] = {"versions": {}}
        
        self.registry["models"][name]["versions"][version] = {
            "path": str(model_path),
            "registered_at": datetime.now().isoformat(),
            "metrics": metrics or {}
        }
        self._save()
    
    def load(self, name, version="latest"):
        versions = self.registry["models"][name]["versions"]
        if version == "latest":
            version = sorted(versions.keys())[-1]
        return joblib.load(versions[version]["path"])

# 使用
registry = SimpleRegistry()
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

iris = load_iris()
model = RandomForestClassifier()
model.fit(iris.data, iris.target)

registry.register("iris_model", "1.0.0", model, {"accuracy": 0.95})
loaded_model = registry.load("iris_model")
```

</details>

### 练习 2：进阶练习 - 实现版本切换和回滚

实现版本切换和回滚功能。

<details>
<summary>点击查看答案</summary>

```python
class ModelRegistry:
    def __init__(self, path="registry"):
        self.path = Path(path)
        self.path.mkdir(exist_ok=True)
        self.metadata_file = self.path / "registry.json"
        self.registry = self._load()
        self.current_version = {}
    
    def _load(self):
        if self.metadata_file.exists():
            with open(self.metadata_file) as f:
                return json.load(f)
        return {"models": {}}
    
    def _save(self):
        with open(self.metadata_file, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def register(self, name, version, model, metrics=None):
        model_dir = self.path / name / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / "model.joblib"
        joblib.dump(model, model_path)
        
        if name not in self.registry["models"]:
            self.registry["models"][name] = {"versions": {}, "current": None}
        
        self.registry["models"][name]["versions"][version] = {
            "path": str(model_path),
            "metrics": metrics or {},
            "status": "staging"
        }
        self._save()
    
    def switch_version(self, name, version):
        """切换版本"""
        if name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{name}")
        
        versions = self.registry["models"][name]["versions"]
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        # 更新当前版本
        self.registry["models"][name]["current"] = version
        
        # 更新状态
        for v in versions:
            versions[v]["status"] = "archived" if v != version else "production"
        
        self._save()
        print(f"✓ 已切换到 {name} v{version}")
    
    def rollback(self, name):
        """回滚到上一个版本"""
        if name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{name}")
        
        versions = list(self.registry["models"][name]["versions"].keys())
        current = self.registry["models"][name]["current"]
        
        if current and current in versions:
            idx = versions.index(current)
            if idx > 0:
                prev_version = versions[idx - 1]
                self.switch_version(name, prev_version)
            else:
                print("已经是第一个版本，无法回滚")
        else:
            print("没有当前版本信息")
    
    def load(self, name):
        """加载当前版本"""
        current = self.registry["models"][name]["current"]
        if not current:
            versions = self.registry["models"][name]["versions"]
            current = sorted(versions.keys())[-1]
        
        path = self.registry["models"][name]["versions"][current]["path"]
        return joblib.load(path)
```

</details>

### 练习 3（挑战）：综合练习 - 完整的模型注册表

实现一个完整的模型注册表，包括版本管理、元数据、对比功能。

<details>
<summary>点击查看答案</summary>

```python
import joblib
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class ModelInfo:
    name: str
    version: str
    path: str
    registered_at: str
    metrics: Dict
    metadata: Dict
    status: str
    tags: List[str]

class CompleteModelRegistry:
    def __init__(self, registry_path: str = "model_registry"):
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(exist_ok=True)
        self.metadata_file = self.registry_path / "registry.json"
        self.registry = self._load_registry()
    
    def _load_registry(self) -> Dict:
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"models": {}}
    
    def _save_registry(self):
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.registry, f, indent=2, ensure_ascii=False)
    
    def register(
        self,
        model_name: str,
        version: str,
        model,
        metrics: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None
    ) -> ModelInfo:
        model_dir = self.registry_path / model_name / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / "model.joblib"
        joblib.dump(model, model_path)
        
        model_info = ModelInfo(
            name=model_name,
            version=version,
            path=str(model_path),
            registered_at=datetime.now().isoformat(),
            metrics=metrics or {},
            metadata=metadata or {},
            status="staging",
            tags=tags or []
        )
        
        if model_name not in self.registry["models"]:
            self.registry["models"][model_name] = {"versions": {}}
        
        self.registry["models"][model_name]["versions"][version] = asdict(model_info)
        self._save_registry()
        
        return model_info
    
    def load(self, model_name: str, version: str = "latest"):
        model_info = self.get_model_info(model_name, version)
        return joblib.load(model_info.path)
    
    def get_model_info(self, model_name: str, version: str = "latest") -> ModelInfo:
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version == "latest":
            version = sorted(versions.keys())[-1]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        return ModelInfo(**versions[version])
    
    def list_models(self) -> List[str]:
        return list(self.registry["models"].keys())
    
    def list_versions(self, model_name: str) -> List[str]:
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        return list(self.registry["models"][model_name]["versions"].keys())
    
    def promote(self, model_name: str, version: str):
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        for v in versions:
            versions[v]["status"] = "archived"
        
        versions[version]["status"] = "production"
        self._save_registry()
    
    def compare(self, model_name: str, v1: str, v2: str):
        info1 = self.get_model_info(model_name, v1)
        info2 = self.get_model_info(model_name, v2)
        
        print(f"\n对比 {model_name} v{v1} vs v{v2}")
        print("=" * 60)
        print(f"{'指标':<20} {'v' + v1:<15} {'v' + v2:<15}")
        print("-" * 60)
        
        all_metrics = set(info1.metrics.keys()) | set(info2.metrics.keys())
        for metric in sorted(all_metrics):
            val1 = info1.metrics.get(metric, "N/A")
            val2 = info2.metrics.get(metric, "N/A")
            print(f"{metric:<20} {str(val1):<15} {str(val2):<15}")
    
    def delete(self, model_name: str, version: str):
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        versions = self.registry["models"][model_name]["versions"]
        
        if version not in versions:
            raise ValueError(f"版本不存在：{version}")
        
        model_path = Path(versions[version]["path"])
        if model_path.exists():
            shutil.rmtree(model_path.parent)
        
        del versions[version]
        self._save_registry()
```

</details>

---

## 下一章预告

下一章我们会学习 **模型性能优化**——也就是如何让模型推理更快。你会学到：

- 模型压缩技术
- 量化、剪枝、知识蒸馏
- 推理加速框架
- 性能优化最佳实践

掌握这些知识后，你就能显著提升模型的推理速度了。
