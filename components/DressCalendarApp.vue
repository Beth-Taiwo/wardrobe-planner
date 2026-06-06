<script setup lang="ts">
import { parseDate, type DateValue } from '@internationalized/date'
import { computed, nextTick, reactive, ref } from 'vue'
import type { ClothingItem, DressEntry } from '~/types/dress'

interface DressForm {
  date: string
  title: string
  color: string
  category: string
  notes: string
  imageUrl: string
  clothingItemIds: string[]
}

interface ClothingForm {
  name: string
  label: string
  color: string
  imageUrl: string
  notes: string
}

interface BatchClothingDraft {
  name: string
  label: string
  color: string
  imageUrl: string
  notes: string
}

interface DressSuggestion {
  entry: DressEntry
  score: number
  lastWornDate: string
  daysSinceWorn: number
  reasons: string[]
}

interface OutfitStats {
  totalEntries: number
  uniqueOutfits: number
  wornThisYear: number
  uncategorized: number
  mostWorn: Array<{ title: string, count: number, lastWorn: string }>
  categories: Array<{ category: string, count: number }>
  notWornThisYear: Array<{ title: string, count: number, lastWorn: string }>
}

interface ImportPreviewResult {
  count: number
  skippedCount: number
  invalidCount: number
  entries: DressForm[]
  skipped: Array<{ line: string, reason: string }>
  invalid: Array<{ line: string, reason: string }>
}

interface DressDeletePreview {
  id: string
  date: string
  title: string
  category: string
  imageUrl: string
}

const today = new Date()
const monthCursor = ref(new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)))
const selectedDate = ref(toDateInput(today))
const importText = ref('')
const importYear = ref(today.getFullYear())
const importOpen = ref(false)
const searchOpen = ref(false)
type AppTab = 'insight' | 'wardrobe' | 'calendar'
const route = useRoute()
const activeTab = computed<AppTab>(() => getTabFromPath(route.path))
const importError = ref('')
const importing = ref(false)
const searchDate = ref(toDateInput(today))
const searchMonth = ref(toDateInput(today).slice(0, 7))
const searchYear = ref(String(today.getFullYear()))
const searchText = ref("")
const searchCategory = ref("")
const searchResults = ref<DressEntry[]>([])
const searchLabel = ref('')
const searching = ref(false)
const suggestionResults = ref<DressSuggestion[]>([])
const suggestionLoading = ref(false)
const suggestionError = ref("")
const suggestionWindowDays = ref(60)
const saveLoading = ref(false)
const saveError = ref("")
const deleteLoading = ref(false)
const dressDeleteConfirmOpen = ref(false)
const dressPendingDelete = ref<DressDeletePreview | null>(null)
const historyLoading = ref(false)
const historyResult = ref<{ title: string, count: number, entries: DressEntry[] } | null>(null)
const importPreview = ref<ImportPreviewResult | null>(null)
const importPreviewLoading = ref(false)
const normalizingCategories = ref(false)
const clothingSaveLoading = ref(false)
const clothingUploadLoading = ref(false)
const clothingDeleteLoading = ref(false)
const clothingDeleteConfirmOpen = ref(false)
const clothingItemPendingDelete = ref<ClothingItem | null>(null)
const batchClothesOpen = ref(false)
const batchClothesLoading = ref(false)
const batchClothesUploadLoading = ref(false)
const batchClothesError = ref("")
const batchImageDrafts = ref<BatchClothingDraft[]>([])
const wardrobeViewMode = ref<'grid' | 'list'>('grid')
const showAddClothesForm = ref(true)
const clothingError = ref("")
const editingEntryId = ref<string | null>(null)
const editingClothingItemId = ref<string | null>(null)
const keepFormOnDateChange = ref(false)
const toast = useToast()

const monthKey = computed(() => monthCursor.value.toISOString().slice(0, 7))
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(monthCursor.value)
)

const { data: dresses, pending, refresh } = await useFetch<DressEntry[]>("/api/dresses", {
  query: { month: monthKey },
  watch: [monthKey],
  default: () => []
})

const { data: clothingItems, refresh: refreshClothingItems } = await useFetch<ClothingItem[]>("/api/clothes", {
  default: () => []
})

const { data: stats, refresh: refreshStats } = await useFetch<OutfitStats>("/api/stats", {
  default: () => ({
    totalEntries: 0,
    uniqueOutfits: 0,
    wornThisYear: 0,
    uncategorized: 0,
    mostWorn: [],
    categories: [],
    notWornThisYear: []
  })
})

const form = reactive<DressForm>({
  date: selectedDate.value,
  title: '',
  color: '',
  category: 'Casual',
  notes: '',
  imageUrl: '',
  clothingItemIds: []
})

const clothingForm = reactive<ClothingForm>({
  name: '',
  label: 'Dress',
  color: '',
  imageUrl: '',
  notes: ''
})

const entriesByDate = computed(() =>
  new Map((dresses.value || []).map((entry) => [entry.date, entry]))
)

const selectedEntry = computed(() => entriesByDate.value.get(selectedDate.value) || null)
const selectedClothingItems = computed(() => {
  const selectedIds = new Set(form.clothingItemIds)
  return (clothingItems.value || []).filter((item) => selectedIds.has(item.id))
})
const validBatchClothes = computed(() =>
  batchImageDrafts.value.filter((item) => item.name.trim() && normalizeClothingLabel(item.label)).map((item) => ({
    ...item,
    label: normalizeClothingLabel(item.label)
  }))
)
const calendarDays = computed(() => buildCalendarDays(monthCursor.value))
const calendarDate = computed<DateValue | undefined>({
  get: () => parseDate(selectedDate.value),
  set: (value) => {
    if (!value) {
      return
    }

    jumpToDate(dateValueToString(value))
  }
})
const navigationItems = computed(() =>
  navTabs.map((tab) => ({
    label: tab.label,
    icon: tab.icon,
    to: tab.path,
    active: activeTab.value === tab.key
  }))
)
const wardrobeViewOptions = [
  { label:"Grid", value:"grid", icon:"i-heroicons-squares-2x2" },
  { label:"List", value:"list", icon:"i-heroicons-list-bullet" }
]
const clothingCheckboxItems = computed(() =>
  (clothingItems.value || []).map((item) => ({
    label: item.name,
    value: item.id,
    description: [item.label, item.color].filter(Boolean).join(" - ")
  }))
)
const outfitStepperItems = [
  { title:"Outfit", description:"Name and date", icon:"i-heroicons-sparkles" },
  { title:"Pieces", description:"Clothing and image", icon:"i-heroicons-swatch" },
  { title:"Save", description:"Notes and actions", icon:"i-heroicons-check" }
]

watch(selectedDate, (date) => {
  suggestionResults.value = []
  suggestionError.value =""

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
  form.clothingItemIds = entry?.clothingItems?.map((item) => item.id) || []
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
    form.clothingItemIds = entry.clothingItems?.map((item) => item.id) || []
  }
})

watch(clothingDeleteConfirmOpen, (open) => {
  if (!open && !clothingDeleteLoading.value) {
    clothingItemPendingDelete.value = null
  }
})

watch(dressDeleteConfirmOpen, (open) => {
  if (!open && !deleteLoading.value) {
    dressPendingDelete.value = null
  }
})

const categoryOptions = ["Casual","Work","Cooperate","Traditional","Event","Travel","Formal","Workout"]
const clothingLabelOptions = ["Blouse","Shirt","Skirt","Dress","Gown","Trousers","Jeans","Kimono","Boubou","Jacket","Top","Shoes","Accessory","Other"]
const navTabs = [
  { key:"insight", label:"Insight", path:"/insight", icon:"i-heroicons-chart-bar" },
  { key:"wardrobe", label:"Wardrobe", path:"/wardrobe", icon:"i-heroicons-swatch" },
  { key:"calendar", label:"Calendar", path:"/calendar", icon:"i-heroicons-calendar-days" }
] as const
const suggestionWindowOptions = [30, 60, 90, 120]
const categorySearchOptions = computed(() => ["All categories", ...categoryOptions])

function getTabFromPath(path: string): AppTab {
  if (path.startsWith("/insight")) {
    return"insight"
  }

  if (path.startsWith("/wardrobe")) {
    return"wardrobe"
  }

  return"calendar"
}

function goToTab(tab: AppTab) {
  return navigateTo(tab ==="calendar" ?"/calendar" :"/" + tab)
}

function selectDate(date: string) {
  selectedDate.value = date
}

function dateValueToString(value: DateValue) {
  const year = String(value.year)
  const month = String(value.month).padStart(2, "0")
  const day = String(value.day).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function entryForDateValue(value: DateValue) {
  return entriesByDate.value.get(dateValueToString(value))
}

function jumpToDate(date: string) {
  const [year, month] = date.split('-').map(Number)
  monthCursor.value = new Date(Date.UTC(year, month - 1, 1))
  selectedDate.value = date
}

function updateCalendarPlaceholder(value: DateValue) {
  monthCursor.value = new Date(Date.UTC(value.year, value.month - 1, 1))
}

function fillFormFromEntry(entry: DressEntry) {
  editingEntryId.value = entry.id
  form.date = entry.date
  form.title = entry.title
  form.color = entry.color || ''
  form.category = entry.category || 'Casual'
  form.notes = entry.notes || ''
  form.imageUrl = entry.imageUrl || ''
  form.clothingItemIds = entry.clothingItems?.map((item) => item.id) || []
}

function clearDressFields(date = form.date) {
  editingEntryId.value = null
  form.date = date
  form.title = ''
  form.color = ''
  form.category = 'Casual'
  form.notes = ''
  form.imageUrl = ''
  form.clothingItemIds = []
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

async function runSearch(kind:"date" |"month" |"year" |"text" |"category") {
  searching.value = true

  try {
    const query: Record<string, string> = {}

    if (kind ==="date") {
      query.date = searchDate.value
    } else if (kind ==="month") {
      query.month = searchMonth.value
    } else if (kind ==="year") {
      query.year = searchYear.value
    } else if (kind ==="text") {
      query.q = searchText.value
    } else if (kind ==="category" && searchCategory.value && searchCategory.value !=="All categories") {
      query.category = searchCategory.value
    }

    const results = await $fetch<DressEntry[]>("/api/dresses", { query })
    searchResults.value = results

    if (kind ==="date") {
      jumpToDate(searchDate.value)
      searchLabel.value = results.length ?"1 outfit found for" + searchDate.value :"No outfit found for" + searchDate.value
    } else if (kind ==="month") {
      const [year, month] = searchMonth.value.split("-").map(Number)
      monthCursor.value = new Date(Date.UTC(year, month - 1, 1))
      selectedDate.value = searchMonth.value +"-01"
      searchLabel.value = results.length +" outfit" + (results.length === 1 ?"" :"s") +" found for" + searchMonth.value
    } else if (kind ==="year") {
      const year = Number(searchYear.value)
      monthCursor.value = new Date(Date.UTC(year, 0, 1))
      selectedDate.value = searchYear.value +"-01-01"
      searchLabel.value = results.length +" outfit" + (results.length === 1 ?"" :"s") +" found in" + searchYear.value
    } else if (kind ==="text") {
      searchLabel.value = results.length +" outfit" + (results.length === 1 ?"" :"s") +" matching" + searchText.value
    } else {
      searchLabel.value = results.length +" outfit" + (results.length === 1 ?"" :"s") +" in" + searchCategory.value
    }
  } finally {
    searching.value = false
  }
}

function clearSearch() {
  searchResults.value = []
  searchLabel.value =""
}

function openSearchResult(entry: DressEntry) {
  navigateTo("/calendar")
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

async function saveDress() {
  saveError.value =""
  saveLoading.value = true

  try {
    const saved = await $fetch<DressEntry>("/api/dresses", {
      method:"POST",
      body: {
        ...form,
        id: editingEntryId.value
      }
    })

    keepFormOnDateChange.value = true
    editingEntryId.value = saved.id
    selectedDate.value = saved.date
    fillFormFromEntry(saved)
    toast.add({ title:"Dress saved", color:"green" })
    await refresh()
    await refreshStats()
    await nextTick()
    keepFormOnDateChange.value = false
  } catch (error: any) {
    saveError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not save this outfit."
  } finally {
    saveLoading.value = false
  }
}

function requestDeleteDress() {
  const id = selectedEntry.value?.id || editingEntryId.value
  if (!id) {
    return
  }

  dressPendingDelete.value = {
    id,
    date: form.date,
    title: form.title || selectedEntry.value?.title ||"this outfit",
    category: form.category || selectedEntry.value?.category ||"Uncategorized",
    imageUrl: form.imageUrl || selectedEntry.value?.imageUrl ||""
  }
  dressDeleteConfirmOpen.value = true
}

async function confirmDeleteDress() {
  const item = dressPendingDelete.value
  if (!item) {
    return
  }

  deleteLoading.value = true
  try {
    await $fetch("/api/dresses/" + item.id, { method:"DELETE" })
    toast.add({ title:"Dress removed", color:"gray" })
    editingEntryId.value = null
    form.title =""
    form.color =""
    form.category ="Casual"
    form.notes =""
    form.imageUrl =""
    form.clothingItemIds = []
    await refresh()
    await refreshStats()
    dressDeleteConfirmOpen.value = false
    dressPendingDelete.value = null
  } finally {
    deleteLoading.value = false
  }
}

async function suggestDress() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    return
  }

  suggestionError.value =""
  suggestionLoading.value = true

  try {
    const result = await $fetch<{ suggestions: DressSuggestion[] }>("/api/suggestions", {
      query: {
        date: form.date,
        windowDays: suggestionWindowDays.value
      }
    })

    suggestionResults.value = result.suggestions

    if (result.suggestions[0]) {
      applySuggestion(result.suggestions[0].entry)
      toast.add({ title:"Suggested an outfit", color:"green" })
    } else {
      suggestionError.value ="No suggestion found outside the selected repeat window."
    }
  } catch (error: any) {
    suggestionError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not suggest an outfit."
  } finally {
    suggestionLoading.value = false
  }
}

function applySuggestion(entry: DressEntry) {
  form.title = entry.title
  form.color = entry.color ||""
  form.category = entry.category ||"Casual"
  form.notes = entry.notes ||""
  form.imageUrl = entry.imageUrl ||""
  form.clothingItemIds = entry.clothingItems?.map((item) => item.id) || []
}

function clearSuggestions() {
  suggestionResults.value = []
  suggestionError.value =""
}

async function loadOutfitHistory() {
  if (!form.title.trim()) {
    return
  }

  historyLoading.value = true
  try {
    historyResult.value = await $fetch<{ title: string, count: number, entries: DressEntry[] }>("/api/outfits/history", {
      query: { title: form.title }
    })
  } finally {
    historyLoading.value = false
  }
}

async function normalizeCategories() {
  normalizingCategories.value = true
  try {
    const result = await $fetch<{ updated: number }>("/api/categories/normalize", { method:"POST" })
    toast.add({ title:"Updated" + result.updated +" categories", color:"green" })
    await refresh()
    await refreshStats()
  } finally {
    normalizingCategories.value = false
  }
}

async function createClothingItem(attachToCurrentOutfit = true) {
  clothingError.value =""
  clothingSaveLoading.value = true

  try {
    const isEditing = Boolean(editingClothingItemId.value)
    const item = await $fetch<ClothingItem>(isEditing ?"/api/clothes/" + editingClothingItemId.value :"/api/clothes", {
      method: isEditing ?"PUT" :"POST",
      body: clothingForm
    })

    if (!isEditing && attachToCurrentOutfit) {
      form.clothingItemIds = [...form.clothingItemIds, item.id]
    }
    clearClothingForm()
    toast.add({ title: isEditing ?"Clothing item updated" :"Clothing item added", color:"green" })
    await refreshClothingItems()
    await refresh()
  } catch (error: any) {
    clothingError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not save this clothing item."
  } finally {
    clothingSaveLoading.value = false
  }
}

function normalizeClothingLabel(label: string) {
  const normalized = label.trim().toLowerCase()
  return clothingLabelOptions.find((option) => option.toLowerCase() === normalized) ||""
}

function clothingNameFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/,"")
    .replace(/[_-]+/g,"")
    .replace(/\s+/g,"")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function uploadBatchClothingImages(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) {
    return
  }

  batchClothesError.value =""
  batchClothesUploadLoading.value = true

  try {
    const uploaded: BatchClothingDraft[] = []

    for (const file of files) {
      const body = new FormData()
      body.append("file", file)
      const result = await $fetch<{ imageUrl: string }>("/api/clothes/upload", {
        method:"POST",
        body
      })
      uploaded.push({
        name: clothingNameFromFileName(file.name) ||"New clothing piece",
        label:"Dress",
        color:"",
        imageUrl: result.imageUrl,
        notes:""
      })
    }

    batchImageDrafts.value = [...batchImageDrafts.value, ...uploaded]
    toast.add({ title:"Uploaded" + uploaded.length +" images", color:"green" })
  } catch (error: any) {
    batchClothesError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not upload these images."
  } finally {
    batchClothesUploadLoading.value = false
    input.value =""
  }
}

function removeBatchImageDraft(index: number) {
  batchImageDrafts.value.splice(index, 1)
}

async function importBatchClothingItems() {
  const items = validBatchClothes.value
  if (!items.length) {
    return
  }

  batchClothesError.value =""
  batchClothesLoading.value = true

  try {
    const result = await $fetch<{ count: number, skipped: Array<{ index: number, reason: string }> }>("/api/clothes/batch", {
      method:"POST",
      body: { items }
    })
    toast.add({ title:"Imported" + result.count +" clothing pieces", color:"green" })
    batchClothesOpen.value = false
    batchImageDrafts.value = []
    await refreshClothingItems()
    await refresh()
  } catch (error: any) {
    batchClothesError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not import these clothing pieces."
  } finally {
    batchClothesLoading.value = false
  }
}

function clearClothingForm() {
  editingClothingItemId.value = null
  clothingForm.name =""
  clothingForm.label ="Dress"
  clothingForm.color =""
  clothingForm.imageUrl =""
  clothingForm.notes =""
}

function editClothingItem(item: ClothingItem) {
  clothingError.value =""
  editingClothingItemId.value = item.id
  clothingForm.name = item.name
  clothingForm.label = item.label
  clothingForm.color = item.color ||""
  clothingForm.imageUrl = item.imageUrl ||""
  clothingForm.notes = item.notes ||""
  showAddClothesForm.value = true
}

function requestDeleteClothingItem(item: ClothingItem) {
  clothingError.value =""
  clothingItemPendingDelete.value = item
  clothingDeleteConfirmOpen.value = true
}

async function confirmDeleteClothingItem() {
  const item = clothingItemPendingDelete.value
  if (!item) {
    return
  }

  clothingError.value =""
  clothingDeleteLoading.value = true

  try {
    await $fetch("/api/clothes/" + item.id, { method:"DELETE" })
    form.clothingItemIds = form.clothingItemIds.filter((id) => id !== item.id)
    if (editingClothingItemId.value === item.id) {
      clearClothingForm()
    }
    toast.add({ title:"Clothing item deleted", color:"gray" })
    await refreshClothingItems()
    await refresh()
    clothingDeleteConfirmOpen.value = false
    clothingItemPendingDelete.value = null
  } catch (error: any) {
    clothingError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not delete this clothing item."
  } finally {
    clothingDeleteLoading.value = false
  }
}

async function deleteEditingClothingItem() {
  const item = (clothingItems.value || []).find((clothingItem) => clothingItem.id === editingClothingItemId.value)
  if (!item) {
    return
  }

  requestDeleteClothingItem(item)
}

async function uploadClothingImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  clothingError.value =""
  clothingUploadLoading.value = true

  try {
    const body = new FormData()
    body.append("file", file)
    const result = await $fetch<{ imageUrl: string }>("/api/clothes/upload", {
      method:"POST",
      body
    })
    clothingForm.imageUrl = result.imageUrl
  } catch (error: any) {
    clothingError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not upload this image."
  } finally {
    clothingUploadLoading.value = false
    input.value =""
  }
}


async function previewImportEntries() {
  importError.value =""
  importPreviewLoading.value = true

  try {
    importPreview.value = await $fetch<ImportPreviewResult>("/api/import/preview", {
      method:"POST",
      body: {
        text: importText.value,
        year: importYear.value
      }
    })
  } catch (error: any) {
    importError.value = error?.statusMessage || error?.data?.statusMessage ||"Could not preview these entries."
  } finally {
    importPreviewLoading.value = false
  }
}

function clearImportPreview() {
  importPreview.value = null
  importError.value =""
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

    toast.add({ title:"Imported" + result.count +" entries", color:"green" })
    importOpen.value = false
    importText.value =""
    importPreview.value = null
    await refresh()
    await refreshStats()
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
  <header class="app-page-header">
        <div>
          <p class="app-eyebrow">
            Wardrobe planner
          </p>
          <h1 class="app-title">
            Dress Calendar
          </h1>
          <p class="app-subtitle">
            Plan outfits, manage clothing pieces, and review what you wear over time.
          </p>
        </div>

        <nav class="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
          <UNavigationMenu :items="navigationItems" variant="pill" />

          <UButton
            icon="i-heroicons-magnifying-glass"
            :aria-label="searchOpen ? 'Hide search filters' : 'Show search filters'"
            :variant="searchOpen ? 'solid' : 'outline'"
            @click="searchOpen = !searchOpen"
          />
          <UButton icon="i-heroicons-arrow-down-tray" @click="importOpen = true">
            Import
          </UButton>
        </nav>
      </header>

      <section v-if="searchOpen" class="app-panel app-panel-pad">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(260px,0.75fr)] lg:items-end">
          <UFormField label="Find exact date">
            <div class="flex gap-2">
              <UInput v-model="searchDate" type="date" class="min-w-0 flex-1" @keyup.enter="runSearch('date')" @blur="runSearch('date')" />
              <UButton icon="i-heroicons-magnifying-glass" :loading="searching" @click="runSearch('date')">
                Search date
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Find month">
            <div class="flex gap-2">
              <UInput v-model="searchMonth" type="month" class="min-w-0 flex-1" @keyup.enter="runSearch('month')" @blur="runSearch('month')" />
              <UButton icon="i-heroicons-calendar-days" :loading="searching" @click="runSearch('month')">
                Search month
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Find year">
            <div class="flex gap-2">
              <UInput v-model="searchYear" type="number" min="1900" max="2100" class="min-w-24 flex-1" @keyup.enter="runSearch('year')" @blur="runSearch('year')" />
              <UButton icon="i-heroicons-calendar" :loading="searching" @click="runSearch('year')">
                Search year
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Find outfit">
            <div class="flex gap-2">
              <UInput v-model="searchText" placeholder="blue gown" class="min-w-0 flex-1" @keyup.enter="runSearch('text')" @blur="searchText.trim() && runSearch('text')" />
              <UButton icon="i-heroicons-magnifying-glass" :loading="searching" :disabled="!searchText.trim()" @click="runSearch('text')">
                Search outfit
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Find category">
            <div class="flex gap-2">
              <USelectMenu v-model="searchCategory" :items="categorySearchOptions" class="min-w-0 flex-1" placeholder="All categories" @blur="searchCategory && searchCategory !== 'All categories' && runSearch('category')" />
              <UButton icon="i-heroicons-tag" :loading="searching" :disabled="!searchCategory || searchCategory === 'All categories'" @click="runSearch('category')">
                Search category
              </UButton>
            </div>
          </UFormField>
        </div>

        <div v-if="searchLabel" class="mt-4 border-t border-default pt-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-sm font-medium">
              {{ searchLabel }}
            </p>
            <UButton v-if="searchResults.length" variant="outline" size="xs" @click="clearSearch">
              Clear
            </UButton>
          </div>

          <div v-if="searchResults.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="entry in searchResults"
              :key="entry.id"
              type="button"
              class="app-clickable p-3 text-left transition"
              @click="openSearchResult(entry)"
            >
              <span class="block text-xs font-semibold">{{ entry.date }}</span>
              <span class="mt-1 block text-sm font-medium">{{ entry.title }}</span>
            </button>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'insight'" class="app-panel overflow-hidden">
        <div class="border-b border-default px-4 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide">Insights</p>
              <h2 class="mt-1 text-xl font-semibold">Wardrobe stats</h2>
            </div>
            <UButton variant="outline" size="xs" icon="i-heroicons-sparkles" :loading="normalizingCategories" :disabled="!stats?.uncategorized" @click="normalizeCategories">
              Classify uncategorized
            </UButton>
          </div>
        </div>

        <div class="p-4">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="app-card p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-wide">Entries</p>
                <UIcon name="i-heroicons-calendar-days" class="h-5 w-5" />
              </div>
              <p class="mt-3 text-3xl font-semibold">{{ stats?.totalEntries || 0 }}</p>
              <p class="mt-1 text-sm">Saved outfit days</p>
            </div>

            <div class="app-card p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-wide">Unique outfits</p>
                <UIcon name="i-heroicons-swatch" class="h-5 w-5" />
              </div>
              <p class="mt-3 text-3xl font-semibold">{{ stats?.uniqueOutfits || 0 }}</p>
              <p class="mt-1 text-sm">Distinct outfit names</p>
            </div>

            <div class="app-card p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-wide">This year</p>
                <UIcon name="i-heroicons-chart-bar" class="h-5 w-5" />
              </div>
              <p class="mt-3 text-3xl font-semibold">{{ stats?.wornThisYear || 0 }}</p>
              <p class="mt-1 text-sm">Entries in the current year</p>
            </div>

            <div class="app-card p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-wide">Uncategorized</p>
                <UIcon name="i-heroicons-tag" class="h-5 w-5" />
              </div>
              <p class="mt-3 text-3xl font-semibold">{{ stats?.uncategorized || 0 }}</p>
              <p class="mt-1 text-sm">Ready for cleanup</p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-3">
            <div class="app-card p-4">
              <div class="mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-trending-up" class="h-5 w-5" />
                <p class="text-sm font-semibold">Most worn</p>
              </div>
              <div class="space-y-2">
                <div v-for="item in stats?.mostWorn" :key="item.title" class="app-clickable px-3 py-2">
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm font-medium">{{ item.title }}</p>
                    <UBadge variant="soft">{{ item.count }}</UBadge>
                  </div>
                  <p class="mt-1 text-xs">Last worn {{ item.lastWorn }}</p>
                </div>
              </div>
            </div>

            <div class="app-card p-4">
              <div class="mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-squares-2x2" class="h-5 w-5" />
                <p class="text-sm font-semibold">Categories</p>
              </div>
              <div class="space-y-2">
                <div v-for="item in stats?.categories" :key="item.category" class="app-clickable flex items-center justify-between px-3 py-2">
                  <span class="text-sm font-medium">{{ item.category }}</span>
                  <UBadge color="neutral" variant="soft">{{ item.count }}</UBadge>
                </div>
              </div>
            </div>

            <div class="app-card p-4">
              <div class="mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-archive-box" class="h-5 w-5" />
                <p class="text-sm font-semibold">Not worn this year</p>
              </div>
              <div class="space-y-2">
                <div v-for="item in stats?.notWornThisYear" :key="item.title" class="app-clickable px-3 py-2">
                  <p class="text-sm font-medium">{{ item.title }}</p>
                  <p class="mt-1 text-xs">Last worn {{ item.lastWorn }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="activeTab === 'wardrobe'" class="grid gap-6" :class="showAddClothesForm ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : 'lg:grid-cols-1'">
        <section class="app-panel app-panel-pad">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide">Wardrobe</p>
              <h2 class="mt-1 text-xl font-semibold">Clothing pieces</h2>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                v-if="!showAddClothesForm"
                type="button"
                icon="i-heroicons-plus"
                @click="clearClothingForm(); showAddClothesForm = true"
              >
                Add clothes
              </UButton>
              <UButton
                type="button"
                variant="outline"
                icon="i-heroicons-photo"
                @click="batchClothesOpen = true"
              >
                Batch upload
              </UButton>
              <URadioGroup
                v-model="wardrobeViewMode"
                :items="wardrobeViewOptions"
                variant="card"
                orientation="horizontal"
                aria-label="Wardrobe view mode"
              />
              <UBadge color="neutral" variant="soft">{{ clothingItems?.length || 0 }} item{{ (clothingItems?.length || 0) === 1 ? '' : 's' }}</UBadge>
            </div>
          </div>

          <div v-if="clothingItems?.length && wardrobeViewMode === 'grid'" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="item in clothingItems"
              :key="item.id"
              class="app-card overflow-hidden transition"
            >
              <button type="button" class="block w-full cursor-pointer text-left" @click="editClothingItem(item)">
                <div class="app-media flex aspect-square items-center justify-center rounded-none">
                  <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="h-full w-full object-cover">
                  <span v-else class="px-3 text-center text-sm font-medium">No image</span>
                </div>
                <div class="p-3">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="min-w-0 truncate text-sm font-semibold">{{ item.name }}</h3>
                    <UBadge variant="soft">{{ item.label }}</UBadge>
                  </div>
                  <p v-if="item.color" class="mt-1 text-xs">{{ item.color }}</p>
                  <p v-if="item.notes" class="mt-2 line-clamp-2 text-xs">{{ item.notes }}</p>
                </div>
              </button>
            </article>
          </div>

          <div v-else-if="clothingItems?.length" class="app-card overflow-hidden">
            <article
              v-for="item in clothingItems"
              :key="item.id"
            >
              <button type="button" class="flex w-full cursor-pointer items-center gap-3 border-b border-default p-3 text-left last:border-b-0 hover:bg-muted" @click="editClothingItem(item)">
                <div class="app-media h-16 w-16 shrink-0">
                  <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="h-full w-full object-cover">
                  <span v-else class="flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium">No image</span>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="min-w-0 truncate text-sm font-semibold">{{ item.name }}</h3>
                  <p class="mt-1 text-xs font-medium">{{ item.label }}</p>
                  <p v-if="item.color" class="mt-1 text-xs">{{ item.color }}</p>
                  <p v-if="item.notes" class="mt-1 line-clamp-1 text-xs">{{ item.notes }}</p>
                </div>
              </button>
            </article>
          </div>

          <div v-else class="app-card p-6 text-center">
            <p class="text-sm font-medium">No clothing pieces yet</p>
            <p class="mt-1 text-sm">Open the Add clothes form, then pair pieces into outfit plans.</p>
          </div>
        </section>

        <aside v-if="showAddClothesForm" class="app-panel app-panel-pad">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">{{ editingClothingItemId ?"Edit clothes" :"Add clothes" }}</h2>
            <UButton
              type="button"
              variant="outline"
              square
              icon="i-heroicons-x-mark"
              aria-label="Close add clothes form"
              @click="showAddClothesForm = false; clearClothingForm()"
            />
          </div>

          <UAlert v-if="clothingError" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="clothingError" class="mb-4" />

          <div class="space-y-4">
            <div class="block overflow-hidden transition">
              <div class="app-media relative flex aspect-square items-center justify-center">
                <img v-if="clothingForm.imageUrl" :src="clothingForm.imageUrl" alt="" class="h-full w-full object-cover">
                <span v-else class="px-3 text-center text-sm font-medium">
                  {{ clothingUploadLoading ?"Uploading..." :"Click to add image" }}
                </span>
                <span v-if="clothingForm.imageUrl" class="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-medium shadow-sm">
                  {{ clothingUploadLoading ?"Uploading..." :"Change image" }}
                </span>
              </div>
              <UFileUpload
                class="mt-3"
                accept="image/*"
                icon="i-heroicons-photo"
                label="Upload clothing image"
                description="PNG, JPG, or WEBP"
                :disabled="clothingUploadLoading"
                @change="uploadClothingImage"
              />
            </div>

            <UFormField label="Name">
              <UInput v-model="clothingForm.name" placeholder="Yellow Ankara top" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <UFormField label="Label">
                <USelectMenu v-model="clothingForm.label" :items="clothingLabelOptions" class="w-full" />
              </UFormField>
              <UFormField label="Color">
                <UInput v-model="clothingForm.color" placeholder="Yellow" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Notes">
              <UTextarea v-model="clothingForm.notes" :rows="3" placeholder="Fabric, fit, occasion" class="w-full" />
            </UFormField>

            <UButton type="button" icon="i-heroicons-plus" class="w-full justify-center" :loading="clothingSaveLoading" :disabled="!clothingForm.name.trim()" @click="createClothingItem(false)">
              {{ editingClothingItemId ?"Save changes" :"Add clothes" }}
            </UButton>
            <UButton
              v-if="editingClothingItemId"
              type="button"
              icon="i-heroicons-trash"
              class="w-full justify-center"
              :loading="clothingDeleteLoading"
              @click="deleteEditingClothingItem"
            >
              Delete clothes
            </UButton>
          </div>
        </aside>
      </div>

      <div v-if="activeTab === 'calendar'" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section class="app-panel app-panel-pad">
          <UCalendar
            v-model="calendarDate"
            :month-controls="true"
            :year-controls="true"
            size="xl"
            class="w-full"
            @update:placeholder="updateCalendarPlaceholder"
          >
            <template #day="{ day }">
              <div class="min-h-20 w-full min-w-0 p-1 text-left sm:min-h-24">
                <span class="block text-sm font-semibold">{{ day.day }}</span>
                <template v-if="entryForDateValue(day)">
                  <span class="mt-2 block max-w-24 truncate text-xs font-semibold sm:max-w-32">
                    {{ entryForDateValue(day)?.title }}
                  </span>
                  <UBadge size="xs" variant="soft" class="mt-1 max-w-24 truncate sm:max-w-32">
                    {{ entryForDateValue(day)?.category || 'Planned' }}
                  </UBadge>
                </template>
              </div>
            </template>
          </UCalendar>
        </section>

        <aside class="app-panel app-panel-pad">
          <div class="mb-4">
            <p class="text-sm font-medium">
              {{ selectedDate }}
            </p>
            <h2 class="text-2xl font-semibold">
              {{ selectedEntry ? 'Edit outfit' : 'Plan outfit' }}
            </h2>
          </div>

          <UStepper :items="outfitStepperItems" :model-value="selectedClothingItems.length ? 2 : 1" size="xs" class="mb-5" />

          <UForm :state="form" class="space-y-4" @submit="saveDress">
            <UFormField label="Date" name="date">
              <UInput v-model="form.date" type="date" @change="handleFormDateChange" />
            </UFormField>

            <UFormField label="Dress" name="title" required>
              <div class="flex gap-2">
                <UInput v-model="form.title" placeholder="Blue midi dress with white sandals" class="min-w-0 flex-1" />
                <USelect v-model="suggestionWindowDays" :items="suggestionWindowOptions" class="w-28" />
                <UButton type="button" variant="outline" icon="i-heroicons-sparkles" :loading="suggestionLoading" @click="suggestDress">
                  Suggest
                </UButton>
              </div>
            </UFormField>

            <UAlert
              v-if="suggestionError"
              color="warning"
              variant="soft"
              icon="i-heroicons-light-bulb"
              :title="suggestionError"
            />

            <div v-if="suggestionResults.length" class="app-card space-y-2 p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold">
                  Suggestions for {{ form.date }}
                </p>
                <UButton type="button" variant="outline" size="xs" icon="i-heroicons-x-mark" @click="clearSuggestions">
                  Clear
                </UButton>
              </div>
              <button
                v-for="suggestion in suggestionResults"
                :key="suggestion.entry.id"
                type="button"
                class="app-clickable w-full p-3 text-left transition"
                @click="applySuggestion(suggestion.entry)"
              >
                <span class="block text-sm font-semibold">{{ suggestion.entry.title }}</span>
                <span class="mt-1 block text-xs">
                  Last worn {{ suggestion.lastWornDate }} · {{ suggestion.reasons.join(" -") }}
                </span>
              </button>
            </div>

            <div class="flex gap-2">
              <UButton type="button" variant="outline" icon="i-heroicons-clock" :loading="historyLoading" :disabled="!form.title.trim()" @click="loadOutfitHistory">
                Outfit history
              </UButton>
              <UButton v-if="historyResult" type="button" variant="outline" icon="i-heroicons-x-mark" @click="historyResult = null">
                Clear history
              </UButton>
            </div>

            <div v-if="historyResult" class="app-card p-3">
              <p class="text-sm font-semibold">
                {{ historyResult.title }} worn {{ historyResult.count }} time{{ historyResult.count === 1 ?"" :"s" }}
              </p>
              <div class="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
                <button
                  v-for="entry in historyResult.entries"
                  :key="entry.id"
                  type="button"
                  class="block w-full rounded px-2 py-1 text-left hover:bg-muted"
                  @click="openSearchResult(entry)"
                >
                  {{ entry.date }} - {{ entry.category ||"Uncategorized" }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Color" name="color">
                <UInput v-model="form.color" placeholder="Blue" />
              </UFormField>

              <UFormField label="Category" name="category">
                <USelectMenu v-model="form.category" :items="categoryOptions" />
              </UFormField>
            </div>

            <UFormField label="Image URL" name="imageUrl">
              <UInput v-model="form.imageUrl" placeholder="https://..." />
            </UFormField>

            <section class="app-card space-y-3 p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold">Clothing pieces</h3>
                  <p class="text-xs">Optional pieces that make up this outfit.</p>
                </div>
                <UBadge color="neutral" variant="soft">{{ selectedClothingItems.length }} selected</UBadge>
              </div>

              <div v-if="selectedClothingItems.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div
                  v-for="item in selectedClothingItems"
                  :key="item.id"
                  class="app-card overflow-hidden"
                >
                  <div class="app-media flex aspect-square items-center justify-center rounded-none">
                    <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="h-full w-full object-cover">
                    <span v-else class="px-2 text-center text-xs font-medium">No image</span>
                  </div>
                  <div class="p-2">
                    <p class="truncate text-xs font-semibold">{{ item.name }}</p>
                    <p class="truncate text-xs">{{ item.label }}</p>
                  </div>
                </div>
              </div>

              <UCheckboxGroup
                v-if="clothingItems?.length"
                v-model="form.clothingItemIds"
                :items="clothingCheckboxItems"
                variant="card"
                class="max-h-44 overflow-auto"
              />

              <UAlert v-if="clothingError" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="clothingError" />

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <UFormField label="Piece name">
                  <UInput v-model="clothingForm.name" placeholder="Yellow Ankara top" />
                </UFormField>
                <UFormField label="Piece label">
                  <USelectMenu v-model="clothingForm.label" :items="clothingLabelOptions" />
                </UFormField>
                <UFormField label="Piece color">
                  <UInput v-model="clothingForm.color" placeholder="Yellow" />
                </UFormField>
                <UFormField label="Piece image URL">
                  <UInput v-model="clothingForm.imageUrl" placeholder="https://..." />
                </UFormField>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <UFileUpload
                  accept="image/*"
                  variant="button"
                  icon="i-heroicons-photo"
                  label="Upload image"
                  :disabled="clothingUploadLoading"
                  @change="uploadClothingImage"
                />
                <UButton type="button" variant="outline" icon="i-heroicons-plus" :loading="clothingSaveLoading" :disabled="!clothingForm.name.trim()" @click="createClothingItem">
                  Add piece
                </UButton>
              </div>
            </section>

            <UFormField label="Notes" name="notes">
              <UTextarea v-model="form.notes" :rows="4" placeholder="Accessories, shoes, reminders" />
            </UFormField>

            <div v-if="form.imageUrl" class="app-media">
              <img :src="form.imageUrl" alt="" class="aspect-[4/3] w-full object-cover">
            </div>

            <UAlert v-if="saveError" color="error" variant="soft" icon="i-heroicons-exclamation-triangle" :title="saveError" />

            <div class="flex gap-2">
              <UButton type="submit" icon="i-heroicons-check" :loading="saveLoading">
                Save
              </UButton>
              <UButton v-if="selectedEntry || editingEntryId" type="button" variant="outline" icon="i-heroicons-trash" :loading="deleteLoading" @click="requestDeleteDress">
                Delete
              </UButton>
            </div>
          </UForm>
        </aside>
      </div>

    <UModal
      v-model:open="batchClothesOpen"
      title="Batch upload clothes"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="batchClothesError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="batchClothesError"
          />

          <UFileUpload
            accept="image/*"
            multiple
            layout="grid"
            icon="i-heroicons-photo"
            :label="batchClothesUploadLoading ? 'Uploading images...' : 'Choose multiple images'"
            description="Create editable clothing-piece drafts from image files."
            :disabled="batchClothesUploadLoading"
            @change="uploadBatchClothingImages"
          />

          <div v-if="batchImageDrafts.length" class="space-y-3">
            <div
              v-for="(draft, index) in batchImageDrafts"
              :key="draft.imageUrl"
              class="app-card grid gap-3 p-3 sm:grid-cols-[96px_minmax(0,1fr)]"
            >
              <div class="app-media">
                <img :src="draft.imageUrl" alt="" class="aspect-square h-full w-full object-cover">
              </div>
              <div class="space-y-3">
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <UFormField label="Name">
                    <UInput v-model="draft.name" class="w-full" />
                  </UFormField>
                  <UFormField label="Label">
                    <USelectMenu v-model="draft.label" :items="clothingLabelOptions" class="w-full" />
                  </UFormField>
                  <UFormField label="Color">
                    <UInput v-model="draft.color" class="w-full" />
                  </UFormField>
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <UFormField label="Notes">
                    <UInput v-model="draft.notes" class="w-full" />
                  </UFormField>
                  <div class="flex items-end">
                    <UButton type="button" variant="outline" icon="i-heroicons-x-mark" @click="removeBatchImageDraft(index)">
                      Remove
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!batchImageDrafts.length" class="app-card p-3 text-sm">
            Select images to create editable clothing-piece drafts.
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" :disabled="batchClothesLoading" @click="batchClothesOpen = false">
            Cancel
          </UButton>
          <UButton
            type="button"
            icon="i-heroicons-arrow-up-tray"
            :loading="batchClothesLoading"
            :disabled="!validBatchClothes.length"
            @click="importBatchClothingItems"
          >
            Save {{ validBatchClothes.length }} pieces
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="importOpen"
      title="Import from Keep"
      description="Paste all three Google Keep notes here. Slash dates are read as DD/MM/YYYY, for example 08/12/2020 means 8 December 2020."
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="importError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="importError"
          />

          <UFormField label="Default year">
            <UInput v-model="importYear" type="number" />
          </UFormField>

          <UTextarea v-model="importText" :rows="10" placeholder="WFH — 13/05/2025&#10;Blue dress — 08/12/2020&#10;Black wrap dress — 12/05/2026" />

          <div v-if="importPreview" class="p-3 text-sm">
            <div class="mb-3 flex items-center justify-between gap-3">
              <p class="font-semibold">Import preview</p>
              <UButton variant="outline" size="xs" icon="i-heroicons-x-mark" @click="clearImportPreview">Clear</UButton>
            </div>
            <div class="grid gap-2 sm:grid-cols-3">
              <UBadge color="success">{{ importPreview.count }} importable</UBadge>
              <UBadge color="neutral">{{ importPreview.skippedCount }} skipped</UBadge>
              <UBadge color="error">{{ importPreview.invalidCount }} invalid</UBadge>
            </div>
            <div v-if="importPreview.entries.length" class="mt-3 max-h-32 overflow-auto">
              <p v-for="entry in importPreview.entries.slice(0, 8)" :key="entry.date + entry.title">
                {{ entry.date }} - {{ entry.title }}
              </p>
            </div>
            <div v-if="importPreview.invalid.length" class="mt-3 max-h-24 overflow-auto">
              <p v-for="item in importPreview.invalid.slice(0, 5)" :key="item.line">{{ item.line }} - {{ item.reason }}</p>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" icon="i-heroicons-eye" :loading="importPreviewLoading" :disabled="!importText.trim()" @click="previewImportEntries">
            Preview
          </UButton>
          <UButton variant="outline" :disabled="importing" @click="importOpen = false">
            Cancel
          </UButton>
          <UButton
           
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

    <UModal
      v-model:open="dressDeleteConfirmOpen"
      title="Delete outfit"
      description="Review this outfit before removing it from your calendar."
    >
      <template #body>
        <div class="space-y-4">
          <div class="overflow-hidden">
            <div v-if="dressPendingDelete?.imageUrl" class="aspect-[4/3]">
              <img :src="dressPendingDelete.imageUrl" alt="" class="h-full w-full object-cover">
            </div>
            <div class="p-3">
              <p class="text-sm font-semibold">
                {{ dressPendingDelete?.title ||"This outfit" }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <UBadge color="neutral" variant="soft">{{ dressPendingDelete?.date }}</UBadge>
                <UBadge variant="soft">{{ dressPendingDelete?.category }}</UBadge>
              </div>
            </div>
          </div>

          <div class="p-3">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 h-5 w-5 shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-semibold">
                  Delete this outfit?
                </p>
                <p class="mt-1 text-sm">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-center gap-2">
          <UButton
            type="button"
            icon="i-heroicons-trash"
            :loading="deleteLoading"
            @click="confirmDeleteDress"
          >
            Delete outfit
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="clothingDeleteConfirmOpen"
      title="Delete clothing piece"
      description="This will remove the piece from your wardrobe and from any saved outfits that use it."
    >
      <template #body>
        <div class="space-y-4">
          <div class="p-3">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 h-5 w-5 shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-semibold">
                  Delete {{ clothingItemPendingDelete?.name ||"this clothing piece" }}?
                </p>
                <p class="mt-1 text-sm">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-center gap-2">
          <UButton
            type="button"
            icon="i-heroicons-trash"
            :loading="clothingDeleteLoading"
            @click="confirmDeleteClothingItem"
          >
            Delete clothes
          </UButton>
        </div>
      </template>
    </UModal>

    <div v-if="pending" class="fixed bottom-4 right-4">
      <UBadge color="neutral">
        Loading
      </UBadge>
    </div>
</template>
