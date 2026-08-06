import { mergeAttributes, Node } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import Grid from "../../components/tiptap/Grid.vue";
import type { BoArticleImageModel } from "models";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    grid: {
      setGrid: (images: BoArticleImageModel[]) => ReturnType;
      updateGrid: (images: BoArticleImageModel[]) => ReturnType;
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

export const GridExtension = Node.create({
  name: "grid",
  group: "media block",
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
    return [{ tag: "div[data-grid]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-grid": "true",
      }),
    ];
  },

  addCommands() {
    return {
      setGrid:
        (images) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { images },
          });
        },

      updateGrid:
        (images) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { images });
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Grid);
  },
});

export default GridExtension;
