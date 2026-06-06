<script setup lang="ts">
import { cn } from "~/lib/utils"

const props = defineProps<{ accept?: string, multiple?: boolean, disabled?: boolean, label?: string, description?: string, icon?: string, variant?: string, class?: any }>()
const emit = defineEmits<{ change: [event: Event] }>()
</script>

<template>
  <label :class="cn(variant === 'button' ? 'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent' : 'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/50 p-4 text-center text-sm hover:bg-muted', disabled && 'pointer-events-none opacity-50', props.class)">
    <Icon v-if="icon" :name="icon" class="size-4" />
    <span>{{ label || "Choose file" }}</span>
    <span v-if="description" class="text-xs text-muted-foreground">{{ description }}</span>
    <input class="sr-only" type="file" :accept="accept" :multiple="multiple" :disabled="disabled" @change="emit('change', $event)">
  </label>
</template>
