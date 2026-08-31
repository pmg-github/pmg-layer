<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import Modal from "../Modal.vue";
import { useFetchVideos } from "~/composables/useFetchVideos";
interface VideoAttrs {
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
}

interface VideoExtensionOptions {
  portalCode?: string;
}

interface VideoResponse {
  bunnyVideoId?: string;
  sources?: Array<{ src?: string; type?: string }>;
  poster?: string;
  tracks?: Array<{
    kind?: string;
    src?: string;
    label?: string;
    srclang?: string;
    default?: boolean;
  }>;
  title?: string;
  jobCode?: string;
}

const props = defineProps<NodeViewProps>();

const BUNNY_LIBRARY_ID = "698074";
const { getVideo } = useFetchVideos();
const isEditable = computed(() => props.editor.isEditable ?? false);
const isEditing = ref(false);
const portalCode = computed(
  () =>
    (props.extension.options as VideoExtensionOptions | undefined)
      ?.portalCode ?? "",
);

const videoAttrs = computed<VideoAttrs>(() => props.node.attrs as VideoAttrs);

const videoId = computed(() => String(videoAttrs.value.videoId || ""));
const autoplay = computed(() => Boolean(videoAttrs.value.autoplay));
const muted = computed(() => Boolean(videoAttrs.value.muted));
const hasVideo = computed(() => !!videoId.value.trim());

const draftVideoId = ref("");
const draftAutoplay = ref(false);
const draftMuted = ref(false);

const resolvedVideo = ref<VideoResponse | null>(null);

const normalizeVideoReference = (reference: string) => {
  const trimmedReference = reference.trim();
  const match = trimmedReference.match(/^(.*?)[_-]([a-z]{2})$/i);

  const jobCode = match?.[1]?.trim();
  const language = match?.[2]?.toLowerCase();

  if (!jobCode || !language) {
    return {
      jobCode: trimmedReference,
    };
  }

  return {
    jobCode,
    language,
  };
};

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

  const { jobCode, language } = normalizeVideoReference(videoId.value);
  resolvedVideo.value = null;

  try {
    resolvedVideo.value = await getVideo(jobCode, language);
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

const hasNativeSources = computed(() => {
  return Boolean(resolvedVideo.value?.sources?.length);
});

const useBunnyPlayer = computed(() => {
  return Boolean(resolvedVideo.value?.bunnyVideoId);
});

const embedUrl = computed(() => {
  if (!resolvedVideo.value?.bunnyVideoId) return "";

  const params = new URLSearchParams();

  params.set("autoplay", String(autoplay.value));
  params.set("muted", String(muted.value));
  if (portalCode.value) {
    params.set("data-theme", portalCode.value);
  }

  return `https://player.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${resolvedVideo.value.bunnyVideoId}?${params.toString()}`;
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

const selectNode = () => {
  if (!isEditable.value) return;
  props.editor.commands.setNodeSelection(props.getPos());
};
</script>

<template>
  <NodeViewWrapper
    class="my-4 rounded-lg"
    :class="{ 'ring-2 ring-blue-500 ring-offset-2': props.selected }"
  >
    <div
      v-if="!hasVideo"
      class="relative flex aspect-video flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6"
      :class="{
        'cursor-pointer hover:border-blue-400 hover:bg-blue-50': isEditable,
      }"
      @click="selectNode"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Video</span
        >
      </div>

      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Geen video geselecteerd
      </h3>
      <p class="mb-4 text-center text-xs text-gray-400">
        Stel een video referentie in om deze blok weer te geven.
      </p>

      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        @click.stop="openEditor"
      >
        Video selecteren
      </button>
    </div>

    <div
      v-else
      class="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
    >
      <iframe
        v-if="useBunnyPlayer"
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

      <video
        v-else-if="hasNativeSources"
        :autoplay="autoplay"
        :muted="muted"
        :poster="resolvedVideo?.poster"
        controls
        class="absolute inset-0 h-full w-full"
      >
        <source
          v-for="(source, index) in resolvedVideo?.sources"
          :key="index"
          :src="source.src"
          :type="source.type"
        />
        <track
          v-for="(track, index) in resolvedVideo?.tracks"
          :key="index"
          :kind="track.kind"
          :src="track.src"
          :label="track.label"
          :srclang="track.srclang"
          :default="track.default"
        />
        Your browser does not support the video tag.
      </video>

      <button
        v-if="isEditable"
        type="button"
        class="absolute inset-0 z-[1] cursor-pointer"
        title="Video selecteren"
        aria-label="Video selecteren"
        @click.stop="selectNode"
      />

      <button
        v-if="isEditable"
        type="button"
        class="absolute right-2 top-2 z-[2] rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white hover:bg-gray-900"
        @click.stop="openEditor"
      >
        Edit
      </button>
    </div>

    <Modal
      :open="isEditable && isEditing"
      title="Video configureren"
      size="md"
      @update:open="isEditing = $event"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm text-gray-600"
            >Video referentie</label
          >
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
            verwijder
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
              @click="isEditing = false"
            >
              Annuleren
            </button>
            <button
              type="button"
              class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              :disabled="!draftVideoId.trim()"
              @click="applyVideo"
            >
              Toepassen
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </NodeViewWrapper>
</template>
