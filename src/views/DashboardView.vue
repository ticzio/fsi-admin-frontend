<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import TitleSection from '@/components/common/titleSection.vue'
import StatisticCards from '@/components/Home/StatisticCards.vue'
import LineChart from '@/components/common/LineChart.vue'
import LatestUsers from '@/components/Home/LatestUsers.vue'

const users = ref([
  { id: 1, name: 'Gabriel Correa', email: 'gabriel@example.com' },
  { id: 2, name: 'Robert Daza', email: 'roberts@example.com' },
  { id: 3, name: 'Gabriela Mujica', email: 'gabriela@example.com' },
  { id: 4, name: 'Dianne Russell', email: 'dianne@example.com' },
  { id: 5, name: 'Gabriel Torres', email: 'gabriel@example.com' },
  { id: 6, name: 'Robert Daza', email: 'roberts@example.com' },
  { id: 7, name: 'Gabriela Mujica', email: 'gabriela@example.com' },
  { id: 8, name: 'Dianne Russell', email: 'dianne@example.com' },
])

const statisticItems = ref([
  { value: 12, label: 'Sedes activas' },
  { value: 34, label: 'Operadores activos' },
  { value: 234, label: 'Usuarios registrados', highlighted: true },
  { value: 96, label: 'Cupones canjeados' },
])

const chart1Data = {
  labels: ['FEB', 'MAR', 'ABRIL', 'MAY', 'JUN', 'JUL'],
  datasets: [
    {
      label: 'Descuentos',
      data: [90, 25, 120, 50, 115, 50],
      borderColor: '#1e3888',
      backgroundColor: '#1e3888',
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: 'Beneficios',
      data: [45, 75, 30, 110, 20, 105],
      borderColor: '#00d500',
      backgroundColor: '#00d500',
      tension: 0.4,
      pointRadius: 0,
    },
  ],
}

const chart1Options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { display: true, min: 10, max: 100, ticks: { stepSize: 40 }, border: { display: false } },
    x: {
      display: true,
      grid: { display: false },
      ticks: { color: '#999', font: { size: 10 } },
      border: { display: false },
    },
  },
}

const chart2Data = {
  labels: ['Feb', 'Mar', 'Abril', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
  datasets: [
    {
      label: 'Usuarios registrados',
      data: [200, 250, 300, 400, 500, 643, 600, 750, 800, 850, 1000, 1200],
      borderColor: '#1e3888',
      backgroundColor: 'rgba(30, 56, 136, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: [0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0],
      pointBackgroundColor: '#1e3888',
    },
  ],
}

const chart2Options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { display: false },
    x: {
      display: true,
      grid: { display: false },
      ticks: { color: '#999', font: { size: 10 } },
      border: { display: false },
    },
  },
}
</script>

<template>
  <DashboardLayout>
    <div
      class="dashboard-wrapper bg-white shadow-sm p-4 m-0 d-flex flex-column gap-4"
      style="border-radius: 20px"
    >
      <!-- HEADER -->
      <TitleSection
        title="Bienvenido"
        description="Panel administrativo de farmacias San Ignacio"
        :show-logo="true"
      />

      <!-- CARDS -->
      <StatisticCards :items="statisticItems" />

      <!-- MAIN CONTENT -->
      <div class="row g-4 flex-grow-1">
        <!-- LEFT COLUMN: Charts -->
        <div class="col-lg-8 d-flex flex-column gap-4">
          <!-- Top Chart -->
          <div class="card border border-light shadow-sm rounded-4 p-4 flex-grow-1 min-h-300">
            <div class="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h3 class="fw-bold mb-0 italic-numbers" style="color: #4a148c; font-size: 2rem">
                  4760
                </h3>
                <p class="text-dark fw-bold mb-0" style="font-size: 0.9rem">Cupones canjeados</p>
              </div>
              <div class="d-flex flex-wrap gap-3 align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <span
                    class="rounded-circle"
                    style="width: 10px; height: 10px; background-color: #1e3888"
                  ></span>
                  <span class="text-muted small fw-medium">Descuentos</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span
                    class="rounded-circle"
                    style="width: 10px; height: 10px; background-color: #00d500"
                  ></span>
                  <span class="text-muted small fw-medium">Beneficios</span>
                </div>
                <div
                  class="border rounded px-3 py-1 text-muted small d-flex align-items-center gap-2 ms-2 user-select-none border-light"
                >
                  6 meses <i class="bi bi-caret-down-fill text-muted" style="margin-top: 1px"></i>
                </div>
              </div>
            </div>
            <div class="flex-grow-1 position-relative" style="height: 220px">
              <LineChart :chart-data="chart1Data" :chart-options="chart1Options" />
            </div>
          </div>

          <!-- Bottom Chart -->
          <div class="card border border-light shadow-sm rounded-4 p-4 h-100 min-h-200">
            <h6 class="fw-bold text-dark mb-4" style="font-size: 1rem">Usuarios registrados</h6>
            <div class="position-relative flex-grow-1 mt-2" style="height: 140px">
              <!-- Tooltip Mockup -->
              <div
                class="position-absolute translate-middle-x bg-white border border-light shadow-sm rounded-2 d-flex flex-column align-items-center justify-content-center p-2 z-1"
                style="left: 45.4%; top: 5%; width: 80px"
              >
                <span class="text-muted" style="font-size: 0.65rem">Junio 2026</span>
                <span class="fw-bold text-dark lh-1 mt-1" style="font-size: 0.9rem">643</span>
              </div>
              <LineChart :chart-data="chart2Data" :chart-options="chart2Options" />
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Users List -->
        <LatestUsers :users="users" />
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.italic-numbers {
  font-style: italic;
  font-family: 'Arial', sans-serif;
  letter-spacing: -0.5px;
}
.italic-text {
  font-style: italic;
}
.border-light {
  border-color: #eee !important;
}
/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #c8c8c8;
}
.min-h-300 {
  min-height: 300px;
}
.min-h-200 {
  min-height: 200px;
}
</style>
