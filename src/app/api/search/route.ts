import { source } from "@/lib/source";
import { i18n } from "@/lib/i18n";
import { createFromSource } from "fumadocs-core/search/server";

const searchLanguage = "english";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: searchLanguage,
  localeMap: Object.fromEntries(
    i18n.languages.map((locale) => [locale, searchLanguage]),
  ),
});
