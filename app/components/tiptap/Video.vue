<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import Modal from "../layout/Modal.vue";

interface VideoAttrs {
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
}

const props = defineProps<NodeViewProps>();

const BUNNY_LIBRARY_ID = "698074";
const { getVideo } = useFetchVideos();

const isEditable = computed(() => props.editor.isEditable ?? false);
const isEditing = ref(false);

const videoAttrs = computed<VideoAttrs>(() => props.node.attrs as VideoAttrs);

const videoId = computed(() => String(videoAttrs.value.videoId || ""));
const autoplay = computed(() => Boolean(videoAttrs.value.autoplay));
const muted = computed(() => Boolean(videoAttrs.value.muted));
const hasVideo = computed(() => !!videoId.value.trim());

const draftVideoId = ref("");
const draftAutoplay = ref(false);
const draftMuted = ref(false);

const resolvedVideo = ref<{
  bunnyVideoId?: string;
  sources?: Array<{ url?: string }>;
} | null>(null);

const appendQuery = (baseUrl: string, params: URLSearchParams) => {
  if (!baseUrl) {
    return "";
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${params.toString()}`;
};

const loadVideo = async () => {
  if (!videoId.value) {
    resolvedVideo.value = null;
    return;
  }

  try {
    resolvedVideo.value = await getVideo(videoId.value);
  } catch {
    resolvedVideo.value = null;
  }
};

watch(
  videoId,
  () => {
    loadVideo();
  },
  { immediate: true },
);

const embedUrl = computed(() => {
  if (!videoId.value) return "";

  const params = new URLSearchParams();
  if (autoplay.value) params.set("autoplay", "true");
  if (muted.value) params.set("muted", "true");

  if (resolvedVideo.value?.bunnyVideoId) {
    return `https://player.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${resolvedVideo.value.bunnyVideoId}?${params.toString()}`;
  }

  const fallbackSource = resolvedVideo.value?.sources?.[0]?.url;
  if (fallbackSource) {
    return appendQuery(fallbackSource, params);
  }

  return `https://player.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId.value}?${params.toString()}`;
});

const openEditor = () => {
  if (!isEditable.value) return;
  draftVideoId.value = videoId.value;
  draftAutoplay.value = autoplay.value;
  draftMuted.value = muted.value;
  isEditing.value = true;
};

const applyVideo = () => {
  const trimmed = draftVideoId.value.trim();
  if (!trimmed || !props.updateAttributes) return;

  props.updateAttributes({
    videoId: trimmed,
    autoplay: draftAutoplay.value,
    muted: draftMuted.value,
  });

  isEditing.value = false;
};

const clearVideo = () => {
  if (props.deleteNode) {
    props.deleteNode();
    isEditing.value = false;
    return;
  }

  if (props.updateAttributes) {
    props.updateAttributes({
      videoId: "",
      autoplay: false,
      muted: false,
    });
  }

  isEditing.value = false;
};
</script>

<template>
  <NodeViewWrapper class="my-4">
    <div
      v-if="!hasVideo"
      class="relative flex aspect-video flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6"
      :class="{
        'cursor-pointer hover:border-blue-400 hover:bg-blue-50': isEditable,
      }"
      @click="openEditor"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Video</span
        >
      </div>

      <h3 class="mb-2 text-lg font-medium text-gray-700">No video selected</h3>
      <p class="mb-4 text-center text-xs text-gray-400">
        Set a video reference (for example a job code) to render this block.
      </p>

      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        @click.stop="openEditor"
      >
        Configure video
      </button>
    </div>

    <div
      v-else
      class="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
    >
      <iframe
        :src="embedUrl"
        class="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allow="
          accelerometer;
          gyroscope;
          autoplay;
          encrypted-media;
          picture-in-picture;
        "
        allowfullscreen
      />

      <button
        v-if="isEditable"
        type="button"
        class="absolute right-2 top-2 z-[1] rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white hover:bg-gray-900"
        @click.stop="openEditor"
      >
        Edit
      </button>
    </div>

    <Modal
      :open="isEditable && isEditing"
      title="Configure video"
      size="md"
      @update:open="isEditing = $event"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm text-gray-600">Video reference</label>
          <input
            v-model="draftVideoId"
            type="text"
            placeholder="For example: 123456 or JOB-001"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div class="flex items-center gap-6">
          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input v-model="draftAutoplay" type="checkbox" />
            Autoplay
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input v-model="draftMuted" type="checkbox" />
            Muted
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="rounded px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            @click="clearVideo"
          >
            Remove
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
              @click="isEditing = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              :disabled="!draftVideoId.trim()"
              @click="applyVideo"
            >
              Apply
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </NodeViewWrapper>
</template>
