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
  <section class="mx-auto grid w-full max-w-md gap-5 rounded-lg border border-stone-300 bg-white p-6 shadow-sm">
    <div>
      <p class="text-sm font-medium uppercase tracking-wide text-rose-700">Wardrobe planner</p>
      <h1 class="mt-1 text-2xl font-semibold text-slate-950">Sign in</h1>
    </div>

    <UAlert v-if="error" color="red" variant="soft" :title="error" />

    <UForm :state="{ email, password }" class="grid gap-4" @submit.prevent="submitLogin">
      <UFormField label="Email">
        <UInput v-model="email" type="email" autocomplete="email" required />
      </UFormField>
      <UFormField label="Password">
        <UInput v-model="password" type="password" autocomplete="current-password" required />
      </UFormField>
      <UButton type="submit" color="rose" block :loading="loading">Sign in</UButton>
    </UForm>

    <UButton color="white" icon="i-heroicons-globe-alt" to="/api/auth/google" external block>
      Continue with Google
    </UButton>

    <p class="text-center text-sm text-slate-600">
      Need an account?
      <NuxtLink class="font-medium text-rose-700 hover:text-rose-800" :to="{ path: '/register', query: route.query }">
        Create one
      </NuxtLink>
    </p>
  </section>
</template>
