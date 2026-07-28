---
title: "第7章：语音合成实战"
description: "文本转语音、音色选择、语速调节、情感控制、音频保存"
---

# 第7章：语音合成实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么调用 API 实现文字转语音？
- 有哪些音色可以选择？
- 怎么调节语速、音调、音量？
- 怎么保存合成的音频？

这一章就是为了解答这些问题。我们会从 **基础合成** 开始，再学习 **参数调节**，最后掌握 **情感控制** 和 **音频保存**。

---

## 1 为什么需要实战？

### 痛点分析

学完原理后，新手常遇到这些问题：

- 知道原理，但不会调用 API
- 合成的声音机械感强，不自然
- 无法控制语速、音调
- 不知道如何保存和播放音频

### 解决方案

本章会带你：

- **动手实践**：从简单到复杂，逐步掌握
- **调节参数**：控制语速、音调、音量
- **保存音频**：导出为文件，供后续使用

打个比方：

> 学语音合成就像学唱歌。知道发声原理不够，必须开口练习。本章就是你的"练歌房"。

> **一句话总结**：实战出真知。

---

## 2 基础合成

### 2.1 pyttsx3 离线合成

**pyttsx3** 是离线语音合成库，不需要网络，适合快速测试。

```python
# 导入库
import pyttsx3

# 创建引擎
engine = pyttsx3.init()

# 查看可用音色
voices = engine.getProperty('voices')
for i, voice in enumerate(voices):
    print(f"{i}: {voice.name} ({voice.languages})")

# 设置音色（选择第一个）
engine.setProperty('voice', voices[0].id)

# 合成语音
text = "你好，这是一个测试"
engine.say(text)
engine.runAndWait()
# 播放合成的语音
```

### 2.2 百度 AI 语音合成

**百度 AI** 提供高质量的在线语音合成服务。

```python
# 导入库
from aip import AipSpeech
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建客户端
APP_ID = os.getenv('BAIDU_APP_ID')
API_KEY = os.getenv('BAIDU_API_KEY')
SECRET_KEY = os.getenv('BAIDU_SECRET_KEY')
client = AipSpeech(APP_ID, API_KEY, SECRET_KEY)

# 合成语音
def synthesize_speech(text, output_file='output.mp3'):
    """合成语音并保存"""
    # 调用 API
    result = client.synthesis(
        text,           # 要合成的文本
        'zh',           # 语言：zh=中文，en=英文
        1,              # 客户端类型（固定为 1）
        {
            'vol': 5,   # 音量：0-15，默认 5
            'spd': 5,   # 语速：0-15，默认 5
            'pit': 5,   # 音调：0-15，默认 5
            'per': 0    # 音色：0=女声，1=男声，3=情感男声，4=情感女声
        }
    )
    
    # 检查结果
    if not isinstance(result, dict):
        # 合成成功，保存音频
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存到 {output_file}")
    else:
        # 合成失败
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
synthesize_speech("你好，世界！", "hello.mp3")
```

### 2.3 腾讯云语音合成

```python
# 导入库
import json
import base64
from tencentcloud.common import credential
from tencentcloud.tts.v20190823 import tts, models

# 配置密钥
SECRET_ID = os.getenv('TENCENT_SECRET_ID')
SECRET_KEY = os.getenv('TENCENT_SECRET_KEY')

# 创建客户端
cred = credential.Credential(SECRET_ID, SECRET_KEY)
client = tts.TtsClient(cred, "ap-guangzhou")

# 合成语音
def synthesize_tencent(text, output_file='output.wav'):
    """腾讯云语音合成"""
    # 创建请求
    req = models.TextToVoiceRequest()
    req.Text = text              # 要合成的文本
    req.SessionId = "session_1"  # 会话 ID
    req.ModelType = 0            # 模型类型：0=标准
    req.VoiceType = 1001         # 音色：1001=女声，1002=男声
    req.Speed = 0                # 语速：-2 到 6，默认 0
    req.Volume = 0               # 音量：-10 到 10，默认 0
    req.Codec = "wav"            # 编码格式：wav, mp3
    
    # 调用 API
    resp = client.TextToVoice(req)
    result = json.loads(resp.to_json_string())
    
    # 解码并保存
    if 'Audio' in result:
        audio_data = base64.b64decode(result['Audio'])
        with open(output_file, 'wb') as f:
            f.write(audio_data)
        print(f"✅ 已保存到 {output_file}")
    else:
        print(f"❌ 错误：{result.get('Error')}")

# 使用示例
synthesize_tencent("你好，世界！", "hello.wav")
```

---

## 3 音色选择

### 3.1 百度音色

**百度 AI** 提供多种音色：

| per 值 | 音色 | 说明 |
| --- | --- | --- |
| 0 | 度小美 | 女声，标准 |
| 1 | 度小宇 | 男声，标准 |
| 3 | 度逍遥 | 男声，情感 |
| 4 | 度丫丫 | 女声，情感 |
| 106 | 度博文 | 男声，新闻播报 |
| 111 | 度小童 | 童声 |
| 5118 | 度小鹿 | 女声，客服 |

```python
# 使用不同音色
def synthesize_with_voice(text, voice_id=0, output_file='output.mp3'):
    """使用指定音色合成"""
    result = client.synthesis(text, 'zh', 1, {
        'vol': 5,
        'spd': 5,
        'pit': 5,
        'per': voice_id  # 音色 ID
    })
    
    if not isinstance(result, dict):
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存（音色 {voice_id}）")
    else:
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
synthesize_with_voice("你好，我是度小美", voice_id=0, output_file='xiaomei.mp3')
synthesize_with_voice("你好，我是度小宇", voice_id=1, output_file='xiaoyu.mp3')
```

### 3.2 腾讯云音色

**腾讯云** 提供多种音色：

| VoiceType | 音色 | 说明 |
| --- | --- | --- |
| 1001 | 智龙 | 男声，标准 |
| 1002 | 智媛 | 女声，标准 |
| 1003 | 智馨 | 女声，温柔 |
| 1004 | 智丹 | 女声，新闻 |
| 1005 | 智安 | 男声，新闻 |
| 1006 | 智博 | 男声，解说 |
| 1007 | 智玲 | 女声，客服 |
| 1008 | 智娜 | 女声，客服 |

```python
# 使用不同音色
def synthesize_tencent_voice(text, voice_type=1001, output_file='output.wav'):
    """使用指定音色合成"""
    req = models.TextToVoiceRequest()
    req.Text = text
    req.SessionId = "session_1"
    req.ModelType = 0
    req.VoiceType = voice_type
    req.Speed = 0
    req.Volume = 0
    req.Codec = "wav"
    
    resp = client.TextToVoice(req)
    result = json.loads(resp.to_json_string())
    
    if 'Audio' in result:
        audio_data = base64.b64decode(result['Audio'])
        with open(output_file, 'wb') as f:
            f.write(audio_data)
        print(f"✅ 已保存（音色 {voice_type}）")
    else:
        print(f"❌ 错误：{result.get('Error')}")

# 使用示例
synthesize_tencent_voice("你好，我是智龙", voice_type=1001, output_file='zhilong.wav')
synthesize_tencent_voice("你好，我是智媛", voice_type=1002, output_file='zhiyuan.wav')
```

---

## 4 参数调节

### 4.1 语速调节

**语速** 控制说话的快慢。

```python
# 百度语速调节
def synthesize_with_speed(text, speed=5, output_file='output.mp3'):
    """调节语速"""
    result = client.synthesis(text, 'zh', 1, {
        'vol': 5,
        'spd': speed,  # 语速：0-15，5 为正常
        'pit': 5,
        'per': 0
    })
    
    if not isinstance(result, dict):
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存（语速 {speed}）")
    else:
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
synthesize_with_speed("这是慢速", speed=2, output_file='slow.mp3')
synthesize_with_speed("这是正常速度", speed=5, output_file='normal.mp3')
synthesize_with_speed("这是快速", speed=10, output_file='fast.mp3')
```

### 4.2 音调调节

**音调** 控制声音的高低。

```python
# 百度音调调节
def synthesize_with_pitch(text, pitch=5, output_file='output.mp3'):
    """调节音调"""
    result = client.synthesis(text, 'zh', 1, {
        'vol': 5,
        'spd': 5,
        'pit': pitch,  # 音调：0-15，5 为正常
        'per': 0
    })
    
    if not isinstance(result, dict):
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存（音调 {pitch}）")
    else:
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
synthesize_with_pitch("这是低音", pitch=2, output_file='low_pitch.mp3')
synthesize_with_pitch("这是正常音调", pitch=5, output_file='normal_pitch.mp3')
synthesize_with_pitch("这是高音", pitch=10, output_file='high_pitch.mp3')
```

### 4.3 音量调节

**音量** 控制声音的大小。

```python
# 百度音量调节
def synthesize_with_volume(text, volume=5, output_file='output.mp3'):
    """调节音量"""
    result = client.synthesis(text, 'zh', 1, {
        'vol': volume,  # 音量：0-15，5 为正常
        'spd': 5,
        'pit': 5,
        'per': 0
    })
    
    if not isinstance(result, dict):
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存（音量 {volume}）")
    else:
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
synthesize_with_volume("这是小声", volume=2, output_file='quiet.mp3')
synthesize_with_volume("这是正常音量", volume=5, output_file='normal_volume.mp3')
synthesize_with_volume("这是大声", volume=10, output_file='loud.mp3')
```

### 4.4 综合调节

**综合调节** 多个参数。

```python
# 综合调节
def synthesize_custom(text, speed=5, pitch=5, volume=5, voice=0, output_file='output.mp3'):
    """自定义参数合成"""
    result = client.synthesis(text, 'zh', 1, {
        'vol': volume,
        'spd': speed,
        'pit': pitch,
        'per': voice
    })
    
    if not isinstance(result, dict):
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存")
    else:
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
synthesize_custom(
    "你好，这是自定义参数",
    speed=7,      # 稍快
    pitch=6,      # 稍高
    volume=8,     # 较大
    voice=4,      # 情感女声
    output_file='custom.mp3'
)
```

---

## 5 长文本合成

### 5.1 文本分割

**长文本** 需要分割成多段合成。

```python
import re

def split_text(text, max_length=500):
    """分割长文本"""
    # 按句子分割
    sentences = re.split(r'([。！？；\n])', text)
    
    # 合并短句
    chunks = []
    current_chunk = ""
    
    for i in range(0, len(sentences) - 1, 2):
        sentence = sentences[i] + sentences[i + 1]
        
        if len(current_chunk) + len(sentence) <= max_length:
            current_chunk += sentence
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = sentence
    
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks

# 使用示例
long_text = "这是第一句话。这是第二句话。" * 50
chunks = split_text(long_text, max_length=500)
print(f"分割成 {len(chunks)} 段")
for i, chunk in enumerate(chunks):
    print(f"第 {i+1} 段：{len(chunk)} 字")
```

### 5.2 批量合成

**批量合成** 多段文本并合并。

```python
import os

def synthesize_long_text(text, output_dir='output', final_file='final.mp3'):
    """合成并合并长文本"""
    os.makedirs(output_dir, exist_ok=True)
    
    # 分割文本
    chunks = split_text(text)
    
    # 逐段合成
    audio_files = []
    for i, chunk in enumerate(chunks):
        output_file = os.path.join(output_dir, f'chunk_{i:03d}.mp3')
        synthesize_custom(chunk, output_file=output_file)
        audio_files.append(output_file)
        print(f"✅ 已合成第 {i+1}/{len(chunks)} 段")
    
    # 合并音频（使用 pydub）
    try:
        from pydub import AudioSegment
        
        combined = AudioSegment.empty()
        for audio_file in audio_files:
            audio = AudioSegment.from_mp3(audio_file)
            combined += audio
        
        # 保存合并后的音频
        combined.export(final_file, format="mp3")
        print(f"✅ 已合并到 {final_file}")
        
    except ImportError:
        print("⚠️ 需要安装 pydub：pip install pydub")

# 使用示例
long_text = """
语音合成是将文字转换成语音的技术。
它可以让计算机"说话"，把信息传递给用户。
语音合成有很多应用场景，比如有声读物、导航播报、智能助手等。
""" * 10

synthesize_long_text(long_text, output_dir='temp_audio', final_file='long_text.mp3')
```

---

## 6 音频播放

### 6.1 播放本地音频

```python
import sounddevice as sd
import soundfile as sf

def play_audio(file_path):
    """播放音频文件"""
    # 读取音频文件
    data, samplerate = sf.read(file_path)
    
    # 播放
    print(f"🔊 正在播放：{file_path}")
    sd.play(data, samplerate)
    sd.wait()  # 等待播放完成
    print("✅ 播放完成")

# 使用示例
play_audio('output.mp3')
```

### 6.2 实时播放

```python
import pyaudio
import wave

def play_wav(file_path):
    """播放 WAV 文件"""
    # 打开文件
    wf = wave.open(file_path, 'rb')
    
    # 创建 PyAudio 实例
    p = pyaudio.PyAudio()
    
    # 打开音频流
    stream = p.open(
        format=p.get_format_from_width(wf.getsampwidth()),
        channels=wf.getnchannels(),
        rate=wf.getframerate(),
        output=True
    )
    
    # 读取并播放
    chunk = 1024
    data = wf.readframes(chunk)
    
    print(f"🔊 正在播放：{file_path}")
    while data:
        stream.write(data)
        data = wf.readframes(chunk)
    
    # 清理
    stream.stop_stream()
    stream.close()
    p.terminate()
    wf.close()
    print("✅ 播放完成")

# 使用示例
play_wav('output.wav')
```

---

## 7 完整实战项目

### 7.1 有声读物生成器

**项目需求**：输入文本，生成有声读物。

```python
"""
有声读物生成器
功能：文本 → 语音 → 保存
"""

import os
import json
import time
from aip import AipSpeech
from dotenv import load_dotenv

load_dotenv()

class AudiobookGenerator:
    """有声读物生成器"""
    
    def __init__(self):
        self.client = AipSpeech(
            os.getenv('BAIDU_APP_ID'),
            os.getenv('BAIDU_API_KEY'),
            os.getenv('BAIDU_SECRET_KEY')
        )
        self.output_dir = 'audiobook_output'
        os.makedirs(self.output_dir, exist_ok=True)
    
    def split_chapters(self, text):
        """按章节分割文本"""
        chapters = []
        lines = text.split('\n')
        
        current_chapter = ""
        current_title = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 检测章节标题（简单规则：以"第"开头且包含"章"）
            if line.startswith('第') and '章' in line[:10]:
                if current_chapter:
                    chapters.append({
                        'title': current_title,
                        'text': current_chapter
                    })
                current_title = line
                current_chapter = ""
            else:
                current_chapter += line + "\n"
        
        if current_chapter:
            chapters.append({
                'title': current_title or "正文",
                'text': current_chapter
            })
        
        return chapters
    
    def synthesize_chapter(self, chapter, index, voice=0, speed=5):
        """合成单个章节"""
        print(f"\n📖 正在合成：{chapter['title']}")
        
        # 分割文本
        chunks = split_text(chapter['text'], max_length=500)
        
        # 逐段合成
        audio_files = []
        for i, chunk in enumerate(chunks):
            output_file = os.path.join(
                self.output_dir,
                f'chapter_{index:02d}_part_{i:03d}.mp3'
            )
            
            result = self.client.synthesis(chunk, 'zh', 1, {
                'vol': 5,
                'spd': speed,
                'pit': 5,
                'per': voice
            })
            
            if not isinstance(result, dict):
                with open(output_file, 'wb') as f:
                    f.write(result)
                audio_files.append(output_file)
                print(f"  ✅ 第 {i+1}/{len(chunks)} 段")
            else:
                print(f"  ❌ 错误：{result.get('err_msg')}")
        
        return audio_files
    
    def generate_audiobook(self, text, output_file='audiobook.mp3', voice=0, speed=5):
        """生成完整有声读物"""
        print("🚀 开始生成有声读物\n")
        
        # 分割章节
        chapters = self.split_chapters(text)
        print(f"📚 共 {len(chapters)} 个章节")
        
        # 逐章合成
        all_audio_files = []
        for i, chapter in enumerate(chapters):
            audio_files = self.synthesize_chapter(chapter, i, voice, speed)
            all_audio_files.extend(audio_files)
        
        # 合并音频
        if all_audio_files:
            try:
                from pydub import AudioSegment
                
                print("\n🔧 正在合并音频...")
                combined = AudioSegment.empty()
                
                for audio_file in all_audio_files:
                    audio = AudioSegment.from_mp3(audio_file)
                    combined += audio
                
                combined.export(output_file, format="mp3")
                print(f"\n✅ 已生成有声读物：{output_file}")
                print(f"📊 总时长：{len(combined) / 1000 / 60:.1f} 分钟")
                
            except ImportError:
                print("⚠️ 需要安装 pydub：pip install pydub")
        else:
            print("❌ 没有生成任何音频")

# 使用示例
def main():
    """主函数"""
    # 读取文本
    with open('book.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    # 生成有声读物
    generator = AudiobookGenerator()
    generator.generate_audiobook(
        text,
        output_file='my_audiobook.mp3',
        voice=4,      # 情感女声
        speed=5       # 正常语速
    )

if __name__ == "__main__":
    main()
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **基础合成** | pyttsx3（离线）、百度/腾讯（在线） |
| **音色选择** | 多种音色可选，根据场景选择 |
| **参数调节** | 语速、音调、音量 |
| **长文本合成** | 文本分割 + 批量合成 + 音频合并 |
| **音频播放** | sounddevice、pyaudio |

---

## 9 新手常见误区

### 误区 1："语速越快越好"

**不一定！** 语速过快会降低清晰度，过慢会显得拖沓。

正常语速是 150-200 字/分钟（中文），对应参数 5-7。

### 误区 2："不需要文本分割"

**错！** API 有文本长度限制（通常 500 字），超长文本会失败。

正确做法：先分割文本，再逐段合成。

### 误区 3："所有音色都适合"

**不一定！** 不同音色适合不同场景：
- 新闻播报：用新闻音色
- 客服：用客服音色
- 有声读物：用情感音色

### 误区 4："合成后不需要检查"

**错！** 合成结果可能有错误，需要试听检查。

正确做法：合成后播放检查，确认效果。

### 误区 5："不需要处理特殊文本"

**坑！** 数字、英文、符号可能导致发音错误。

正确做法：先做文本规范化，再合成。

---

## 10 动手练习

### 练习 1：基础合成

编写一个函数，输入文本和输出文件名，合成语音并保存。

<details>
<summary>点击查看答案</summary>

```python
from aip import AipSpeech
import os
from dotenv import load_dotenv

load_dotenv()

def simple_synthesize(text, output_file):
    """简单合成"""
    client = AipSpeech(
        os.getenv('BAIDU_APP_ID'),
        os.getenv('BAIDU_API_KEY'),
        os.getenv('BAIDU_SECRET_KEY')
    )
    
    result = client.synthesis(text, 'zh', 1, {
        'vol': 5,
        'spd': 5,
        'pit': 5,
        'per': 0
    })
    
    if not isinstance(result, dict):
        with open(output_file, 'wb') as f:
            f.write(result)
        print(f"✅ 已保存到 {output_file}")
    else:
        print(f"❌ 错误：{result.get('err_msg')}")

# 使用示例
simple_synthesize("你好，世界！", "hello.mp3")
```

</details>

### 练习 2：参数调节

编写一个函数，可以调节语速、音调、音量，并生成多个版本的音频。

<details>
<summary>点击查看答案</summary>

```python
def generate_variations(text, output_dir='variations'):
    """生成不同参数的音频"""
    os.makedirs(output_dir, exist_ok=True)
    
    # 参数组合
    configs = [
        {'speed': 3, 'pitch': 5, 'volume': 5, 'name': 'slow'},
        {'speed': 5, 'pitch': 5, 'volume': 5, 'name': 'normal'},
        {'speed': 8, 'pitch': 5, 'volume': 5, 'name': 'fast'},
        {'speed': 5, 'pitch': 3, 'volume': 5, 'name': 'low_pitch'},
        {'speed': 5, 'pitch': 8, 'volume': 5, 'name': 'high_pitch'},
    ]
    
    for config in configs:
        output_file = os.path.join(output_dir, f"{config['name']}.mp3")
        synthesize_custom(
            text,
            speed=config['speed'],
            pitch=config['pitch'],
            volume=config['volume'],
            output_file=output_file
        )
        print(f"✅ 已生成：{config['name']}")

# 使用示例
generate_variations("这是一个测试")
```

</details>

### 练习 3（挑战）：有声读物生成器

完善有声读物生成器，添加以下功能：
- 支持选择不同音色
- 支持调节语速
- 生成章节索引（JSON 格式）

<details>
<summary>点击查看答案</summary>

```python
class AudiobookGeneratorAdvanced(AudiobookGenerator):
    """高级有声读物生成器"""
    
    def generate_with_index(self, text, output_file='audiobook.mp3', 
                           voice=0, speed=5):
        """生成并创建索引"""
        print("🚀 开始生成有声读物\n")
        
        # 分割章节
        chapters = self.split_chapters(text)
        print(f"📚 共 {len(chapters)} 个章节")
        
        # 生成音频
        all_audio_files = []
        chapter_index = []
        current_time = 0
        
        for i, chapter in enumerate(chapters):
            audio_files = self.synthesize_chapter(chapter, i, voice, speed)
            
            # 记录章节时间
            chapter_index.append({
                'title': chapter['title'],
                'start_time': current_time,
                'parts': len(audio_files)
            })
            
            all_audio_files.extend(audio_files)
            current_time += len(audio_files) * 10  # 估算
        
        # 合并音频
        if all_audio_files:
            from pydub import AudioSegment
            
            print("\n🔧 正在合并音频...")
            combined = AudioSegment.empty()
            
            for audio_file in all_audio_files:
                audio = AudioSegment.from_mp3(audio_file)
                combined += audio
            
            combined.export(output_file, format="mp3")
            
            # 更新索引
            for i, ch in enumerate(chapter_index):
                ch['start_time'] = i * (len(combined) / len(chapters))
            
            # 保存索引
            index_file = output_file.replace('.mp3', '_index.json')
            with open(index_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'title': '有声读物',
                    'total_duration': len(combined) / 1000,
                    'chapters': chapter_index
                }, f, ensure_ascii=False, indent=2)
            
            print(f"\n✅ 已生成：{output_file}")
            print(f"✅ 已生成索引：{index_file}")
            print(f"📊 总时长：{len(combined) / 1000 / 60:.1f} 分钟")
```

</details>

---

## 下一章预告

下一章我们会学习 **进阶应用与优化**——也就是如何构建完整的语音交互系统。你会学到语音对话系统集成、降噪处理、性能优化、部署方案等高级技能，掌握生产环境的最佳实践。
