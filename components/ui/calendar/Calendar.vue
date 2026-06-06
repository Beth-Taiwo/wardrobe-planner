<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date"

interface CalendarDay {
  day: number
  month: number
  year: number
  toString: () => string
}

const props = defineProps<{ modelValue?: any }>()
const emit = defineEmits<{ "update:modelValue": [value: CalendarDate], "update:placeholder": [value: CalendarDate] }>()

const cursor = ref(props.modelValue || today(getLocalTimeZone()))

watch(() => props.modelValue, (value) => {
  if (value) {
    cursor.value = value
  }
})

const monthLabel = computed(() => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(Date.UTC(cursor.value.year, cursor.value.month - 1, 1))))

const days = computed<CalendarDay[]>(() => {
  const year = cursor.value.year
  const month = cursor.value.month
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: CalendarDay[] = []
  for (let i = 0; i < first; i++) {
    cells.push({ day: 0, month, year, toString: () => "" })
  }
  for (let day = 1; day <= total; day++) {
    cells.push({ day, month, year, toString: () => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` })
  }
  return cells
})

function moveMonth(delta: number) {
  const rawMonth = cursor.value.month + delta
  const year = cursor.value.year + Math.floor((rawMonth - 1) / 12)
  const month = ((rawMonth - 1 + 12) % 12) + 1
  cursor.value = new CalendarDate(year, month, 1)
  emit("update:placeholder", cursor.value)
}

function selectDay(day: CalendarDay) {
  if (!day.day) {
    return
  }
  const value = new CalendarDate(day.year, day.month, day.day)
  emit("update:modelValue", value)
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 flex items-center justify-between gap-3">
      <Button variant="outline" size="xs" @click="moveMonth(-1)">Previous</Button>
      <p class="text-sm font-semibold">{{ monthLabel }}</p>
      <Button variant="outline" size="xs" @click="moveMonth(1)">Next</Button>
    </div>
    <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
      <span>Sun</span>
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
    </div>
    <div class="mt-1 grid grid-cols-7 gap-1">
      <button
        v-for="(day, index) in days"
        :key="day.toString() || index"
        type="button"
        class="min-h-24 rounded-md border border-border bg-background text-left hover:bg-accent disabled:pointer-events-none disabled:bg-muted/50"
        :disabled="!day.day"
        @click="selectDay(day)"
      >
        <slot name="day" :day="day">
          <span class="p-2 text-sm">{{ day.day }}</span>
        </slot>
      </button>
    </div>
  </div>
</template>
