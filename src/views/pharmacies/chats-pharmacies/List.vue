<template>
  <div
    class="col-12 bg-white rounded-3 shadow-sm border d-flex flex-column overflow-hidden w-100"
    style="height: calc(80vh - 130px); min-height: 500px"
  >
    <LoadingOverlay v-if="isLoading" message="Cargando entorno de chat..." />
    <ChatIframe
      v-else-if="adminCode !== 'No tiene' && pharmacyCode !== 'No tiene'"
      user-type="operator"
      :code-user="adminCode"
      :code-pharmacy="pharmacyCode"
      view="backoffice_pharmacy"
    />
    <div v-else class="text-danger d-flex align-items-center justify-content-center p-4">
      No se pudo cargar la sala de chat. Faltan parámetros de configuración.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCookies } from '@/composables/useCookies'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ChatIframe from '@/components/common/ChatIframe.vue'
import { type PharmacyInterface } from '@/composables/Models/usePharmacy'

const route = useRoute()
const { getCookie } = useCookies()

// Inyectar la farmacia provista por el Orchestrator
const pharmacy = inject<Ref<PharmacyInterface | null>>('pharmacyData')

const isLoading = ref(true)

const adminCode = computed(() => getCookie('fsi_admin_code_user') || 'No tiene')
const pharmacyCode = computed(() => (pharmacy?.value as any)?.code || 'No tiene')

onMounted(() => {
  // Ya no necesitamos buscar al usuario por API, el código está en la cookie
  isLoading.value = false
})

</script>
