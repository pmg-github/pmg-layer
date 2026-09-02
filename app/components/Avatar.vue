<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    fallback?: string;
  }>(),
  {
    src: null,
    alt: "",
    fallback: "",
  },
);

const imageFailed = ref(false);

watch(
  () => props.src,
  () => {
    imageFailed.value = false;
  },
);
</script>

<template>
  <div
    v-bind="$attrs"
    class="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200"
  >
    <img
      v-if="props.src && !imageFailed"
      :src="props.src"
      :alt="props.alt"
      class="h-full w-full object-cover"
      @error="imageFailed = true"
    />
    <span
      v-else
      class="flex h-full w-full items-center justify-center text-xs text-gray-600"
      :aria-label="props.alt"
    >
      {{ props.fallback }}
    </span>
  </div>
</template>
