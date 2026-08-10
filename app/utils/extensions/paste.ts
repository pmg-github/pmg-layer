import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

const WORD_HEADING: Record<string, string> = {
  MsoHeading1: 'h1',
  MsoHeading2: 'h2',
  MsoHeading3: 'h3',
  MsoHeading4: 'h4',
};

const WORD_BULLET = new Set([
  'MsoListParagraph',
  'MsoListBullet',
  'MsoListBullet2',
  'MsoListBullet3',
  'MsoListContinue',
]);

const WORD_NUMBER = new Set([
  'MsoListNumber',
  'MsoListNumber2',
  'MsoListNumber3',
  'MsoListContinueMsoListContinue2',
]);

const escapeHTML = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getHeadingTag = (element: Element): string | null => {
  const tag = element.tagName.toLowerCase();
  if (tag === 'h1' || tag === 'h2') return 'h2';
  if (tag === 'h3') return 'h3';
  if (tag === 'h4' || tag === 'h5' || tag === 'h6') return 'h4';

  for (const className of Array.from(element.classList)) {
    if (WORD_HEADING[className]) return WORD_HEADING[className];
  }

  return null;
};

const getWordListType = (element: Element): 'bullet' | 'number' | null => {
  for (const className of Array.from(element.classList)) {
    if (WORD_BULLET.has(className)) return 'bullet';
    if (WORD_NUMBER.has(className)) return 'number';
  }

  return null;
};

const processTable = (table: Element): string => {
  let output = '<table>';

  for (const row of Array.from(table.querySelectorAll('tr'))) {
    output += '<tr>';
    for (const cell of Array.from(row.children)) {
      const tag = cell.tagName.toLowerCase();
      if (tag === 'th' || tag === 'td') {
        output += `<${tag}>${escapeHTML(cell.textContent?.trim() ?? '')}</${tag}>`;
      }
    }
    output += '</tr>';
  }

  return `${output}</table>`;
};

const processList = (list: Element): string => {
  const tag = list.tagName.toLowerCase();
  let output = `<${tag}>`;

  for (const item of Array.from(list.children)) {
    if (item.tagName.toLowerCase() !== 'li') continue;

    const nested = item.querySelector('ul, ol');
    if (nested) {
      const text = Array.from(item.childNodes)
        .filter(
          (node) =>
            !(
              node.nodeType === globalThis.Node.ELEMENT_NODE &&
              ['ul', 'ol'].includes((node as Element).tagName.toLowerCase())
            ),
        )
        .map((node) => node.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      output += `<li>${escapeHTML(text)}${processList(nested)}</li>`;
    } else {
      const text = item.textContent?.trim() ?? '';
      if (text && text !== '\u00a0') {
        output += `<li>${escapeHTML(text)}</li>`;
      }
    }
  }

  return `${output}</${tag}>`;
};

const processElement = (element: Element): string => {
  const nodes = Array.from(element.childNodes);
  let output = '';
  let index = 0;

  while (index < nodes.length) {
    const child = nodes[index];
    if (!child || child.nodeType !== globalThis.Node.ELEMENT_NODE) {
      index += 1;
      continue;
    }

    const node = child as Element;
    const tag = node.tagName.toLowerCase();

    if (['style', 'script', 'meta', 'link'].includes(tag)) {
      index += 1;
      continue;
    }

    if (tag === 'table') {
      output += processTable(node);
      index += 1;
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      output += processList(node);
      index += 1;
      continue;
    }

    const headingTag = getHeadingTag(node);
    if (headingTag) {
      const text = node.textContent?.trim() ?? '';
      if (text && text !== '\u00a0') {
        output += `<${headingTag}>${escapeHTML(text)}</${headingTag}>`;
      }
      index += 1;
      continue;
    }

    if (tag === 'p') {
      const listType = getWordListType(node);
      if (listType) {
        const listTag = listType === 'bullet' ? 'ul' : 'ol';
        const classSet = listType === 'bullet' ? WORD_BULLET : WORD_NUMBER;
        let items = '';

        while (index < nodes.length) {
          const current = nodes[index];
          if (!current || current.nodeType !== globalThis.Node.ELEMENT_NODE) {
            index += 1;
            continue;
          }

          const currentElement = current as Element;
          if (currentElement.tagName.toLowerCase() !== 'p') break;
          if (
            !Array.from(currentElement.classList).some((className) =>
              classSet.has(className),
            )
          ) {
            break;
          }

          const text = currentElement.textContent?.trim() ?? '';
          if (text && text !== '\u00a0') {
            items += `<li>${escapeHTML(text)}</li>`;
          }
          index += 1;
        }

        if (items) output += `<${listTag}>${items}</${listTag}>`;
        continue;
      }

      const text = node.textContent?.trim() ?? '';
      if (text && text !== '\u00a0') {
        output += `<p>${escapeHTML(text)}</p>`;
      }
      index += 1;
      continue;
    }

    output += processElement(node);
    index += 1;
  }

  return output;
};

export const normalizePastedHTML = (html: string): string => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const result = processElement(document.body);
  return result || document.body.textContent || '';
};

const PasteNormalizer = Extension.create({
  name: 'pasteNormalizer',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPastedHTML: normalizePastedHTML,
        },
      }),
    ];
  },
});

export default PasteNormalizer;
