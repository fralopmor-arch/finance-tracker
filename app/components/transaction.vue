<template>
  <div
    class="grid grid-cols-2 py-4 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-1">
        <UIcon :name="icon" :class="iconColor" />
        <div>{{ transaction.description }}</div>
      </div>

      <div>
        <UBadge color="white" v-if="transaction.category">
          {{ transaction.category }}
        </UBadge>
      </div>
    </div>

    <div class="flex items-center justify-end space-x-2">
      <div>{{ currency }}</div>
      <div>
        <UDropdownMenu :items="items" :popper="popper">
          <UButton
            color="white"
            variant="ghost"
            trailing-icon="i-heroicons-ellipsis-horizontal"
            :loading="isLoading"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
const props = defineProps({
  transaction: Object,
});
const emit = defineEmits(["deleted"]);

const isLoading = ref(false);
const toast = useToast();
const supabase = useSupabaseClient();

// keep amount reactive for the composable
const amountRef = computed(() => props.transaction?.amount ?? 0);
const { currency } = useCurrency(amountRef);

const popper = { placement: "bottom-start" };

const isIncome = computed(() => props.transaction?.type === "Income");
const icon = computed(() =>
  isIncome.value ? "i-heroicons-arrow-up-right" : "i-heroicons-arrow-down-left"
);
const iconColor = computed(() =>
  isIncome.value ? "text-green-600" : "text-red-600"
);

const showToast = (payload) => {
  if (!toast) return;
  if (typeof toast.push === "function") return toast.push(payload);
  if (typeof toast.add === "function") return toast.add(payload);
  // no-op fallback
};

const deleteTransaction = async () => {
  const id = props.transaction?.id;
  if (!id) return;

  isLoading.value = true;
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;

    showToast({
      title: "Transaction deleted",
      icon: "i-heroicons-check-circle",
    });
    emit("deleted", id);
  } catch (err) {
    showToast({
      title: "Failed to delete transaction",
      icon: "i-heroicons-exclamation-circle",
    });
  } finally {
    isLoading.value = false;
  }
};

// FLATTENED list — UDropdownMenu expects an array of items (not nested arrays).
// Provide multiple handler names for different NuxtUI versions.
const items = [
  {
    label: "Edit",
    icon: "i-heroicons-pencil-square-20-solid",
    Click: () => console.log("Edit"),
    handler: () => console.log("Edit"),
  },
  {
    label: "Delete",
    icon: "i-heroicons-trash-20-solid",
    Click: deleteTransaction,
    handler: deleteTransaction,
  },
];
</script>
