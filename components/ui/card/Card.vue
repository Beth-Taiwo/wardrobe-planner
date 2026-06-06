<script setup lang="ts">
import { cn } from "~/lib/utils"

defineProps<{ class?: any, variant?: string }>()
</script>

<template>
  <section :class="cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', $props.class)">
    <header v-if="$slots.header" class="border-b border-border p-4">
      <slot name="header" />
    </header>
    <div class="p-4">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="border-t border-border p-4">
      <slot name="footer" />
    </footer>
  </section>
</template>
