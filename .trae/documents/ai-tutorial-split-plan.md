# AI 教程按技术栈拆分计划

## 目标

将 `src/data/tutorial-series/series/ai.ts`（2143 行，18 个教程系列）按技术栈拆分为多个文件，放在 `src/data/tutorial-series/series/ai/` 子目录下。

## 拆分方案

按技术栈分为 6 个文件：

| 文件名 | 包含教程 | 数量 |
|--------|---------|------|
| `python-basics.ts` | python-ai, numpy-pandas, ai-math-basics | 3 |
| `machine-learning.ts` | machine-learning, feature-engineering-evaluation, scikit-learn | 3 |
| `deep-learning.ts` | deep-learning, pytorch, tensorflow-keras | 3 |
| `nlp-speech.ts` | nlp, speech-recognition-synthesis | 2 |
| `llm.ts` | transformer-llm, prompt-engineering-ai-apps, langchain-rag, llm-finetuning | 4 |
| `ai-engineering.ts` | computer-vision, model-deployment-mlops, java-ai-agent | 3 |

## 实施步骤

1. 创建 `src/data/tutorial-series/series/ai/` 目录
2. 创建上述 6 个文件，每个文件导出对应类别的教程数组（如 `pythonBasicsSeries: TutorialSeries[]`）
3. 创建 `src/data/tutorial-series/series/ai/index.ts`，聚合所有 AI 子分类并导出 `aiSeries`
4. 更新 `src/data/tutorial-series/index.ts`，将 `import { aiSeries } from './series/ai'` 保持不变（因为 ai 目录的 index.ts 会导出同名变量）
5. 删除原 `src/data/tutorial-series/series/ai.ts`
6. 运行 `npm run build` 验证构建正常

## 关键决策

- `category` 字段保持为 `'ai'` 不变，无需修改类型定义
- 所有教程的 `featured` 等属性保持不变
- 外部导入路径 `from '../data/tutorial-series'` 无需修改

## 验证

- `npm run build` 构建成功
- 教程中心页面 AI 分类显示正常
