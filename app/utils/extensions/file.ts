import { Node } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import File from '~/components/tiptap/File.vue';

export default Node.create({
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

  addNodeView() {
    return VueNodeViewRenderer(File as Component<NodeViewProps>);
  },
});
