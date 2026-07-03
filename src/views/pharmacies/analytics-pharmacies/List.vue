<template>
  <div class="h-100 d-flex flex-column overflow-hidden bg-transparent">
    <!-- Main Content Area -->
    <div class="row g-3 flex-grow-1 overflow-hidden pb-3">
      <!-- Columna Izquierda (25%): Filtros de Operador y Fechas -->
      <div class="col-12 col-xl-4 d-flex flex-column h-100">
        <div class="bg-white rounded-4 shadow-sm border p-4 h-100 d-flex flex-column gap-3 overflow-y-auto custom-scrollbar">
          <!-- Filtro de Operadores -->
          <div>
            <MultiselectCustom
              v-model="selectedOperator"
              :options="operatorOptions"
              label="Filtrar por operador"
              placeholder="Todos los operadores"
              label-key="label"
              track-by="id"
              helper-type="custom"
              :show-icons="false"
              :show-descriptions="false"
              :multiple="false"
              :clearable="true"
            />
          </div>

          <!-- Filtro de Fechas -->
          <div class="row ">
            <div class="col-12 col-md-6">
              <BaseInput
                v-model="startDate"
                id="start-date"
                label="Fecha Inicio"
                type="date"
              >
                <template #label-icon v-if="startDate">
                  <button
                    type="button"
                    class="btn btn-sm btn-light border text-danger p-0 ms-2 d-inline-flex align-items-center justify-content-center"
                    style="width: 22px; height: 22px;"
                    title="Limpiar fecha"
                    @click.stop.prevent="startDate = ''"
                  >
                    <i :class="BUTTONS.filter.icon" style="font-size: 0.9rem;"></i>
                  </button>
                </template>
              </BaseInput>
            </div>
            <div class="col-12 col-md-6">
              <BaseInput
                v-model="endDate"
                id="end-date"
                label="Fecha Fin"
                type="date"
              >
                <template #label-icon v-if="endDate">
                  <button
                    type="button"
                    class="btn btn-sm btn-light border border-danger text-danger p-0 ms-2 d-inline-flex align-items-center justify-content-center"
                    style="width: 22px; height: 22px;"
                    title="Limpiar fecha"
                    @click.stop.prevent="endDate = ''"
                  >
                    <i :class="BUTTONS.filter.icon" style="font-size: 0.9rem;"></i>
                  </button>
                </template>
              </BaseInput>
            </div>
          </div>
          <!-- Botones de Acción -->
          <div class="row g-2 mt-auto pt-2">
            <div class="col-12 col-md-6">
              <button
                class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-2 fw-medium"
                @click="clearFilters"
              >
                Limpiar Todos los filtros
              </button>
            </div>
            <div class="col-12 col-md-6">
              <button
                :class="[BUTTONS.new.class, 'w-100 d-flex align-items-center justify-content-center gap-2']"
                @click="applyFilters"
              >
                Aplicar filtro de fecha
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Columna Derecha (75%): Tabs + Tab Content -->
      <div class="col-12 col-xl-8 d-flex flex-column h-100 overflow-hidden">
        <!-- Tabs Pill -->
        <ScrollableTabs
          :tabs="analyticsTabs"
          :active-tab="activeTabIndex"
          @tab-change="handleTabChange"
        />

        <div
          class="flex-grow-1 bg-white p-4 rounded-4 shadow-sm border overflow-hidden position-relative d-flex flex-column tab-content-wrapper"
        >
          <transition :name="transitionName" mode="out-in">
            <!-- Content: Chats atendidos -->
            <ChatsAnalytics
              v-if="currentTab === 'chats'"
              key="chats"
              :series="chatsSeries"
              :options="chatsOptions"
            />

            <!-- Content: Top de operadores -->
            <div
              v-else-if="currentTab === 'operators'"
              key="operators"
              class="flex-grow-1 d-flex flex-column"
            >
              <OperatorsAnalytics
                v-if="topOperators.length > 0"
                :operators="topOperators as any[]"
              />
              <div
                v-else
                class="h-100 d-flex flex-column align-items-center justify-content-center text-muted py-5"
              >
                <i class="bi bi-people mb-3 display-4 opacity-50"></i>
                <p class="fs-5 fw-medium mb-0">No hay operadores para mostrar</p>
                <p class="small opacity-75">No se encontraron estadísticas para este período</p>
              </div>
            </div>

            <!-- Content: Canjes por niveles -->
            <ExchangesAnalytics
              v-else-if="currentTab === 'coupons'"
              key="coupons"
              :total-exchanges="totalExchanges"
              :exchanges-by-level="exchangesByLevel"
            />
          </transition>
        </div>
      </div>
    </div>

    <!-- Contadores (KPIs) en 4 columnas y 2 filas (8 contadores) -->
    <div class="row g-3 flex-shrink-0 pt-2 pb-3">
      <div
        v-for="kpi in kpis"
        :key="kpi.title"
        class="col-12 col-sm-6 col-md-3 d-flex"
      >
        <div
          class="kpi-pill p-3 bg-white rounded-4 shadow-sm border d-flex align-items-center gap-3 w-100"
          :class="{ 'kpi-highlight': kpi.highlighted }"
        >
          <div class="kpi-icon-container" :style="{ backgroundColor: kpi.color + '20' }">
            <i :class="['bi', kpi.icon]" :style="{ color: kpi.color }"></i>
          </div>
          <div>
            <p class="text-muted small mb-0 fw-medium">{{ kpi.title }}</p>
            <h3 class="h5 mb-0 fw-bold" :style="{ color: kpi.color }">{{ kpi.value }}</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, inject, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { ApexOptions } from 'apexcharts'
import { useAnalytics } from '@/composables/Models/useAnalytics'
import { type PharmacyInterface } from '@/composables/Models/usePharmacy'
import { useUsers } from '@/composables/Models/useUsers'
import { useCookies } from '@/composables/useCookies'
import ScrollableTabs from '@/components/common/ScrollableTabs.vue'
import ChatsAnalytics from '@/components/Pharmacies/ChatsAnalytics.vue'
import OperatorsAnalytics from '@/components/Pharmacies/OperatorsAnalytics.vue'
import ExchangesAnalytics from '@/components/Exchanges/ExchangesAnalytics.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { BUTTONS } from '@/const/buttonConst'

const router = useRouter()
const route = useRoute()
const { getBackOfficeAnalytics, getPharmacyExchangesAnalytics, loading } = useAnalytics()
const { users, getDataUsers } = useUsers()
const { getCookie } = useCookies()

// Inyectar la farmacia provista por el Orchestrator
const pharmacy = inject<Ref<PharmacyInterface | null>>('pharmacyData')

// ─── Operadores ────────────────────────────────────────────────────────────
/** Ref del multiselect; permite seleccionar un solo operador a la vez */
const selectedOperator = ref<{ id: number | string; label: string; name?: string } | null>(null)

// ─── Fechas de Filtro ────────────────────────────────────────────────────────
const startDate = ref('')
const endDate = ref('')

/** Opciones formateadas con nombre completo para el multiselect */
const operatorOptions = computed(() =>
  users.value.map((u) => ({
    id: u.id,
    label: `${u.first_name} ${u.last_name}`,
    name: `${u.first_name} ${u.last_name}`,
  })),
)

/**
 * Carga los operadores (usuarios) asociados a la farmacia actual.
 */
const loadOperators = async () => {
  if (!route.params.id_pharmacy) return
  await getDataUsers(1, '', { id_pharmacy: route.params.id_pharmacy, limit: 100 })
}

const currentTab = ref('chats')
const transitionName = ref('slide-left')

const tabsOrder = ['chats', 'operators', 'coupons']
const analyticsTabs = [
  { label: 'Chats atendidos', path: 'chats' },
  { label: 'Top de operadores', path: 'operators' },
  { label: 'Cupones canjeados', path: 'coupons' },
]

const activeTabIndex = computed(() => tabsOrder.indexOf(currentTab.value))

const handleTabChange = (index: number) => {
  currentTab.value = tabsOrder[index]
}

watch(currentTab, (newTab, oldTab) => {
  const newIndex = tabsOrder.indexOf(newTab)
  const oldIndex = tabsOrder.indexOf(oldTab)
  transitionName.value = newIndex > oldIndex ? 'slide-left' : 'slide-right'
})

const goBack = () => {
  router.go(-1)
}

const logout = () => {
  console.log('Cerrando sesión...')
}

// Mock Data para KPIs (Inicialmente en 0)
const kpis = ref([
  { title: 'Chats atendidos hoy', value: '0', icon: 'bi-chat-left-text-fill', color: '#0d6efd', highlighted: false },
  { title: 'Chats del Mes', value: '0', icon: 'bi-calendar-check-fill', color: '#ffc107', highlighted: false },
  { title: 'Operadores Activos', value: '0', icon: 'bi-people-fill', color: '#198754', highlighted: false },
  { title: 'Total General de Canjes', value: '0', icon: 'bi-arrow-left-right', color: '#0d6efd', highlighted: false },
  { title: 'Total Chats Creados', value: '0', icon: 'bi-chat-right-text-fill', color: '#dc3545', highlighted: false },
  { title: 'Total Chats Resueltos', value: '0', icon: 'bi-check-circle-fill', color: '#20c997', highlighted: false },
  { title: 'Total Chats Activos', value: '0', icon: 'bi-chat-dots-fill', color: '#fd7e14', highlighted: false },
  { title: 'Tiempo de Respuesta', value: '0 min', icon: 'bi-clock-fill', color: '#6610f2', highlighted: false },
])

/**
 * Updates a KPI's value and triggers a highlight effect if the value changed.
 */
const updateKpiValue = (title: string, newValue: string) => {
  const kpi = kpis.value.find(k => k.title === title)
  if (kpi) {
    if (kpi.value !== newValue) {
      kpi.value = newValue
      kpi.highlighted = true
      setTimeout(() => {
        kpi.highlighted = false
      }, 1000)
    }
  }
}

// Mock Data para Gráfico de Chats
const chatsSeries = ref([
  {
    name: 'Chats',
    data: [31, 40, 28, 51, 42, 109, 100],
  },
])

const chatsOptions = ref<ApexOptions>({
  chart: {
    id: 'chats-analytics-chart',
    fontFamily: 'inherit',
    zoom: { enabled: false },
    toolbar: { show: false },
  },
  colors: ['#0d6efd'],
  stroke: { curve: 'smooth' as const, width: 4 },
  xaxis: {
    categories: [
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
    ],
  },
  tooltip: { theme: 'light' },
  grid: { borderColor: '#f8f9fa' },
})

// Mock Data para Top Operadores (campos alineados con el API y la interfaz del componente)
const topOperators = ref([
  { name: 'Ana M.',    position: 1, chats_count: 145, url_image: 'https://i.pravatar.cc/150?u=ana' },
  { name: 'Juan P.',   position: 2, chats_count: 132, url_image: 'https://i.pravatar.cc/150?u=juan' },
  { name: 'Maria G.',  position: 3, chats_count: 118, url_image: 'https://i.pravatar.cc/150?u=maria' },
  { name: 'Luis R.',   position: 4, chats_count: 95,  url_image: 'https://i.pravatar.cc/150?u=luis' },
  { name: 'Pedro S.',  position: 5, chats_count: 88,  url_image: 'https://i.pravatar.cc/150?u=pedro' },
  { name: 'Lucia F.',  position: 6, chats_count: 75,  url_image: 'https://i.pravatar.cc/150?u=lucia' },
])


// Datos reactivos para Canjes por Farmacia
const totalExchanges = ref(0)
const exchangesByLevel = ref<Array<{ label: string; value: number }>>([])

/**
 * Inicializa los datos de analítica desde el servidor.
 */
const initAnalytics = async () => {
  const code_user = getCookie('fsi_admin_code_user')

  if (!pharmacy?.value || !code_user) {
    console.warn('Faltan datos requeridos para la analítica (pharmacy o code_user)')
    return
  }

  const id_operator = selectedOperator.value?.id ? String(selectedOperator.value.id) : undefined

  const data = await getBackOfficeAnalytics(
    pharmacy.value.code,
    code_user,
    id_operator,
    startDate.value,
    endDate.value,
  )
  if (data) {
    // Mapeo de KPIs con efecto de transición
    updateKpiValue('Chats atendidos hoy', String(data.chats_today ?? 0))
    updateKpiValue('Chats del Mes', String(data.chats_month ?? 0))
    updateKpiValue('Operadores Activos', String(data.active_operators ?? 0))
    updateKpiValue('Tiempo de Respuesta', `${data.avg_response_time_minutes ?? 0} min`)
    updateKpiValue('Total Chats Creados', String(data.total_chats_created ?? 0))
    updateKpiValue('Total Chats Resueltos', String(data.total_chats_resolved ?? 0))
    updateKpiValue('Total Chats Activos', String(data.total_chats_active ?? 0))

    // Mapeo de Gráfico de Chats Anual
    if (data.chats_year) {
      const monthNames = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ]
      const yearValues = monthNames.map((month) => data.chats_year[month] || 0)
      chatsSeries.value[0].data = yearValues
    }

    // Mapeo de Operadores
    if (data.top_operators) {
      topOperators.value = data.top_operators
    }
  }
}

/**
 * Inicializa los datos de canjes por farmacia desde el servidor.
 */
const initExchangesAnalytics = async () => {
  if (!pharmacy?.value?.id) {
    console.warn('Falta el ID de farmacia para cargar analytics de canjes')
    return
  }

  const data = await getPharmacyExchangesAnalytics(
    pharmacy.value.id,
    startDate.value,
    endDate.value,
  )
  if (data) {
    totalExchanges.value = data.total_exchanges ?? 0
    updateKpiValue('Total General de Canjes', String(data.total_exchanges ?? 0))
    exchangesByLevel.value = data.exchanges_by_level ?? []
  }
}

/**
 * Aplica los filtros de fecha seleccionados para actualizar toda la analítica.
 */
const applyFilters = () => {
  initAnalytics()
  initExchangesAnalytics()
}

/**
 * Limpia todos los filtros y recarga la analítica.
 */
const clearFilters = () => {
  selectedOperator.value = null
  startDate.value = ''
  endDate.value = ''
  lastSelectedId.value = ''
  applyFilters()
}

// Los filtros se aplican manualmente haciendo clic en el botón "Aplicar"

onMounted(() => {
  initAnalytics()
  initExchangesAnalytics()
  loadOperators()
})

// Carga reactiva de datos si el inject de pharmacy llega tarde
watch(
  () => pharmacy?.value?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      initAnalytics()
      initExchangesAnalytics()
    }
  },
)

const lastSelectedId = ref('')

watch(
  selectedOperator,
  (newVal) => {
    const currentId = newVal?.id ? String(newVal.id) : ''
    if (currentId !== lastSelectedId.value) {
      lastSelectedId.value = currentId
      initAnalytics()
    }
  },
  { deep: true },
)
</script>

<style scoped>
.kpi-pill {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 1.5s ease,
    border-color 1.5s ease;
  cursor: default;
}

.kpi-pill.kpi-highlight {
  background-color: rgba(0, 177, 0, 0.1) !important;
  border-color: rgba(0, 177, 0, 0.3) !important;
  transition: none !important;
}

.kpi-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

.kpi-icon-container {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.kpi-icon-container i {
  font-size: 1.5rem;
}

.extra-small {
  font-size: 0.75rem;
}

.min-h-0 {
  min-height: 0;
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

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.tab-content-wrapper {
  min-height: 350px;
}

@media (max-width: 1200px) {
  .overflow-hidden {
    overflow: auto !important;
  }
  .h-100 {
    height: auto !important;
  }
}
</style>
