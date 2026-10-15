<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    kind?: "image" | "video";
    label?: string;
    description?: string;
    actionLabel?: string;
  }>(),
  { kind: "image" },
);
const emit = defineEmits<{ action: [] }>();
const title = computed(
  () =>
    props.label ||
    (props.kind === "video" ? "Video toevoegen" : "Afbeelding toevoegen"),
);
</script>

<template>
  <div
    data-media-placeholder
    :data-media-kind="kind"
    class="flex h-full min-h-0 w-full flex-col items-center justify-center gap-2 rounded-[inherit] border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-gray-600"
    role="group"
    :aria-label="title"
  >
    <Icon
      :name="
        kind === 'video'
          ? 'material-symbols:video-library-outline-rounded'
          : 'material-symbols:add-photo-alternate-outline-rounded'
      "
      class="size-7 shrink-0 text-gray-400"
      aria-hidden="true"
    />
    <p class="m-0 text-sm font-semibold leading-5">{{ title }}</p>
    <p v-if="description" class="m-0 max-w-sm text-xs leading-5 text-gray-500">
      {{ description }}
    </p>
    <slot>
      <button
        v-if="actionLabel"
        type="button"
        class="mt-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        @click.stop.prevent="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </slot>
  </div>
</template>
