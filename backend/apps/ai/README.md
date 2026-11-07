# دستیار اجرایی
هماهنگ‌کننده در همین بک‌اند Node اجرا می‌شود. مدل دسترسی مستقیم به دیتابیس ندارد؛ registry ابزارها ورودی را با Zod اعتبارسنجی و agent-service آن را به سرویس‌های دامنه متصل می‌کند.
- ai-service.js: حداکثر شش دور مدل، شش ابزار در هر پاسخ، timeout هر درخواست ۴۵ ثانیه. AI_TOOL_MODE=json پیش‌فرض سازگار با اتصال متنی؛ native برای function calling ارائه‌دهنده‌ای که آن را پشتیبانی می‌کند.
- assistant-store.js: پیش‌نمایش خصوصی ۳۰دقیقه‌ای، تأیید مجموعهٔ انتخابی در یک تراکنش و پاسخ یکسان برای retry. مدل ابزار تأیید ندارد. ویرایش روی دادهٔ تغییرکرده رد می‌شود.
- agent-service.js: پروژه/اعضا/مهارت، تسک و زیرتسک، ویرایش/واگذاری، پروژه، تیکت، کارتابل، اعلان و کامنت تیکت. مجوزها در هر عملیات از بک‌اند جاری بررسی می‌شوند.
- report-export.js و pdf-text.js: snapshot خصوصی ۲۴ساعته، XLSX/CSV/DOCX/PDF با عنوان، ستون، ترتیب و گروه‌بندی. سقف گزارش ۱۰۰۰ تسک و PDF دویست تسک است. PDF از فونت TTF همراه و bidi-js استفاده می‌کند. CSV فرمول‌های ورودی را خنثی می‌کند.
وابستگی‌ها: سرویس tasks، repositories سازمان/تیکت/اعلان، dashboards، SQLite برای state اجرایی؛ ExcelJS، docx، PDFKit، bidi-js، Zod. مصرف‌کنندگان: server.js، پنل features/ai و integrations برای سرویس تسک مشترک.
## قرارداد HTTP
همهٔ مسیرها زیر /api/v1 و با نشست کاربر هستند:
- POST /assistant/chat با messages و locale → reply، widgets، usedSkills
- GET /assistant/skills؛ POST /assistant/tools/:name با ورودی schema
- POST /assistant/previews/:id/confirm با selectedKeys؛ POST /assistant/previews/:id/cancel
- POST /assistant/reports/:id/export با format، title، columns، sortBy، groupBy، locale → فایل
UI فقط شناسه و کلید انتخاب را تأیید می‌کند؛ payload قابل‌اجرا از سرور خوانده می‌شود.
## اجرا و محدودیت
npm ci را در backend اجرا و AI_API_KEY، AI_API_BASE_URL و AI_MODEL را در محیط سرویس تنظیم کنید. کلید وارد فرانت یا Git نمی‌شود. تاریخچهٔ گفتگو فقط در state پنجره است؛ پیش‌نویس، گزارش و ممیزی در SQLite هستند. متن گفتگو و دادهٔ لازمِ ابزارها به ارائه‌دهندهٔ مدل ارسال می‌شوند.
گزارش وضعیت فعلی تسک‌های اصلی است؛ بازهٔ زمانی روی زمان ساخت اعمال می‌شود، نه تاریخ تکمیل. زمان تسک مشترک است. کامنت‌ها فقط کامنت پایدار تیکت را پوشش می‌دهند. دسترسی پروژه همان عضویت سازمانی فعلی است؛ اعطای نقش مستقل پروژه، حذف گروهی، حافظهٔ پایدار گفتگو و قالب دلخواه آپلودی هنوز پیاده نشده‌اند.
