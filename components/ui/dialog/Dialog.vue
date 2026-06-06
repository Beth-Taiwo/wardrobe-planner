<script setup lang="ts">
defineProps<{ open?: boolean, title?: string, description?: string }>()
const emit = defineEmits<{ "update:open": [value: boolean] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" @click.self="emit('update:open', false)">
      <section class="max-h-[90vh] w-[min(42rem,100%)] overflow-auto rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        <header class="border-b border-border p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
            </div>
            <Button variant="ghost" square icon="i-heroicons-x-mark" aria-label="Close" @click="emit('update:open', false)" />
          </div>
        </header>
        <div class="p-4">
          <slot name="body" />
          <slot />
        </div>
        <footer v-if="$slots.footer" class="border-t border-border p-4">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>
