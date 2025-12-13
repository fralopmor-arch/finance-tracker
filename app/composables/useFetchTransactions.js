import { ref, computed, watch } from "vue";
import { useSupabaseClient } from "#imports";

/**
 * Minimal period-aware fetcher.
 * period: a computed ref with { from: Date, to: Date }
 */
export default function useFetchTransactions(period = null) {
  const supabase = useSupabaseClient();
  const items = ref([]);
  const pending = ref(false);

  const fetchForRange = async () => {
    pending.value = true;
    try {
      const key =
        period && period.value
          ? `transactions-${period.value.from.toDateString()}-${period.value.to.toDateString()}`
          : "transactions-all";

      const { data } = await useAsyncData(key, async () => {
        let q = supabase
          .from("transactions")
          .select()
          .order("created_at", { ascending: false });
        if (period && period.value) {
          q = q
            .gte("created_at", period.value.from.toISOString())
            .lte("created_at", period.value.to.toISOString());
        }
        const { data, error } = await q;
        if (error) return [];
        return data;
      });

      items.value = data.value || [];
      return items.value;
    } finally {
      pending.value = false;
    }
  };

  const refresh = async () => (items.value = await fetchForRange());

  if (period) {
    watch(
      period,
      () => {
        fetchForRange();
      },
      { immediate: true, deep: true }
    );
  } else {
    // initial load
    fetchForRange();
  }

  const income = computed(() => items.value.filter((t) => t.type === "Income"));
  const expense = computed(() =>
    items.value.filter((t) => t.type === "Expense")
  );
  const investments = computed(() =>
    items.value.filter((t) => t.type === "Investment")
  );
  const saving = computed(() =>
    items.value.filter((t) => t.type === "Saving" || t.type === "Save")
  );

  const incomeCount = computed(() => income.value.length);
  const expenseCount = computed(() => expense.value.length);

  const incomeTotal = computed(() =>
    income.value.reduce((s, t) => s + (t.amount || 0), 0)
  );
  const expenseTotal = computed(() =>
    expense.value.reduce((s, t) => s + (t.amount || 0), 0)
  );
  const investmentsTotal = computed(() =>
    investments.value.reduce((s, t) => s + (t.amount || 0), 0)
  );
  const savingTotal = computed(() =>
    saving.value.reduce((s, t) => s + (t.amount || 0), 0)
  );

  const groupedByDate = computed(() => {
    const grouped = {};
    const sorted = [...items.value].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    for (const tx of sorted) {
      const date = new Date(tx.created_at).toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(tx);
    }
    const ordered = {};
    Object.keys(grouped)
      .sort()
      .reverse()
      .forEach((k) => (ordered[k] = grouped[k]));
    return ordered;
  });

  return {
    pending,
    refresh,
    transactions: {
      all: items,
      grouped: { byDate: groupedByDate },
      income,
      expense,
      investments,
      saving,
      incomeTotal,
      expenseTotal,
      investmentsTotal,
      savingTotal,
      incomeCount,
      expenseCount,
    },
  };
}
