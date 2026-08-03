export interface ImagePickerOptions {
  folderId?: number;
  maxSelected?: number;
  jobCode?: string;
  aspectRatio?: number;
  currentSelection?: any[];
}

export interface ImageEditorOptions {
  image: any;
  folderId?: number;
}

export const useImagePicker = () => {
  const pickImages = (_options?: ImagePickerOptions): Promise<any[]> => {
    throw new Error(
      "❌ useImagePicker is not implemented!\n\n" +
        "The consuming app must provide an implementation.\n" +
        "Create composables/useImagePicker.ts in your app.\n" +
        "See the Image Picker Implementation Guide in the layer README.",
    );
  };

  const editImage = (_options: ImageEditorOptions): Promise<any | null> => {
    throw new Error(
      "❌ useImagePicker.editImage is not implemented!\n\n" +
        "The consuming app must provide an implementation.\n" +
        "Create composables/useImagePicker.ts in your app.\n" +
        "See the Image Picker Implementation Guide in the layer README.",
    );
  };

  return { pickImages, editImage };
};
