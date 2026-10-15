<script setup lang="ts">
import BlockHeading from "./shared/BlockHeading.vue";
import { blockPaddingStyle } from "../../utils/blockPadding";
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedHeaderAlignment,
  PaddingHandles,
  BlocksSharedEditableIcon,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { computed } from "vue";
import { responsiveTileGridClass } from "../../utils/responsiveTileGrid";

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    padding?: { top?: number; bottom?: number } | null;
    selected?: boolean;
    id?: string;
    links?: { url: string; text: string; target?: string }[];
    title?: string;
    subtitle?: string;
    headerAlignment?: "left" | "center" | "right";
    content?: {
      tiles?: Array<{
        icon?: string;
        links?: { url: string; text: string; target?: string }[];
        title?: string;
        subtitle?: string;
        description?: string;
      }>;
      columns?: number;
      alignment?: "left" | "center" | "right";
    };
    colorScheme?: "light" | "dark" | "white";
  }>(),
  { content: () => ({ tiles: [] }) },
);

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

function normalizeColumns(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.min(4, Math.max(1, Math.round(number)))
    : 3;
}
const cols = computed(() => normalizeColumns(props.content?.columns));
const contentAlignment = computed(() => {
  const alignment = props.content?.alignment;
  return alignment === "left" || alignment === "right" ? alignment : "center";
});
const contentAlignmentClass = computed(
  () =>
    ({
      left: "text-left",
      center: "text-center",
      right: "text-right",
    })[contentAlignment.value],
);
const contentSelfAlignmentClass = computed(
  () =>
    ({
      left: "self-start",
      center: "self-center",
      right: "self-end",
    })[contentAlignment.value],
);
const contentJustifyClass = computed(
  () =>
    ({
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    })[contentAlignment.value],
);
const gridClass = computed(() =>
  responsiveTileGridClass(props.content?.tiles?.length ?? 0, cols.value),
);

const cardClass = computed(
  () =>
    "flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
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
    default: // white
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-gray-600",
        card: "bg-white text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});

const iconMap: Record<string, string> = {
  info: "material-symbols:info",
  map: "material-symbols:map",
  medical: "material-symbols:medical-services",
  ship: "material-symbols:directions-boat",
  tag: "material-symbols:local-offer",
  image: "material-symbols:photo",
};

function iconName(key?: string) {
  if (!key) return "material-symbols:editor-choice";
  return iconMap[key] || key;
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
defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});

// Verwacht: model.content.columns + model.content.tiles[]
// tile: { icon,title,subtitle,description,links:[{url,text,target}] }

function addTile() {
  const tiles = model.content.tiles || [];
  model.content.tiles = [
    ...tiles,
    {
      icon: "",
      title: "",
      subtitle: "",
      description: "",
      links: [],
    },
  ];
}
</script>

<template>
  <section
    data-block-padding
    :style="blockPaddingStyle(model.padding)"
    :id="props.id"
    :class="['group relative scroll-mt-20 py-16 md:py-20', themeClasses.bg]"
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

      <div :class="gridClass">
        <div
          v-for="(t, i) in props.content?.tiles || []"
          :key="i"
          :class="[
            'tile-grid-item group/item relative',
            cardClass,
            themeClasses.card,
          ]"
        >
          <BlocksSharedItemControls
            v-if="editable && selected"
            label="Tegel bewerken"
            direction="horizontal"
            :items="model.content.tiles"
            :index="i"
            @update:items="model.content.tiles = $event"
          />

          <div :class="['flex flex-col', contentAlignmentClass]">
            <BlocksSharedEditableIcon
              v-if="editable"
              :class="['mb-4', contentSelfAlignmentClass]"
              :model-value="t?.icon"
              label="Icoon wijzigen"
              @update:model-value="setField(t, 'icon', $event)"
            >
              <Icon
                :name="iconName(t?.icon)"
                class="size-6 text-primary-900"
                aria-hidden="true"
              />
            </BlocksSharedEditableIcon>
            <span
              v-else-if="t?.icon"
              class="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 ring-1 ring-primary-200"
              :class="contentSelfAlignmentClass"
            >
              <Icon
                :name="iconName(t.icon)"
                class="size-6 text-primary-900"
                aria-hidden="true"
              />
              <span class="sr-only">Icon for {{ t?.title }}</span>
            </span>
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
          </div>

          <div
            :class="[
              'card-description mb-4 mt-4 text-gray-700',
              contentAlignmentClass,
            ]"
          >
            <BlocksSharedEditableText
              :model-value="t?.description"
              :editable="editable"
              rich
              @update:model-value="setField(t, 'description', $event)"
            />
          </div>

          <div
            v-if="editable || t.links?.length"
            :class="['mt-auto flex w-full', contentJustifyClass]"
          >
            <BlocksSharedEditableLinks
              v-if="editable"
              :model-value="t.links"
              :max="1"
              color-scheme="white"
              title="Tegellink"
              @update:model-value="setField(t, 'links', $event)"
            />
            <a
              v-else-if="
                t?.links?.[0]?.url?.trim() && t?.links?.[0]?.text?.trim()
              "
              :href="t.links[0].url"
              :target="t.links[0].target || '_self'"
              class="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full bg-primary-900 px-6 py-3 text-center text-sm font-semibold leading-5 text-white transition-colors hover:bg-primary-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            >
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="t.links[0].text"
                @update:model-value="setField(t.links[0], 'text', $event)"
              /><template v-else>{{ t.links[0].text }}</template>
            </a>
          </div>
        </div>

        <BlocksSharedAddItem
          v-if="editable"
          class="min-h-64"
          label="Tegel toevoegen"
          @add="addTile"
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
          <a
            v-for="(l, idx) in props.links"
            :key="idx"
            :href="l.url"
            :target="l.target || '_self'"
            class="inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
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
    <BlocksSharedHeaderAlignment
      :model-value="props.headerAlignment || 'center'"
      @update:model-value="update(['headerAlignment'], $event)"
    />
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
                value: 'left',
                label: 'Links',
                icon: 'material-symbols:format-align-left',
              },
              {
                value: 'center',
                label: 'Gecentreerd',
                icon: 'material-symbols:format-align-center',
              },
              {
                value: 'right',
                label: 'Rechts',
                icon: 'material-symbols:format-align-right',
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
        <SharedInput
          type="number"
          min="1"
          max="4"
          step="1"
          :model-value="String(cols)"
          @update:model-value="model.content.columns = normalizeColumns($event)"
        />
      </div>
    </div>
  </BlocksSharedBlockSettings>
</template>

<style scoped>
:deep(.editor-prose p:empty)::before {
  content: "\00a0"; /* non-breaking space */
}
</style>
