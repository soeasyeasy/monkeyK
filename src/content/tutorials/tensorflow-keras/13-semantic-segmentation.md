---
title: "第13章：语义分割实战"
description: "掌握 TensorFlow/Keras 中语义分割原理，实现像素级图像理解"
---

# 第13章：语义分割实战

## 1. 本章导读

在开始学习语义分割之前，你可能会有这些疑问：

- 什么是语义分割？和目标检测有什么不同？
- 语义分割的输出是什么？如何表示分割结果？
- U-Net 是什么？为什么它在分割任务中这么流行？
- 如何训练自己的语义分割模型？
- 语义分割有哪些评价指标？

这一章就是为了解答这些问题。语义分割是计算机视觉中最精细的任务之一，它能够对图像中的每个像素进行分类，实现像素级的理解。

---

## 2. 为什么需要语义分割？

### 痛点分析

**目标检测的局限**：

想象一下你有一张医学影像：

- **目标检测**：能用框标出肿瘤位置，但不知道肿瘤的具体形状
- **语义分割**：能精确标出肿瘤的每个像素，知道确切的形状和大小

**实际应用场景**：
- 医学影像：精确分割器官、肿瘤
- 自动驾驶：识别道路、行人、车辆
- 卫星图像：分割土地类型、建筑物
- 人脸识别：分割面部特征
- 工业质检：检测产品表面缺陷

### 生活化类比

> 语义分割就像给图像上色：
> - **图像分类**：告诉你这张图是"风景"
> - **目标检测**：用框标出"树"、"房子"、"人"
> - **语义分割**：把每个像素涂上对应的颜色
>   - 树涂成绿色
>   - 房子涂成红色
>   - 人涂成蓝色
>   - 每个像素都有明确的颜色标签

### 语义分割 vs 目标检测 vs 实例分割

```
三种任务对比：

图像分类：
输入：一张图片
输出：一个类别标签

目标检测：
输入：一张图片
输出：多个边界框 + 类别标签

语义分割：
输入：一张图片
输出：每个像素的类别标签（分割掩码）

实例分割：
输入：一张图片
输出：每个像素的类别标签 + 实例ID
（区分同类别的不同实例）
```

> **一句话总结**：语义分割对图像中的每个像素进行分类，实现像素级的精细理解。

---

## 3. 核心原理讲解

### 语义分割的基本任务

打个比方：

> 语义分割像拼图游戏：
> - 把图像分成很多小块（像素）
> - 每块都要判断属于哪个类别
> - 最终拼出完整的分割图

### 编码器-解码器架构

**编码器（Encoder）**：
- 提取图像特征
- 逐步降低空间分辨率
- 增加通道数
- 类似分类网络

**解码器（Decoder）**：
- 恢复空间分辨率
- 逐步上采样
- 输出与输入相同大小的分割图

### U-Net 的核心思想

> U-Net 像一个 U 形的网络：
> - **左边（编码器）**：下采样，提取特征
> - **底部**：最深层的特征
> - **右边（解码器）**：上采样，恢复分辨率
> - **跳跃连接**：把编码器的特征传给解码器
>   - 保留细节信息
>   - 提高分割精度

### U-Net 的工作流程

```
U-Net 架构：
输入图像 (572x572x3)
    ↓
[卷积] → (570x570x64)
    ↓
[池化] → (284x284x64)
    ↓
[卷积] → (282x282x128)
    ↓
[池化] → (140x140x128)
    ↓
...
    ↓
[底部卷积] → (28x28x1024)
    ↓
[上采样] → (56x56x512)
    ↓
[拼接] ← 跳跃连接
    ↓
[卷积] → (54x54x512)
    ↓
...
    ↓
[上采样] → (568x568x64)
    ↓
[卷积] → (568x568x64)
    ↓
[1x1卷积] → (568x568x2)  # 2个类别
    ↓
输出分割图
```

### 其他分割架构

| 架构 | 特点 | 优点 | 缺点 |
|------|------|------|------|
| FCN | 全卷积网络 | 开创性 | 精度一般 |
| U-Net | 编码器-解码器+跳跃连接 | 精度高 | 计算量大 |
| DeepLab | 空洞卷积+CRF | 多尺度特征 | 复杂 |
| PSPNet | 金字塔池化 | 全局信息 | 内存占用大 |
| SegNet | 池化索引上采样 | 速度快 | 精度较低 |

### 评价指标

**像素准确率（Pixel Accuracy）**：
```
Pixel Accuracy = 正确分类的像素数 / 总像素数

简单直观，但类别不平衡时不可靠
```

**IoU（Intersection over Union）**：
```
IoU = 交集 / 并集

对每个类别计算：
IoU_class = TP / (TP + FP + FN)

mIoU = 所有类别 IoU 的平均值
```

**Dice 系数**：
```
Dice = 2 * 交集 / (预测面积 + 真实面积)

Dice = 2 * TP / (2*TP + FP + FN)
```

> **一句话总结**：语义分割通过编码器-解码器架构，实现像素级的分类。

---

## 4. 基础用法 + 逐行注释

### 4.1 使用预训练模型进行分割

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
import numpy as np
import matplotlib.pyplot as plt

# 使用预训练的 DeepLabV3+ 模型
# TensorFlow 提供了多种预训练分割模型

# 方法1：使用 Keras Applications
# 加载预训练的 ResNet50 作为特征提取器
base_model = tf.keras.applications.ResNet50(
    weights='imagenet',
    include_top=False,
    input_shape=(256, 256, 3)
)

# 冻结预训练层
base_model.trainable = False

# 构建分割模型
model = models.Sequential([
    # 特征提取器
    base_model,
    
    # 上采样层
    layers.Conv2DTranspose(
        256, (3, 3), 
        strides=2, 
        padding='same', 
        activation='relu'
    ),
    layers.Conv2DTranspose(
        128, (3, 3), 
        strides=2, 
        padding='same', 
        activation='relu'
    ),
    layers.Conv2DTranspose(
        64, (3, 3), 
        strides=2, 
        padding='same', 
        activation='relu'
    ),
    layers.Conv2DTranspose(
        32, (3, 3), 
        strides=2, 
        padding='same', 
        activation='relu'
    ),
    
    # 输出层：21个类别（Pascal VOC）
    layers.Conv2D(21, (1, 1), activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 方法2：使用 TensorFlow Hub
import tensorflow_hub as hub

# 加载预训练的 DeepLabV3+
segmentation_model = hub.load(
    "https://tfhub.dev/tensorflow/deeplabv3/1"
)

# 使用模型进行预测
image = tf.keras.preprocessing.image.load_img(
    'test_image.jpg',
    target_size=(513, 513)
)
image_array = tf.keras.preprocessing.image.img_to_array(image)
image_array = tf.expand_dims(image_array, axis=0)

# 执行分割
result = segmentation_model(image_array)
segmentation_map = result['semantic_pred'][0].numpy()

# 可视化结果
plt.figure(figsize=(12, 6))
plt.subplot(1, 2, 1)
plt.imshow(image)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(segmentation_map, cmap='jet')
plt.title('Segmentation Map')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 4.2 构建 U-Net 模型

```python
import tensorflow as tf
from tensorflow.keras import layers, models

def unet_encoder(inputs, filters, kernel_size, stride):
    """U-Net 编码器块"""
    x = layers.Conv2D(
        filters, 
        kernel_size, 
        strides=stride, 
        padding='same',
        activation='relu'
    )(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(
        filters, 
        kernel_size, 
        strides=1, 
        padding='same',
        activation='relu'
    )(x)
    x = layers.BatchNormalization()(x)
    return x

def unet_decoder(inputs, skip_features, filters, kernel_size, stride):
    """U-Net 解码器块"""
    # 上采样
    x = layers.Conv2DTranspose(
        filters, 
        kernel_size, 
        strides=stride, 
        padding='same',
        activation='relu'
    )(inputs)
    
    # 拼接跳跃连接
    x = layers.Concatenate()([x, skip_features])
    
    # 卷积
    x = layers.Conv2D(
        filters, 
        kernel_size, 
        strides=1, 
        padding='same',
        activation='relu'
    )(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(
        filters, 
        kernel_size, 
        strides=1, 
        padding='same',
        activation='relu'
    )(x)
    x = layers.BatchNormalization()(x)
    return x

def build_unet(input_shape=(256, 256, 3), num_classes=21):
    """构建完整的 U-Net 模型"""
    inputs = layers.Input(shape=input_shape)
    
    # 编码器
    # Block 1: 256x256 -> 128x128
    enc1 = unet_encoder(inputs, 64, 3, 1)
    pool1 = layers.MaxPooling2D(pool_size=(2, 2))(enc1)
    
    # Block 2: 128x128 -> 64x64
    enc2 = unet_encoder(pool1, 128, 3, 1)
    pool2 = layers.MaxPooling2D(pool_size=(2, 2))(enc2)
    
    # Block 3: 64x64 -> 32x32
    enc3 = unet_encoder(pool2, 256, 3, 1)
    pool3 = layers.MaxPooling2D(pool_size=(2, 2))(enc3)
    
    # Block 4: 32x32 -> 16x16
    enc4 = unet_encoder(pool3, 512, 3, 1)
    pool4 = layers.MaxPooling2D(pool_size=(2, 2))(enc4)
    
    # 底部
    # Block 5: 16x16
    bottleneck = unet_encoder(pool4, 1024, 3, 1)
    
    # 解码器
    # Block 6: 16x16 -> 32x32
    dec6 = unet_decoder(bottleneck, enc4, 512, 2, 2)
    
    # Block 7: 32x32 -> 64x64
    dec7 = unet_decoder(dec6, enc3, 256, 2, 2)
    
    # Block 8: 64x64 -> 128x128
    dec8 = unet_decoder(dec7, enc2, 128, 2, 2)
    
    # Block 9: 128x128 -> 256x256
    dec9 = unet_decoder(dec8, enc1, 64, 2, 2)
    
    # 输出层
    outputs = layers.Conv2D(
        num_classes, 
        (1, 1), 
        activation='softmax'
    )(dec9)
    
    model = models.Model(inputs, outputs)
    return model

# 创建模型
unet_model = build_unet(input_shape=(256, 256, 3), num_classes=21)

# 编译模型
unet_model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# 查看模型结构
unet_model.summary()
```

### 4.3 训练语义分割模型

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import matplotlib.pyplot as plt

# 假设你已经构建了 U-Net 模型
model = build_unet(input_shape=(256, 256, 3), num_classes=21)

# 准备数据
# 这里使用模拟数据，实际应用中需要加载真实数据

def create_mock_data(num_samples=100, image_size=256, num_classes=21):
    """创建模拟数据用于演示"""
    # 图像数据
    images = np.random.rand(num_samples, image_size, image_size, 3).astype(np.float32)
    
    # 分割掩码（每个像素一个类别标签）
    masks = np.random.randint(0, num_classes, (num_samples, image_size, image_size, 1))
    
    return images, masks

# 创建训练和验证数据
x_train, y_train = create_mock_data(100)
x_val, y_val = create_mock_data(20)

print(f'训练数据形状: {x_train.shape}')  # (100, 256, 256, 3)
print(f'训练标签形状: {y_train.shape}')  # (100, 256, 256, 1)

# 训练模型
history = model.fit(
    x_train, y_train,
    batch_size=8,
    epochs=20,
    validation_data=(x_val, y_val),
    verbose=1
)

# 绘制训练曲线
plt.figure(figsize=(12, 4))

# 损失曲线
plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('Loss Curve')
plt.legend()
plt.grid(True)

# 准确率曲线
plt.subplot(1, 2, 2)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Val Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.title('Accuracy Curve')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()

# 预测并可视化
def visualize_prediction(model, image, ground_truth):
    """可视化分割预测结果"""
    # 预测
    prediction = model.predict(np.expand_dims(image, axis=0))
    prediction = np.argmax(prediction[0], axis=-1)
    
    # 可视化
    plt.figure(figsize=(15, 5))
    
    plt.subplot(1, 3, 1)
    plt.imshow(image)
    plt.title('Original Image')
    plt.axis('off')
    
    plt.subplot(1, 3, 2)
    plt.imshow(ground_truth[:, :, 0], cmap='jet')
    plt.title('Ground Truth')
    plt.axis('off')
    
    plt.subplot(1, 3, 3)
    plt.imshow(prediction, cmap='jet')
    plt.title('Prediction')
    plt.axis('off')
    
    plt.tight_layout()
    plt.show()

# 可视化第一个验证样本
visualize_prediction(model, x_val[0], y_val[0])
```

### 4.4 数据增强

```python
import tensorflow as tf
from tensorflow.keras import layers
import albumentations as A

# 语义分割的数据增强需要同时处理图像和掩码

def get_segmentation_transforms():
    """定义分割任务的数据增强"""
    return A.Compose([
        # 水平翻转
        A.HorizontalFlip(p=0.5),
        
        # 垂直翻转
        A.VerticalFlip(p=0.5),
        
        # 随机旋转
        A.RandomRotate90(p=0.5),
        
        # 随机亮度对比度
        A.RandomBrightnessContrast(p=0.2),
        
        # 随机色调饱和度
        A.HueSaturationValue(p=0.2),
        
        # 随机缩放
        A.RandomResizedCrop(
            height=256,
            width=256,
            scale=(0.8, 1.0),
            p=0.5
        ),
    ])

# TensorFlow 数据增强层
def create_augmentation_layer():
    """创建 TensorFlow 数据增强层"""
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip('horizontal'),
        layers.RandomFlip('vertical'),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
    ])
    return data_augmentation

# 应用增强（注意：掩码不能使用插值）
def augment_image_and_mask(image, mask):
    """同时增强图像和掩码"""
    # 图像增强
    image = tf.image.random_flip_left_right(image)
    image = tf.image.random_brightness(image, 0.2)
    image = tf.image.random_contrast(image, 0.8, 1.2)
    
    # 掩码增强（只翻转，不改变值）
    mask = tf.image.random_flip_left_right(mask)
    
    return image, mask

# 创建数据管道
def create_segmentation_dataset(images, masks, batch_size=8):
    """创建分割数据集"""
    dataset = tf.data.Dataset.from_tensor_slices((images, masks))
    
    # 增强
    dataset = dataset.map(
        augment_image_and_mask,
        num_parallel_calls=tf.data.AUTOTUNE
    )
    
    # 批次和缓存
    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(tf.data.AUTOTUNE)
    
    return dataset
```

### 4.5 自定义损失函数

```python
import tensorflow as tf
from tensorflow.keras import backend as K

def dice_loss(y_true, y_pred, smooth=1e-6):
    """
    Dice 损失函数
    适合处理类别不平衡问题
    """
    # 将预测转换为概率
    y_pred = tf.nn.softmax(y_pred, axis=-1)
    
    # One-hot 编码真实标签
    y_true_one_hot = tf.one_hot(
        tf.cast(y_true[:, :, :, 0], tf.int32), 
        depth=tf.shape(y_pred)[-1]
    )
    
    # 计算 Dice 系数
    intersection = tf.reduce_sum(y_true_one_hot * y_pred, axis=[1, 2, 3])
    union = tf.reduce_sum(y_true_one_hot, axis=[1, 2, 3]) + tf.reduce_sum(y_pred, axis=[1, 2, 3])
    
    dice = (2. * intersection + smooth) / (union + smooth)
    
    # 返回损失（1 - Dice）
    return 1 - tf.reduce_mean(dice)

def iou_loss(y_true, y_pred, smooth=1e-6):
    """
    IoU 损失函数
    """
    y_pred = tf.nn.softmax(y_pred, axis=-1)
    y_true_one_hot = tf.one_hot(
        tf.cast(y_true[:, :, :, 0], tf.int32), 
        depth=tf.shape(y_pred)[-1]
    )
    
    intersection = tf.reduce_sum(y_true_one_hot * y_pred, axis=[1, 2, 3])
    union = tf.reduce_sum(y_true_one_hot, axis=[1, 2, 3]) + tf.reduce_sum(y_pred, axis=[1, 2, 3]) - intersection
    
    iou = (intersection + smooth) / (union + smooth)
    
    return 1 - tf.reduce_mean(iou)

def focal_loss(y_true, y_pred, alpha=0.25, gamma=2.0):
    """
    Focal 损失函数
    适合处理难分类样本
    """
    y_pred = tf.nn.softmax(y_pred, axis=-1)
    y_true_one_hot = tf.one_hot(
        tf.cast(y_true[:, :, :, 0], tf.int32), 
        depth=tf.shape(y_pred)[-1]
    )
    
    # 计算交叉熵
    cross_entropy = -y_true_one_hot * tf.math.log(y_pred + 1e-8)
    
    # 计算 focal 权重
    weight = alpha * tf.pow(1 - y_pred, gamma)
    
    # 计算 focal loss
    fl = weight * cross_entropy
    fl = tf.reduce_sum(fl, axis=-1)
    
    return tf.reduce_mean(fl)

def combined_loss(y_true, y_pred):
    """
    组合损失函数
    结合 Dice 损失和交叉熵
    """
    dice = dice_loss(y_true, y_pred)
    ce = tf.keras.losses.sparse_categorical_crossentropy(y_true, y_pred)
    
    return dice + 0.5 * tf.reduce_mean(ce)

# 使用自定义损失
model.compile(
    optimizer='adam',
    loss=dice_loss,  # 或 combined_loss
    metrics=['accuracy']
)
```

---

## 5. 对比表格

### 语义分割架构对比

| 架构 | 核心特点 | 精度 | 速度 | 适用场景 |
|------|----------|------|------|----------|
| FCN | 全卷积 | 中 | 快 | 基础应用 |
| U-Net | 跳跃连接 | 高 | 中 | 医学图像 |
| DeepLab | 空洞卷积 | 高 | 慢 | 高精度需求 |
| PSPNet | 金字塔池化 | 高 | 中 | 场景理解 |
| SegNet | 池化索引 | 中 | 快 | 实时应用 |

### 损失函数对比

| 损失函数 | 公式 | 优点 | 缺点 | 适用场景 |
|----------|------|------|------|----------|
| 交叉熵 | -Σy*log(p) | 简单 | 类别不平衡 | 平衡数据 |
| Dice | 1-2*交集/并集 | 处理不平衡 | 梯度不稳定 | 不平衡数据 |
| IoU | 1-交集/并集 | 直观 | 计算复杂 | 通用 |
| Focal | -α*(1-p)^γ*log(p) | 难分类样本 | 参数敏感 | 难分类 |

### 评价指标对比

| 指标 | 计算方式 | 优点 | 缺点 | 优秀标准 |
|------|----------|------|------|----------|
| Pixel Accuracy | 正确像素/总像素 | 简单 | 不平衡时不可靠 | > 0.9 |
| mIoU | 各类别IoU平均 | 公平 | 计算复杂 | > 0.7 |
| Dice | 2*交集/(预测+真实) | 处理不平衡 | 对边界敏感 | > 0.8 |

---

## 6. 新手常见误区

### 误区1：语义分割和目标检测是一样的

❌ **错误想法**：语义分割就是用框标出物体

✅ **实际情况**：
- 目标检测输出边界框
- 语义分割输出像素级掩码
- 语义分割更精细，计算量更大
- 应用场景不同

### 误区2：不需要处理类别不平衡

❌ **错误写法**：
```python
# 直接使用交叉熵损失
model.compile(loss='categorical_crossentropy')
```

✅ **正确写法**：
```python
# 使用 Dice 损失或加权交叉熵
model.compile(loss=dice_loss)

# 或者使用类别权重
class_weights = {0: 1.0, 1: 5.0}  # 背景少，目标多
model.fit(..., class_weight=class_weights)
```

### 误区3：数据增强可以改变掩码值

❌ **错误写法**：
```python
# 对掩码使用插值
mask = tf.image.resize(mask, (256, 256), method='bilinear')
```

✅ **正确写法**：
```python
# 掩码使用最近邻插值，保持类别标签
mask = tf.image.resize(mask, (256, 256), method='nearest')
```

### 误区4：输入图像和掩码大小可以不同

❌ **错误写法**：
```python
# 图像和掩码大小不一致
image = tf.image.resize(image, (256, 256))
mask = tf.image.resize(mask, (128, 128))  # 错误！
```

✅ **正确写法**：
```python
# 图像和掩码必须大小一致
image = tf.image.resize(image, (256, 256))
mask = tf.image.resize(mask, (256, 256), method='nearest')
```

### 误区5：不需要后处理

❌ **错误想法**：模型输出直接就是最终结果

✅ **实际情况**：
- 模型输出可能有噪声
- 需要形态学操作（开闭运算）
- 需要连通域分析
- 需要去除小区域

---

## 7. 动手练习

### 练习1：基础 - 构建简单分割模型

**任务**：构建一个简单的全卷积分割模型

**要求**：
- 使用卷积和转置卷积
- 输入 256x256，输出 256x256
- 5 个类别

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# 构建简单分割模型
model = models.Sequential([
    # 编码器
    layers.Conv2D(64, 3, activation='relu', padding='same', input_shape=(256, 256, 3)),
    layers.MaxPooling2D(2),
    
    layers.Conv2D(128, 3, activation='relu', padding='same'),
    layers.MaxPooling2D(2),
    
    layers.Conv2D(256, 3, activation='relu', padding='same'),
    
    # 解码器
    layers.Conv2DTranspose(128, 3, strides=2, padding='same', activation='relu'),
    layers.Conv2DTranspose(64, 3, strides=2, padding='same', activation='relu'),
    
    # 输出层
    layers.Conv2D(5, 1, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()
```

</details>

### 练习2：进阶 - U-Net 实现

**任务**：实现完整的 U-Net 模型

**要求**：
- 编码器-解码器结构
- 跳跃连接
- 训练 20 个 epoch

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models

def conv_block(inputs, filters):
    """卷积块"""
    x = layers.Conv2D(filters, 3, padding='same', activation='relu')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(filters, 3, padding='same', activation='relu')(x)
    x = layers.BatchNormalization()(x)
    return x

def encoder_block(inputs, filters):
    """编码器块"""
    x = conv_block(inputs, filters)
    p = layers.MaxPooling2D(2)(x)
    return x, p

def decoder_block(inputs, skip_features, filters):
    """解码器块"""
    x = layers.Conv2DTranspose(filters, 2, strides=2, padding='same')(inputs)
    x = layers.Concatenate()([x, skip_features])
    x = conv_block(x, filters)
    return x

# 构建 U-Net
inputs = layers.Input(shape=(256, 256, 3))

# 编码器
e1, p1 = encoder_block(inputs, 64)
e2, p2 = encoder_block(p1, 128)
e3, p3 = encoder_block(p2, 256)
e4, p4 = encoder_block(p3, 512)

# 底部
bottleneck = conv_block(p4, 1024)

# 解码器
d4 = decoder_block(bottleneck, e4, 512)
d3 = decoder_block(d4, e3, 256)
d2 = decoder_block(d3, e2, 128)
d1 = decoder_block(d2, e1, 64)

# 输出
outputs = layers.Conv2D(5, 1, activation='softmax')(d1)

model = models.Model(inputs, outputs)
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()
```

</details>

### 练习3：挑战 - 自定义损失函数

**任务**：实现 Dice 损失和 IoU 损失

**要求**：
- 处理类别不平衡
- 计算 mIoU
- 可视化分割结果

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import numpy as np

def dice_coefficient(y_true, y_pred, smooth=1e-6):
    """计算 Dice 系数"""
    y_true_f = tf.reshape(y_true, [-1])
    y_pred_f = tf.reshape(y_pred, [-1])
    
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    dice = (2. * intersection + smooth) / (
        tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth
    )
    return dice

def dice_loss(y_true, y_pred):
    """Dice 损失"""
    return 1 - dice_coefficient(y_true, y_pred)

def iou_coefficient(y_true, y_pred, smooth=1e-6):
    """计算 IoU 系数"""
    y_true_f = tf.reshape(y_true, [-1])
    y_pred_f = tf.reshape(y_pred, [-1])
    
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) - intersection
    
    iou = (intersection + smooth) / (union + smooth)
    return iou

def iou_loss(y_true, y_pred):
    """IoU 损失"""
    return 1 - iou_coefficient(y_true, y_pred)

# 使用
model.compile(
    optimizer='adam',
    loss=dice_loss,
    metrics=[iou_coefficient]
)
```

</details>

---

## 8. 下一章预告

恭喜你完成了语义分割的学习！现在你已经掌握了：

- 语义分割的基本原理和应用场景
- U-Net 等经典架构
- 如何训练分割模型
- 数据增强和损失函数设计
- 评价指标和常见误区

**下一章我们将学习自然语言处理实战**，这是深度学习的另一个重要领域：

- 如何处理文本数据
- 词嵌入和语言模型
- 文本分类和情感分析
- 序列到序列模型

自然语言处理让计算机能够理解和生成人类语言，掌握它你就能做聊天机器人、翻译系统、文本生成等有趣的项目！
