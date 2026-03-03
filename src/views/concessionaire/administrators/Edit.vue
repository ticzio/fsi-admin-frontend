<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import UserForm from '@/components/User/UserForm.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useUserModel } from '@/composables/useUserModel'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const route = useRoute()
const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()

const {
  getUser,
  updateUser,
  deleteUser,
  updatePassword,
  unlockUser,
  isLoading,
  isUpdate,
  isUpdatePassword,
} = useUserModel()

const concessionaireItem = computed(() => String(route.params.id_user))
const userFormRef = ref<InstanceType<typeof UserForm> | null>(null)

const createdAt = ref('')
const updatedAt = ref('')

const handleSubmit = async (data: {
  userForm: any
  selectedRole: any
  selectedImage: File | null
  confirmPassword: string
}) => {
  const result = await updateUser(
    data.userForm.id,
    data.userForm,
    data.selectedRole,
    data.selectedImage,
    userFormRef.value?.phoneError || '',
  )

  if (result.success) {
    swal.showSuccess('Administrador actualizado exitosamente.')
    store.dispatch('utils/setIsUpdating', true)
    router.push({ name: 'Administradores (Concesionario)' })
  }
}

const handleDelete = async () => {
  const userForm = userFormRef.value?.userForm
  const fullName = `${userForm?.first_name} ${userForm?.last_name}`.trim()

  const result = await deleteUser(concessionaireItem.value, fullName)

  if (result.success) {
    swal.showSuccess('Administrador eliminado exitosamente')
    router.replace({ name: 'Administradores (Concesionario)' })
  }
}

const handleUpdatePassword = async (data: { password: string; confirmPassword: string }) => {
  const userForm = userFormRef.value?.userForm
  if (!userForm?.id) return

  const result = await updatePassword(userForm.id, data.password, data.confirmPassword)

  if (result.success) {
    swalToast.showSuccess('Contraseña actualizada exitosamente')
    // Clear password fields
    if (userFormRef.value) {
      userFormRef.value.userForm.password = ''
    }
  }
}

const handleUnlock = async () => {
  const userForm = userFormRef.value?.userForm
  if (!userForm?.id) return

  const fullName = `${userForm?.first_name} ${userForm?.last_name}`.trim()
  const attempts = userForm.failed_attempts || 0

  let subtitle = `Esta acción desbloqueará al usuario ${fullName}.`

  if (attempts >= 10) {
    subtitle = `El usuario ha realizado ${attempts} intentos fallidos y se encuentra bloqueado.`
  }

  const result = await unlockUser(userForm.id, fullName, subtitle)

  if (result.success) {
    swal.showSuccess('Usuario desbloqueado exitosamente')
    await loadUserData()
  }
}

const loadUserData = async () => {
  const result = await getUser(concessionaireItem.value)

  if (result.success && result.data) {
    const data = result.data

    // Store timestamps
    createdAt.value = data.user.created_at
    updatedAt.value = data.user.updated_at

    // Load user data into the form
    if (userFormRef.value) {
      userFormRef.value.loadUserData({
        id: data.user.id,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.role,
        url_image: data.user.url_image,
        failed_attempts: data.user.failed_attempts,
      })
    }
  }
}

onMounted(async () => {
  await loadUserData()
})

const handleBack = () => {
  router.replace({ name: 'Administradores (Concesionario)' })
}
</script>

<template>
  <div class="mb-5 mt-4">
    <div class="container position-relative">
      <LoadingOverlay v-if="isLoading" message="Cargando datos del administrador" />
      <UserForm
        ref="userFormRef"
        mode="edit"
        :show-delete-button="true"
        :show-unlock-button="true"
        :show-update-button="true"
        :show-update-password-button="true"
        :show-date-time-badges="true"
        :created-at="createdAt"
        :updated-at="updatedAt"
        :is-update="isUpdate"
        :is-update-password="isUpdatePassword"
        @submit="handleSubmit"
        @delete="handleDelete"
        @unlock="handleUnlock"
        @update-password="handleUpdatePassword"
        @back="handleBack"
      />
    </div>
  </div>
</template>
