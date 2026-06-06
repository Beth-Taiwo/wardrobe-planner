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
  <section class="app-auth">
    <UCard class="app-auth-card" variant="subtle">
      <template #header>
        <div class="space-y-1">
          <p class="app-eyebrow">Wardrobe planner</p>
          <h1 class="text-2xl font-semibold">Sign in</h1>
          <p class="app-subtitle">Open your calendar, wardrobe, and outfit history.</p>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="error" />

        <UForm :state="{ email, password }" class="grid w-full gap-4" @submit.prevent="submitLogin">
          <UFormField label="Email" class="w-full">
            <UInput v-model="email" class="w-full" type="email" autocomplete="email" icon="i-heroicons-envelope" required />
          </UFormField>
          <UFormField label="Password" class="w-full">
            <UInput v-model="password" class="w-full" type="password" autocomplete="current-password" icon="i-heroicons-lock-closed" required />
          </UFormField>
          <UButton type="submit" block icon="i-heroicons-arrow-right" :loading="loading">Sign in</UButton>
        </UForm>

        <USeparator label="or" />

        <UButton variant="outline" icon="i-heroicons-globe-alt" block to="/api/auth/google" external>
          Continue with Google
        </UButton>

        <p class="text-center text-sm text-muted">
          Need an account?
          <NuxtLink :to="{ path: '/register', query: route.query }">
            Create one
          </NuxtLink>
        </p>
      </div>
    </UCard>
  </section>
</template>
