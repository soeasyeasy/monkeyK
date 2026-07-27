---
title: "第4章：反向传播与优化算法"
description: "深入理解反向传播算法和梯度下降优化方法，掌握 SGD、Adam 等优化器"
---

# 第4章：反向传播与优化算法

## 本章导读

在学习神经网络训练时，你可能会有这些疑问：

- 神经网络是如何学习的？参数是如何更新的？
- 什么是反向传播？它和梯度有什么关系？
- 梯度下降有哪些变体？应该用哪个？
- 学习率是什么？如何选择合适的学习率？

这一章会详细讲解反向传播算法和优化算法，帮你理解神经网络训练的核心机制。

---

## 1 神经网络的学习过程

### 监督学习的目标

给定训练数据 (X, y)，找到一组参数 θ，使得模型预测值 ŷ = f(X; θ) 尽可能接近真实值 y。

打个比方：

> 神经网络学习就像射箭。一开始你可能射不准，但每次射完后，你会根据箭和靶心的距离调整姿势。反向传播就是告诉你"偏了多少"，优化算法就是告诉你"如何调整"。

### 训练的基本步骤

```
1. 前向传播：计算预测值 ŷ
2. 计算损失：L(ŷ, y)
3. 反向传播：计算梯度 ∂L/∂θ
4. 更新参数：θ = θ - η·∂L/∂θ
```

---

## 2 反向传播算法

### 什么是反向传播？

反向传播（Backpropagation）是训练神经网络的核心算法，用于高效计算损失函数对每个参数的梯度。

**核心思想**：利用链式法则，从输出层向输入层逐层传播梯度。

### 链式法则

如果 z 依赖于 y，y 依赖于 x，那么：

```
∂z/∂x = (∂z/∂y) · (∂y/∂x)
```

### 反向传播的数学推导

考虑一个简单的两层神经网络：

```python
# 前向传播
z1 = W1 @ x + b1      # 第一层线性变换
a1 = relu(z1)         # 第一层激活
z2 = W2 @ a1 + b2     # 第二层线性变换
a2 = sigmoid(z2)      # 第二层激活（输出）

# 损失
L = (a2 - y)²
```

**反向传播计算梯度**：

```python
# 输出层梯度
dL/da2 = 2(a2 - y)
dL/dz2 = dL/da2 · d(a2)/d(z2) = 2(a2 - y) · a2(1-a2)  # sigmoid 导数

# 第二层参数梯度
dL/dW2 = dL/dz2 · a1.T
dL/db2 = dL/dz2

# 隐藏层梯度
dL/da1 = dL/dz2 · W2.T
dL/dz1 = dL/da1 · (z1 > 0)  # relu 导数

# 第一层参数梯度
dL/dW1 = dL/dz1 · x.T
dL/db1 = dL/dz1
```

### 反向传播的代码实现

```python
import numpy as np

# 激活函数及其导数
def relu(z):
    return np.maximum(0, z)

def relu_derivative(z):
    return (z > 0).astype(float)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def sigmoid_derivative(z):
    s = sigmoid(z)
    return s * (1 - s)

# 反向传播实现
def backward_propagation(X, y, cache, W1, W2):
    """
    X: 输入数据 (n_samples, n_features)
    y: 真实标签 (n_samples, 1)
    cache: 前向传播的缓存
    W1, W2: 权重矩阵
    """
    m = X.shape[0]  # 样本数
    
    # 从缓存中获取中间结果
    Z1, A1, Z2, A2 = cache['Z1'], cache['A1'], cache['Z2'], cache['A2']
    
    # 输出层梯度
    dZ2 = A2 - y  # (n_samples, 1)
    dW2 = (1/m) * np.dot(A1.T, dZ2)  # (hidden_size, 1)
    db2 = (1/m) * np.sum(dZ2, axis=0)  # (1,)
    
    # 隐藏层梯度
    dA1 = np.dot(dZ2, W2.T)  # (n_samples, hidden_size)
    dZ1 = dA1 * relu_derivative(Z1)  # (n_samples, hidden_size)
    dW1 = (1/m) * np.dot(X.T, dZ1)  # (n_features, hidden_size)
    db1 = (1/m) * np.sum(dZ1, axis=0)  # (hidden_size,)
    
    # 返回梯度
    grads = {
        'dW1': dW1, 'db1': db1,
        'dW2': dW2, 'db2': db2
    }
    return grads
```

---

## 3 梯度下降

### 什么是梯度下降？

梯度下降是最常用的优化算法，通过沿梯度的反方向更新参数来最小化损失函数。

**更新公式**：

```
θ = θ - η · ∂L/∂θ
```

其中 η 是学习率（learning rate）。

打个比方：

> 梯度下降就像下山。你站在山上，每一步都选择最陡的下坡方向走。学习率就是步长，太大可能跨过谷底，太小下山太慢。

### 批量梯度下降（BGD）

使用所有训练样本计算梯度：

```python
def batch_gradient_descent(X, y, model, learning_rate=0.01, epochs=1000):
    """批量梯度下降"""
    m = X.shape[0]
    
    for epoch in range(epochs):
        # 前向传播
        y_pred = model.forward(X)
        loss = compute_loss(y_pred, y)
        
        # 反向传播
        grads = model.backward(X, y)
        
        # 更新参数
        for param_name in grads:
            model.params[param_name] -= learning_rate * grads[param_name]
        
        if (epoch + 1) % 100 == 0:
            print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss:.4f}')
```

**优点**：收敛稳定
**缺点**：计算慢，内存消耗大

### 随机梯度下降（SGD）

每次只用一个样本计算梯度：

```python
def stochastic_gradient_descent(X, y, model, learning_rate=0.01, epochs=100):
    """随机梯度下降"""
    m = X.shape[0]
    
    for epoch in range(epochs):
        # 随机打乱数据
        indices = np.random.permutation(m)
        X_shuffled = X[indices]
        y_shuffled = y[indices]
        
        # 逐个样本更新
        for i in range(m):
            X_i = X_shuffled[i:i+1]
            y_i = y_shuffled[i:i+1]
            
            # 前向传播
            y_pred = model.forward(X_i)
            
            # 反向传播
            grads = model.backward(X_i, y_i)
            
            # 更新参数
            for param_name in grads:
                model.params[param_name] -= learning_rate * grads[param_name]
```

**优点**：计算快，可以在线学习
**缺点**：收敛不稳定，震荡

### 小批量梯度下降（Mini-batch SGD）

折中方案，每次用一小批样本：

```python
def mini_batch_gradient_descent(X, y, model, learning_rate=0.01, 
                                 epochs=100, batch_size=32):
    """小批量梯度下降"""
    m = X.shape[0]
    
    for epoch in range(epochs):
        # 随机打乱数据
        indices = np.random.permutation(m)
        X_shuffled = X[indices]
        y_shuffled = y[indices]
        
        # 分批次训练
        for i in range(0, m, batch_size):
            X_batch = X_shuffled[i:i+batch_size]
            y_batch = y_shuffled[i:i+batch_size]
            
            # 前向传播
            y_pred = model.forward(X_batch)
            
            # 反向传播
            grads = model.backward(X_batch, y_batch)
            
            # 更新参数
            for param_name in grads:
                model.params[param_name] -= learning_rate * grads[param_name]
```

**优点**：平衡了速度和稳定性
**缺点**：需要调整 batch_size

---

## 4 优化算法进阶

### 4.1 动量法（Momentum）

引入"速度"概念，让更新更平滑：

```python
class MomentumOptimizer:
    def __init__(self, params, learning_rate=0.01, momentum=0.9):
        self.params = params
        self.lr = learning_rate
        self.momentum = momentum
        # 初始化速度
        self.velocity = {name: np.zeros_like(p) for name, p in params.items()}
    
    def update(self, grads):
        for name in self.params:
            # 更新速度
            self.velocity[name] = self.momentum * self.velocity[name] - self.lr * grads[name]
            # 更新参数
            self.params[name] += self.velocity[name]
```

**优点**：加速收敛，减少震荡

### 4.2 AdaGrad

自适应调整每个参数的学习率：

```python
class AdaGradOptimizer:
    def __init__(self, params, learning_rate=0.01, epsilon=1e-8):
        self.params = params
        self.lr = learning_rate
        self.epsilon = epsilon
        # 初始化累积梯度平方
        self.cache = {name: np.zeros_like(p) for name, p in params.items()}
    
    def update(self, grads):
        for name in self.params:
            # 累积梯度平方
            self.cache[name] += grads[name] ** 2
            # 更新参数
            self.params[name] -= self.lr * grads[name] / (np.sqrt(self.cache[name]) + self.epsilon)
```

**优点**：自动调整学习率
**缺点**：学习率单调递减，可能过早停止学习

### 4.3 RMSProp

解决 AdaGrad 学习率单调递减的问题：

```python
class RMSPropOptimizer:
    def __init__(self, params, learning_rate=0.001, decay_rate=0.9, epsilon=1e-8):
        self.params = params
        self.lr = learning_rate
        self.decay_rate = decay_rate
        self.epsilon = epsilon
        self.cache = {name: np.zeros_like(p) for name, p in params.items()}
    
    def update(self, grads):
        for name in self.params:
            # 指数加权移动平均
            self.cache[name] = self.decay_rate * self.cache[name] + (1 - self.decay_rate) * grads[name] ** 2
            # 更新参数
            self.params[name] -= self.lr * grads[name] / (np.sqrt(self.cache[name]) + self.epsilon)
```

### 4.4 Adam 优化器

结合 Momentum 和 RMSProp，是目前最常用的优化器：

```python
class AdamOptimizer:
    def __init__(self, params, learning_rate=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.params = params
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        # 初始化一阶矩（动量）
        self.m = {name: np.zeros_like(p) for name, p in params.items()}
        # 初始化二阶矩
        self.v = {name: np.zeros_like(p) for name, p in params.items()}
        self.t = 0  # 时间步
    
    def update(self, grads):
        self.t += 1
        for name in self.params:
            # 更新一阶矩（动量）
            self.m[name] = self.beta1 * self.m[name] + (1 - self.beta1) * grads[name]
            # 更新二阶矩
            self.v[name] = self.beta2 * self.v[name] + (1 - self.beta2) * grads[name] ** 2
            
            # 偏差修正
            m_hat = self.m[name] / (1 - self.beta1 ** self.t)
            v_hat = self.v[name] / (1 - self.beta2 ** self.t)
            
            # 更新参数
            self.params[name] -= self.lr * m_hat / (np.sqrt(v_hat) + self.epsilon)
```

**优点**：
- 自适应学习率
- 动量加速收敛
- 对超参数不敏感
- 适用大多数场景

---

## 5 PyTorch 中的优化器

### 使用 PyTorch 优化器

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 定义模型
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 1)
)

# 定义损失函数
criterion = nn.MSELoss()

# 定义优化器
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练循环
X = torch.randn(100, 10)
y = torch.randn(100, 1)

for epoch in range(100):
    # 前向传播
    outputs = model(X)
    loss = criterion(outputs, y)
    
    # 反向传播
    optimizer.zero_grad()  # 清空梯度
    loss.backward()        # 计算梯度
    optimizer.step()       # 更新参数
    
    if (epoch + 1) % 20 == 0:
        print(f'Epoch [{epoch+1}/100], Loss: {loss.item():.4f}')
```

### 常用优化器对比

| 优化器 | 特点 | 适用场景 |
|-------|------|---------|
| SGD | 简单，需要手动调学习率 | 简单问题，需要精确控制 |
| SGD + Momentum | 加速收敛，减少震荡 | 需要加速收敛 |
| AdaGrad | 自适应学习率 | 稀疏梯度问题 |
| RMSProp | 解决 AdaGrad 学习率递减 | RNN 训练 |
| Adam | 自适应 + 动量 | 大多数场景（默认选择） |

---

## 6 学习率调度

### 为什么需要学习率调度？

- 训练初期：大学习率，快速收敛
- 训练后期：小学习率，精细调优

### 常用学习率调度策略

```python
import torch.optim as optim

# 定义优化器
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 1. StepLR：每 step_size 步，学习率乘以 gamma
scheduler1 = optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.1)

# 2. MultiStepLR：在指定里程碑处衰减
scheduler2 = optim.lr_scheduler.MultiStepLR(optimizer, milestones=[30, 80], gamma=0.1)

# 3. ExponentialLR：指数衰减
scheduler3 = optim.lr_scheduler.ExponentialLR(optimizer, gamma=0.9)

# 4. CosineAnnealingLR：余弦退火
scheduler4 = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

# 5. ReduceLROnPlateau：当指标不再改善时衰减
scheduler5 = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.1, patience=10)

# 使用示例
for epoch in range(100):
    # 训练...
    train_loss = train_one_epoch(model, optimizer, criterion, train_loader)
    
    # 验证
    val_loss = validate(model, criterion, val_loader)
    
    # 更新学习率
    scheduler5.step(val_loss)  # ReduceLROnPlateau 需要传入指标
    
    print(f'Epoch {epoch}, LR: {optimizer.param_groups[0]["lr"]:.6f}')
```

---

## 7 梯度问题与解决方案

### 7.1 梯度消失

**问题**：梯度在反向传播过程中逐渐变小，导致浅层参数无法更新。

**原因**：
- 使用 Sigmoid/Tanh 激活函数
- 网络层数过深
- 权重初始化不当

**解决方案**：
- 使用 ReLU 激活函数
- 使用 Batch Normalization
- 使用残差连接（ResNet）
- 合理的权重初始化

### 7.2 梯度爆炸

**问题**：梯度在反向传播过程中变得非常大，导致参数更新过大，模型不稳定。

**原因**：
- 权重初始化过大
- RNN 的长期依赖问题

**解决方案**：
- 梯度裁剪（Gradient Clipping）
- 合理的权重初始化
- Batch Normalization

```python
# 梯度裁剪示例
for epoch in range(100):
    outputs = model(X)
    loss = criterion(outputs, y)
    
    optimizer.zero_grad()
    loss.backward()
    
    # 梯度裁剪
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    
    optimizer.step()
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 反向传播 | 利用链式法则计算梯度的算法 |
| 梯度下降 | 沿梯度反方向更新参数 |
| SGD | 随机梯度下降，每次用一个样本 |
| Mini-batch SGD | 每次用一小批样本，平衡速度和稳定性 |
| Momentum | 引入动量，加速收敛 |
| Adam | 自适应学习率 + 动量，最常用 |
| 学习率调度 | 动态调整学习率，提高训练效果 |
| 梯度消失/爆炸 | 深层网络常见问题，需合理设计 |

---

## 9 新手常见误区

### 误区 1："学习率越大越好"

学习率太大会导致震荡甚至发散，太小会导致收敛慢。需要通过实验找到合适的学习率。

### 误区 2："Adam 一定比 SGD 好"

Adam 通常收敛更快，但 SGD 在某些问题上泛化能力更好。需要根据具体问题选择。

### 误区 3："忘记清空梯度"

PyTorch 中梯度会累积，每次反向传播前必须调用 `optimizer.zero_grad()`。

### 误区 4："batch_size 越大越好"

batch_size 太大会导致内存不足，且可能陷入局部最优。通常 32、64、128 是常用选择。

---

## 10 动手练习

### 练习 1：基础练习

手动实现一个简单的梯度下降优化器，用于优化一元函数 f(x) = x² + 2x + 1。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 定义函数和梯度
def f(x):
    return x**2 + 2*x + 1

def gradient(x):
    return 2*x + 2

# 梯度下降
x = 5.0  # 初始值
learning_rate = 0.1
epochs = 50

print("梯度下降优化过程:")
for epoch in range(epochs):
    grad = gradient(x)
    x = x - learning_rate * grad
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch {epoch+1}: x = {x:.4f}, f(x) = {f(x):.4f}')

print(f"\n最优解: x = {x:.4f}, f(x) = {f(x):.4f}")
print(f"理论最优解: x = -1.0, f(x) = 0.0")
```

</details>

### 练习 2：进阶练习

用 PyTorch 实现一个神经网络，分别使用 SGD 和 Adam 优化器，对比训练效果。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# 生成 XOR 数据
np.random.seed(42)
X = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
y = torch.tensor([[0], [1], [1], [0]], dtype=torch.float32)

# 定义模型
def create_model():
    return nn.Sequential(
        nn.Linear(2, 8),
        nn.ReLU(),
        nn.Linear(8, 1),
        nn.Sigmoid()
    )

# 训练函数
def train_model(model, optimizer_name, epochs=1000):
    criterion = nn.BCELoss()
    
    if optimizer_name == 'SGD':
        optimizer = optim.SGD(model.parameters(), lr=0.1)
    else:
        optimizer = optim.Adam(model.parameters(), lr=0.01)
    
    losses = []
    for epoch in range(epochs):
        outputs = model(X)
        loss = criterion(outputs, y)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        losses.append(loss.item())
    
    return losses

# 对比 SGD 和 Adam
torch.manual_seed(42)
model_sgd = create_model()
losses_sgd = train_model(model_sgd, 'SGD')

torch.manual_seed(42)
model_adam = create_model()
losses_adam = train_model(model_adam, 'Adam')

print(f"SGD 最终损失: {losses_sgd[-1]:.4f}")
print(f"Adam 最终损失: {losses_adam[-1]:.4f}")

# 测试准确率
with torch.no_grad():
    pred_sgd = (model_sgd(X) > 0.5).float()
    pred_adam = (model_adam(X) > 0.5).float()
    
    acc_sgd = (pred_sgd == y).float().mean()
    acc_adam = (pred_adam == y).float().mean()
    
    print(f"\nSGD 准确率: {acc_sgd:.2%}")
    print(f"Adam 准确率: {acc_adam:.2%}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个带有学习率调度的训练循环，使用 ReduceLROnPlateau，当验证损失不再下降时自动降低学习率。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# 生成数据
np.random.seed(42)
X_train = torch.randn(100, 10, dtype=torch.float32)
y_train = torch.randn(100, 1, dtype=torch.float32)
X_val = torch.randn(20, 10, dtype=torch.float32)
y_val = torch.randn(20, 1, dtype=torch.float32)

# 定义模型
model = nn.Sequential(
    nn.Linear(10, 32),
    nn.ReLU(),
    nn.Linear(32, 16),
    nn.ReLU(),
    nn.Linear(16, 1)
)

# 定义损失函数和优化器
criterion = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# 学习率调度器
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=10, verbose=True
)

# 训练循环
epochs = 100
best_val_loss = float('inf')

for epoch in range(epochs):
    # 训练
    model.train()
    outputs = model(X_train)
    train_loss = criterion(outputs, y_train)
    
    optimizer.zero_grad()
    train_loss.backward()
    optimizer.step()
    
    # 验证
    model.eval()
    with torch.no_grad():
        val_outputs = model(X_val)
        val_loss = criterion(val_outputs, y_val)
    
    # 学习率调度
    scheduler.step(val_loss)
    
    # 保存最佳模型
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), 'best_model.pth')
    
    if (epoch + 1) % 20 == 0:
        current_lr = optimizer.param_groups[0]['lr']
        print(f'Epoch [{epoch+1}/{epochs}], '
              f'Train Loss: {train_loss.item():.4f}, '
              f'Val Loss: {val_loss.item():.4f}, '
              f'LR: {current_lr:.6f}')

print(f"\n最佳验证损失: {best_val_loss:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 PyTorch 框架的核心功能，包括张量操作、自动求导、模型构建和数据加载。你会掌握使用 PyTorch 进行深度学习开发的基础技能。
