// Operators routes
export default [
  {
    path: '/operators',
    name: 'Operadores',
    component: () => import('../../views/operators/List.vue'),
    meta: { requiresAuth: true },
  },
]
