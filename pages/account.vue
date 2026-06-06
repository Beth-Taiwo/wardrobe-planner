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

    <Alert v-if="error" variant="destructive">
      <AlertTitle>{{ error }}</AlertTitle>
    </Alert>

    <div class="grid gap-5 lg:grid-cols-2">
      <Card class="app-panel">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{{ data?.user?.email }}</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label for="account-display-name">Display name</Label>
            <Input id="account-display-name" v-model="displayName" />
          </div>
          <Button class="w-full" :disabled="profileLoading" @click="saveProfile">
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card class="app-panel">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div v-if="data?.user?.hasPassword" class="grid gap-2">
            <Label for="account-current-password">Current password</Label>
            <Input id="account-current-password" v-model="currentPassword" type="password" autocomplete="current-password" />
          </div>
          <div class="grid gap-2">
            <Label for="account-new-password">New password</Label>
            <Input id="account-new-password" v-model="newPassword" type="password" autocomplete="new-password" />
          </div>
          <Button class="w-full" :disabled="passwordLoading || newPassword.length < 8" @click="changePassword">
            {{ data?.user?.hasPassword ? 'Change password' : 'Set password' }}
          </Button>
        </CardContent>
      </Card>

      <Card class="app-panel">
        <CardHeader>
          <CardTitle>Linked accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <span>Google</span>
            <Badge>
            {{ data?.user?.linkedProviders.includes('google') ? 'Linked' : 'Not linked' }}
            </Badge>
          </div>
          <Button as-child class="mt-4 w-full" variant="outline">
            <NuxtLink to="/api/auth/google" external>Continue with Google</NuxtLink>
          </Button>
        </CardContent>
      </Card>

      <Card class="app-panel">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>This removes your account, sessions, linked accounts, wardrobe, calendar entries, and outfit history.</AlertTitle>
          </Alert>
          <Button class="mt-4 w-full" variant="destructive" :disabled="deleteLoading" @click="deleteAccount">
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
