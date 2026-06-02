<script setup lang="ts">
import { computed } from 'vue'

interface Action {
  name: string
  icon: string
  class: string
  tooltip?: string
}

const props = defineProps<{
  item: any
  titleKey?: string
  descriptionKey?: string
  startDateKey?: string
  finishDateKey?: string
  statusKey?: string
  actions?: Action[]
  imagePlaceholder?: string
  centeredContent?: boolean
}>()

const emit = defineEmits<{
  (e: 'action-click', payload: { actionName: string; item: any }): void
  (e: 'card-click', item: any): void
}>()

const getNestedValue = (obj: any, key: string): any => {
  if (!key) return null
  return key.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const title = computed(() => {
  return (
    getNestedValue(props.item, props.titleKey || 'name') ||
    getNestedValue(props.item, 'title') ||
    getNestedValue(props.item, 'label')
  )
})

const description = computed(() => {
  return (
    getNestedValue(props.item, props.descriptionKey || 'description') ||
    getNestedValue(props.item, 'desc') ||
    getNestedValue(props.item, 'body_only_text')
  )
})

const imageUrl = computed(() => {
  return getNestedValue(props.item, 'url_image')
})

const startDate = computed(() => {
  return (
    getNestedValue(props.item, props.startDateKey || 'start_date') ||
    getNestedValue(props.item, 'startDate') ||
    getNestedValue(props.item, 'fecha_inicio')
  )
})

const finishDate = computed(() => {
  return (
    getNestedValue(props.item, props.finishDateKey || 'finish_date') ||
    getNestedValue(props.item, 'finishDate') ||
    getNestedValue(props.item, 'finish_at') ||
    getNestedValue(props.item, 'fecha_fin')
  )
})

const status = computed(() => {
  const val = getNestedValue(props.item, props.statusKey || 'active')
  if (val === undefined) return getNestedValue(props.item, 'status')
  return val
})




const statusLabel = computed(() => {
  if (status.value === 1 || status.value === true) return 'ACTIVO'
  // Simplified for now, can be extended if needed
  return 'INACTIVO'
})

const statusClass = computed(() => {
  if (status.value === 1 || status.value === true) return 'text-success'
  return 'text-muted'
})
</script>

<template>
  <div
    class="custom-card card h-100 border-0 shadow-sm rounded-4 overflow-hidden"
    @click="$emit('card-click', item)"
  >
    <div
      :class="[
        'card-body p-4 d-flex flex-column',
        { 'align-items-center text-center justify-content-center': centeredContent },
      ]"
    >
      <div
        :class="[
          'd-flex align-items-start mb-3 w-100',
          { 'justify-content-center': centeredContent },
          { 'justify-content-between': !centeredContent },
        ]"
      >
        <!-- Coupon/Image Side -->
        <div
          class="coupon-badge-container d-flex align-items-center justify-content-center bg-primary rounded-4 text-white shadow-sm"
          :style="{
            width: centeredContent ? '140px' : '80px',
            height: centeredContent ? '140px' : '80px',
          }"
        >
          <template v-if="imageUrl">
            <img :src="imageUrl" class="w-100 h-100 object-fit-cover rounded-4" alt="Coupon" />
          </template>
          <template v-else>
            <div class="text-center">
              <div class="fw-bold" :style="{ fontSize: centeredContent ? '1.2rem' : '0.8rem' }">
                DCTO
              </div>
              <div :class="['fw-bold mb-0', centeredContent ? 'h1' : 'h4']">30%</div>
              <div class="small" :style="{ fontSize: centeredContent ? '0.9rem' : '0.6rem' }">
                OFF
              </div>
            </div>
          </template>
        </div>

        <!-- Action Button -->
        <div v-if="actions && actions.length > 0 && !centeredContent" class="d-flex gap-2">
          <button
            v-for="action in actions"
            :key="action.name"
            :class="action.class"
            @click.stop="$emit('action-click', { actionName: action.name, item })"
            :data-title="action.tooltip"
            data-tooltip-pos="bottom"
          >
            <i :class="action.icon"></i>
          </button>
        </div>
      </div>

      <!-- Info Area -->
      <div
        :class="[
          'info-container mb-4',
          centeredContent ? 'mt-3' : 'flex-grow-1',
          { 'w-100': centeredContent },
        ]"
      >
        <h5 v-if="centeredContent" class="card-title fw-bold mb-2 h4">{{ title }}</h5>
        <h6 v-else class="card-title fw-bold mb-1 line-clamp-2">{{ title }}</h6>

        <p
          :class="['card-text text-muted mb-0', centeredContent ? 'px-3' : 'small line-clamp-2']"
          v-if="description"
        >
          {{ description }}
        </p>
      </div>

      <!-- Divider -->
      <div v-if="!centeredContent" class="divider border-bottom border-dashed mb-3 w-100"></div>

      <!-- Footer Area -->
      <slot name="footer">
        <div class="d-flex justify-content-between align-items-center mt-auto">
          <div class="date-range small text-muted fw-medium">
           <span v-format-date="startDate"></span> - <span v-format-date="finishDate"></span>
          </div>
          <div :class="['status-badge small fw-bold', statusClass]">
            {{ statusLabel }}
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.custom-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0 !important;
}

.custom-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
}

.border-dashed {
  border-style: dashed !important;
  opacity: 0.3;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.coupon-badge-container {
  flex-shrink: 0;
}
</style>
