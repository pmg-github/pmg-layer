<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3";
import { computed, ref } from "vue";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";

const props = defineProps({
  node: { type: Object, required: true },
  editor: { type: Object, required: true },
  updateAttributes: { type: Function, required: true },
  deleteNode: { type: Function, required: true },
});

const isEditable = computed(() => props.editor.isEditable ?? false);

const isModalOpen = ref(false);
const draftInput = ref("");

const hasValidSrc = computed(() => {
  const value = props.node.attrs.src?.trim();
  return !!value && /^https?:\/\//i.test(value);
});

const openModal = () => {
  if (!isEditable.value) return;
  draftInput.value = props.node.attrs.src || "";
  isModalOpen.value = true;
};

const resolveSrc = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const parsed = new DOMParser().parseFromString(trimmed, "text/html");
  const s = parsed.querySelector("iframe")?.getAttribute("src")?.trim();
  return s && /^https?:\/\//i.test(s) ? s : null;
};

const applyEmbed = () => {
  if (!isEditable.value) return;
  const resolved = resolveSrc(draftInput.value);
  if (!resolved) return;
  props.updateAttributes({ src: resolved });
  isModalOpen.value = false;
};
</script>

<template>
  <NodeViewWrapper class="my-4">
    <!-- Empty state -->
    <div
      v-if="!hasValidSrc"
      class="relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <div class="absolute left-14 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Embed
        </span>
      </div>

      <Icon
        name="material-symbols:iframe-rounded"
        class="mb-4 size-12 text-gray-400"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-700">Embed toevoegen</h3>
      <p class="mb-4 text-center text-xs text-gray-400">
        Plak een URL of iframe-code in het venster
      </p>

      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click.stop="openModal"
      >
        Open embed venster
      </button>
    </div>

    <!-- Display state -->
    <div v-else class="relative w-full aspect-video overflow-hidden rounded-lg">
      <iframe
        :src="props.node.attrs.src"
        class="h-full w-full"
        :frameborder="props.node.attrs.frameborder ?? 0"
        :allowfullscreen="props.node.attrs.allowfullscreen ?? true"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      />

      <!-- Edit button -->
      <div v-if="isEditable" class="absolute right-2 top-2 z-[1] flex gap-2">
        <button
          @click.stop="openModal"
          class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          title="Embed bewerken"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>
    </div>

    <!-- Edit modal -->
    <Dialog
      class="relative z-50"
      :open="isModalOpen"
      @close="isModalOpen = false"
    >
      <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <div class="mb-6 flex items-center justify-between">
            <DialogTitle class="text-xl font-bold">Embed</DialogTitle>
            <button
              @click="isModalOpen = false"
              class="flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
              title="Sluiten"
            >
              <Icon name="material-symbols:close" class="size-5" />
            </button>
          </div>

          <p class="mb-2 text-sm text-gray-500">
            Plak een URL of <code>&lt;iframe&gt;</code> code
          </p>
          <textarea
            v-model="draftInput"
            rows="4"
            placeholder='https://… of <iframe src="…"></iframe>'
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div class="mt-6 flex items-center justify-between">
            <button
              v-if="isEditable"
              type="button"
              class="rounded p-2 text-red-500 transition hover:bg-red-50"
              title="Embed verwijderen"
              @click="
                () => {
                  props.deleteNode();
                  isModalOpen = false;
                }
              "
            >
              <Icon name="material-symbols:delete-outline" class="size-5" />
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-100"
                @click="isModalOpen = false"
              >
                Annuleren
              </button>
              <button
                type="button"
                :disabled="!draftInput.trim()"
                class="rounded px-4 py-2 text-sm font-medium transition"
                :class="
                  draftInput.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                "
                @click="applyEmbed"
              >
                Toepassen
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </NodeViewWrapper>
</template>
