<script setup lang="ts">
const route = useRoute()
const token = computed(() => (typeof route.query.token === "string" ? route.query.token : ""))

const password = ref("")
const confirmPassword = ref("")
const loading = ref(false)
const error = ref("")

async function submit() {
  error.value = ""

  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters."
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match."
    return
  }

  loading.value = true
  try {
    await $fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      body: { token: token.value, password: password.value }
    })
    await refreshNuxtData("current-user")
    await navigateTo("/home")
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not reset your password."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="app-auth">
    <Card class="app-auth-card">
      <CardHeader>
        <p class="app-eyebrow">Wardrobe planner</p>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password to finish signing in.</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="!token" variant="destructive">
          <AlertTitle>This reset link is missing its token. Request a new link.</AlertTitle>
        </Alert>
        <Alert v-else-if="error" variant="destructive">
          <AlertTitle>{{ error }}</AlertTitle>
        </Alert>

        <form v-if="token" class="grid w-full gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="reset-password">New password</Label>
            <Input id="reset-password" v-model="password" type="password" autocomplete="new-password" required />
          </div>
          <div class="grid gap-2">
            <Label for="reset-confirm">Confirm password</Label>
            <Input id="reset-confirm" v-model="confirmPassword" type="password" autocomplete="new-password" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? "Saving…" : "Set password and sign in" }}
          </Button>
        </form>

        <p class="text-center text-sm text-muted">
          <NuxtLink to="/forgot-password" class="underline-offset-4 hover:underline">Request a new link</NuxtLink>
        </p>
      </CardContent>
    </Card>
  </section>
</template>
