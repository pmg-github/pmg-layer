// extensions/ArticleTitle.ts
import { Node, mergeAttributes } from '@tiptap/core';

export default Node.create({
  name: 'title',
  content: 'inline*',
  draggable: false,
  defining: true,

  parseHTML() {
    return [{ tag: 'h1' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['h1', mergeAttributes(HTMLAttributes), 0];
  },
});
