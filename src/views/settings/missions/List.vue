<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import RedirectButton from '@/components/common/RedirectButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AppImage from '@/components/common/AppImage.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

//Composables
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useTableActions } from '@/composables/useTableActions'
import { useMissions } from '@/composables/Models/useMissions'

//Components
import Modal from '@/components/common/Modal.vue'
import MissionForm from '@/components/Missions/MissionForm.vue'

import { TITLE_SECTION_COMPONENT, TABLE_HEADERS } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS } from '@/const/buttonConst'

const router = useRouter()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const { getDefaultSafeActions } = useTableActions()
const {
  loading,
  missions,
  pagination,
  paginationKey,
  getDataMissions,
  deactivateMission,
  deleteMission,
} = useMissions()

const search = ref('')
const missionModalRef = ref<any>(null)
const missionFormRef = ref<any>(null)
const selectedMission = ref<any>(null)

const swalToast = useSwalToast()

const handleUpdateMission = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const success = await missionFormRef.value?.handleSubmit()
    if (success) {
      missionModalRef.value?.closeModal()
      // Forzamos el refresco en la instancia local de useMissions
      await getDataMissions(pagination.currentPage, search.value)
    }
  } catch (error) {
    console.error('Error al actualizar la misión:', error)
  } finally {
    loading.value = false
  }
}

const handleTableAction = async ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    selectedMission.value = item
    missionModalRef.value?.openModal()
  } else if (actionName === 'deactivate') {
    await deactivateMission(item)
  } else if (actionName === 'delete') {
    await deleteMission(item)
  }
}

const getTableActions = async (item: any) => {
  return getDefaultSafeActions()
}

const handleTablePagination = async (page: number) => {
  await getDataMissions(page, search.value)
  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })
}

const goToNew = () => {
  // router.push({ name: 'Nueva Misión' })
}

const clearFilters = () => {
  search.value = ''
  fetchData()
}

const fetchData = async () => {
  await getDataMissions(1, search.value)
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  const savedPage = savedPageGetter(paginationKey)
  pagination.currentPage = savedPage
  getDataMissions(savedPage, search.value)
})
</script>

<template>
  <DashboardLayout>
    <div class="d-flex flex-column h-100">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.missions.title"
        :description="TITLE_SECTION_COMPONENT.missions.description"
        :show-logo="true"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4">
          <SearchInput
            id="missions-search"
            v-model="search"
            label="Buscar por:"
            placeholder="Nombre o descripción"
            :loading="loading"
            :infoTexts="['Puedes buscar por nombre de la misión', 'O por descripción']"
            @search="fetchData"
          />
        </div>

        <div
          class="col-12 col-md d-flex flex-md-row gap-2 align-items-stretch align-items-md-end justify-content-md-end mt-1 mt-md-0"
        >
          <FetchButton @fetch="clearFilters" />
          <!-- 
          <RedirectButton
            :tooltip-title="BUTTONS_TOOLTIPS.missions.tooltipTitle"
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
          :data="missions"
          :headers="TABLE_HEADERS.missions"
          :actions="getTableActions"
          :is-loading="loading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          :change-page="handleTablePagination"
          @change-page="handleTablePagination"
          @action-click="handleTableAction"
        >
          <template #cell(url_image)="{ item }">
            <div class="d-flex justify-content-center py-1">
              <AppImage
                :src="item.url_image"
                :alt="item.name"
                type="entity"
                width="120px"
                height="100px"
                rounded="rounded-3 shadow-sm border"
              />
            </div>
          </template>
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" />
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>

  <Modal id="mission-modal" ref="missionModalRef" title="Detalles de la misión" size="lg">
    <MissionForm v-if="selectedMission" ref="missionFormRef" :mission="selectedMission" />

    <template #footer>
      <button
        type="button"
        class="btn btn-primary fw-bold text-white"
        @click="handleUpdateMission"
        :disabled="loading"
      >
        <LoadingSpinner v-if="loading" class="me-1" />
        Actualizar
      </button>
    </template>
  </Modal>
</template>
