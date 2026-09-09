# frontend/

اپ Next.js پروژه (فاز اول: فقط فرانت‌اند، بدون بک‌اند واقعی).

پیش از تغییر کد، این اسناد را بخوان:

- [../docs/PRODUCT_OVERVIEW.md](../docs/PRODUCT_OVERVIEW.md)
- [../docs/DESIGN.md](../docs/DESIGN.md)
- [../docs/FRONTEND.md](../docs/FRONTEND.md) — به‌خصوص بخش «وضعیت فعلی پیاده‌سازی» که فهرست واقعی کامپوننت‌ها و مسیرهای ساخته‌شده را نگه می‌دارد
- [../AGENTS.md](../AGENTS.md) — قانون «هر ماژول = پوشه + README.md»

## اجرا

```bash
npm run dev
```

یا از داخل ریشه‌ی پروژه، با پیکربندی `.claude/launch.json` (سرور `quire-frontend`).

## نکات فنی مهم

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4.
- shadcn/ui روی Base UI، پریست Nova.
- زبان/جهت پیش‌فرض اپ: فارسی/RTL (`lang="fa" dir="rtl"`، فونت محلی IRANSansX).
- آیکون‌ها از فونت RemixIcon (`<RemixIcon name="..." />`) — قبل از استفاده از یک اسم آیکون، شکل واقعی‌اش را در `assets/Icons/remixicon.css` چک کنید.
- توکن‌های رنگی از `src/styles/colors.css` می‌آیند؛ رنگ Hardcode ممنوع است — جزئیات در [../docs/FRONTEND.md](../docs/FRONTEND.md#۵-لایهی-رنگی-color-tokens).

هر فیچر جدید (مثلاً `features/tasks/`) باید طبق ساختار [../docs/FRONTEND.md](../docs/FRONTEND.md#۴-نگاشت-مفاهیم-محصول-به-کامپوننتها) ساخته شود و README.md مخصوص به خودش را داشته باشد.
