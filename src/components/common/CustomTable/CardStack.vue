<template>
  <div class="card-stack-container pb-3">
    <!-- Estado vacío -->
    <div
      v-if="data.length === 0 && !isTableLoading"
      class="text-center py-5 bg-white rounded-3 shadow-sm border"
    >
      <div
        class="d-flex flex-column align-items-center justify-content-center text-muted"
        style="min-height: 250px"
      >
        <i class="bi bi-inbox text-secondary opacity-50 mb-3" style="font-size: 3rem"></i>
        <h5 class="fw-semibold text-secondary mb-1">No hay datos para mostrar</h5>
        <p class="mb-0 small opacity-75">Intenta ajustar tu búsqueda o agregar nuevos registros.</p>
      </div>
    </div>

    <!-- Lista de tarjetas -->
    <div v-else class="horizontal-scroll-container">
      <div
        v-for="item in data"
        :key="item.id"
        class="card custom-mobile-card border-0 shadow-sm"
        @click="$emit('row-click', item)"
      >
        <div class="card-body p-0 custom-scrollbar-wrapper d-flex flex-column h-100">
          <div class="flex-grow-1 overflow-auto custom-scrollbar p-0 m-0">
            <div
              v-for="header in headers"
              :key="header.key"
              class="d-flex justify-content-between align-items-center border-bottom p-3 text-start"
            >
              <span class="fw-bold text-secondary small w-50 flex-shrink-0 pe-2">{{
                header.label
              }}</span>
              <div class="text-break w-50 d-flex justify-content-end align-items-center">
                <slot
                  :name="`cell(${header.key})`"
                  :item="item"
                  :value="getNestedValue(item, header.key)"
                >
                  <span class="d-block w-100 text-end">{{ getNestedValue(item, header.key) }}</span>
                </slot>
              </div>
            </div>
          </div>

          <!-- Columna de acciones -->
          <div
            v-if="hasActions && getActionsForItem(item).length > 0"
            class="d-flex justify-content-between align-items-center p-3 bg-light mt-auto"
          >
            <span class="fw-bold text-secondary small">Acciones</span>
            <div class="d-flex justify-content-end gap-2 flex-grow-1">
              <button
                v-for="action in getActionsForItem(item)"
                :key="`action-${action.name}-${item.id}`"
                :class="action.class"
                @click.stop="$emit('action-click', { actionName: action.name, item })"
                :title="action.tooltip"
              >
                <i :class="action.icon"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Header {
  key: string
  label: string
}

interface Action {
  name: string
  icon: string
  class: string
  tooltip?: string
}

interface EntityItem {
  id: string | number
  [key: string]: any
}

defineProps<{
  data: EntityItem[]
  headers: Header[]
  hasActions: boolean
  isTableLoading: boolean
  getActionsForItem: (item: EntityItem) => Action[]
  getNestedValue: (obj: any, key: string) => any
}>()

defineEmits<{
  (e: 'row-click', item: EntityItem): void
  (e: 'action-click', payload: { actionName: string; item: EntityItem }): void
}>()
</script>

<style scoped>
.horizontal-scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  gap: 1rem;
  padding-bottom: 0.5rem;
  width: 100%;
}
.horizontal-scroll-container::-webkit-scrollbar {
  height: 6px;
}
.horizontal-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(134, 134, 134, 0.4);
  border-radius: 3px;
}

.custom-mobile-card {
  flex: 0 0 100%;
  width: 100%;
  min-width: 100%;
  scroll-snap-align: start;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  cursor: pointer;
  border-radius: 0.75rem;
  overflow: hidden;
  height: 65vh; /* Responsive height */
  min-height: 400px;
}

.custom-mobile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
}

/* Scroll para los items dentro de la card (headers y props) */
.custom-scrollbar-wrapper {
  overflow: hidden;
}

.custom-scrollbar {
  overflow-y: auto;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(134, 134, 134, 0.2);
  border-radius: 2px;
}

.custom-mobile-card .card-body > .custom-scrollbar > div:last-child {
  border-bottom: none !important;
}
</style>
