<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import { ref, computed, onMounted } from "vue";
import type { FileButtonViewModel } from "models";

import {
  useFetchCompanies,
  useFetchMagJobs,
  useToast,
  useArticleStore,
} from "#imports";

const props = defineProps(nodeViewProps);
const isEditable = computed(() => props.editor.isEditable ?? false);

const { getCompany } = useFetchCompanies();
const { getMagJob } = useFetchMagJobs();
const articleStore = useArticleStore();
const { success, error: showError } = useToast();

const isEditing = ref(false);
const isFetching = ref(false);

const klnr = ref(props.node.attrs.klnr || "");
const name = ref(props.node.attrs.name || "");
const address = ref(props.node.attrs.address || "");
const city = ref(props.node.attrs.city || "");
const phone = ref(props.node.attrs.phone || "");
const email = ref(props.node.attrs.email || "");
const website = ref(props.node.attrs.website || "");
const logo = ref<FileButtonViewModel>(
  props.node.attrs.logo || {
    url: "",
    id: undefined,
  },
);

const openEditModal = () => {
  if (!isEditable.value) return;
  klnr.value = props.node.attrs.klnr || "";
  name.value = props.node.attrs.name || "";
  address.value = props.node.attrs.address || "";
  city.value = props.node.attrs.city || "";
  phone.value = props.node.attrs.phone || "";
  email.value = props.node.attrs.email || "";
  website.value = props.node.attrs.website || "";
  logo.value = props.node.attrs.logo || "";
  isEditing.value = true;
};

const loadAndApplyArticleCustomer = async (customerReference?: string) => {
  if (!isEditable.value) return;
  if (!articleStore.metaData?.jobCode) return;

  const ref = customerReference ?? props.node.attrs.klnr;
  if (!ref) return;

  isFetching.value = true;
  try {
    if (ref) {
      // Fetch full company data using getCompany
      const company = await getCompany(ref);

      klnr.value = company.reference ?? ref;
      name.value = company.brand || company.name || "";
      const addr = [
        company.mainAddress?.street,
        company.mainAddress?.streetNumber,
      ]
        .filter(Boolean)
        .join(" ");
      address.value = addr;
      city.value = [company.mainAddress?.zipCode, company.mainAddress?.city]
        .filter(Boolean)
        .join(" ");
      phone.value = company.phone || "";
      email.value = company.email || "";
      website.value = company.website || "";
      logo.value = {
        url: company.logoUrl || "",
        id: company.reference,
      };

      // Immediately save to node
      props.updateAttributes({
        klnr: klnr.value,
        name: name.value,
        address: address.value,
        city: city.value,
        phone: phone.value,
        email: email.value,
        website: website.value,
        logo: logo.value,
      });

      success("Klantgegevens geladen vanuit artikel");
    }
  } catch (err) {
    showError("Kon klantgegevens niet laden vanuit artikel");
  } finally {
    isFetching.value = false;
  }
};

const updateAttributes = () => {
  if (!isEditable.value) return;
  props.updateAttributes({
    klnr: klnr.value,
    name: name.value,
    address: address.value,
    city: city.value,
    phone: phone.value,
    email: email.value,
    website: website.value,
    logo: logo.value,
  });
  isEditing.value = false;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const clearLogo = () => {
  if (!isEditable.value) return;
  logo.value = { url: "", id: undefined } as any;
};

const isEmpty = computed(() => {
  return (
    !props.node.attrs.klnr &&
    !props.node.attrs.name &&
    !props.node.attrs.address &&
    !props.node.attrs.city &&
    !props.node.attrs.phone &&
    !props.node.attrs.email &&
    !props.node.attrs.website &&
    !props.node.attrs.logo
  );
});

// Auto-load article customer on mount if available
onMounted(async () => {
  if (!isEditable.value) return;
  if (!articleStore.metaData?.jobCode) return;

  try {
    const job = await getMagJob(articleStore.metaData.jobCode);
    if (job?.customerReference) {
      await loadAndApplyArticleCustomer(job.customerReference);
    }
  } catch (err) {
    console.error("Failed to check article customer:", err);
  }
});
</script>

<template>
  <NodeViewWrapper class="my-4">
    <!-- Loading State -->
    <div
      v-if="isFetching"
      class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-8"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Leverancier</span
        >
      </div>
      <Icon
        name="material-symbols:progress-activity"
        class="mb-4 size-12 animate-spin text-blue-600"
      />
      <h3 class="text-lg font-medium text-blue-700">Klantgegevens laden...</h3>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="isEmpty"
      class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Leverancier</span
        >
      </div>
      <Icon name="material-symbols:person" class="mb-4 size-12 text-gray-400" />
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Nog geen leveranciersinformatie toegevoegd
      </h3>
      <div class="flex flex-wrap justify-center gap-2">
        <button
          v-if="isEditable && articleStore.metaData?.klnr"
          type="button"
          :disabled="isFetching"
          @click="loadLinkedCustomer"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="material-symbols:download" class="size-4" />
          Gekoppelde klant inladen
        </button>
        <button
          v-if="isEditable && logo?.url"
          type="button"
          @click="openEditModal"
          class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Manueel toevoegen
        </button>
      </div>
    </div>

    <!-- Display State -->
    <div v-else class="relative">
      <div
        class="flex items-start justify-between gap-6 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm"
      >
        <div class="flex-1 text-sm leading-relaxed text-gray-700">
          <strong
            v-if="node.attrs.name"
            class="mb-2 block text-lg font-bold text-gray-900"
            >{{ node.attrs.name }}</strong
          >
          <template v-if="node.attrs.address">
            <br />{{ node.attrs.address }}
          </template>
          <template v-if="node.attrs.city">
            <br />{{ node.attrs.city }}
          </template>
          <template v-if="node.attrs.phone">
            <br />{{ node.attrs.phone }}
          </template>
          <template v-if="node.attrs.email">
            <br /><a
              :href="`mailto:${node.attrs.email}`"
              class="text-blue-600 underline hover:text-blue-800"
              >{{ node.attrs.email }}</a
            >
          </template>
          <template v-if="node.attrs.website">
            <br /><a
              :href="node.attrs.website"
              target="_blank"
              rel="noopener"
              class="text-blue-600 underline hover:text-blue-800"
              >{{ node.attrs.website }}</a
            >
          </template>
        </div>
        <div
          v-if="node.attrs.logo?.url"
          class="flex items-center justify-center"
        >
          <img
            :src="node.attrs.logo.url"
            :alt="`Logo - ${node.attrs.name}`"
            class="aspect-square max-w-32 rounded border border-gray-200 bg-white object-contain p-2"
          />
        </div>
      </div>

      <!-- Edit Button (top-right corner) -->
      <div v-if="isEditable" class="absolute right-2 top-2 z-[1] flex gap-2">
        <button
          @click.stop="openEditModal"
          class="flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-sm text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          title="Bewerk leveranciersinformatie"
        >
          <Icon name="material-symbols:edit-outline" class="size-5" />
        </button>
      </div>
    </div>

    <!-- Edit Modal -->
    <Dialog class="relative z-50" :open="isEditing" @close="cancelEdit">
      <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-2xl rounded-lg bg-white shadow-xl">
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <DialogTitle class="text-lg font-semibold text-gray-900">
                Leveranciersinformatie
              </DialogTitle>
              <button
                @click="cancelEdit"
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
                    v-model="klnr"
                    type="text"
                    placeholder="00044149"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    @click="() => loadAndApplyArticleCustomer(klnr)"
                    :disabled="!klnr || isFetching"
                    class="flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon
                      :name="
                        isFetching
                          ? 'material-symbols:progress-activity'
                          : 'material-symbols:download'
                      "
                      :class="['size-4', isFetching && 'animate-spin']"
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
                  v-model="name"
                  type="text"
                  placeholder="MARIASTEEN"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                  >Adres</label
                >
                <input
                  v-model="address"
                  type="text"
                  placeholder="Koolskampstraat 24"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                  >Stad</label
                >
                <input
                  v-model="city"
                  type="text"
                  placeholder="8830 GITS"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                    >Telefoon</label
                  >
                  <input
                    v-model="phone"
                    type="text"
                    placeholder="+3251230811"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                    >Email</label
                  >
                  <input
                    v-model="email"
                    type="email"
                    placeholder="info@mariasteen.be"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                  >Website</label
                >
                <input
                  v-model="website"
                  type="url"
                  placeholder="http://www.mariasteen.be"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600"
                  >Logo URL</label
                >
                <div class="group relative">
                  <div
                    v-if="logo?.url"
                    class="mb-2 flex aspect-video w-full items-center justify-center overflow-hidden rounded border border-gray-300 bg-gray-50"
                  >
                    <img
                      :src="logo.url"
                      alt=""
                      class="h-full w-full object-contain"
                    />
                  </div>
                  <div
                    v-else
                    class="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500"
                  >
                    Geen afbeelding geselecteerd
                    <ImageLibraryButton @selected="logo = $event[0]">
                      Afbeelding toevoegen
                    </ImageLibraryButton>
                  </div>
                  <div
                    v-if="logo?.url"
                    class="absolute right-2 top-2 flex gap-1"
                  >
                    <ImageLibraryButton
                      :model-value="logo?.id ? [logo] : []"
                      @selected="logo = $event[0]"
                    />
                    <ImageEditorButton
                      v-if="logo?.id"
                      :image="logo"
                      title="Bewerken"
                      @saved="logo = $event"
                    />
                    <button
                      type="button"
                      class="flex size-8 items-center justify-center rounded-full bg-gray-500 text-white group-hover:bg-red-500"
                      title="Verwijderen"
                      @click="clearLogo"
                    >
                      <Icon name="material-symbols:delete" class="size-5" />
                    </button>
                  </div>
                </div>

                <!-- :image-url="logo" -->
                <!-- <input
                    v-model="logo.url"
                    type="url"
                    placeholder="https://static.pmg.be/uploads/logotheek/00044149.gif"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  /> -->
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 px-6 py-4">
            <div class="flex justify-end gap-3">
              <button
                @click="cancelEdit"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                @click="updateAttributes"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Opslaan
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </NodeViewWrapper>
</template>
