<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { EMOJI_CATEGORIES } from '@/const/emojis'

const emit = defineEmits(['select'])

const searchQuery = ref('')
const activeCategory = ref('smileys')
const recentEmojis = ref<string[]>(JSON.parse(localStorage.getItem('recent-emojis') || '[]'))

const searchInputRef = ref<HTMLInputElement | null>(null)
const scrollContainerRef = ref<HTMLElement | null>(null)

// Compute all categories including the dynamic "Recientes" category
const categoriesWithRecent = computed(() => {
  const list = []
  if (recentEmojis.value.length > 0) {
    list.push({
      id: 'frequent',
      name: 'Frecuentes',
      icon: 'bi-clock-history',
      emojis: recentEmojis.value.map(char => ({
        char,
        name: 'frecuente',
        tags: []
      }))
    })
  }
  return [...list, ...EMOJI_CATEGORIES]
})

// Filter emojis based on the search query
const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return categoriesWithRecent.value

  return categoriesWithRecent.value
    .map(category => {
      // Don't search inside recent to avoid double showing search results
      if (category.id === 'frequent') return { ...category, emojis: [] }

      const filteredEmojis = category.emojis.filter(emoji => {
        return (
          emoji.name.toLowerCase().includes(query) ||
          emoji.tags.some(tag => tag.toLowerCase().includes(query))
        )
      })
      return { ...category, emojis: filteredEmojis }
    })
    .filter(category => category.emojis.length > 0)
})

// Save recently clicked emoji
const saveFrequentEmoji = (emojiChar: string) => {
  let list = [...recentEmojis.value]
  list = list.filter(item => item !== emojiChar)
  list.unshift(emojiChar)
  if (list.length > 24) {
    list = list.slice(0, 24)
  }
  recentEmojis.value = list
  localStorage.setItem('recent-emojis', JSON.stringify(list))
}

const selectEmoji = (emojiChar: string) => {
  saveFrequentEmoji(emojiChar)
  emit('select', emojiChar)
}

// Scroll to selected category
const selectCategory = (catId: string) => {
  activeCategory.value = catId
  const container = scrollContainerRef.value
  if (!container) return

  const section = container.querySelector(`.category-section[data-id="${catId}"]`) as HTMLElement
  if (section) {
    container.scrollTo({
      top: section.offsetTop - 6,
      behavior: 'smooth'
    })
  }
}

// Track active category on scroll
const handleScroll = () => {
  const container = scrollContainerRef.value
  if (!container) return

  const sections = container.querySelectorAll('.category-section')
  const containerTop = container.getBoundingClientRect().top
  let currentActive = activeCategory.value

  sections.forEach((section: any) => {
    const rect = section.getBoundingClientRect()
    if (rect.top - containerTop <= 15) {
      currentActive = section.dataset.id
    }
  })

  activeCategory.value = currentActive
}

onMounted(() => {
  activeCategory.value = recentEmojis.value.length > 0 ? 'frequent' : 'smileys'
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, 120)
})
</script>

<template>
  <div class="mac-emoji-picker" @mousedown.prevent>
    <!-- Search Bar -->
    <div class="picker-search-container">
      <i class="bi bi-search search-icon"></i>
      <input
        type="text"
        v-model="searchQuery"
        class="picker-search-input"
        placeholder="Buscar emoji..."
        ref="searchInputRef"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="clear-search-btn"
        @click="searchQuery = ''"
      >
        <i class="bi bi-x-circle-fill"></i>
      </button>
    </div>

    <!-- Emojis Container -->
    <div
      class="picker-scroll-container"
      ref="scrollContainerRef"
      @scroll="handleScroll"
    >
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="category-section"
        :data-id="category.id"
      >
        <div class="category-header">{{ category.name }}</div>
        <div class="emoji-grid">
          <button
            v-for="emoji in category.emojis"
            :key="emoji.char"
            type="button"
            class="emoji-btn"
            :title="emoji.name"
            @click="selectEmoji(emoji.char)"
          >
            {{ emoji.char }}
          </button>
        </div>
      </div>

      <div v-if="filteredCategories.length === 0" class="no-results">
        <i class="bi bi-emoji-frown"></i>
        <span>No se encontraron emojis</span>
      </div>
    </div>

    <!-- Category Selector (Tabs) -->
    <div class="picker-footer-tabs">
      <button
        v-for="category in categoriesWithRecent"
        :key="category.id"
        type="button"
        class="tab-btn"
        :class="{ active: activeCategory === category.id }"
        :title="category.name"
        @click="selectCategory(category.id)"
      >
        <i :class="['bi', category.icon]"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* macOS-like Emoji Picker Popover */
.mac-emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px); /* Float above the input */
  right: 0;
  width: 324px;
  height: 380px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 16px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 1050;
  overflow: hidden;
  user-select: none;
}

/* Search Container */
.picker-search-container {
  display: flex;
  align-items: center;
  padding: 10px 12px 6px 12px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 22px;
  color: #9ca3af;
  font-size: 0.875rem;
  pointer-events: none;
}

.picker-search-input {
  width: 100%;
  height: 28px;
  padding: 4px 28px 4px 28px;
  border-radius: 7px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  font-size: 0.85rem;
  color: #1f2937;
  outline: none;
  transition: background-color 0.15s;
}

.picker-search-input:focus {
  background: rgba(0, 0, 0, 0.07);
}

.clear-search-btn {
  position: absolute;
  right: 20px;
  background: none;
  border: none;
  color: #9ca3af;
  padding: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.clear-search-btn:hover {
  color: #6b7280;
}

/* Scrollable area */
.picker-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px;
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

.picker-scroll-container::-webkit-scrollbar {
  width: 6px;
}
.picker-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.picker-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
.picker-scroll-container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
}

/* Category Sections */
.category-section {
  margin-bottom: 12px;
}

.category-header {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 2px;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  z-index: 2;
  margin-bottom: 6px;
}

/* Emoji Grid */
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 1.45rem;
  aspect-ratio: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  cursor: pointer;
  transition: transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
}

.emoji-btn:hover {
  background-color: rgba(0, 0, 0, 0.07);
  transform: scale(1.15);
}

.emoji-btn:active {
  transform: scale(0.95);
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 10px;
  color: #9ca3af;
  gap: 8px;
}

.no-results i {
  font-size: 2rem;
}

.no-results span {
  font-size: 0.875rem;
}

/* Footer Tabs */
.picker-footer-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.tab-btn {
  background: none;
  border: none;
  color: #6b7280;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  transition: background-color 0.2s, color 0.2s;
  flex: 1;
}

.tab-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #111827;
}

.tab-btn.active {
  color: #3b82f6; /* Matching focus primary blue */
  background-color: rgba(59, 130, 246, 0.08);
}
</style>
