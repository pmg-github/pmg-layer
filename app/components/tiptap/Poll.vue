<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { computed, ref, watch } from "vue";
import { NodeViewWrapper } from "@tiptap/vue-3";

const PollEditorModal = defineAsyncComponent(
  () => import("./PollEditorModal.vue"),
);

const props = defineProps({
  node: { type: Object, required: true },
  editor: { type: Object, required: true },
  updateAttributes: { type: Function, required: true },
  deleteNode: { type: Function, required: true },
});

const isEditable = computed(() => props.editor.isEditable ?? false);

const isModalOpen = ref(false);

// Preview data
const pollDetail = ref<any | null>(null);
const isLoadingDetail = ref(false);

const pollRef = computed(() => props.node.attrs.pollRef as string | null);

const loadPollDetail = async (reference: string) => {
  isLoadingDetail.value = true;
  try {
    const imports = (await import("#imports")) as any;
    const polls = imports.useFetchPolls?.();
    if (!polls?.getPollsData || !polls?.getPoll) {
      pollDetail.value = null;
      return;
    }
    const results = await polls.getPollsData({ reference });
    pollDetail.value =
      Array.isArray(results) && results.length
        ? await polls.getPoll(results[0].id)
        : null;
  } catch {
    pollDetail.value = null;
  } finally {
    isLoadingDetail.value = false;
  }
};

watch(
  pollRef,
  (ref) => {
    if (ref) loadPollDetail(ref);
    else pollDetail.value = null;
  },
  { immediate: true },
);

const openModal = () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
};

const applyPoll = (reference: string) => {
  if (!isEditable.value) return;
  if (!reference) return;
  props.updateAttributes({ pollRef: reference });
  isModalOpen.value = false;
};

const removePoll = () => {
  if (!isEditable.value) return;
  props.updateAttributes({ pollRef: null });
  pollDetail.value = null;
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
      <!-- Loading -->
      <div
        v-if="isLoadingDetail"
        class="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-16 text-gray-300"
      >
        <Icon
          name="material-symbols:progress-activity"
          class="size-6 animate-spin"
        />
      </div>

      <!-- Poll preview -->
      <div
        v-else-if="pollDetail"
        class="pointer-events-none select-none rounded-lg border border-gray-200 bg-white p-5"
      >
        <!-- Label -->
        <span
          class="mb-2 inline-block rounded-full bg-pmg-700 px-4 text-sm font-medium text-white"
        >
          Poll
        </span>

        <!-- Question -->
        <h3 class="mt-1 text-xl font-semibold leading-tight text-black">
          {{ pollDetail.questionNl }}
        </h3>

        <!-- Helper text -->
        <div class="mb-3 mt-2 text-sm font-medium text-black opacity-60">
          {{ pollDetail.helperTextNl || "Kies uw antwoord" }}
        </div>

        <!-- Answers -->
        <div class="space-y-2.5">
          <div
            v-for="answer in pollDetail.answers"
            :key="answer.id"
            class="relative flex items-center gap-3 overflow-hidden rounded-xl border-2 border-gray-100 bg-white p-3"
          >
            <div class="absolute inset-0 w-0 bg-pmg-500/20" />
            <div
              v-if="pollDetail.isMultiple"
              class="relative z-10 size-5 shrink-0 rounded-md border-2 border-gray-300 bg-white"
            />
            <span class="relative z-10 text-sm font-semibold text-gray-900">
              {{ answer.answerNl }}
            </span>
          </div>
        </div>
      </div>

      <!-- Fallback -->
      <div
        v-else
        class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-5 py-8 text-sm text-gray-400"
      >
        <Icon name="material-symbols:poll-outline" class="size-5 shrink-0" />
        Poll: {{ pollRef }}
      </div>

      <!-- Edit / delete buttons (top-right overlay, same as Gallery/Carousel) -->
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

    <PollEditorModal
      v-if="isEditable && isModalOpen"
      :open="isModalOpen"
      @update:open="isModalOpen = $event"
      @apply="applyPoll"
    />
  </NodeViewWrapper>
</template>
