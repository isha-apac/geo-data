# Changelog

## v1.1.0

**Changed codes.** Apps that store state codes keep the old values for earlier records:

| Country | Old | New | State |
|---|---|---|---|
| IN | `TG` | `TS` | Telangana |
| IN | `CT` | `CG` | Chhattisgarh |
| IN | `OR` | `OD` | Odisha |
| MN | `001` | `1` | Ulaanbaatar |
| BQ | `BQ1` | `BO` | Bonaire |
| BQ | `BQ2` | `SA` | Saba |
| BQ | `BQ3` | `SE` | Sint Eustatius |

These now match ISO 3166-2.

**Names**

- Vietnam: Japanese, Korean and Chinese names of the six centrally-run cities consistently end
  in 市/시; Đồng Nai is a province (同奈省); Hưng Yên's Simplified Chinese name uses simplified
  characters (兴安省); Traditional Chinese added for the 21 provinces that had none; Indonesian
  names consistently use "Provinsi …" / "Kota …".
- Bahrain: fixed a vandalised Indonesian name for Muharraq.
- Mongolia: "Province of Umnugobi" is now "Ömnögovi Province".

## v1.0.0

First release.
