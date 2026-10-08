<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableIcon,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import { computed } from 'vue';

interface Feature {
  icon?: string | object;
  title: string;
  subtitle?: string;
}

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  title?: string;
  subtitle?: string;
  content?: Feature[];
  colorScheme?: 'light' | 'dark' | 'white';
  links?: { url: string; text: string; target?: string }[];
}>();

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white/90',
        iconBg: 'bg-white/10 text-white',
        button: 'bg-white text-primary-950 hover:bg-primary-50',
        secondaryButton:
          'border border-white bg-transparent text-white hover:bg-white/10',
      };
    case 'light':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-900',
        subtitle: 'text-primary-950',
        iconBg: 'bg-primary-100 text-primary-900',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100',
      };
    default:
      return {
        bg: 'bg-white',
        text: 'text-primary-900',
        subtitle: 'text-gray-600',
        iconBg: 'bg-primary-100 text-primary-900',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
      };
  }
});

function iconName(icon?: string | object) {
  if (!icon) return '';
  if (typeof icon === 'string') return icon;
  return '';
}

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

// verwacht: model.content = Feature[]
// Feature: { icon, title, subtitle }  (jij had ook "icoon" in comment—hou hier consistent)
</script>

<template>
  <section
    :class="[themeClasses.bg, 'group relative py-16 md:py-20']"
    aria-labelledby="content-title"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <h3 :class="['text-center text-2xl font-bold sm:text-3xl', themeClasses.text]">
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

      <div>
        <ul class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="(f, i) in props.content || []"
            :key="i"
            class="group/item relative flex items-start gap-4"
          >
            <BlocksSharedEditableIcon
              v-if="editable"
              :model-value="iconName(f.icon)"
              label="Feature-icoon wijzigen"
              :trigger-class="`rounded-md ${themeClasses.iconBg}`"
              @update:model-value="setField(f, 'icon', $event)"
            >
              <Icon
                :name="iconName(f.icon) || 'material-symbols:add-rounded'"
                class="h-6 w-6"
                aria-hidden="true"
              />
            </BlocksSharedEditableIcon>
            <div
              v-else
              :class="[
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md',
                themeClasses.iconBg,
              ]"
            >
              <Icon
                :name="iconName(f.icon) || 'material-symbols:add-rounded'"
                class="h-6 w-6"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 :class="[' font-medium', themeClasses.text]">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="f.title"
                  @update:model-value="setField(f, 'title', $event)"
                /><template v-else>{{ f.title }}</template>
              </h3>
              <p :class="['mt-1 text-sm', themeClasses.subtitle]">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="f.subtitle"
                  @update:model-value="setField(f, 'subtitle', $event)"
                /><template v-else>{{ f.subtitle }}</template>
              </p>
            </div>
            <BlocksSharedItemControls
              v-if="editable && selected"
              label="Feature bewerken"
              direction="horizontal"
              :items="model.content"
              :index="i"
              @update:items="model.content = $event"
            />
          </li>
          <li v-if="editable" class="flex min-h-28">
            <BlocksSharedAddItem
              label="Feature toevoegen"
              @add="
                model.content = [
                  ...(model.content || []),
                  { icon: '', title: '', subtitle: '' },
                ]
              "
            />
          </li>
        </ul>
      </div>
      <div
        class="mt-12 flex w-full flex-col justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0"
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
    </div>
  </section>

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <p class="text-sm text-gray-500">
      Features beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>
