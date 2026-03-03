<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { ERROR } from '@/const/errorConst'
import { getEnvironmentAlert } from '@/services/initApi'
import packageJson from '../../package.json'
import BaseInput from '@/components/common/BaseInput.vue'
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'
import { getPasswordErrors } from '@/utils/funcPassword'

const APP_VERSION = packageJson.version
const showNetworkError = ref(false)
const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const router = useRouter()
const loading = ref(false)
const credentials = reactive({
  email: '',
  password: '',
})

const emailRules = [
  (v: string) => !!v || 'El correo es requerido',
  (v: string) => (isValidEmail(v) ? true : 'Formato de correo electrónico inválido'),
]

const passwordRules = [(v: string) => !!v || 'La contraseña es requerida']

const handleLogin = async () => {
  credentials.email = normalizeEmail(credentials.email)

  if (!credentials.email || !credentials.password) {
    swalToast.showError('Por favor, completa todos los campos')
    return
  }

  loading.value = true
  try {
    const response = await store.dispatch('login', {
      url: '/auth/admin/login',
      credentials: credentials,
    })

    if (response.code === 200) {
      swal.showSuccess('Inicio de sesión exitoso')
      router.push('/dashboard')
    }
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error)

    if (error?.code === 401 && error?.failed_attempts !== undefined) {
      swal.showConfirm(error.alert, `Intentos fallidos: ${error.failed_attempts}`, {
        icon: 'error',
        showCancelButton: false,
        confirmButtonText: 'Entendido',
      })
    } else {
      swalToast.showError(ERROR.errorLogin)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Mostrar alerta de ambiente si corresponde (desarrollo o calidad)
  const envAlert = getEnvironmentAlert()
  if (envAlert.type) {
    swal.showConfirm(envAlert.title, envAlert.message, {
      showCancelButton: false,
      confirmButtonText: 'Continuar',
    })
  }
})
</script>

<template>
  <div class="login-background">
    <!-- Contenedor padre general (en blanco / transparente por ahora) -->
    <div
      class="container-fluid min-vh-100 d-flex align-items-center justify-content-center px-3 px-md-5"
    >
      <div class="row w-100 layout-container">
        <!-- Contenedor 1: Logo -->
        <div
          class="col-lg-6 d-flex justify-content-center align-items-center mb-5 mb-lg-0 logo-container"
        >
          <!-- Sustituir esta imagen por defecto con el logo final cuando se tenga -->
          <img
            src="@/assets/images/login/login_logo_FSI.png"
            alt="Logo FSI Placeholder"
            class="main-logo"
          />
        </div>

        <!-- Contenedor 2: Formulario -->
        <div class="col-lg-6 d-flex justify-content-center align-items-center form-container">
          <div class="login-card p-4 p-sm-5">
            <h2 class="text-center mb-3 form-title">Bienvenido Al Panel<br />Administrativo</h2>
            <p class="text-center mb-4 pb-3 form-subtitle">Ingresa tus datos para iniciar sesión</p>
            <form @submit.prevent="handleLogin">
              <BaseInput
                id="emailLogin"
                type="email"
                label="Correo"
                placeholder="Ingresar correo electrónico"
                v-model="credentials.email"
                :disabled="showNetworkError"
                :rules="emailRules"
              />

              <BaseInput
                id="passwordLogin"
                type="password"
                label="Contraseña"
                placeholder="Ingresar contraseña"
                v-model="credentials.password"
                :disabled="showNetworkError"
                :rules="passwordRules"
                class="mb-4"
              />

              <div class="d-grid mt-4">
                <button type="submit" :disabled="loading" class="btn btn-primary btn-lg custom-btn">
                  {{ loading ? 'Iniciando...' : 'Entrar' }}
                </button>
              </div>

              <div class="text-center mt-4">
                <small class="text-muted">Versión {{ APP_VERSION }}</small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-background {
  /* Contenedor central en blanco por ahora, preparado para el background posterior */
  background-color: transparent;
  min-height: 100vh;
  width: 100%;
}

.layout-container {
  max-width: 1200px; /* Ancho máximo para mantener los contenedores proporcionados */
}

/* --- Contenedor 1: Logo --- */
.main-logo {
  max-width: 100%;
  width: 380px; /* Espacio estimado que ocupará el logo grande circular de la izquierda */
  height: auto;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Efecto opcional para destacar el espacio */
}

/* --- Contenedor 2: Formulario --- */
.login-card {
  width: 100%;
  max-width: 500px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
}

/* Tipografía de los títulos y textos */
.form-title {
  color: #333333;
  font-weight: 800;
  font-style: italic;
  font-size: 1.95rem;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.form-subtitle {
  color: #9ca3af;
  font-size: 0.95rem;
}

/* Estilo del botón */
.custom-btn {
  background-color: #1d4ed8;
  border: none;
  border-radius: 50rem; /* Botón bien redondeado estilo "pill" */
  font-weight: 600;
  padding: 0.8rem;
  font-size: 1.05rem;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(29, 78, 216, 0.25);
}

.custom-btn:hover {
  background-color: #1e40af;
  box-shadow: 0 6px 15px rgba(29, 78, 216, 0.35);
}

.custom-btn:focus {
  box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.5);
}

/* Ajustes responsivos */
@media (max-width: 991px) {
  .main-logo {
    width: 250px;
  }
}
</style>
