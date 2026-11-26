<script setup lang="ts">
import MediaPlaceholder from "../blocks/shared/MediaPlaceholder.vue";
import VideoPlayer from "../VideoPlayer.vue";
import VideoLibraryButton from "./VideoLibraryButton.vue";

defineProps<{
  selected?: { value: string; key: string } | null;
  language?: string;
}>();
const emit = defineEmits<{
  "update:selected": [video: { value: string; key: string } | null];
}>();
</script>

<template>
  <div class="group relative">
    <div
      v-if="selected?.value"
      class="flex h-56 w-full items-center justify-center overflow-hidden rounded border border-gray-300 bg-gray-50"
    >
      <VideoPlayer
        class="h-full w-full"
        :key="selected.value"
        :video-id="selected.value"
        :language="language"
      />
    </div>
    <div v-else class="h-56 w-full overflow-hidden rounded-lg">
      <MediaPlaceholder kind="video" label="Geen video geselecteerd">
        <VideoLibraryButton
          variant="subtle"
          :show-selection="false"
          :language="language"
          @update:selected="emit('update:selected', $event)"
          >Video toevoegen</VideoLibraryButton
        >
      </MediaPlaceholder>
    </div>
    <div v-if="selected?.value" class="absolute right-2 top-2 flex gap-1">
      <VideoLibraryButton
        variant="subtle"
        :show-selection="false"
        :selected="selected"
        :language="language"
        @update:selected="emit('update:selected', $event)"
      />
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        title="Verwijderen"
        aria-label="Video verwijderen"
        @click.stop="emit('update:selected', null)"
      >
        <Icon name="material-symbols:delete" class="size-4" />
      </button>
    </div>
  </div>
</template>
