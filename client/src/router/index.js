import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/editorPos',
    name: 'editorPos',
    popps: true,
    component: () => import('../views/vues/editorPos.vue')
  },
  {
    path: '/editorCrop/:areaName',
    name: 'editorCrop',
    popps: true,
    component: () => import('../views/vues/editorCrop.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
