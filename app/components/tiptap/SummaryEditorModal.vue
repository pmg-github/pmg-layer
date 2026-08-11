<script setup lang="ts">
import { ref } from "vue";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";

type SummaryColor = {
  name: string;
  value: string;
  wrapper: string;
  content: string;
};

type Props = {
  open: boolean;
  color: string;
  summaryColors: SummaryColor[];
  editor: any;
  getPos: () => number;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:color": [value: string];
}>();

const { postPrompt } = useFetchOpenAI();

const isGenerating = ref(false);
const errorMessage = ref("");

const closeModal = () => {
  emit("update:open", false);
};

const selectColor = (value: string) => {
  emit("update:color", value);
};

const generateWithAi = async () => {
  if (isGenerating.value) return;

  const articleText = props.editor.state.doc.textContent.trim();

  if (!articleText) {
    errorMessage.value = "Er is geen artikeltekst gevonden om samen te vatten.";
    return;
  }

  isGenerating.value = true;
  errorMessage.value = "";

  try {
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
  <Dialog class="relative z-50" :open="props.open" @close="closeModal">
    <div class="fixed inset-0 bg-black/60" aria-hidden="true" />

    <div
      class="fixed inset-0 flex items-start justify-center overflow-y-auto p-4"
    >
      <DialogPanel class="mt-16 w-full max-w-2xl rounded-lg bg-white p-6">
        <div class="mb-6 flex items-center justify-between">
          <DialogTitle class="text-xl font-bold"
            >Uitgelicht (kader)</DialogTitle
          >

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
            <p class="mb-3 text-sm font-medium text-gray-700">Kies een kleur</p>

            <div class="flex flex-wrap gap-3">
              <button
                v-for="colorOption in props.summaryColors"
                :key="colorOption.value"
                type="button"
                class="h-10 w-10 rounded-full border-2 transition"
                :class="
                  props.color === colorOption.value
                    ? 'border-gray-900 ring-2 ring-gray-900/20'
                    : 'border-gray-200'
                "
                :title="colorOption.name"
                @click="selectColor(colorOption.value)"
              >
                <span
                  class="block h-full w-full rounded-full"
                  :class="colorOption.wrapper"
                />
              </button>
            </div>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
