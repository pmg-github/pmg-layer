<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import type { BoArticleImageModel } from "models";
import Modal from "../Modal.vue";

type PickerImage = Pick<BoArticleImageModel, "id" | "url"> &
  Partial<BoArticleImageModel>;

const props = defineProps<NodeViewProps>();
const { pickImages } = useImagePicker();

const isEditable = computed(() => props.editor.isEditable ?? false);
const images = computed<BoArticleImageModel[]>(
  () => (props.node.attrs.images as BoArticleImageModel[] | undefined) ?? [],
);
const hasImages = computed(() => images.value.length > 0);
const currentSlide = ref(0);
const isManageOpen = ref(false);
const draggedIndex = ref<number | null>(null);

const normalizeImage = (image: PickerImage): BoArticleImageModel => ({
  ...image,
  id: image.id,
  url: image.url,
  copyRight: image.copyRight ?? "",
  altText: image.altText ?? "",
  caption: image.caption ?? "",
});

watch(
  () => images.value.length,
  (length) => {
    if (!length) currentSlide.value = 0;
    else if (currentSlide.value >= length) currentSlide.value = length - 1;
  },
);

const selectImages = async () => {
  const selected = (await pickImages({
    maxSelected: Infinity,
    currentSelection: images.value,
  })) as PickerImage[];

  const currentById = new Map(images.value.map((image) => [image.id, image]));
  props.updateAttributes({
    images: selected.map((image) =>
      normalizeImage({ ...currentById.get(image.id), ...image }),
    ),
  });
};

const safelySelectImages = async () => {
  try {
    await selectImages();
  } catch (error) {
    // Picker implementations may reject when the user cancels. Surface actual
    // integration errors while leaving cancellation handling to the consumer.
    if (error instanceof Error && error.message.includes("not implemented")) {
      throw error;
    }
  }
};

const previousSlide = () => {
  if (!images.value.length) return;
  currentSlide.value =
    (currentSlide.value - 1 + images.value.length) % images.value.length;
};

const nextSlide = () => {
  if (!images.value.length) return;
  currentSlide.value = (currentSlide.value + 1) % images.value.length;
};

const updateImage = (
  index: number,
  field: "caption" | "altText",
  value: string,
) => {
  props.updateAttributes({
    images: images.value.map((image, imageIndex) =>
      imageIndex === index ? { ...image, [field]: value } : image,
    ),
  });
};

const removeImage = (index: number) => {
  props.updateAttributes({
    images: images.value.filter((_, imageIndex) => imageIndex !== index),
  });
};

const startDrag = (index: number) => {
  draggedIndex.value = index;
};

const dropAt = (targetIndex: number) => {
  const sourceIndex = draggedIndex.value;
  draggedIndex.value = null;
  if (sourceIndex === null || sourceIndex === targetIndex) return;

  const reordered = [...images.value];
  const [moved] = reordered.splice(sourceIndex, 1);
  if (!moved) return;
  reordered.splice(targetIndex, 0, moved);
  props.updateAttributes({ images: reordered });
};
</script>

<template>
  <NodeViewWrapper class="my-4 box-border w-full max-w-full">
    <div
      v-if="!hasImages"
      class="relative flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6"
    >
      <span
        class="absolute left-3 top-3 rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
      >
        Fotocarrousel
      </span>
      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        @click="safelySelectImages"
      >
        Selecteer foto's
      </button>
      <p v-else class="text-gray-500">Nog geen foto's toegevoegd</p>
    </div>

    <div v-else class="w-full">
      <div class="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-50">
        <img
          :src="images[currentSlide]?.url"
          :alt="images[currentSlide]?.altText || `Image ${currentSlide + 1}`"
          class="h-full w-full object-contain"
        />

        <template v-if="images.length > 1">
          <button
            type="button"
            class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Previous slide"
            @click.stop="previousSlide"
          >
            <Icon name="material-symbols:chevron-left" class="size-8" />
          </button>
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Next slide"
            @click.stop="nextSlide"
          >
            <Icon name="material-symbols:chevron-right" class="size-8" />
          </button>
          <span
            class="absolute bottom-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
          >
            {{ currentSlide + 1 }} / {{ images.length }}
          </span>
        </template>

        <button
          v-if="isEditable"
          type="button"
          class="absolute right-2 top-2 rounded-full bg-gray-900/70 p-2 text-white hover:bg-gray-900"
          title="Manage images"
          @click.stop="isManageOpen = true"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>

      <small>
        {{ images[currentSlide]?.caption || "\u00A0" }}
        {{
          images[currentSlide]?.copyRight
            ? `© ${images[currentSlide]?.copyRight}`
            : ""
        }}
      </small>
    </div>

    <Modal
      :open="isEditable && isManageOpen"
      :title="`Fotocarrousel (${images.length})`"
      size="2xl"
      @update:open="isManageOpen = $event"
    >
      <div class="mb-4 flex justify-end">
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="safelySelectImages"
        >
          Foto's beheren
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="(image, index) in images"
          :key="image.id"
          draggable="true"
          class="rounded-lg border border-gray-200 p-2"
          @dragstart="startDrag(index)"
          @dragover.prevent
          @drop.prevent="dropAt(index)"
        >
          <div class="relative aspect-video">
            <img
              :src="image.url"
              :alt="image.altText || ''"
              class="h-full w-full rounded bg-gray-100 object-contain"
            />
            <span
              class="absolute left-2 top-2 cursor-move rounded-full bg-black/60 px-2 py-1 text-xs text-white"
            >
              <Icon name="material-symbols:drag-indicator" class="size-4" />
            </span>
            <button
              type="button"
              class="absolute right-2 top-2 rounded-full bg-gray-600 p-1.5 text-white hover:bg-red-500"
              title="Verwijderen"
              @click="removeImage(index)"
            >
              <Icon name="material-symbols:delete" class="size-5" />
            </button>
          </div>

          <textarea
            :value="image.caption || ''"
            rows="2"
            placeholder="Caption (optioneel)"
            class="mt-2 w-full resize-none rounded border border-gray-300 px-2 py-1 text-xs"
            @input="
              updateImage(
                index,
                'caption',
                ($event.target as HTMLTextAreaElement).value,
              )
            "
          />
          <input
            :value="image.altText || ''"
            type="text"
            placeholder="Alt text"
            class="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs"
            @input="
              updateImage(
                index,
                'altText',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
      </div>
    </Modal>
  </NodeViewWrapper>
</template>
