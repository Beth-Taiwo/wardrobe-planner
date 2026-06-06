import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  components: [
    {
      path: '~/components/ui',
      pathPrefix: false
    },
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
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
    plugins: [
      tailwindcss()
    ],
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
