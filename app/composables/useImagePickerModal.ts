import { reactive } from "vue";

const modalState = reactive({ isOpen: false });

/** Neutral fallback overridden by the consuming app's picker modal state. */
export const useImagePickerModal = () => ({ modalState });
