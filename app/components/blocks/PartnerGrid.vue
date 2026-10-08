<script setup lang="ts">
import { useFetchCampaigns } from '../../composables/useFetchCampaigns';
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import { computed } from 'vue';
const { getCampaign } = useFetchCampaigns();

const sentenceCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
// Campaign choices are only requested by the dashboard settings panel.
const getCampaigns = (...args: any[]) =>
  useFetchFilters().getCampaigns(...args);

type CampaignOption = { key: string; value: number };

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  content?: { campaign: CampaignOption };
  colorScheme?: 'light' | 'dark' | 'white';
  title?: string;
  subtitle?: string;
  links?: { url: string; text: string; target?: string }[];
  id?: string;
}>();

const { data: campaign } = useAsyncData(
  `campaign-${props.content?.campaign?.value}`,
  () => {
    if (props.content?.campaign?.value)
      return getCampaign(props.content?.campaign?.value);
    return {} as any;
  },
  { immediate: true, watch: [() => props.content?.campaign?.value] },
);

const fetchCampaignOptions = async (
  query: string,
): Promise<CampaignOption[]> => {
  const options = await getCampaigns({ query });
  return options.filter(
    (campaignOption): campaignOption is CampaignOption =>
      typeof campaignOption.key === 'string' &&
      typeof campaignOption.value === 'number',
  );
};
const getCampaignOptionValue = (campaignOption: CampaignOption) =>
  campaignOption;

const campaignData = computed(() => (campaign.value as any) || null);

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

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white/90',
        content: 'text-white',
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
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100',
      };
    default: // white
      return {
        bg: 'bg-white',
        text: 'text-primary-900',
        subtitle: 'text-gray-600',
        content: 'text-gray-800',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
      };
  }
});

const campaignItems = computed(
  () =>
    campaignData.value?.items?.filter((item: any) => item.logoUrl !== null) ||
    [],
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
  if (desktopColumns.value <= 2) return '56rem';
  if (desktopColumns.value === 3) return '64rem';

  return 'min(100%, calc(var(--desktop-columns) * var(--item-min-width) + (var(--desktop-columns) - 1) * var(--grid-gap)))';
});

const gridStyle = computed(() => ({
  '--desktop-columns': String(desktopColumns.value),
  '--item-min-width': desktopColumns.value <= 3 ? '13rem' : '11rem',
  '--grid-gap': '2.5rem',
  maxWidth: gridMaxWidth.value,
}));

const emits = defineEmits([
  'update:props',
  'update:title',
  'update:subtitle',
  'update:content',
  'update:links',
  'update:kicker',
]);

const { model, setField, update } = useInlineBlock(props, emits);
const selectedCampaign = computed<CampaignOption | null>({
  get: () => props.content?.campaign ?? null,
  set: (value) => update(['content', 'campaign'], value),
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
    :id="props.id"
    class="group relative scroll-mt-20"
    :class="[themeClasses.bg, 'py-16 md:py-20']"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div
      v-if="editable || campaignData"
      :key="campaignData?.id"
      class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
    >
      <div class="flex flex-col justify-center">
        <!-- Title -->
        <div class="text-center">
          <h2 :class="['text-2xl font-bold sm:text-3xl', themeClasses.text]">
            <BlocksSharedEditableText
              v-if="editable"
              :model-value="props.title"
              editable
              placeholder="Titel toevoegen"
              @update:model-value="update(['title'], $event)"
            />
            <template v-else>{{
              sentenceCase(props.title || campaignData?.title)
            }}</template>
          </h2>
          <p
            v-if="editable || props.subtitle || campaignData?.subtitle"
            :class="['mt-4 text-lg', themeClasses.subtitle]"
          >
            <BlocksSharedEditableText
              v-if="editable"
              :model-value="props.subtitle"
              editable
              placeholder="Subtitel toevoegen"
              @update:model-value="update(['subtitle'], $event)"
            />
            <template v-else>{{
              props.subtitle || campaignData?.subtitle
            }}</template>
          </p>
        </div>

        <!-- Logos -->
        <div
          class="mx-auto mt-10 grid w-full grid-cols-2 justify-items-center gap-2 md:[grid-template-columns:repeat(var(--desktop-columns),1fr)]"
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
              'flex aspect-square w-full max-w-72 items-center justify-center rounded-lg bg-white p-6 transition-transform duration-200',
              item.url ? 'cursor-pointer hover:-translate-y-1' : '',
            ]"
          >
            <img
              :src="item.logoUrl"
              :alt="item.name"
              class="max-h-full max-w-full object-contain"
            />
          </component>
        </div>
      </div>
    </div>

    <!-- Links -->
    <div
      class="mx-auto mt-8 flex max-w-screen-xl flex-col justify-center gap-3 px-4 sm:flex-row sm:px-6 lg:px-8"
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
  </section>

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen"
    hide-trigger
  >
    <label class="mb-1 block text-xs font-medium text-gray-600">Campagne</label>
    <PMGSelect
      :name="`target-campaign-${props.id}`"
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

<style scoped>
:global([data-reka-popper-content-wrapper]) {
  z-index: 50 !important;
}
</style>
