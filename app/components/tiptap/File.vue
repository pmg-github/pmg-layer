<script setup lang="ts">
import { ref, computed } from "vue";
import { NodeViewWrapper } from "@tiptap/vue-3";
import type { BoArticleFileModel } from "models";
import Modal from "../Modal.vue";

interface FileNodeAttrs {
  files?: BoArticleFileModel[];
  title?: string;
}

interface Props {
  node: { attrs: FileNodeAttrs };
  editor: { isEditable?: boolean };
  updateAttributes: (attrs: Partial<FileNodeAttrs>) => void;
}

const props = defineProps<Props>();
const isEditable = computed(() => props.editor.isEditable ?? false);

const fileInput = ref<HTMLInputElement | null>(null);
const fileInputAdd = ref<HTMLInputElement | null>(null);
const uploadError = ref<string | null>(null);
const isModalOpen = ref(false);
const draftTitle = ref("");
const editingFileId = ref<number | null>(null);
const editingFileName = ref("");

const files = computed(() => props.node.attrs.files || []);
const hasFiles = computed(() => files.value.length > 0);
const boxTitle = computed(() => props.node.attrs.title?.trim() || "Bestanden");

const mergeUniqueFiles = (
  current: BoArticleFileModel[],
  incoming: BoArticleFileModel[],
) => {
  const byFileId = new Set(current.map((f) => f.fileId));
  const uniqueIncoming = incoming.filter((f) => !byFileId.has(f.fileId));
  return [...current, ...uniqueIncoming];
};

const SUPPORTED_FORMATS = ".pdf,.docx,.txt,.doc,.xlsx,.xls,.pptx,.ppt";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (increased limit)
const FILE_SIZE_UNITS = ["Bytes", "KB", "MB", "GB"] as const;

// Drag and drop state
const isDragOver = ref(false);
const dragCounter = ref(0);

// Get file type color
const getFileTypeColor = (fileName: string, mimeType: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const type = mimeType.toLowerCase();

  if (extension === "pdf" || type.includes("pdf"))
    return "text-red-500 bg-red-100";
  if (extension === "docx" || extension === "doc" || type.includes("word"))
    return "text-blue-500 bg-blue-100";
  if (extension === "txt" || type.includes("text"))
    return "text-gray-500 bg-gray-100";
  if (
    extension === "xlsx" ||
    extension === "xls" ||
    type.includes("spreadsheet")
  )
    return "text-green-500 bg-green-100";
  if (
    extension === "pptx" ||
    extension === "ppt" ||
    type.includes("presentation")
  )
    return "text-orange-500 bg-orange-100";
  if (type.includes("image")) return "text-purple-500 bg-purple-100";
  if (type.includes("video")) return "text-pink-500 bg-pink-100";
  if (type.includes("audio")) return "text-indigo-500 bg-indigo-100";
  return "text-gray-600 bg-gray-100";
};

// Get file type label
const getFileTypeLabel = (fileName: string, mimeType: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const type = mimeType.toLowerCase();

  if (extension === "pdf" || type.includes("pdf")) return "PDF";
  if (extension === "docx" || extension === "word") return "Word";
  if (extension === "doc") return "Word";
  if (extension === "txt" || type.includes("text")) return "Text";
  if (extension === "xlsx" || type.includes("spreadsheet")) return "Excel";
  if (extension === "xls") return "Excel";
  if (extension === "pptx" || type.includes("presentation"))
    return "PowerPoint";
  if (extension === "ppt") return "PowerPoint";
  if (type.includes("image")) return "Image";
  if (type.includes("video")) return "Video";
  if (type.includes("audio")) return "Audio";
  return extension?.toUpperCase() || "File";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(2);
  return `${parseFloat(size)} ${FILE_SIZE_UNITS[i]}`;
};

const getFileSize = (file: BoArticleFileModel): number => {
  return Number((file as unknown as { size?: number }).size ?? 0);
};

const handleFileUpload = async (event: Event) => {
  if (!isEditable.value) return;
  const inputEl = event.target as HTMLInputElement;
  const newFiles = inputEl.files;
  if (!newFiles || newFiles.length === 0) return;

  // Check if adding these files would exceed the limit
  const remainingSlots = 8 - files.value.length;
  if (remainingSlots <= 0) {
    const imports = (await import("#imports")) as any;
    imports.useToast?.()?.error?.("Maximum van 8 bestanden bereikt");
    return;
  }

  const imports = (await import("#imports")) as any;
  const uploadedFiles =
    (await imports.useArticleStore?.()?.addFiles?.(newFiles)) ?? [];
  props.updateAttributes({
    files: mergeUniqueFiles(files.value, uploadedFiles),
  });
  // Reset the input that triggered the event to allow selecting the same file again
  try {
    inputEl.value = "";
  } catch (e) {
    if (fileInput.value) fileInput.value.value = "";
  }
};

const triggerFileInput = (isAddButton: boolean = false) => {
  if (!isEditable.value) return;
  console.log("🖱️ Triggering file input:", isAddButton ? "add" : "initial");
  const input = isAddButton ? fileInputAdd.value : fileInput.value;
  if (input) {
    console.log("✅ Input found, clicking...");
    input.click();
  } else {
    console.error("❌ Input not found");
  }
};

const removeFile = (index: number) => {
  if (!isEditable.value) return;
  const updatedFiles = files.value.filter((_, i) => i !== index);
  props.updateAttributes({ files: updatedFiles });
};

const openTitleModal = () => {
  if (!isEditable.value) return;
  draftTitle.value = boxTitle.value;
  isModalOpen.value = true;
};

const closeTitleModal = () => {
  isModalOpen.value = false;
  draftTitle.value = "";
};

const saveTitle = () => {
  if (!isEditable.value) return;
  const nextTitle = draftTitle.value.trim();
  if (!nextTitle) {
    void import("#imports").then((imports: any) => {
      imports.useToast?.()?.error?.("Titel mag niet leeg zijn");
    });
    return;
  }

  props.updateAttributes({ title: nextTitle });
  closeTitleModal();
};

const startEditingFileName = (file: BoArticleFileModel) => {
  if (!isEditable.value) return;
  editingFileId.value = file.fileId;
  editingFileName.value = file.altText ?? "";
};

const cancelEditingFileName = () => {
  editingFileId.value = null;
  editingFileName.value = "";
};

const saveEditingFileName = (index: number) => {
  if (!isEditable.value) return;
  const nextName = editingFileName.value.trim();
  if (!nextName) {
    void import("#imports").then((imports: any) => {
      imports.useToast?.()?.error?.("Bestandsnaam mag niet leeg zijn");
    });
    return;
  }

  const updatedFiles = files.value.map((file, fileIndex) =>
    fileIndex === index
      ? {
          ...file,
          altText: nextName,
        }
      : file,
  );

  props.updateAttributes({ files: updatedFiles });
  cancelEditingFileName();
};

const handleDragOver = (event: DragEvent) => {
  if (!isEditable.value) return;
  event.preventDefault();
  event.stopPropagation();
};

const handleDragEnter = (event: DragEvent) => {
  if (!isEditable.value) return;
  event.preventDefault();
  event.stopPropagation();
  dragCounter.value++;
  if (event.dataTransfer?.items && event.dataTransfer.items.length > 0) {
    isDragOver.value = true;
  }
};

const handleDragLeave = (event: DragEvent) => {
  if (!isEditable.value) return;
  event.preventDefault();
  event.stopPropagation();
  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDragOver.value = false;
  }
};

const handleDrop = async (e: DragEvent) => {
  if (!isEditable.value) return;
  // Check if this is a file drop or a custom drag from the media panel
  const newFiles = e.dataTransfer?.files;
  const hasFiles = newFiles && newFiles.length > 0;
  const json = e.dataTransfer?.getData("application/json");
  if (json) {
    const data = JSON.parse(json);
    isDragOver.value = false;
    dragCounter.value = 0;
    if (data?.file) {
      props.updateAttributes({
        files: mergeUniqueFiles(files.value, [data.file]),
      });
    }
  }

  if (hasFiles) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver.value = false;
    dragCounter.value = 0;

    // Filter for image files only
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/zip",
    ];

    const validFiles = Array.from(newFiles).filter((file) =>
      allowedTypes.some((type) => file.type.startsWith(type)),
    );

    if (validFiles.length === 0) {
      const imports = (await import("#imports")) as any;
      imports
        .useToast?.()
        ?.error?.(
          "Alleen toegestane bestandstypes zijn toegestaan (JPG, PNG, GIF, PDF, DOCX, XLSX, CSV, ZIP)",
        );
      return;
    }

    // Check if adding these files would exceed the limit
    const remainingSlots = 8 - files.value.length;
    if (remainingSlots <= 0) {
      const imports = (await import("#imports")) as any;
      imports.useToast?.()?.error?.("Maximum van 8 afbeeldingen bereikt");
      return;
    }

    const filesToProcess = Math.min(validFiles.length, remainingSlots);

    const imports = (await import("#imports")) as any;
    const uploadedFiles =
      (await imports.useArticleStore?.()?.addFiles?.(validFiles)) ?? [];

    props.updateAttributes({
      files: mergeUniqueFiles(files.value, uploadedFiles),
    });

    // Show warning if some files were not added due to limit
    if (newFiles.length > filesToProcess) {
      imports
        .useToast?.()
        ?.warning?.(
          `${filesToProcess} afbeeldingen toegevoegd. Maximum van 8 bereikt.`,
        );
    }
    return;
  }

  // Default: prevent default for other drops
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
  dragCounter.value = 0;
};
</script>

<template>
  <NodeViewWrapper class="relative my-4 w-full max-w-full">
    <div
      v-if="uploadError"
      class="mb-2 rounded bg-red-100 px-4 py-2 text-sm text-red-700"
    >
      {{ uploadError }}
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasFiles"
      class="mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200"
      :class="[
        isDragOver
          ? 'border-blue-500 bg-blue-100'
          : 'border-gray-400 bg-gray-50 hover:border-blue-500 hover:bg-blue-50',
      ]"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >{{ boxTitle }}
        </span>
      </div>

      <Icon
        name="material-symbols:upload-file-outline"
        class="mb-4 size-12 text-gray-400"
      />

      <h3 class="mb-2 text-lg font-medium text-gray-700">
        {{
          isDragOver ? "Drop bestanden hier" : "Nog geen bestanden toegevoegd"
        }}
      </h3>

      <button
        v-if="isEditable"
        type="button"
        @click="triggerFileInput(false)"
        class="cursor-pointer rounded-lg bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Voeg bestanden toe
      </button>

      <input
        ref="fileInput"
        id="file-upload"
        type="file"
        multiple
        :accept="SUPPORTED_FORMATS"
        class="hidden"
        @change="handleFileUpload"
      />
    </div>

    <!-- File List -->
    <div v-else class="space-y-3">
      <!-- Drag overlay -->
      <div
        v-if="isDragOver"
        class="absolute inset-0 z-[2] flex items-center justify-center rounded-lg bg-blue-500/50"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="text-center text-white">
          <Icon
            name="heroicons-outline:cloud-arrow-down"
            class="mx-auto mb-2 size-12"
          />
          <p class="text-lg font-medium">Drop bestanden hier</p>
          <p class="text-sm opacity-90">Voeg toe aan bestaande bestanden</p>
        </div>
      </div>

      <div
        v-if="files.length === 0"
        class="py-4 text-center text-sm text-gray-400"
      >
        Geen bestanden toegevoegd.
      </div>
      <div class="mb-4 flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-700">
          {{ boxTitle }} ({{ files.length }})
        </h4>

        <div v-if="isEditable" class="flex items-center gap-2">
          <button
            type="button"
            class="flex items-center justify-center rounded-full p-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-800"
            :title="`Bewerk titel ${boxTitle}`"
            @click="openTitleModal"
          >
            <Icon name="material-symbols:edit-outline" class="size-5" />
          </button>

          <button
            type="button"
            @click="triggerFileInput(true)"
            class="flex cursor-pointer items-center justify-center rounded-full bg-gray-900 bg-opacity-80 px-4 py-2 text-sm text-white transition-all hover:bg-opacity-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          >
            Voeg bestand toe
          </button>
        </div>

        <input
          ref="fileInputAdd"
          id="file-upload-add"
          type="file"
          multiple
          :accept="SUPPORTED_FORMATS"
          class="hidden"
          @change="handleFileUpload"
        />
      </div>

      <div
        v-for="(file, index) in files"
        :key="file.fileUrl"
        class="group flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-4 transition-all duration-200 hover:border-blue-400"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <!-- File Icon -->
        <div class="flex-shrink-0">
          <div
            class="flex size-12 items-center justify-center rounded-lg bg-gray-50 transition-all"
          >
            <!-- :name="getFileIcon(file.altText, file.extension)" -->
            <Icon
              :name="`tabler:file-type-${file.extension.replace('.', '')}`"
              class="size-6 transition-all"
              :class="
                getFileTypeColor(
                  file.altText ?? '',
                  file.extension ?? '',
                ).split(' ')[0]
              "
            />
          </div>
        </div>

        <!-- File Info -->
        <div class="min-w-0 flex-1">
          <div
            v-if="editingFileId === file.fileId"
            class="flex items-center gap-2"
          >
            <input
              v-model="editingFileName"
              type="text"
              class="min-w-0 flex-1 rounded-md border border-blue-300 px-2 py-1.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-300"
              @keydown.enter.prevent="saveEditingFileName(index)"
              @keydown.esc.prevent="cancelEditingFileName"
            />
            <button
              type="button"
              class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-700"
              title="Bestandsnaam opslaan"
              @click="saveEditingFileName(index)"
            >
              <Icon name="material-symbols:check" class="size-5" />
            </button>
            <button
              type="button"
              class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700"
              title="Annuleren"
              @click="cancelEditingFileName"
            >
              <Icon name="material-symbols:close" class="size-5" />
            </button>
          </div>
          <div v-else class="flex items-start gap-2">
            <p class="truncate text-sm font-medium text-gray-900">
              {{ file.altText }}
            </p>
            <!-- <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                getFileTypeColor(
                  file.altText ?? '',
                  file.extension ?? '',
                ).split(' ')[1]
              "
            >
              {{ getFileTypeLabel(file.altText ?? '', file.extension ?? '') }}
            </span> -->
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Rename button -->
          <button
            v-if="isEditable && editingFileId !== file.fileId"
            type="button"
            class="flex items-center justify-center rounded-full p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-800"
            :title="`Hernoem ${file.altText}`"
            @click="startEditingFileName(file)"
          >
            <Icon name="material-symbols:edit-outline" class="size-5" />
          </button>

          <!-- Preview/Download button -->
          <a
            :href="file.fileUrl"
            :download="file.altText"
            class="flex items-center justify-center rounded-full p-2 text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-700"
            :title="`Download ${file.altText}`"
          >
            <Icon name="material-symbols:download" class="size-5" />
          </a>

          <!-- Remove button -->
          <button
            v-if="isEditable"
            type="button"
            class="flex items-center justify-center rounded-full p-2 text-gray-500 transition-all hover:bg-red-50 hover:text-red-700"
            :title="`Remove ${file.altText}`"
            @click="removeFile(index)"
          >
            <Icon name="material-symbols:delete" class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <Modal
      :open="isModalOpen"
      title="Titel bewerken"
      size="md"
      @update:open="(value) => (isModalOpen = value)"
      @close="closeTitleModal"
    >
      <div class="space-y-4">
        <div>
          <label
            for="file-box-title"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Titel van bestandenbox
          </label>
          <input
            id="file-box-title"
            v-model="draftTitle"
            type="text"
            maxlength="80"
            class="w-full rounded-md border border-gray-400 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-300"
            placeholder="Bijv. Downloads"
            @keydown.enter.prevent="saveTitle"
            @keydown.esc.prevent="closeTitleModal"
          />
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            @click="closeTitleModal"
          >
            Annuleren
          </button>
          <button
            type="button"
            class="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            @click="saveTitle"
          >
            Opslaan
          </button>
        </div>
      </div>
    </Modal>
  </NodeViewWrapper>
</template>
