<template>
  <section class="flex items-center justify-between mb-10">
    <h1 class="text-4xl font-extrabold">Summary</h1>
    <div>
      <USelect v-model="selectedView" :items="transactionViewOptions" />
    </div>
  </section>
  <section
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-16 mb-10"
  >
    <Trend
      color="green"
      title="Income"
      :amount="incomeTotal"
      :last-amount="3000"
      :loading="isLoading"
    />
    <Trend
      color="red"
      title="Expense"
      :amount="expenseTotal"
      :last-amount="5000"
      :loading="isLoading"
    />
    <Trend
      color="green"
      title="Investments"
      :amount="4000"
      :last-amount="3000"
      :loading="isLoading"
    />
    <Trend
      color="red"
      title="Saving"
      :amount="4000"
      :last-amount="4100"
      :loading="isLoading"
    />
  </section>

  <section class="flex justify-between mb-10">
    <div>
      <h2 class="text-2xl font-extrabold">Transactions</h2>
      <div class="text-gray-500 dark:text-gray-400">
        You have {{ incomeCount }} incomes and {{ expenseCount }} expenses this
        period
      </div>
    </div>
    <div>
      <UButton
        icon="i-heroicons-plus-circle"
        color="white"
        variant="solid"
        label="Add"
        @click="openModal"
      />
    </div>
  </section>

  <section v-if="!isLoading">
    <div v-for="day in transactionsGroupedByDate" :key="day.date" class="mb-10">
      <DailyTransactionSummary
        :date="day.date"
        :transactions="day.transactions"
      />
      <Transaction
        v-for="transaction in day.transactions"
        :key="transaction.id"
        :transaction="transaction"
        @deleted="refreshTransactions"
      />
    </div>
  </section>

  <section v-else>
    <USkeleton class="h-8 w-full mb-2" v-for="i in 4" :key="i" />
  </section>

  <!-- render the modal and bind to isOpen (client-only to avoid SSR/hydration issues) -->
  <ClientOnly>
    <TransactionModal v-model="isOpen" @saved="refreshTransactions" />
  </ClientOnly>
</template>

<script setup>
import { ref, computed } from "vue";
import { transactionViewOptions } from "~/constants";
import useFetchTransactions from "~/composables/useFetchTransactions";

const { transactions, isLoading, refreshTransactions, addTransaction } =
  useFetchTransactions();

const selectedView = ref(transactionViewOptions[1]);
const isOpen = ref(false);

const openModal = () => {
  isOpen.value = true;
};

const income = computed(() =>
  transactions.value.filter((t) => t.type === "Income")
);
const expense = computed(() =>
  transactions.value.filter((t) => t.type === "Expense")
);

const incomeCount = computed(() => income.value.length);
const expenseCount = computed(() => expense.value.length);

const incomeTotal = computed(() =>
  income.value.reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
);
const expenseTotal = computed(() =>
  expense.value.reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
);

const transactionsGroupedByDate = computed(() => {
  const grouped = {};
  const sorted = [...(transactions.value || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  for (const transaction of sorted) {
    const date = new Date(transaction.created_at).toISOString().split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(transaction);
  }

  const arr = Object.entries(grouped).map(([date, txs]) => ({
    date,
    transactions: txs,
  }));

  arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  return arr;
});
</script>
