export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  devtools: { enabled: true },
  fonts: {
    providers: {
      adobe: false,
      bunny: false,
      fontshare: false,
      fontsource: false,
      google: false,
      googleicons: false
    }
  },
  css: ['~/assets/css/main.css'],
  vite: {
    server: {
      watch: {
        ignored: ['**/data/**']
      }
    }
  },
  compatibilityDate: '2025-05-12',
  app: {
    head: {
      title: 'Dress Calendar',
      meta: [
        {
          name: 'description',
          content: 'Plan and track daily dress choices.'
        }
      ]
    }
  }
})
