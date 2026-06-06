<script setup lang="ts">
import { cn } from "~/lib/utils"

defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue?: string | number, icon?: string, class?: any }>()
const emit = defineEmits<{ "update:modelValue": [value: string | number], change: [event: Event], blur: [event: FocusEvent], keyup: [event: KeyboardEvent] }>()
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <Icon v-if="icon" :name="icon" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <input
      v-bind="$attrs"
      :value="modelValue"
      :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', icon && 'pl-9')"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @change="emit('change', $event)"
      @blur="emit('blur', $event)"
      @keyup="emit('keyup', $event)"
    >
  </div>
</template>
