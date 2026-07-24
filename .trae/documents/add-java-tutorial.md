# 增加 Java 教程

## 摘要
在教程系统中新增一个 Java 教程系列，归类为后端（backend），包含 16 个章节，从基础语法到实战应用。

## 当前状态分析
- 教程系列数据定义在 `src/data/tutorial-series.ts`，每条记录包含 `id`、`title`、`description`、`category`、`chapters` 数组
- 每个章节有 `number`、`title`、`description`、`section`（基础篇/进阶篇/实战篇）、`slug`
- 教程内容以 Markdown 文件形式存放在 `src/content/tutorials/{seriesId}/{number}-{slug}.md`
- 路由已支持动态系列路径 `/tutorials/:seriesId` 和 `/tutorials/:seriesId/:chapterSlug`，无需修改路由
- 现有类别中 `backend` 已定义，Java 应归入此类

## 修改方案

### 1. 修改 `src/data/tutorial-series.ts`
在 `tutorialSeries` 数组末尾追加 Java 教程系列配置：

```ts
{
  id: 'java',
  title: 'Java 从入门到精通',
  description: '系统学习 Java 语言，从基础语法到面向对象与实战应用',
  category: 'backend',
  chapters: [
    // 基础篇 (01-06)
    { number: '01', title: 'Java 简介与环境搭建', description: 'Java 发展史、JDK 安装、Hello World', section: '基础篇', slug: 'introduction' },
    { number: '02', title: '变量与数据类型', description: '基本数据类型、变量声明、类型转换', section: '基础篇', slug: 'variables-types' },
    { number: '03', title: '运算符', description: '算术、比较、逻辑、位运算符', section: '基础篇', slug: 'operators' },
    { number: '04', title: '条件语句', description: 'if-else、switch、三元表达式', section: '基础篇', slug: 'conditionals' },
    { number: '05', title: '循环', description: 'for、while、do-while、增强 for', section: '基础篇', slug: 'loops' },
    { number: '06', title: '数组', description: '一维数组、多维数组、Arrays 工具类', section: '基础篇', slug: 'arrays' },
    // 进阶篇 (07-12)
    { number: '07', title: '方法与参数', description: '方法定义、重载、可变参数', section: '进阶篇', slug: 'methods' },
    { number: '08', title: '面向对象基础', description: '类与对象、封装、构造器', section: '进阶篇', slug: 'oop-basics' },
    { number: '09', title: '继承与多态', description: 'extends、override、抽象类、interface', section: '进阶篇', slug: 'inheritance-polymorphism' },
    { number: '10', title: '异常处理', description: 'try-catch-finally、自定义异常、checked 与 unchecked', section: '进阶篇', slug: 'exceptions' },
    { number: '11', title: '集合框架', description: 'List、Set、Map、Iterator、泛型集合', section: '进阶篇', slug: 'collections' },
    { number: '12', title: 'IO 与 NIO', description: 'File、Stream、Reader/Writer、NIO 通道与缓冲区', section: '进阶篇', slug: 'io-nio' },
    // 实战篇 (13-16)
    { number: '13', title: '多线程与并发', description: 'Thread、Runnable、线程池、synchronized、Lock', section: '实战篇', slug: 'concurrency' },
    { number: '14', title: 'Lambda 与 Stream API', description: '函数式接口、Lambda 表达式、Stream 操作', section: '实战篇', slug: 'lambda-stream' },
    { number: '15', title: 'JDBC 数据库编程', description: 'JDBC 连接、PreparedStatement、事务管理', section: '实战篇', slug: 'jdbc' },
    { number: '16', title: 'Maven 与项目构建', description: 'Maven 基础、pom.xml、依赖管理、生命周期', section: '实战篇', slug: 'maven' },
  ],
}
```

### 2. 创建 16 个 Markdown 章节文件
在 `src/content/tutorials/java/` 目录下创建以下文件，每个文件遵循现有教程的 Markdown 格式（包含标题、简介、正文、代码示例、小结）：

- `01-introduction.md`
- `02-variables-types.md`
- `03-operators.md`
- `04-conditionals.md`
- `05-loops.md`
- `06-arrays.md`
- `07-methods.md`
- `08-oop-basics.md`
- `09-inheritance-polymorphism.md`
- `10-exceptions.md`
- `11-collections.md`
- `12-io-nio.md`
- `13-concurrency.md`
- `14-lambda-stream.md`
- `15-jdbc.md`
- `16-maven.md`

## 假设与决策
- Java 教程归类为 `backend`（后端），与现有类别定义一致
- 章节数量定为 16 章，与其他教程系列保持一致
- 章节划分遵循"基础 → 进阶 → 实战"三段式结构
- 无需修改路由、布局或导航组件，现有架构已自动支持新系列

## 验证步骤
1. 启动开发服务器，访问 `http://localhost:5175/tutorials`
2. 确认教程列表中出现 "Java 从入门到精通" 卡片，分类显示在"后端"下
3. 点击进入 Java 系列页，确认 16 个章节正确显示并按基础篇/进阶篇/实战篇分组
4. 点击任意章节，确认 Markdown 内容正确渲染
5. 侧边栏导航中确认 Java 教程可正常切换章节
