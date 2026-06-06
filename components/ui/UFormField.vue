<script setup lang="ts">
defineProps<{ label?: string, name?: string, required?: boolean }>()
</script>

<template>
  <label class="grid gap-1.5 text-sm font-medium">
    <span v-if="label">{{ label }}<span v-if="required" class="text-destructive"> *</span></span>
    <slot />
  </label>
</template>
