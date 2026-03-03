<script setup lang="ts">
// ScrollableTabs.vue - Componente reutilizable de tabs con scroll horizontal y centrado automático
// Props:
// - tabs: Array<{ label: string, path: string }>
// - activeTab: number (índice del tab activo)
// Emits:
// - tab-change: (index: number) => void
// Uso:
// <ScrollableTabs
//   :tabs="tabRoutes"
//   :activeTab="activeTab"
//   @tab-change="selectTab"
// />
import { ref, nextTick, watch, type ComponentPublicInstance } from 'vue'

const props = defineProps<{
  tabs: { label: string; path: string }[]
  activeTab: number
  isLoading?: boolean
  skeletonCount?: number
}>()
const emit = defineEmits<{
  (e: 'tab-change', index: number): void
}>()

const tabRefs = ref<(HTMLElement | null)[]>([])
const tabListRef = ref<HTMLElement | null>(null)

function setTabRef(el: Element | ComponentPublicInstance | null, index: number) {
  tabRefs.value[index] = el instanceof Element ? (el as HTMLElement) : null
}

function scrollToActiveTab() {
  nextTick(() => {
    const activeElement = tabRefs.value[props.activeTab]
    const container = tabListRef.value
    if (!activeElement || !container) return
    const containerRect = container.getBoundingClientRect()
    const activeElementRect = activeElement.getBoundingClientRect()
    const offset =
      activeElementRect.left -
      containerRect.left -
      containerRect.width / 2 +
      activeElementRect.width / 2
    container.scrollBy({ left: offset, behavior: 'smooth' })
  })
}

watch(
  () => props.activeTab,
  () => {
    scrollToActiveTab()
  },
  { immediate: true }
)
</script>

<template>
  <!-- Ejemplo de uso y documentación:
    <ScrollableTabs
      :tabs="tabRoutes"
      :activeTab="activeTab"
      @tab-change="selectTab"
    />
  -->
  <ul
    class="nav nav-tabs mb-3 flex-nowrap overflow-auto"
    role="tablist"
    ref="tabListRef"
    id="tabs-scroll"
    style="white-space: nowrap"
  >
    <!-- Skeleton de carga -->
    <template v-if="isLoading">
      <li
        class="nav-item placeholder-glow"
        v-for="n in skeletonCount || 4"
        :key="'skeleton-' + n"
        style="display: inline-block"
      >
        <span
          class="placeholder rounded-pill bg-secondary d-inline-block mx-3"
          style="width: 190px; height: 36px"
        ></span>
      </li>
    </template>
    <!-- Tabs reales -->
    <template v-else>
      <li
        class="nav-item"
        v-for="(tab, index) in tabs"
        :key="tab.path"
        role="presentation"
        :ref="(el) => setTabRef(el, index)"
        style="display: inline-block"
      >
        <button
          class="nav-link text-opacity-50 fw-normal fs-5"
          :class="activeTab === index ? 'active fw-bold' : 'text-dark'"
          @click="$emit('tab-change', index)"
          type="button"
          role="tab"
        >
          {{ tab.label }}
        </button>
      </li>
    </template>
  </ul>
</template>

<style scoped>
.nav-link {
  color: var(--bs-primary);
  border: none;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
  margin-left: 1rem;
  margin-right: 1rem;
  margin-bottom: 2px;
  font-weight: 400;
}
.nav-link.active {
  color: var(--bs-primary) !important;
  border: none !important;
  padding-bottom: 0;
}
.nav-link.active::after {
  content: '';
  display: block;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  position: relative;
  z-index: 3;
  width: 100%;
  height: 5px;
  background-color: var(--bs-secondary);
  bottom: -2px;
  left: 0;
}

#tabs-scroll {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
</style>
