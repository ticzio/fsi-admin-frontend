<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import RedirectButton from '@/components/common/RedirectButton.vue'

//Composables
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useTableActions } from '@/composables/useTableActions'

import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS } from '@/const/buttonConst'
import { URLS } from '@/const/api'

const router = useRouter()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const { getDefaultActions } = useTableActions()

const loading = ref(false)
const cities = ref<any>([])
const search = ref('')

const paginationKey = 'cities-list'
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
  }
}

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTablePagination = (page: number) => {
  pagination.currentPage = page
  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })
}

const goToNew = () => {
  // router.push({ name: 'Nueva Ciudad' })
}

const getDataCities = () => {
  loading.value = true
  store
    .dispatch('getData', {
      url: URLS.city.getAll,
      params: {
        page: pagination.currentPage,
        limit: pagination.limit,
      },
    })
    .then((response: any) => {
      cities.value = response.data
      pagination.totalPages = response.last_page
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)
  getDataCities()
})
</script>

<template>
  <DashboardLayout>
    <div class="d-flex flex-column h-100">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.cities.title"
        :description="TITLE_SECTION_COMPONENT.cities.description"
        :show-logo="true"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4">
          <SearchInput
            id="cities-search"
            v-model="search"
            label="Buscar por:"
            placeholder="Nombre de la ciudad"
            :loading="loading"
            :infoTexts="['Puedes buscar por nombre de la ciudad', 'O por el estado']"
          />
        </div>

        <div
          class="col-12 col-md d-flex flex-md-row gap-2 align-items-stretch align-items-md-end justify-content-md-end mt-1 mt-md-0"
        >
          <FetchButton @fetch="getDataCities" />
          <RedirectButton
            :tooltip-title="BUTTONS_TOOLTIPS.cities.tooltipTitle"
            @redirect="goToNew"
          />
        </div>
      </div>

      <div
        :class="{
          'container-fluid mt-2 border rounded-4 flex-grow-1 d-flex flex-column p-0 bg-white overflow-hidden':
            !isMobile,
        }"
      >
        <CustomTable
          :data="cities"
          :headers="TABLE_HEADERS.cities"
          :actions="getTableActions"
          :is-loading="loading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          :change-page="handleTablePagination"
          @change-page="handleTablePagination"
          @action-click="handleTableAction"
        />
      </div>
    </div>
  </DashboardLayout>
</template>
