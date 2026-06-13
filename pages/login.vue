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
    await navigateTo(typeof route.query.redirect === "string" ? route.query.redirect : "/home")
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not sign in."
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
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Open your wardrobe and outfit history.</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertTitle>{{ error }}</AlertTitle>
        </Alert>

        <form class="grid w-full gap-4" @submit.prevent="submitLogin">
          <div class="grid gap-2">
            <Label for="login-email">Email</Label>
            <Input id="login-email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="grid gap-2">
            <Label for="login-password">Password</Label>
            <Input id="login-password" v-model="password" type="password" autocomplete="current-password" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">Sign in</Button>
        </form>

        <Separator label="or" />

        <Button as-child variant="outline" class="w-full">
          <NuxtLink to="/api/auth/google" external>Continue with Google</NuxtLink>
        </Button>

        <p class="text-center text-sm text-muted">
          Need an account?
          <NuxtLink :to="{ path: '/register', query: route.query }">
            Create one
          </NuxtLink>
        </p>
      </CardContent>
    </Card>
  </section>
</template>
