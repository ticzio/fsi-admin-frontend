// Settings routes
export default [
  {
    path: '/exhibition',
    name: 'Exhibiciones',
    component: () => import('../../views/exhibition/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exhibition/new',
    name: 'Nueva exhibición',
    component: () => import('@/views/exhibition/New.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exhibition/edit/:id_exhibition/:id_vehicle_model',
    name: 'Editar exhibición',
    component: () => import('@/views/exhibition/Orchestrator.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'detail-exhibition',
        name: 'Detalles de la exhibición',
        component: () => import('@/views/exhibition/detail-exhibition/Edit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'images-exhibition',
        name: 'Imagenes de la exhibición',
        component: () => import('@/views/exhibition/images-exhibition/List.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'exhibition-media',
        name: 'Media de la exhibición',
        component: () => import('@/views/exhibition/exhibition-media/List.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]
