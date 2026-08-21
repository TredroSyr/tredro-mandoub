export const countryNamesAr: Record<string, string> = {
  sy: "سورية",
};

export const preferredCountries = [
  "sy",
  "lb",
  "jo",
  "iq",
  "sa",
  "ae",
  "eg",
  "qa",
  "kw",
  "tr",
];

export const getCountryNameAr = (iso2: string, fallback: string) =>
  countryNamesAr[iso2] ?? fallback;
