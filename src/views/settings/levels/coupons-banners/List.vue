<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import CustomCardGrid from '@/components/common/CustomCardGrid.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import RedirectButton from '@/components/common/RedirectButton.vue'
import Modal from '@/components/common/Modal.vue'
import CouponForm from '@/components/Coupons/CouponForm.vue'

//Composables
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useTableActions } from '@/composables/useTableActions'

import { TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS } from '@/const/buttonConst'
import { useSwalToast } from '@/composables/useSwalToast'
import { URLS } from '@/const/api'

interface Item {
  id: string | number
  [key: string]: any
}

const router = useRouter()
const store = useStore()
const swalToast = useSwalToast()
const isMobile = computed(() => store.getters.isMobile)
const { getDefaultActions } = useTableActions()

const loading = ref(false)
const coupons = ref<any>([])
const search = ref('')

const couponModalRef = ref<InstanceType<typeof Modal> | null>(null)
const selectedCoupon = ref<Item | null>(null)
const isReadOnly = ref(false)
const couponFormRef = ref<InstanceType<typeof CouponForm> | null>(null)

const paginationKey = 'coupons-banners-list'
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit' || actionName === 'view') {
    selectedCoupon.value = item
    isReadOnly.value = false
    couponModalRef.value?.openModal()
  }
}

const handleCardClick = (item: any) => {
  selectedCoupon.value = item
  isReadOnly.value = false
  couponModalRef.value?.openModal()
}

const getTableActions = (item: any) => {
  return getDefaultActions(item)
}

const handleTablePagination = (page: number) => {
  pagination.currentPage = page
  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })
  getDataCoupons(page)
}

const goToNew = () => {
  selectedCoupon.value = null
  isReadOnly.value = false
  couponModalRef.value?.openModal()
}

const handleFormSubmit = async (data: any) => {
  await saveCoupon(data)
}

const saveCoupon = async (data: any) => {
  loading.value = true
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('name', data.name)
    formDataToSend.append('description', data.description)
    formDataToSend.append('id_level', data.id_level)
    formDataToSend.append('start_date', data.start_date)
    formDataToSend.append('finish_date', data.finish_date)
    formDataToSend.append('active', data.active ? '1' : '0')

    if (data.imageFile) {
      formDataToSend.append('url_img', data.imageFile)
    }

    let response: any
    if (selectedCoupon.value?.id) {
      response = await store.dispatch('updateData', {
        url: URLS.coupon.update,
        id: selectedCoupon.value.id,
        data: formDataToSend,
      })
    } else {
      response = await store.dispatch('createData', {
        url: URLS.coupon.save,
        data: formDataToSend,
      })
    }

    if (response.code === 200 || response.code === 201) {
      swalToast.showSuccess(
        selectedCoupon.value ? 'Cupón actualizado correctamente' : 'Cupón creado correctamente',
      )
      couponModalRef.value?.closeModal()
      getDataCoupons(pagination.currentPage)
    } else {
      swalToast.showError(response.message || 'Error al guardar el cupón')
    }
  } catch (error: any) {
    console.error('Error saving coupon:', error)
    swalToast.showError(error.message || 'Error de conexión al guardar el cupón')
  } finally {
    loading.value = false
  }
}

const getDataCoupons = async (page = 1) => {
  loading.value = true
  try {
    const response: any = await store.dispatch('getData', {
      url: URLS.coupon.getAll,
      params: {
        page: page,
        limit: pagination.limit,
      },
    })

    if (response.code === 200) {
      coupons.value = response.data
      pagination.totalPages = response.meta.last_page
      pagination.currentPage = response.meta.current_page
    } else {
      swalToast.showError(response.message || 'Error al obtener los cupones')
    }
  } catch (error: any) {
    console.error('Error fetching coupons:', error)
    swalToast.showError(error.message || 'Error de conexión al obtener los cupones')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  const savedPage = savedPageGetter(paginationKey)
  pagination.currentPage = savedPage || 1
  getDataCoupons(pagination.currentPage)
})
</script>

<template>
  <div class="d-flex flex-column h-100">
    <!-- Fila de filtros -->
    <div class="row mb-4 align-items-end g-3">
      <div class="col-12 col-md-4">
        <SearchInput
          id="coupons-banners-search"
          v-model="search"
          label="Buscar por:"
          placeholder="Nombre o descripción"
          :loading="loading"
          :infoTexts="['Puedes buscar por título', 'O por descripción']"
        />
      </div>

      <div
        class="col-12 col-md d-flex flex-md-row gap-2 align-items-stretch align-items-md-end justify-content-md-end mt-1 mt-md-0"
      >
        <FetchButton @fetch="getDataCoupons" />
        <RedirectButton
          :tooltip-title="BUTTONS_TOOLTIPS.couponsBanners?.tooltipTitle || 'Nuevo banner de cupón'"
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
      <CustomCardGrid
        :data="coupons"
        :actions="getTableActions"
        :is-loading="loading"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :limit="pagination.limit"
        @change-page="handleTablePagination"
        @action-click="handleTableAction"
        @card-click="handleCardClick"
        title-key="name"
        description-key="description"
        image-key="url_img"
        start-date-key="start_date"
        finish-date-key="finish_date"
        status-key="active"
      />
    </div>

    <Modal
      id="couponFormModal"
      ref="couponModalRef"
      :title="isReadOnly ? 'Ver Cupón' : selectedCoupon ? 'Editar Cupón' : 'Nuevo Cupón'"
      size="xl"
    >
      <CouponForm
        ref="couponFormRef"
        :initialData="selectedCoupon"
        :readOnly="isReadOnly"
        @submit="handleFormSubmit"
      />
      <template #footer>
        <button
          type="button"
          class="btn btn-secondary px-4 me-2"
          @click="couponModalRef?.closeModal()"
        >
          Cerrar
        </button>
        <button
          v-if="!isReadOnly"
          type="button"
          class="btn btn-primary px-4 fw-bold shadow-sm"
          @click="couponFormRef?.handleSubmit()"
        >
          {{ selectedCoupon ? 'Actualizar' : 'Guardar' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
