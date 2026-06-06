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
    <div class="app-container">
      <div class="app-topbar">
        <NuxtLink to="/calendar" class="app-brand">
          <span class="app-brand-mark">
            WP
          </span>
          <span class="truncate">Wardrobe Planner</span>
        </NuxtLink>

        <div v-if="data?.user" class="app-userbar">
          <Avatar
            :alt="data.user.displayName || data.user.email"
            size="sm"
          />
          <span class="max-w-48 truncate">{{ data.user.displayName || data.user.email }}</span>
          <Button as-child size="sm" variant="outline">
            <NuxtLink to="/account">Account</NuxtLink>
          </Button>
          <Button size="sm" variant="outline" @click="logout">Logout</Button>
        </div>
      </div>
      <div class="app-main">
        <slot />
      </div>
    </div>
  </main>
</template>
