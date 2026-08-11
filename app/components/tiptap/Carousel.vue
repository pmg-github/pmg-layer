<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/swiper-bundle.css";
import { Navigation } from "swiper/modules";
import type { BoArticleImageModel, FileButtonViewModel } from "models";

const ImageEditorModal = defineAsyncComponent(
  () => import("./ImageEditorModal.vue"),
);

const props = defineProps<NodeViewProps>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const isModalOpen = ref(false);
const isDragOver = ref(false);
const currentSlide = ref(0);
const prevButtonRef = ref<HTMLElement | null>(null);
const nextButtonRef = ref<HTMLElement | null>(null);

const images = computed<BoArticleImageModel[]>(
  () => (props.node.attrs.images as BoArticleImageModel[] | undefined) ?? [],
);

const imagesKey = computed(() =>
  images.value.map((image) => image.id).join("-"),
);
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
  isModalOpen.value = true;
};

const handleManageImages = async () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
};

const handleModalImagesUpdate = (newImages: BoArticleImageModel[]) => {
  props.updateAttributes({ images: [...newImages] });
};

const handleOpenManageModal = () => {
  if (!isEditable.value) return;
  isModalOpen.value = true;
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
  const imports = (await import("#imports")) as any;
  const articleStore = imports.useArticleStore?.();
  const fetched = await articleStore?.fetchImageCaptions?.([newImage]);
  const withCaptions =
    Array.isArray(fetched) && fetched.length ? fetched : [newImage];

  props.updateAttributes({
    images: [...images.value, ...withCaptions],
  });
};
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

    <ImageEditorModal
      v-if="isEditable && isModalOpen"
      :open="isModalOpen"
      :images="images"
      title="Fotocarrousel"
      description="Beheer de foto's in de carrousel"
      @update:open="isModalOpen = $event"
      @update:images="handleModalImagesUpdate"
    />
  </NodeViewWrapper>
</template>
