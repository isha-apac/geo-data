// Validates data/ and compares it with other sources.
//
//   npm run check              validate, and compare with @countrystatecity/countries-browser
//   npm run check:wikidata     also compare with Wikidata (needs network)
//   add --verbose              list every difference, not just the countries
//
// Validation problems fail the run. Differences from other sources are reported for review
// and never change data/: either source can be wrong, so a person decides.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGUAGES = ['ja', 'ko', 'vi', 'id', 'zh-Hans', 'zh-Hant'];
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');

const errors = [];
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'));

// --- Validation ---

const countries = readJson('data/countries.json');
const countryCodes = new Set();
for (const country of countries) {
  if (!/^[A-Z]{2}$/.test(country.code)) errors.push(`countries.json: bad code ${JSON.stringify(country.code)}`);
  if (countryCodes.has(country.code)) errors.push(`countries.json: duplicate code ${country.code}`);
  countryCodes.add(country.code);
  if (!country.name?.trim()) errors.push(`countries.json: ${country.code} has no name`);
  for (const [lang, name] of Object.entries(country.names ?? {})) {
    if (lang !== 'en' && !LANGUAGES.includes(lang)) errors.push(`countries.json: ${country.code} has unknown language ${lang}`);
    if (!name?.trim()) errors.push(`countries.json: ${country.code} has an empty ${lang} name`);
  }
}

const states = {};
for (const file of readdirSync(join(root, 'data/states'))) {
  const cc = file.replace(/\.json$/, '');
  if (!countryCodes.has(cc)) errors.push(`states/${file}: no such country in countries.json`);
  states[cc] = readJson(`data/states/${file}`);
}
for (const cc of countryCodes) {
  if (!states[cc]) errors.push(`states/${cc}.json is missing (use [] for a country without states)`);
}

for (const [cc, list] of Object.entries(states)) {
  const codes = new Set();
  for (const state of list) {
    const where = `states/${cc}.json ${state.code}`;
    if (!state.code || !/^[A-Z0-9]{1,5}$/.test(state.code)) errors.push(`${where}: bad code`);
    if (codes.has(state.code)) errors.push(`${where}: duplicate code`);
    codes.add(state.code);
    if (!state.name?.trim()) errors.push(`${where}: no name`);
    for (const [lang, name] of Object.entries(state.names ?? {})) {
      if (!LANGUAGES.includes(lang)) errors.push(`${where}: unknown language ${lang} (English goes in "name")`);
      if (!name?.trim()) errors.push(`${where}: empty ${lang} name`);
    }
  }
}

// One country's list pasted into another (this happened in the old CMS: VN was a copy of ID)
const fingerprints = new Map();
for (const [cc, list] of Object.entries(states)) {
  if (list.length < 3) continue;
  const key = list.map(s => s.name).sort().join('|');
  if (fingerprints.has(key)) errors.push(`states/${cc}.json has the same states as ${fingerprints.get(key)}.json`);
  else fingerprints.set(key, cc);
}

// --- Comparison with other sources ---

function compare(label, other) {
  const differing = [];
  for (const cc of [...countryCodes].sort()) {
    const ours = new Set((states[cc] ?? []).map(s => s.code));
    const theirs = other.get(cc) ?? new Set();
    const missing = [...theirs].filter(c => !ours.has(c));
    const extra = [...ours].filter(c => !theirs.has(c));
    if (missing.length || extra.length) differing.push({ cc, missing, extra });
  }
  console.log(`\n${label}: ${differing.length} countries differ`);
  for (const { cc, missing, extra } of differing) {
    if (verbose) {
      console.log(`  ${cc}: only in ${label}: ${missing.join(', ') || '-'} | only here: ${extra.join(', ') || '-'}`);
    }
  }
  if (!verbose && differing.length) console.log(`  ${differing.map(d => d.cc).join(' ')}  (--verbose for details)`);
}

const libData = join(root, 'node_modules/@countrystatecity/countries-browser/dist/data/states');
if (existsSync(libData)) {
  const library = new Map();
  for (const file of readdirSync(libData)) {
    const list = JSON.parse(readFileSync(join(libData, file), 'utf8'));
    library.set(file.replace(/\.json$/, ''), new Set(list.filter(s => s.type !== 'geographical unit').map(s => s.iso2)));
  }
  compare('countries-browser', library);
} else {
  console.log('\nSkipping library comparison: run npm install first');
}

if (args.includes('--wikidata')) {
  const query = `SELECT ?code WHERE {
    ?s p:P300 ?st . ?st ps:P300 ?code ; wikibase:rank ?rank .
    FILTER(?rank != wikibase:DeprecatedRank)
    FILTER NOT EXISTS { ?st pq:P582 [] }
    FILTER NOT EXISTS { ?s wdt:P576 [] }
  }`;
  const response = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'isha-apac-geo-data (https://github.com/isha-apac/geo-data)' }
  });
  if (!response.ok) throw new Error(`Wikidata query failed: ${response.status}`);
  const wikidata = new Map();
  for (const row of (await response.json()).results.bindings) {
    const [cc, ...rest] = row.code.value.split('-');
    if (!rest.length) continue;
    if (!wikidata.has(cc)) wikidata.set(cc, new Set());
    wikidata.get(cc).add(rest.join('-'));
  }
  compare('Wikidata', wikidata);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}
console.log(`\nData is valid: ${countries.length} countries, ${Object.values(states).reduce((n, l) => n + l.length, 0)} states`);
