<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import ServiceHistoricalDetailModal from '@/views/concessionaire/service_historical/ServiceHistoricalDetailModal.vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useLogger } from '@/composables/useLogger'
import { useSwalToast } from '@/composables/useSwalToast'
import { URLS } from '@/const/api'
import { TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS, BUTTONS_TOOLTIPS } from '@/const/buttonConst'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'

const route = useRoute()
const store = useStore()
const logger = useLogger()
const swalToast = useSwalToast()

const isLoading = ref(false)

// Estado para modal de detalle
const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

// Puntos del cliente proporcionados por el Orchestrator
interface ClientPointsData {
  total_points: number | null
  total_in: number | null
  total_out: number | null
}
const clientPointsData = inject<Ref<ClientPointsData>>('clientPointsData')
const clientPoints = computed(() => clientPointsData?.value?.total_points ?? null)
const serviceHistoricals = ref<any[]>([])
const pagination = ref({ ...TABLE_PAGINATION })

// Filtros
const query = ref('')
const dateFilter = ref('')
const selectedConcessionaire = ref<any>(null)
const concessionaires = ref<any[]>([])

const concessionaireIconMap = computed(() => {
  const map: Record<string, string> = {}
  concessionaires.value.forEach((c: any) => {
    map[c.id] = ICONS_MULTISELECT.concessionaire
  })
  return map
})

const getConcessionaires = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.concessionaire.getAll,
      params: {},
    })
    if (response.code === 200) {
      concessionaires.value = response.data.data || response.data || []
    }
  } catch (error: any) {
    logger.logRequest(URLS.concessionaire.getAll, {}, error)
  }
}

const getServiceHistoricals = async (page = 1) => {
  const idClient = route.params.id_client

  if (!idClient) {
    swalToast.showError('No se encontró el ID del cliente')
    return
  }

  const url = `${URLS.serviceHistorical.getAll}`
  const params: Record<string, any> = {
    id_client_vehicle: idClient,
    page,
    limit: pagination.value.limit,
  }

  if (query.value) params.query = query.value
  if (dateFilter.value) params.date = dateFilter.value
  if (selectedConcessionaire.value) params.id_concessionaire = selectedConcessionaire.value.id

  try {
    isLoading.value = true
    const response = await store.dispatch('getData', { url, params })

    if (response.code === 200) {
      logger.logRequest(url, params, response)
      const data = response.data
      serviceHistoricals.value = data.data || data || []
      if (data.totalPages !== undefined) {
        pagination.value.totalPages = data.totalPages
      }
      if (data.currentPage !== undefined) {
        pagination.value.currentPage = data.currentPage
      } else {
        pagination.value.currentPage = page
      }
    }
  } catch (error: any) {
    logger.logRequest(url, params, error)
    swalToast.showError('Error al cargar el historial de servicios')
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  getServiceHistoricals(page)
}

const clearFilters = () => {
  query.value = ''
  dateFilter.value = ''
  selectedConcessionaire.value = null
  getServiceHistoricals()
}

// Acción de ver detalles
const getTableActions = () => {
  return [
    {
      name: 'view',
      icon: 'bi-eye fs-5',
      class: 'border-radius-left border-radius-right btn btn-primary fw-medium text-light',
      tooltip: 'Ver detalles',
    },
  ]
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'view') {
    openDetailModal(item)
  }
}

const openDetailModal = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

onMounted(async () => {
  await getConcessionaires()
  await getServiceHistoricals()
})
</script>

<template>
  <div class="mb-5 mt-4">
    <div class="container-fluid position-relative">
      <!-- Modal de detalle -->
      <ServiceHistoricalDetailModal
        :show="showDetailModal"
        :serviceData="selectedItem"
        @close="showDetailModal = false"
      />

      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <!-- Buscar por número de factura o código -->
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <span
              :class="BUTTONS.search.class"
              id="basic-addon1"
              style="cursor: pointer"
              @click="getServiceHistoricals()"
            >
              <i :class="BUTTONS.search.icon"></i>
            </span>
            <input
              type="text"
              class="form-control border-radius-right"
              placeholder="Código"
              aria-label="query"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="query"
              @keyup.enter="getServiceHistoricals()"
            />
          </div>
        </div>

        <!-- Fecha del servicio -->
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
          <label for="dateFilter">Fecha del servicio:</label>
          <input
            id="dateFilter"
            type="date"
            class="form-control rounded-3"
            v-model="dateFilter"
            @change="getServiceHistoricals()"
          />
        </div>

        <!-- Concesionario -->
        <div class="col-12 col-md-3">
          <MultiselectCustom
            key="concessionaire-filter"
            v-model="selectedConcessionaire"
            :options="concessionaires"
            placeholder="Seleccionar concesionario"
            class="border-radius-left border-radius-right"
            label-key="trade_name"
            helper-type="custom"
            icon-key="id"
            :custom-icon-map="concessionaireIconMap"
            show-icons
            :show-descriptions="false"
            @update:modelValue="getServiceHistoricals()"
          />
        </div>

        <!-- Botón limpiar filtros + Puntos del cliente -->
        <div class="col gap-2 d-flex align-items-end justify-content-end">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click="clearFilters()"
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>

          <div
            v-if="clientPoints !== null"
            class="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-warning bg-opacity-10 border border-warning"
          >
            <i class="fa-solid fa-star text-warning"></i>
            <span class="fw-semibold text-warning-emphasis d-flex flex-column align-items-center">
              {{ Math.trunc(clientPoints).toLocaleString() }}
              <small class="text-warning-emphasis">Kilómetros de beneficio</small>
            </span>
          </div>
        </div>
      </div>

      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="serviceHistoricals"
          :headers="TABLE_HEADERS.clientServiceHistorical"
          :actions="getTableActions"
          :is-loading="isLoading"
          @change-page="handlePageChange"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          @action-click="handleTableAction"
        >
          <template #cell(points_awarded)="{ value }">
            <span
              class="badge rounded-3 px-3 py-2 text-uppercase fw-medium d-inline-flex align-items-center gap-2 fs-6 bg-success border border-success"
            >
              {{ Math.trunc(Number(value)) }}+
              <i class="fs-5 bi bi-arrow-up-circle"></i>
            </span>
          </template>
          <template #cell(service_date)="{ value }">
            <span v-format-date="value" class="fw-medium"></span>
          </template>
        </CustomTable>
      </div>
    </div>
  </div>
</template>
