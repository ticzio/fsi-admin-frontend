<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import LineChart from '@/components/common/Charts/LineChart.vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import TitleSection from '@/components/common/titleSection.vue'
import StatisticCards from '@/components/Home/StatisticCards.vue'
import AreaChart from '@/components/common/Charts/AreaChart.vue'
import StackedBarChart from '@/components/common/Charts/StackedBarChart.vue'
import LatestUsers from '@/components/Home/LatestUsers.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { useAnalytics } from '@/composables/Models/useAnalytics'
import { useMoment } from '@/composables/useMoment'
import type { StatisticItem } from '@/components/Home/StatisticCards.vue'

// ── Analytics composable ──────────────────────────────────────────────────────
const { loading: loadingDashboard, getDashboardAnalytics } = useAnalytics()

// ── Moment (locale es) ────────────────────────────────────────────────────────
// Establece moment.locale('es') globalmente para nombres de meses en español
useMoment()

// ── Full labels para tooltips de gráficas ("Marzo 2026", etc.) ────────────────
const exchangesFullLabels = ref<string[]>([])
const registrationsFullLabels = ref<string[]>([])

// ── Exchanges chart zoom ──────────────────────────────────────────────────────
const exchangesLineChartRef = ref<InstanceType<typeof LineChart> | null>(null)
const isExchangesZoomed = ref(false)

const resetExchangesZoom = () => {
  exchangesLineChartRef.value?.resetZoom()
  isExchangesZoomed.value = false
}

// ── Statistic Cards ───────────────────────────────────────────────────────────
const statisticItems = ref<StatisticItem[]>([
  { value: '—', label: 'Farmacias activas', to: 'Farmacia' },
  { value: '—', label: 'Operadores activos', to: 'Operadores' },
  { value: '—', label: 'Clientes registrados', highlighted: true, to: 'Clientes' },
  { value: '—', label: 'Cupones canjeados', to: 'Canjes' },
])

// ── Charts (reactive state driven by backend) ─────────────────────────────────
const chartKey = ref(0)
const totalExchange = ref<number | string>('—')

const exchangesChartSeries = ref([{ name: 'Canjeados', data: [] as number[] }])
const exchangesChartCategories = ref<string[]>([])

const registrationsChartSeries = ref([{ name: 'Clientes registrados', data: [] as number[] }])
const registrationsChartCategories = ref<string[]>([])


// Chart options (static portions)
import type { ApexOptions } from 'apexcharts'
const exchangesChartOptions = ref<ApexOptions>({
  chart: {
    type: 'area',
    height: 250,
    toolbar: {
      show: true,
      tools: { zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
      autoSelected: 'zoom',
    },
    parentHeightOffset: 0,
    zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
    events: {
      dataPointMouseEnter: (_event: any, _chartContext: any, _config: any) => {
        document.body.style.cursor = 'pointer'
      },
      dataPointMouseLeave: () => {
        document.body.style.cursor = 'default'
      },
      dataPointSelection: (_event: any, chartContext: any, config: any) => {
        const dataIndex: number = config.dataPointIndex
        if (dataIndex < 0 || dataIndex === undefined) return
        const total: number = config.w.globals.series[0]?.length ?? 0
        if (total === 0) return
        // zoomX is 1-indexed in ApexCharts
        const min = dataIndex + 1
        const max = Math.min(total, dataIndex + 3)
        chartContext.zoomX(min, max)
        isExchangesZoomed.value = true
      },
    },
  },
  colors: ['#1e3888'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  fill: {
    type: 'solid',
    opacity: 1,
  },
  markers: {
    size: 6,
    hover: { size: 9 },
    strokeWidth: 3,
    colors: ['#1e3888'],
    strokeColors: ['#ffffff'],
  },
  xaxis: {
    categories: [],
    tickPlacement: 'on',
    tooltip: { enabled: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
    crosshairs: {
      show: true,
      width: 1,
      position: 'back',
      stroke: { color: '#1e3888', width: 1, dashArray: 4 },
    },
  },
  yaxis: {
    max: (val: number) => val + 10,
  },
  tooltip: {
    enabled: true,
    intersect: true,
    shared: false,
    followCursor: false,
    custom: function ({ series, seriesIndex, dataPointIndex, w }) {
      const val = series[seriesIndex][dataPointIndex]
      const label = exchangesFullLabels.value[dataPointIndex] ?? ''
      return `
        <div style="position: relative; z-index: 9999; background: #1e3888; color: #ffffff; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(30, 56, 136, 0.2); border: 1px solid rgba(255,255,255,0.2);">
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">${label}</div>
          <div>${val} canjes</div>
        </div>
      `
    }
  },
  grid: {
    borderColor: '#e9ecef',
    strokeDashArray: 4,
    padding: { bottom: 0 },
  },
  states: { hover: { filter: { type: 'lighten' } } },
})

const registrationsChartOptions = ref<ApexOptions>({
  chart: {
    type: 'line',
    height: 250,
    toolbar: {
      show: true,
      tools: { zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
      autoSelected: 'zoom',
    },
    parentHeightOffset: 0,
    zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
  },
  colors: ['#4a148c'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 100],
    },
  },
  markers: {
    size: 6,
    hover: { size: 9 },
    strokeWidth: 3,
    colors: ['#4a148c'],
    strokeColors: ['#ffffff'],
  },
  xaxis: {
    categories: [],
    tickPlacement: 'on',
    tooltip: { enabled: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
    crosshairs: {
      show: true,
      width: 1,
      position: 'back',
      stroke: { color: '#4a148c', width: 1, dashArray: 4 },
    },
  },
  yaxis: {
    max: (val: number) => val + 10,
  },
  tooltip: {
    enabled: true,
    intersect: true,
    shared: false,
    followCursor: false,
    custom: function ({ series, seriesIndex, dataPointIndex, w }) {
      const val = series[seriesIndex][dataPointIndex]
      const label = registrationsFullLabels.value[dataPointIndex] ?? ''
      return `
        <div style="position: relative; z-index: 9999; background: #4a148c; color: #ffffff; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(74, 20, 140, 0.2); border: 1px solid rgba(255,255,255,0.2);">
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">${label}</div>
          <div>${val} clientes</div>
        </div>
      `
    }
  },
  grid: {
    borderColor: '#e9ecef',
    strokeDashArray: 4,
    padding: { bottom: 0 },
  },
  states: { hover: { filter: { type: 'lighten' } } },
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
  registrationsChartCategories.value = regMonths.map((m: any) => m.label)
  registrationsChartSeries.value = [
    { name: 'Clientes registrados', data: regMonths.map((m: any) => m.value as number) },
  ]

  // Full labels para tooltip (él backend devuelve full_label: "Marzo 2026")
  // formatToMonthYear garantiza el locale 'es' y el formato consistente
  registrationsFullLabels.value = regMonths.map((m: any) => {
    if (m.full_label) return m.full_label as string
    return m.label ?? ''
  })

  registrationsChartOptions.value = {
    ...registrationsChartOptions.value,
    xaxis: {
      ...registrationsChartOptions.value.xaxis,
      categories: registrationsChartCategories.value,
    },
  }

  // Exchanges chart (chart1 / top chart)
  const exchMonths = data.exchanges_by_month ?? []
  exchangesChartCategories.value = exchMonths.map((m: any) => m.label)
  exchangesChartSeries.value = [
    { name: 'Canjeados', data: exchMonths.map((m: any) => m.value as number) },
  ]

  // Full labels para tooltip (él backend devuelve full_label: "Marzo 2026")
  exchangesFullLabels.value = exchMonths.map((m: any) => {
    if (m.full_label) return m.full_label as string
    return m.label ?? ''
  })

  exchangesChartOptions.value = {
    ...exchangesChartOptions.value,
    xaxis: {
      ...exchangesChartOptions.value.xaxis,
      categories: exchangesChartCategories.value,
    },
  }

  // Force chart components to re-render to prevent tooltip detaching bugs
  chartKey.value += 1
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
                <button
                  v-if="isExchangesZoomed"
                  class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  style="font-size: 0.8rem; border-radius: 8px"
                  @click="resetExchangesZoom"
                >
                  <span>↺</span> Restablecer zoom
                </button>
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
            <div class="flex-grow-1" style="min-width: 0; min-height: 0; position: relative; z-index: 10;">
              <!-- Desktop Chart -->
              <div class="d-none d-lg-block" >
        <LineChart :key="`chart1-${chartKey}`" ref="exchangesLineChartRef" :series="exchangesChartSeries" :options="exchangesChartOptions" />
          
              </div>
              <!-- Mobile Chart (Stacked Bar) -->
              <div class="d-block d-lg-none">
                <StackedBarChart :key="`chart1-mobile-${chartKey}`" :series="exchangesChartSeries" :options="exchangesChartOptions" />
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
            <div class="flex-grow-1 mt-2" style="min-width: 0; min-height: 0; position: relative; z-index: 10;">
              <!-- Desktop Chart -->
              <div class="d-none d-lg-block">
                <LineChart
                  :key="`chart2-${chartKey}`"
                  type="area"
                  :series="registrationsChartSeries"
                  :options="registrationsChartOptions"
                />
              </div>
              <!-- Mobile Chart (Intelligent Markers) -->
              <div class="d-block d-lg-none">
                <AreaChart
                  :key="`chart2-mobile-${chartKey}`"
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
