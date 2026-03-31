<script setup lang="ts">
import { onMounted } from 'vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import CustomLocation from '@/components/common/CustomLocation.vue'
import { useCities } from '@/composables/Models/useCities'

const props = defineProps<{
  form: any
}>()

const { cities, loading: loadingCities, getDataCities } = useCities()

onMounted(() => {
  getDataCities()
})

const handleCoordinates = (coords: { latitude: string; longitude: string } | null) => {
  if (coords) {
    props.form.lat = coords.latitude
    props.form.lon = coords.longitude
  } else {
    props.form.lat = ''
    props.form.lon = ''
  }
}
</script>

<template>
  <div>
    <div class="row g-3 mt-2">
      <!-- Foto / Logo -->
      <div class="col-12 col-md-4 col-lg-3">
        <label class="form-label fw-bold mb-1">Logotipo de la Farmacia</label>
        <ImageUploader
          v-model="form.url_image"
          :round="false"
          placeholder="Haz click o arrastra una imagen"
          accepted-formats="image/png, image/jpeg, image/jpg"
          :rules="[(v) => !!v || 'La imagen es obligatoria']"
        />
      </div>

      <!-- General Data -->
      <div class="col-12 col-md-8 col-lg-9">
        <div class="row g-3">
          <div class="col-12 col-md-5">
            <BaseInput
              id="name"
              v-model="form.name"
              label="Nombre de la Farmacia"
              placeholder="Ej. Farmacia San Rafael"
              :rules="[(v) => !!v || 'El nombre es obligatorio']"
            />
          </div>
          <div class="col-12 col-md-3">
            <BaseInput
              id="phone"
              v-model="form.phone"
              label="Teléfono Principal"
              placeholder="Ej. 04141234567"
              :rules="[(v) => !!v || 'El teléfono es obligatorio']"
            />
          </div>
          <div class="col-12 col-md-4">
            <MultiselectCustom
              v-model="form.id_type_city"
              :options="cities"
              :loading="loadingCities"
              label="Ciudad"
              placeholder="Selecciona la ciudad"
              labelKey="name"
              trackBy="id"
              :showIcons="true"
              helperType="custom"
              customDefaultIcon="bi bi-building"
              :clearable="true"
              :rules="[(v) => !!v || 'La ciudad es obligatoria']"
            />
          </div>
          <div class="col-12 col-md-6 mb-0">
            <BaseTextarea
              id="description"
              v-model="form.description"
              label="Descripción"
              rows="3"
              resize="none"
              placeholder="Breve descripción de los servicios u orientaciones principales de la farmacia..."
              :rules="[(v) => !!v || 'La descripción es obligatoria']"
            />
          </div>
          <div class="col-12 col-md-6 mb-0">
            <BaseTextarea
              id="ubication"
              v-model="form.ubication"
              label="Dirección Física Completa"
              rows="3"
              resize="none"
              placeholder="Ej. Av. Los Leones, cruce con calle 1, Edificio Plaza, Local 3."
              :rules="[(v) => !!v || 'La dirección es obligatoria']"
            />
          </div>
          <div class="col-12 mt-0">
            <CustomLocation
              v-model="form.url_google_map"
              label="Enlace de Google Maps"
              placeholder="Pega el link corto o largo de la ubicación"
              :rules="[(v) => !!v || 'El enlace de Google Maps es obligatorio']"
              @coordinates-extracted="handleCoordinates"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
