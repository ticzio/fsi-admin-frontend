<script setup lang="ts">
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import ScrollableTabs from '@/components/common/ScrollableTabs.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { ref, watch, computed, onMounted, onBeforeUnmount, provide } from 'vue'
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

// Puntos del cliente
const clientPointsData = ref<{
  total_points: number | null
  total_in: number | null
  total_out: number | null
}>({
  total_points: null,
  total_in: null,
  total_out: null,
})

provide('clientPointsData', clientPointsData)

const title = computed(() => localTitle.value || store.getters['utils/isItem'] || '')
const isGetting = computed(() => store.getters['utils/isGetting'])

const routeName = ref('/clients/edit')
const prevTab = ref(0)
const transitionName = ref('slide-left')

const allTabRoutes = [
  {
    label: 'Datos del cliente',
    path: 'client-detail',
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    label: 'Detalles del vehículo',
    path: 'vehicle',
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    label: 'Historial de servicios',
    path: 'service-historical',
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    label: 'Auditoría',
    path: 'audit',
    allowedRoles: [1, 2, 3, 4, 5],
  },
]

const filteredTabRoutes = ref<typeof allTabRoutes>([])

const determineVisibleTabs = async () => {
  const { getCookie } = useCookies()
  const hashedRole = getCookie('changan_admin_id_role')
  if (!hashedRole) {
    filteredTabRoutes.value = []
    return
  }

  try {
    const userRole = await decodeRole(hashedRole)
    filteredTabRoutes.value = allTabRoutes.filter((tab) => tab.allowedRoles.includes(userRole))
  } catch (error) {
    filteredTabRoutes.value = []
  }
}

const activeTab = computed(() => {
  const currentPath = route.path
  const tabs = filteredTabRoutes.value || []
  let bestMatchIndex = -1
  let bestMatchLength = 0

  tabs.forEach((tab, idx) => {
    const tabPath = `/${tab.path}`
    if (currentPath.endsWith(tabPath) && tabPath.length > bestMatchLength) {
      bestMatchIndex = idx
      bestMatchLength = tabPath.length
    } else if (currentPath.includes(`/${tab.path}/`) && tabPath.length > bestMatchLength) {
      bestMatchIndex = idx
      bestMatchLength = tabPath.length
    }
  })
  return bestMatchIndex
})

function goToTab(index: number) {
  const id_client = route.params.id_client
  const id_client_points = route.params.id_client_points
  const tabs = filteredTabRoutes.value || []
  if (tabs[index]) {
    router.replace(`${routeName.value}/${id_client}/${id_client_points}/${tabs[index].path}`)
  }
}

function selectTab(index: number) {
  goToTab(index)
}

let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const startLoadingTimeout = () => {
  loadingTimeout = setTimeout(() => {
    if (isLoading.value) {
      logger.logRequest(
        'loadingTimeout',
        { timeoutMs: 3000 },
        { message: 'Loading timeout alcanzado' },
      )
      loadClientData()
    }
  }, 3000)
}

const clearLoadingTimeout = () => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
}

const loadClientData = async () => {
  const url = `${URLS.clientVehicle.prefix}/${route.params.id_client}`
  const params = {}
  try {
    const response = await store.dispatch('getData', {
      url,
      params,
    })
    if (response.code === 200) {
      logger.logRequest(url, params, response)
      const data = response.data
      const client = data.client
      localTitle.value = client ? `${client.first_name} ${client.last_name}` : ''
      store.dispatch('utils/setIsItem', localTitle.value)
    }
  } catch (error) {
    logger.logRequest(url, params, error)
  } finally {
    isLoading.value = false
  }
}

const getClientPoints = async () => {
  const idClientPoints = route.params.id_client_points
  if (!idClientPoints) return

  const url = `client/get_points/${idClientPoints}`
  try {
    const response = await store.dispatch('getData', { url, params: {} })
    if (response.code === 200) {
      logger.logRequest(url, {}, response)
      const data = response.data
      clientPointsData.value = {
        total_points: data?.total_points ?? null,
        total_in: data?.total_in ?? null,
        total_out: data?.total_out ?? null,
      }
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
  }
}

watch(
  () => activeTab.value,
  (newTab, oldTab) => {
    if (oldTab !== null && oldTab !== -1) {
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
  await getClientPoints()
})

onBeforeUnmount(() => {
  clearLoadingTimeout()
})
</script>

<template>
  <DashboardLayout>
    <div>
      <titleSection
        :title="TITLE_SECTION_COMPONENT.client.edit"
        :description="TITLE_SECTION_COMPONENT.client.editDescription"
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
        <LoadingOverlay v-if="isLoading" message="Cargando datos del cliente..." />
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
