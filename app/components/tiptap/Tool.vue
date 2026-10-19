<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import { useApi, useI18n } from "#imports";
import Modal from "../Modal.vue";

interface ToolItem {
  id: number;
  name: string;
  imageUrl?: string;
  "3dUrl"?: string;
}

const props = defineProps<NodeViewProps>();
const api = useApi();
const { locale } = useI18n();
const isEditable = computed(() => props.editor.isEditable);
const toolId = computed(() => props.node.attrs.toolId as number | null);
const tool = ref<ToolItem | null>(null);
const mounted = ref(false);
const loading = ref(false);
const loadError = ref(false);
const interacting = ref(false);
const viewerReady = ref(false);
const viewerError = ref(false);
const showPicker = ref(false);
const query = ref("");
const results = ref<ToolItem[]>([]);
const selected = ref<ToolItem | null>(null);
const searching = ref(false);
const searchError = ref(false);
let loadRequest = 0;
let searchRequest = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const showViewer = computed(
  () =>
    mounted.value &&
    !!tool.value?.["3dUrl"] &&
    (!isEditable.value || interacting.value),
);

const fetchTools = (params: URLSearchParams) =>
  api<ToolItem[]>(
    `/api/tools/search/${encodeURIComponent(locale.value)}?${params}`,
  );

async function loadTool() {
  const request = ++loadRequest;
  tool.value = null;
  loadError.value = false;
  interacting.value = false;
  viewerError.value = false;
  loading.value = false;
  if (!mounted.value || !toolId.value) return;
  loading.value = true;
  const id = toolId.value;
  try {
    const items = await fetchTools(new URLSearchParams({ toolId: String(id) }));
    if (request !== loadRequest) return;
    tool.value = items.find((item) => Number(item.id) === Number(id)) ?? null;
  } catch {
    if (request === loadRequest) loadError.value = true;
  } finally {
    if (request === loadRequest) loading.value = false;
  }
}

async function searchTools() {
  const request = ++searchRequest;
  searching.value = true;
  searchError.value = false;
  results.value = [];
  try {
    const items = await fetchTools(
      new URLSearchParams({
        term: query.value.trim(),
        limit: "30",
      }),
    );
    if (request === searchRequest) results.value = items;
  } catch {
    if (request === searchRequest) searchError.value = true;
  } finally {
    if (request === searchRequest) searching.value = false;
  }
}

function openPicker() {
  if (!isEditable.value) return;
  selected.value = tool.value;
  query.value = "";
  showPicker.value = true;
}

function applyTool() {
  if (!isEditable.value || !selected.value) return;
  props.updateAttributes({ toolId: Number(selected.value.id) });
  showPicker.value = false;
}

watch([mounted, toolId, locale], loadTool);
watch([query, locale, showPicker], () => {
  clearTimeout(searchTimer);
  ++searchRequest;
  results.value = [];
  searching.value = showPicker.value;
  if (!showPicker.value) return;
  searchTimer = setTimeout(searchTools, 300);
});
watch(showViewer, async (visible) => {
  if (!visible) return;
  viewerError.value = false;
  try {
    // Import only when a viewer is needed; the browser caches this module.
    if (!customElements.get("model-viewer"))
      await import("@google/model-viewer");
    viewerReady.value = true;
  } catch {
    viewerError.value = true;
  }
});
onMounted(() => {
  mounted.value = true;
  if (isEditable.value && !toolId.value) openPicker();
});
onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  ++loadRequest;
  ++searchRequest;
});
</script>

<template>
  <NodeViewWrapper class="my-4" :data-tool-id="toolId">
    <div
      contenteditable="false"
      class="overflow-hidden rounded-lg border border-gray-200"
    >
      <div
        v-if="isEditable"
        class="flex flex-wrap gap-2 border-b bg-gray-50 p-3"
      >
        <button
          type="button"
          class="rounded bg-blue-600 px-3 py-2 text-sm text-white"
          @click="openPicker"
        >
          {{ toolId ? "Andere tool selecteren" : "Tool selecteren" }}
        </button>
        <button
          v-if="interacting"
          type="button"
          class="rounded border px-3 py-2 text-sm"
          @click="interacting = false"
        >
          Voorvertoning sluiten
        </button>
        <button
          type="button"
          class="ml-auto rounded border px-3 py-2 text-sm"
          @click="deleteNode"
        >
          Verwijderen
        </button>
      </div>

      <p v-if="loading" class="p-6" role="status">Tool laden…</p>
      <div v-else-if="loadError" class="p-6" role="alert">
        <p>De tool kon niet geladen worden.</p>
        <button type="button" class="mt-2 underline" @click="loadTool">
          Opnieuw proberen
        </button>
      </div>
      <div v-else-if="tool" class="p-4">
        <h3 class="mb-3 text-lg font-semibold">{{ tool.name }}</h3>
        <model-viewer
          v-if="showViewer && viewerReady && !viewerError"
          :key="tool.id"
          :src="tool['3dUrl']"
          :poster="tool.imageUrl"
          :alt="tool.name"
          class="block aspect-square w-full rounded-lg bg-gray-50"
          camera-controls
          auto-rotate
          autoplay
          ar
          touch-action="pan-y"
          @error="viewerError = true"
        />
        <template v-else>
          <img
            v-if="tool.imageUrl"
            :src="tool.imageUrl"
            :alt="tool.name"
            class="mx-auto aspect-square max-h-96 w-full object-contain"
            loading="lazy"
          />
          <p v-else class="p-6 text-gray-500">Geen afbeelding beschikbaar.</p>
        </template>
        <p v-if="viewerError" class="mt-2 text-sm" role="alert">
          Het 3D-model kon niet geladen worden.
        </p>
        <p v-else-if="showViewer && !viewerReady" role="status">
          3D-viewer laden…
        </p>
        <button
          v-if="isEditable && tool['3dUrl'] && !interacting"
          type="button"
          class="mt-3 rounded border px-3 py-2 text-sm"
          @click="interacting = true"
        >
          3D-model bekijken
        </button>
      </div>
      <p v-else class="p-6 text-gray-500">
        {{
          toolId
            ? "Deze tool is niet beschikbaar in de geselecteerde taal."
            : "Geen tool geselecteerd."
        }}
      </p>

      <Modal
        v-if="isEditable"
        v-model:open="showPicker"
        title="Tool selecteren"
        size="2xl"
      >
        <label class="mb-4 block">
          <span class="mb-1 block text-sm font-medium">Zoeken op naam</span>
          <input
            v-model="query"
            type="search"
            class="w-full rounded border px-3 py-2"
            placeholder="Zoek een tool…"
          />
        </label>
        <p v-if="searching" role="status">Tools zoeken…</p>
        <div v-else-if="searchError" role="alert">
          <p>De tools konden niet geladen worden.</p>
          <button type="button" class="mt-2 underline" @click="searchTools">
            Opnieuw proberen
          </button>
        </div>
        <p v-else-if="!results.length">Geen tools gevonden.</p>
        <div
          v-else
          class="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2"
        >
          <button
            v-for="item in results"
            :key="item.id"
            type="button"
            class="flex items-center gap-3 rounded border p-3 text-left"
            :class="
              Number(selected?.id) === Number(item.id)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200'
            "
            :aria-pressed="Number(selected?.id) === Number(item.id)"
            @click="selected = item"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              alt=""
              class="h-16 w-16 object-contain"
              loading="lazy"
            />
            <span>
              <span class="block font-medium">{{ item.name }}</span>
              <span class="text-sm text-gray-500">{{
                item["3dUrl"] ? "3D-model" : "Afbeelding"
              }}</span>
            </span>
          </button>
        </div>
        <p class="mt-3 text-sm text-gray-500">
          Maximaal 30 resultaten. Verfijn je zoekopdracht om een tool te vinden.
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded border px-4 py-2"
            @click="showPicker = false"
          >
            Annuleren
          </button>
          <button
            type="button"
            class="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            :disabled="!selected"
            @click="applyTool"
          >
            {{ toolId ? "Tool wijzigen" : "Invoegen" }}
          </button>
        </div>
      </Modal>
    </div>
  </NodeViewWrapper>
</template>
