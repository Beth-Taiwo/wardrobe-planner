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
  <main class="app-shell">
    <UContainer class="app-container">
      <div class="app-topbar">
        <NuxtLink to="/calendar" class="app-brand">
          <span class="app-brand-mark">
            <UIcon name="i-lucide-shirt" class="h-5 w-5" />
          </span>
          <span class="truncate">Wardrobe Planner</span>
        </NuxtLink>

        <div v-if="data?.user" class="app-userbar">
          <UAvatar
            :alt="data.user.displayName || data.user.email"
            size="sm"
          />
          <span class="max-w-48 truncate">{{ data.user.displayName || data.user.email }}</span>
          <UButton size="xs" variant="outline" icon="i-heroicons-cog-6-tooth" to="/account">Account</UButton>
          <UButton size="xs" variant="outline" icon="i-heroicons-arrow-right-on-rectangle" @click="logout">Logout</UButton>
        </div>
      </div>
      <div class="app-main">
        <slot />
      </div>
    </UContainer>
  </main>
</template>
