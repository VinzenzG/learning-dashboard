import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

export interface ExtractionResult {
  text: string;
  pageCount: number;
  isImageBased: boolean;
}

function getTextNodes(node: unknown, result: string[] = []): string[] {
  if (node === null || node === undefined) return result;

  if (Array.isArray(node)) {
    for (const item of node) getTextNodes(item, result);
    return result;
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      // Only collect actual text run content (a:t elements)
      if (key === 'a:t') {
        if (typeof value === 'string' && value.trim()) {
          result.push(value.trim());
        } else if (typeof value === 'number') {
          result.push(String(value));
        } else if (Array.isArray(value)) {
          for (const v of value) {
            if (typeof v === 'string' && v.trim()) result.push(v.trim());
          }
        }
      } else {
        // Recurse into child elements but NOT into attribute keys (starting with @_)
        if (!key.startsWith('@_') && key !== '#text') {
          getTextNodes(value, result);
        }
      }
    }
  }

  return result;
}

export async function extractPptx(filePath: string): Promise<ExtractionResult> {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  const slideEntries = entries
    .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => {
      const numA = parseInt(a.entryName.match(/\d+/)?.[0] ?? '0');
      const numB = parseInt(b.entryName.match(/\d+/)?.[0] ?? '0');
      return numA - numB;
    });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (_name, _jpath, _isLeafNode, isAttribute) => !isAttribute,
  });

  const slideTexts: string[] = [];

  for (const entry of slideEntries) {
    const xml = entry.getData().toString('utf-8');
    const parsed = parser.parse(xml);
    const texts = getTextNodes(parsed);

    if (texts.length > 0) {
      slideTexts.push(texts.join(' '));
    }
  }

  const text = slideTexts.join('\n---\n');
  return {
    text,
    pageCount: slideEntries.length,
    isImageBased: text.trim().length < slideEntries.length * 30,
  };
}
