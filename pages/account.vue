<script setup lang="ts">
definePageMeta({ middleware: "auth" })

interface CurrentUser {
  id: string
  email: string
  displayName: string | null
  hasPassword: boolean
  linkedProviders: string[]
}

const { data, refresh } = await useFetch<{ user: CurrentUser | null }>("/api/auth/me", {
  key: "current-user"
})
const toast = useToast()
const displayName = ref(data.value?.user?.displayName || "")
const currentPassword = ref("")
const newPassword = ref("")
const profileLoading = ref(false)
const passwordLoading = ref(false)
const deleteLoading = ref(false)
const error = ref("")

async function saveProfile() {
  profileLoading.value = true
  error.value = ""
  try {
    await $fetch("/api/account/profile", { method: "PUT", body: { displayName: displayName.value } })
    await refresh()
    toast.add({ title: "Profile updated", color: "green" })
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not update profile."
  } finally {
    profileLoading.value = false
  }
}

async function changePassword() {
  passwordLoading.value = true
  error.value = ""
  try {
    await $fetch("/api/account/password", {
      method: "PUT",
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value }
    })
    currentPassword.value = ""
    newPassword.value = ""
    await refresh()
    toast.add({ title: "Password updated", color: "green" })
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not update password."
  } finally {
    passwordLoading.value = false
  }
}

async function deleteAccount() {
  if (!confirm("Delete your account and all wardrobe data?")) {
    return
  }

  deleteLoading.value = true
  try {
    await $fetch("/api/account", { method: "DELETE" })
    await refreshNuxtData("current-user")
    await navigateTo("/register")
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <section class="grid gap-5">
    <header class="app-page-header">
      <div>
        <p class="app-eyebrow">Account</p>
        <h1 class="app-title">Settings</h1>
        <p class="app-subtitle">Manage your profile, sign-in methods, and account data.</p>
      </div>
    </header>

    <UAlert v-if="error" color="error" variant="soft" :title="error" />

    <div class="grid gap-5 lg:grid-cols-2">
      <UCard class="app-panel" variant="subtle">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">Profile</h2>
            <p class="text-sm text-muted">{{ data?.user?.email }}</p>
          </div>
        </template>
        <div class="mt-4 grid gap-4">
          <UFormField label="Display name">
            <UInput v-model="displayName" icon="i-heroicons-user" />
          </UFormField>
          <UButton block icon="i-heroicons-check" :loading="profileLoading" @click="saveProfile">
            Save profile
          </UButton>
        </div>
      </UCard>

      <UCard class="app-panel" variant="subtle">
        <template #header>
          <h2 class="text-lg font-semibold">Password</h2>
        </template>
        <div class="mt-4 grid gap-4">
          <UFormField v-if="data?.user?.hasPassword" label="Current password">
            <UInput v-model="currentPassword" type="password" autocomplete="current-password" icon="i-heroicons-lock-closed" />
          </UFormField>
          <UFormField label="New password">
            <UInput v-model="newPassword" type="password" autocomplete="new-password" icon="i-heroicons-key" />
          </UFormField>
          <UButton block icon="i-heroicons-shield-check" :loading="passwordLoading" :disabled="newPassword.length < 8" @click="changePassword">
            {{ data?.user?.hasPassword ? 'Change password' : 'Set password' }}
          </UButton>
        </div>
      </UCard>

      <UCard class="app-panel" variant="subtle">
        <template #header>
          <h2 class="text-lg font-semibold">Linked accounts</h2>
        </template>
        <div class="mt-4 flex items-center justify-between">
          <span class="inline-flex items-center gap-2">
            <UIcon name="i-heroicons-globe-alt" class="h-5 w-5" />
            Google
          </span>
          <UBadge :color="data?.user?.linkedProviders.includes('google') ? 'success' : 'neutral'" variant="soft">
            {{ data?.user?.linkedProviders.includes('google') ? 'Linked' : 'Not linked' }}
          </UBadge>
        </div>
        <UButton class="mt-4" variant="outline" icon="i-heroicons-globe-alt" to="/api/auth/google" external block>
          Continue with Google
        </UButton>
      </UCard>

      <UCard class="app-panel" variant="subtle">
        <template #header>
          <h2 class="text-lg font-semibold">Delete account</h2>
        </template>
        <UAlert
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          title="This removes your account, sessions, linked accounts, wardrobe, calendar entries, and outfit history."
        />
        <UButton class="mt-4" color="error" variant="outline" block :loading="deleteLoading" @click="deleteAccount">
          Delete account
        </UButton>
      </UCard>
    </div>
  </section>
</template>
