<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import type { BoArticleImageModel, FileButtonViewModel } from "models";
import { VueDraggableNext as Draggable } from "vue-draggable-next";
import { useArticleStore, useImageLibrary } from "#imports";
import Modal from "../Modal.vue";

const articleStore = useArticleStore();
const { pickImages, editImage } = useImageLibrary();

const props = defineProps<NodeViewProps>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const isManageOpen = ref(false);
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);
const isDragOver = ref(false);
const container = ref<HTMLElement | null>(null);
const modalImages = ref<BoArticleImageModel[]>([]);

const images = computed<BoArticleImageModel[]>(
  () => (props.node.attrs.images as BoArticleImageModel[] | undefined) ?? [],
);

const hasImages = computed(() => images.value.length > 0);
const hasMoreImages = computed(() => images.value.length > 3);
const remainingCount = computed(() => images.value.length - 3);
const activeLightboxImage = computed(() => images.value[lightboxIndex.value]);

const gridClass = computed(() => {
  const count = images.value.length;
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid grid-cols-[2fr_1fr]";
});

const handleSelectImages = async () => {
  try {
    const selectedImages = (await pickImages({
      folderId: 74,
      maxSelected: Infinity,
      jobCode: articleStore.metaData.jobCode,
    })) as FileButtonViewModel[];

    await onImagesSelected(selectedImages);
  } catch {
    // User cancelled
  }
};

const handleManageImages = async () => {
  try {
    const selectedImages = (await pickImages({
      folderId: 74,
      maxSelected: Infinity,
      jobCode: articleStore.metaData.jobCode,
      currentSelection: images.value,
    })) as FileButtonViewModel[];

    await onImagesSelected(selectedImages);
    modalImages.value = [...images.value];
  } catch {
    // User cancelled - keep modal open
  }
};

const handleReorder = () => {
  props.updateAttributes({ images: [...modalImages.value] });
};

const toBoImageModel = (
  image: FileButtonViewModel | BoArticleImageModel,
): BoArticleImageModel => ({
  id: image.id,
  url: image.url,
  copyRight: (image as BoArticleImageModel).copyRight ?? "",
  altText: (image as BoArticleImageModel).altText ?? "",
  caption: (image as BoArticleImageModel).caption ?? "",
});

const onImagesSelected = async (selectedImages: FileButtonViewModel[]) => {
  const newImages = selectedImages.map(toBoImageModel);

  if (!newImages.length) {
    props.updateAttributes({ images: [] });
    return;
  }

  const currentMap = new Map(images.value.map((image) => [image.id, image]));
  const brandNewImages = newImages.filter((image) => !currentMap.has(image.id));

  if (!brandNewImages.length) {
    props.updateAttributes({ images: newImages });
    return;
  }

  const withCaptions = await articleStore.fetchImageCaptions(brandNewImages);
  const captionMap = new Map(
    withCaptions.map((image: { id: any }) => [image.id, image]),
  );
  props.updateAttributes({
    images: newImages.map((image) => ({
      ...(captionMap.get(image.id) ?? currentMap.get(image.id) ?? image),
    })),
  });
};

const updateImageCaption = (id: number, caption: string) => {
  const index = modalImages.value.findIndex((image) => image.id === id);
  if (index === -1) return;

  const image = modalImages.value[index];
  if (!image) return;
  image.caption = caption;
  props.updateAttributes({ images: [...modalImages.value] });
};

const removeImage = (index: number) => {
  modalImages.value.splice(index, 1);
  props.updateAttributes({ images: [...modalImages.value] });
};

const handleEditImage = async (index: number) => {
  const currentImage = modalImages.value[index];
  if (!currentImage) return;

  try {
    const editedImage = (await editImage({
      image: currentImage,
      folderId: 74,
    })) as FileButtonViewModel | BoArticleImageModel | null;

    if (editedImage) {
      modalImages.value[index] = {
        ...modalImages.value[index],
        ...toBoImageModel(editedImage),
      };
      props.updateAttributes({ images: [...modalImages.value] });
    }
  } catch {
    // User cancelled editing
  }
};

const TILE_IMAGE_DRAG_TYPE = "application/x-tile-image";

const onDragOver = (event: DragEvent) => {
  if (!isEditable.value) return;
  if (!event.dataTransfer?.types.includes(TILE_IMAGE_DRAG_TYPE)) return;
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = async (event: DragEvent) => {
  isDragOver.value = false;
  const raw = event.dataTransfer?.getData(TILE_IMAGE_DRAG_TYPE);
  if (!raw) return;

  event.preventDefault();
  event.stopPropagation();

  const { id, url } = JSON.parse(raw) as { id: number; url: string };
  const newImage: BoArticleImageModel = {
    id,
    url,
    copyRight: "",
    altText: "",
    caption: "",
  };
  const withCaptions = await articleStore.fetchImageCaptions([newImage]);

  props.updateAttributes({
    images: [
      ...images.value,
      ...(withCaptions.length ? withCaptions : [newImage]),
    ],
  });
};

const openLightbox = (index: number) => {
  if (isEditable.value) return;
  lightboxIndex.value = index;
  isLightboxOpen.value = true;
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
};

const nextImage = () => {
  if (!images.value.length) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % images.value.length;
};

const prevImage = () => {
  if (!images.value.length) return;
  lightboxIndex.value =
    (lightboxIndex.value - 1 + images.value.length) % images.value.length;
};

const DRAG_SCROLL_ZONE = 200;
const DRAG_SCROLL_MAX_SPEED = 25;

let modalDragScrollRaf: number | null = null;
let modalDragScrollClientY: number | null = null;

const modalDragScrollStep = () => {
  if (
    !container.value ||
    modalDragScrollClientY === null ||
    !isManageOpen.value
  ) {
    modalDragScrollRaf = null;
    return;
  }

  const distFromTop = modalDragScrollClientY;
  const distFromBottom = window.innerHeight - modalDragScrollClientY;

  let speed = 0;
  if (distFromTop < DRAG_SCROLL_ZONE && distFromTop >= 0) {
    const intensity = 1 - distFromTop / DRAG_SCROLL_ZONE;
    speed = -intensity * DRAG_SCROLL_MAX_SPEED;
  } else if (distFromBottom < DRAG_SCROLL_ZONE && distFromBottom >= 0) {
    const intensity = 1 - distFromBottom / DRAG_SCROLL_ZONE;
    speed = intensity * DRAG_SCROLL_MAX_SPEED;
  }

  if (speed !== 0 && container.value) container.value.scrollTop += speed;
  modalDragScrollRaf = requestAnimationFrame(modalDragScrollStep);
};

const onModalDragOver = (event: DragEvent) => {
  if (!isManageOpen.value) return;
  event.preventDefault();
  event.stopPropagation();

  modalDragScrollClientY = event.clientY;
  if (modalDragScrollRaf === null) {
    modalDragScrollRaf = requestAnimationFrame(modalDragScrollStep);
  }
};

const stopModalDragScroll = () => {
  modalDragScrollClientY = null;
  if (modalDragScrollRaf !== null) {
    cancelAnimationFrame(modalDragScrollRaf);
    modalDragScrollRaf = null;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!isLightboxOpen.value || isEditable.value) return;

  if (event.key === "Escape") {
    closeLightbox();
    return;
  }

  if (event.key === "ArrowRight") {
    nextImage();
    return;
  }

  if (event.key === "ArrowLeft") {
    prevImage();
  }
};

watch(isManageOpen, (isOpen) => {
  if (isOpen) modalImages.value = [...images.value];
  else stopModalDragScroll();
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <NodeViewWrapper
    class="mt-4 box-border w-full max-w-full"
    :class="{
      'rounded-lg ring-2 ring-blue-400 ring-offset-2': isDragOver && isEditable,
    }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      v-if="!hasImages"
      class="relative flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <button
        v-if="isEditable"
        type="button"
        class="flex cursor-pointer flex-col items-center justify-center"
        @click="handleSelectImages"
      >
        <div class="absolute left-3 top-3">
          <span
            class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >
            Fotogallerij
          </span>
        </div>
        <Icon
          name="material-symbols:gallery-thumbnail"
          class="mb-4 size-12 text-gray-400"
        />
        <h3 class="mb-2 text-lg font-medium text-gray-700">
          Nog geen foto's toegevoegd
        </h3>
        <span
          class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Selecteer foto's
        </span>
      </button>
      <div v-else class="flex flex-col items-center justify-center">
        <div class="absolute left-3 top-3">
          <span
            class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >
            Fotogallerij
          </span>
        </div>
        <h3 class="text-lg font-medium text-gray-700">
          Nog geen foto's toegevoegd
        </h3>
      </div>
    </div>

    <div v-else class="w-full">
      <div class="relative aspect-video w-full overflow-hidden rounded-lg">
        <div class="grid h-full w-full gap-1" :class="gridClass">
          <div
            v-if="images.length >= 1"
            class="relative h-full w-full overflow-hidden rounded-lg"
            :class="{ 'cursor-pointer': !isEditable }"
            @click="openLightbox(0)"
          >
            <img
              :src="images[0]?.url"
              :alt="images[0]?.altText || 'Image 1'"
              class="h-full w-full bg-slate-100"
              :class="images.length === 1 ? 'object-contain' : 'object-cover'"
            />
          </div>

          <div
            v-if="images.length >= 2"
            class="flex h-full min-h-0 w-full flex-col gap-1"
          >
            <div
              v-if="images.length === 2"
              class="relative h-full w-full overflow-hidden rounded-lg"
              :class="{ 'cursor-pointer': !isEditable }"
              @click="openLightbox(1)"
            >
              <img
                :src="images[1]?.url"
                :alt="images[1]?.altText || 'Image 2'"
                class="h-full w-full object-cover"
              />
            </div>

            <template v-else>
              <div
                class="relative min-h-0 w-full flex-1 overflow-hidden rounded-lg"
                :class="{ 'cursor-pointer': !isEditable }"
                @click="openLightbox(1)"
              >
                <img
                  :src="images[1]?.url"
                  :alt="images[1]?.altText || 'Image 2'"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                class="relative min-h-0 w-full flex-1 overflow-hidden rounded-lg"
                :class="{ 'cursor-pointer': !isEditable }"
                @click="openLightbox(2)"
              >
                <img
                  :src="images[2]?.url"
                  :alt="images[2]?.altText || 'Image 3'"
                  class="h-full w-full object-cover"
                />
                <div
                  v-if="hasMoreImages"
                  class="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white"
                >
                  +{{ remainingCount }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <button
          v-if="isEditable"
          type="button"
          class="absolute right-2 top-2 z-[1] flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-sm text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          title="Manage images"
          @click="isManageOpen = true"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>

      <small>
        {{ images.length === 1 ? images[0]?.caption : "\u00A0" }}
        {{
          images.length === 1 && images[0]?.copyRight
            ? `© ${images[0].copyRight}`
            : ""
        }}
      </small>
    </div>

    <!-- Management Modal -->
    <Modal
      :open="isManageOpen && isEditable"
      :title="`Fotogallerij (${modalImages.length})`"
      size="5xl"
      @update:open="isManageOpen = $event"
      persistent
    >
      <div
        ref="container"
        class="max-h-[65vh] overflow-y-auto"
        @dragover="onModalDragOver"
        @drop="stopModalDragScroll"
        @dragend="stopModalDragScroll"
      >
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-gray-600">Beheer de foto's in de gallerij</p>
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="handleManageImages"
          >
            <Icon
              name="material-symbols:add"
              class="mr-1.5 inline-block size-4"
            />
            Foto's toevoegen
          </button>
        </div>

        <Draggable
          v-model="modalImages"
          handle=".drag-handle"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
          @end="handleReorder"
          @dragover.native="onModalDragOver"
        >
          <div
            v-for="(image, index) in modalImages"
            :key="image.id"
            class="group relative rounded-lg"
          >
            <div class="relative aspect-video">
              <img
                :src="image.url"
                alt=""
                class="h-full w-full rounded bg-gray-100 object-contain"
              />
              <div class="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  class="flex size-8 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
                  title="Bewerken"
                  @click="handleEditImage(index)"
                >
                  <Icon name="material-symbols:edit-outline" class="size-5" />
                </button>
                <button
                  type="button"
                  class="flex size-8 items-center justify-center rounded-full bg-gray-500 text-white group-hover:bg-red-500"
                  title="Verwijderen"
                  @click="removeImage(index)"
                >
                  <Icon name="material-symbols:delete" class="size-5" />
                </button>
              </div>
              <div
                class="drag-handle absolute left-2 top-2 flex cursor-move items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white"
              >
                <Icon name="material-symbols:drag-indicator" class="size-4" />
              </div>
            </div>
            <textarea
              v-model="image.caption"
              rows="3"
              placeholder="Caption (optioneel)"
              class="mt-1 w-full resize-none rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
              @input="updateImageCaption(image.id, image.caption)"
            />
          </div>
        </Draggable>
      </div>
    </Modal>

    <!-- Lightbox (readonly mode only) -->
    <div
      v-if="!isEditable && isLightboxOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      @click.self="closeLightbox"
    >
      <button
        type="button"
        class="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-2 text-sm text-white hover:bg-black/70"
        @click="closeLightbox"
      >
        Close
      </button>

      <button
        type="button"
        class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
        @click.stop="prevImage"
      >
        Prev
      </button>

      <div class="flex max-w-5xl flex-col items-center gap-3">
        <span class="rounded bg-black/40 px-3 py-1 text-sm text-white">
          {{ lightboxIndex + 1 }} / {{ images.length }}
        </span>
        <img
          :src="activeLightboxImage?.url"
          :alt="activeLightboxImage?.altText || activeLightboxImage?.caption"
          class="max-h-[75vh] max-w-full object-contain"
        />
        <p class="max-w-xl text-center text-sm text-white">
          {{ activeLightboxImage?.caption || activeLightboxImage?.altText }}
          {{
            activeLightboxImage?.copyRight
              ? ` © ${activeLightboxImage.copyRight}`
              : ""
          }}
        </p>
      </div>

      <button
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
        @click.stop="nextImage"
      >
        Next
      </button>
    </div>
  </NodeViewWrapper>
</template>
