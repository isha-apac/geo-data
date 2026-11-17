# geo-data

Countries and their states/provinces, with translated names, for forms across Isha APAC apps.
The JSON in `data/` is the source of truth: edit it directly.

## Data

```
data/
  countries.json      all 250 countries
  states/VN.json      one file per country ([] when a country has no states)
index.d.ts            Country and State types
```

```json
// data/states/VN.json
[
  {
    "code": "44",
    "name": "An Giang",
    "names": { "vi": "An Giang", "ja": "アンザン省", "ko": "안장성", "zh-Hans": "安江省" }
  }
]
```

- `code` is the ISO 3166-2 code without the country prefix (`VN-44` → `44`). Apps store this
  code, so **don't change an existing code** without checking the apps that use it.
- `name` is the English name.
- `names` has translations for `ja`, `ko`, `vi`, `id`, `zh-Hans` and `zh-Hant`. Missing languages
  fall back to `name` (apps may try `zh-Hans` before English for `zh-Hant`).

## Using it in an app

Install a tagged release straight from GitHub (no npm registry needed):

```json
"dependencies": {
  "@isha-apac/geo-data": "github:isha-apac/geo-data#v1.1.0"
}
```

Then either import the JSON, or copy `node_modules/@isha-apac/geo-data/data` into your build
and fetch only the country you need (iso-apac does this; see its `angular.json`).

## Editing

1. Edit the JSON in `data/` and open a PR.
2. CI runs `npm run check`. It fails on invalid data (duplicate codes, empty names, a country
   whose states were pasted from another, …) and lists countries that differ from
   [@countrystatecity/countries-browser](https://www.npmjs.com/package/@countrystatecity/countries-browser).
3. After merging, add the release to [CHANGELOG.md](CHANGELOG.md), tag it (`v1.2.0`) and bump the
   tag in each app. Call out any changed codes: apps store them.

To compare with Wikidata as well:

```
npm install
npm run check:wikidata -- --verbose
```

Differences are for review only. Either source can be wrong, so nothing is applied
automatically.

## Where the data came from

- **States**: [Wikidata](https://www.wikidata.org) (CC0): current items with an ISO 3166-2
  code. Cross-checked against @countrystatecity/countries-browser; where the two disagreed, the
  library's list was kept for the first release so no country lost entries without review.
- **State names**: Wikidata labels, plus reviewed names for Japan, Korea, China, Taiwan and
  Vietnam. Vietnamese names for Vietnam and Indonesian names for Indonesia follow each country's
  own naming.
- **Country names**: [Unicode CLDR](https://cldr.unicode.org), via `Intl.DisplayNames`.

`scripts/bootstrap.mjs` produced the first version and is kept for reference. Don't re-run it:
it would overwrite edits.

Changes made by hand in the first release:

- Philippines: removed the made-up "Special Geographic Area" (`19999`); renamed `14` to
  Bangsamoro Autonomous Region in Muslim Mindanao (ARMM was replaced in 2019).
- Hong Kong: no states (it has no ISO 3166-2 subdivisions).
- Vietnam: fixed Japanese, Korean and Chinese names that called provinces cities.

## Open review items

Found by `npm run check:wikidata`:

- **Korea**: `12` (Jeonnam-Gwangju Integrated Special City) has no Wikidata entry yet; confirm
  the merger is in effect.
- About 60 other countries, mostly territories and European countries, differ from Wikidata in
  which subdivision level is listed.
- Indonesian names use administrative prefixes ("Provinsi …", "Distrik …"), which is normal
  Indonesian usage. They were made consistent for Vietnam only.

## License

The data is [CC0 1.0](LICENSE). Wikidata content is CC0; country names from Unicode CLDR are under the
[Unicode License v3](LICENSE-UNICODE).
