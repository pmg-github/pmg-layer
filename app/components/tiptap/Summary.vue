<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";

const SummaryEditorModal = defineAsyncComponent(
  () => import("./SummaryEditorModal.vue"),
);

const props = defineProps<{
  node: { attrs: { color?: string } };
  editor: any;
  getPos: () => number;
  updateAttributes: (attrs: { color?: string }) => void;
}>();

const isEditable = computed(() => props.editor.isEditable ?? false);

const isModalOpen = ref(false);

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
  isModalOpen.value = true;
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

    <SummaryEditorModal
      v-if="isEditable && isModalOpen"
      :open="isModalOpen"
      :color="selectedColor"
      :summary-colors="summaryColors"
      :editor="props.editor"
      :get-pos="props.getPos"
      @update:open="isModalOpen = $event"
      @update:color="selectedColor = $event"
    />
  </NodeViewWrapper>
</template>
