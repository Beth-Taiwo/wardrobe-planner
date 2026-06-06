<script setup lang="ts">
import { cn } from "~/lib/utils"

defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue?: string | number, items?: Array<string | number | { label?: string, value?: string | number }>, placeholder?: string, class?: any }>()
const emit = defineEmits<{ "update:modelValue": [value: string | number], blur: [event: FocusEvent] }>()

function itemValue(item: string | number | { label?: string, value?: string | number }) {
  return typeof item === "object" ? item.value ?? item.label ?? "" : item
}

function itemLabel(item: string | number | { label?: string, value?: string | number }) {
  return typeof item === "object" ? item.label ?? String(item.value ?? "") : String(item)
}

function onChange(event: Event) {
  const selectedValue = (event.target as HTMLSelectElement).value
  const selectedItem = (props.items || []).find((item) => String(itemValue(item)) === selectedValue)
  emit("update:modelValue", selectedItem === undefined ? selectedValue : itemValue(selectedItem))
}
</script>

<template>
  <select
    v-bind="$attrs"
    :value="modelValue"
    :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
    @change="onChange"
    @blur="emit('blur', $event)"
  >
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option v-for="item in items || []" :key="String(itemValue(item))" :value="itemValue(item)">
      {{ itemLabel(item) }}
    </option>
  </select>
</template>
