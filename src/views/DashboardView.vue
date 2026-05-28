<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import TitleSection from '@/components/common/titleSection.vue'
import StatisticCards from '@/components/Home/StatisticCards.vue'
import LineChart from '@/components/common/Charts/LineChart.vue'
import AreaChart from '@/components/common/Charts/AreaChart.vue'
import StackedBarChart from '@/components/common/Charts/StackedBarChart.vue'
import LatestUsers from '@/components/Home/LatestUsers.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { useAnalytics } from '@/composables/Models/useAnalytics'
import type { StatisticItem } from '@/components/Home/StatisticCards.vue'

// ── Analytics composable ──────────────────────────────────────────────────────
const { loading: loadingDashboard, getDashboardAnalytics } = useAnalytics()

// ── Statistic Cards ───────────────────────────────────────────────────────────
const statisticItems = ref<StatisticItem[]>([
  { value: '—', label: 'Farmacias activas', to: 'Farmacia' },
  { value: '—', label: 'Operadores activos', to: 'Operadores' },
  { value: '—', label: 'Clientes registrados', highlighted: true, to: 'Clientes' },
  { value: '—', label: 'Cupones canjeados', to: 'Canjes' },
])

// ── Charts (reactive state driven by backend) ─────────────────────────────────
const totalExchange = ref<number | string>('—')

const exchangesChartSeries = ref([{ name: 'Canjeados', data: [] as number[] }])
const exchangesChartCategories = ref<string[]>([])

const registrationsChartSeries = ref([{ name: 'Clientes registrados', data: [] as number[] }])
const registrationsChartCategories = ref<string[]>([])

// Last tooltip data (most recent month with registrations)
const tooltipMonth = ref('')
const tooltipValue = ref<number | string>('')

// Chart options (static portions)
import type { ApexOptions } from 'apexcharts'
const exchangesChartOptions = ref<ApexOptions>({
  chart: { type: 'area', height: 250, toolbar: { show: false }, parentHeightOffset: 0 },
  colors: ['#1e3888'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' },
  xaxis: { categories: [] },
  tooltip: { x: { format: 'dd/MM/yy HH:mm' } },
  grid: { padding: { bottom: 0 } },
})

const registrationsChartOptions = ref<ApexOptions>({
  chart: { type: 'line', height: 250, toolbar: { show: false }, parentHeightOffset: 0 },
  colors: ['#4a148c'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' },
  xaxis: { categories: [] },
  grid: { padding: { bottom: 0 } },
})

// ── Latest users ──────────────────────────────────────────────────────────────
const latestUsers = ref<
  Array<{ id: number; name: string; email: string; url_image: string | null }>
>([])

// ── Range Selection ───────────────────────────────────────────────────────────
const selectedRange = ref({ id: '6', name: '6 meses' })
const rangeOptions = [
  { id: '3', name: '3 meses' },
  { id: '6', name: '6 meses' },
  { id: '12', name: '1 año' },
]

// ── Data loading ──────────────────────────────────────────────────────────────
const loadDashboardData = async () => {
  const data = await getDashboardAnalytics(selectedRange.value.id)
  if (!data) return

  // Statistic cards
  statisticItems.value = [
    { value: data.total_pharmacies, label: 'Farmacias activas', to: 'Farmacia' },
    { value: data.total_operators, label: 'Operadores activos', to: 'Operadores' },
    { value: data.total_clients, label: 'Clientes registrados', highlighted: true, to: 'Clientes' },
    { value: data.total_exchange, label: 'Cupones canjeados', to: 'Canjes' },
  ]

  totalExchange.value = data.total_exchange

  // Latest clients → LatestUsers component
  latestUsers.value = (data.last_clients ?? []).map(
    (c: { id: number; full_name: string; email: string; url_image: string | null }) => ({
      id: c.id,
      name: c.full_name?.trim() ?? '',
      email: c.email ?? '',
      url_image: c.url_image ?? null,
    }),
  )

  // Registrations chart (chart2 / bottom chart)
  const regMonths = data.registrations_by_month ?? []
  registrationsChartCategories.value = regMonths.map((m: { label: string }) => m.label)
  registrationsChartSeries.value = [
    { name: 'Clientes registrados', data: regMonths.map((m: { value: number }) => m.value) },
  ]
  registrationsChartOptions.value = {
    ...registrationsChartOptions.value,
    xaxis: { categories: registrationsChartCategories.value },
  }

  // Tooltip: last month that has data
  const lastWithData = [...regMonths].reverse().find((m: { value: number }) => m.value > 0)
  if (lastWithData) {
    tooltipMonth.value = (lastWithData as { full_label: string }).full_label
    tooltipValue.value = (lastWithData as { value: number }).value
  }

  // Exchanges chart (chart1 / top chart) — single series for now (exchanges_by_month)
  const exchMonths = data.exchanges_by_month ?? []
  exchangesChartCategories.value = exchMonths.map((m: { label: string }) => m.label)
  exchangesChartSeries.value = [
    { name: 'Canjeados', data: exchMonths.map((m: { value: number }) => m.value) },
  ]
  exchangesChartOptions.value = {
    ...exchangesChartOptions.value,
    xaxis: { categories: exchangesChartCategories.value },
  }
}

watch(selectedRange, () => {
  loadDashboardData()
})

onMounted(async () => {
  await loadDashboardData()
})

// ── Navigation ────────────────────────────────────────────────────────────────
const router = useRouter()
const isRedirecting = ref(false)

const handleCardClick = async (item: StatisticItem) => {
  isRedirecting.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (item.to) {
    router.push({ name: item.to })
  }
}

// Navigate to the client details since the backend now returns the ID
const handleUserClick = async (user: { id: number }) => {
  isRedirecting.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  router.push({ name: 'Detalle Cliente', params: { id: user.id.toString() } })
}

const handleViewAllUsers = async () => {
  isRedirecting.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  router.push({ name: 'Clientes' })
}
</script>

<template>
  <DashboardLayout>
    <div
      class="dashboard-wrapper bg-white shadow-sm p-3 p-md-4 m-0 d-flex flex-column gap-3 gap-md-4 position-relative"
      style="border-radius: 20px"
    >
      <!-- LOADING OVERLAY (dashboard data) -->
      <LoadingOverlay v-if="loadingDashboard" message="Cargando datos..." />
      <!-- REDIRECT OVERLAY -->
      <LoadingOverlay v-if="isRedirecting" message="Redireccionando..." />
      <!-- HEADER -->
      <TitleSection
        title="Bienvenido"
        description="Panel administrativo de farmacias San Ignacio"
        :show-logo="true"
      />

      <!-- CARDS -->
      <StatisticCards :items="statisticItems" @click-card="handleCardClick" />

      <!-- MAIN CONTENT -->
      <div class="row g-4 flex-grow-1">
        <!-- LEFT COLUMN: Charts -->
        <div class="col-12 col-lg-8 d-flex flex-column gap-3 gap-md-4">
          <!-- Top Chart -->
          <div class="card border border-light shadow-sm rounded-4 p-3 p-md-4 flex-grow-1">
            <div
              class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3"
            >
              <div>
                <h3 class="fw-bold mb-0 italic-numbers" style="color: #4a148c; font-size: 2rem">
                  {{ totalExchange }}
                </h3>
                <p class="text-dark fw-bold mb-0" style="font-size: 0.9rem">Cupones canjeados</p>
              </div>
              <div class="d-flex flex-wrap gap-3 align-items-center">
                <div style="min-width: 140px">
                  <MultiselectCustom
                    v-model="selectedRange"
                    :options="rangeOptions"
                    label-key="name"
                    track-by="id"
                    :show-icons="false"
                    :show-descriptions="false"
                    placeholder="Rango"
                  />
                </div>
              </div>
            </div>
            <div class="flex-grow-1" style="overflow: hidden">
              <!-- Desktop Chart -->
              <div class="d-none d-md-block">
                <LineChart :series="exchangesChartSeries" :options="exchangesChartOptions" />
              </div>
              <!-- Mobile Chart (Stacked Bar) -->
              <div class="d-block d-md-none">
                <StackedBarChart :series="exchangesChartSeries" :options="exchangesChartOptions" />
              </div>
            </div>
        </div>  

          <!-- Bottom Chart -->
          <div
            class="card border border-light shadow-sm rounded-4 p-3 p-md-4 pb-5 pb-md-5 h-100 min-h-200"
          >
            <h6 class="fw-bold text-dark mb-4 text-center text-md-start" style="font-size: 1rem">
              Clientes registrados
            </h6>
            <div class="flex-grow-1 mt-2" style="overflow: hidden; position: relative">
              <!-- Tooltip Mockup (Desktop only) -->
              <div
                v-if="tooltipMonth && tooltipValue !== ''"
                class="position-absolute translate-middle-x bg-white border border-light shadow-sm rounded-2 d-none d-md-flex flex-column align-items-center justify-content-center p-2 z-2"
                style="left: 45.4%; top: 5%; width: 80px"
              >
                <span class="text-muted" style="font-size: 0.65rem">{{ tooltipMonth }}</span>
                <span class="fw-bold text-dark lh-1 mt-1" style="font-size: 0.9rem">{{
                  tooltipValue
                }}</span>
              </div>

              <!-- Desktop Chart -->
              <div class="d-none d-md-block">
                <LineChart
                  type="area"
                  :series="registrationsChartSeries"
                  :options="registrationsChartOptions"
                />
              </div>
              <!-- Mobile Chart (Intelligent Markers) -->
              <div class="d-block d-md-none">
                <AreaChart
                  :series="registrationsChartSeries"
                  :options="registrationsChartOptions"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Users List -->
        <LatestUsers
          :users="latestUsers"
          @click-user="handleUserClick"
          @click-view-all="handleViewAllUsers"
        />
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
</style>
