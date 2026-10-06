<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

type LinkItem = { url: string; label?: string };

const props = defineProps<{
  images: string[];
  title?: string;
  subtitle?: string;
}>();

const images = props.images || [];
const title = props.title || '';
const subtitle = props.subtitle || '';

const selectedIndex = ref<number | null>(null);
const loadingImage = ref(false);
let loadTimer: number | null = null;
const loadTimeoutMs = 8000;

function isVideo(url: string): boolean {
  return url.toLowerCase().endsWith('.mp4');
}

function clearLoadTimer() {
  if (loadTimer) {
    window.clearTimeout(loadTimer);
    loadTimer = null;
  }
}

// touch swipe
let touchStartX = 0;
let touchDeltaX = 0;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches?.[0]?.clientX || 0;
  touchDeltaX = 0;
}

function onTouchMove(e: TouchEvent) {
  const x = e.touches?.[0]?.clientX || 0;
  touchDeltaX = x - touchStartX;
}

function onTouchEnd() {
  const threshold = 50;
  if (touchDeltaX > threshold) prev();
  else if (touchDeltaX < -threshold) next();
  touchStartX = 0;
  touchDeltaX = 0;
}

function onImageLoaded() {
  clearLoadTimer();
  loadingImage.value = false;
  preloadNeighbors();
}

function preloadNeighbors() {
  if (selectedIndex.value === null) return;
  const prevIdx = (selectedIndex.value - 1 + images.length) % images.length;
  const nextIdx = (selectedIndex.value + 1) % images.length;
  [prevIdx, nextIdx].forEach((i) => {
    const img = new Image();
    img.src = images[i];
  });
}

function onImageError() {
  clearLoadTimer();
  loadingImage.value = false;
}

function open(i: number) {
  selectedIndex.value = i;
  loadingImage.value = true;
  nextTick(() => {
    preloadNeighbors();
    // start fail-safe
    clearLoadTimer();
    loadTimer = window.setTimeout(() => {
      loadingImage.value = false;
    }, loadTimeoutMs);
  });
}

function close() {
  selectedIndex.value = null;
  loadingImage.value = false;
  clearLoadTimer();
}

function prev() {
  if (selectedIndex.value === null) return;
  loadingImage.value = true;
  selectedIndex.value =
    (selectedIndex.value - 1 + images.length) % images.length;
}

function next() {
  if (selectedIndex.value === null) return;
  loadingImage.value = true;
  selectedIndex.value = (selectedIndex.value + 1) % images.length;
}

function onKey(e: KeyboardEvent) {
  if (selectedIndex.value === null) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
  clearLoadTimer();
});

watch(selectedIndex, (v) => {
  if (v !== null) document.body.style.overflow = 'hidden';
  else document.body.style.overflow = '';
});

defineExpose({ open, close, prev, next });
</script>

<template>
  <transition name="lg-fade">
    <div
      v-if="selectedIndex !== null"
      class="fixed inset-0 z-50 flex h-full items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <div
        class="relative z-10 max-h-full w-full"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd"
      >
        <button
          class="absolute right-3 top-3 z-30 flex items-center justify-center rounded bg-black/40 p-3 text-white hover:bg-black/60"
          @click="close"
          aria-label="Close"
        >
          <Icon name="heroicons:x-mark" class="text-xl" />
        </button>

        <button
          v-if="images.length > 1"
          class="absolute left-3 top-1/2 z-30 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-3 text-white hover:bg-black/60"
          @click.stop="prev"
          aria-label="Previous image"
        >
          <Icon name="heroicons:chevron-left" class="text-xl" />
        </button>

        <button
          v-if="images.length > 1"
          class="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 items-center rounded-full bg-black/40 p-3 text-white hover:bg-black/60"
          @click.stop="next"
          aria-label="Next image"
        >
          <Icon name="heroicons:chevron-right" class="text-xl" />
        </button>

        <div class="flex items-center justify-center">
          <div
            class="relative flex h-[90vh] w-full items-center justify-center"
          >
            <div
              v-if="loadingImage"
              class="absolute inset-0 grid place-items-center"
            >
              <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"
              ></div>
            </div>

            <video
              v-if="isVideo(images[selectedIndex])"
              :key="images[selectedIndex]"
              :src="images[selectedIndex]"
              class="h-[80vh] w-auto rounded object-contain transition-opacity duration-300"
              :class="loadingImage ? 'opacity-0' : 'opacity-100'"
              controls
              playsinline
              @loadeddata="onImageLoaded"
              @error="onImageError"
            />
            <img
              v-else
              :src="images[selectedIndex]"
              :alt="`Foto ${selectedIndex + 1}`"
              class="h-[80vh] w-auto rounded object-contain transition-opacity duration-300"
              :class="loadingImage ? 'opacity-0' : 'opacity-100'"
              @load="onImageLoaded"
              @error="onImageError"
            />
          </div>
        </div>

        <div class="z-30 mt-4 text-center text-sm text-white/90">
          <div v-if="images.length > 1" class="mb-1 font-medium">
            Foto {{ selectedIndex + 1 }} van {{ images.length }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.prose img {
  max-width: 100%;
  height: auto;
}
</style>
