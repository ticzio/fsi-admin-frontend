// Administrators routes
export default [
  {
    path: '/administrators',
    name: 'Administradores',
    component: () => import('../../views/administrators/List.vue'),
    meta: { requiresAuth: true },
  },
]
