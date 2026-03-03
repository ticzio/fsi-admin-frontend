<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
//Components
import DashboardLayout from '@/components/DashboardLayout.vue'
import LineChart from '@/components/common/LineChart.vue'
import DoughnutChart from '@/components/common/DoughnutChart.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
//Composables
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useCookies } from '@/composables/useCookies'
import { useLogger } from '@/composables/useLogger'
import { useAccessControl } from '@/composables/useAccessControl'

//Utils
import { TABLE_HEADERS, TABLE_PAGINATION, TABLE_ACTIONS } from '@/const/tableConst'
import { URLS } from '@/const/api'
import { useRouter } from 'vue-router'
import defaultProfileImage from '@/assets/images/default-profile.png'

const router = useRouter()
const { showSuccess, showError } = useSwalToast()
const store = useStore()
const logger = useLogger()
const { can } = useAccessControl()
const CookiesFullName = useCookies().getCookie('changan_admin_full_name')
const isLoading = ref(false)
const isNavigating = ref(false)
const consumers = ref<Array<any>>([])

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: 4,
})

const dashboardStats = ref({
  active_concessionaires: 0,
  active_app_clients: 0,
  active_companies: 0,
  monthly_services: 0,
})

const statsCards = computed(() => [
  {
    id: 1,
    title: 'Concesionarios activos',
    value: dashboardStats.value.active_concessionaires || 0,
  },
  {
    id: 2,
    title: 'Usuarios de la APP',
    value: dashboardStats.value.active_app_clients || 0,
  },
  {
    id: 3,
    title: 'Empresas activas',
    value: dashboardStats.value.active_companies || 0,
  },
  {
    id: 4,
    title: 'Servicios del mes',
    value: dashboardStats.value.monthly_services || 0,
  },
])

// Últimas citas agendadas
const lastAppointments = ref<Array<any>>([])

const lastAppointmentsActions = computed(() =>
  can('concessionaire.read') || can('activity.read') ? [TABLE_ACTIONS.edit] : [],
)

// Monthly reservations (chart)
const monthLabelsEs = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]
const reservationsByMonth = ref<number[]>(new Array(12).fill(0))
const reservationsChartData = computed(() => ({
  labels: monthLabelsEs,
  datasets: [
    {
      label: 'Reservas',
      data: reservationsByMonth.value,
      borderColor: '#103560',
      backgroundColor: 'rgba(16, 53, 96, 0.08)',
      tension: 0.5,
      fill: true,
      pointBackgroundColor: '#103560',
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBorderWidth: 2,
      pointBorderColor: '#fff',
    },
  ],
}))

const reservationsChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#888', font: { size: 15 } },
    },
    y: {
      grid: { color: '#f1f3f4' },
      ticks: { display: false },
    },
  },
}

// Reservations by category (doughnut)
const categoriesData = ref<Array<{ category: string; percentage: number; count: number }>>([])
const categoriesColors = ['#103560', '#ff7f32', '#f4c96b', '#e9ecef']
const categoriesChartData = computed(() => ({
  labels: categoriesData.value.map((c) => c.category),
  datasets: [
    {
      data: categoriesData.value.map((c) =>
        Number(c.percentage?.toFixed?.(2) ?? c.percentage ?? 0),
      ),
      backgroundColor: categoriesColors.slice(0, Math.max(1, categoriesData.value.length)),
      borderWidth: 0,
    },
  ],
}))

const categoriesChartOptions = {
  responsive: true,
  cutout: '60%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
}

const getDashboardStats = async () => {
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: 'analytics/home_counters',
    })

    if (response.code === 200) {
      logger.logRequest('analytics/home_counters', {}, response)
      // Actualizar los datos directamente en la variable local
      dashboardStats.value = response.data
    }
  } catch (error) {
    logger.logRequest('analytics/home_counters', {}, error)
  } finally {
    isLoading.value = false
  }
}

// Fetch monthly reservations from analytics endpoint
const fetchReservationsByMonth = async () => {
  try {
    const currentYear = new Date().getFullYear()
    const params = { year: currentYear }
    const response: any = await store.dispatch('getData', {
      url: URLS.analyticsReservationsByMonth.prefix,
      params,
    })
    if (response?.code === 200) {
      logger.logRequest(URLS.analyticsReservationsByMonth.prefix, params, response)
      const m = response.data.map((item: any) => ({
        x: item.month,
        y: item.count,
      }))
      reservationsByMonth.value = m
    }
  } catch (e) {
    logger.logRequest(
      URLS.analyticsReservationsByMonth.prefix,
      { year: new Date().getFullYear() },
      e,
    )
  }
}

// Fetch reservations distribution by category
const fetchReservationsByCategory = async () => {
  try {
    const response: any = await store.dispatch('getData', {
      url: URLS.analyticsReservationsByCategory.prefix,
    })
    if (response?.code === 200) {
      logger.logRequest(URLS.analyticsReservationsByCategory.prefix, {}, response)
      const list = Array.isArray(response?.data) ? response.data : []
      categoriesData.value = list
    } else {
      categoriesData.value = []
    }
  } catch (e) {
    logger.logRequest(URLS.analyticsReservationsByCategory.prefix, {}, e)
    categoriesData.value = []
  }
}

const fetchLastAppointments = async () => {
  try {
    const params = {
      limit: 5,
      page: TABLE_PAGINATION.currentPage,
    }
    const response: any = await store.dispatch('getData', {
      url: URLS.appointment.getAll,
      params,
    })
    if (response?.code === 200) {
      logger.logRequest(URLS.appointment.getAll, params, response)
      lastAppointments.value = response.data.data || response.data
    }
  } catch (e) {
    logger.logRequest(URLS.appointment.getAll, { limit: 5 }, e)
  }
}

const goToClients = () => {
  if (!can('client.read')) return
  isNavigating.value = true
  setTimeout(() => {
    router.push({ name: 'Clientes' })
  }, 600)
}

const goToReservations = () => {
  if (!can('activity.read')) return
  router.push({ name: 'Reservas (Concesionario)' })
}

const handleStatsCardClick = (cardId: number) => {
  // Controla la navegación desde las cards superiores del dashboard
  if (cardId === 1 && can('concessionaire.read')) {
    // Concesionarios activos
    isNavigating.value = true
    setTimeout(() => {
      router.push({ name: 'Concesionarios' })
    }, 600)
  } else if (cardId === 2 && can('client.read')) {
    // Usuarios de la APP (Clientes)
    goToClients()
  } else if (cardId === 3 && can('company.read')) {
    // Empresas activas
    isNavigating.value = true
    setTimeout(() => {
      router.push({ name: 'Empresas' })
    }, 600)
  }
}

const handleActionClick = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    if (item.id_concessionaire) {
      router.push({
        name: 'Reservas (Concesionario)',
        params: { id_concessionaire: item.id_concessionaire },
        query: { appointment_id: item.id },
      })
    }
  }
}

const fetchLastConsumers = async () => {
  try {
    const params = {
      limit: 5,
      page: 1,
    }
    const response: any = await store.dispatch('getData', {
      url: URLS.clientVehicle.getAll,
      params,
    })
    if (response?.code === 200) {
      logger.logRequest(URLS.clientVehicle.getAll, params, response)
      // Map the client_vehicle response to get the client details
      const list = response.data.data || []
      consumers.value = list.map((item: any) => item.client).filter((client: any) => client)
    }
  } catch (e) {
    logger.logRequest(URLS.clientVehicle.getAll, { limit: 5 }, e)
  }
}

onMounted(() => {
  getDashboardStats()
  fetchLastAppointments()
  fetchLastConsumers()
})
</script>

<template>
  <DashboardLayout>
    <LoadingOverlay v-if="isNavigating" message="Redireccionando..." />
    <div class="dashboard-home">
      <!-- Welcome Section -->
      <div class="mb-4 border-radius-right border-radius-left bg-secondary p-4">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="fw-bold" style="color: #fff">¡Bienvenido, {{ CookiesFullName }}!</h1>
            <h5 class="mb-0 opacity-75 text-indent" style="color: #fff">
              Bienvenido al panel de administrativo de Mi CHANGAN APP
            </h5>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div v-for="i in 4" :key="i" class="col-xl-3 col-lg-6 col-md-6 mb-3">
          <div
            class="card stats-card text-white"
            @click="handleStatsCardClick(statsCards[i - 1].id)"
          >
            <div class="card-body p-0" style="position: relative; z-index: 2">
              <div class="d-flex align-items-center">
                <div class="flex-grow-1 px-4 pt-4 pb-2">
                  <div class="d-flex align-items-center justify-content-between">
                    <h5 class="mb-0">{{ statsCards[i - 1].title }}</h5>
                    <i class="bi bi-people-fill fs-2"></i>
                  </div>
                  <p class="mb-0 fs-4 fw-bold">{{ statsCards[i - 1].value }}</p>
                </div>
              </div>
            </div>
            <!-- Elementos para el efecto hover -->
            <div class="shine"></div>
            <div class="background"></div>
          </div>
        </div>
      </div>

      <!-- Dashboard Layout Content Structure -->
      <div class="row g-4 mb-4">
        <!-- Left Column: Table (Citas agendadas) -->
        <div class="col-lg-8">
          <div class="card border-radius-right border-radius-left h-100 border-0 shadow-sm">
            <div class="card-header bg-transparent border-0 px-4 pt-4 pb-0">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h5 class="card-title fw-semibold mb-1">Últimas citas agendadas</h5>
                  <p class="text-muted small mb-0">Citas agendadas desde la APP</p>
                </div>
              </div>
            </div>
            <div class="card-body px-4 pt-3 flex-grow-1 d-flex flex-column">
              <CustomTable
                :headers="TABLE_HEADERS.lastAppointments"
                :data="lastAppointments"
                :actions="lastAppointmentsActions"
                @action-click="handleActionClick"
                :hidePagination="true"
              >
                <template #cell(appointment_date)="{ value }">
                  <span v-format-date="value" class="fw-medium"></span>
                </template>
                <template #cell(appointment_status.name)="{ value, item }">
                  <span
                    :class="[
                      'badge w-100 rounded-3 px-3 py-2 text-uppercase fw-medium',
                      item.id_appointment_status === 1
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning'
                        : item.id_appointment_status === 2
                          ? 'bg-info-subtle text-info-emphasis border border-info'
                          : item.id_appointment_status === 4
                            ? 'bg-success-subtle text-success-emphasis border border-success'
                            : 'bg-secondary-subtle text-secondary-emphasis border border-secondary',
                    ]"
                  >
                    {{ value || 'Pendiente' }}
                  </span>
                </template>
              </CustomTable>
            </div>
          </div>
        </div>

        <!-- Right Column: Chart & Recent Users -->
        <div class="col-lg-4 d-flex flex-column gap-4">
          <!-- Usuarios por modelo Chart -->
          <div class="card border-radius-right border-radius-left border-0 shadow-sm flex-fill">
            <div class="card-header bg-transparent border-0 px-4 pt-4 pb-0">
              <h5 class="card-title fw-semibold mb-1">Usuarios por modelo</h5>
              <p class="text-muted small mb-0">Distribución de vehículos</p>
            </div>
            <div
              class="card-body px-4 pb-4 d-flex flex-column justify-content-center align-items-center"
            >
              <div class="chart-container w-100 mb-2" style="position: relative; height: 180px">
                <DoughnutChart
                  :chart-data="categoriesChartData"
                  :chart-options="categoriesChartOptions"
                />
              </div>
              <ul class="list-unstyled w-100 m-0 mt-3" v-if="categoriesData.length">
                <li
                  v-for="(item, idx) in categoriesData"
                  :key="item.category"
                  class="d-flex justify-content-between align-items-center mb-2 px-2 py-1 rounded-2 hover-bg-light"
                  style="transition: all 0.2s ease"
                >
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="rounded-circle shadow-sm"
                      style="width: 10px; height: 10px"
                      :style="{ backgroundColor: categoriesColors[idx % categoriesColors.length] }"
                    ></span>
                    <span class="text-secondary fw-medium" style="font-size: 0.85rem">{{
                      item.category
                    }}</span>
                  </div>
                  <span class="fw-bold text-dark" style="font-size: 0.85rem"
                    >{{ Number(item.percentage ?? 0).toFixed(1) }}%</span
                  >
                </li>
              </ul>
              <div v-else class="text-muted small py-3 w-100 text-center">
                Sin datos de categorías
              </div>
            </div>
          </div>

          <!-- Últimos Usuarios -->
          <div class="card border-radius-right border-radius-left border-0 shadow-sm flex-fill">
            <div class="card-header bg-transparent border-0 px-4 pt-4 pb-2">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h5 class="card-title fw-semibold mb-1">Últimos usuarios</h5>
                  <p class="text-muted small mb-0">Registrados en APP</p>
                </div>
                <a
                  @click="goToClients"
                  class="btn btn-link text-decoration-none text-primary fw-medium p-0"
                  role="button"
                >
                  <i class="bi bi-arrow-right fs-5"></i>
                </a>
              </div>
            </div>
            <div class="card-body px-4 pt-2 pb-4 d-flex flex-column">
              <div v-if="isLoading" class="d-flex justify-content-center align-items-center py-4">
                <div
                  class="spinner-border text-primary"
                  role="status"
                  style="width: 2rem; height: 2rem"
                >
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
              <div v-else-if="consumers && consumers.length > 0" class="d-flex flex-column gap-2">
                <div
                  v-for="consumer in consumers"
                  :key="consumer.id"
                  class="user-item d-flex align-items-center gap-3 p-2 rounded-3 bg-light bg-opacity-50 hover-bg-light"
                  style="transition: all 0.2s ease"
                >
                  <div class="user-avatar flex-shrink-0">
                    <template v-if="consumer.url_image">
                      <img
                        :src="consumer.url_image"
                        alt="Avatar"
                        width="38"
                        height="38"
                        class="rounded-circle object-fit-cover border border-2 border-white shadow-sm"
                        @error="
                          (e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)
                        "
                      />
                    </template>
                    <template v-else>
                      <div
                        class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center shadow-sm"
                        style="width: 38px; height: 38px"
                      >
                        <i class="bi bi-person-fill text-primary" style="font-size: 1.1rem"></i>
                      </div>
                    </template>
                  </div>
                  <div class="user-info flex-grow-1 min-w-0">
                    <p class="mb-0 fw-semibold text-dark text-truncate" style="font-size: 0.9rem">
                      {{ consumer.first_name }} {{ consumer.last_name }}
                    </p>
                    <small class="text-muted text-truncate d-block" style="font-size: 0.75rem">{{
                      consumer.email
                    }}</small>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="d-flex flex-column justify-content-center align-items-center py-4 text-center"
              >
                <div
                  class="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center mb-2"
                  style="width: 48px; height: 48px"
                >
                  <i class="bi bi-people text-secondary fs-4"></i>
                </div>
                <h6 class="text-muted fw-semibold mb-1">Sin usuarios</h6>
                <p class="text-muted small mb-0">No se encontraron registros.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.dashboard-home {
  animation: fadeIn 0.5s ease-in;
  --card-background-color: #103560;
  --card-border-color: rgba(255, 255, 255, 0.1);
  --card-box-shadow-1: rgba(0, 0, 0, 0.05);
  --card-box-shadow-1-y: 3px;
  --card-box-shadow-1-blur: 6px;
  --card-box-shadow-2: rgba(0, 0, 0, 0.1);
  --card-box-shadow-2-y: 8px;
  --card-box-shadow-2-blur: 15px;
  --card-label-color: #ffffff;
  --card-icon-color: #d4d4d8;
  --card-icon-background-color: rgba(255, 255, 255, 0.08);
  --card-icon-border-color: rgba(255, 255, 255, 0.12);
  --card-shine-opacity: 0.1;
  --card-shine-gradient: conic-gradient(
    from 205deg at 50% 50%,
    rgba(88, 141, 255, 0) 0deg,
    #588dff 25deg,
    rgba(88, 141, 255, 0.18) 295deg,
    rgba(88, 141, 255, 0) 360deg
  );
  --card-line-color: rgba(255, 255, 255, 0.15);
  --card-tile-color: rgba(88, 141, 255, 0.1);

  --card-hover-border-color: rgba(255, 255, 255, 0.2);
  --card-hover-box-shadow-1: rgba(0, 0, 0, 0.04);
  --card-hover-box-shadow-1-y: 5px;
  --card-hover-box-shadow-1-blur: 10px;
  --card-hover-box-shadow-2: rgba(0, 0, 0, 0.3);
  --card-hover-box-shadow-2-y: 15px;
  --card-hover-box-shadow-2-blur: 25px;
  --card-hover-icon-color: #588dff;
  --card-hover-icon-background-color: rgba(88, 141, 255, 0.1);
  --card-hover-icon-border-color: rgba(88, 141, 255, 0.2);
}

.stats-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.stats-footer {
  opacity: 0.9;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 0.75rem;
}

.chart-container {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-item {
  padding: 0.75rem 0;
}

.user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-card {
  background-color: var(--card-background-color);
  box-shadow:
    0px var(--card-box-shadow-1-y) var(--card-box-shadow-1-blur) var(--card-box-shadow-1),
    0px var(--card-box-shadow-2-y) var(--card-box-shadow-2-blur) var(--card-box-shadow-2),
    0 0 0 1px var(--card-border-color);
  padding: 16px;
  border-radius: 15px;
  cursor: pointer;
  position: relative;
  transition: box-shadow 0.25s;
}

.stats-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 15px;
  background-color: var(--card-background-color);
}

.stats-card .shine {
  border-radius: inherit;
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s;
}

.stats-card .shine:before {
  content: '';
  width: 150%;
  padding-bottom: 150%;
  border-radius: 50%;
  position: absolute;
  left: 50%;
  bottom: 55%;
  filter: blur(35px);
  opacity: var(--card-shine-opacity);
  transform: translateX(-50%);
  background-image: var(--card-shine-gradient);
}

.stats-card .background {
  border-radius: inherit;
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-mask-image: radial-gradient(circle at 60% 5%, black 0%, black 15%, transparent 60%);
  mask-image: radial-gradient(circle at 60% 5%, black 0%, black 15%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  background-size: 40px 40px;
  background-image:
    repeating-linear-gradient(
      45deg,
      var(--card-line-color) 0,
      var(--card-line-color) 1px,
      transparent 0,
      transparent 50%
    ),
    repeating-linear-gradient(
      -45deg,
      var(--card-line-color) 0,
      var(--card-line-color) 1px,
      transparent 0,
      transparent 50%
    );
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0px 3px 6px var(--card-hover-box-shadow-1),
    0px var(--card-hover-box-shadow-2-y) var(--card-hover-box-shadow-2-blur)
      var(--card-hover-box-shadow-2),
    0 0 0 1px var(--card-hover-border-color);
}

.stats-card:hover .shine {
  opacity: 1;
  transition-duration: 0.5s;
  transition-delay: 0s;
}

.stats-card:hover .background {
  opacity: 1;
}

.stats-card:hover .background .line {
  opacity: 1;
  transition-duration: 0.15s;
}

.stats-card:hover .background .line:before {
  transform: scaleX(1);
}

.stats-card:hover .background .line:after {
  transform: scaleY(1);
}

.stats-card:hover .background .line.line-1:before,
.stats-card:hover .background .line.line-1:after {
  transition-delay: 0s;
}

.stats-card:hover .background .line.line-2:before,
.stats-card:hover .background .line.line-2:after {
  transition-delay: 0.15s;
}

.stats-card:hover .background .line.line-3:before,
.stats-card:hover .background .line.line-3:after {
  transition-delay: 0.3s;
}
</style>
