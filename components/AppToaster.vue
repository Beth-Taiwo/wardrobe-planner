<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <div class="fixed right-4 top-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="rounded-md border border-border bg-card px-4 py-3 text-card-foreground shadow-lg"
      role="status"
    >
      <p class="text-sm font-semibold">{{ toast.title }}</p>
      <p v-if="toast.description" class="mt-1 text-sm text-muted-foreground">{{ toast.description }}</p>
    </div>
  </div>
</template>
