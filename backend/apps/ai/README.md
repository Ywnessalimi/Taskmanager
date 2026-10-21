# AI service

این ماژول گفت‌وگوی دستیار را از بک‌اند به API سازگار با OpenAI در Nokod و مدل `Qwen38` می‌فرستد. کلید سرویس فقط در تنظیمات محیط Node نگه‌داری می‌شود؛ تاریخچهٔ گفت‌وگو در این فاز ذخیره نمی‌شود.

وابستگی‌ها: `server.js` برای احراز نشست، اعتبارسنجی پیام‌ها و مسیر HTTP؛ تنظیمات `AI_API_BASE_URL`، `AI_API_KEY` و `AI_MODEL` برای اتصال ارائه‌دهنده.

مصرف‌کننده: `POST /api/v1/assistant/chat` که رابط `frontend/src/features/ai/ai-assistant-dialog.tsx` از طریق لایهٔ `frontend/src/lib/api/assistant.ts` فراخوانی می‌کند. این ماژول هیچ ابزار تغییردهندهٔ داده را اجرا نمی‌کند.
