<script setup lang="ts">
import VideoLibraryButton from "../block-editor/VideoLibraryButton.vue";
import MediaFrame from "./shared/MediaFrame.vue";
import MediaPlaceholder from "./shared/MediaPlaceholder.vue";
import BlockHeading from "./shared/BlockHeading.vue";
import { blockPaddingStyle } from "../../utils/blockPadding";
import { useInlineBlock } from "../../composables/useInlineBlock";
import { linkButtonStyle } from "../../utils/buttonColor";
import {
  BlocksSharedEditableLinks,
  BlocksSharedBlockSettings,
  BlocksSharedHeaderAlignment,
  PaddingHandles,
  BlocksSharedEditableText,
  BlocksSharedImageManager,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { computed, ref, useId } from "vue";
import ContentLightbox from "./ContentLightbox.vue";
import type { FileButtonViewModel } from "models";

const { locale } = useI18n();
const generatedHeadingId = useId();

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    padding?: { top?: number; bottom?: number } | null;
    selected?: boolean;
    id?: string;
    links?: {
      url: string;
      text: string;
      target?: string;
      color?: string | null;
      variant?: "primary" | "secondary" | "tertiary" | null;
    }[];
    title?: string;
    subtitle?: string;
    headerAlignment?: "left" | "center" | "right";
    content?: {
      freeContent: string;
      images: Array<string | FileButtonViewModel>;
      layout: boolean;
      label?: string;
      type?: "image" | "video";
      videoCode?: { value: string; key: string } | null;
    };
    language?: string;
    colorScheme?: "light" | "dark" | "white";
  }>(),
  { content: () => ({ images: [], freeContent: "", layout: false }) },
);

const handleAnchorClick = (url?: string, target?: string | null) => {
  if (props.editable) return;
  if (!url) return;
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

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white",
        content: "text-white",
        label: "bg-white/15 text-white ring-1 ring-white/20",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-950",
        subtitle: "text-primary-950",
        content: "text-gray-800",
        label: "bg-primary-900 text-white",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      };
    default: // white
      return {
        bg: "bg-white",
        text: "text-gray-900",
        subtitle: "text-gray-600",
        content: "text-gray-800",
        label: "bg-primary-900 text-white",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});

const pg = ref<InstanceType<typeof ContentLightbox> | null>(null);

const imageUrl = (image?: string | FileButtonViewModel) =>
  typeof image === "string" ? image : image?.url || "";

const imageUrls = computed(() =>
  (props.content?.images || []).map(imageUrl).filter(Boolean),
);

function openFromParent(i: number) {
  if (pg && pg.value && typeof pg.value.open === "function") {
    pg.value.open(i);
  }
}

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
  openLinks: () => editableLinksRef.value?.open?.(),
  openMedia: () => imageManagerRef.value?.open?.(),
});

// verwacht: model.content = { label, freeContent, layout, type:'image'|'video', images:[], videoCode }
</script>
<template>
  <section
    data-block-padding
    :style="blockPaddingStyle(model.padding)"
    :id="props.id || undefined"
    :class="[themeClasses.bg, 'group relative py-16 md:py-20']"
    :aria-labelledby="(props.id || generatedHeadingId) + '-title'"
  >
    <PaddingHandles
      :editable="editable"
      :selected="selected"
      :padding="model.padding"
      @update:padding="update(['padding'], $event)"
    />
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="container min-w-0">
      <div
        :class="[
          'grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12',
          themeClasses.text,
        ]"
      >
        <article :class="props.content?.layout ? 'lg:order-2' : 'lg:order-1'">
          <span
            v-if="editable || props.content?.label"
            :class="[
              'mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
              themeClasses.label,
            ]"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="props.content?.label"
              @update:model-value="setField(props.content, 'label', $event)"
            /><template v-else>{{ props.content?.label }}</template>
          </span>

          <BlockHeading
            :title="props.title"
            :subtitle="props.subtitle"
            :editable="editable"
            :alignment="props.headerAlignment || 'left'"
            :title-class="themeClasses.text"
            :subtitle-class="themeClasses.subtitle"
            :heading-id="(props.id || generatedHeadingId) + '-title'"
            @update:title="update(['title'], $event)"
            @update:subtitle="update(['subtitle'], $event)"
          />

          <div
            v-if="editable || props.content?.freeContent"
            :class="[
              'prose editor-prose mb-6 max-w-none pt-2',
              themeClasses.content,
            ]"
          >
            <BlocksSharedEditableText
              :model-value="props.content?.freeContent"
              :editable="editable"
              rich
              @update:model-value="
                setField(props.content, 'freeContent', $event)
              "
            />
          </div>

          <div
            v-if="editable || props.links?.length"
            class="mt-6 flex flex-wrap gap-3 md:mt-8"
          >
            <BlocksSharedEditableLinks
              v-if="editable"
              ref="editableLinksRef"
              :model-value="model.links"
              :max="3"
              :color-scheme="props.colorScheme"
              @update:model-value="update(['links'], $event)"
            />
            <template v-else
              ><a
                v-for="(link, idx) in props.links || []"
                :key="idx"
                :href="link.url || '#'"
                :target="link.target || '_self'"
                class="inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                :class="
                  idx === 0 ? themeClasses.button : themeClasses.secondaryButton
                "
                :style="
                  linkButtonStyle(
                    link.color,
                    idx === 0 ? 'primary' : 'secondary',
                    link.variant,
                    props.colorScheme === 'dark',
                  )
                "
                @click.prevent="handleAnchorClick(link.url || '#', link.target)"
                >{{ link.text }}</a
              ></template
            >
          </div>
        </article>

        <aside
          class="space-y-4"
          :class="props.content?.layout ? 'lg:order-1' : 'lg:order-2'"
        >
          <MediaFrame
            v-if="props.content?.type === 'video'"
            :empty="!props.content?.videoCode?.value"
            :editable="editable"
            kind="video"
            class="rounded-xl"
          >
            <PMGVideoPlayer
              :video-id="props.content?.videoCode?.value"
              :language="props.language || locale"
              :key="props.content?.videoCode?.value"
            />
            <template #empty
              ><MediaPlaceholder
                kind="video"
                description="Selecteer een video via de blokinstellingen."
                action-label="Video kiezen"
                @action="blockSettingsRef?.open?.()"
            /></template>
          </MediaFrame>

          <div
            v-else-if="props.content?.images && props.content?.images?.length"
            class="grid gap-4"
            :class="[
              props.content.images.length > 1
                ? 'h-[500px] lg:h-[600px] lg:grid-cols-2'
                : 'h-auto',
            ]"
          >
            <button
              v-if="props.content.images && props.content.images.length"
              class="cursor-zoom-in overflow-hidden"
              :class="[
                props.content.images.length === 1
                  ? 'aspect-video rounded-xl'
                  : 'h-full min-h-[240px] rounded-lg',
              ]"
              @click.prevent="openFromParent(0)"
            >
              <img
                :src="imageUrl(props.content.images[0])"
                :alt="props.title"
                :class="[
                  'h-full w-full',
                  props.content.images.length === 1
                    ? 'object-contain'
                    : 'object-cover',
                ]"
                loading="lazy"
              />
            </button>

            <div
              v-if="props.content.images.length > 1"
              class="grid h-full grid-rows-2 gap-4"
            >
              <button
                v-if="props.content.images.length > 1"
                class="h-full min-h-[115px] cursor-zoom-in overflow-hidden rounded-lg"
                @click.prevent="openFromParent(1)"
              >
                <img
                  :src="imageUrl(props.content.images[1])"
                  :alt="props.title"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>

              <button
                v-if="props.content.images.length > 2"
                class="relative h-full min-h-[115px] cursor-zoom-in overflow-hidden rounded-lg"
                @click.prevent="openFromParent(2)"
              >
                <img
                  :src="imageUrl(props.content.images[2])"
                  :alt="props.title"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />

                <div
                  v-if="props.content.images.length > 3"
                  class="absolute inset-0 flex items-center justify-center bg-black/40 text-4xl font-bold text-white"
                >
                  +{{ props.content.images.length - 3 }}
                </div>
              </button>
            </div>
          </div>
          <MediaFrame
            v-else
            :empty="true"
            :editable="editable"
            class="rounded-xl"
            ><template #empty
              ><MediaPlaceholder
                description="Voeg afbeeldingen toe aan dit blok."
                action-label="Afbeeldingen kiezen"
                @action="imageManagerRef?.open?.()" /></template
          ></MediaFrame>
          <!-- hidden PhotoGallery instance used only for the lightbox; we control it via ref -->
        </aside>
        <ContentLightbox
          v-if="
            props.content?.type !== 'video' && props.content?.images?.length
          "
          ref="pg"
          :images="imageUrls"
          :title="props.title"
          :subTitle="props.subtitle"
        />
      </div>
    </div>
  </section>

  <BlocksSharedImageManager
    v-if="editable"
    ref="imageManagerRef"
    :model-value="model.content.images || []"
    title="Galerij beheren"
    @update:model-value="model.content.images = $event"
  />

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <BlocksSharedHeaderAlignment
      :model-value="props.headerAlignment || 'left'"
      @update:model-value="update(['headerAlignment'], $event)"
    />
    <div class="space-y-5">
      <section>
        <h4 class="mb-2 text-xs font-semibold text-gray-600">Tekstpositie</h4>
        <div class="flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="
              model.content.layout
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="model.content.layout = true"
          >
            Links
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="
              !model.content.layout
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="model.content.layout = false"
          >
            Rechts
          </button>
        </div>
      </section>

      <section class="border-t border-gray-100 pt-5">
        <h4 class="mb-2 text-xs font-semibold text-gray-600">Media</h4>
        <div class="mb-3 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="
              model.content.type !== 'video'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="model.content.type = 'image'"
          >
            Foto(s)
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="
              model.content.type === 'video'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="model.content.type = 'video'"
          >
            Video
          </button>
        </div>

        <div v-if="model.content.type === 'video'" class="space-y-2">
          <VideoLibraryButton
            variant="subtle"
            :language="props.language || locale"
            :selected="props.content?.videoCode ?? undefined"
            @update:selected="update(['content', 'videoCode'], $event)"
            >Video kiezen</VideoLibraryButton
          >
        </div>

        <p v-else class="text-xs text-gray-500">
          Afbeeldingen beheer je via de fotoknop in de bloktoolbar.
        </p>
      </section>

      <section class="border-t border-gray-100 pt-5">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-gray-600">
            Referentie
          </span>
          <input
            class="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            :value="props.id || ''"
            placeholder="section-id"
            @input="update(['id'], ($event.target as HTMLInputElement).value)"
          />
        </label>
      </section>
    </div>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
/* Scoped styles for v-html content in this component */
:deep(.editor-prose) :deep(.link) {
  color: inherit;
  text-decoration: underline;
}

:deep(.editor-prose) ul,
:deep(.editor-prose) ol {
  padding: 0 1rem;
  margin: 1.25rem 1rem 1.25rem 0.4rem;
}

:deep(.editor-prose) ul {
  list-style-type: disc;
}
:deep(.editor-prose) ol {
  list-style-type: decimal;
}

:deep(.editor-prose) .noImage img {
  display: none;
}

:deep(.editor-prose p:empty)::before {
  content: "\00a0"; /* non-breaking space */
}
</style>
