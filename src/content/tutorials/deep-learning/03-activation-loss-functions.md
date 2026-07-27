---
title: "第3章：激活函数与损失函数"
description: "深入理解激活函数和损失函数的作用，掌握 ReLU、Sigmoid、Tanh 等常用函数"
---

# 第3章：激活函数与损失函数

## 本章导读

在学习神经网络时，你可能会有这些疑问：

- 为什么需要激活函数？没有激活函数会怎样？
- ReLU、Sigmoid、Tanh 有什么区别？应该用哪个？
- 损失函数是什么？如何选择合适的损失函数？
- 交叉熵损失和 MSE 损失有什么区别？

这一章会详细讲解激活函数和损失函数的原理、特点和使用场景，帮你做出正确的选择。

---

## 1 为什么需要激活函数？

### 没有激活函数的神经网络

如果没有激活函数，神经网络的每一层都只是做线性变换：

```python
# 没有激活函数的两层神经网络
z1 = W1 @ x + b1      # 第一层
z2 = W2 @ z1 + b2     # 第二层
# z2 = W2 @ (W1 @ x + b1) + b2
# z2 = (W2 @ W1) @ x + (W2 @ b1 + b2)
# z2 = W' @ x + b'    # 还是线性变换！
```

无论多少层，最终结果都是输入的线性组合，无法学习非线性关系。

打个比方：

> 没有激活函数的神经网络，就像只有加减法的计算器，无论按多少次，都只能做线性运算，无法计算乘法、除法等非线性运算。

### 激活函数的作用

激活函数引入非线性，让神经网络可以学习任意复杂的模式：

```python
# 有激活函数的两层神经网络
z1 = W1 @ x + b1      # 第一层线性变换
a1 = relu(z1)         # 激活函数引入非线性
z2 = W2 @ a1 + b2     # 第二层线性变换
a2 = relu(z2)         # 再次引入非线性
```

---

## 2 常用激活函数

### 2.1 Sigmoid 函数

**公式**：σ(z) = 1 / (1 + e^(-z))

**特点**：
- 输出范围：(0, 1)
- 平滑连续
- 导数容易计算

```python
import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    """Sigmoid 激活函数"""
    return 1 / (1 + np.exp(-z))

def sigmoid_derivative(z):
    """Sigmoid 的导数"""
    s = sigmoid(z)
    return s * (1 - s)

# 测试
z = np.array([-3, -2, -1, 0, 1, 2, 3])
print(f"输入: {z}")
print(f"Sigmoid: {sigmoid(z)}")
print(f"导数: {sigmoid_derivative(z)}")
```

**优点**：
- 输出可以解释为概率
- 适合二分类问题的输出层

**缺点**：
- 梯度消失问题：当 z 很大或很小时，导数接近 0
- 输出不是零中心的
- 计算涉及指数，较慢

### 2.2 Tanh 函数

**公式**：tanh(z) = (e^z - e^(-z)) / (e^z + e^(-z))

**特点**：
- 输出范围：(-1, 1)
- 零中心输出
- 是 Sigmoid 的平移缩放版本

```python
def tanh(z):
    """Tanh 激活函数"""
    return np.tanh(z)

def tanh_derivative(z):
    """Tanh 的导数"""
    t = tanh(z)
    return 1 - t ** 2

# 测试
z = np.array([-3, -2, -1, 0, 1, 2, 3])
print(f"输入: {z}")
print(f"Tanh: {tanh(z)}")
print(f"导数: {tanh_derivative(z)}")
```

**优点**：
- 零中心输出，收敛更快
- 比 Sigmoid 稍好

**缺点**：
- 仍有梯度消失问题
- 计算涉及指数

### 2.3 ReLU 函数

**公式**：ReLU(z) = max(0, z)

**特点**：
- 输出范围：[0, +∞)
- 计算简单
- 稀疏激活

```python
def relu(z):
    """ReLU 激活函数"""
    return np.maximum(0, z)

def relu_derivative(z):
    """ReLU 的导数"""
    return (z > 0).astype(float)

# 测试
z = np.array([-3, -2, -1, 0, 1, 2, 3])
print(f"输入: {z}")
print(f"ReLU: {relu(z)}")
print(f"导数: {relu_derivative(z)}")
```

**优点**：
- 计算速度快
- 缓解梯度消失问题
- 稀疏激活，网络更高效

**缺点**：
- Dead ReLU 问题：负区间梯度为 0，神经元可能"死亡"
- 输出不是零中心

### 2.4 Leaky ReLU

**公式**：LeakyReLU(z) = max(αz, z)，α 通常取 0.01

```python
def leaky_relu(z, alpha=0.01):
    """Leaky ReLU 激活函数"""
    return np.maximum(alpha * z, z)

def leaky_relu_derivative(z, alpha=0.01):
    """Leaky ReLU 的导数"""
    dz = np.ones_like(z)
    dz[z < 0] = alpha
    return dz

# 测试
z = np.array([-3, -2, -1, 0, 1, 2, 3])
print(f"输入: {z}")
print(f"Leaky ReLU: {leaky_relu(z)}")
print(f"导数: {leaky_relu_derivative(z)}")
```

**优点**：
- 解决 Dead ReLU 问题
- 负区间也有梯度

### 2.5 激活函数对比

| 激活函数 | 公式 | 输出范围 | 优点 | 缺点 | 使用场景 |
|---------|------|---------|------|------|---------|
| Sigmoid | 1/(1+e^-z) | (0, 1) | 输出可解释为概率 | 梯度消失、非零中心 | 二分类输出层 |
| Tanh | (e^z-e^-z)/(e^z+e^-z) | (-1, 1) | 零中心 | 梯度消失 | RNN 中常用 |
| ReLU | max(0, z) | [0, +∞) | 计算快、缓解梯度消失 | Dead ReLU | 隐藏层首选 |
| Leaky ReLU | max(αz, z) | (-∞, +∞) | 解决 Dead ReLU | 效果不稳定 | ReLU 的替代 |
| Softmax | e^zi/Σe^zj | (0, 1)，和为 1 | 多分类输出 | 计算复杂 | 多分类输出层 |

---

## 3 损失函数

### 什么是损失函数？

损失函数衡量模型预测值与真实值之间的差距。训练的目标就是最小化损失函数。

打个比方：

> 损失函数就像考试的评分标准。它告诉你答案和标准答案差多少，训练就是不断提高分数的过程。

### 3.1 均方误差（MSE）

**公式**：MSE = (1/n) Σ(y_pred - y_true)²

**适用场景**：回归问题

```python
import torch
import torch.nn as nn

# PyTorch 中的 MSE 损失
criterion = nn.MSELoss()

# 预测值和真实值
predictions = torch.tensor([2.5, 3.0, 4.5])
targets = torch.tensor([3.0, 3.0, 4.0])

# 计算损失
loss = criterion(predictions, targets)
print(f"MSE 损失: {loss.item()}")
```

**优点**：
- 平滑连续，易于优化
- 对异常值敏感

**缺点**：
- 对异常值过于敏感
- 可能导致梯度爆炸

### 3.2 平均绝对误差（MAE / L1 Loss）

**公式**：MAE = (1/n) Σ|y_pred - y_true|

```python
# PyTorch 中的 L1 损失
criterion = nn.L1Loss()

predictions = torch.tensor([2.5, 3.0, 4.5])
targets = torch.tensor([3.0, 3.0, 4.0])

loss = criterion(predictions, targets)
print(f"MAE 损失: {loss.item()}")
```

**优点**：
- 对异常值鲁棒
- 梯度稳定

**缺点**：
- 在误差为 0 时不可导

### 3.3 二元交叉熵损失（BCE）

**公式**：BCE = -(1/n) Σ[y_true·log(y_pred) + (1-y_true)·log(1-y_pred)]

**适用场景**：二分类问题

```python
# PyTorch 中的 BCE 损失
criterion = nn.BCELoss()

# 预测概率（必须经过 Sigmoid）
predictions = torch.tensor([0.7, 0.3, 0.9])
targets = torch.tensor([1.0, 0.0, 1.0])

loss = criterion(predictions, targets)
print(f"BCE 损失: {loss.item()}")
```

**注意**：使用 BCELoss 时，模型输出必须经过 Sigmoid 激活。

### 3.4 BCEWithLogitsLoss

**推荐使用**：结合了 Sigmoid 和 BCE，数值更稳定。

```python
# 推荐使用 BCEWithLogitsLoss
criterion = nn.BCEWithLogitsLoss()

# 模型原始输出（未经过 Sigmoid）
logits = torch.tensor([1.5, -0.5, 2.0])
targets = torch.tensor([1.0, 0.0, 1.0])

loss = criterion(logits, targets)
print(f"BCEWithLogitsLoss: {loss.item()}")
```

### 3.5 交叉熵损失（CrossEntropyLoss）

**适用场景**：多分类问题

```python
# PyTorch 中的交叉熵损失
criterion = nn.CrossEntropyLoss()

# 模型原始输出（未经过 Softmax）
logits = torch.tensor([[2.0, 1.0, 0.1],
                       [0.5, 2.0, 0.3]])  # 2 个样本，3 个类别
targets = torch.tensor([0, 1])  # 真实标签

loss = criterion(logits, targets)
print(f"CrossEntropyLoss: {loss.item()}")
```

**注意**：CrossEntropyLoss 内部已经包含了 Softmax，模型输出不需要再加 Softmax。

### 3.6 损失函数对比

| 损失函数 | 公式 | 适用场景 | PyTorch 类 |
|---------|------|---------|-----------|
| MSE | (1/n)Σ(ŷ-y)² | 回归 | nn.MSELoss |
| MAE | (1/n)Σ\|ŷ-y\| | 回归（鲁棒） | nn.L1Loss |
| BCE | -Σ[y·log(ŷ)+(1-y)·log(1-ŷ)] | 二分类 | nn.BCELoss |
| BCEWithLogits | Sigmoid + BCE | 二分类（推荐） | nn.BCEWithLogitsLoss |
| CrossEntropy | Softmax + NLL | 多分类 | nn.CrossEntropyLoss |

---

## 4 激活函数与损失函数的选择

### 隐藏层激活函数选择

| 场景 | 推荐激活函数 |
|-----|------------|
| 通用场景 | ReLU |
| 担心 Dead ReLU | Leaky ReLU 或 PReLU |
| RNN/LSTM | Tanh |
| 需要稀疏激活 | ReLU |

### 输出层激活函数选择

| 任务类型 | 推荐激活函数 | 损失函数 |
|---------|------------|---------|
| 回归 | 无 | MSE / MAE |
| 二分类 | Sigmoid | BCEWithLogitsLoss |
| 多分类 | 无（内部 Softmax） | CrossEntropyLoss |

---

## 5 代码实战：不同激活函数的效果对比

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# 生成 XOR 数据
np.random.seed(42)
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=np.float32)
y = np.array([[0], [1], [1], [0]], dtype=np.float32)

X_tensor = torch.tensor(X)
y_tensor = torch.tensor(y)

# 定义不同激活函数的模型
class NetWithActivation(nn.Module):
    def __init__(self, activation):
        super(NetWithActivation, self).__init__()
        self.fc1 = nn.Linear(2, 8)
        self.fc2 = nn.Linear(8, 1)
        self.activation = activation
    
    def forward(self, x):
        x = self.activation(self.fc1(x))
        x = torch.sigmoid(self.fc2(x))
        return x

# 测试不同激活函数
activations = {
    'ReLU': nn.ReLU(),
    'Tanh': nn.Tanh(),
    'Sigmoid': nn.Sigmoid(),
    'LeakyReLU': nn.LeakyReLU()
}

for name, act in activations.items():
    torch.manual_seed(42)
    model = NetWithActivation(act)
    criterion = nn.BCELoss()
    optimizer = optim.SGD(model.parameters(), lr=0.1)
    
    # 训练 1000 轮
    for epoch in range(1000):
        outputs = model(X_tensor)
        loss = criterion(outputs, y_tensor)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    
    # 测试
    with torch.no_grad():
        predictions = model(X_tensor)
        accuracy = ((predictions > 0.5).float() == y_tensor).float().mean()
        print(f"{name:10s} - 最终损失: {loss.item():.4f}, 准确率: {accuracy.item():.2%}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 激活函数作用 | 引入非线性，让神经网络学习复杂模式 |
| ReLU | 隐藏层首选，计算快，缓解梯度消失 |
| Sigmoid | 二分类输出层，输出可解释为概率 |
| Softmax | 多分类输出层，输出概率分布 |
| MSE | 回归任务常用 |
| BCEWithLogitsLoss | 二分类推荐，数值稳定 |
| CrossEntropyLoss | 多分类推荐，内部包含 Softmax |

---

## 7 新手常见误区

### 误区 1："在输出层使用 ReLU"

ReLU 输出范围是 [0, +∞)，不适合做概率输出。二分类用 Sigmoid，多分类用 Softmax（或 CrossEntropyLoss）。

### 误区 2："使用 BCELoss 时忘记 Sigmoid"

BCELoss 要求输入是概率值 (0, 1)，如果模型输出是 logits，应该使用 BCEWithLogitsLoss。

### 误区 3："使用 CrossEntropyLoss 时加了 Softmax"

CrossEntropyLoss 内部已经包含了 Softmax，再加会导致计算错误。

### 误区 4："所有层都用同一种激活函数"

不同层应该使用不同的激活函数。隐藏层通常用 ReLU，输出层根据任务选择。

---

## 8 动手练习

### 练习 1：基础练习

实现一个自定义的激活函数 Swish：f(x) = x * sigmoid(x)

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class Swish(nn.Module):
    """Swish 激活函数: f(x) = x * sigmoid(x)"""
    def __init__(self):
        super(Swish, self).__init__()
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        return x * self.sigmoid(x)

# 测试
swish = Swish()
x = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0])
print(f"输入: {x}")
print(f"Swish: {swish(x)}")

# 在模型中使用
class NetWithSwish(nn.Module):
    def __init__(self):
        super(NetWithSwish, self).__init__()
        self.fc1 = nn.Linear(2, 8)
        self.fc2 = nn.Linear(8, 1)
        self.swish = Swish()
    
    def forward(self, x):
        x = self.swish(self.fc1(x))
        x = torch.sigmoid(self.fc2(x))
        return x

model = NetWithSwish()
print(model)
```

</details>

### 练习 2：进阶练习

创建一个二分类模型，分别使用 BCELoss 和 BCEWithLogitsLoss，对比两者的区别。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

# 方法 1：使用 BCELoss（需要手动加 Sigmoid）
class ModelWithSigmoid(nn.Module):
    def __init__(self):
        super(ModelWithSigmoid, self).__init__()
        self.fc1 = nn.Linear(10, 8)
        self.fc2 = nn.Linear(8, 1)
        self.sigmoid = nn.Sigmoid()  # 必须加 Sigmoid
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.sigmoid(self.fc2(x))  # 输出概率
        return x

model1 = ModelWithSigmoid()
criterion1 = nn.BCELoss()

# 方法 2：使用 BCEWithLogitsLoss（不需要手动加 Sigmoid）
class ModelWithoutSigmoid(nn.Module):
    def __init__(self):
        super(ModelWithoutSigmoid, self).__init__()
        self.fc1 = nn.Linear(10, 8)
        self.fc2 = nn.Linear(8, 1)
        # 不需要 Sigmoid
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)  # 输出 logits
        return x

model2 = ModelWithoutSigmoid()
criterion2 = nn.BCEWithLogitsLoss()

# 测试
X = torch.randn(5, 10)
y = torch.randint(0, 2, (5, 1)).float()

# 方法 1
output1 = model1(X)
loss1 = criterion1(output1, y)
print(f"BCELoss: {loss1.item():.4f}")

# 方法 2
output2 = model2(X)
loss2 = criterion2(output2, y)
print(f"BCEWithLogitsLoss: {loss2.item():.4f}")
```

</details>

### 练习 3（挑战）：综合练习

创建一个多分类模型（10 类），使用 CrossEntropyLoss 训练，验证输出是概率分布。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiClassClassifier(nn.Module):
    def __init__(self, input_size, num_classes):
        super(MultiClassClassifier, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, num_classes)
        # 注意：不加 Softmax，CrossEntropyLoss 内部会处理
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)  # 输出 logits
        return x

# 创建模型
model = MultiClassClassifier(input_size=20, num_classes=10)
criterion = nn.CrossEntropyLoss()

# 生成模拟数据
X = torch.randn(32, 20)  # 32 个样本，20 个特征
y = torch.randint(0, 10, (32,))  # 32 个标签，0-9

# 前向传播
logits = model(X)
print(f"Logits 形状: {logits.shape}")  # (32, 10)
print(f"Logits 示例: {logits[0]}")

# 计算损失
loss = criterion(logits, y)
print(f"CrossEntropyLoss: {loss.item():.4f}")

# 转换为概率分布
probs = F.softmax(logits, dim=1)
print(f"\n概率分布形状: {probs.shape}")
print(f"概率分布示例: {probs[0]}")
print(f"概率之和: {probs[0].sum().item():.4f}")  # 应该接近 1.0

# 获取预测类别
predictions = torch.argmax(probs, dim=1)
print(f"\n预测类别: {predictions}")
print(f"真实标签: {y}")
accuracy = (predictions == y).float().mean()
print(f"准确率: {accuracy.item():.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习神经网络的核心训练算法——反向传播和优化算法。你会了解到神经网络是如何通过梯度下降来学习参数的。
