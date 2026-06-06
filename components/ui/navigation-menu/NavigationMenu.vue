<script setup lang="ts">
defineProps<{ items?: Array<{ label: string, to: string, icon?: string }>, variant?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <NuxtLink
      v-for="item in items || []"
      :key="item.to"
      :to="item.to"
      class="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
      active-class="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
    >
      <Icon v-if="item.icon" :name="item.icon" class="size-4" />
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
