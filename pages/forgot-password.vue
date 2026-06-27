<script setup lang="ts">
const email = ref("")
const loading = ref(false)
const sent = ref(false)
const message = ref("")

async function submit() {
  loading.value = true
  try {
    const result = await $fetch<{ message: string }>("/api/auth/password-reset/request", {
      method: "POST",
      body: { email: email.value }
    })
    message.value = result.message
    sent.value = true
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
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your email and we'll send a link to set a new password.</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="sent">
          <AlertTitle>{{ message }}</AlertTitle>
        </Alert>

        <form v-else class="grid w-full gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="forgot-email">Email</Label>
            <Input id="forgot-email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? "Sending…" : "Send reset link" }}
          </Button>
        </form>

        <p class="text-center text-sm text-muted">
          <NuxtLink to="/login" class="underline-offset-4 hover:underline">Back to sign in</NuxtLink>
        </p>
      </CardContent>
    </Card>
  </section>
</template>
