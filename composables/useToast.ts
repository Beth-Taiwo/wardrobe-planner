interface ToastOptions {
  title: string
  description?: string
  color?: string
}

interface ToastMessage extends ToastOptions {
  id: number
}

const toasts = ref<ToastMessage[]>([])
let nextToastId = 1

export function useToast() {
  function add(options: ToastOptions) {
    const id = nextToastId++
    toasts.value.push({ id, ...options })

    window.setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id)
    }, 3500)
  }

  return {
    add,
    toasts
  }
}
