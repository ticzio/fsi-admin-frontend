<script setup lang="ts">
import { computed } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import {
  hasMinLength,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  hasSpecialChar,
} from '@/utils/funcPassword'
import { isValidPhone } from '@/utils/funcPhones'

const props = defineProps<{
  form: any
  roleOptions: any[]
}>()

const isEdit = computed(() => !!props.form.id)

const passwordRules = [
  (v: string) => (isEdit.value ? true : !!v || 'La contraseña es obligatoria'),
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
        <div class="col-12 col-md-6">
          <BaseInput
            id="first_name"
            v-model="form.first_name"
            label="Nombres"
            placeholder="Ej. Juan Carlos"
            :rules="[(v) => !!v || 'El nombre es obligatorio']"
          />
        </div>
        <div class="col-12 col-md-6">
          <BaseInput
            id="last_name"
            v-model="form.last_name"
            label="Apellidos "
            placeholder="Ej. Pérez"
            :rules="[(v) => !!v || 'El apellido es obligatorio']"
          />
        </div>
        <div class="col-12 col-md-6">
          <BaseInput
            id="email"
            v-model="form.email"
            type="email"
            label="Correo Electrónico "
            placeholder="Ej. juan.perez@ejemplo.com"
            :rules="[(v) => !!v || 'El correo es obligatorio']"
          />
        </div>
        <div class="col-12 col-md-6">
          <BaseInput
            id="phone"
            v-model="form.phone"
            label="Teléfono"
            placeholder="Ej. 04141234567"
            :rules="[
              (v) => !!v || 'El teléfono es obligatorio',
              (v) => !v || isValidPhone(v) || 'El formato del teléfono es inválido',
            ]"
          />
        </div>
        <!-- Contraseñas: Usamos autoComplete 'new-password' recomendado en las conversaciones previas para prevenir autocompletado en esta app -->
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
