<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import 'vue-multiselect/dist/vue-multiselect.css'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useTableActions } from '@/composables/useTableActions'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'
//Importaciones de constantes para componentes
import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import defaultNewsImage from '@/assets/images/changan_imagen_default.png'

interface Item {
  id: string | number
  [key: string]: any
}

const swal = useSwal()
const swalToast = useSwalToast()
const router = useRouter()
const route = useRoute()
const store = useStore()
const logger = useLogger()
const { getDefaultActions } = useTableActions()
const { updateIconMaps, clearIconMaps } = useMultiselectIcons()
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)

const news = ref([])
const query = ref('')

// Maqueta de filtro por estatus (activo/inactivo), sin lógica de API
const selectedStatus = ref<Item | null>(null)
const statusOptions = ref<Pick<Item, 'id' | 'name'>[]>([
  { id: 1, name: 'Activos' },
  { id: 0, name: 'Inactivos' },
])

const customIconMapStatus = ref<Record<string, string>>({})
const customDescriptionMapStatus = ref<Record<string, string>>({})

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'news-list'

const isCreate = computed(() => route.name === 'Nueva Noticia')
const isEdit = computed(() => route.name === 'Editar Noticia')
const isDeleting = computed(() => store.getters['utils/isDeleting'])
const isUpdating = computed(() => store.getters['utils/isUpdating'])
const isCreating = computed(() => store.getters['utils/isCreating'])

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }
    router.push({ name: 'Editar Noticia', params: { id_new: item.id } })
  }
  if (actionName === 'deactivate') {
    deactivateNews(item)
  }
  if (actionName === 'delete') {
    deleteNews(item)
  }
}

const deactivateNews = async (item: any) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}  noticia?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} ${item.title}.`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.news.changeStatus,
      id: item.id,
      status: !isActive ? 1 : 0,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.news.changeStatus, '', response)
      swal.showSuccess('Noticia ' + (isActive ? 'desactivada' : 'activada') + ' exitosamente')
      getNews()
    }
  } catch (error: any) {
    logger.logRequest(URLS.news.changeStatus, '', error)
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.title} `)
  }
}

const deleteNews = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar la noticia?`,
    `Esta acción eliminará la noticia ${item.title}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.news.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.news.changeStatus, '', response)
      swal.showSuccess('Noticia eliminada exitosamente')
      getNews()
    }
  } catch (error: any) {
    logger.logRequest(URLS.news.changeStatus, '', error)
    swalToast.showError(`${ERROR.errorDelete} ${item.title}`)
  }
}

const getNews = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    active: selectedStatus.value?.id ?? null,
  }
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: URLS.news.getAll,
      params,
    })

    if (response.code === 200) {
      logger.logRequest(URLS.news.getAll, params, response)
      news.value = response.data.data
      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.news.getAll, params, error)
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

  getNews()
}

// Inicializar mapas de estatus
const initializeStatusMaps = () => {
  clearIconMaps(customIconMapStatus, customDescriptionMapStatus)
  updateIconMaps(
    customIconMapStatus,
    customDescriptionMapStatus,
    statusOptions.value,
    ICONS_MULTISELECT.services,
    { dataKey: 'name', descriptionPrefix: 'Noticias:' },
  )
  // Asignar descripciones personalizadas
  customDescriptionMapStatus.value['Activos'] = 'Noticias activas'
  customDescriptionMapStatus.value['Inactivos'] = 'Noticias inactivas'
}

// Observa los cambios en la variable
watch(
  () => isDeleting.value,
  (newValue) => {
    if (newValue) {
      // Resetea el estado si es necesario
      store.dispatch('utils/setIsDeleting', false)
      getNews()
    }
  },
)

watch(
  () => isUpdating.value,
  (newValue) => {
    if (newValue) {
      store.dispatch('utils/setIsUpdating', false)
      getNews()
    }
  },
)

watch(
  () => isCreating.value,
  (newValue) => {
    if (newValue) store.dispatch('utils/setIsCreating', false)
    getNews()
  },
)

const goToNew = () => {
  router.push({ name: 'Nueva Noticia' })
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  initializeStatusMaps()
  getNews()
})
</script>

<template>
  <div>
    <DashboardLayout>
      <div class="container-fluid" v-if="!isCreate && !isEdit">
        <titleSection
          :title="TITLE_SECTION_COMPONENT.news.title"
          :description="TITLE_SECTION_COMPONENT.news.description"
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
                @click="getNews()"
              >
                <i :class="BUTTONS.search.icon"></i>
              </span>
              <input
                type="text"
                class="form-control border-radius-right"
                placeholder="Titulo de la noticia o nombre del creador"
                aria-label="Username"
                aria-describedby="basic-addon1"
                inputmode="search"
                enterkeyhint="search"
                v-model="query"
                @keyup.enter="getNews()"
              />
            </div>
          </div>
          <div class="col-12 col-md-2 d-flex flex-column justify-content-end">
            <MultiselectCustom
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Estatus"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapStatus"
              :custom-description-map="customDescriptionMapStatus"
              @select="getNews"
            />
          </div>
          <div class="col gap-2 d-flex align-items-end justify-content-end">
            <button
              :class="BUTTONS.filter.class"
              :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
              :data-tooltip-pos="BUTTONS.filter.tooltipPos"
              @click=";((query = ''), (selectedStatus = null), getNews())"
            >
              <i :class="BUTTONS.filter.icon"></i>
            </button>
            <button :class="BUTTONS.new.class" @click="goToNew">
              <i :class="BUTTONS.new.icon"></i>
              <span class="d-none d-md-inline" v-if="!isMobile">
                {{ BUTTONS_TOOLTIPS.news.tooltipTitle }}
              </span>
            </button>
          </div>
        </div>
        <div class="container-fluid border rounded-4 mt-2">
          <CustomTable
            :data="news"
            :headers="TABLE_HEADERS.news"
            :actions="getTableActions"
            :is-loading="isLoading"
            :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages"
            @change-page="handlePageChange"
            @action-click="handleTableAction"
          >
            <template #cell(url_image)="{ value }">
              <img
                :src="value || defaultNewsImage"
                alt="Imagen"
                class="img-thumbnail rounded"
                style="width: 60px; height: 60px; object-fit: cover"
                @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultNewsImage)"
              />
            </template>
            <template #cell(body_only_text)="{ value }">
              <span class="d-block text-truncate" style="width: 350px" :title="value">{{
                value
              }}</span>
            </template>
            <template #cell(active)="{ value }">
              <StatusBadge :value="value" />
            </template>
          </CustomTable>
        </div>
      </div>
      <router-view />
    </DashboardLayout>
  </div>
</template>
