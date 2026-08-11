<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import { ref, computed, onMounted } from "vue";
import type { FileButtonViewModel } from "models";

const CustomerEditorModal = defineAsyncComponent(
  () => import("./CustomerEditorModal.vue"),
);

const props = defineProps(nodeViewProps);
const isEditable = computed(() => props.editor.isEditable ?? false);

const isEditing = ref(false);
const isFetching = ref(false);
const linkedCustomerReference = ref("");

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
  const imports = (await import("#imports")) as any;
  const articleStore = imports.useArticleStore?.();
  const metaData = articleStore?.metaData;
  const getCompany = imports.useFetchCompanies?.()?.getCompany;
  const toast = imports.useToast?.();
  if (!metaData?.jobCode) return;

  const ref = customerReference ?? props.node.attrs.klnr;
  if (!ref) return;

  isFetching.value = true;
  try {
    if (!ref) return;

    const company = (await getCompany?.(ref)) ?? null;
    if (!company) {
      toast?.error?.("Kon klantgegevens niet laden vanuit artikel");
      return;
    }

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

    toast?.success?.("Klantgegevens geladen vanuit artikel");
  } catch (err) {
    toast?.error?.("Kon klantgegevens niet laden vanuit artikel");
  } finally {
    isFetching.value = false;
  }
};

const loadLinkedCustomer = async () => {
  if (!isEditable.value) return;
  const imports = (await import("#imports")) as any;
  const metaData = imports.useArticleStore?.()?.metaData;
  if (!metaData?.klnr) return;
  linkedCustomerReference.value = metaData.klnr;
  await loadAndApplyArticleCustomer(metaData.klnr);
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
  const imports = (await import("#imports")) as any;
  const metaData = imports.useArticleStore?.()?.metaData;
  const getMagJob = imports.useFetchMagJobs?.()?.getMagJob;
  if (!metaData?.jobCode) return;
  linkedCustomerReference.value = metaData.klnr ?? "";

  try {
    const job = await getMagJob?.(metaData.jobCode);
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
          v-if="isEditable && linkedCustomerReference"
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

    <CustomerEditorModal
      v-if="isEditable && isEditing"
      :open="isEditing"
      :is-fetching="isFetching"
      :klnr="klnr"
      :name="name"
      :address="address"
      :city="city"
      :phone="phone"
      :email="email"
      :website="website"
      :logo="logo"
      @update:open="isEditing = $event"
      @update:klnr="klnr = $event"
      @update:name="name = $event"
      @update:address="address = $event"
      @update:city="city = $event"
      @update:phone="phone = $event"
      @update:email="email = $event"
      @update:website="website = $event"
      @update:logo="logo = $event"
      @load-customer="loadAndApplyArticleCustomer"
      @clear-logo="clearLogo"
      @save="updateAttributes"
      @cancel="cancelEdit"
    />
  </NodeViewWrapper>
</template>
