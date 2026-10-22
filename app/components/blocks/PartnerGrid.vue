<script setup lang="ts">
import BlockHeading from "./shared/BlockHeading.vue";
import { blockPaddingStyle } from "../../utils/blockPadding";
import { useFetchCampaigns } from "../../composables/useFetchCampaigns";
import { useInlineBlock } from "../../composables/useInlineBlock";
import { linkButtonStyle } from "../../utils/buttonColor";
import {
  BlocksSharedBlockSettings,
  BlocksSharedHeaderAlignment,
  PaddingHandles,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { computed, useId } from "vue";
import type { CampagneViewModel } from "models";
const { getCampaign } = useFetchCampaigns();

const sentenceCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

type CampaignOption = { key: string; value: number };
type PartnerCampaign = CampagneViewModel & { maxRow?: number | string | null };

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    padding?: { top?: number; bottom?: number } | null;
    selected?: boolean;
    content?: { campaign?: CampaignOption | null };
    colorScheme?: "light" | "dark" | "white";
    title?: string;
    subtitle?: string;
    headerAlignment?: "left" | "center" | "right";
    links?: { url: string; text: string; target?: string; color?: string | null }[];
    id?: string;
  }>(),
  { content: () => ({}) },
);

const campaignFilters = props.editable ? useFetchFilters() : null;
const { locale } = useI18n();
const campaignScopeId = useId();
const campaignId = computed(() => {
  const value = Number(props.content?.campaign?.value);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
});

const {
  data: campaign,
  status: campaignStatus,
  error: campaignError,
  refresh: refreshCampaign,
} = useAsyncData(
  computed(
    () =>
      `partner-campaign-${campaignScopeId}-${campaignId.value ?? "none"}-${locale.value}`,
  ),
  () => {
    if (campaignId.value !== null)
      return getCampaign(campaignId.value, locale.value);
    return null;
  },
  { default: () => null },
);

const fetchCampaignOptions = async (
  query: string,
): Promise<CampaignOption[]> => {
  if (!campaignFilters) return [];
  const options = await campaignFilters.getCampaigns({ query });
  return options.flatMap((option) => {
    const value = Number(option.value);
    return typeof option.key === "string" &&
      Number.isSafeInteger(value) &&
      value > 0
      ? [{ ...option, value }]
      : [];
  });
};
const getCampaignOptionValue = (campaignOption: CampaignOption) =>
  campaignOption;

const campaignData = computed(() => {
  const data = campaign.value as PartnerCampaign | null;
  return campaignId.value !== null && Number(data?.id) === campaignId.value
    ? data
    : null;
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

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white/90",
        content: "text-white",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        content: "text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      };
    default: // white
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-gray-600",
        content: "text-gray-800",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});

const campaignItems = computed(
  () =>
    campaignData.value?.items?.filter(
      (item: any) => item.name || item.logoUrl,
    ) || [],
);

const maxItemsPerRow = computed(() => {
  const itemsPerRow = Number(campaignData.value?.maxRow);
  if (!Number.isFinite(itemsPerRow) || itemsPerRow < 1) return null;
  return Math.floor(itemsPerRow);
});

const desktopColumns = computed(() => {
  const totalItems = campaignItems.value.length;
  if (totalItems <= 0) return 1;
  if (!maxItemsPerRow.value)
    return totalItems <= 2 ? 2 : totalItems === 3 ? 3 : 4;

  return Math.min(totalItems, maxItemsPerRow.value);
});

const gridMaxWidth = computed(() => {
  if (desktopColumns.value <= 2) return "56rem";
  if (desktopColumns.value === 3) return "64rem";

  return "min(100%, calc(var(--desktop-columns) * var(--item-min-width) + (var(--desktop-columns) - 1) * var(--grid-gap)))";
});

const gridStyle = computed(() => ({
  "--desktop-columns": String(desktopColumns.value),
  "--item-min-width": desktopColumns.value <= 3 ? "13rem" : "11rem",
  "--grid-gap": "2.5rem",
  maxWidth: gridMaxWidth.value,
}));

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
const selectedCampaign = computed<CampaignOption | null>({
  get: () => props.content?.campaign ?? null,
  set: (value) => update(["content", "campaign"], value),
});
const blockSettingsRef = ref();
const editableLinksRef = ref();
defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});
</script>

<template>
  <section
    data-block-padding
    :style="blockPaddingStyle(model.padding)"
    :id="props.id"
    class="group relative scroll-mt-20"
    :class="[themeClasses.bg, 'py-16 md:py-20']"
  >
    <PaddingHandles
      :editable="editable"
      :selected="selected"
      :padding="model.padding"
      @update:padding="update(['padding'], $event)"
    />
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div
      :key="campaignData?.id"
      class="container min-w-0"
    >
      <div class="flex flex-col justify-center">
        <!-- Title -->
        <div class="text-center">
          <BlockHeading
            :title="
              editable
                ? props.title
                : sentenceCase(props.title || campaignData?.title)
            "
            :subtitle="
              editable
                ? props.subtitle
                : props.subtitle || campaignData?.subtitle
            "
            :editable="editable"
            :alignment="props.headerAlignment || 'center'"
            :title-class="themeClasses.text"
            :subtitle-class="themeClasses.subtitle"
            @update:title="update(['title'], $event)"
            @update:subtitle="update(['subtitle'], $event)"
          />
        </div>

        <!-- Logos -->
        <div
          v-if="
            editable &&
            (campaignStatus === 'pending' ||
              campaignError ||
              !campaignItems.length)
          "
          class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          <template v-if="campaignStatus === 'pending'"
            >Partners laden…</template
          >
          <template v-else-if="campaignError">
            <p>De partners konden niet worden geladen.</p>
            <button
              type="button"
              class="rounded-lg px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50"
              @click="refreshCampaign()"
            >
              Opnieuw proberen
            </button>
          </template>
          <template v-else-if="campaignId === null"
            >Selecteer een campagne via de blokinstellingen.</template
          >
          <template v-else>Deze campagne bevat nog geen partners.</template>
        </div>
        <div
          v-else
          class="mx-auto grid w-full grid-cols-2 justify-items-center gap-6 md:[grid-template-columns:repeat(var(--desktop-columns),1fr)]"
          :style="gridStyle"
        >
          <component
            v-for="item in campaignItems"
            :key="item.id"
            :is="item.url ? 'a' : 'div'"
            :href="item.url || undefined"
            :target="item.url ? '_blank' : undefined"
            :rel="item.url ? 'noopener noreferrer' : undefined"
            :class="[
              'flex aspect-square w-full max-w-72 flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center transition-transform duration-200',
              item.url ? 'cursor-pointer hover:-translate-y-1' : '',
            ]"
          >
            <img
              v-if="item.logoUrl"
              :src="item.logoUrl"
              :alt="item.name"
              class="max-h-[70%] max-w-full object-contain"
            />
            <span class="text-sm font-medium text-gray-800">{{
              item.name
            }}</span>
          </component>
        </div>
      </div>
    </div>

    <!-- Links -->
    <div
      v-if="editable || props.links?.length"
      class="container mt-8 flex flex-col justify-center gap-3 sm:flex-row"
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
  </section>

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen"
    hide-trigger
  >
    <BlocksSharedHeaderAlignment
      :model-value="props.headerAlignment || 'center'"
      @update:model-value="update(['headerAlignment'], $event)"
    />
    <PMGSelect
      v-model="selectedCampaign"
      :fetch="fetchCampaignOptions"
      label="Campagne"
      searchable
      clearable
      :display-value="selectedCampaign?.key"
      :option-value="getCampaignOptionValue"
      class="w-full"
    />
  </BlocksSharedBlockSettings>
</template>
