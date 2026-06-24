<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AppImage from '@/components/common/AppImage.vue'

//Composables
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useTableActions } from '@/composables/useTableActions'

import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { useClients } from '@/composables/Models/useClients'


const router = useRouter()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const { getDefaultActions } = useTableActions()
const {
  clients,
  loading,
  pagination,
  paginationKey,
  getDataClients,
  deactivateClient,
  deleteClient,
} = useClients()

const search = ref('')

const handleTableAction = async ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    router.push(`/clients/edit/${item.id}`)
  } else if (actionName === 'deactivate') {
    await deactivateClient(item)
  } else if (actionName === 'delete') {
    await deleteClient(item)
  }
}

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTablePagination = (page: number) => {
  getDataClients(page, search.value)
  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })
}

const goToNew = () => {
  router.push({ name: 'Nuevo Cliente' })
}

const clearFilters = () => {
  search.value = ''
  fetchData()
}

const fetchData = () => {
  getDataClients(1, search.value)
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  const savedPage = savedPageGetter(paginationKey)
  if (savedPage) {
    getDataClients(savedPage)
  } else {
    getDataClients()
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="d-flex flex-column h-100">
      <titleSection
        :title="TITLE_SECTION_COMPONENT?.clients?.title || 'Clientes'"
        :description="TITLE_SECTION_COMPONENT?.clients?.description || 'Lista de clientes'"
        :show-logo="true"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4">
          <SearchInput
            id="users-search"
            v-model="search"
            label="Buscar por:"
            placeholder="Nombre, correo o teléfono"
            :loading="loading"
            :infoTexts="[
              'Puedes buscar por nombre completo',
              'Puedes buscar por correo electrónico',
              'O por número de teléfono',
            ]"
            @search="fetchData"
          />
        </div>

        <div
          class="col-12 col-md d-flex flex-md-row gap-2 align-items-stretch align-items-md-end justify-content-md-end mt-1 mt-md-0"
        >
          <FetchButton @fetch="clearFilters" />
          <!--  
          <RedirectButton
            :tooltip-title="BUTTONS_TOOLTIPS?.clients?.tooltipTitle || 'Nuevo cliente'"
            @redirect="goToNew"
          />
          -->
        </div>
      </div>

      <div
        :class="{
          'container-fluid mt-2 border rounded-4 flex-grow-1 d-flex flex-column p-0 bg-white overflow-hidden':
            !isMobile,
        }"
      >
        <CustomTable
          :data="clients"
          :headers="TABLE_HEADERS.clients"
          :actions="getTableActions"
          :is-loading="loading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          :change-page="handleTablePagination"
          @change-page="handleTablePagination"
          @action-click="handleTableAction"
        >
          <template #cell(url_image_light)="{ value }">
            <div class="d-flex justify-content-center">
              <AppImage :src="value" type="user" />
            </div>
          </template>
          <template #cell(active)="{ value, item }">
            <StatusBadge
              v-if="Number(item.failed_attempts ?? item.failed_attemps) >= 5"
              label="Bloqueado"
              variant="badge bg-secondary-subtle text-white fw-medium border border-secondary"
            />
            <StatusBadge v-else :value="value" />
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>
</template>
