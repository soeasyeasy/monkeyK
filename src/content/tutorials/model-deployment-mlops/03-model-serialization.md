---
title: "第3章：模型序列化与保存"
description: "模型序列化技术，模型保存格式，模型元数据管理"
---

# 第3章：模型序列化与保存

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是模型序列化？为什么要序列化？
- 有哪些模型保存格式？它们有什么区别？
- 如何选择合适的序列化方式？
- 如何管理模型的元数据信息？

这一章就是为了解答这些问题。我们会深入学习模型序列化的原理和方法，掌握不同格式的特点和使用场景。

---

## 1 为什么需要模型序列化？

### 痛点分析

想象一下这个场景：你训练了一个模型，效果很好。但是每次使用都要重新训练：

```python
# 每次都要重新训练，太慢了！
model = train_model(data)  # 训练需要几个小时
result = model.predict(new_data)
```

或者更糟糕的情况：

```python
# 保存模型
import pickle
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# 加载模型
with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

# 结果报错：_pickle.UnpicklingError: invalid load key
```

> **一句话总结**：没有序列化，模型就无法持久化保存，每次都要重新训练，这是不可接受的。

### 解决方案

模型序列化就是将训练好的模型转换成可以存储和传输的格式。

打个比方：

> 模型序列化就像是给模型拍照片，保存下来以后可以随时恢复使用。

---

## 2 核心原理

### 序列化原理

序列化的本质是将内存中的对象转换成字节流或文本格式。

```
内存对象 → 序列化 → 字节流/文本 → 存储/传输 → 反序列化 → 内存对象
```

### 序列化格式对比

| 格式 | 特点 | 适用场景 | 跨平台 |
| --- | --- | --- | --- |
| pickle | Python 原生，简单快速 | Python 项目内部使用 | ❌ |
| joblib | 针对 NumPy 数组优化 | 科学计算模型 | ❌ |
| ONNX | 开放神经网络交换格式 | 跨框架部署 | ✅ |
| TorchScript | PyTorch 原生支持 | PyTorch 模型部署 | ✅ |
| SavedModel | TensorFlow 官方格式 | TensorFlow 模型 | ✅ |
| HDF5 | 层次化数据格式 | 大规模数据 | ✅ |

---

## 3 基础用法

### 使用 pickle 序列化

pickle 是 Python 内置的序列化模块：

```python
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 训练模型
iris = load_iris()
X, y = iris.data, iris.target
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# ✅ 保存模型
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# ✅ 加载模型
with open('model.pkl', 'rb') as f:
    loaded_model = pickle.load(f)

# 验证模型
result = loaded_model.predict([[5.1, 3.5, 1.4, 0.2]])
print(f"预测结果：{result}")  # 输出：[0]
```

### 使用 joblib 序列化

joblib 针对包含大量 NumPy 数组的对象进行了优化：

```python
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 训练模型
iris = load_iris()
X, y = iris.data, iris.target
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# ✅ 保存模型（推荐用于 scikit-learn 模型）
joblib.dump(model, 'model.joblib')

# ✅ 加载模型
loaded_model = joblib.load('model.joblib')

# 验证模型
result = loaded_model.predict([[5.1, 3.5, 1.4, 0.2]])
print(f"预测结果：{result}")  # 输出：[0]
```

### 使用 ONNX 格式

ONNX（Open Neural Network Exchange）是跨框架的模型格式：

```python
import torch
import torch.onnx
import torch.nn as nn

# 定义简单模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(4, 3)
    
    def forward(self, x):
        return self.fc(x)

# 创建模型
model = SimpleModel()
model.eval()

# ✅ 导出为 ONNX 格式
dummy_input = torch.randn(1, 4)
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    export_params=True,
    opset_version=11,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)

# ✅ 使用 ONNX Runtime 加载和推理
import onnxruntime as ort

# 创建推理会话
session = ort.InferenceSession("model.onnx")

# 准备输入数据
import numpy as np
input_data = np.array([[5.1, 3.5, 1.4, 0.2]], dtype=np.float32)

# 执行推理
outputs = session.run(None, {'input': input_data})
print(f"预测结果：{outputs[0]}")
```

### 使用 TorchScript

TorchScript 是 PyTorch 的序列化格式：

```python
import torch
import torch.nn as nn

# 定义模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(4, 3)
    
    def forward(self, x):
        return self.fc(x)

# 创建模型
model = SimpleModel()
model.eval()

# ✅ 方法 1：使用 torch.jit.trace
example_input = torch.randn(1, 4)
traced_model = torch.jit.trace(model, example_input)

# 保存模型
traced_model.save("model_traced.pt")

# 加载模型
loaded_model = torch.jit.load("model_traced.pt")

# 推理
result = loaded_model(example_input)
print(f"预测结果：{result}")

# ✅ 方法 2：使用 torch.jit.script（支持控制流）
scripted_model = torch.jit.script(model)
scripted_model.save("model_scripted.pt")
```

### 使用 TensorFlow SavedModel

```python
import tensorflow as tf
import numpy as np

# 创建简单模型
model = tf.keras.Sequential([
    tf.keras.layers.Dense(10, activation='relu', input_shape=(4,)),
    tf.keras.layers.Dense(3, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')

# 训练模型（示例数据）
x_train = np.random.random((100, 4))
y_train = np.random.randint(0, 3, 100)
model.fit(x_train, y_train, epochs=5, verbose=0)

# ✅ 保存为 SavedModel 格式
model.save('saved_model')

# ✅ 加载模型
loaded_model = tf.keras.models.load_model('saved_model')

# 推理
test_data = np.array([[5.1, 3.5, 1.4, 0.2]])
result = loaded_model.predict(test_data)
print(f"预测结果：{result}")
```

---

## 4 进阶用法

### 模型元数据管理

保存模型时，除了模型本身，还应该保存元数据：

```python
import joblib
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 训练模型
iris = load_iris()
X, y = iris.data, iris.target
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# 计算模型评估指标
from sklearn.metrics import accuracy_score
y_pred = model.predict(X)
accuracy = accuracy_score(y, y_pred)

# ✅ 创建模型元数据
model_metadata = {
    "model_name": "iris_classifier",
    "model_version": "1.0.0",
    "model_type": "RandomForestClassifier",
    "training_date": datetime.now().isoformat(),
    "training_data": {
        "samples": len(X),
        "features": X.shape[1],
        "classes": len(set(y))
    },
    "hyperparameters": model.get_params(),
    "metrics": {
        "accuracy": accuracy,
        "training_samples": len(X)
    },
    "feature_names": iris.feature_names,
    "target_names": iris.target_names.tolist(),
    "dependencies": {
        "scikit-learn": "1.3.2",
        "joblib": "1.3.2"
    }
}

# ✅ 保存模型和元数据
joblib.dump(model, 'model_v1.0.0.joblib')

with open('model_metadata.json', 'w', encoding='utf-8') as f:
    json.dump(model_metadata, f, indent=2, ensure_ascii=False)

print("模型和元数据保存成功")
```

### 模型版本管理

使用模型注册表管理多个版本的模型：

```python
import os
import json
import joblib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class ModelRegistry:
    """模型注册表"""
    
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
    
    def register_model(
        self,
        model_name: str,
        model_version: str,
        model,
        metrics: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ):
        """注册模型"""
        # 创建模型目录
        model_dir = self.registry_path / model_name / model_version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存模型
        model_path = model_dir / "model.joblib"
        joblib.dump(model, model_path)
        
        # 创建模型元数据
        model_info = {
            "version": model_version,
            "registered_at": datetime.now().isoformat(),
            "model_path": str(model_path),
            "metrics": metrics or {},
            "metadata": metadata or {},
            "status": "staging"  # staging, production, archived
        }
        
        # 更新注册表
        if model_name not in self.registry["models"]:
            self.registry["models"][model_name] = {"versions": {}}
        
        self.registry["models"][model_name]["versions"][model_version] = model_info
        self._save_registry()
        
        print(f"模型已注册：{model_name} v{model_version}")
    
    def load_model(self, model_name: str, model_version: str = "latest"):
        """加载模型"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        model_versions = self.registry["models"][model_name]["versions"]
        
        if model_version == "latest":
            # 获取最新版本
            model_version = sorted(model_versions.keys())[-1]
        
        if model_version not in model_versions:
            raise ValueError(f"版本不存在：{model_version}")
        
        model_info = model_versions[model_version]
        model_path = model_info["model_path"]
        
        return joblib.load(model_path)
    
    def list_models(self) -> List[str]:
        """列出所有模型"""
        return list(self.registry["models"].keys())
    
    def list_versions(self, model_name: str) -> List[str]:
        """列出模型的所有版本"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        return list(self.registry["models"][model_name]["versions"].keys())
    
    def promote_to_production(self, model_name: str, model_version: str):
        """将模型提升到生产环境"""
        if model_name not in self.registry["models"]:
            raise ValueError(f"模型不存在：{model_name}")
        
        if model_version not in self.registry["models"][model_name]["versions"]:
            raise ValueError(f"版本不存在：{model_version}")
        
        # 将其他版本设为 archived
        for version in self.registry["models"][model_name]["versions"]:
            if version != model_version:
                self.registry["models"][model_name]["versions"][version]["status"] = "archived"
        
        # 将指定版本设为 production
        self.registry["models"][model_name]["versions"][model_version]["status"] = "production"
        self._save_registry()
        
        print(f"模型 {model_name} v{model_version} 已提升到生产环境")

# 使用示例
if __name__ == "__main__":
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.datasets import load_iris
    
    # 训练模型
    iris = load_iris()
    X, y = iris.data, iris.target
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # 创建注册表
    registry = ModelRegistry()
    
    # 注册模型
    registry.register_model(
        model_name="iris_classifier",
        model_version="1.0.0",
        model=model,
        metrics={"accuracy": 0.97},
        metadata={"description": "Iris 分类模型"}
    )
    
    # 列出模型
    print(f"已注册模型：{registry.list_models()}")
    
    # 列出版本
    print(f"模型版本：{registry.list_versions('iris_classifier')}")
    
    # 加载模型
    loaded_model = registry.load_model("iris_classifier", "1.0.0")
    
    # 提升到生产环境
    registry.promote_to_production("iris_classifier", "1.0.0")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 序列化 | 将内存对象转换成可存储格式的过程 |
| pickle | Python 内置序列化模块，简单但不跨平台 |
| joblib | 针对 NumPy 数组优化，适合 scikit-learn 模型 |
| ONNX | 跨框架的神经网络交换格式 |
| TorchScript | PyTorch 的序列化格式，支持控制流 |
| SavedModel | TensorFlow 官方模型格式 |
| 元数据管理 | 保存模型的版本、指标、依赖等信息 |
| 版本管理 | 使用注册表管理多个版本的模型 |

---

## 6 新手常见误区

### 误区 1："pickle 可以序列化所有对象"

**错！** pickle 有一些限制：
- 不能序列化 lambda 函数
- 不能序列化数据库连接
- 不同 Python 版本可能不兼容
- 存在安全风险（不要加载不可信的 pickle 文件）

正确做法：了解 pickle 的限制，对于复杂对象使用专门的序列化格式。

### 误区 2："保存模型时只需要保存模型文件"

**错！** 只保存模型文件会导致：
- 不知道模型的训练数据
- 不知道模型的性能指标
- 不知道模型的依赖版本
- 难以追溯和复现

正确做法：同时保存模型元数据，包括训练数据信息、评估指标、依赖版本等。

### 误区 3："模型文件越小越好"

**错！** 模型文件大小需要权衡：
- 文件太小可能欠拟合
- 文件太大会影响加载速度和部署
- 需要根据实际场景选择合适的模型复杂度

正确做法：通过模型压缩、量化等技术减小模型体积，同时保持性能。

### 误区 4："序列化后的模型可以直接在不同环境使用"

**错！** 序列化文件可能不跨平台：
- pickle 和 joblib 不跨 Python 版本
- 某些自定义类可能无法反序列化
- 依赖库版本不一致可能导致问题

正确做法：使用跨平台格式（如 ONNX），或在部署时保证环境一致。

### 误区 5："不需要模型版本管理"

**错！** 没有版本管理会导致：
- 无法追溯模型历史
- 无法回滚到之前的版本
- 无法对比不同版本的性能
- 团队协作混乱

正确做法：使用模型注册表管理模型版本，记录每个版本的元数据。

---

## 7 动手练习

### 练习 1：基础练习 - 使用 joblib 保存和加载模型

训练一个 scikit-learn 模型，使用 joblib 保存，然后加载并验证。

<details>
<summary>点击查看答案</summary>

```python
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# 保存模型
joblib.dump(model, 'iris_model.joblib')
print("模型已保存")

# 加载模型
loaded_model = joblib.load('iris_model.joblib')
print("模型已加载")

# 验证模型
y_pred = loaded_model.predict(X)
accuracy = accuracy_score(y, y_pred)
print(f"模型准确率：{accuracy:.4f}")

# 测试新数据
new_data = [[5.1, 3.5, 1.4, 0.2]]
prediction = loaded_model.predict(new_data)
print(f"预测结果：{prediction}")
```

</details>

### 练习 2：进阶练习 - 创建模型元数据

为训练好的模型创建完整的元数据，并保存为 JSON 文件。

<details>
<summary>点击查看答案</summary>

```python
import joblib
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score, classification_report
import platform
import sys

# 训练模型
iris = load_iris()
X, y = iris.data, iris.target
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# 评估模型
y_pred = model.predict(X)
accuracy = accuracy_score(y, y_pred)
report = classification_report(y, y_pred, output_dict=True)

# 创建元数据
metadata = {
    "model_info": {
        "name": "iris_classifier",
        "version": "1.0.0",
        "type": "RandomForestClassifier",
        "description": "Iris 数据集分类模型"
    },
    "training_info": {
        "date": datetime.now().isoformat(),
        "python_version": sys.version,
        "platform": platform.system(),
        "training_samples": len(X),
        "feature_count": X.shape[1],
        "class_count": len(set(y))
    },
    "hyperparameters": model.get_params(),
    "metrics": {
        "accuracy": accuracy,
        "classification_report": report
    },
    "feature_names": iris.feature_names,
    "target_names": iris.target_names.tolist(),
    "dependencies": {
        "scikit-learn": "1.3.2",
        "joblib": "1.3.2"
    }
}

# 保存模型和元数据
joblib.dump(model, 'model_with_metadata.joblib')

with open('model_metadata.json', 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print("模型和元数据已保存")
print(f"准确率：{accuracy:.4f}")
```

</details>

### 练习 3（挑战）：综合练习 - 实现模型注册表

实现一个简单的模型注册表，支持注册、加载、版本管理。

<details>
<summary>点击查看答案</summary>

```python
import os
import json
import joblib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

class SimpleModelRegistry:
    """简单模型注册表"""
    
    def __init__(self, registry_path: str = "registry"):
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
        metrics: Optional[Dict] = None
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
            "status": "staging"
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
    # 训练模型
    iris = load_iris()
    X, y = iris.data, iris.target
    
    # 注册表
    registry = SimpleModelRegistry()
    
    # 训练并注册多个版本
    for n_estimators in [50, 100, 150]:
        model = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
        model.fit(X, y)
        
        version = f"1.0.{n_estimators}"
        registry.register(
            model_name="iris_classifier",
            version=version,
            model=model,
            metrics={"n_estimators": n_estimators}
        )
    
    # 列出模型和版本
    print(f"\n已注册模型：{registry.list_models()}")
    print(f"模型版本：{registry.list_versions('iris_classifier')}")
    
    # 加载最新版本
    latest_model = registry.load("iris_classifier", "latest")
    print(f"\n已加载最新版本模型")
```

</details>

---

## 下一章预告

下一章我们会学习 **模型推理基础**——也就是如何使用保存的模型进行预测。你会学到：

- 模型推理的流程和优化
- 批量推理与在线推理的区别
- 推理性能优化技术
- 推理服务的最佳实践

掌握这些知识后，你就能高效地使用模型进行预测了。
