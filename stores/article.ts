import { defineStore } from "pinia";
import type { BoArticleFileModel, BoArticleImageModel } from "models";

type ArticleMetaData = {
  jobCode: string;
  klnr: string;
};

const buildFallbackFileModel = (
  file: File,
  index: number,
): BoArticleFileModel => {
  const extension = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`
    : "";

  return {
    fileId: Date.now() + index,
    fileUrl: URL.createObjectURL(file),
    altText: file.name,
    extension,
    size: file.size,
  } as unknown as BoArticleFileModel;
};

export const useArticleStore = defineStore("article", {
  state: () => ({
    metaData: {
      jobCode: "",
      klnr: "",
    } as ArticleMetaData,
  }),
  actions: {
    setMetaData(metaData: Partial<ArticleMetaData>) {
      this.metaData = {
        ...this.metaData,
        ...metaData,
      };
    },
    async fetchImageCaptions(images: BoArticleImageModel[]) {
      // Layer fallback: pass images through when host app does not provide caption enrichment.
      return images;
    },
    async addFiles(files: FileList | File[]) {
      const fileArray = Array.from(files as ArrayLike<File>);
      return fileArray.map((file, index) =>
        buildFallbackFileModel(file, index),
      );
    },
  },
});
