---
title: "第10章：生成对抗网络（GAN）"
description: "掌握 TensorFlow/Keras 中 GAN 原理，实现图像生成"
---

# 第10章：生成对抗网络（GAN）

## 1. 本章导读

在开始学习生成对抗网络之前，你可能会有这些疑问：

- 什么是 GAN？它和普通的神经网络有什么不同？
- 为什么叫"对抗"网络？谁和谁对抗？
- GAN 能用来做什么？除了生成图片还能干嘛？
- 训练 GAN 为什么那么难？有什么技巧？
- 如何评估生成的图片好不好？

这一章就是为了解答这些问题。GAN 是深度学习中最有创意的技术之一，它让 AI 能够创造出逼真的图像、视频甚至音乐。

---

## 2. 为什么需要 GAN？

### 痛点分析

**传统生成模型的问题**：

想象一下你要画一幅画：

- **像素级生成**：像打印机一样，一个像素一个像素地生成，速度慢且质量差
- **变分自编码器（VAE）**：生成的图片模糊，像隔着毛玻璃看
- **Flow 模型**：数学复杂，计算量大

**GAN 的优势**：
- 生成的图片清晰逼真
- 训练相对简单（虽然实际很难）
- 可以生成各种类型的数据

### 生活化类比

> GAN 就像伪造者和警察的博弈：
> - **生成器（Generator）**：伪造者，努力制造假钞
> - **判别器（Discriminator）**：警察，努力识别真假钞
> - 伪造者越做越像，警察越查越准
> - 最终伪造者能造出以假乱真的假钞

### GAN 的应用场景

```
GAN 能做什么？
├─ 图像生成：生成逼真的人脸、风景
├─ 图像翻译：把素描变成彩色照片
├─ 风格迁移：把照片变成梵高风格
├─ 超分辨率：把模糊图片变清晰
├─ 数据增强：生成更多训练数据
└─ 异常检测：找出图片中的异常区域
```

> **一句话总结**：GAN 通过生成器和判别器的对抗训练，能够生成高质量的逼真数据。

---

## 3. 核心原理讲解

### GAN 的基本结构

打个比方：

> GAN 像两个学生在互相学习：
> - **学生A（生成器）**：努力模仿老师的作品
> - **学生B（判别器）**：努力分辨真假作品
> - 两人互相促进，共同进步

### 数学原理（通俗版）

```
GAN 的目标函数：
min_G max_D V(D, G) = E[log D(x)] + E[log(1 - D(G(z)))]

其中：
- G: 生成器
- D: 判别器
- x: 真实数据
- z: 随机噪声
- E: 期望值

通俗理解：
- 判别器 D 想要最大化正确分类的概率
- 生成器 G 想要最小化 D 正确分类的概率
- 两者博弈，最终达到平衡
```

### 训练过程

```
训练步骤：
1. 生成器生成假数据
   随机噪声 z → 生成器 G → 假数据 G(z)

2. 判别器训练
   - 输入真实数据，标签为 1
   - 输入假数据，标签为 0
   - 更新判别器参数

3. 生成器训练
   - 生成假数据
   - 判别器判断为假
   - 更新生成器参数，让判别器判断为真

4. 重复步骤 1-3，直到收敛
```

### GAN 的训练难题

**模式崩塌（Mode Collapse）**：
- 生成器只生成少数几种样本
- 就像学生只模仿一种风格

**训练不稳定**：
- 生成器和判别器可能无法达到平衡
- 一方太强，另一方太弱

**解决方案**：
- 使用 WGAN（ Wasserstein GAN）
- 添加梯度惩罚
- 调整学习率

### GAN 的变体

| 变体 | 特点 | 应用 |
|------|------|------|
| DCGAN | 使用卷积层 | 图像生成 |
| WGAN | 改进损失函数 | 稳定训练 |
| CycleGAN | 无需配对数据 | 图像翻译 |
| StyleGAN | 控制生成风格 | 人脸生成 |
| Pix2Pix | 配对图像翻译 | 图像转换 |

> **一句话总结**：GAN 通过生成器和判别器的博弈学习，能够生成高质量的数据。

---

## 4. 基础用法 + 逐行注释

### 4.1 简单 GAN 实现

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import matplotlib.pyplot as plt

# 设置随机种子，保证结果可复现
tf.random.set_seed(42)
np.random.seed(42)

# 定义生成器
def build_generator(latent_dim=100):
    """
    生成器：将随机噪声转换为图像
    输入：100维的随机向量
    输出：28x28的灰度图像
    """
    model = models.Sequential([
        # 第一层全连接层，将100维向量扩展到128维
        layers.Dense(128, activation='relu', input_dim=latent_dim),
        # 批量归一化，稳定训练
        layers.BatchNormalization(),
        
        # 第二层全连接层，扩展到256维
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        
        # 第三层全连接层，扩展到512维
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        
        # 输出层，生成784维向量（28x28=784）
        # 使用tanh激活，将值压缩到[-1, 1]
        layers.Dense(784, activation='tanh'),
        
        # 重塑为28x28的图像
        layers.Reshape((28, 28, 1))
    ])
    return model

# 定义判别器
def build_discriminator():
    """
    判别器：判断输入图像是真实还是生成
    输入：28x28的图像
    输出：0-1之间的概率（1表示真实，0表示生成）
    """
    model = models.Sequential([
        # 展平输入图像
        layers.Flatten(input_shape=(28, 28, 1)),
        
        # 第一层全连接层
        layers.Dense(512, activation='relu'),
        # Dropout防止过拟合
        layers.Dropout(0.3),
        
        # 第二层全连接层
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        
        # 第三层全连接层
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        
        # 输出层，sigmoid激活输出0-1之间的概率
        layers.Dense(1, activation='sigmoid')
    ])
    return model

# 创建生成器和判别器
latent_dim = 100  # 随机噪声的维度
generator = build_generator(latent_dim)
discriminator = build_discriminator()

# 编译判别器
discriminator.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0002, beta_1=0.5),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 构建GAN模型
# 冻结判别器的权重，只训练生成器
discriminator.trainable = False

gan_input = layers.Input(shape=(latent_dim,))  # GAN的输入是随机噪声
generated_image = generator(gan_input)         # 生成器生成图像
gan_output = discriminator(generated_image)    # 判别器判断真假

gan = models.Model(gan_input, gan_output)

# 编译GAN模型
gan.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0002, beta_1=0.5),
    loss='binary_crossentropy'
)

# 查看模型结构
print("生成器结构：")
generator.summary()
print("\n判别器结构：")
discriminator.summary()
```

### 4.2 训练 GAN

```python
import tensorflow as tf
from tensorflow.keras.datasets import mnist
import numpy as np
import matplotlib.pyplot as plt

# 加载MNIST数据集
(x_train, y_train), (_, _) = mnist.load_data()

# 预处理数据
# 归一化到[-1, 1]范围，与生成器的tanh输出匹配
x_train = (x_train.astype('float32') - 127.5) / 127.5
x_train = np.expand_dims(x_train, axis=-1)  # 添加通道维度

# 训练参数
epochs = 10000          # 训练轮数
batch_size = 128        # 批次大小
sample_interval = 1000  # 每隔多少轮保存一次样本

# 保存生成的样本
def save_images(generator, epoch, latent_dim=100):
    """生成并保存样本图像"""
    # 生成随机噪声
    noise = np.random.normal(0, 1, (25, latent_dim))
    # 生成图像
    gen_images = generator.predict(noise)
    # 反归一化到[0, 1]范围
    gen_images = 0.5 * gen_images + 0.5
    
    # 绘制5x5的图像网格
    fig, axs = plt.subplots(5, 5, figsize=(10, 10))
    for i, ax in enumerate(axs.flatten()):
        ax.imshow(gen_images[i, :, :, 0], cmap='gray')
        ax.axis('off')
    plt.tight_layout()
    plt.savefig(f'gan_generated_epoch_{epoch}.png')
    plt.close()

# 训练循环
d_losses = []  # 记录判别器损失
g_losses = []  # 记录生成器损失

for epoch in range(epochs):
    # ====================
    # 训练判别器
    # ====================
    
    # 随机选择真实图像
    idx = np.random.randint(0, x_train.shape[0], batch_size)
    real_images = x_train[idx]
    
    # 真实图像的标签为1
    valid = np.ones((batch_size, 1))
    
    # 生成假图像
    noise = np.random.normal(0, 1, (batch_size, latent_dim))
    gen_images = generator.predict(noise, verbose=0)
    
    # 假图像的标签为0
    fake = np.zeros((batch_size, 1))
    
    # 训练判别器
    d_loss_real = discriminator.train_on_batch(real_images, valid)
    d_loss_fake = discriminator.train_on_batch(gen_images, fake)
    
    # 计算平均损失
    d_loss = 0.5 * np.add(d_loss_real, d_loss_fake)
    
    # ====================
    # 训练生成器
    # ====================
    
    # 生成随机噪声
    noise = np.random.normal(0, 1, (batch_size, latent_dim))
    
    # 生成器的目标是让判别器认为生成的图像是真实的
    # 所以标签设为1
    g_loss = gan.train_on_batch(noise, valid)
    
    # 记录损失
    d_losses.append(d_loss[0])
    g_losses.append(g_loss)
    
    # 打印进度
    if (epoch + 1) % 100 == 0:
        print(f"Epoch {epoch+1}/{epochs} [D loss: {d_loss[0]:.4f}, acc: {100*d_loss[1]:.2f}%] [G loss: {g_loss:.4f}]")
    
    # 保存样本
    if (epoch + 1) % sample_interval == 0:
        save_images(generator, epoch + 1, latent_dim)

# 绘制损失曲线
plt.figure(figsize=(12, 6))
plt.plot(d_losses, label='Discriminator Loss', alpha=0.7)
plt.plot(g_losses, label='Generator Loss', alpha=0.7)
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('GAN Training Loss')
plt.legend()
plt.grid(True)
plt.show()
```

### 4.3 DCGAN（深度卷积 GAN）

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# DCGAN 生成器 - 使用转置卷积
def build_dc_generator(latent_dim=100):
    """
    DCGAN生成器：使用转置卷积生成图像
    从随机噪声逐步上采样到完整图像
    """
    model = models.Sequential([
        # 输入层：随机噪声向量
        layers.Input(shape=(latent_dim,)),
        
        # 第一层：将向量投影到7x7x128的特征图
        layers.Dense(7 * 7 * 128, use_bias=False),
        layers.BatchNormalization(),
        layers.LeakyReLU(alpha=0.2),
        layers.Reshape((7, 7, 128)),
        
        # 第二层：转置卷积上采样到14x14
        layers.Conv2DTranspose(
            64, (5, 5), 
            strides=(2, 2), 
            padding='same', 
            use_bias=False
        ),
        layers.BatchNormalization(),
        layers.LeakyReLU(alpha=0.2),
        
        # 第三层：转置卷积上采样到28x28
        layers.Conv2DTranspose(
            32, (5, 5), 
            strides=(2, 2), 
            padding='same', 
            use_bias=False
        ),
        layers.BatchNormalization(),
        layers.LeakyReLU(alpha=0.2),
        
        # 输出层：1个通道（灰度图），tanh激活
        layers.Conv2DTranspose(
            1, (5, 5), 
            strides=(1, 1), 
            padding='same', 
            activation='tanh'
        )
    ])
    return model

# DCGAN 判别器 - 使用卷积
def build_dc_discriminator():
    """
    DCGAN判别器：使用卷积层提取特征
    逐步下采样，最后输出真假概率
    """
    model = models.Sequential([
        # 输入层：28x28灰度图像
        layers.Input(shape=(28, 28, 1)),
        
        # 第一层卷积：下采样到14x14
        layers.Conv2D(
            32, (5, 5), 
            strides=(2, 2), 
            padding='same'
        ),
        layers.LeakyReLU(alpha=0.2),
        layers.Dropout(0.3),
        
        # 第二层卷积：下采样到7x7
        layers.Conv2D(
            64, (5, 5), 
            strides=(2, 2), 
            padding='same'
        ),
        layers.LeakyReLU(alpha=0.2),
        layers.Dropout(0.3),
        
        # 展平并输出
        layers.Flatten(),
        layers.Dense(1, activation='sigmoid')
    ])
    return model

# 创建模型
dc_generator = build_dc_generator()
dc_discriminator = build_dc_discriminator()

print("DCGAN 生成器：")
dc_generator.summary()
print("\nDCGAN 判别器：")
dc_discriminator.summary()
```

### 4.4 CycleGAN（图像翻译）

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# CycleGAN 的核心思想：
# 不需要配对数据，就能将一种风格的图像转换为另一种风格
# 比如：马→斑马，夏天→冬天

# 生成器（ResNet架构）
def build_resnet_generator(input_shape=(256, 256, 3), n_residual_blocks=9):
    """
    CycleGAN生成器：使用ResNet架构
    通过残差块保持图像细节
    """
    inputs = layers.Input(shape=input_shape)
    
    # 初始卷积层
    x = layers.Conv2D(64, 7, strides=1, padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    
    # 下采样
    x = layers.Conv2D(128, 3, strides=2, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    
    x = layers.Conv2D(256, 3, strides=2, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    
    # 残差块
    for _ in range(n_residual_blocks):
        # 保存输入用于跳跃连接
        residual = x
        
        x = layers.Conv2D(256, 3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        
        x = layers.Conv2D(256, 3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        
        # 跳跃连接
        x = layers.Add()([x, residual])
    
    # 上采样
    x = layers.Conv2DTranspose(128, 3, strides=2, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    
    x = layers.Conv2DTranspose(64, 3, strides=2, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    
    # 输出层
    outputs = layers.Conv2D(3, 7, padding='same', activation='tanh')(x)
    
    return models.Model(inputs, outputs)

# 判别器（PatchGAN）
def build_patch_discriminator(input_shape=(256, 256, 3)):
    """
    CycleGAN判别器：PatchGAN
    不是判断整张图的真假，而是判断每个patch的真假
    这样能生成更清晰的局部细节
    """
    inputs = layers.Input(shape=input_shape)
    
    # 第一层：不使用BatchNormalization
    x = layers.Conv2D(64, 4, strides=2, padding='same')(inputs)
    x = layers.LeakyReLU(0.2)(x)
    
    # 后续层：逐渐增加通道数
    x = layers.Conv2D(128, 4, strides=2, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)
    
    x = layers.Conv2D(256, 4, strides=2, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)
    
    # 输出层：每个patch一个概率值
    outputs = layers.Conv2D(1, 4, padding='same')(x)
    
    return models.Model(inputs, outputs)

# 创建模型
gen_g = build_resnet_generator()  # G: X -> Y
gen_f = build_resnet_generator()  # F: Y -> X
disc_x = build_patch_discriminator()  # 判别X
disc_y = build_patch_discriminator()  # 判别Y

print("CycleGAN 生成器：")
gen_g.summary()
print("\nCycleGAN 判别器：")
disc_x.summary()
```

---

## 5. 对比表格

### GAN 变体对比

| 变体 | 核心改进 | 优点 | 缺点 | 应用场景 |
|------|----------|------|------|----------|
| Vanilla GAN | 基础版本 | 简单 | 训练不稳定 | 理论研究 |
| DCGAN | 使用卷积 | 更稳定 | 分辨率有限 | 图像生成 |
| WGAN | 改进损失函数 | 训练稳定 | 计算量大 | 高质量生成 |
| CycleGAN | 循环一致性 | 无需配对数据 | 训练慢 | 图像翻译 |
| StyleGAN | 风格控制 | 高质量人脸 | 复杂 | 人脸生成 |
| Pix2Pix | 配对翻译 | 精确控制 | 需要配对数据 | 图像转换 |

### GAN vs VAE 对比

| 特性 | GAN | VAE |
|------|-----|-----|
| 生成质量 | 高，清晰逼真 | 较低，偏模糊 |
| 训练稳定性 | 不稳定 | 稳定 |
| 训练速度 | 慢 | 快 |
| 多样性 | 容易模式崩塌 | 多样性好 |
| 潜在空间 | 不连续 | 连续可插值 |
| 应用场景 | 高质量图像 | 数据压缩、生成 |

### GAN 训练技巧

| 技巧 | 说明 | 效果 |
|------|------|------|
| 标签平滑 | 真实标签用0.9而不是1 | 防止判别器过自信 |
| 特征匹配 | 限制生成器的特征统计 | 稳定训练 |
| 迷你批次判别 | 判别器看一批样本 | 增加多样性 |
| 梯度惩罚 | 限制梯度大小 | 稳定训练 |
| 谱归一化 | 归一化权重矩阵 | 稳定判别器 |

---

## 6. 新手常见误区

### 误区1：GAN 训练越久效果越好

❌ **错误想法**：训练 1000 个 epoch 肯定比 100 个好

✅ **实际情况**：
- GAN 训练不是越久越好
- 可能出现模式崩塌，生成器只会生成少数几种样本
- 需要监控训练过程，适时停止
- 使用早停策略

### 误区2：生成器和判别器要同时训练

❌ **错误写法**：
```python
# 同时训练生成器和判别器
combined_model.compile(...)
combined_model.fit(...)
```

✅ **正确写法**：
```python
# 交替训练
for epoch in range(epochs):
    # 1. 训练判别器
    d_loss = discriminator.train_on_batch(...)
    
    # 2. 冻结判别器，训练生成器
    discriminator.trainable = False
    g_loss = gan.train_on_batch(...)
    
    # 3. 解冻判别器
    discriminator.trainable = True
```

### 误区3：不需要调整学习率

❌ **错误想法**：使用默认学习率就行

✅ **实际情况**：
- GAN 对学习率非常敏感
- 通常使用较小的学习率（0.0002）
- 生成器和判别器可以用不同的学习率
- 学习率太大会导致训练不稳定

### 误区4：生成器输出用 sigmoid 激活

❌ **错误写法**：
```python
# 生成器输出层
layers.Dense(784, activation='sigmoid')
```

✅ **正确写法**：
```python
# 使用 tanh 激活，输出范围 [-1, 1]
layers.Dense(784, activation='tanh')

# 数据也要归一化到 [-1, 1]
x_train = (x_train - 127.5) / 127.5
```

### 误区5：不需要监控训练过程

❌ **错误想法**：训练完再看结果就行

✅ **实际情况**：
- GAN 训练过程需要实时监控
- 定期保存生成的样本
- 观察损失曲线，判断是否模式崩塌
- 使用 TensorBoard 可视化训练过程

---

## 7. 动手练习

### 练习1：基础 - 构建简单 GAN

**任务**：创建一个简单的 GAN 生成 MNIST 手写数字

**要求**：
- 生成器：3层全连接网络
- 判别器：3层全连接网络
- 训练 100 个 epoch

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import mnist
import numpy as np

# 加载数据
(x_train, _), (_, _) = mnist.load_data()
x_train = (x_train.astype('float32') - 127.5) / 127.5
x_train = np.expand_dims(x_train, axis=-1)

# 生成器
generator = models.Sequential([
    layers.Dense(256, activation='relu', input_dim=100),
    layers.Dense(512, activation='relu'),
    layers.Dense(784, activation='tanh'),
    layers.Reshape((28, 28, 1))
])

# 判别器
discriminator = models.Sequential([
    layers.Flatten(input_shape=(28, 28, 1)),
    layers.Dense(512, activation='relu'),
    layers.Dense(256, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

discriminator.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# GAN
discriminator.trainable = False
gan_input = layers.Input(shape=(100,))
img = generator(gan_input)
validity = discriminator(img)
gan = models.Model(gan_input, validity)
gan.compile(optimizer='adam', loss='binary_crossentropy')

# 训练
batch_size = 128
for epoch in range(100):
    idx = np.random.randint(0, x_train.shape[0], batch_size)
    real_imgs = x_train[idx]
    
    noise = np.random.normal(0, 1, (batch_size, 100))
    gen_imgs = generator.predict(noise, verbose=0)
    
    d_loss_real = discriminator.train_on_batch(real_imgs, np.ones((batch_size, 1)))
    d_loss_fake = discriminator.train_on_batch(gen_imgs, np.zeros((batch_size, 1)))
    d_loss = 0.5 * np.add(d_loss_real, d_loss_fake)
    
    g_loss = gan.train_on_batch(noise, np.ones((batch_size, 1)))
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}/100 [D loss: {d_loss[0]:.4f}] [G loss: {g_loss:.4f}]")
```

</details>

### 练习2：进阶 - DCGAN 实现

**任务**：使用卷积层实现 DCGAN

**要求**：
- 生成器使用转置卷积
- 判别器使用卷积
- 添加 BatchNormalization

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# DCGAN 生成器
def build_generator():
    model = models.Sequential([
        layers.Input(shape=(100,)),
        layers.Dense(7 * 7 * 256, use_bias=False),
        layers.BatchNormalization(),
        layers.LeakyReLU(),
        layers.Reshape((7, 7, 256)),
        
        layers.Conv2DTranspose(128, 5, strides=2, padding='same', use_bias=False),
        layers.BatchNormalization(),
        layers.LeakyReLU(),
        
        layers.Conv2DTranspose(64, 5, strides=2, padding='same', use_bias=False),
        layers.BatchNormalization(),
        layers.LeakyReLU(),
        
        layers.Conv2DTranspose(1, 5, padding='same', activation='tanh')
    ])
    return model

# DCGAN 判别器
def build_discriminator():
    model = models.Sequential([
        layers.Input(shape=(28, 28, 1)),
        
        layers.Conv2D(64, 5, strides=2, padding='same'),
        layers.LeakyReLU(),
        layers.Dropout(0.3),
        
        layers.Conv2D(128, 5, strides=2, padding='same'),
        layers.LeakyReLU(),
        layers.Dropout(0.3),
        
        layers.Flatten(),
        layers.Dense(1, activation='sigmoid')
    ])
    return model

generator = build_generator()
discriminator = build_discriminator()

generator.summary()
discriminator.summary()
```

</details>

### 练习3：挑战 - 条件 GAN

**任务**：实现条件 GAN，可以指定生成哪个数字

**要求**：
- 生成器接收噪声和标签
- 判别器接收图像和标签
- 可以控制生成特定数字

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# 条件 GAN 生成器
def build_conditional_generator():
    # 噪声输入
    noise = layers.Input(shape=(100,))
    # 标签输入（0-9）
    label = layers.Input(shape=(1,))
    
    # 标签嵌入
    label_embedding = layers.Embedding(10, 100)(label)
    label_embedding = layers.Flatten()(label_embedding)
    
    # 拼接噪声和标签
    x = layers.Concatenate()([noise, label_embedding])
    
    # 生成图像
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dense(512, activation='relu')(x)
    x = layers.Dense(784, activation='tanh')(x)
    img = layers.Reshape((28, 28, 1))(x)
    
    return models.Model([noise, label], img)

# 条件 GAN 判别器
def build_conditional_discriminator():
    # 图像输入
    img = layers.Input(shape=(28, 28, 1))
    # 标签输入
    label = layers.Input(shape=(1,))
    
    # 标签嵌入
    label_embedding = layers.Embedding(10, 784)(label)
    label_embedding = layers.Flatten()(label_embedding)
    label_embedding = layers.Reshape((28, 28, 1))(label_embedding)
    
    # 拼接图像和标签
    x = layers.Concatenate()([img, label_embedding])
    x = layers.Flatten()(x)
    
    # 判别
    x = layers.Dense(512, activation='relu')(x)
    x = layers.Dense(256, activation='relu')(x)
    validity = layers.Dense(1, activation='sigmoid')(x)
    
    return models.Model([img, label], validity)

# 创建模型
generator = build_conditional_generator()
discriminator = build_conditional_discriminator()

print("条件 GAN 生成器：")
generator.summary()
print("\n条件 GAN 判别器：")
discriminator.summary()

# 使用示例
import numpy as np
noise = np.random.normal(0, 1, (1, 100))
label = np.array([[5]])  # 生成数字5
generated_img = generator.predict([noise, label])
print(f"\n生成图像形状: {generated_img.shape}")
```

</details>

---

## 8. 下一章预告

恭喜你完成了 GAN 的学习！现在你已经掌握了：

- GAN 的基本原理和训练方法
- 生成器和判别器的设计
- DCGAN 和 CycleGAN 的实现
- GAN 的训练技巧

**下一章我们将学习迁移学习与模型微调**，这是一个非常实用的技术：

- 如何利用预训练模型快速构建项目
- 如何微调模型适应自己的任务
- 小数据集也能训练出好模型
- 实际项目中的应用案例

迁移学习是深度学习中最常用的技术之一，掌握了它，你就能用很少的数据和时间训练出强大的模型！
