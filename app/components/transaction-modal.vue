<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-black/50" @click="close" />
      <div class="relative w-full max-w-2xl mx-4">
        <UCard>
          <template #header>Transaction</template>

          <div class="p-4">
            <form @submit.prevent="save" class="space-y-4">
              <div>
                <label class="block text-sm mb-2">Transaction Type</label>
                <!-- render USelect only on client to avoid modal focus/teleport conflicts -->
                <select
                  v-model="state.type"
                  class="w-full rounded border p-2 bg-transparent"
                >
                  <option value="" disabled>Select the transaction type</option>
                  <option v-for="t in typeItems" :key="t" :value="t">
                    {{ t }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm mb-2">Amount</label>
                <UInput
                  v-model.number="state.amount"
                  type="number"
                  placeholder="Amount"
                />
              </div>

              <div>
                <label class="block text-sm mb-2">Transaction date</label>
                <UInput v-model="state.created_at" type="date" />
              </div>

              <div>
                <label class="block text-sm mb-2"
                  >Description
                  <span class="text-xs text-dimmed">(optional)</span></label
                >
                <UInput v-model="state.description" placeholder="Description" />
              </div>

              <div v-if="state.type === 'Expense'">
                <label class="block text-sm mb-2">Category</label>
                <select
                  v-model="state.category"
                  class="w-full rounded border p-2 bg-transparent"
                >
                  <option value="" disabled>Select a category</option>
                  <option v-for="c in categoryItems" :key="c" :value="c">
                    {{ c }}
                  </option>
                </select>
              </div>

              <div class="flex justify-end">
                <UButton
                  type="submit"
                  color="black"
                  variant="solid"
                  label="Save"
                />
              </div>
            </form>
          </div>
        </UCard>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { reactive, computed, onMounted, watch, ref } from "vue";
import { categories, types } from "~/constants";
import { z } from "zod";
import { useSupabaseClient, useToast } from "#imports"; // added

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(["update:modelValue", "save", "saved"]); // include 'saved'

const supabase = useSupabaseClient(); // added
const { toastAdd, toastError } = useAppToast(); // added
const isLoading = ref(false); // added

const initialState = {
  type: null,
  amount: null,
  created_at: new Date().toISOString().split("T")[0],
  description: "",
  category: null,
};

const state = reactive({ ...initialState });

const isOpen = computed({
  get: () => !!props.modelValue,
  set: (v) => {
    if (!v) Object.assign(state, initialState);
    emit("update:modelValue", v);
  },
});

const typeItems = computed(() => (Array.isArray(types) ? [...types] : []));
const categoryItems = computed(() =>
  Array.isArray(categories) ? [...categories] : []
);

const close = () => {
  isOpen.value = false;
};

const save = async () => {
  isLoading.value = true;
  try {
    // normalize payload
    const payload = {
      type: state.type,
      amount: state.amount !== null ? Number(state.amount) : state.amount,
      created_at: state.created_at || new Date().toISOString(),
      description: state.description,
      category: state.category,
    };

    const { data, error } = await supabase
      .from("transactions")
      .upsert([payload])
      .select()
      .single();

    if (error) throw error;

    toastAdd({ title: "Transaction saved" });

    // emit saved so parent can refresh
    emit("saved");
    // close modal
    isOpen.value = false;
    // optional emit more generic save event with returned row
    emit("save", data ?? payload);
    return;
  } catch (e) {
    toastError({
      title: "Transaction not saved",
      description: e?.message ?? String(e),
    });
    console.error("Save transaction error:", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  console.log("TransactionModal mounted — isOpen:", isOpen.value);
  console.log(
    "typeItems:",
    typeItems.value,
    "categoryItems:",
    categoryItems.value
  );
});

watch(
  () => state.type,
  (v) => {
    console.log("state.type raw ->", v);
  }
);
</script>
