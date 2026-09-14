<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableInfiniteProps {
  /**
   * Number of columns to span (should match the table's column count).
   */
  colspan: number;
  /**
   * Whether a subsequent page is currently being fetched.
   * @default false
   */
  loadingMore?: boolean;
  /**
   * Whether more pages are available. When false, the sentinel is not observed.
   * @default false
   */
  canLoadMore?: boolean;
  /**
   * `rootMargin` passed to the IntersectionObserver, controlling how far
   * before the sentinel is visible that `load-more` fires.
   * @default '200px'
   */
  rootMargin?: string;
  /**
   * Default text shown while `loadingMore` is true.
   */
  loadingText?: string;
  /**
   * Additional CSS classes for the td element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableInfiniteProps>(), {
  loadingMore: false,
  canLoadMore: false,
  rootMargin: "200px",
  loadingText: "Loading more...",
});

const emit = defineEmits<{
  (e: "load-more"): void;
}>();

const infiniteEl = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function connectObserver() {
  disconnectObserver();
  if (!props.canLoadMore || !infiniteEl.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) emit("load-more");
    },
    { rootMargin: props.rootMargin },
  );
  observer.observe(infiniteEl.value);
}

function disconnectObserver() {
  observer?.disconnect();
  observer = null;
}

onMounted(connectObserver);
onBeforeUnmount(disconnectObserver);
watch(() => props.canLoadMore, connectObserver);

const cellClasses = computed(() =>
  twMerge("py-4 text-center text-sm text-gray-500", props.class),
);
</script>

<template>
  <tr v-if="canLoadMore || loadingMore">
    <td ref="infiniteEl" :colspan="colspan" :class="cellClasses">
      <slot v-if="loadingMore" name="loading">{{ loadingText }}</slot>
      <slot v-else name="idle" />
    </td>
  </tr>
</template>
