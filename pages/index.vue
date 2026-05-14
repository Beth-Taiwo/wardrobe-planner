<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { computed, nextTick, reactive, ref } from 'vue'
import type { DressEntry } from '~/types/dress'

interface DressForm {
  date: string
  title: string
  color: string
  category: string
  notes: string
  imageUrl: string
}

interface DressSuggestion {
  entry: DressEntry
  score: number
  lastWornDate: string
  daysSinceWorn: number
  reasons: string[]
}

const today = new Date()
const monthCursor = ref(new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)))
const selectedDate = ref(toDateInput(today))
const importText = ref('')
const importYear = ref(today.getFullYear())
const importOpen = ref(false)
const importError = ref('')
const importing = ref(false)
const searchDate = ref(toDateInput(today))
const searchMonth = ref(toDateInput(today).slice(0, 7))
const searchYear = ref(String(today.getFullYear()))
const searchResults = ref<DressEntry[]>([])
const searchLabel = ref('')
const searching = ref(false)
const suggestionResults = ref<DressSuggestion[]>([])
const suggestionLoading = ref(false)
const suggestionError = ref("")
const editingEntryId = ref<string | null>(null)
const keepFormOnDateChange = ref(false)
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
  notes: '',
  imageUrl: ''
})

const entriesByDate = computed(() =>
  new Map((dresses.value || []).map((entry) => [entry.date, entry]))
)

const selectedEntry = computed(() => entriesByDate.value.get(selectedDate.value) || null)
const calendarDays = computed(() => buildCalendarDays(monthCursor.value))

watch(selectedDate, (date) => {
  suggestionResults.value = []
  suggestionError.value = ""

  if (keepFormOnDateChange.value) {
    form.date = date
    return
  }

  const entry = entriesByDate.value.get(date)
  editingEntryId.value = entry?.id || null
  form.date = date
  form.title = entry?.title || ''
  form.color = entry?.color || ''
  form.category = entry?.category || 'Casual'
  form.notes = entry?.notes || ''
  form.imageUrl = entry?.imageUrl || ''
})

watch(dresses, () => {
  const entry = entriesByDate.value.get(selectedDate.value)
  if (entry && !keepFormOnDateChange.value) {
    editingEntryId.value = entry.id
    form.title = entry.title
    form.color = entry.color || ''
    form.category = entry.category || 'Casual'
    form.notes = entry.notes || ''
    form.imageUrl = entry.imageUrl || ''
  }
})

const categoryOptions = ['Casual', 'Work', 'Cooperate', 'Traditional', 'Event', 'Travel', 'Formal', 'Workout']

function selectDate(date: string) {
  selectedDate.value = date
}

function jumpToDate(date: string) {
  const [year, month] = date.split('-').map(Number)
  monthCursor.value = new Date(Date.UTC(year, month - 1, 1))
  selectedDate.value = date
}

function fillFormFromEntry(entry: DressEntry) {
  editingEntryId.value = entry.id
  form.date = entry.date
  form.title = entry.title
  form.color = entry.color || ''
  form.category = entry.category || 'Casual'
  form.notes = entry.notes || ''
  form.imageUrl = entry.imageUrl || ''
}

function clearDressFields(date = form.date) {
  editingEntryId.value = null
  form.date = date
  form.title = ''
  form.color = ''
  form.category = 'Casual'
  form.notes = ''
  form.imageUrl = ''
}

async function handleFormDateChange() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    return
  }

  keepFormOnDateChange.value = true
  jumpToDate(form.date)
  await nextTick()
  keepFormOnDateChange.value = false
}

async function runSearch(kind: 'date' | 'month' | 'year') {
  searching.value = true

  try {
    const query = kind === 'date'
      ? { date: searchDate.value }
      : kind === 'month'
        ? { month: searchMonth.value }
        : { year: searchYear.value }

    const results = await $fetch<DressEntry[]>('/api/dresses', { query })
    searchResults.value = results

    if (kind === 'date') {
      jumpToDate(searchDate.value)
      searchLabel.value = results.length
        ? '1 outfit found for ' + searchDate.value
        : 'No outfit found for ' + searchDate.value
    } else if (kind === 'month') {
      const [year, month] = searchMonth.value.split('-').map(Number)
      monthCursor.value = new Date(Date.UTC(year, month - 1, 1))
      selectedDate.value = searchMonth.value + '-01'
      searchLabel.value = results.length + ' outfit' + (results.length === 1 ? '' : 's') + ' found for ' + searchMonth.value
    } else {
      const year = Number(searchYear.value)
      monthCursor.value = new Date(Date.UTC(year, 0, 1))
      selectedDate.value = searchYear.value + '-01-01'
      searchLabel.value = results.length + ' outfit' + (results.length === 1 ? '' : 's') + ' found in ' + searchYear.value
    }
  } finally {
    searching.value = false
  }
}

function openSearchResult(entry: DressEntry) {
  jumpToDate(entry.date)
  fillFormFromEntry(entry)
}

function moveMonth(offset: number) {
  monthCursor.value = new Date(Date.UTC(
    monthCursor.value.getUTCFullYear(),
    monthCursor.value.getUTCMonth() + offset,
    1
  ))
}

async function saveDress(event: FormSubmitEvent<DressForm>) {
  const saved = await $fetch<DressEntry>('/api/dresses', {
    method: 'POST',
    body: {
      ...event.data,
      id: editingEntryId.value
    }
  })

  keepFormOnDateChange.value = true
  editingEntryId.value = saved.id
  selectedDate.value = saved.date
  fillFormFromEntry(saved)
  toast.add({ title: 'Dress saved', color: 'green' })
  await refresh()
  await nextTick()
  keepFormOnDateChange.value = false
}

async function deleteDress() {
  const id = selectedEntry.value?.id || editingEntryId.value
  if (!id) {
    return
  }

  await $fetch(`/api/dresses/${id}`, { method: 'DELETE' })
  toast.add({ title: 'Dress removed', color: 'gray' })
  editingEntryId.value = null
  form.title = ''
  form.color = ''
  form.category = 'Casual'
  form.notes = ''
  form.imageUrl = ''
  await refresh()
}

async function suggestDress() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    return
  }

  suggestionError.value = ""
  suggestionLoading.value = true

  try {
    const result = await $fetch<{ suggestions: DressSuggestion[] }>("/api/suggestions", {
      query: {
        date: form.date,
        windowDays: 60
      }
    })

    suggestionResults.value = result.suggestions

    if (result.suggestions[0]) {
      applySuggestion(result.suggestions[0].entry)
      toast.add({ title: "Suggested an outfit", color: "green" })
    } else {
      suggestionError.value = "No suggestion found outside the 60-day repeat window."
    }
  } catch (error: any) {
    suggestionError.value = error?.statusMessage || error?.data?.statusMessage || "Could not suggest an outfit."
  } finally {
    suggestionLoading.value = false
  }
}

function applySuggestion(entry: DressEntry) {
  form.title = entry.title
  form.color = entry.color || ""
  form.category = entry.category || "Casual"
  form.notes = entry.notes || ""
  form.imageUrl = entry.imageUrl || ""
}

function clearSuggestions() {
  suggestionResults.value = []
  suggestionError.value = ""
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
          <UButton color="rose" icon="i-heroicons-arrow-down-tray" @click="importOpen = true">
            Import
          </UButton>
        </div>
      </header>

      <section class="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(260px,0.75fr)] lg:items-end">
          <UFormField label="Find exact date">
            <div class="flex gap-2">
              <UInput v-model="searchDate" type="date" class="min-w-0 flex-1" @keyup.enter="runSearch('date')" />
              <UButton color="rose" icon="i-heroicons-magnifying-glass" :loading="searching" @click="runSearch('date')">
                Search date
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Find month">
            <div class="flex gap-2">
              <UInput v-model="searchMonth" type="month" class="min-w-0 flex-1" @keyup.enter="runSearch('month')" />
              <UButton color="rose" icon="i-heroicons-calendar-days" :loading="searching" @click="runSearch('month')">
                Search month
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Find year">
            <div class="flex gap-2">
              <UInput v-model="searchYear" type="number" min="1900" max="2100" class="min-w-24 flex-1" @keyup.enter="runSearch('year')" />
              <UButton color="rose" icon="i-heroicons-calendar" :loading="searching" @click="runSearch('year')">
                Search year
              </UButton>
            </div>
          </UFormField>
        </div>

        <div v-if="searchLabel" class="mt-4 border-t border-stone-200 pt-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-sm font-medium text-slate-600">
              {{ searchLabel }}
            </p>
            <UButton v-if="searchResults.length" color="white" size="xs" @click="searchResults = []; searchLabel = ''">
              Clear
            </UButton>
          </div>

          <div v-if="searchResults.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="entry in searchResults"
              :key="entry.id"
              type="button"
              class="rounded-md border border-stone-200 bg-stone-50 p-3 text-left transition hover:border-rose-300 hover:bg-rose-50"
              @click="openSearchResult(entry)"
            >
              <span class="block text-xs font-semibold text-rose-700">{{ entry.date }}</span>
              <span class="mt-1 block text-sm font-medium text-slate-950">{{ entry.title }}</span>
            </button>
          </div>
        </div>
      </section>

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
              <UInput v-model="form.date" type="date" @change="handleFormDateChange" />
            </UFormField>

            <UFormField label="Dress" name="title" required>
              <div class="flex gap-2">
                <UInput v-model="form.title" placeholder="Blue midi dress with white sandals" class="min-w-0 flex-1" />
                <UButton type="button" color="white" icon="i-heroicons-sparkles" :loading="suggestionLoading" @click="suggestDress">
                  Suggest
                </UButton>
              </div>
            </UFormField>

            <UAlert
              v-if="suggestionError"
              color="amber"
              variant="soft"
              icon="i-heroicons-light-bulb"
              :title="suggestionError"
            />

            <div v-if="suggestionResults.length" class="space-y-2 rounded-md border border-stone-200 bg-stone-50 p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-700">
                  Suggestions for {{ form.date }}
                </p>
                <UButton type="button" color="white" size="xs" icon="i-heroicons-x-mark" @click="clearSuggestions">
                  Clear
                </UButton>
              </div>
              <button
                v-for="suggestion in suggestionResults"
                :key="suggestion.entry.id"
                type="button"
                class="w-full rounded-md border border-stone-200 bg-white p-3 text-left transition hover:border-rose-300 hover:bg-rose-50"
                @click="applySuggestion(suggestion.entry)"
              >
                <span class="block text-sm font-semibold text-slate-950">{{ suggestion.entry.title }}</span>
                <span class="mt-1 block text-xs text-slate-500">
                  Last worn {{ suggestion.lastWornDate }} · {{ suggestion.reasons.join(" - ") }}
                </span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Color" name="color">
                <UInput v-model="form.color" placeholder="Blue" />
              </UFormField>

              <UFormField label="Category" name="category">
                <USelect v-model="form.category" :items="categoryOptions" />
              </UFormField>
            </div>

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
              <UButton v-if="selectedEntry || editingEntryId" type="button" color="white" icon="i-heroicons-trash" @click="deleteDress">
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
