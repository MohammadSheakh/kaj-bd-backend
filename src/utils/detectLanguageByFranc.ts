//  import franc from 'franc-min';
// const franc = require('franc-min');

// async function getFranc() {
//   const francModule = (await import('franc-min')).default;
//   return francModule.default; // franc-min exports as default
// }

import translate from '@google-cloud/translate';
const client = new translate.v2.Translate();

export async function detectLanguage(text: string): Promise<'en' | 'bn' | 'unknown'> {
  // const franc = await getFranc();
  // const code = franc(text);

  const [detection] = await client.detect(text);

  return detection.language === 'bn' ? 'bn' : 'en';

  // if (code === 'eng') return 'en';
  // if (code === 'ben') return 'bn';
  // return 'unknown';
}