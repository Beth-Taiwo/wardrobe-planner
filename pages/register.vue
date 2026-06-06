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
    <UCard class="app-auth-card" variant="subtle">
      <template #header>
        <div class="space-y-1">
          <p class="app-eyebrow">Wardrobe planner</p>
          <h1 class="text-2xl font-semibold">Create account</h1>
          <p class="app-subtitle">Start tracking outfits, repeats, and clothing pieces.</p>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="error" />

        <UForm :state="{ displayName, email, password }" class="grid w-full gap-4" @submit.prevent="submitRegister">
          <UFormField label="Display name" class="w-full">
            <UInput v-model="displayName" class="w-full" autocomplete="name" icon="i-heroicons-user" />
          </UFormField>
          <UFormField label="Email" class="w-full">
            <UInput v-model="email" class="w-full" type="email" autocomplete="email" icon="i-heroicons-envelope" required />
          </UFormField>
          <UFormField label="Password" class="w-full">
            <UInput v-model="password" class="w-full" type="password" autocomplete="new-password" icon="i-heroicons-lock-closed" required />
          </UFormField>
          <UButton type="submit" block icon="i-heroicons-user-plus" :loading="loading">Create account</UButton>
        </UForm>

        <USeparator label="or" />

        <UButton variant="outline" icon="i-heroicons-globe-alt" block to="/api/auth/google" external>
          Continue with Google
        </UButton>

        <p class="text-center text-sm text-muted">
          Already have an account?
          <NuxtLink :to="{ path: '/login', query: route.query }">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </UCard>
  </section>
</template>
