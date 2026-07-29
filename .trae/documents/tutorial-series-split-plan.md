# tutorial-series.ts 文件拆分计划

## 背景

`src/data/tutorial-series.ts` 文件当前有 6287 行（约 195KB），包含 52 个教程系列的完整数据，文件过大不利于维护。需要将其拆分为更小的、按类别组织的模块。

## 当前状态分析

### 文件结构
- **类型定义**（1-25 行）：TutorialCategory, ChapterMeta, TutorialSeries, TutorialCategoryInfo
- **分类信息**（27-37 行）：tutorialCategories 数组
- **教程系列数据**（39-6256 行）：tutorialSeries 数组，包含 52 个教程系列
- **工具函数**（6258-6287 行）：5 个辅助函数

### 导入情况
以下文件导入了该模块：
- `src/components/SearchBar.vue`：导入 tutorialSeries
- `src/components/TutorialSidebar.vue`：导入 getSeriesById, getSeriesSections
- `src/views/ChapterView.vue`：导入 getSeriesById, getAdjacentChapters
- `src/views/HomePage.vue`：导入 tutorialCategories, tutorialSeries
- `src/views/SeriesIndex.vue`：导入 getSeriesById, getSeriesSections
- `src/views/TutorialIndex.vue`：导入 tutorialCategories, tutorialSeries, getSeriesByCategory

## 拆分方案

### 目录结构

```
src/data/
├── tutorial-series/
│   ├── index.ts                    # 主入口，导出所有内容
│   ├── types.ts                    # 类型定义
│   ├── categories.ts               # 分类信息
│   ├── utils.ts                    # 工具函数
│   └── series/                     # 教程数据目录
│       ├── frontend.ts             # 前端教程（10 个系列）
│       ├── backend.ts              # 后端教程（8 个系列）
│       ├── database.ts             # 数据库教程（7 个系列）
│       ├── cs-fundamentals.ts      # 计算机基础教程（4 个系列）
│       ├── ai.ts                   # 人工智能教程（18 个系列）
│       ├── cloud-native.ts         # 云原生教程（3 个系列）
│       ├── devops.ts               # DevOps 教程（2 个系列）
│       └── mobile.ts               # 移动端教程（0 个系列，预留）
```

### 文件职责

1. **types.ts**：定义所有 TypeScript 类型接口
2. **categories.ts**：定义分类元数据数组
3. **series/*.ts**：每个文件导出该分类下的教程系列数组
4. **utils.ts**：包含所有辅助函数
5. **index.ts**：聚合所有导出，提供统一接口

### 教程分类统计

- **frontend**（10 个）：html, css, javascript, typescript, vue2, vue3, jquery, npm, vite, performance
- **backend**（8 个）：java, java-principle, spring, spring-principle, jvm, mybatis-principle, mq, kafka-principle
- **database**（7 个）：mysql, mysql-principle, postgresql, redis, redis-principle, mongodb, elasticsearch
- **cs-fundamentals**（4 个）：os, data-structures, browser-network, computer-network
- **ai**（18 个）：python-ai, ai-math-basics, machine-learning, numpy-pandas, feature-engineering-evaluation, scikit-learn, deep-learning, pytorch, tensorflow-keras, computer-vision, nlp, speech-recognition-synthesis, transformer-llm, prompt-engineering-ai-apps, langchain-rag, llm-finetuning, model-deployment-mlops, java-ai-agent
- **cloud-native**（3 个）：docker, kubernetes, container-orchestration-commands
- **devops**（2 个）：git, linux
- **mobile**（0 个）：预留分类

## 实施步骤

### 步骤 1：创建目录结构
- 创建 `src/data/tutorial-series/` 目录
- 创建 `src/data/tutorial-series/series/` 子目录

### 步骤 2：创建 types.ts
- 从原文件提取类型定义（第 1-25 行）
- 导出 TutorialCategory, ChapterMeta, TutorialSeries, TutorialCategoryInfo

### 步骤 3：创建 categories.ts
- 从原文件提取 tutorialCategories 数组（第 27-37 行）
- 导入 TutorialCategoryInfo 类型

### 步骤 4：创建 8 个系列数据文件
- 按 category 将 52 个教程系列分别提取到对应文件
- 每个文件导出一个 TutorialSeries[] 数组
- 导入 TutorialSeries 类型

### 步骤 5：创建 utils.ts
- 从原文件提取 5 个工具函数（第 6258-6287 行）
- 导入必要的类型

### 步骤 6：创建 index.ts
- 重新导出 types.ts 的所有类型
- 重新导出 categories.ts 的 tutorialCategories
- 导入所有 series/*.ts 并合并为 tutorialSeries 数组
- 重新导出 utils.ts 的所有函数

### 步骤 7：删除旧文件
- 删除 `src/data/tutorial-series.ts`

### 步骤 8：验证
- 运行 `pnpm dev` 验证开发服务器正常
- 访问教程页面验证功能正常
- 运行 `pnpm build` 验证构建成功

## 关键决策

1. **保持导入路径兼容**：通过创建 `index.ts` 作为统一入口，现有的导入语句 `from '../data/tutorial-series'` 无需修改
2. **按 category 分组**：每个分类一个文件，便于维护和查找
3. **预留 mobile.ts**：虽然当前没有移动端教程，但创建空文件保持结构一致性
4. **保持数据顺序**：合并时按照原文件的顺序排列各分类数据

## 验证清单

- [ ] 所有类型定义正确导出
- [ ] 所有教程系列数据完整（52 个）
- [ ] 所有工具函数正常工作
- [ ] 现有导入路径无需修改
- [ ] 开发服务器正常启动
- [ ] 教程页面正常显示
- [ ] 构建成功无错误
