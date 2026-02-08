import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cards/new',
      name: 'card-new',
      component: () => import('@/views/CardEditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cards/:id/edit',
      name: 'card-edit',
      component: () => import('@/views/CardEditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/cards',
      name: 'admin-cards',
      component: () => import('@/views/AdminCardsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('@/views/AdminSettingsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.loaded) {
    await auth.fetchUser();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    auth.login();
    return false;
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' };
  }
});

export default router;
