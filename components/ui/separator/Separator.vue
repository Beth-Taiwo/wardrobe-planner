<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex items-center gap-3 text-xs text-muted-foreground">
    <div class="h-px flex-1 bg-border" />
    <span v-if="label">{{ label }}</span>
    <div class="h-px flex-1 bg-border" />
  </div>
</template>
