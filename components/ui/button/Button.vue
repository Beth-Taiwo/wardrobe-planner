<script setup lang="ts">
import { Loader2 } from "@lucide/vue"
import { cn } from "~/lib/utils"

const props = withDefaults(defineProps<{
  type?: "button" | "submit" | "reset"
  variant?: "solid" | "outline" | "ghost" | "soft"
  color?: "neutral" | "error" | "success" | "warning" | string
  size?: "xs" | "sm" | "md" | "lg"
  icon?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
  square?: boolean
  to?: string | Record<string, any>
  external?: boolean
  class?: any
}>(), {
  type: "button",
  variant: "solid",
  color: "neutral",
  size: "md"
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const classes = computed(() => cn(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  props.size === "xs" ? "h-8 px-2 text-xs" : props.size === "sm" ? "h-9 px-3" : props.size === "lg" ? "h-11 px-5" : "h-10 px-4",
  props.square && "aspect-square px-0",
  props.block && "w-full",
  props.variant === "outline"
    ? props.color === "error" ? "border border-destructive/40 text-destructive hover:bg-destructive/10" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    : props.variant === "ghost"
      ? "hover:bg-accent hover:text-accent-foreground"
      : props.variant === "soft"
        ? "bg-primary/10 text-primary hover:bg-primary/15"
        : props.color === "error" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90",
  props.class
))

function onClick(event: MouseEvent) {
  emit("click", event)
}
</script>

<template>
  <NuxtLink v-if="to" :to="to" :external="external" :class="classes" @click="onClick">
    <Loader2 v-if="loading" class="size-4 animate-spin" />
    <Icon v-else-if="icon" :name="icon" class="size-4" />
    <slot />
  </NuxtLink>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading" @click="onClick">
    <Loader2 v-if="loading" class="size-4 animate-spin" />
    <Icon v-else-if="icon" :name="icon" class="size-4" />
    <slot />
  </button>
</template>
