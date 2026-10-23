import { isAppLanguage } from '@/src/i18n/languages';

const YANDEX_MAPS_TERMS_BASE = 'https://yandex.ru/legal/maps_api';

/** Язык документа совпадает с языком приложения: ru или en. */
export function yandexMapsTermsUrl(language: string): string {
  const code = language.split('-')[0] ?? '';
  const locale = isAppLanguage(code) ? code : 'ru';

  return `${YANDEX_MAPS_TERMS_BASE}/${locale}/`;
}
