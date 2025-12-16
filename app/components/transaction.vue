<template>
  <div
    class="grid grid-cols-3 py-4 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100"
  >
    <div class="flex items-center justify-between space-x-4 col-span-2">
      <div class="flex items-center space-x-1">
        <UIcon :name="icon" :class="[iconColor]" />
        <div>{{ transaction.description }}</div>
      </div>

      <div>
        <UBadge color="white" v-if="transaction.category">{{
          transaction.category
        }}</UBadge>
      </div>
    </div>

    <div class="flex items-center justify-end space-x-2">
      <div>{{ currency }}</div>
      <div>
        <UDropdownMenu :items="items" :popper="{ placement: 'bottom-start' }">
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
const props = defineProps({
  transaction: Object,
});
const emit = defineEmits(["deleted"]);
const isIncome = computed(() => props.transaction.type === "Income");
const icon = computed(() =>
  isIncome.value ? "i-heroicons-arrow-up-right" : "i-heroicons-arrow-down-left"
);
const iconColor = computed(() =>
  isIncome.value ? "text-green-600" : "text-red-600"
);

const { currency } = useCurrency(props.transaction.amount);

const isLoading = ref(false);
// use new simple toasts
const { toastError, toastDelete } = useAppToast();
const supabase = useSupabaseClient();

const deleteTransaction = async () => {
  isLoading.value = true;
  console.debug("deleteTransaction invoked", {
    id: props.transaction && props.transaction.id,
  });

  try {
    const { data, error } = await supabase
      .from("transactions")
      .delete()
      .select()
      .eq("id", props.transaction.id);

    console.debug("Supabase delete response", { data, error });

    if (error) {
      toastError({
        title: "Transaction was not deleted",
        description: error.message || String(error),
      });
      console.error(error);
    } else if (!data || (Array.isArray(data) && data.length === 0)) {
      toastError({
        title: "No transaction deleted",
        description:
          "The delete query did not remove any rows. Check permissions or id type.",
      });
      console.warn("Delete returned no rows", { data });
    } else {
      // red toast for delete
      toastDelete({ title: "Transaction deleted" });
      emit("deleted", props.transaction.id);
    }
  } catch (error) {
    toastError({
      title: "Transaction was not deleted",
      description: error.message || String(error),
    });
    console.error("Unexpected delete error", error);
  } finally {
    isLoading.value = false;
  }
};

const items = [
  [
    {
      label: "Edit",
      icon: "i-heroicons-pencil-square-20-solid",
      onClick: () => console.log("Edit"),
    },
    {
      label: "Delete",
      icon: "i-heroicons-trash-20-solid",
      onClick: deleteTransaction,
    },
  ],
];
</script>
