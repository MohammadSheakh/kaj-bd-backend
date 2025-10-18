import franc from 'franc-min';

export function detectLanguage(text: string): 'en' | 'bn' | 'unknown' {
  const code = franc(text);
  if (code === 'eng') return 'en';
  if (code === 'ben') return 'bn';
  return 'unknown';
}