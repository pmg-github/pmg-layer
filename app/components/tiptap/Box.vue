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

const boxColors = [
  {
    name: "Gray",
    value: "gray",
    wrapper: "bg-gray-100",
    swatch: "bg-gray-200",
    content: "text-gray-700",
  },
  {
    name: "Blue",
    value: "blue",
    wrapper: "bg-blue-50",
    swatch: "bg-blue-200",
    content: "text-gray-700",
  },
  {
    name: "Green",
    value: "green",
    wrapper: "bg-green-50",
    swatch: "bg-green-200",
    content: "text-gray-700",
  },
  {
    name: "Yellow",
    value: "yellow",
    wrapper: "bg-yellow-50",
    swatch: "bg-yellow-200",
    content: "text-gray-700",
  },
  {
    name: "Orange",
    value: "orange",
    wrapper: "bg-orange-50",
    swatch: "bg-orange-200",
    content: "text-gray-700",
  },
];

const selectedColor = computed({
  get: () => props.node.attrs.color ?? "gray",
  set: (value: string) => props.updateAttributes({ color: value }),
});

const activeColor = computed(
  () =>
    boxColors.find((c) => c.value === selectedColor.value) ??
    boxColors[0]!,
);

const openSettings = () => {
  if (!isEditable.value) return;
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
</script>

<template>
  <NodeViewWrapper
    as="section"
    class="mt-4 box-border w-full max-w-full rounded-xl p-1"
    :class="[activeColor.wrapper, { 'cursor-pointer': isEditable }]"
    @click="selectNodeFromBackground"
  >
    <div class="relative min-h-24 p-8">
      <span
        v-if="isEditable"
        class="absolute left-2 top-2 z-[1] rounded-full bg-gray-800/70 px-2 py-0.5 text-[11px] font-medium text-white"
      >
        Kader
      </span>

      <div v-if="isEditable" class="absolute right-2 top-2 z-[1]">
        <button
          type="button"
          class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90"
          title="Kader instellingen"
          @click.stop="openSettings"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>

      <NodeViewContent
        class="box-content text-sm leading-relaxed focus:outline-none"
        :class="[activeColor.content, { 'cursor-text': isEditable }]"
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
              Kader (uitgelicht)
            </DialogTitle>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
                @click="closeModal"
              >
                <Icon name="material-symbols:close" class="size-5" />
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <p class="mb-3 text-sm font-medium text-gray-700">
                Kies een kleur
              </p>

              <div class="flex flex-wrap gap-3">
                <button
                  v-for="color in boxColors"
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
                    :class="color.swatch"
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
