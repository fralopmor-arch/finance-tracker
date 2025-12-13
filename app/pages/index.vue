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
import { useSelectedTimePeriod } from "~/composables/useSelectedTimePeriod";
import useFetchTransactions from "~/composables/useFetchTransactions";

const selectedView = ref(transactionViewOptions[1]);
const isOpen = ref(false);
const { current, previous } = useSelectedTimePeriod(selectedView);

// current period data (auto-fetches when current changes)
const {
  pending,
  refresh,
  transactions: {
    incomeCount,
    expenseCount,
    incomeTotal,
    expenseTotal,
    grouped: { byDate },
  },
} = useFetchTransactions(current);

// previous period stats
const {
  refresh: refreshPrevious,
  transactions: {
    incomeTotal: prevIncomeTotal,
    expenseTotal: prevExpenseTotal,
    investmentsTotal: prevInvestTotal,
    savingTotal: prevSavingTotal,
  },
} = useFetchTransactions(previous);

// initial refresh both ranges (top-level await supported in Nuxt)
await Promise.all([refresh(), refreshPrevious()]);

const openModal = () => {
  isOpen.value = true;
};

// template expects these names — create small aliases
const isLoading = pending;
const refreshTransactions = refresh;

const transactionsGroupedByDate = computed(() => {
  const obj = byDate && byDate.value ? byDate.value : {};
  return Object.keys(obj).map((d) => ({ date: d, transactions: obj[d] }));
});
</script>
