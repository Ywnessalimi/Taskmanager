import { cookies } from "next/headers"
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./dictionary"

/** فقط در Server Component ها استفاده شود (به `next/headers` وابسته است). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return value === "en" ? "en" : DEFAULT_LOCALE
}
