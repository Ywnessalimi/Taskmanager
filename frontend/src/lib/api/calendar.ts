import { MOCK_TODAY } from "./mock-data"

/**
 * «امروز» از لایه‌ی داده می‌آید، نه از `new Date()` — چون تاریخ‌های پروژه جلالی و دستی‌اند
 * و مقایسه با تاریخ واقعی سیستم نتیجه‌ی بی‌معنا می‌دهد (رجوع به docs/FRONTEND.md بخش ۸).
 * وقتی بک‌اند آماده شد، اینجا تاریخ واقعی سرور برگردانده می‌شود.
 */
export async function getToday(): Promise<string> {
  return MOCK_TODAY
}
