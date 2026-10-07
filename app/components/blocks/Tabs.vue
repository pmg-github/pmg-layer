<script setup lang="ts">
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import type { FileButtonViewModel } from "models";
import { ref, watch, computed } from "vue";
const { locale } = useI18n();

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  content: {
    tabs?: Array<{
      title: string;
      subtitle?: string;
      text?: string;
      imageUrl?: string | FileButtonViewModel;
      image?: FileButtonViewModel;
      videoCode?: { value: string; key: string } | null;
      type?: "image" | "video";
      links?: Array<{ url: string; text: string; target?: string | null }>;
    }>;
    modelValue?: number;
  };
  language?: string;
  links?: { url: string; text: string; target?: string }[];
  title?: string;
  subtitle?: string;
  colorScheme?: "light" | "dark" | "white";
}>();

const emits = defineEmits([
  "update:modelValue",
  "update:props",
  "update:title",
  "update:subtitle",
  "update:content",
  "update:links",
  "update:kicker",
]);

const active = ref(props.content.modelValue ?? 0);

const activeValue = computed({
  get: () => String(active.value),
  set: (value: string | number) => {
    const index = Number(value);
    if (Number.isInteger(index)) active.value = index;
  },
});

watch(active, (v) => emits("update:modelValue", v));

watch(
  () => props.content.modelValue,
  (v) => {
    if (v !== undefined && v !== null) active.value = v;
  },
);

// helper to create slot name from id
function slotName(id: string | number) {
  return `tab-${String(id)}`;
}

const theme = computed(() => {
  // Consolidated, intent-driven design tokens
  switch (props.colorScheme) {
    case "dark":
      return {
        surface: "bg-primary-900",
        ring: "ring-primary-700",
        heading: "text-white",
        muted: "text-white/80",
        tabBase: "text-sm font-medium",
        tabSelected: "border-white bg-white text-gray-900 shadow-sm",
        tabIdle:
          "border-transparent text-white/80 hover:bg-white/10 hover:text-white",
        tabAction:
          "border-white/50 text-white hover:border-white hover:bg-white/10",
        chip: "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50",
        card: "bg-white/5 ring-1 ring-white/10",
        button: "bg-white text-gray-900 hover:bg-gray-100",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      } as const;
    case "light":
      return {
        surface: "bg-primary-50",
        ring: "ring-primary-200",
        heading: "text-primary-950",
        muted: "text-primary-950",
        tabBase: "text-sm font-medium",
        tabSelected: "border-primary-900 bg-primary-900 text-white shadow-sm",
        tabIdle: "border-transparent text-primary-950 hover:bg-primary-100",
        tabAction: "border-primary-900 text-primary-950 hover:bg-primary-100",
        chip: "bg-primary-100 text-primary-950 hover:bg-primary-200 focus-visible:ring-primary-300",
        card: "bg-white/80 ring-1 ring-primary-200",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      } as const;
    default:
      // light / default brand-forward
      return {
        surface: "bg-white",
        ring: "ring-primary-200",
        heading: "text-gray-900",
        muted: "text-gray-600",
        tabBase: "text-sm font-medium",
        tabSelected: "border-primary-900 bg-primary-900 text-white shadow-sm",
        tabIdle: "border-transparent text-primary-950 hover:bg-primary-50",
        tabAction: "border-primary-900 text-primary-950 hover:bg-primary-50",
        chip: "bg-primary-50 text-primary-900 hover:bg-primary-100 focus-visible:ring-primary-300",
        card: "bg-white ring-1 ring-primary-200",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      } as const;
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

// keep `active` valid when tabs change (e.g., async load)

const { model, setField, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const editableLinksRef = ref();
defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});

const inlineTabImageSource = (tab: any) =>
  typeof tab.image === "string"
    ? tab.image
    : tab.image?.url ||
      (typeof tab.imageUrl === "string" ? tab.imageUrl : tab.imageUrl?.url);

const inlineTabImage = (tab: any) => {
  const image =
    tab.image || (typeof tab.imageUrl === "object" ? tab.imageUrl : undefined);
  if (image?.id) return image;

  const url = inlineTabImageSource(tab);
  if (!url) return image || null;
  const id = Number(String(url).match(/\/(\d+)\.[^/?]+(?:\?.*)?$/)?.[1]);
  return { ...(image || {}), id: id || 0, url };
};

const inlineUpdateImage = (tab: any, image: any) => {
  if (image) {
    tab.image = image;
    tab.imageUrl = image.url;
    tab.type = "image";
    tab.videoCode = null;
  }
};

const clearTabImage = (tab: any) => {
  tab.image = null;
  tab.imageUrl = null;
};

const addTab = () => {
  const tabNumber = (model.content.tabs?.length || 0) + 1;
  model.content.tabs = [
    ...(model.content.tabs || []),
    {
      text: "",
      title: `Tab ${tabNumber}`,
      subtitle: "",
      type: "image",
      imageUrl: "",
      videoCode: null,
      links: [],
    },
  ];
  active.value = model.content.tabs.length - 1;
};

async function activateTabTitle(index: number, event: MouseEvent) {
  const editor = (
    event.currentTarget as HTMLElement
  ).querySelector<HTMLElement>('[contenteditable="true"]');
  active.value = index;
  await nextTick();
  editor?.focus();
}

const removeTab = (index: number) => {
  const tabs = [...(model.content.tabs || [])];
  tabs.splice(index, 1);
  model.content.tabs = tabs;

  if (!tabs.length) {
    active.value = 0;
  } else if (active.value > index) {
    active.value -= 1;
  } else if (active.value >= tabs.length) {
    active.value = tabs.length - 1;
  }
};

// verwacht: model.content.tabs = [{ text,title,subtitle,image,videoCode,type,links:[] }]

// Keep the dashboard-only filter provider lazy so read-only consumers do not
// need to ship or initialize it.
const getAllVideoCodes = (...args: any[]) =>
  useFetchFilters().getAllVideoCodes(...args);
</script>

<template>
  <section :class="[theme.surface, 'tabs-block group relative']">
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl py-16 md:py-20">
      <!-- Frame -->
      <!-- Header / Tabs -->
      <TabsRoot v-model="activeValue" as="div">
        <div class="w-full px-4 sm:px-6 lg:px-8">
          <div class="flex gap-4">
            <div class="mx-auto max-w-4xl text-center">
              <h3 :class="[' text-center text-3xl font-bold', theme.heading]">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="title"
                  placeholder="Titel toevoegen"
                  @update:model-value="update(['title'], $event)"
                /><template v-else>{{ title }}</template>
              </h3>
              <p :class="['mb-8 text-center text-xl', theme.muted]">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="subtitle"
                  placeholder="Subtitel toevoegen"
                  @update:model-value="update(['subtitle'], $event)"
                /><template v-else>{{ subtitle }}</template>
              </p>
            </div>
          </div>

          <div
            v-if="editable && (props.content.tabs || []).length"
            class="mb-2 flex justify-end"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-400"
              :class="theme.tabAction"
              @click.stop="addTab"
            >
              <Icon name="material-symbols:add-rounded" class="size-4" />
              Tab toevoegen
            </button>
          </div>

          <TabsList
            v-if="(props.content.tabs || []).length"
            class="flex items-end gap-1 overflow-x-auto border-b border-black/10"
            role="tablist"
          >
            <div
              v-for="(t, tabIndex) in props.content.tabs || []"
              :key="tabIndex"
              class="group/tab flex shrink-0 items-center"
            >
              <TabsTrigger
                as="div"
                :value="String(tabIndex)"
                :class="[
                  'flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-t-lg border px-4 py-3 font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400',
                  theme.tabBase,
                  active === tabIndex ? theme.tabSelected : theme.tabIdle,
                ]"
              >
                <span
                  class="leading-tight"
                  @click.capture="activateTabTitle(tabIndex, $event)"
                >
                  <BlocksSharedEditableText
                    v-if="editable"
                    :editable="editable"
                    :model-value="t.title"
                    @update:model-value="setField(t, 'title', $event)"
                  />
                  <template v-else>{{ t.title }}</template>
                </span>
                <button
                  v-if="editable"
                  type="button"
                  class="flex size-6 shrink-0 items-center justify-center rounded-md opacity-60 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 group-hover/tab:opacity-100"
                  :aria-label="`${t.title || `Tab ${tabIndex + 1}`} verwijderen`"
                  title="Tab verwijderen"
                  @click.stop.prevent="removeTab(tabIndex)"
                >
                  <Icon name="material-symbols:close-rounded" class="size-4" />
                </button>
              </TabsTrigger>
            </div>
          </TabsList>

          <button
            v-else-if="editable"
            type="button"
            class="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-400"
            :class="theme.tabAction"
            @click.stop="addTab"
          >
            <Icon
              name="material-symbols:add-circle-outline-rounded"
              class="size-7"
            />
            Eerste tab toevoegen
          </button>
        </div>

        <!-- Panels -->
        <div class="px-4 pb-6 sm:px-6 lg:px-8">
          <TabsContent
            v-for="(t, tabIndex) in props.content.tabs || []"
            :key="tabIndex"
            :value="String(tabIndex)"
            class="group/item relative focus:outline-none"
          >
            <div :class="['mt-6 grid items-stretch gap-6', 'md:grid-cols-5']">
              <!-- Left column: content (title, subtitle, text, links) -->
              <div class="md:col-span-3">
                <article>
                  <header class="mb-3">
                    <h3
                      :class="[
                        'text-lg font-semibold md:text-xl',
                        theme.heading,
                      ]"
                    >
                      <BlocksSharedEditableText
                        :editable="editable"
                        v-if="editable"
                        :model-value="t.title"
                        @update:model-value="setField(t, 'title', $event)"
                      /><template v-else>{{ t.title }}</template>
                    </h3>
                    <p
                      v-if="editable || t.subtitle"
                      :class="['mt-1 text-sm', theme.muted]"
                    >
                      <BlocksSharedEditableText
                        :editable="editable"
                        v-if="editable"
                        :model-value="t.subtitle"
                        @update:model-value="setField(t, 'subtitle', $event)"
                      /><template v-else>{{ t.subtitle }}</template>
                    </p>
                  </header>

                  <div
                    class="prose prose-p:leading-relaxed editor-prose max-w-none"
                  >
                    <div v-if="editable || t.text">
                      <BlocksSharedEditableText
                        :model-value="t.text"
                        :editable="editable"
                        rich
                        @update:model-value="setField(t, 'text', $event)"
                      />
                    </div>
                  </div>

                  <BlocksSharedEditableLinks
                    v-if="editable"
                    :model-value="t.links"
                    class="mt-5"
                    :color-scheme="props.colorScheme"
                    :max="4"
                    compact
                    title="Kleine knoppen in deze tab"
                    @update:model-value="setField(t, 'links', $event)"
                  />
                  <div
                    v-else-if="t.links && t.links.length"
                    class="mt-5 flex flex-wrap gap-2"
                  >
                    <a
                      v-for="(link, idx) in t.links"
                      :key="idx"
                      :href="link.url"
                      :target="link.target"
                      :class="[
                        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition',
                        theme.chip,
                      ]"
                      @click.prevent="handleAnchorClick(link.url, link.target)"
                    >
                      {{ link.text }}
                    </a>
                  </div>
                </article>
              </div>

              <div
                v-if="
                  editable ||
                  t.imageUrl ||
                  t.image ||
                  (t.type === 'video' && t.videoCode?.value)
                "
                class="flex items-center md:col-span-2"
              >
                <div class="w-full">
                  <div
                    v-if="editable"
                    class="mb-2 flex items-center justify-between gap-3"
                  >
                    <span :class="['text-xs font-semibold', theme.muted]">
                      Media van deze tab
                    </span>
                    <div
                      class="flex rounded-lg border border-gray-200 bg-white p-1 text-xs font-semibold shadow-sm"
                    >
                      <button
                        type="button"
                        class="rounded-md px-2.5 py-1 transition"
                        :class="
                          t.type !== 'video'
                            ? 'bg-primary-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        "
                        @click.stop="t.type = 'image'"
                      >
                        Afbeelding
                      </button>
                      <button
                        type="button"
                        class="rounded-md px-2.5 py-1 transition"
                        :class="
                          t.type === 'video'
                            ? 'bg-primary-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        "
                        @click.stop="t.type = 'video'"
                      >
                        Video
                      </button>
                    </div>
                  </div>

                  <PMGVideoPlayer
                    v-if="t.type === 'video' && t.videoCode?.value"
                    :key="t.videoCode?.value"
                    :video-id="t.videoCode.value"
                    :language="props.language || locale"
                  />
                  <SharedInputSelect
                    v-else-if="editable && t.type === 'video'"
                    :name="`tab-video-code-${tabIndex}`"
                    :fetch-data="(e) => getAllVideoCodes(e)"
                    v-model:selected="t.videoCode"
                    search-in-data
                    placeholder="Zoek op jobnummer of titel..."
                  />
                  <ImageLibraryTile
                    v-else-if="editable"
                    :image-source="inlineTabImageSource(t)"
                    :image="inlineTabImage(t)"
                    :folder-id="70"
                    @selected="inlineUpdateImage(t, $event[0])"
                    @saved="inlineUpdateImage(t, $event)"
                    @clear="clearTabImage(t)"
                  />
                  <img
                    v-else
                    :src="inlineTabImageSource(t)"
                    :alt="t.title"
                    class="h-56 w-full rounded-lg object-cover md:h-full"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </TabsRoot>
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
            :class="idx === 0 ? theme.button : theme.secondaryButton"
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
    </div>
  </section>

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <p class="text-sm text-gray-500">
      Tabs beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
/* Optional: reduce motion for users that prefer it */
@media (prefers-reduced-motion: reduce) {
  img {
    transition: none !important;
  }
}

/* Scoped styles for v-html'ed prose content inside this component only */
:deep(.editor-prose) :deep(.link) {
  color: inherit;
  text-decoration: underline;
}

:deep(.editor-prose) ul,
:deep(.editor-prose) ol {
  padding: 0 1rem;
  margin: 1.25rem 1rem 1.25rem 0.4rem;
}

:deep(.editor-prose) ul li p,
:deep(.editor-prose) ol li p {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

/* List styles */
:deep(.editor-prose) ul {
  list-style-type: disc;
}
:deep(.editor-prose) ol {
  list-style-type: decimal;
}

:deep(.editor-prose) .noImage img {
  @apply hidden;
}

:deep(.editor-prose p:empty)::before {
  content: "\00a0"; /* non-breaking space */
}
</style>
