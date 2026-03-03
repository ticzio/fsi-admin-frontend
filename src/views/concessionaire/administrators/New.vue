<script setup lang="ts">
import { ref } from 'vue'
import UserForm from '@/components/User/UserForm.vue'
import { useUserModel } from '@/composables/useUserModel'
import { useSwal } from '@/composables/useSwal'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const route = useRoute()
const store = useStore()
const swal = useSwal()

const { createUser, isLoading } = useUserModel()

const userFormRef = ref<InstanceType<typeof UserForm> | null>(null)

const handleSubmit = async (data: {
  userForm: any
  selectedRole: any
  selectedImage: File | null
  confirmPassword: string
}) => {
  const result = await createUser(
    data.userForm,
    data.selectedRole,
    data.selectedImage,
    userFormRef.value?.phoneError || '',
    data.confirmPassword,
    route.params.id_concessionaire as string,
  )

  if (result.success) {
    swal.showSuccess('Administrador creado exitosamente.')
    store.dispatch('utils/setIsCreating', true)
    router.replace({ name: 'Administradores (Concesionario)' })
  }
}

const handleBack = () => {
  router.replace({ name: 'Administradores (Concesionario)' })
}
</script>
<template>
  <UserForm
    ref="userFormRef"
    mode="create"
    button-text="Crear administrador"
    :is-loading="isLoading"
    @submit="handleSubmit"
    @back="handleBack"
  />
</template>
