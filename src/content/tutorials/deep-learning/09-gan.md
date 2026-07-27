---
title: "第9章：生成对抗网络（GAN）"
description: "深入理解 GAN 的原理与实现，掌握生成器与判别器的对抗训练机制"
---

# 第9章：生成对抗网络（GAN）

## 本章导读

在学习 GAN 之前，你可能会有这些疑问：

- 什么是 GAN？它能做什么？
- 生成器和判别器是如何对抗训练的？
- GAN 的训练为什么不稳定？如何解决？
- 如何用 GAN 生成图像？

这一章会带你深入理解 GAN 的核心原理，并通过代码实现一个能够生成手写数字的 GAN。

---

## 1 什么是 GAN？

### GAN 简介

GAN（Generative Adversarial Network，生成对抗网络）由 Ian Goodfellow 在 2014 年提出，能够生成逼真的数据。

打个比方：

> GAN 就像造假者和警察的博弈。造假者（生成器）不断制造更逼真的假钞，警察（判别器）不断学习识别假钞。两者相互对抗，最终造假者能制造出以假乱真的假钞。

### GAN 的应用

| 应用 | 说明 |
|-----|------|
| 图像生成 | 生成逼真的人脸、风景 |
| 图像超分辨率 | 将低分辨率图像变为高分辨率 |
| 风格迁移 | 将照片转换为艺术风格 |
| 图像修复 | 填补缺失的图像区域 |
| 数据增强 | 生成训练数据 |

---

## 2 GAN 的核心原理

### 生成器（Generator）

生成器从随机噪声生成假数据：

```
随机噪声 z → 生成器 G → 假数据 G(z)
```

**目标**：让判别器无法区分真假数据

### 判别器（Discriminator）

判别器判断数据是真是假：

```
真实数据 x → 判别器 D → 概率 D(x) ≈ 1
生成数据 G(z) → 判别器 D → 概率 D(G(z)) ≈ 0
```

**目标**：准确区分真假数据

### 对抗训练

GAN 的训练是一个极小极大博弈：

```
min_G max_D V(D, G) = E[log D(x)] + E[log(1 - D(G(z)))]
```

- **判别器**：最大化正确分类的概率
- **生成器**：最小化判别器正确分类的概率

---

## 3 GAN 的训练过程

### 训练步骤

```
1. 训练判别器：
   - 用真实数据训练，标签为 1
   - 用生成数据训练，标签为 0
   
2. 训练生成器：
   - 生成假数据
   - 让判别器判断，标签设为 1（欺骗判别器）
   - 反向传播更新生成器
```

### 训练代码

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 定义生成器
class Generator(nn.Module):
    def __init__(self, latent_dim=100, img_shape=(1, 28, 28)):
        super(Generator, self).__init__()
        self.img_shape = img_shape
        
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
            
            nn.Linear(1024, int(torch.prod(torch.tensor(img_shape)))),
            nn.Tanh()  # 输出范围 [-1, 1]
        )
    
    def forward(self, z):
        img = self.model(z)
        img = img.view(z.size(0), *self.img_shape)
        return img

# 定义判别器
class Discriminator(nn.Module):
    def __init__(self, img_shape=(1, 28, 28)):
        super(Discriminator, self).__init__()
        
        self.model = nn.Sequential(
            nn.Linear(int(torch.prod(torch.tensor(img_shape))), 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            
            nn.Linear(256, 1),
            nn.Sigmoid()  # 输出概率
        )
    
    def forward(self, img):
        flat_img = img.view(img.size(0), -1)
        validity = self.model(flat_img)
        return validity

# 创建模型
latent_dim = 100
img_shape = (1, 28, 28)

generator = Generator(latent_dim, img_shape)
discriminator = Discriminator(img_shape)

# 损失函数和优化器
criterion = nn.BCELoss()
optimizer_G = optim.Adam(generator.parameters(), lr=0.0002, betas=(0.5, 0.999))
optimizer_D = optim.Adam(discriminator.parameters(), lr=0.0002, betas=(0.5, 0.999))
```

### 训练循环

```python
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])  # 归一化到 [-1, 1]
])

dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

# 训练
epochs = 100
for epoch in range(epochs):
    for real_imgs, _ in dataloader:
        batch_size = real_imgs.size(0)
        
        # 真实标签和假标签
        real_labels = torch.ones(batch_size, 1)
        fake_labels = torch.zeros(batch_size, 1)
        
        # ========================
        # 训练判别器
        # ========================
        optimizer_D.zero_grad()
        
        # 真实数据
        real_output = discriminator(real_imgs)
        d_loss_real = criterion(real_output, real_labels)
        
        # 生成假数据
        z = torch.randn(batch_size, latent_dim)
        fake_imgs = generator(z)
        fake_output = discriminator(fake_imgs.detach())  # detach: 不更新生成器
        d_loss_fake = criterion(fake_output, fake_labels)
        
        # 判别器总损失
        d_loss = d_loss_real + d_loss_fake
        d_loss.backward()
        optimizer_D.step()
        
        # ========================
        # 训练生成器
        # ========================
        optimizer_G.zero_grad()
        
        # 生成假数据
        z = torch.randn(batch_size, latent_dim)
        fake_imgs = generator(z)
        fake_output = discriminator(fake_imgs)
        
        # 生成器损失：希望判别器将假数据判断为真
        g_loss = criterion(fake_output, real_labels)
        g_loss.backward()
        optimizer_G.step()
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], D Loss: {d_loss.item():.4f}, G Loss: {g_loss.item():.4f}')
```

---

## 4 DCGAN：深度卷积 GAN

### DCGAN 的改进

DCGAN 使用卷积网络代替全连接网络，生成更高质量的图像：

**生成器架构**：
```
z (100) → TransposedConv → ConvTranspose → ConvTranspose → 图像
```

**判别器架构**：
```
图像 → Conv → Conv → Conv → 概率
```

### DCGAN 的设计原则

1. 用步幅卷积代替池化层
2. 生成器和判别器都使用 BatchNorm
3. 生成器使用 ReLU，输出层用 Tanh
4. 判别器使用 LeakyReLU
5. 不使用全连接层

### DCGAN 实现

```python
class DCGANGenerator(nn.Module):
    def __init__(self, latent_dim=100):
        super(DCGANGenerator, self).__init__()
        
        self.model = nn.Sequential(
            # 输入: (latent_dim, 1, 1)
            nn.ConvTranspose2d(latent_dim, 512, 4, 1, 0, bias=False),
            nn.BatchNorm2d(512),
            nn.ReLU(True),
            # (512, 4, 4)
            
            nn.ConvTranspose2d(512, 256, 4, 2, 1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(True),
            # (256, 8, 8)
            
            nn.ConvTranspose2d(256, 128, 4, 2, 1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(True),
            # (128, 16, 16)
            
            nn.ConvTranspose2d(128, 1, 4, 2, 1, bias=False),
            nn.Tanh()
            # (1, 32, 32)
        )
    
    def forward(self, z):
        z = z.view(z.size(0), -1, 1, 1)
        img = self.model(z)
        return img

class DCGANDiscriminator(nn.Module):
    def __init__(self):
        super(DCGANDiscriminator, self).__init__()
        
        self.model = nn.Sequential(
            # 输入: (1, 32, 32)
            nn.Conv2d(1, 128, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            # (128, 16, 16)
            
            nn.Conv2d(128, 256, 4, 2, 1, bias=False),
            nn.BatchNorm2d(256),
            nn.LeakyReLU(0.2, inplace=True),
            # (256, 8, 8)
            
            nn.Conv2d(256, 512, 4, 2, 1, bias=False),
            nn.BatchNorm2d(512),
            nn.LeakyReLU(0.2, inplace=True),
            # (512, 4, 4)
            
            nn.Conv2d(512, 1, 4, 1, 0, bias=False),
            nn.Sigmoid()
            # (1, 1, 1)
        )
    
    def forward(self, img):
        validity = self.model(img)
        return validity.view(-1, 1)
```

---

## 5 GAN 的训练技巧

### 5.1 标签平滑

```python
# 真实标签从 1.0 改为 0.9
real_labels = torch.ones(batch_size, 1) * 0.9
```

### 5.2 梯度惩罚

```python
def gradient_penalty(discriminator, real_imgs, fake_imgs):
    batch_size = real_imgs.size(0)
    alpha = torch.rand(batch_size, 1, 1, 1).expand_as(real_imgs)
    
    interpolated = alpha * real_imgs + (1 - alpha) * fake_imgs
    interpolated.requires_grad_(True)
    
    d_interpolated = discriminator(interpolated)
    
    gradients = torch.autograd.grad(
        outputs=d_interpolated,
        inputs=interpolated,
        grad_outputs=torch.ones_like(d_interpolated),
        create_graph=True,
        retain_graph=True
    )[0]
    
    gradients = gradients.view(batch_size, -1)
    gradient_norm = gradients.norm(2, dim=1)
    penalty = ((gradient_norm - 1) ** 2).mean()
    return penalty
```

### 5.3 训练稳定性技巧

1. **使用 Adam 优化器**：betas=(0.5, 0.999)
2. **使用 BatchNorm**：稳定训练
3. **避免 ReLU 和 MaxPool**：使用 LeakyReLU 和步幅卷积
4. **归一化输入**：[-1, 1] 范围
5. **监控训练**：观察 D_loss 和 G_loss 的平衡

---

## 6 GAN 的变体

### 6.1 条件 GAN（cGAN）

生成条件指定的数据：

```python
class ConditionalGenerator(nn.Module):
    def __init__(self, latent_dim=100, num_classes=10):
        super().__init__()
        self.label_emb = nn.Embedding(num_classes, latent_dim)
        
        self.model = nn.Sequential(
            nn.Linear(latent_dim * 2, 256),  # z + label
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(256),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(512),
            nn.Linear(512, 784),
            nn.Tanh()
        )
    
    def forward(self, z, labels):
        label_embed = self.label_emb(labels)
        gen_input = torch.cat([z, label_embed], dim=1)
        img = self.model(gen_input)
        return img.view(-1, 1, 28, 28)
```

### 6.2 WGAN（Wasserstein GAN）

使用 Wasserstein 距离代替 JS 散度，训练更稳定：

```python
# WGAN 的判别器称为 Critic，输出不是概率
class WGANLoss:
    def __init__(self):
        pass
    
    def d_loss(self, real_output, fake_output):
        # 判别器损失：最大化真实分数，最小化假分数
        return -(real_output.mean() - fake_output.mean())
    
    def g_loss(self, fake_output):
        # 生成器损失：最大化假分数
        return -fake_output.mean()
```

### 6.3 CycleGAN

无需配对数据的图像转换：

```
真实图像 A → 生成器 G_AB → 假图像 B → 生成器 G_BA → 重建图像 A
```

---

## 7 生成图像可视化

```python
import matplotlib.pyplot as plt

def generate_and_show(generator, latent_dim, num_images=16):
    generator.eval()
    with torch.no_grad():
        z = torch.randn(num_images, latent_dim)
        fake_imgs = generator(z)
    
    fig, axes = plt.subplots(4, 4, figsize=(8, 8))
    for i, ax in enumerate(axes.flat):
        img = fake_imgs[i].squeeze().numpy()
        ax.imshow(img, cmap='gray')
        ax.axis('off')
    plt.tight_layout()
    plt.savefig('generated_images.png')
    print("生成图像已保存到 generated_images.png")

# 使用训练好的生成器
generate_and_show(generator, latent_dim)
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| GAN 原理 | 生成器和判别器对抗训练 |
| 生成器 | 从随机噪声生成假数据 |
| 判别器 | 区分真假数据 |
| 训练目标 | 极小极大博弈 |
| DCGAN | 使用卷积网络的 GAN |
| 训练技巧 | 标签平滑、梯度惩罚、BatchNorm |
| GAN 变体 | cGAN、WGAN、CycleGAN |

---

## 9 新手常见误区

### 误区 1："GAN 训练很容易收敛"

GAN 训练非常不稳定，需要仔细调整超参数。常见问题包括模式坍塌和训练振荡。

### 误区 2："判别器越强越好"

判别器太强会导致生成器梯度消失，无法学习。需要保持两者平衡。

### 误区 3："GAN 只能生成图像"

GAN 可以生成任何类型的数据：音频、文本、时间序列等。

### 误区 4："生成器损失越低越好"

生成器损失低不代表生成质量好，需要结合可视化评估。

---

## 10 动手练习

### 练习 1：基础练习

修改 GAN 的生成器，增加一个隐藏层，观察生成效果的变化。

<details>
<summary>点击查看答案</summary>

```python
class ImprovedGenerator(nn.Module):
    def __init__(self, latent_dim=100, img_shape=(1, 28, 28)):
        super().__init__()
        self.img_shape = img_shape
        
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
            
            # 新增一层
            nn.Linear(1024, 2048),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(2048),
            
            nn.Linear(2048, int(torch.prod(torch.tensor(img_shape)))),
            nn.Tanh()
        )
    
    def forward(self, z):
        img = self.model(z)
        img = img.view(z.size(0), *self.img_shape)
        return img

# 测试
generator = ImprovedGenerator(latent_dim=100)
z = torch.randn(4, 100)
fake_imgs = generator(z)
print(f"生成图像形状: {fake_imgs.shape}")
```

</details>

### 练习 2：进阶练习

实现一个条件 GAN（cGAN），可以生成指定数字的 MNIST 图像。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class ConditionalGenerator(nn.Module):
    def __init__(self, latent_dim=100, num_classes=10, img_shape=(1, 28, 28)):
        super().__init__()
        self.img_shape = img_shape
        self.label_emb = nn.Embedding(num_classes, latent_dim)
        
        self.model = nn.Sequential(
            nn.Linear(latent_dim * 2, 256),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(256),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(512),
            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.BatchNorm1d(1024),
            nn.Linear(1024, int(torch.prod(torch.tensor(img_shape)))),
            nn.Tanh()
        )
    
    def forward(self, z, labels):
        label_embed = self.label_emb(labels)
        gen_input = torch.cat([z, label_embed], dim=1)
        img = self.model(gen_input)
        img = img.view(z.size(0), *self.img_shape)
        return img

class ConditionalDiscriminator(nn.Module):
    def __init__(self, num_classes=10, img_shape=(1, 28, 28)):
        super().__init__()
        self.label_emb = nn.Embedding(num_classes, int(torch.prod(torch.tensor(img_shape))))
        
        self.model = nn.Sequential(
            nn.Linear(int(torch.prod(torch.tensor(img_shape))) * 2, 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(self, img, labels):
        flat_img = img.view(img.size(0), -1)
        label_embed = self.label_emb(labels)
        disc_input = torch.cat([flat_img, label_embed], dim=1)
        validity = self.model(disc_input)
        return validity

# 测试
gen = ConditionalGenerator(latent_dim=100, num_classes=10)
disc = ConditionalDiscriminator(num_classes=10)

z = torch.randn(4, 100)
labels = torch.randint(0, 10, (4,))
fake_imgs = gen(z, labels)
validity = disc(fake_imgs, labels)

print(f"生成图像形状: {fake_imgs.shape}")
print(f"判别器输出: {validity.shape}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的 DCGAN，在 CIFAR-10 数据集上训练，生成 32x32 的彩色图像。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 生成器
class DCGANGenerator(nn.Module):
    def __init__(self, latent_dim=100):
        super().__init__()
        self.model = nn.Sequential(
            nn.ConvTranspose2d(latent_dim, 512, 4, 1, 0, bias=False),
            nn.BatchNorm2d(512), nn.ReLU(True),
            nn.ConvTranspose2d(512, 256, 4, 2, 1, bias=False),
            nn.BatchNorm2d(256), nn.ReLU(True),
            nn.ConvTranspose2d(256, 128, 4, 2, 1, bias=False),
            nn.BatchNorm2d(128), nn.ReLU(True),
            nn.ConvTranspose2d(128, 3, 4, 2, 1, bias=False),
            nn.Tanh()
        )
    
    def forward(self, z):
        return self.model(z.view(z.size(0), -1, 1, 1))

# 判别器
class DCGANDiscriminator(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Conv2d(3, 128, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(128, 256, 4, 2, 1, bias=False),
            nn.BatchNorm2d(256), nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(256, 512, 4, 2, 1, bias=False),
            nn.BatchNorm2d(512), nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(512, 1, 4, 1, 0, bias=False),
            nn.Sigmoid()
        )
    
    def forward(self, img):
        return self.model(img).view(-1, 1)

# 数据
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])
dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform)
dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

# 模型
latent_dim = 100
G = DCGANGenerator(latent_dim)
D = DCGANDiscriminator()

criterion = nn.BCELoss()
opt_G = optim.Adam(G.parameters(), lr=0.0002, betas=(0.5, 0.999))
opt_D = optim.Adam(D.parameters(), lr=0.0002, betas=(0.5, 0.999))

# 训练
epochs = 50
for epoch in range(epochs):
    for real_imgs, _ in dataloader:
        batch_size = real_imgs.size(0)
        real_labels = torch.ones(batch_size, 1)
        fake_labels = torch.zeros(batch_size, 1)
        
        # 训练判别器
        opt_D.zero_grad()
        real_output = D(real_imgs)
        d_loss_real = criterion(real_output, real_labels)
        
        z = torch.randn(batch_size, latent_dim)
        fake_imgs = G(z)
        fake_output = D(fake_imgs.detach())
        d_loss_fake = criterion(fake_output, fake_labels)
        
        d_loss = d_loss_real + d_loss_fake
        d_loss.backward()
        opt_D.step()
        
        # 训练生成器
        opt_G.zero_grad()
        fake_output = D(G(z))
        g_loss = criterion(fake_output, real_labels)
        g_loss.backward()
        opt_G.step()
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], D Loss: {d_loss.item():.4f}, G Loss: {g_loss.item():.4f}')
        
        # 保存生成图像
        with torch.no_grad():
            sample = G(torch.randn(16, latent_dim))
            # 可以保存或可视化
```

</details>

---

## 下一章预告

下一章我们会学习模型训练的高级技巧，包括 Batch Normalization、Dropout、学习率调度等。这些技巧能帮助你训练出更好的模型。
