<script setup lang="ts">
const props = defineProps<{ alt?: string, size?: string }>()
const initials = computed(() => (props.alt || "U").split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""))
</script>

<template>
  <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
    {{ initials }}
  </span>
</template>
