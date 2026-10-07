<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedImageManager,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import type { FileButtonViewModel } from 'models';
import { computed } from 'vue';
import { responsiveTileGridClass } from '../../utils/responsiveTileGrid';
const { locale } = useI18n();

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  links?: { url: string; text: string; target?: string }[];
  title?: string;
  subtitle?: string;
  content?: {
    tiles?: Array<{
      icon?: string;
      image: FileButtonViewModel;
      // links?: { url: string; text: string; target?: string }[];
      title?: string;
      subtitle?: string;
      description?: string;
      link?: { url: string; target?: string };
    }>;
    columns?: number;
    alignment?: 'center' | 'left';
  };
  colorScheme?: 'light' | 'dark' | 'white';
  language?: string;
}>();

const handleAnchorClick = (url: string, target?: string | null) => {
  if (props.editable) return;
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

const cols = computed(() =>
  Math.min(4, Math.max(1, props.content?.columns ?? 3)),
);
const contentAlignment = computed(() =>
  props.content?.alignment === 'left' ? 'left' : 'center',
);
const contentAlignmentClass = computed(() =>
  contentAlignment.value === 'center' ? 'text-center' : 'text-left',
);
const gridClass = computed(
  () =>
    responsiveTileGridClass(
      props.content?.tiles?.length ?? 0,
      cols.value,
    ),
);

const cardClass = computed(
  () => 'flex flex-col rounded-lg bg-white overflow-hidden',
);

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white',
        card: 'bg-white text-primary-900',
        button: 'bg-white text-primary-950 hover:bg-primary-50',
        secondaryButton:
          'border border-white bg-transparent text-white hover:bg-white/10',
      };
    case 'light':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-900',
        subtitle: 'text-primary-950',
        card: 'bg-white text-primary-900',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100',
      };
    default: // white
      return {
        bg: 'bg-white',
        text: 'text-primary-900',
        subtitle: 'text-gray-600',
        card: 'bg-white text-primary-900 border border-gray-200',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
      };
  }
});

const iconMap: Record<string, string> = {
  info: 'material-symbols:info',
  map: 'material-symbols:map',
  medical: 'material-symbols:medical-services',
  ship: 'material-symbols:directions-boat',
  tag: 'material-symbols:local-offer',
  image: 'material-symbols:photo',
};

function iconName(key?: string) {
  if (!key) return 'material-symbols:editor-choice';
  return iconMap[key] || key;
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
const editableLinksRef = ref();
const imageManagerRef = ref();
defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
  openMedia: () => imageManagerRef.value?.open?.(),
});

// Verwacht: model.content.columns + model.content.tiles[]
// tile: { type:'image'|'video', icon,title,subtitle,description,link,image,videoCode }

const createImageTile = (image: FileButtonViewModel) => ({
  type: 'image' as const,
  image,
  videoCode: null,
  title: '',
  subtitle: '',
  description: '',
  link: { url: '', target: '_self' },
});

const tileImageUrl = (tile: any) => {
  if (typeof tile?.image === 'string') return tile.image;
  return (
    tile?.image?.url ||
    tile?.imageUrl ||
    tile?.image?.imageUrl ||
    tile?.image?.fileUrl ||
    ''
  );
};
</script>

<template>
  <section
    :id="props.id"
    :class="['group relative scroll-mt-20 py-16 md:py-20', themeClasses.bg]"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <h3 :class="[' text-center text-3xl font-bold', themeClasses.text]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="title"
            placeholder="Titel toevoegen"
            @update:model-value="update(['title'], $event)"
          /><template v-else>{{ title }}</template>
        </h3>
        <p :class="['mb-8 text-center text-xl', themeClasses.subtitle]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="subtitle"
            placeholder="Subtitel toevoegen"
            @update:model-value="update(['subtitle'], $event)"
          /><template v-else>{{ subtitle }}</template>
        </p>
      </div>

      <div :class="gridClass">
        <component
          :is="editable ? 'div' : 'a'"
          v-for="(t, i) in props.content?.tiles || []"
          :key="i"
          :class="['relative', cardClass, themeClasses.card]"
          :href="t?.link?.url ? t.link.url : undefined"
          :target="t?.link?.target || '_self'"
        >
          <img
            v-if="tileImageUrl(t) && t?.type !== 'video'"
            :src="tileImageUrl(t)"
            class="w-full"
          />
          <div
            v-else-if="t?.type === 'video' && t?.videoCode?.value"
            :key="t.videoCode?.value"
            class="pmgvideo onview aspect-video w-full"
            :data-code="t.videoCode.value"
            :data-language="props.language || locale"
          />
          <div
            v-if="editable || t?.title || t?.subtitle || t?.description"
            :class="['p-8', contentAlignmentClass]"
          >
            <h3 class="text-2xl font-bold leading-tight md:text-3xl">
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="t?.title"
                @update:model-value="setField(t, 'title', $event)"
              /><template v-else>{{ t?.title }}</template>
            </h3>
            <p class="text-sm text-gray-600">
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="t?.subtitle"
                @update:model-value="setField(t, 'subtitle', $event)"
              /><template v-else>{{ t?.subtitle }}</template>
            </p>

            <div class="card-description mt-2 text-gray-700">
              <BlocksSharedEditableText
                :model-value="t?.description"
                :editable="editable"
                rich
                @update:model-value="setField(t, 'description', $event)"
              />
            </div>
          </div>

          <div class="mt-auto flex"></div>
        </component
        >
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
          <component
            :is="editable ? 'div' : 'a'"
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
    title="Afbeeldingstegels beheren"
    :item-factory="createImageTile"
    @update:model-value="model.content.tiles = $event"
  />

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <div class="flex flex-col space-y-4">
      <div class="space-y-2">
        <span class="block text-xs font-medium text-gray-600"
          >Uitlijning tegels</span
        >
        <div
          class="inline-flex rounded-lg bg-gray-100 p-1"
          role="group"
          aria-label="Uitlijning tegels"
        >
          <button
            v-for="option in [
              {
                value: 'center',
                label: 'Gecentreerd',
                icon: 'material-symbols:format-align-center',
              },
              {
                value: 'left',
                label: 'Links',
                icon: 'material-symbols:format-align-left',
              },
            ]"
            :key="option.value"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="
              contentAlignment === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            "
            :aria-pressed="contentAlignment === option.value"
            @click="model.content.alignment = option.value"
          >
            <Icon :name="option.icon" class="size-4" />
            {{ option.label }}
          </button>
        </div>
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600"
          >Aantal kolommen</label
        >
        <SharedInput type="number" v-model="model.content.columns" />
      </div>
    </div>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
:deep(.editor-prose p:empty)::before {
  content: '\00a0'; /* non-breaking space */
}
</style>
