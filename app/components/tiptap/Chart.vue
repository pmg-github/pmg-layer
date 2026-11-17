<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import { DialogDescription } from "reka-ui";
import Modal from "../Modal.vue";
import {
  chartCoordinates,
  chartPalettes,
  chartSlicePath,
  chartTypes,
  createChartData,
  maxChartPoints,
  validateChart,
  type ChartData,
  type ChartType,
} from "../../utils/chart";

const props = defineProps<NodeViewProps>();
const isEditable = ref(props.editor.isEditable);
watch(
  () => props.editor,
  (editor, _, onCleanup) => {
    const syncEditable = () => {
      isEditable.value = editor.isEditable;
    };
    syncEditable();
    editor.on("update", syncEditable);
    editor.on("transaction", syncEditable);
    onCleanup(() => {
      editor.off("update", syncEditable);
      editor.off("transaction", syncEditable);
    });
  },
  { immediate: true },
);
const stored = computed(() => validateChart(props.node.attrs.chart));
const isEmpty = computed(() => {
  const data: unknown = props.node.attrs.chart;
  return (
    data !== null &&
    typeof data === "object" &&
    "title" in data &&
    data.title === "" &&
    "points" in data &&
    Array.isArray(data.points) &&
    !data.points.length
  );
});
const isOpen = ref(false);
const settingsId = useId();
const typeDescriptions: Record<ChartType, string> = {
  bar: "Vergelijk categorieen met elkaar.",
  line: "Toon een evolutie of verloop.",
  pie: "Toon de delen van een geheel.",
  donut: "Zoals een taart, met een open midden.",
};
type ChartDraft = Omit<ChartData, "points"> & {
  points: { label: string; value: number | string }[];
};
const draft = ref<ChartDraft>(createChartData());
const isCircularDraft = computed(
  () => draft.value.type === "pie" || draft.value.type === "donut",
);
const saveError = ref("");
const activeIndex = ref<number | null>(null);
watch(
  () => props.node.attrs.chart,
  () => {
    activeIndex.value = null;
  },
  { deep: true },
);

const numberFormat = new Intl.NumberFormat("nl-BE", {
  maximumSignificantDigits: 21,
});
const percentFormat = new Intl.NumberFormat("nl-BE", {
  style: "percent",
  maximumFractionDigits: 1,
});
const tickFormat = new Intl.NumberFormat("nl-BE", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const shortLabel = (label: string) =>
  label.length > 12 ? `${label.slice(0, 11)}...` : label;

function chartView(data: ChartData | null) {
  if (!data) return null;
  const geometry = chartCoordinates(data.points);
  const circular = data.type === "pie" || data.type === "donut";
  const colors = chartPalettes.find(
    (palette) => palette.value === data.palette,
  )!.colors;
  const color = (index: number) => colors[index % colors.length];
  const total = data.points.reduce((sum, point) => sum + point.value, 0);
  let start = 0;
  const slices = circular
    ? data.points.map((point) => {
        const fraction = point.value / total;
        const path = chartSlicePath(start, fraction, data.type === "donut");
        start += fraction;
        return { path, fraction };
      })
    : [];
  const pointText = (index: number) => {
    const point = data.points[index];
    if (!point) return "";
    const slice = slices[index];
    const percentage = slice
      ? ` (${percentFormat.format(slice.fraction)})`
      : "";
    return `${point.label}: ${numberFormat.format(point.value)}${data.unit ? ` ${data.unit}` : ""}${percentage}`;
  };
  return {
    ...data,
    geometry,
    circular,
    color,
    slices,
    pointText,
    linePath: geometry.points
      .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
      .join(" "),
    showTickLabel: (index: number) =>
      index % Math.ceil(data.points.length / 6) === 0,
  };
}

const chart = computed(() => chartView(stored.value.data));

function openSettings() {
  if (!props.editor.isEditable) return;
  const data = stored.value.data ?? createChartData();
  draft.value = { ...data, points: data.points.map((point) => ({ ...point })) };
  if (!draft.value.points.length)
    draft.value.points.push({ label: "", value: "" });
  saveError.value = "";
  isOpen.value = true;
}

function save() {
  if (!props.editor.isEditable) return;
  const result = validateChart(draft.value);
  if (!result.data) {
    saveError.value = result.error;
    return;
  }
  props.updateAttributes({ chart: result.data });
  isOpen.value = false;
}

function removeChart() {
  if (!props.editor.isEditable) return;
  isOpen.value = false;
  props.deleteNode();
}

function movePoint(index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (destination < 0 || destination >= draft.value.points.length) return;
  const [point] = draft.value.points.splice(index, 1);
  if (point) draft.value.points.splice(destination, 0, point);
}

function selectNode() {
  if (!props.editor.isEditable) return;
  const position = props.getPos();
  if (typeof position === "number") {
    props.editor.chain().focus().setNodeSelection(position).run();
  }
}

watch(isEditable, (editable) => {
  if (!editable) isOpen.value = false;
});
watch(
  draft,
  () => {
    saveError.value = "";
  },
  { deep: true },
);
</script>

<template>
  <NodeViewWrapper
    as="section"
    class="relative my-4 box-border w-full max-w-full rounded-lg"
    :class="{ 'ring-2 ring-blue-400 ring-offset-2': selected }"
    :contenteditable="false"
  >
    <button
      v-if="isEditable && chart"
      type="button"
      class="absolute right-2 top-2 z-[2] flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
      title="Grafiek bewerken"
      aria-label="Grafiek bewerken"
      @click.stop="openSettings"
    >
      <Icon
        name="material-symbols:edit-outline"
        class="size-5"
        aria-hidden="true"
      />
    </button>
    <figure v-if="chart" class="article-chart" :aria-label="chart.title">
      <figcaption :class="{ 'pr-12': isEditable }">
        <h3 class="chart-title">{{ chart.title }}</h3>
        <p v-if="chart.description" class="chart-description">
          {{ chart.description }}
        </p>
      </figcaption>
      <!-- Explicit geometry attributes also work during SVG hydration. -->
      <svg
        viewBox="0 0 640 340"
        class="chart-graphic"
        role="group"
        :aria-label="chart.title"
      >
        <template v-if="!chart.circular">
          <g
            v-for="(tick, index) in chart.geometry.ticks"
            :key="index"
            aria-hidden="true"
          >
            <line
              x1="90"
              x2="610"
              :y1.attr="tick.y"
              :y2.attr="tick.y"
              stroke="#e2e8f0"
            />
            <text
              x="80"
              :y.attr="tick.y + 4"
              text-anchor="end"
              class="axis-label"
            >
              {{ tickFormat.format(tick.value) }}
            </text>
          </g>
          <line
            x1="90"
            x2="610"
            :y1.attr="chart.geometry.baseline"
            :y2.attr="chart.geometry.baseline"
            stroke="#64748b"
          />
          <path
            v-if="chart.type === 'line'"
            :d.attr="chart.linePath"
            fill="none"
            :stroke="chart.color(0)"
            stroke-width="3"
          />
        </template>
        <g
          v-for="(point, index) in chart.geometry.points"
          :key="index"
          tabindex="0"
          role="img"
          :aria-label="chart.pointText(index)"
          class="chart-point"
          :class="{
            'is-muted': activeIndex !== null && activeIndex !== index,
          }"
          @mouseenter="activeIndex = index"
          @mouseleave="activeIndex = null"
          @focus="activeIndex = index"
          @blur="activeIndex = null"
          @click="activeIndex = index"
        >
          <title>{{ chart.pointText(index) }}</title>
          <template v-if="chart.circular">
            <path
              v-if="point.value > 0"
              :d.attr="chart.slices[index]?.path"
              :fill="chart.color(index)"
              stroke="white"
              stroke-width="2"
            />
          </template>
          <rect
            v-else-if="chart.type === 'bar'"
            :x.attr="point.x - 180 / chart.points.length"
            :y.attr="Math.min(point.y, chart.geometry.baseline)"
            :width.attr="360 / chart.points.length"
            :height.attr="
              Math.max(1, Math.abs(point.y - chart.geometry.baseline))
            "
            :fill="chart.color(index)"
            rx="2"
          />
          <template v-else>
            <circle
              :cx.attr="point.x"
              :cy.attr="point.y"
              r="14"
              fill="transparent"
            />
            <circle
              :cx.attr="point.x"
              :cy.attr="point.y"
              :r.attr="activeIndex === index ? 7 : 5"
              :fill="chart.color(0)"
              stroke="white"
              stroke-width="2"
            />
          </template>
          <text
            v-if="!chart.circular && chart.showTickLabel(index)"
            :x.attr="point.x"
            y="325"
            text-anchor="middle"
            class="axis-label"
            aria-hidden="true"
          >
            {{ shortLabel(point.label) }}
          </text>
        </g>
      </svg>
      <p class="chart-hint">
        Tik op een gegeven of gebruik de tabtoets om de waarde te bekijken.
      </p>
      <p class="chart-detail">
        {{ activeIndex === null ? "\u00a0" : chart.pointText(activeIndex) }}
      </p>
      <ul class="chart-legend" aria-label="Gegevens">
        <li v-for="(point, index) in chart.points" :key="index">
          <button
            type="button"
            :aria-label="chart.pointText(index)"
            @mouseenter="activeIndex = index"
            @mouseleave="activeIndex = null"
            @focus="activeIndex = index"
            @blur="activeIndex = null"
            @click="activeIndex = index"
          >
            <span
              class="chart-swatch"
              :style="{
                backgroundColor: chart.color(chart.type === 'line' ? 0 : index),
              }"
            />
            {{ point.label }}
          </button>
        </li>
      </ul>
      <p v-if="chart.source" class="chart-source">Bron: {{ chart.source }}</p>
    </figure>
    <div
      v-else-if="isEmpty"
      class="relative flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 pb-8 pt-14 transition-all"
      :class="{
        'cursor-pointer hover:border-blue-400 hover:bg-blue-50': isEditable,
      }"
      @click="selectNode"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Grafiek</span
        >
      </div>
      <Icon
        name="material-symbols:bar-chart"
        class="mb-4 size-12 text-gray-400"
        aria-hidden="true"
      />
      <h3 class="mb-2 text-center text-lg font-medium text-gray-700">
        Nog geen grafiek toegevoegd
      </h3>
      <p
        v-if="isEditable"
        class="mb-4 max-w-xs text-center text-sm text-gray-500"
      >
        Kies een grafiektype en voeg je gegevens toe.
      </p>
      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click.stop="openSettings"
      >
        Grafiek instellen
      </button>
    </div>
    <div
      v-else
      class="flex min-h-64 flex-col items-center justify-center rounded-lg bg-amber-50 px-6 pb-8 pt-14 text-center"
      role="alert"
    >
      <Icon
        name="material-symbols:bar-chart"
        class="mb-4 size-12 text-amber-600"
        aria-hidden="true"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Grafiek niet beschikbaar
      </h3>
      <p class="text-sm text-gray-600">{{ stored.error }}</p>
      <button
        v-if="isEditable"
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click.stop="openSettings"
      >
        Grafiek opnieuw instellen
      </button>
    </div>

    <Modal
      :open="isEditable && isOpen"
      title="Grafiek instellen"
      size="2xl"
      class="chart-settings max-h-[calc(100dvh-14rem)] overflow-y-auto"
      @update:open="isOpen = $event"
    >
      <form
        :id="`${settingsId}-form`"
        class="min-w-0 space-y-7"
        @submit.prevent="save"
      >
        <DialogDescription class="text-sm text-gray-600">
          Kies een weergave en vul je gegevens in. Je wijzigingen worden pas
          bewaard wanneer je opslaat.
        </DialogDescription>
        <fieldset>
          <legend class="chart-section-title">1. Kies een grafiektype</legend>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <label
              v-for="type in chartTypes"
              :key="type.value"
              class="chart-choice"
            >
              <input
                v-model="draft.type"
                class="sr-only"
                type="radio"
                :name="`${settingsId}-type`"
                :value="type.value"
              />
              <svg
                viewBox="0 0 40 32"
                class="mb-2 h-8 w-10 text-blue-700"
                fill="none"
                aria-hidden="true"
              >
                <g v-if="type.value === 'bar'" fill="currentColor">
                  <rect x="4" y="16" width="7" height="13" rx="1" />
                  <rect x="16" y="4" width="7" height="25" rx="1" />
                  <rect x="28" y="10" width="7" height="19" rx="1" />
                </g>
                <path
                  v-else-if="type.value === 'line'"
                  d="M4 25 14 14 24 19 36 5"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <g v-else>
                  <circle
                    cx="20"
                    cy="16"
                    r="13"
                    fill="currentColor"
                    opacity=".2"
                  />
                  <path d="M20 3 A13 13 0 0 1 33 16 H20Z" fill="currentColor" />
                  <circle
                    v-if="type.value === 'donut'"
                    cx="20"
                    cy="16"
                    r="7"
                    fill="white"
                  />
                </g>
              </svg>
              <span class="block text-sm font-semibold">{{ type.label }}</span>
              <span class="mt-1 block text-xs leading-5 text-gray-600">{{
                typeDescriptions[type.value]
              }}</span>
            </label>
          </div>
        </fieldset>

        <fieldset class="space-y-4">
          <legend class="chart-section-title mb-3">
            2. Vul je gegevens in
          </legend>
          <label class="chart-field">
            <span>Titel <span class="chart-optional">(verplicht)</span></span>
            <input
              v-model="draft.title"
              type="text"
              placeholder="Bijv. Hoe verplaatsen we ons naar het werk?"
              required
            />
          </label>
          <label class="chart-field">
            <span>Eenheid <span class="chart-optional">(optioneel)</span></span>
            <input
              v-model="draft.unit"
              type="text"
              placeholder="Bijv. %, euro of inwoners"
            />
          </label>
          <div>
            <div class="mb-2 flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-gray-700">Gegevensrijen</p>
              <span class="text-xs text-gray-500"
                >{{ draft.points.length }} / {{ maxChartPoints }} rijen</span
              >
            </div>
            <p class="mb-3 text-xs leading-5 text-gray-600">
              Geef elke rij een naam en een waarde. De volgorde hieronder is ook
              de volgorde in je grafiek.
            </p>
            <div class="space-y-2">
              <div
                v-for="(point, index) in draft.points"
                :key="index"
                class="chart-data-row"
              >
                <span
                  class="pt-8 text-center text-xs text-gray-500"
                  aria-hidden="true"
                  >{{ index + 1 }}</span
                >
                <label class="chart-field">
                  <span class="text-xs"
                    >Naam <span class="sr-only">rij {{ index + 1 }}</span></span
                  >
                  <input
                    v-model="point.label"
                    type="text"
                    :placeholder="index === 0 ? 'Bijv. Fiets' : 'Naam'"
                    required
                  />
                </label>
                <label class="chart-field">
                  <span class="text-xs"
                    >Waarde
                    <span class="sr-only">rij {{ index + 1 }}</span></span
                  >
                  <input
                    v-model.number="point.value"
                    type="number"
                    step="any"
                    :min="isCircularDraft ? 0 : undefined"
                    :placeholder="index === 0 ? 'Bijv. 38' : '0'"
                    required
                  />
                </label>
                <div class="chart-row-actions">
                  <button
                    type="button"
                    class="chart-row-button"
                    :disabled="index === 0"
                    :aria-label="`Rij ${index + 1} omhoog`"
                    title="Rij omhoog"
                    @click="movePoint(index, -1)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5 10 5-5 5 5M10 5v11" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="chart-row-button"
                    :disabled="index === draft.points.length - 1"
                    :aria-label="`Rij ${index + 1} omlaag`"
                    title="Rij omlaag"
                    @click="movePoint(index, 1)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5 10 5 5 5-5M10 15V4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="chart-row-button text-red-700"
                    :aria-label="`Rij ${index + 1} verwijderen`"
                    title="Rij verwijderen"
                    @click="draft.points.splice(index, 1)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M3 5h14M8 3h4M5 5l1 12h8l1-12M8 8v6m4-6v6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <p
              v-if="!draft.points.length"
              class="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600"
            >
              Nog geen gegevens. Voeg een rij toe om te beginnen.
            </p>
            <button
              type="button"
              class="mt-3 w-full rounded-lg border border-dashed border-blue-300 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
              :disabled="draft.points.length >= maxChartPoints"
              @click="draft.points.push({ label: '', value: '' })"
            >
              + Rij toevoegen
            </button>
            <p
              v-if="draft.points.length >= maxChartPoints"
              class="mt-2 text-xs text-gray-600"
              role="status"
            >
              Je hebt het maximum van {{ maxChartPoints }} rijen bereikt.
            </p>
            <p
              v-if="isCircularDraft"
              class="mt-3 text-xs leading-5 text-gray-600"
            >
              Gebruik geen negatieve waarden. Het totaal moet groter zijn dan
              nul; percentages worden automatisch berekend.
            </p>
            <p
              v-else-if="draft.type === 'line'"
              class="mt-3 text-xs leading-5 text-gray-600"
            >
              Zet je gegevens in de gewenste volgorde. Elk punt staat op gelijke
              afstand, ook bij datums.
            </p>
          </div>
        </fieldset>

        <fieldset class="space-y-4">
          <legend class="chart-section-title mb-3">
            3. Extra informatie (optioneel)
          </legend>
          <label class="chart-field">
            <span
              >Toelichting <span class="chart-optional">(optioneel)</span></span
            >
            <textarea
              v-model="draft.description"
              rows="2"
              placeholder="Wat moet de lezer weten over deze cijfers?"
            />
          </label>
          <label class="chart-field">
            <span
              >Bronvermelding
              <span class="chart-optional">(optioneel)</span></span
            >
            <input
              v-model="draft.source"
              type="text"
              placeholder="Bijv. Statbel, 2026"
            />
          </label>
        </fieldset>
      </form>
      <template #footer>
        <div
          class="chart-settings flex flex-wrap items-center justify-end gap-3"
        >
          <p v-if="saveError" class="w-full text-sm text-red-700" role="alert">
            {{ saveError }}
          </p>
          <button
            type="button"
            class="mr-auto rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            aria-label="Grafiek verwijderen"
            @click="removeChart"
          >
            Verwijderen
          </button>
          <div class="ml-auto flex gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              @click="isOpen = false"
            >
              Annuleren
            </button>
            <button
              type="submit"
              :form="`${settingsId}-form`"
              class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Grafiek opslaan
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </NodeViewWrapper>
</template>

<style scoped>
.article-chart {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  color: #0f172a;
  overflow-wrap: anywhere;
}
.chart-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.chart-description,
.chart-source,
.chart-hint {
  margin: 0.5rem 0;
  color: #475569;
  font-size: 0.875rem;
  white-space: pre-line;
}
.chart-graphic {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.axis-label {
  font-size: 12px;
  fill: #475569;
}
.chart-point {
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.chart-point.is-muted {
  opacity: 0.35;
}
.chart-point:focus {
  outline: 2px solid #0f172a;
  outline-offset: 3px;
}
.chart-detail {
  min-height: 1.5em;
  margin: 0.5rem 0;
  font-weight: 600;
}
.article-chart .chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1rem;
}
.chart-legend button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  text-align: left;
  font-size: 0.875rem;
}
.chart-swatch {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.125rem;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: reduce) {
  .chart-point {
    transition: none;
  }
}
@media (max-width: 480px) {
  .article-chart {
    padding: 0.75rem;
  }
}
.chart-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}
.chart-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}
.chart-optional {
  font-size: 0.75rem;
  font-weight: 400;
  color: #64748b;
}
.chart-choice {
  display: block;
  min-width: 0;
  cursor: pointer;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: white;
  color: #334155;
}
.chart-choice:hover {
  border-color: #93c5fd;
  background: #f8fafc;
}
.chart-choice:has(input:checked) {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}
.chart-choice:has(input:focus-visible) {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}
.chart-data-row {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr) minmax(0, 0.7fr) auto;
  align-items: start;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem;
}
.chart-row-actions {
  display: flex;
  padding-top: 1.375rem;
}
.chart-row-button {
  display: inline-flex;
  min-width: 2rem;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
}
.chart-row-button:hover:not(:disabled) {
  background: #e2e8f0;
}
@media (max-width: 639px) {
  .chart-data-row {
    grid-template-columns: 1rem minmax(0, 1fr) minmax(0, 0.7fr);
  }
  .chart-row-actions {
    grid-column: 2 / -1;
    justify-content: flex-end;
    padding-top: 0;
  }
  .chart-row-button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
.chart-field input,
.chart-field select,
.chart-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  color: #0f172a;
  font-weight: 400;
}
.chart-settings button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.chart-settings
  :is(input:not([type="radio"]), select, textarea, button):focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
