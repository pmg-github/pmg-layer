<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import { computed } from 'vue';

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  title?: string;
  subtitle?: string;
  links?: { url: string; text: string; target?: string }[];
  content: {
    items?: {
      title: string;
      label?: Array<string>;
      description?: string | undefined | null;
    }[];
    footer?: string;
  };
  colorScheme?: 'light' | 'dark' | 'white';
}>();

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white',
        content: 'text-white',
        // Schedule rows always sit on a white card, including in dark blocks.
        itemTitle: 'text-primary-950',
        itemDesc: 'text-gray-700',
        footer: 'text-white',
        button: 'bg-white text-primary-950 hover:bg-primary-50',
        secondaryButton:
          'border border-white bg-transparent text-white hover:bg-white/10',
      };
    case 'light':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-900',
        subtitle: 'text-primary-950',
        content: 'text-primary-900',
        itemTitle: 'text-primary-950',
        itemDesc: 'text-gray-700',
        footer: 'text-gray-700',
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
        itemTitle: 'text-primary-950',
        itemDesc: 'text-gray-700',
        footer: 'text-gray-700',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
      };
  }
});

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

import { VueDraggableNext as Draggable } from 'vue-draggable-next';

// verwacht:
// model.content.footer: string
// model.content.items: [{ title, label: string[], description }]
</script>

<template>
  <section
    :id="id"
    :class="['group relative scroll-m-16 py-16 md:py-20', themeClasses.bg]"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-screen-lg">
        <h3 :class="['text-3xl font-bold', themeClasses.text]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="title"
            placeholder="Titel toevoegen"
            @update:model-value="update(['title'], $event)"
          /><template v-else>{{ title }}</template>
        </h3>
        <p :class="['mb-8 text-xl', themeClasses.subtitle]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="subtitle"
            placeholder="Subtitel toevoegen"
            @update:model-value="update(['subtitle'], $event)"
          /><template v-else>{{ subtitle }}</template>
        </p>
        <div :class="['prose max-w-none', themeClasses.content]">
          <ul class="divide-y divide-gray-100 rounded-md bg-white">
            <li
              v-for="(item, index) in content.items"
              :key="index"
              class="group/item relative px-4 py-6 sm:px-6"
            >
              <article>
                <h3 :class="['text-lg font-bold', themeClasses.itemTitle]">
                  <BlocksSharedEditableText
                    :editable="editable"
                    v-if="editable"
                    :model-value="item.title"
                    @update:model-value="setField(item, 'title', $event)"
                  /><template v-else>{{ item.title }}</template>
                </h3>
                <div
                  v-if="item.label"
                  class="mt-1 flex flex-wrap items-center gap-2"
                >
                  <span
                    v-for="(label, labelIndex) in item.label"
                    class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                  >
                    <span
                      ><BlocksSharedEditableText
                        :model-value="label"
                        :editable="editable"
                        rich
                        @update:model-value="
                          setField(item.label, labelIndex, $event)
                        "
                    /></span>
                  </span>
                </div>
                <div :class="['prose mt-2 text-sm', themeClasses.itemDesc]">
                  <BlocksSharedEditableText
                    :model-value="item.description"
                    :editable="editable"
                    rich
                    @update:model-value="setField(item, 'description', $event)"
                  />
                </div>
              </article>
              <BlocksSharedItemControls
                v-if="editable && selected"
                label="Programma-item bewerken"
                :items="model.content.items"
                :index="index"
                @update:items="model.content.items = $event"
                ><template #default="{ item: item, index }">
                  <div class="space-y-3">
                    <div class="mb-2 flex items-center justify-between">
                      <label class="text-xs font-medium text-gray-600"
                        >Labels</label
                      >
                      <button
                        type="button"
                        class="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                        @click="item.label.push('')"
                      >
                        <Icon
                          name="material-symbols:add-rounded"
                          class="size-4"
                        />
                        <span class="underline">Toevoegen</span>
                      </button>
                    </div>
                    <Draggable
                      class="flex flex-col gap-2"
                      ghost-class="ghost"
                      :list="item.label"
                      item-key="label"
                    >
                      <div
                        v-for="(label, labelIndex) in item.label"
                        :key="labelIndex"
                        class="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 hover:border-blue-200"
                      >
                        <Icon
                          class="size-4"
                          name="material-symbols:drag-indicator"
                        />
                        <span class="flex-1 text-sm text-gray-700">
                          {{ label || 'Nieuw label — bewerk op het canvas' }}
                        </span>
                        <button
                          type="button"
                          class="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Verwijder label"
                          @click="item.label.splice(labelIndex, 1)"
                        >
                          <Icon class="size-4" name="material-symbols:close" />
                        </button>
                      </div>
                    </Draggable>
                  </div> </template
              ></BlocksSharedItemControls>
            </li>
            <li v-if="editable" class="p-3 sm:p-4">
              <BlocksSharedAddItem
                class="min-h-24"
                label="Programma-item toevoegen"
                @add="
                  model.content.items = [
                    ...(model.content.items || []),
                    { title: '', label: [], description: '' },
                  ]
                "
              />
            </li>
          </ul>
          <p
            v-if="editable || content.footer"
            :class="['mt-6 text-sm', themeClasses.footer]"
          >
            <BlocksSharedEditableText
              :model-value="content.footer"
              :editable="editable"
              rich
              @update:model-value="setField(props.content, 'footer', $event)"
            />
          </p>
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
      Programma-items beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
:deep(.editor-prose p:empty)::before {
  content: '\00a0'; /* non-breaking space */
}
</style>
