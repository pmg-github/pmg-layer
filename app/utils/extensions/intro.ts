import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    intro: {
      toggleIntro: () => ReturnType;
      setIntroText: (text: string) => ReturnType;
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
      setIntroText:
        (text) =>
        ({ state, tr, dispatch }) => {
          const normalizedText = text.replace(/\s+/g, ' ').trim();
          if (!normalizedText) return false;

          const textNode = state.schema.text(normalizedText);
          let introPosition: number | null = null;
          let introSize = 0;
          let insertPosition = state.doc.content.size;
          let foundInsertPosition = false;

          state.doc.forEach((node, position) => {
            if (node.type.name === this.name && introPosition === null) {
              introPosition = position;
              introSize = node.nodeSize;
            }

            if (
              !foundInsertPosition &&
              !['title', 'gallery'].includes(node.type.name)
            ) {
              insertPosition = position;
              foundInsertPosition = true;
            }
          });

          if (introPosition !== null) {
            tr.replaceWith(
              introPosition + 1,
              introPosition + introSize - 1,
              textNode,
            );
          } else {
            tr.insert(insertPosition, this.type.create(null, textNode));
          }

          dispatch?.(tr);
          return true;
        },
    };
  },
});
