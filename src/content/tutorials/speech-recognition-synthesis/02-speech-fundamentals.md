---
title: "第2章：语音基础知识"
description: "声音原理、采样率、量化、编码、音频格式、特征提取"
---

# 第2章：语音基础知识

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 声音在计算机里是怎么存储的？
- 什么是采样率？为什么 CD 音质比电话好？
- WAV、MP3、FLAC 这些格式有什么区别？
- 为什么要做特征提取？MFCC 是什么？

这一章就是为了解答这些问题。我们会从 **声音的本质** 讲起，再学习 **数字化处理** 的关键概念，最后掌握 **特征提取** 的方法。

---

## 1 为什么需要了解语音基础？

### 痛点分析

很多新手直接调用 API，遇到效果不好时束手无策：

- 录出来的音频有杂音，识别率低
- 不知道选什么采样率，文件太大或音质差
- 音频格式选错，API 不支持
- 不理解特征提取，无法优化识别效果

### 解决方案

理解语音基础知识，你能：

- **选择合适的参数**：采样率、位深度、声道数
- **处理音频问题**：降噪、增强、格式转换
- **优化识别效果**：提取更好的特征，提升准确率

打个比方：

> 学语音基础就像学摄影要先懂光圈、快门、ISO。不懂这些，你只能用手机自动模式拍照；懂了这些，你才能拍出专业级照片。语音处理也是一样——懂基础，才能做出好效果。

> **一句话总结**：语音基础是做好语音应用的基石。

---

## 2 核心原理

### 2.1 声音的本质

**声音是振动产生的机械波**，通过空气传播到耳朵，被我们感知。

声音有三个关键属性：

| 属性 | 物理量 | 感知特征 | 单位 |
| --- | --- | --- | --- |
| **振幅** | 波的强度 | 响度（音量） | 分贝（dB） |
| **频率** | 振动快慢 | 音调（高低） | 赫兹（Hz） |
| **波形** | 波的形状 | 音色（质感） | - |

### 2.2 声音的数字化

计算机不能直接处理连续的声波，需要把它转换成数字信号。这个过程叫 **模数转换（ADC）**，包含三个步骤：

#### 步骤 1：采样（Sampling）

**采样** 是按固定时间间隔测量声波的振幅值。

打个比方：

> 采样就像用尺子量波浪的高度。每隔 1 秒量一次，你就得到一串数字：1.2m、1.5m、1.3m... 这个"每隔 1 秒"就是采样间隔，"1 秒量一次"的频率就是采样率。

**采样率（Sample Rate）**：每秒采样的次数，单位是 Hz。

| 采样率 | 音质 | 应用场景 |
| --- | --- | --- |
| 8000 Hz | 电话音质 | 电话通话 |
| 16000 Hz | 普通音质 | 语音识别 |
| 22050 Hz | 较好音质 | 音乐（低质量） |
| 44100 Hz | CD 音质 | CD、高品质音乐 |
| 48000 Hz | 专业音质 | 专业音频制作 |

**奈奎斯特定理**：采样率必须大于信号最高频率的 2 倍，才能完整还原信号。

> 人耳能听到的频率范围是 20Hz - 20000Hz，所以 CD 采样率是 44100Hz（大于 20000 × 2）。

#### 步骤 2：量化（Quantization）

**量化** 是把采样得到的振幅值转换成整数。

打个比方：

> 你量出波浪高度是 1.234567m，但尺子只能精确到厘米，所以你记录 1.23m。这个"精确到厘米"就是量化精度。

**位深度（Bit Depth）**：每个采样点用多少位（bit）存储。

| 位深度 | 取值范围 | 音质 |
| --- | --- | --- |
| 8 bit | 0 - 255 | 低音质，有噪声 |
| 16 bit | -32768 - 32767 | CD 音质，常用 |
| 24 bit | -8388608 - 8388607 | 专业音质 |

#### 步骤 3：编码（Encoding）

**编码** 是把量化后的数字按特定格式存储。

常见编码方式：

| 编码 | 说明 | 特点 |
| --- | --- | --- |
| **PCM** | 脉冲编码调制 | 无压缩，原始数据 |
| **WAV** | 基于 PCM 的格式 | 无压缩，文件大，音质好 |
| **MP3** | 有损压缩 | 文件小，音质有损失 |
| **FLAC** | 无损压缩 | 文件中等，音质无损 |
| **AAC** | 有损压缩 | 比 MP3 效率高，苹果常用 |

### 2.3 音频格式对比

| 格式 | 压缩方式 | 文件大小 | 音质 | 应用场景 |
| --- | --- | --- | --- | --- |
| **WAV** | 无压缩 | 大 | 最好 | 录音、编辑、语音识别 |
| **MP3** | 有损压缩 | 小 | 较好 | 音乐播放、流媒体 |
| **FLAC** | 无损压缩 | 中 | 最好 | 音乐收藏、专业制作 |
| **AAC** | 有损压缩 | 小 | 好 | 苹果设备、流媒体 |
| **OGG** | 有损压缩 | 小 | 好 | 开源项目、游戏音频 |

> **语音识别推荐**：使用 WAV 或 FLAC，避免有损压缩带来的信息丢失。

---

## 3 特征提取

### 3.1 为什么需要特征提取？

原始音频数据量太大，直接输入模型效果差。

打个比方：

> 你要识别一个人的脸，不会数他脸上有多少个像素，而是看眼睛、鼻子、嘴巴的特征。语音识别也是一样——我们不直接用原始波形，而是提取"声音特征"。

### 3.2 常用特征

#### 梅尔频率倒谱系数（MFCC）

**MFCC** 是语音识别最常用的特征。

**核心思想**：模拟人耳对频率的感知特性。

> 人耳对低频声音敏感，对高频声音不敏感。MFCC 用"梅尔刻度"模拟这种特性，让特征更符合人耳感知。

**提取步骤**：

1. **预加重**：增强高频部分
2. **分帧**：把音频切成小段（每段 20-30ms）
3. **加窗**：每段乘以汉明窗，减少边界效应
4. **傅里叶变换**：时域转频域
5. **梅尔滤波器组**：模拟人耳感知
6. **对数运算**：压缩动态范围
7. **离散余弦变换**：得到 MFCC 系数

#### 其他特征

| 特征 | 说明 | 应用场景 |
| --- | --- | --- |
| **频谱图（Spectrogram）** | 频率随时间变化的可视化 | 深度学习、语音合成 |
| **梅尔频谱图（Mel-Spectrogram）** | 梅尔刻度下的频谱图 | 深度学习主流输入 |
| **基频（F0）** | 声音的基本频率 | 音调分析、语音合成 |
| **能量（Energy）** | 每帧的振幅平方和 | 端点检测、语音活动检测 |

---

## 4 代码实战

### 4.1 读取和播放音频

```python
# 导入库
import librosa  # 音频处理库
import sounddevice as sd  # 音频播放库

# 加载音频文件
# file_path: 音频文件路径
# sr: 采样率（None 表示保持原始采样率）
# mono: True 表示转成单声道，False 保持原始声道数
y, sr = librosa.load('audio.wav', sr=None, mono=True)

# 打印音频信息
print(f"采样率: {sr} Hz")  # 每秒采样次数
print(f"音频时长: {len(y) / sr:.2f} 秒")  # 音频长度
print(f"采样点数: {len(y)}")  # 总采样点数

# 播放音频
# y: 音频数据
# sr: 采样率
sd.play(y, sr)
sd.wait()  # 等待播放完成
```

### 4.2 提取 MFCC 特征

```python
import librosa
import numpy as np

# 加载音频
y, sr = librosa.load('audio.wav', sr=16000)  # 语音识别常用 16kHz

# 提取 MFCC
# n_mfcc: 返回的 MFCC 系数数量（通常 13-40）
# hop_length: 帧移（相邻帧之间的采样点数）
# n_fft: FFT 窗口大小
mfcc = librosa.feature.mfcc(
    y=y,           # 音频数据
    sr=sr,         # 采样率
    n_mfcc=13,     # 13 个 MFCC 系数
    hop_length=512, # 帧移 512 个采样点
    n_fft=2048     # FFT 窗口大小
)

# 打印 MFCC 形状
print(f"MFCC 形状: {mfcc.shape}")  # (13, 时间帧数)
print(f"时间帧数: {mfcc.shape[1]}")  # 有多少帧

# 可视化 MFCC
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 4))
librosa.display.specshow(mfcc, x_axis='time', cmap='coolwarm')
plt.colorbar()
plt.title('MFCC')
plt.xlabel('时间 (秒)')
plt.ylabel('MFCC 系数')
plt.tight_layout()
plt.show()
```

### 4.3 提取梅尔频谱图

```python
import librosa
import numpy as np
import matplotlib.pyplot as plt

# 加载音频
y, sr = librosa.load('audio.wav', sr=16000)

# 提取梅尔频谱图
# n_mels: 梅尔滤波器数量（通常 40-128）
mel_spec = librosa.feature.melspectrogram(
    y=y,           # 音频数据
    sr=sr,         # 采样率
    n_mels=128,    # 128 个梅尔滤波器
    hop_length=512, # 帧移
    n_fft=2048     # FFT 窗口大小
)

# 转换成对数刻度（分贝）
# 为什么要取对数？因为人耳对响度的感知是对数的
log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)

# 可视化
plt.figure(figsize=(10, 4))
librosa.display.specshow(
    log_mel_spec, 
    sr=sr, 
    x_axis='time', 
    y_axis='mel',  # 梅尔刻度
    cmap='magma'
)
plt.colorbar(format='%+2.0f dB')
plt.title('梅尔频谱图')
plt.xlabel('时间 (秒)')
plt.ylabel('频率 (梅尔)')
plt.tight_layout()
plt.show()
```

### 4.4 音频预处理

```python
import librosa
import numpy as np

# 加载音频
y, sr = librosa.load('audio.wav', sr=16000)

# 1. 预加重
# 为什么要预加重？增强高频部分，平衡频谱
# 公式：y[n] = x[n] - α * x[n-1]，α 通常取 0.97
pre_emphasis = 0.97
y_emphasized = np.append(y[0], y[1:] - pre_emphasis * y[:-1])

# 2. 端点检测（去除静音）
# 为什么要端点检测？去除开头和结尾的静音，只保留有效语音
intervals = librosa.effects.split(y_emphasized, top_db=20)
y_trimmed = librosa.effects.trim(y_emphasized, top_db=20)[0]

# 3. 降噪（简单方法：频谱减法）
# 为什么要降噪？去除背景噪声，提升识别率
# 这里用 librosa 的简单降噪
y_denoised = librosa.effects.harmonic(y_trimmed, margin=3)

# 4. 归一化
# 为什么要归一化？让音频幅度在 [-1, 1] 范围内，避免数值问题
y_normalized = y_denoised / np.max(np.abs(y_denoised))

print(f"原始音频长度: {len(y)}")
print(f"处理后音频长度: {len(y_normalized)}")
print(f"音频幅度范围: [{y_normalized.min():.2f}, {y_normalized.max():.2f}]")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **采样率** | 每秒采样次数，决定音质和文件大小 |
| **位深度** | 每个采样点的精度，决定动态范围 |
| **音频格式** | WAV（无压缩）、MP3（有损）、FLAC（无损） |
| **MFCC** | 语音识别最常用的特征，模拟人耳感知 |
| **梅尔频谱图** | 深度学习的主流输入特征 |
| **预处理** | 预加重、端点检测、降噪、归一化 |

---

## 6 新手常见误区

### 误区 1："采样率越高越好"

**不一定！** 采样率越高，文件越大，但提升有限。

- 语音识别：16kHz 足够，不需要 44.1kHz
- 音乐制作：需要 44.1kHz 或更高

正确做法：根据应用场景选择合适的采样率。

### 误区 2："MP3 格式适合语音识别"

**错！** MP3 是有损压缩，会丢失高频细节。

语音识别推荐用 WAV 或 FLAC，保留完整信息。

### 误区 3："MFCC 参数越多越好"

**不一定！** MFCC 系数太多会引入噪声，太少会丢失信息。

通常 13 个系数足够，复杂场景可以用 39 个（包含一阶和二阶差分）。

### 误区 4："不需要预处理，直接用原始音频"

**错！** 原始音频可能有噪声、静音、幅度不一致。

预处理能显著提升识别率和模型稳定性。

### 误区 5："所有音频都要转成单声道"

**不一定！** 语音识别通常用单声道，但音乐、环境音分析可能需要双声道。

正确做法：根据任务需求选择单声道或双声道。

---

## 7 动手练习

### 练习 1：基础操作

加载一个音频文件，打印它的采样率、时长、声道数，并播放前 5 秒。

<details>
<summary>点击查看答案</summary>

```python
import librosa
import sounddevice as sd

# 加载音频文件
y, sr = librosa.load('audio.wav', sr=None, mono=False)

# 打印信息
print(f"采样率: {sr} Hz")
print(f"时长: {len(y) / sr:.2f} 秒")
print(f"声道数: {y.shape[0] if len(y.shape) > 1 else 1}")

# 播放前 5 秒
duration = 5  # 秒
samples = int(duration * sr)
sd.play(y[:samples], sr)
sd.wait()
```

</details>

### 练习 2：特征提取

提取音频的 MFCC 和梅尔频谱图，并可视化。

<details>
<summary>点击查看答案</summary>

```python
import librosa
import matplotlib.pyplot as plt
import numpy as np

# 加载音频
y, sr = librosa.load('audio.wav', sr=16000)

# 提取 MFCC
mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

# 提取梅尔频谱图
mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)

# 可视化
fig, axes = plt.subplots(2, 1, figsize=(10, 8))

# 画 MFCC
librosa.display.specshow(mfcc, ax=axes[0], x_axis='time', cmap='coolwarm')
axes[0].set_title('MFCC')
axes[0].set_ylabel('MFCC 系数')

# 画梅尔频谱图
librosa.display.specshow(log_mel_spec, ax=axes[1], sr=sr, x_axis='time', y_axis='mel', cmap='magma')
axes[1].set_title('梅尔频谱图')
axes[1].set_ylabel('频率 (梅尔)')

plt.tight_layout()
plt.show()
```

</details>

### 练习 3（挑战）：音频预处理 pipeline

编写一个函数，实现完整的音频预处理流程：加载 → 预加重 → 端点检测 → 降噪 → 归一化 → 保存。

<details>
<summary>点击查看答案</summary>

```python
import librosa
import numpy as np
import soundfile as sf

def preprocess_audio(input_path, output_path, sr=16000):
    """
    音频预处理 pipeline
    
    参数:
        input_path: 输入音频路径
        output_path: 输出音频路径
        sr: 目标采样率
    """
    # 1. 加载音频
    y, sr = librosa.load(input_path, sr=sr, mono=True)
    print(f"原始音频长度: {len(y)}")
    
    # 2. 预加重
    pre_emphasis = 0.97
    y_emphasized = np.append(y[0], y[1:] - pre_emphasis * y[:-1])
    
    # 3. 端点检测（去除静音）
    y_trimmed, _ = librosa.effects.trim(y_emphasized, top_db=20)
    print(f"去除静音后长度: {len(y_trimmed)}")
    
    # 4. 降噪（谐波- percussive 分离）
    y_harmonic, y_percussive = librosa.effects.hpss(y_trimmed, margin=3)
    y_denoised = y_harmonic + y_percussive * 0.5  # 降低 percussive 成分
    
    # 5. 归一化
    y_normalized = y_denoised / np.max(np.abs(y_denoised))
    
    # 6. 保存
    sf.write(output_path, y_normalized, sr)
    print(f"预处理完成，已保存到: {output_path}")
    
    return y_normalized

# 使用示例
preprocess_audio('input.wav', 'output.wav', sr=16000)
```

</details>

---

## 下一章预告

下一章我们会学习 **语音识别原理**——也就是 ASR 系统是如何工作的。你会学到声学模型、语言模型、解码器的作用，了解端到端模型的优势，掌握主流模型（CTC、Attention、Transformer）的原理。这些知识能帮你理解语音识别的底层机制，做出