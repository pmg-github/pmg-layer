<script setup lang="ts">
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableText,
  BlocksSharedLinkReferenceSelect,
} from "../block-editor";
import { computed } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import type { FileButtonViewModel } from "models";

interface Review {
  id: string | number;
  sourceIndex: number;
  name: string;
  initials: string;
  rating: number;
  text: string;
  title?: string;
}

interface ApiReview {
  title: string;
  firstName: string;
  lastName: string;
  photo?: FileButtonViewModel | string | null;
  rating: number;
  text: string;
}

const isApiReview = (review: unknown): review is ApiReview =>
  Boolean(review && typeof review === "object");

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    selected?: boolean;
    id?: string;
    links?: { url: string; text: string; target?: string | null }[];
    title?: string;
    subtitle?: string;
    content?: ApiReview[];
    autoplay?: boolean;
    pauseOnHover?: boolean;
    colorScheme?: "light" | "dark" | "white";
    visibleFrom?: string | null;
    visibleUntil?: string | null;
  }>(),
  {
    autoplay: true,
    pauseOnHover: true,
    colorScheme: "white",
  },
);

const emits = defineEmits([
  "update:props",
  "update:settings",
  "update:title",
  "update:subtitle",
  "update:content",
  "update:links",
  "update:kicker",
  "delete",
]);

const { model, setField, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const linkPanelOpen = ref(false);
const selectedLinkIndex = ref<number | null>(null);
const scheduleEnabled = ref(Boolean(props.visibleFrom || props.visibleUntil));

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.trim().charAt(0) || ""}${lastName?.trim().charAt(0) || ""}`.toUpperCase() ||
  "?";

const fallbackReviews: Review[] = [
  {
    id: 1,
    sourceIndex: 0,
    name: "John Doe",
    initials: "JD",
    rating: 5,
    text: "Excellent service and great quality products. Highly recommended!",
  },
  {
    id: 2,
    sourceIndex: 1,
    name: "Jane Smith",
    initials: "JS",
    rating: 4.5,
    text: "Very satisfied with the purchase. Fast delivery and good customer support.",
  },
  {
    id: 3,
    sourceIndex: 2,
    name: "Mike Johnson",
    initials: "MJ",
    rating: 5,
    text: "Outstanding experience! The team was professional and helpful throughout.",
  },
];

const transformedReviews = computed<Review[]>(() => {
  if (!model.content || !Array.isArray(model.content)) {
    return props.editable ? [] : fallbackReviews;
  }

  return Array.from(model.content).flatMap((review, sourceIndex) => {
    if (!isApiReview(review)) return [];
    const apiReview = review as ApiReview;

    return [
      {
        id: sourceIndex + 1,
        sourceIndex,
        name:
          `${apiReview.firstName || ""} ${apiReview.lastName || ""}`.trim() ||
          "Nieuwe review",
        initials: getInitials(apiReview.firstName, apiReview.lastName),
        rating: Number(apiReview.rating) || 0,
        text: apiReview.text || "",
        title: apiReview.title,
      },
    ];
  });
});

const list = computed<Review[]>(() =>
  props.editable || transformedReviews.value.length
    ? transformedReviews.value
    : fallbackReviews,
);

const getStars = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
};

const makeHalfStarClipId = (base: string | number) =>
  `half-star-${String(base).replace(/[^a-zA-Z0-9_-]/g, "")}`;

const themeClasses = computed(() => {
  switch (model.colorScheme || props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        card: "bg-white text-primary-900",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
        star: "text-amber-400",
        ratingBg: "bg-amber-50 text-amber-700",
        quote: "text-primary-900",
        name: "text-primary-900",
        title: "text-primary-950",
        avatarBg: "bg-primary-900",
        icon: "text-primary-950",
        navButton: "bg-white text-primary-950 hover:bg-primary-50",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        card: "bg-white text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
        navButton: "bg-white text-primary-950 hover:bg-primary-50",
        star: "text-amber-400",
        ratingBg: "bg-amber-50 text-amber-700",
        quote: "text-primary-900",
        name: "text-primary-900",
        title: "text-primary-950",
        avatarBg: "bg-primary-900",
        icon: "text-primary-950",
      };
    default:
      return {
        bg: "bg-white",
        text: "text-primary-900",
        card: "bg-white text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
        navButton: "bg-white text-primary-950 hover:bg-primary-50",
        star: "text-amber-400",
        ratingBg: "bg-amber-50 text-amber-700",
        quote: "text-primary-900",
        name: "text-primary-900",
        title: "text-primary-950",
        avatarBg: "bg-primary-900",
        icon: "text-primary-950",
      };
  }
});

const addReview = () => {
  model.content = [
    ...(model.content || []),
    {
      title: "",
      rating: 5,
      text: "",
      firstName: "",
      lastName: "",
      photo: null,
    },
  ];
};

const setRating = (index: number, value: string) => {
  const parsed = Number(value.replace(",", "."));
  if (!model.content?.[index]) return;
  update(
    ["content", index, "rating"],
    Number.isFinite(parsed) ? Math.min(5, Math.max(0, parsed)) : 0,
  );
};

const removeReview = (index: number) => {
  if (!model.content?.[index]) return;
  model.content.splice(index, 1);
};

const openSettings = () => {
  linkPanelOpen.value = false;
  blockSettingsRef.value?.open?.();
};

const openLinkEditor = (index?: number) => {
  if (typeof index === "number") {
    selectedLinkIndex.value = index;
    linkPanelOpen.value = true;
    return;
  }

  if (model.links?.length) {
    selectedLinkIndex.value = 0;
    linkPanelOpen.value = true;
    return;
  }

  addButton();
};

const handleLinksRowFocusOut = (event: FocusEvent) => {
  const row = event.currentTarget as HTMLElement;
  const next = event.relatedTarget as Node | null;
  if (next && row.contains(next)) return;
  linkPanelOpen.value = false;
};

const addButton = () => {
  if (!model.links) model.links = [];
  if (model.links.length >= 2) return;

  model.links.push({
    text: "Nieuwe knop",
    url: "#",
    target: null,
  });
  selectedLinkIndex.value = model.links.length - 1;
  linkPanelOpen.value = true;
};

const removeActiveButton = () => {
  if (selectedLinkIndex.value === null || !model.links) return;
  model.links.splice(selectedLinkIndex.value, 1);
  selectedLinkIndex.value = model.links.length ? 0 : null;
  if (!model.links.length) linkPanelOpen.value = false;
};

const handleAnchorClick = (url: string, target?: string | null) => {
  if (props.editable) return;

  if (url.startsWith("#")) {
    const el = document.querySelector(url);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (target === "_blank") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.href = url;
};

const setScheduleEnabled = (enabled: boolean) => {
  scheduleEnabled.value = enabled;
  if (!enabled) {
    emits("update:settings", {
      visibleFrom: null,
      visibleUntil: null,
    });
  }
};

const updateVisibleFrom = (value: string) => {
  emits("update:settings", { visibleFrom: value || null });
};

const updateVisibleUntil = (value: string) => {
  emits("update:settings", { visibleUntil: value || null });
};

watch(
  () => [props.visibleFrom, props.visibleUntil],
  ([from, until]) => {
    scheduleEnabled.value = Boolean(from || until);
  },
);

watch(
  () => props.selected,
  (selected) => {
    if (!selected) {
      linkPanelOpen.value = false;
      selectedLinkIndex.value = null;
      blockSettingsRef.value?.close?.();
    }
  },
);

defineExpose({
  openSettings,
  openLinks: () => openLinkEditor(),
});
</script>

<template>
  <div class="contents">
    <BlocksSharedBlockSettings
      v-if="editable && selected"
      ref="blockSettingsRef"
      label="Blokinstellingen"
      hide-trigger
      @delete="emits('delete')"
    >
      <div class="space-y-5">
        <section>
          <h4 class="mb-2 text-xs font-semibold text-gray-600">Carousel</h4>
          <div class="space-y-2">
            <label
              class="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-gray-50 px-3 py-2.5"
            >
              <span>
                <span class="block text-xs font-semibold text-gray-700"
                  >Automatisch afspelen</span
                >
                <span class="block text-[11px] text-gray-400"
                  >Alleen actief op de gepubliceerde pagina.</span
                >
              </span>
              <input v-model="model.autoplay" type="checkbox" class="size-4" />
            </label>
            <label
              class="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-gray-50 px-3 py-2.5"
              :class="!model.autoplay ? 'opacity-50' : ''"
            >
              <span>
                <span class="block text-xs font-semibold text-gray-700"
                  >Pauzeren bij hover</span
                >
                <span class="block text-[11px] text-gray-400"
                  >Geeft bezoekers tijd om een review te lezen.</span
                >
              </span>
              <input
                v-model="model.pauseOnHover"
                :disabled="!model.autoplay"
                type="checkbox"
                class="size-4"
              />
            </label>
          </div>
        </section>

        <section class="border-t border-gray-100 pt-5">
          <h4 class="mb-2 text-xs font-semibold text-gray-600">
            Zichtbaarheid
          </h4>
          <div>
            <div class="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-lg border px-3 py-2.5 text-left transition"
                :class="
                  !scheduleEnabled
                    ? 'border-gray-950 bg-gray-950 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                "
                @click="setScheduleEnabled(false)"
              >
                <span class="block text-xs font-semibold">Altijd</span>
                <span class="mt-0.5 block text-[10px] opacity-70"
                  >Geen planning</span
                >
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-2.5 text-left transition"
                :class="
                  scheduleEnabled
                    ? 'border-gray-950 bg-gray-950 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                "
                @click="setScheduleEnabled(true)"
              >
                <span class="block text-xs font-semibold">Inplannen</span>
                <span class="mt-0.5 block text-[10px] opacity-70"
                  >Van / tot</span
                >
              </button>
            </div>
            <div v-if="scheduleEnabled" class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="mb-1 block text-[11px] font-semibold text-gray-500"
                  >Van</span
                >
                <input
                  type="date"
                  class="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  :value="props.visibleFrom?.slice(0, 10) || ''"
                  @input="
                    updateVisibleFrom(($event.target as HTMLInputElement).value)
                  "
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-semibold text-gray-500"
                  >Tot</span
                >
                <input
                  type="date"
                  class="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  :value="props.visibleUntil?.slice(0, 10) || ''"
                  @input="
                    updateVisibleUntil(
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </label>
            </div>
          </div>
        </section>

        <section class="border-t border-gray-100 pt-5">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-gray-600">
              Referentie
            </span>
            <input
              class="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              :value="props.id || ''"
              placeholder="reviews"
              @input="
                update(
                  ['id'],
                  ($event.target as HTMLInputElement).value.replace(/^#/, ''),
                )
              "
            />
          </label>
        </section>
      </div>
    </BlocksSharedBlockSettings>

    <section :id="props.id" class="group relative isolate" aria-label="Reviews">
      <div
        v-if="editable"
        class="pointer-events-none absolute inset-0 z-10 transition-shadow"
        :class="
          selected
            ? 'ring-2 ring-inset ring-blue-500'
            : 'group-hover:ring-1 group-hover:ring-inset group-hover:ring-blue-400/70'
        "
      ></div>

      <!-- Solid themed background -->
      <div class="absolute inset-0 -z-10">
        <div :class="['absolute inset-0', themeClasses.bg]"></div>
      </div>

      <div
        class="mx-auto h-full max-w-screen-md px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <!-- Header -->
        <div class="mb-8 flex items-start justify-between">
          <div class="mx-auto max-w-4xl text-center">
            <h3
              :class="[
                'text-center text-2xl font-bold sm:text-3xl',
                themeClasses.text,
              ]"
            >
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="model.title"
                placeholder="Titel toevoegen"
                @update:model-value="update(['title'], $event)"
              /><template v-else>{{ model.title }}</template>
            </h3>
            <p :class="['text-center text-xl', themeClasses.text]">
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="model.subtitle"
                placeholder="Subtitel toevoegen"
                @update:model-value="update(['subtitle'], $event)"
              /><template v-else>{{ model.subtitle }}</template>
            </p>
          </div>

          <div v-if="list.length > 3" class="flex gap-2">
            <button
              class="group flex rounded-full p-2 shadow-md ring-1 ring-black/10 transition-colors"
              :class="themeClasses.navButton"
              aria-label="Previous review"
              data-swiper-prev
            >
              <Icon
                name="material-symbols:chevron-left"
                class="h-5 w-5 transition group-hover:-translate-x-0.5"
              />
            </button>
            <button
              class="group flex rounded-full p-2 shadow-md ring-1 ring-black/10 transition-colors"
              :class="themeClasses.navButton"
              aria-label="Next review"
              data-swiper-next
            >
              <Icon
                name="material-symbols:chevron-right"
                class="h-5 w-5 transition group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        <!-- Carousel -->
        <div class="relative">
          <div
            v-if="editable && !list.length"
            class="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 px-6 text-center"
          >
            <span
              class="mb-3 flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            >
              <Icon
                name="material-symbols:reviews-outline-rounded"
                class="size-5"
              />
            </span>
            <p class="text-sm font-semibold text-gray-800">Nog geen reviews</p>
            <p class="mt-1 max-w-sm text-xs leading-5 text-gray-500">
              Voeg een review toe en bewerk de tekst daarna rechtstreeks op de
              kaart.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              @click="addReview"
            >
              <Icon name="material-symbols:add-rounded" class="size-4" />
              Review toevoegen
            </button>
          </div>

          <Swiper
            v-else
            :modules="[Autoplay]"
            :slides-per-view="'auto'"
            :space-between="24"
            loop
            :autoplay="
              !props.editable && model.autoplay
                ? {
                    delay: 4500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: model.pauseOnHover,
                  }
                : false
            "
            :touch-events-target="'wrapper'"
            :prevent-clicks="!editable"
            :prevent-clicks-propagation="!editable"
            :allow-touch-move="!editable"
            class="h-80"
            @swiper="
              (s) => {
                // connect our custom buttons
                const prev = (
                  s.el as HTMLElement
                ).parentElement?.parentElement?.querySelector(
                  '[data-swiper-prev]',
                ) as HTMLElement | null;
                const next = (
                  s.el as HTMLElement
                ).parentElement?.parentElement?.querySelector(
                  '[data-swiper-next]',
                ) as HTMLElement | null;
                prev?.addEventListener('click', () => s.slidePrev());
                next?.addEventListener('click', () => s.slideNext());
              }
            "
          >
            <SwiperSlide
              v-for="(review, reviewIndex) in list"
              :key="review.id"
              class="group/review relative h-full"
            >
              <article
                class="group relative flex h-80 w-full flex-col overflow-hidden rounded-lg border shadow-sm"
                :class="themeClasses.card"
                :aria-label="`Review by ${review.name}`"
              >
                <div class="absolute right-4 top-4 opacity-5">
                  <svg
                    class="h-16 w-16"
                    :class="themeClasses.icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"
                    />
                  </svg>
                </div>

                <div class="relative z-10 flex h-full flex-col p-6">
                  <div class="mb-4 flex items-center" aria-label="Rating">
                    <div
                      class="flex items-center space-x-0.5"
                      title="img"
                      aria-hidden="true"
                    >
                      <svg
                        v-for="n in getStars(review.rating).full"
                        :key="`full-${review.id}-${n}`"
                        class="h-4 w-4 fill-current text-amber-400 drop-shadow-sm"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                      <svg
                        v-if="getStars(review.rating).half"
                        class="h-4 w-4 text-amber-400 drop-shadow-sm"
                        viewBox="0 0 20 20"
                      >
                        <defs>
                          <clipPath :id="makeHalfStarClipId(review.id)">
                            <rect width="10" height="20" />
                          </clipPath>
                        </defs>
                        <path
                          fill="#d1d5db"
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                        <path
                          fill="currentColor"
                          :clip-path="`url(#${makeHalfStarClipId(review.id)})`"
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                      <svg
                        v-for="n in getStars(review.rating).empty"
                        :key="`empty-${review.id}-${n}`"
                        class="h-4 w-4 fill-current text-gray-300"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                    </div>
                    <div
                      v-if="editable"
                      class="ml-3 flex items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition focus-within:border-gray-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-100"
                    >
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        :value="review.rating"
                        class="w-11 border-0 bg-transparent py-1 pl-2 pr-1 text-center text-xs font-semibold text-gray-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label="Rating"
                        @input="
                          setRating(
                            review.sourceIndex,
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                      />
                      <span
                        class="border-l border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-400"
                      >
                        /5
                      </span>
                    </div>

                    <span
                      v-else
                      class="ml-3 rounded-full px-2 py-1 text-xs font-medium"
                      :class="themeClasses.ratingBg"
                    >
                      {{ review.rating }}/5
                    </span>
                  </div>

                  <blockquote
                    class="mb-4 line-clamp-6 flex-grow"
                    :class="themeClasses.quote"
                  >
                    <BlocksSharedEditableText
                      :model-value="review.text"
                      :editable="editable"
                      rich
                      @update:model-value="
                        setField(
                          model.content[review.sourceIndex],
                          'text',
                          $event,
                        )
                      "
                    />
                  </blockquote>

                  <footer class="mt-auto flex items-center">
                    <div
                      class="mr-4 flex size-12 shrink-0 items-center justify-center rounded-full font-semibold text-white"
                      :class="themeClasses.avatarBg"
                      :aria-label="`Avatar for ${review.name}`"
                    >
                      {{ review.initials }}
                    </div>
                    <div>
                      <h4 class="font-semibold" :class="themeClasses.name">
                        <template v-if="editable"
                          ><BlocksSharedEditableText
                            :model-value="
                              model.content?.[review.sourceIndex]?.firstName
                            "
                            editable
                            placeholder="Voornaam"
                            @update:model-value="
                              setField(
                                model.content[review.sourceIndex],
                                'firstName',
                                $event,
                              )
                            " /><BlocksSharedEditableText
                            :model-value="
                              model.content?.[review.sourceIndex]?.lastName
                            "
                            editable
                            placeholder="Achternaam"
                            @update:model-value="
                              setField(
                                model.content[review.sourceIndex],
                                'lastName',
                                $event,
                              )
                            " /></template
                        ><template v-else>{{ review.name }}</template>
                      </h4>
                      <p
                        v-if="editable || review.title"
                        class="text-xs font-medium"
                        :class="themeClasses.title"
                      >
                        <BlocksSharedEditableText
                          :editable="editable"
                          v-if="editable"
                          :model-value="review.title"
                          placeholder="Functie toevoegen"
                          @update:model-value="
                            setField(
                              model.content[review.sourceIndex],
                              'title',
                              $event,
                            )
                          "
                        /><template v-else>{{ review.title }}</template>
                      </p>
                    </div>
                  </footer>
                </div>
              </article>
              <div
                v-if="editable && selected"
                class="absolute right-3 top-3 z-30 flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-sm backdrop-blur"
              >
                <span
                  class="border-r border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-400"
                >
                  {{ reviewIndex + 1 }} / {{ list.length }}
                </span>
                <button
                  type="button"
                  class="flex size-8 items-center justify-center text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Slide verwijderen"
                  aria-label="Slide verwijderen"
                  @click.stop="removeReview(review.sourceIndex)"
                >
                  <Icon
                    name="material-symbols:delete-outline-rounded"
                    class="size-4"
                  />
                </button>
              </div>
            </SwiperSlide>
            <SwiperSlide v-if="editable" class="h-full">
              <BlocksSharedAddItem
                class="h-80"
                label="Review toevoegen"
                @add="addReview"
              />
            </SwiperSlide>
          </Swiper>
        </div>

        <div
          class="relative mt-6 flex w-full flex-col justify-center gap-3 sm:flex-row sm:flex-wrap md:mt-8"
          @focusout="handleLinksRowFocusOut"
        >
          <div
            v-for="(link, idx) in model.links || []"
            :key="idx"
            class="group/button relative"
            @focusin="editable && selected && openLinkEditor(Number(idx))"
          >
            <a
              :href="link.url || '#'"
              :target="link.target || '_self'"
              class="block rounded-full px-12 py-3 text-center font-medium transition-colors"
              :class="
                idx === 0 ? themeClasses.button : themeClasses.secondaryButton
              "
              @click.prevent="handleAnchorClick(link.url || '#', link.target)"
            >
              <BlocksSharedEditableText
                v-if="editable"
                :editable="editable"
                :model-value="link.text"
                placeholder="Knoptekst"
                @update:model-value="setField(link, 'text', $event)"
              />
              <template v-else>{{ link.text }}</template>
            </a>
          </div>

          <div
            v-if="
              editable &&
              selected &&
              linkPanelOpen &&
              selectedLinkIndex !== null &&
              model.links?.[selectedLinkIndex]
            "
            class="absolute bottom-full left-1/2 z-40 mb-2 flex w-[min(22rem,100%)] -translate-x-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 pl-3 text-gray-900 shadow-2xl"
            @click.stop
          >
            <Icon
              name="material-symbols:link-rounded"
              class="size-4 shrink-0 text-gray-400"
            />
            <input
              v-model="model.links[selectedLinkIndex].url"
              type="text"
              inputmode="url"
              placeholder="https://... of #sectie"
              class="min-w-0 flex-1 rounded-full border-0 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-gray-400"
            />
            <BlocksSharedLinkReferenceSelect
              v-model="model.links[selectedLinkIndex].url"
            />
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded-full transition"
              :class="
                model.links[selectedLinkIndex].target === '_blank'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
              "
              title="Openen in nieuw tabblad"
              aria-label="Openen in nieuw tabblad"
              @click="
                model.links[selectedLinkIndex].target =
                  model.links[selectedLinkIndex].target === '_blank'
                    ? null
                    : '_blank'
              "
            >
              <Icon
                name="material-symbols:open-in-new-rounded"
                class="size-4"
              />
            </button>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50"
              title="Verwijderen"
              aria-label="Link verwijderen"
              @click="removeActiveButton"
            >
              <Icon
                name="material-symbols:delete-outline-rounded"
                class="size-4"
              />
            </button>
          </div>

          <button
            v-if="
              editable && selected && (!model.links || model.links.length < 2)
            "
            type="button"
            class="border-current/40 rounded-full border border-dashed bg-white/30 px-6 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/50"
            :class="themeClasses.text"
            @click.stop="addButton"
          >
            + Knop toevoegen
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
:deep(.editor-prose p:empty)::before {
  content: "\00a0"; /* non-breaking space */
}
</style>
