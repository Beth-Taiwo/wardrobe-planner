<script setup lang="ts">
import {
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  ArrowRight,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Calendar,
  CalendarDays,
  ChartBar,
  Check,
  Clock,
  Cog,
  Eye,
  Globe,
  Key,
  Lock,
  Mail,
  Image,
  PanelsTopLeft,
  Plus,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  SwatchBook,
  Tag,
  Trash,
  User,
  UserPlus,
  X
} from "@lucide/vue"

const props = defineProps<{ name?: string }>()

const iconMap = {
  "i-lucide-shirt": Shirt,
  "i-heroicons-archive-box": Archive,
  "i-heroicons-arrow-down-tray": ArrowDownToLine,
  "i-heroicons-arrow-right": ArrowRight,
  "i-heroicons-arrow-right-on-rectangle": ArrowRightFromLine,
  "i-heroicons-arrow-trending-up": ArrowUpFromLine,
  "i-heroicons-arrow-up-tray": ArrowUpFromLine,
  "i-heroicons-calendar": Calendar,
  "i-heroicons-calendar-days": CalendarDays,
  "i-heroicons-chart-bar": ChartBar,
  "i-heroicons-check": Check,
  "i-heroicons-clock": Clock,
  "i-heroicons-cog-6-tooth": Cog,
  "i-heroicons-envelope": Mail,
  "i-heroicons-exclamation-triangle": AlertTriangle,
  "i-heroicons-eye": Eye,
  "i-heroicons-globe-alt": Globe,
  "i-heroicons-key": Key,
  "i-heroicons-light-bulb": Sparkles,
  "i-heroicons-lock-closed": Lock,
  "i-heroicons-magnifying-glass": Search,
  "i-heroicons-photo": Image,
  "i-heroicons-plus": Plus,
  "i-heroicons-shield-check": ShieldCheck,
  "i-heroicons-sparkles": Sparkles,
  "i-heroicons-squares-2x2": PanelsTopLeft,
  "i-heroicons-swatch": SwatchBook,
  "i-heroicons-tag": Tag,
  "i-heroicons-trash": Trash,
  "i-heroicons-user": User,
  "i-heroicons-user-plus": UserPlus,
  "i-heroicons-x-mark": X
} as const

const IconComponent = computed(() => props.name ? iconMap[props.name as keyof typeof iconMap] || Sparkles : Sparkles)
</script>

<template>
  <component :is="IconComponent" aria-hidden="true" />
</template>
