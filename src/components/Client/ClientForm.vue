<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
import { useMasters } from '@/composables/Masters/useMasters'
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'
import { useSwalToast } from '@/composables/useSwalToast'
import { BUTTONS } from '@/const/buttonConst'
import { useStore } from 'vuex'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({}),
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingPassword: {
    type: Boolean,
    default: false,
  },
  showUnlock: {
    type: Boolean,
    default: false,
  },
  showDelete: {
    type: Boolean,
    default: false,
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['save', 'update', 'update-password', 'unlock', 'delete'])

const store = useStore()
const swalToast = useSwalToast()
const isMobile = computed(() => store.getters.isMobile)

// Masters composable
const {
  states,
  customIconMapState,
  customDescriptionMapState,
  getStates,
  cities,
  customIconMapCity,
  customDescriptionMapCity,
  getCities,
  clearCities,
} = useMasters()

// Form Data
const clientForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  dni: '',
  birthday: '',
  password: '',
  created_at: '',
  updated_at: '',
  ...props.initialData,
})

const confirmPassword = ref('')
const showPassword = ref(false)
const selectedImage = ref<File | null>(null)
const initialImageUrl = ref<string | null>(null)
const selectedState = ref<any>(null)
const selectedCity = ref<any>(null)
const phoneError = ref('')

// Computed
const unlockButtonIcon = computed(() => {
  if (props.failedAttempts >= 10) {
    return 'bi bi-lock-fill'
  }
  return BUTTONS.unlock.icon
})

const unlockButtonClass = computed(() => {
  if (props.failedAttempts >= 10) {
    return 'btn btn-warning rounded-3'
  }
  return BUTTONS.unlock.class
})

// Methods
const onStateChange = async () => {
  selectedCity.value = null
  if (selectedState.value?.id) {
    await getCities(selectedState.value.id)
  } else {
    clearCities()
  }
}

const validateForm = () => {
  const errors = []
  if (!clientForm.value.first_name?.trim()) errors.push('El nombre es obligatorio.')
  if (!clientForm.value.last_name?.trim()) errors.push('El apellido es obligatorio.')
  if (!clientForm.value.dni?.trim()) errors.push('La cédula es obligatoria.')
  if (!clientForm.value.email?.trim()) errors.push('El correo es obligatorio.')
  if (!clientForm.value.phone?.trim()) errors.push('El teléfono es obligatorio.')
  if (phoneError.value) errors.push(phoneError.value)
  if (!clientForm.value.birthday) errors.push('La fecha de nacimiento es obligatoria.')
  if (!selectedCity.value) errors.push('La ciudad es obligatoria.')

  if (!props.isEdit) {
    if (!clientForm.value.password?.trim()) errors.push('La contraseña es obligatoria.')
    if (!confirmPassword.value?.trim()) errors.push('La confirmación de contraseña es obligatoria.')
    if (clientForm.value.password !== confirmPassword.value)
      errors.push('Las contraseñas no coinciden.')
  }

  const normalizedEmail = normalizeEmail(clientForm.value.email)
  if (!isValidEmail(normalizedEmail)) {
    errors.push('El correo electrónico no es válido.')
  }

  if (errors.length > 0) {
    swalToast.showFormErrors(errors)
    return false
  }
  return true
}

const handleSave = () => {
  if (!validateForm()) return

  const formData = new FormData()
  formData.append('first_name', clientForm.value.first_name)
  formData.append('last_name', clientForm.value.last_name)
  formData.append('dni', clientForm.value.dni)
  formData.append('email', normalizeEmail(clientForm.value.email))
  formData.append('phone', clientForm.value.phone)
  formData.append('birthday', clientForm.value.birthday)
  formData.append('id_city', String(selectedCity.value.id))

  if (!props.isEdit) {
    formData.append('password', clientForm.value.password)
  }

  if (selectedImage.value) {
    formData.append('url_image', selectedImage.value)
  }

  if (props.isEdit) {
    emit('update', formData)
  } else {
    emit('save', formData)
  }
}

const handleUpdatePassword = () => {
  const errors = []
  if (!clientForm.value.password) errors.push('La contraseña es obligatoria.')
  if (!confirmPassword.value) errors.push('La confirmación de contraseña es obligatoria.')
  if (clientForm.value.password !== confirmPassword.value)
    errors.push('Las contraseñas no coinciden.')

  if (errors.length > 0) {
    swalToast.showFormErrors(errors)
    return
  }

  emit('update-password', { password: clientForm.value.password })
  clientForm.value.password = ''
  confirmPassword.value = ''
}

// Watchers and Initialization
watch(
  () => props.initialData,
  async (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      clientForm.value = { ...clientForm.value, ...newData }
      if (newData.birthday) {
        clientForm.value.birthday = newData.birthday.split('T')[0]
      }
      if (newData.url_image) {
        initialImageUrl.value = newData.url_image
      }
      // Load Location
      if (newData.id_city) {
        try {
          // If we have selectedCity already set and it matches, skip.
          if (selectedCity.value && selectedCity.value.id === newData.id_city) return

          // We need to fetch city to get state ID
          // Note: Ideally the parent passes full city object or we use a more efficient way
          const response = await store.dispatch('getData', {
            url: `${URLS.city.prefix}/${newData.id_city}`,
          })
          if (response.code === 200) {
            const city = response.data

            // Get State
            if (!states.value.length) await getStates()
            const state = states.value.find((s) => s.id === city.id_state)
            selectedState.value = state

            // Load cities for that state
            await getCities(city.id_state)

            // Set selected city
            selectedCity.value = cities.value.find((c: any) => c.id === city.id) ?? city
          }
        } catch (e) {
          console.error('Error loading location', e)
        }
      }
    }
  },
  { deep: true, immediate: true },
)

// Need to import URLS for the watch logic
import { URLS } from '@/const/api'

onMounted(async () => {
  if (!states.value.length) await getStates()
})
</script>

<template>
  <div>
    <!-- Header Actions (Delete/Unlock) for Edit Mode -->
    <div v-if="isEdit" class="mb-4">
      <div class="mb-2 d-flex justify-content-between align-items-center border-bottom pb-3">
        <DateTimeBadges :created-at="clientForm.created_at" :updated-at="clientForm.updated_at" />
        <div class="d-flex gap-2">
          <button
            v-if="showUnlock"
            :class="unlockButtonClass"
            :data-title="BUTTONS.unlock.title"
            :data-tooltip-pos="BUTTONS.unlock.tooltipPos"
            @click="$emit('unlock')"
          >
            <i :class="unlockButtonIcon"></i>
            <span class="text-capitalize ms-1" v-if="!isMobile">{{ BUTTONS.unlock.title }}</span>
          </button>
          <button
            v-if="showDelete"
            :class="BUTTONS.delete.class"
            :data-title="BUTTONS.delete.title"
            :data-tooltip-pos="BUTTONS.delete.tooltipPos"
            @click="$emit('delete')"
          >
            <i :class="BUTTONS.delete.icon"></i>
            <span class="text-capitalize ms-1" v-if="!isMobile">{{ BUTTONS.delete.title }}</span>
          </button>
        </div>
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
              v-model="clientForm.first_name"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Apellido</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
              placeholder="Apellido"
              v-model="clientForm.last_name"
            />
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6 mb-3 mb-md-0">
            <label class="form-label">RIF</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
              placeholder="Ej: J-12345678"
              v-model="clientForm.dni"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Fecha de nacimiento</label>
            <input
              type="date"
              class="form-control border-radius-left border-radius-right"
              v-model="clientForm.birthday"
            />
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6 mb-3 mb-md-0">
            <label class="form-label">Teléfono</label>
            <VenePhone v-model="clientForm.phone" @error="(e) => (phoneError = e)" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Correo</label>
            <input
              type="email"
              class="form-control border-radius-left border-radius-right"
              placeholder="Correo"
              v-model="clientForm.email"
            />
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6 mb-3 mb-md-0">
            <label class="form-label">Estado</label>
            <MultiselectCustom
              v-model="selectedState"
              :options="states"
              placeholder="Seleccionar estado"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapState"
              :custom-description-map="customDescriptionMapState"
              @select="onStateChange"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ciudad</label>
            <MultiselectCustom
              v-model="selectedCity"
              :options="cities"
              placeholder="Seleccionar ciudad"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapCity"
              :custom-description-map="customDescriptionMapCity"
              :disabled="!selectedState"
            />
          </div>
        </div>

        <!-- Save/Update Button -->
        <div class="col-md-12 d-flex align-items-end justify-content-end" v-if="isEdit">
          <button :class="BUTTONS.update.class" @click="handleSave" :disabled="loading">
            <i :class="BUTTONS.update.icon"></i>
            {{ loading ? 'Actualizando...' : 'Actualizar cliente' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Security Section -->
    <div>
      <h3 class="fs-5 mb-3">Seguridad</h3>
      <div class="row mb-4 align-items-end">
        <div class="col-12 col-md-6 mb-3 mb-md-0">
          <label class="form-label">Contraseña</label>
          <div class="input-group rounded-pill">
            <input
              :type="showPassword ? 'text' : 'password'"
              class="form-control rounded-start-pill"
              placeholder="Contraseña"
              v-model="clientForm.password"
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
          <div class="input-group rounded-pill">
            <input
              :type="showPassword ? 'text' : 'password'"
              class="form-control rounded-start-pill"
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
      <!-- Update Password Button (Only Edit Mode) -->
      <div class="d-flex justify-content-end" v-if="isEdit">
        <button
          :class="BUTTONS.update.class"
          @click="handleUpdatePassword"
          :disabled="loadingPassword"
        >
          <i :class="BUTTONS.update.icon"></i>
          {{ loadingPassword ? 'Actualizando...' : 'Actualizar Contraseña' }}
        </button>
      </div>
    </div>

    <!-- Create Button (Only New Mode) -->
    <div class="mb-2 d-flex justify-content-end align-items-center border-top pt-5" v-if="!isEdit">
      <button :class="BUTTONS.new.class" @click="handleSave" :disabled="loading">
        <i :class="BUTTONS.new.icon"></i>
        <span class="ms-1">{{ loading ? 'Guardando...' : 'Crear cliente' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-control:focus {
  box-shadow: none;
  border-color: #86b7fe;
}
</style>
