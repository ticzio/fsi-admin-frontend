<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSwalToast } from '@/composables/useSwalToast'
import { useUsers } from '@/composables/Models/useUsers'

import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import OperatorForm from '@/components/Operators/OperatorForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { BUTTONS } from '@/const/buttonConst'

const router = useRouter()
const { saveUser, loading } = useUsers()

const roleOptions = ref([
  { id: 1, name: 'Operador Principal' },
  { id: 2, name: 'Soporte Técnico' },
])

const form = reactive({
  url_image: null as File | null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  id_type_rol_user: null as any,
  password: '',
  password_confirmation: '',
})

const saveOperator = async () => {
  const success = await saveUser(form as any, false)
  if (success) {
    router.push('/operators')
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="d-flex flex-column h-100 gap-4">
      <div class="d-flex justify-content-between align-items-center">
        <titleSection
          :title="TITLE_SECTION_COMPONENT.operators.new"
          :description="TITLE_SECTION_COMPONENT.operators.newDescription"
          :show-logo="true"
        />
      </div>
      <div class="card border border-light shadow-sm rounded-4 p-4 flex-grow-1 overflow-auto">
        <form id="operatorForm" @submit.prevent="saveOperator" class="d-flex flex-column gap-4">
          <OperatorForm :form="form" :roleOptions="roleOptions" />
        </form>
      </div>
      <!-- BOTONES DE ACCIÓN -->
      <div class="d-flex justify-content-end gap-3 mt-4">
        <button type="submit" form="operatorForm" :class="BUTTONS.save.class" :disabled="loading">
          <LoadingSpinner v-if="loading" />
          <i v-else :class="BUTTONS.save.icon"></i>
          {{ BUTTONS.save.title }}
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>
