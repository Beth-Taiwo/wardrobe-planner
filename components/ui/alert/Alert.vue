<script setup lang="ts">
import { cn } from "~/lib/utils"

const props = defineProps<{ title?: string, description?: string, color?: string, icon?: string, class?: any }>()
</script>

<template>
  <div :class="cn('flex gap-3 rounded-md border p-3 text-sm', color === 'error' ? 'border-destructive/25 bg-destructive/10 text-destructive' : color === 'warning' ? 'border-warning/25 bg-warning/10 text-warning-foreground' : 'border-border bg-muted text-foreground', props.class)">
    <Icon v-if="icon" :name="icon" class="mt-0.5 size-4 shrink-0" />
    <div class="min-w-0">
      <p v-if="title" class="font-medium">{{ title }}</p>
      <p v-if="description" class="mt-1 text-muted-foreground">{{ description }}</p>
      <slot />
    </div>
  </div>
</template>
