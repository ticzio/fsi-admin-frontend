<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import NewNotificationModal from './New.vue'
import ShowNotificationModal from '@/components/notification/Show.vue'

import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'

import { useLogger } from '@/composables/useLogger'
//Importaciones de constantes para componentes
import {
  TITLE_SECTION_COMPONENT,
  TABLE_HEADERS,
  TABLE_ACTIONS,
  TABLE_PAGINATION,
} from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { URLS } from '@/const/api'
import titleSection from '@/components/common/titleSection.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'

const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const logger = useLogger()

const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const query = ref('')

// Estado para las notificaciones
const notifications = ref([])
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'notifications-list'

// Estados para modales
const showNewModal = ref(false)
const showDetailsModal = ref(false)
const selectedItem = ref<any>(null)

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    openDetailsModal(item)
  }
}

const getNotifications = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    active: null,
  }
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: URLS.notification.getAll,
      params,
    })

    if (response.code === 200) {
      logger.logRequest(URLS.notification.getAll, params, response)
      notifications.value = response.data.data
      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.notification.getAll, params, error)
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

  getNotifications()
}

// Funciones para modales
const openNewModal = () => {
  showNewModal.value = true
}

const openDetailsModal = (item: any) => {
  selectedItem.value = item
  showDetailsModal.value = true
}

const handleSaved = () => {
  getNotifications()
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getNotifications()
})
</script>

<template>
  <DashboardLayout>
    <div class="container-fluid">
      <!-- Modales -->
      <NewNotificationModal
        :show="showNewModal"
        @close="showNewModal = false"
        @saved="handleSaved"
      />

      <ShowNotificationModal
        :show="showDetailsModal"
        :notificationData="selectedItem"
        @close="showDetailsModal = false"
      />

      <!-- Título de sección -->
      <titleSection
        :title="TITLE_SECTION_COMPONENT.notification.title"
        :description="TITLE_SECTION_COMPONENT.notification.description"
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
              @click="getNotifications()"
            >
              <i :class="BUTTONS.search.icon"></i>
            </span>
            <input
              type="text"
              class="form-control border-radius-right"
              placeholder="Título o mensaje"
              aria-label="Search"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="query"
              @keyup.enter="getNotifications()"
            />
          </div>
        </div>
        <div class="col-md-1">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click=";((query = ''), getNotifications())"
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>
        </div>
        <div class="col-12 col-md-7">
          <div class="col mb-0 gap-2 d-flex align-items-end justify-content-end">
            <button
              @click="openNewModal()"
              :class="BUTTONS.new.class"
              :data-title="BUTTONS_TOOLTIPS.notification.tooltipTitle"
              :data-tooltip-pos="BUTTONS.new.tooltipPos"
            >
              <i :class="BUTTONS.new.icon"></i>
              <span v-if="!isMobile">
                {{ BUTTONS_TOOLTIPS.notification.tooltipTitle }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="notifications"
          :headers="TABLE_HEADERS.notification"
          :actions="[TABLE_ACTIONS.edit]"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          @change-page="handlePageChange"
          :is-loading="isLoading"
          @action-click="handleTableAction"
        >
          <template #cell(title)="{ value }">
            <div class="truncate-cell text-fw-bold">{{ value }}</div>
          </template>
          <template #cell(message)="{ value }">
            <div class="truncate-cell">{{ value }}</div>
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.truncate-cell {
  max-width: 250px;
  max-height: 3rem;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  text-align: center;
  white-space: normal;
  word-break: break-word;
}
</style>
