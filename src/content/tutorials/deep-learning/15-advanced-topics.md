# 第 15 章：深度学习前沿技术

## 本章导读

深度学习发展迅速，新技术层出不穷。本章将介绍当前最热门的前沿技术：

1. Transformer 是什么？为什么它能取代 RNN 成为主流架构？
2. BERT、GPT 这些大模型是怎么工作的？
3. 扩散模型（Diffusion Model）是什么？为什么能生成高质量图像？
4. 图神经网络（GNN）能解决什么问题？
5. 自监督学习是什么？为什么它很重要？

## 技术必要性分析

传统深度学习模型（CNN、RNN）虽然强大，但在很多场景下存在局限：

- **长距离依赖问题**：RNN 处理长序列时梯度消失，难以捕捉远距离信息
- **并行计算困难**：RNN 必须顺序处理，无法充分利用 GPU 并行能力
- **数据标注成本高**：很多任务需要大量标注数据，获取困难
- **非欧几里得数据**：社交网络、分子结构等图数据，传统模型难以处理

前沿技术正是为了解决这些问题而生，它们推动了 AI 的快速发展，也是当前研究的热点。

## 核心原理讲解

### 1. Transformer 架构

**核心思想**：完全基于注意力机制，抛弃 RNN 和 CNN。

**关键组件**：

| 组件 | 作用 | 说明 |
|------|------|------|
| 自注意力（Self-Attention） | 捕捉序列内部关系 | 每个位置关注所有其他位置 |
| 多头注意力（Multi-Head） | 从不同子空间学习 | 多个注意力头并行 |
| 位置编码（Positional Encoding） | 注入位置信息 | 因为注意力本身无序 |
| 前馈网络（FFN） | 非线性变换 | 两层全连接 + 激活函数 |
| 残差连接 + LayerNorm | 稳定训练 | 防止梯度消失 |

**优势**：

- 并行计算：所有位置可以同时计算
- 长距离依赖：直接建模任意距离的关系
- 可扩展性：可以堆叠更多层，训练更大模型

### 2. BERT（Bidirectional Encoder Representations from Transformers）

**核心思想**：双向 Transformer 编码器，通过掩码语言模型（MLM）预训练。

**训练任务**：

| 任务 | 说明 | 目的 |
|------|------|------|
| MLM（Masked Language Model） | 随机遮盖 15% 的词，预测被遮盖的词 | 学习双向上下文表示 |
| NSP（Next Sentence Prediction） | 判断两个句子是否连续 | 理解句子间关系 |

**下游任务微调**：

- 文本分类：在 [CLS] 标记上加分类头
- 命名实体识别：在每个 token 上加分类头
- 问答系统：预测答案的起始和结束位置

### 3. GPT（Generative Pre-trained Transformer）

**核心思想**：单向 Transformer 解码器，自回归语言模型。

**与 BERT 的区别**：

| 特性 | BERT | GPT |
|------|------|-----|
| 架构 | 双向编码器 | 单向解码器 |
| 训练目标 | 预测被遮盖的词 | 预测下一个词 |
| 适用任务 | 理解类任务 | 生成类任务 |
| 上下文 | 双向 | 只有左侧上下文 |

**GPT 系列演进**：

- GPT-1：1.17 亿参数
- GPT-2：15 亿参数
- GPT-3：1750 亿参数
- GPT-4：更大规模，多模态

### 4. 扩散模型（Diffusion Model）

**核心思想**：通过逐步去噪生成数据。

**两个过程**：

| 过程 | 说明 |
|------|------|
| 前向过程（加噪） | 逐步向数据添加高斯噪声，直到变成纯噪声 |
| 反向过程（去噪） | 学习从噪声中逐步恢复原始数据 |

**优势**：

- 生成质量高：比 GAN 更稳定，图像更清晰
- 多样性好：不会模式崩溃
- 可控性强：可以通过条件引导生成

**应用**：DALL-E 2、Stable Diffusion、Midjourney

### 5. 图神经网络（GNN）

**核心思想**：在图结构数据上进行深度学习。

**应用场景**：

- 社交网络分析：用户关系、社区检测
- 推荐系统：用户-物品交互图
- 分子性质预测：原子-化学键图
- 知识图谱：实体-关系图

**核心操作**：

- 消息传递（Message Passing）：节点从邻居收集信息
- 聚合（Aggregation）：汇总邻居信息
- 更新（Update）：更新节点表示

### 6. 自监督学习（Self-Supervised Learning）

**核心思想**：从数据本身构造监督信号，无需人工标注。

**常见方法**：

| 方法 | 领域 | 预训练任务 |
|------|------|-----------|
| BERT | NLP | 预测被遮盖的词 |
| GPT | NLP | 预测下一个词 |
| MAE（Masked Autoencoder） | CV | 重建被遮盖的图像块 |
| SimCLR | CV | 对比学习，相似样本表示接近 |
| DINO | CV | 自蒸馏，无需负样本 |

**优势**：

- 数据丰富：可以利用海量无标注数据
- 成本低：不需要昂贵的人工标注
- 效果好：预训练模型可以微调到各种下游任务

## 基础用法

### Transformer 实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class MultiHeadAttention(nn.Module):
    """多头注意力机制"""
    def __init__(self, d_model, num_heads):
        super().__init__()
        assert d_model % num_heads == 0
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        # Q, K, V 线性变换
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        
        # 输出线性变换
        self.W_o = nn.Linear(d_model, d_model)
        
    def scaled_dot_product_attention(self, Q, K, V, mask=None):
        """缩放点积注意力"""
        # Q, K, V: [batch, num_heads, seq_len, d_k]
        
        # 计算注意力分数
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        
        # 应用掩码（可选）
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Softmax 归一化
        attn_weights = F.softmax(scores, dim=-1)
        
        # 加权求和
        output = torch.matmul(attn_weights, V)
        
        return output, attn_weights
        
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        
        # 线性变换并分割多头
        # [batch, seq_len, d_model] -> [batch, seq_len, num_heads, d_k] -> [batch, num_heads, seq_len, d_k]
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        # 计算注意力
        attn_output, attn_weights = self.scaled_dot_product_attention(Q, K, V, mask)
        
        # 拼接多头并线性变换
        # [batch, num_heads, seq_len, d_k] -> [batch, seq_len, d_model]
        attn_output = attn_output.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        output = self.W_o(attn_output)
        
        return output, attn_weights

class PositionWiseFeedForward(nn.Module):
    """位置前馈网络"""
    def __init__(self, d_model, d_ff):
        super().__init__()
        self.fc1 = nn.Linear(d_model, d_ff)
        self.fc2 = nn.Linear(d_ff, d_model)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        return self.fc2(self.relu(self.fc1(x)))

class PositionalEncoding(nn.Module):
    """位置编码"""
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        
        # 创建位置编码矩阵
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        
        self.register_buffer('pe', pe)
        
    def forward(self, x):
        # x: [batch, seq_len, d_model]
        return x + self.pe[:, :x.size(1), :]

class TransformerEncoderLayer(nn.Module):
    """Transformer 编码器层"""
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, num_heads)
        self.feed_forward = PositionWiseFeedForward(d_model, d_ff)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, mask=None):
        # 自注意力 + 残差连接 + LayerNorm
        attn_output, _ = self.self_attn(x, x, x, mask)
        x = self.norm1(x + self.dropout(attn_output))
        
        # 前馈网络 + 残差连接 + LayerNorm
        ff_output = self.feed_forward(x)
        x = self.norm2(x + self.dropout(ff_output))
        
        return x

class TransformerEncoder(nn.Module):
    """Transformer 编码器"""
    def __init__(self, vocab_size, d_model, num_heads, num_layers, d_ff, max_len=5000, dropout=0.1):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.positional_encoding = PositionalEncoding(d_model, max_len)
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, mask=None):
        # x: [batch, seq_len]
        x = self.embedding(x) * math.sqrt(self.embedding.embedding_dim)
        x = self.positional_encoding(x)
        x = self.dropout(x)
        
        for layer in self.layers:
            x = layer(x, mask)
            
        return x

# 使用示例
vocab_size = 10000
d_model = 512
num_heads = 8
num_layers = 6
d_ff = 2048

encoder = TransformerEncoder(vocab_size, d_model, num_heads, num_layers, d_ff)

# 模拟输入
batch_size = 4
seq_len = 100
x = torch.randint(0, vocab_size, (batch_size, seq_len))

# 前向传播
output = encoder(x)
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")  # [4, 100, 512]
```

### Vision Transformer（ViT）

```python
import torch
import torch.nn as nn
from torchvision.models import vit_b_16, ViT_B_16_Weights

# 加载预训练的 ViT
model = vit_b_16(weights=ViT_B_16_Weights.DEFAULT)
model.eval()

print(f"模型参数量: {sum(p.numel() for p in model.parameters()) / 1e6:.2f}M")

# ViT 工作原理：
# 1. 将图像分割为固定大小的 patch（如 16x16）
# 2. 将每个 patch 展平并线性映射为向量
# 3. 添加位置编码
# 4. 输入 Transformer 编码器
# 5. 用 [CLS] token 的表示做分类

# 模拟输入图像
batch_size = 4
image_size = 224
x = torch.randn(batch_size, 3, image_size, image_size)

# 推理
with torch.no_grad():
    output = model(x)
    
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")  # [4, 1000] (ImageNet 1000 类)

# 微调 ViT 做自定义分类
num_classes = 10
model.heads.head = nn.Linear(model.heads.head.in_features, num_classes)

print(f"修改后的输出维度: {num_classes}")
```

### 扩散模型基础

```python
import torch
import torch.nn as nn
import math

class SimpleUNet(nn.Module):
    """简化的 U-Net 用于扩散模型"""
    def __init__(self, in_channels=3, out_channels=3, base_channels=64):
        super().__init__()
        
        # 编码器
        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, base_channels, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(base_channels, base_channels, 3, padding=1),
            nn.ReLU()
        )
        
        self.enc2 = nn.Sequential(
            nn.Conv2d(base_channels, base_channels * 2, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(base_channels * 2, base_channels * 2, 3, padding=1),
            nn.ReLU()
        )
        
        # 中间层
        self.mid = nn.Sequential(
            nn.Conv2d(base_channels * 2, base_channels * 4, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(base_channels * 4, base_channels * 2, 3, padding=1),
            nn.ReLU()
        )
        
        # 解码器
        self.dec2 = nn.Sequential(
            nn.ConvTranspose2d(base_channels * 2, base_channels, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(base_channels, base_channels, 3, padding=1),
            nn.ReLU()
        )
        
        self.dec1 = nn.Conv2d(base_channels, out_channels, 1)
        
    def forward(self, x, t):
        # x: [batch, channels, height, width]
        # t: [batch] 时间步
        
        # 编码器
        e1 = self.enc1(x)
        e2 = self.enc2(e1)
        
        # 中间层
        m = self.mid(e2)
        
        # 解码器
        d2 = self.dec2(m)
        d1 = self.dec1(d2 + e1)  # 残差连接
        
        return d1

class DiffusionModel(nn.Module):
    """简化的扩散模型"""
    def __init__(self, image_size=64, in_channels=3, base_channels=64, num_timesteps=1000):
        super().__init__()
        self.num_timesteps = num_timesteps
        
        # U-Net 预测噪声
        self.model = SimpleUNet(in_channels, in_channels, base_channels)
        
        # 定义噪声调度（线性）
        self.betas = torch.linspace(1e-4, 0.02, num_timesteps)
        self.alphas = 1 - self.betas
        self.alpha_bars = torch.cumprod(self.alphas, dim=0)
        
    def forward_diffusion(self, x_0, t, noise=None):
        """前向过程：加噪"""
        if noise is None:
            noise = torch.randn_like(x_0)
            
        # 获取 alpha_bar
        alpha_bar = self.alpha_bars[t].view(-1, 1, 1, 1)
        
        # 加噪
        x_t = torch.sqrt(alpha_bar) * x_0 + torch.sqrt(1 - alpha_bar) * noise
        
        return x_t, noise
        
    def reverse_diffusion(self, x_t, t):
        """反向过程：去噪"""
        # 预测噪声
        noise_pred = self.model(x_t, t)
        
        # 获取 alpha 和 alpha_bar
        alpha = self.alphas[t].view(-1, 1, 1, 1)
        alpha_bar = self.alpha_bars[t].view(-1, 1, 1, 1)
        
        # 计算 x_0 的估计
        x_0_pred = (x_t - torch.sqrt(1 - alpha_bar) * noise_pred) / torch.sqrt(alpha_bar)
        
        # 计算 x_{t-1}
        if t[0] > 0:
            alpha_bar_prev = self.alpha_bars[t - 1].view(-1, 1, 1, 1)
            mean = torch.sqrt(alpha_bar_prev) * x_0_pred + torch.sqrt(1 - alpha_bar_prev) * noise_pred
            variance = self.betas[t].view(-1, 1, 1, 1)
            x_t_minus_1 = mean + torch.sqrt(variance) * torch.randn_like(x_t)
        else:
            x_t_minus_1 = x_0_pred
            
        return x_t_minus_1

# 使用示例
model = DiffusionModel(image_size=64, in_channels=3, base_channels=64)

# 模拟输入
batch_size = 4
x_0 = torch.randn(batch_size, 3, 64, 64)
t = torch.randint(0, model.num_timesteps, (batch_size,))

# 前向过程（加噪）
x_t, noise = model.forward_diffusion(x_0, t)
print(f"原始图像形状: {x_0.shape}")
print(f"加噪后图像形状: {x_t.shape}")

# 反向过程（去噪）
x_t_minus_1 = model.reverse_diffusion(x_t, t)
print(f"去噪后图像形状: {x_t_minus_1.shape}")
```

### 图神经网络（GNN）

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GCNLayer(nn.Module):
    """图卷积网络层"""
    def __init__(self, in_features, out_features):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features)
        
    def forward(self, x, adj):
        # x: [num_nodes, in_features] 节点特征
        # adj: [num_nodes, num_nodes] 邻接矩阵
        
        # 添加自环
        adj = adj + torch.eye(adj.size(0)).to(adj.device)
        
        # 度矩阵归一化
        degree = adj.sum(dim=1)
        degree_inv_sqrt = degree.pow(-0.5)
        degree_inv_sqrt[degree_inv_sqrt == float('inf')] = 0
        D_inv = torch.diag(degree_inv_sqrt)
        
        # 归一化邻接矩阵
        adj_norm = D_inv @ adj @ D_inv
        
        # 消息传递
        x = self.linear(adj_norm @ x)
        
        return x

class GCN(nn.Module):
    """图卷积网络"""
    def __init__(self, in_features, hidden_features, out_features, num_layers=2):
        super().__init__()
        self.layers = nn.ModuleList()
        self.layers.append(GCNLayer(in_features, hidden_features))
        for _ in range(num_layers - 2):
            self.layers.append(GCNLayer(hidden_features, hidden_features))
        self.layers.append(GCNLayer(hidden_features, out_features))
        
    def forward(self, x, adj):
        for i, layer in enumerate(self.layers[:-1]):
            x = layer(x, adj)
            x = F.relu(x)
            x = F.dropout(x, training=self.training)
        x = self.layers[-1](x, adj)
        return F.log_softmax(x, dim=1)

# 使用示例
num_nodes = 100
in_features = 16
hidden_features = 32
out_features = 7

# 创建随机图
x = torch.randn(num_nodes, in_features)
adj = torch.randint(0, 2, (num_nodes, num_nodes)).float()
adj = (adj + adj.T) / 2  # 对称化

# 创建模型
model = GCN(in_features, hidden_features, out_features)

# 前向传播
output = model(x, adj)
print(f"节点特征形状: {x.shape}")
print(f"邻接矩阵形状: {adj.shape}")
print(f"输出形状: {output.shape}")  # [100, 7]
```

### 自监督学习（对比学习）

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

class SimCLR(nn.Module):
    """SimCLR：简单的对比学习框架"""
    def __init__(self, base_encoder, projection_dim=128):
        super().__init__()
        
        # 基础编码器（如 ResNet）
        self.encoder = base_encoder
        
        # 获取编码器输出维度
        if hasattr(base_encoder, 'fc'):
            feature_dim = base_encoder.fc.in_features
            # 移除原始分类头
            self.encoder.fc = nn.Identity()
        else:
            feature_dim = 2048
            
        # 投影头
        self.projection = nn.Sequential(
            nn.Linear(feature_dim, feature_dim),
            nn.ReLU(),
            nn.Linear(feature_dim, projection_dim)
        )
        
    def forward(self, x):
        h = self.encoder(x)
        z = self.projection(h)
        return F.normalize(z, dim=1)

class NTXentLoss(nn.Module):
    """NT-Xent 损失（对比学习损失）"""
    def __init__(self, temperature=0.5):
        super().__init__()
        self.temperature = temperature
        
    def forward(self, z_i, z_j):
        batch_size = z_i.size(0)
        
        # 拼接两个视图的表示
        z = torch.cat([z_i, z_j], dim=0)
        
        # 计算相似度矩阵
        sim = torch.matmul(z, z.T) / self.temperature
        
        # 创建掩码，排除自身相似度
        mask = torch.eye(2 * batch_size, dtype=torch.bool).to(z.device)
        sim = sim.masked_fill(mask, -1e9)
        
        # 正样本对索引
        labels = torch.cat([torch.arange(batch_size, 2 * batch_size),
                           torch.arange(0, batch_size)]).to(z.device)
        
        # 计算损失
        loss = F.cross_entropy(sim, labels)
        
        return loss

# 使用示例
base_encoder = models.resnet18()
model = SimCLR(base_encoder, projection_dim=128)

# 模拟两个数据增强视图
batch_size = 32
x_i = torch.randn(batch_size, 3, 224, 224)
x_j = torch.randn(batch_size, 3, 224, 224)

# 前向传播
z_i = model(x_i)
z_j = model(x_j)

# 计算损失
criterion = NTXentLoss(temperature=0.5)
loss = criterion(z_i, z_j)

print(f"视图 i 表示形状: {z_i.shape}")
print(f"视图 j 表示形状: {z_j.shape}")
print(f"对比学习损失: {loss.item():.4f}")
```

### 大语言模型（LLM）微调

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# 加载预训练的 GPT-2
model_name = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 设置 pad token
tokenizer.pad_token = tokenizer.eos_token

print(f"模型参数量: {sum(p.numel() for p in model.parameters()) / 1e6:.2f}M")

# 文本生成
def generate_text(prompt, max_length=100, temperature=0.7, top_k=50):
    inputs = tokenizer(prompt, return_tensors="pt", padding=True)
    
    outputs = model.generate(
        inputs.input_ids,
        max_length=max_length,
        temperature=temperature,
        top_k=top_k,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )
    
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return text

# 测试生成
prompt = "人工智能的未来是"
generated = generate_text(prompt)
print(f"提示: {prompt}")
print(f"生成: {generated}")

# LoRA 微调（参数高效微调）
# 需要安装 peft 库：pip install peft
from peft import LoraConfig, get_peft_model

# 配置 LoRA
lora_config = LoraConfig(
    r=8,                          # LoRA 秩
    lora_alpha=32,                # LoRA alpha
    target_modules=["c_attn"],    # 要微调的模块
    lora_dropout=0.1,
    bias="none",
    task_type="CAUSAL_LM"
)

# 应用 LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# 训练数据
train_texts = [
    "人工智能正在改变世界。",
    "深度学习是人工智能的重要分支。",
    "大语言模型具有强大的自然语言理解能力。"
]

# 准备数据
inputs = tokenizer(train_texts, return_tensors="pt", padding=True, truncation=True)
labels = inputs.input_ids.clone()

# 训练
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

for epoch in range(3):
    model.train()
    outputs = model(input_ids=inputs.input_ids, labels=labels)
    loss = outputs.loss
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

# 保存微调后的模型
model.save_pretrained("./lora_model")
```

## 进阶用法

### 使用 Hugging Face Transformers 库

```python
from transformers import AutoModel, AutoTokenizer, pipeline

# 加载预训练模型
model_name = "bert-base-chinese"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# 文本特征提取
text = "深度学习很有趣"
inputs = tokenizer(text, return_tensors="pt")
outputs = model(**inputs)

# 获取 [CLS] token 的表示
cls_embedding = outputs.last_hidden_state[:, 0, :]
print(f"文本表示形状: {cls_embedding.shape}")  # [1, 768]

# 使用 pipeline 快速推理
# 情感分析
sentiment_analyzer = pipeline("sentiment-analysis", model="uer/roberta-base-finetuned-jd-binary-chinese")
result = sentiment_analyzer("这个产品非常好用")
print(f"情感分析结果: {result}")

# 文本分类
text_classifier = pipeline("text-classification", model="bert-base-chinese")
result = text_classifier("今天天气真好")
print(f"文本分类结果: {result}")
```

### 多模态模型（CLIP）

```python
import torch
from transformers import CLIPProcessor, CLIPModel

# 加载 CLIP 模型
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# 准备输入
texts = ["一只猫", "一只狗", "一辆车"]
# 注意：实际使用时需要提供真实图像
# from PIL import Image
# image = Image.open("cat.jpg")

# 模拟图像输入
images = torch.randn(3, 3, 224, 224)

# 处理输入
inputs = processor(text=texts, images=images, return_tensors="pt", padding=True)

# 推理
outputs = model(**inputs)
logits_per_image = outputs.logits_per_image  # 图像-文本相似度
probs = logits_per_image.softmax(dim=1)

print(f"图像-文本相似度矩阵形状: {logits_per_image.shape}")
print(f"概率分布: {probs}")

# 零样本图像分类
# 给定图像和类别描述，直接分类，无需训练
```

### 模型并行与分布式训练

```python
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

# 初始化分布式环境
def setup_distributed(rank, world_size):
    dist.init_process_group(
        backend='nccl',
        init_method='env://',
        rank=rank,
        world_size=world_size
    )
    torch.cuda.set_device(rank)

# 分布式数据并行训练
def train_ddp(rank, world_size):
    setup_distributed(rank, world_size)
    
    # 创建模型
    model = nn.Linear(10, 2).to(rank)
    model = DDP(model, device_ids=[rank])
    
    # 创建分布式数据加载器
    dataset = torch.randn(1000, 10)
    sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank)
    loader = DataLoader(dataset, batch_size=32, sampler=sampler)
    
    # 训练
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    for epoch in range(10):
        sampler.set_epoch(epoch)  # 每个 epoch 重新打乱数据
        
        for batch in loader:
            batch = batch.to(rank)
            output = model(batch)
            loss = output.sum()
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
    
    dist.destroy_process_group()

# 启动命令（多 GPU）
# torchrun --nproc_per_node=4 train.py

# 模型并行（大模型分片）
class LargeModel(nn.Module):
    def __init__(self):
        super().__init__()
        # 将模型分布到不同 GPU
        self.layer1 = nn.Linear(10000, 10000).to('cuda:0')
        self.layer2 = nn.Linear(10000, 10000).to('cuda:1')
        self.layer3 = nn.Linear(10000, 10).to('cuda:0')
        
    def forward(self, x):
        x = x.to('cuda:0')
        x = self.layer1(x)
        x = x.to('cuda:1')
        x = self.layer2(x)
        x = x.to('cuda:0')
        x = self.layer3(x)
        return x
```

## 核心知识点总结

| 技术 | 核心思想 | 主要应用 | 代表模型 |
|------|---------|---------|---------|
| Transformer | 自注意力机制 | NLP、CV | BERT、GPT、ViT |
| 扩散模型 | 逐步去噪生成 | 图像生成 | Stable Diffusion、DALL-E 2 |
| 图神经网络 | 图结构消息传递 | 社交网络、推荐系统 | GCN、GAT |
| 自监督学习 | 从数据本身构造监督信号 | 预训练 | SimCLR、MAE |
| 大语言模型 | 大规模预训练 + 微调 | 文本生成、对话 | GPT、LLaMA |
| 多模态模型 | 跨模态对齐 | 图文匹配、零样本分类 | CLIP、BLIP |

## 新手常见误区

### 误区 1：直接训练大模型

```python
# 错误：从零训练 GPT-2 这样的大模型
model = GPT2LMHeadModel.from_scratch(config)  # 需要海量数据和算力

# 正确：使用预训练模型微调
model = GPT2LMHeadModel.from_pretrained("gpt2")  # 利用已有知识
```

### 误区 2：Transformer 不需要位置编码

```python
# 错误：忘记添加位置编码
class BadTransformer(nn.Module):
    def forward(self, x):
        # 自注意力本身无法区分位置
        return attention(x, x, x)

# 正确：必须添加位置编码
class GoodTransformer(nn.Module):
    def __init__(self):
        self.pos_encoding = PositionalEncoding(d_model)
        
    def forward(self, x):
        x = self.pos_encoding(x)  # 注入位置信息
        return attention(x, x, x)
```

### 误区 3：扩散模型推理时从随机噪声开始

```python
# 错误：直接从纯噪声开始
x_t = torch.randn_like(image)

# 正确：应该从 T 步噪声开始，逐步去噪
x_t = torch.randn_like(image)
for t in reversed(range(num_timesteps)):
    x_t = model.reverse_diffusion(x_t, t)
```

### 误区 4：GNN 不考虑图的稀疏性

```python
# 错误：用稠密矩阵表示大图
adj = torch.zeros(100000, 100000)  # 内存爆炸

# 正确：使用稀疏矩阵
import torch_sparse
adj = torch_sparse.SparseTensor(row=edge_index[0], col=edge_index[1])
```

### 误区 5：对比学习不需要数据增强

```python
# 错误：两个视图完全相同
z_i = model(x)
z_j = model(x)  # 没有增强

# 正确：使用不同的数据增强
from torchvision import transforms
transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.4, 0.4, 0.4),
])
x_i = transform(image)
x_j = transform(image)
z_i = model(x_i)
z_j = model(x_j)
```

## 下一章预告

学完了前沿技术后，下一章将通过综合实战项目，将所学知识融会贯通，完成一个完整的深度学习应用，包括图像识别系统、推荐系统或聊天机器人。
