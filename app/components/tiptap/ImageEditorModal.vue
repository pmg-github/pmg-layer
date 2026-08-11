<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { VueDraggableNext as Draggable } from "vue-draggable-next";
import type { BoArticleImageModel, FileButtonViewModel } from "models";
import Modal from "../Modal.vue";

type Props = {
  open: boolean;
  images: BoArticleImageModel[];
  title?: string;
  description?: string;
};

const props = withDefaults(defineProps<Props>(), {
  title: "Fotocarrousel",
  description: "Beheer de foto's",
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:images": [images: BoArticleImageModel[]];
}>();

const container = ref<{ scrollContainer: HTMLElement | null } | null>(null);
const modalImages = ref<BoArticleImageModel[]>([]);

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
    emit("update:images", []);
    return;
  }

  const currentMap = new Map(
    modalImages.value.map((image) => [image.id, image]),
  );
  const brandNewImages = newImages.filter((image) => !currentMap.has(image.id));

  if (!brandNewImages.length) {
    emit("update:images", newImages);
    modalImages.value = [...newImages];
    return;
  }

  const imports = (await import("#imports")) as any;
  const articleStore = imports.useArticleStore?.();
  const fetched = (await articleStore?.fetchImageCaptions?.(brandNewImages)) as
    | BoArticleImageModel[]
    | undefined;
  const withCaptions: BoArticleImageModel[] =
    Array.isArray(fetched) && fetched.length ? fetched : brandNewImages;
  const captionMap = new Map<number, BoArticleImageModel>(
    withCaptions.map((image) => [image.id, image]),
  );

  const mergedImages: BoArticleImageModel[] = [];
  for (const image of newImages) {
    const nextImage = (captionMap.get(image.id) ??
      currentMap.get(image.id) ??
      toBoImageModel(image)) as BoArticleImageModel;

    mergedImages.push({
      id: nextImage.id,
      url: nextImage.url,
      copyRight: nextImage.copyRight ?? "",
      altText: nextImage.altText ?? "",
      caption: nextImage.caption ?? "",
    });
  }

  emit("update:images", mergedImages);
  modalImages.value = [...mergedImages];
};

const handleManageImages = async () => {
  try {
    const imports = (await import("#imports")) as any;
    const articleStore = imports.useArticleStore?.();
    const imageLibrary = imports.useImageLibrary?.();
    const selectedImages = await imageLibrary?.pickImages?.({
      folderId: 74,
      maxSelected: Infinity,
      jobCode: articleStore?.metaData?.jobCode,
      currentSelection: modalImages.value,
    });

    if (!selectedImages) return;
    await onImagesSelected(selectedImages);
    await nextTick();
  } catch {
    // User cancelled - do nothing.
  }
};

const handleReorder = () => {
  emit("update:images", [...modalImages.value]);
};

const updateImageCaption = (id: number, caption: string) => {
  const index = modalImages.value.findIndex((image) => image.id === id);
  if (index === -1) return;

  const image = modalImages.value[index];
  if (!image) return;

  image.caption = caption;
  emit("update:images", [...modalImages.value]);
};

const removeImage = (index: number) => {
  modalImages.value.splice(index, 1);
  emit("update:images", [...modalImages.value]);
};

const handleEditImage = async (index: number) => {
  const currentImage = modalImages.value[index];
  if (!currentImage) return;

  try {
    const imports = (await import("#imports")) as any;
    const imageLibrary = imports.useImageLibrary?.();
    const editedImage = await imageLibrary?.editImage?.({
      image: currentImage,
      folderId: 74,
    });

    if (!editedImage) return;
    modalImages.value[index] = {
      ...modalImages.value[index],
      ...toBoImageModel(editedImage),
    };
    emit("update:images", [...modalImages.value]);
  } catch {
    // User cancelled editing.
  }
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

  if (!scrollContainer || modalDragScrollClientY === null || !props.open) {
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
  if (!props.open) return;

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

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      modalImages.value = [...props.images];
    } else {
      cleanupFullScreenDrag();
    }
  },
  { immediate: true },
);

watch(
  () => props.images,
  (nextImages) => {
    if (!props.open) return;
    modalImages.value = [...nextImages];
  },
);

onBeforeUnmount(() => {
  cleanupFullScreenDrag();
});
</script>

<template>
  <Modal
    :open="props.open"
    :title="`${props.title} (${modalImages.length})`"
    size="5xl"
    @update:open="emit('update:open', $event)"
    persistent
    ref="container"
  >
    <div>
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-gray-600">{{ props.description }}</p>
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
</template>
