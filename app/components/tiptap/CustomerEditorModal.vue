<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import type { FileButtonViewModel } from "models";

type Props = {
  open: boolean;
  isFetching: boolean;
  klnr: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  logo: FileButtonViewModel;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:klnr": [value: string];
  "update:name": [value: string];
  "update:address": [value: string];
  "update:city": [value: string];
  "update:phone": [value: string];
  "update:email": [value: string];
  "update:website": [value: string];
  "update:logo": [value: FileButtonViewModel];
  "load-customer": [customerReference?: string];
  "clear-logo": [];
  save: [];
  cancel: [];
}>();

const closeModal = () => {
  emit("cancel");
  emit("update:open", false);
};
</script>

<template>
  <Dialog class="relative z-50" :open="props.open" @close="closeModal">
    <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <DialogTitle class="text-lg font-semibold text-gray-900">
              Leveranciersinformatie
            </DialogTitle>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <Icon name="material-symbols:close" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="max-h-[70vh] overflow-y-auto p-6">
          <div class="space-y-4">
            <div>
              <label
                class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                >Klantnummer</label
              >
              <div class="flex gap-2">
                <input
                  :value="props.klnr"
                  type="text"
                  placeholder="00044149"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @input="
                    emit(
                      'update:klnr',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
                <button
                  type="button"
                  :disabled="!props.klnr || props.isFetching"
                  class="flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="emit('load-customer', props.klnr)"
                >
                  <Icon
                    :name="
                      props.isFetching
                        ? 'material-symbols:progress-activity'
                        : 'material-symbols:download'
                    "
                    :class="['size-4', props.isFetching && 'animate-spin']"
                  />
                  Ophalen
                </button>
              </div>
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                >Bedrijfsnaam</label
              >
              <input
                :value="props.name"
                type="text"
                placeholder="MARIASTEEN"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="
                  emit('update:name', ($event.target as HTMLInputElement).value)
                "
              />
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                >Adres</label
              >
              <input
                :value="props.address"
                type="text"
                placeholder="Koolskampstraat 24"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="
                  emit(
                    'update:address',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                >Stad</label
              >
              <input
                :value="props.city"
                type="text"
                placeholder="8830 GITS"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="
                  emit('update:city', ($event.target as HTMLInputElement).value)
                "
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                  >Telefoon</label
                >
                <input
                  :value="props.phone"
                  type="text"
                  placeholder="+3251230811"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @input="
                    emit(
                      'update:phone',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </div>

              <div>
                <label
                  class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                  >Email</label
                >
                <input
                  :value="props.email"
                  type="email"
                  placeholder="info@mariasteen.be"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @input="
                    emit(
                      'update:email',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </div>
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                >Website</label
              >
              <input
                :value="props.website"
                type="url"
                placeholder="http://www.mariasteen.be"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="
                  emit(
                    'update:website',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                >Logo URL</label
              >
              <div class="group relative">
                <div
                  v-if="props.logo?.url"
                  class="mb-2 flex aspect-video w-full items-center justify-center overflow-hidden rounded border border-gray-300 bg-gray-50"
                >
                  <img
                    :src="props.logo.url"
                    alt=""
                    class="h-full w-full object-contain"
                  />
                </div>
                <div
                  v-else
                  class="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500"
                >
                  Geen afbeelding geselecteerd
                  <ImageLibraryButton
                    @selected="
                      emit('update:logo', $event[0] as FileButtonViewModel)
                    "
                  >
                    Afbeelding toevoegen
                  </ImageLibraryButton>
                </div>
                <div
                  v-if="props.logo?.url"
                  class="absolute right-2 top-2 flex gap-1"
                >
                  <ImageLibraryButton
                    :model-value="props.logo?.id ? [props.logo] : []"
                    @selected="
                      emit('update:logo', $event[0] as FileButtonViewModel)
                    "
                  />
                  <ImageEditorButton
                    v-if="props.logo?.id"
                    :image="props.logo"
                    title="Bewerken"
                    @saved="emit('update:logo', $event as FileButtonViewModel)"
                  />
                  <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded-full bg-gray-500 text-white group-hover:bg-red-500"
                    title="Verwijderen"
                    @click="emit('clear-logo')"
                  >
                    <Icon name="material-symbols:delete" class="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 px-6 py-4">
          <div class="flex justify-end gap-3">
            <button
              @click="closeModal"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              @click="emit('save')"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Opslaan
            </button>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
