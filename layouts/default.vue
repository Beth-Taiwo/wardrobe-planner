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
  <main class="min-h-screen bg-[#f6f3ef] text-slate-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div v-if="data?.user" class="mb-4 flex flex-wrap items-center justify-end gap-2 text-sm">
        <span class="text-slate-600">{{ data.user.displayName || data.user.email }}</span>
        <UButton color="white" size="xs" icon="i-heroicons-cog-6-tooth" to="/account">Account</UButton>
        <UButton color="white" size="xs" icon="i-heroicons-arrow-right-on-rectangle" @click="logout">Logout</UButton>
      </div>
      <div class="flex flex-col gap-6">
        <slot />
      </div>
    </div>
  </main>
</template>
