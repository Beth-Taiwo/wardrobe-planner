<script setup lang="ts">
defineProps<{ items?: Array<{ title?: string, label?: string }>, modelValue?: number }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      v-for="(item, index) in items || []"
      :key="item.title || item.label || index"
      class="flex min-w-0 flex-1 items-center gap-2 text-xs"
    >
      <span class="flex size-6 shrink-0 items-center justify-center rounded-full" :class="(index + 1) <= (modelValue || 1) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">{{ index + 1 }}</span>
      <span class="truncate font-medium">{{ item.title || item.label }}</span>
    </div>
  </div>
</template>
