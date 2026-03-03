<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { ERROR } from '@/const/errorConst'
import { getEnvironmentAlert } from '@/services/initApi'
import packageJson from '../../package.json'

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

const errors = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)

const handleLogin = async () => {
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
    <div
      id="login-container"
      class="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100"
    >
      <img src="/changan-icon.png" alt="Changan Icon" class="changan-icon mb-4" />
      <div class="login-card p-4 p-md-5">
        <h3 class="text-center text-white mb-4">Panel administrativo</h3>
        <h5 class="text-center text-white-50 mb-4 fw-light">
          Ingresa tus datos para iniciar sesión
        </h5>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="emailLogin" class="form-label text-white-50 fw-light">Correo</label>
            <input
              type="email"
              class="form-control form-control-lg"
              id="emailLogin"
              v-model="credentials.email"
              :class="{ 'is-invalid': errors.email }"
              placeholder="Ingrese su correo"
              :disabled="showNetworkError"
            />
          </div>

          <div class="mb-3">
            <label for="passwordLogin" class="form-label text-white-50 fw-light">Contraseña</label>
            <div class="input-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control form-control-lg"
                placeholder="Ingrese su contraseña"
                v-model="credentials.password"
                :disabled="showNetworkError"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="showPassword = !showPassword"
                tabindex="-1"
                :disabled="showNetworkError"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
          <!-- 
       <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="rememberUserCheck" />
              <label class="form-check-label text-white-50 fw-light" for="rememberUserCheck">
                Recordar usuario
              </label>
            </div>
            <a href="#" class="text-white-50 text-decoration-none fw-light">Olvidé mi contraseña</a>
          </div>    

-->

          <div class="d-grid mb-3">
            <button type="submit" :disabled="loading" class="btn btn-primary btn-lg">
              {{ loading ? 'Iniciando...' : 'Entrar' }}
            </button>
          </div>

          <div class="d-flex justify-content-center mt-2">
            <span class="text-white text-center">v{{ APP_VERSION }}</span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-background {
  background-image: url('@/assets/images/login/background-login.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
  width: 100%;
}

.changan-icon {
  width: 150px;
  height: auto;
}

.login-card {
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    /* Borde de brillo superior (fijo) */ inset 0 -1px 0 rgba(255, 255, 255, 0.1),
    /* Sombra de borde inferior (fijo) */ inset 0 0 10px 7px rgba(255, 255, 255, 0.1); /* Brillo interno (EDITABLE) */
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

.login-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.8),
    transparent,
    rgba(255, 255, 255, 0.3)
  );
}

.form-control {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  box-shadow: none;
}

.btn-primary {
  background-color: #0055a5; /* Color azul Changan */
  border-color: #0055a5;
}

.btn-primary:hover {
  background-color: #004488;
  border-color: #004488;
}

.input-group .btn {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.input-group .btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.form-check-input {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.form-check-input:checked {
  background-color: #0055a5;
  border-color: #0055a5;
}

@media (max-width: 576px) {
  .login-card {
    margin: 0 1rem;
    padding: 1.5rem !important;
  }
  .changan-icon {
    width: 120px;
  }
}
</style>
