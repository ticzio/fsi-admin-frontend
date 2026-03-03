<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import CustomTable from '@/components/common/CustomTable.vue'
import ServiceHistoricalDetailModal from './ServiceHistoricalDetailModal.vue'
import ServiceHistoricalFormModal from '@/components/concessionaire/ServiceHistoricalFormModal.vue'

import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
//Importaciones de constantes para componentes
import { TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { URLS } from '@/const/api'

const route = useRoute()
const swalToast = useSwalToast()
const store = useStore()
const logger = useLogger()
const isMobile = computed(() => store.getters.isMobile)
const idConcessionaire = computed(() => route.params.id_concessionaire as string)
const isLoading = ref(false)
const query = ref('')

// Estado para los registros de historial
const serviceHistoricalList = ref([])
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'concessionaire-service-historical-list'

// Estado para modal de creación
const showFormModal = ref(false)

// Estado para modal de detalle
const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

// Solo acción de ver detalles
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

const getServiceHistorical = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    id_concessionaire: route.params.id_concessionaire,
  }

  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: URLS.serviceHistorical.getAll,
      params,
    })

    if (response.code === 200) {
      logger.logRequest(URLS.serviceHistorical.getAll, params, response)
      serviceHistoricalList.value = response.data.data
      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.serviceHistorical.getAll, params, error)
    swalToast.showError(ERROR.errorGet)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getServiceHistorical()
}

// Función para modal de detalle
const openDetailModal = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getServiceHistorical()
})
</script>

<template>
  <div class="container-fluid">
    <!-- Modal de creación -->
    <ServiceHistoricalFormModal
      :show="showFormModal"
      @close="showFormModal = false"
      @saved="getServiceHistorical"
    />

    <!-- Modal de detalle -->
    <ServiceHistoricalDetailModal
      :show="showDetailModal"
      :serviceData="selectedItem"
      @close="showDetailModal = false"
    />

    <!-- Fila de filtros -->
    <div class="row mb-4 align-items-end g-3">
      <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
        <label for="">Buscar por:</label>
        <div class="input-group rounded-pill">
          <span
            :class="BUTTONS.search.class"
            id="basic-addon1"
            style="cursor: pointer"
            @click="getServiceHistorical()"
          >
            <i :class="BUTTONS.search.icon"></i>
          </span>
          <input
            type="text"
            class="form-control border-radius-right"
            placeholder="Código o cliente"
            aria-label="Search"
            aria-describedby="basic-addon1"
            inputmode="search"
            enterkeyhint="search"
            v-model="query"
            @keyup.enter="getServiceHistorical()"
          />
        </div>
      </div>
      <div class="col-md-1">
        <button
          :class="BUTTONS.filter.class"
          :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
          :data-tooltip-pos="BUTTONS.filter.tooltipPos"
          @click=";((query = ''), getServiceHistorical())"
        >
          <i :class="BUTTONS.filter.icon"></i>
        </button>
      </div>
      <div class="col d-flex align-items-end justify-content-end">
        <button
          :class="BUTTONS.new.class"
          :data-title="'Registrar Historial de Servicio'"
          :data-tooltip-pos="BUTTONS.new.tooltipPos"
          @click="showFormModal = true"
        >
          <i :class="BUTTONS.new.icon"></i>
          <span class="d-none d-md-inline">Registrar Servicio</span>
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="container-fluid border rounded-4 mt-2">
      <CustomTable
        :data="serviceHistoricalList"
        :headers="TABLE_HEADERS.serviceHistorical"
        :actions="getTableActions"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @change-page="handlePageChange"
        :is-loading="isLoading"
        @action-click="handleTableAction"
      >
        <template #cell(points_awarded)="{ value }">
          <span
            class="badge rounded-3 px-3 py-2 text-uppercase fw-medium d-inline-flex align-items-center gap-2 fs-6"
            :class="
              value > 0 ? 'bg-success  border border-success' : 'bg-danger  border border-danger'
            "
          >
            {{ value > 0 ? '+' : '' }}{{ Math.trunc(Number(value)) }}

            <i
              class="fs-5"
              :class="value > 0 ? 'bi bi-arrow-up-circle' : 'bi bi-arrow-down-circle'"
            ></i>
          </span>
        </template>
        <template #cell(service_date)="{ value }">
          <span v-format-date="value"></span>
        </template>
      </CustomTable>
    </div>
  </div>
</template>
