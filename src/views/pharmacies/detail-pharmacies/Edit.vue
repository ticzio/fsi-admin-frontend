<template>
  <div class="h-100 p-3 bg-white rounded-3 shadow-sm border d-flex flex-column">
    <form @submit.prevent="handleSave" class="flex-grow-1">
      <GeneralInfoStep :form="form" :cityOptions="cityOptions" />
      <div class="d-flex justify-content-end mt-4">
        <button
          type="submit"
          class="btn btn-primary px-4 fw-medium d-flex align-items-center gap-2"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          <i v-else class="bi bi-save"></i>
          Guardar Cambios
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePharmacy } from '@/composables/Models/usePharmacy'
import { useCities } from '@/composables/Models/useCities'
import GeneralInfoStep from '@/components/Pharmacies/GeneralInfoStep.vue'

const route = useRoute()
const router = useRouter()
const { getPharmacy, savePharmacy, loading } = usePharmacy()
const { cities, getCities } = useCities()

// Minimal state to satisfy the component props
const form = reactive({
  name: '',
  code: '',
  phone: '',
  id_type_city: null,
  description: '',
  ubication: '',
  url_google_map: '',
  url_image: '',
  lat: '',
  lon: '',
  url_instagram: '',
  url_whatsapp: '',
  opening_week: '',
  close_week: '',
  opening_saturday: '',
  close_saturday: '',
  opening_sunday: '',
  close_sunday: '',
})

const cityOptions = ref<any[]>([])

onMounted(async () => {
  await getCities()
  cityOptions.value = cities.value

  const data = await getPharmacy(route.params.id_pharmacy as string)
  if (data) {
    Object.assign(form, data)
    if (data.type_city) {
      form.id_type_city = data.type_city
    }
  }
})

const handleSave = async () => {
  if (!form.name || !form.code) {
    return
  }
  const success = await savePharmacy(form as any, true, route.params.id_pharmacy as string)
  if (success) {
    // router.push('/pharmacy') // Se puede mantener aquí o ir atras
  }
}
</script>
