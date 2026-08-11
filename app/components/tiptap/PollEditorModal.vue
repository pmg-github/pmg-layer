<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import type { BoPollViewListModel } from "models";

type PollListItem = BoPollViewListModel & { reference?: string };

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  apply: [reference: string];
}>();

const searchQuery = ref("");
const searchResults = ref<PollListItem[]>([]);
const isSearching = ref(false);
const selectedPoll = ref<PollListItem | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const runSearch = async (keyword: string) => {
  isSearching.value = true;
  try {
    const imports = (await import("#imports")) as any;
    const getPolls = imports.useFetchPolls?.()?.getPolls;
    const results = await getPolls?.({ keyword, limit: 20 });
    searchResults.value = (
      Array.isArray(results) ? results : []
    ) as PollListItem[];
  } catch {
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(searchQuery.value), 300);
};

const closeModal = () => {
  emit("update:open", false);
};

const handleOpenState = async (isOpen: boolean) => {
  if (!isOpen) {
    closeModal();
    return;
  }

  searchQuery.value = "";
  selectedPoll.value = null;
  searchResults.value = [];
  await runSearch("");
};

const applyPoll = () => {
  const reference = selectedPoll.value?.reference;
  if (!reference) return;

  emit("apply", reference);
  emit("update:open", false);
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      void handleOpenState(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Dialog class="relative z-50" :open="props.open" @close="closeModal">
    <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="flex h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-5 py-4"
        >
          <DialogTitle class="text-lg font-bold text-gray-900">
            Poll selecteren
          </DialogTitle>
          <button
            type="button"
            class="flex items-center justify-center rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            @click="closeModal"
          >
            <Icon name="material-symbols:close" class="size-5" />
          </button>
        </div>

        <div class="border-b border-gray-100 px-5 py-3">
          <div class="relative">
            <Icon
              name="material-symbols:search"
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Zoek op naam, vraag of code"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-pmg-400 focus:outline-none focus:ring-1 focus:ring-pmg-400"
              @input="onSearchInput"
              autofocus
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div
            v-if="isSearching"
            class="flex items-center justify-center py-10 text-gray-400"
          >
            <Icon
              name="material-symbols:progress-activity"
              class="size-6 animate-spin"
            />
          </div>

          <div
            v-else-if="searchResults.length === 0"
            class="flex flex-col items-center justify-center gap-2 py-10 text-gray-400"
          >
            <Icon name="ic:round-poll" class="size-8" />
            <p class="text-sm">Geen polls gevonden</p>
          </div>

          <button
            v-for="poll in searchResults"
            :key="poll.id"
            type="button"
            class="group flex w-full items-center gap-4 border border-transparent px-4 py-3 text-left hover:bg-gray-50"
            :class="
              selectedPoll?.id === poll.id
                ? 'border-pmg-200 bg-pmg-50 hover:bg-pmg-50'
                : 'bg-white'
            "
            @click="selectedPoll = poll"
          >
            <NuxtLink
              :to="{
                name: 'polls-edit',
                query: { id: poll.id },
              }"
              target="_blank"
              @click.stop
              class="flex size-10 shrink-0 items-center justify-center rounded-lg transition"
              :class="
                selectedPoll?.id === poll.id
                  ? 'bg-pmg-100 text-pmg-600'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'
              "
            >
              <Icon name="material-symbols:open-in-new" class="size-4" />
            </NuxtLink>

            <div class="min-w-0 flex-1">
              <div class="mb-1 flex flex-wrap items-center gap-2 text-gray-500">
                <span
                  class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                >
                  {{ poll.reference }}
                </span>
              </div>
              <p class="truncate text-sm font-semibold text-gray-900">
                {{ poll.name }}
              </p>
              <p class="truncate text-xs text-gray-500">
                {{ poll.question }}
              </p>
            </div>
          </button>
        </div>

        <div
          class="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4"
        >
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            @click="closeModal"
          >
            Annuleren
          </button>
          <button
            type="button"
            class="rounded-lg bg-pmg-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pmg-500 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!selectedPoll"
            @click="applyPoll"
          >
            Toevoegen
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
