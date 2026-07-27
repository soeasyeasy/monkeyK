---
title: "第10章：生成对抗网络（GAN）"
description: "掌握 GAN 原理、生成器与判别器、DCGAN、图像生成实战"
---

# 第10章：生成对抗网络（GAN）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是生成对抗网络？为什么叫"对抗"？
- 生成器和判别器是如何博弈的？
- GAN 训练为什么不稳定？如何解决？
- 如何用 GAN 生成逼真的图像？

这一章就是为了解答这些问题。GAN 是生成模型的核心技术，能够生成逼真的图像、音频和文本。

---

## 1 为什么需要 GAN？

### 痛点分析

想象一下你要学习画画：

**传统方法**：老师给你看很多画，让你模仿。但你不知道什么是"好画"。

**GAN 方法**：有两个角色——一个画家（生成器）和一个评委（判别器）。画家不断生成作品，评委判断真假，两者互相竞争，共同进步。

### 生成模型的目标

```
目标：学习真实数据的分布，生成新的样本

输入：随机噪声 z
输出：逼真的图像 G(z)
```

> **一句话总结**：GAN 通过对抗训练，让生成器学会生成以假乱真的数据。

---

## 2 核心原理

### GAN 架构

打个比方：

> GAN 像造假币的：生成器是造假币的，判别器是验钞机。造假币的不断提升技术，验钞机也不断升级，最终造假币的能造出以假乱真的假币。

### 训练过程

```
生成器 G：噪声 z → 生成图像 G(z)
判别器 D：图像 → 真/假判断

训练目标：
- G 希望 D 把生成的图像判为真
- D 希望正确区分真实图像和生成图像

损失函数：
- D 的损失：正确分类真实图像和生成图像
- G 的损失：让 D 把生成图像判为真
```

---

## 3 基础 GAN 实现

### 生成器

```python
import torch
import torch.nn as nn

class Generator(nn.Module):
    def __init__(self, latent_dim=100, img_shape=(1, 28, 28)):
        super().__init__()
        self.img_shape = img_shape

        self.model = nn.Sequential(
            # 输入：100 维噪声
            nn.Linear(latent_dim, 128),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(128),

            nn.Linear(128, 256),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(256),

            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(512),

            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(1024),

            # 输出：784 维（28x28）
            nn.Linear(1024, int(torch.prod(torch.tensor(img_shape)))),
            nn.Tanh()  # 输出范围 [-1, 1]
        )

    def forward(self, z):
        img = self.model(z)
        img = img.view(img.size(0), *self.img_shape)
        return img

# 测试
generator = Generator(latent_dim=100, img_shape=(1, 28, 28))
z = torch.randn(32, 100)  # 32 个噪声向量
fake_img = generator(z)
print(f"生成图像形状: {fake_img.shape}")  # [32, 1, 28, 28]
```

### 判别器

```python
import torch
import torch.nn as nn

class Discriminator(nn.Module):
    def __init__(self, img_shape=(1, 28, 28)):
        super().__init__()

        self.model = nn.Sequential(
            # 输入：784 维（28x28）
            nn.Linear(int(torch.prod(torch.tensor(img_shape))), 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),

            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),

            nn.Linear(256, 128),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),

            # 输出：1 维（真/假）
            nn.Linear(128, 1),
            nn.Sigmoid()  # 输出概率 [0, 1]
        )

    def forward(self, img):
        img_flat = img.view(img.size(0), -1)
        validity = self.model(img_flat)
        return validity

# 测试
discriminator = Discriminator(img_shape=(1, 28, 28))
img = torch.randn(32, 1, 28, 28)
validity = discriminator(img)
print(f"判别结果形状: {validity.shape}")  # [32, 1]
```

### GAN 训练

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])  # 归一化到 [-1, 1]
])

dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

# 2. 模型配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
latent_dim = 100

generator = Generator(latent_dim=latent_dim).to(device)
discriminator = Discriminator().to(device)

# 3. 损失函数和优化器
adversarial_loss = nn.BCELoss()

optimizer_G = optim.Adam(generator.parameters(), lr=0.0002, betas=(0.5, 0.999))
optimizer_D = optim.Adam(discriminator.parameters(), lr=0.0002, betas=(0.5, 0.999))

# 4. 训练循环
num_epochs = 100

for epoch in range(num_epochs):
    for imgs, _ in dataloader:
        batch_size = imgs.size(0)
        imgs = imgs.to(device)

        # 真实标签和假标签
        valid = torch.ones(batch_size, 1, device=device)
        fake = torch.zeros(batch_size, 1, device=device)

        # -----------------
        # 训练判别器
        # -----------------
        optimizer_D.zero_grad()

        # 真实图像
        real_loss = adversarial_loss(discriminator(imgs), valid)

        # 生成图像
        z = torch.randn(batch_size, latent_dim, device=device)
        gen_imgs = generator(z)
        fake_loss = adversarial_loss(discriminator(gen_imgs.detach()), fake)

        # 判别器总损失
        d_loss = (real_loss + fake_loss) / 2
        d_loss.backward()
        optimizer_D.step()

        # -----------------
        # 训练生成器
        # -----------------
        optimizer_G.zero_grad()

        # 生成图像
        z = torch.randn(batch_size, latent_dim, device=device)
        gen_imgs = generator(z)

        # 生成器损失：让判别器把生成图像判为真
        g_loss = adversarial_loss(discriminator(gen_imgs), valid)
        g_loss.backward()
        optimizer_G.step()

    print(f"[Epoch {epoch}/{num_epochs}] [D loss: {d_loss.item():.4f}] [G loss: {g_loss.item():.4f}]")
```

---

## 4 DCGAN（深度卷积 GAN）

### DCGAN 架构特点

- 使用卷积和转置卷积代替全连接层
- 使用 BatchNorm 稳定训练
- 移除全连接层
- 生成器使用 ReLU，输出层使用 Tanh
- 判别器使用 LeakyReLU

### DCGAN 生成器

```python
import torch
import torch.nn as nn

class DCGANGenerator(nn.Module):
    def __init__(self, latent_dim=100, channels=1):
        super().__init__()

        self.init_size = 4  # 初始尺寸
        self.latent_dim = latent_dim

        self.l1 = nn.Sequential(
            nn.Linear(latent_dim, 128 * self.init_size ** 2)
        )

        self.conv_blocks = nn.Sequential(
            nn.BatchNorm2d(128),

            # 上采样：4x4 -> 8x8
            nn.Upsample(scale_factor=2),
            nn.Conv2d(128, 128, 3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),

            # 上采样：8x8 -> 16x16
            nn.Upsample(scale_factor=2),
            nn.Conv2d(128, 64, 3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),

            # 上采样：16x16 -> 32x32
            nn.Upsample(scale_factor=2),
            nn.Conv2d(64, channels, 3, stride=1, padding=1),
            nn.Tanh()
        )

    def forward(self, z):
        out = self.l1(z)
        out = out.view(out.shape[0], 128, self.init_size, self.init_size)
        img = self.conv_blocks(out)
        return img

# 测试
generator = DCGANGenerator(latent_dim=100, channels=1)
z = torch.randn(32, 100)
img = generator(z)
print(f"生成图像形状: {img.shape}")  # [32, 1, 32, 32]
```

### DCGAN 判别器

```python
import torch
import torch.nn as nn

class DCGANDiscriminator(nn.Module):
    def __init__(self, channels=1):
        super().__init__()

        def discriminator_block(in_filters, out_filters, bn=True):
            block = [nn.Conv2d(in_filters, out_filters, 3, 2, 1)]
            if bn:
                block.append(nn.BatchNorm2d(out_filters))
            block.extend([nn.LeakyReLU(0.2, inplace=True), nn.Dropout2d(0.25)])
            return block

        self.model = nn.Sequential(
            *discriminator_block(channels, 16, bn=False),
            *discriminator_block(16, 32),
            *discriminator_block(32, 64),
            *discriminator_block(64, 128),
        )

        # 32x32 -> 4x4
        ds_size = 32 // 2 ** 4
        self.adv_layer = nn.Sequential(
            nn.Linear(128 * ds_size ** 2, 1),
            nn.Sigmoid()
        )

    def forward(self, img):
        out = self.model(img)
        out = out.view(out.shape[0], -1)
        validity = self.adv_layer(out)
        return validity

# 测试
discriminator = DCGANDiscriminator(channels=1)
img = torch.randn(32, 1, 32, 32)
validity = discriminator(img)
print(f"判别结果形状: {validity.shape}")  # [32, 1]
```

---

## 5 GAN 训练技巧

### 训练不稳定问题

GAN 训练容易出现以下问题：

1. **模式崩溃**：生成器只生成少数几种样本
2. **训练不收敛**：生成器和判别器互相破坏
3. **梯度消失**：判别器太强，生成器无法学习

### 解决方案

```python
# 1. 标签平滑
real_labels = torch.ones(batch_size, 1) * 0.9  # 不是 1.0
fake_labels = torch.zeros(batch_size, 1) * 0.1  # 不是 0.0

# 2. 特征匹配
# 让生成器的中间特征与真实数据的中间特征匹配

# 3. 谱归一化
# 对判别器的权重进行谱归一化，限制其 Lipschitz 常数

# 4. 梯度惩罚（WGAN-GP）
def gradient_penalty(discriminator, real_imgs, fake_imgs):
    batch_size = real_imgs.size(0)
    alpha = torch.rand(batch_size, 1, 1, 1, device=real_imgs.device)
    interpolated = alpha * real_imgs + (1 - alpha) * fake_imgs
    interpolated.requires_grad_(True)

    d_interpolated = discriminator(interpolated)
    grad_outputs = torch.ones_like(d_interpolated, device=real_imgs.device)

    gradients = torch.autograd.grad(
        outputs=d_interpolated,
        inputs=interpolated,
        grad_outputs=grad_outputs,
        create_graph=True,
    )[0]

    gradients = gradients.view(gradients.size(0), -1)
    gp = ((gradients.norm(2, dim=1) - 1) ** 2).mean()
    return gp
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 生成器 | 从噪声生成数据 |
| 判别器 | 判断数据真假 |
| 对抗训练 | 生成器和判别器博弈 |
| DCGAN | 使用卷积的 GAN |
| 训练技巧 | 标签平滑、梯度惩罚等 |

---

## 7 新手常见误区

### 误区 1："GAN 训练很容易收敛"

**错！** GAN 训练非常不稳定，需要精心调参。

正确做法：使用成熟的架构（如 DCGAN），遵循训练技巧。

### 误区 2："判别器越强越好"

不是的。判别器太强会导致生成器梯度消失。

正确做法：平衡生成器和判别器的能力。

### 误区 3："GAN 只能生成图像"

实际上 GAN 可以生成任何类型的数据（音频、文本、3D 模型）。

正确做法：根据数据类型调整网络架构。

---

## 8 动手练习

### 练习 1：基础练习

实现一个简单的 GAN 生成器和判别器。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleGenerator(nn.Module):
    def __init__(self, latent_dim=100):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 512),
            nn.ReLU(),
            nn.Linear(512, 784),
            nn.Tanh()
        )

    def forward(self, z):
        return self.model(z).view(-1, 1, 28, 28)

class SimpleDiscriminator(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(784, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )

    def forward(self, img):
        return self.model(img.view(img.size(0), -1))

# 测试
G = SimpleGenerator()
D = SimpleDiscriminator()

z = torch.randn(32, 100)
fake_imgs = G(z)
validity = D(fake_imgs)

print(f"生成图像: {fake_imgs.shape}")
print(f"判别结果: {validity.shape}")
```

</details>

### 练习 2：进阶练习

实现 DCGAN 的生成器和判别器。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class DCGANGenerator(nn.Module):
    def __init__(self, latent_dim=100):
        super().__init__()
        self.l1 = nn.Linear(latent_dim, 128 * 4 * 4)
        self.conv_blocks = nn.Sequential(
            nn.BatchNorm2d(128),
            nn.Upsample(scale_factor=2),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Upsample(scale_factor=2),
            nn.Conv2d(128, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Upsample(scale_factor=2),
            nn.Conv2d(64, 1, 3, padding=1),
            nn.Tanh()
        )

    def forward(self, z):
        out = self.l1(z)
        out = out.view(out.size(0), 128, 4, 4)
        return self.conv_blocks(out)

class DCGANDiscriminator(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Conv2d(1, 32, 3, 2, 1),
            nn.LeakyReLU(0.2),
            nn.Dropout2d(0.25),
            nn.Conv2d(32, 64, 3, 2, 1),
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.2),
            nn.Dropout2d(0.25),
            nn.Conv2d(64, 128, 3, 2, 1),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2),
            nn.Dropout2d(0.25),
        )
        self.adv_layer = nn.Sequential(
            nn.Linear(128 * 4 * 4, 1),
            nn.Sigmoid()
        )

    def forward(self, img):
        out = self.model(img)
        out = out.view(out.size(0), -1)
        return self.adv_layer(out)

# 测试
G = DCGANGenerator()
D = DCGANDiscriminator()

z = torch.randn(32, 100)
fake_imgs = G(z)
validity = D(fake_imgs)

print(f"生成图像: {fake_imgs.shape}")
print(f"判别结果: {validity.shape}")
```

</details>

### 练习 3（挑战）：综合练习

实现完整的 GAN 训练流程，在 MNIST 数据集上生成手写数字。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])
])

dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

# 2. 模型
class Generator(nn.Module):
    def __init__(self, latent_dim=100):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(256),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(512),
            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(1024),
            nn.Linear(1024, 784),
            nn.Tanh()
        )

    def forward(self, z):
        return self.model(z).view(-1, 1, 28, 28)

class Discriminator(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(784, 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )

    def forward(self, img):
        return self.model(img.view(img.size(0), -1))

# 3. 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
latent_dim = 100

G = Generator(latent_dim).to(device)
D = Discriminator().to(device)

adversarial_loss = nn.BCELoss()
optimizer_G = optim.Adam(G.parameters(), lr=0.0002, betas=(0.5, 0.999))
optimizer_D = optim.Adam(D.parameters(), lr=0.0002, betas=(0.5, 0.999))

# 4. 训练
num_epochs = 50
for epoch in range(num_epochs):
    for imgs, _ in dataloader:
        batch_size = imgs.size(0)
        imgs = imgs.to(device)

        valid = torch.ones(batch_size, 1, device=device)
        fake = torch.zeros(batch_size, 1, device=device)

        # 训练判别器
        optimizer_D.zero_grad()
        real_loss = adversarial_loss(D(imgs), valid)
        z = torch.randn(batch_size, latent_dim, device=device)
        gen_imgs = G(z)
        fake_loss = adversarial_loss(D(gen_imgs.detach()), fake)
        d_loss = (real_loss + fake_loss) / 2
        d_loss.backward()
        optimizer_D.step()

        # 训练生成器
        optimizer_G.zero_grad()
        z = torch.randn(batch_size, latent_dim, device=device)
        gen_imgs = G(z)
        g_loss = adversarial_loss(D(gen_imgs), valid)
        g_loss.backward()
        optimizer_G.step()

    print(f"[Epoch {epoch}/{num_epochs}] [D loss: {d_loss.item():.4f}] [G loss: {g_loss.item():.4f}]")
```

</details>

---

## 下一章预告

下一章我们会学习 **迁移学习与模型微调**——如何利用预训练模型快速构建强大的深度学习应用。你会学到如何加载预训练模型，以及如何针对自己的任务进行微调。