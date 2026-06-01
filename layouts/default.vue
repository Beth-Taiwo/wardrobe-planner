<script setup lang="ts">
const { data, refresh } = await useFetch<{ user: { email: string, displayName: string | null } | null }>("/api/auth/me", {
  key: "current-user",
  default: () => ({ user: null })
})

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" })
  await refresh()
  await navigateTo("/login")
}
</script>

<template>
  <main>
    <UContainer class="py-5">
      <div v-if="data?.user" class="mb-4 flex flex-wrap items-center justify-end gap-2 text-sm">
        <span>{{ data.user.displayName || data.user.email }}</span>
        <UButton size="xs" variant="outline" icon="i-heroicons-cog-6-tooth" to="/account">Account</UButton>
        <UButton size="xs" variant="outline" icon="i-heroicons-arrow-right-on-rectangle" @click="logout">Logout</UButton>
      </div>
      <div class="flex flex-col gap-6">
        <slot />
      </div>
    </UContainer>
  </main>
</template>
