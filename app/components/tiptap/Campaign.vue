<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { useFetchCampaigns, useFetchFilters, useI18n } from '#imports';
import type { CampagneViewModel } from 'models';
import type { CampaignAttrs } from '../../utils/extensions/campaign';
import Modal from '../Modal.vue';
import PMGInput from '../inputs/Input.vue';
import PMGSelect from '../inputs/Select.vue';

const props = defineProps(nodeViewProps);
type CampaignData = CampagneViewModel & { subtitle?: string; maxRow?: number };
type CampaignOption = { key: string; value: number };
const { getCampaign } = useFetchCampaigns();
const filters = props.editor.isEditable ? useFetchFilters() : null;
const { locale } = useI18n();
const isEditable = computed(() => props.editor.isEditable);
const attrs = computed(() => props.node.attrs as CampaignAttrs);
const campaign = ref<CampaignData | null>(null);
const loading = ref(false);
const loadError = ref(false);
const isOpen = ref(false);
const query = ref('');
const results = ref<CampaignOption[]>([]);
const searching = ref(false);
const searchError = ref(false);
const draft = ref<CampaignAttrs>({ ...attrs.value });
const columnOptions = [
  { key: 'Automatisch (max. 3)', value: null },
  ...[1, 2, 3, 4].map((value) => ({ key: String(value), value })),
];
let searchVersion = 0;
let detailVersion = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const loadCampaign = async () => {
  const version = ++detailVersion;
  campaign.value = null;
  loadError.value = false;
  const id = Number(attrs.value.campaignId);
  loading.value = Number.isSafeInteger(id) && id > 0;
  if (!loading.value) return;
  try {
    const data = await getCampaign(id, locale.value);
    if (version === detailVersion) {
      if (Number(data?.id) !== id) throw new Error('Campaign not found');
      campaign.value = data;
    }
  } catch {
    if (version === detailVersion) loadError.value = true;
  } finally {
    if (version === detailVersion) loading.value = false;
  }
};
watch(() => [attrs.value.campaignId, locale.value], loadCampaign, {
  immediate: true,
});

const cancelSearch = () => {
  clearTimeout(timer);
  ++searchVersion;
  searching.value = false;
  results.value = [];
  searchError.value = false;
};
const runSearch = async () => {
  const version = ++searchVersion;
  const keyword = query.value.trim();
  if (!keyword || !isOpen.value || !filters) return;
  searching.value = true;
  searchError.value = false;
  try {
    const options = await filters.getCampaigns({ query: keyword });
    if (version === searchVersion)
      results.value = options
        .flatMap((option) => {
          const value = Number(option.value);
          return typeof option.key === 'string' &&
            Number.isSafeInteger(value) &&
            value > 0
            ? [{ key: option.key, value }]
            : [];
        })
        .slice(0, 20);
  } catch {
    if (version === searchVersion) {
      results.value = [];
      searchError.value = true;
    }
  } finally {
    if (version === searchVersion) searching.value = false;
  }
};
const onSearchInput = (value: string | number | null) => {
  cancelSearch();
  query.value = String(value ?? '');
  draft.value.campaignId = null;
  draft.value.campaignName = '';
  if (!query.value.trim()) return;
  searching.value = true;
  timer = setTimeout(runSearch, 300);
};
const openModal = () => {
  if (!isEditable.value) return;
  cancelSearch();
  draft.value = {
    ...attrs.value,
    maxRow: attrs.value.maxRow
      ? Math.min(4, Math.max(1, attrs.value.maxRow))
      : null,
  };
  query.value = attrs.value.campaignName || campaign.value?.title || '';
  isOpen.value = true;
};
watch(isOpen, (open) => {
  if (!open) cancelSearch();
});
const selectCampaign = (option: CampaignOption) => {
  cancelSearch();
  if (attrs.value.campaignId !== option.value) {
    draft.value = {
      campaignId: option.value,
      campaignName: option.key,
      title: '',
      subtitle: '',
      maxRow: null,
    };
  } else {
    draft.value.campaignId = option.value;
    draft.value.campaignName = option.key;
  }
  query.value = option.key;
};
const validDraft = computed(() => {
  const columns = draft.value.maxRow;
  return (
    !!draft.value.campaignId &&
    (columns === null ||
      (Number.isInteger(columns) && columns >= 1 && columns <= 4))
  );
});
const apply = () => {
  if (!isEditable.value || !validDraft.value) return;
  props.updateAttributes({ ...draft.value });
  isOpen.value = false;
};
const clearCampaign = () => {
  if (!isEditable.value) return;
  props.updateAttributes({
    campaignId: null,
    campaignName: '',
    title: '',
    subtitle: '',
    maxRow: null,
  });
  isOpen.value = false;
};
const selectNode = () => {
  if (!isEditable.value) return;
  const pos = props.getPos();
  if (typeof pos === 'number')
    props.editor.chain().focus().setNodeSelection(pos).run();
};
const items = computed(
  () =>
    campaign.value?.items?.filter((item) => item.name || item.logoUrl) ?? [],
);
const columns = computed(() => {
  const value = Number(attrs.value.maxRow);
  return Math.min(
    items.value.length || 1,
    Number.isSafeInteger(value) && value > 0 ? Math.min(value, 4) : 3,
  );
});
onBeforeUnmount(() => {
  cancelSearch();
  ++detailVersion;
});
</script>

<template>
  <NodeViewWrapper
    class="campaign-block my-4 box-border w-full max-w-full rounded-lg"
    :contenteditable="false"
  >
    <div
      v-if="!attrs.campaignId && isEditable"
      class="relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50"
      @click="selectNode"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Campagne</span
        >
      </div>
      <Icon
        name="material-symbols:campaign-outline"
        class="mb-4 size-12 text-gray-400"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Geen campagne geselecteerd
      </h3>
      <p class="mb-4 text-center text-xs text-gray-400">
        Zoek een campagne om partners toe te voegen.
      </p>
      <button
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        @click.stop="openModal"
      >
        Campagne selecteren
      </button>
    </div>
    <section
      v-else-if="attrs.campaignId"
      class="relative overflow-hidden rounded-lg"
      :class="{ 'border border-gray-200 bg-white': isEditable }"
    >
      <div
        v-if="loading"
        class="flex aspect-video flex-col items-center justify-center bg-gray-50 p-6"
        role="status"
      >
        <div
          class="mb-3 size-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
        />
        <p class="text-sm text-gray-500">Campagne laden…</p>
      </div>
      <div
        v-else-if="loadError"
        class="flex aspect-video flex-col items-center justify-center bg-amber-50 p-6"
        role="alert"
      >
        <h3 class="mb-2 text-lg font-medium text-gray-700">
          Campagne niet beschikbaar
        </h3>
        <p class="mb-4 text-sm text-gray-600">
          De campagne kon niet worden geladen.
        </p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          @click.stop="loadCampaign"
        >
          Opnieuw proberen
        </button>
      </div>
      <div
        v-else-if="campaign"
        class="p-6 text-center"
        :class="{ 'pt-14': isEditable }"
      >
        <h2
          v-if="attrs.title || campaign.title"
          class="mb-3 text-2xl font-semibold"
        >
          {{ attrs.title || campaign.title }}
        </h2>
        <p
          v-if="attrs.subtitle || campaign.subtitle"
          class="mb-6 text-gray-600"
        >
          {{ attrs.subtitle || campaign.subtitle }}
        </p>
        <div
          class="campaign-grid grid gap-4"
          :style="{ '--campaign-columns': columns }"
        >
          <component
            :is="item.url && !isEditable ? 'a' : 'div'"
            v-for="item in items"
            :key="item.id"
            :href="!isEditable ? item.url : undefined"
            :target="!isEditable ? '_blank' : undefined"
            :rel="!isEditable ? 'noopener noreferrer' : undefined"
            class="flex min-w-0 flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <img
              v-if="item.logoUrl"
              :src="item.logoUrl"
              :alt="item.name"
              class="h-20 max-w-full object-contain"
            />
            <span class="break-words text-sm font-medium">{{ item.name }}</span>
          </component>
        </div>
        <p
          v-if="!items.length && isEditable"
          class="flex min-h-40 items-center justify-center text-sm text-gray-500"
        >
          Deze campagne bevat nog geen partners.
        </p>
      </div>
      <div
        v-if="isEditable"
        class="pointer-events-none absolute left-3 top-3 z-[2]"
      >
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Campagne</span
        >
      </div>
      <button
        v-if="isEditable && !props.selected && campaign && !loading"
        type="button"
        class="absolute inset-0 z-[1] cursor-pointer"
        title="Campagne selecteren"
        aria-label="Campagne selecteren"
        @click.stop="selectNode"
      />
      <button
        v-if="isEditable"
        type="button"
        class="absolute right-2 top-2 z-[2] flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        title="Campagne bewerken"
        aria-label="Campagne bewerken"
        @click.stop="openModal"
      >
        <Icon name="material-symbols:edit-outline" class="size-5" />
      </button>
    </section>

    <Modal
      :open="isEditable && isOpen"
      title="Campagne configureren"
      size="md"
      @update:open="isOpen = $event"
    >
      <div class="space-y-4">
        <div>
          <PMGInput
            :model-value="query"
            type="search"
            label="Campagne zoeken"
            placeholder="Zoek op campagnenaam"
            clearable
            @update:model-value="onSearchInput"
          />
          <div
            v-if="query.trim() && !draft.campaignId"
            class="mt-2 max-h-52 overflow-y-auto rounded border border-gray-200"
            aria-live="polite"
          >
            <p v-if="searching" class="px-3 py-4 text-sm text-gray-500">
              Campagnes zoeken…
            </p>
            <div
              v-else-if="searchError"
              class="px-3 py-4 text-sm text-gray-500"
              role="alert"
            >
              Zoeken is mislukt.
              <button type="button" class="text-blue-700" @click="runSearch">
                Opnieuw proberen
              </button>
            </div>
            <p
              v-else-if="!results.length"
              class="px-3 py-4 text-sm text-gray-500"
            >
              Geen campagnes gevonden
            </p>
            <button
              v-for="option in results"
              :key="option.value"
              type="button"
              class="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
              @click="selectCampaign(option)"
            >
              <span class="min-w-0">
                <span
                  class="block truncate text-sm font-medium text-gray-800"
                  >{{ option.key }}</span
                >
                <span class="block text-xs text-gray-500">{{
                  option.value
                }}</span>
              </span>
              <Icon
                name="material-symbols:chevron-right"
                class="size-4 shrink-0 text-gray-400"
              />
            </button>
          </div>
        </div>
        <template v-if="draft.campaignId">
          <PMGInput
            :model-value="draft.title"
            @update:model-value="draft.title = String($event ?? '')"
            label="Titel"
            placeholder="Titel van de campagne"
            clearable
          />
          <PMGInput
            :model-value="draft.subtitle"
            @update:model-value="draft.subtitle = String($event ?? '')"
            label="Ondertitel"
            placeholder="Ondertitel van de campagne"
            clearable
          />
          <PMGSelect
            v-model="draft.maxRow"
            :options="columnOptions"
            label="Logo’s per rij"
            placeholder="Automatisch (max. 3)"
          />
          <p class="text-xs text-gray-500">
            Deze instellingen gelden voor dit artikel. Lege tekstvelden
            gebruiken de tekst van de campagne.
          </p>
        </template>
      </div>
      <template #footer>
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="rounded px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            :disabled="!attrs.campaignId"
            @click="clearCampaign"
          >
            Verwijder
          </button>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
              @click="isOpen = false"
            >
              Annuleren
            </button>
            <button
              type="button"
              class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!validDraft"
              @click="apply"
            >
              Toepassen
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </NodeViewWrapper>
</template>

<style scoped>
.campaign-block {
  container-type: inline-size;
}
.campaign-grid {
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 280px) {
  .campaign-grid {
    grid-template-columns: repeat(
      min(var(--campaign-columns), 2),
      minmax(0, 1fr)
    );
  }
}
@container (min-width: 560px) {
  .campaign-grid {
    grid-template-columns: repeat(var(--campaign-columns), minmax(0, 1fr));
  }
}
</style>
