// Settings routes
export default [
  {
    path: '/news',
    name: 'Noticias',
    component: () => import('../../views/news/List.vue'),
    meta: { requiresAuth: true },

    children: [
      {
        path: 'new',
        name: 'Nueva Noticia',
        component: () => import('@/views/news/New.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'edit/:id_new',
        name: 'Editar Noticia',
        component: () => import('@/views/news/Edit.vue'),
        meta: { requiresAuth: true },
        props: true,
      },
    ],
  },
]
