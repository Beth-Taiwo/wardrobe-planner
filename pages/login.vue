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
    <UCard class="w-full max-w-md">
      <template #header>
        <div>
          <p>Wardrobe planner</p>
          <h1>Sign in</h1>
        </div>
      </template>

      <UAlert v-if="error" color="error" variant="soft" :title="error" />

      <UForm :state="{ email, password }" class="grid w-full gap-4" @submit.prevent="submitLogin">
        <UFormField label="Email" class="w-full">
          <UInput v-model="email" class="w-full" type="email" autocomplete="email" required />
        </UFormField>
        <UFormField label="Password" class="w-full">
          <UInput v-model="password" class="w-full" type="password" autocomplete="current-password" required />
        </UFormField>
        <UButton type="submit" block :loading="loading">Sign in</UButton>
      </UForm>

      <UButton variant="outline" icon="i-heroicons-globe-alt" block to="/api/auth/google" external>
        Continue with Google
      </UButton>

      <p class="text-center">
        Need an account?
        <NuxtLink :to="{ path: '/register', query: route.query }">
          Create one
        </NuxtLink>
      </p>
    </UCard>
  </section>
</template>
