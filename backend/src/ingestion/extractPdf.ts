import fs from 'fs';

export interface ExtractionResult {
  text: string;
  pageCount: number;
  isImageBased: boolean;
}

export async function extractPdf(filePath: string): Promise<ExtractionResult> {
  // Dynamic require to avoid ESM issues with pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  const text = data.text.trim();
  // If less than 50 chars per page on average, likely image-based
  const isImageBased = text.length < data.numpages * 50;

  return {
    text,
    pageCount: data.numpages,
    isImageBased,
  };
}
