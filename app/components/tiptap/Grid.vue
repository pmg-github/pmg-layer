<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import type { BoArticleImageModel } from "models";

const ImageEditorModal = defineAsyncComponent(
  () => import("./ImageEditorModal.vue"),
);

const props = defineProps<NodeViewProps>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const isModalOpen = ref(false);
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);
const isDragOver = ref(false);

const images = computed<BoArticleImageModel[]>(
  () => (props.node.attrs.images as BoArticleImageModel[] | undefined) ?? [],
);

const hasImages = computed(() => images.value.length > 0);
const MAX_VISIBLE = 6;
const visibleImages = computed(() =>
  images.value
    .map((image, originalIndex) => ({ ...image, originalIndex }))
    .slice(0, MAX_VISIBLE),
);
const remainingCount = computed(() =>
  Math.max(0, images.value.length - MAX_VISIBLE),
);
const activeLightboxImage = computed(() => images.value[lightboxIndex.value]);

const handleSelectImages = async () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
};

const handleManageImages = async () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
};

const handleModalImagesUpdate = (newImages: BoArticleImageModel[]) => {
  props.updateAttributes({ images: [...newImages] });
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
  if (!isEditable.value) return;

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
  const imports = (await import("#imports")) as any;
  const articleStore = imports.useArticleStore?.();
  const fetched = await articleStore?.fetchImageCaptions?.([newImage]);
  const withCaptions =
    Array.isArray(fetched) && fetched.length ? fetched : [newImage];

  props.updateAttributes({
    images: [...images.value, ...withCaptions],
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

const handleKeydown = (event: KeyboardEvent) => {
  if (!isLightboxOpen.value || isEditable.value) return;

  if (event.key === "Escape") closeLightbox();
  else if (event.key === "ArrowRight") nextImage();
  else if (event.key === "ArrowLeft") prevImage();
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <NodeViewWrapper
    class="relative my-4 box-border w-full max-w-full @container"
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
            Fotomozaïek
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
            Fotomozaïek
          </span>
        </div>
        <h3 class="text-lg font-medium text-gray-700">
          Nog geen foto's toegevoegd
        </h3>
      </div>
    </div>

    <div v-else class="relative grid gap-1 @md:grid-cols-2 @xl:grid-cols-3">
      <button
        v-if="isEditable"
        type="button"
        class="absolute right-2 top-2 z-[20] flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-sm text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        title="Manage images"
        @click.stop="isModalOpen = true"
      >
        <Icon name="material-symbols:edit-outline" class="size-5" />
      </button>

      <div
        v-for="(image, index) in visibleImages"
        :key="image.id"
        class="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:border-blue-300"
        :class="{ 'cursor-pointer': !isEditable }"
        @click="openLightbox(image.originalIndex)"
      >
        <img
          :src="image.url"
          :alt="image.altText || `Image ${image.originalIndex + 1}`"
          class="h-full w-full object-cover"
        />

        <div
          v-if="index === visibleImages.length - 1 && remainingCount > 0"
          class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/50 text-white"
        >
          <span class="text-2xl font-semibold">+{{ remainingCount }}</span>
        </div>
      </div>
    </div>

    <ImageEditorModal
      v-if="isEditable && isModalOpen"
      :open="isModalOpen"
      :images="images"
      title="Fotomozaiek"
      description="Beheer de foto's in het mozaiek"
      @update:open="isModalOpen = $event"
      @update:images="handleModalImagesUpdate"
    />

    <DialogRoot
      v-if="!isEditable"
      :open="isLightboxOpen"
      @update:open="isLightboxOpen = $event"
    >
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
        />

        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 flex max-h-[95vh] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 p-4 outline-none"
          @open-auto-focus.prevent
        >
          <DialogTitle class="sr-only">Afbeelding bekijken</DialogTitle>
          <DialogDescription class="sr-only">
            Afbeelding {{ lightboxIndex + 1 }} van {{ images.length }}
          </DialogDescription>

          <DialogClose
            class="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Sluiten"
          >
            <Icon name="material-symbols:close" class="size-6" />
          </DialogClose>

          <button
            v-if="images.length > 1"
            type="button"
            class="absolute left-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Vorige afbeelding"
            @click="prevImage"
          >
            <Icon name="material-symbols:chevron-left" class="size-7" />
          </button>

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

          <button
            v-if="images.length > 1"
            type="button"
            class="absolute right-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Volgende afbeelding"
            @click="nextImage"
          >
            <Icon name="material-symbols:chevron-right" class="size-7" />
          </button>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </NodeViewWrapper>
</template>
