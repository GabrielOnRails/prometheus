/**
 * Divide texto em chunks para processamento
 */
export class TextSplitter {
  constructor(
    private chunkSize = 1000,
    private chunkOverlap = 200
  ) {}

  /**
   * Divide texto em chunks
   */
  split(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + this.chunkSize;
      const chunk = text.slice(start, end);
      chunks.push(chunk.trim());

      start = end - this.chunkOverlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Divide por parágrafos
   */
  splitByParagraph(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Divide por sentenças
   */
  splitBySentence(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Divide respeitando tokens (aproximado)
   */
  splitByTokens(text: string, maxTokens = 500): string[] {
    // Aproximação: ~4 caracteres por token
    const maxChars = maxTokens * 4;
    const splitter = new TextSplitter(maxChars, Math.floor(maxChars * 0.2));
    return splitter.split(text);
  }
}
