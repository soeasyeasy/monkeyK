# 第 10 章：模型训练技巧

## 本章导读

学完了基础架构之后，你可能发现"搭网络容易，训好模型难"。本章将解决以下新手常见疑问：

1. 为什么我的模型训练时 loss 震荡、收敛很慢？
2. Batch Normalization 到底在做什么？为什么加一层 BN 效果就变好？
3. Dropout 为什么能防止过拟合？训练和推理时为什么行为不一样？
4. 学习率该怎么调？什么时候该衰减？有哪些常用策略？
5. 数据不够多怎么办？数据增强有哪些常用方法？

## 技术必要性分析

直接把数据丢进网络训练，往往会遇到这些问题：

- **训练不稳定**：loss 忽大忽小，怎么调参都不收敛
- **过拟合严重**：训练集准确率 99%，测试集只有 60%
- **收敛太慢**：训练几十轮还没起色

类比一下：一个学生每天做 100 道题（batch size），但题目难度参差不齐（数据分布不一致），也没有老师提醒他"你最近进步变慢了，换个学习方法"（学习率调度），也没有适当的休息来巩固知识（正则化）。这样学习效果肯定不好。

本章介绍的训练技巧，就是给模型配上"好老师 + 好方法 + 好教材"，让训练又快又稳。

## 核心原理讲解

### 1. Batch Normalization（批归一化）

**问题**：深层网络中，每一层的输入分布会随着前面层的参数变化而不断偏移（Internal Covariate Shift），导致后面层需要不断适应新分布，训练变慢。

**原理**：对每一层的输入做归一化，拉回到均值为 0、方差为 1 的标准分布，再通过可学习的缩放和平移参数恢复表达能力。

公式：

```
μ = mean(x)           # 批次均值
σ² = var(x)           # 批次方差
x_norm = (x - μ) / √(σ² + ε)   # 归一化
y = γ * x_norm + β    # 缩放平移（γ、β 可学习）
```

类比：就像考试后把全班分数做"标准化"，让每次考试的分数分布都差不多，方便老师（网络）用稳定的标准来评判。

### 2. Dropout（随机失活）

**原理**：训练时，以概率 p 随机将一部分神经元的输出置为 0，相当于每次迭代都在训练一个"子网络"。最终模型相当于所有子网络的集成（ensemble），泛化能力更强。

类比：一个团队训练时，每次随机让几个人请假，迫使每个人都学会独立完成任务，而不是依赖某个"大佬"。这样团队整体能力更强。

注意：推理时所有神经元都参与计算，但输出要乘以 (1 - p) 来保持期望一致（PyTorch 已自动处理）。

### 3. 学习率调度（Learning Rate Scheduling）

**核心思想**：训练初期用大学习率快速收敛，后期用小学习率精细调优。

类比：下山时，一开始大步跑（大学习率），快到谷底时小步走（小学习率），避免在谷底来回跳。

常用策略：

| 策略 | 原理 | 适用场景 |
|------|------|----------|
| StepLR | 每隔固定轮数，学习率乘以 gamma | 通用，简单有效 |
| MultiStepLR | 在指定轮数处衰减 | 经验调参，如 [30, 60, 90] |
| ExponentialLR | 每轮按指数衰减 | 需要平滑衰减时 |
| CosineAnnealingLR | 按余弦曲线衰减 | 图像分类常用 |
| ReduceLROnPlateau | 监控指标不再改善时衰减 | 自适应，最推荐新手 |

### 4. 数据增强（Data Augmentation）

**原理**：对训练数据做随机变换（翻转、旋转、裁剪、调色等），让模型看到更多"不同"的样本，减少过拟合。

类比：只见过白猫的人可能不认识黑猫，但如果见过各种颜色、各种姿势的猫，就能更好地识别"猫"这个概念。

注意：增强不能改变标签语义。比如识别数字 "6"，翻转 180 度会变成 "9"，就不能用翻转增强。

## 基础用法

### Batch Normalization 使用

```python
import torch
import torch.nn as nn

# ===== 正确写法：在卷积层/全连接层后加 BN =====

# 全连接层 + BN
class FCWithBN(nn.Module):
    def __init__(self, in_features, out_features):
        super().__init__()
        self.fc = nn.Linear(in_features, out_features)    # 全连接层，注意不加 bias
        self.bn = nn.BatchNorm1d(out_features)            # 1D 批归一化，用于全连接层
        self.relu = nn.ReLU(inplace=True)                 # 激活函数

    def forward(self, x):
        x = self.fc(x)      # 先线性变换
        x = self.bn(x)      # 再做 BN 归一化
        x = self.relu(x)    # 最后激活
        return x

# 卷积层 + BN（最常见的组合）
class ConvBNBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False)  # 有 BN 时 conv 不加 bias
        self.bn = nn.BatchNorm2d(out_channels)   # 2D 批归一化，用于卷积层
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        x = self.conv(x)    # 卷积提取特征
        x = self.bn(x)      # BN 稳定分布
        x = self.relu(x)    # 非线性激活
        return x

# ===== 错误写法 =====
# 错误1：Conv2d 加了 bias=True，又接了 BN —— bias 参数浪费，BN 会抵消它
# self.conv = nn.Conv2d(3, 64, 3, bias=True)   # 多余的 bias
# self.bn = nn.BatchNorm2d(64)

# 错误2：BN 放在 ReLU 前面 —— 顺序不对，效果差
# x = self.bn(x)
# x = self.relu(x)
# x = self.fc(x)    # 顺序混乱
```

### Dropout 使用

```python
import torch
import torch.nn as nn

class DropoutModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 512)          # 第一层全连接
        self.bn1 = nn.BatchNorm1d(512)          # 批归一化
        self.dropout1 = nn.Dropout(p=0.5)       # Dropout，50% 的神经元随机失活
        self.fc2 = nn.Linear(512, 256)          # 第二层全连接
        self.bn2 = nn.BatchNorm1d(256)
        self.dropout2 = nn.Dropout(p=0.3)       # 第二层 Dropout 概率小一些
        self.fc3 = nn.Linear(256, 10)           # 输出层

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = torch.relu(x)
        x = self.dropout1(x)    # 训练时随机失活，推理时自动关闭

        x = self.fc2(x)
        x = self.bn2(x)
        x = torch.relu(x)
        x = self.dropout2(x)

        x = self.fc3(x)         # 输出层不加 Dropout
        return x

model = DropoutModel()

# 验证训练/推理模式的区别
model.train()   # 训练模式：Dropout 生效
x = torch.randn(4, 784)
out_train = model(x)
print(f"训练模式输出: {out_train.shape}")

model.eval()    # 推理模式：Dropout 关闭，输出更稳定
out_eval = model(x)
print(f"推理模式输出: {out_eval.shape}")

# 多次推理结果应该完全一致（Dropout 关闭）
out1 = model(x)
out2 = model(x)
print(f"两次推理结果一致: {torch.allclose(out1, out2)}")  # True
```

### 学习率调度器

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 简单模型
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Linear(256, 10)
)
optimizer = optim.Adam(model.parameters(), lr=0.001)  # 初始学习率 0.001

# ===== 策略1：StepLR —— 每 10 轮学习率乘以 0.1 =====
scheduler_step = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)

# ===== 策略2：MultiStepLR —— 在第 30、60、90 轮衰减 =====
scheduler_multi = optim.lr_scheduler.MultiStepLR(optimizer, milestones=[30, 60, 90], gamma=0.1)

# ===== 策略3：CosineAnnealingLR —— 余弦退火 =====
scheduler_cosine = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100, eta_min=1e-6)

# ===== 策略4：ReduceLROnPlateau —— 监控 loss，不降则衰减（推荐新手） =====
scheduler_plateau = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode='min',         # 监控的指标越小越好（如果是准确率则用 'max'）
    factor=0.5,         # 衰减系数：lr = lr * 0.5
    patience=5,         # 连续 5 轮不改善才衰减
    verbose=True        # 衰减时打印提示
)

# 训练循环示例（以 ReduceLROnPlateau 为例）
for epoch in range(100):
    # ... 训练代码 ...
    val_loss = 1.0  # 假设这是验证集 loss

    # ReduceLROnPlateau 需要传入监控指标
    scheduler_plateau.step(val_loss)

    # 其他调度器不需要传参数
    # scheduler_step.step()
    # scheduler_cosine.step()

    # 查看当前学习率
    current_lr = optimizer.param_groups[0]['lr']
    print(f"Epoch {epoch+1}, LR: {current_lr:.6f}")
```

### 数据增强

```python
import torch
from torchvision import transforms

# ===== 正确写法：训练集做增强，测试集只做归一化 =====

# 训练集变换：包含随机增强
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),  # 随机裁剪并缩放到 224x224
    transforms.RandomHorizontalFlip(p=0.5),                # 50% 概率水平翻转
    transforms.RandomRotation(15),                         # 随机旋转 ±15 度
    transforms.ColorJitter(                                # 随机调整颜色
        brightness=0.2,    # 亮度调整范围
        contrast=0.2,      # 对比度调整范围
        saturation=0.2,    # 饱和度调整范围
    ),
    transforms.ToTensor(),                                 # 转为张量并归一化到 [0, 1]
    transforms.Normalize(                                  # 标准化到均值为 0
        mean=[0.485, 0.456, 0.406],                        # ImageNet 均值
        std=[0.229, 0.224, 0.225]                          # ImageNet 标准差
    ),
])

# 测试集变换：不做增强，只做缩放和归一化
test_transform = transforms.Compose([
    transforms.Resize(256),                                # 先缩放到 256
    transforms.CenterCrop(224),                            # 中心裁剪到 224
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# ===== 错误写法 =====
# 错误1：测试集也做了随机增强 —— 测试结果不可复现，评估不准
# test_transform = transforms.Compose([
#     transforms.RandomHorizontalFlip(),  # 测试集不该做随机增强
#     transforms.ToTensor(),
# ])

# 错误2：忘记 Normalize —— 输入值范围不一致，影响模型收敛
# train_transform = transforms.Compose([
#     transforms.ToTensor(),
#     # 缺少 Normalize 步骤
# ])
```

## 进阶用法

### 综合实战：带所有训练技巧的完整模型

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from torchvision import transforms

# 定义一个完整的 CNN 模型，集成 BN、Dropout 等技巧
class AdvancedCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # 特征提取部分
        self.features = nn.Sequential(
            # 第一块：3 -> 64 通道
            nn.Conv2d(3, 64, 3, padding=1, bias=False),     # 卷积，不加 bias（后面有 BN）
            nn.BatchNorm2d(64),                              # BN 稳定分布
            nn.ReLU(inplace=True),                           # 激活
            nn.Conv2d(64, 64, 3, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                              # 池化降采样 224 -> 112
            nn.Dropout2d(p=0.1),                             # 2D Dropout，丢弃整个通道

            # 第二块：64 -> 128 通道
            nn.Conv2d(64, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                              # 112 -> 56
            nn.Dropout2d(p=0.2),

            # 第三块：128 -> 256 通道
            nn.Conv2d(128, 256, 3, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                              # 56 -> 28
            nn.Dropout2d(p=0.3),
        )

        # 分类部分
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((4, 4)),                    # 自适应池化到 4x4
            nn.Flatten(),                                    # 展平：256*4*4 = 4096
            nn.Linear(4096, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.5),                               # 全连接层后用更大的 Dropout
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# 创建模型
model = AdvancedCNN(num_classes=10)
print(model)

# 配置训练参数
criterion = nn.CrossEntropyLoss()                            # 交叉熵损失
optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)  # AdamW 带权重衰减
scheduler = optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=50, eta_min=1e-6                        # 余弦退火，50 轮
)

# 模拟训练循环
dummy_data = torch.randn(32, 3, 224, 224)                    # 模拟输入数据
dummy_labels = torch.randint(0, 10, (32,))                   # 模拟标签

for epoch in range(50):
    model.train()                                            # 切换到训练模式（BN、Dropout 生效）

    optimizer.zero_grad()                                    # 清空梯度
    outputs = model(dummy_data)                              # 前向传播
    loss = criterion(outputs, dummy_labels)                  # 计算损失
    loss.backward()                                          # 反向传播
    optimizer.step()                                         # 更新参数

    scheduler.step()                                         # 更新学习率

    if (epoch + 1) % 10 == 0:
        lr = optimizer.param_groups[0]['lr']
        print(f"Epoch [{epoch+1}/50], Loss: {loss.item():.4f}, LR: {lr:.6f}")
```

### 权重初始化技巧

```python
import torch
import torch.nn as nn

def init_weights(model):
    """常用的权重初始化方法"""
    for m in model.modules():
        if isinstance(m, nn.Conv2d):                         # 卷积层
            nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            if m.bias is not None:
                nn.init.zeros_(m.bias)                       # bias 初始化为 0
        elif isinstance(m, nn.BatchNorm2d):                  # BN 层
            nn.init.ones_(m.weight)                          # gamma 初始化为 1
            nn.init.zeros_(m.bias)                           # beta 初始化为 0
        elif isinstance(m, nn.Linear):                       # 全连接层
            nn.init.xavier_normal_(m.weight)                 # Xavier 初始化
            nn.init.zeros_(m.bias)

model = AdvancedCNN()
model.apply(init_weights)                                    # 应用到整个模型
print("权重初始化完成")

# 不同初始化方法的对比：
# | 方法              | 适用场景              | 原理                        |
# |------------------|---------------------|-----------------------------|
# | Xavier 正态/均匀  | Sigmoid、Tanh 激活   | 保持前向/反向信号方差一致       |
# | Kaiming 正态/均匀 | ReLU 激活（最常用）   | 考虑 ReLU 负半轴为 0 的特性    |
# | 正交初始化         | RNN、LSTM           | 避免梯度消失/爆炸             |
```

### 梯度裁剪

```python
import torch
import torch.nn as nn

model = nn.LSTM(input_size=10, hidden_size=20, num_layers=2, batch_first=True)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

x = torch.randn(4, 100, 10)    # batch=4, seq_len=100, features=10

for epoch in range(5):
    optimizer.zero_grad()
    output, _ = model(x)
    loss = output.sum()
    loss.backward()

    # 梯度裁剪：防止梯度爆炸（RNN/LSTM 训练时必加）
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # 梯度范数不超过 1.0

    optimizer.step()
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

# 梯度裁剪的原理：
# 如果所有参数的梯度向量组成的向量的范数 > max_norm，
# 就按比例缩小：grad = grad * max_norm / grad_norm
# 这样防止某一步梯度过大导致参数更新过猛，模型崩溃
```

## 核心知识点总结

| 技巧 | 作用 | 使用位置 | 关键参数 |
|------|------|----------|----------|
| Batch Normalization | 稳定训练、加速收敛 | Conv/Linear 之后、激活之前或之后 | 动量（默认 0.1） |
| Dropout | 防止过拟合 | 全连接层后、输出层前 | p=0.2~0.5 |
| StepLR | 周期性衰减学习率 | 每个 epoch 结束后调用 | step_size, gamma |
| ReduceLROnPlateau | 自适应衰减学习率 | 每个 epoch 结束后传入监控指标 | patience, factor |
| CosineAnnealingLR | 余弦退火衰减 | 每个 epoch 结束后调用 | T_max, eta_min |
| 数据增强 | 扩充训练数据、防过拟合 | 数据加载时通过 transforms 应用 | 根据任务选择 |
| 权重初始化 | 良好的训练起点 | 模型创建后、训练前 | Kaiming/Xavier |
| 梯度裁剪 | 防止梯度爆炸 | loss.backward() 之后、optimizer.step() 之前 | max_norm |

## 新手常见误区

### 误区 1：BN 和 Dropout 一起用出问题

Batch Normalization 和 Dropout 同时使用时，BN 的批次统计量会受到 Dropout 随机失活的影响，导致推理时行为不一致。

```python
# 错误：BN 后面紧跟 Dropout，两者互相干扰
x = self.bn(x)
x = self.dropout(x)    # BN 的统计量被 Dropout 干扰

# 正确做法：两者之间隔开，或者只用其中一个
x = self.bn(x)
x = self.relu(x)       # 中间加激活函数隔开
x = self.conv(x)       # 下一层
# 或者在深层网络中，有 BN 时可以去掉 Dropout
```

### 误区 2：学习率调度器调用位置错误

```python
# 错误：在 optimizer.step() 之前调用 scheduler
optimizer.zero_grad()
loss.backward()
scheduler.step()       # 错！此时参数还没更新
optimizer.step()

# 正确：scheduler.step() 在 optimizer.step() 之后
optimizer.zero_grad()
loss.backward()
optimizer.step()
scheduler.step()       # 对！参数更新后再调整学习率
```

### 误区 3：数据增强用到测试集

```python
# 错误：测试集也做了随机增强
test_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),    # 测试集不该有随机操作
    transforms.RandomCrop(32, 4),         # 每次结果不同，评估不可复现
    transforms.ToTensor(),
])

# 正确：测试集只做确定性变换
test_transform = transforms.Compose([
    transforms.CenterCrop(32),            # 中心裁剪，结果确定
    transforms.ToTensor(),
])
```

### 误区 4：Dropout 概率设太大

```python
# 错误：Dropout 概率 0.8，太多神经元被丢弃，模型学不到东西
self.dropout = nn.Dropout(p=0.8)

# 正确：常用范围 0.1 ~ 0.5
self.dropout1 = nn.Dropout(p=0.2)    # 浅层：小概率
self.dropout2 = nn.Dropout(p=0.5)    # 深层：大概率（更容易过拟合）
```

### 误区 5：忘记切换 train/eval 模式

```python
# 错误：推理时忘记调用 eval()，Dropout 和 BN 还在用训练模式
output = model(test_data)    # BN 用批次统计量，Dropout 还在丢神经元

# 正确：推理时必须调用 eval()
model.eval()                 # BN 用运行均值，Dropout 关闭
with torch.no_grad():        # 不计算梯度，节省内存
    output = model(test_data)
```

## 下一章预告

掌握了训练技巧后，下一步就是学会如何评估模型好不好、怎么调参让模型更强。下一章「模型评估与调优」将讲解过拟合与欠拟合的诊断方法、正则化技术、超参数搜索策略，以及如何用交叉验证做出可靠的模型选择。
