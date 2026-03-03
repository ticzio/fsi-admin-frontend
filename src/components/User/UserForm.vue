<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
import { useMasters } from '@/composables/Masters/useMasters'
import { BUTTONS } from '@/const/buttonConst'

interface Props {
  mode?: 'create' | 'edit'
  userId?: string
  showPasswordSection?: boolean
  showDeleteButton?: boolean
  showUnlockButton?: boolean
  showUpdateButton?: boolean
  showUpdatePasswordButton?: boolean
  buttonText?: string
  isLoading?: boolean
  isUpdate?: boolean
  isUpdatePassword?: boolean
  showDateTimeBadges?: boolean
  createdAt?: string
  updatedAt?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  showPasswordSection: true,
  showDeleteButton: false,
  showUnlockButton: false,
  showUpdateButton: false,
  showUpdatePasswordButton: false,
  buttonText: 'Crear administrador',
  isLoading: false,
  isUpdate: false,
  isUpdatePassword: false,
  showDateTimeBadges: false,
  createdAt: '',
  updatedAt: '',
})

const emit = defineEmits<{
  submit: [
    data: {
      userForm: any
      selectedRole: any
      selectedImage: File | null
      confirmPassword: string
    },
  ]
  delete: []
  unlock: []
  updatePassword: [data: { password: string; confirmPassword: string }]
  back: []
}>()

// Masters composable para roles
const { roles, customIconMapRole, customDescriptionMapRole, getRoles } = useMasters()

const showPassword = ref(false)
const confirmPassword = ref('')
const selectedRole = ref<any>(null)
const selectedImage = ref<File | null>(null)
const phoneError = ref('')
const initialImageUrl = ref<string | null>(null)

const userForm = ref({
  id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  failed_attempts: 0,
})

const isMobile = computed(() => {
  // Simple mobile detection based on window width
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const handleSubmit = () => {
  emit('submit', {
    userForm: userForm.value,
    selectedRole: selectedRole.value,
    selectedImage: selectedImage.value,
    confirmPassword: confirmPassword.value,
  })
}

const handleDelete = () => {
  emit('delete')
}

const handleUnlock = () => {
  emit('unlock')
}

const handleBack = () => {
  emit('back')
}

const handleUpdatePassword = () => {
  emit('updatePassword', {
    password: userForm.value.password,
    confirmPassword: confirmPassword.value,
  })
}

const loadUserData = (data: any) => {
  userForm.value = {
    id: data.id || '',
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    email: data.email || '',
    phone: data.phone || '',
    password: '',
    failed_attempts: 0,
  }

  if (data.role) {
    selectedRole.value = data.role
  }

  if (data.url_image) {
    initialImageUrl.value = data.url_image
  }

  if (data.failed_attempts) {
    userForm.value.failed_attempts = data.failed_attempts
  }
}

const unlockButtonIcon = computed(() => {
  if (userForm.value.failed_attempts >= 10) {
    return 'bi bi-lock-fill'
  }
  return BUTTONS.unlock.icon
})

const unlockButtonClass = computed(() => {
  if (userForm.value.failed_attempts >= 10) {
    return 'btn btn-warning rounded-3'
  }
  return BUTTONS.unlock.class
})

const clearPasswordFields = () => {
  userForm.value.password = ''
  confirmPassword.value = ''
}

// Expose methods for parent components
defineExpose({
  loadUserData,
  clearPasswordFields,
  userForm,
  selectedRole,
  selectedImage,
  phoneError,
})

onMounted(async () => {
  await getRoles({ id_type_environment: 5 })
})
</script>

<template>
  <div class="mb-5 mt-4">
    <div class="d-flex justify-content-end mb-3 pe-3">
      <button class="btn btn-outline-primary rounded-3" @click="handleBack">
        <i class="bi bi-arrow-left"></i>
        <span class="ms-1">Volver</span>
      </button>
    </div>
    <div class="container" :class="{ 'position-relative': mode === 'edit' }">
      <!-- Información Personal -->
      <div class="mb-4">
        <!-- Header con badges y botón de eliminar (solo en modo edición) -->
        <div
          v-if="showDateTimeBadges && mode === 'edit'"
          class="mb-2 d-flex justify-content-between align-items-center border-bottom pb-3"
        >
          <DateTimeBadges :created-at="createdAt" :updated-at="updatedAt" />
          <div class="d-flex gap-2">
            <button
              v-if="showUnlockButton"
              :class="unlockButtonClass"
              :data-title="BUTTONS.unlock.title"
              :data-tooltip-pos="BUTTONS.unlock.tooltipPos"
              @click="handleUnlock"
            >
              <i :class="unlockButtonIcon"></i>
              <span class="text-capitalize ms-1" v-if="!isMobile">{{ BUTTONS.unlock.title }}</span>
            </button>
            <button
              v-if="showDeleteButton"
              :class="BUTTONS.delete.class"
              :data-title="BUTTONS.delete.title"
              :data-tooltip-pos="BUTTONS.delete.tooltipPos"
              @click="handleDelete"
            >
              <i :class="BUTTONS.delete.icon"></i>
              <span class="text-capitalize ms-1" v-if="!isMobile">{{ BUTTONS.delete.title }}</span>
            </button>
          </div>
        </div>

        <div class="row align-items-center">
          <h5 class="my-3">Información personal</h5>
          <div class="col-lg-3 d-flex flex-column align-items-center">
            <label class="mb-2 fw-normal align-self-start">Foto de perfil</label>
            <ImageUploader
              v-model="selectedImage"
              @update:model-value="selectedImage = $event"
              :round="false"
              :initialImageUrl="initialImageUrl"
              :inputDisabled="false"
            />
          </div>
          <div class="col-lg-9">
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label">Nombre</label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Nombre"
                  v-model="userForm.first_name"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Apellido</label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Apellido"
                  v-model="userForm.last_name"
                />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <VenePhone v-model="userForm.phone" @error="(e) => (phoneError = e)" />
              </div>
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label">Correo</label>
                <input
                  type="email"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Correo"
                  v-model="userForm.email"
                />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label">Rol</label>
                <MultiselectCustom
                  v-model="selectedRole"
                  :options="roles"
                  placeholder="Seleccionar rol"
                  helper-type="roles"
                  variant="primary"
                  :custom-icon-map="customIconMapRole"
                  :custom-description-map="customDescriptionMapRole"
                />
              </div>
            </div>
            <!-- Botón de actualizar (solo en modo edición) -->
            <div
              v-if="showUpdateButton && mode === 'edit'"
              class="col-md-12 d-flex align-items-end justify-content-end"
            >
              <button :class="BUTTONS.update.class" @click="handleSubmit" :disabled="isUpdate">
                <i :class="BUTTONS.update.icon"></i>
                {{ isUpdate ? 'Actualizando...' : 'Actualizar administrador' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Contraseña -->
      <div v-if="showPasswordSection">
        <h3 class="fs-5 mb-3">Seguridad</h3>
        <div class="row mb-4 align-items-end" :class="{ 'mb-3': mode === 'edit' }">
          <div class="col-12 col-md-6 mb-3 mb-md-0">
            <label class="form-label">Contraseña</label>
            <div class="input-group rounded-3">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control rounded-2"
                placeholder="Contraseña"
                v-model="userForm.password"
              />
              <button
                class="btn btn-light rounded-end-pill"
                type="button"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
              </button>
            </div>
          </div>
          <div class="col-12 col-md-6 mb-3 mb-md-0">
            <label class="form-label">Confirmar contraseña</label>
            <div class="input-group rounded-3">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control rounded-2"
                placeholder="Confirmar contraseña"
                v-model="confirmPassword"
              />
              <button
                class="btn btn-light rounded-end-pill"
                type="button"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
              </button>
            </div>
          </div>
        </div>
        <!-- Botón de actualizar contraseña (solo en modo edición) -->
        <div v-if="showUpdatePasswordButton && mode === 'edit'" class="d-flex justify-content-end">
          <button
            :class="BUTTONS.update.class"
            @click="handleUpdatePassword"
            :disabled="isUpdatePassword"
          >
            <i :class="BUTTONS.update.icon"></i>
            {{ isUpdatePassword ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </button>
        </div>
      </div>

      <!-- Botón de crear/guardar (solo en modo creación o cuando no hay botones separados) -->
      <div
        v-if="mode === 'create' || (!showUpdateButton && !showUpdatePasswordButton)"
        class="mb-2 d-flex justify-content-end align-items-center border-top pt-5"
      >
        <button :class="BUTTONS.new.class" @click="handleSubmit" :disabled="isLoading">
          <i :class="BUTTONS.new.icon"></i>
          <span class="ms-1">{{ isLoading ? 'Guardando...' : buttonText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
