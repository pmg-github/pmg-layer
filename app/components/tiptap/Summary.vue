<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";
import { computed, nextTick, ref } from "vue";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";

const props = defineProps<{
  node: ProseMirrorNode;
  editor: any;
  getPos: () => number;
  updateAttributes: (attrs: { color?: string; print?: boolean }) => void;
}>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const hasTitle = computed(() => props.node.firstChild?.type.name === "heading");

const isBodyEmpty = computed(() => {
  let empty = true;
  props.node.forEach((child, _offset, index) => {
    if (index === 0 && hasTitle.value) return;
    if (child.type.name !== "paragraph" || child.content.size > 0) {
      empty = false;
    }
  });
  return empty;
});

const isWritingManually = ref(false);
const showEmptyState = computed(
  () => isEditable.value && isBodyEmpty.value && !isWritingManually.value,
);

const writeManually = async () => {
  isWritingManually.value = true;
  await nextTick();
  const title = props.node.firstChild;
  const offset = hasTitle.value && title ? title.nodeSize : 0;
  props.editor
    .chain()
    .focus(props.getPos() + 1 + offset + 1)
    .run();
};

const usePrint = computed({
  get: () => props.node.attrs.print !== false,
  set: (value: boolean) => props.updateAttributes({ print: value }),
});

const addTitle = () => {
  if (!isEditable.value) return;
  props.editor.chain().focus().insertSummaryTitle(props.getPos()).run();
};

const isModalOpen = ref(false);
const isGenerating = ref(false);
const errorMessage = ref("");

const summaryColors = [
  {
    name: "Gray",
    value: "gray",
    wrapper: "border-gray-200",
    strip: "bg-gray-600 text-white",
    content: "text-gray-700",
  },
  {
    name: "Blue",
    value: "blue",
    wrapper: "border-blue-200",
    strip: "bg-blue-600 text-white",
    content: "text-gray-700",
  },
  {
    name: "Green",
    value: "green",
    wrapper: "border-green-200",
    strip: "bg-green-600 text-white",
    content: "text-gray-700",
  },
  {
    name: "Yellow",
    value: "yellow",
    wrapper: "border-yellow-200",
    strip: "bg-yellow-400 text-gray-900",
    content: "text-gray-700",
  },
  {
    name: "Orange",
    value: "orange",
    wrapper: "border-orange-200",
    strip: "bg-orange-500 text-white",
    content: "text-gray-700",
  },
];

const selectedColor = computed({
  get: () => props.node.attrs.color ?? "gray",
  set: (value: string) => props.updateAttributes({ color: value }),
});

const activeColor = computed(
  () =>
    summaryColors.find((c) => c.value === selectedColor.value) ??
    summaryColors[0]!,
);

const openSettings = () => {
  if (!isEditable.value) return;
  errorMessage.value = "";
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const selectNode = () => {
  if (!isEditable.value) return;
  props.editor.chain().focus().setNodeSelection(props.getPos()).run();
};

const selectNodeFromBackground = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest("[data-node-view-content]")) return;
  selectNode();
};

const generateWithAi = async () => {
  if (!isEditable.value) return;
  if (isGenerating.value) return;

  const articleText = props.editor.state.doc.textContent.trim();

  if (!articleText) {
    errorMessage.value = "Er is geen artikeltekst gevonden om samen te vatten.";
    return;
  }

  isGenerating.value = true;
  errorMessage.value = "";

  try {
    const imports = (await import("#imports")) as any;
    const postPrompt = imports.useFetchOpenAI?.()?.postPrompt;
    if (!postPrompt) {
      throw new Error("OpenAI composable is unavailable");
    }

    const prompt = [
      "Vat onderstaand artikel samen als HTML.",
      "Geef enkel HTML terug, zonder uitleg of markdown.",
      "Structuur: <ul> <li>...</li> </ul>, zonder titel of kop.",
      "Richt je uitsluitend op de belangrijkste inzichten, feiten en conclusies.",
      "Vermijd details, voorbeelden en herhalingen.",
      "Gebruik maximaal 5 bullet points.",
      "Schrijf elke bullet in één duidelijke zin van maximaal 20 woorden.",
      "Wees objectief en voeg geen eigen interpretaties toe.",
      "",
      "ARTIKEL:",
      articleText,
    ].join("\n");

    const result = await postPrompt(prompt, "gpt-5");
    const summary = result.response
      ?.trim()
      .replace(/^```[\w]*\n?|\n?```$/g, "")
      .trim();

    if (!summary) return;

    // Keep the title. Replace an empty body, otherwise insert below the title.
    const pos = props.getPos();
    const title = props.node.firstChild;
    const hasTitle = title?.type.name === "heading";
    const from = pos + 1 + (hasTitle ? title.nodeSize : 0);
    let bodyHasText = false;
    props.node.forEach((child, _offset, index) => {
      if ((index > 0 || !hasTitle) && child.textContent.trim()) {
        bodyHasText = true;
      }
    });
    const to = bodyHasText ? from : pos + props.node.nodeSize - 1;

    props.editor.chain().focus().insertContentAt({ from, to }, summary).run();

    closeModal();
  } catch {
    errorMessage.value = "Het genereren van de samenvatting is mislukt.";
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <NodeViewWrapper as="section" class="mt-4 box-border w-full max-w-full">
    <div
      v-if="showEmptyState"
      contenteditable="false"
      class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
        >
          Samenvatting
        </span>
      </div>

      <div class="absolute right-2 top-2 z-[1]">
        <button
          type="button"
          class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90"
          title="Samenvatting instellingen"
          @click.stop="openSettings"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>

      <Icon
        name="material-symbols:summarize-outline"
        class="mb-4 size-12 text-gray-400"
      />

      <h3 class="mb-2 font-medium text-gray-700">Samenvatting</h3>

      <p class="mb-4 text-xs text-gray-400">
        Schrijf zelf een samenvatting of genereer ze automatisch met AI.
      </p>

      <p
        v-if="errorMessage && !isModalOpen"
        class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>

      <div class="flex gap-2">
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
          :disabled="isGenerating"
          @click.stop="writeManually"
        >
          Handmatig schrijven
        </button>
      </div>
    </div>

    <div
      v-show="!showEmptyState"
      class="relative min-h-24 overflow-hidden rounded-lg border bg-white shadow-md"
      :class="[activeColor.wrapper, { 'cursor-pointer': isEditable }]"
      @click="selectNodeFromBackground"
    >
      <div
        contenteditable="false"
        class="flex items-center gap-2 px-6 py-2 text-xs font-semibold uppercase tracking-wider"
        :class="activeColor.strip"
      >
        <Icon name="material-symbols:summarize-outline" class="size-4" />
        Samenvatting
        <span
          v-if="isEditable && !hasTitle"
          class="ml-2 inline-flex items-center gap-2 rounded-full bg-black/20 py-0.5 pl-2 pr-1 text-[11px] font-medium normal-case tracking-normal"
        >
          Geen titel
          <button
            type="button"
            class="rounded-full bg-white/20 px-2 py-0.5 transition hover:bg-white/30"
            @click.stop="addTitle"
          >
            Titel toevoegen
          </button>
        </span>
      </div>

      <div class="relative min-h-16 px-6 pb-6 pr-14 pt-4">
        <div v-if="isEditable" class="absolute right-2 top-2 z-[1]">
          <button
            type="button"
            class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90"
            title="Samenvatting instellingen"
            @click.stop="openSettings"
          >
            <Icon name="material-symbols:edit-outline" class="size-5" />
          </button>
        </div>

        <NodeViewContent
          class="summary-content text-sm leading-relaxed focus:outline-none"
          :class="[activeColor.content, { 'cursor-text': isEditable }]"
        />
      </div>
    </div>

    <DialogRoot :open="isModalOpen" @update:open="isModalOpen = $event">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/60" />
        <DialogContent
          class="fixed left-1/2 top-16 z-50 max-h-[calc(100vh-5rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl focus:outline-none"
        >
          <div class="mb-6 flex items-center justify-between">
            <DialogTitle class="text-xl font-bold"> Samenvatting </DialogTitle>

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
                :disabled="isGenerating"
                @click="closeModal"
              >
                <Icon name="material-symbols:close" class="size-5" />
              </button>
            </div>
          </div>

          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>

          <div class="space-y-6">
            <div>
              <p class="mb-3 text-sm font-medium text-gray-700">
                Kies een kleur
              </p>

              <div class="flex flex-wrap gap-3">
                <button
                  v-for="color in summaryColors"
                  :key="color.value"
                  type="button"
                  class="h-10 w-10 rounded-full border-2 transition"
                  :class="
                    selectedColor === color.value
                      ? 'border-gray-900 ring-2 ring-gray-900/20'
                      : 'border-gray-200'
                  "
                  :title="color.name"
                  @click="selectedColor = color.value"
                >
                  <span
                    class="block h-full w-full rounded-full"
                    :class="color.strip"
                  />
                </button>
              </div>
            </div>

            <Switch v-model="usePrint" label="Gebruik voor print" />
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </NodeViewWrapper>
</template>
