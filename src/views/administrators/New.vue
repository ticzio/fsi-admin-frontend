<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import { useSwal } from '@/composables/useSwal'
import { useRouter } from 'vue-router'
import { useSwalToast } from '@/composables/useSwalToast'
import { useStore } from 'vuex'
import { useLogger } from '@/composables/useLogger'
import { useMasters } from '@/composables/Masters/useMasters'
import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'

const router = useRouter()
const store = useStore()
const swalToast = useSwalToast()
const swal = useSwal()
const logger = useLogger()

// Masters composable para roles
const { roles, customIconMapRole, customDescriptionMapRole, getRoles } = useMasters()

const filteredRoles = computed(() => {
  return roles.value.filter((role: any) => role.id != 1 && role.name !== 'Super Admin')
})

const showPassword = ref(false)
const confirmPassword = ref('')
const isLoading = ref(false)
const selectedRole = ref<any>(null)
const adminForm = ref({
  id_role: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
})
const selectedImage = ref<File | null>(null)
const phoneError = ref('')

const saveAdministrator = async () => {
  const formData = new FormData()
  const errors = []

  if (!adminForm.value.first_name.trim()) errors.push('El nombre es obligatorio.')
  if (!adminForm.value.last_name.trim()) errors.push('El apellido es obligatorio.')
  if (!adminForm.value.email.trim()) errors.push('El correo es obligatorio.')
  if (!adminForm.value.phone.trim()) errors.push('El teléfono es obligatorio.')
  if (phoneError.value) errors.push(phoneError.value)
  if (!adminForm.value.password.trim()) errors.push('La contraseña es obligatoria.')
  if (!confirmPassword.value.trim()) errors.push('La confirmación de contraseña es obligatoria.')
  if (!selectedRole.value) errors.push('El rol es obligatorio.')
  if (adminForm.value.password !== confirmPassword.value)
    errors.push('Las contraseñas no coinciden.')

  if (errors.length > 0) {
    swalToast.showFormErrors(errors)
    return
  }

  formData.append('first_name', adminForm.value.first_name)
  formData.append('last_name', adminForm.value.last_name)
  // Normalizar y validar email
  const normalizedEmail = normalizeEmail(adminForm.value.email)
  if (!isValidEmail(normalizedEmail)) {
    return
  }
  adminForm.value.email = normalizedEmail
  formData.append('email', normalizedEmail)
  formData.append('phone', adminForm.value.phone)
  formData.append('id_role', (selectedRole.value as any).id)
  formData.append('password', adminForm.value.password)

  if (selectedImage.value) {
    formData.append('url_image', selectedImage.value)
  }

  isLoading.value = true

  try {
    const result = await store.dispatch('createData', {
      url: URLS.administrator.save,
      data: formData,
    })
    if (result.code == 201 || result.code == 200) {
      logger.logRequest(URLS.administrator.save, formData, result)
      swal.showSuccess('Administrador creado exitosamente.')
      store.dispatch('utils/setIsCreating', true)
      router.push({ name: 'Administradores' })
    } else if (result.code == 409) {
      logger.logRequest(URLS.administrator.save, formData, result)
      swalToast.showError(`Correo: ${adminForm.value.email} ya está en uso.`)
    }
  } catch (error: any) {
    if (error?.code == 409 || error?.status == 409) {
      logger.logRequest(URLS.administrator.save, formData, error)
      swalToast.showError(`Correo: ${adminForm.value.email} ya está en uso.`)
    } else {
      logger.logRequest(URLS.administrator.save, formData, error)
      swalToast.showError(`${ERROR.errorCreate} administrador`)
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await getRoles()
})
</script>
<template>
  <div class="mb-5 mt-4">
    <div class="container">
      <!-- Información Personal -->
      <div class="mb-4">
        <div class="row align-items-center">
          <h5 class="my-3">Información personal</h5>
          <div class="col-lg-3 d-flex flex-column align-items-center">
            <label class="mb-2 fw-normal align-self-start">Foto de perfil</label>
            <ImageUploader
              v-model="selectedImage"
              @update:model-value="selectedImage = $event"
              :round="false"
              :initialImageUrl="null"
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
                  v-model="adminForm.first_name"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Apellido</label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Apellido"
                  v-model="adminForm.last_name"
                />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <VenePhone v-model="adminForm.phone" @error="(e) => (phoneError = e)" />
              </div>
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label">Correo</label>
                <input
                  type="email"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Correo"
                  v-model="adminForm.email"
                />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label">Rol</label>
                <MultiselectCustom
                  v-model="selectedRole"
                  :options="filteredRoles"
                  placeholder="Seleccionar rol"
                  helper-type="roles"
                  variant="primary"
                  :custom-icon-map="customIconMapRole"
                  :custom-description-map="customDescriptionMapRole"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contraseña -->
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
                v-model="adminForm.password"
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
      </div>
      <div class="mb-2 d-flex justify-content-end align-items-center border-top pt-5">
        <button :class="BUTTONS.new.class" @click="saveAdministrator" :disabled="isLoading">
          <i :class="BUTTONS.new.icon"></i>
          <span class="ms-1">{{ isLoading ? 'Guardando...' : 'Crear administrador' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.nav-tabs .nav-link.active {
  border: none;
  border-bottom: 2px solid #222;
  background: none;
  color: #222;
}
.nav-tabs .nav-link {
  border: none;
  background: none;
  color: #bbb;
  font-weight: 500;
}
/* Estilo para la imagen de perfil si no se carga */
.border.rounded-circle.overflow-hidden.d-flex.align-items-center.justify-content-center img {
  object-fit: cover;
}
</style>
