<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";
import { computed, ref } from "vue";
import {
  DialogContent,
  DialogDescription,
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
  { name: "Grijs", value: "gray", wrapper: "border-gray-200 bg-gray-50" },
  { name: "Blauw", value: "blue", wrapper: "border-blue-200 bg-blue-50" },
  { name: "Groen", value: "green", wrapper: "border-green-200 bg-green-50" },
  {
    name: "Oranje",
    value: "orange",
    wrapper: "border-orange-200 bg-orange-50",
  },
];

const selectedColor = computed({
  get: () => props.node.attrs.color ?? "gray",
  set: (value: string) => props.updateAttributes({ color: value }),
});

const activeColor = computed(
  () => boxColors.find((c) => c.value === selectedColor.value) ?? boxColors[0]!,
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
    class="mt-4 box-border w-full max-w-full rounded-lg border p-1"
    :class="[activeColor.wrapper, { 'cursor-pointer': isEditable }]"
    @click="selectNodeFromBackground"
  >
    <div class="relative min-h-24 p-8">
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
        class="focus:outline-none"
        :class="{ 'cursor-text': isEditable }"
      />
    </div>

    <DialogRoot :open="isModalOpen" @update:open="isModalOpen = $event">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/60" />
        <DialogContent
          class="fixed left-1/2 top-16 z-50 max-h-[calc(100vh-5rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-xl bg-white shadow-xl focus:outline-none"
        >
          <div class="flex items-start gap-3 border-b border-gray-100 p-5">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700"
            >
              <Icon name="material-symbols:highlight-outline" class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <DialogTitle class="text-lg font-semibold text-gray-900">
                Kader (uitgelicht)
              </DialogTitle>
              <DialogDescription class="text-sm text-gray-500">
                Zet extra informatie in de kijker binnen het artikel.
              </DialogDescription>
            </div>
            <button
              type="button"
              class="flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Sluiten"
              @click="closeModal"
            >
              <Icon name="material-symbols:close" class="size-5" />
            </button>
          </div>

          <div class="p-5">
            <p class="mb-3 text-sm font-medium text-gray-700">Kleur</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="color in boxColors"
                :key="color.value"
                type="button"
                class="flex items-center gap-3 rounded-lg border p-2.5 text-left text-sm transition"
                :class="
                  selectedColor === color.value
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                "
                :aria-pressed="selectedColor === color.value"
                @click="selectedColor = color.value"
              >
                <span
                  class="size-8 shrink-0 rounded-md border"
                  :class="color.wrapper"
                />
                <span class="flex-1 font-medium text-gray-800">
                  {{ color.name }}
                </span>
                <Icon
                  v-if="selectedColor === color.value"
                  name="material-symbols:check-rounded"
                  class="size-5 text-blue-600"
                />
              </button>
            </div>
          </div>

          <div class="flex justify-end border-t border-gray-100 p-4">
            <button
              type="button"
              class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
