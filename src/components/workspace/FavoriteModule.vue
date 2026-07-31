<script setup lang="ts">
/**
 * 收藏夹模块组件
 * 支持添加网址收藏、分类管理、点击跳转、编辑删除
 */
import { ref, computed, watch } from 'vue'
import { useFavorites } from '../../composables/useFavorites'
import { favoriteCategories } from '../../data/workspace-defaults'
import WsIcon from './WsIcon.vue'
import Modal from './Modal.vue'
import type { Favorite } from '../../types/workspace'

const {
  favorites,
  categories,
  addFavorite,
  deleteFavorite,
  updateFavorite,
  addCategory,
  deleteCategory,
  openUrl,
} = useFavorites()

const ALL_CATEGORY = '全部'
const UNCATEGORIZED = '未分类'

const activeCategory = ref(ALL_CATEGORY)
const searchKeyword = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingFavorite = ref<Favorite | null>(null)

const newTitle = ref('')
const newUrl = ref('')
const newCategory = ref(favoriteCategories[0]?.name ?? UNCATEGORIZED)
const newCustomCategory = ref('')
const useCustomCategory = ref(false)

const categoryOptions = computed(() => {
  const base = favoriteCategories.map((c) => c.name)
  const custom = categories.value.filter((c) => !base.includes(c))
  return Array.from(new Set([...base, ...custom, UNCATEGORIZED]))
})

const filteredFavorites = computed(() => {
  let result = favorites.value
  if (activeCategory.value !== ALL_CATEGORY) {
    result = result.filter((f) => f.category === activeCategory.value)
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(keyword) ||
        f.url.toLowerCase().includes(keyword) ||
        f.category.toLowerCase().includes(keyword),
    )
  }
  return result.sort((a, b) => b.createdAt - a.createdAt)
})

const groupedFavorites = computed(() => {
  const map = new Map<string, Favorite[]>()
  filteredFavorites.value.forEach((f) => {
    const list = map.get(f.category) || []
    list.push(f)
    map.set(f.category, list)
  })
  return map
})

const displayCategories = computed(() => {
  const order = categoryOptions.value
  return Array.from(groupedFavorites.value.keys()).sort((a, b) => {
    const idxA = order.indexOf(a)
    const idxB = order.indexOf(b)
    if (idxA === -1 && idxB === -1) return a.localeCompare(b)
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })
})

function resetAddForm() {
  newTitle.value = ''
  newUrl.value = ''
  newCategory.value = favoriteCategories[0]?.name ?? UNCATEGORIZED
  newCustomCategory.value = ''
  useCustomCategory.value = false
}

function closeAddModal() {
  showAddModal.value = false
  resetAddForm()
}

function closeEditModal() {
  showEditModal.value = false
  editingFavorite.value = null
}

function resolveNewCategory(): string {
  if (useCustomCategory.value && newCustomCategory.value.trim()) {
    return newCustomCategory.value.trim()
  }
  return newCategory.value
}

function handleAdd() {
  const url = newUrl.value.trim()
  if (!url) return
  const title = newTitle.value.trim() || url
  addFavorite(title, url, resolveNewCategory())
  resetAddForm()
  showAddModal.value = false
}

function openEdit(favorite: Favorite) {
  editingFavorite.value = { ...favorite }
  const isCustom =
    favorite.category &&
    !categoryOptions.value.includes(favorite.category) &&
    favorite.category !== UNCATEGORIZED
  useCustomCategory.value = !!isCustom
  newCustomCategory.value = isCustom ? favorite.category : ''
  newCategory.value = isCustom
    ? (favoriteCategories[0]?.name ?? UNCATEGORIZED)
    : categoryOptions.value.includes(favorite.category)
      ? favorite.category
      : (favoriteCategories[0]?.name ?? UNCATEGORIZED)
  showEditModal.value = true
}

function handleEdit() {
  if (!editingFavorite.value) return
  const url = editingFavorite.value.url.trim()
  if (!url) return
  const title = editingFavorite.value.title.trim() || url
  const category =
    useCustomCategory.value && newCustomCategory.value.trim()
      ? newCustomCategory.value.trim()
      : newCategory.value
  updateFavorite(editingFavorite.value.id, {
    title,
    url,
    category,
  })
  showEditModal.value = false
  editingFavorite.value = null
}

function handleDelete(id: number) {
  if (confirm('确定要删除这个收藏吗？')) {
    deleteFavorite(id)
  }
}

function handleDeleteCategory(category: string) {
  if (category === UNCATEGORIZED) return
  if (confirm(`确定要删除分类「${category}」吗？该分类下的收藏将移至「未分类」。`)) {
    deleteCategory(category)
    if (activeCategory.value === category) {
      activeCategory.value = ALL_CATEGORY
    }
  }
}

function getCategoryColor(category: string): string {
  const found = favoriteCategories.find((c) => c.name === category)
  return found?.color || 'var(--accent)'
}

watch(activeCategory, () => {
  searchKeyword.value = ''
})
</script>

<template>
  <div class="favorite-module">
    <!-- 统计与工具栏 -->
    <div class="favorite-toolbar">
      <div class="favorite-stats">
        <span class="stat-item">
          <span class="stat-value">{{ favorites.length }}</span>
          <span class="stat-label">收藏</span>
        </span>
        <span class="stat-item">
          <span class="stat-value">{{ categories.length }}</span>
          <span class="stat-label">分类</span>
        </span>
      </div>
      <div class="favorite-search">
        <WsIcon name="search" :size="14" />
        <input v-model="searchKeyword" type="text" placeholder="搜索收藏..." class="search-input" />
      </div>
      <button class="add-favorite-btn" @click="showAddModal = true">
        <WsIcon name="plus" :size="14" />
        添加收藏
      </button>
    </div>

    <!-- 分类筛选 -->
    <div class="category-tabs" v-if="categories.length > 0 || favorites.length > 0">
      <button
        class="category-tab"
        :class="{ active: activeCategory === ALL_CATEGORY }"
        @click="activeCategory = ALL_CATEGORY"
      >
        全部
      </button>
      <button
        v-for="cat in categoryOptions"
        :key="cat"
        class="category-tab"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- 收藏列表 -->
    <div class="favorite-list">
      <template v-if="filteredFavorites.length === 0">
        <div class="empty-state">
          <WsIcon name="bookmark" :size="48" />
          <span>暂无收藏，点击右上角添加</span>
        </div>
      </template>

      <template v-for="category in displayCategories" :key="category">
        <div class="favorite-group">
          <div class="group-header">
            <span class="group-dot" :style="{ background: getCategoryColor(category) }"></span>
            <span class="group-title">{{ category }}</span>
            <span class="group-count">{{ groupedFavorites.get(category)?.length }}</span>
            <button
              v-if="category !== UNCATEGORIZED"
              class="group-delete"
              @click="handleDeleteCategory(category)"
              title="删除分类"
            >
              <WsIcon name="x" :size="12" />
            </button>
          </div>
          <div class="group-items">
            <div
              v-for="item in groupedFavorites.get(category)"
              :key="item.id"
              class="favorite-card"
              @click="openUrl(item.url)"
            >
              <div class="card-header">
                <div class="card-icon" :style="{ background: getCategoryColor(category) + '20', color: getCategoryColor(category) }">
                  <WsIcon name="bookmark" :size="14" />
                </div>
                <div class="card-actions">
                  <button class="card-action-btn" @click.stop="openEdit(item)" title="编辑">
                    <WsIcon name="edit" :size="12" />
                  </button>
                  <button class="card-action-btn danger" @click.stop="handleDelete(item.id)" title="删除">
                    <WsIcon name="trash" :size="12" />
                  </button>
                </div>
              </div>
              <div class="card-title">{{ item.title }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 添加弹窗 -->
    <Modal
      title="添加收藏"
      :visible="showAddModal"
      confirm-text="添加"
      cancel-text="取消"
      :confirm-disabled="!newUrl.trim()"
      @close="closeAddModal"
      @confirm="handleAdd"
    >
      <div class="modal-form">
        <div class="form-group">
          <label>名称</label>
          <input
            v-model="newTitle"
            type="text"
            placeholder="例如：Vue 官方文档"
            class="detail-input"
          />
        </div>
        <div class="form-group">
          <label>网址</label>
          <input
            v-model="newUrl"
            type="text"
            placeholder="https://vuejs.org"
            class="detail-input"
          />
        </div>
        <div class="form-group">
          <label>分类</label>
          <div class="category-mode">
            <label class="radio-label">
              <input v-model="useCustomCategory" type="radio" :value="false" />
              选择分类
            </label>
            <label class="radio-label">
              <input v-model="useCustomCategory" type="radio" :value="true" />
              新建分类
            </label>
          </div>
          <select v-if="!useCustomCategory" v-model="newCategory" class="detail-input">
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <input
            v-else
            v-model="newCustomCategory"
            type="text"
            placeholder="输入新分类名称"
            class="detail-input"
          />
        </div>
      </div>
    </Modal>

    <!-- 编辑弹窗 -->
    <Modal
      title="编辑收藏"
      :visible="showEditModal"
      confirm-text="保存"
      cancel-text="取消"
      :confirm-disabled="!editingFavorite?.url.trim()"
      @close="closeEditModal"
      @confirm="handleEdit"
    >
      <div class="modal-form" v-if="editingFavorite">
        <div class="form-group">
          <label>名称</label>
          <input v-model="editingFavorite.title" type="text" class="detail-input" />
        </div>
        <div class="form-group">
          <label>网址</label>
          <input v-model="editingFavorite.url" type="text" class="detail-input" />
        </div>
        <div class="form-group">
          <label>分类</label>
          <div class="category-mode">
            <label class="radio-label">
              <input v-model="useCustomCategory" type="radio" :value="false" />
              选择分类
            </label>
            <label class="radio-label">
              <input v-model="useCustomCategory" type="radio" :value="true" />
              新建分类
            </label>
          </div>
          <select v-if="!useCustomCategory" v-model="newCategory" class="detail-input">
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <input
            v-else
            v-model="newCustomCategory"
            type="text"
            placeholder="输入新分类名称"
            class="detail-input"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.favorite-module {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.favorite-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.favorite-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.stat-value {
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  color: var(--text-secondary);
}

.favorite-search {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0 0.65rem;
  color: var(--text-secondary);
}

.favorite-search input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.55rem 0;
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
}

.add-favorite-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-favorite-btn:hover {
  background: var(--accent-hover);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-tab {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-tab:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.category-tab.active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

.favorite-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.favorite-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  padding: 0 0.1rem;
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.group-title {
  margin-left: 0.2rem;
}

.group-count {
  margin-left: 0.2rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
}

.group-delete {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.favorite-group:hover .group-delete {
  opacity: 1;
}

.group-delete:hover {
  background: var(--bg-secondary);
  color: #ef4444;
}

.group-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.favorite-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.6rem 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.favorite-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.favorite-card:hover .card-actions {
  opacity: 1;
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.card-action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-input {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.detail-input:focus {
  border-color: var(--accent);
}

.category-mode {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
}

@media (max-width: 768px) {
  .favorite-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .group-items {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .card-actions {
    opacity: 1;
  }
}
</style>
