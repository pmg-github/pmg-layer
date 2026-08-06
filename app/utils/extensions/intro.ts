import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    intro: {
      toggleIntro: () => ReturnType;
    };
  }
}

export default Node.create({
  name: 'intro',
  content: 'inline*',
  group: 'block',
  defining: true,

  addOptions() {
    return {
      showToast: (() => {}) as ((message: string) => void) | undefined,
    };
  },

  parseHTML() {
    return [{ tag: 'p.intro' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { class: 'intro' }), 0];
  },

  addCommands() {
    return {
      toggleIntro:
        () =>
        ({ commands, state }) => {
          const { $from } = state.selection;

          if ($from.parent.type.name === 'intro') {
            return commands.setNode('paragraph');
          }

          let hasIntro = false;

          state.doc.descendants((node) => {
            if (node.type.name === 'intro') {
              hasIntro = true;
              this.options.showToast?.(
                'Er mag maar één intro per artikel zijn.',
              );
              return false;
            }

            return true;
          });

          if (hasIntro) return false;

          return commands.setNode('intro');
        },
    };
  },
});
