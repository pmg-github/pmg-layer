<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { VueDraggableNext as Draggable } from "vue-draggable-next";
import type { BoArticleImageModel } from "models";
import { useImagePicker } from "#imports";
import Modal from "../Modal.vue";

type PickerImage = Pick<BoArticleImageModel, "id" | "url"> &
  Partial<BoArticleImageModel>;

const props = defineProps<NodeViewProps>();
const { pickImages, editImage } = useImagePicker();

const isEditable = computed(() => props.editor.isEditable ?? false);
const isModalOpen = ref(false);
const isDragOver = ref(false);
const currentSlide = ref(0);
const prevButtonRef = ref<HTMLElement | null>(null);
const nextButtonRef = ref<HTMLElement | null>(null);
const modalImages = ref<BoArticleImageModel[]>([]);

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
    if (!length) currentSlide.value = 0;
    else if (currentSlide.value >= length) currentSlide.value = length - 1;
  },
);

watch(isModalOpen, (isOpen) => {
  if (isOpen) modalImages.value = [...images.value];
});

const toBoImageModel = (image: PickerImage): BoArticleImageModel => ({
  ...image,
  id: image.id,
  url: image.url,
  copyRight: image.copyRight ?? "",
  altText: image.altText ?? "",
  caption: image.caption ?? "",
});

const applySelectedImages = (selectedImages: PickerImage[]) => {
  const currentMap = new Map(images.value.map((image) => [image.id, image]));
  const nextImages = selectedImages.map((image) =>
    toBoImageModel({ ...currentMap.get(image.id), ...image }),
  );

  props.updateAttributes({ images: nextImages });
  modalImages.value = [...nextImages];
};

const handleSelectImages = async () => {
  try {
    const selectedImages = (await pickImages({
      folderId: 74,
      maxSelected: Infinity,
    })) as PickerImage[];
    applySelectedImages(selectedImages);
  } catch {
    // The consuming picker may reject when the user cancels.
  }
};

const handleManageImages = async () => {
  try {
    const selectedImages = (await pickImages({
      folderId: 74,
      maxSelected: Infinity,
      currentSelection: images.value,
    })) as PickerImage[];
    applySelectedImages(selectedImages);
  } catch {
    // Keep the carousel modal open when the user cancels.
  }
};

const handleReorder = () => {
  props.updateAttributes({ images: [...modalImages.value] });
};

const updateImageCaption = (id: number, caption: string) => {
  const image = modalImages.value.find((item) => item.id === id);
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
    })) as PickerImage | null;
    if (!editedImage) return;

    modalImages.value[index] = toBoImageModel({
      ...currentImage,
      ...editedImage,
    });
    props.updateAttributes({ images: [...modalImages.value] });
  } catch {
    // The consuming image editor may reject when the user cancels.
  }
};

const TILE_IMAGE_DRAG_TYPE = "application/x-tile-image";

const onDragOver = (event: DragEvent) => {
  if (!event.dataTransfer?.types.includes(TILE_IMAGE_DRAG_TYPE)) return;
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const raw = event.dataTransfer?.getData(TILE_IMAGE_DRAG_TYPE);
  if (!raw) return;

  event.preventDefault();
  event.stopPropagation();

  try {
    const image = JSON.parse(raw) as PickerImage;
    props.updateAttributes({
      images: [...images.value, toBoImageModel(image)],
    });
  } catch {
    // Ignore malformed drag payloads from outside the image tile system.
  }
};
</script>

<template>
  <NodeViewWrapper
    class="my-4 box-border w-full max-w-full"
    :class="{ 'rounded-lg ring-2 ring-blue-400 ring-offset-2': isDragOver }"
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
        <span
          class="absolute left-3 top-3 rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
        >
          Fotocarrousel
        </span>
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
      <p v-else class="text-gray-500">Nog geen foto's toegevoegd</p>
    </div>

    <div v-else class="w-full">
      <div class="relative aspect-video w-full overflow-hidden rounded-lg">
        <div class="absolute inset-0 z-[2]" />
        <Swiper
          :key="imagesKey"
          :modules="[Navigation]"
          :space-between="16"
          :slides-per-view="1"
          :navigation="{ nextEl: nextButtonRef, prevEl: prevButtonRef }"
          :loop="images.length > 1"
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
            class="ml-2 flex items-center justify-center rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none"
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
            class="mr-2 flex items-center justify-center rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none"
            aria-label="Next slide"
            @click.stop
          >
            <Icon name="material-symbols:chevron-right" class="size-8" />
          </button>
        </div>
        <span
          v-if="images.length > 1"
          class="absolute bottom-2 left-2 z-[3] rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
        >
          {{ currentSlide + 1 }} / {{ images.length }}
        </span>
        <button
          v-if="isEditable"
          type="button"
          class="absolute right-2 top-2 z-[3] flex items-center justify-center rounded-full bg-gray-800/70 p-2 text-white hover:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-white"
          title="Manage images"
          @click.stop="isModalOpen = true"
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
      :open="isEditable && isModalOpen"
      size="5xl"
      @update:open="isModalOpen = $event"
    >
      <template #header>
        <h3 class="text-xl font-bold">
          Fotocarrousel ({{ modalImages.length }})
        </h3>
      </template>

      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-gray-600">Beheer de foto's in de carrousel</p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="handleManageImages"
        >
          <Icon name="material-symbols:add" class="mr-1.5 inline-block size-4" />
          Foto's toevoegen
        </button>
      </div>

      <Draggable
        v-model="modalImages"
        :animation="200"
        :scroll="true"
        :scroll-sensitivity="120"
        :scroll-speed="18"
        handle=".drag-handle"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
        @end="handleReorder"
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
            <div class="absolute right-2 top-2 flex flex-col gap-2">
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
                class="flex size-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                title="Verwijderen"
                @click="removeImage(index)"
              >
                <Icon name="material-symbols:close" class="size-5" />
              </button>
            </div>
            <div
              class="drag-handle absolute left-2 top-2 flex cursor-move items-center rounded-full bg-black/60 px-2 py-1 text-white"
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

      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="isModalOpen = false"
          >
            Sluiten
          </button>
        </div>
      </template>
    </Modal>
  </NodeViewWrapper>
</template>
