<script setup lang="ts">
import { cn } from "~/lib/utils"

const props = defineProps<{ color?: string, variant?: string, size?: string, class?: any }>()
</script>

<template>
  <span :class="cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', size === 'xs' && 'px-1.5 py-0 text-[0.7rem]', color === 'error' ? 'border-destructive/25 bg-destructive/10 text-destructive' : color === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-border bg-secondary text-secondary-foreground', props.class)">
    <slot />
  </span>
</template>
