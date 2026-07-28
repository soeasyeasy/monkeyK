---
title: "第十六章：综合实战项目"
description: "待办事项应用、天气应用实战，综合运用所学知识"
---

# 第十六章：综合实战项目

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何将前面学到的知识综合运用？
- 一个完整的项目应该如何组织代码？
- 如何从零开始构建一个应用？
- 如何处理实际开发中的各种问题？
- 如何写出可维护的代码？

这一章就是为了解答这些问题。我们会从零开始构建两个完整的项目：一个待办事项应用和一个天气查询应用，将前面学到的所有知识融会贯通。

---

## 1 为什么需要综合实战？

### 痛点分析

学了很多知识点，但不知道如何综合运用：

```javascript
// ❌ 零散的知识点
// 会写 DOM 操作
// 会写事件处理
// 会写异步请求
// 会写本地存储
// 但不知道如何把它们组合成一个完整的应用
```

问题：
- 知识点之间缺乏联系
- 不知道如何组织项目结构
- 遇到实际问题不知道用哪个知识点

### 解决方案

通过完整项目实战：

```javascript
// ✅ 综合运用
// 待办事项应用：
// - DOM 操作：创建、删除、更新待办元素
// - 事件处理：点击、输入、键盘事件
// - 本地存储：保存待办数据
// - 模块化：按功能拆分代码
// - 错误处理：处理各种异常情况
```

> **一句话总结**：综合实战就像做菜，食材（知识点）都准备好了，现在要学习如何把它们做成一道完整的菜。

---

## 2 项目一：待办事项应用

### 功能需求

1. 添加待办事项
2. 标记完成/未完成
3. 删除待办事项
4. 筛选待办（全部/未完成/已完成）
5. 数据持久化（localStorage）
6. 统计信息（总数、未完成数）

### 项目结构

```
todo-app/
├── index.html          # 页面结构
├── css/
│   └── style.css       # 样式文件
└── js/
    ├── app.js          # 主应用入口
    ├── todo.js         # 待办数据管理
    ├── storage.js      # 本地存储模块
    ├── ui.js           # UI 渲染模块
    └── utils.js        # 工具函数
```

### 核心代码实现

#### 本地存储模块

```javascript
// storage.js
class Storage {
  constructor(key) {
    this.key = key
  }
  
  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('保存失败:', error)
      return false
    }
  }
  
  load(defaultValue = []) {
    try {
      const data = localStorage.getItem(this.key)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error('加载失败:', error)
      return defaultValue
    }
  }
  
  clear() {
    localStorage.removeItem(this.key)
  }
}

export default Storage
```

#### 待办数据管理

```javascript
// todo.js
import Storage from './storage.js'

class TodoManager {
  constructor() {
    this.storage = new Storage('todos')
    this.todos = this.storage.load()
  }
  
  // 添加待办
  addTodo(text) {
    if (!text || !text.trim()) {
      throw new Error('待办内容不能为空')
    }
    
    const todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }
    
    this.todos.unshift(todo) // 添加到开头
    this.storage.save(this.todos)
    return todo
  }
  
  // 切换完成状态
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id)
    if (!todo) {
      throw new Error('待办不存在')
    }
    
    todo.completed = !todo.completed
    this.storage.save(this.todos)
    return todo
  }
  
  // 删除待办
  deleteTodo(id) {
    const index = this.todos.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error('待办不存在')
    }
    
    this.todos.splice(index, 1)
    this.storage.save(this.todos)
    return true
  }
  
  // 获取所有待办
  getAllTodos() {
    return this.todos
  }
  
  // 筛选待办
  getFilteredTodos(filter = 'all') {
    switch (filter) {
      case 'active':
        return this.todos.filter(t => !t.completed)
      case 'completed':
        return this.todos.filter(t => t.completed)
      default:
        return this.todos
    }
  }
  
  // 获取统计信息
  getStats() {
    const total = this.todos.length
    const completed = this.todos.filter(t => t.completed).length
    const active = total - completed
    
    return { total, completed, active }
  }
  
  // 清除已完成
  clearCompleted() {
    this.todos = this.todos.filter(t => !t.completed)
    this.storage.save(this.todos)
    return true
  }
}

export default TodoManager
```

#### UI 渲染模块

```javascript
// ui.js
class TodoUI {
  constructor(container) {
    this.container = container
    this.currentFilter = 'all'
  }
  
  // 渲染待办列表
  renderTodos(todos) {
    if (todos.length === 0) {
      this.container.innerHTML = '<p class="empty">暂无待办事项</p>'
      return
    }
    
    const html = todos.map(todo => `
      <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox">
        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
        <button class="todo-delete">删除</button>
      </li>
    `).join('')
    
    this.container.innerHTML = html
  }
  
  // 渲染统计信息
  renderStats(stats) {
    const statsEl = document.getElementById('stats')
    statsEl.textContent = `共 ${stats.total} 项，已完成 ${stats.completed} 项，未完成 ${stats.active} 项`
  }
  
  // HTML 转义（防止 XSS）
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  // 设置当前筛选器
  setFilter(filter) {
    this.currentFilter = filter
    
    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter)
    })
  }
}

export default TodoUI
```

#### 主应用入口

```javascript
// app.js
import TodoManager from './todo.js'
import TodoUI from './ui.js'

class TodoApp {
  constructor() {
    this.todoManager = new TodoManager()
    this.ui = new TodoUI(document.getElementById('todo-list'))
    
    this.init()
  }
  
  init() {
    this.bindEvents()
    this.render()
  }
  
  bindEvents() {
    // 添加待办
    const input = document.getElementById('todo-input')
    const addBtn = document.getElementById('add-btn')
    
    addBtn.addEventListener('click', () => this.handleAdd())
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAdd()
    })
    
    // 待办列表事件委托
    document.getElementById('todo-list').addEventListener('click', (e) => {
      const li = e.target.closest('.todo-item')
      if (!li) return
      
      const id = Number(li.dataset.id)
      
      if (e.target.classList.contains('todo-checkbox')) {
        this.handleToggle(id)
      } else if (e.target.classList.contains('todo-delete')) {
        this.handleDelete(id)
      }
    })
    
    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleFilter(btn.dataset.filter)
      })
    })
    
    // 清除已完成
    document.getElementById('clear-completed').addEventListener('click', () => {
      this.handleClearCompleted()
    })
  }
  
  handleAdd() {
    const input = document.getElementById('todo-input')
    const text = input.value
    
    try {
      this.todoManager.addTodo(text)
      input.value = ''
      this.render()
    } catch (error) {
      alert(error.message)
    }
  }
  
  handleToggle(id) {
    try {
      this.todoManager.toggleTodo(id)
      this.render()
    } catch (error) {
      console.error('切换失败:', error)
    }
  }
  
  handleDelete(id) {
    if (!confirm('确定要删除这个待办吗？')) return
    
    try {
      this.todoManager.deleteTodo(id)
      this.render()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
  
  handleFilter(filter) {
    this.ui.setFilter(filter)
    this.render()
  }
  
  handleClearCompleted() {
    if (!confirm('确定要清除所有已完成的待办吗？')) return
    
    this.todoManager.clearCompleted()
    this.render()
  }
  
  render() {
    const todos = this.todoManager.getFilteredTodos(this.ui.currentFilter)
    const stats = this.todoManager.getStats()
    
    this.ui.renderTodos(todos)
    this.ui.renderStats(stats)
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp()
})
```

---

## 3 项目二：天气查询应用

### 功能需求

1. 输入城市名查询天气
2. 显示当前天气信息（温度、湿度、风速等）
3. 显示未来几天的天气预报
4. 保存查询历史
5. 错误处理（城市不存在、网络错误等）
6. 加载状态提示

### 项目结构

```
weather-app/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── app.js          # 主应用入口
    ├── api.js          # API 请求模块
    ├── weather.js      # 天气数据处理
    ├── history.js      # 查询历史管理
    └── ui.js           # UI 渲染
```

### 核心代码实现

#### API 请求模块

```javascript
// api.js
class WeatherAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.openweathermap.org/data/2.5'
  }
  
  // 获取当前天气
  async getCurrentWeather(city) {
    const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=zh_cn`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('城市不存在')
        }
        throw new Error(`请求失败：${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('网络错误，请检查网络连接')
      }
      throw error
    }
  }
  
  // 获取天气预报
  async getForecast(city) {
    const url = `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=zh_cn`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('网络错误，请检查网络连接')
      }
      throw error
    }
  }
}

export default WeatherAPI
```

#### 天气数据处理

```javascript
// weather.js
class WeatherData {
  // 格式化当前天气
  formatCurrentWeather(data) {
    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility
    }
  }
  
  // 格式化天气预报
  formatForecast(data) {
    // 按日期分组
    const dailyForecasts = {}
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString('zh-CN')
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = []
      }
      
      dailyForecasts[date].push(item)
    })
    
    // 计算每天的天气
    return Object.entries(dailyForecasts).slice(0, 5).map(([date, items]) => {
      const temps = items.map(i => i.main.temp)
      const minTemp = Math.round(Math.min(...temps))
      const maxTemp = Math.round(Math.max(...temps))
      
      // 取中午 12 点的天气作为代表
      const noonItem = items.find(i => new Date(i.dt * 1000).getHours() === 12) || items[0]
      
      return {
        date,
        minTemp,
        maxTemp,
        description: noonItem.weather[0].description,
        icon: noonItem.weather[0].icon,
        humidity: noonItem.main.humidity
      }
    })
  }
}

export default WeatherData
```

#### 查询历史管理

```javascript
// history.js
class SearchHistory {
  constructor(maxSize = 10) {
    this.storageKey = 'weather_search_history'
    this.maxSize = maxSize
  }
  
  // 添加搜索记录
  add(city) {
    const history = this.getAll()
    
    // 移除重复项
    const filtered = history.filter(c => c !== city)
    
    // 添加到开头
    filtered.unshift(city)
    
    // 限制数量
    const limited = filtered.slice(0, this.maxSize)
    
    localStorage.setItem(this.storageKey, JSON.stringify(limited))
    return limited
  }
  
  // 获取所有历史记录
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('加载历史记录失败:', error)
      return []
    }
  }
  
  // 清除历史记录
  clear() {
    localStorage.removeItem(this.storageKey)
  }
  
  // 删除单个记录
  remove(city) {
    const history = this.getAll()
    const filtered = history.filter(c => c !== city)
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    return filtered
  }
}

export default SearchHistory
```

#### UI 渲染模块

```javascript
// ui.js
class WeatherUI {
  // 显示加载状态
  showLoading() {
    document.getElementById('loading').style.display = 'block'
    document.getElementById('weather-result').style.display = 'none'
    document.getElementById('error').style.display = 'none'
  }
  
  // 隐藏加载状态
  hideLoading() {
    document.getElementById('loading').style.display = 'none'
  }
  
  // 显示当前天气
  showCurrentWeather(weather) {
    const container = document.getElementById('weather-result')
    container.style.display = 'block'
    
    container.innerHTML = `
      <div class="current-weather">
        <h2>${weather.city}, ${weather.country}</h2>
        <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="${weather.description}">
        <p class="temperature">${weather.temperature}°C</p>
        <p class="description">${weather.description}</p>
        <div class="details">
          <p>体感温度：${weather.feelsLike}°C</p>
          <p>湿度：${weather.humidity}%</p>
          <p>风速：${weather.windSpeed} m/s</p>
          <p>气压：${weather.pressure} hPa</p>
        </div>
      </div>
    `
  }
  
  // 显示天气预报
  showForecast(forecast) {
    const container = document.getElementById('forecast')
    
    const html = forecast.map(day => `
      <div class="forecast-item">
        <p class="date">${day.date}</p>
        <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}">
        <p class="temp">${day.minTemp}° / ${day.maxTemp}°</p>
        <p class="desc">${day.description}</p>
      </div>
    `).join('')
    
    container.innerHTML = html
  }
  
  // 显示错误
  showError(message) {
    const errorEl = document.getElementById('error')
    errorEl.style.display = 'block'
    errorEl.textContent = message
  }
  
  // 显示搜索历史
  showHistory(history) {
    const container = document.getElementById('history')
    
    if (history.length === 0) {
      container.innerHTML = '<p class="empty">暂无搜索记录</p>'
      return
    }
    
    const html = history.map(city => `
      <span class="history-item" data-city="${city}">
        ${city}
        <button class="remove-history" data-city="${city}">×</button>
      </span>
    `).join('')
    
    container.innerHTML = html
  }
}

export default WeatherUI
```

#### 主应用入口

```javascript
// app.js
import WeatherAPI from './api.js'
import WeatherData from './weather.js'
import SearchHistory from './history.js'
import WeatherUI from './ui.js'

class WeatherApp {
  constructor(apiKey) {
    this.api = new WeatherAPI(apiKey)
    this.weatherData = new WeatherData()
    this.history = new SearchHistory()
    this.ui = new WeatherUI()
    
    this.init()
  }
  
  init() {
    this.bindEvents()
    this.renderHistory()
  }
  
  bindEvents() {
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', () => {
      this.handleSearch()
    })
    
    // 回车搜索
    document.getElementById('city-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch()
      }
    })
    
    // 点击历史记录
    document.getElementById('history').addEventListener('click', (e) => {
      if (e.target.classList.contains('history-item')) {
        const city = e.target.dataset.city
        document.getElementById('city-input').value = city
        this.handleSearch()
      } else if (e.target.classList.contains('remove-history')) {
        e.stopPropagation()
        const city = e.target.dataset.city
        this.handleRemoveHistory(city)
      }
    })
    
    // 清除历史
    document.getElementById('clear-history').addEventListener('click', () => {
      this.handleClearHistory()
    })
  }
  
  async handleSearch() {
    const input = document.getElementById('city-input')
    const city = input.value.trim()
    
    if (!city) {
      alert('请输入城市名')
      return
    }
    
    this.ui.showLoading()
    
    try {
      // 并行请求当前天气和预报
      const [currentData, forecastData] = await Promise.all([
        this.api.getCurrentWeather(city),
        this.api.getForecast(city)
      ])
      
      // 处理数据
      const currentWeather = this.weatherData.formatCurrentWeather(currentData)
      const forecast = this.weatherData.formatForecast(forecastData)
      
      // 显示结果
      this.ui.hideLoading()
      this.ui.showCurrentWeather(currentWeather)
      this.ui.showForecast(forecast)
      
      // 添加到历史记录
      this.history.add(city)
      this.renderHistory()
      
      // 清空输入框
      input.value = ''
    } catch (error) {
      this.ui.hideLoading()
      this.ui.showError(error.message)
      console.error('查询失败:', error)
    }
  }
  
  renderHistory() {
    const history = this.history.getAll()
    this.ui.showHistory(history)
  }
  
  handleRemoveHistory(city) {
    this.history.remove(city)
    this.renderHistory()
  }
  
  handleClearHistory() {
    if (!confirm('确定要清除所有搜索历史吗？')) return
    
    this.history.clear()
    this.renderHistory()
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  // 替换为你的 API Key
  const API_KEY = 'your_api_key_here'
  new WeatherApp(API_KEY)
})
```

---

## 4 核心知识点总结

| 知识点 | 在项目中应用 |
| --- | --- |
| DOM 操作 | 创建、更新、删除元素 |
| 事件处理 | 点击、输入、键盘事件 |
| 异步编程 | API 请求、Promise.all |
| 本地存储 | 保存待办、搜索历史 |
| 模块化 | 按功能拆分代码 |
| 错误处理 | try-catch、用户提示 |
| 类与对象 | 封装功能模块 |

---

## 5 新手常见误区

### 误区 1：所有代码都写在一个文件

**错！** 应该按功能模块化。

```javascript
// ❌ 不好：所有代码混在一起
// app.js - 1000+ 行代码

// ✅ 好：按功能拆分
// storage.js - 本地存储
// todo.js - 待办逻辑
// ui.js - UI 渲染
// app.js - 主入口
```

### 误区 2：直接操作 innerHTML 有安全风险

**对！** 用户输入需要转义。

```javascript
// ❌ 危险：直接插入用户输入
element.innerHTML = userInput // 可能执行恶意脚本

// ✅ 安全：使用 textContent 或转义
element.textContent = userInput // 安全

// 或转义 HTML
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
```

### 误区 3：不需要处理网络错误

**错！** 网络请求可能失败。

```javascript
// ❌ 不好：没有错误处理
fetch(url).then(r => r.json()).then(data => console.log(data))

// ✅ 好：完整的错误处理
try {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP 错误：${response.status}`)
  }
  const data = await response.json()
  return data
} catch (error) {
  console.error('请求失败:', error)
  // 显示友好的错误提示
  showError('网络请求失败，请稍后重试')
}
```

---

## 6 动手练习

### 练习 1：基础练习

为待办事项应用添加编辑功能。

<details>
<summary>点击查看答案</summary>

```javascript
// 在 TodoManager 中添加编辑方法
editTodo(id, newText) {
  const todo = this.todos.find(t => t.id === id)
  if (!todo) {
    throw new Error('待办不存在')
  }
  
  if (!newText || !newText.trim()) {
    throw new Error('待办内容不能为空')
  }
  
  todo.text = newText.trim()
  this.storage.save(this.todos)
  return todo
}

// 在 UI 中添加编辑按钮
renderTodos(todos) {
  const html = todos.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox">
      <span class="todo-text">${this.escapeHtml(todo.text)}</span>
      <button class="todo-edit">编辑</button>
      <button class="todo-delete">删除</button>
    </li>
  `).join('')
  
  this.container.innerHTML = html
}

// 在 app.js 中处理编辑事件
handleEdit(id) {
  const todo = this.todoManager.getAllTodos().find(t => t.id === id)
  if (!todo) return
  
  const newText = prompt('编辑待办:', todo.text)
  if (newText === null) return // 用户取消
  
  try {
    this.todoManager.editTodo(id, newText)
    this.render()
  } catch (error) {
    alert(error.message)
  }
}
```

</details>

### 练习 2：进阶练习

为天气应用添加自动补全功能。

<details>
<summary>点击查看答案</summary>

```javascript
// 城市列表（简化版）
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安']

class AutoComplete {
  constructor(input, suggestions) {
    this.input = input
    this.suggestions = suggestions
    this.selectedIndex = -1
    
    this.bindEvents()
  }
  
  bindEvents() {
    this.input.addEventListener('input', () => {
      this.handleInput()
    })
    
    this.input.addEventListener('keydown', (e) => {
      this.handleKeydown(e)
    })
    
    this.suggestions.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-item')) {
        this.selectSuggestion(e.target.textContent)
      }
    })
  }
  
  handleInput() {
    const query = this.input.value.trim()
    
    if (!query) {
      this.hideSuggestions()
      return
    }
    
    const matches = CITIES.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    )
    
    if (matches.length === 0) {
      this.hideSuggestions()
      return
    }
    
    this.showSuggestions(matches)
  }
  
  handleKeydown(e) {
    const items = this.suggestions.querySelectorAll('.suggestion-item')
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1)
        this.updateSelection(items)
        break
      case 'ArrowUp':
        e.preventDefault()
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1)
        this.updateSelection(items)
        break
      case 'Enter':
        if (this.selectedIndex >= 0) {
          e.preventDefault()
          this.selectSuggestion(items[this.selectedIndex].textContent)
        }
        break
      case 'Escape':
        this.hideSuggestions()
        break
    }
  }
  
  showSuggestions(matches) {
    this.suggestions.innerHTML = matches.map(city => 
      `<div class="suggestion-item">${city}</div>`
    ).join('')
    this.suggestions.style.display = 'block'
    this.selectedIndex = -1
  }
  
  hideSuggestions() {
    this.suggestions.style.display = 'none'
    this.selectedIndex = -1
  }
  
  updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex)
    })
  }
  
  selectSuggestion(city) {
    this.input.value = city
    this.hideSuggestions()
    this.input.focus()
  }
}

// 使用
const autoComplete = new AutoComplete(
  document.getElementById('city-input'),
  document.getElementById('suggestions')
)
```

</details>

### 练习 3（挑战）：综合练习

为待办事项应用添加拖拽排序功能。

<details>
<summary>点击查看答案</summary>

```javascript
class DraggableTodoList {
  constructor(container, todoManager, onReorder) {
    this.container = container
    this.todoManager = todoManager
    this.onReorder = onReorder
    this.draggedItem = null
    
    this.init()
  }
  
  init() {
    this.container.addEventListener('dragstart', (e) => this.handleDragStart(e))
    this.container.addEventListener('dragend', (e) => this.handleDragEnd(e))
    this.container.addEventListener('dragover', (e) => this.handleDragOver(e))
    this.container.addEventListener('drop', (e) => this.handleDrop(e))
  }
  
  handleDragStart(e) {
    if (!e.target.classList.contains('todo-item')) return
    
    this.draggedItem = e.target
    e.target.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  }
  
  handleDragEnd(e) {
    if (!e.target.classList.contains('todo-item')) return
    
    e.target.classList.remove('dragging')
    this.draggedItem = null
    
    // 移除所有 drag-over 类
    this.container.querySelectorAll('.todo-item').forEach(item => {
      item.classList.remove('drag-over')
    })
  }
  
  handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const target = e.target.closest('.todo-item')
    if (!target || target === this.draggedItem) return
    
    // 添加视觉反馈
    this.container.querySelectorAll('.todo-item').forEach(item => {
      item.classList.remove('drag-over')
    })
    target.classList.add('drag-over')
  }
  
  handleDrop(e) {
    e.preventDefault()
    
    const target = e.target.closest('.todo-item')
    if (!target || target === this.draggedItem) return
    
    // 获取拖拽前后的索引
    const fromId = Number(this.draggedItem.dataset.id)
    const toId = Number(target.dataset.id)
    
    // 重新排序
    this.reorderTodos(fromId, toId)
    
    target.classList.remove('drag-over')
  }
  
  reorderTodos(fromId, toId) {
    const todos = this.todoManager.getAllTodos()
    const fromIndex = todos.findIndex(t => t.id === fromId)
    const toIndex = todos.findIndex(t => t.id === toId)
    
    if (fromIndex === -1 || toIndex === -1) return
    
    // 移动元素
    const [moved] = todos.splice(fromIndex, 1)
    todos.splice(toIndex, 0, moved)
    
    // 保存新顺序
    this.todoManager.saveTodos(todos)
    
    // 触发重新渲染
    this.onReorder()
  }
}

// 在 TodoManager 中添加保存方法
saveTodos(todos) {
  this.todos = todos
  this.storage.save(this.todos)
}

// 在 app.js 中使用
initDraggable() {
  new DraggableTodoList(
    document.getElementById('todo-list'),
    this.todoManager,
    () => this.render()
  )
}
```

</details>

---

## 教程总结

恭喜你完成了整个 JavaScript 核心教程的学习！让我们回顾一下学到的内容：

### 基础篇
1. **变量与数据类型**：let、const、var，基本类型和引用类型
2. **运算符**：算术、比较、逻辑、空值合并、可选链
3. **条件语句**：if-else、switch、三元运算符
4. **循环**：for、while、for...of、数组方法

### 进阶篇
5. **函数**：声明、表达式、箭头函数、闭包、this
6. **数组**：map、filter、reduce、解构、展开运算符
7. **对象**：this、解构、getter/setter、深拷贝
8. **DOM 操作**：选择元素、修改内容、创建节点
9. **事件处理**：addEventListener、事件冒泡、事件委托

### 实战篇
10. **异步编程**：回调、Promise、async/await
11. **Fetch API**：GET/POST 请求、错误处理、中断请求
12. **模块化开发**：export/import、模块加载、项目组织
13. **本地存储**：localStorage、sessionStorage、IndexedDB
14. **错误处理**：try-catch、自定义错误、调试技巧
15. **性能优化**：DOM 优化、内存管理、懒加载
16. **综合实战**：待办事项应用、天气应用

### 下一步学习建议

1. **学习框架**：Vue、React、Angular 等现代前端框架
2. **学习构建工具**：Webpack、Vite、Rollup
3. **学习 TypeScript**：JavaScript 的超集，提供类型安全
4. **学习 Node.js**：在服务端运行 JavaScript
5. **参与开源项目**：实践中提升技能

继续加油！编程之路，永无止境。
