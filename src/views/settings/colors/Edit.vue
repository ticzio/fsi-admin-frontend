<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { URLS } from '@/const/api'

const props = defineProps<{
  id_target: string
  title: string
  item: { id: string | number; name?: string; hex_color?: string }
}>()

const emit = defineEmits<{ saved: [] }>()

const store = useStore()
const swal = useSwal()

const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const isLoading = ref(false)
const form = ref({
  name: '',
  hex_color: '#000000',
})

const openModal = (): void => {
  modalInstance?.show()
}

const closeModal = (): void => {
  modalInstance?.hide()
}

const normalizeHex = (value: string) => {
  const v = String(value || '').trim()
  if (!v) return ''
  return v.startsWith('#') ? v : `#${v}`
}

watch(
  () => props.item,
  (newItem) => {
    form.value = {
      name: newItem?.name || '',
      hex_color: normalizeHex(newItem?.hex_color || '#000000') || '#000000',
    }
  },
  { immediate: true },
)

const update = async (): Promise<void> => {
  if (!form.value.name.toString().trim()) {
    swal.showConfirm('El campo es obligatorio.', 'Por favor, ingresa un nombre.', {
      confirmButtonText: 'Aceptar',
      target: '#' + props.id_target,
      icon: 'error',
    })
    return
  }

  const hex = normalizeHex(form.value.hex_color)
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    swal.showConfirm('Error', 'El hex debe tener formato #RRGGBB.', {
      confirmButtonText: 'Aceptar',
      target: '#' + props.id_target,
      icon: 'error',
    })
    return
  }

  isLoading.value = true
  try {
    const response = await store.dispatch('updateData', {
      url: URLS.typeColor.update,
      id: props.item.id,
      data: {
        name: form.value.name,
        hex_color: hex,
      },
    })

    if (response && (response.code === 200 || response.code === 201)) {
      await swal.showConfirm('Éxito', 'Color editado correctamente.', {
        confirmButtonText: 'Aceptar',
        target: '#' + props.id_target,
        icon: 'success',
      })

      closeModal()
      emit('saved')
      return
    }
  } catch (error: any) {
    console.error('Error al editar el color:', error)
    await swal.showConfirm('Error al editar el color:', 'No se pudo editar el color.', {
      confirmButtonText: 'Aceptar',
      target: '#' + props.id_target,
      icon: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
  }
})

defineExpose({ openModal })
</script>

<template>
  <div ref="modalElement" :id="id_target" class="modal fade" tabindex="-1" style="z-index: 10000">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content rounded-4">
        <div class="modal-header bg-primary px-4">
          <h5 class="modal-title text-white text-camelcase">{{ title }}</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
            @click="closeModal"
          ></button>
        </div>

        <div class="modal-body">
          <div class="container my-3">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Nombre</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.name"
                  autocomplete="off"
                  placeholder="Nombre del color"
                />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Color (selector)</label>
                <input
                  type="color"
                  class="form-control form-control-color w-100"
                  v-model="form.hex_color"
                />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Hex</label>
                <div class="input-group">
                  <span class="input-group-text">#</span>
                  <input
                    type="text"
                    class="form-control"
                    :value="String(form.hex_color || '').replace('#', '')"
                    @input="(e) => (form.hex_color = '#' + (e.target as HTMLInputElement).value)"
                    placeholder="RRGGBB"
                    autocomplete="off"
                  />
                </div>
                <div class="form-text">Formato requerido: #RRGGBB</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-secondary rounded-pill px-4"
            @click="closeModal"
          >
            Cancelar
          </button>
          <button
            @click="update"
            type="button"
            class="btn btn-primary rounded-pill px-5"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
