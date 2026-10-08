<script setup lang="ts">
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { computed } from "vue";

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  title?: string;
  subtitle?: string;
  colorScheme?: "light" | "dark" | "white";
  links?: { url: string; text: string; target?: string }[];
  content: {
    items?: {
      label: number;
      title: string;
      description: string;
    }[];
    notes?: Array<{
      title: string;
      content: string;
    }>;
  };
}>();

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white",
        content: "text-white",
        noteBg: "bg-white/10 ring-1 ring-white/15",
        noteTitle: "text-white",
        noteContent: "text-white/80",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
        timelineBorder: "border-white/30",
        timelineDot: "bg-white",
        labelBg: "bg-white/15",
        labelText: "text-white",
        itemText: "text-white/80",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        content: "text-primary-900",
        noteBg: "bg-primary-50",
        noteTitle: "text-primary-950",
        noteContent: "text-gray-700",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
        timelineBorder: "border-primary-200",
        timelineDot: "bg-primary-400",
        labelBg: "bg-primary-100",
        labelText: "text-primary-950",
        itemText: "text-gray-500",
      };
    default: // white
      return {
        bg: "bg-white",
        text: "text-gray-900",
        subtitle: "text-gray-600",
        content: "text-gray-800",
        noteBg: "bg-primary-50",
        noteTitle: "text-primary-950",
        noteContent: "text-gray-700",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
        timelineBorder: "border-primary-200",
        timelineDot: "bg-primary-400",
        labelBg: "bg-primary-100",
        labelText: "text-primary-950",
        itemText: "text-gray-500",
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
  "update:title",
  "update:subtitle",
  "update:content",
  "update:links",
  "update:kicker",
]);

const { model, setField, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const editableLinksRef = ref();

const moveContentItem = (
  collection: "items" | "notes",
  index: number,
  direction: number,
) => {
  const items = [...(model.content[collection] || [])];
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return;

  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  model.content[collection] = items;
};

const removeContentItem = (collection: "items" | "notes", index: number) => {
  const items = [...(model.content[collection] || [])];
  items.splice(index, 1);
  model.content[collection] = items;
};

defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});

// verwacht:
// model.content.items = [{ label, title, description }]
// model.content.notes = [{ title, content }]  (in jouw file had je note.title + note.content)
</script>

<template>
  <section :class="[themeClasses.bg, 'group relative py-16 md:py-20']">
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div :class="['prose mx-auto max-w-4xl ', themeClasses.content]">
        <h3
          :class="[
            'text-center text-2xl font-bold sm:text-3xl',
            themeClasses.text,
          ]"
        >
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

        <ol :class="['relative border-s', themeClasses.timelineBorder]">
          <li
            v-for="(item, itemIndex) in content.items"
            :key="item.label"
            class="group/timeline-item relative mb-10 ms-4"
          >
            <div
              :class="[
                'timeline-dot absolute mt-1.5 h-3 w-3 rounded-full border border-white',
                themeClasses.timelineDot,
              ]"
            ></div>

            <span
              :class="[
                'mb-1 inline-block rounded-full px-3 py-0.5 align-middle text-xs font-semibold',
                themeClasses.labelBg,
                themeClasses.labelText,
              ]"
            >
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="item.label"
                @update:model-value="setField(item, 'label', $event)"
              /><template v-else>{{ item.label }}</template>
            </span>

            <div
              class="editor-prose"
              :class="['mb-4 font-normal', themeClasses.itemText, 'text-base']"
            >
              <strong
                ><BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="item.title"
                  @update:model-value="setField(item, 'title', $event)"
                /><template v-else>{{ item.title }}</template></strong
              ><br />

              <div class="text-sm">
                <BlocksSharedEditableText
                  :model-value="item.description"
                  :editable="editable"
                  rich
                  @update:model-value="setField(item, 'description', $event)"
                />
              </div>
            </div>
            <div
              v-if="editable && selected"
              class="absolute right-0 top-0 flex overflow-hidden rounded-lg border border-gray-200 bg-white/95 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/timeline-item:opacity-100"
            >
              <button
                type="button"
                class="flex size-7 items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-25"
                :disabled="itemIndex === 0"
                title="Naar boven"
                aria-label="Tijdlijn-item omhoog"
                @click.stop="moveContentItem('items', itemIndex, -1)"
              >
                <Icon
                  name="material-symbols:arrow-upward-rounded"
                  class="size-4"
                />
              </button>
              <button
                type="button"
                class="flex size-7 items-center justify-center border-l border-gray-200 text-gray-400 transition hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-25"
                :disabled="itemIndex === content.items.length - 1"
                title="Naar beneden"
                aria-label="Tijdlijn-item omlaag"
                @click.stop="moveContentItem('items', itemIndex, 1)"
              >
                <Icon
                  name="material-symbols:arrow-downward-rounded"
                  class="size-4"
                />
              </button>
              <button
                type="button"
                class="flex size-7 items-center justify-center border-l border-gray-200 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                title="Verwijderen"
                aria-label="Tijdlijn-item verwijderen"
                @click.stop="removeContentItem('items', itemIndex)"
              >
                <Icon
                  name="material-symbols:delete-outline-rounded"
                  class="size-4"
                />
              </button>
            </div>
          </li>
          <li v-if="editable" class="relative mb-10 ms-4">
            <div
              :class="[
                'timeline-dot absolute mt-6 h-3 w-3 rounded-full border border-white',
                themeClasses.timelineDot,
              ]"
            ></div>
            <BlocksSharedAddItem
              class="min-h-24"
              label="Tijdlijn-item toevoegen"
              @add="
                model.content.items = [
                  ...(model.content.items || []),
                  { label: '', title: '', description: '' },
                ]
              "
            />
          </li>
        </ol>

        <div
          v-if="editable || (content.notes?.length && content.notes.length > 0)"
          class="mt-12 grid grid-cols-1 gap-8"
        >
          <div
            v-for="(note, index) in content.notes"
            :key="index"
            :class="[
              'group/timeline-note relative rounded-lg p-6',
              themeClasses.noteBg,
            ]"
          >
            <h4 :class="['mb-4 text-lg font-semibold', themeClasses.noteTitle]">
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="note?.title"
                @update:model-value="setField(note, 'title', $event)"
              /><template v-else>{{ note?.title }}</template>
            </h4>
            <div :class="[themeClasses.noteContent]">
              <BlocksSharedEditableText
                :model-value="note?.content"
                :editable="editable"
                rich
                @update:model-value="setField(note, 'content', $event)"
              />
            </div>
            <div
              v-if="editable && selected"
              class="absolute right-3 top-3 flex overflow-hidden rounded-lg border border-gray-200 bg-white/95 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/timeline-note:opacity-100"
            >
              <button
                type="button"
                class="flex size-7 items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-25"
                :disabled="index === 0"
                title="Naar boven"
                aria-label="Notitie omhoog"
                @click.stop="moveContentItem('notes', index, -1)"
              >
                <Icon
                  name="material-symbols:arrow-upward-rounded"
                  class="size-4"
                />
              </button>
              <button
                type="button"
                class="flex size-7 items-center justify-center border-l border-gray-200 text-gray-400 transition hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-25"
                :disabled="index === content.notes.length - 1"
                title="Naar beneden"
                aria-label="Notitie omlaag"
                @click.stop="moveContentItem('notes', index, 1)"
              >
                <Icon
                  name="material-symbols:arrow-downward-rounded"
                  class="size-4"
                />
              </button>
              <button
                type="button"
                class="flex size-7 items-center justify-center border-l border-gray-200 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                title="Verwijderen"
                aria-label="Notitie verwijderen"
                @click.stop="removeContentItem('notes', index)"
              >
                <Icon
                  name="material-symbols:delete-outline-rounded"
                  class="size-4"
                />
              </button>
            </div>
          </div>
          <BlocksSharedAddItem
            v-if="editable"
            class="min-h-32"
            label="Notitie toevoegen"
            @add="
              model.content.notes = [
                ...(model.content.notes || []),
                { title: '', content: '' },
              ]
            "
          />
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
      Tijdlijn-items en notities beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
.timeline-dot {
  /* The item has a 1rem inline margin; offset that plus half the marker width. */
  inset-inline-start: calc(-1rem - 0.375rem);
}

/* Scoped styles for v-html content in this block */
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
