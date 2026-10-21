# lib

این پوشه قراردادهای داده، ترجمه و ابزارهای مشترک سمت کلاینت را نگه می‌دارد.

`workspace-toast.ts` یک Toast را با شناسهٔ نمایشی Task/Ticket از راه رویداد سراسری نشان می‌دهد. فرم‌های workspace بعد از ذخیره یا حذف آن را صدا می‌زنند و `components/ui/workspace-toast.tsx` نمایش را در layout مدیریت می‌کند.

وابستگی‌ها: مرورگر، `lib/i18n/dictionary.ts` برای متن پیام‌ها و `components/ui/workspace-toast.tsx` برای رندر. مصرف‌کننده‌ها: فرم ویرایش Task و `features/tickets/TicketWorkspace`.
