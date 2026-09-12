/**
 * کمک‌تابع‌های تاریخ جلالی — عمداً ساده و تقریبی.
 *
 * تاریخ‌ها در لایه‌ی داده به شکل رشته‌ی "YYYY/MM/DD" با رقم لاتین نگه‌داری می‌شوند
 * (رجوع به docs/FRONTEND.md بخش ۸). این ماژول تقویم واقعی جلالی را پیاده نمی‌کند:
 * سال کبیسه در نظر گرفته نمی‌شود (اسفند همیشه ۲۹ روز) و روزِ هفته‌ی واقعی محاسبه نمی‌شود.
 * برای ترتیب، فاصله و چیدمان نسبی کافی است؛ برای محاسبه‌ی تقویمی دقیق نه.
 */

export type JalaliDate = { year: number; month: number; day: number }

export const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
]

export const WEEKDAY_NAMES = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]

/** طول ماه‌های جلالی: ۶ ماه اول ۳۱، ۵ ماه بعد ۳۰، اسفند ۲۹ (بدون کبیسه). جمع = ۳۶۵ روز. */
export function daysInMonth(month: number): number {
  if (month <= 6) return 31
  if (month <= 11) return 30
  return 29
}

export function parseDate(date: string): JalaliDate | null {
  const [year, month, day] = date.split("/").map(Number)
  if ([year, month, day].some((n) => Number.isNaN(n))) return null
  if (month < 1 || month > 12) return null
  return { year, month, day }
}

/** خروجی همیشه با رقم لاتین و صفرِ ابتدایی — همان قالبی که در لایه‌ی داده ذخیره می‌شود. */
export function formatDate({ year, month, day }: JalaliDate): string {
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`
}

/** شماره‌ی مطلق روز (هر سال ۳۶۵ روز) — پایه‌ی همه‌ی مقایسه‌ها و محاسبه‌های فاصله. */
export function toOrdinal({ year, month, day }: JalaliDate): number {
  let days = year * 365 + day
  for (let m = 1; m < month; m++) days += daysInMonth(m)
  return days
}

export function fromOrdinal(ordinal: number): JalaliDate {
  const year = Math.floor((ordinal - 1) / 365)
  let remaining = ordinal - year * 365
  let month = 1
  while (remaining > daysInMonth(month)) {
    remaining -= daysInMonth(month)
    month++
  }
  return { year, month, day: remaining }
}

export function addDays(date: JalaliDate, days: number): JalaliDate {
  return fromOrdinal(toOrdinal(date) + days)
}

/**
 * ایندکس روز هفته (۰ = شنبه). چون تقویم این ماژول واقعی نیست، این مقدار **قراردادی** است
 * و فقط برای گروه‌بندی هفتگی یکدست استفاده می‌شود، نه برای گفتن روزِ هفته‌ی واقعی یک تاریخ.
 */
export function weekdayIndex(date: JalaliDate): number {
  return ((toOrdinal(date) % 7) + 7) % 7
}

/** شنبه‌ی همان هفته (طبق قرارداد بالا). */
export function startOfWeek(date: JalaliDate): JalaliDate {
  return addDays(date, -weekdayIndex(date))
}

/** تبدیل "YYYY/MM/DD" به عددی که ترتیب تاریخ‌ها را حفظ می‌کند. */
export function toDayIndex(date: string): number | null {
  const parsed = parseDate(date)
  return parsed ? toOrdinal(parsed) : null
}

/** آیا `date` قبل از `reference` است؟ اگر هرکدام قابل تجزیه نبود، false. */
export function isBefore(date: string, reference: string): boolean {
  const a = toDayIndex(date)
  const b = toDayIndex(reference)
  return a !== null && b !== null && a < b
}
