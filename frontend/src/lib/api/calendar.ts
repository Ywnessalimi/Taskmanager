import { currentJalaliDate } from "@/lib/jalali"

/**
 * «امروز» از تقویم فارسی دستگاه می‌آید تا تاریخ‌های ثبت‌شده‌ی جلالی با تاریخ جاری سنجیده شوند.
 */
export async function getToday(): Promise<string> {
  return currentJalaliDate()
}
