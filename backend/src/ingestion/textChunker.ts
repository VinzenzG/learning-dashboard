const CHUNK_SIZE = 3000;
const SLIDE_SEPARATOR = '\n---\n';

export interface TextChunk {
  text: string;
  slideStart: number; // 1-indexed
  slideEnd: number;   // 1-indexed, inclusive
}

export function chunkText(text: string): TextChunk[] {
  const slides = text.split(SLIDE_SEPARATOR).filter(s => s.trim().length > 20);

  if (slides.length === 0) return [];

  const chunks: TextChunk[] = [];
  let current = '';
  let chunkStartSlide = 1;
  let currentSlideIdx = 1;

  for (const slide of slides) {
    if (current.length + slide.length + SLIDE_SEPARATOR.length > CHUNK_SIZE && current.length > 0) {
      chunks.push({ text: current.trim(), slideStart: chunkStartSlide, slideEnd: currentSlideIdx - 1 });
      current = slide;
      chunkStartSlide = currentSlideIdx;
    } else {
      current = current ? current + SLIDE_SEPARATOR + slide : slide;
    }
    currentSlideIdx++;
  }

  if (current.trim().length > 20) {
    chunks.push({ text: current.trim(), slideStart: chunkStartSlide, slideEnd: currentSlideIdx - 1 });
  }

  // Fallback: no slide separators — split by character count
  if (chunks.length === 0) {
    const approxCharsPerPage = Math.ceil(text.length / Math.max(1, slides.length));
    let pageOffset = 1;
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunk = text.slice(i, i + CHUNK_SIZE).trim();
      if (chunk.length > 20) {
        const start = pageOffset;
        pageOffset += Math.max(1, Math.round(chunk.length / approxCharsPerPage));
        chunks.push({ text: chunk, slideStart: start, slideEnd: pageOffset - 1 });
      }
    }
  }

  return chunks;
}
