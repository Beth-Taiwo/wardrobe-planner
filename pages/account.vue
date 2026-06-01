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
    <header>
      <p>Account</p>
      <h1>Settings</h1>
    </header>

    <UAlert v-if="error" color="error" variant="soft" :title="error" />

    <div class="grid gap-5 lg:grid-cols-2">
      <UCard>
        <template #header>
          <div>
            <h2>Profile</h2>
            <p>{{ data?.user?.email }}</p>
          </div>
        </template>
        <div class="mt-4 grid gap-4">
          <UFormField label="Display name">
            <UInput v-model="displayName" />
          </UFormField>
          <UButton block :loading="profileLoading" @click="saveProfile">
            Save profile
          </UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2>Password</h2>
        </template>
        <div class="mt-4 grid gap-4">
          <UFormField v-if="data?.user?.hasPassword" label="Current password">
            <UInput v-model="currentPassword" type="password" autocomplete="current-password" />
          </UFormField>
          <UFormField label="New password">
            <UInput v-model="newPassword" type="password" autocomplete="new-password" />
          </UFormField>
          <UButton block :loading="passwordLoading" :disabled="newPassword.length < 8" @click="changePassword">
            {{ data?.user?.hasPassword ? 'Change password' : 'Set password' }}
          </UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2>Linked accounts</h2>
        </template>
        <div class="mt-4 flex items-center justify-between">
          <span>Google</span>
          <UBadge :color="data?.user?.linkedProviders.includes('google') ? 'success' : 'neutral'" variant="soft">
            {{ data?.user?.linkedProviders.includes('google') ? 'Linked' : 'Not linked' }}
          </UBadge>
        </div>
        <UButton class="mt-4" variant="outline" icon="i-heroicons-globe-alt" to="/api/auth/google" external block>
          Continue with Google
        </UButton>
      </UCard>

      <UCard>
        <template #header>
          <h2>Delete account</h2>
        </template>
        <p>This removes your account, sessions, linked accounts, wardrobe, calendar entries, and outfit history.</p>
        <UButton class="mt-4" color="error" variant="outline" block :loading="deleteLoading" @click="deleteAccount">
          Delete account
        </UButton>
      </UCard>
    </div>
  </section>
</template>
