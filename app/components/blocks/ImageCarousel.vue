<script setup lang="ts">
import MediaFrame from "./shared/MediaFrame.vue";
import MediaPlaceholder from "./shared/MediaPlaceholder.vue";
import BlockHeading from "./shared/BlockHeading.vue";
import { blockPaddingStyle } from "../../utils/blockPadding";
import { useInlineBlock } from "../../composables/useInlineBlock";
import { linkButtonStyle } from "../../utils/buttonColor";
import {
  BlocksSharedBlockSettings,
  BlocksSharedHeaderAlignment,
  BlocksSharedCardAlignment,
  PaddingHandles,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedImageManager,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import type { FileButtonViewModel } from "models";
import { computed } from "vue";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const { locale } = useI18n();

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    padding?: { top?: number; bottom?: number } | null;
    selected?: boolean;
    id?: string;
    links?: { url: string; text: string; target?: string; color?: string | null }[];
    title?: string;
    subtitle?: string;
    headerAlignment?: "left" | "center" | "right";
    content?: {
      tiles?: Array<{
        type?: "image" | "video";
        image: FileButtonViewModel;
        videoCode?: { value: string; key: string } | null;
        title?: string;
        subtitle?: string;
        description?: string;
        link?: { url: string; text?: string; target?: string; color?: string | null };
      }>;
      slidesPerView?: number;
      autoplay?: boolean;
      fullWidth?: boolean;
      alignment?: "left" | "center" | "right";
    };
    language?: string;
    colorScheme?: "light" | "dark" | "white";
  }>(),
  { content: () => ({ tiles: [] }) },
);

const slidesPerView = computed(() =>
  Number.isFinite(Number(props.content?.slidesPerView)) &&
  Number(props.content?.slidesPerView) > 0
    ? Math.min(6, Math.max(1, Math.round(Number(props.content?.slidesPerView))))
    : 3,
);

const carouselTiles = computed(() => props.content?.tiles || []);
const cardAlignment = computed(() => {
  const alignment = props.content?.alignment;
  return alignment === "center" || alignment === "right" ? alignment : "left";
});
const cardAlignmentClass = computed(
  () =>
    ({
      left: "text-left",
      center: "text-center",
      right: "text-right",
    })[cardAlignment.value],
);
const cardJustifyClass = computed(
  () =>
    ({
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    })[cardAlignment.value],
);

const canNavigate = computed(() => carouselTiles.value.length > 1);
const canLoop = computed(
  () => carouselTiles.value.length > slidesPerView.value,
);
const swiperInstance = shallowRef<SwiperInstance>();
const activeSlide = ref(0);
const paginationSteps = ref<number[]>([]);

const syncPaginationSteps = (swiper: SwiperInstance) => {
  paginationSteps.value = canLoop.value
    ? carouselTiles.value.map((_, index) => index)
    : swiper.snapGrid.map((_, index) => index);
};

const setSwiper = (swiper: SwiperInstance) => {
  swiperInstance.value = swiper;
  activeSlide.value = swiper.realIndex;
  syncPaginationSteps(swiper);
};

const syncActiveSlide = (swiper: SwiperInstance) => {
  activeSlide.value = swiper.realIndex;
};

const goToSlide = (index: number) => {
  const swiper = swiperInstance.value;
  if (!swiper) return;

  if (canLoop.value && !props.editable) {
    swiper.slideToLoop(index);
    return;
  }

  swiper.slideTo(index);
};

const slideImageUrl = (tile: any) => {
  if (typeof tile?.image === "string") return tile.image;
  return (
    tile?.image?.url ||
    tile?.imageUrl ||
    tile?.image?.imageUrl ||
    tile?.image?.fileUrl ||
    ""
  );
};

const autoplayConfig = computed(() =>
  !props.editable && props.content?.autoplay && canNavigate.value
    ? { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
    : false,
);

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white",
        card: "bg-white text-primary-900",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        card: "bg-white text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      };
    default:
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-gray-600",
        card: "bg-white text-primary-900 border border-gray-200",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});
const handleAnchorClick = (url: string, target?: string | null) => {
  if (props.editable) return;
  if (url.startsWith("#")) {
    const el = document.querySelector(url);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  } else if (target === "_blank") {
    window.open(url, "_blank");
  } else {
    window.location.href = url;
  }
};

const emits = defineEmits([
  "update:props",
  "update:padding",
  "update:title",
  "update:subtitle",
  "update:headerAlignment",
  "update:content",
  "update:links",
  "update:kicker",
]);

const { model, setField, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const editableLinksRef = ref();
const imageManagerRef = ref();
defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
  openMedia: () => imageManagerRef.value?.open?.(),
});

// Verwacht: model.content.tiles[], model.content.slidesPerView, model.content.autoplay
// tile: { type:'image'|'video', image, videoCode, title, subtitle, description, link }

const createImageSlide = (image: FileButtonViewModel) => ({
  type: "image" as const,
  image,
  videoCode: null,
  title: "",
  subtitle: "",
  description: "",
  link: { url: "", text: "", target: "_self" },
});

const updateSlideLink = (
  index: number,
  links: { url: string; text?: string; target?: string }[],
) => {
  update(
    ["content", "tiles", index, "link"],
    links[0] || { url: "", text: "", target: "_self" },
  );
};

const setSlidesPerView = (value: string | number | null) => {
  const requested = Number(value);
  model.content.slidesPerView = Math.min(
    6,
    Math.max(
      1,
      value !== null && Number.isFinite(requested) ? Math.round(requested) : 3,
    ),
  );
};
</script>

<template>
  <section
    data-block-padding
    :style="blockPaddingStyle(model.padding)"
    :id="props.id"
    :class="[
      'group relative scroll-mt-20 overflow-hidden py-16 md:py-20',
      themeClasses.bg,
    ]"
  >
    <PaddingHandles
      :editable="editable"
      :selected="selected"
      :padding="model.padding"
      @update:padding="update(['padding'], $event)"
    />
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="container min-w-0">
      <div class="mx-auto max-w-4xl text-center">
        <BlockHeading
          :title="props.title"
          :subtitle="props.subtitle"
          :editable="editable"
          :alignment="props.headerAlignment || 'center'"
          :title-class="themeClasses.text"
          :subtitle-class="themeClasses.subtitle"
          @update:title="update(['title'], $event)"
          @update:subtitle="update(['subtitle'], $event)"
        />
      </div>
      <Swiper
        :allow-touch-move="!editable"
        :autoplay="autoplayConfig"
        :modules="[Navigation, Autoplay]"
        :navigation="canNavigate"
        :space-between="24"
        :loop="!editable && canLoop"
        :speed="600"
        :observer="true"
        :observe-parents="true"
        :watch-overflow="true"
        :center-insufficient-slides="true"
        :breakpoints="{
          640: { slidesPerView: Math.min(slidesPerView, 3) },
          1024: { slidesPerView },
        }"
        class="image-carousel w-full"
        :style="{ overflow: props.content?.fullWidth ? 'visible' : 'hidden' }"
        @swiper="setSwiper"
        @slide-change="syncActiveSlide"
        @breakpoint="syncPaginationSteps"
        @resize="syncPaginationSteps"
      >
        <SwiperSlide
          v-for="(t, i) in carouselTiles"
          :key="t?.image?.id || slideImageUrl(t) || `slide-${i}`"
          class="relative"
        >
          <component
            :is="editable || !t?.link?.url?.trim() ? 'div' : 'a'"
            :class="[
              'flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 shadow-sm',
              themeClasses.card,
            ]"
            :href="t?.link?.url || undefined"
            :target="t?.link?.target || '_self'"
          >
            <MediaFrame
              :empty="
                t?.type === 'video' ? !t?.videoCode?.value : !slideImageUrl(t)
              "
              :editable="editable"
              :kind="t?.type === 'video' ? 'video' : 'image'"
              ratio="video"
            >
              <img
                v-if="t?.type !== 'video'"
                :src="slideImageUrl(t)"
                :alt="t?.title || ''"
                class="h-full w-full bg-white object-contain p-4"
              />
              <PMGVideoPlayer
                v-else
                :key="t.videoCode?.value"
                :video-id="t.videoCode?.value"
                :language="props.language || locale"
              />
              <template #empty
                ><MediaPlaceholder
                  :kind="t?.type === 'video' ? 'video' : 'image'"
                  action-label="Media beheren"
                  @action="imageManagerRef?.open?.()"
              /></template>
            </MediaFrame>
            <div
              v-if="editable || t?.title || t?.subtitle || t?.description"
              :class="['flex flex-1 flex-col p-6', cardAlignmentClass]"
            >
              <h3 class="text-xl font-semibold leading-snug sm:text-2xl">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="t?.title"
                  @update:model-value="setField(t, 'title', $event)"
                /><template v-else>{{ t?.title }}</template>
              </h3>
              <p class="mt-2 text-sm leading-6 text-gray-600">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="t?.subtitle"
                  @update:model-value="setField(t, 'subtitle', $event)"
                /><template v-else>{{ t?.subtitle }}</template>
              </p>
              <div
                class="card-description mt-2 text-sm leading-6 text-gray-700"
              >
                <BlocksSharedEditableText
                  :model-value="t?.description"
                  :editable="editable"
                  rich
                  @update:model-value="setField(t, 'description', $event)"
                />
              </div>
            </div>
            <div
              v-if="editable || (t?.link?.url?.trim() && t?.link?.text?.trim())"
              :class="['mt-auto flex px-6 pb-6', cardJustifyClass]"
            >
              <BlocksSharedEditableLinks
                v-if="editable"
                :model-value="t?.link?.url || t?.link?.text ? [t.link] : []"
                :max="1"
                color-scheme="white"
                title="Carrousellink"
                @update:model-value="updateSlideLink(i, $event)"
              />
              <span
                v-else
                class="inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 bg-primary-900 text-white hover:bg-primary-950"
                :style="linkButtonStyle(t?.link?.color, 'primary')"
              >
                {{ t?.link?.text }}
              </span>
            </div>
          </component>
        </SwiperSlide>
      </Swiper>

      <nav
        v-if="paginationSteps.length > 1"
        class="mt-5 flex items-center justify-center"
        aria-label="Carrouselpaginering"
      >
        <div
          class="flex max-w-full flex-wrap items-center justify-center gap-1.5"
        >
          <button
            v-for="(slideIndex, index) in paginationSteps"
            :key="`carousel-step-${slideIndex}`"
            type="button"
            class="h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            :class="[
              activeSlide === slideIndex
                ? 'w-6 bg-primary-900'
                : 'w-2 bg-gray-300 hover:bg-gray-400',
              props.colorScheme === 'dark' && activeSlide !== slideIndex
                ? 'bg-white/40 hover:bg-white/70'
                : '',
              props.colorScheme === 'dark' && activeSlide === slideIndex
                ? 'bg-white'
                : '',
            ]"
            :aria-label="`Ga naar afbeelding ${index + 1}`"
            :aria-current="activeSlide === slideIndex ? 'true' : undefined"
            @click="goToSlide(slideIndex)"
          />
        </div>
      </nav>

      <div
        v-if="editable && !carouselTiles.length"
        class="h-56 overflow-hidden rounded-xl"
      >
        <MediaPlaceholder
          label="Afbeeldingen toevoegen"
          description="Logo's worden volledig weergegeven, zonder bijsnijden."
          action-label="Media beheren"
          @action="imageManagerRef?.open?.()"
        />
      </div>

      <div
        v-if="editable || props.links?.length"
        class="mt-6 flex w-full flex-col justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0 md:mt-8"
      >
        <BlocksSharedEditableLinks
          v-if="editable"
          ref="editableLinksRef"
          :model-value="props.links"
          :color-scheme="props.colorScheme"
          :max="2"
          @update:model-value="update(['links'], $event)"
        />
        <template v-else-if="props.links && props.links.length">
          <component
            :is="editable ? 'div' : 'a'"
            v-for="(l, idx) in props.links"
            :key="idx"
            :href="l.url"
            :target="l.target || '_self'"
            class="inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            :class="
              idx === 0 ? themeClasses.button : themeClasses.secondaryButton
            "
            :style="linkButtonStyle(l.color, idx === 0 ? 'primary' : 'secondary')"
            @click.prevent="handleAnchorClick(l.url, l.target)"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="l.text"
              @update:model-value="setField(l, 'text', $event)"
            /><template v-else>{{ l.text }}</template>
          </component>
        </template>
      </div>
    </div>
  </section>

  <BlocksSharedImageManager
    v-if="editable"
    ref="imageManagerRef"
    :model-value="model.content.tiles || []"
    image-key="image"
    title="Carrousel beheren"
    :item-factory="createImageSlide"
    @update:model-value="update(['content', 'tiles'], $event)"
  />

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <BlocksSharedHeaderAlignment
      :model-value="props.headerAlignment || 'center'"
      @update:model-value="update(['headerAlignment'], $event)"
    />
    <div class="flex flex-col space-y-4">
      <PMGSwitch
        :model-value="props.content?.fullWidth ?? false"
        label="Volledige breedte"
        @update:model-value="update(['content', 'fullWidth'], $event)"
      />
      <BlocksSharedCardAlignment
        :model-value="cardAlignment"
        @update:model-value="model.content.alignment = $event"
      />
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600"
            >Slides per rij</label
          >
          <SharedInput
            type="number"
            :min="1"
            :max="6"
            :step="1"
            :model-value="String(slidesPerView)"
            @update:model-value="setSlidesPerView"
          />
        </div>
        <div class="flex flex-col justify-end">
          <label
            class="mb-1 flex items-center gap-2 text-xs font-medium text-gray-600"
          >
            <input type="checkbox" v-model="model.content.autoplay" />
            Autoplay
          </label>
        </div>
      </div>
    </div>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
/* Override Swiper's default ease-in-out so slides move at constant speed */
:deep(.image-carousel .swiper-wrapper) {
  align-items: stretch;
  transition-timing-function: linear !important;
}

:deep(.image-carousel .swiper-slide) {
  display: flex;
  height: auto;
}

:deep(.image-carousel .swiper-button-prev) {
  left: max(1rem, calc((100% - 80rem) / 2));
}

:deep(.image-carousel .swiper-button-next) {
  right: max(1rem, calc((100% - 80rem) / 2));
}

:deep(.image-carousel .swiper-button-prev),
:deep(.image-carousel .swiper-button-next) {
  z-index: 20;
  width: 3rem;
  height: 3rem;
  margin-top: 0;
  border: 2px solid rgb(255 255 255 / 95%);
  border-radius: 9999px;
  background: rgb(var(--primary-900));
  color: white;
  box-shadow: 0 4px 14px rgb(0 0 0 / 35%);
  opacity: 1;
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

:deep(.image-carousel .swiper-navigation-icon) {
  width: 9px;
  height: 16px;
}

:deep(.image-carousel .swiper-button-prev:hover),
:deep(.image-carousel .swiper-button-next:hover) {
  transform: scale(1.06);
  background: rgb(var(--primary-950));
  box-shadow: 0 6px 18px rgb(0 0 0 / 45%);
}

:deep(.image-carousel .swiper-button-prev:focus-visible),
:deep(.image-carousel .swiper-button-next:focus-visible) {
  outline: 3px solid white;
  outline-offset: 3px;
}

:deep(.image-carousel .swiper-button-disabled) {
  opacity: 0.5 !important;
}
</style>
