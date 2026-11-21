import type { Language } from "@/gql/graphql";

// The five film groups, in the order the wall shows them. `slug` is what goes in the address (?lang=telugu).
export const LANGUAGES: { value: Language; slug: string; label: string }[] = [
  { value: "ENGLISH", slug: "english", label: "English" },
  { value: "UK", slug: "uk", label: "UK" },
  { value: "HINDI", slug: "hindi", label: "Hindi" },
  { value: "TELUGU", slug: "telugu", label: "Telugu" },
  { value: "TAMIL", slug: "tamil", label: "Tamil" },
];

export const languageLabel = (value: Language) => LANGUAGES.find((l) => l.value === value)?.label ?? value;
export const languageFromSlug = (slug: string | null) => LANGUAGES.find((l) => l.slug === slug)?.value;
