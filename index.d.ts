/** Languages that have translated names. English is always in `name`. */
export type Language = 'ja' | 'ko' | 'vi' | 'id' | 'zh-Hans' | 'zh-Hant';

/** An entry in data/countries.json */
export interface Country {
  /** ISO 3166-1 alpha-2 code, e.g. "VN" */
  code: string;
  /** English name */
  name: string;
  /** Names from Unicode CLDR, including English */
  names: Partial<Record<Language | 'en', string>>;
}

/** An entry in data/states/<country code>.json */
export interface State {
  /** Subdivision code without the country prefix, e.g. "44" for VN-44 */
  code: string;
  /** English name */
  name: string;
  /** Translated names. A missing language falls back to `name`. */
  names: Partial<Record<Language, string>>;
}
