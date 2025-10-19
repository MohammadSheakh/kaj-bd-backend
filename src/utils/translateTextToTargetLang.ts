import  translate  from '@google-cloud/translate';
// const { translate } = require('@google-cloud/translate');

const translateClient = new translate.v2.Translate(); //new Translate();

// Helper: translate text to target language
export async function translateTextToTargetLang(text: string, targetLang: 'en' | 'bn'): Promise<string> {
  try {
    const [translation] = await translateClient.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // fallback to original
  }
}