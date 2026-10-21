import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * خروجی standalone: بیلد یک پوشه‌ی .next/standalone می‌سازد که سرور Node و فقط
   * وابستگی‌های لازم را در خودش دارد. برای دیپلوی روی سرور کوچک (۲ گیگ رم) لازم است،
   * چون آنجا نه بیلد گرفته می‌شود و نه npm install — فقط همین پوشه اجرا می‌شود.
   * رجوع به docs/DEPLOYMENT.md
   */
  output: "standalone",
  // The local browser uses 127.0.0.1 while Next starts on localhost.
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    const backendOrigin = (process.env.QUIRE_API_ORIGIN ?? "http://127.0.0.1:4000").replace(/\/$/, "")
    return [{ source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` }]
  },
};

export default nextConfig;
