---
title: "第6章：语音识别实战"
description: "API 调用、实时识别、文件识别、参数优化、结果处理"
---

# 第6章：语音识别实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么调用 API 实现语音识别？
- 文件识别和实时识别有什么区别？
- 怎么优化识别效果？
- 如何处理识别结果？

这一章就是为了解答这些问题。我们会从 **文件识别** 开始，再学习 **实时识别**，最后掌握 **参数优化** 和 **结果处理**。

---

## 1 为什么需要实战？

### 痛点分析

学完原理后，新手常遇到这些问题：

- 知道原理，但不会调用 API
- 识别效果差，不知道如何优化
- 实时识别有延迟，卡顿严重
- 识别结果有错误，无法处理

### 解决方案

本章会带你：

- **动手实践**：从简单到复杂，逐步掌握
- **优化效果**：调整参数，提升准确率
- **处理结果**：清洗、格式化、存储

打个比方：

> 学语音识别就像学开车。知道原理不够，必须上路练习。本章就是你的"练车场"。

> **一句话总结**：实战出真知。

---

## 2 文件识别

### 2.1 基本流程

**文件识别** 是把音频文件发送到 API，返回识别结果。

**流程**：

```
准备音频文件 → 读取文件 → 调用 API → 解析结果 → 输出文本
```

### 2.2 百度 AI 文件识别

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

# 读取音频文件
def get_file_content(file_path):
    """读取文件内容"""
    with open(file_path, 'rb') as fp:
        return fp.read()

# 调用语音识别
def recognize_file(file_path):
    """识别音频文件"""
    # 读取音频数据
    audio_data = get_file_content(file_path)
    
    # 调用 API
    # 参数：音频数据、格式、采样率
    result = client.asr(
        audio_data,      # 音频数据（bytes）
        'wav',           # 音频格式：wav, mp3, pcm
        16000,           # 采样率：16000（推荐）或 8000
        {
            'dev_pid': 1537,  # 语言模型：1537=普通话，1737=英语
        }
    )
    
    # 解析结果
    if result.get('err_no') == 0:
        # 识别成功
        text = result['result'][0]
        return text
    else:
        # 识别失败
        print(f"错误：{result.get('err_msg')}")
        return None

# 使用示例
text = recognize_file('test.wav')
if text:
    print(f"识别结果：{text}")
```

### 2.3 腾讯云文件识别

```python
# 导入库
import json
import base64
from tencentcloud.common import credential
from tencentcloud.asr.v20190614 import asr, models

# 配置密钥
SECRET_ID = os.getenv('TENCENT_SECRET_ID')
SECRET_KEY = os.getenv('TENCENT_SECRET_KEY')

# 创建客户端
cred = credential.Credential(SECRET_ID, SECRET_KEY)
client = asr.AsrClient(cred, "ap-guangzhou")

# 识别文件
def recognize_file_tencent(file_path):
    """腾讯云语音识别"""
    # 读取并编码音频
    with open(file_path, 'rb') as f:
        audio_data = f.read()
    
    audio_base64 = base64.b64encode(audio_data).decode()
    
    # 创建请求
    req = models.SentenceRecognitionRequest()
    req.ProjectId = 0
    req.SubServiceType = 2
    req.EngSerViceType = "16k"  # 16k 引擎
    req.SourceType = 1          # 语音数据
    req.Data = audio_base64     # Base64 编码
    req.DataLen = len(audio_base64)
    req.VoiceFormat = "wav"     # 音频格式
    
    # 调用 API
    resp = client.SentenceRecognition(req)
    result = json.loads(resp.to_json_string())
    
    return result.get('Result', '')

# 使用示例
text = recognize_file_tencent('test.wav')
print(f"识别结果：{text}")
```

### 2.4 Whisper 本地识别

```python
# 导入库
import whisper
import torch

# 加载模型
# 可选：tiny, base, small, medium, large
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("base", device=device)

# 识别文件
def recognize_with_whisper(file_path, language="zh"):
    """使用 Whisper 识别"""
    # 转录音频
    result = model.transcribe(
        file_path,
        language=language,  # 语言：zh=中文，en=英文
        task="transcribe",  # 任务：transcribe=识别，translate=翻译
        verbose=False       # 是否显示进度
    )
    
    return result["text"]

# 使用示例
text = recognize_with_whisper('test.wav', language="zh")
print(f"识别结果：{text}")

# 获取详细信息
result = model.transcribe('test.wav', verbose=True)
print(f"语言：{result['language']}")
print(f"片段：")
for segment in result["segments"]:
    print(f"[{segment['start']:.2f}s - {segment['end']:.2f}s] {segment['text']}")
```

---

## 3 实时识别

### 3.1 麦克风录音识别

**实时识别** 是从麦克风录制音频，实时返回识别结果。

```python
# 导入库
import pyaudio
import wave
import speech_recognition as sr

# 录音并识别
def recognize_from_mic():
    """从麦克风录音并识别"""
    # 创建识别器
    recognizer = sr.Recognizer()
    
    # 使用麦克风
    with sr.Microphone() as source:
        print("请说话...")
        
        # 调整环境噪声
        recognizer.adjust_for_ambient_noise(source, duration=1)
        
        # 录音
        audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
        print("录音完成，识别中...")
    
    try:
        # 使用百度 API 识别
        text = recognizer.recognize_baidu(
            audio,
            app_key=os.getenv('BAIDU_APP_ID'),
            api_key=os.getenv('BAIDU_API_KEY'),
            secret_key=os.getenv('BAIDU_SECRET_KEY'),
            language='zh-CN'
        )
        print(f"识别结果：{text}")
        return text
    except sr.UnknownValueError:
        print("无法识别")
        return None
    except sr.RequestError as e:
        print(f"请求失败：{e}")
        return None

# 使用示例
recognize_from_mic()
```

### 3.2 流式识别

**流式识别** 是边录音边识别，适合长时间录音。

```python
# 导入库
import pyaudio
import websocket
import json
import threading

# 百度流式识别
class BaiduStreamASR:
    """百度流式语音识别"""
    
    def __init__(self, app_id, api_key, secret_key):
        self.app_id = app_id
        self.api_key = api_key
        self.secret_key = secret_key
        self.ws = None
        self.result = []
        
    def on_message(self, ws, message):
        """接收消息"""
        data = json.loads(message)
        if data.get('type') == 'MID_TEXT':
            # 中间结果
            text = data.get('result', '')
            print(f"[中间] {text}")
        elif data.get('type') == 'FIN_TEXT':
            # 最终结果
            text = data.get('result', '')
            print(f"[最终] {text}")
            self.result.append(text)
    
    def on_error(self, ws, error):
        """错误处理"""
        print(f"错误：{error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        """连接关闭"""
        print("连接关闭")
    
    def on_open(self, ws):
        """连接打开"""
        print("连接已建立")
        
        # 发送开始帧
        start_frame = {
            "type": "START",
            "data": {
                "app_id": self.app_id,
                "app_key": self.api_key,
                "secret_key": self.secret_key,
                "dev_pid": 1537,
                "format": "pcm",
                "rate": 16000,
                "sample": 16
            }
        }
        ws.send(json.dumps(start_frame))
        
        # 开始录音
        self.start_recording(ws)
    
    def start_recording(self, ws):
        """开始录音"""
        # 音频参数
        CHUNK = 1024
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 16000
        
        # 创建 PyAudio 实例
        p = pyaudio.PyAudio()
        
        # 打开音频流
        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
        
        print("开始录音...")
        
        # 持续发送音频数据
        while True:
            data = stream.read(CHUNK)
            ws.send(data, opcode=websocket.ABNF.OPCODE_BINARY)
    
    def start(self):
        """启动流式识别"""
        self.ws = websocket.WebSocketApp(
            "wss://vop.baidu.com/realtime_asr",
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        self.ws.run_forever()

# 使用示例
asr = BaiduStreamASR(
    os.getenv('BAIDU_APP_ID'),
    os.getenv('BAIDU_API_KEY'),
    os.getenv('BAIDU_SECRET_KEY')
)
asr.start()
```

---

## 4 参数优化

### 4.1 采样率选择

**采样率** 影响识别效果和文件大小。

| 采样率 | 适用场景 | 说明 |
| --- | --- | --- |
| 8000 Hz | 电话录音 | 电话音质，文件小 |
| 16000 Hz | 通用场景 | 推荐，平衡效果和大小 |
| 44100 Hz | 高质量音频 | 文件大，效果提升有限 |

**建议**：语音识别使用 16000 Hz 足够。

### 4.2 语言模型选择

**语言模型** 影响识别准确率。

| 模型 ID | 语言 | 适用场景 |
| --- | --- | --- |
| 1537 | 普通话 | 通用场景 |
| 1536 | 粤语 | 粤语场景 |
| 1737 | 英语 | 英文场景 |
| 1837 | 韩语 | 韩文场景 |

**建议**：根据语言选择对应模型。

### 4.3 其他参数

| 参数 | 说明 | 推荐值 |
| --- | --- | --- |
| **dev_pid** | 语言模型 | 1537（普通话） |
| **format** | 音频格式 | wav（无损） |
| **rate** | 采样率 | 16000 |
| **nbest** | 返回候选数 | 3-5（需要选择时） |

---

## 5 结果处理

### 5.1 结果清洗

**识别结果** 可能包含错误，需要清洗。

```python
import re

def clean_text(text):
    """清洗识别结果"""
    # 去除多余空格
    text = re.sub(r'\s+', ' ', text)
    
    # 去除标点符号（可选）
    text = re.sub(r'[^\w\s]', '', text)
    
    # 数字转换（可选）
    text = text.replace('一', '1').replace('二', '2')
    
    return text.strip()

# 使用示例
raw_text = "今天 天气  很好 ！"
cleaned_text = clean_text(raw_text)
print(f"清洗前：{raw_text}")
print(f"清洗后：{cleaned_text}")
```

### 5.2 格式化输出

**格式化** 让结果更易读。

```python
def format_result(text, timestamp=None):
    """格式化识别结果"""
    result = {
        'text': text,
        'timestamp': timestamp or time.time(),
        'length': len(text)
    }
    return result

# 使用示例
import time
result = format_result("你好，世界")
print(json.dumps(result, ensure_ascii=False, indent=2))
```

### 5.3 存储结果

**存储** 识别结果供后续使用。

```python
import json

def save_results(results, file_path='results.json'):
    """保存识别结果"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"已保存到 {file_path}")

def load_results(file_path='results.json'):
    """加载识别结果"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# 使用示例
results = [
    format_result("第一条"),
    format_result("第二条")
]
save_results(results)
loaded = load_results()
print(loaded)
```

---

## 6 完整实战项目

### 6.1 语音笔记应用

**项目需求**：用户口述，自动转文字保存。

```python
"""
语音笔记应用
功能：录音 → 识别 → 保存
"""

import os
import json
import time
import speech_recognition as sr
from dotenv import load_dotenv

load_dotenv()

class VoiceNote:
    """语音笔记"""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.notes = []
        
    def record_and_recognize(self):
        """录音并识别"""
        with sr.Microphone() as source:
            print("🎤 请说话...（按 Ctrl+C 停止）")
            self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            try:
                audio = self.recognizer.listen(source, timeout=30)
                print("✅ 录音完成，识别中...")
                
                # 识别
                text = self.recognizer.recognize_baidu(
                    audio,
                    app_key=os.getenv('BAIDU_APP_ID'),
                    api_key=os.getenv('BAIDU_API_KEY'),
                    secret_key=os.getenv('BAIDU_SECRET_KEY'),
                    language='zh-CN'
                )
                
                print(f"📝 识别结果：{text}")
                return text
                
            except sr.WaitTimeoutError:
                print("⚠️ 录音超时")
                return None
            except sr.UnknownValueError:
                print("⚠️ 无法识别")
                return None
            except Exception as e:
                print(f"❌ 错误：{e}")
                return None
    
    def save_note(self, text):
        """保存笔记"""
        note = {
            'id': len(self.notes) + 1,
            'text': text,
            'timestamp': time.time(),
            'time_str': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.notes.append(note)
        print(f"✅ 已保存笔记 #{note['id']}")
    
    def list_notes(self):
        """列出所有笔记"""
        if not self.notes:
            print("📭 暂无笔记")
            return
        
        print("\n📋 笔记列表：")
        for note in self.notes:
            print(f"#{note['id']} [{note['time_str']}] {note['text']}")
    
    def export_notes(self, file_path='notes.json'):
        """导出笔记"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.notes, f, ensure_ascii=False, indent=2)
        print(f"✅ 已导出到 {file_path}")

# 主程序
def main():
    """主函数"""
    app = VoiceNote()
    
    while True:
        print("\n" + "="*50)
        print("1. 新建笔记")
        print("2. 查看笔记")
        print("3. 导出笔记")
        print("0. 退出")
        print("="*50)
        
        choice = input("请选择：").strip()
        
        if choice == '1':
            text = app.record_and_recognize()
            if text:
                app.save_note(text)
        elif choice == '2':
            app.list_notes()
        elif choice == '3':
            app.export_notes()
        elif choice == '0':
            print("👋 再见！")
            break
        else:
            print("⚠️ 无效选择")

if __name__ == "__main__":
    main()
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **文件识别** | 读取音频文件，调用 API 识别 |
| **实时识别** | 麦克风录音，实时返回结果 |
| **流式识别** | 边录音边识别，适合长音频 |
| **参数优化** | 采样率、语言模型、候选数 |
| **结果处理** | 清洗、格式化、存储 |

---

## 8 新手常见误区

### 误区 1："采样率越高越好"

**不一定！** 16kHz 足够，更高采样率文件大但效果提升有限。

### 误区 2："不需要环境降噪"

**错！** 环境噪声会严重影响识别率。

正确做法：录音前调整环境噪声，或在安静环境录音。

### 误区 3："识别结果直接可用"

**不一定！** 识别结果可能有错误，需要清洗和验证。

### 误区 4："实时识别不需要超时控制"

**坑！** 用户可能长时间不说话，导致程序卡住。

正确做法：设置 timeout 和 phrase_time_limit。

### 误区 5："不需要错误处理"

**错！** 网络问题、API 限制会导致失败。

正确做法：捕获异常，给出友好提示。

---

## 9 动手练习

### 练习 1：文件识别

编写一个函数，识别指定目录下的所有 WAV 文件，并保存结果到 JSON 文件。

<details>
<summary>点击查看答案</summary>

```python
import os
import json
from aip import AipSpeech

def recognize_directory(dir_path, output_file='results.json'):
    """识别目录下所有 WAV 文件"""
    client = AipSpeech(APP_ID, API_KEY, SECRET_KEY)
    results = []
    
    for filename in os.listdir(dir_path):
        if filename.endswith('.wav'):
            file_path = os.path.join(dir_path, filename)
            
            with open(file_path, 'rb') as f:
                audio_data = f.read()
            
            result = client.asr(audio_data, 'wav', 16000)
            
            if result.get('err_no') == 0:
                text = result['result'][0]
                results.append({
                    'file': filename,
                    'text': text
                })
                print(f"✅ {filename}: {text}")
            else:
                print(f"❌ {filename}: {result.get('err_msg')}")
    
    # 保存结果
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n已保存到 {output_file}")

# 使用示例
recognize_directory('./audio_files')
```

</details>

### 练习 2：实时识别

实现一个实时识别程序，持续监听麦克风，识别后打印结果。

<details>
<summary>点击查看答案</summary>

```python
import speech_recognition as sr
import os
from dotenv import load_dotenv

load_dotenv()

def continuous_recognition():
    """持续识别"""
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("🎤 开始监听...（按 Ctrl+C 停止）")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        
        while True:
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                text = recognizer.recognize_baidu(
                    audio,
                    app_key=os.getenv('BAIDU_APP_ID'),
                    api_key=os.getenv('BAIDU_API_KEY'),
                    secret_key=os.getenv('BAIDU_SECRET_KEY'),
                    language='zh-CN'
                )
                print(f"📝 {text}")
            except sr.WaitTimeoutError:
                continue
            except sr.UnknownValueError:
                print("⚠️ 无法识别")
            except KeyboardInterrupt:
                print("\n👋 停止监听")
                break

# 使用示例
continuous_recognition()
```

</details>

### 练习 3（挑战）：语音笔记应用

完善语音笔记应用，添加以下功能：
- 搜索笔记
- 删除笔记
- 编辑笔记（重新识别）

<details>
<summary>点击查看答案</summary>

```python
class VoiceNoteAdvanced(VoiceNote):
    """高级语音笔记"""
    
    def search_notes(self, keyword):
        """搜索笔记"""
        results = [n for n in self.notes if keyword in n['text']]
        if results:
            print(f"\n🔍 找到 {len(results)} 条结果：")
            for note in results:
                print(f"#{note['id']} {note['text']}")
        else:
            print("📭 未找到相关笔记")
    
    def delete_note(self, note_id):
        """删除笔记"""
        for i, note in enumerate(self.notes):
            if note['id'] == note_id:
                del self.notes[i]
                print(f"✅ 已删除笔记 #{note_id}")
                return
        print("⚠️ 笔记不存在")
    
    def edit_note(self, note_id):
        """编辑笔记（重新识别）"""
        for note in self.notes:
            if note['id'] == note_id:
                print("🎤 请重新说话...")
                text = self.record_and_recognize()
                if text:
                    note['text'] = text
                    note['timestamp'] = time.time()
                    note['time_str'] = time.strftime('%Y-%m-%d %H:%M:%S')
                    print(f"✅ 已更新笔记 #{note_id}")
                return
        print("⚠️ 笔记不存在")
```

</details>

---

## 下一章预告

下一章我们会学习 **语音合成实战**——也就是如何调用 API 实现语音合成。你会学到