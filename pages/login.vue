<script setup lang="ts">
const route = useRoute()
const email = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

async function submitLogin() {
  error.value = ""
  loading.value = true

  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { email: email.value, password: password.value }
    })
    await refreshNuxtData("current-user")
    await navigateTo(typeof route.query.redirect === "string" ? route.query.redirect : "/calendar")
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not sign in."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="flex min-h-[calc(100vh-2.5rem)] w-full items-center justify-center py-8">
    <div class="grid w-full max-w-md gap-5 rounded-lg border border-stone-300 bg-white p-6 shadow-sm">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-rose-700">Wardrobe planner</p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-950">Sign in</h1>
      </div>

      <UAlert v-if="error" color="red" variant="soft" :title="error" />

      <UForm :state="{ email, password }" class="grid w-full gap-4" @submit.prevent="submitLogin">
        <UFormField label="Email" class="w-full">
          <UInput v-model="email" class="w-full" type="email" autocomplete="email" required />
        </UFormField>
        <UFormField label="Password" class="w-full">
          <UInput v-model="password" class="w-full" type="password" autocomplete="current-password" required />
        </UFormField>
        <UButton type="submit" color="rose" class="w-full justify-center" :loading="loading">Sign in</UButton>
      </UForm>

      <UButton color="blue" variant="solid" icon="i-heroicons-globe-alt" class="w-full justify-center" to="/api/auth/google" external>
        Continue with Google
      </UButton>

      <p class="text-center text-sm text-slate-600">
        Need an account?
        <NuxtLink class="font-medium text-rose-700 hover:text-rose-800" :to="{ path: '/register', query: route.query }">
          Create one
        </NuxtLink>
      </p>
    </div>
  </section>
</template>
