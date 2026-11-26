<script setup lang="ts">
import { ref, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    selected?: { value: string | number | boolean; key: string } | null;
    language?: string;
    variant?: "primary" | "subtle";
    showSelection?: boolean;
  }>(),
  { variant: "primary", showSelection: true },
);
const slots = useSlots();
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
  <div class="flex flex-col items-start gap-2">
    <p v-if="showSelection && selected?.value" class="text-sm text-gray-700">
      {{ selected.key }}
      <span class="block text-xs text-gray-500">{{ selected.value }}</span>
    </p>
    <button
      type="button"
      :disabled="isOpening"
      class="inline-flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      :class="
        variant === 'subtle'
          ? [
              'rounded-lg border border-gray-300 bg-white text-sm font-medium leading-5 text-gray-700 hover:border-gray-400 hover:bg-gray-100',
              slots.default ? 'min-h-9 gap-2 px-3 py-2' : 'size-9',
            ]
          : [
              'rounded-full bg-blue-500 text-white hover:bg-blue-700',
              slots.default ? 'h-8 gap-2 px-3' : 'size-8',
            ]
      "
      aria-label="Open videobibliotheek"
      title="Bibliotheek"
      @click="choose"
    >
      <Icon
        name="material-symbols:video-library-outline-rounded"
        :class="variant === 'subtle' ? 'size-4 shrink-0' : 'size-5'"
      />
      <slot />
    </button>
    <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
