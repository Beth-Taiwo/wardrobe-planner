<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { computed, reactive, ref } from 'vue'
import type { DressEntry } from '~/types/dress'

interface DressForm {
  date: string
  title: string
  color: string
  category: string
  weather: string
  notes: string
  imageUrl: string
}

const today = new Date()
const monthCursor = ref(new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)))
const selectedDate = ref(toDateInput(today))
const importText = ref('')
const importYear = ref(today.getFullYear())
const importOpen = ref(false)
const importError = ref('')
const importing = ref(false)
const toast = useToast()

const monthKey = computed(() => monthCursor.value.toISOString().slice(0, 7))
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(monthCursor.value)
)

const { data: dresses, pending, refresh } = await useFetch<DressEntry[]>('/api/dresses', {
  query: { month: monthKey },
  watch: [monthKey],
  default: () => []
})

const form = reactive<DressForm>({
  date: selectedDate.value,
  title: '',
  color: '',
  category: 'Casual',
  weather: '',
  notes: '',
  imageUrl: ''
})

const entriesByDate = computed(() =>
  new Map((dresses.value || []).map((entry) => [entry.date, entry]))
)

const selectedEntry = computed(() => entriesByDate.value.get(selectedDate.value) || null)
const calendarDays = computed(() => buildCalendarDays(monthCursor.value))

watch(selectedDate, (date) => {
  const entry = entriesByDate.value.get(date)
  form.date = date
  form.title = entry?.title || ''
  form.color = entry?.color || ''
  form.category = entry?.category || 'Casual'
  form.weather = entry?.weather || ''
  form.notes = entry?.notes || ''
  form.imageUrl = entry?.imageUrl || ''
})

watch(dresses, () => {
  const entry = entriesByDate.value.get(selectedDate.value)
  if (entry) {
    form.title = entry.title
    form.color = entry.color || ''
    form.category = entry.category || 'Casual'
    form.weather = entry.weather || ''
    form.notes = entry.notes || ''
    form.imageUrl = entry.imageUrl || ''
  }
})

const categoryOptions = ['Casual', 'Work', 'Event', 'Travel', 'Formal', 'Workout']

function selectDate(date: string) {
  selectedDate.value = date
}

function moveMonth(offset: number) {
  monthCursor.value = new Date(Date.UTC(
    monthCursor.value.getUTCFullYear(),
    monthCursor.value.getUTCMonth() + offset,
    1
  ))
}

async function saveDress(event: FormSubmitEvent<DressForm>) {
  await $fetch('/api/dresses', {
    method: 'POST',
    body: event.data
  })

  toast.add({ title: 'Dress saved', color: 'green' })
  await refresh()
}

async function deleteDress() {
  if (!selectedEntry.value) {
    return
  }

  await $fetch(`/api/dresses/${selectedEntry.value.id}`, { method: 'DELETE' })
  toast.add({ title: 'Dress removed', color: 'gray' })
  form.title = ''
  form.color = ''
  form.category = 'Casual'
  form.weather = ''
  form.notes = ''
  form.imageUrl = ''
  await refresh()
}

async function importEntries() {
  importError.value = ''
  importing.value = true

  try {
    const result = await $fetch<{ count: number }>('/api/import', {
      method: 'POST',
      body: {
        text: importText.value,
        year: importYear.value
      }
    })

    toast.add({ title: `Imported ${result.count} entries`, color: 'green' })
    importOpen.value = false
    importText.value = ''
    await refresh()
  } catch (error: any) {
    importError.value = error?.statusMessage || error?.data?.statusMessage || 'Could not import these entries.'
  } finally {
    importing.value = false
  }
}

function buildCalendarDays(cursor: Date) {
  const year = cursor.getUTCFullYear()
  const month = cursor.getUTCMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const startOffset = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = []

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ date: '', day: '', isCurrentMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toDateString(year, month, day)
    cells.push({ date, day: String(day), isCurrentMonth: true })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: '', day: '', isCurrentMonth: false })
  }

  return cells
}

function toDateInput(date: Date) {
  return toDateString(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateString(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
}
</script>

<template>
  <main class="min-h-screen bg-[#f6f3ef] text-slate-950">
    <section class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-4 border-b border-stone-300 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-rose-700">
            Wardrobe planner
          </p>
          <h1 class="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Dress Calendar
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton color="white" icon="i-heroicons-arrow-top-right-on-square" to="https://keep.google.com/u/0/#NOTE/1rxrgh8G769r5fhSDrtLzGs0OQ-buStywyjO3tP2G5ahBi4U30WTJz60ow8d3DP3RE_Wa" target="_blank">
            Open Keep
          </UButton>
          <UButton color="rose" icon="i-heroicons-arrow-down-tray" @click="importOpen = true">
            Import
          </UButton>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section class="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <UButton color="white" square icon="i-heroicons-chevron-left" aria-label="Previous month" @click="moveMonth(-1)" />
            <h2 class="text-xl font-semibold">
              {{ monthLabel }}
            </h2>
            <UButton color="white" square icon="i-heroicons-chevron-right" aria-label="Next month" @click="moveMonth(1)" />
          </div>

          <div class="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div class="mt-2 grid grid-cols-7 gap-2">
            <button
              v-for="(day, index) in calendarDays"
              :key="day.date || `blank-${index}`"
              type="button"
              :disabled="!day.isCurrentMonth"
              class="min-h-28 rounded-md border p-2 text-left transition enabled:hover:border-rose-300 enabled:hover:bg-rose-50 disabled:border-transparent disabled:bg-stone-50"
              :class="[
                selectedDate === day.date ? 'border-rose-500 ring-2 ring-rose-200' : 'border-stone-200',
                entriesByDate.has(day.date) ? 'bg-white' : 'bg-stone-50'
              ]"
              @click="selectDate(day.date)"
            >
              <span class="text-sm font-semibold text-slate-800">{{ day.day }}</span>
              <template v-if="entriesByDate.has(day.date)">
                <span class="mt-2 block truncate text-sm font-medium text-slate-950">
                  {{ entriesByDate.get(day.date)?.title }}
                </span>
                <span class="mt-1 block truncate text-xs text-slate-500">
                  {{ entriesByDate.get(day.date)?.category || 'Planned' }}
                </span>
              </template>
            </button>
          </div>
        </section>

        <aside class="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
          <div class="mb-4">
            <p class="text-sm font-medium text-slate-500">
              {{ selectedDate }}
            </p>
            <h2 class="text-2xl font-semibold">
              {{ selectedEntry ? 'Edit dress' : 'Plan dress' }}
            </h2>
          </div>

          <UForm :state="form" class="space-y-4" @submit="saveDress">
            <UFormField label="Date" name="date">
              <UInput v-model="form.date" type="date" @change="selectedDate = form.date" />
            </UFormField>

            <UFormField label="Dress" name="title" required>
              <UInput v-model="form.title" placeholder="Blue midi dress with white sandals" />
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Color" name="color">
                <UInput v-model="form.color" placeholder="Blue" />
              </UFormField>

              <UFormField label="Category" name="category">
                <USelect v-model="form.category" :options="categoryOptions" />
              </UFormField>
            </div>

            <UFormField label="Weather" name="weather">
              <UInput v-model="form.weather" placeholder="Warm, rainy, breezy" />
            </UFormField>

            <UFormField label="Image URL" name="imageUrl">
              <UInput v-model="form.imageUrl" placeholder="https://..." />
            </UFormField>

            <UFormField label="Notes" name="notes">
              <UTextarea v-model="form.notes" :rows="4" placeholder="Accessories, shoes, reminders" />
            </UFormField>

            <div v-if="form.imageUrl" class="overflow-hidden rounded-md border border-stone-200">
              <img :src="form.imageUrl" alt="" class="aspect-[4/3] w-full object-cover">
            </div>

            <div class="flex gap-2">
              <UButton type="submit" color="rose" icon="i-heroicons-check">
                Save
              </UButton>
              <UButton v-if="selectedEntry" type="button" color="white" icon="i-heroicons-trash" @click="deleteDress">
                Delete
              </UButton>
            </div>
          </UForm>
        </aside>
      </div>
    </section>

    <UModal
      v-model:open="importOpen"
      title="Import from Keep"
      description="Paste all three Google Keep notes here. Slash dates are read as DD/MM/YYYY, for example 08/12/2020 means 8 December 2020."
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="importError"
            color="red"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="importError"
          />

          <UFormField label="Default year">
            <UInput v-model="importYear" type="number" />
          </UFormField>

          <UTextarea v-model="importText" :rows="10" placeholder="WFH — 13/05/2025&#10;Blue dress — 08/12/2020&#10;Black wrap dress — 12/05/2026" />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="white" :disabled="importing" @click="importOpen = false">
            Cancel
          </UButton>
          <UButton
            color="rose"
            icon="i-heroicons-arrow-down-tray"
            :loading="importing"
            :disabled="!importText.trim()"
            @click="importEntries"
          >
            Import entries
          </UButton>
        </div>
      </template>
    </UModal>

    <div v-if="pending" class="fixed bottom-4 right-4">
      <UBadge color="gray">
        Loading
      </UBadge>
    </div>
  </main>
</template>
