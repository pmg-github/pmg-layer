import { reactive } from "vue";

const editorModalState = reactive({ isOpen: false });

/** Neutral fallback overridden by the consuming app's editor modal state. */
export const useImageEditorModal = () => ({ editorModalState });
