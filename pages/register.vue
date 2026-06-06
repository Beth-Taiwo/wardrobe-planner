<script setup lang="ts">
const route = useRoute()
const displayName = ref("")
const email = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

async function submitRegister() {
  error.value = ""
  loading.value = true

  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        displayName: displayName.value,
        email: email.value,
        password: password.value
      }
    })
    await refreshNuxtData("current-user")
    await navigateTo(typeof route.query.redirect === "string" ? route.query.redirect : "/calendar")
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not create this account."
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
          <h1 class="text-2xl font-semibold">Create account</h1>
          <p class="app-subtitle">Start tracking outfits, repeats, and clothing pieces.</p>
        </div>
      </template>

      <div class="space-y-4">
        <Alert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="error" />

        <Form :state="{ displayName, email, password }" class="grid w-full gap-4" @submit.prevent="submitRegister">
          <FormField label="Display name" class="w-full">
            <Input v-model="displayName" class="w-full" autocomplete="name" icon="i-heroicons-user" />
          </FormField>
          <FormField label="Email" class="w-full">
            <Input v-model="email" class="w-full" type="email" autocomplete="email" icon="i-heroicons-envelope" required />
          </FormField>
          <FormField label="Password" class="w-full">
            <Input v-model="password" class="w-full" type="password" autocomplete="new-password" icon="i-heroicons-lock-closed" required />
          </FormField>
          <Button type="submit" block icon="i-heroicons-user-plus" :loading="loading">Create account</Button>
        </Form>

        <Separator label="or" />

        <Button variant="outline" icon="i-heroicons-globe-alt" block to="/api/auth/google" external>
          Continue with Google
        </Button>

        <p class="text-center text-sm text-muted">
          Already have an account?
          <NuxtLink :to="{ path: '/login', query: route.query }">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </Card>
  </section>
</template>
