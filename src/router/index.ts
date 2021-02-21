import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = []

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
