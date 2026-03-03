<script setup lang="ts">
import { ref, reactive, computed, inject, onMounted, type Ref } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'

import { TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

interface Item {
  id: string | number
  [key: string]: any
}

const route = useRoute()
const store = useStore()
const swalToast = useSwalToast()
const logger = useLogger()

// ID del cliente obtenido desde la ruta
const idClient = ref<string | null>(null)

// Puntos del cliente proporcionados por el Orchestrator
interface ClientPointsData {
  total_points: number | null
  total_in: number | null
  total_out: number | null
}
const clientPointsData = inject<Ref<ClientPointsData>>('clientPointsData')
const totalPoints = computed(() => clientPointsData?.value?.total_points ?? null)
const totalIn = computed(() => clientPointsData?.value?.total_in ?? null)
const totalOut = computed(() => clientPointsData?.value?.total_out ?? null)

// Datos
const auditList = ref<any[]>([])
const isLoading = ref(false)

// Paginación
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

// Obtener auditoría de puntos del cliente
const getAuditList = async (page: number = pagination.currentPage) => {
  isLoading.value = true
  try {
    const payload = {
      params: {
        id_client: idClient.value,
        page,
        limit: pagination.limit,
      },
    }
    const response = await store.dispatch('getData', {
      url: URLS.point.getAll,
      ...payload,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.point.getAll, payload, response)
      auditList.value = response.data?.data || response.data || []
      pagination.currentPage = page
      pagination.totalPages = response.data?.meta?.last_page || TABLE_PAGINATION.totalPages
    }
  } catch (error: any) {
    logger.logRequest(URLS.point.getAll, { id_client: idClient.value }, error)
    swalToast.showError(`${ERROR.errorGet} auditoría de puntos`)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  getAuditList(page)
}

onMounted(() => {
  idClient.value = (route.params.id_client_points ?? route.params.id) as string
  getAuditList()
})
</script>

<template>
  <div class="container-fluid mt-4">
    <!-- Resumen de puntos -->
    <div v-if="totalPoints !== null || totalIn !== null || totalOut !== null" class="row g-3 mb-4">
      <!-- Puntos de entrada -->
      <div class="col-12 col-md-4">
        <div
          class="d-flex align-items-center gap-3 px-4 py-3 rounded-4 bg-success bg-opacity-10 border border-success"
        >
          <i class="bi bi-arrow-up-circle-fill text-success fs-3"></i>
          <div class="d-flex flex-column">
            <small class="text-muted fw-medium">K. de beneficios de entrada</small>
            <span class="fw-bold fs-5 text-success">
              {{ totalIn !== null ? `+${Math.trunc(totalIn).toLocaleString()} ` : '—' }}
            </span>
          </div>
        </div>
      </div>
      <!-- Puntos de salida -->
      <div class="col-12 col-md-4">
        <div
          class="d-flex align-items-center gap-3 px-4 py-3 rounded-4 bg-danger bg-opacity-10 border border-danger"
        >
          <i class="bi bi-arrow-down-circle-fill text-danger fs-3"></i>
          <div class="d-flex flex-column">
            <small class="text-muted fw-medium">K. de beneficios de salida</small>
            <span class="fw-bold fs-5 text-danger">
              {{ totalOut !== null ? `-${Math.trunc(totalOut).toLocaleString()} ` : '—' }}
            </span>
          </div>
        </div>
      </div>
      <!-- Total de puntos -->
      <div class="col-12 col-md-4">
        <div
          class="d-flex align-items-center gap-3 px-4 py-3 rounded-4 bg-warning bg-opacity-10 border border-warning"
        >
          <i class="fa-solid fa-star text-warning fs-3"></i>
          <div class="d-flex flex-column">
            <small class="text-muted fw-medium">Total de K. de beneficios</small>
            <span class="fw-bold fs-5 text-warning-emphasis">
              {{ totalPoints !== null ? `${Math.trunc(totalPoints).toLocaleString()} ` : '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de auditoría de puntos -->
    <div class="border rounded-4 mt-2">
      <CustomTable
        :data="auditList"
        :headers="TABLE_HEADERS.clientAudit"
        :is-loading="isLoading"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :limit="pagination.limit"
        @change-page="handlePageChange"
      >
        <template #cell(point)="{ value }">
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
        <template #cell(type)="{ value }">
          <span
            class="adge rounded-3 px-3 py-2 text-uppercase fw-medium d-inline-flex align-items-center gap-2 fs-6 bg-info-subtle text-info-emphasis border border-info"
            :class="
              value === 'IN'
                ? 'text-emphasis-success border border-success'
                : 'text-emphasis-danger border border-danger'
            "
          >
            {{ value === 'IN' ? 'Entrada' : 'Salida' }}
          </span>
        </template>

        <!-- Fecha formateada -->
        <template #cell(created_at)="{ value }">
          <span v-format-date="value"></span>
        </template>
      </CustomTable>
    </div>
  </div>
</template>
