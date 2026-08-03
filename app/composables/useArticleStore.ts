import type { BoArticleImageModel } from "models";

/**
 * Neutral layer fallback for the carousel's article-image integration.
 * A consuming app's `useArticleStore` auto-import overrides this composable.
 */
export const useArticleStore = () => ({
  metaData: {
    jobCode: undefined as string | undefined,
  },
  fetchImageCaptions: async (
    images: BoArticleImageModel[],
  ): Promise<BoArticleImageModel[]> => images,
});
