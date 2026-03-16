<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FetchButton from '@/components/common/FetchButton.vue'
import RedirectButton from '@/components/common/RedirectButton.vue'
import Modal from '@/components/common/Modal.vue'
import NewsForm from '@/components/News/NewsForm.vue'

//Composables
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useTableActions } from '@/composables/useTableActions'

import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS } from '@/const/buttonConst'
import { URLS } from '@/const/api'

interface Item {
  id: string | number
  [key: string]: any
}

const router = useRouter()
const swalToast = useSwalToast()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const { getDefaultActions } = useTableActions()

const loading = ref(false)
const news = ref<any>([])
const search = ref('')

const paginationKey = 'news-list'
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

// === Modal & Form Logic ===
const formModal = ref<InstanceType<typeof Modal> | null>(null)
const isEditingForm = ref(false)
const formData = ref<any>(null)
const newsFormRef = ref<InstanceType<typeof NewsForm> | null>(null)

const openModal = (isEdit = false, data = null) => {
  isEditingForm.value = isEdit
  formData.value = data
  formModal.value?.openModal()
}

const handleFormSubmit = async (data: any) => {
  await saveNewOrUpdate(data)
}

const saveNewOrUpdate = async (data: any) => {
  loading.value = true
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('title', data.title)
    formDataToSend.append('body', data.content)

    if (data.imageFile) {
      formDataToSend.append('url_image', data.imageFile)
    }

    let response: any
    if (isEditingForm.value && formData.value?.id) {
      response = await store.dispatch('updateData', {
        url: URLS.news.update,
        id: formData.value.id,
        data: formDataToSend,
      })
    } else {
      response = await store.dispatch('createData', {
        url: URLS.news.save,
        data: formDataToSend,
      })
    }

    if (response.code === 200 || response.code === 201) {
      swalToast.showSuccess(
        isEditingForm.value ? 'Noticia actualizada correctamente' : 'Noticia creada correctamente',
      )
      formModal.value?.closeModal()
      getDataNews(pagination.currentPage)
    } else {
      swalToast.showError(response.message || 'Error al guardar la noticia')
    }
  } catch (error: any) {
    console.error('Error saving news:', error)
    swalToast.showError(error.message || 'Error de conexión al guardar la noticia')
  } finally {
    loading.value = false
  }
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    openModal(true, item)
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
  getDataNews(page)
}

const goToNew = () => {
  openModal(false, null)
}

const getDataNews = async (page = 1) => {
  loading.value = true
  try {
    const response: any = await store.dispatch('getData', {
      url: URLS.news.getAll,
      params: {
        page: page,
        limit: pagination.limit,
        //search: search.value,
      },
    })

    if (response.code === 200) {
      news.value = response.data
      pagination.totalPages = response.meta.last_page
      pagination.currentPage = response.meta.current_page
    } else {
      swalToast.showError(response.message || 'Error al obtener las noticias')
    }
  } catch (error: any) {
    console.error('Error fetching news:', error)
    swalToast.showError(error.message || 'Error de conexión al obtener las noticias')
  } finally {
    loading.value = false
  }
}

const fetchData = () => {
  getDataNews(1)
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  const savedPage = savedPageGetter(paginationKey)
  pagination.currentPage = savedPage || 1
  getDataNews(pagination.currentPage)
})
</script>

<template>
  <DashboardLayout>
    <div class="d-flex flex-column h-100">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.news.title"
        :description="TITLE_SECTION_COMPONENT.news.description"
        :show-logo="true"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4">
          <SearchInput
            id="news-search"
            v-model="search"
            label="Buscar por:"
            placeholder="Título de la noticia"
            :loading="loading"
            :infoTexts="['Puedes buscar por título', 'O por descripción de la noticia']"
          />
        </div>

        <div
          class="col-12 col-md d-flex flex-md-row gap-2 align-items-stretch align-items-md-end justify-content-md-end mt-1 mt-md-0"
        >
          <FetchButton @fetch="fetchData" />
          <RedirectButton :tooltip-title="BUTTONS_TOOLTIPS.news.tooltipTitle" @redirect="goToNew" />
        </div>
      </div>

      <div
        :class="{
          'container-fluid mt-2 border rounded-4 flex-grow-1 d-flex flex-column p-0 bg-white overflow-hidden':
            !isMobile,
        }"
      >
        <CustomTable
          :data="news"
          :headers="TABLE_HEADERS.news"
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

      <!-- Componente Modal para el Formulario de Noticia -->
      <Modal
        id="newsFormModal"
        ref="formModal"
        size="xl"
        :title="isEditingForm ? 'Editar Noticia' : 'Crear Nueva Noticia'"
        :scrollable="true"
      >
        <NewsForm
          v-if="formModal"
          ref="newsFormRef"
          :is-editing="isEditingForm"
          :initial-data="formData"
          @submit="handleFormSubmit"
          @cancel="formModal?.closeModal()"
        />
        <template #footer>
          <div class="d-flex justify-content-end gap-3 w-100">
            <button
              type="button"
              class="btn btn-outline-secondary px-4 rounded-3 shadow-sm fw-medium"
              @click="formModal?.closeModal()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary px-4 rounded-3 text-white fw-bold shadow-sm d-flex align-items-center"
              @click="newsFormRef?.handleSubmit()"
            >
              <i class="bi bi-save me-2"></i>
              {{ isEditingForm ? 'Guardar Cambios' : 'Crear Noticia' }}
            </button>
          </div>
        </template>
      </Modal>
    </div>
  </DashboardLayout>
</template>
