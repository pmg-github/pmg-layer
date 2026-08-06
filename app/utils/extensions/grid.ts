import { Node } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import Grid from '~/components/tiptap/Grid.vue';

export default Node.create({
  name: 'grid',
  group: 'media block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-grid]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          const dataImages = element.getAttribute('data-images');
          if (!dataImages) return {};

          try {
            const images = JSON.parse(dataImages);
            return Array.isArray(images) ? { images } : {};
          } catch (e) {
            return {};
          }
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { images, ...rest } = HTMLAttributes as {
      images?: unknown;
      [key: string]: unknown;
    };
    const dataImages = Array.isArray(images) ? JSON.stringify(images) : '';
    return [
      'div',
      {
        'data-grid': 'true',
        ...(dataImages ? { 'data-images': dataImages } : {}),
        ...rest,
      },
    ];
  },
  addNodeView() {
    return VueNodeViewRenderer(Grid as Component<NodeViewProps>);
  },
});
