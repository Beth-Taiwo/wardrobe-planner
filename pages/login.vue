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
    <Card class="app-auth-card" variant="subtle">
      <template #header>
        <div class="space-y-1">
          <p class="app-eyebrow">Wardrobe planner</p>
          <h1 class="text-2xl font-semibold">Sign in</h1>
          <p class="app-subtitle">Open your calendar, wardrobe, and outfit history.</p>
        </div>
      </template>

      <div class="space-y-4">
        <Alert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="error" />

        <Form :state="{ email, password }" class="grid w-full gap-4" @submit.prevent="submitLogin">
          <FormField label="Email" class="w-full">
            <Input v-model="email" class="w-full" type="email" autocomplete="email" icon="i-heroicons-envelope" required />
          </FormField>
          <FormField label="Password" class="w-full">
            <Input v-model="password" class="w-full" type="password" autocomplete="current-password" icon="i-heroicons-lock-closed" required />
          </FormField>
          <Button type="submit" block icon="i-heroicons-arrow-right" :loading="loading">Sign in</Button>
        </Form>

        <Separator label="or" />

        <Button variant="outline" icon="i-heroicons-globe-alt" block to="/api/auth/google" external>
          Continue with Google
        </Button>

        <p class="text-center text-sm text-muted">
          Need an account?
          <NuxtLink :to="{ path: '/register', query: route.query }">
            Create one
          </NuxtLink>
        </p>
      </div>
    </Card>
  </section>
</template>
