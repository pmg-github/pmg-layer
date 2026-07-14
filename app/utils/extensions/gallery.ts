import { mergeAttributes, Node } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import Gallery from "../../components/tiptap/Gallery.vue";
import type { BoArticleImageModel } from "models";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gallery: {
      setGallery: (images: BoArticleImageModel[]) => ReturnType;
      updateGallery: (images: BoArticleImageModel[]) => ReturnType;
    };
  }
}

const parseImages = (value: string | null): BoArticleImageModel[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const GalleryExtension = Node.create({
  name: "gallery",
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
    return [{ tag: "div[data-gallery]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-gallery": "true",
      }),
    ];
  },

  addCommands() {
    return {
      setGallery:
        (images) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { images },
          });
        },

      updateGallery:
        (images) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { images });
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Gallery);
  },
});
