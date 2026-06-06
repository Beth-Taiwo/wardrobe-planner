<script setup lang="ts">
import { cn } from "~/lib/utils"

defineProps<{ class?: any }>()
</script>

<template>
  <button :class="cn('inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', $props.class)">
    <slot />
  </button>
</template>
