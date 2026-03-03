<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

import { useSwalToast } from '@/composables/useSwalToast'
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useRoute, useRouter } from 'vue-router'
import { useLogger } from '@/composables/useLogger'
import { useMasters } from '@/composables/Masters/useMasters'

import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'

const router = useRouter()
const swalToast = useSwalToast()
const swal = useSwal()
const route = useRoute()
const store = useStore()
const logger = useLogger()

// Masters composable para roles
const { roles, customIconMapRole, customDescriptionMapRole, getRoles } = useMasters()

const filteredRoles = computed(() => {
  return roles.value.filter((role: any) => role.id != 1 && role.name !== 'Super Admin')
})

const errorMsg = ref('')
const selectedRole = ref<any>(null)
const initialImageUrl = ref<string | null>(null)
const isLoading = ref(false)
const isUpdate = ref(false)
const isLoadingPassword = ref(false)
const showPassword = ref(false)
const confirmPassword = ref('')

const isMobile = computed(() => store.getters.isMobile)

const unlockButtonIcon = computed(() => {
  if (form.value.failed_attempts >= 10) {
    return 'bi bi-lock-fill'
  }
  return BUTTONS.unlock.icon
})

const unlockButtonClass = computed(() => {
  if (form.value.failed_attempts >= 10) {
    return 'btn btn-warning rounded-3'
  }
  return BUTTONS.unlock.class
})

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  id_role: '',
  password: '',
  url_image: null,
  created_at: '',
  updated_at: '',
  failed_attempts: 0,
})

const updateAdministrator = async () => {
  const formData = new FormData()
  const errors = []

  if (!form.value.first_name.trim()) errors.push('El nombre es obligatorio.')
  if (!form.value.last_name.trim()) errors.push('El apellido es obligatorio.')
  if (!form.value.email.trim()) errors.push('El correo es obligatorio.')
  if (!form.value.phone.trim()) errors.push('El teléfono es obligatorio.')
  // Respetar validación del componente VenePhone
  if (errorMsg.value) errors.push(errorMsg.value)
  if (!selectedRole.value) errors.push('El rol es obligatorio.')

  if (errors.length > 0) {
    const errorsToShow = errors.slice(0, 3)
    let errorList = '<ul>' + errorsToShow.map((e) => `<li>${e}</li>`).join('') + '</ul>'
    if (errors.length > 3) {
      errorList += `<p class="mt-2 mb-0 fst-italic">Y ${errors.length - 3} error(es) más...</p>`
    }
    swalToast.showError(`Por favor, corrige los siguientes errores:${errorList}`)
    return
  }

  isUpdate.value = true

  try {
    formData.append('first_name', form.value.first_name)
    formData.append('last_name', form.value.last_name)
    // Normalizar y validar email
    const normalizedEmail = normalizeEmail(form.value.email)
    if (!isValidEmail(normalizedEmail)) {
      swalToast.showError('El correo electrónico no es válido. Verifica el formato.')
      return
    }
    form.value.email = normalizedEmail
    formData.append('email', normalizedEmail)
    formData.append('phone', form.value.phone)
    formData.append('id_role', String(selectedRole.value?.id || ''))

    if (form.value.url_image) {
      formData.append('url_image', form.value.url_image)
    }

    const payload = {
      id: route.params.id_administrator,
      data: formData,
    }
    const response = await store.dispatch('updateData', {
      url: URLS.administrator.update,
      data: payload.data,
      id: payload.id,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.administrator.update, payload, response)
      await store.dispatch('utils/setIsUpdating', true)
      swal.showSuccess('Administrador actualizado exitosamente')
      router.push({ name: 'Administradores' })
    } else if (response.code == 409) {
      logger.logRequest(URLS.administrator.update, payload, response)
      swalToast.showError(`Correo: ${form.value.email} ya está en uso.`)
    }
  } catch (error: any) {
    if (error?.code == 409 || error?.status == 409) {
      logger.logRequest(URLS.administrator.update, formData, error)
      swalToast.showError(`Correo: ${form.value.email} ya está en uso.`)
    } else {
      logger.logRequest(
        URLS.administrator.update,
        { id: route.params.id_administrator, data: formData },
        error,
      )
      swalToast.showError(`${ERROR.errorUpdate} administrador`)
    }
  } finally {
    isUpdate.value = false
  }
}

const updatePassword = async () => {
  const errors = []
  if (!form.value.password) errors.push('La contraseña es obligatoria.')

  if (errors.length > 0) {
    swalToast.showError(errors.join('\n'))
    return
  }

  isLoadingPassword.value = true

  try {
    const payload = {
      id: route.params.id_administrator,
      data: {
        password: form.value.password,
      },
    }
    const response = await store.dispatch('updateData', {
      url: URLS.administrator.update,
      data: payload.data,
      id: payload.id,
    })

    if (response && (response.code == 200 || response.code == 201)) {
      logger.logRequest(URLS.administrator.update, payload, response)
      form.value.password = ''
      confirmPassword.value = ''
      swalToast.showSuccess('Contraseña actualizada exitosamente')
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.administrator.update,
      { id: route.params.id_administrator, data: { password: form.value.password } },
      error,
    )
  } finally {
    isLoadingPassword.value = false
  }
}

const unlockAdministrator = async (item: any) => {
  const fullName = `${item.first_name} ${item.last_name}`.trim()
  const attempts = item.failed_attempts || 0

  let subtitle = `Esta acción desbloqueará al administrador ${fullName}.`
  if (attempts >= 10) {
    subtitle = `El administrador ha realizado ${attempts} intentos fallidos y se encuentra bloqueado.`
  }

  const result = await swal.showConfirm(`¿Estás seguro de desbloquear a ${fullName}?`, subtitle, {
    confirmButtonText: 'Sí, desbloquear',
    cancelButtonText: 'Cancelar',
  })

  if (!result) return

  const url = `${URLS.administrator.prefix}/unlock`

  try {
    const response = await store.dispatch('updateData', {
      url,
      id: item.id,
      data: {},
    })

    logger.logRequest(url, {}, response)

    if (response.code == 200 || response.code == 201) {
      swal.showSuccess('Administrador desbloqueado exitosamente')
      await getAdministrator()
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    swalToast.showError(`Error al desbloquear a ${fullName}`)
  }
}

const deleteAdministrator = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${item.first_name} ${item.last_name}?`,
    `Esta acción eliminará al administrador ${item.name} ${item.last_name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      id: item.id,
      status: 2,
    }
    const response = await store.dispatch('changeStatus', {
      url: URLS.administrator.changeStatus,
      ...payload,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.administrator.changeStatus, payload, response)
      await store.dispatch('utils/setIsDeleting', true)
      swal.showSuccess('Administrador eliminado exitosamente')
      router.push({ name: 'Administradores' })
    }
  } catch (error: any) {
    logger.logRequest(URLS.administrator.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} administrador`)
  }
}

const getAdministrator = async () => {
  const url = `${URLS.administrator.prefix}/${route.params.id_administrator}`
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url,
    })
    if (response.code == 200) {
      logger.logRequest(url, {}, response)
      form.value = response.data
      // Cargar el rol seleccionado
      if (response.data.role) {
        selectedRole.value = response.data.role
      }
      if (response.data.url_image) {
        initialImageUrl.value = response.data.url_image
      }
      if (response.data.failed_attempts) {
        form.value.failed_attempts = response.data.failed_attempts
      }
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    swalToast.showError(`${ERROR.errorGetRegister} administrador`)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await getRoles()
  await getAdministrator()
})
</script>

<template>
  <div class="mb-5 mt-4">
    <!-- Main Card -->
    <div class="container">
      <LoadingOverlay v-if="isLoading" message="Cargando datos del administrador" />
      <!-- Información Personal -->
      <div class="mb-4">
        <div class="mb-2 d-flex justify-content-between align-items-center border-bottom pb-3">
          <DateTimeBadges :created-at="form.created_at" :updated-at="form.updated_at" />
          <div class="d-flex gap-2">
            <button
              :class="unlockButtonClass"
              :data-title="BUTTONS.unlock.title"
              @click="unlockAdministrator(form)"
              :data-tooltip-pos="BUTTONS.unlock.tooltipPos"
            >
              <i :class="unlockButtonIcon"></i>

              <span class="text-capitalize ms-1" v-if="!isMobile">{{ BUTTONS.unlock.title }}</span>
            </button>
            <button
              :class="BUTTONS.delete.class"
              :data-title="BUTTONS.delete.title"
              @click="deleteAdministrator(form)"
              :data-tooltip-pos="BUTTONS.delete.tooltipPos"
            >
              <i :class="BUTTONS.delete.icon"></i>

              <span class="text-capitalize ms-1" v-if="!isMobile">{{ BUTTONS.delete.title }}</span>
            </button>
          </div>
        </div>

        <div class="row align-items-center">
          <h5 class="my-3">Información Personal</h5>
          <div class="col-lg-3 d-flex flex-column align-items-center">
            <label class="mb-2 fw-normal align-self-start">Foto de perfil</label>

            <ImageUploader
              v-model="form.url_image"
              :round="false"
              :initialImageUrl="initialImageUrl"
              :inputDisabled="false"
            />
          </div>
          <div class="col-lg-9">
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label">Nombre </label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  v-model="form.first_name"
                  placeholder="Nombre"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Apellido</label>
                <input
                  type="email"
                  class="form-control border-radius-left border-radius-right"
                  v-model="form.last_name"
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Número de teléfono</label>
                <VenePhone v-model="form.phone" @error="(error) => (errorMsg = error)" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Correo</label>
                <input
                  type="email"
                  class="form-control border-radius-left border-radius-right"
                  v-model="form.email"
                  placeholder="Correo"
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
            <div class="col-md-12 d-flex align-items-end justify-content-end">
              <button
                :class="BUTTONS.update.class"
                @click="updateAdministrator"
                :disabled="isLoading"
              >
                <i :class="BUTTONS.update.icon"></i>
                {{ isUpdate ? 'Actualizando...' : 'Actualizar administrador' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Contraseña -->
      <div class="">
        <h3 class="fs-5 mb-3">Seguridad</h3>
        <div class="row mb-3 align-items-end">
          <div class="col-12 col-md-6 mb-3 mb-md-0">
            <label class="form-label">Contraseña</label>
            <div class="input-group rounded-pill">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control rounded-start-pill"
                placeholder="Contraseña"
                v-model="form.password"
              />
              <button
                class="btn btn-light rounded-end-pill"
                type="button"
                @click="showPassword = !showPassword"
                tabindex="-1"
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
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-end">
          <button
            :class="BUTTONS.update.class"
            @click="updatePassword"
            :disabled="isLoadingPassword"
          >
            <i :class="BUTTONS.update.icon"></i>
            {{ isLoadingPassword ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </button>
        </div>
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
</style>
