<script setup lang="ts">
export interface StatisticItem {
  value: string | number
  label: string
  highlighted?: boolean
}

defineProps<{
  items: StatisticItem[]
}>()
</script>

<template>
  <div class="row g-3">
    <div v-for="(item, index) in items" :key="index" class="col-md-3">
      <div
        class="card card-blue text-white text-center rounded-4 py-3 shadow-sm h-100 d-flex justify-content-center"
        :class="item.highlighted ? 'position-relative outline-blue' : 'border-0'"
      >
        <h2 class="fw-bold fs-1 mb-0 italic-numbers">{{ item.value }}</h2>
        <p class="mb-0 fw-medium">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.italic-numbers {
  font-style: italic;
  font-family: 'Arial', sans-serif;
  letter-spacing: -0.5px;
}
.card-blue {
  background-color: #214b98 !important; /* Muted corporate blue matching the image */
}
.outline-blue {
  border: 1px solid #75baff;
  box-shadow:
    0 0 0 4px #214b98,
    0 0 0 6px #75baff;
}
</style>
