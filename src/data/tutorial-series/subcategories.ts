import type { TutorialSubcategoryInfo } from './types'

export const tutorialSubcategories: TutorialSubcategoryInfo[] = [
  // 前端二级分类
  { id: 'web-basics', label: 'Web 基础', description: 'HTML、CSS、JavaScript 基础技术', parent: 'frontend' },
  { id: 'vue', label: 'Vue 框架', description: 'Vue 2/3 框架教程', parent: 'frontend' },
  { id: 'frontend-tooling', label: '前端工具', description: '构建工具与包管理', parent: 'frontend' },
  { id: 'frontend-advanced', label: '前端进阶', description: '性能优化、TypeScript 进阶', parent: 'frontend' },

  // 后端二级分类
  { id: 'java-basics', label: 'Java 基础', description: 'Java 语言基础与原理', parent: 'backend' },
  { id: 'spring', label: 'Spring 框架', description: 'Spring 核心与原理', parent: 'backend' },
  { id: 'jvm', label: 'JVM', description: 'Java 虚拟机深入', parent: 'backend' },
  { id: 'messaging', label: '消息队列', description: 'MQ、Kafka 消息队列', parent: 'backend' },
  { id: 'orm', label: 'ORM 框架', description: 'MyBatis 等持久层框架', parent: 'backend' },

  // 数据库二级分类
  { id: 'mysql', label: 'MySQL', description: 'MySQL 数据库与原理', parent: 'database' },
  { id: 'redis', label: 'Redis', description: 'Redis 缓存数据库与原理', parent: 'database' },
  { id: 'nosql', label: 'NoSQL', description: 'MongoDB 文档数据库', parent: 'database' },
  { id: 'search-engine', label: '搜索引擎', description: 'Elasticsearch 搜索引擎', parent: 'database' },
  { id: 'postgresql', label: 'PostgreSQL', description: 'PostgreSQL 关系数据库', parent: 'database' },

  // 计算机基础二级分类
  { id: 'web-fundamentals', label: 'Web 基础', description: '浏览器与网络基础', parent: 'cs-fundamentals' },
  { id: 'operating-system', label: '操作系统', description: '操作系统核心概念', parent: 'cs-fundamentals' },
  { id: 'algorithms', label: '算法与数据结构', description: '数据结构与算法', parent: 'cs-fundamentals' },
  { id: 'computer-network', label: '计算机网络', description: '网络协议与编程', parent: 'cs-fundamentals' },

  // 人工智能二级分类
  { id: 'python-basics', label: 'Python 基础', description: 'Python 与数据处理', parent: 'ai' },
  { id: 'machine-learning', label: '机器学习', description: '经典机器学习算法', parent: 'ai' },
  { id: 'deep-learning', label: '深度学习', description: '深度学习框架与算法', parent: 'ai' },
  { id: 'nlp-speech', label: 'NLP 与语音', description: '自然语言处理与语音技术', parent: 'ai' },
  { id: 'llm', label: '大语言模型', description: 'LLM 应用与开发', parent: 'ai' },
  { id: 'ai-engineering', label: 'AI 工程化', description: '模型部署与工程实践', parent: 'ai' },

  // 云原生二级分类
  { id: 'container', label: '容器技术', description: 'Docker 容器化', parent: 'cloud-native' },
  { id: 'orchestration', label: '容器编排', description: 'Kubernetes 编排', parent: 'cloud-native' },
  { id: 'commands', label: '命令实战', description: '容器与编排命令', parent: 'cloud-native' },

  // 运维二级分类
  { id: 'version-control', label: '版本控制', description: 'Git 版本控制', parent: 'devops' },
  { id: 'system-ops', label: '系统运维', description: 'Linux 系统管理', parent: 'devops' },
]
