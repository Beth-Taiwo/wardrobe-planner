<script setup lang="ts">
// The separate register page is gone — there is a single Google-first auth surface at /login,
// where new-vs-returning is an in-form toggle. Preserve any redirect target on the way through.
const route = useRoute()

await navigateTo({ path: "/login", query: route.query })
</script>

<template>
  <div />
</template>
