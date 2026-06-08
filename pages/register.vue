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
    await navigateTo(typeof route.query.redirect === "string" ? route.query.redirect : "/wardrobe")
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not create this account."
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
        <CardTitle>Create account</CardTitle>
        <CardDescription>Start tracking outfits, repeats, and clothing pieces.</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertTitle>{{ error }}</AlertTitle>
        </Alert>

        <form class="grid w-full gap-4" @submit.prevent="submitRegister">
          <div class="grid gap-2">
            <Label for="register-display-name">Display name</Label>
            <Input id="register-display-name" v-model="displayName" autocomplete="name" />
          </div>
          <div class="grid gap-2">
            <Label for="register-email">Email</Label>
            <Input id="register-email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="grid gap-2">
            <Label for="register-password">Password</Label>
            <Input id="register-password" v-model="password" type="password" autocomplete="new-password" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">Create account</Button>
        </form>

        <Separator label="or" />

        <Button as-child variant="outline" class="w-full">
          <NuxtLink to="/api/auth/google" external>Continue with Google</NuxtLink>
        </Button>

        <p class="text-center text-sm text-muted">
          Already have an account?
          <NuxtLink :to="{ path: '/login', query: route.query }">
            Sign in
          </NuxtLink>
        </p>
      </CardContent>
    </Card>
  </section>
</template>
