import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import type { Mark as ProseMirrorMark, Node } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface CommentsOptions {
  onCommentClick?: (commentId: string) => void;
}

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface CommentHighlightTarget {
  text: string;
  commentId?: string | number;
}

export interface CommentSelection {
  from: number;
  to: number;
  text: string;
}

export interface CommentsStorage {
  capturedSelection: CommentSelection | null;
  highlightCount: number;
  removedMarkCount: number;
}

export interface PmChar {
  char: string;
  pos: number | null;
  marks: readonly ProseMirrorMark[];
}

interface CommentHighlightRange {
  from: number;
  to: number;
  commentId?: string | number;
}

type CommentHighlightsMeta =
  | { type: "set"; ranges: CommentHighlightRange[] }
  | { type: "clear" };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comments: {
      captureCommentSelection: () => ReturnType;
      clearCommentSelection: () => ReturnType;
      applyCommentMark: (commentId?: string | number) => ReturnType;
      selectCommentMark: (commentId: string | number) => ReturnType;
      removeCommentMark: (commentId: string | number) => ReturnType;
      setCommentHighlights: (
        targets: Array<string | CommentHighlightTarget>,
      ) => ReturnType;
      clearCommentHighlights: () => ReturnType;
    };
  }
}

const commentHighlightsPluginKey = new PluginKey<DecorationSet>(
  "commentHighlights",
);

const isDecorationSet = (value: unknown): value is DecorationSet => {
  return Boolean(
    value &&
    typeof value === "object" &&
    "map" in value &&
    "forChild" in value &&
    "locals" in value,
  );
};

const getSafeDecorationSet = (value: unknown) => {
  return isDecorationSet(value) ? value : DecorationSet.empty;
};

export const buildPmCharMap = (doc: Node): PmChar[] => {
  const chars: PmChar[] = [];
  let separated = true;

  doc.descendants((node, position) => {
    if (node.isText && node.text) {
      for (let index = 0; index < node.text.length; index += 1) {
        const char = node.text[index];
        if (char === undefined) continue;

        chars.push({
          char,
          pos: position + index,
          marks: node.marks,
        });
      }
      separated = false;
    } else if (node.isLeaf) {
      chars.push({ char: " ", pos: null, marks: [] });
      separated = false;
    } else if (!separated && node.isBlock) {
      chars.push({ char: "\n", pos: null, marks: [] });
      separated = true;
    }

    return true;
  });

  return chars;
};

export const findInCharMap = (
  needle: string,
  chars: PmChar[],
): Array<{ from: number; to: number; marks: readonly ProseMirrorMark[] }> => {
  if (!needle) return [];

  const fullText = chars.map(({ char }) => char).join("");
  const ranges: Array<{
    from: number;
    to: number;
    marks: readonly ProseMirrorMark[];
  }> = [];
  let searchFrom = 0;
  let index: number;

  while ((index = fullText.indexOf(needle, searchFrom)) !== -1) {
    const match = chars.slice(index, index + needle.length);
    const first = match[0];
    const last = match[match.length - 1];

    if (!first || !last || match.some(({ pos }) => pos === null)) {
      searchFrom = index + 1;
      continue;
    }

    ranges.push({
      from: first.pos!,
      to: last.pos! + 1,
      marks: first.marks,
    });
    searchFrom = index + needle.length;
  }

  return ranges;
};

const hasCommentMarkInRange = (doc: Node, from: number, to: number) => {
  let found = false;

  doc.nodesBetween(from, to, (node) => {
    if (found) return false;
    if (!node.isText || !node.marks.length) return true;

    if (
      node.marks.some(
        (mark) =>
          mark.type.name === "inlineComment" &&
          String(mark.attrs.commentId ?? "").trim(),
      )
    ) {
      found = true;
      return false;
    }

    return true;
  });

  return found;
};

const findCommentMarkRange = (
  doc: Node,
  commentId: string,
): { from: number; to: number } | null => {
  let from: number | null = null;
  let to: number | null = null;

  doc.descendants((node, position) => {
    if (!node.isText || !node.marks.length) return true;

    const hasMark = node.marks.some(
      (mark) =>
        mark.type.name === "inlineComment" &&
        String(mark.attrs.commentId ?? "") === commentId,
    );

    if (hasMark) {
      from = from === null ? position : Math.min(from, position);
      to = Math.max(to ?? position, position + node.nodeSize);
    }

    return true;
  });

  return from === null || to === null ? null : { from, to };
};

const findCommentMarkRanges = (
  doc: Node,
  commentId: string,
): Array<{ from: number; to: number }> => {
  const ranges: Array<{ from: number; to: number }> = [];

  doc.descendants((node, position) => {
    if (!node.isText || !node.marks.length) return true;

    const hasMark = node.marks.some(
      (mark) =>
        mark.type.name === "inlineComment" &&
        String(mark.attrs.commentId ?? "") === commentId,
    );

    if (hasMark) {
      ranges.push({ from: position, to: position + node.nodeSize });
    }

    return true;
  });

  return ranges;
};

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: "inlineComment",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-inline-comment-id"),
      },
      resolved: {
        default: false,
        parseHTML: () => false,
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.inline-comment-mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attributes: Record<string, unknown> = {
      class: "inline-comment-mark",
    };

    if (HTMLAttributes.commentId) {
      attributes["data-inline-comment-id"] = HTMLAttributes.commentId;
    }

    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, attributes),
      0,
    ];
  },
});

export const CommentHighlights = Extension.create({
  name: "commentHighlights",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: commentHighlightsPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, decorations) {
            const currentDecorations = getSafeDecorationSet(decorations);
            const meta = transaction.getMeta(commentHighlightsPluginKey) as
              | CommentHighlightsMeta
              | undefined;

            if (meta?.type === "set") {
              const ranges = meta.ranges
                .filter(
                  ({ from, to }) =>
                    Number.isFinite(from) && Number.isFinite(to) && to > from,
                )
                .map(({ from, to, commentId }) =>
                  Decoration.inline(from, to, {
                    class: "inline-comment-mark",
                    ...(commentId !== undefined && commentId !== null
                      ? { "data-inline-comment-id": String(commentId) }
                      : {}),
                  }),
                );

              return DecorationSet.create(transaction.doc, ranges);
            }

            if (meta?.type === "clear") {
              return DecorationSet.empty;
            }

            return transaction.docChanged
              ? currentDecorations.map(transaction.mapping, transaction.doc)
              : currentDecorations;
          },
        },
        props: {
          decorations(state) {
            return getSafeDecorationSet(
              commentHighlightsPluginKey.getState(state),
            );
          },
        },
      }),
    ];
  },
});

const Comments = Extension.create<CommentsOptions, CommentsStorage>({
  name: "comments",

  addOptions() {
    return {
      onCommentClick: undefined,
    };
  },

  addStorage() {
    return {
      capturedSelection: null,
      highlightCount: 0,
      removedMarkCount: 0,
    };
  },

  addExtensions() {
    return [CommentMark, CommentHighlights];
  },

  addCommands() {
    return {
      captureCommentSelection:
        () =>
        ({ state }) => {
          const { from, to } = state.selection;
          if (from === to) return false;

          const text = state.doc.textBetween(from, to, "\n", " ");
          if (!text.trim()) return false;

          this.storage.capturedSelection = { from, to, text };
          return true;
        },
      clearCommentSelection: () => () => {
        this.storage.capturedSelection = null;
        return true;
      },
      applyCommentMark:
        (commentId) =>
        ({ state, tr, dispatch }) => {
          const selection = this.storage.capturedSelection;
          const markType = state.schema.marks.inlineComment;
          if (!selection || !markType) return false;
          if (selection.to > state.doc.content.size) return false;

          const normalizedCommentId = String(commentId ?? "").trim();
          tr.addMark(
            selection.from,
            selection.to,
            markType.create({
              commentId: normalizedCommentId || null,
            }),
          ).scrollIntoView();
          dispatch?.(tr);
          this.storage.capturedSelection = null;
          return true;
        },
      selectCommentMark:
        (commentId) =>
        ({ state, tr, dispatch }) => {
          const id = String(commentId ?? "").trim();
          if (!id) return false;

          const range = findCommentMarkRange(state.doc, id);
          if (!range) return false;

          tr.setSelection(
            TextSelection.create(tr.doc, range.from, range.to),
          ).scrollIntoView();
          dispatch?.(tr);
          return true;
        },
      removeCommentMark:
        (commentId) =>
        ({ state, tr, dispatch }) => {
          this.storage.removedMarkCount = 0;
          const id = String(commentId ?? "").trim();
          const markType = state.schema.marks.inlineComment;
          if (!id || !markType) return false;

          const ranges = findCommentMarkRanges(state.doc, id);
          if (!ranges.length) return false;

          for (const range of ranges) {
            tr.removeMark(range.from, range.to, markType);
          }

          dispatch?.(tr);
          this.storage.removedMarkCount = ranges.length;
          return true;
        },
      setCommentHighlights:
        (targets) =>
        ({ state, tr, dispatch }) => {
          const chars = buildPmCharMap(state.doc);
          const ranges: CommentHighlightRange[] = [];
          const seen = new Set<string>();

          for (const target of targets) {
            const base =
              typeof target === "string"
                ? target.trim()
                : String(target?.text ?? "").trim();
            const commentId =
              typeof target === "string" ? undefined : target?.commentId;
            if (!base) continue;

            const candidates = [
              base,
              base.replace(/\s+/g, " ").trim(),
              base
                .split("\n")
                .map((part) => part.trim())
                .find(Boolean) ?? "",
            ].filter(
              (value, index, values) =>
                value.length > 0 && values.indexOf(value) === index,
            );

            let match: { from: number; to: number } | null = null;

            for (const candidate of candidates) {
              const key = candidate.toLowerCase();
              if (seen.has(key)) continue;
              seen.add(key);

              const found = findInCharMap(candidate, chars);
              const first = found[0];
              if (first) {
                match = { from: first.from, to: first.to };
                break;
              }
            }

            if (
              match &&
              !hasCommentMarkInRange(state.doc, match.from, match.to)
            ) {
              ranges.push({ ...match, commentId });
            }
          }

          tr.setMeta(commentHighlightsPluginKey, { type: "set", ranges });
          dispatch?.(tr);
          this.storage.highlightCount = ranges.length;
          return true;
        },
      clearCommentHighlights:
        () =>
        ({ tr, dispatch }) => {
          tr.setMeta(commentHighlightsPluginKey, { type: "clear" });
          dispatch?.(tr);
          this.storage.highlightCount = 0;
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick: (_view, _position, event) => {
            const target = event.target as HTMLElement | null;
            const marker = target?.closest?.(
              "[data-inline-comment-id]",
            ) as HTMLElement | null;
            const commentId = marker?.dataset.inlineCommentId;

            if (!commentId) return false;
            this.options.onCommentClick?.(commentId);
            return false;
          },
        },
      }),
    ];
  },
});

export default Comments;
