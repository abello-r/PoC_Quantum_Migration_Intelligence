import React from "react";
import { en } from "./en";
import { es } from "./es";

export const dictionaries = {
  en,
  es
};

export type Locale = keyof typeof dictionaries;
type Dictionary = WidenStrings<typeof en>;
type TranslationKey = LeafKey<Dictionary>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<Locale>("en");

  const t = React.useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => {
      const template = readTranslation(dictionaries[locale], key);

      return interpolate(template, values);
    },
    [locale]
  );

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}

function readTranslation(dictionary: Dictionary, key: string) {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, dictionary);

  return typeof value === "string" ? value : key;
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template
  );
}

type WidenStrings<T> = {
  -readonly [K in keyof T]: T[K] extends string ? string : T[K] extends Record<string, unknown> ? WidenStrings<T[K]> : T[K];
};

type LeafKey<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? LeafKey<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];
