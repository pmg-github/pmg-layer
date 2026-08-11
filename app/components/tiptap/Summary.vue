<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";
import { computed, ref } from "vue";
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";

const props = defineProps<{
  node: { attrs: { color?: string } };
  editor: any;
  getPos: () => number;
  updateAttributes: (attrs: { color?: string }) => void;
}>();

const isEditable = computed(() => props.editor.isEditable ?? false);

const isModalOpen = ref(false);
const isGenerating = ref(false);
const errorMessage = ref("");

const summaryColors = [
  {
    name: "Gray",
    value: "gray",
    wrapper: "border-gray-200 bg-gray-50",
    content: "text-gray-700",
  },
  {
    name: "Blue",
    value: "blue",
    wrapper: "border-blue-200 bg-blue-50",
    content: "text-gray-700",
  },
  {
    name: "Green",
    value: "green",
    wrapper: "border-green-200 bg-green-50",
    content: "text-gray-700",
  },
  {
    name: "Yellow",
    value: "yellow",
    wrapper: "border-yellow-200 bg-yellow-50",
    content: "text-gray-700",
  },
  {
    name: "Orange",
    value: "orange",
    wrapper: "border-orange-200 bg-orange-50",
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
      "Structuur: <h2>Samenvatting</h2> <ul> <li>...</li> </ul>",
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

    props.editor
      .chain()
      .focus()
      .insertContentAt(props.getPos() + 1, summary)
      .run();

    closeModal();
  } catch {
    errorMessage.value = "Het genereren van de samenvatting is mislukt.";
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <NodeViewWrapper
    as="section"
    class="mt-4 box-border w-full max-w-full rounded-lg border"
    :class="activeColor.wrapper"
  >
    <div class="relative">
      <div v-if="isEditable" class="absolute right-2 top-2 z-[1]">
        <button
          type="button"
          class="flex items-center justify-center rounded-full bg-gray-800/70 p-2 text-white transition hover:bg-gray-800/90"
          title="Samenvatting instellingen"
          @click.stop="openSettings"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>

      <NodeViewContent
        class="summary-content min-h-24 p-8 text-sm leading-relaxed focus:outline-none"
        :class="activeColor.content"
      />
    </div>

    <DialogRoot :open="isModalOpen" @update:open="isModalOpen = $event">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/60" />
        <DialogContent
          class="fixed left-1/2 top-16 z-50 max-h-[calc(100vh-5rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl focus:outline-none"
        >
          <div class="mb-6 flex items-center justify-between">
            <DialogTitle class="text-xl font-bold">
              Uitgelicht (kader)
            </DialogTitle>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isGenerating"
                @click="generateWithAi"
              >
                {{
                  isGenerating
                    ? "Samenvatting genereren..."
                    : "Genereer samenvatting (AI)"
                }}
              </button>
              <button
                type="button"
                class="flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
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
                    :class="color.wrapper"
                  />
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </NodeViewWrapper>
</template>
