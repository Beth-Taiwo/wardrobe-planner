<script setup lang="ts">
import { cn } from "~/lib/utils"

defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue?: string | number, class?: any }>()
const emit = defineEmits<{ "update:modelValue": [value: string], blur: [event: FocusEvent], keyup: [event: KeyboardEvent] }>()
</script>

<template>
  <textarea
    v-bind="$attrs"
    :value="modelValue"
    :class="cn('flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    @blur="emit('blur', $event)"
    @keyup="emit('keyup', $event)"
  />
</template>
