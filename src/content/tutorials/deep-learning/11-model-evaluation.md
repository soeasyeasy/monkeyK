# 第 11 章：模型评估与调优

## 本章导读

模型训练完了，怎么知道它好不好？怎么让它更好？本章将解决以下问题：

1. 训练集准确率 99%，测试集只有 60%，这是过拟合还是欠拟合？怎么判断？
2. 有哪些指标可以衡量模型的好坏？准确率够用吗？
3. 正则化是什么？L1、L2 正则化有什么区别？怎么用？
4. 超参数（学习率、层数、神经元个数）怎么调？靠感觉吗？
5. 交叉验证是什么？为什么要用它？

## 技术必要性分析

很多新手训练模型时，只看训练集准确率，觉得"训练集 99% 就是好模型"。但实际部署后效果一塌糊涂——这就是典型的过拟合，模型"死记硬背"了训练数据，遇到新数据就懵了。

类比：一个学生做练习题时，把答案背得滚瓜烂熟（训练集 99%），但考试时换个题型就不会了（测试集 60%）。这说明他没有真正理解知识，只是机械记忆。

本章的评估与调优技术，就是帮你诊断模型的"学习状态"，找到问题根源，并通过科学的方法让模型真正学会知识。

## 核心原理讲解

### 1. 过拟合与欠拟合

**欠拟合（Underfitting）**：模型太简单，连训练数据都学不好。

- 表现：训练集准确率低，测试集准确率也低
- 原因：模型容量不足（层数太少、神经元太少）、特征不够、训练不充分
- 类比：让小学生做微积分，题目太难，根本不会做

**过拟合（Overfitting）**：模型太复杂，把训练数据的噪声也学进去了。

- 表现：训练集准确率很高，测试集准确率明显低于训练集
- 原因：模型容量过大、数据太少、训练轮数太多、正则化不够
- 类比：学生把练习题的答案背下来了，但没理解原理，考试换题就不会

**正常拟合**：模型学到了数据的真实规律，训练集和测试集准确率都高且接近。

诊断方法：画学习曲线（Learning Curve），观察训练集和验证集的 loss/准确率随训练轮数的变化。

### 2. 评估指标

**分类任务常用指标**：

| 指标 | 公式 | 适用场景 |
|------|------|----------|
| 准确率（Accuracy） | (TP + TN) / (TP + TN + FP + FN) | 类别均衡时 |
| 精确率（Precision） | TP / (TP + FP) | 关注误报（False Positive）时 |
| 召回率（Recall） | TP / (TP + FN) | 关注漏报（False Negative）时 |
| F1 Score | 2 * P * R / (P + R) | 需要平衡精确率和召回率时 |
| AUC-ROC | ROC 曲线下面积 | 二分类问题，类别不均衡时 |

TP（True Positive）：真正例，预测为正，实际也为正
FP（False Positive）：假正例，预测为正，实际为负（误报）
FN（False Negative）：假负例，预测为负，实际为正（漏报）
TN（True Negative）：真负例，预测为负，实际也为负

**回归任务常用指标**：

| 指标 | 公式 | 说明 |
|------|------|------|
| MSE（均方误差） | mean((y_pred - y_true)²) | 对大误差敏感 |
| RMSE（均方根误差） | sqrt(MSE) | 与原始数据同单位 |
| MAE（平均绝对误差） | mean(|y_pred - y_true|) | 对异常值鲁棒 |
| R²（决定系数） | 1 - SS_res / SS_tot | 越接近 1 越好 |

### 3. 正则化（Regularization）

**核心思想**：在损失函数中加入对模型复杂度的惩罚项，防止模型过拟合。

**L1 正则化（Lasso）**：

```
Loss = Original_Loss + λ * Σ|w|
```

- 特点：让部分权重变为 0，产生稀疏模型，可做特征选择
- 类比：强制淘汰不重要的特征，只保留最关键的几个

**L2 正则化（Ridge / Weight Decay）**：

```
Loss = Original_Loss + λ * Σw²
```

- 特点：让权重趋近于 0 但不为 0，模型更平滑
- 类比：不让任何特征的影响力太大，大家平均用力

**Dropout**：前面章节讲过，也是一种正则化方法，通过随机失活神经元来防止过拟合。

### 4. 超参数调优

**超参数**：训练前人为设定的参数，如学习率、层数、batch size、正则化系数等。

**调参方法**：

| 方法 | 原理 | 适用场景 |
|------|------|----------|
| 网格搜索（Grid Search） | 穷举所有参数组合 | 参数少、计算资源充足 |
| 随机搜索（Random Search） | 随机采样参数组合 | 参数多、效率高 |
| 贝叶斯优化（Bayesian Optimization） | 用概率模型指导搜索 | 计算成本高、参数复杂 |
| 手动调参 | 凭经验和直觉 | 快速原型、初步探索 |

### 5. 交叉验证（Cross-Validation）

**问题**：如果只划分一次训练集和测试集，结果可能偶然性很大（取决于怎么划分）。

**K 折交叉验证**：将数据分成 K 份，每次用 K-1 份训练、1 份验证，重复 K 次，取平均结果。

类比：考试不只考一次，而是考 K 次，每次换不同的题目（验证集），最后取平均分，更能反映真实水平。

最常用的 K=5 或 K=10。

## 基础用法

### 评估指标计算

```python
import torch
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# 模拟预测结果（二分类）
y_true = np.array([1, 0, 1, 1, 0, 1, 0, 0, 1, 0])    # 真实标签
y_pred = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 0])    # 模型预测

# 计算各项指标
accuracy = accuracy_score(y_true, y_pred)              # 准确率
precision = precision_score(y_true, y_pred)            # 精确率
recall = recall_score(y_true, y_pred)                  # 召回率
f1 = f1_score(y_true, y_pred)                          # F1 分数
conf_matrix = confusion_matrix(y_true, y_pred)         # 混淆矩阵

print(f"准确率: {accuracy:.4f}")                       # 0.8000
print(f"精确率: {precision:.4f}")                      # 0.7500
print(f"召回率: {recall:.4f}")                         # 0.7500
print(f"F1 分数: {f1:.4f}")                            # 0.7500
print(f"混淆矩阵:\n{conf_matrix}")                     # [[3 1] [1 5]]

# 混淆矩阵解读：
#              预测为负  预测为正
# 实际为负      TN=3     FP=1
# 实际为正      FN=1     TP=5

# 多分类问题
y_true_multi = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2])
y_pred_multi = np.array([0, 1, 1, 0, 2, 2, 0, 1, 0])

# 多分类需要指定 average 参数
accuracy_multi = accuracy_score(y_true_multi, y_pred_multi)
precision_multi = precision_score(y_true_multi, y_pred_multi, average='macro')  # 宏平均
recall_multi = recall_score(y_true_multi, y_pred_multi, average='macro')
f1_multi = f1_score(y_true_multi, y_pred_multi, average='macro')

print(f"\n多分类准确率: {accuracy_multi:.4f}")
print(f"多分类精确率（宏平均）: {precision_multi:.4f}")
print(f"多分类召回率（宏平均）: {recall_multi:.4f}")
print(f"多分类 F1（宏平均）: {f1_multi:.4f}")
```

### 正则化使用

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 简单模型
model = nn.Sequential(
    nn.Linear(100, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 10)
)

# ===== 方法1：在优化器中使用 weight_decay（L2 正则化） =====
optimizer_l2 = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)  # L2 正则化系数

# ===== 方法2：手动添加 L1 正则化 =====
def l1_regularization(model, lambda_l1=1e-4):
    """手动计算 L1 正则化项"""
    l1_reg = torch.tensor(0., requires_grad=True, device='cuda')
    for name, param in model.named_parameters():
        if 'weight' in name:  # 只对权重做正则化，不对 bias 做
            l1_reg = l1_reg + torch.abs(param).sum()
    return lambda_l1 * l1_reg

# 训练循环（带 L1 正则化）
criterion = nn.CrossEntropyLoss()
x = torch.randn(32, 100)
y = torch.randint(0, 10, (32,))

optimizer = optim.Adam(model.parameters(), lr=0.001)

for epoch in range(10):
    optimizer.zero_grad()
    outputs = model(x)
    loss = criterion(outputs, y)                     # 原始损失

    # 添加 L1 正则化
    l1_reg = l1_regularization(model, lambda_l1=1e-4)
    total_loss = loss + l1_reg                       # 总损失 = 原始损失 + 正则化

    total_loss.backward()
    optimizer.step()

    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}, L1 Reg: {l1_reg.item():.4f}, Total: {total_loss.item():.4f}")

# ===== L1 vs L2 对比 =====
# | 特性          | L1 正则化              | L2 正则化              |
# |--------------|----------------------|----------------------|
# | 稀疏性        | 产生稀疏权重（部分为 0）   | 权重趋近 0 但不为 0      |
# | 特征选择      | 可做特征选择            | 不能做特征选择           |
# | 计算复杂度     | 不可导（需用次梯度）       | 处处可导，计算简单        |
# | 适用场景      | 特征多、想筛选关键特征     | 通用，防止过拟合          |
# | PyTorch 实现  | 手动添加               | weight_decay 参数      |
```

### 学习曲线绘制

```python
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt

# 模拟训练过程
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 2)
)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# 模拟数据
x_train = torch.randn(200, 20)
y_train = torch.randint(0, 2, (200,))
x_val = torch.randn(50, 20)
y_val = torch.randint(0, 2, (50,))

train_losses = []
val_losses = []

for epoch in range(50):
    # 训练
    model.train()
    optimizer.zero_grad()
    train_out = model(x_train)
    train_loss = criterion(train_out, y_train)
    train_loss.backward()
    optimizer.step()

    # 验证
    model.eval()
    with torch.no_grad():
        val_out = model(x_val)
        val_loss = criterion(val_out, y_val)

    train_losses.append(train_loss.item())
    val_losses.append(val_loss.item())

# 绘制学习曲线
plt.figure(figsize=(10, 6))
plt.plot(range(1, 51), train_losses, label='Training Loss', linewidth=2)
plt.plot(range(1, 51), val_losses, label='Validation Loss', linewidth=2)
plt.xlabel('Epoch', fontsize=12)
plt.ylabel('Loss', fontsize=12)
plt.title('Learning Curve', fontsize=14)
plt.legend(fontsize=12)
plt.grid(True, alpha=0.3)
plt.show()

# 学习曲线解读：
# 1. 训练集 loss 下降，验证集 loss 也下降 -> 正常训练
# 2. 训练集 loss 下降，验证集 loss 上升 -> 过拟合（从上升点开始加正则化或早停）
# 3. 训练集 loss 和验证集 loss 都很高 -> 欠拟合（增加模型容量或减少正则化）
# 4. 训练集 loss 和验证集 loss 很接近 -> 模型泛化能力好
```

### 早停（Early Stopping）

```python
import torch
import torch.nn as nn

class EarlyStopping:
    """早停策略：验证集 loss 不再下降时停止训练"""
    def __init__(self, patience=7, verbose=False, delta=0):
        """
        Args:
            patience (int): 容忍多少轮不改善
            verbose (bool): 是否打印提示
            delta (float): 最小改善幅度
        """
        self.patience = patience
        self.verbose = verbose
        self.delta = delta
        self.counter = 0
        self.best_loss = None
        self.early_stop = False
        self.best_model_state = None

    def __call__(self, val_loss, model):
        if self.best_loss is None:
            self.best_loss = val_loss
            self.best_model_state = {k: v.clone() for k, v in model.state_dict().items()}
        elif val_loss > self.best_loss - self.delta:
            # 没有改善
            self.counter += 1
            if self.verbose:
                print(f'EarlyStopping counter: {self.counter} out of {self.patience}')
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            # 有改善
            self.best_loss = val_loss
            self.best_model_state = {k: v.clone() for k, v in model.state_dict().items()}
            self.counter = 0

# 使用示例
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 2)
)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)
early_stopping = EarlyStopping(patience=10, verbose=True)

# 模拟训练
for epoch in range(100):
    # ... 训练代码 ...
    val_loss = 1.0  # 假设这是验证集 loss

    early_stopping(val_loss, model)

    if early_stopping.early_stop:
        print(f"Early stopping at epoch {epoch+1}")
        # 恢复最佳模型
        model.load_state_dict(early_stopping.best_model_state)
        break

# 早停的原理：
# 训练过程中，验证集 loss 先下降后上升（过拟合开始），
# 早停在 loss 开始上升时停止，并恢复 loss 最低时的模型参数，
# 防止模型继续训练导致过拟合加重。
```

## 进阶用法

### 网格搜索调参

```python
import torch
import torch.nn as nn
import torch.optim as optim
from itertools import product

# 定义模型构建函数
def build_model(hidden_size, num_layers, dropout_rate):
    layers = []
    in_features = 20
    for i in range(num_layers):
        layers.append(nn.Linear(in_features, hidden_size))
        layers.append(nn.ReLU())
        layers.append(nn.Dropout(dropout_rate))
        in_features = hidden_size
    layers.append(nn.Linear(in_features, 2))
    return nn.Sequential(*layers)

# 定义超参数网格
param_grid = {
    'hidden_size': [32, 64, 128],                    # 隐藏层神经元个数
    'num_layers': [1, 2, 3],                         # 隐藏层层数
    'dropout_rate': [0.1, 0.3, 0.5],                 # Dropout 概率
    'lr': [0.001, 0.01, 0.1],                        # 学习率
    'weight_decay': [0, 1e-4, 1e-3]                  # L2 正则化系数
}

# 生成所有参数组合
param_combinations = list(product(*param_grid.values()))
print(f"总共有 {len(param_combinations)} 种参数组合")

# 网格搜索
best_val_loss = float('inf')
best_params = None
best_model = None

# 模拟数据
x_train = torch.randn(200, 20)
y_train = torch.randint(0, 2, (200,))
x_val = torch.randn(50, 20)
y_val = torch.randint(0, 2, (50,))

for idx, (hidden_size, num_layers, dropout_rate, lr, weight_decay) in enumerate(param_combinations):
    model = build_model(hidden_size, num_layers, dropout_rate)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
    criterion = nn.CrossEntropyLoss()

    # 训练 20 轮
    for epoch in range(20):
        model.train()
        optimizer.zero_grad()
        out = model(x_train)
        loss = criterion(out, y_train)
        loss.backward()
        optimizer.step()

    # 验证
    model.eval()
    with torch.no_grad():
        val_out = model(x_val)
        val_loss = criterion(val_out, y_val).item()

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        best_params = {
            'hidden_size': hidden_size,
            'num_layers': num_layers,
            'dropout_rate': dropout_rate,
            'lr': lr,
            'weight_decay': weight_decay
        }
        best_model = model.state_dict()

    if (idx + 1) % 50 == 0:
        print(f"已测试 {idx + 1}/{len(param_combinations)} 种组合")

print(f"\n最佳参数: {best_params}")
print(f"最佳验证损失: {best_val_loss:.4f}")

# 网格搜索的缺点：参数组合太多时计算成本爆炸
# 3 * 3 * 3 * 3 * 3 = 243 种组合，每种训练 20 轮，总共 4860 次训练
```

### 随机搜索调参

```python
import random

# 随机搜索：从参数空间中随机采样
def random_search(n_iterations=50):
    """随机搜索超参数"""
    best_val_loss = float('inf')
    best_params = None

    for i in range(n_iterations):
        # 随机采样参数
        hidden_size = random.choice([32, 64, 128, 256])
        num_layers = random.choice([1, 2, 3, 4])
        dropout_rate = random.uniform(0.0, 0.5)
        lr = 10 ** random.uniform(-4, -1)            # 对数均匀采样
        weight_decay = 10 ** random.uniform(-5, -2)

        model = build_model(hidden_size, num_layers, dropout_rate)
        optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
        criterion = nn.CrossEntropyLoss()

        # 训练 20 轮
        for epoch in range(20):
            model.train()
            optimizer.zero_grad()
            out = model(x_train)
            loss = criterion(out, y_train)
            loss.backward()
            optimizer.step()

        # 验证
        model.eval()
        with torch.no_grad():
            val_out = model(x_val)
            val_loss = criterion(val_out, y_val).item()

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_params = {
                'hidden_size': hidden_size,
                'num_layers': num_layers,
                'dropout_rate': dropout_rate,
                'lr': lr,
                'weight_decay': weight_decay
            }

        if (i + 1) % 10 == 0:
            print(f"迭代 {i+1}/{n_iterations}, 当前最佳验证损失: {best_val_loss:.4f}")

    return best_params, best_val_loss

best_params, best_val_loss = random_search(n_iterations=50)
print(f"\n随机搜索最佳参数: {best_params}")
print(f"随机搜索最佳验证损失: {best_val_loss:.4f}")

# 随机搜索 vs 网格搜索：
# | 特性          | 网格搜索              | 随机搜索              |
# |--------------|---------------------|---------------------|
# | 搜索方式      | 穷举所有组合           | 随机采样              |
# | 计算成本      | 参数多时爆炸           | 可控，可指定迭代次数     |
# | 找到最优解概率 | 一定能找到（在网格内）    | 不一定，但效率高        |
# | 适用场景      | 参数少（< 5 个）       | 参数多、计算资源有限     |
```

### K 折交叉验证

```python
import torch
from torch.utils.data import TensorDataset, DataLoader

def k_fold_cross_validation(model_fn, x_data, y_data, k=5, epochs=20, lr=0.01):
    """K 折交叉验证"""
    n_samples = x_data.shape[0]
    fold_size = n_samples // k
    indices = list(range(n_samples))

    val_losses = []

    for fold in range(k):
        print(f"\n===== Fold {fold + 1}/{k} =====")

        # 划分训练集和验证集
        val_start = fold * fold_size
        val_end = val_start + fold_size
        val_indices = indices[val_start:val_end]
        train_indices = indices[:val_start] + indices[val_end:]

        x_train_fold = x_data[train_indices]
        y_train_fold = y_data[train_indices]
        x_val_fold = x_data[val_indices]
        y_val_fold = y_data[val_indices]

        # 构建模型
        model = model_fn()
        optimizer = optim.Adam(model.parameters(), lr=lr)
        criterion = nn.CrossEntropyLoss()

        # 训练
        for epoch in range(epochs):
            model.train()
            optimizer.zero_grad()
            out = model(x_train_fold)
            loss = criterion(out, y_train_fold)
            loss.backward()
            optimizer.step()

        # 验证
        model.eval()
        with torch.no_grad():
            val_out = model(x_val_fold)
            val_loss = criterion(val_out, y_val_fold).item()

        val_losses.append(val_loss)
        print(f"Fold {fold + 1} 验证损失: {val_loss:.4f}")

    # 计算平均验证损失
    mean_loss = sum(val_losses) / len(val_losses)
    std_loss = torch.tensor(val_losses).std().item()

    print(f"\n===== 交叉验证结果 =====")
    print(f"平均验证损失: {mean_loss:.4f} ± {std_loss:.4f}")
    print(f"各折验证损失: {[f'{l:.4f}' for l in val_losses]}")

    return mean_loss, std_loss

# 使用示例
def model_fn():
    return nn.Sequential(
        nn.Linear(20, 64),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(64, 2)
    )

x_data = torch.randn(300, 20)
y_data = torch.randint(0, 2, (300,))

mean_loss, std_loss = k_fold_cross_validation(
    model_fn=model_fn,
    x_data=x_data,
    y_data=y_data,
    k=5,
    epochs=20,
    lr=0.01
)

# 交叉验证的意义：
# 1. 更可靠的评估：不依赖单次划分，结果更稳定
# 2. 充分利用数据：每个样本都当过验证集
# 3. 模型选择：用交叉验证的平均损失来比较不同模型
```

## 核心知识点总结

| 概念 | 定义 | 诊断方法 | 解决方法 |
|------|------|----------|----------|
| 欠拟合 | 模型太简单，学不好训练数据 | 训练集和测试集 loss 都高 | 增加模型容量、减少正则化、训练更久 |
| 过拟合 | 模型太复杂，记住训练数据 | 训练集 loss 低，测试集 loss 高 | 加正则化、加 Dropout、数据增强、早停 |
| 精确率 | 预测为正中，真正为正的比例 | - | 提高分类阈值 |
| 召回率 | 真正为正中，预测为正的比例 | - | 降低分类阈值 |
| L1 正则化 | 权重绝对值之和的惩罚 | - | 产生稀疏模型，特征选择 |
| L2 正则化 | 权重平方和的惩罚 | - | 权重趋近 0，防止过拟合 |
| 早停 | 验证集 loss 不降时停止 | 学习曲线 | 设置 patience 参数 |
| 交叉验证 | K 折划分训练/验证 | - | 更可靠的模型评估 |

## 新手常见误区

### 误区 1：只看准确率，不看其他指标

```python
# 错误：类别不均衡时，准确率会误导
# 比如 99 个负样本，1 个正样本，模型全预测为负，准确率 99%，但正样本一个没抓到

# 正确：类别不均衡时，看精确率、召回率、F1、AUC
from sklearn.metrics import classification_report

y_true = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]    # 9 个负样本，1 个正样本
y_pred = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]    # 全预测为负

print(classification_report(y_true, y_pred))
# 准确率 90%，但正样本的精确率和召回率都是 0
# 这时候应该看 F1 分数或 AUC
```

### 误区 2：正则化系数设太大

```python
# 错误：weight_decay 设 0.1，正则化太强，模型欠拟合
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=0.1)

# 正确：从小的正则化系数开始，逐步调大
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)  # 常用范围 1e-5 ~ 1e-3
```

### 误区 3：验证集信息泄露

```python
# 错误：用验证集调参，验证集变成了"训练集"的一部分
# 每次调参后都用验证集评估，模型间接"记住"了验证集

# 正确：划分训练集、验证集、测试集
# 训练集：训练模型
# 验证集：调参、选模型
# 测试集：最终评估，只用一次

from torch.utils.data import random_split

dataset = TensorDataset(x_data, y_data)
train_size = int(0.7 * len(dataset))
val_size = int(0.15 * len(dataset))
test_size = len(dataset) - train_size - val_size

train_dataset, val_dataset, test_dataset = random_split(dataset, [train_size, val_size, test_size])

# 训练时用 train_dataset
# 调参时用 val_dataset
# 最终评估用 test_dataset，且只评估一次
```

### 误区 4：交叉验证时数据预处理泄露

```python
# 错误：先做标准化，再划分 K 折
# 标准化时用到了验证集的信息（均值、方差）

from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
x_scaled = scaler.fit_transform(x_data)    # 用全部数据计算均值方差
# 然后做交叉验证 -> 验证集的统计信息泄露到训练集

# 正确：在每一折内分别做标准化
for fold in range(k):
    x_train_fold = x_data[train_indices]
    x_val_fold = x_data[val_indices]

    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train_fold)    # 只用训练集 fit
    x_val_scaled = scaler.transform(x_val_fold)            # 验证集用训练集的统计量 transform
```

### 误区 5：早停 patience 设太小

```python
# 错误：patience=2，验证集 loss 连续 2 轮不降就停止
# 可能只是训练过程中的正常波动，模型还没收敛

early_stopping = EarlyStopping(patience=2)    # 太敏感

# 正确：patience 设 5~20，给模型足够的机会恢复
early_stopping = EarlyStopping(patience=10)   # 容忍 10 轮不改善
```

## 下一章预告

学会了模型评估与调优后，下一章将进入计算机视觉实战，讲解如何用深度学习做图像分类、目标检测、图像分割，以及如何使用迁移学习快速构建高性能视觉模型。
