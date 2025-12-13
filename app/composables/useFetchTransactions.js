import { ref, onMounted, onUnmounted } from "vue";
import { useSupabaseClient } from "#imports";

export default function useFetchTransactions() {
  const supabase = useSupabaseClient();
  const transactions = ref([]);
  const isLoading = ref(false);
  let channel = null;

  const fetchTransactions = async () => {
    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select()
        .order("created_at", { ascending: false });

      if (error) {
        console.error("fetchTransactions error:", error);
        return [];
      }
      transactions.value = data || [];
      return transactions.value;
    } finally {
      isLoading.value = false;
    }
  };

  const refreshTransactions = async () => {
    return await fetchTransactions();
  };

  const addTransaction = async (payload, { optimistic = true } = {}) => {
    if (optimistic) {
      const tempId = `temp-${Date.now()}`;
      const temp = { id: tempId, ...payload };
      transactions.value.unshift(temp);

      try {
        const { data, error } = await supabase
          .from("transactions")
          .insert([payload])
          .select();

        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        transactions.value = transactions.value.map((t) =>
          t.id === tempId ? row : t
        );
        return row;
      } catch (e) {
        // rollback
        transactions.value = transactions.value.filter((t) => t.id !== tempId);
        throw e;
      }
    } else {
      const { data, error } = await supabase
        .from("transactions")
        .insert([payload])
        .select();

      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    }
  };

  const upsertTransaction = async (payload) => {
    const { data, error } = await supabase
      .from("transactions")
      .upsert([payload])
      .select();

    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  };

  const handleRealtime = (payload) => {
    const ev = payload.eventType; // INSERT / UPDATE / DELETE
    const row = payload.new ?? payload.old;
    if (!row) return;

    if (ev === "INSERT") {
      // avoid duplicate if already present
      if (!transactions.value.find((t) => t.id === row.id)) {
        transactions.value.unshift(row);
      }
    } else if (ev === "UPDATE") {
      transactions.value = transactions.value.map((t) =>
        t.id === row.id ? row : t
      );
    } else if (ev === "DELETE") {
      transactions.value = transactions.value.filter((t) => t.id !== row.id);
    }
  };

  const subscribeRealtime = () => {
    if (channel) return channel;
    channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => handleRealtime(payload)
      )
      .subscribe();
    return channel;
  };

  const unsubscribeRealtime = async () => {
    if (!channel) return;
    try {
      await supabase.removeChannel(channel);
    } finally {
      channel = null;
    }
  };

  onMounted(() => {
    // initial load and subscribe by default
    fetchTransactions();
    subscribeRealtime();
  });

  onUnmounted(() => {
    unsubscribeRealtime();
  });

  return {
    transactions,
    isLoading,
    fetchTransactions,
    refreshTransactions,
    addTransaction,
    upsertTransaction,
    subscribeRealtime,
    unsubscribeRealtime,
  };
}
