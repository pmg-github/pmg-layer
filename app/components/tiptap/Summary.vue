<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";
import { computed, nextTick, ref } from "vue";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { SUMMARY_TITLE } from "../../utils/extensions/summary";
import Switch from "../inputs/Switch.vue";
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";

const props = defineProps<{
  node: ProseMirrorNode;
  editor: any;
  getPos: () => number;
  updateAttributes: (attrs: { print?: boolean }) => void;
}>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const hasTitle = computed(() => props.node.firstChild?.type.name === "heading");

const EMPTY_BODY_TYPES = ["paragraph", "bulletList"];

const isBodyEmpty = computed(() => {
  let empty = true;
  props.node.forEach((child, _offset, index) => {
    if (index === 0 && hasTitle.value) return;
    if (
      !EMPTY_BODY_TYPES.includes(child.type.name) ||
      child.textContent.trim()
    ) {
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
  const start = props.getPos() + 1 + offset;
  props.editor
    .chain()
    .focus()
    .command(({ tr }: { tr: any }) => {
      tr.setSelection(TextSelection.near(tr.doc.resolve(start)));
      return true;
    })
    .run();
};

const usePrint = computed({
  get: () => props.node.attrs.print !== false,
  set: (value: boolean) => props.updateAttributes({ print: value }),
});

const isModalOpen = ref(false);
const isGenerating = ref(false);
const errorMessage = ref("");

const activeColor = {
  wrapper: "border-yellow-200 bg-yellow-50",
  accent: "#ca8a04",
  content: "text-gray-700",
};

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
      "Je mag <strong>, <em> en <u> gebruiken om kernwoorden te benadrukken, spaarzaam en geen andere opmaak.",
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

    // Keep a filled title, otherwise add an h2. Replace an empty body, else insert above it.
    const pos = props.getPos();
    const title = props.node.firstChild;
    const isHeading = title?.type.name === "heading";
    const keepTitle = isHeading && !!title.textContent.trim();
    const emptyTitleSize = isHeading && !keepTitle ? title.nodeSize : 0;
    const from = pos + 1 + (keepTitle ? title.nodeSize : 0);
    let bodyHasText = false;
    props.node.forEach((child, _offset, index) => {
      if ((index > 0 || !isHeading) && child.textContent.trim()) {
        bodyHasText = true;
      }
    });
    const to = bodyHasText
      ? from + emptyTitleSize
      : pos + props.node.nodeSize - 1;
    const content = keepTitle ? summary : `<h2>${SUMMARY_TITLE}</h2>${summary}`;

    props.editor.chain().focus().insertContentAt({ from, to }, content).run();

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
      class="relative min-h-24 rounded-lg border p-1"
      :class="[activeColor.wrapper, { 'cursor-pointer': isEditable }]"
      :style="{ '--summary-accent': activeColor.accent }"
      @click="selectNodeFromBackground"
    >
      <div class="relative min-h-24 p-8">
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
          class="fixed left-1/2 top-16 z-50 max-h-[calc(100vh-5rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-xl bg-white shadow-xl focus:outline-none"
        >
          <div class="flex items-start gap-3 border-b border-gray-100 p-5">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700"
            >
              <Icon name="material-symbols:summarize-outline" class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <DialogTitle class="text-lg font-semibold text-gray-900">
                Samenvatting
              </DialogTitle>
              <DialogDescription class="text-sm text-gray-500">
                De kernpunten van het artikel in een korte opsomming.
              </DialogDescription>
            </div>
            <button
              type="button"
              class="flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              aria-label="Sluiten"
              :disabled="isGenerating"
              @click="closeModal"
            >
              <Icon name="material-symbols:close" class="size-5" />
            </button>
          </div>

          <div class="space-y-4 p-5">
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="flex items-start gap-3">
                <Icon
                  name="material-symbols:auto-awesome"
                  class="mt-0.5 size-5 shrink-0 text-blue-600"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    Genereren met AI
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500">
                    {{
                      isBodyEmpty
                        ? "Maakt maximaal 5 kernpunten op basis van de artikeltekst."
                        : "De AI-versie wordt boven de bestaande tekst toegevoegd."
                    }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isGenerating"
                @click.stop="generateWithAi"
              >
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
              </button>
              <p
                v-if="errorMessage"
                class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {{ errorMessage }}
              </p>
            </div>

            <div
              class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  Gebruik voor print
                </p>
                <p class="mt-0.5 text-xs text-gray-500">
                  Neem deze samenvatting op in de printversie.
                </p>
              </div>
              <Switch v-model="usePrint" />
            </div>
          </div>

          <div class="flex justify-end border-t border-gray-100 p-4">
            <button
              type="button"
              class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
              :disabled="isGenerating"
              @click="closeModal"
            >
              Klaar
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </NodeViewWrapper>
</template>

<style scoped>
/* Placeholder for an emptied title; ProseMirror keeps a trailing <br> in empty blocks. */
.summary-content
  :deep(
    :is(h2, h3, h4):first-child:has(> br.ProseMirror-trailingBreak:only-child)
  )::before {
  content: "In het kort";
  float: left;
  height: 0;
  pointer-events: none;
  opacity: 0.4;
}
.summary-content :deep(ul) {
  list-style: none;
  margin: 0.75rem 0;
  padding-left: 0;
}

.summary-content :deep(ul > li) {
  position: relative;
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.summary-content :deep(ul > li > p) {
  margin: 0;
}

/* Centered on the first line (line-height 1.625). */
.summary-content :deep(ul > li)::before {
  content: "";
  position: absolute;
  left: 0;
  top: calc(0.8125em - 0.5rem);
  width: 1rem;
  height: 1rem;
  background-color: var(--summary-accent);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 5l7 7-7 7'/%3E%3C/svg%3E")
    center / contain no-repeat;
}
</style>
