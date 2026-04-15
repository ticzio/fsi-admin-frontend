<template>
  <div class="h-100 d-flex flex-column">
    <!-- Encabezado -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="fw-bold mb-0">Estadísticas de Canjes</h5>
    </div>

    <!-- Tarjeta Total de Canjes -->
    <div class="total-card d-flex align-items-center gap-3 p-4 rounded-4 shadow-sm border mb-4">
      <div class="total-icon-container">
        <i class="bi bi-arrow-left-right"></i>
      </div>
      <div>
        <p class="text-muted small mb-0 fw-medium text-uppercase">Total de Canjes</p>
        <h2 class="h1 mb-0 fw-bold total-value">{{ totalExchanges }}</h2>
      </div>
    </div>

    <!-- Desglose por Nivel -->
    <div class="flex-grow-1 overflow-y-auto custom-scrollbar">
      <!-- Lista de niveles -->
      <template>
        <p class="text-secondary small text-uppercase fw-bold mb-3 letter-spacing-1">
          Desglose por Nivel
        </p>
        <div
          v-for="(item, index) in exchangesByLevel"
          :key="item.label"
          class="level-row d-flex align-items-center justify-content-between p-3 rounded-4 mb-3"
        >
          <div class="d-flex align-items-center gap-3">
            <div
              class="level-dot rounded-circle flex-shrink-0"
              :style="{ backgroundColor: levelColors[index % levelColors.length] }"
            ></div>
            <span class="fw-semibold text-secondary">{{ item.label }}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span
              class="badge rounded-pill px-3 py-2 fw-bold fs-6"
              :style="{
                backgroundColor: levelColors[index % levelColors.length] + '20',
                color: levelColors[index % levelColors.length],
              }"
            >
              {{ item.value }}
            </span>
            <span class="text-muted extra-small">
              {{
                totalExchanges > 0 ? ((item.value / totalExchanges) * 100).toFixed(0) + '%' : '0%'
              }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ExchangeByLevel {
  label: string
  value: number
}

interface Props {
  totalExchanges: number
  exchangesByLevel: ExchangeByLevel[]
}

withDefaults(defineProps<Props>(), {
  totalExchanges: 0,
  exchangesByLevel: () => [],
})

const levelColors = ['#0d6efd', '#6610f2', '#ffc107', '#198754', '#dc3545', '#0dcaf0']
</script>

<style scoped>
.total-card {
  background: linear-gradient(135deg, #0d6efd08 0%, #6610f208 100%);
  border-color: #0d6efd30 !important;
}

.total-icon-container {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: #0d6efd20;
  flex-shrink: 0;
}

.total-icon-container i {
  font-size: 1.75rem;
  color: #0d6efd;
}

.total-value {
  color: #0d6efd;
  font-size: 3rem;
  line-height: 1;
}

.level-row {
  background-color: #f8f9fa;
  transition: background-color 0.2s ease;
}

.level-row:hover {
  background-color: #e9ecef;
}

.level-dot {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.extra-small {
  font-size: 0.75rem;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>
