<template>
  <div>
    <div class="font-bold" :class="colorClass">{{ title }}</div>

    <div class="text-2xl font-extrabold text-black dark:text-white mb-2">
      <USkeleton class="h-8 w-full" v-if="loading" />
      <div v-else>{{ currency }}</div>
    </div>

    <div>
      <USkeleton class="h-6 w-full" v-if="loading" />
      <div v-else class="flex space-x-1 items-center text-sm">
        <UIcon :name="icon" class="w-6 h-6" :class="colorClass" />
        <div class="text-gray-500 dark:text-gray-400">
          {{ percentageTrend }} vs last period
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef } from "vue";
import { useCurrency } from "../composables/useCurrency";

const props = defineProps({
  title: String,
  amount: Number,
  lastAmount: Number,
  color: String,
  loading: Boolean,
});

const trendingUp = computed(() => props.amount >= props.lastAmount);
const icon = computed(() =>
  trendingUp.value
    ? "i-heroicons-arrow-trending-up"
    : "i-heroicons-arrow-trending-down"
);

const percentageTrend = computed(() => {
  if (!props.lastAmount || !props.amount) return "∞%";

  const bigger = Math.max(props.amount, props.lastAmount);
  const lower = Math.min(props.amount, props.lastAmount);

  const ratio = ((bigger - lower) / lower) * 100;
  const sign = trendingUp.value ? "" : "-";
  return `${sign}${Math.ceil(ratio)}%`;
});

const colorClass = computed(() => {
  if (props.color === "green") return "text-green-600 dark:text-green-400";
  if (props.color === "red") return "text-red-600 dark:text-red-400";
  return "";
});

// use composable: pass a ref to keep reactivity
const { currency } = useCurrency(toRef(props, "amount"));
</script>
