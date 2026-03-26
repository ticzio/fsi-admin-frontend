<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import RedirectButton from '@/components/common/RedirectButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Modal from '@/components/common/Modal.vue'
import NotificationForm from '@/components/Notifications/NotificationForm.vue'
import NotificationDetails from '@/components/Notifications/NotificationDetails.vue'
import UnderConstruction from '@/components/common/UnderConstruction.vue'

//Composables
import { useNotification } from '@/composables/Models/useNotification'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useTableActions } from '@/composables/useTableActions'

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
const modalMode = ref<'create' | 'view'>('create')
const selectedNotification = ref<Item | null>(null)

const router = useRouter()
const swalToast = useSwalToast()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const { getDefaultActions } = useTableActions()

const {
  loading,
  notifications: items,
  pagination,
  paginationKey,
  getDataNotifications,
  saveNotification,
  changeStatusNotification,
} = useNotification()

const search = ref('')

const handleTableAction = async ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    modalMode.value = 'view'
    selectedNotification.value = item
    newNotificationModalRef.value?.openModal()
  } else if (actionName === 'active' || actionName === 'deactive') {
    await changeStatusNotification(item)
  }
}

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
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
  modalMode.value = 'create'
  newNotificationModalRef.value?.openModal()
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
      <div class="mt-4">
        <UnderConstruction />
      </div>
    </div>
  </DashboardLayout>
</template>
