export interface WordDetail {
  word: string;
  pronunciation?: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
  origin?: string;
  etymology?: string;
}
