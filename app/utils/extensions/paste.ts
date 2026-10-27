import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import {
  DOMParser as PMDOMParser,
  DOMSerializer,
  type Schema,
} from "@tiptap/pm/model";

const WORD_TAGS: Record<string, string> = {
  MsoHeading1: "h1",
  MsoHeading2: "h2",
  MsoHeading3: "h3",
  MsoHeading4: "h4",
  MsoListParagraph: "ul",
  MsoListBullet: "ul",
  MsoListBullet2: "ul",
  MsoListBullet3: "ul",
  MsoListContinue: "ul",
  MsoListNumber: "ol",
  MsoListNumber2: "ol",
  MsoListNumber3: "ol",
  MsoListContinueMsoListContinue2: "ol",
};

export const normalizePastedHTML = (html: string, schema?: Schema): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc.querySelector("[data-pm-slice]")) return html;

  doc
    .querySelectorAll("script, style, meta, link, template")
    .forEach((element) => element.remove());

  doc.querySelectorAll("p[class]").forEach((paragraph) => {
    const wordClass = Array.from(paragraph.classList).find(
      (name) => WORD_TAGS[name],
    );
    const tag = wordClass ? WORD_TAGS[wordClass] : undefined;
    if (!tag) return;

    const replacement = doc.createElement(tag);
    const isList = tag === "ul" || tag === "ol";
    const content = isList ? doc.createElement("li") : replacement;
    content.append(...Array.from(paragraph.childNodes));
    if (isList) replacement.append(content);

    const previous = paragraph.previousElementSibling;
    if (isList && previous?.tagName.toLowerCase() === tag) {
      previous.append(content);
      paragraph.remove();
    } else {
      paragraph.replaceWith(replacement);
    }
  });

  if (!schema) return doc.body.innerHTML;
  const slice = PMDOMParser.fromSchema(schema).parseSlice(doc.body);
  const container = doc.createElement("div");
  container.append(
    DOMSerializer.fromSchema(schema).serializeFragment(slice.content, {
      document: doc,
    }),
  );
  return container.innerHTML;
};

export const normalizeArticleClipboardHTML = normalizePastedHTML;

export default Extension.create({
  name: "pasteNormalizer",
  addProseMirrorPlugins() {
    const schema = this.editor.schema;
    return [
      new Plugin({
        props: {
          transformPastedHTML: (html) => normalizePastedHTML(html, schema),
        },
      }),
    ];
  },
});
