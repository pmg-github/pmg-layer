<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { VueDraggableNext as Draggable } from "vue-draggable-next";
import { useFetchOpenAI } from "#imports";

type AccordionItem = {
  question: string;
  answer: string;
};

const props = defineProps({
  node: { type: Object, required: true },
  editor: { type: Object, required: true },
  updateAttributes: { type: Function, required: true },
});

const isEditable = computed(() => props.editor.isEditable ?? false);

const { postPrompt } = useFetchOpenAI();

const isModalOpen = ref(false);
const isGenerating = ref(false);
const openIndex = ref<number | null>(null);

const items = computed<AccordionItem[]>({
  get: () => props.node.attrs.items || [],
  set: (val) => props.updateAttributes({ items: val }),
});

const visibleItems = computed(() =>
  items.value.filter((item) => item.question?.trim() && item.answer?.trim()),
);

const hasItems = computed(() =>
  items.value.some((item) => item.question?.trim()),
);

// Watch all attribute changes (question/answer edits, reordering, etc.) and notify TipTap
watch(
  () => props.node.attrs,
  (newAttrs) => {
    props.updateAttributes(newAttrs);
  },
  { deep: true, immediate: false },
);

const toggleItem = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index;
};

onMounted(() => {
  if (!props.node.attrs.items) {
    props.updateAttributes({ items: [] });
  }
});

const handleOpenManageModal = () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
};

const addItem = () => {
  if (!isEditable.value) return;
  items.value = [...items.value, { question: "", answer: "" }];
};

const removeItem = (index: number) => {
  if (!isEditable.value) return;
  items.value = items.value.filter((_, i) => i !== index);
};

const updateItem = (
  index: number,
  field: keyof AccordionItem,
  value: string,
) => {
  if (!isEditable.value) return;
  items.value = items.value.map((item, i) =>
    i === index ? { ...item, [field]: value } : item,
  );
};

const generateWithAi = async () => {
  if (!isEditable.value) return;
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const text = props.editor.state.doc.textContent;
    if (!text?.trim()) return;

    const prompt =
      `Genereer 5 veelgestelde vragen met bijbehorende antwoorden op basis van de volgende tekst. ` +
      `Antwoord uitsluitend met een JSON-array, niets anders. ` +
      `Formaat: [{"question":"...","answer":"..."}]. ` +
      `\n\nTEKST:\n${text}`;

    const result = await postPrompt(prompt, "gpt-4o");
    const raw = result.response.replace(/^```[\w]*\n?|\n?```$/g, "").trim();
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      items.value = parsed.map((v: any) => ({
        question: String(v.question ?? ""),
        answer: String(v.answer ?? ""),
      }));
    }
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <NodeViewWrapper class="mt-4 box-border w-full max-w-full">
    <div
      v-if="!hasItems"
      class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
        >
          Q & A
        </span>
      </div>

      <Icon
        name="material-symbols:quiz-outline"
        class="mb-4 size-12 text-gray-400"
      />

      <h3 class="mb-2 font-medium text-gray-700">Vragen en antwoorden</h3>

      <p class="mb-4 text-xs text-gray-400">
        Voeg vragen &amp; antwoorden toe of genereer ze automatisch met AI.
      </p>

      <div v-if="isEditable" class="flex gap-2">
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-60"
          :disabled="isGenerating"
          @click.stop="generateWithAi"
        >
          <span class="flex items-center gap-2">
            <Icon
              :name="
                isGenerating
                  ? 'material-symbols:progress-activity'
                  : 'material-symbols:auto-awesome'
              "
              class="size-4"
              :class="{ 'animate-spin': isGenerating }"
            />
            {{ isGenerating ? "Genereren..." : "Genereer met AI" }}
          </span>
        </button>

        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          @click.stop="handleOpenManageModal"
        >
          Handmatig toevoegen
        </button>
      </div>
    </div>

    <div
      v-else
      id="accordion-collapse"
      data-accordion="collapse"
      class="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      <div v-if="isEditable" class="absolute right-2 top-2 z-[1]">
        <button
          type="button"
          class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90"
          title="Beheren"
          @click.stop="handleOpenManageModal"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>

      <div>
        <template v-for="(item, index) in visibleItems" :key="index">
          <h4 :id="`accordion-collapse-heading-${index}`">
            <span
              type="button"
              class="flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              :class="{
                'border-b border-gray-200':
                  index !== visibleItems.length - 1 && openIndex !== index,
                'border-b-0':
                  index === visibleItems.length - 1 || openIndex === index,
              }"
              :data-accordion-target="`#accordion-collapse-body-${index}`"
              :aria-expanded="openIndex === index"
              :aria-controls="`accordion-collapse-body-${index}`"
              @click="toggleItem(index)"
            >
              {{ item.question }}

              <Icon
                :name="
                  openIndex === index
                    ? 'material-symbols:expand-less'
                    : 'material-symbols:expand-more'
                "
                class="size-5"
              />
            </span>
          </h4>

          <div
            v-if="openIndex === index"
            :id="`accordion-collapse-body-${index}`"
            :aria-labelledby="`accordion-collapse-heading-${index}`"
            :class="{
              'border-b border-gray-200': index !== visibleItems.length - 1,
            }"
          >
            <div class="p-4 md:p-5">
              <p class="text-sm text-gray-600">
                {{ item.answer }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <Dialog
      class="relative z-50"
      :open="isModalOpen"
      @close="isModalOpen = false"
    >
      <div class="fixed inset-0 bg-black/60" aria-hidden="true" />

      <div
        class="fixed inset-0 flex items-start justify-center overflow-y-auto p-4"
      >
        <DialogPanel class="mt-16 w-full max-w-2xl rounded-lg bg-white p-6">
          <div class="mb-6 flex items-center justify-between">
            <DialogTitle class="text-xl font-bold">
              Vragen & Antwoorden ({{ items.length }})
            </DialogTitle>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isGenerating"
                @click.stop="generateWithAi"
              >
                <span class="flex items-center gap-1.5">
                  <Icon
                    :name="
                      isGenerating
                        ? 'material-symbols:progress-activity'
                        : 'material-symbols:auto-awesome'
                    "
                    class="size-4"
                    :class="{ 'animate-spin': isGenerating }"
                  />

                  {{ isGenerating ? "Genereren..." : "Genereer met AI" }}
                </span>
              </button>

              <button
                type="button"
                class="flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
                title="Sluiten"
                @click="isModalOpen = false"
              >
                <Icon name="material-symbols:close" class="size-5" />
              </button>
            </div>
          </div>

          <div>
            <Draggable v-model="items" handle=".drag-handle" class="space-y-3">
              <div
                v-for="(item, index) in items"
                :key="index"
                class="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div class="mb-2 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="drag-handle flex cursor-move rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      title="Verslepen"
                      @click.stop
                    >
                      <Icon
                        name="material-symbols:drag-indicator"
                        class="size-5"
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    class="flex items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                    @click.stop="removeItem(index)"
                  >
                    <Icon
                      name="material-symbols:delete-outline"
                      class="size-5"
                    />
                  </button>
                </div>

                <input
                  :value="item.question"
                  type="text"
                  placeholder="Vraag"
                  class="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  @input="
                    updateItem(
                      index,
                      'question',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />

                <textarea
                  :value="item.answer"
                  rows="4"
                  placeholder="Antwoord"
                  class="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm"
                  @input="
                    updateItem(
                      index,
                      'answer',
                      ($event.target as HTMLTextAreaElement).value,
                    )
                  "
                />
              </div>
            </Draggable>

            <button
              type="button"
              class="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click.stop="addItem"
            >
              Vraag toevoegen
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </NodeViewWrapper>
</template>
