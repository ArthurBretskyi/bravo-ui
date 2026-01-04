import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getCurrentInstance } from 'vue'
import HomeView from '../views/HomeView.vue'
import ServicesView from '@/views/ServicesView.vue'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import PricesView from '@/views/PricesView.vue'
import BookingView from '@/views/BookingView.vue'
import ContactsView from '@/views/ContactsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AdminView from '@/views/AdminView.vue'
import MastersView from '@/views/MastersView.vue'
import AddMasterComponent from '@/components/AddMasterComponent.vue'
import AddServiceComponent from '@/components/AddServiceComponent.vue'
import ThankYouView from '@/views/ThankYouView.vue'
import UserDashboardView from '@/views/UserDashboardView.vue'
import MasterDashboardView from '@/views/MasterDashboardView.vue'
import GalleryView from '@/views/GalleryView.vue'
import UsersForAdminView from '@/views/UsersForAdminView.vue'
import MastersForAdminView from '@/views/MastersForAdminView.vue'
import AppointmentsForAdminView from '@/views/AppointmentsForAdminView.vue'
import FinanceForAdminView from '@/views/FinanceForAdminView.vue'
import AdminMasterDashboard from '@/views/AdminMasterDashboard.vue'
import ServiceDetailsView from '@/views/ServiceDetailsView.vue'
import AdminMasterFinance from '@/views/AdminMasterFinance.vue'
import ReviewsView from '@/views/ReviewsView.vue'

import { storeToRefs } from 'pinia'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },

  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/prices', name: 'Prices', component: PricesView },
  { path: '/booking', name: 'Booking', component: BookingView },
  { path: '/contacts', name: 'Contacts', component: ContactsView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAdmin: true }, // 🛡️ додаємо позначку для захисту
  },
  {
    path: '/add-master',
    name: 'AddMaster',
    component: AddMasterComponent,
  },
  {
    path: '/edit-master/:id',
    name: 'EditMaster',
    component: AddMasterComponent,
  },
  {
    path: '/masters',
    name: 'Masters',
    component: MastersView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/add-service',
    name: 'AddService',
    component: AddServiceComponent,
  },
  {
    path: '/edit-service/:id',
    name: 'EditService',
    component: AddServiceComponent,
  },
  {
    path: '/services',
    name: 'Services',
    component: ServicesView,
  },
  {
    path: '/thank-you',
    name: 'ThankYou',
    component: ThankYouView,
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: GalleryView,
  },
  {
    path: '/dashboard/user',
    name: 'UserDashboard',
    component: UserDashboardView,
    meta: { requiresAuth: true, role: 'user' },
  },
  {
    path: '/dashboard/master',
    name: 'MasterDashboard',
    component: MasterDashboardView,
    meta: { requiresAuth: true, role: 'master' },
  },
  {
    path: '/dashboard/admin/masters/:masterId',
    name: 'AdminMasterDashboard',
    component: AdminMasterDashboard,
    props: true, // ✅ щоб masterId одразу йшов у пропси
    meta: { requiresAdmin: true },
  },

  {
    path: '/admin/users',
    name: 'UsersForAdmin',
    component: UsersForAdminView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/masters',
    name: 'MastersForAdmin',
    component: MastersForAdminView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/appointments',
    name: 'AppointmentsForAdmin',
    component: AppointmentsForAdminView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/booking',
    name: 'AdminBooking',
    component: BookingView,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'master'] },
    props: (route) => ({ mode: 'adminBooking' }),
  },
  {
    path: '/admin/finance/:masterId?',
    name: 'FinanceForAdmin',
    component: FinanceForAdminView,
    props: true,
    meta: { requiresAdmin: true },
  },
  {
    path: '/dashboard/admin/finance/:masterId',
    name: 'AdminMasterFinance',
    component: AdminMasterFinance,
    props: true, // ✅ передає masterId у пропси
    meta: { requiresAdmin: true },
  },
  {
    path: '/services/:serviceId',
    name: 'ServiceDetails',
    component: ServiceDetailsView,
    props: true,
  },
  {
    path: '/reviews',
    name: 'Reviews',
    component: ReviewsView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 🧠 Захист маршрутів (navigation guard)
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const { isAdmin, user } = storeToRefs(authStore)

  // Якщо користувач ще не завантажений — ініціалізуємо
  if (!user.value) {
    await authStore.initAuth()
    console.log('Auth initialized:', user.value)
  }

  // Якщо роль ще не завантажена — підтягуємо з Firestore
  if (user.value && !user.value.role) {
    await authStore.fetchUserRole(user.value.uid)
    console.log('User role loaded:', user.value.role)
  }

  const userRole = user.value?.role

  // 🔹 CASE 1: Якщо роут вимагає ролі (allowedRoles)
  if (to.meta.allowedRoles && Array.isArray(to.meta.allowedRoles)) {
    if (!user.value) {
      console.warn('Not logged in — redirecting')
      return next({ name: 'Login' })
    }

    if (!to.meta.allowedRoles.includes(userRole)) {
      console.warn(`Access denied for role: ${userRole}`)
      return next({ name: 'Home' })
    }
  }

  // 🔹 CASE 2: Якщо requiresAdmin лишається для старих маршрутів
  else if (to.meta.requiresAdmin) {
    if (!isAdmin.value) {
      console.warn('Not admin — redirecting')
      return next({ name: 'Home' })
    }
  }

  // 🔹 CASE 3: requiresAuth + конкретна роль (старі dashboard)
  else if (to.meta.requiresAuth) {
    if (!user.value) return next({ name: 'Login' })
    if (to.meta.role && to.meta.role !== userRole) {
      const targetRouteName = userRole === 'master' ? 'MasterDashboard' : 'UserDashboard'
      return next({ name: targetRouteName })
    }
  }

  next()
})

export default router
