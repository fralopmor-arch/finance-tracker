<template>
  <div class="grid grid-cols-6 gap-8">
    <UNavigationMenu
      orientation="vertical"
      :items="items"
      class="col-span-2 data-[orientation=vertical]:w-48"
    />

    <div class="col-span-4">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const route = useRoute();

const rawItems = [
  { label: "General", to: "/settings" },
  { label: "Profile", to: "/settings/profile" },
  { label: "Avatar", to: "/settings/avatar" },
];

const items = computed(() =>
  rawItems.map((i) => ({ ...i, active: route.path === i.to }))
);
</script>
