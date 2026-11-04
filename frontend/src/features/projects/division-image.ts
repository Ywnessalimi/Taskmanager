const divisionImages = [
  { terms: ["product", "محصول"], image: "product" },
  { terms: ["operations", "operation", "عملیات", "عملیاتی"], image: "operations" },
  { terms: ["development", "engineering", "توسعه", "مهندسی", "فنی"], image: "development" },
  { terms: ["marketing", "بازاریابی"], image: "marketing" },
] as const

/** Returns a bundled thumbnail matching a known division name, with a generic fallback. */
export function divisionImageForName(name: string) {
  const normalized = name.trim().toLocaleLowerCase()
  const match = divisionImages.find(({ terms }) => terms.some((term) => normalized.includes(term)))
  return `/images/divisions/${match?.image ?? "general"}.jpg`
}
