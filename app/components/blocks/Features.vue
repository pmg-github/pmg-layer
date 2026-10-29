<script setup lang="ts">
import BlockHeading from "./shared/BlockHeading.vue";
import { blockPaddingStyle } from "../../utils/blockPadding";
import { useInlineBlock } from "../../composables/useInlineBlock";
import { linkButtonStyle } from "../../utils/buttonColor";
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

interface Feature {
  icon?: string | object;
  title: string;
  subtitle?: string;
}

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    padding?: { top?: number; bottom?: number } | null;
    selected?: boolean;
    id?: string;
    title?: string;
    subtitle?: string;
    headerAlignment?: "left" | "center" | "right";
    content?: Feature[];
    colorScheme?: "light" | "dark" | "white";
    links?: { url: string; text: string; target?: string; color?: string | null }[];
  }>(),
  { content: () => [] },
);

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white/90",
        iconBg: "bg-white/10 text-white",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        iconBg: "bg-primary-100 text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      };
    default:
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-gray-600",
        iconBg: "bg-primary-100 text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});

function iconName(icon?: string | object) {
  if (!icon) return "";
  if (typeof icon === "string") return icon;
  return "";
}

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

// verwacht: model.content = Feature[]
// Feature: { icon, title, subtitle }  (jij had ook "icoon" in comment—hou hier consistent)
</script>

<template>
  <section
    data-block-padding
    :style="blockPaddingStyle(model.padding)"
    :class="[themeClasses.bg, 'group relative py-16 md:py-20']"
    :id="props.id"
  >
    <PaddingHandles
      :editable="editable"
      :selected="selected"
      :padding="model.padding"
      @update:padding="update(['padding'], $event)"
    />
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="container min-w-0">
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

      <div>
        <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div class="min-w-0 flex-1">
              <h3
                :class="[
                  'text-lg font-semibold leading-snug',
                  themeClasses.text,
                ]"
              >
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="f.title"
                  @update:model-value="setField(f, 'title', $event)"
                /><template v-else>{{ f.title }}</template>
              </h3>
              <p :class="['mt-2 text-sm leading-6', themeClasses.subtitle]">
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
        v-if="editable || props.links?.length"
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
            class="inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            :class="
              idx === 0 ? themeClasses.button : themeClasses.secondaryButton
            "
            :style="linkButtonStyle(l.color, idx === 0 ? 'primary' : 'secondary')"
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
    <p class="text-sm text-gray-500">
      Features beheer je rechtstreeks in het blok.
    </p>
    <section>
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
  </BlocksSharedBlockSettings>
</template>
