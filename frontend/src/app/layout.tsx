import type { Metadata } from "next";
import { DirectionProvider } from "@/components/ui/direction";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quire",
  description: "نرم‌افزار مدیریت تسک",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DirectionProvider direction="rtl">{children}</DirectionProvider>
      </body>
    </html>
  );
}
