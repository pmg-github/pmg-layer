<script setup lang="ts">
import { computed, ref } from "vue";
import FrontendPoll from "../Poll.vue";
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { NodeViewWrapper } from "@tiptap/vue-3";
import type { BoPollViewListModel } from "models";
import { useFetchPolls } from "#imports";
type PollListItem = BoPollViewListModel & { reference?: string };

const props = defineProps({
  node: { type: Object, required: true },
  editor: { type: Object, required: true },
  updateAttributes: { type: Function, required: true },
  deleteNode: { type: Function, required: true },
});

const isEditable = computed(() => props.editor.isEditable ?? false);

const isModalOpen = ref(false);
const searchQuery = ref("");
const searchResults = ref<PollListItem[]>([]);
const isSearching = ref(false);
const selectedPoll = ref<PollListItem | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const pollRef = computed(() => props.node.attrs.pollRef as string | null);

const polls = useFetchPolls();

const openModal = () => {
  if (!isEditable.value) return;
  searchQuery.value = "";
  searchResults.value = [];
  isModalOpen.value = true;
  runSearch("");
};

const runSearch = async (keyword: string) => {
  isSearching.value = true;
  try {
    const results = await polls.getPolls({ keyword, limit: 20 });
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

const selectPoll = (poll: PollListItem) => {
  if (!isEditable.value) return;
  selectedPoll.value = poll;
};

const applyPoll = () => {
  if (!isEditable.value) return;
  if (!selectedPoll.value) return;
  props.updateAttributes({ pollRef: selectedPoll.value.reference });
  isModalOpen.value = false;
};

const removePoll = () => {
  if (!isEditable.value) return;
  props.updateAttributes({ pollRef: null });
};
</script>

<template>
  <NodeViewWrapper class="my-4 box-border w-full max-w-full">
    <!-- Empty state -->
    <div
      v-if="!pollRef"
      class="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Poll</span
        >
      </div>
      <Icon name="ic:round-poll" class="mb-4 size-12 text-gray-400" />
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Nog geen poll geselecteerd
      </h3>
      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click.stop="openModal"
      >
        Selecteer poll
      </button>
    </div>

    <!-- Filled state -->
    <div v-else-if="pollRef" class="relative overflow-hidden rounded-lg">
      <!-- Poll preview (non-interactive in editor) -->
      <div class="pointer-events-none select-none">
        <FrontendPoll :id="pollRef!" />
      </div>

      <!-- Edit button (top-right overlay) -->
      <div v-if="isEditable" class="absolute right-2 top-2 z-[1] flex gap-2">
        <button
          type="button"
          class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-sm text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          title="Andere poll kiezen"
          @click.stop="openModal"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>
    </div>

    <!-- Search modal -->
    <DialogRoot
      v-if="isEditable && isModalOpen"
      :open="isModalOpen"
      @update:open="isModalOpen = $event"
    >
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/60" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 flex h-[80vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-2xl focus:outline-none"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-gray-100 px-5 py-4"
          >
            <DialogTitle class="text-lg font-bold text-gray-900">
              Poll selecteren
            </DialogTitle>
            <button
              type="button"
              class="flex items-center justify-center rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              @click="isModalOpen = false"
            >
              <Icon name="material-symbols:close" class="size-5" />
            </button>
          </div>

          <!-- Search input -->
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

          <!-- Results -->
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
              @click="selectPoll(poll)"
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
                <div
                  class="mb-1 flex flex-wrap items-center gap-2 text-gray-500"
                >
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

                <!-- <span
                    v-if="poll.amountOfVotes !== undefined"
                    class="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
                  >
                    {{ poll.amountOfVotes }} stemmen
                  </span> -->
              </div>
            </button>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4"
          >
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              @click="isModalOpen = false"
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
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </NodeViewWrapper>
</template>
