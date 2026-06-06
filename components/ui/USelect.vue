<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ modelValue?: string | number, items?: Array<string | number | { label?: string, value?: string | number }>, placeholder?: string, class?: any }>()
const emit = defineEmits<{ "update:modelValue": [value: string | number], blur: [event: FocusEvent] }>()
</script>

<template>
  <USelectMenu
    v-bind="$attrs"
    :model-value="modelValue"
    :items="items"
    :placeholder="placeholder"
    :class="class"
    @update:model-value="emit('update:modelValue', $event)"
    @blur="emit('blur', $event)"
  />
</template>
