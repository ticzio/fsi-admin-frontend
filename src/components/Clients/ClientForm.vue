<script setup lang="ts">
import { onMounted, computed } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { useCities } from '@/composables/Models/useCities'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'
import {
  hasMinLength,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  hasSpecialChar,
} from '@/utils/funcPassword'

const props = defineProps<{
  form: any
  isEdit?: boolean
}>()

const { cities, getCities } = useCities()

const genderOptions = [{ name: 'Masculino' }, { name: 'Femenino' }, { name: 'Otro' }]

const selectedGender = computed({
  get: () => genderOptions.find((opt) => opt.name === props.form.gender) || null,
  set: (val: any) => {
    props.form.gender = val ? val.name : ''
  },
})

const selectedCity = computed({
  get: () => cities.value.find((city: any) => city.id === props.form.id_type_city) || null,
  set: (val: any) => {
    props.form.id_type_city = val ? val.id : ''
  },
})

const passwordRules = [
  (v: string) => (props.isEdit ? true : !!v || 'La contraseña es obligatoria'),
  (v: string) => !v || hasMinLength(v) || 'Debe tener al menos 8 caracteres',
  (v: string) => !v || hasUpperCase(v) || 'Debe contener al menos una letra mayúscula (A-Z)',
  (v: string) => !v || hasLowerCase(v) || 'Debe contener al menos una letra minúscula (a-z)',
  (v: string) => !v || hasNumber(v) || 'Debe contener al menos un número (0-9)',
  (v: string) => !v || hasSpecialChar(v) || 'Debe contener al menos un carácter especial (!@#$...)',
]

const passwordConfirmationRules = [
  (v: string) => (props.form.password ? !!v || 'Debes confirmar la contraseña' : true),
  (v: string) => v === props.form.password || 'Las contraseñas no coinciden',
]

onMounted(async () => {
  await getCities()
})
</script>

<template>
  <div class="row g-3">
    <!-- Foto / Logo -->
    <div class="col-12 col-md-4 col-lg-3">
      <label class="form-label fw-bold mb-1">Foto de Perfil</label>
      <ImageUploader
        v-model="form.url_image"
        :round="true"
        placeholder="Haz click o arrastra una imagen"
        accepted-formats="image/png, image/jpeg, image/jpg"
      />

    </div>

    <!-- General Data -->
    <div class="col-12 col-md-8 col-lg-9">
      <div class="row g-3">
        <!-- Nombres y Apellidos -->
        <div class="col-12 col-md-6">
          <BaseInput
            id="first_name"
            v-model="form.first_name"
            label="Nombres *"
            placeholder="Ej. Juan Carlos"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />
        </div>
        <div class="col-12 col-md-6">
          <BaseInput
            id="last_name"
            v-model="form.last_name"
            label="Apellidos *"
            placeholder="Ej. Pérez"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />
        </div>

        <!-- CI y Fecha de Nacimiento -->
        <div class="col-12 col-md-6 my-0">
          <BaseInput
            id="ci"
            v-model="form.ci"
            label="Cédula de Identidad"
            placeholder="Ej. 12345678"
          />
        </div>
        <div class="col-12 col-md-6 my-0">
          <BaseInput
            id="born_date"
            v-model="form.born_date"
            type="date"
            label="Fecha de Nacimiento"
          />
        </div>

        <!-- Email y Teléfono -->
        <div class="col-12 col-md-6 my-0">
          <BaseInput
            id="email"
            v-model="form.email"
            type="email"
            label="Correo Electrónico *"
            placeholder="Ej. juan.perez@ejemplo.com"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />
        </div>
        <div class="col-12 col-md-6 my-0">
          <BaseInput
            id="phone"
            v-model="form.phone"
            label="Teléfono"
            placeholder="Ej. 04141234567"
          />
        </div>

        <!-- Género y Ciudad -->
        <div class="col-12 col-md-6 my-0">
          <MultiselectCustom
            v-model="selectedGender"
            :options="genderOptions"
            label="Género"
            placeholder="Selecciona género"
            :show-icons="false"
            :show-descriptions="false"
          />
        </div>
        <div class="col-12 col-md-6 my-0">
          <MultiselectCustom
            v-model="selectedCity"
            :options="cities"
            label="Ciudad"
            placeholder="Selecciona ciudad"
            label-key="name"
            track-by="id"
            :show-icons="true"
            helper-type="custom"
            :custom-default-icon="ICONS_MULTISELECT.city"
            :show-descriptions="false"
          />
        </div>

        <!-- Contraseñas -->
        <div class="col-12 col-md-6">
          <BaseInput
            id="password"
            v-model="form.password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            autocomplete="new-password"
            :rules="passwordRules"
          />
        </div>
        <div class="col-12 col-md-6">
          <BaseInput
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            label="Confirmar Contraseña"
            placeholder="••••••••"
            autocomplete="new-password"
            :rules="passwordConfirmationRules"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-select {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 0.95rem;
}

.custom-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.1);
}

.bg-light {
  background-color: #f9fafb !important;
}
</style>
