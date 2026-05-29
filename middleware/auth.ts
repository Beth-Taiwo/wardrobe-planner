export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = await useFetch<{ user: { id: string } | null }>("/api/auth/me", {
    key: "current-user"
  })

  if (!data.value?.user) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath }
    })
  }
})
