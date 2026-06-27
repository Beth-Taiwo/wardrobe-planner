<script setup lang="ts">
const route = useRoute()

const redirectTarget = computed(() => {
  const value = route.query.redirect
  // Same-origin paths only (mirrors the server's safeInternalPath guard).
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : ""
})
const googleHref = computed(() =>
  redirectTarget.value
    ? "/api/auth/google?redirect=" + encodeURIComponent(redirectTarget.value)
    : "/api/auth/google"
)

const showEmailForm = ref(false)
const mode = ref<"signin" | "create">("signin")

const displayName = ref("")
const email = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

async function submit() {
  error.value = ""
  loading.value = true

  try {
    if (mode.value === "create") {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: { displayName: displayName.value, email: email.value, password: password.value }
      })
    } else {
      await $fetch("/api/auth/login", {
        method: "POST",
        body: { email: email.value, password: password.value }
      })
    }

    await refreshNuxtData("current-user")
    await navigateTo(redirectTarget.value || "/home")
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage
      || (mode.value === "create" ? "Could not create this account." : "Could not sign in.")
  } finally {
    loading.value = false
  }
}

// New-vs-returning is a single in-form toggle, not a separate page. Keep the typed email on switch.
function toggleMode() {
  mode.value = mode.value === "signin" ? "create" : "signin"
  error.value = ""
}
</script>

<template>
  <section class="app-auth">
    <Card class="app-auth-card">
      <CardHeader>
        <p class="app-eyebrow">Wardrobe planner</p>
        <CardTitle>Open your wardrobe</CardTitle>
        <CardDescription>Continue with Google — it signs you in or creates your account.</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertTitle>{{ error }}</AlertTitle>
        </Alert>

        <Button as-child class="w-full">
          <NuxtLink :to="googleHref" external>Continue with Google</NuxtLink>
        </Button>

        <button
          type="button"
          class="w-full text-center text-sm text-muted underline-offset-4 hover:underline"
          @click="showEmailForm = !showEmailForm"
        >
          {{ showEmailForm ? "Hide email sign-in" : "Other sign-in options" }}
        </button>

        <div v-if="showEmailForm" class="space-y-4 border-t border-default pt-4">
          <form class="grid w-full gap-4" @submit.prevent="submit">
            <div v-if="mode === 'create'" class="grid gap-2">
              <Label for="auth-display-name">Display name</Label>
              <Input id="auth-display-name" v-model="displayName" autocomplete="name" />
            </div>
            <div class="grid gap-2">
              <Label for="auth-email">Email</Label>
              <Input id="auth-email" v-model="email" type="email" autocomplete="email" required />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center justify-between">
                <Label for="auth-password">Password</Label>
                <NuxtLink
                  v-if="mode === 'signin'"
                  to="/forgot-password"
                  class="text-xs text-muted underline-offset-4 hover:underline"
                >
                  Forgot password?
                </NuxtLink>
              </div>
              <Input
                id="auth-password"
                v-model="password"
                type="password"
                :autocomplete="mode === 'create' ? 'new-password' : 'current-password'"
                required
              />
            </div>
            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? "Please wait…" : (mode === "create" ? "Create account" : "Sign in") }}
            </Button>
          </form>

          <p class="text-center text-sm text-muted">
            {{ mode === "create" ? "Already have an account?" : "New here?" }}
            <button type="button" class="font-medium text-foreground underline-offset-4 hover:underline" @click="toggleMode">
              {{ mode === "create" ? "Sign in" : "Create an account" }}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
