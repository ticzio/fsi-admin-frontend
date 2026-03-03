<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import ImageUploader from '@/components/common/ImageUploader.vue'
import titleSection from '@/components/common/titleSection.vue'
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { useSwal } from '@/composables/useSwal'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useCookies } from '@/composables/useCookies'
import { useLogger } from '@/composables/useLogger'
import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { NOTIFICATION_TYPES } from '@/const/notificationConst'

import { useSwalToast } from '@/composables/useSwalToast'

const router = useRouter()
const store = useStore()
const swalToast = useSwalToast()
const swal = useSwal()
const cookies = useCookies()
const logger = useLogger()
const isLoading = ref(false)

// Formulario de noticia
const newsForm = ref({
  title: '',
  content: '',
  url_file: '',
})

const mainImage = ref<File | null>(null)
const mainImagePreview = ref<string | null>(null)

// Opciones de Quill
const quillOptions = {
  placeholder: 'Escribe el contenido de la noticia...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link'],
      ['clean'],
    ],
  },
}

// Watchers para preview de imágenes
const handleMainImageChange = (file: File | null) => {
  mainImage.value = file
  if (file) {
    mainImagePreview.value = URL.createObjectURL(file)
  } else {
    mainImagePreview.value = null
  }
}

// Fecha formateada para el preview
const formattedDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const sendPushNotification = async (newsId: any) => {
  try {
    if (newsId) {
      await store.dispatch('createData', {
        url: 'notification/notify_user',
        data: {
          id: newsId,
          type: NOTIFICATION_TYPES.NEW_NOTICE,
        },
      })
    }
  } catch (error) {
    console.error('Error al enviar notificación:', error)
  }
}

const saveNews = async () => {
  const formData = new FormData()
  const errors = []

  if (!newsForm.value.title.trim()) errors.push('El título es obligatorio.')
  if (!newsForm.value.content.trim()) errors.push('El contenido es obligatorio.')

  if (errors.length > 0) {
    swalToast.showFormErrors(errors)
    return
  }

  formData.append('title', newsForm.value.title)
  formData.append('body', newsForm.value.content)
  formData.append('id_creator', cookies.getCookie('changan_admin_id_admin') || '')
  formData.append('url_file', newsForm.value.url_file)

  const mainImageFile = mainImage.value

  if (mainImageFile) {
    formData.append('url_image', mainImageFile)
  }

  isLoading.value = true

  try {
    const result = await store.dispatch('createData', {
      url: URLS.news.save,
      data: formData,
    })
    if (result.code == 201 || result.code == 200) {
      logger.logRequest(URLS.news.save, Object.fromEntries(formData), result)
      swal.showSuccess('Noticia creada exitosamente.')
      store.dispatch('utils/setIsCreating', true)

      // Enviar notificación push
      const newsId = result.id || result.data?.id
      sendPushNotification(newsId)

      router.push({ name: 'Noticias' })
    } else if (result.code == 409) {
      swalToast.showError('Ya existe una noticia con ese título.')
    }
  } catch (error: any) {
    logger.logRequest(URLS.news.save, Object.fromEntries(formData), error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  logger.logRequest(
    'onMounted',
    { view: 'news/New' },
    { message: 'Vista de nueva noticia montada' },
  )
})
</script>
<template>
  <div class="mb-5 mt-4">
    <div class="container-fluid">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.news.new"
        :description="TITLE_SECTION_COMPONENT.news.newDescription"
      />

      <div class="row g-4">
        <!-- COLUMNA IZQUIERDA: Formulario -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <h5 class="fw-bold mb-4">Información de la noticia</h5>

              <!-- Título -->
              <div class="mb-3">
                <label class="form-label fw-medium">Título</label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Escribe el título de la noticia"
                  v-model="newsForm.title"
                />
              </div>

              <!-- Imágenes -->
              <div class="row mb-3">
                <div class="col-md-6 mb-3 mb-md-0">
                  <label class="form-label fw-medium">Imagen principal</label>
                  <ImageUploader
                    v-model="mainImage"
                    @update:model-value="handleMainImageChange"
                    :round="false"
                    :initialImageUrl="null"
                    :inputDisabled="false"
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-medium">Link de la noticia</label>
                <input
                  type="url"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="https://..."
                  v-model="newsForm.url_file"
                />
                <div class="form-text">Solo se permite una URL.</div>
              </div>

              <!-- Contenido con Quill -->
              <div class="mb-4">
                <label class="form-label fw-medium">Contenido</label>
                <QuillEditor
                  v-model:content="newsForm.content"
                  contentType="html"
                  :options="quillOptions"
                  class="quill-editor-container"
                />
              </div>

              <!-- Botón guardar -->
              <div class="d-flex justify-content-end pt-3 border-top">
                <button :class="BUTTONS.new.class" @click="saveNews" :disabled="isLoading">
                  <i :class="BUTTONS.new.icon"></i>
                  <span class="ms-1">{{ isLoading ? 'Guardando...' : 'Crear noticia' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: Preview -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <div class="d-flex align-items-center justify-content-between mb-4">
                <h5 class="fw-bold mb-0">Vista previa</h5>
                <span class="badge bg-secondary">Preview</span>
              </div>

              <!-- Preview de la noticia -->
              <div class="preview-container">
                <!-- Imagen principal -->
                <div class="preview-main-image mb-3">
                  <img
                    v-if="mainImagePreview"
                    :src="mainImagePreview"
                    alt="Imagen principal"
                    class="img-fluid rounded-3 w-100"
                    style="max-height: 250px; object-fit: cover"
                  />
                  <div
                    v-else
                    class="placeholder-image rounded-3 d-flex align-items-center justify-content-center"
                  >
                    <i class="bi bi-image text-muted" style="font-size: 3rem"></i>
                  </div>
                </div>

                <!-- Fecha -->
                <p class="text-muted small mb-2">
                  <i class="bi bi-calendar3 me-1"></i>
                  {{ formattedDate }}
                </p>

                <!-- Título -->
                <h3 class="preview-title fw-bold mb-2">
                  {{ newsForm.title || 'Título de la noticia' }}
                </h3>

                <div class="mb-3" v-if="newsForm.url_file">
                  <a
                    :href="newsForm.url_file"
                    class="btn btn-outline-primary btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i class="bi bi-link-45deg me-1"></i>
                    Ir a noticia
                  </a>
                </div>

                <!-- Contenido -->
                <div
                  class="preview-content"
                  v-html="
                    newsForm.content ||
                    '<p class=\'text-muted\'>El contenido de la noticia aparecerá aquí...</p>'
                  "
                ></div>
              </div>
            </div>
          </div>
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
/* Estilo para la imagen de perfil si no se carga */
.border.rounded-circle.overflow-hidden.d-flex.align-items-center.justify-content-center img {
  object-fit: cover;
}
</style>
