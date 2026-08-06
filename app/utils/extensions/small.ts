import { Node, mergeAttributes } from '@tiptap/core';

export interface SmallOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    small: {
      /**
       * Set a small block
       */
      setSmall: () => ReturnType;
      /**
       * Toggle a small block
       */
      toggleSmall: () => ReturnType;
      /**
       * Unset a small block
       */
      unsetSmall: () => ReturnType;
    };
  }
}

export default Node.create<SmallOptions>({
  name: 'small',
  group: 'block',
  content: 'inline*',
  defining: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'small',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'small',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setSmall:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleSmall:
        () =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          const currentNode = $from.parent;

          // If we're already in a small node, convert to paragraph
          if (currentNode.type.name === this.name) {
            return commands.setNode('paragraph');
          }

          // Otherwise, convert current block to small
          return commands.setNode(this.name);
        },
      unsetSmall:
        () =>
        ({ commands }) => {
          return commands.setNode('paragraph');
        },
    };
  },
});
