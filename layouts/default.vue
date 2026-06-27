<script setup lang="ts">
const { data, refresh } = await useFetch<{ user: { email: string, displayName: string | null } | null }>("/api/auth/me", {
  key: "current-user",
  default: () => ({ user: null })
})

const route = useRoute()
const navItems = [
  { label: "Home", to: "/home" },
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
        <NuxtLink to="/home" class="app-brand">
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
                    class="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    @click="openNavbarAction('/home', 'logToday')"
                  >
                    Log today
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
                <Popover>
                  <PopoverTrigger as-child>
                    <button
                      type="button"
                      class="inline-flex h-9 min-w-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Avatar
                        :alt="data.user.displayName || data.user.email"
                        size="sm"
                        class="h-6 w-6"
                      />
                      <span class="max-w-32 truncate">{{ data.user.displayName || data.user.email }}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" side="top" class="z-[60] w-56 p-2">
                    <div class="border-b border-default px-2 pb-2">
                      <p class="truncate text-sm font-medium">{{ data.user.displayName || "Account" }}</p>
                      <p class="truncate text-xs text-muted">{{ data.user.email }}</p>
                    </div>
                    <div class="grid gap-1 pt-2">
                      <NuxtLink
                        to="/account"
                        class="rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Account settings
                      </NuxtLink>
                      <button
                        type="button"
                        class="rounded-md px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        @click="logout"
                      >
                        Logout
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
      </div>
      <div class="app-main">
        <slot />
      </div>
    </div>
  </main>
</template>
