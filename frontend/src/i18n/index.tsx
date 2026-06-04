import { en } from "./en";

type Dictionary = WidenStrings<typeof en>;
type TranslationKey = LeafKey<Dictionary>;

export function t(key: TranslationKey, values?: Record<string, string | number>) {
  const template = readTranslation(en, key);

  return interpolate(template, values);
}

export type Translate = typeof t;

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
