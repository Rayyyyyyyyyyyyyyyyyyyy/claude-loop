import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/archive',
    name: 'archive',
    component: () => import('../views/ArchiveView.vue'),
  },
  {
    path: '/:date(\\d{4}-\\d{2}-\\d{2})',
    name: 'digest',
    component: () => import('../views/DigestView.vue'),
    props: true,
  },
]
