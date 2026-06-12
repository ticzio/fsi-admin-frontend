<template>
  <div class="h-100 d-flex flex-column">
    <!-- Encabezado -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="fw-bold mb-0">Estadísticas de Canjes</h5>
    </div>

    <!-- Tarjeta Total de Canjes -->
    <div class="total-card d-flex align-items-center gap-4 p-4 rounded-4 shadow-sm border mb-4">
      <div class="total-icon-container">
        <i class="bi bi-arrow-left-right"></i>
      </div>
      <div>
        <p class="text-muted small mb-0 fw-medium text-uppercase letter-spacing-1">
          Total General de Canjes
        </p>
        <h2 class="display-4 mb-0 fw-bold total-value">{{ totalExchanges }}</h2>
      </div>
    </div>

    <!-- Desglose por Nivel -->
    <div class="flex-grow-1 overflow-y-auto custom-scrollbar pe-2">
      <p class="text-secondary small text-uppercase fw-bold mb-3 letter-spacing-1">
        Desglose por Nivel de Fidelidad
      </p>

      <div class="levels-horizontal-container d-flex flex-nowrap gap-4 pb-3 custom-scrollbar overflow-x-auto">
        <div v-for="(item, index) in exchangesByLevel" :key="item.label" class="level-card-wrapper flex-shrink-0">
          <div class="level-card h-100 p-4 rounded-4 border bg-white shadow-sm transition-all">
            <div class="d-flex align-items-center gap-3 mb-4">
              <div
                class="level-icon-container"
                :style="{ backgroundColor: levelColors[index % levelColors.length] + '15' }"
              >
                <i
                  :class="['bi', getLevelIcon(item.label)]"
                  :style="{ color: levelColors[index % levelColors.length] }"
                ></i>
              </div>
              <div>
                <h6 class="fw-bold mb-0 text-dark text-nowrap">{{ item.label }}</h6>
                <span class="text-muted extra-small">Nivel de Usuario</span>
              </div>
            </div>

            <div class="mt-auto">
              <p class="text-muted small mb-1 fw-medium">Canjes realizados</p>
              <h2 class="mb-0 fw-bold h3">{{ item.value }}</h2>
            </div>
          </div>
        </div>
      </div>
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

const levelColors = [
  '#4361ee', // Royal Blue
  '#7209b7', // Purple
  '#f72585', // Pink/Magenta
  '#4cc9f0', // Sky Blue
  '#4895ef', // Medium Blue
  '#3f37c9', // Indigo
]

const levelIcons: Record<string, string> = {
  Bienestar: 'bi-heart-fill',
  Vitalidad: 'bi-lightning-charge-fill',
  Equilibrio: 'bi-gem',
  Plenitud: 'bi-sun-fill',
  Fortaleza: 'bi-shield-shaded',
}

const getLevelIcon = (label: string) => {
  return levelIcons[label] || 'bi-award-fill'
}
</script>

<style scoped>
.total-card {
  background: linear-gradient(135deg, #0d6efd08 0%, #6610f208 100%);
  border-color: #0d6efd20 !important;
}

.total-icon-container {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background-color: #0d6efd15;
  flex-shrink: 0;
}

.total-icon-container i {
  font-size: 2rem;
  color: #0d6efd;
}

.total-value {
  color: #0d6efd;
  line-height: 1;
  letter-spacing: -1px;
}

.level-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.level-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(0, 0, 0, 0.05) !important;
}

.level-icon-container {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
}

.level-icon-container i {
  font-size: 1.25rem;
}

.extra-small {
  font-size: 0.7rem;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.transition-all {
  transition: all 0.3s ease;
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

.levels-horizontal-container {
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.level-card-wrapper {
  width: 300px;
  scroll-snap-align: start;
}
</style>
