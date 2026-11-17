// One-off script that produced the first version of data/. Kept for reference:
// re-running it overwrites hand edits, so after the first release edit data/ directly
// and use `npm run check` to compare against the sources.
//
// Sources:
// - States: Wikidata (CC0), current items with an ISO 3166-2 code (P300).
// - Cross-check and gap filling: @countrystatecity/countries-browser.
//   Where the two disagree, the library's list is kept so no country loses entries
//   without review; `npm run check` reports those countries.
// - Country names: Unicode CLDR via Intl.DisplayNames.
//
// Usage: node scripts/bootstrap.mjs <wikidata-results.json> <curated-names.json>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libData = join(root, 'node_modules/@countrystatecity/countries-browser/dist/data');

export const LANGUAGES = ['en', 'ja', 'ko', 'vi', 'id', 'zh-Hans', 'zh-Hant'];
// Wikidata label languages to try, in order, for each of our languages
const WIKIDATA_LANGS = {
  en: ['en'],
  ja: ['ja'],
  ko: ['ko'],
  vi: ['vi'],
  id: ['id'],
  'zh-Hans': ['zh-hans', 'zh-cn', 'zh-sg', 'zh'],
  'zh-Hant': ['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo']
};
// The country's own language among ours; the library's `native` names are consistent within a country
const OWN_LANGUAGE = { VN: 'vi', ID: 'id' };
const SHORT_COUNTRY_NAMES = ['HK', 'MO'];

const [wikidataFile, curatedFile] = process.argv.slice(2);
const wikidataRows = JSON.parse(readFileSync(wikidataFile, 'utf8')).results.bindings;
const curated = JSON.parse(readFileSync(curatedFile, 'utf8'));

// Wikidata: labels per ISO 3166-2 code, current items only
const items = new Map();
for (const row of wikidataRows) {
  const id = row.s.value;
  const item = items.get(id) ?? { codes: new Set(), ended: false, labels: {} };
  item.codes.add(row.code.value);
  if (row.end) item.ended = true;
  if (row.label) item.labels[row.lang.value] = row.label.value;
  items.set(id, item);
}
const wikidata = new Map();
for (const item of items.values()) {
  if (item.ended) continue;
  for (const code of item.codes) if (code.includes('-')) wikidata.set(code, item.labels);
}

const libraryStates = cc =>
  JSON.parse(readFileSync(join(libData, 'states', `${cc}.json`), 'utf8'))
    .filter(s => s.type !== 'geographical unit');

const pickLabel = (labels, lang) => WIKIDATA_LANGS[lang].map(l => labels?.[l]).find(Boolean);

const countries = JSON.parse(readFileSync(join(libData, 'countries.json'), 'utf8'))
  .map(c => c.iso2)
  .sort();

mkdirSync(join(root, 'data/states'), { recursive: true });

const countryRecords = countries.map(code => {
  const names = {};
  for (const lang of LANGUAGES) {
    const style = SHORT_COUNTRY_NAMES.includes(code) ? 'short' : 'long';
    names[lang] = new Intl.DisplayNames([lang], { type: 'region', style }).of(code);
  }
  return { code, name: names.en, names };
});
writeFileSync(join(root, 'data/countries.json'), JSON.stringify(countryRecords, null, 2) + '\n');

for (const cc of countries) {
  const fromLibrary = libraryStates(cc);
  const states = fromLibrary.map(s => {
    const iso = s.iso3166_2 || `${cc}-${s.iso2}`;
    const labels = wikidata.get(iso);
    const names = {};
    for (const lang of LANGUAGES) {
      const name = curated[lang]?.[cc]?.[s.iso2] ??
        (OWN_LANGUAGE[cc] === lang ? s.native : undefined) ??
        pickLabel(labels, lang);
      if (name) names[lang] = name;
    }
    const name = names.en ?? s.name;
    delete names.en;
    return { code: s.iso2, name, names };
  });
  states.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  writeFileSync(join(root, 'data/states', `${cc}.json`), JSON.stringify(states, null, 2) + '\n');
}

console.log(`Wrote ${countryRecords.length} countries`);
