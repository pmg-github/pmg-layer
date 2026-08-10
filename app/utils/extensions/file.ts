import { Node } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import File from '~/components/tiptap/File.vue';

export interface FileStorage {
  updatedNodeCount: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    file: {
      insertFile: (files?: unknown[]) => ReturnType;
      removeFileAttachment: (fileId: number) => ReturnType;
    };
  }
}

export default Node.create<Record<string, never>, FileStorage>({
  name: 'file',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      files: {
        default: [], // Default to an empty array
        parseHTML: (element) =>
          JSON.parse(element.getAttribute('data-files') || '[]'),
        renderHTML: (attributes) => ({
          'data-files': JSON.stringify(attributes.files),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-file]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-file': 'true', ...HTMLAttributes }];
  },

  addStorage() {
    return {
      updatedNodeCount: 0,
    };
  },

  addCommands() {
    return {
      insertFile:
        (files = []) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: { files } },
            { type: 'paragraph' },
          ]),
      removeFileAttachment:
        (fileId) =>
        ({ state, tr, dispatch }) => {
          let updatedNodeCount = 0;

          state.doc.descendants((node, position) => {
            if (node.type.name !== this.name) return true;

            const currentFiles = Array.isArray(node.attrs.files)
              ? node.attrs.files
              : [];
            const nextFiles = currentFiles.filter(
              (file) =>
                Number((file as { fileId?: unknown })?.fileId) !==
                Number(fileId),
            );

            if (nextFiles.length !== currentFiles.length) {
              tr.setNodeMarkup(position, undefined, {
                ...node.attrs,
                files: nextFiles,
              });
              updatedNodeCount += 1;
            }

            return true;
          });

          this.storage.updatedNodeCount = updatedNodeCount;
          if (!updatedNodeCount) return false;

          dispatch?.(tr);
          return true;
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(File as Component<NodeViewProps>);
  },
});
