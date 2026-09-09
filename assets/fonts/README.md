# Fonts Directory

این پوشه برای ذخیره فایل‌های فونت استفاده می‌شود.

## فرمت‌های پشتیبانی شده

- `.woff2` - فرمت مدرن و بهینه برای وب (پیشنهادی)
- `.woff` - فرمت قدیمی‌تر وب
- `.ttf` - TrueType Font
- `.otf` - OpenType Font

## نحوه استفاده

1. فایل فونت را در این پوشه قرار دهید
2. فونت را در CSS با `@font-face` تعریف کنید
3. از فونت در استایل‌های خود استفاده کنید

## مثال

```css
@font-face {
  font-family: 'Vazir';
  src: url('fonts/Vazir-Regular.woff2') format('woff2'),
       url('fonts/Vazir-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}