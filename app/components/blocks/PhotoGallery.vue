<script setup lang="ts">
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedImageManager,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { ref, computed } from "vue";
import ContentLightbox from "./ContentLightbox.vue";
import type { FileButtonViewModel } from "models";

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  content: string[] | FileButtonViewModel[];
  title?: string;
  subtitle?: string;
  links?: { url: string; text: string; target?: string }[];
  colorScheme?: "light" | "dark" | "white";
}>();

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

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      };
    default: // white
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});

const maxThumbs = 8;
const imageUrl = (image?: string | FileButtonViewModel | null) =>
  typeof image === "string" ? image : image?.url || "";
const imageUrls = computed(() =>
  (props.content || []).map(imageUrl).filter(Boolean),
);
const displayed = computed(() =>
  imageUrls.value.slice(0, props.editable ? undefined : maxThumbs),
);

// ref to the new ContentLightbox instance
const cl = ref<InstanceType<typeof ContentLightbox> | null>(null);

function open(i: number) {
  if (!props.editable && cl.value && typeof cl.value.open === "function")
    cl.value.open(i);
}

function thumbnailOnError(e: Event) {
  const el = e?.target as HTMLImageElement | null;
  if (!el) return;
  const fallback =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">Afbeelding niet beschikbaar</text></svg>';
  if (el.src !== fallback) el.src = fallback;
}

const emits = defineEmits([
  "update:props",
  "update:title",
  "update:subtitle",
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
</script>

<template>
  <section
    :id="props.id"
    :class="[themeClasses.bg, 'group relative py-16 md:py-20']"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
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
            :model-value="props.title"
            placeholder="Titel toevoegen"
            @update:model-value="setField(props, 'title', $event)"
          /><template v-else>{{ props.title }}</template>
        </h3>
        <p :class="['mb-8 text-center text-xl', themeClasses.subtitle]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="props.subtitle"
            placeholder="Subtitel toevoegen"
            @update:model-value="setField(props, 'subtitle', $event)"
          /><template v-else>{{ props.subtitle }}</template>
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="(img, i) in displayed" :key="i" class="relative">
          <button
            type="button"
            @click="open(i)"
            class="group relative w-full overflow-hidden rounded-lg bg-gray-100 focus:outline-none"
            :aria-label="`Open image ${i + 1}`"
          >
            <img
              :src="img"
              :alt="`Foto ${i + 1}`"
              class="aspect-video w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              @error="thumbnailOnError($event)"
            />

            <!-- show +N overlay only on the last displayed thumbnail when there are more images -->
            <div
              v-show="
                imageUrls.length > maxThumbs && i === displayed.length - 1
              "
              class="absolute inset-0 flex cursor-zoom-in items-center justify-center bg-black/40 text-4xl font-bold text-white"
            >
              +{{ imageUrls.length - displayed.length }}
            </div>
          </button>
        </div>
      </div>
      <div
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
          <a
            v-for="(l, idx) in props.links"
            :key="idx"
            :href="l.url"
            :target="l.target || '_self'"
            class="rounded-full px-12 py-3 text-center font-medium transition-colors"
            :class="
              idx === 0 ? themeClasses.button : themeClasses.secondaryButton
            "
            @click.prevent="handleAnchorClick(l.url, l.target)"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="l.text"
              @update:model-value="setField(l, 'text', $event)"
            /><template v-else>{{ l.text }}</template>
          </a>
        </template>
      </div>

      <ContentLightbox
        ref="cl"
        :images="imageUrls"
        :title="props.title"
        :subtitle="props.subtitle"
        :links="props.links"
      />
    </div>
  </section>

  <BlocksSharedImageManager
    v-if="editable"
    ref="imageManagerRef"
    :model-value="model.content || []"
    title="Foto's beheren"
    @update:model-value="model.content = $event"
  />

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Foto's beheren"
    hide-trigger
  >
    <p class="text-sm text-gray-500">
      Foto's beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
.prose img {
  max-width: 100%;
  height: auto;
}
:deep(.editor-prose p:empty)::before {
  content: "\00a0"; /* non-breaking space */
}
</style>
