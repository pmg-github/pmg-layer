import { mergeAttributes, Node } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import Video from "../../components/tiptap/Video.vue";

export interface VideoAttrs {
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs?: VideoAttrs) => ReturnType;
      setVideo: (attrs: VideoAttrs) => ReturnType;
      updateVideo: (attrs: Partial<VideoAttrs>) => ReturnType;
    };
  }
}

export default Node.create({
  name: "video",
  group: "media block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      videoId: {
        default: "",
      },
      autoplay: {
        default: false,
      },
      muted: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-video]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-video": "true",
      }),
    ];
  },

  addCommands() {
    return {
      insertVideo:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: 'paragraph' },
          ]),
      setVideo:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },

      updateVideo:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs);
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Video);
  },
});
