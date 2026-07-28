---
title: "第16章：LangChain 生产环境部署"
description: "掌握 LangChain 生产环境部署技巧，学习性能优化、错误处理、监控日志、成本控制、最佳实践"
---

# 第16章：LangChain 生产环境部署

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何把 LangChain 应用部署到生产环境？
- 生产环境需要注意哪些性能问题？
- 如何处理错误和异常？
- 如何监控和记录日志？
- 如何控制 API 调用成本？

这一章就是为了解答这些问题。我们会学习 LangChain 应用在生产环境中的部署技巧和最佳实践，让你的应用稳定、高效、低成本地运行。

---

## 1 为什么需要生产环境部署技巧？

### 痛点分析

开发环境和生产环境有很大差异，直接部署可能会遇到以下问题：

**问题 1：性能问题**

```python
# ❌ 开发环境可以，生产环境很慢
# 没有缓存，每次都重新检索
# 没有并发控制，高并发时崩溃
# 没有异步处理，响应时间长
```

**问题 2：错误处理不完善**

```python
# ❌ 错误处理不完善
# API 调用失败没有重试机制
# 没有超时控制
# 错误信息不友好
```

**问题 3：没有监控和日志**

```python
# ❌ 出了问题无法定位
# 没有记录关键操作日志
# 没有性能监控
# 没有错误告警
```

**问题 4：成本失控**

```python
# ❌ API 调用成本很高
# 没有缓存，重复查询
# 没有 token 限制
# 没有使用量统计
```

### 解决方案

**生产环境部署技巧**：性能优化、错误处理、监控日志、成本控制。

打个比方：

> **开发环境就像测试赛道**：
> - 可以随便开，出问题可以停下来修
>
> **生产环境就像高速公路**：
> - 需要稳定、高效、安全
> - 需要监控、告警、应急处理

---

## 2 性能优化

### 2.1 缓存策略

#### 2.1.1 查询结果缓存

```python
# app/services/cache_service.py
from redis import Redis
from app.core.config import settings
import json
import hashlib

class CacheService:
    def __init__(self):
        self.redis = Redis.from_url(settings.REDIS_URL)
    
    def _generate_key(self, query: str, user_id: int) -> str:
        """生成缓存键"""
        # 使用哈希避免键过长
        query_hash = hashlib.md5(query.encode()).hexdigest()
        return f"qa:{user_id}:{query_hash}"
    
    def get_qa_result(self, query: str, user_id: int) -> dict:
        """获取缓存的问答结果"""
        key = self._generate_key(query, user_id)
        cached = self.redis.get(key)
        
        if cached:
            return json.loads(cached)
        return None
    
    def set_qa_result(self, query: str, user_id: int, result: dict, ttl: int = 3600):
        """缓存问答结果"""
        key = self._generate_key(query, user_id)
        self.redis.setex(key, ttl, json.dumps(result))
    
    def invalidate_user_cache(self, user_id: int):
        """清除用户的所有缓存"""
        pattern = f"qa:{user_id}:*"
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)

# 使用示例
cache_service = CacheService()

def ask_with_cache(query: str, user_id: int) -> dict:
    # 1. 先查缓存
    cached_result = cache_service.get_qa_result(query, user_id)
    if cached_result:
        logger.info(f"缓存命中：{query}")
        return cached_result
    
    # 2. 调用 RAG
    result = rag_service.ask(query, user_id)
    
    # 3. 缓存结果
    cache_service.set_qa_result(query, user_id, result)
    
    return result
```

**代码解释**：

1. **生成缓存键**：使用用户 ID 和查询的哈希值
2. **获取缓存**：先查 Redis，命中则直接返回
3. **设置缓存**：未命中则调用 RAG，结果缓存 1 小时
4. **清除缓存**：文档更新时清除相关缓存

> **原理**：缓存可以大幅减少重复查询的 API 调用，降低成本和响应时间。

#### 2.1.2 向量索引缓存

```python
# app/services/vector_cache_service.py
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from app.core.config import settings
import os

class VectorCacheService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model=settings.EMBEDDING_MODEL)
        self.cache_dir = settings.VECTOR_CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def get_or_create_index(self, doc_ids: list) -> FAISS:
        """获取或创建向量索引"""
        # 生成缓存键
        cache_key = self._generate_cache_key(doc_ids)
        cache_path = f"{self.cache_dir}/{cache_key}"
        
        # 检查缓存
        if os.path.exists(cache_path):
            logger.info(f"加载缓存索引：{cache_key}")
            return FAISS.load_local(
                cache_path,
                self.embeddings,
                allow_dangerous_deserialization=True
            )
        
        # 创建新索引
        logger.info(f"创建新索引：{cache_key}")
        vector_db = self._create_index(doc_ids)
        
        # 保存缓存
        vector_db.save_local(cache_path)
        
        return vector_db
    
    def _generate_cache_key(self, doc_ids: list) -> str:
        """生成缓存键"""
        sorted_ids = sorted(doc_ids)
        return hashlib.md5(str(sorted_ids).encode()).hexdigest()
    
    def _create_index(self, doc_ids: list) -> FAISS:
        """创建向量索引"""
        # 实际应该从数据库加载文档
        # 这里简化处理
        texts = [f"文档 {doc_id} 的内容" for doc_id in doc_ids]
        return FAISS.from_texts(texts, self.embeddings)
```

### 2.2 并发控制

```python
# app/core/rate_limiter.py
from fastapi import HTTPException
from redis import Redis
from app.core.config import settings
import time

class RateLimiter:
    def __init__(self):
        self.redis = Redis.from_url(settings.REDIS_URL)
    
    def check_rate_limit(self, user_id: int, limit: int = 100, window: int = 3600):
        """检查速率限制"""
        key = f"rate_limit:{user_id}"
        
        # 获取当前计数
        current = self.redis.get(key)
        
        if current is None:
            # 第一次请求，设置计数和过期时间
            self.redis.setex(key, window, 1)
            return True
        
        current = int(current)
        
        if current >= limit:
            # 超过限制
            raise HTTPException(
                status_code=429,
                detail=f"请求过于频繁，请 {window} 秒后再试"
            )
        
        # 增加计数
        self.redis.incr(key)
        return True

# 使用示例
rate_limiter = RateLimiter()

@app.post("/ask")
def ask_question(query: str, user_id: int):
    # 检查速率限制
    rate_limiter.check_rate_limit(user_id, limit=100, window=3600)
    
    # 处理请求
    result = rag_service.ask(query, user_id)
    return result
```

**代码解释**：

1. **速率限制**：每个用户每小时最多 100 次请求
2. **Redis 计数**：使用 Redis 记录请求次数
3. **自动过期**：1 小时后自动重置计数

> **原理**：速率限制可以防止恶意请求，保护系统资源。

### 2.3 异步处理

```python
# app/services/async_service.py
import asyncio
from concurrent.futures import ThreadPoolExecutor

class AsyncService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)
    
    async def async_ask(self, query: str, user_id: int) -> dict:
        """异步问答"""
        loop = asyncio.get_event_loop()
        
        # 在线程池中执行同步操作
        result = await loop.run_in_executor(
            self.executor,
            self._sync_ask,
            query,
            user_id
        )
        
        return result
    
    def _sync_ask(self, query: str, user_id: int) -> dict:
        """同步问答（在线程池中执行）"""
        return rag_service.ask(query, user_id)

# 使用示例
async_service = AsyncService()

@app.post("/ask/async")
async def ask_question_async(query: str, user_id: int):
    result = await async_service.async_ask(query, user_id)
    return result
```

**代码解释**：

1. **线程池**：使用线程池执行同步操作
2. **异步接口**：FastAPI 支持异步接口
3. **并发处理**：可以同时处理多个请求

> **原理**：异步处理可以提高并发能力，减少响应时间。

---

## 3 错误处理

### 3.1 重试机制

```python
# app/utils/retry.py
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openai import RateLimitError, APIError
import logging

logger = logging.getLogger(__name__)

def retry_on_failure(func):
    """重试装饰器"""
    @retry(
        stop=stop_after_attempt(3),  # 最多重试 3 次
        wait=wait_exponential(multiplier=1, min=2, max=10),  # 指数退避
        retry=retry_if_exception_type((RateLimitError, APIError, TimeoutError)),
        reraise=True
    )
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"调用失败：{e}")
            raise
    
    return wrapper

# 使用示例
@retry_on_failure
def call_llm(prompt: str) -> str:
    """调用 LLM（带重试）"""
    response = llm.invoke(prompt)
    return response.content

@retry_on_failure
def call_embedding(text: str) -> list:
    """调用 Embedding（带重试）"""
    return embeddings.embed_query(text)
```

**代码解释**：

1. **重试次数**：最多重试 3 次
2. **指数退避**：等待时间依次为 2s、4s、8s
3. **重试条件**：只在特定异常时重试（速率限制、API 错误、超时）

> **原理**：重试机制可以处理临时性错误，提高系统稳定性。

### 3.2 超时控制

```python
# app/utils/timeout.py
from functools import wraps
import signal

class TimeoutError(Exception):
    pass

def timeout(seconds):
    """超时装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"操作超时：{seconds} 秒")
            
            # 设置信号处理器
            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)  # 取消闹钟
            
            return result
        
        return wrapper
    return decorator

# 使用示例
@timeout(seconds=30)
def ask_with_timeout(query: str, user_id: int) -> dict:
    """带超时的问答"""
    return rag_service.ask(query, user_id)
```

**代码解释**：

1. **超时时间**：30 秒
2. **信号处理**：使用 SIGALRM 信号实现超时
3. **异常处理**：超时抛出 TimeoutError

> **原理**：超时控制可以防止长时间阻塞，提高系统响应性。

### 3.3 全局异常处理

```python
# app/core/exceptions.py
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class AppException(Exception):
    """应用异常基类"""
    def __init__(self, message: str, code: int = 500):
        self.message = message
        self.code = code

class RAGException(AppException):
    """RAG 异常"""
    pass

class DocumentException(AppException):
    """文档处理异常"""
    pass

# 全局异常处理器
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """处理应用异常"""
    logger.error(f"应用异常：{exc.message}", exc_info=True)
    return JSONResponse(
        status_code=exc.code,
        content={"error": exc.message}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """处理全局异常"""
    logger.error(f"未捕获异常：{exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "服务器内部错误"}
    )
```

**代码解释**：

1. **自定义异常**：定义应用特定的异常类型
2. **全局处理器**：统一处理所有异常
3. **友好提示**：返回友好的错误信息

> **原理**：全局异常处理可以防止程序崩溃，提供友好的错误提示。

---

## 4 监控与日志

### 4.1 日志配置

```python
# app/core/logging.py
import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from app.core.config import settings
import os

def setup_logging():
    """配置日志"""
    # 创建日志目录
    os.makedirs("logs", exist_ok=True)
    
    # 日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )
    
    # 根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # 文件处理器（按大小轮转）
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # 错误日志（按时间轮转）
    error_handler = TimedRotatingFileHandler(
        'logs/error.log',
        when='midnight',
        interval=1,
        backupCount=30,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)
    
    return logging.getLogger(__name__)

logger = setup_logging()
```

**代码解释**：

1. **控制台输出**：开发时查看日志
2. **文件轮转**：按大小轮转，避免文件过大
3. **错误日志**：单独记录错误日志，便于排查

> **原理**：完善的日志系统可以记录关键操作，便于问题排查和审计。

### 4.2 性能监控

```python
# app/middleware/performance_monitor.py
from fastapi import Request
import time
import logging

logger = logging.getLogger(__name__)

@app.middleware("http")
async def performance_monitor_middleware(request: Request, call_next):
    """性能监控中间件"""
    start_time = time.time()
    
    # 处理请求
    response = await call_next(request)
    
    # 计算耗时
    process_time = time.time() - start_time
    
    # 记录日志
    logger.info(
        f"{request.method} {request.url.path} - "
        f"状态码：{response.status_code} - "
        f"耗时：{process_time:.3f}s"
    )
    
    # 添加响应头
    response.headers["X-Process-Time"] = str(process_time)
    
    return response
```

**代码解释**：

1. **中间件**：拦截所有 HTTP 请求
2. **计时**：记录请求处理时间
3. **日志记录**：记录请求路径、状态码、耗时

> **原理**：性能监控可以发现慢请求，优化系统性能。

### 4.3 使用统计

```python
# app/services/statistics_service.py
from sqlalchemy.orm import Session
from app.models.statistics import QAStatistics, DocumentStatistics
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)

class StatisticsService:
    def record_qa(self, user_id: int, query: str, response_time: float, db: Session):
        """记录问答统计"""
        try:
            today = date.today()
            
            # 查找今天的统计记录
            stat = db.query(QAStatistics).filter(
                QAStatistics.user_id == user_id,
                QAStatistics.date == today
            ).first()
            
            if stat:
                stat.question_count += 1
                stat.total_response_time += response_time
                stat.avg_response_time = stat.total_response_time / stat.question_count
            else:
                stat = QAStatistics(
                    user_id=user_id,
                    date=today,
                    question_count=1,
                    total_response_time=response_time,
                    avg_response_time=response_time
                )
                db.add(stat)
            
            db.commit()
            logger.info(f"记录问答统计：用户 {user_id}, 问题数 {stat.question_count}")
        
        except Exception as e:
            logger.error(f"记录统计失败：{e}")
            db.rollback()
    
    def record_document_upload(self, user_id: int, doc_id: int, chunk_count: int, db: Session):
        """记录文档上传统计"""
        try:
            stat = DocumentStatistics(
                user_id=user_id,
                doc_id=doc_id,
                chunk_count=chunk_count,
                uploaded_at=datetime.utcnow()
            )
            db.add(stat)
            db.commit()
            logger.info(f"记录文档上传：用户 {user_id}, 文档 {doc_id}")
        
        except Exception as e:
            logger.error(f"记录统计失败：{e}")
            db.rollback()
    
    def get_user_statistics(self, user_id: int, db: Session) -> dict:
        """获取用户统计"""
        today = date.today()
        
        stat = db.query(QAStatistics).filter(
            QAStatistics.user_id == user_id,
            QAStatistics.date == today
        ).first()
        
        if stat:
            return {
                "date": stat.date,
                "question_count": stat.question_count,
                "avg_response_time": stat.avg_response_time
            }
        
        return None
```

---

## 5 成本控制

### 5.1 Token 使用统计

```python
# app/services/token_usage_service.py
from sqlalchemy.orm import Session
from app.models.token_usage import TokenUsage
from datetime import date
import logging

logger = logging.getLogger(__name__)

class TokenUsageService:
    def record_usage(self, user_id: int, prompt_tokens: int, completion_tokens: int, db: Session):
        """记录 Token 使用"""
        try:
            today = date.today()
            
            # 查找今天的记录
            usage = db.query(TokenUsage).filter(
                TokenUsage.user_id == user_id,
                TokenUsage.date == today
            ).first()
            
            if usage:
                usage.prompt_tokens += prompt_tokens
                usage.completion_tokens += completion_tokens
                usage.total_tokens += prompt_tokens + completion_tokens
            else:
                usage = TokenUsage(
                    user_id=user_id,
                    date=today,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=prompt_tokens + completion_tokens
                )
                db.add(usage)
            
            db.commit()
            logger.info(f"记录 Token 使用：用户 {user_id}, 总 Token {usage.total_tokens}")
        
        except Exception as e:
            logger.error(f"记录 Token 使用失败：{e}")
            db.rollback()
    
    def check_token_limit(self, user_id: int, limit: int = 100000, db: Session) -> bool:
        """检查 Token 限制"""
        today = date.today()
        
        usage = db.query(TokenUsage).filter(
            TokenUsage.user_id == user_id,
            TokenUsage.date == today
        ).first()
        
        if usage and usage.total_tokens >= limit:
            logger.warning(f"用户 {user_id} 超过 Token 限制：{usage.total_tokens}/{limit}")
            return False
        
        return True
    
    def get_usage_statistics(self, user_id: int, db: Session) -> dict:
        """获取使用统计"""
        today = date.today()
        
        usage = db.query(TokenUsage).filter(
            TokenUsage.user_id == user_id,
            TokenUsage.date == today
        ).first()
        
        if usage:
            return {
                "date": usage.date,
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens
            }
        
        return {
            "date": today,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
```

### 5.2 成本优化策略

```python
# app/services/cost_optimization_service.py
from langchain_openai import ChatOpenAI
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class CostOptimizationService:
    def __init__(self):
        self.llm_cache = {}
    
    def get_optimal_model(self, query_complexity: str) -> ChatOpenAI:
        """根据查询复杂度选择模型"""
        if query_complexity == "simple":
            # 简单查询使用便宜的模型
            return ChatOpenAI(
                model="gpt-3.5-turbo",
                temperature=0
            )
        elif query_complexity == "medium":
            # 中等复杂度
            return ChatOpenAI(
                model="gpt-3.5-turbo-16k",
                temperature=0
            )
        else:
            # 复杂查询使用强大的模型
            return ChatOpenAI(
                model="gpt-4",
                temperature=0
            )
    
    def optimize_prompt(self, prompt: str, max_tokens: int = 500) -> str:
        """优化 Prompt，减少 Token 消耗"""
        # 1. 移除不必要的空白
        prompt = ' '.join(prompt.split())
        
        # 2. 使用更简洁的表达
        # 实际可以使用更复杂的优化算法
        
        return prompt
    
    def batch_process(self, queries: list, batch_size: int = 10) -> list:
        """批量处理，减少 API 调用次数"""
        results = []
        
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i+batch_size]
            
            # 批量处理
            batch_results = self._process_batch(batch)
            results.extend(batch_results)
            
            logger.info(f"批量处理：{i+len(batch)}/{len(queries)}")
        
        return results
    
    def _process_batch(self, queries: list) -> list:
        """处理一批查询"""
        # 实际应该实现批量处理逻辑
        return [f"结果：{query}" for query in queries]
```

**代码解释**：

1. **模型选择**：根据查询复杂度选择合适模型
2. **Prompt 优化**：减少不必要的 Token
3. **批量处理**：减少 API 调用次数

> **原理**：成本优化可以大幅降低 API 调用费用。

---

## 6 安全最佳实践

### 6.1 API Key 管理

```python
# app/core/security.py
from app.core.config import settings
import os

class SecurityManager:
    def __init__(self):
        self.api_keys = {}
    
    def get_api_key(self, provider: str) -> str:
        """获取 API Key"""
        # 从环境变量获取
        key = os.getenv(f"{provider.upper()}_API_KEY")
        
        if not key:
            raise ValueError(f"未配置 {provider} API Key")
        
        return key
    
    def rotate_api_key(self, provider: str, new_key: str):
        """轮换 API Key"""
        # 实际应该更新环境变量或配置中心
        os.environ[f"{provider.upper()}_API_KEY"] = new_key
        logger.info(f"轮换 {provider} API Key")
```

### 6.2 输入验证

```python
# app/core/validation.py
from pydantic import BaseModel, validator
import re

class QuestionRequest(BaseModel):
    question: str
    
    @validator('question')
    def validate_question(cls, v):
        # 长度限制
        if len(v) > 1000:
            raise ValueError('问题长度不能超过 1000 字符')
        
        # 移除危险字符
        v = re.sub(r'[<>&\'"]', '', v)
        
        return v.strip()

class DocumentUploadRequest(BaseModel):
    filename: str
    
    @validator('filename')
    def validate_filename(cls, v):
        # 检查文件扩展名
        allowed_extensions = ['.pdf', '.txt', '.docx']
        ext = os.path.splitext(v)[1].lower()
        
        if ext not in allowed_extensions:
            raise ValueError(f'不支持的文件类型：{ext}')
        
        # 检查文件名长度
        if len(v) > 255:
            raise ValueError('文件名太长')
        
        return v
```

---

## 7 部署检查清单

### 7.1 部署前检查

```markdown
## 部署前检查清单

### 环境配置
- [ ] 环境变量配置正确
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] API Key 配置正确

### 性能优化
- [ ] 缓存策略已启用
- [ ] 速率限制已配置
- [ ] 异步处理已实现
- [ ] 并发控制已配置

### 错误处理
- [ ] 重试机制已实现
- [ ] 超时控制已配置
- [ ] 全局异常处理已实现
- [ ] 错误日志已配置

### 监控日志
- [ ] 日志系统已配置
- [ ] 性能监控已启用
- [ ] 使用统计已实现
- [ ] 告警机制已配置

### 安全
- [ ] API Key 安全存储
- [ ] 输入验证已实现
- [ ] 权限控制已配置
- [ ] HTTPS 已启用

### 成本
- [ ] Token 使用统计已实现
- [ ] Token 限制已配置
- [ ] 成本优化策略已实施
```

### 7.2 部署脚本

```bash
#!/bin/bash
# deploy.sh

echo "开始部署..."

# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
pip install -r requirements.txt

# 3. 运行数据库迁移
alembic upgrade head

# 4. 重启服务
systemctl restart qa-backend

# 5. 检查服务状态
systemctl status qa-backend

echo "部署完成！"
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **性能优化** | 缓存、并发控制、异步处理 |
| **错误处理** | 重试机制、超时控制、全局异常处理 |
| **监控日志** | 日志系统、性能监控、使用统计 |
| **成本控制** | Token 统计、模型选择、Prompt 优化 |
| **安全实践** | API Key 管理、输入验证、权限控制 |
| **部署检查** | 环境配置、性能优化、错误处理、监控日志 |

---

## 9 新手常见误区

### 误区 1："开发环境可以直接用于生产"

**错！** 开发环境和生产环境有很大差异。

正确做法：按照生产环境标准配置，进行充分测试。

### 误区 2："不需要缓存"

**错！** 没有缓存会导致重复查询，成本高、速度慢。

正确做法：实现多级缓存（Redis、本地缓存）。

### 误区 3："不需要监控"

**错！** 没有监控，出问题无法定位。

正确做法：完善的日志系统、性能监控、告警机制。

### 误区 4："不控制成本"

**错！** API 调用成本可能很高。

正确做法：Token 统计、限制、优化策略。

### 误区 5："不重视安全"

**错！** 安全问题可能导致数据泄露。

正确做法：API Key 安全存储、输入验证、权限控制。

---

## 10 动手练习

### 练习 1：基础练习

**题目**：实现查询结果缓存。

<details>
<summary>点击查看答案</summary>

```python
from redis import Redis
import json

redis = Redis.from_url("redis://localhost:6379")

def ask_with_cache(query: str) -> dict:
    # 查缓存
    cached = redis.get(f"qa:{query}")
    if cached:
        return json.loads(cached)
    
    # 调用 RAG
    result = rag_service.ask(query)
    
    # 缓存结果
    redis.setex(f"qa:{query}", 3600, json.dumps(result))
    
    return result
```

</details>

### 练习 2：进阶练习

**题目**：实现带重试的 API 调用。

<details>
<summary>点击查看答案</summary>

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def call_llm_with_retry(prompt: str) -> str:
    response = llm.invoke(prompt)
    return response.content
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现完整的性能监控中间件。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import Request
import time

@app.middleware("http")
async def monitor_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"状态码：{response.status_code} - "
        f"耗时：{process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    
    return response
```

</details>

---

## 教程总结

恭喜你完成了《LangChain 与 RAG 实战》教程的全部学习！

### 学习回顾

我们从基础到实战，系统学习了：

1. **基础篇**（1-5 章）：LangChain 核心概念、环境搭建、LLM、Prompt、Output Parser
2. **进阶篇**（6-12 章）：Chain、Memory、Tool、Agent、RAG 原理、文档处理、向量数据库
3. **实战篇**（13-16 章）：RAG 实现、高级优化、企业级系统、生产部署

### 核心技能

你现在已经掌握：

- ✅ 使用 LangChain 构建 AI 应用
- ✅ 实现 RAG 检索增强生成系统
- ✅ 构建企业级知识库问答系统
- ✅ 部署和优化生产环境应用

### 下一步建议

1. **实践项目**：动手构建一个完整的知识库问答系统
2. **深入学习**：研究 LangChain 的高级特性（如 Multi-Modal、Graph RAG）
3. **关注社区**：跟踪 LangChain 和 LLM 技术的最新发展
4. **分享交流**：参与开源社区，分享你的经验和成果

### 推荐资源

- [LangChain 官方文档](https://python.langchain.com/)
- [LangChain GitHub](https://github.com/langchain-ai/langchain)
- [RAG 论文](https://arxiv.org/abs/2005.11401)
- [向量数据库对比](https://vector-database.dev/)

祝你在 AI 应用的道路上越走越远！🚀
