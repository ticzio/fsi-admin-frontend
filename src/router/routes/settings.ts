// Settings routes
import { PERMISSIONS } from '@/const/permissions'

export default [
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../../views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  // Nuevas rutas basadas en la imagen
  {
    path: '/settings/enviroment_type',
    name: 'EnviromentTypeList',
    component: () => import('../../views/settings/enviroment_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/states',
    name: 'StatesList',
    component: () => import('../../views/settings/states/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/cities',
    name: 'CitiesList',
    component: () => import('../../views/settings/cities/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/roles',
    name: 'RolesList',
    component: () => import('../../views/settings/roles/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/transmission_type',
    name: 'TransmissionTypeList',
    component: () => import('../../views/settings/transmission_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/engine_type',
    name: 'EngineTypeList',
    component: () => import('../../views/settings/engine_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/colors',
    name: 'ColorsList',
    component: () => import('../../views/settings/colors/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/brake_type',
    name: 'BrakeTypeList',
    component: () => import('../../views/settings/brake_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/vehicle_type',
    name: 'VehicleTypeList',
    component: () => import('../../views/settings/vehicle_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/type_purchase',
    name: 'TypePurchaseList',
    component: () => import('../../views/settings/purchase_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/type_service',
    name: 'TypeServiceList',
    component: () => import('../../views/settings/service_type/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
  {
    path: '/settings/type_notification',
    name: 'TypeNotificationList',
    component: () => import('../../views/settings/type_notification/List.vue'),
    meta: { requiresAuth: true, permissions: [PERMISSIONS.settings.read] },
  },
]
