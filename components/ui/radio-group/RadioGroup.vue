<script setup lang="ts">
const props = defineProps<{ modelValue?: string, items?: Array<{ label: string, value: string }>, orientation?: string }>()
const emit = defineEmits<{ "update:modelValue": [value: string] }>()
</script>

<template>
  <div class="inline-flex rounded-md border border-input bg-background p-1">
    <button
      v-for="item in items || []"
      :key="item.value"
      type="button"
      class="rounded px-3 py-1.5 text-sm font-medium transition"
      :class="modelValue === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
