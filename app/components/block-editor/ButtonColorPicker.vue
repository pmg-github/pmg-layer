<script setup lang="ts">
import { ref, watch } from "vue";
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
  ColorFieldInput,
  ColorFieldRoot,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
  ColorSwatch,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  colorToHex,
  normalizeColor,
  type Color,
} from "reka-ui";
import {
  buttonColorPresets,
  normalizeButtonColor,
} from "../../utils/buttonColor";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    /** Color shown in the picker when no custom color is set yet. */
    fallback?: string;
  }>(),
  { fallback: "#2563eb" },
);

const emit = defineEmits<{ "update:modelValue": [value: string | null] }>();

const open = ref(false);

// The picker keeps a full Color object locally so hue is preserved while
// dragging through grays/black, where the hex value alone would lose it.
const color = ref<Color>(toColor(props.modelValue));

function toColor(value?: string | null): Color {
  return normalizeColor(
    normalizeButtonColor(value) ??
      normalizeButtonColor(props.fallback) ??
      "#2563eb",
  );
}

watch(
  () => props.modelValue,
  (value) => {
    const hex = normalizeButtonColor(value);
    if (hex && hex === normalizeButtonColor(colorToHex(color.value))) return;
    color.value = toColor(value);
  },
);

function setColor(value: Color) {
  color.value = value;
  const hex = normalizeButtonColor(colorToHex(value));
  if (hex && hex !== normalizeButtonColor(props.modelValue)) {
    emit("update:modelValue", hex);
  }
}

function setHex(value: string) {
  const hex = normalizeButtonColor(value);
  if (hex) setColor(normalizeColor(hex));
}

function reset() {
  emit("update:modelValue", null);
  color.value = toColor(null);
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      type="button"
      class="flex size-8 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      :class="open ? 'bg-gray-100' : ''"
      title="Knopkleur"
      aria-label="Knopkleur kiezen"
    >
      <span
        class="size-5 rounded-full border border-black/10 shadow-inner"
        :style="{
          background:
            normalizeButtonColor(modelValue) ??
            'conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)',
        }"
      />
    </PopoverTrigger>

    <!-- Rendered inline (no portal) so focus and outside-click handling of
         the surrounding link bar treat the picker as part of the bar. -->
    <PopoverContent
      side="bottom"
      align="end"
      :side-offset="10"
      :collision-padding="8"
      class="z-[60] w-60 rounded-2xl border border-gray-200 bg-white p-3 text-gray-900 shadow-2xl outline-none"
      @click.stop
    >
      <div class="flex flex-col gap-3">
        <ColorAreaRoot
          v-slot="{ style }"
          :model-value="color"
          color-space="hsb"
          x-channel="saturation"
          y-channel="brightness"
          @update:color="setColor"
        >
          <ColorAreaArea
            class="relative h-32 w-full cursor-crosshair rounded-lg"
            :style="style"
          >
            <ColorAreaThumb
              class="absolute block size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            />
          </ColorAreaArea>
        </ColorAreaRoot>

        <ColorSliderRoot
          :model-value="color"
          color-space="hsb"
          channel="hue"
          class="relative flex h-4 w-full touch-none select-none items-center"
          @update:color="setColor"
        >
          <ColorSliderTrack class="relative h-3 w-full grow rounded-full" />
          <ColorSliderThumb
            class="block size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
        </ColorSliderRoot>

        <div class="flex items-center gap-2">
          <ColorSwatch
            :color="color"
            class="size-8 shrink-0 rounded-lg border border-black/10"
          />
          <ColorFieldRoot
            :model-value="colorToHex(color)"
            class="min-w-0 flex-1"
            @update:model-value="setHex"
          >
            <ColorFieldInput
              class="h-8 w-full rounded-lg border border-gray-200 px-2 font-mono text-xs uppercase outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              aria-label="Hex kleurcode"
            />
          </ColorFieldRoot>
        </div>

        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="preset in buttonColorPresets"
            :key="preset"
            type="button"
            class="h-7 rounded-md border border-black/10 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            :class="
              normalizeButtonColor(modelValue) === preset
                ? 'ring-2 ring-blue-500 ring-offset-1'
                : ''
            "
            :style="{ backgroundColor: preset }"
            :title="preset"
            :aria-label="`Kleur ${preset}`"
            @click="setHex(preset)"
          />
        </div>

        <button
          type="button"
          class="flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
          :disabled="!normalizeButtonColor(modelValue)"
          @click="reset"
        >
          <Icon
            name="material-symbols:format-color-reset-outline"
            class="size-4"
          />
          Standaardkleur
        </button>
      </div>
    </PopoverContent>
  </PopoverRoot>
</template>
