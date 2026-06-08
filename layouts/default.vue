<script setup lang="ts">
const { data, refresh } = await useFetch<{ user: { email: string, displayName: string | null } | null }>("/api/auth/me", {
  key: "current-user",
  default: () => ({ user: null })
})

const route = useRoute()
const navItems = [
  { label: "Insight", to: "/insight" },
  { label: "Wardrobe", to: "/wardrobe" },
  { label: "Plan outfit", to: "/plan" }
]

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" })
  await refresh()
  await navigateTo("/login")
}

function openNavbarAction(path: string, action: string) {
  return navigateTo({
    path,
    query: {
      [action]: String(Date.now())
    }
  })
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/")
}
</script>

<template>
  <main class="app-shell">
    <div class="app-container">
      <div class="app-topbar">
        <NuxtLink to="/wardrobe" class="app-brand">
          <span class="app-brand-mark">
            WP
          </span>
          <span class="truncate">Wardrobe Planner</span>
        </NuxtLink>

        <nav v-if="data?.user" class="app-navbar" aria-label="Application navigation">
          <NavigationMenu>
            <NavigationMenuList class="flex-wrap justify-start">
              <NavigationMenuItem v-for="item in navItems" :key="item.to">
                <NavigationMenuLink as-child>
                  <NuxtLink
                    :to="item.to"
                    :class="[
                      'inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive(item.to) ? 'bg-accent text-accent-foreground' : ''
                    ]"
                  >
                    {{ item.label }}
                  </NuxtLink>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink as-child>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    @click="openNavbarAction('/wardrobe', 'import')"
                  >
                    Import
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink as-child>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    @click="openNavbarAction('/wardrobe', 'addClothes')"
                  >
                    Add clothes
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink as-child>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    @click="openNavbarAction('/wardrobe', 'batchUpload')"
                  >
                    Batch upload
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

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
