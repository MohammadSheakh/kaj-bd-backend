import { Translate } from '@google-cloud/translate';


const translate = new Translate();

// Helper: translate text to target language
export async function translateTextToTargetLang(text: string, targetLang: 'en' | 'bn'): Promise<string> {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // fallback to original
  }
}