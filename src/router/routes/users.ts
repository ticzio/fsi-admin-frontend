// Users routes
export default [
  {
    path: '/users',
    name: 'Usuarios',
    component: () => import('../../views/users/List.vue'),
    meta: { requiresAuth: true },
  },
]
