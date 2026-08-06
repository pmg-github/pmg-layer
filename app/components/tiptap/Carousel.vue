<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/swiper-bundle.css";
import { Navigation } from "swiper/modules";
import type { BoArticleImageModel, FileButtonViewModel } from "models";
import { VueDraggableNext as Draggable } from "vue-draggable-next";
import { useArticleStore, useImageLibrary } from "#imports";
import Modal from "../Modal.vue";

// Nuxt resolves the consuming app's store before the layer fallback.
const articleStore = useArticleStore();
const { pickImages, editImage } = useImageLibrary();

const props = defineProps<NodeViewProps>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const isModalOpen = ref(false);
const isDragOver = ref(false);
const currentSlide = ref(0);
const prevButtonRef = ref<HTMLElement | null>(null);
const nextButtonRef = ref<HTMLElement | null>(null);
const container = ref<{ scrollContainer: HTMLElement | null } | null>(null);

const images = computed<BoArticleImageModel[]>(
  () => (props.node.attrs.images as BoArticleImageModel[] | undefined) ?? [],
);

const imagesKey = computed(() =>
  images.value.map((image) => image.id).join("-"),
);
const modalImages = ref<BoArticleImageModel[]>([]);
const hasImages = computed(() => images.value.length > 0);

watch(
  () => images.value.length,
  (length) => {
    if (!length) {
      currentSlide.value = 0;
      return;
    }

    if (currentSlide.value >= length) currentSlide.value = length - 1;
  },
);

const handleSelectImages = async () => {
  if (!isEditable.value) return;

  try {
    const selectedImages = (await pickImages({
      folderId: 74,
      maxSelected: Infinity,
      jobCode: articleStore.metaData.jobCode,
    })) as FileButtonViewModel[];

    await onImagesSelected(selectedImages);
  } catch {
    // User cancelled - do nothing.
  }
};

const handleManageImages = async () => {
  if (!isEditable.value) return;

  try {
    const selectedImages = (await pickImages({
      folderId: 74,
      maxSelected: Infinity,
      jobCode: articleStore.metaData.jobCode,
      currentSelection: images.value,
    })) as FileButtonViewModel[] | null;

    if (!selectedImages) return;
    await onImagesSelected(selectedImages);
    await nextTick();
    modalImages.value = [...images.value];
  } catch {
    // User cancelled - do nothing.
  }
};

const handleReorder = () => {
  props.updateAttributes({ images: [...modalImages.value] });
};

const handleOpenManageModal = () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
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

    if (!editedImage) return;
    modalImages.value[index] = {
      ...modalImages.value[index],
      ...toBoImageModel(editedImage),
    };
    props.updateAttributes({ images: [...modalImages.value] });
  } catch {
    // User cancelled editing.
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
  if (!isEditable.value) return;
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

const DRAG_SCROLL_ZONE = 200;
const DRAG_SCROLL_MAX_SPEED = 25;

let modalDragScrollRaf: number | null = null;
let modalDragScrollClientY: number | null = null;
let isPageScrollLocked = false;
let previousHtmlOverflow = "";
let previousBodyOverflow = "";

const lockPageScroll = () => {
  if (isPageScrollLocked) return;

  previousHtmlOverflow = document.documentElement.style.overflow;
  previousBodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  isPageScrollLocked = true;
};

const unlockPageScroll = () => {
  if (!isPageScrollLocked) return;

  document.documentElement.style.overflow = previousHtmlOverflow;
  document.body.style.overflow = previousBodyOverflow;
  isPageScrollLocked = false;
};

const modalDragScrollStep = () => {
  const scrollContainer = container.value?.scrollContainer;

  if (
    !scrollContainer ||
    modalDragScrollClientY === null ||
    !isModalOpen.value
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

  if (speed !== 0) scrollContainer.scrollTop += speed;
  modalDragScrollRaf = requestAnimationFrame(modalDragScrollStep);
};

const onModalDragOver = (event: DragEvent) => {
  if (!isModalOpen.value) return;

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

const addFullScreenDragListeners = () => {
  window.addEventListener("dragover", onModalDragOver, true);
  window.addEventListener("drop", cleanupFullScreenDrag, true);
  window.addEventListener("dragend", cleanupFullScreenDrag, true);
};

const removeFullScreenDragListeners = () => {
  window.removeEventListener("dragover", onModalDragOver, true);
  window.removeEventListener("drop", cleanupFullScreenDrag, true);
  window.removeEventListener("dragend", cleanupFullScreenDrag, true);
};

function cleanupFullScreenDrag() {
  stopModalDragScroll();
  removeFullScreenDragListeners();
  unlockPageScroll();
}

const handleModalDragStart = () => {
  lockPageScroll();
  addFullScreenDragListeners();
};

const handleModalDragEnd = () => {
  handleReorder();
  cleanupFullScreenDrag();
};

watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    modalImages.value = [...images.value];
  } else {
    cleanupFullScreenDrag();
  }
});

onBeforeUnmount(() => {
  cleanupFullScreenDrag();
});
</script>

<template>
  <NodeViewWrapper
    class="my-4 box-border w-full max-w-full"
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
            Fotocarrousel
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
            Fotocarrousel
          </span>
        </div>
        <h3 class="text-lg font-medium text-gray-700">
          Nog geen foto's toegevoegd
        </h3>
      </div>
    </div>

    <div v-else class="w-full">
      <div class="relative aspect-video w-full overflow-hidden rounded-lg">
        <div v-if="isEditable" class="absolute inset-0 z-[2]" />
        <Swiper
          :key="imagesKey"
          :modules="[Navigation]"
          :space-between="16"
          :slides-per-view="1"
          :navigation="{ nextEl: nextButtonRef, prevEl: prevButtonRef }"
          :loop="true"
          :prevent-clicks-propagation="true"
          class="h-full w-full"
          @slide-change-transition-end="
            (swiper) => (currentSlide = swiper.realIndex)
          "
        >
          <SwiperSlide
            v-for="(image, index) in images"
            :key="image.id"
            class="flex h-full items-center justify-center bg-slate-50"
          >
            <img
              :src="image.url"
              :alt="image.altText || `Image ${index + 1}`"
              class="h-full w-full object-contain"
            />
          </SwiperSlide>
        </Swiper>

        <div
          v-if="images.length > 1"
          class="absolute inset-y-0 left-0 z-[3] flex items-center"
        >
          <button
            ref="prevButtonRef"
            type="button"
            class="ml-2 flex items-center justify-center rounded-full bg-black bg-opacity-50 p-2 text-white transition-opacity hover:bg-opacity-70 focus:outline-none"
            aria-label="Previous slide"
            @click.stop
          >
            <Icon name="material-symbols:chevron-left" class="size-8" />
          </button>
        </div>
        <div
          v-if="images.length > 1"
          class="absolute inset-y-0 right-0 z-[3] flex items-center"
        >
          <button
            ref="nextButtonRef"
            type="button"
            class="mr-2 flex items-center justify-center rounded-full bg-black bg-opacity-50 p-2 text-white transition-opacity hover:bg-opacity-70 focus:outline-none"
            aria-label="Next slide"
            @click.stop
          >
            <Icon name="material-symbols:chevron-right" class="size-8" />
          </button>
        </div>
        <div
          v-if="images.length > 1"
          class="absolute bottom-2 left-2 z-[3] rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
        >
          {{ currentSlide + 1 }} / {{ images.length }}
        </div>
        <div class="absolute right-2 top-2 z-[3] flex gap-2">
          <button
            v-if="isEditable"
            type="button"
            class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-sm text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            title="Manage images"
            @click.stop="handleOpenManageModal"
          >
            <Icon name="material-symbols:edit-outline" class="size-5" />
          </button>
        </div>
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
      :open="isModalOpen && isEditable"
      :title="`Fotocarrousel (${modalImages.length})`"
      size="5xl"
      @update:open="isModalOpen = $event"
      persistent
      ref="container"
    >
      <div>
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-gray-600">Beheer de foto's in de carrousel</p>
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
          @start="handleModalDragStart"
          @end="handleModalDragEnd"
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
  </NodeViewWrapper>
</template>
