<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import { useSwal } from '@/composables/useSwal'
import InputRif from '@/components/common/InputRif.vue'
import { URLS } from '@/const/api'

const store = useStore()
const { showConfirm } = useSwal()

const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const rif = ref('')
const placa = ref('')
const formError = ref('')
const isJsonStyled = ref(false)
const isLoading = ref(false)
const responseData = ref<any>(null)

const openModal = () => {
  rif.value = ''
  placa.value = ''
  formError.value = ''
  isJsonStyled.value = false
  responseData.value = null
  modalInstance?.show()
}

const closeModal = () => {
  modalInstance?.hide()
}

const handleSubmit = async () => {
  formError.value = ''

  if (!rif.value || !placa.value) {
    formError.value = 'Por favor complete todos los campos.'
    return
  }

  if (rif.value.length < 6) {
    formError.value = 'El RIF debe ser válido.'
    return
  }

  const result = await showConfirm(
    '¿Estás seguro?',
    `Se enviarán los datos: RIF: ${rif.value}, Placa: ${placa.value}`,
    {
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    isLoading.value = true
    responseData.value = null
    const response = await store.dispatch('getData', {
      url: `${URLS.clientVehicle.prefix}/test_vehicle_sipcon`,
      params: {
        vat: rif.value,
        plate: placa.value,
      },
    })
    if (response.code === 200) {
      responseData.value = response.data
    }
  } catch (error: any) {
    responseData.value = 'Ha ocurrido un error.'
  } finally {
    isLoading.value = false
  }
}

// JSON syntax highlighting
const formattedJson = computed(() => {
  if (!responseData.value) return ''

  if (!isJsonStyled.value) {
    return JSON.stringify(responseData.value, null, 2)
  }

  const json = JSON.stringify(responseData.value, null, 2)

  // Basic syntax highlighting with regex
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = 'json-number'
      if (/^"|/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return '<span class="' + cls + '">' + match + '</span>'
    },
  )
})

const hasResponse = computed(() => !!responseData.value)

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
  }
})

defineExpose({ openModal, closeModal })
</script>

<template>
  <div
    class="modal fade"
    ref="modalElement"
    tabindex="-1"
    aria-labelledby="sipconModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold" id="sipconModalLabel">Probar conexión SIPCON</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body pt-4">
          <div class="row">
            <!-- Left Column: Inputs -->
            <div class="col-lg-4 border-end">
              <div v-if="formError" class="alert alert-danger" role="alert">
                {{ formError }}
              </div>

              <div class="mb-3">
                <InputRif label="RIF" v-model="rif" placeholder="Ej: J-12345678" :required="true" />
              </div>

              <div class="mb-3">
                <label for="placaInput" class="form-label fw-bold">Placa del Vehículo</label>
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="placaInput"
                  v-model="placa"
                  placeholder="Ej: ABC1234"
                />
              </div>

              <div class="mt-4 d-grid">
                <button
                  type="button"
                  class="btn btn-primary btn-lg"
                  @click="handleSubmit"
                  :disabled="isLoading"
                >
                  <span
                    v-if="isLoading"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Enviar Petición
                </button>
              </div>
            </div>

            <!-- Right Column: JSON Response -->
            <div class="col-lg-8">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold m-0">Respuesta del Backend</h6>
                <div class="form-check form-switch" v-if="hasResponse">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="flexSwitchCheckDefault"
                    v-model="isJsonStyled"
                  />
                  <label class="form-check-label" for="flexSwitchCheckDefault"
                    >Estilizar JSON</label
                  >
                </div>
              </div>

              <div class="json-viewer-container bg-light rounded p-3 h-100 position-relative">
                <div v-if="!hasResponse" class="text-muted text-center mt-5">
                  <i class="bi bi-code-slash fs-1 d-block mb-2"></i>
                  <p>La respuesta aparecerá aquí...</p>
                </div>

                <pre
                  v-else
                  class="json-content m-0"
                  :class="{ styled: isJsonStyled }"
                  v-html="formattedJson"
                ></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  background-color: #fff;
  min-height: 500px;
}

.json-viewer-container {
  height: 450px; /* Fixed height to ensure scrolling within this area */
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  overflow: auto; /* Enable scrolling for both axes */
  border-radius: 0.375rem;
}

.json-content {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  white-space: pre-wrap; /* Preserve formatting and wrap lines */
  word-break: break-all; /* Ensure long strings don't overflow horizontally */
}

/* Syntax Highlighting Styles */
:deep(.json-key) {
  color: #a52a2a; /* Brown for keys */
  font-weight: bold;
}

:deep(.json-string) {
  color: #2e8b57; /* SeaGreen for strings */
}

:deep(.json-number) {
  color: #0000ff; /* Blue for numbers */
}

:deep(.json-boolean) {
  color: #0000ff; /* Blue for booleans */
  font-weight: bold;
}

:deep(.json-null) {
  color: #808080; /* Gray for null */
  font-weight: bold;
}
</style>
