<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableImage,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import { computed, nextTick, ref, toRefs } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-coverflow';

import type { FileButtonViewModel } from 'models';

interface WinnerLink {
  url: string;
  text: string;
  target?: string;
}

interface WinnerItem {
  category: string;
  companyName: string;
  product: string;
  imageUrl: string | FileButtonViewModel | null;
  labelUrl?: string | FileButtonViewModel | null;
  footer?: string;
}

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    selected?: boolean;
    id?: string;
    links?: WinnerLink[];
    kicker?: string;
    title?: string;
    subtitle?: string;
    content?: WinnerItem[];
    colorScheme?: 'light' | 'dark' | 'white';
  }>(),
  {
    links: () => [],
    content: () => [],
    kicker: '',
    title: '',
    subtitle: '',
    colorScheme: 'white',
  },
);

const { id, links, kicker, title, subtitle, colorScheme } = toRefs(props);

const content = computed<WinnerItem[]>(() =>
  Array.isArray(props.content) ? props.content : [],
);

const modules = [Autoplay, EffectCoverflow];

const swiperRef = ref<SwiperInstance | null>(null);
const activeIndex = ref(0);

const themes = {
  dark: {
    bg: 'bg-primary-900',
    heading: 'text-white',
    subtitle: 'text-white/80',
    kicker: 'text-white/75',
    button: 'bg-white text-primary-950 hover:bg-primary-50',
    secondaryButton:
      'border border-white bg-transparent text-white hover:bg-white/10',
  },

  light: {
    bg: 'bg-primary-50',
    heading: 'text-primary-900',
    subtitle: 'text-primary-950',
    kicker: 'text-primary-950',
    button: 'bg-primary-900 text-white hover:bg-primary-950',
    secondaryButton:
      'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100',
  },

  white: {
    bg: 'bg-white',
    heading: 'text-primary-900',
    subtitle: 'text-zinc-600',
    kicker: 'text-primary-950',
    button: 'bg-primary-900 text-white hover:bg-primary-950',
    secondaryButton:
      'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
  },
} as const;

const theme = computed(() => themes[colorScheme.value]);

const primaryLink = computed(() => links.value[0]);

/**
 * Swiper loop mode needs enough slides to safely duplicate/rearrange them.
 *
 * Desktop displays 2.7 slides and uses centeredSlides, so enabling loop
 * with only 2–4 winners can cause jumping / broken positioning.
 */
const loopEnabled = computed(
  () => !props.editable && content.value.length >= 5,
);

/**
 * For smaller sets we don't use loop, but rewind gives us the expected
 * wraparound behaviour when using the previous/next controls.
 */
const rewindEnabled = computed(
  () => !props.editable && !loopEnabled.value && content.value.length > 1,
);

const autoplayOptions = computed(() => {
  if (props.editable || content.value.length <= 1) {
    return false;
  }

  return {
    delay: 3200,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  };
});

const swiperBreakpoints = computed(() =>
  props.editable
    ? {
        0: {
          slidesPerView: 1,
          spaceBetween: 16,
        },

        768: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
      }
    : {
        0: {
          slidesPerView: 1.5,
          spaceBetween: 15,
        },

        768: {
          slidesPerView: 2.7,
          spaceBetween: 30,
        },
      },
);

const setSwiper = (swiper: SwiperInstance) => {
  swiperRef.value = swiper;
  activeIndex.value = swiper.realIndex ?? 0;
};

const handleSlideChange = (swiper: SwiperInstance) => {
  activeIndex.value = swiper.realIndex ?? 0;
};

const setActive = (index: number) => {
  activeIndex.value = index;

  const swiper = swiperRef.value;

  if (!swiper) {
    return;
  }

  if (loopEnabled.value) {
    swiper.slideToLoop(index);
    return;
  }

  swiper.slideTo(index);
};

const showPrevious = () => {
  if (!swiperRef.value) {
    return;
  }

  swiperRef.value.slidePrev();
};

const showNext = () => {
  if (!swiperRef.value) {
    return;
  }

  swiperRef.value.slideNext();
};

const handleLinkClick = (url: string, target?: string) => {
  if (url.startsWith('#')) {
    document.querySelector(url)?.scrollIntoView({
      behavior: 'smooth',
    });

    return;
  }

  if (target === '_blank') {
    window.open(url, '_blank', 'noopener,noreferrer');

    return;
  }

  window.location.assign(url);
};

const emits = defineEmits([
  'update:props',
  'update:title',
  'update:subtitle',
  'update:content',
  'update:links',
  'update:kicker',
]);

const { model, setField, update } = useInlineBlock(props, emits);

const blockSettingsRef = ref();
const editableLinksRef = ref();

defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),

  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});

const inlineImageSource = (
  image: string | FileButtonViewModel | null | undefined,
) => (typeof image === 'string' ? image : image?.url);

function inlineCreateWinner(): WinnerItem {
  return {
    category: '',
    companyName: '',
    product: '',
    imageUrl: null,
    labelUrl: null,
    footer: '',
  };
}

async function addWinner() {
  model.content = [...content.value, inlineCreateWinner()];
  await nextTick();
  swiperRef.value?.update();
  swiperRef.value?.slideTo(Math.max(0, content.value.length - 1));
}
</script>

<template>
  <section
    :id="id"
    :class="[
      'group relative scroll-mt-20 overflow-hidden py-16 md:py-20',
      theme.bg,
    ]"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />

    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="grid items-center gap-12 xl:grid-cols-[1fr_2fr] xl:gap-6">
        <!-- Content -->
        <div class="relative z-10 max-w-xl">
          <!-- Kicker -->
          <p
            v-if="editable || kicker"
            :class="[
              'mb-5 text-sm font-semibold uppercase tracking-[0.24em]',
              theme.kicker,
            ]"
          >
            <BlocksSharedEditableText
              v-if="editable"
              :editable="editable"
              :model-value="kicker"
              placeholder="Kicker toevoegen"
              @update:model-value="update(['kicker'], $event)"
            />

            <template v-else>
              {{ kicker }}
            </template>
          </p>

          <!-- Title -->
          <h2
            :class="[
              'max-w-full text-5xl font-black leading-[0.92] [overflow-wrap:anywhere] sm:text-6xl',
              theme.heading,
            ]"
          >
            <BlocksSharedEditableText
              :model-value="title"
              :editable="editable"
              rich
              placeholder="Titel toevoegen"
              @update:model-value="update(['title'], $event)"
            />
          </h2>

          <!-- Subtitle -->
          <p
            v-if="editable || subtitle"
            :class="[
              'mt-5 max-w-md text-xl font-bold leading-8',
              theme.subtitle,
            ]"
          >
            <BlocksSharedEditableText
              v-if="editable"
              :editable="editable"
              :model-value="subtitle"
              placeholder="Subtitel toevoegen"
              @update:model-value="update(['subtitle'], $event)"
            />

            <template v-else>
              {{ subtitle }}
            </template>
          </p>

          <!-- Link editor -->
          <BlocksSharedEditableLinks
            v-if="editable"
            ref="editableLinksRef"
            :model-value="props.links"
            :color-scheme="props.colorScheme"
            :max="1"
            @update:model-value="update(['links'], $event)"
          />

          <!-- Public button -->
          <a
            v-else-if="primaryLink"
            :href="primaryLink.url"
            :target="primaryLink.target || '_self'"
            rel="noopener noreferrer"
            :class="[
              'mt-6 inline-flex rounded-full px-8 py-3 text-center font-medium transition-colors',
              theme.button,
            ]"
            @click.prevent="
              handleLinkClick(primaryLink.url, primaryLink.target)
            "
          >
            {{ primaryLink.text }}
          </a>
        </div>

        <!-- Winners -->
        <div v-if="editable || content.length" class="relative min-w-0">
          <div
            v-if="editable && content.length"
            class="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3"
          >
            <p class="text-sm font-medium text-blue-950">
              {{ content.length }}
              {{ content.length === 1 ? 'winnaar' : 'winnaars' }}
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              @click.stop="addWinner"
            >
              <Icon name="material-symbols:add-rounded" class="size-4" />
              Winnaar toevoegen
            </button>
          </div>

          <!-- Empty editor state -->
          <BlocksSharedAddItem
            v-if="editable && !content.length"
            class="mx-auto min-h-[26rem] w-[min(22rem,78vw)]"
            label="Winnaar toevoegen"
            @add="addWinner"
          />

          <template v-else>
            <!-- Previous -->
            <button
              v-if="content.length > (editable ? 0 : 1)"
              type="button"
              aria-label="Previous winner"
              class="absolute -left-6 top-1/2 z-10 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-primary-900 text-white transition hover:bg-primary-950 max-md:left-0"
              @click="showPrevious"
            >
              <Icon
                name="material-symbols:arrow-back-rounded"
                class="h-6 w-6"
              />
            </button>

            <!-- Carousel -->
            <div class="flex w-full min-w-0 max-w-full overflow-visible">
              <Swiper
                :allow-touch-move="!editable"
                class="w-full min-w-0 max-w-full overflow-visible"
                :modules="modules"
                :slides-per-view="editable ? 1 : 2.7"
                :space-between="editable ? 16 : 10"
                :centered-slides="!editable"
                :center-insufficient-slides="!loopEnabled"
                :loop="loopEnabled"
                :rewind="rewindEnabled"
                :speed="700"
                :grab-cursor="!editable"
                :autoplay="autoplayOptions"
                :observer="true"
                :observe-parents="true"
                :watch-overflow="true"
                :effect="editable ? 'slide' : 'coverflow'"
                :coverflow-effect="{
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  scale: 0.9,
                  modifier: 1,
                  slideShadows: false,
                }"
                :breakpoints="swiperBreakpoints"
                @swiper="setSwiper"
                @slide-change="handleSlideChange"
              >
                <!-- Winner slides -->
                <SwiperSlide
                  v-for="(item, index) in content"
                  :key="index"
                  class="group/item relative !flex !justify-center"
                >
                  <article
                    class="winner-card w-[min(22rem,78vw)] overflow-hidden rounded-lg border border-gray-300 bg-white/95"
                    @click="setActive(index)"
                  >
                    <!-- Image -->
                    <div class="relative aspect-square">
                      <!-- Badge -->
                      <div
                        v-if="editable || item.labelUrl"
                        class="absolute top-3 z-30 w-24 sm:top-4"
                        :class="
                          editable ? 'left-3 sm:left-4' : 'right-3 sm:right-4'
                        "
                      >
                        <BlocksSharedEditableImage
                          :editable="editable"
                          :model-value="item.labelUrl"
                          :image-source="inlineImageSource(item.labelUrl)"
                          class="h-20 rounded-lg"
                          @update:model-value="
                            setField(item, 'labelUrl', $event)
                          "
                        >
                          <img
                            :src="inlineImageSource(item.labelUrl)"
                            alt=""
                            aria-hidden="true"
                            class="h-20 w-full object-contain drop-shadow-md"
                            loading="lazy"
                          />
                        </BlocksSharedEditableImage>
                        <button
                          v-if="editable && item.labelUrl"
                          type="button"
                          class="absolute -right-2 top-4 z-40 flex size-6 items-center justify-center rounded-full bg-gray-900 text-white shadow transition hover:bg-red-600"
                          aria-label="Badge verwijderen"
                          title="Badge verwijderen"
                          @click.stop.prevent="setField(item, 'labelUrl', null)"
                        >
                          <Icon
                            name="material-symbols:close-rounded"
                            class="size-4"
                          />
                        </button>
                      </div>

                      <!-- Main image -->
                      <BlocksSharedEditableImage
                        :editable="editable"
                        :model-value="item.imageUrl"
                        :image-source="inlineImageSource(item.imageUrl)"
                        class="h-full bg-slate-200"
                        @update:model-value="setField(item, 'imageUrl', $event)"
                      >
                        <img
                          :src="inlineImageSource(item.imageUrl)"
                          :alt="`${item.companyName} ${item.product}`.trim()"
                          class="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </BlocksSharedEditableImage>
                    </div>

                    <!-- Card content -->
                    <div class="p-6 text-center">
                      <!-- Company -->
                      <span
                        class="text-sm font-medium uppercase text-primary-950"
                      >
                        <BlocksSharedEditableText
                          v-if="editable"
                          :editable="editable"
                          :model-value="item.companyName"
                          placeholder="Bedrijfsnaam"
                          @update:model-value="
                            setField(item, 'companyName', $event)
                          "
                        />

                        <template v-else>
                          {{ item.companyName }}
                        </template>
                      </span>

                      <!-- Category -->
                      <h3
                        class="mt-2 text-xl font-medium leading-tight text-zinc-900"
                      >
                        <BlocksSharedEditableText
                          v-if="editable"
                          :editable="editable"
                          :model-value="item.category"
                          placeholder="Categorie"
                          @update:model-value="
                            setField(item, 'category', $event)
                          "
                        />

                        <template v-else>
                          {{ item.category }}
                        </template>
                      </h3>

                      <!-- Product -->
                      <p class="mt-2 text-sm text-zinc-500">
                        <BlocksSharedEditableText
                          v-if="editable"
                          :editable="editable"
                          :model-value="item.product"
                          placeholder="Product"
                          @update:model-value="
                            setField(item, 'product', $event)
                          "
                        />

                        <template v-else>
                          {{ item.product }}
                        </template>
                      </p>

                      <!-- Footer -->
                      <p
                        v-if="editable || item.footer"
                        class="mt-2 text-sm text-zinc-500"
                      >
                        <BlocksSharedEditableText
                          v-if="editable"
                          :editable="editable"
                          :model-value="item.footer"
                          placeholder="Extra tekst"
                          @update:model-value="setField(item, 'footer', $event)"
                        />

                        <template v-else>
                          {{ item.footer }}
                        </template>
                      </p>
                    </div>
                  </article>

                  <!-- Editor controls -->
                  <BlocksSharedItemControls
                    v-if="editable && selected"
                    class="!opacity-100"
                    label="Winnaar bewerken"
                    direction="horizontal"
                    :items="model.content"
                    :index="index"
                    @update:items="model.content = $event"
                  />
                </SwiperSlide>
              </Swiper>
            </div>

            <!-- Next -->
            <button
              v-if="content.length > (editable ? 0 : 1)"
              type="button"
              aria-label="Next winner"
              class="absolute -right-6 top-1/2 z-10 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-primary-900 text-white transition hover:bg-primary-950 max-md:right-0"
              @click="showNext"
            >
              <Icon
                name="material-symbols:arrow-forward-rounded"
                class="h-6 w-6"
              />
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>

  <!-- Block settings -->
  <BlocksSharedBlockSettings
    v-if="editable && selected"
    ref="blockSettingsRef"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-500">
        Winnaars beheer je rechtstreeks in het blok.
      </p>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        @click="addWinner"
      >
        <Icon name="material-symbols:add-rounded" class="size-4" />

        Winnaar toevoegen
      </button>
    </div>
  </BlocksSharedBlockSettings>
</template>
