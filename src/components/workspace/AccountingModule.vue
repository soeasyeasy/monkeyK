<script setup lang="ts">
/**
 * 记账模块组件
 * 支持 7 天柱状图、预算高亮、快捷金额、搜索筛选
 */
import { ref, computed, watch } from 'vue'
import { useAccounting } from '../../composables/useAccounting'
import { expenseCategories } from '../../data/workspace-defaults'
import WsIcon from './WsIcon.vue'
import Modal from './Modal.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import Pagination from './Pagination.vue'

const {
  expenses,
  budget,
  addExpense,
  deleteExpense,
  updateBudget,
  getCurrentMonthTotal,
  getCurrentMonthByCategory,
  getBudgetProgress,
  getRecentDailyTotal,
  getMonthComparison,
  getOverBudgetCategories,
  searchExpenses,
  getCategoryBudgetProgress,
  getMonthDailyTotal,
  getYearlyMonthlyTotal
} = useAccounting()

const showAddModal = ref(false)
const newAmount = ref<number>(0)
const newCategory = ref('food')
const newDescription = ref('')
const newDate = ref(new Date().toISOString().slice(0, 10))

const showBudgetForm = ref(false)
const newMonthlyBudget = ref<number>(budget.value.monthly)

const searchKeyword = ref('')
const categoryFilter = ref('')

const quickAmounts = [10, 20, 50, 100]

const canAddExpense = computed(() => newAmount.value > 0)

function openAddModal() {
  showAddModal.value = true
}

function handleAddExpense() {
  if (!canAddExpense.value) return
  addExpense(
    newAmount.value,
    newCategory.value,
    newDescription.value.trim(),
    newDate.value
  )
  resetForm()
  showAddModal.value = false
}

function resetForm() {
  newAmount.value = 0
  newCategory.value = 'food'
  newDescription.value = ''
  newDate.value = new Date().toISOString().slice(0, 10)
}

function quickAdd(amount: number) {
  newAmount.value = amount
  addExpense(amount, newCategory.value, '', new Date().toISOString().slice(0, 10))
}

function handleUpdateBudget() {
  updateBudget(newMonthlyBudget.value)
  showBudgetForm.value = false
}

function getCategoryColor(categoryId: string): string {
  return expenseCategories.find(c => c.id === categoryId)?.color || '#6b7280'
}

function getCategoryName(categoryId: string): string {
  return expenseCategories.find(c => c.id === categoryId)?.name || categoryId
}

const monthTotal = computed(() => getCurrentMonthTotal())
const monthByCategory = computed(() => getCurrentMonthByCategory())
const budgetProgress = computed(() => getBudgetProgress())
const recentDaily = computed(() => getRecentDailyTotal(7))
const monthComparison = computed(() => getMonthComparison())
const overBudgetCategories = computed(() => getOverBudgetCategories())

// 统计周期选择
type ChartPeriod = 'week' | 'month' | 'year'
const chartPeriod = ref<ChartPeriod>('week')

const now = new Date()
const chartYear = ref(now.getFullYear())
const chartMonth = ref(now.getMonth() + 1)

const chartData = computed(() => {
  if (chartPeriod.value === 'week') {
    return recentDaily.value.map(d => ({
      label: formatDay(d.date),
      amount: d.amount
    }))
  } else if (chartPeriod.value === 'month') {
    const data = getMonthDailyTotal(chartYear.value, chartMonth.value)
    return data.map(d => ({
      label: new Date(d.date).getDate().toString(),
      amount: d.amount
    }))
  } else {
    const data = getYearlyMonthlyTotal(chartYear.value)
    return data.map(d => ({
      label: d.label,
      amount: d.amount
    }))
  }
})

const chartTitle = computed(() => {
  if (chartPeriod.value === 'week') return '最近 7 天支出'
  if (chartPeriod.value === 'month') return `${chartYear.value}年${chartMonth.value}月 每日支出`
  return `${chartYear.value}年 月度支出`
})

const filteredExpenses = computed(() => searchExpenses(searchKeyword.value, categoryFilter.value))

// 分页
const PAGE_SIZE = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(filteredExpenses.value.length / PAGE_SIZE))
const pagedExpenses = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredExpenses.value.slice(start, start + PAGE_SIZE)
})
watch([searchKeyword, categoryFilter], () => { currentPage.value = 1 })

const chartMax = computed(() => {
  const max = Math.max(...chartData.value.map(d => d.amount), 1)
  return max
})

const currentMonth = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

function formatDay(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<template>
  <div class="accounting-module">
    <div class="accounting-header">
      <span class="current-month">{{ currentMonth }}</span>
      <div class="header-actions">
        <button @click="showBudgetForm = !showBudgetForm" class="budget-btn">
          预算设置
        </button>
        <button @click="openAddModal" class="add-expense-btn">
          <WsIcon name="plus" :size="16" />
          记一笔
        </button>
      </div>
    </div>

    <div v-if="showBudgetForm" class="budget-form">
      <label class="budget-label">
        月度预算 (¥)
        <input
          v-model.number="newMonthlyBudget"
          type="number"
          min="0"
          step="100"
          class="budget-input"
          placeholder="0"
        />
      </label>
      <div class="form-actions">
        <button @click="handleUpdateBudget" class="confirm-btn">保存</button>
        <button @click="showBudgetForm = false" class="cancel-btn">取消</button>
      </div>
    </div>

    <div class="month-summary">
      <div class="summary-item">
        <span class="summary-label">本月支出</span>
        <span class="summary-value">¥{{ monthTotal.toLocaleString() }}</span>
        <span class="comparison" :class="{ up: monthComparison.diff > 0, down: monthComparison.diff < 0 }">
          较上月 {{ monthComparison.diff > 0 ? '+' : '' }}{{ monthComparison.diff.toLocaleString() }}
          ({{ monthComparison.diff > 0 ? '+' : '' }}{{ monthComparison.percentage }}%)
        </span>
      </div>
      <div class="summary-item" v-if="budgetProgress.budget > 0">
        <span class="summary-label">预算进度</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: budgetProgress.percentage + '%' }"
            :class="{ over: budgetProgress.percentage >= 100 }"
          ></div>
        </div>
        <span class="progress-text">
          ¥{{ budgetProgress.spent.toLocaleString() }} / ¥{{ budgetProgress.budget.toLocaleString() }}
        </span>
      </div>
    </div>

    <!-- 支出柱状图 -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title">{{ chartTitle }}</div>
        <div class="period-tabs">
          <button
            v-for="p in (['week', 'month', 'year'] as ChartPeriod[])"
            :key="p"
            class="period-tab"
            :class="{ active: chartPeriod === p }"
            @click="chartPeriod = p"
          >{{ p === 'week' ? '周' : p === 'month' ? '月' : '年' }}</button>
        </div>
      </div>
      <div class="mini-chart" :class="{ 'month-chart': chartPeriod === 'month' }">
        <div v-for="(item, idx) in chartData" :key="idx" class="chart-col">
          <div class="chart-bar-wrap">
            <div
              class="chart-bar"
              :style="{ height: `${(item.amount / chartMax) * 100}%` }"
            ></div>
          </div>
          <span class="chart-day" :class="{ 'hide-odd': chartPeriod === 'month' }">{{ item.label }}</span>
          <span class="chart-amount" v-if="item.amount > 0">¥{{ item.amount }}</span>
        </div>
      </div>
    </div>

    <!-- 超预算提示 -->
    <div v-if="overBudgetCategories.length > 0" class="over-budget-alert">
      <div class="alert-title">
        <WsIcon name="alert" :size="16" />
        超预算分类
      </div>
      <div v-for="item in overBudgetCategories" :key="item.category" class="alert-item">
        <span class="alert-name">{{ getCategoryName(item.category) }}</span>
        <span class="alert-amount">¥{{ item.spent.toLocaleString() }} / ¥{{ item.budget.toLocaleString() }}</span>
      </div>
    </div>

    <Modal
      title="记一笔支出"
      :visible="showAddModal"
      :confirm-disabled="!canAddExpense"
      @close="showAddModal = false; resetForm()"
      @confirm="handleAddExpense"
    >
      <div class="modal-form">
        <div class="form-group">
          <label>快捷金额</label>
          <div class="quick-amounts">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              class="quick-amount-btn"
              :class="{ active: newAmount === amount }"
              @click="newAmount = amount"
            >¥{{ amount }}</button>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>金额</label>
            <input
              v-model.number="newAmount"
              type="number"
              min="0"
              step="0.01"
              class="form-input"
              placeholder="0.00"
              @keyup.enter="handleAddExpense"
              autofocus
            />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="newCategory" class="form-select">
              <option v-for="cat in expenseCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>描述</label>
          <MarkdownEditor v-model="newDescription" placeholder="记录支出详情，支持 Markdown..." :rows="3" />
        </div>
        <div class="form-group">
          <label>日期</label>
          <input v-model="newDate" type="date" class="form-input" />
        </div>
      </div>
    </Modal>

    <div class="category-stats" v-if="Object.keys(monthByCategory).length > 0">
      <div class="stats-title">分类统计</div>
      <div class="category-list">
        <div
          v-for="(amount, categoryId) in monthByCategory"
          :key="categoryId"
          class="category-item"
          :class="{ over: getCategoryBudgetProgress(categoryId as string).percentage >= 100 }"
        >
          <span class="category-dot" :style="{ background: getCategoryColor(categoryId as string) }"></span>
          <span class="category-name">{{ getCategoryName(categoryId as string) }}</span>
          <div class="category-progress" v-if="getCategoryBudgetProgress(categoryId as string).budget > 0">
            <div
              class="category-progress-fill"
              :style="{ width: Math.min(getCategoryBudgetProgress(categoryId as string).percentage, 100) + '%' }"
              :class="{ over: getCategoryBudgetProgress(categoryId as string).percentage >= 100 }"
            ></div>
          </div>
          <span class="category-amount">¥{{ (amount as number).toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <div class="expense-list">
      <div class="list-header">
        <span class="list-title">最近记录</span>
        <div class="list-filters">
          <select v-model="categoryFilter" class="filter-select">
            <option value="">全部分类</option>
            <option v-for="cat in expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <div class="search-box">
            <WsIcon name="search" :size="14" />
            <input v-model="searchKeyword" type="text" placeholder="搜索描述..." class="search-input" />
          </div>
        </div>
      </div>
      <div
        v-for="expense in pagedExpenses"
        :key="expense.id"
        class="expense-item"
      >
        <div class="expense-icon" :style="{ background: getCategoryColor(expense.category) + '15', color: getCategoryColor(expense.category) }">
          <WsIcon name="wallet" :size="18" />
        </div>
        <div class="expense-info">
          <div class="expense-category">{{ getCategoryName(expense.category) }}</div>
          <div class="expense-desc" v-if="expense.description">{{ expense.description }}</div>
          <div class="expense-date">{{ expense.date }}</div>
        </div>
        <div class="expense-amount">¥{{ expense.amount.toFixed(2) }}</div>
        <button @click="deleteExpense(expense.id)" class="delete-btn" title="删除">
          <WsIcon name="trash" :size="16" />
        </button>
      </div>
      <div v-if="filteredExpenses.length === 0" class="empty-state">
        <WsIcon name="wallet" :size="48" />
        <span>暂无记账记录</span>
      </div>
      <Pagination
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :total="filteredExpenses.length"
      />
    </div>
  </div>
</template>

<style scoped>
.accounting-module {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.accounting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-month {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.budget-btn,
.add-expense-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.budget-btn:hover {
  background: var(--bg-card-hover);
}

.add-expense-btn {
  background: var(--accent);
  color: white;
  border: none;
}

.add-expense-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.budget-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.budget-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.budget-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.budget-input:focus {
  outline: none;
  border-color: var(--accent);
}

.month-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.comparison {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.comparison.up { color: #ef4444; }
.comparison.down { color: #22c55e; }

.progress-bar {
  height: 8px;
  background: var(--bg-card-hover);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-fill.over {
  background: #ef4444;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.chart-card {
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.chart-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.period-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.period-tab {
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  font-weight: 500;
}

.period-tab:hover {
  color: var(--text-primary);
}

.period-tab.active {
  background: var(--accent);
  color: white;
}

.mini-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  height: 100px;
}

.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.chart-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.chart-bar {
  width: 16px;
  background: var(--accent);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}

.chart-day {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.chart-amount {
  font-size: 0.65rem;
  color: var(--text-primary);
  font-weight: 600;
}

.mini-chart.month-chart {
  gap: 0.15rem;
}

.mini-chart.month-chart .chart-col {
  min-width: 0;
}

.mini-chart.month-chart .chart-bar {
  width: 8px;
}

.mini-chart.month-chart .chart-day {
  font-size: 0.55rem;
}

.mini-chart.month-chart .chart-amount {
  display: none;
}

.hide-odd {
  visibility: hidden;
}

.hide-odd:nth-child(5n) {
  visibility: visible;
}

.over-budget-alert {
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #ef4444;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.modal-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.quick-amounts {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.quick-amount-btn {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-amount-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.quick-amount-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input,
.form-select,
.filter-select,
.search-input {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.825rem;
}

.form-input:focus,
.form-select:focus,
.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.confirm-btn {
  background: var(--accent);
  color: white;
}

.confirm-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: var(--bg-card);
}

.category-stats {
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.stats-title,
.list-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.category-item.over {
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-primary);
  min-width: 80px;
}

.category-progress {
  width: 80px;
  height: 6px;
  background: var(--bg-card-hover);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.category-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.category-progress-fill.over {
  background: #ef4444;
}

.category-amount {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent);
}

.expense-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.list-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-secondary);
}

.search-input {
  border: none;
  background: transparent;
  padding: 0;
  width: 120px;
}

.expense-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.expense-item:hover {
  background: var(--bg-card-hover);
}

.expense-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border-radius: var(--radius-md);
}

.expense-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.expense-category {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.expense-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.expense-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.expense-amount {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent);
}

.delete-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .month-summary {
    grid-template-columns: 1fr;
  }
}
</style>
