<script setup lang="ts">
import { parseDate, type DateValue } from "@internationalized/date"
import { CalendarIcon } from "@lucide/vue"
import { computed, reactive, ref, watch } from "vue"
import { toast as sonnerToast } from "vue-sonner"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import type { ClothingItem, DressEntry, OutfitPlan } from "~/types/dress"

definePageMeta({ middleware: "auth" })

interface PlanForm {
  date: string
  eventName: string
  prepNotes: string
  clothingItemIds: string[]
}

interface ClothingForm {
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

const route = useRoute()
const router = useRouter()
const toast = useToast()
const today = new Date().toISOString().slice(0, 10)
const routePlanId = computed(() => typeof route.query.id === "string" ? route.query.id : "")
const initialDate = computed(() => {
  const queryDate = typeof route.query.date === "string" ? route.query.date : ""
  return /^\d{4}-\d{2}-\d{2}$/.test(queryDate) && queryDate >= today ? queryDate : today
})

const form = reactive<PlanForm>({
  date: initialDate.value,
  eventName: "",
  prepNotes: "",
  clothingItemIds: []
})

const clothingForm = reactive<ClothingForm>({
  name: "",
  label: "Dress",
  color: "",
  imageUrl: "",
  notes: ""
})

const saveLoading = ref(false)
const saveError = ref("")
const savedPlan = ref<OutfitPlan | null>(null)
const clothingSaveLoading = ref(false)
const clothingError = ref("")
const suggestionLoading = ref(false)
const suggestionResults = ref<DressSuggestion[]>([])
const showAddPiece = ref(false)
const planDateOpen = ref(false)
const clothingLabelOptions = ["Blouse", "Shirt", "Skirt", "Dress", "Gown", "Trousers", "Jeans", "Kimono", "Boubou", "Jacket", "Top", "Shoes", "Accessory", "Other"]

const { data: clothingItems, refresh: refreshClothingItems } = await useFetch<ClothingItem[]>("/api/clothes", {
  default: () => []
})

const { data: existingPlan } = await useAsyncData<OutfitPlan | null>("outfit-plan", () => {
  return routePlanId.value ? $fetch<OutfitPlan>("/api/plans/" + routePlanId.value) : Promise.resolve(null)
}, {
  watch: [routePlanId],
  default: () => null
})

const { data: sameDayPlans, refresh: refreshSameDayPlans } = await useFetch<OutfitPlan[]>("/api/plans", {
  query: { date: computed(() => form.date) },
  watch: [() => form.date],
  default: () => []
})

const selectedClothingItems = computed(() => {
  const selectedIds = new Set(form.clothingItemIds)
  return (clothingItems.value || []).filter((item) => selectedIds.has(item.id))
})
const visibleSameDayPlans = computed(() =>
  (sameDayPlans.value || []).filter((plan) => plan.id !== routePlanId.value)
)
const isEditing = computed(() => Boolean(routePlanId.value))
const canSave = computed(() =>
  form.date >= today && form.eventName.trim().length > 0 && form.clothingItemIds.length > 0
)
const planDateValue = computed<DateValue | undefined>({
  get: () => /^\d{4}-\d{2}-\d{2}$/.test(form.date) ? parseDate(form.date) : undefined,
  set: (value) => {
    if (!value) {
      return
    }

    form.date = dateValueToString(value)
    planDateOpen.value = false
  }
})
const minimumPlanDate = computed(() => parseDate(today))
const planDateLabel = computed(() =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(form.date + "T00:00:00.000Z"))
)

watch(existingPlan, (plan) => {
  if (!plan) {
    return
  }

  savedPlan.value = plan
  form.date = plan.date
  form.eventName = plan.eventName
  form.prepNotes = plan.prepNotes || ""
  form.clothingItemIds = plan.clothingItems.map((item) => item.id)
}, { immediate: true })

watch([routePlanId, () => route.query.date], ([id]) => {
  if (id) {
    return
  }

  resetNewPlanForm()
}, { immediate: true })

watch(() => form.date, () => {
  suggestionResults.value = []
})

async function savePlan() {
  saveError.value = ""
  saveLoading.value = true

  try {
    const plan = await $fetch<OutfitPlan>("/api/plans", {
      method: "POST",
      body: {
        ...form,
        id: routePlanId.value || undefined
      }
    })

    savedPlan.value = plan
    toast.add({ title: isEditing.value ? "Outfit plan updated" : "Outfit plan saved", color: "green" })
    await refreshSameDayPlans()

    if (!routePlanId.value) {
      await router.replace({ path: "/plan", query: { id: plan.id, date: plan.date } })
    }
  } catch (error: any) {
    saveError.value = error?.statusMessage || error?.data?.statusMessage || "Could not save this outfit plan."
  } finally {
    saveLoading.value = false
  }
}

async function startAnotherPlan(date = form.date) {
  await navigateTo({ path: "/plan", query: { date } })
}

async function createClothingItem() {
  clothingError.value = ""
  clothingSaveLoading.value = true

  try {
    const item = await $fetch<ClothingItem>("/api/clothes", {
      method: "POST",
      body: clothingForm
    })

    form.clothingItemIds = [...new Set([...form.clothingItemIds, item.id])]
    clearClothingForm()
    showAddPiece.value = false
    toast.add({ title: "Clothing piece attached", color: "green" })
    await refreshClothingItems()
  } catch (error: any) {
    clothingError.value = error?.statusMessage || error?.data?.statusMessage || "Could not add this clothing piece."
  } finally {
    clothingSaveLoading.value = false
  }
}

async function suggestOutfit() {
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
      toast.add({ title: "Suggestion applied", color: "green" })
    } else {
      sonnerToast.info("No suggestion is available right now.", {
        description: "You can keep planning manually."
      })
    }
  } catch (error: any) {
    sonnerToast.info("Suggestions are unavailable.", {
      description: error?.statusMessage || error?.data?.statusMessage || "You can keep planning manually."
    })
  } finally {
    suggestionLoading.value = false
  }
}

function applySuggestion(entry: DressEntry) {
  const ids = entry.clothingItems?.map((item) => item.id) || []
  form.clothingItemIds = [...new Set([...form.clothingItemIds, ...ids])]
}

function toggleClothingItem(id: string) {
  if (form.clothingItemIds.includes(id)) {
    form.clothingItemIds = form.clothingItemIds.filter((itemId) => itemId !== id)
  } else {
    form.clothingItemIds = [...form.clothingItemIds, id]
  }
}

function clearClothingForm() {
  clothingForm.name = ""
  clothingForm.label = "Dress"
  clothingForm.color = ""
  clothingForm.imageUrl = ""
  clothingForm.notes = ""
}

function dateValueToString(value: DateValue) {
  const year = String(value.year)
  const month = String(value.month).padStart(2, "0")
  const day = String(value.day).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function resetNewPlanForm() {
  savedPlan.value = null
  form.date = initialDate.value
  form.eventName = ""
  form.prepNotes = ""
  form.clothingItemIds = []
  saveError.value = ""
  suggestionResults.value = []
}
</script>

<template>
  <header class="app-page-header">
    <div>
      <p class="app-eyebrow">Outfit planning</p>
      <h1 class="app-title">{{ isEditing ? "Edit planned outfit" : "Plan outfit" }}</h1>
      <p class="app-subtitle">
        Name the event, choose the date, and attach the wardrobe pieces you plan to wear.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button as-child variant="outline">
        <NuxtLink to="/insight">Insight</NuxtLink>
      </Button>
      <Button v-if="savedPlan" type="button" @click="startAnotherPlan(savedPlan.date)">
        Another outfit same day
      </Button>
    </div>
  </header>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <section class="app-panel app-panel-pad">
      <form class="grid gap-5" @submit.prevent="savePlan">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="plan-event">Event or occasion</Label>
            <Input id="plan-event" v-model="form.eventName" placeholder="Team presentation" />
          </div>

          <div class="grid gap-2">
            <Label for="plan-date">Date</Label>
            <Popover v-model:open="planDateOpen">
              <PopoverTrigger as-child>
                <Button
                  id="plan-date"
                  type="button"
                  variant="outline"
                  class="h-10 justify-start gap-2 px-3 text-left font-normal"
                >
                  <CalendarIcon class="h-4 w-4" aria-hidden="true" />
                  <span>{{ planDateLabel }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  v-model="planDateValue"
                  :min-value="minimumPlanDate"
                  layout="month-and-year"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div class="grid gap-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Outfit pieces</h2>
              <p class="text-sm text-muted">Select at least one piece from your wardrobe.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button type="button" variant="outline" :disabled="suggestionLoading" @click="suggestOutfit">
                {{ suggestionLoading ? "Checking" : "Suggest" }}
              </Button>
              <Button type="button" @click="showAddPiece = !showAddPiece">
                Add piece
              </Button>
            </div>
          </div>

          <div v-if="selectedClothingItems.length" class="grid gap-2 sm:grid-cols-2">
            <div v-for="item in selectedClothingItems" :key="item.id" class="app-card flex gap-3 p-3">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="h-14 w-14 rounded-md object-cover">
              <div v-else class="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted">
                {{ item.label.slice(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ item.name }}</p>
                <p class="text-xs text-muted">{{ [item.label, item.color].filter(Boolean).join(" - ") }}</p>
              </div>
            </div>
          </div>

          <div class="grid max-h-80 gap-2 overflow-auto rounded-lg border border-default p-2 sm:grid-cols-2">
            <button
              v-for="item in clothingItems"
              :key="item.id"
              type="button"
              class="app-clickable flex items-center gap-3 p-3 text-left"
              :class="form.clothingItemIds.includes(item.id) ? 'ring-2 ring-primary' : ''"
              @click="toggleClothingItem(item.id)"
            >
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="h-12 w-12 rounded-md object-cover">
              <span v-else class="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted">
                {{ item.label.slice(0, 2).toUpperCase() }}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold">{{ item.name }}</span>
                <span class="block text-xs text-muted">{{ item.label }}</span>
              </span>
            </button>

            <div v-if="!clothingItems?.length" class="p-3 text-sm text-muted">
              Add one text-only clothing piece to save this plan.
            </div>
          </div>
        </div>

        <section v-if="showAddPiece" class="app-card p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="new-piece-name">Piece name</Label>
              <Input id="new-piece-name" v-model="clothingForm.name" placeholder="Black trousers" />
            </div>
            <div class="grid gap-2">
              <Label for="new-piece-label">Type</Label>
              <NativeSelect id="new-piece-label" v-model="clothingForm.label">
                <NativeSelectOption v-for="label in clothingLabelOptions" :key="label" :value="label">{{ label }}</NativeSelectOption>
              </NativeSelect>
            </div>
            <div class="grid gap-2">
              <Label for="new-piece-color">Color</Label>
              <Input id="new-piece-color" v-model="clothingForm.color" placeholder="Black" />
            </div>
            <div class="grid gap-2">
              <Label for="new-piece-image">Image URL</Label>
              <Input id="new-piece-image" v-model="clothingForm.imageUrl" placeholder="https://..." />
            </div>
          </div>
          <div class="mt-3 grid gap-2">
            <Label for="new-piece-notes">Notes</Label>
            <Textarea id="new-piece-notes" v-model="clothingForm.notes" rows="2" placeholder="Fit, fabric, or care notes" />
          </div>
          <Alert v-if="clothingError" class="mt-3" variant="destructive">
            <AlertTitle>Could not add piece</AlertTitle>
            <AlertDescription>{{ clothingError }}</AlertDescription>
          </Alert>
          <div class="mt-3 flex justify-end">
            <Button type="button" :disabled="clothingSaveLoading || !clothingForm.name.trim()" @click="createClothingItem">
              {{ clothingSaveLoading ? "Adding" : "Add and attach" }}
            </Button>
          </div>
        </section>

        <details class="app-card p-4">
          <summary class="cursor-pointer text-sm font-semibold">Additional details</summary>
          <div class="mt-3 grid gap-2">
            <Label for="prep-notes">Prep notes</Label>
            <Textarea id="prep-notes" v-model="form.prepNotes" rows="4" placeholder="Accessories, ironing, shoes, washing, or weather reminders" />
          </div>
        </details>

        <Alert v-if="saveError" variant="destructive">
          <AlertTitle>Could not save plan</AlertTitle>
          <AlertDescription>{{ saveError }}</AlertDescription>
        </Alert>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <p class="text-sm text-muted">
            {{ form.clothingItemIds.length }} piece{{ form.clothingItemIds.length === 1 ? "" : "s" }} selected
          </p>
          <Button type="submit" :disabled="saveLoading || !canSave">
            {{ saveLoading ? "Saving" : isEditing ? "Update plan" : "Save plan" }}
          </Button>
        </div>
      </form>
    </section>

    <aside class="grid content-start gap-4">
      <section class="app-panel app-panel-pad">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">Same-day plans</h2>
          <Badge variant="secondary">{{ visibleSameDayPlans.length }}</Badge>
        </div>
        <div class="grid gap-2">
          <NuxtLink
            v-for="plan in visibleSameDayPlans"
            :key="plan.id"
            :to="{ path: '/plan', query: { id: plan.id, date: plan.date } }"
            class="app-clickable block p-3"
          >
            <p class="text-sm font-semibold">{{ plan.eventName }}</p>
            <p class="mt-1 text-xs text-muted">{{ plan.clothingItems.length }} piece{{ plan.clothingItems.length === 1 ? "" : "s" }}</p>
          </NuxtLink>
          <p v-if="!visibleSameDayPlans.length" class="text-sm text-muted">
            No other plans saved for {{ form.date }}.
          </p>
        </div>
      </section>

      <section class="app-panel app-panel-pad">
        <h2 class="text-lg font-semibold">Suggestions</h2>
        <div class="mt-3 grid gap-2">
          <button
            v-for="suggestion in suggestionResults"
            :key="suggestion.entry.id"
            type="button"
            class="app-clickable p-3 text-left"
            @click="applySuggestion(suggestion.entry)"
          >
            <p class="text-sm font-semibold">{{ suggestion.entry.title }}</p>
            <p class="mt-1 text-xs text-muted">Last worn {{ suggestion.lastWornDate }}</p>
          </button>
          <p v-if="!suggestionResults.length" class="text-sm text-muted">
            Suggestions are optional and will appear here when available.
          </p>
        </div>
      </section>
    </aside>
  </div>
</template>
