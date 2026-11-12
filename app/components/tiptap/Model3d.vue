<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { useHead, useI18n } from '#imports';
import type { ToolsArticleListView } from 'models';
import type { Model3dAttrs } from '../../utils/extensions/model3d';
import { useFetchModels3d } from '../../composables/useFetchModels3d';
import Modal from '../Modal.vue';
import PMGInput from '../inputs/Input.vue';

const props = defineProps(nodeViewProps);
const { getModels } = useFetchModels3d();
const { locale } = useI18n();
const isEditable = computed(() => props.editor.isEditable);
const attrs = computed(() => props.node.attrs as Model3dAttrs);
const model = ref<ToolsArticleListView | null>(null);
const modelTitle = computed(() => attrs.value.title || model.value?.name || '');
const modelPoster = computed(
  () =>
    model.value?.imageUrl ||
    'https://static.pmg.be/uploads/it/general/477385.gif?width=800',
);
const loading = ref(false);
const loadError = ref(false);
const isOpen = ref(false);
const query = ref('');
const results = ref<ToolsArticleListView[]>([]);
const searching = ref(false);
const searchError = ref(false);
const draft = ref<Model3dAttrs>({ ...attrs.value });
let searchVersion = 0;
let detailVersion = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const hasModel = (tool: ToolsArticleListView) =>
  Number.isSafeInteger(Number(tool.id)) &&
  Number(tool.id) > 0 &&
  typeof tool['3dUrl'] === 'string' &&
  !!tool['3dUrl'].trim();
useHead(
  computed(() => ({
    script: model.value
      ? [
          {
            key: 'pmg-model-viewer',
            src: 'https://3d.pmg.be/lib/model-viewer/model-viewer.min.js',
            type: 'module',
          },
        ]
      : [],
  })),
);

const loadModel = async () => {
  const version = ++detailVersion;
  model.value = null;
  loadError.value = false;
  const id = Number(attrs.value.toolId);
  loading.value = Number.isSafeInteger(id) && id > 0;
  if (!loading.value) return;
  try {
    const tools = await getModels({ toolId: id }, locale.value);
    if (version === detailVersion) {
      model.value =
        tools.find((tool) => Number(tool.id) === id && hasModel(tool)) ?? null;
      loadError.value = !model.value;
    }
  } catch {
    if (version === detailVersion) loadError.value = true;
  } finally {
    if (version === detailVersion) loading.value = false;
  }
};
watch(() => [attrs.value.toolId, locale.value], loadModel, { immediate: true });

const cancelSearch = () => {
  clearTimeout(timer);
  ++searchVersion;
  searching.value = false;
  results.value = [];
  searchError.value = false;
};
const runSearch = async () => {
  const version = ++searchVersion;
  const term = query.value.trim();
  if (!term || !isOpen.value || !isEditable.value) return;
  searching.value = true;
  searchError.value = false;
  try {
    const tools = await getModels({ term }, locale.value);
    if (version === searchVersion) results.value = tools.filter(hasModel);
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
  draft.value.toolId = null;
  draft.value.modelName = '';
  if (!query.value.trim()) return;
  searching.value = true;
  timer = setTimeout(runSearch, 300);
};
const openModal = () => {
  if (!isEditable.value) return;
  cancelSearch();
  draft.value = { ...attrs.value };
  query.value = attrs.value.modelName || model.value?.name || '';
  isOpen.value = true;
};
watch(isOpen, (open) => {
  if (!open) cancelSearch();
});
watch(locale, () => {
  cancelSearch();
  if (isOpen.value && query.value.trim() && !draft.value.toolId)
    void runSearch();
});
const selectModel = (tool: ToolsArticleListView) => {
  cancelSearch();
  draft.value = {
    toolId: Number(tool.id),
    modelName: tool.name,
    title:
      Number(attrs.value.toolId) === Number(tool.id) ? draft.value.title : '',
  };
  query.value = tool.name;
};
const validDraft = computed(
  () =>
    Number.isSafeInteger(draft.value.toolId) && Number(draft.value.toolId) > 0,
);
const apply = () => {
  if (!isEditable.value || !validDraft.value) return;
  props.updateAttributes({ ...draft.value });
  isOpen.value = false;
};
const clearModel = () => {
  if (!isEditable.value) return;
  props.updateAttributes({ toolId: null, modelName: '', title: '' });
  isOpen.value = false;
};
const selectNode = () => {
  if (!isEditable.value) return;
  const pos = props.getPos();
  if (typeof pos === 'number')
    props.editor.chain().focus().setNodeSelection(pos).run();
};
onBeforeUnmount(() => {
  cancelSearch();
  ++detailVersion;
});
</script>

<template>
  <NodeViewWrapper
    class="my-4 box-border w-full max-w-full rounded-lg"
    :contenteditable="false"
  >
    <div
      v-if="!attrs.toolId && isEditable"
      class="relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50"
      @click="selectNode"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
        >
          3D-model
        </span>
      </div>
      <Icon
        name="material-symbols:deployed-code-outline"
        class="mb-4 size-12 text-gray-400"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Geen 3D-model geselecteerd
      </h3>
      <p class="mb-4 text-center text-xs text-gray-400">
        Zoek een model om een interactieve 3D-weergave toe te voegen.
      </p>
      <button
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        @click.stop="openModal"
      >
        3D-model selecteren
      </button>
    </div>
    <div v-else-if="attrs.toolId" class="relative overflow-hidden rounded-lg">
      <div
        v-if="loading"
        class="flex aspect-video flex-col items-center justify-center bg-gray-50 p-6"
        role="status"
      >
        <div
          class="mb-3 size-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
        />
        <p class="text-sm text-gray-500">3D-model laden…</p>
      </div>
      <div
        v-else-if="loadError"
        class="flex aspect-video flex-col items-center justify-center bg-amber-50 p-6"
        role="alert"
      >
        <h3 class="mb-2 text-lg font-medium text-gray-700">
          3D-model niet beschikbaar
        </h3>
        <p class="mb-4 text-center text-sm text-gray-600">
          Dit model is niet beschikbaar voor de geselecteerde taal.
        </p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          @click.stop="loadModel"
        >
          Opnieuw proberen
        </button>
      </div>
      <div v-else-if="model" class="relative">
        <h3
          v-if="modelTitle"
          class="pointer-events-none absolute left-3 top-3 z-[1] !m-0 max-w-[calc(100%_-_4.5rem)] break-words rounded-md bg-white/85 px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm backdrop-blur-sm"
        >
          {{ modelTitle }}
        </h3>
        <component
          :is="'model-viewer'"
          :key="`${model.id}-${locale}`"
          :src="model['3dUrl']"
          :alt="modelTitle"
          :poster="modelPoster"
          class="block aspect-video h-auto w-full rounded-lg bg-gray-100"
          camera-controls=""
          auto-rotate=""
          autoplay=""
          enable-pan=""
        />
      </div>
      <button
        v-if="isEditable && !props.selected && model && !loading"
        type="button"
        class="absolute inset-0 z-[1] cursor-pointer"
        title="3D-model selecteren"
        aria-label="3D-model selecteren"
        @click.stop="selectNode"
      />
      <button
        v-if="isEditable"
        type="button"
        class="absolute right-2 top-2 z-[2] flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        title="3D-model bewerken"
        aria-label="3D-model bewerken"
        @click.stop="openModal"
      >
        <Icon name="material-symbols:edit-outline" class="size-5" />
      </button>
    </div>
    <Modal
      :open="isEditable && isOpen"
      title="3D-model configureren"
      size="md"
      @update:open="isOpen = $event"
    >
      <div class="space-y-4">
        <div>
          <PMGInput
            :model-value="query"
            type="search"
            label="3D-model zoeken"
            placeholder="Zoek op naam"
            clearable
            @update:model-value="onSearchInput"
          />
          <div
            v-if="query.trim() && !draft.toolId"
            class="mt-2 max-h-52 overflow-y-auto rounded border border-gray-200"
            aria-live="polite"
          >
            <p v-if="searching" class="px-3 py-4 text-sm text-gray-500">
              3D-modellen zoeken…
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
              Geen 3D-modellen gevonden
            </p>
            <button
              v-for="tool in results"
              :key="tool.id"
              type="button"
              class="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
              @click="selectModel(tool)"
            >
              <img
                v-if="tool.imageUrl"
                :src="tool.imageUrl"
                alt=""
                class="size-10 shrink-0 rounded bg-gray-100 object-contain"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-gray-800">
                  {{ tool.name }}
                </span>
                <span class="block text-xs text-gray-500">{{ tool.id }}</span>
              </span>
              <Icon
                name="material-symbols:chevron-right"
                class="size-4 shrink-0 text-gray-400"
              />
            </button>
          </div>
        </div>
        <PMGInput
          v-if="draft.toolId"
          :model-value="draft.title"
          label="Titel"
          placeholder="Naam van het 3D-model"
          clearable
          @update:model-value="draft.title = String($event ?? '')"
        />
      </div>
      <template #footer>
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="rounded px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            :disabled="!attrs.toolId"
            @click="clearModel"
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
