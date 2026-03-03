// Settings routes
export default [
  {
    path: '/administrators',
    name: 'Administradores',
    component: () => import('../../views/administrators/List.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'new',
        name: 'Nuevo Administrador',
        component: () => import('@/views/administrators/New.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'edit/:id_administrator',
        name: 'Editar Administrador',
        component: () => import('@/views/administrators/Edit.vue'),
        meta: { requiresAuth: true },
        props: true,
      },
    ],
  },
]
