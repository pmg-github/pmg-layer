<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  selected?: { value: string | number | boolean; key: string } | null;
  language?: string;
}>();
const emit = defineEmits<{
  "update:selected": [video: { value: string; key: string }];
}>();
const isOpening = ref(false);
const error = ref("");

const choose = async () => {
  if (isOpening.value) return;
  isOpening.value = true;
  error.value = "";
  try {
    // Resolve the host's picker only when editing, like the image library.
    const runtime = (await import("#imports")) as any;
    const library = runtime.useVideoLibrary?.();
    if (!library?.pickVideo) {
      error.value = "De videogalerij is niet beschikbaar in deze omgeving.";
      return;
    }
    const video = await library.pickVideo({
      language: props.language,
      currentCode: props.selected?.value?.toString(),
    });
    if (video?.isSelectable) {
      emit("update:selected", {
        value: video.jobCode,
        key: video.title || video.jobCode,
      });
    }
  } catch {
    error.value = "De videogalerij kon niet worden geopend. Probeer opnieuw.";
  } finally {
    isOpening.value = false;
  }
};
</script>

<template>
  <div class="space-y-2">
    <p v-if="selected?.value" class="text-sm text-gray-700">
      {{ selected.key }}
      <span class="block text-xs text-gray-500">{{ selected.value }}</span>
    </p>
    <button
      type="button"
      :disabled="isOpening"
      class="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50"
      @click="choose"
    >
      {{ selected?.value ? "Andere video kiezen" : "Video kiezen" }}
    </button>
    <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
