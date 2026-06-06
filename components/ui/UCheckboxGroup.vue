<script setup lang="ts">
import { cn } from "~/lib/utils"

const props = defineProps<{ modelValue?: string[], items?: Array<{ label: string, value: string }>, class?: any }>()
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>()

function toggle(value: string) {
  const current = new Set(props.modelValue || [])
  if (current.has(value)) {
    current.delete(value)
  } else {
    current.add(value)
  }
  emit("update:modelValue", [...current])
}
</script>

<template>
  <div :class="cn('grid gap-2', props.class)">
    <label v-for="item in items || []" :key="item.value" class="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-accent">
      <input type="checkbox" class="size-4 accent-primary" :checked="(modelValue || []).includes(item.value)" @change="toggle(item.value)">
      <span>{{ item.label }}</span>
    </label>
  </div>
</template>
