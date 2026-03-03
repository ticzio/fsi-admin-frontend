<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

//components
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'

//composables
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'

//utils
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { ERROR } from '@/const/errorConst'

import SipconConnectionModal from '@/components/Settings/SipconConnectionModal.vue'

const router = useRouter()
const store = useStore()
const { showConfirm, showSuccess } = useSwal()
const swalToast = useSwalToast()
const logger = useLogger()
const isLoading = ref<boolean>(false)
const sipconModal = ref<InstanceType<typeof SipconConnectionModal> | null>(null)
const sipconResponse = ref<any>(null)

// Variable reactiva para almacenar los contadores de masters
const mastersStats = ref({
  active_cities: 0,
  active_states: 0,
  active_roles: 0,
  active_type_brakes: 0,
  active_type_colors: 0,
  active_type_engines: 0,
  active_type_environments: 0,
  fuel_type: 0,
  active_type_transmissions: 0,
  active_type_vehicles: 0,
  active_type_purchases: 0,
  active_type_services: 0,
  active_type_notifications: 0,
})

const cards = computed(() =>
  [
    {
      title: 'Ciudades',
      count: mastersStats.value.active_cities?.toString?.() || '0',
      color: 'dark',
      icon: 'bi-geo-alt',
      icon_2: '',
      path: '/settings/cities',
      permission: false,
    },
    {
      title: 'Roles',
      count: mastersStats.value.active_roles?.toString?.() || '0',
      color: 'primary',
      icon: 'bi-award',
      icon_2: '',
      path: '/settings/roles',
      permission: false,
    },
    {
      title: 'Estados',
      count: mastersStats.value.active_states?.toString?.() || '0',
      color: 'dark',
      icon: 'bi-geo-alt',
      icon_2: '',
      path: '/settings/states',
      permission: false,
    },
    // Fila 1 - Tipos de vehículos y relacionados
    {
      title: 'Tipo de entorno',
      count: mastersStats.value.active_type_environments?.toString?.() || '0',
      color: 'dark',
      icon: 'bi-globe',
      icon_2: '',
      path: '/settings/enviroment_type',
      permission: true,
    },
    {
      title: 'Tipo de transmisión',
      count: mastersStats.value.active_type_transmissions?.toString?.() || '0',
      color: 'primary',
      icon: 'bi-gear',
      icon_2: '',
      path: '/settings/transmission_type',
      permission: true,
    },
    {
      title: 'Tipo de motor',
      count: mastersStats.value.active_type_engines?.toString?.() || '0',
      color: 'dark',
      icon: 'bi-cpu',
      icon_2: '',
      path: '/settings/engine_type',
      permission: true,
    },
    {
      title: 'Colores',
      count: mastersStats.value.active_type_colors?.toString?.() || '0',
      color: 'primary',
      icon: 'bi-palette',
      icon_2: '',
      path: '/settings/colors',
      permission: true,
    },
    {
      title: 'Tipo de freno',
      count: mastersStats.value.active_type_brakes?.toString?.() || '0',
      color: 'dark',
      icon: 'bi-cpu',
      icon_2: '',
      path: '/settings/brake_type',
      permission: true,
    },
    {
      title: 'Tipo de vehículo',
      count: mastersStats.value.active_type_vehicles?.toString?.() || '0',
      color: 'primary',
      icon: 'bi-cpu',
      icon_2: '',
      path: '/settings/vehicle_type',
      permission: true,
    },
    {
      title: 'Tipo de compra del Vehículo',
      count: mastersStats.value.active_type_purchases?.toString?.() || '0',
      color: 'dark',
      icon: 'bi-cpu',
      icon_2: '',
      path: '/settings/type_purchase',
      permission: true,
    },
    {
      title: 'Tipo de sevicio',
      count: mastersStats.value.active_type_services?.toString?.() || '0',
      color: 'primary',
      icon: 'bi-cpu',
      icon_2: '',
      path: '/settings/type_service',
      permission: true,
    },
    // {
    //   title: 'Tipo de notificación',
    //   count: mastersStats.value.active_type_notifications?.toString?.() || '0',
    //   color: 'dark',
    //   icon: 'bi-bell',
    //   icon_2: '',
    //   path: '/settings/type_notification',
    //   permission: true,
    // },
  ].filter((card: any) => card?.permission),
)

const getMastersStats = async () => {
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: 'analytics/master_counters',
    })

    if (response.code === 200) {
      logger.logRequest('analytics/master_counters', {}, response)
      // Actualizar los datos directamente en la variable local
      mastersStats.value = response.data
    }
  } catch (error) {
    logger.logRequest('analytics/master_counters', {}, error)
    swalToast.showError(`${ERROR.errorGet} de las analiticas`)
  } finally {
    isLoading.value = false
  }
}

const clearCache = async () => {
  const result = await showConfirm('¿Estas seguro de limpiar la cache del sistema?', '')

  if (!result) {
    return
  }

  isLoading.value = true
  try {
    const response = await store.dispatch('clearRedisCache')
    if (response && response.code === 200) {
      logger.logRequest('clearRedisCache', {}, response)
      showSuccess('Cache limpiada exitosamente')
    }
  } catch (error) {
    logger.logRequest('clearRedisCache', {}, error)
    swalToast.showError('Error al limpiar el cache')
  } finally {
    isLoading.value = false
  }
}

const openSipconModal = () => {
  sipconResponse.value = null
  sipconModal.value?.openModal()
}

const handleSipconSubmit = async ({ rif, placa }: { rif: string; placa: string }) => {
  isLoading.value = true
  sipconResponse.value = null
  try {
    const response = await store.dispatch('getData', {
      url: 'sipcon/test-connection',
      params: { rif, placa },
    })
    sipconResponse.value = response
    if (response && response.code === 200) {
      logger.logRequest('sipcon/test-connection', { rif, placa }, response)
      showSuccess('Conexión con SIPCON exitosa')
    }
  } catch (error) {
    logger.logRequest('sipcon/test-connection', { rif, placa }, error)
    swalToast.showError('Error al probar la conexión con SIPCON')
    sipconResponse.value = { error: error }
  } finally {
    isLoading.value = false
  }
}

const goTo = (path: string) => {
  router.push(path)
}

onMounted(() => {
  getMastersStats()
})
</script>

<template>
  <DashboardLayout>
    <titleSection
      :title="TITLE_SECTION_COMPONENT.settings.title"
      :description="TITLE_SECTION_COMPONENT.settings.description"
    />
    <div class="container-fluid settings-container">
      <div class="row g-4 mt-3 mt-lg-0">
        <div class="col-md-6 col-xl-4" v-for="(card, index) in cards" :key="index">
          <div
            :class="[
              'h-card card border-0 shadow-sm border-radius-right border-radius-left h-100 stats-card text-white',
              'bg-' + card.color,
              card.permission ? '' : 'opacity-75',
            ]"
            style="cursor: pointer"
            @click.prevent="goTo(card.path)"
          >
            <div class="d-flex align-items-center p-4 h-100" style="position: relative; z-index: 2">
              <div class="me-3 d-block no-wrap-toggle">
                <i :class="['bi icon-size text-white mx-1', card.icon]"></i>
                <i v-if="card.icon_2" :class="['bi icon-size text-white mx-1', card.icon_2]"></i>
              </div>
              <div class="text-start py-1">
                <h1 class="card-title fw-bold mb-0 mt-2 text-light" style="font-size: 2.2rem">
                  {{ card.count }}
                </h1>
                <h5 class="card-text mb-2 text-light text-wrap pe-5">{{ card.title }}</h5>
              </div>
            </div>
            <!-- Elementos para el efecto hover -->
            <div class="shine"></div>
            <div class="background"></div>
          </div>
        </div>
      </div>
      <div class="row g-4 d-flex justify-content-center gap-4 my-3">
        <button
          class="btn col-lg-5 py-3 fs-5 d-flex align-items-center justify-content-center btn-outline-secondary border-2 border-radius-right border-radius-left"
          @click="clearCache"
        >
          <i class="bi bi-lightning-fill fs-2"></i> Limpiar caché
        </button>
        <button
          class="btn col-lg-5 py-3 fs-5 d-flex align-items-center justify-content-center btn-outline-primary border-2 border-radius-right border-radius-left"
          @click="openSipconModal"
        >
          <i class="bi bi-wifi fs-2"></i> Probar conexión SIPCON
        </button>
      </div>
      <SipconConnectionModal
        ref="sipconModal"
        :is-loading="isLoading"
        :response-data="sipconResponse"
        @submit="handleSipconSubmit"
      />
    </div>
  </DashboardLayout>
</template>
<style scoped>
.icon-size {
  font-size: 4rem;
}

.settings-container {
  animation: fadeIn 0.5s ease-in;
  --card-border-color: rgba(255, 255, 255, 0.1);
  --card-box-shadow-1: rgba(0, 0, 0, 0.05);
  --card-box-shadow-1-y: 3px;
  --card-box-shadow-1-blur: 6px;
  --card-box-shadow-2: rgba(0, 0, 0, 0.1);
  --card-box-shadow-2-y: 8px;
  --card-box-shadow-2-blur: 15px;
  --card-label-color: #ffffff;
  --card-icon-color: #d4d4d8;
  --card-icon-background-color: rgba(255, 255, 255, 0.08);
  --card-icon-border-color: rgba(255, 255, 255, 0.12);
  --card-shine-opacity: 0.1;
  --card-line-color: rgba(255, 255, 255, 0.15);
  --card-tile-color: rgba(88, 141, 255, 0.1);

  --card-hover-border-color: rgba(255, 255, 255, 0.2);
  --card-hover-box-shadow-1: rgba(0, 0, 0, 0.04);
  --card-hover-box-shadow-1-y: 5px;
  --card-hover-box-shadow-1-blur: 10px;
  --card-hover-box-shadow-2: rgba(0, 0, 0, 0.3);
  --card-hover-box-shadow-2-y: 15px;
  --card-hover-box-shadow-2-blur: 25px;
  --card-hover-icon-color: #588dff;
  --card-hover-icon-background-color: rgba(88, 141, 255, 0.1);
  --card-hover-icon-border-color: rgba(88, 141, 255, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-card {
  box-shadow:
    0px var(--card-box-shadow-1-y) var(--card-box-shadow-1-blur) var(--card-box-shadow-1),
    0px var(--card-box-shadow-2-y) var(--card-box-shadow-2-blur) var(--card-box-shadow-2),
    0 0 0 1px var(--card-border-color);
  padding: 16px;
  border-radius: 15px;
  cursor: pointer;
  position: relative;
  transition:
    box-shadow 0.25s,
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    background 3s;
  background-size: 200% 200%;
}

.stats-card.bg-dark {
  background: #212529 !important;
  --card-shine-gradient: conic-gradient(
    from 205deg at 50% 50%,
    rgba(33, 37, 41, 0) 0deg,
    #495057 25deg,
    rgba(33, 37, 41, 0.18) 295deg,
    rgba(33, 37, 41, 0) 360deg
  );
}

.stats-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 15px;
  background: inherit;
}

.stats-card .shine {
  border-radius: inherit;
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s;
}

.stats-card .shine:before {
  content: '';
  width: 150%;
  padding-bottom: 150%;
  border-radius: 50%;
  position: absolute;
  left: 50%;
  bottom: 55%;
  filter: blur(35px);
  opacity: var(--card-shine-opacity);
  transform: translateX(-50%);
  background-image: var(--card-shine-gradient);
}

.stats-card .background {
  border-radius: inherit;
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-mask-image: radial-gradient(circle at 60% 5%, black 0%, black 15%, transparent 60%);
  mask-image: radial-gradient(circle at 60% 5%, black 0%, black 15%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  background-size: 40px 40px;
  background-image:
    repeating-linear-gradient(
      45deg,
      var(--card-line-color) 0,
      var(--card-line-color) 1px,
      transparent 0,
      transparent 50%
    ),
    repeating-linear-gradient(
      -45deg,
      var(--card-line-color) 0,
      var(--card-line-color) 1px,
      transparent 0,
      transparent 50%
    );
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0px 3px 6px var(--card-hover-box-shadow-1),
    0px var(--card-hover-box-shadow-2-y) var(--card-hover-box-shadow-2-blur)
      var(--card-hover-box-shadow-2),
    0 0 0 1px var(--card-hover-border-color);
}

.stats-card.bg-dark:hover {
  background: linear-gradient(135deg, #212529 0%, #1e4466 50%, #212529 100%) !important;
  animation: wave-dark 2s infinite linear alternate;
  transform: translateY(-5px) scale(1.025);
}

.stats-card.bg-primary:hover {
  background: linear-gradient(135deg, #0d6efd 0%, #084298 50%, #0d6efd 100%) !important;
  animation: wave-primary 2s infinite linear alternate;
  transform: translateY(-5px) scale(1.025);
}

@keyframes wave-success {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

@keyframes wave-dark {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes wave-primary {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.stats-card:hover .shine {
  opacity: 1;
  transition-duration: 0.5s;
  transition-delay: 0s;
}

.stats-card:hover .background {
  opacity: 1;
}

.stats-card:hover .background .line {
  opacity: 1;
  transition-duration: 0.15s;
}

.stats-card:hover .background .line:before {
  transform: scaleX(1);
}

.stats-card:hover .background .line:after {
  transform: scaleY(1);
}

.stats-card:hover .background .line.line-1:before,
.stats-card:hover .background .line.line-1:after {
  transition-delay: 0s;
}

.stats-card:hover .background .line.line-2:before,
.stats-card:hover .background .line.line-2:after {
  transition-delay: 0.15s;
}

.stats-card:hover .background .line.line-3:before,
.stats-card:hover .background .line.line-3:after {
  transition-delay: 0.3s;
}

/* Estilos base para las cards */
.h-card {
  color: #fff !important;
}
</style>
