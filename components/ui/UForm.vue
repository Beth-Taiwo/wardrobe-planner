<script setup lang="ts">
defineProps<{ state?: Record<string, any> }>()
const emit = defineEmits<{ submit: [event: SubmitEvent] }>()
</script>

<template>
  <form @submit.prevent="emit('submit', $event)">
    <slot />
  </form>
</template>
