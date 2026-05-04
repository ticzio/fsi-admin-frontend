<script setup lang="ts">
import { ref } from 'vue'
import { useBenefits } from '@/composables/Models/useBenefits'
import type { BenefitInterface } from '@/composables/Models/useBenefits'
import Modal from '@/components/common/Modal.vue'
import BenefitForm from '@/components/Benefits/BenefitForm.vue'

const props = defineProps<{
  idLevel: string | number
  benefits: BenefitInterface[]
  loading?: boolean
}>()

const emit = defineEmits(['refresh'])

const { saveBenefit, loading: saving } = useBenefits()
const editModalRef = ref<InstanceType<typeof Modal> | null>(null)
const selectedBenefit = ref<BenefitInterface | null>(null)

const handleCreate = () => {
  selectedBenefit.value = {
    id: '',
    id_level: props.idLevel,
    body: '',
  }
  editModalRef.value?.openModal()
}

const handleEdit = (benefit: BenefitInterface) => {
  selectedBenefit.value = { ...benefit }
  editModalRef.value?.openModal()
}

const onFormSubmit = async (data: BenefitInterface) => {
  const isEditing = !!data.id
  const success = await saveBenefit(data, isEditing)
  if (success) {
    editModalRef.value?.closeModal()
    emit('refresh')
  }
}
</script>

<template>
  <div class="benefit-list-redesign mb-5">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold mb-0">Beneficios:</h5>
      <button 
        class="btn btn-success btn-sm rounded-3 d-flex align-items-center gap-2 text-white px-3"
        @click="handleCreate"
      >
        <i class="bi bi-plus-lg"></i>
        Nuevo Beneficio
      </button>
    </div>
    <div class="benefit-card bg-white rounded-5 border border-light-subtle p-4 shadow-sm">
      <h6 class="fw-bold mb-4"><i>Tus beneficios exclusivos</i></h6>
      
      <div v-if="loading" class="d-flex justify-content-center p-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="benefits.length === 0" class="text-center p-5 text-muted">
        No hay beneficios configurados para este nivel.
      </div>
      <div v-else class="d-flex flex-column gap-4">
        <div v-for="benefit in benefits" :key="benefit.id" class="d-flex align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-wrapper d-flex align-items-center justify-content-center rounded-2" style="width: 32px; height: 32px; background-color: transparent;">
              <i class="bi bi-patch-check-fill text-success fs-4"></i>
            </div>
            <div class="text-dark" v-html="benefit.body_only_text || benefit.body"></div>
          </div>
          
          <div class="actions">
            <button 
              class="btn btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" 
              style="width: 32px; height: 32px;"
              @click="handleEdit(benefit)"
              title="Editar beneficio"
            >
              <i class="bi bi-pencil-fill fs-6"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <Modal
      id="editBenefitModal"
      ref="editModalRef"
      :title="selectedBenefit?.id ? 'Editar Beneficio' : 'Nuevo Beneficio'"
      size="lg"
    >
      <BenefitForm
        v-if="selectedBenefit"
        :key="selectedBenefit.id || 'new'"
        :initial-data="selectedBenefit"
        :loading="saving"
        @submit="onFormSubmit"
        @cancel="editModalRef?.closeModal()"
      />
    </Modal>
  </div>
</template>

<style scoped>
.benefit-card {
  border-color: #f0f0f0 !important;
  min-height: 200px;
}

.text-success {
  color: #28a745 !important;
}

.btn-outline-primary {
  border-color: #e5e7eb;
  color: #6b7280;
}

.btn-outline-primary:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #3b82f6;
}
</style>
