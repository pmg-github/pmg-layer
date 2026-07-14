<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import type { BoArticleImageModel } from "models";
import Modal from "../layout/Modal.vue";

const props = defineProps<NodeViewProps>();

const isEditable = computed(() => props.editor.isEditable ?? false);
const images = computed<BoArticleImageModel[]>(() => {
  return (props.node.attrs.images as BoArticleImageModel[] | undefined) ?? [];
});

const hasImages = computed(() => images.value.length > 0);
const hasMoreImages = computed(() => images.value.length > 3);
const remainingCount = computed(() => images.value.length - 3);

const gridClass = computed(() => {
  const count = images.value.length;
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid grid-cols-[2fr_1fr]";
});

const isManageOpen = ref(false);
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);
const activeLightboxImage = computed(() => images.value[lightboxIndex.value]);

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

const updateImage = (
  index: number,
  field: keyof BoArticleImageModel,
  value: string,
) => {
  if (!props.updateAttributes) return;

  props.updateAttributes({
    images: images.value.map((img, i) =>
      i === index ? { ...img, [field]: value } : img,
    ),
  });
};

const removeImage = (index: number) => {
  if (!props.updateAttributes) return;

  props.updateAttributes({
    images: images.value.filter((_, i) => i !== index),
  });
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

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <NodeViewWrapper class="mt-4 box-border w-full max-w-full">
    <div
      v-if="!hasImages"
      class="relative flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
        >
          Fotogallerij
        </span>
      </div>
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Nog geen foto's toegevoegd
      </h3>
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
          class="absolute right-2 top-2 z-[1] rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white hover:bg-gray-900"
          @click="isManageOpen = !isManageOpen"
        >
          Manage
        </button>
      </div>
    </div>

    <small>
      {{ images.length === 1 ? images[0]?.caption : "\u00A0" }}
      {{
        images.length === 1 && images[0]?.copyRight
          ? `© ${images[0].copyRight}`
          : ""
      }}
    </small>

    <Modal
      :open="isEditable && isManageOpen"
      title="Fotogallerij"
      size="2xl"
      @update:open="isManageOpen = $event"
    >
      <div class="mb-3 text-sm text-gray-600">{{ images.length }} images</div>

      <div v-if="!images.length" class="text-sm text-gray-500">No images.</div>

      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="mb-3 rounded border border-gray-200 p-2 last:mb-0"
      >
        <div class="mb-2 flex items-center gap-3">
          <img
            :src="image.url"
            :alt="image.altText || ''"
            class="size-12 rounded object-cover"
          />
          <button
            type="button"
            class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            @click="removeImage(index)"
          >
            Remove
          </button>
        </div>

        <div class="grid gap-2 md:grid-cols-2">
          <input
            :value="image.caption || ''"
            type="text"
            placeholder="Caption"
            class="rounded border border-gray-300 px-2 py-1 text-sm"
            @input="
              updateImage(
                index,
                'caption',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <input
            :value="image.altText || ''"
            type="text"
            placeholder="Alt text"
            class="rounded border border-gray-300 px-2 py-1 text-sm"
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

      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            class="rounded px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
            @click="isManageOpen = false"
          >
            Close
          </button>
        </div>
      </template>
    </Modal>

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
