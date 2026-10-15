<script setup lang="ts">
import MediaPlaceholder from "./MediaPlaceholder.vue";

withDefaults(
  defineProps<{
    empty?: boolean;
    editable?: boolean;
    kind?: "image" | "video";
    ratio?: "video" | "photo" | "square" | "fixed";
  }>(),
  { kind: "image", ratio: "video" },
);
</script>

<template>
  <div
    v-if="editable || !empty"
    data-media-frame
    :data-media-kind="kind"
    class="relative w-full shrink-0 overflow-hidden bg-gray-50"
    :class="{
      'aspect-video': ratio === 'video',
      'aspect-[4/3]': ratio === 'photo',
      'aspect-square': ratio === 'square',
      'h-56': ratio === 'fixed',
    }"
  >
    <div class="media-frame-content absolute inset-0">
      <slot v-if="!empty" />
      <slot v-else name="empty"><MediaPlaceholder :kind="kind" /></slot>
    </div>
  </div>
</template>

<style scoped>
.media-frame-content > :deep(*) {
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
}
</style>
