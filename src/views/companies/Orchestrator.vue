<script setup lang="ts">
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import ScrollableTabs from '@/components/common/ScrollableTabs.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
//Importaciones de constantes para componentes
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useCookies } from '@/composables/useCookies'
import { decodeRole } from '@/composables/useAccessControl'
import { URLS } from '@/const/api'
import { useLogger } from '@/composables/useLogger'

const route = useRoute()
const router = useRouter()
const store = useStore()
const logger = useLogger()

const isLoading = ref(true)
const localTitle = ref('')

const title = computed(() => localTitle.value || store.getters['utils/isItem'] || '')
const isGetting = computed(() => store.getters['utils/isGetting'])

const routeName = ref('/companies/edit')
const prevTab = ref(0)
const transitionName = ref('slide-left')

const allTabRoutes = [
  {
    label: 'Datos de la empresa',
    path: 'detail-company',
    allowedRoles: [1, 2, 3, 4, 5],
  },
  { label: 'Vehículos', path: 'vehicles-company', allowedRoles: [1, 2, 3, 4, 5] },
  { label: 'Clientes', path: 'clients-company', allowedRoles: [1, 2, 3, 4, 5] },
  { label: 'Asignaciones', path: 'assignments-company', allowedRoles: [1, 2, 3, 4, 5] },
]

// ----- INICIO DE LA CORRECCIÓN -----

// 1. Se reemplaza la `computed` asíncrona por un `ref` para almacenar el resultado.
const filteredTabRoutes = ref<typeof allTabRoutes>([])

// 2. La lógica asíncrona se mueve a una función `async` estándar.
const determineVisibleTabs = async () => {
  const { getCookie } = useCookies()
  const hashedRole = getCookie('changan_admin_id_role')
  if (!hashedRole) {
    filteredTabRoutes.value = []
    return
  }

  try {
    const userRole = await decodeRole(hashedRole)
    // 3. El resultado se asigna al `ref`.
    filteredTabRoutes.value = allTabRoutes.filter((tab) => tab.allowedRoles.includes(userRole))
  } catch (error) {
    filteredTabRoutes.value = [] // En caso de error, no mostrar pestañas
  }
}

// ----- FIN DE LA CORRECCIÓN -----

// CORRECCIÓN: Ahora `activeTab` depende del `ref` `filteredTabRoutes`.
const activeTab = computed(() => {
  const currentPath = route.path
  // Usa el nuevo ref que sí contiene el arreglo.
  const tabs = filteredTabRoutes.value || []
  let bestMatchIndex = -1
  let bestMatchLength = 0

  tabs.forEach((tab, idx) => {
    const tabPath = `/${tab.path}`
    if (currentPath.endsWith(tabPath) && tabPath.length > bestMatchLength) {
      bestMatchIndex = idx
      bestMatchLength = tabPath.length
    } else if (currentPath.includes(`/${tab.path}/`) && tabPath.length > bestMatchLength) {
      // Esta condición ayuda a detectar sub-rutas (ej: /workers/add)
      bestMatchIndex = idx
      bestMatchLength = tabPath.length
    }
  })
  return bestMatchIndex
})

function goToTab(index: number) {
  const id_company = route.params.id_company
  const tabs = filteredTabRoutes.value || []
  if (tabs[index]) {
    router.replace(`${routeName.value}/${id_company}/${tabs[index].path}`)
  }
}

function selectTab(index: number) {
  goToTab(index)
}

// Timeout de seguridad para evitar loading infinito
let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const startLoadingTimeout = () => {
  loadingTimeout = setTimeout(() => {
    if (isLoading.value) {
      logger.logRequest(
        'loadingTimeout',
        { timeoutMs: 3000 },
        { message: 'Loading timeout alcanzado' },
      )
      loadCompanyData()
    }
  }, 3000) // 3 segundos de espera máxima
}

const clearLoadingTimeout = () => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
}

// Cargar datos de la empresa directamente si es necesario (ej: recarga de página)
const loadCompanyData = async () => {
  const url = `${URLS.company.prefix}/${route.params.id_company}`
  const params = {}
  try {
    const response = await store.dispatch('getData', {
      url,
      params,
    })
    if (response.code === 200) {
      logger.logRequest(url, params, response)
      const data = response.data
      localTitle.value = data.business_name || data.trade_name || ''
      store.dispatch('utils/setIsItem', localTitle.value)
    }
  } catch (error) {
    logger.logRequest(url, params, error)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => activeTab.value,
  (newTab, oldTab) => {
    if (oldTab !== null && oldTab !== -1) {
      // Previene la transición en la carga inicial
      prevTab.value = oldTab
      transitionName.value = newTab > oldTab ? 'slide-left' : 'slide-right'
    }
  },
)

watch(isGetting, (newValue: boolean) => {
  if (newValue) {
    isLoading.value = false
    store.dispatch('utils/setIsGetting', false)
  }
})

onMounted(async () => {
  await determineVisibleTabs()
  startLoadingTimeout()
})

onBeforeUnmount(() => {
  clearLoadingTimeout()
})
</script>

<template>
  <DashboardLayout>
    <div>
      <titleSection
        :title="title"
        :description="TITLE_SECTION_COMPONENT.company.details"
        :is-loading="isLoading"
      />
      <div>
        <ScrollableTabs
          :tabs="filteredTabRoutes"
          :activeTab="activeTab"
          @tab-change="selectTab"
          :is-loading="isLoading"
          :skeleton-count="allTabRoutes.length"
        />
        <LoadingOverlay v-if="isLoading" message="Cargando datos de la empresa..." />
        <div class="tab-content" v-show="!isLoading">
          <div class="tab-pane fade show active" role="tabpanel">
            <router-view v-slot="{ Component }">
              <transition :name="transitionName" mode="out-in">
                <component :is="Component" :key="$route.fullPath" />
              </transition>
            </router-view>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
