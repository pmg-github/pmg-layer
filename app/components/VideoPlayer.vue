<script setup lang="ts">
import { ref, watch } from "vue";
import { useFetchVideos } from "../composables/useFetchVideos";

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
}

const props = withDefaults(
  defineProps<{
    videoId?: string | number | null;
    language?: string;
    autoplay?: boolean;
    muted?: boolean;
    portalCode?: string;
  }>(),
  {
    autoplay: false,
    muted: false,
  },
);

defineOptions({ inheritAttrs: false });

const { locale } = useI18n();
const { getVideo } = useFetchVideos();
const resolvedVideo = ref<VideoResponse | null>(null);
const isLoading = ref(false);
const videoNotFound = ref(false);
let requestId = 0;

watch(
  () =>
    [
      String(props.videoId ?? "").trim(),
      props.language || locale.value,
    ] as const,
  async ([reference, language]) => {
    const currentRequestId = ++requestId;
    resolvedVideo.value = null;
    videoNotFound.value = false;

    if (!reference) {
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    const match = reference.match(/^(.*?)[_-]([a-z]{2})$/i);
    const jobCode = match?.[1]?.trim() || reference;
    const videoLanguage = match?.[2]?.toLowerCase() || language;

    try {
      const video = (await getVideo(
        jobCode,
        videoLanguage,
      )) as VideoResponse | null;
      if (currentRequestId !== requestId) return;

      if (!video?.bunnyVideoId && !video?.sources?.length) {
        videoNotFound.value = true;
        return;
      }

      resolvedVideo.value = video;
    } catch {
      if (currentRequestId === requestId) videoNotFound.value = true;
    } finally {
      if (currentRequestId === requestId) isLoading.value = false;
    }
  },
  { immediate: true },
);

const embedUrl = computed(() => {
  if (!resolvedVideo.value?.bunnyVideoId) return "";

  const params = new URLSearchParams({
    autoplay: String(props.autoplay),
    muted: String(props.muted),
  });
  if (props.portalCode) params.set("data-theme", props.portalCode);

  return `https://player.mediadelivery.net/embed/698074/${resolvedVideo.value.bunnyVideoId}?${params.toString()}`;
});
</script>

<template>
  <div
    v-if="videoId"
    v-bind="$attrs"
    class="relative aspect-video w-full overflow-hidden bg-black"
  >
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center text-sm text-white/80"
      role="status"
    >
      Video laden...
    </div>
    <div
      v-else-if="videoNotFound"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-600"
      role="status"
    >
      Video niet beschikbaar
    </div>
    <iframe
      v-else-if="embedUrl"
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
      :title="`Video ${videoId}`"
    />
    <video
      v-else-if="resolvedVideo?.sources?.length"
      :autoplay="autoplay"
      :muted="muted"
      :poster="resolvedVideo.poster"
      controls
      class="absolute inset-0 h-full w-full"
    >
      <source
        v-for="(source, index) in resolvedVideo.sources"
        :key="index"
        :src="source.src"
        :type="source.type"
      />
      <track
        v-for="(track, index) in resolvedVideo.tracks"
        :key="index"
        :kind="track.kind"
        :src="track.src"
        :label="track.label"
        :srclang="track.srclang"
        :default="track.default"
      />
      Your browser does not support the video tag.
    </video>
  </div>
</template>
