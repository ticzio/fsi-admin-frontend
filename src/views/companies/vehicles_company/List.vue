<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import UnderConstruction from '@/components/common/UnderConstruction.vue'
import 'vue-multiselect/dist/vue-multiselect.css'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
//Importaciones de constantes para componentes
import { TABLE_HEADERS, TABLE_ACTIONS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { URLS } from '@/const/api'

interface Item {
  id: string | number
  [key: string]: any
}
const router = useRouter()
const route = useRoute()
const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const query = ref('')

const vehicles = ref([])
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const getVehiclesChangan = async () => {
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: `${URLS.clientVehicle.prefix}/all_vehicles_by_concessionarie/${route.params.id_company}`,
      params: {
        page: pagination.currentPage,
        limit: pagination.limit,
        query: query.value,
        active: null,
      },
    })

    if (response.code === 200) {
      vehicles.value = response.data.data
      pagination.totalPages = response.data.meta.last_page
    }
  } catch (error) {
    console.error(error)
    swalToast.showError(ERROR.errorGet)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  getVehiclesChangan()
}

onMounted(() => {
  //getVehiclesChangan()
})
</script>

<template>
  <div>
    <!-- <UnderConstruction /> -->
    <div class="container-fluid">
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <span
              :class="BUTTONS.search.class"
              id="basic-addon1"
              style="cursor: pointer"
              @click="getVehiclesChangan()"
            >
              <i :class="BUTTONS.search.icon"></i>
            </span>
            <input
              type="text"
              class="form-control border-radius-right"
              placeholder="Nombre o Correo"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="query"
              @keyup.enter="getVehiclesChangan()"
            />
          </div>
        </div>
        <div class="col gap-2 d-flex align-items-end justify-content-end">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click=";((query = ''), getVehiclesChangan())"
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="vehicles"
          :headers="TABLE_HEADERS.vehicle"
          :is-loading="isLoading"
          @change-page="handlePageChange"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
        >
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" />
          </template>
        </CustomTable>
      </div>
    </div>
    <router-view />
  </div>
</template>
