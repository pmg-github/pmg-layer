import { mergeAttributes, Node } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import type { BoArticleImageModel } from "models";
import Carousel from "../../components/tiptap/Carousel.vue";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    carousel: {
      setCarousel: (images: BoArticleImageModel[]) => ReturnType;
      updateCarousel: (images: BoArticleImageModel[]) => ReturnType;
    };
  }
}

const parseImages = (value: string | null): BoArticleImageModel[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CarouselExtension = Node.create({
  name: "carousel",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) =>
          parseImages(element.getAttribute("data-images")),
        renderHTML: (attributes) => ({
          "data-images": JSON.stringify(attributes.images ?? []),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-carousel]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-carousel": "true" }),
    ];
  },

  addCommands() {
    return {
      setCarousel:
        (images) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { images } }),
      updateCarousel:
        (images) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { images }),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Carousel);
  },
});
