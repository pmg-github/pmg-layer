<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableText,
  BlocksSharedImageManager,
  BlocksSharedLinkReferenceSelect,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import { computed, ref } from 'vue';
import ContentLightbox from './ContentLightbox.vue';
import type { FileButtonViewModel } from 'models';

const { locale } = useI18n();

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  links?: { url: string; text: string; target?: string }[];
  title?: string;
  subtitle?: string;
  content?: {
    freeContent: string;
    images: Array<string | FileButtonViewModel>;
    layout: boolean;
    label?: string;
    type?: 'image' | 'video';
    videoCode?: { value: string; key: string } | null;
  };
  language?: string;
  colorScheme?: 'light' | 'dark' | 'white';
}>();

const handleAnchorClick = (url?: string, target?: string | null) => {
  if (props.editable) return;
  if (!url) return;
  if (url.startsWith('#')) {
    const el = document.querySelector(url);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  } else if (target === '_blank') {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
};

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white',
        content: 'text-white',
        label: 'bg-white/15 text-white ring-1 ring-white/20',
        button: 'bg-white text-primary-950 hover:bg-primary-50',
        secondaryButton:
          'border border-white bg-transparent text-white hover:bg-white/10',
      };
    case 'light':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-950',
        subtitle: 'text-primary-950',
        content: 'text-gray-800',
        label: 'bg-primary-900 text-white',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100',
      };
    default: // white
      return {
        bg: 'bg-white',
        text: 'text-gray-900',
        subtitle: 'text-gray-600',
        content: 'text-gray-800',
        label: 'bg-primary-900 text-white',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
      };
  }
});

const pg = ref<InstanceType<typeof ContentLightbox> | null>(null);

const imageUrl = (image?: string | FileButtonViewModel) =>
  typeof image === 'string' ? image : image?.url || '';

const imageUrls = computed(() =>
  (props.content?.images || []).map(imageUrl).filter(Boolean),
);

function openFromParent(i: number) {
  if (pg && pg.value && typeof pg.value.open === 'function') {
    pg.value.open(i);
  }
}

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
const imageManagerRef = ref();
const linkPanelOpen = ref(false);
const selectedLinkIndex = ref<number | null>(null);
defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: () => openLinkEditor(),
  openMedia: () => imageManagerRef.value?.open?.(),
});

// Keep the dashboard-only filter provider lazy so read-only consumers do not
// need to ship or initialize it.
const getAllVideoCodes = (...args: any[]) =>
  useFetchFilters().getAllVideoCodes(...args);

const openLinkEditor = (index?: number) => {
  if (typeof index === 'number') {
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

  model.links.push({ text: 'Nieuwe knop', url: '#', target: null });
  selectedLinkIndex.value = model.links.length - 1;
  linkPanelOpen.value = true;
};

const removeActiveButton = () => {
  if (selectedLinkIndex.value === null || !model.links) return;
  model.links.splice(selectedLinkIndex.value, 1);
  selectedLinkIndex.value = model.links.length ? 0 : null;
  if (!model.links.length) linkPanelOpen.value = false;
};

// verwacht: model.content = { label, freeContent, layout, type:'image'|'video', images:[], videoCode }
</script>
<template>
  <section
    :id="props.id || undefined"
    :class="[themeClasses.bg, 'group relative py-16 md:py-20']"
    :aria-labelledby="(props.id || 'contentgallery') + '-title'"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div
        :class="[
          'grid gap-16 lg:grid-cols-2 lg:items-center',
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

          <h2
            id="contentgallery-title"
            :class="[
              'text-2xl font-bold tracking-tight sm:text-3xl',
              themeClasses.text,
            ]"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="title"
              @update:model-value="update(['title'], $event)"
            /><template v-else>{{ title }}</template>
          </h2>

          <p
            v-if="editable || props.subtitle"
            :class="['mb-4 text-xl', themeClasses.subtitle]"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="props.subtitle"
              @update:model-value="setField(props, 'subtitle', $event)"
            /><template v-else>{{ props.subtitle }}</template>
          </p>

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
            class="relative mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-8"
            @focusout="handleLinksRowFocusOut"
          >
            <div
              v-for="(link, index) in model.links || []"
              :key="index"
              class="group/button relative"
              @focusin="editable && selected && openLinkEditor(Number(index))"
            >
              <a
                :href="link.url || '#'"
                :target="link.target || '_self'"
                class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                :class="
                  index === 0
                    ? themeClasses.button
                    : themeClasses.secondaryButton
                "
                @click.prevent="handleAnchorClick(link.url, link.target)"
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
              class="absolute bottom-full left-1/2 z-20 mb-2 flex w-[min(22rem,100%)] -translate-x-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 pl-3 text-gray-900 shadow-2xl"
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
        </article>

        <aside
          class="space-y-4"
          :class="props.content?.layout ? 'lg:order-1' : 'lg:order-2'"
        >
          <PMGVideoPlayer
            v-if="props.content?.type === 'video'"
            :video-id="props.content?.videoCode?.value"
            :language="props.language || locale"
            :key="props.content?.videoCode?.value"
          />

          <div
            v-else-if="props.content?.images && props.content?.images.length"
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
                  ? 'rounded-3xl'
                  : 'h-full min-h-[240px] rounded-xl',
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
                class="h-full min-h-[115px] cursor-zoom-in overflow-hidden rounded-xl"
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
                class="relative h-full min-h-[115px] cursor-zoom-in overflow-hidden rounded-xl"
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
          <!-- hidden PhotoGallery instance used only for the lightbox; we control it via ref -->
        </aside>
        <ContentLightbox
          v-if="props.content?.type !== 'video' && props.content?.images.length"
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
          <SharedInputSelect
            name="content-gallery-video-code"
            :fetch-data="(search: any) => getAllVideoCodes(search)"
            :selected="props.content?.videoCode ?? undefined"
            placeholder="Zoek op jobnummer of titel..."
            search-in-data
            @update:selected="update(['content', 'videoCode'], $event)"
          />
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
  content: '\00a0'; /* non-breaking space */
}
</style>
