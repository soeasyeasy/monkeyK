<script setup lang="ts">
import { ref, computed } from 'vue'

interface Todo {
  id: number
  text: string
  done: boolean
  createdAt: number
}

const STORAGE_KEY = 'todos-data'

function loadTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

const todos = ref<Todo[]>(loadTodos())
const newTodoText = ref('')
const filter = ref<'all' | 'active' | 'done'>('all')

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
  } catch {}
}

function addTodo() {
  const text = newTodoText.value.trim()
  if (!text) return
  todos.value.unshift({
    id: Date.now(),
    text,
    done: false,
    createdAt: Date.now(),
  })
  newTodoText.value = ''
  saveTodos()
}

function toggleTodo(id: number) {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) {
    todo.done = !todo.done
    saveTodos()
  }
}

function deleteTodo(id: number) {
  todos.value = todos.value.filter((t) => t.id !== id)
  saveTodos()
}

function clearDone() {
  todos.value = todos.value.filter((t) => !t.done)
  saveTodos()
}

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'done') return todos.value.filter((t) => t.done)
  return todos.value
})

const stats = computed(() => ({
  total: todos.value.length,
  active: todos.value.filter((t) => !t.done).length,
  done: todos.value.filter((t) => t.done).length,
}))
</script>

<template>
  <div class="todo-page">
    <div class="page-header">
      <div class="header-icon">✅</div>
      <h1>待办事项</h1>
      <p class="subtitle">管理日常任务，提高效率</p>
    </div>

    <div class="todo-container">
      <!-- 统计 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-num">{{ stats.total }}</span>
          <span class="stat-label">总计</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.active }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.done }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>

      <!-- 添加待办 -->
      <form class="add-form" @submit.prevent="addTodo">
        <input v-model="newTodoText" type="text" placeholder="添加新任务..." class="todo-input" />
        <button type="submit" class="add-btn" :disabled="!newTodoText.trim()">添加</button>
      </form>

      <!-- 筛选 -->
      <div class="filter-bar">
        <button
          v-for="f in ['all', 'active', 'done'] as const"
          :key="f"
          class="filter-btn"
          :class="{ active: filter === f }"
          @click="filter = f"
        >
          {{ f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成' }}
        </button>
        <button v-if="stats.done > 0" class="clear-btn" @click="clearDone">清除已完成</button>
      </div>

      <!-- 待办列表 -->
      <div class="todo-list">
        <div v-if="filteredTodos.length === 0" class="empty">
          <p>暂无待办事项</p>
        </div>
        <div
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="todo-item"
          :class="{ done: todo.done }"
        >
          <button class="checkbox" @click="toggleTodo(todo.id)">
            <span v-if="todo.done">✓</span>
          </button>
          <span class="todo-text">{{ todo.text }}</span>
          <button class="delete-btn" @click="deleteTodo(todo.id)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 4rem 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.header-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.todo-container {
  max-width: 640px;
  margin: 0 auto;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-link);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.add-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.todo-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.95rem;
}

.todo-input:focus {
  outline: none;
  border-color: var(--accent);
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-btn {
  padding: 0.4rem 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-card-hover);
}

.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.clear-btn {
  margin-left: auto;
  padding: 0.4rem 0.9rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
}

.clear-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.todo-item:hover {
  background: var(--bg-card-hover);
}

.todo-item.done .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.todo-item.done .checkbox {
  background: var(--accent);
  border-color: var(--accent);
}

.todo-text {
  flex: 1;
  color: var(--text-primary);
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.25rem;
  border-radius: 4px;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
</style>
