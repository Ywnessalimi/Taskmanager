import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * خروجی standalone: بیلد یک پوشه‌ی .next/standalone می‌سازد که سرور Node و فقط
   * وابستگی‌های لازم را در خودش دارد. برای دیپلوی روی سرور کوچک (۲ گیگ رم) لازم است،
   * چون آنجا نه بیلد گرفته می‌شود و نه npm install — فقط همین پوشه اجرا می‌شود.
   * رجوع به docs/DEPLOYMENT.md
   */
  output: "standalone",
};

export default nextConfig;
