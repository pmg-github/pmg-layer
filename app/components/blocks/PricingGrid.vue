<script setup lang="ts">
import BlockHeading from "./shared/BlockHeading.vue";
import { blockPaddingStyle } from "../../utils/blockPadding";
import { useInlineBlock } from "../../composables/useInlineBlock";
import { linkButtonStyle } from "../../utils/buttonColor";
import { responsiveTileGridClass } from "../../utils/responsiveTileGrid";
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedHeaderAlignment,
  PaddingHandles,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from "../block-editor";
const props = withDefaults(
  defineProps<{
    editable?: boolean;
    padding?: { top?: number; bottom?: number } | null;
    selected?: boolean;
    links?: { url: string; text: string; target?: string; color?: string | null }[];
    id?: string;
    title?: string;
    subtitle?: string;
    headerAlignment?: "left" | "center" | "right";
    content?: {
      title?: string;
      description?: string;
      label?: {
        text: string;
        color?: "yellow" | "red" | "green" | "pink" | "orange" | null;
      };
      tags?: string[];
      benefits?: Array<{ label: string; included: boolean }>;
      price?: string;
      priceNote?: string;
      buttonLabel?: string;
      buttonUrl?: string;
      buttonTarget?: string;
    }[];
    colorScheme?: "light" | "dark" | "white";
    alignment?: "left" | "center" | "right";
  }>(),
  { content: () => [] },
);

const borderColor = (color?: string | null) => ({
  "border-yellow-300": color === "yellow",
  "border-red-300": color === "red",
  "border-green-300": color === "green",
  "border-pink-300": color === "pink",
  "border-orange-300": color === "orange",
  "border-gray-200": !color,
});

const badgeBg = (color?: string | null) => ({
  "bg-yellow-300": color === "yellow",
  "bg-red-300": color === "red",
  "bg-green-300": color === "green",
  "bg-pink-300": color === "pink",
  "bg-orange-300": color === "orange",
  "bg-gray-200": !color,
});

const badgeColors = [
  { value: null, label: "Grijs", class: "bg-gray-200" },
  { value: "yellow", label: "Geel", class: "bg-yellow-300" },
  { value: "red", label: "Rood", class: "bg-red-300" },
  { value: "green", label: "Groen", class: "bg-green-300" },
  { value: "pink", label: "Roze", class: "bg-pink-300" },
  { value: "orange", label: "Oranje", class: "bg-orange-300" },
] as const;

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
      };
    default:
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-gray-600",
      };
  }
});

const emits = defineEmits([
  "update:props",
  "update:padding",
  "update:title",
  "update:subtitle",
  "update:headerAlignment",
  "update:content",
  "update:links",
  "update:kicker",
  "update:alignment",
]);

const { model, setField, update } = useInlineBlock(props, emits);
const gridClass = computed(() =>
  responsiveTileGridClass(props.content?.length ?? 0, 3),
);
const cardAlignment = computed(() =>
  props.alignment === "center" || props.alignment === "right"
    ? props.alignment
    : "left",
);
const cardAlignmentClass = computed(
  () =>
    ({ left: "text-left", center: "text-center", right: "text-right" })[
      cardAlignment.value
    ],
);
const cardJustifyClass = computed(
  () =>
    ({
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    })[cardAlignment.value],
);
const addButtonAlignmentClass = computed(
  () =>
    ({ left: "self-start", center: "self-center", right: "self-end" })[
      cardAlignment.value
    ],
);
const alignmentOptions = [
  { value: "left", label: "Links", icon: "material-symbols:format-align-left" },
  {
    value: "center",
    label: "Gecentreerd",
    icon: "material-symbols:format-align-center",
  },
  {
    value: "right",
    label: "Rechts",
    icon: "material-symbols:format-align-right",
  },
] as const;
const blockSettingsRef = ref();
const editableLinksRef = ref();
const openBadgeColorIndex = ref<number | null>(null);
const badgeColorPickerRefs = ref<Record<number, HTMLElement>>({});

function setBadgeColorPickerRef(index: number, element: any) {
  if (element) badgeColorPickerRefs.value[index] = element as HTMLElement;
  else delete badgeColorPickerRefs.value[index];
}

function toggleBadgeColorPicker(index: number) {
  openBadgeColorIndex.value =
    openBadgeColorIndex.value === index ? null : index;
}

function closeBadgeColorPicker(event: PointerEvent) {
  const index = openBadgeColorIndex.value;
  if (index === null) return;

  const picker = badgeColorPickerRefs.value[index];
  if (!picker?.contains(event.target as Node)) {
    openBadgeColorIndex.value = null;
  }
}

onMounted(() =>
  document.addEventListener("pointerdown", closeBadgeColorPicker),
);
onUnmounted(() =>
  document.removeEventListener("pointerdown", closeBadgeColorPicker),
);

watch(
  () => props.selected,
  (selected) => {
    if (!selected) openBadgeColorIndex.value = null;
  },
);

defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});

// Verwacht: model.content.cards[]
// card: { title, label:{text,color}, tags[], benefits:[{label,included}], price, priceNote, buttonLabel, buttonUrl, buttonTarget, buttonColor }

function cardButtonLinks(card: any) {
  if (!card.buttonLabel && !card.buttonUrl) return [];

  return [
    {
      text: card.buttonLabel || "",
      url: card.buttonUrl || "",
      target: card.buttonTarget || "_self",
      color: card.buttonColor || null,
    },
  ];
}

function updateCardButton(index: number, card: any, links: any[]) {
  const link = links[0];
  update(["content", index], {
    ...card,
    buttonLabel: link?.text || "",
    buttonUrl: link?.url || "",
    buttonTarget: link?.target || "_self",
    buttonColor: link?.color || null,
  });
}

function addBenefit(index: number, card: any) {
  update(
    ["content", index, "benefits"],
    [...(card.benefits || []), { label: "", included: true }],
  );
}

function removeBenefit(cardIndex: number, card: any, benefitIndex: number) {
  update(
    ["content", cardIndex, "benefits"],
    (card.benefits || []).filter(
      (_: unknown, index: number) => index !== benefitIndex,
    ),
  );
}

function shouldShowEuroPrefix(price?: string) {
  const value = price?.trim() ?? "";
  return /^-?\d/.test(value) && !/[€$£¥]|\bEUR\b/i.test(value);
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
          v-for="(card, i) in props.content || []"
          :key="i"
          class="pricing-card group/item relative flex h-full min-w-0 w-full flex-col rounded-xl border-2 bg-white p-6 shadow-sm"
          :class="[
            borderColor(card.label?.color),
            openBadgeColorIndex === i ? 'z-50' : '',
          ]"
        >
          <div
            v-if="editable || card.label?.text"
            class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold text-gray-900"
            :class="badgeBg(card.label?.color)"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="card.label?.text"
              @update:model-value="
                update(['content', i, 'label', 'text'], $event)
              "
            /><template v-else>{{ card.label.text }}</template>

            <div
              v-if="editable && selected"
              :ref="(element) => setBadgeColorPickerRef(i, element)"
              class="absolute bottom-full left-1/2 z-[60] mb-2 -translate-x-1/2"
              @click.stop
            >
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:bg-gray-50 hover:text-gray-900"
                title="Badgekleur wijzigen"
                aria-label="Badgekleur wijzigen"
                :aria-expanded="openBadgeColorIndex === i"
                @click.stop="toggleBadgeColorPicker(i)"
              >
                <Icon name="material-symbols:palette-outline" class="size-4" />
              </button>
              <div
                v-if="openBadgeColorIndex === i"
                class="absolute bottom-10 left-1/2 z-[70] flex -translate-x-1/2 gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-xl"
                aria-label="Badgekleur"
              >
                <button
                  v-for="color in badgeColors"
                  :key="color.label"
                  type="button"
                  class="size-7 rounded-full border border-black/10 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                  :class="[
                    color.class,
                    card.label?.color === color.value
                      ? 'ring-2 ring-blue-500 ring-offset-1'
                      : '',
                  ]"
                  :title="color.label"
                  :aria-label="`Badgekleur ${color.label}`"
                  :aria-pressed="card.label?.color === color.value"
                  @click.stop.prevent="
                    update(['content', i, 'label', 'color'], color.value);
                    openBadgeColorIndex = null;
                  "
                />
              </div>
            </div>
          </div>

          <div :class="['flex flex-1 flex-col', cardAlignmentClass]">
            <h3
              class="mb-2 text-xl font-semibold leading-snug text-gray-900 sm:text-2xl"
            >
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="card.title"
                @update:model-value="setField(card, 'title', $event)"
              /><template v-else>{{ card.title }}</template>
            </h3>

            <div
              v-if="editable || card.description"
              class="mb-4 text-sm leading-relaxed text-gray-700"
            >
              <BlocksSharedEditableText
                :model-value="card.description"
                :editable="editable"
                rich
                placeholder="Beschrijving toevoegen"
                @update:model-value="setField(card, 'description', $event)"
              />
            </div>

            <div
              v-if="card.tags?.length"
              :class="['mb-2 flex flex-wrap gap-1', cardJustifyClass]"
            >
              <span
                v-for="(tag, tagIndex) in card.tags"
                :key="tagIndex"
                class="inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                ><BlocksSharedEditableText
                  :model-value="tag"
                  :editable="editable"
                  rich
                  @update:model-value="setField(card.tags, tagIndex, $event)"
              /></span>
            </div>

            <ul v-if="card.benefits?.length" class="mb-3 flex flex-col gap-2">
              <li
                v-for="(benefit, benefitIndex) in card.benefits"
                :key="benefitIndex"
                :class="['flex items-start gap-2', cardJustifyClass]"
              >
                <button
                  v-if="editable"
                  type="button"
                  class="flex size-6 shrink-0 items-center justify-center rounded hover:bg-gray-100"
                  :aria-label="
                    benefit.included
                      ? 'Wijzig naar kruisje'
                      : 'Wijzig naar vinkje'
                  "
                  :title="
                    benefit.included
                      ? 'Wijzig naar kruisje'
                      : 'Wijzig naar vinkje'
                  "
                  @click.stop="setField(benefit, 'included', !benefit.included)"
                >
                  <Icon
                    :name="
                      benefit.included
                        ? 'material-symbols:check-rounded'
                        : 'material-symbols:cancel-outline'
                    "
                    :class="
                      benefit.included ? 'text-green-500' : 'text-red-500'
                    "
                    class="size-5"
                  />
                </button>
                <Icon
                  v-else
                  :name="
                    benefit.included
                      ? 'material-symbols:check-rounded'
                      : 'material-symbols:cancel-outline'
                  "
                  :class="benefit.included ? 'text-green-500' : 'text-red-500'"
                  class="mt-0.5 size-5 shrink-0"
                />
                <div class="min-w-0 flex-1 text-sm leading-relaxed">
                  <BlocksSharedEditableText
                    :model-value="benefit.label"
                    :editable="editable"
                    rich
                    placeholder="Voordeel toevoegen"
                    @update:model-value="setField(benefit, 'label', $event)"
                  />
                </div>
                <button
                  v-if="editable"
                  type="button"
                  class="flex size-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Voordeel verwijderen"
                  aria-label="Voordeel verwijderen"
                  @click.stop="removeBenefit(i, card, benefitIndex)"
                >
                  <Icon name="material-symbols:close-rounded" class="size-4" />
                </button>
              </li>
            </ul>

            <button
              v-if="editable"
              type="button"
              class="mb-6 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-primary-900 hover:bg-primary-50"
              :class="addButtonAlignmentClass"
              @click.stop="addBenefit(i, card)"
            >
              <Icon name="material-symbols:add-rounded" class="size-4" />
              Voordeel toevoegen
            </button>

            <div
              v-if="editable || card.price || card.priceNote"
              class="mb-2 mt-auto"
            >
              <div
                v-if="editable"
                class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Prijs
              </div>
              <div
                :class="[
                  'flex items-baseline gap-1 text-3xl font-bold tracking-tight text-primary-950',
                  cardJustifyClass,
                ]"
              >
                <span v-if="shouldShowEuroPrefix(card.price)">€</span>
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="card.price"
                  placeholder="€ 0"
                  @update:model-value="setField(card, 'price', $event)"
                /><template v-else>{{ card.price }}</template>
              </div>
              <div
                v-if="editable || card.priceNote"
                class="mt-1 text-sm text-gray-500"
              >
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="card.priceNote"
                  placeholder="Bijvoorbeeld: per maand"
                  @update:model-value="setField(card, 'priceNote', $event)"
                /><template v-else>{{ card.priceNote }}</template>
              </div>
            </div>

            <BlocksSharedEditableLinks
              v-if="editable"
              class="mt-2"
              :model-value="cardButtonLinks(card)"
              :max="1"
              color-scheme="white"
              title="Knopinstellingen"
              @update:model-value="updateCardButton(i, card, $event)"
            />
            <a
              v-else-if="card.buttonLabel"
              :href="card.buttonUrl || undefined"
              :target="card.buttonTarget || '_self'"
              class="mt-2 w-full inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 bg-primary-900 text-white hover:bg-primary-950"
              :style="linkButtonStyle(card.buttonColor, 'primary')"
            >
              {{ card.buttonLabel }}
            </a>
          </div>
          <BlocksSharedItemControls
            v-if="editable && selected"
            label="Prijskaart bewerken"
            direction="horizontal"
            :items="model.content"
            :index="i"
            @update:items="model.content = $event"
          />
        </div>
        <BlocksSharedAddItem
          class="min-h-64"
          v-if="editable"
          label="Prijskaart toevoegen"
          @add="
            model.content = [
              ...(model.content || []),
              {
                title: '',
                description: '',
                label: { text: '', color: null },
                tags: [],
                benefits: [],
                price: '',
                priceNote: '',
                buttonLabel: '',
                buttonUrl: '',
                buttonTarget: '_self',
              },
            ]
          "
        />
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
    <div class="space-y-4">
      <div class="space-y-2">
        <span class="block text-xs font-medium text-gray-600"
          >Tekstuitlijning in kaarten</span
        >
        <div
          class="inline-flex rounded-lg bg-gray-100 p-1"
          role="group"
          aria-label="Tekstuitlijning in kaarten"
        >
          <button
            v-for="option in alignmentOptions"
            :key="option.value"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="
              cardAlignment === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            "
            :aria-pressed="cardAlignment === option.value"
            @click="model.alignment = option.value"
          >
            <Icon :name="option.icon" class="size-4" />
            {{ option.label }}
          </button>
        </div>
      </div>
      <p class="text-sm text-gray-500">
        Prijskaarten beheer je rechtstreeks in het blok.
      </p>
    </div>
  </BlocksSharedBlockSettings>
</template>
