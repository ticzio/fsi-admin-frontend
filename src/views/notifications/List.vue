<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import RedirectButton from '@/components/common/RedirectButton.vue'
import Modal from '@/components/common/Modal.vue'
import NotificationForm from '@/components/Notifications/NotificationForm.vue'
import NotificationDetails from '@/components/Notifications/NotificationDetails.vue'

// Composables
import { useNotification } from '@/composables/Models/useNotification'
import { useStore } from 'vuex'
import { TABLE_ACTIONS } from '@/const/tableConst'

import { TITLE_SECTION_COMPONENT, TABLE_HEADERS } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS } from '@/const/buttonConst'

interface Item {
  id: string | number
  title: string
  description: string
  type_notification?: string
  type?: string
  active?: boolean
  [key: string]: any
}

const newNotificationModalRef = ref<InstanceType<typeof Modal> | null>(null)
const viewNotificationModalRef = ref<InstanceType<typeof Modal> | null>(null)
const modalMode = ref<'create' | 'view'>('create')
const selectedNotification = ref<Item | null>(null)

const store = useStore()
const isMobile = computed(() => store.getters.isMobile)

const {
  loading,
  notifications: items,
  pagination,
  paginationKey,
  getDataNotifications,
  saveNotification,
  deleteNotification,
} = useNotification()

const search = ref('')

const getTableActions = async (_item: any) => {
  return [TABLE_ACTIONS.edit, TABLE_ACTIONS.delete]
}

const handleTableAction = async ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    selectedNotification.value = item
    viewNotificationModalRef.value?.openModal()
  } else if (actionName === 'delete') {
    await deleteNotification(item)
  }
}

const handleTablePagination = async (page: number) => {
  pagination.currentPage = page
  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })
  await getDataNotifications(page, search.value)
}

const goToNew = () => {
  newNotificationModalRef.value?.openModal()
}

const clearFilters = () => {
  search.value = ''
  fetchData()
}

const fetchData = async () => {
  pagination.currentPage = 1
  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: 1,
  })
  await getDataNotifications(1, search.value)
}

const handleNotificationSubmit = async (formData: any) => {
  const success = await saveNotification(formData, false)
  if (success) {
    newNotificationModalRef.value?.closeModal()
  }
}

onMounted(async () => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey) || 1
  await getDataNotifications(pagination.currentPage, search.value)
})
</script>

<template>
  <DashboardLayout>
    <div class="d-flex flex-column h-100">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.notifications.title"
        :description="TITLE_SECTION_COMPONENT.notifications.description"
        :show-logo="true"
      />

      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4">
          <SearchInput
            id="notification-search"
            v-model="search"
            label="Buscar por:"
            placeholder="Título de la notificación"
            :loading="loading"
            :infoTexts="['Puedes buscar por título', 'O por descripción de la notificación']"
            @search="fetchData"
            only-on-enter
          />
        </div>

        <div
          class="col-12 col-md d-flex flex-md-row gap-2 align-items-stretch align-items-md-end justify-content-md-end mt-1 mt-md-0"
        >
          <FetchButton @fetch="clearFilters" />
          <RedirectButton
            :tooltip-title="BUTTONS_TOOLTIPS.notification.tooltipTitle"
            @redirect="goToNew"
          />
        </div>
      </div>

      <!-- Tabla -->
      <div
        :class="{
          'container-fluid mt-2 border rounded-4 flex-grow-1 d-flex flex-column p-0 bg-white overflow-hidden':
            !isMobile,
        }"
      >
        <CustomTable
          :data="items"
          :headers="TABLE_HEADERS.notifications"
          :actions="getTableActions"
          :is-loading="loading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          :change-page="handleTablePagination"
          @change-page="handleTablePagination"
          @action-click="handleTableAction"
        >
          <template #cell(audience)="{ item }">
            <span class="badge bg-light text-dark border py-1 px-2 rounded-pill">
              <span v-if="item.type_city?.name">Ciudad {{ item.type_city.name }}</span>
              <span v-if="item.level?.name">Nivel {{ item.level.name }}</span>
              <span v-if="!item.type_city?.name && !item.level?.name">General</span>
            </span>
          </template>
          <template #cell(created_at)="{ value }">
            <span v-format-date-time="value"></span>
          </template>
        </CustomTable>
      </div>

      <!-- Modal: Nueva Notificación -->
      <Modal
        id="newNotificationModal"
        ref="newNotificationModalRef"
        size="lg"
        title="Nueva Notificación"
        :scrollable="true"
      >
        <NotificationForm
          v-if="newNotificationModalRef"
          @submit="handleNotificationSubmit"
          @close="newNotificationModalRef?.closeModal()"
        />
      </Modal>

      <!-- Modal: Detalles de Notificación -->
      <Modal
        id="viewNotificationModal"
        ref="viewNotificationModalRef"
        size="lg"
        title="Detalles de la Notificación"
        :scrollable="true"
      >
        <NotificationDetails
          v-if="viewNotificationModalRef"
          :notification="selectedNotification"
          @close="viewNotificationModalRef?.closeModal()"
        />
      </Modal>
    </div>
  </DashboardLayout>
</template>
