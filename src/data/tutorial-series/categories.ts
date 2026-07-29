import type { TutorialCategoryInfo } from './types'

export const tutorialCategories: TutorialCategoryInfo[] = [
  { id: 'frontend', label: '前端', description: '前端开发技术教程' },
  { id: 'backend', label: '后端', description: '后端开发技术教程' },
  { id: 'mobile', label: '移动端', description: '移动端开发技术教程' },
  { id: 'database', label: '数据库', description: 'MySQL/Redis/MongoDB/ES 数据库教程' },
  { id: 'cs-fundamentals', label: '计算机基础', description: '数据结构/算法/网络/操作系统' },
  { id: 'ai', label: '人工智能', description: 'AI/大数据/算法教程' },
  { id: 'cloud-native', label: '云原生', description: 'Docker/K8s/微服务教程' },
  { id: 'devops', label: '运维', description: 'Linux/CI/CD/监控教程' },
  { id: 'more', label: '更多', description: '浏览全部教程系列' },
]
